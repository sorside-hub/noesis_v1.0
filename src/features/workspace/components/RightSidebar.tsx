import React, { useRef, useState } from 'react';
import {
  SlidersVertical,
  Network,
  CheckSquare,
  ListTree,
  Sparkles,
  Bot,
  Link2,
} from 'lucide-react';
import { FileNode, VaultData, NoteMetadata } from '../../../types/vault';
import { useRightSidebarLogic, RightSidebarTab } from '../hooks/useRightSidebarLogic';
import { PropertiesTab } from './PropertiesTab';
import { LocalGraphTab } from './localGraph/LocalGraphTab';
import { TasksTab } from './TasksTab';
import { OutlineTab } from './OutlineTab';
import { DistilTab } from './DistilTab';
import { ChatTab } from './ChatTab';
import { LinksTab } from './LinksTab';
import { RightSidebarTabSwitcher } from './RightSidebarTabSwitcher';
import { AutoDetectModal } from './AutoDetectModal';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';

interface RightSidebarProps {
  vault: VaultData;
  activeNode: FileNode | null;
  isOpen: boolean;
  onClose?: () => void;
  onSelectFile: (id: string) => void;
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
  updateNoteContent?: (id: string, content: string) => void;
  updateNodeTitle?: (id: string, title: string) => void;
  createFolder?: (parentId: string | null, name: string) => string | null;
  moveNode?: (nodeId: string, newParentId: string | null) => void;
  onNavigateToHeading?: (lineIndex: number, text: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  vault,
  activeNode,
  isOpen,
  onClose,
  onSelectFile,
  onUpdateMetadata,
  updateNoteContent,
  updateNodeTitle,
  createFolder,
  moveNode,
  onNavigateToHeading,
}) => {
  const [activeTab, setActiveTab] = useState<RightSidebarTab>('PROPERTIES');
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const tabMenuRef = useRef<HTMLDivElement>(null);
  const { isKeyboardOpen } = useVirtualKeyboard();

  const {
    folderName,
    noteType,
    status,
    tags,
    aliases,
    stats,
    formattedCreated,
    formattedModified,
    isSyncingRag,
    ragSyncStatus,
    aiMetadata,
    handleTypeChange,
    handleStatusChange,
    handleTagsChange,
    handleAliasesChange,
    handleCustomPropertiesChange,
    handleProcessRag,
    handleRemoveRag,
    outlineHeadings,
    collapsedHeadingIndices,
    setCollapsedHeadingIndices,
    toggleHeadingCollapse,
    backlinks,
    outgoingLinks,
    semanticLinks,
    isSemanticLoading,
    isDistiling,
    distilError,
    distilHtml,
    distilLog,
    handleGenerateDistil,
    handleDistilClick,
    handleUpdateContent,
    isAutoDetecting,
    autoDetectError,
    autoDetectResult,
    autoDetectLog,
    isAutoDetectModalOpen,
    setIsAutoDetectModalOpen,
    handleRunAutoDetect,
    handleApplyAutoDetect,
    existingTags,
    existingNoteTypes,
    existingCustomPropertyKeys,
    existingCustomPropertyValuesByKey,
  } = useRightSidebarLogic({
    vault,
    activeNode,
    onSelectFile,
    onUpdateMetadata,
    updateNoteContent,
    updateNodeTitle,
    createFolder,
    moveNode,
    onNavigateToHeading,
  });

  // Metadata accessors
  const metadata: NoteMetadata = activeNode?.metadata || {};

  // Tab definitions
  const tabs: { id: RightSidebarTab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'PROPERTIES', label: 'Properties', icon: SlidersVertical },
    { id: 'LOCAL_GRAPH', label: 'Local Graph', icon: Network },
    { id: 'TASKS', label: 'Tasks', icon: CheckSquare },
    { id: 'OUTLINE', label: 'Outline', icon: ListTree },
    { id: 'DISTIL', label: 'Distil AI', icon: Sparkles },
    { id: 'CHAT', label: 'Copilot', icon: Bot },
    { id: 'LINKS', label: 'Links', icon: Link2 },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-full h-full flex flex-col bg-bg-secondary relative overflow-hidden select-none">
      {/* MAIN BODY CONTENT */}
      <div
        className={`flex-1 ${
          activeTab === 'LOCAL_GRAPH'
            ? 'overflow-hidden flex flex-col p-0 pb-[4.5rem]'
            : activeTab === 'CHAT'
            ? isKeyboardOpen
              ? 'overflow-hidden flex flex-col p-4 pb-3'
              : 'overflow-hidden flex flex-col p-4 pb-16'
            : isKeyboardOpen
            ? 'overflow-y-auto p-4 space-y-3 pb-3'
            : 'overflow-y-auto p-4 space-y-3 pb-28'
        }`}
      >
        {!activeNode ? (
          <div className="h-full flex items-center justify-center text-center text-text-muted text-sm py-24">
            Tidak ada catatan aktif yang dipilih.
          </div>
        ) : (
          <>
            {/* TAB 1: PROPERTIES */}
            {activeTab === 'PROPERTIES' && (
              <PropertiesTab
                activeNode={activeNode}
                folderName={folderName}
                noteType={noteType}
                status={status}
                tags={tags}
                aliases={aliases}
                isSyncingRag={isSyncingRag}
                ragSyncStatus={ragSyncStatus}
                aiMetadata={aiMetadata}
                formattedCreated={formattedCreated}
                formattedModified={formattedModified}
                stats={stats}
                isAutoDetecting={isAutoDetecting}
                autoDetectError={autoDetectError}
                existingTags={existingTags}
                existingNoteTypes={existingNoteTypes}
                existingCustomPropertyKeys={existingCustomPropertyKeys}
                existingCustomPropertyValuesByKey={existingCustomPropertyValuesByKey}
                handleTypeChange={handleTypeChange}
                handleStatusChange={handleStatusChange}
                handleTagsChange={handleTagsChange}
                handleAliasesChange={handleAliasesChange}
                handleCustomPropertiesChange={handleCustomPropertiesChange}
                handleProcessRag={handleProcessRag}
                handleRemoveRag={handleRemoveRag}
                handleRunAutoDetect={handleRunAutoDetect}
              />
            )}

            {/* TAB 2: LOCAL GRAPH */}
            {activeTab === 'LOCAL_GRAPH' && (
              <LocalGraphTab
                vault={vault}
                activeNode={activeNode}
                onSelectFile={onSelectFile}
              />
            )}

            {/* TAB 3: TASKS & CHECKLIST */}
            {activeTab === 'TASKS' && (
              <TasksTab
                activeNode={activeNode}
                onUpdateContent={handleUpdateContent}
                onNavigateToLine={onNavigateToHeading}
              />
            )}

            {/* TAB 3: OUTLINE */}
            {activeTab === 'OUTLINE' && (
              <OutlineTab
                outlineHeadings={outlineHeadings}
                collapsedHeadingIndices={collapsedHeadingIndices}
                setCollapsedHeadingIndices={setCollapsedHeadingIndices}
                toggleHeadingCollapse={toggleHeadingCollapse}
                onNavigateToHeading={onNavigateToHeading}
              />
            )}

            {/* TAB 4: DISTIL */}
            {activeTab === 'DISTIL' && (
              <DistilTab
                activeNode={activeNode}
                isDistiling={isDistiling}
                distilError={distilError}
                distilHtml={distilHtml}
                distilLog={distilLog}
                distilResult={metadata.distilResult as string | undefined}
                onGenerateDistil={handleGenerateDistil}
                onDistilClick={handleDistilClick}
              />
            )}

            {/* TAB 5: CHAT */}
            {activeTab === 'CHAT' && (
              <ChatTab activeNode={activeNode} onUpdateMetadata={onUpdateMetadata} />
            )}

            {/* TAB 6: LINKS */}
            {activeTab === 'LINKS' && (
              <LinksTab
                activeNodeName={activeNode.name}
                backlinks={backlinks}
                outgoingLinks={outgoingLinks}
                semanticLinks={semanticLinks}
                isSemanticLoading={isSemanticLoading}
                onSelectFile={onSelectFile}
              />
            )}
          </>
        )}
      </div>

      {/* FLOATING ROUNDED PILL TAB SWITCHER */}
      <RightSidebarTabSwitcher
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTabMenuOpen={isTabMenuOpen}
        setIsTabMenuOpen={setIsTabMenuOpen}
        tabMenuRef={tabMenuRef}
        isKeyboardOpen={isKeyboardOpen}
        tabs={tabs}
      />

      {/* AUTO-DETECT CONFIRMATION MODAL */}
      <AutoDetectModal
        isOpen={isAutoDetectModalOpen}
        onClose={() => setIsAutoDetectModalOpen(false)}
        result={autoDetectResult}
        cascadeLog={autoDetectLog}
        onApply={handleApplyAutoDetect}
      />
    </aside>
  );
};
