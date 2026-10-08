import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Plus,
  Minus,
  ArrowUp,
  Music,
  RotateCcw,
  Activity,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { transposeChord } from '../lib/transposeUtils';
import { useNavigation } from '../../../context/NavigationContext';

const SPEED_STORAGE_KEY = 'noesis_autoscroll_speed';
const DOCK_OPEN_KEY = 'noesis_reading_dock_open';

const CIRCLE_OF_FIFTHS = [
  { major: 'C', minor: 'Cm' },
  { major: 'G', minor: 'Gm' },
  { major: 'D', minor: 'Dm' },
  { major: 'A', minor: 'Am' },
  { major: 'E', minor: 'Em' },
  { major: 'B', minor: 'Bm' },
  { major: 'F#', minor: 'F#m' },
  { major: 'Db', minor: 'C#m' },
  { major: 'Ab', minor: 'G#m' },
  { major: 'Eb', minor: 'Ebm' },
  { major: 'Bb', minor: 'Bbm' },
  { major: 'F', minor: 'Fm' },
];

interface CollapsibleReadingDockProps {
  hasChords?: boolean;
  semitones: number;
  onTranspose: (delta: number) => void;
  onReset: () => void;
  musicalKey?: string;
  onUpdateKey?: (key: string) => void;
  bpm?: number;
  onOpenBpmModal?: () => void;
  capo?: number;
  onUpdateCapo?: (capo: number) => void;
  onAutoLock?: () => void;
}

