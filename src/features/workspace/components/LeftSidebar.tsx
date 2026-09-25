import React, { useState, useMemo } from 'react';
import { X, Search, FileText, Folder, Hash, FolderTree, Bookmark, Star, SlidersHorizontal } from 'lucide-react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { twMerge } from 'tailwind-merge';
import { VaultData } from '../../../types/vault';
import { useLeftSidebarLogic } from '../hooks/useLeftSidebarLogic';
import { treeCollisionDetection } from '../hooks/useTreeDnd';
import { LeftSidebarContextMenu } from './LeftSidebarContextMenu';
import { DeleteNodeModal } from './DeleteNodeModal';
import { MoveNodeModal } from './MoveNodeModal';
import { RenameNodeModal } from './RenameNodeModal';
import { CreateFolderModal } from './CreateFolderModal';
import { FileTree } from './FileTree';
import { TagExplorer } from './TagExplorer';
import { PropertiesExplorer } from './PropertiesExplorer';
import { BookmarksExplorer } from './BookmarksExplorer';
import { LeftSidebarTabSwitcher } from './LeftSidebarTabSwitcher';
import { BookmarkModal } from './BookmarkModal';
import { ExportNoteModal } from '../../../components/modals/ExportNoteModal';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';
import { FileNode } from '../../../types/vault';
import { TagNodeData } from '../utils/tagUtils';

