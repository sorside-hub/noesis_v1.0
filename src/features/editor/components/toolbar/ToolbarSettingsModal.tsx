import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Search,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { ToolbarItem, DEFAULT_TOOLBAR_ORDER } from './toolbarItems';

interface ToolbarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: ToolbarItem[];
  currentOrder: string[];
  currentHidden: string[];
  onUpdate: (order: string[], hidden: string[]) => void;
}

export const ToolbarSettingsModal: React.FC<ToolbarSettingsModalProps> = ({
  isOpen,
  onClose,
  tools,
  currentOrder,
  currentHidden,
  onUpdate,
}) => {
  const [order, setOrder] = useState<string[]>(currentOrder);
  const [hidden, setHidden] = useState<string[]>(currentHidden);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // Sync state when opened or props update
  useEffect(() => {
    if (isOpen) {
      setOrder(currentOrder);
      setHidden(currentHidden);
      setSearchQuery('');
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  }, [isOpen, currentOrder, currentHidden]);

  if (!isOpen) return null;

  // Build a lookup map of tools by id
  const toolMap = new Map<string, ToolbarItem>();
  tools.forEach((t) => toolMap.set(t.id, t));

  // Ensure all registered tools are in order array
  const fullOrder = [...order];
  tools.forEach((t) => {
    if (!fullOrder.includes(t.id)) {
      fullOrder.push(t.id);
    }
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fullOrder.length) return;

    const newOrder = [...fullOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setOrder(newOrder);
    onUpdate(newOrder, hidden);
  };

  const handleToggleVisibility = (id: string) => {
    const isCurrentlyHidden = hidden.includes(id);
    let newHidden: string[];
    if (isCurrentlyHidden) {
      newHidden = hidden.filter((h) => h !== id);
    } else {
      newHidden = [...hidden, id];
    }
    setHidden(newHidden);
    onUpdate(order, newHidden);
  };

  const handleResetToDefault = () => {
    setOrder(DEFAULT_TOOLBAR_ORDER);
    setHidden([]);
    onUpdate(DEFAULT_TOOLBAR_ORDER, []);
  };

  // Auto-scroll when dragging near top or bottom edges of the list container
  const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const container = listRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const edgeThreshold = 60; // 60px boundary from top or bottom

    if (offsetY < edgeThreshold && offsetY >= 0) {
      // Near top edge: scroll up proportionally
      const intensity = (edgeThreshold - offsetY) / edgeThreshold;
      container.scrollTop -= Math.max(3, Math.round(intensity * 14));
    } else if (rect.height - offsetY < edgeThreshold && offsetY <= rect.height) {
      // Near bottom edge: scroll down proportionally
      const intensity = (edgeThreshold - (rect.height - offsetY)) / edgeThreshold;
      container.scrollTop += Math.max(3, Math.round(intensity * 14));
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.dataTransfer.setDragImage) {
      const target = e.currentTarget as HTMLElement;
      e.dataTransfer.setDragImage(target, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...fullOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
    onUpdate(newOrder, hidden);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter items based on search query
  const filteredIndices = fullOrder
    .map((id, index) => ({ id, originalIndex: index }))
    .filter(({ id }) => {
      if (!searchQuery.trim()) return true;
      const tool = toolMap.get(id);
      if (!tool) return false;
      return tool.label.toLowerCase().includes(searchQuery.toLowerCase()) || id.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const visibleCount = fullOrder.length - hidden.length;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-bg-primary rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="toolbar-settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 bg-bg-primary">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-bg-secondary text-accent-primary shrink-0">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 id="toolbar-settings-title" className="text-base font-semibold text-text-primary leading-snug">
                Atur Urutan Toolbar
              </h2>
              <p className="text-xs text-text-muted">
                Geser (drag & drop) atau gunakan tombol panah untuk mengatur urutan tombol
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary bg-bg-secondary hover:bg-bg-hover rounded-xl transition-colors cursor-pointer"
            title="Tutup"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar Controls / Search & Reset */}
        <div className="px-5 py-2 bg-bg-primary flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tombol..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-bg-secondary rounded-xl text-text-primary placeholder:text-text-muted border-0 focus:outline-none focus:ring-1 focus:ring-accent-primary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-[11px] text-text-muted whitespace-nowrap">
              {visibleCount} dari {fullOrder.length} aktif
            </span>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-hover rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border-0"
              title="Kembalikan urutan awal toolbar"
            >
              <RotateCcw size={13} />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* List of items */}
        <div 
          ref={listRef}
          onDragOver={handleContainerDragOver}
          className="flex-1 overflow-y-auto px-5 py-3 space-y-2 bg-bg-primary custom-scrollbar"
        >
          {filteredIndices.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              Tidak ada tombol yang cocok dengan "{searchQuery}".
            </div>
          ) : (
            filteredIndices.map(({ id, originalIndex }) => {
              const tool = toolMap.get(id);
              if (!tool) return null;

              const isHidden = hidden.includes(id);
              const isDragging = draggedIndex === originalIndex;
              const isOver = dragOverIndex === originalIndex && draggedIndex !== originalIndex;
              const isFirst = originalIndex === 0;
              const isLast = originalIndex === fullOrder.length - 1;

              return (
                <div
                  key={id}
                  draggable={!searchQuery}
                  onDragStart={(e) => handleDragStart(e, originalIndex)}
                  onDragOver={(e) => handleDragOver(e, originalIndex)}
                  onDrop={(e) => handleDrop(e, originalIndex)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl transition-all ${
                    isDragging
                      ? 'opacity-40 bg-accent-primary/20 scale-[0.99]'
                      : isOver
                      ? 'bg-bg-hover ring-1 ring-accent-primary shadow-sm scale-[1.01]'
                      : isHidden
                      ? 'opacity-50 bg-bg-secondary/60'
                      : 'bg-bg-secondary hover:bg-bg-hover/80'
                  }`}
                >
                  {/* Left: Drag Handle, Index Badge & Tool Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Drag Grip Handle */}
                    <div 
                      className={`cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-primary transition-colors shrink-0 ${
                        searchQuery ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      title={searchQuery ? 'Hapus pencarian untuk drag & drop' : 'Tahan & geser untuk mengubah urutan'}
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* Order Number Badge */}
                    <span className="w-5 text-[11px] font-mono font-medium text-text-muted text-center shrink-0">
                      {originalIndex + 1}
                    </span>

                    {/* Tool Icon */}
                    <div className="w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center text-text-primary shrink-0 shadow-2xs">
                      {tool.icon}
                    </div>

                    {/* Tool Label & ID */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-medium truncate ${isHidden ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                          {tool.label}
                        </span>
                        {isHidden && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                            Disembunyikan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions (Up/Down Buttons & Visibility Toggle) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={isFirst || !!searchQuery}
                      onClick={() => handleMove(originalIndex, 'up')}
                      className="p-1.5 text-text-muted hover:text-text-primary bg-bg-primary/50 hover:bg-bg-primary rounded-lg transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                      title="Geser ke atas"
                      aria-label={`Geser ${tool.label} ke atas`}
                    >
                      <ChevronUp size={16} />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={isLast || !!searchQuery}
                      onClick={() => handleMove(originalIndex, 'down')}
                      className="p-1.5 text-text-muted hover:text-text-primary bg-bg-primary/50 hover:bg-bg-primary rounded-lg transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                      title="Geser ke bawah"
                      aria-label={`Geser ${tool.label} ke bawah`}
                    >
                      <ChevronDown size={16} />
                    </button>

                    <div className="w-[1px] h-4 bg-bg-hover mx-0.5" />

                    {/* Visibility Toggle (Eye / EyeOff) */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isHidden
                          ? 'text-text-muted hover:text-text-primary bg-bg-primary/50 hover:bg-bg-primary'
                          : 'text-accent-primary bg-bg-primary/50 hover:bg-bg-primary'
                      }`}
                      title={isHidden ? 'Tampilkan di toolbar' : 'Sembunyikan dari toolbar'}
                      aria-label={isHidden ? `Tampilkan ${tool.label}` : `Sembunyikan ${tool.label}`}
                    >
                      {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-bg-primary flex items-center justify-between shrink-0">
          <p className="text-[11px] text-text-muted hidden sm:block">
            Perubahan otomatis tersimpan dan aktif seketika.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold bg-accent-primary text-accent-contrast hover:opacity-90 rounded-xl transition-all flex items-center justify-center gap-1.5 ml-auto cursor-pointer shadow-xs border-0"
          >
            <Check size={15} />
            <span>Selesai</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