export const CollapsibleReadingDock: React.FC<CollapsibleReadingDockProps> = ({
  hasChords = true,
  semitones,
  onTranspose,
  onReset,
  musicalKey = 'C',
  onUpdateKey,
  bpm = 120,
  onOpenBpmModal,
  capo = 0,
  onUpdateCapo,
  onAutoLock,
}) => {
  const { view } = useNavigation();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Auto-scroll playing state
  const [isPlaying, setIsPlaying] = useState(false);

  // Speed state (calibrated for live singing: 0.5x to 3.0x with 0.25x steps, base 18px/s)
  const [speed, setSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SPEED_STORAGE_KEY);
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.5 && val <= 3.0) {
          return Math.round(val * 100) / 100;
        }
      }
    } catch {
      // ignore
    }
    return 1.0;
  });

  // Popups state inside dock
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [showCapoPicker, setShowCapoPicker] = useState(false);
  const [keyMode, setKeyMode] = useState<'major' | 'minor'>('major');
  const [customKeyInput, setCustomKeyInput] = useState('');

  const [lockedTop, setLockedTop] = useState<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatedPxRef = useRef<number>(0);
  const dockRef = useRef<HTMLDivElement>(null);

  // Toggle dock state
  const toggleDock = (openState?: boolean) => {
    setIsOpen((prev) => (typeof openState === 'boolean' ? openState : !prev));
  };

  // Save speed changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, String(speed));
    } catch {
      // ignore
    }
  }, [speed]);

  // Click outside to collapse
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        toggleDock(false);
        setShowKeyPicker(false);
        setShowCapoPicker(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  // Keep dock motionless on mobile when virtual keyboard appears
  useEffect(() => {
    const updatePosition = () => {
      const activeEl = document.activeElement;
      const isEditing = Boolean(
        activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.closest('.ProseMirror') ||
            activeEl.getAttribute('contenteditable') === 'true')
      );

      const vv = window.visualViewport;
      const screenH = window.screen?.availHeight || window.screen?.height || 800;
      const isKeyboardOpen = isEditing || (vv && vv.height < screenH * 0.72);

      if (isKeyboardOpen && lockedTop !== null) {
        return;
      }

      const normalHeight = vv ? Math.max(vv.height, window.innerHeight) : window.innerHeight;
      setLockedTop(Math.round(normalHeight * 0.5));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updatePosition);
      }
    };
  }, [lockedTop]);

  // Helper to find the active scrollable editor container
  const findScrollableContainer = (): HTMLElement | null => {
    // 1. Direct local lookup from dock's parent canvas (prevents selecting background hidden containers)
    if (dockRef.current) {
      const parentContainer = dockRef.current.parentElement;
      const localEditor = parentContainer?.querySelector('.editor-scroll-container');
      if (localEditor instanceof HTMLElement) return localEditor;
    }

    // 2. ProseMirror closest overflow container
    const pm = document.querySelector('.ProseMirror');
    if (pm) {
      const scrollable = pm.closest('.overflow-y-auto, .overflow-auto');
      if (scrollable instanceof HTMLElement) return scrollable;
    }

    // 3. Fallback to active editor-scroll-container in document
    const editorScroll = document.querySelector('.editor-scroll-container');
    if (editorScroll instanceof HTMLElement) return editorScroll;

    return null;
  };

  // Auto-pause when user switches tabs or navigates away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Auto-stop scrolling when user switches away from the music studio tab
  useEffect(() => {
    if (view !== 'music' && isPlaying) {
      setIsPlaying(false);
    }
  }, [view, isPlaying]);

  // Auto-scroll loop using requestAnimationFrame (Integer-threshold sub-pixel accumulation)
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
      accumulatedPxRef.current = 0;
      return;
    }

    const step = (time: DOMHighResTimeStamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const container = findScrollableContainer();
      if (container) {
        // Natural fluid scrolling (base 18px/sec: 0.5x = 9px/s, 1.0x = 18px/s, 2.0x = 36px/s)
        const deltaPx = speed * 18 * deltaTime;
        accumulatedPxRef.current += deltaPx;

        // When accumulated fraction reaches >= 1 full pixel, scroll the integer amount
        if (accumulatedPxRef.current >= 1) {
          const integerPx = Math.floor(accumulatedPxRef.current);
          container.scrollTop += integerPx;
          accumulatedPxRef.current -= integerPx;
        }

        // Auto-stop when reached bottom with 5px threshold
        if (
          container.scrollHeight > container.clientHeight &&
          container.scrollTop + container.clientHeight >= container.scrollHeight - 5
        ) {
          setIsPlaying(false);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
      accumulatedPxRef.current = 0;
    };
  }, [isPlaying, speed]);

  const handleScrollToTop = () => {
    const container = findScrollableContainer();
    if (container) {
      accumulatedPxRef.current = 0;
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const displaySemitones = semitones > 0 ? `+${semitones}` : `${semitones}`;
  
  // Real-time current transposed key calculation (Harmonic-aware for Major and Minor)
  const currentSoundingKey = musicalKey ? transposeChord(musicalKey, semitones) : 'C';

  return (
    <div
      ref={dockRef}
      id="collapsible-reading-dock"
      style={{
        top: lockedTop !== null ? `${lockedTop}px` : '50%',
      }}
      className={`fixed right-0 -translate-y-1/2 z-40 flex items-center transition-transform duration-300 ease-out select-none ${
        isOpen ? 'translate-x-0' : 'translate-x-[56px]'
      }`}
    >
      {/* 
        TRIGGER TAB (Trapesium Siku-siku Vertikal menempel di tepi kiri dock - 58px)
        Menempel di sisi kiri panel dock. Saat dock terlipat (translate-x-[56px]),
        dock tersembunyi dan tab ini persis menempel di tepi kanan layar.
      */}
      <button
        type="button"
        onClick={() => toggleDock()}
        className="relative w-[32px] h-[58px] flex items-center justify-center cursor-pointer group focus:outline-hidden transition-all active:scale-95 shrink-0"
        title={isOpen ? 'Lipat panel dock' : isPlaying ? 'Auto-Scroll Aktif (Sedang Berjalan)' : 'Buka Live Performance Dock (Scroll, Key, Transpose, BPM, Capo)'}
        aria-label="Toggle Reading Tools Dock"
      >
        {/* SVG Symmetrical Flat-Face Trapezoid Handle - Exactly matching Studio main dock */}
        <svg
          viewBox="0 0 32 58"
          className="absolute inset-0 w-full h-full overflow-visible transition-all drop-shadow-md"
        >
          <path
            d="M 32,0 C 32,5 24,8 12,11 C 4,12 0,15 0,19 L 0,39 C 0,43 4,46 12,47 C 24,50 32,53 32,58 Z"
            style={{
              fill: 'var(--bg-quaternary)',
            }}
            className="group-hover:opacity-95 transition-opacity"
          />
        </svg>

        {/* Single Icon inside flat face */}
        <div className="relative z-10 flex items-center justify-center w-full h-full pl-1 text-text-primary group-hover:text-accent-primary transition-colors">
          {isPlaying ? (
            <Pause size={15} strokeWidth={2} />
          ) : (
            <SlidersHorizontal size={15} strokeWidth={2} />
          )}
        </div>
      </button>

      {/* 
        PANEL ALAT MEMBACA & LIVE PERFORMANCE (DOCK BODY)
        Lebar 56px, tersusun rapi dalam 3 modul vertikal:
        1. Auto-Scroll (Play/Pause, +/-, Speed, Top)
        2. Key & Transpose (Root Key, +/-, Offset, Reset)
        3. Tempo & Capo (BPM Tap Tempo, Capo Fret)
      */}
      <div className="w-[56px] bg-bg-quaternary rounded-l-2xl p-1.5 flex flex-col items-center gap-1 transition-all">
        
        {/* =================================================== */}
        {/* SEKSI 1: AUTO-SCROLL CONTROLS                       */}
        {/* =================================================== */}

        {/* Play / Pause Toggle Button */}
        <button
          type="button"
          onClick={() => {
            const nextPlaying = !isPlaying;
            setIsPlaying(nextPlaying);
            if (nextPlaying) {
              setIsOpen(false);
              onAutoLock?.();
            }
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isPlaying
              ? 'bg-accent-primary text-accent-contrast'
              : 'bg-bg-secondary text-text-primary hover:text-accent-primary hover:bg-accent-primary/10'
          }`}
          title={isPlaying ? 'Jeda Auto-Scroll' : 'Mulai Auto-Scroll'}
          aria-label="Toggle Auto-Scroll"
        >
          {isPlaying ? (
            <Pause size={15} />
          ) : (
            <Play size={15} className="translate-x-[1px]" />
          )}
        </button>

        {/* Speed Up (+0.25x) */}
        <button
          type="button"
          onClick={() => setSpeed((s) => Math.min(3, Math.round((s + 0.25) * 100) / 100))}
          disabled={speed >= 3}
          className="w-7 h-6 flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Percepat Auto-Scroll (+0.25x)"
          aria-label="Speed Up"
        >
          <Plus size={12} />
        </button>

        {/* Speed Display Badge */}
        <div
          className="w-full text-[9px] font-mono font-bold text-text-secondary text-center tracking-tight select-none"
          title={`Kecepatan: ${speed}x`}
        >
          {speed}x
        </div>

        {/* Speed Down (-0.25x) */}
        <button
          type="button"
          onClick={() => setSpeed((s) => Math.max(0.5, Math.round((s - 0.25) * 100) / 100))}
          disabled={speed <= 0.5}
          className="w-7 h-6 flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Perlambat Auto-Scroll (-0.25x)"
          aria-label="Speed Down"
        >
          <Minus size={12} />
        </button>

        {/* Scroll To Top */}
        <button
          type="button"
          onClick={handleScrollToTop}
          className="w-7 h-6 flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors cursor-pointer"
          title="Kembali ke Paling Atas"
          aria-label="Scroll to Top"
        >
          <ArrowUp size={12} />
        </button>

        {/* =================================================== */}
        {/* SEKSI 2: KEY & TRANSPOSE CONTROLS                   */}
        {/* =================================================== */}
        <div className="w-8 h-px bg-border-default/20 my-0.5" />

        {/* Key Root Button + Popup Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowKeyPicker(!showKeyPicker);
              setShowCapoPicker(false);
            }}
            className={`w-10 h-9 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              semitones !== 0
                ? 'bg-accent-primary/15 text-accent-primary font-bold'
                : 'hover:bg-bg-secondary text-text-primary'
            }`}
            title={`Nada Dasar: ${musicalKey} (Saat ini: ${currentSoundingKey})`}
          >
            <span className="text-[7px] uppercase font-bold text-text-muted tracking-tight leading-none">KEY</span>
            <span className="text-[11px] font-extrabold font-mono leading-none mt-0.5">{currentSoundingKey}</span>
          </button>

          {/* Key Picker Popup */}
          {showKeyPicker && onUpdateKey && (
            <div className="absolute right-full top-0 mr-2 w-48 bg-bg-secondary rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                  Pilih Nada Dasar
                </span>
                {/* Mode Toggle: Mayor / Minor */}
                <div className="flex bg-bg-primary rounded-lg p-0.5 text-[9px] font-bold">
                  <button
                    type="button"
                    onClick={() => setKeyMode('major')}
                    className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                      keyMode === 'major' ? 'bg-accent-primary text-accent-contrast' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Mayor
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeyMode('minor')}
                    className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                      keyMode === 'minor' ? 'bg-accent-primary text-accent-contrast' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Minor
                  </button>
                </div>
              </div>

              {/* Custom Key Input */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Ketik key lain..."
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customKeyInput.trim()) {
                      onUpdateKey(customKeyInput.trim());
                      setShowKeyPicker(false);
                      setCustomKeyInput('');
                    }
                  }}
                  className="w-full px-2 py-1 text-[10px] font-mono font-bold rounded-lg bg-bg-primary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customKeyInput.trim()) {
                      onUpdateKey(customKeyInput.trim());
                      setShowKeyPicker(false);
                      setCustomKeyInput('');
                    }
                  }}
                  className="px-2 py-1 text-[9px] font-bold rounded-lg bg-accent-primary text-accent-contrast cursor-pointer"
                >
                  OK
                </button>
              </div>

              {/* Grid of Keys */}
              <div className="grid grid-cols-4 gap-1">
                {CIRCLE_OF_FIFTHS.map((item) => {
                  const displayKey = keyMode === 'major' ? item.major : item.minor;
                  const isActive = musicalKey === displayKey;
                  return (
                    <button
                      key={displayKey}
                      type="button"
                      onClick={() => {
                        onUpdateKey(displayKey);
                        setShowKeyPicker(false);
                      }}
                      className={`py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer text-center ${
                        isActive
                          ? 'bg-accent-primary text-accent-contrast shadow-xs'
                          : 'text-text-primary bg-bg-primary hover:bg-bg-hover'
                      }`}
                    >
                      {displayKey}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Transpose Up (+1 Semitone) */}
        <button
          type="button"
          onClick={() => onTranspose(1)}
          className="w-7 h-6 flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors cursor-pointer"
          title="Naikkan +1 Semitone"
          aria-label="Transpose Up"
        >
          <Plus size={12} />
        </button>

        {/* Semitone Offset Indicator */}
        <div
          className={`w-full text-[9px] font-mono font-bold text-center select-none transition-colors ${
            semitones !== 0
              ? 'text-accent-primary font-bold'
              : 'text-text-secondary'
          }`}
          title={`Offset: ${displaySemitones} semitone`}
        >
          {displaySemitones}
        </div>

        {/* Transpose Down (-1 Semitone) */}
        <button
          type="button"
          onClick={() => onTranspose(-1)}
          className="w-7 h-6 flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors cursor-pointer"
          title="Turunkan -1 Semitone"
          aria-label="Transpose Down"
        >
          <Minus size={12} />
        </button>

        {/* Reset Transpose */}
        <button
          type="button"
          onClick={onReset}
          disabled={semitones === 0}
          className="w-7 h-6 flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title={semitones !== 0 ? 'Kembalikan Nada Asli' : 'Sudah di nada asli'}
          aria-label="Reset Transpose"
        >
          <RotateCcw size={11} />
        </button>

        {/* =================================================== */}
        {/* SEKSI 3: TEMPO & CAPO CONTROLS                      */}
        {/* =================================================== */}
        <div className="w-8 h-px bg-border-default/20 my-0.5" />

        {/* BPM Tap Tempo Button */}
        <button
          type="button"
          onClick={onOpenBpmModal}
          className="w-10 h-8 flex flex-col items-center justify-center rounded-xl bg-bg-secondary hover:bg-bg-hover text-text-primary transition-colors cursor-pointer group"
          title="Atur BPM / Tap Tempo"
        >
          <span className="text-[7px] font-bold text-accent-primary uppercase tracking-tight leading-none">BPM</span>
          <span className="text-[10px] font-extrabold font-mono leading-none mt-0.5">{bpm}</span>
        </button>

        {/* Capo Selector Button + Popup */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCapoPicker(!showCapoPicker);
              setShowKeyPicker(false);
            }}
            className={`w-10 h-8 flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer ${
              capo > 0
                ? 'bg-accent-primary/15 text-accent-primary font-bold'
                : 'bg-bg-secondary hover:bg-bg-hover text-text-primary'
            }`}
            title={capo === 0 ? 'No Capo' : `Capo Fret ${capo}`}
          >
            <span className="text-[7px] font-bold text-text-muted uppercase tracking-tight leading-none">CAPO</span>
            <span className="text-[10px] font-extrabold font-mono leading-none mt-0.5">
              {capo === 0 ? 'NO' : `${capo}`}
            </span>
          </button>

          {/* Capo Fret Picker Popup */}
          {showCapoPicker && onUpdateCapo && (
            <div className="absolute right-full bottom-0 mr-2 w-32 bg-bg-secondary rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-52 overflow-y-auto">
              <div className="text-[9px] font-bold text-text-muted uppercase px-1 py-0.5 mb-1">
                Posisi Capo
              </div>
              <div className="space-y-0.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onUpdateCapo(c);
                      setShowCapoPicker(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                      capo === c
                        ? 'bg-accent-primary text-accent-contrast font-bold'
                        : 'text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    {c === 0 ? 'No Capo' : `Capo Fret ${c}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
