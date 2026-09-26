import React, { useRef, useState } from 'react';
import { 
  HardDrive, 
  Download,
  Upload,
  BookOpen,
  Layers,
  Sparkles,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Palette,
  Moon,
  Check,
  Contrast,
  ClipboardList
} from 'lucide-react';
import { VaultData, FileNode } from '../../../types/vault';
import { ApiKeyStatusSection } from './ApiKeyStatusSection';
import { SupabaseUnifiedCard } from './SupabaseUnifiedCard';
import { NotificationSettingsCard } from './NotificationSettingsCard';
import { TemplateSettingsCard } from '../../templates/components/TemplateSettingsCard';
import { exportVaultToJSON, importVaultFromJSON } from '../../../lib/storage';
import { useTheme } from '../../../hooks/useTheme';


interface SettingsViewProps {
  vault: VaultData;
  createFolder?: (parentId: string | null, name: string) => string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ vault, createFolder }) => {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'loading' | 'success' | 'error'; message: string } | null>(null);

  const handleExport = async () => {
    try {
      const jsonStr = await exportVaultToJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `noesis-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setImportStatus({ type: 'error', message: 'Gagal mengekspor data catatan ke file JSON.' });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ type: 'loading', message: 'Mengimpor file backup...' });
    try {
      const text = await file.text();
      await importVaultFromJSON(text);
      setImportStatus({ type: 'success', message: 'Data berhasil diimpor! Memuat ulang...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      setImportStatus({ type: 'error', message: 'Format backup tidak valid atau rusak.' });
      setTimeout(() => setImportStatus(null), 3500);
    }
    
    // reset input
    e.target.value = '';
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-bg-primary text-text-primary select-text">
      <div className="max-w-2xl mx-auto px-4 pt-3 sm:pt-4 pb-28 space-y-5">
        
        {/* HEADER SECTION */}
        <header className="pt-0.5">
          <h1 className="text-xl font-bold text-text-heading tracking-tight">Settings</h1>
        </header>

        {/* 1. THEME & APPEARANCE */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            <Palette size={14} className="text-accent-primary" /> 
            Tema & Tampilan
          </h2>
          
          <div className="grid grid-cols-1 gap-3">
            <div
              className="p-3.5 rounded-xl bg-bg-secondary flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-bg-primary text-accent-primary shrink-0">
                  <Moon size={18} className="text-accent-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-text-primary block truncate">Mode Gelap</span>
                </div>
              </div>
              <span className="text-[11px] font-medium bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-md shrink-0">
                Aktif
              </span>
            </div>
          </div>
        </section>

        {/* 2. CLOUD SYNC & STORAGE (1 UNIFIED CARD) */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            <Sparkles size={14} className="text-accent-primary" /> 
            Sync & Cloud Storage
          </h2>
          <SupabaseUnifiedCard />
        </section>

        {/* 2.5 NOTIFIKASI PWA */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-accent-primary" /> 
            Notifikasi & Pengingat
          </h2>
          <NotificationSettingsCard />
        </section>

        {/* 2.7 TEMPLATE CATATAN */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            <ClipboardList size={14} className="text-accent-primary" /> 
            Template Catatan
          </h2>
          <TemplateSettingsCard vault={vault} createFolder={createFolder} />
        </section>

        {/* 3. API KEYS & FAILOVER */}

        <section className="space-y-2.5">
          <ApiKeyStatusSection />
        </section>

        {/* 4. LOCAL BACKUP & DATA MANAGEMENT (COMPACT CARD) */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            <HardDrive size={14} className="text-accent-primary" /> 
            Local Backup & Data Management
          </h2>
          
          <div className="bg-bg-secondary rounded-xl overflow-hidden shadow-2xs">
            {/* Quick Stats Banner */}
            <div className="p-4 bg-bg-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-bg-primary text-accent-primary shrink-0">
                  <FileCheck size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text-heading">Local Storage Status</h3>
                  <p className="text-xs text-text-muted mt-0.5">IndexedDB Browser Storage (Offline-First)</p>
                </div>
              </div>
            </div>

            {/* Padded Divider */}
            <div className="px-4"><div className="border-t border-border-subtle" /></div>

            {/* Action Buttons */}
            <div className="p-4 bg-bg-secondary/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-bg-primary hover:bg-bg-hover text-text-primary rounded-xl text-xs font-semibold transition-all hover:border-accent-primary/40 shadow-xs cursor-pointer"
              >
                <Download size={14} className="text-accent-primary shrink-0" />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleImportClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-bg-primary hover:bg-bg-hover text-text-primary rounded-xl text-xs font-semibold transition-all hover:border-accent-primary/40 shadow-xs cursor-pointer"
              >
                <Upload size={14} className="text-accent-primary shrink-0" />
                <span>Import Backup (JSON)</span>
              </button>
            </div>

            {/* Import Status Alert */}
            {importStatus && (
              <div className={`p-3 text-center text-xs font-medium flex items-center justify-center gap-2 ${
                importStatus.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-t border-emerald-500/20' 
                  : importStatus.type === 'error'
                    ? 'bg-status-error-bg text-status-error border-t border-status-error/20'
                    : 'bg-bg-hover text-accent-primary'
              }`}>
                {importStatus.type === 'success' && <CheckCircle2 size={14} className="text-emerald-400" />}
                {importStatus.type === 'error' && <AlertCircle size={14} className="text-status-error" />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
