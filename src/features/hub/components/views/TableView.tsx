import React, { useState, useEffect } from 'react';
import { EnrichedNoteItem } from '../../types';
import { FileText, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { DynamicFilter, getPropertyLabel } from '../HubFilterBar';
import { RAGPipeline, RagSyncStatus } from '../../../rag/services/ragPipeline';

interface TableViewProps {
  notes: EnrichedNoteItem[];
  filters?: DynamicFilter[];
  onOpenNote: (id: string) => void;
  onDeleteNote?: (id: string) => void;
}

// Simple date formatter
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Component for AI Status Dot with Tooltip
const TableAiStatusDot: React.FC<{ status: RagSyncStatus | null }> = ({ status }) => {
  if (!status) return null;

  let dotColor = 'bg-neutral-400 dark:bg-neutral-500';
  let title = 'AI: Belum diproses';
  if (status === 'synced') {
    dotColor = 'bg-emerald-500';
    title = 'AI: Up to date';
  } else if (status === 'out_of_sync') {
    dotColor = 'bg-amber-500';
    title = 'AI: Butuh pembaruan sinkronisasi';
  } else if (status === 'error') {
    dotColor = 'bg-rose-500';
    title = 'AI: Gagal sinkronisasi';
  }

  return (
    <div 
      className={`w-2 h-2 rounded-full shrink-0 ${dotColor} shadow-[0_0_6px_rgba(0,0,0,0.15)]`}
      title={title}
    />
  );
};

export const TableView: React.FC<TableViewProps> = ({ notes, filters = [], onOpenNote, onDeleteNote }) => {
  // Extract unique property names from active filters
  const dynamicProperties = Array.from(new Set(filters.map(f => f.property)));

  // Batch query RAG sync status for all visible notes
  const [ragStatuses, setRagStatuses] = useState<Record<string, RagSyncStatus>>({});
  const [deletingNote, setDeletingNote] = useState<EnrichedNoteItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    const rag = new RAGPipeline();

    const fetchStatuses = async () => {
      const results: Record<string, RagSyncStatus> = {};
      await Promise.all(
        notes.map(async (note) => {
          try {
            const status = await rag.getSyncStatus(note.id, note.node?.content || '');
            results[note.id] = status;
          } catch {
            results[note.id] = 'unprocessed';
          }
        })
      );
      if (isMounted) {
        setRagStatuses(results);
      }
    };

    if (notes.length > 0) {
      fetchStatuses();
    }

    return () => {
      isMounted = false;
    };
  }, [notes]);

  const handleConfirmDelete = () => {
    if (deletingNote && onDeleteNote) {
      onDeleteNote(deletingNote.id);
      setDeletingNote(null);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-text-muted bg-bg-surface/40 rounded-2xl shadow-2xs">
        <FileText size={32} className="mb-3 opacity-40" />
        <p className="text-sm">Tidak ada catatan yang ditemukan.</p>
      </div>
    );
  }

  const renderDynamicCell = (note: EnrichedNoteItem, prop: string) => {
    let val = note.properties?.[prop];
    if (val === undefined || val === null) {
      val = (note as any)[prop];
    }
    if ((val === undefined || val === null) && prop === 'type') {
      val = note.type || note.properties?.['noteType'];
    }

    if (val === undefined || val === null || val === '') {
      return <span className="text-text-muted/50 text-xs italic">-</span>;
    }

    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1">
          {val.slice(0, 3).map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-bg-primary text-text-secondary shadow-2xs truncate max-w-[80px]">
              {String(item)}
            </span>
          ))}
          {val.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary text-text-muted shadow-2xs">
              +{val.length - 3}
            </span>
          )}
        </div>
      );
    }

    if (typeof val === 'boolean') {
      return <span className="text-xs text-text-secondary">{val ? 'Yes' : 'No'}</span>;
    }

    if (prop === 'status') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium shadow-2xs ${
          val === 'Completed' ? 'bg-status-success-bg text-status-success' :
          val === 'In Progress' ? 'bg-status-info-bg text-status-info' :
          val === 'Inbox' ? 'bg-status-warning-bg text-status-warning' :
          val === 'Inbox (Refine)' ? 'bg-purple-500/15 text-purple-300' :
          val === 'Inbox (Keeper)' ? 'bg-emerald-500/15 text-emerald-300' :
          'bg-bg-primary text-text-muted'
        }`}>
          {String(val)}
        </span>
      );
    }

    return <span className="text-xs text-text-secondary capitalize line-clamp-1">{String(val)}</span>;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Mobile Card Layout (< md) */}
      <div className="md:hidden flex flex-col gap-3">
        {notes.map((note) => {
          const status = ragStatuses[note.id] || null;
          return (
            <div 
              key={note.id}
              onClick={() => onOpenNote(note.id)}
              className="group flex flex-col gap-2 p-3.5 bg-bg-surface rounded-xl hover:bg-bg-hover/80 shadow-2xs hover:shadow-md transition-all cursor-pointer relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <TableAiStatusDot status={status} />
                  <FileText 
                    size={15} 
                    className="text-text-muted shrink-0 group-hover:text-accent-primary transition-colors" 
                  />
                  <span className="font-semibold text-text-primary text-sm line-clamp-2 leading-tight">
                    {note.title || 'Tanpa Judul'}
                  </span>
                </div>

                {onDeleteNote && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingNote(note);
                    }}
                    className="p-1.5 text-text-muted hover:text-status-error hover:bg-status-error-bg rounded-lg transition-colors shrink-0"
                    title="Hapus Catatan"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                {note.summary || <span className="text-text-muted/50 italic">Belum ada analisis AI...</span>}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 text-[10px] text-text-muted bg-bg-primary px-2 py-0.5 rounded-md shadow-2xs">
                  <Clock size={10} className="opacity-70" />
                  <span>{formatDate(note.updatedAt)}</span>
                </div>
                
                {dynamicProperties.map(prop => (
                  <div key={prop} className="flex items-center gap-1 text-[10px]">
                    <span className="opacity-50 text-text-muted capitalize">{getPropertyLabel(prop)}:</span>
                    {renderDynamicCell(note, prop)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout (>= md) */}
      <div className="hidden md:block w-full overflow-x-auto rounded-xl bg-bg-surface shadow-xs custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-bg-secondary text-text-primary text-xs font-semibold border-b border-border-default">
              <th className="py-3 px-4 w-[28%] min-w-[220px]">Title</th>
              <th className="py-3 px-4 flex-1 min-w-[200px]">AI Summary</th>
              <th className="py-3 px-4 w-[14%] min-w-[110px]">Updated</th>
              {dynamicProperties.map(prop => (
                <th key={prop} className="py-3 px-4 w-[12%] min-w-[110px] capitalize">
                  {getPropertyLabel(prop)}
                </th>
              ))}
              {onDeleteNote && (
                <th className="py-3 px-3 w-[60px] text-center">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/30">
            {notes.map((note) => {
              const status = ragStatuses[note.id] || null;
              return (
                <tr 
                  key={note.id} 
                  onClick={() => onOpenNote(note.id)}
                  className="group hover:bg-bg-hover transition-colors cursor-pointer text-sm"
                >
                  {/* Title & AI Status Dot */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-center gap-2.5">
                      <TableAiStatusDot status={status} />
                      <FileText 
                        size={15} 
                        className="text-text-muted shrink-0 group-hover:text-accent-primary transition-colors" 
                      />
                      <span className="font-medium text-text-primary truncate" title={note.title}>
                        {note.title || 'Tanpa Judul'}
                      </span>
                    </div>
                  </td>
                  
                  {/* AI Summary */}
                  <td className="py-3 px-4 text-xs text-text-secondary align-top">
                    <div className="line-clamp-2 leading-relaxed">
                      {note.summary || <span className="text-text-muted/50 italic">Belum ada analisis AI...</span>}
                    </div>
                  </td>
                  
                  {/* Updated At */}
                  <td className="py-3 px-4 text-xs text-text-muted align-top">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-bg-primary shadow-2xs">
                      <Clock size={11} className="opacity-70 shrink-0" />
                      <span>{formatDate(note.updatedAt)}</span>
                    </div>
                  </td>

                  {/* Dynamic Columns */}
                  {dynamicProperties.map(prop => (
                    <td key={prop} className="py-3 px-4 align-top pt-3.5">
                      {renderDynamicCell(note, prop)}
                    </td>
                  ))}

                  {/* Action Column (Delete) */}
                  {onDeleteNote && (
                    <td className="py-3 px-3 align-top text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setDeletingNote(note)}
                        className="p-1.5 text-text-muted opacity-40 group-hover:opacity-100 hover:text-status-error hover:bg-status-error-bg rounded-lg transition-all cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingNote && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeletingNote(null)}
        >
          <div
            className="w-full max-w-sm bg-bg-surface border-0 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-status-error">
              <div className="p-2 rounded-xl bg-status-error-bg">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-heading">
                  Hapus Catatan?
                </h3>
                <p className="text-[11px] text-text-muted">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Apakah kamu yakin ingin menghapus catatan{' '}
              <strong className="text-text-primary">&quot;{deletingNote.title || 'Tanpa Judul'}&quot;</strong>? Catatan akan dihapus secara permanen dari vault.
            </p>

            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-medium bg-status-error text-white hover:bg-status-error/90 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
