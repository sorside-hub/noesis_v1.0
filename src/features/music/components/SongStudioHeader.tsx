import React, { useState } from 'react';
import { 
  ArrowLeft, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { PRODUCTION_STAGES, MusicProductionStatus } from '../types';

interface SongStudioHeaderProps {
  title: string;
  onBack: () => void;
  status: MusicProductionStatus;
  onUpdateStatus: (status: MusicProductionStatus) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const SongStudioHeader: React.FC<SongStudioHeaderProps> = ({
  title,
  onBack,
  status,
  onUpdateStatus,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const currentStage = PRODUCTION_STAGES.find((s) => s.id === status) || PRODUCTION_STAGES[0];

  return (
    <header className="flex flex-col bg-bg-secondary border-b border-border-default/20 select-none text-xs shrink-0">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        {/* Left: Back + Title + Status */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            title="Kembali ke Music Hub"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg-primary text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-text-heading truncate">
                {title || 'Untitled Song'}
              </h2>

              {/* Status Badge Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${currentStage.bgLight} ${currentStage.color}`}
                >
                  <span>{currentStage.icon}</span>
                  <span className="hidden sm:inline">{currentStage.label}</span>
                  <ChevronDown size={10} />
                </button>

                {showStatusMenu && (
                  <div 
                    className="absolute left-0 top-full mt-1 w-36 bg-bg-secondary rounded-xl shadow-xl p-1 z-50 ring-1 ring-border-default/40 backdrop-blur-md"
                    onMouseLeave={() => setShowStatusMenu(false)}
                  >
                    {PRODUCTION_STAGES.map((stage) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          onUpdateStatus(stage.id);
                          setShowStatusMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          status === stage.id
                            ? 'bg-accent-primary text-accent-contrast font-medium'
                            : 'text-text-primary hover:bg-bg-hover'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{stage.icon}</span>
                          <span>{stage.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Tools: Studio Sidebar Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Tutup Panel Studio' : 'Buka Panel Studio'}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isSidebarOpen
                ? 'bg-accent-primary text-accent-contrast font-bold shadow-xs'
                : 'bg-bg-primary text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
