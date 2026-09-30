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
import { PRODUCTION_STAGES, SongItem, MusicProductionStatus } from '../types';
import { MusicKanbanColumn } from './MusicKanbanColumn';
import { MusicKanbanCard } from './MusicKanbanCard';

interface MusicKanbanPipelineProps {
  songs: SongItem[];
  onSelectSong: (songId: string) => void;
  onUpdateStatus: (songId: string, status: MusicProductionStatus) => void;
  onCreateSongInStage?: (stage: MusicProductionStatus) => void;
}

export const MusicKanbanPipeline: React.FC<MusicKanbanPipelineProps> = ({
  songs,
  onSelectSong,
  onUpdateStatus,
  onCreateSongInStage,
}) => {
  const [activeDragSong, setActiveDragSong] = useState<SongItem | null>(null);
  
  // Smooth Auto-scroll state & refs (matching BoardView / InboxTriageView)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const currentPointerPosRef = useRef<{ clientX: number; clientY: number } | null>(null);

  // Sensors for smooth drag & drop:
  // MouseSensor: 5px distance to differentiate click vs drag
  // TouchSensor: 200ms hold delay and 6px tolerance to allow normal scrolling on mobile until intentionally held
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

  // --- SMOOTH AUTO-SCROLL LOOP DURING DRAGGING ---
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
        const edgeThreshold = 70; // 70px threshold from left / right container edges
        const maxSpeed = 14; // Smooth maximum px per frame

        // Check horizontal distance from container edges
        if (pointer.clientX > rect.right - edgeThreshold) {
          // Near right edge -> scroll right smoothly
          const proximity = Math.min(1, Math.max(0, (pointer.clientX - (rect.right - edgeThreshold)) / edgeThreshold));
          const speed = Math.ceil(proximity * maxSpeed);
          container.scrollLeft += Math.max(2, speed);
        } else if (pointer.clientX < rect.left + edgeThreshold) {
          // Near left edge -> scroll left smoothly
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

  // Track global pointer movement while dragging to feed smooth auto-scroll loop
  useEffect(() => {
    if (!activeDragSong) {
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
  }, [activeDragSong, startAutoScroll, stopAutoScroll]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const songId = active.id as string;
    const foundSong = songs.find((s) => s.id === songId);
    if (foundSong) {
      setActiveDragSong(foundSong);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragSong(null);
    stopAutoScroll();

    if (!over) return;

    const activeSongId = active.id as string;
    const overId = over.id as string;

    // Check if dropped directly onto a column stage
    const targetStage = PRODUCTION_STAGES.find((s) => s.id === overId);
    if (targetStage) {
      const draggedSong = songs.find((s) => s.id === activeSongId);
      if (draggedSong && draggedSong.status !== targetStage.id) {
        onUpdateStatus(activeSongId, targetStage.id);
      }
      return;
    }

    // Check if dropped onto another card in a column
    const overSong = songs.find((s) => s.id === overId);
    if (overSong) {
      const draggedSong = songs.find((s) => s.id === activeSongId);
      if (draggedSong && draggedSong.status !== overSong.status) {
        onUpdateStatus(activeSongId, overSong.status);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragSong(null);
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
          const stageSongs = songs.filter((s) => s.status === stage.id);

          return (
            <MusicKanbanColumn
              key={stage.id}
              stageId={stage.id}
              label={stage.label}
              icon={stage.icon}
              songs={stageSongs}
              onSelectSong={onSelectSong}
              onUpdateStatus={onUpdateStatus}
              onCreateSongInStage={onCreateSongInStage}
            />
          );
        })}
      </div>

      {/* Floating Drag Overlay */}
      <DragOverlay dropAnimation={{
        duration: 180,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeDragSong ? (
          <div className="w-72 sm:w-80">
            <MusicKanbanCard
              song={activeDragSong}
              onSelectSong={() => {}}
              isDraggingOverlay={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
