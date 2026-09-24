import React, { useState } from 'react';
import { Database, ChevronDown, ChevronUp, Copy, Check, Code2 } from 'lucide-react';
import { SUPABASE_NOESIS_SQL } from './SupabaseSetupSQL';

interface SupabaseSqlSetupModalProps {
  showAdvancedTools: boolean;
  setShowAdvancedTools: (val: boolean) => void;
  showSqlPreview: boolean;
  setShowSqlPreview: (val: boolean) => void;
  copiedSql?: boolean;
  handleCopySql?: () => void;
  sqlScript?: string;
}

export const SupabaseSqlSetupModal: React.FC<SupabaseSqlSetupModalProps> = ({
  showAdvancedTools,
  setShowAdvancedTools,
  showSqlPreview,
  setShowSqlPreview,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCurrentSql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_NOESIS_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy SQL to clipboard:', err);
    }
  };

  return (
    <div className="p-4 bg-bg-surface">
      <button
        type="button"
        onClick={() => setShowAdvancedTools(!showAdvancedTools)}
        className="flex items-center justify-between w-full text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-accent-primary" />
          <span>SQL Schema & Setup Database</span>
        </span>
        {showAdvancedTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showAdvancedTools && (
        <div className="mt-3.5 space-y-4 pt-3 border-t border-border-subtle animate-in fade-in duration-150">
          {/* Description & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-bg-primary/50">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-primary inline-block" />
                <span>Skema Database Noesis Note</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Tabel catatan (nodes), metadata AI, pgvector 1024-d, riwayat chat, media & Supabase Realtime.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCurrentSql}
              className={`shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer ${
                copied
                  ? 'bg-status-success text-white'
                  : 'bg-accent-primary hover:bg-accent-hover text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Script</span>
                </>
              )}
            </button>
          </div>

          {/* Collapsible View / Hide SQL Preview */}
          <div>
            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="flex items-center gap-1.5 text-xs text-accent-primary hover:underline py-1 cursor-pointer font-medium"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showSqlPreview ? 'Sembunyikan SQL Script' : 'Lihat SQL Script'}</span>
            </button>

            {showSqlPreview && (
              <div className="relative mt-2">
                <pre className="p-3.5 bg-bg-primary rounded-xl text-[11px] font-mono text-text-secondary overflow-x-auto max-h-64 leading-relaxed select-all">
                  {SUPABASE_NOESIS_SQL}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
