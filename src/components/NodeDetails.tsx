import { Fragment, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Link } from 'react-router-dom';
import type { TreeIndex, TreeNode } from '../types/tree';
import { formatBytes } from '../lib/formatBytes';
import { nodeUrl } from '../lib/nodeUrl';
import { Icon } from './Icon';

export function NodeDetails({ node, tree, search }: { node: TreeNode; tree: TreeIndex; search: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const children = node.childrenIds;
  const breadcrumbs = [node];
  let parent = node.parentId ? tree.nodes.get(node.parentId) : undefined;
  while (parent && breadcrumbs.length < 3) {
    breadcrumbs.unshift(parent);
    parent = parent.parentId ? tree.nodes.get(parent.parentId) : undefined;
  }
  const abbreviated = breadcrumbs[0].id !== tree.rootId;
  if (abbreviated) breadcrumbs.unshift(tree.nodes.get(tree.rootId)!);
  const virtualizer = useVirtualizer({
    count: children.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });
  useEffect(() => { virtualizer.scrollToOffset(0); }, [node.id, virtualizer]);

  return <section className="details" aria-labelledby="node-title">
    <div className="details-topline"><span className="eyebrow">{node.type === 'folder' ? 'FOLDER DETAILS' : 'FILE DETAILS'}</span>
      <span className="type-tag">{node.type === 'folder' ? 'Folder' : 'File'}</span></div>
    <div className={`details-icon ${node.type}`}><Icon name={node.type} /></div>
    <h2 id="node-title">{node.name}</h2>
    <nav className="breadcrumbs" aria-label="Node path" title={node.path}>
      {breadcrumbs.map((crumb, index) => <Fragment key={crumb.id}>
        {index > 0 && <span aria-hidden="true">{abbreviated && index === 1 ? '/ … /' : '/'}</span>}
        {crumb.id === node.id ? <span className="breadcrumb-current" aria-current="page">{crumb.name}</span>
          : <Link to={nodeUrl(crumb.path, search)} title={crumb.path}>{crumb.name}</Link>}
      </Fragment>)}
    </nav>
    <dl className="metadata">
      <div><dt>{node.type === 'folder' ? 'Total size' : 'File size'}</dt>
        <dd>{formatBytes(node.totalSize)}</dd></div>
      {node.type === 'folder' && <div><dt>Direct children</dt><dd>{children.length.toLocaleString('en-US')}</dd></div>}
      {node.type === 'file' && <div title="Containing folders below the root, excluding the root itself.">
        <dt>Folders below root</dt><dd><strong>{(node.depth - 1).toLocaleString('en-US')}</strong></dd>
      </div>}
      <div className="metadata-path"><dt>Full path</dt><dd>{node.path}</dd></div>
    </dl>
    {node.parentId && <Link className="parent-link" to={nodeUrl(node.parentId, search)}>← Parent folder</Link>}
    {node.type === 'folder' && <div className="children-section">
      <div className="section-label"><h3>Folder contents</h3><span>{children.length.toLocaleString('en-US')}</span></div>
      {children.length === 0 ? <div className="empty-folder"><Icon name="folder" /><p>This folder is empty.</p></div>
        : <div className="children-scroll" ref={scrollRef} role="list" aria-label="Folder contents">
          <div className="virtual-content" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map(row => {
              const child = tree.nodes.get(children[row.index])!;
              return <div role="listitem" key={child.id} className="virtual-row" aria-setsize={children.length}
                aria-posinset={row.index + 1} style={{ height: 48, transform: `translateY(${row.start}px)` }}>
                <Link className="child-link" to={nodeUrl(child.path, search)}><Icon name={child.type}
                  className={child.type === 'folder' ? 'folder-icon' : 'file-icon'} />
                  <span>{child.name}</span><small>{child.type === 'folder'
                    ? `${child.childrenIds.length.toLocaleString('en-US')} ${child.childrenIds.length === 1 ? 'item' : 'items'}`
                    : formatBytes(child.size)}</small>
                  <Icon name="chevron" /></Link>
              </div>;
            })}
          </div>
        </div>}
    </div>}
  </section>;
}
