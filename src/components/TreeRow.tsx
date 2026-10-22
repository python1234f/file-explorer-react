import { memo } from 'react';
import type { TreeNode } from '../types/tree';
import { formatBytes } from '../lib/formatBytes';
import { Icon } from './Icon';

type Props = {
  node: TreeNode;
  expanded: boolean;
  selected: boolean;
  active: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
};

export const TreeRow = memo(function TreeRow({ node, expanded, selected, active, onSelect, onToggle }: Props) {
  return <div id={`node-${encodeURIComponent(node.id)}`} role="treeitem" aria-level={node.depth + 1}
    aria-expanded={node.type === 'folder' ? expanded : undefined}
    aria-selected={selected} aria-label={node.name} title={node.path}
    className={`tree-row${selected ? ' selected' : ''}${active ? ' keyboard-active' : ''}`}
    style={{ paddingLeft: `min(${8 + Math.min(node.depth, 6) * 18}px, 25%)` }} onClick={() => onSelect(node.id)}>
    <span className="expander-slot">
      {node.type === 'folder' && <button type="button" tabIndex={-1}
        className={`expander${expanded ? ' expanded' : ''}`} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.name}`}
        onClick={event => { event.stopPropagation(); onToggle(node.id); }}><Icon name="chevron" /></button>}
    </span>
    <Icon name={node.type} className={node.type === 'folder' ? 'folder-icon' : 'file-icon'} />
    <span className="row-text"><span className="row-name">{node.name}</span></span>
    {node.depth > 6 && <span className="row-depth" title={`Depth: ${node.depth} (root: 0)`}
      aria-label={`Depth: ${node.depth}`}>↳ {node.depth}</span>}
    <span className="row-meta">{node.type === 'folder' ? node.childrenIds.length : formatBytes(node.size)}</span>
  </div>;
});
