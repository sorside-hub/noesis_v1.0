import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MoreVertical } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { FileNode } from '../../../types/vault';

interface FileTreeItemProps {
  node: FileNode;
  isFolder: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  subCount: number;
  isOverThisFolder: boolean;
  handleItemClick: (node: FileNode) => void;
  handleOpenMenu: (node: FileNode, e: React.MouseEvent) => void;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  isFolder,
  isExpanded,
  isSelected,
  subCount,
  isOverThisFolder,
  handleItemClick,
  handleOpenMenu,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: { node },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: { node },
  });

  // Combine refs for element that can be both dragged and dropped upon
  const setCombinedRef = (element: HTMLElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  const isHighlighted = isOver || (isFolder && isOverThisFolder);

  return (
    <div
      ref={setCombinedRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) {
          handleItemClick(node);
        }
      }}
      className={twMerge(
        'group relative flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 select-none touch-manipulation',
        isSelected
          ? 'bg-accent-primary text-text-inverse font-medium shadow-xs'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
        isDragging && 'opacity-30 scale-95',
        isHighlighted && 'bg-accent-primary/20 border-2 border-accent-primary/60 shadow-[0_0_10px_rgba(255,255,255,0.08)]'
      )}
    >
      <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
        {/* Chevron / Toggle arrow for folders */}
        {isFolder ? (
          <span className="p-0.5 -ml-0.5 text-icon-accent transition-transform duration-150 shrink-0">
            {isExpanded ? (
              <ChevronDown size={13} className="text-icon-accent" />
            ) : (
              <ChevronRight size={13} className="text-icon-accent group-hover:text-text-primary" />
            )}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen size={14} className="text-icon-accent shrink-0 transition-colors" />
          ) : (
            <Folder size={14} className="text-icon-accent group-hover:text-text-primary shrink-0 transition-colors" />
          )
        ) : (
          <FileText
            size={14}
            className={twMerge(
              'shrink-0 transition-colors',
              isSelected ? 'text-text-inverse' : 'text-icon-accent group-hover:text-text-primary'
            )}
          />
        )}

        {/* Name */}
        <span
          className={twMerge(
            'truncate text-xs',
            isSelected ? 'text-text-inverse font-medium' : 'text-text-secondary group-hover:text-text-primary'
          )}
        >
          {node.name}
        </span>
      </div>

      {/* Right side: dedicated vertical 3-dots option button */}
      <div className="flex items-center gap-1 shrink-0 ml-1">
        <button
          type="button"
          title="Opsi"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenMenu(node, e);
          }}
          className={twMerge(
            "p-1 rounded transition-colors cursor-pointer",
            isSelected
              ? "text-text-inverse/80 hover:text-text-inverse hover:bg-black/15"
              : "text-icon-accent hover:text-text-primary hover:bg-bg-hover"
          )}
        >
          <MoreVertical size={13} />
        </button>
      </div>
    </div>
  );
};
