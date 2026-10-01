import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { PRODUCTION_STAGES, MusicReleaseItem, MusicProductionStatus } from '../types';
import { MusicKanbanColumn } from './MusicKanbanColumn';
import { MusicKanbanCard } from './MusicKanbanCard';

interface MusicKanbanPipelineProps {
  items: MusicReleaseItem[];
  onSelectItem: (item: MusicReleaseItem) => void;
  onRenameItem?: (item: MusicReleaseItem) => void;
  onUpdateStatus: (item: MusicReleaseItem, status: MusicProductionStatus) => void;
  onDeleteItem?: (item: MusicReleaseItem) => void;
}

export const MusicKanbanPipeline: React.FC<MusicKanbanPipelineProps> = ({
  items,
  onSelectItem,
  onRenameItem,
  onUpdateStatus,
  onDeleteItem,
}) => {
  const [activeDragItem, setActiveDragItem] = useState<MusicReleaseItem | null>(null);
  
  // Smooth Auto-scroll state & refs
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const currentPointerPosRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
    currentPointerPosRef.current = null;
  }, []);

  const startAutoScroll = useCallback(() => {
    const scrollStep = () => {
      const container = scrollContainerRef.current;
      const pointer = currentPointerPosRef.current;

      if (container && pointer) {
        const rect = container.getBoundingClientRect();
        const edgeThreshold = 70;
        const maxSpeed = 14;

        if (pointer.clientX > rect.right - edgeThreshold) {
          const proximity = Math.min(1, Math.max(0, (pointer.clientX - (rect.right - edgeThreshold)) / edgeThreshold));
          const speed = Math.ceil(proximity * maxSpeed);
          container.scrollLeft += Math.max(2, speed);
        } else if (pointer.clientX < rect.left + edgeThreshold) {
          const proximity = Math.min(1, Math.max(0, ((rect.left + edgeThreshold) - pointer.clientX) / edgeThreshold));
          const speed = Math.ceil(proximity * maxSpeed);
          container.scrollLeft -= Math.max(2, speed);
        }
      }

      autoScrollRafRef.current = requestAnimationFrame(scrollStep);
    };

    if (!autoScrollRafRef.current) {
      autoScrollRafRef.current = requestAnimationFrame(scrollStep);
    }
  }, []);

  useEffect(() => {
    if (!activeDragItem) {
      stopAutoScroll();
      return;
    }

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      currentPointerPosRef.current = { clientX, clientY };
    };

    startAutoScroll();
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      stopAutoScroll();
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [activeDragItem, startAutoScroll, stopAutoScroll]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const itemId = active.id as string;
    const foundItem = items.find((it) => it.id === itemId);
    if (foundItem) {
      setActiveDragItem(foundItem);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    stopAutoScroll();

    if (!over) return;

    const activeItemId = active.id as string;
    const overId = over.id as string;

    // Check if dropped directly onto a column stage
    const targetStage = PRODUCTION_STAGES.find((s) => s.id === overId);
    if (targetStage) {
      const draggedItem = items.find((it) => it.id === activeItemId);
      if (draggedItem && draggedItem.status !== targetStage.id) {
        onUpdateStatus(draggedItem, targetStage.id);
      }
      return;
    }

    // Check if dropped onto another card in a column
    const overItem = items.find((it) => it.id === overId);
    if (overItem) {
      const draggedItem = items.find((it) => it.id === activeItemId);
      if (draggedItem && draggedItem.status !== overItem.status) {
        onUpdateStatus(draggedItem, overItem.status);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
    stopAutoScroll();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto overflow-y-hidden pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full h-full min-h-0 items-stretch select-none"
      >
        {PRODUCTION_STAGES.map((stage) => {
          const stageItems = items.filter((it) => it.status === stage.id);

          return (
            <MusicKanbanColumn
              key={stage.id}
              stageId={stage.id}
              label={stage.label}
              icon={stage.icon}
              items={stageItems}
              onSelectItem={onSelectItem}
              onRenameItem={onRenameItem}
              onUpdateStatus={onUpdateStatus}
              onDeleteItem={onDeleteItem}
            />
          );
        })}
      </div>

      {/* Floating Drag Overlay */}
      <DragOverlay dropAnimation={{
        duration: 180,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeDragItem ? (
          <div className="w-72 sm:w-80">
            <MusicKanbanCard
              item={activeDragItem}
              onSelectItem={() => {}}
              isDraggingOverlay={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
