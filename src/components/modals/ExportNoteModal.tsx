import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, 
  FileDown, 
  FileCode, 
  Printer, 
  Copy, 
  Check, 
  X,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { FileNode } from '../../types/vault';
import { 
  exportNoteAsMarkdown, 
  exportNoteAsPDF, 
  exportNoteAsDocx, 
  exportNoteAsHTML, 
  copyNoteAsMarkdown 
} from '../../lib/exportUtils';

interface ExportNoteModalProps {
  node: FileNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportNoteModal: React.FC<ExportNoteModalProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  if (!isOpen || !node) return null;

  const handleCopyMarkdown = async () => {
    const ok = await copyNoteAsMarkdown(node);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async (type: 'md' | 'pdf' | 'docx' | 'html') => {
    setExportingType(type);
    try {
      if (type === 'md') exportNoteAsMarkdown(node);
      if (type === 'pdf') await exportNoteAsPDF(node);
      if (type === 'docx') await exportNoteAsDocx(node);
      if (type === 'html') exportNoteAsHTML(node);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setTimeout(() => {
        setExportingType(null);
        onClose();
      }, 400);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="w-full max-w-md bg-bg-primary rounded-2xl shadow-2xl overflow-hidden border-0 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-bg-primary shrink-0 border-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-bg-secondary text-accent-primary shrink-0 border-0">
              <FileDown size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text-primary truncate">Export Catatan</h2>
              <p className="text-[11px] text-text-muted truncate">{node.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary bg-bg-secondary hover:bg-bg-hover transition-colors cursor-pointer border-0 shrink-0"
            title="Tutup (Esc)"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Export Formats Grid */}
        <div className="px-5 pb-3 pt-1 space-y-2 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-xs text-text-muted mb-2 font-normal">
            Pilih format file untuk mengunduh atau menyalin catatan ini:
          </p>

          {/* Markdown Option */}
          <button
            type="button"
            onClick={() => handleExport('md')}
            disabled={exportingType !== null}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors text-left group cursor-pointer border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 shrink-0 border-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary">
                  Markdown (.md)
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Format teks murni standar PKM dengan metadata frontmatter
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-text-muted group-hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              Unduh →
            </span>
          </button>

          {/* PDF Option */}
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={exportingType !== null}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors text-left group cursor-pointer border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 shrink-0 border-0">
                {exportingType === 'pdf' ? <Loader2 size={18} className="animate-spin text-rose-500" /> : <Printer size={18} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary">
                  PDF Document (.pdf)
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {exportingType === 'pdf' ? 'Sedang memproses & mengunduh PDF...' : 'Dokumen siap simpan & cetak dengan tipografi rapi'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-text-muted group-hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              {exportingType === 'pdf' ? 'Membuat...' : 'Unduh PDF →'}
            </span>
          </button>

          {/* Word Option */}
          <button
            type="button"
            onClick={() => handleExport('docx')}
            disabled={exportingType !== null}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors text-left group cursor-pointer border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500 shrink-0 border-0">
                <FileSpreadsheet size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary">
                  Microsoft Word (.docx)
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Dokumen .docx kompatibel langsung dengan Google Docs & MS Word
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-text-muted group-hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              Unduh →
            </span>
          </button>

          {/* HTML Option */}
          <button
            type="button"
            onClick={() => handleExport('html')}
            disabled={exportingType !== null}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors text-left group cursor-pointer border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0 border-0">
                <FileCode size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary">
                  Halaman Web Mandiri (.html)
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Dokumen HTML interaktif dengan styling responsif mandiri
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-text-muted group-hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              Unduh →
            </span>
          </button>

          {/* Copy to Clipboard Option */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors text-left group cursor-pointer border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-bg-primary text-text-secondary shrink-0 border-0">
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary">
                  {copied ? 'Tersalin ke Clipboard!' : 'Salin sebagai Markdown'}
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {copied ? 'Markdown siap ditempel' : 'Salin teks mentah berformat ke clipboard'}
                </div>
              </div>
            </div>
            {copied ? (
              <span className="text-[11px] font-semibold text-emerald-500 shrink-0 ml-2">
                Tersalin!
              </span>
            ) : (
              <span className="text-[11px] font-medium text-text-muted group-hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                Salin →
              </span>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-bg-primary flex justify-end shrink-0 border-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer border-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
