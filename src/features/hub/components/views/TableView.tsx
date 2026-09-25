import React from 'react';
import { EnrichedNoteItem } from '../../types';
import { FileText, Clock, Tag } from 'lucide-react';
import { DynamicFilter, getPropertyLabel } from '../HubFilterBar';

interface TableViewProps {
  notes: EnrichedNoteItem[];
  filters?: DynamicFilter[];
  onOpenNote: (id: string) => void;
}

// Simple date formatter since we don't have date-fns
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const TableView: React.FC<TableViewProps> = ({ notes, filters = [], onOpenNote }) => {
  // Extract unique property names from active filters
  const dynamicProperties = Array.from(new Set(filters.map(f => f.property)));

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
        {notes.map((note) => (
          <div 
            key={note.id}
            onClick={() => onOpenNote(note.id)}
            className="group flex flex-col gap-2 p-3.5 bg-bg-surface rounded-xl hover:bg-bg-hover/80 shadow-2xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start gap-2">
              <FileText 
                size={15} 
                className="text-text-muted mt-0.5 shrink-0 group-hover:text-accent-primary transition-colors" 
              />
              <span className="font-semibold text-text-primary text-sm line-clamp-2 leading-tight">
                {note.title || 'Tanpa Judul'}
              </span>
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
        ))}
      </div>

      {/* Desktop Table Layout (>= md) */}
      <div className="hidden md:block w-full overflow-x-auto rounded-xl bg-bg-surface shadow-xs custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-bg-secondary text-text-primary text-xs font-semibold border-b border-border-default">
              <th className="py-3 px-4 w-[25%] min-w-[200px]">Title</th>
              <th className="py-3 px-4 flex-1">AI Summary</th>
              <th className="py-3 px-4 w-[15%] min-w-[120px]">Updated</th>
              {dynamicProperties.map(prop => (
                <th key={prop} className="py-3 px-4 w-[12%] min-w-[120px] capitalize">
                  {getPropertyLabel(prop)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/30">
            {notes.map((note) => (
              <tr 
                key={note.id} 
                onClick={() => onOpenNote(note.id)}
                className="group hover:bg-bg-hover transition-colors cursor-pointer text-sm"
              >
                {/* Title */}
                <td className="py-3 px-4 align-top">
                  <div className="flex items-center gap-2">
                    <FileText 
                      size={15} 
                      className="text-text-muted shrink-0 group-hover:text-accent-primary transition-colors" 
                    />
                    <span className="font-medium text-text-primary truncate" title={note.title}>{note.title || 'Tanpa Judul'}</span>
                  </div>
                </td>
                
                {/* AI Summary */}
                <td className="py-3 px-4 text-xs text-text-secondary align-top">
                  <div className="line-clamp-2 leading-relaxed">
                    {note.summary || <span className="text-text-muted/50 italic">Belum ada analisis AI...</span>}
                  </div>
                </td>
                
                {/* Updated At with bg-bg-primary badge */}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
