import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TreeIndex, TreeNode } from '../types/tree';
import { TreeRow } from './TreeRow';

type Props = {
  tree: TreeIndex;
  nodes: TreeNode[];
  expanded: ReadonlySet<string>;
  selectedId: string | null;
  scrollRef: RefObject<HTMLDivElement>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
};

export function FileTree({ tree, nodes, expanded, selectedId, scrollRef, onToggle, onSelect }: Props) {
  const previousSelection = useRef<string | null>();
  const [activeId, setActiveId] = useState<string | null>(selectedId);
  const getItemKey = useCallback((index: number) => nodes[index].id, [nodes]);
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 32,
    getItemKey,
    overscan: 6,
    paddingStart: 6,
    paddingEnd: 6,
  });
  const viewportHeight = virtualizer.scrollRect?.height;

  useEffect(() => {
    const selectionChanged = previousSelection.current !== selectedId;
    const targetId = selectionChanged ? selectedId : activeId;
    const targetIndex = nodes.findIndex(node => node.id === targetId);
    if (selectionChanged && selectedId && targetIndex < 0 && tree.nodes.has(selectedId)) return;
    previousSelection.current = selectedId;
    setActiveId(targetIndex >= 0 ? targetId : nodes[0]?.id ?? null);
    if (nodes.length) virtualizer.scrollToIndex(Math.max(0, targetIndex), { align: 'auto' });
    else virtualizer.scrollToOffset(0);
  }, [activeId, selectedId, nodes, tree, virtualizer, viewportHeight]);

  const select = useCallback((id: string) => {
    setActiveId(id);
    onSelect(id);
  }, [onSelect]);

  const toggle = useCallback((id: string) => {
    setActiveId(id);
    onToggle(id);
  }, [onToggle]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = Math.max(0, nodes.findIndex(node => node.id === activeId));
    const current = nodes[index];
    if (!current) return;
    let nextIndex = index;
    switch (event.key) {
      case 'ArrowDown': nextIndex = Math.min(nodes.length - 1, index + 1); break;
      case 'ArrowUp': nextIndex = Math.max(0, index - 1); break;
      case 'Home': nextIndex = 0; break;
      case 'End': nextIndex = nodes.length - 1; break;
      case 'ArrowRight':
        if (current.type === 'folder') {
          if (!expanded.has(current.id)) onToggle(current.id);
          else if (current.childrenIds.length) nextIndex = index + 1;
        }
        break;
      case 'ArrowLeft':
        if (current.type === 'folder' && expanded.has(current.id)) onToggle(current.id);
        else nextIndex = Math.max(0, nodes.findIndex(node => node.id === current.parentId));
        break;
      case 'Enter': select(current.id); break;
      case ' ':
        if (current.type === 'folder') onToggle(current.id);
        else select(current.id);
        break;
      default: return;
    }
    event.preventDefault();
    setActiveId(nodes[nextIndex].id);
    virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
  }

  const virtualRows = virtualizer.getVirtualItems();
  const activeMounted = virtualRows.some(row => nodes[row.index].id === activeId);

  return <>
    <div className="tree-scroll" ref={scrollRef} role="tree" aria-label="File tree"
      tabIndex={0} aria-activedescendant={activeMounted && activeId ? `node-${encodeURIComponent(activeId)}` : undefined}
      onFocus={event => { if (event.target === event.currentTarget) setActiveId(selectedId); }}
      onKeyDown={handleKeyDown} onMouseDown={event => event.currentTarget.focus({ preventScroll: true })}>
      <div className="virtual-content" style={{ height: virtualizer.getTotalSize() }}>
          {virtualRows.map(row => {
            const node = nodes[row.index];
            return <div key={row.key} className="virtual-row" style={{ height: 32, transform: `translateY(${row.start}px)` }}>
              <TreeRow node={node} expanded={expanded.has(node.id)} selected={node.id === selectedId}
                active={node.id === activeId} onToggle={toggle} onSelect={select} />
            </div>;
          })}
      </div>
    </div>
    <div className="tree-status" aria-live="polite">
      <span>Visible: <strong>{nodes.length.toLocaleString('en-US')}</strong></span>
      <span>Total: <strong>{tree.nodes.size.toLocaleString('en-US')}</strong></span>
    </div>
  </>;
}
