import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { ArrowLeft, Info, Music2, Disc3 } from 'lucide-react';
import { EditorCore } from '../../editor/components/EditorCore';
import { CollapsibleReadingDock } from '../../editor/components/CollapsibleReadingDock';
import { transposeEditorChords } from '../../editor/lib/transposeUtils';
import { StudioSongRecord, StudioProjectRecord, StudioLyricVersionRecord } from '../types/studioDatabase';
import { getLyricVersionsBySongId } from '../lib/musicStudioStorage';

interface SongDiscographyReaderProps {
  song: StudioSongRecord;
  projects?: StudioProjectRecord[];
  onBack: () => void;
  onOpenOverview: () => void;
  onUpdateSong?: (patch: Partial<StudioSongRecord>) => void;
}

export const SongDiscographyReader: React.FC<SongDiscographyReaderProps> = ({
  song,
  projects = [],
  onBack,
  onOpenOverview,
  onUpdateSong,
}) => {
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
  const editorRef = useRef<any>(null);

  // Lyric versions resolution (Automatically select Final, Focused, or latest)
  const [activeVersion, setActiveVersion] = useState<StudioLyricVersionRecord | null>(null);
  const [lyricsContent, setLyricsContent] = useState<string>(song.contentLyrics || '');
  const [isLoaded, setIsLoaded] = useState(false);

  // Transpose state for CollapsibleReadingDock
  const [transposeOffset, setTransposeOffset] = useState<number>(0);

  const parentProject = projects.find((p) => p.id === song.projectId);

  // Load lyric versions and pick the final version
  useEffect(() => {
    let isCancelled = false;

    const loadLyrics = async () => {
      try {
        const versions = await getLyricVersionsBySongId(song.id);
        if (isCancelled) return;

        // Priority: 1. isFinal -> 2. isFocused -> 3. Latest created -> 4. song.contentLyrics
        const finalVer = versions.find((v) => v.isFinal)
          || versions.find((v) => v.isFocused)
          || versions[0]
          || null;

        setActiveVersion(finalVer);
        setLyricsContent(finalVer ? finalVer.content : (song.contentLyrics || ''));
      } catch (err) {
        console.error('Failed to load final lyric version:', err);
        setLyricsContent(song.contentLyrics || '');
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    };

    loadLyrics();

    return () => {
      isCancelled = true;
    };
  }, [song.id, song.contentLyrics]);

  // Transposition handlers
  const handleTranspose = useCallback((delta: number) => {
    if (!tiptapEditor || tiptapEditor.isDestroyed) return;
    transposeEditorChords(tiptapEditor, delta);
    setTransposeOffset((prev) => prev + delta);
  }, [tiptapEditor]);

  const handleResetTranspose = useCallback(() => {
    if (!tiptapEditor || tiptapEditor.isDestroyed || transposeOffset === 0) return;
    transposeEditorChords(tiptapEditor, -transposeOffset);
    setTransposeOffset(0);
  }, [tiptapEditor, transposeOffset]);

  return (
    <div className="relative w-full h-full bg-bg-primary text-text-primary flex flex-col overflow-hidden select-none">
      {/* HEADER: Ultra-clean, no sidebar, back button hidden on mobile */}
      <header className="h-12 border-b border-border-default/20 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 bg-bg-primary/95 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back Button (Hidden on Mobile, Visible on Tablet & Desktop) */}
          <button
            type="button"
            onClick={onBack}
            className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title="Kembali ke Diskografi"
            aria-label="Kembali"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Song Icon */}
          <div className="w-7 h-7 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
            {parentProject ? <Disc3 size={15} /> : <Music2 size={15} />}
          </div>

          {/* Title & Metadata Details */}
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-text-heading tracking-tight truncate leading-tight">
              {song.title || 'Tanpa Judul'}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-text-muted truncate font-medium">
              <span className="shrink-0">
                {parentProject ? (parentProject.type === 'album' ? 'Album' : 'EP') : 'Single'}
              </span>
              {parentProject && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="truncate">{parentProject.title}</span>
                </>
              )}
              {song.musicalKey && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="font-mono shrink-0">{song.musicalKey}</span>
                </>
              )}
              {song.bpm && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="font-mono shrink-0">{song.bpm} BPM</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Action: Button (!) Info to Open Original Overview */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenOverview}
            title="Buka Overview Asli & Detail Lengkap"
            className="h-8 w-8 sm:w-auto sm:px-3 rounded-xl bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Info size={15} className="text-accent-primary shrink-0" />
            <span className="hidden sm:inline text-xs">Overview</span>
          </button>
        </div>
      </header>

      {/* MAIN BODY: Pure Full-Width Reading Stage (No Sidebar) */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0">
            {isLoaded ? (
              <EditorCore
                key={`${song.id}-${activeVersion?.id || 'initial'}`}
                noteId={song.id}
                ref={editorRef}
                hideTitle={true}
                title=""
                onTitleChange={() => {}}
                initialContent={lyricsContent}
                onChange={() => {}}
                onEditorReady={setTiptapEditor}
                isReadOnly={true}
                enableChords={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                Memuat lirik final...
              </div>
            )}
          </div>

          {/* Upgraded Live Performance Dock: Auto-scroll, Transpose, Key, BPM */}
          <CollapsibleReadingDock
            semitones={transposeOffset}
            onTranspose={handleTranspose}
            onReset={handleResetTranspose}
            musicalKey={song.musicalKey || 'C'}
            onUpdateKey={(k) => onUpdateSong && onUpdateSong({ musicalKey: k })}
            bpm={song.bpm || 120}
            capo={song.capo || 0}
            onUpdateCapo={(c) => onUpdateSong && onUpdateSong({ capo: c })}
          />
        </div>
      </div>
    </div>
  );
};
