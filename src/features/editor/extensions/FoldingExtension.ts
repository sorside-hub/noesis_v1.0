import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Node as PMNode } from '@tiptap/pm/model';

export const foldingPluginKey = new PluginKey('foldingPlugin');

interface FoldingState {
  foldedHeadings: Set<number>;
  foldedLists: Set<number>;
}

export const FoldingExtension = Extension.create({
  name: 'folding',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: foldingPluginKey,

        state: {
          init(): FoldingState {
            return {
              foldedHeadings: new Set<number>(),
              foldedLists: new Set<number>(),
            };
          },

          apply(tr, oldState): FoldingState {
            // Check if action was a fold toggle
            const meta = tr.getMeta(foldingPluginKey);
            if (meta) {
              return meta;
            }

            // If doc didn't change, keep existing state
            if (!tr.docChanged) {
              return oldState;
            }

            // Map folded positions across document edits
            const newHeadings = new Set<number>();
            const newLists = new Set<number>();

            oldState.foldedHeadings.forEach((pos: number) => {
              const mapped = tr.mapping.map(pos, -1);
              if (mapped < tr.doc.content.size) {
                const node = tr.doc.nodeAt(mapped);
                if (node && node.type.name === 'heading') {
                  newHeadings.add(mapped);
                }
              }
            });

            oldState.foldedLists.forEach((pos: number) => {
              const mapped = tr.mapping.map(pos, -1);
              if (mapped < tr.doc.content.size) {
                const node = tr.doc.nodeAt(mapped);
                if (node && ['listItem', 'taskItem', 'customTaskItem'].includes(node.type.name)) {
                  newLists.add(mapped);
                }
              }
            });

            return {
              foldedHeadings: newHeadings,
              foldedLists: newLists,
            };
          },
        },

        props: {
          decorations(state) {
            try {
              const pluginState = foldingPluginKey.getState(state) as FoldingState;
              if (!pluginState) return DecorationSet.empty;

              const { foldedHeadings, foldedLists } = pluginState;
              const decorations: Decoration[] = [];
              const doc = state.doc;

            // 1. Scan Top-Level Nodes for Headings & their Folding
            let currentFoldedHeadingLevel: number | null = null;

            doc.forEach((node: PMNode, offset: number) => {
              const nodePos = offset;

              if (node.type.name === 'heading') {
                const level = node.attrs.level || 1;

                // Check if previous folded heading scope ends here
                if (currentFoldedHeadingLevel !== null && level <= currentFoldedHeadingLevel) {
                  currentFoldedHeadingLevel = null;
                }

                // If currently inside a higher-level folded heading scope, hide this heading too
                if (currentFoldedHeadingLevel !== null) {
                  decorations.push(
                    Decoration.node(nodePos, nodePos + node.nodeSize, {
                      class: 'folded-hidden-content',
                      style: 'display: none !important;',
                    })
                  );
                  return;
                }

                const isFolded = foldedHeadings.has(nodePos);

                // Add Fold Gutter Widget for this Heading
                const headingFoldWidget = Decoration.widget(nodePos + 1, (view) => {
                  const btn = document.createElement('button');
                  btn.type = 'button';
                  btn.contentEditable = 'false';
                  btn.tabIndex = -1;
                  btn.className = `heading-fold-toggle ${isFolded ? 'is-folded' : 'is-expanded'}`;
                  btn.title = isFolded ? 'Buka bagian ini (Expand)' : 'Lipat bagian ini (Fold)';
                  btn.setAttribute('aria-label', isFolded ? 'Expand section' : 'Collapse section');

                  // Chevron SVG
                  btn.innerHTML = `
                    <svg class="fold-chevron-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  `;

                  const handleToggle = (e: MouseEvent | TouchEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentState = foldingPluginKey.getState(view.state) as FoldingState;
                    const nextHeadings = new Set(currentState.foldedHeadings);
                    if (nextHeadings.has(nodePos)) {
                      nextHeadings.delete(nodePos);
                    } else {
                      nextHeadings.add(nodePos);
                    }
                    const tr = view.state.tr.setMeta(foldingPluginKey, {
                      ...currentState,
                      foldedHeadings: nextHeadings,
                    });
                    view.dispatch(tr);
                  };

                  btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  });
                  btn.addEventListener('click', handleToggle);
                  btn.addEventListener('touchend', handleToggle);

                  return btn;
                }, { side: -1 });

                decorations.push(headingFoldWidget);

                if (isFolded) {
                  currentFoldedHeadingLevel = level;
                  decorations.push(
                    Decoration.node(nodePos, nodePos + node.nodeSize, {
                      class: 'is-folded-heading-node',
                    })
                  );

                  // Add ellipsis fold badge at the end of the folded heading (clean text without pill/box)
                  const badgeWidget = Decoration.widget(nodePos + node.nodeSize - 1, (view) => {
                    const badge = document.createElement('span');
                    badge.contentEditable = 'false';
                    badge.className = 'folded-heading-badge';
                    badge.textContent = ' ⋯';
                    badge.title = 'Bagian terlipat - klik untuk membuka';

                    const handleUnfold = (e: MouseEvent | TouchEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const currentState = foldingPluginKey.getState(view.state) as FoldingState;
                      const nextHeadings = new Set(currentState.foldedHeadings);
                      nextHeadings.delete(nodePos);
                      const tr = view.state.tr.setMeta(foldingPluginKey, {
                        ...currentState,
                        foldedHeadings: nextHeadings,
                      });
                      view.dispatch(tr);
                    };

                    badge.addEventListener('mousedown', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    });
                    badge.addEventListener('click', handleUnfold);
                    badge.addEventListener('touchend', handleUnfold);

                    return badge;
                  }, { side: 1 });

                  decorations.push(badgeWidget);
                }
              } else {
                // If we are within a folded heading's scope, hide this block
                if (currentFoldedHeadingLevel !== null) {
                  decorations.push(
                    Decoration.node(nodePos, nodePos + node.nodeSize, {
                      class: 'folded-hidden-content',
                      style: 'display: none !important;',
                    })
                  );
                }
              }
            });

            // 2. Scan Document for Nested List Items & List Folding
            doc.descendants((node: PMNode, pos: number) => {
              if (['listItem', 'taskItem', 'customTaskItem'].includes(node.type.name)) {
                let hasChildList = false;
                const isFolded = foldedLists.has(pos);

                node.forEach((child, childOffset) => {
                  if (['bulletList', 'orderedList', 'taskList'].includes(child.type.name)) {
                    hasChildList = true;
                    if (isFolded) {
                      const childListPos = pos + 1 + childOffset;
                      decorations.push(
                        Decoration.node(childListPos, childListPos + child.nodeSize, {
                          class: 'folded-hidden-list',
                          style: 'display: none !important;',
                        })
                      );
                    }
                  }
                });

                if (hasChildList) {
                  if (isFolded) {
                    // Add folded class to listItem (keeps bullet/number and highlights marker)
                    decorations.push(
                      Decoration.node(pos, pos + node.nodeSize, {
                        class: 'is-folded-list-item',
                      })
                    );
                  }

                  // Add List Fold Indicator Widget (Positioned in far-left margin gutter)
                  const listFoldWidget = Decoration.widget(pos + 1, (view) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.contentEditable = 'false';
                    btn.tabIndex = -1;
                    btn.className = `list-fold-toggle ${isFolded ? 'is-folded' : 'is-expanded'}`;
                    btn.title = isFolded ? 'Buka list (Expand)' : 'Lipat list (Fold)';
                    btn.setAttribute('aria-label', isFolded ? 'Expand list' : 'Collapse list');

                    // Obsidian style Chevron indicator
                    btn.innerHTML = `
                      <svg class="list-chevron-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    `;

                    const handleToggle = (e: MouseEvent | TouchEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const currentState = foldingPluginKey.getState(view.state) as FoldingState;
                      const nextLists = new Set(currentState.foldedLists);
                      if (nextLists.has(pos)) {
                        nextLists.delete(pos);
                      } else {
                        nextLists.add(pos);
                      }
                      const tr = view.state.tr.setMeta(foldingPluginKey, {
                        ...currentState,
                        foldedLists: nextLists,
                      });
                      view.dispatch(tr);
                    };

                    btn.addEventListener('mousedown', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    });
                    btn.addEventListener('click', handleToggle);
                    btn.addEventListener('touchend', handleToggle);

                    return btn;
                  }, { side: -1 });

                  decorations.push(listFoldWidget);
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          } catch (err) {
            return DecorationSet.empty;
          }
        },
        },
      }),
    ];
  },
});
