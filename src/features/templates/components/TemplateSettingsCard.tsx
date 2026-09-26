import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Calendar, 
  Clock, 
  FileText, 
  Info, 
  Sparkles,
  Check,
  ChevronDown,
  Search,
  X
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { VaultData } from '../../../types/vault';
import { useTemplateSettings } from '../hooks/useTemplateSettings';
import { formatTemplateDate, formatTemplateTime } from '../utils/templateUtils';

interface TemplateSettingsCardProps {
  vault: VaultData;
  createFolder?: (parentId: string | null, name: string) => string | null;
}

const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (Standar ISO)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Standar ID/UK)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (Standar US)' },
  { value: 'DD MMMM YYYY', label: '16 September 2026 (Nama Bulan)' },
  { value: 'dddd, DD MMMM YYYY', label: 'Rabu, 16 September 2026 (Hari Lengkap)' },
];

const TIME_FORMAT_OPTIONS = [
  { value: 'HH:mm', label: 'HH:mm (24 Jam, misal 14:30)' },
  { value: 'hh:mm A', label: 'hh:mm AM/PM (12 Jam, misal 02:30 PM)' },
  { value: 'HH:mm:ss', label: 'HH:mm:ss (24 Jam dengan detik)' },
];

export const TemplateSettingsCard: React.FC<TemplateSettingsCardProps> = ({
  vault,
  createFolder,
}) => {
  const {
    settings,
    updateSettings,
    activeTemplateFolder,
    availableFolders,
    templates,
    createDefaultTemplateFolder,
  } = useTemplateSettings(vault, createFolder);

  const [isCreatedSuccess, setIsCreatedSuccess] = useState(false);
  const [showDateTimeConfig, setShowDateTimeConfig] = useState(false);
  const [showVariablesGuide, setShowVariablesGuide] = useState(false);

  // Dropdown open states
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [folderQuery, setFolderQuery] = useState('');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);

  const folderMenuRef = useRef<HTMLDivElement>(null);
  const folderSearchInputRef = useRef<HTMLInputElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const timeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setShowFolderMenu(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setShowDateMenu(false);
      }
      if (timeMenuRef.current && !timeMenuRef.current.contains(e.target as Node)) {
        setShowTimeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available folders based on query
  const filteredFolders = useMemo(() => {
    if (!folderQuery.trim()) return availableFolders;
    const q = folderQuery.toLowerCase().trim();
    return availableFolders.filter((f) => f.name.toLowerCase().includes(q));
  }, [availableFolders, folderQuery]);

  // Focus search input when folder menu opens
  useEffect(() => {
    if (showFolderMenu) {
      setFolderQuery('');
      setTimeout(() => folderSearchInputRef.current?.focus(), 50);
    }
  }, [showFolderMenu]);

  const handleCreateFolder = () => {
    const id = createDefaultTemplateFolder();
    if (id) {
      setIsCreatedSuccess(true);
      setTimeout(() => setIsCreatedSuccess(false), 2500);
    }
  };

  const previewDate = formatTemplateDate(new Date(), settings.dateFormat);
  const previewTime = formatTemplateTime(new Date(), settings.timeFormat);

  const currentDateOption = DATE_FORMAT_OPTIONS.find((o) => o.value === settings.dateFormat) || DATE_FORMAT_OPTIONS[0];
  const currentTimeOption = TIME_FORMAT_OPTIONS.find((o) => o.value === settings.timeFormat) || TIME_FORMAT_OPTIONS[0];

  return (
    <div className="bg-bg-secondary rounded-xl overflow-hidden shadow-2xs">
      {/* 1. Header Banner */}
      <div className="p-3.5 sm:p-4 bg-bg-secondary">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-bg-primary text-accent-primary shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-text-heading truncate">
                  Template Catatan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-primary/15 text-accent-primary whitespace-nowrap shrink-0">
                  {templates.length} template
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5 leading-normal">
                Kelola folder sumber template dan format tanggal dinamis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Padded Divider */}
      <div className="px-4"><div className="border-t border-border-subtle" /></div>

      {/* 2. Folder Source Configuration */}
      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="space-y-1.5" ref={folderMenuRef}>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Folder size={13} className="text-accent-primary" />
            <span>Folder Sumber Template</span>
          </label>

          {/* Custom In-Flow Folder Selector */}
          <div 
            className={twMerge(
              "w-full bg-bg-primary rounded-xl transition-all overflow-hidden",
              showFolderMenu ? "ring-1 ring-accent-primary/50" : ""
            )}
          >
            <button
              type="button"
              onClick={() => setShowFolderMenu(!showFolderMenu)}
              className="w-full px-3 py-2.5 flex items-center justify-between text-xs text-text-primary hover:bg-bg-secondary/40 cursor-pointer transition-colors text-left"
            >
              <div className="flex items-center gap-2 truncate">
                <Folder size={13} className="text-accent-primary shrink-0" />
                <span className="font-medium truncate">
                  {activeTemplateFolder ? activeTemplateFolder.name : (
                    availableFolders.length === 0 ? 'Belum ada folder di vault' : '-- Pilih Folder Template --'
                  )}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={twMerge(
                  "text-text-muted shrink-0 transition-transform duration-150",
                  showFolderMenu ? "rotate-180 text-accent-primary" : ""
                )}
              />
            </button>

            {showFolderMenu && (
              <div className="animate-in fade-in duration-150">
                <div className="mx-2.5 h-px bg-border-subtle/30 my-0.5" />
                
                {/* Search Input Box */}
                <div className="px-2 pt-1 pb-1.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-secondary text-xs">
                    <Search size={12} className="text-text-muted shrink-0" />
                    <input
                      ref={folderSearchInputRef}
                      type="text"
                      value={folderQuery}
                      onChange={(e) => setFolderQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowFolderMenu(false);
                        } else if (e.key === 'Enter' && filteredFolders.length > 0) {
                          updateSettings({
                            templateFolderId: filteredFolders[0].id,
                            templateFolderPath: filteredFolders[0].name,
                          });
                          setShowFolderMenu(false);
                        }
                      }}
                      placeholder="Ketik untuk mencari folder..."
                      className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                    />
                    {folderQuery && (
                      <button
                        type="button"
                        onClick={() => setFolderQuery('')}
                        className="text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                  {/* Empty/Root Option (only shown if not searching or if search matches) */}
                  {(!folderQuery.trim() || 'kosongkan tanpa folder root'.includes(folderQuery.toLowerCase())) && (
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ templateFolderId: null, templateFolderPath: 'Templates' });
                        setShowFolderMenu(false);
                      }}
                      className={twMerge(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left",
                        !activeTemplateFolder
                          ? "bg-bg-secondary text-text-primary font-medium"
                          : "text-text-muted hover:text-text-primary hover:bg-bg-secondary/60"
                      )}
                    >
                      <span className="text-text-muted">-- Kosongkan / Tanpa Folder --</span>
                      {!activeTemplateFolder && <Check size={12} className="text-accent-primary shrink-0" />}
                    </button>
                  )}

                  {/* Folder Items */}
                  {filteredFolders.map((folder) => {
                    const isSelected = activeTemplateFolder?.id === folder.id;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => {
                          updateSettings({
                            templateFolderId: folder.id,
                            templateFolderPath: folder.name,
                          });
                          setShowFolderMenu(false);
                        }}
                        className={twMerge(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left",
                          isSelected
                            ? "bg-bg-secondary text-text-primary font-medium"
                            : "text-text-muted hover:text-text-primary hover:bg-bg-secondary/60"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder size={12} className="text-accent-primary shrink-0" />
                          <span className="truncate">{folder.name}</span>
                        </div>
                        {isSelected && <Check size={12} className="text-accent-primary shrink-0" />}
                      </button>
                    );
                  })}

                  {filteredFolders.length === 0 && folderQuery.trim() && (
                    <div className="px-3 py-3 text-center text-text-muted text-xs italic">
                      Folder "{folderQuery}" tidak ditemukan
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status bar & action for folder */}
        {activeTemplateFolder ? (
          <div className="p-2.5 rounded-lg bg-bg-primary/60 flex items-start gap-2 text-xs">
            <Info size={14} className="text-accent-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-text-secondary font-medium leading-relaxed">
                Setiap note di dalam folder <strong className="text-text-heading">"{activeTemplateFolder.name}"</strong> akan otomatis dikenali sebagai template.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 space-y-2.5">
            <div className="flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5 text-amber-500" />
              <span className="leading-relaxed">
                Folder template belum dipilih atau belum ada di vault kamu.
              </span>
            </div>
            {createFolder && (
              <button
                type="button"
                onClick={handleCreateFolder}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-accent-primary text-accent-contrast hover:opacity-90 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                {isCreatedSuccess ? (
                  <>
                    <Check size={13} />
                    <span>Folder 'Templates' Berhasil Dibuat!</span>
                  </>
                ) : (
                  <>
                    <FolderPlus size={13} />
                    <span>Buat Folder 'Templates' Otomatis</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Padded Divider */}
      <div className="px-4"><div className="border-t border-border-subtle" /></div>

      {/* 3. Collapsible Date & Time Format Settings */}
      <div className="p-3.5 sm:p-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowDateTimeConfig(!showDateTimeConfig)}
          className="w-full flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-accent-primary" />
            <span>Format Tanggal & Jam</span>
          </div>
          <ChevronDown
            size={14}
            className={`text-text-muted transition-transform duration-200 ${
              showDateTimeConfig ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showDateTimeConfig && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Custom Date Format Selector */}
            <div className="space-y-1.5" ref={dateMenuRef}>
              <label className="text-[11px] font-medium text-text-secondary flex items-center gap-1">
                <Calendar size={12} className="text-accent-primary" />
                <span>Format Tanggal ({"{{date}}"})</span>
              </label>
              
              <div 
                className={twMerge(
                  "w-full bg-bg-primary rounded-xl transition-all overflow-hidden",
                  showDateMenu ? "ring-1 ring-accent-primary/50" : ""
                )}
              >
                <button
                  type="button"
                  onClick={() => setShowDateMenu(!showDateMenu)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs text-text-primary hover:bg-bg-secondary/40 cursor-pointer transition-colors text-left"
                >
                  <span className="font-medium truncate">{currentDateOption.label}</span>
                  <ChevronDown
                    size={14}
                    className={twMerge(
                      "text-text-muted shrink-0 transition-transform duration-150",
                      showDateMenu ? "rotate-180 text-accent-primary" : ""
                    )}
                  />
                </button>

                {showDateMenu && (
                  <div className="animate-in fade-in duration-150">
                    <div className="mx-2.5 h-px bg-border-subtle/30 my-0.5" />
                    <div className="max-h-44 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                      {DATE_FORMAT_OPTIONS.map((opt) => {
                        const isSelected = settings.dateFormat === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              updateSettings({ dateFormat: opt.value });
                              setShowDateMenu(false);
                            }}
                            className={twMerge(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left",
                              isSelected
                                ? "bg-bg-secondary text-text-primary font-medium"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-secondary/60"
                            )}
                          >
                            <span className="truncate">{opt.label}</span>
                            {isSelected && <Check size={12} className="text-accent-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Time Format Selector */}
            <div className="space-y-1.5" ref={timeMenuRef}>
              <label className="text-[11px] font-medium text-text-secondary flex items-center gap-1">
                <Clock size={12} className="text-accent-primary" />
                <span>Format Jam ({"{{time}}"})</span>
              </label>

              <div 
                className={twMerge(
                  "w-full bg-bg-primary rounded-xl transition-all overflow-hidden",
                  showTimeMenu ? "ring-1 ring-accent-primary/50" : ""
                )}
              >
                <button
                  type="button"
                  onClick={() => setShowTimeMenu(!showTimeMenu)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs text-text-primary hover:bg-bg-secondary/40 cursor-pointer transition-colors text-left"
                >
                  <span className="font-medium truncate">{currentTimeOption.label}</span>
                  <ChevronDown
                    size={14}
                    className={twMerge(
                      "text-text-muted shrink-0 transition-transform duration-150",
                      showTimeMenu ? "rotate-180 text-accent-primary" : ""
                    )}
                  />
                </button>

                {showTimeMenu && (
                  <div className="animate-in fade-in duration-150">
                    <div className="mx-2.5 h-px bg-border-subtle/30 my-0.5" />
                    <div className="max-h-44 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                      {TIME_FORMAT_OPTIONS.map((opt) => {
                        const isSelected = settings.timeFormat === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              updateSettings({ timeFormat: opt.value });
                              setShowTimeMenu(false);
                            }}
                            className={twMerge(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left",
                              isSelected
                                ? "bg-bg-secondary text-text-primary font-medium"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-secondary/60"
                            )}
                          >
                            <span className="truncate">{opt.label}</span>
                            {isSelected && <Check size={12} className="text-accent-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Padded Divider */}
      <div className="px-4"><div className="border-t border-border-subtle" /></div>

      {/* 4. Collapsible Supported Variables Cheat Sheet */}
      <div className="p-3.5 sm:p-4 space-y-2">
        <button
          type="button"
          onClick={() => setShowVariablesGuide(!showVariablesGuide)}
          className="w-full flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent-primary" />
            <span>Variabel Dinamis yang Didukung</span>
          </div>
          <ChevronDown
            size={14}
            className={`text-text-muted transition-transform duration-200 ${
              showVariablesGuide ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showVariablesGuide && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
            <div className="p-2 rounded-lg bg-bg-primary">
              <code className="font-mono font-bold text-accent-primary block">{"{{title}}"}</code>
              <span className="text-text-muted">Judul catatan target</span>
            </div>
            <div className="p-2 rounded-lg bg-bg-primary">
              <code className="font-mono font-bold text-accent-primary block">{"{{date}}"}</code>
              <span className="text-text-muted">Tanggal sesuai format</span>
            </div>
            <div className="p-2 rounded-lg bg-bg-primary">
              <code className="font-mono font-bold text-accent-primary block">{"{{time}}"}</code>
              <span className="text-text-muted">Jam sesuai format</span>
            </div>
            <div className="p-2 rounded-lg bg-bg-primary">
              <code className="font-mono font-bold text-accent-primary block">{"{{datetime}}"}</code>
              <span className="text-text-muted">Tanggal & jam lengkap</span>
            </div>
            <div className="p-2 rounded-lg bg-bg-primary">
              <code className="font-mono font-bold text-accent-primary block">{"{{folder}}"}</code>
              <span className="text-text-muted">Folder tempat note</span>
            </div>
            <div className="p-2 rounded-lg bg-bg-primary">
              <code className="font-mono font-bold text-accent-primary block">{"{{weekday}}"}</code>
              <span className="text-text-muted">Hari (Senin, Selasa...)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