interface LeftSidebarProps {
  vault: VaultData;
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onOpenInNewTab: (id: string) => void;
  onCreateNote: (parentId?: string | null) => void;
  onCreateFolder: (parentId?: string | null, name?: string) => void;
  onDuplicateNote?: (id: string) => void;
  onRenameNode: (id: string, newName: string) => void;
  onMoveNode: (id: string, targetParentId: string | null) => void;
  onDeleteNode: (id: string) => void;
  setNodeBookmark?: (nodeId: string, bookmark: import('../../../types/vault').BookmarkMeta | null) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  vault,
  activeFileId,
  onSelectFile,
  onOpenInNewTab,
  onCreateNote,
  onCreateFolder,
  onDuplicateNote,
  onRenameNode,
  onMoveNode,
  onDeleteNode,
  setNodeBookmark,
  isOpen: _isOpen,
  onCloseMobile,
}) => {
  const { isKeyboardOpen } = useVirtualKeyboard();

  const {
    activeTab,
    setActiveTab,
    tagData,
    propertiesData,
    bookmarksData,
    expandedFolders,
    isTreeSearchOpen,
    setIsTreeSearchOpen,
    treeSearchQuery,
    setTreeSearchQuery,
    treeSearchInputRef,
    searchContainerRef,
    activeMenuNode,
    menuPosition,
    renamingNode,
    renameValue,
    setRenameValue,
    renameInputRef,
    movingNode,
    folderSearchQuery,
    setFolderSearchQuery,
    folderSearchInputRef,
    nodeToDelete,
    creatingFolderTarget,
    creatingFolderParentName,
    newFolderName,
    setNewFolderName,
    createFolderInputRef,
    isNewFolderDuplicate,
    handleStartCreateFolder,
    handleExecuteCreateFolder,
    isInputFocused,
    setIsInputFocused,
    areAllFoldersExpanded: _areAllFoldersExpanded,
    areAllFoldersCollapsed,
    handleToggleExpandCollapseAll,
    getChildren,
    handleOpenMenu,
    closeActiveDialog,
    handleItemClick,
    handleStartRename,
    isRenameDuplicate,
    handleSaveRename,
    handleStartMove,
    handleExecuteMove,
    handleDelete,
    confirmDelete,
    handleCreateNoteInFolder,
    handleCreateSubfolderInFolder,
    getAvailableFolders,
    matchesSearch,
    isPillHidden: _isPillHidden,
    sensors,
    activeDragNode,
    overFolderId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useLeftSidebarLogic({
    vault,
    activeFileId,
    onSelectFile,
    onOpenInNewTab,
    onCreateNote,
    onCreateFolder,
    onRenameNode,
    onMoveNode,
    onDeleteNode,
    setNodeBookmark,
    onCloseMobile,
  });

  const [isCreatingBookmarkGroup, setIsCreatingBookmarkGroup] = useState(false);
  const [exportingNode, setExportingNode] = useState<FileNode | null>(null);

  // 1. State & handlers for Tag Explorer expand/collapse
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const allFullTagKeys = useMemo(() => {
    const keys: string[] = [];
    const traverse = (node: TagNodeData) => {
      keys.push(node.fullTag);
      Object.values(node.subTags).forEach(traverse);
    };
    Object.values(tagData.tagTree).forEach(traverse);
    return keys;
  }, [tagData.tagTree]);

  const areAllTagsExpanded = allFullTagKeys.length > 0 && allFullTagKeys.every((k) => expandedTags.has(k));
  const areAllTagsCollapsed = allFullTagKeys.length === 0 || expandedTags.size === 0;

  const handleToggleExpandCollapseAllTags = () => {
    if (areAllTagsExpanded) {
      setExpandedTags(new Set());
    } else {
      setExpandedTags(new Set(allFullTagKeys));
    }
  };

  // 2. State & handlers for Bookmarks Explorer group expand/collapse
  const [expandedBookmarkGroups, setExpandedBookmarkGroups] = useState<Set<string>>(new Set());

  const areAllBookmarkGroupsExpanded =
    bookmarksData.groups.length > 0 &&
    bookmarksData.groups.every((g) => expandedBookmarkGroups.has(g.id));
  const areAllBookmarkGroupsCollapsed =
    bookmarksData.groups.length === 0 || expandedBookmarkGroups.size === 0;

  const handleToggleExpandCollapseAllBookmarkGroups = () => {
    if (areAllBookmarkGroupsExpanded) {
      setExpandedBookmarkGroups(new Set());
    } else {
      setExpandedBookmarkGroups(new Set(bookmarksData.groups.map((g) => g.id)));
    }
  };

  // 3. State & handlers for Properties Explorer expand/collapse
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());

  const allPropertyIds = useMemo(() => {
    return [
      ...propertiesData.coreProperties.map((p) => p.id),
      ...propertiesData.customProperties.map((p) => p.id),
    ];
  }, [propertiesData]);

  const areAllPropertiesExpanded =
    allPropertyIds.length > 0 && allPropertyIds.every((id) => expandedProperties.has(id));
  const areAllPropertiesCollapsed =
    allPropertyIds.length === 0 || expandedProperties.size === 0;

  const handleToggleExpandCollapseAllProperties = () => {
    if (areAllPropertiesExpanded) {
      setExpandedProperties(new Set());
    } else {
      setExpandedProperties(new Set(allPropertyIds));
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-bg-secondary overflow-hidden select-none relative">
      {/* ----------------------------------------------------------- */}
      {/* SHARED SEARCH BAR (Context-aware: Files, Tags, Bookmarks, Props) */}
      {/* ----------------------------------------------------------- */}
      {isTreeSearchOpen && (
        <div ref={searchContainerRef} className="px-2.5 pt-2 pb-1.5 border-b border-border-subtle bg-bg-secondary z-10">
          <div className="relative">
            <Search
              size={13}
              className={twMerge(
                "absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
                treeSearchQuery || isInputFocused ? "text-accent-primary" : "text-icon-accent"
              )}
            />
            <input
              ref={treeSearchInputRef}
              type="text"
              value={treeSearchQuery}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onChange={(e) => setTreeSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsTreeSearchOpen(false);
                  setTreeSearchQuery('');
                  setIsInputFocused(false);
                }
              }}
              placeholder={
                activeTab === 'properties'
                  ? "Cari properti / catatan..."
                  : activeTab === 'bookmarks'
                  ? "Cari bookmark..."
                  : activeTab === 'tags'
                  ? "Cari tag / catatan..."
                  : "Cari file & folder..."
              }
              className="w-full pl-7 pr-6 py-1.5 bg-bg-primary rounded-lg text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/40 transition-colors"
            />
            <button
              type="button"
              title="Close search"
              onClick={() => {
                setIsTreeSearchOpen(false);
                setTreeSearchQuery('');
                setIsInputFocused(false);
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-icon-accent hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* CONTENT AREA: FILE TREE OR TAG EXPLORER OR PROPS OR BOOKMARKS */}
      {/* ----------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-2 pb-32 space-y-0.5 custom-scrollbar">
        {activeTab === 'files' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={treeCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <FileTree
              getChildren={getChildren}
              matchesSearch={matchesSearch}
              treeSearchQuery={treeSearchQuery}
              expandedFolders={expandedFolders}
              activeFileId={activeFileId}
              overFolderId={overFolderId}
              activeDragNode={activeDragNode}
              handleItemClick={handleItemClick}
              handleOpenMenu={handleOpenMenu}
              onQuickCreateNoteInFolder={(folderId) => onCreateNote(folderId)}
            />

            <DragOverlay>
              {activeDragNode ? (
                <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-bg-quaternary border-2 border-accent-primary text-text-primary text-xs font-semibold shadow-2xl scale-105 opacity-95 pointer-events-none">
                  {activeDragNode.type === 'folder' ? (
                    <Folder size={14} className="text-accent-primary" />
                  ) : (
                    <FileText size={14} className="text-accent-primary" />
                  )}
                  <span className="truncate max-w-[160px]">{activeDragNode.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : activeTab === 'tags' ? (
          <TagExplorer
            flatTags={tagData.flatTags}
            tagTree={tagData.tagTree}
            searchQuery={treeSearchQuery}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onCloseMobile={onCloseMobile}
            expandedTags={expandedTags}
            setExpandedTags={setExpandedTags}
          />
        ) : activeTab === 'properties' ? (
          <PropertiesExplorer
            propertiesData={propertiesData}
            searchQuery={treeSearchQuery}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onCloseMobile={onCloseMobile}
            expandedProperties={expandedProperties}
            setExpandedProperties={setExpandedProperties}
          />
        ) : (
          <BookmarksExplorer
            vault={vault}
            bookmarks={bookmarksData.bookmarks}
            groups={bookmarksData.groups}
            searchQuery={treeSearchQuery}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onCloseMobile={onCloseMobile}
            onRemoveBookmark={bookmarksData.removeBookmark}
            onOpenBookmarkModal={bookmarksData.openBookmarkModal}
            onUpdateBookmark={bookmarksData.updateBookmark}
            onCreateGroup={bookmarksData.createGroup}
            onRenameGroup={bookmarksData.renameGroup}
            onDeleteGroup={bookmarksData.deleteGroup}
            isCreatingGroupExternal={isCreatingBookmarkGroup}
            setIsCreatingGroupExternal={setIsCreatingBookmarkGroup}
            expandedGroups={expandedBookmarkGroups}
            setExpandedGroups={setExpandedBookmarkGroups}
          />
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* BOTTOM ACTION ICONS + FLOATING TAB SWITCHER PILL */}
      {/* ----------------------------------------------------------- */}
      <LeftSidebarTabSwitcher
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isKeyboardOpen={isKeyboardOpen}
        onCreateNote={onCreateNote}
        onCreateFolder={() => handleStartCreateFolder(null)}
        onCreateBookmarkGroup={() => {
          setIsCreatingBookmarkGroup(true);
        }}
        onCloseMobile={onCloseMobile}
        isTreeSearchOpen={isTreeSearchOpen}
        setIsTreeSearchOpen={setIsTreeSearchOpen}
        areAllFoldersCollapsed={areAllFoldersCollapsed}
        handleToggleExpandCollapseAll={handleToggleExpandCollapseAll}
        areAllTagsCollapsed={areAllTagsCollapsed}
        handleToggleExpandCollapseAllTags={handleToggleExpandCollapseAllTags}
        areAllGroupsCollapsed={areAllBookmarkGroupsCollapsed}
        handleToggleExpandCollapseAllGroups={handleToggleExpandCollapseAllBookmarkGroups}
        areAllPropertiesCollapsed={areAllPropertiesCollapsed}
        handleToggleExpandCollapseAllProperties={handleToggleExpandCollapseAllProperties}
      />

      {/* ----------------------------------------------------------- */}
      {/* CONTEXT MENU POPUP */}
      {/* ----------------------------------------------------------- */}
      <LeftSidebarContextMenu
        activeMenuNode={activeMenuNode}
        menuPosition={menuPosition}
        isBookmarked={activeMenuNode ? bookmarksData.isBookmarked(activeMenuNode.id) : false}
        onToggleBookmark={bookmarksData.openBookmarkModal}
        closeActiveDialog={closeActiveDialog}
        handleCreateNoteInFolder={handleCreateNoteInFolder}
        handleCreateSubfolderInFolder={handleCreateSubfolderInFolder}
        onOpenInNewTab={onOpenInNewTab}
        onCloseMobile={onCloseMobile}
        onDuplicateNote={onDuplicateNote ? (node) => onDuplicateNote(node.id) : undefined}
        handleStartRename={handleStartRename}
        handleStartMove={handleStartMove}
        handleExportNote={(node) => setExportingNode(node)}
        handleDelete={handleDelete}
      />

      {/* ----------------------------------------------------------- */}
      {/* BOOKMARK MODAL (OBSIDIAN STYLE) */}
      {/* ----------------------------------------------------------- */}
      <BookmarkModal
        isOpen={bookmarksData.isBookmarkModalOpen}
        onClose={bookmarksData.closeBookmarkModal}
        targetNode={bookmarksData.modalTargetNode}
        vault={vault}
        groups={bookmarksData.groups}
        isBookmarked={
          bookmarksData.modalTargetNode
            ? bookmarksData.isBookmarked(bookmarksData.modalTargetNode.id)
            : false
        }
        onSaveBookmark={bookmarksData.saveBookmark}
        onRemoveBookmark={bookmarksData.removeBookmark}
        onCreateGroup={bookmarksData.createGroup}
      />

      {/* ----------------------------------------------------------- */}
      {/* CREATE FOLDER MODAL */}
      {/* ----------------------------------------------------------- */}
      {creatingFolderTarget && (
        <CreateFolderModal
          parentFolderName={creatingFolderParentName}
          folderName={newFolderName}
          setFolderName={setNewFolderName}
          inputRef={createFolderInputRef}
          isDuplicate={isNewFolderDuplicate}
          setIsInputFocused={setIsInputFocused}
          closeActiveDialog={closeActiveDialog}
          handleCreateFolder={handleExecuteCreateFolder}
        />
      )}

      {/* ----------------------------------------------------------- */}
      {/* RENAME NODE MODAL */}
      {/* ----------------------------------------------------------- */}
      {renamingNode && (
        <RenameNodeModal
          renamingNode={renamingNode}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          renameInputRef={renameInputRef}
          isRenameDuplicate={isRenameDuplicate}
          setIsInputFocused={setIsInputFocused}
          closeActiveDialog={closeActiveDialog}
          handleSaveRename={handleSaveRename}
        />
      )}

      {/* ----------------------------------------------------------- */}
      {/* MOVE NODE MODAL */}
      {/* ----------------------------------------------------------- */}
      {movingNode && (
        <MoveNodeModal
          movingNode={movingNode}
          folderSearchQuery={folderSearchQuery}
          setFolderSearchQuery={setFolderSearchQuery}
          folderSearchInputRef={folderSearchInputRef}
          setIsInputFocused={setIsInputFocused}
          closeActiveDialog={closeActiveDialog}
          handleExecuteMove={handleExecuteMove}
          getAvailableFolders={getAvailableFolders}
        />
      )}

      {/* ----------------------------------------------------------- */}
      {/* DELETE NODE MODAL */}
      {/* ----------------------------------------------------------- */}
      {nodeToDelete && (
        <DeleteNodeModal
          nodeToDelete={nodeToDelete}
          closeActiveDialog={closeActiveDialog}
          confirmDelete={confirmDelete}
        />
      )}

      {/* ----------------------------------------------------------- */}
      {/* EXPORT NOTE MODAL */}
      {/* ----------------------------------------------------------- */}
      {exportingNode && (
        <ExportNoteModal
          node={exportingNode}
          isOpen={!!exportingNode}
          onClose={() => setExportingNode(null)}
        />
      )}
    </div>
  );
};
