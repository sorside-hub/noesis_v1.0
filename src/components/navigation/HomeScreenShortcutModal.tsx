import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Plus, 
  Zap, 
  AudioLines, 
  Mic, 
  Music, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { SHORTCUT_DEFINITIONS, ShortcutActionType } from '../../hooks/useHomeScreenShortcuts';

interface HomeScreenShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteShortcut: (action: ShortcutActionType) => void;
}

export const HomeScreenShortcutModal: React.FC<HomeScreenShortcutModalProps> = ({
  isOpen,
  onClose,
  onExecuteShortcut,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = (path: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}${path}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // fallback
    });
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Plus':
        return <Plus className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5" />;
      case 'AudioLines':
        return <AudioLines className="w-5 h-5" />;
      case 'Mic':
        return <Mic className="w-5 h-5" />;
      case 'Music':
        return <Music className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-bg-secondary border border-border-primary rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-primary/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Shortcut Layar Utama Ponsel
              </h2>
              <p className="text-xs text-text-muted">
                Akses kilat fitur Noesis langsung dari home screen HP kamu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Guide Selector */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 p-1 bg-bg-tertiary rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'android'
                  ? 'bg-bg-primary text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <span>🤖 Android</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'ios'
                  ? 'bg-bg-primary text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <span>🍎 iPhone (iOS)</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Instructions Banner */}
        <div className="px-6 py-2">
          {activeTab === 'android' ? (
            <div className="p-3 bg-bg-primary border border-border-primary/60 rounded-xl text-xs text-text-secondary space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p>
                  <strong>Tekan dan tahan (long-press)</strong> ikon aplikasi Noesis di layar utama HP kamu.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p>
                  Akan muncul menu pintasan (Catatan, Tulis Cepat, Memo, Bar). <strong>Tarik (drag)</strong> pintasan favorit ke area kosong di layar utama.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-bg-primary border border-border-primary/60 rounded-xl text-xs text-text-secondary space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p>
                  Salin atau buka tautan aksi di bawah menggunakan browser <strong>Safari</strong> di iPhone.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p className="flex items-center gap-1.5 flex-wrap">
                  Ketuk tombol <Share2 className="w-3.5 h-3.5 inline text-accent-primary" /> <strong>Bagikan (Share)</strong>, lalu pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Shortcut Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2.5">
          <div className="text-[11px] font-bold tracking-wider uppercase text-text-muted px-1">
            Daftar Pintasan Siap Pakai
          </div>

          {SHORTCUT_DEFINITIONS.map((shortcut) => {
            const isCopied = copiedId === shortcut.id;

            return (
              <div
                key={shortcut.id}
                className="p-3.5 bg-bg-primary hover:bg-bg-hover/50 border border-border-primary rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-secondary text-icon-accent group-hover:text-text-primary flex items-center justify-center shrink-0 border border-border-primary">
                    {getIcon(shortcut.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {shortcut.title}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-bg-secondary text-text-muted">
                        {shortcut.shortTitle}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                      {shortcut.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(shortcut.path, shortcut.id)}
                    title="Salin tautan peluncur mandiri"
                    className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border-primary flex items-center gap-1.5 text-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Salin</span>
                      </>
                    )}
                  </button>

                  {/* Run Now Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onExecuteShortcut(shortcut.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-bg-secondary hover:bg-bg-hover text-text-primary text-xs font-medium rounded-lg transition-colors cursor-pointer border border-border-primary flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3 text-text-muted" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 border-t border-border-primary bg-bg-primary/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>PWA W3C Shortcuts & Standalone URL Compatible</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-accent-primary text-accent-contrast text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
