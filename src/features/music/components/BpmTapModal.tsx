import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Activity, Play, Pause, Volume2 } from 'lucide-react';

interface BpmTapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBpm?: number;
  onApplyBpm: (bpm: number) => void;
}

export const BpmTapModal: React.FC<BpmTapModalProps> = ({
  isOpen,
  onClose,
  currentBpm = 120,
  onApplyBpm,
}) => {
  const [bpm, setBpm] = useState<number>(currentBpm || 120);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const metronomeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (currentBpm) {
      setBpm(currentBpm);
    }
  }, [currentBpm]);

  // Clean up metronome on unmount/close
  useEffect(() => {
    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playClick = useCallback((freq = 880) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (!audioCtxRef.current) return;

      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.05);

      setActiveBeat(true);
      setTimeout(() => setActiveBeat(false), 80);
    } catch {
      // AudioContext fallback
    }
  }, []);

  const handleTap = () => {
    const now = performance.now();
    playClick(1200);

    setTapTimes((prev) => {
      const recent = prev.filter((t) => now - t < 3000);
      const next = [...recent, now];

      if (next.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < next.length; i++) {
          intervals.push(next[i] - next[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);
        if (calculatedBpm >= 30 && calculatedBpm <= 300) {
          setBpm(calculatedBpm);
        }
      }

      return next;
    });
  };

  const toggleMetronome = () => {
    if (isMetronomePlaying) {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
      setIsMetronomePlaying(false);
    } else {
      setIsMetronomePlaying(true);
      playClick(880);
      const intervalMs = (60 / bpm) * 1000;
      metronomeIntervalRef.current = setInterval(() => {
        playClick(880);
      }, intervalMs);
    }
  };

  // Restart metronome when bpm changes while playing
  useEffect(() => {
    if (isMetronomePlaying) {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
      const intervalMs = (60 / bpm) * 1000;
      metronomeIntervalRef.current = setInterval(() => {
        playClick(880);
      }, intervalMs);
    }
  }, [bpm, isMetronomePlaying, playClick]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-xs bg-bg-secondary rounded-2xl p-4 shadow-2xl space-y-4 ring-1 ring-border-default/40 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-text-heading font-bold text-sm">
            <Activity size={16} className="text-accent-primary" />
            <span>Tap Tempo & BPM</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Big BPM Display */}
        <div className="py-2">
          <div className="text-4xl sm:text-5xl font-mono font-black text-text-heading tracking-tight flex items-baseline justify-center gap-1">
            <span>{bpm}</span>
            <span className="text-xs font-semibold text-text-muted">BPM</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`w-3 h-3 rounded-full transition-transform duration-75 ${
              activeBeat ? 'scale-150 bg-accent-primary' : 'scale-100 bg-border-default/60'
            }`} />
          </div>
        </div>

        {/* Big Interactive Tap Button */}
        <div>
          <button
            type="button"
            onClick={handleTap}
            className="w-full py-5 rounded-2xl bg-accent-primary text-accent-contrast font-bold text-sm tracking-wider uppercase shadow-md active:scale-95 transition-transform cursor-pointer hover:opacity-95"
          >
            KETUK DI SINI (TAP TEMPO)
          </button>
          <p className="text-[10px] text-text-muted mt-1.5">
            Ketuk berulang kali sesuai ketukan lagu untuk mendeteksi tempo
          </p>
        </div>

        {/* Manual BPM Controls & Metronome */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-default/20">
          <div className="flex items-center gap-1 bg-bg-primary rounded-xl p-1">
            <button
              type="button"
              onClick={() => setBpm((b) => Math.max(30, b - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-hover cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setBpm((b) => Math.min(300, b + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-hover cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={toggleMetronome}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMetronomePlaying 
                ? 'bg-red-500/15 text-red-500 font-semibold' 
                : 'bg-bg-primary text-text-secondary hover:text-text-primary'
            }`}
          >
            {isMetronomePlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isMetronomePlaying ? 'Stop' : 'Metronom'}</span>
          </button>
        </div>

        {/* Action button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              onApplyBpm(bpm);
              onClose();
            }}
            className="w-full py-2 text-xs font-semibold rounded-xl bg-accent-primary text-accent-contrast hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Terapkan BPM ke Lagu
          </button>
        </div>
      </div>
    </div>
  );
};
