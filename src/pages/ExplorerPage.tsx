import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FileTree } from '../components/FileTree';
import { NodeDetails } from '../components/NodeDetails';
import { Search } from '../components/Search';
import { Icon } from '../components/Icon';
import { getVisibleNodes } from '../lib/getVisibleNodes';
import { searchNodes } from '../lib/searchNodes';
import { nodeUrl, pathFromUrl } from '../lib/nodeUrl';
import type { TreeIndex } from '../types/tree';

function withAncestors(tree: TreeIndex, id: string | null, expanded = new Set<string>()): Set<string> {
  const next = new Set(expanded);
  next.add(tree.rootId);
  let node = id ? tree.nodes.get(id) : undefined;
  while (node?.parentId) {
    next.add(node.parentId);
    node = tree.nodes.get(node.parentId);
  }
  return next.size === expanded.size ? expanded : next;
}

export function ExplorerPage({ tree, isDemo }: { tree: TreeIndex; isDemo: boolean }) {
  const treeRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const path = pathFromUrl(location.pathname);
  const selected = tree.nodes.get(path ?? tree.rootId);
  const selectedId = selected?.id ?? null;
  const [expanded, setExpanded] = useState(() => withAncestors(tree, selectedId));
  const searching = Boolean(query.trim());

  useEffect(() => {
    setExpanded(previous => withAncestors(tree, selectedId, previous));
  }, [tree, selectedId]);

  useEffect(() => { treeRef.current?.focus({ preventScroll: true }); }, [selectedId]);

  const visibleNodes = useMemo(() => getVisibleNodes(tree, expanded), [tree, expanded]);
  const results = useMemo(() => searching ? searchNodes(tree.orderedNodes, query) : [], [tree, query, searching]);
  const toggle = useCallback((id: string) => {
    setExpanded(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const select = useCallback((id: string) => {
    setExpanded(previous => withAncestors(tree, id, previous));
    navigate(nodeUrl(id, location.search));
    treeRef.current?.focus({ preventScroll: true });
  }, [tree, navigate, location.search]);

  function updateQuery(value: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (value) next.set('q', value);
      else next.delete('q');
      return next;
    }, { replace: true });
  }

  return <div className="explorer-page">
    <div className="explorer-heading"><h1>Explorer</h1></div>
    <div className="explorer-panels">
      <section className="tree-panel" aria-labelledby="tree-heading">
        <div className="tree-panel-heading"><h2 id="tree-heading"><Icon name="folder" />{tree.nodes.get(tree.rootId)!.name}</h2>
          <button type="button" className="text-button" onClick={() => setExpanded(new Set([tree.rootId]))}>Collapse folders</button></div>
        <div className="tree-search"><Search query={query} results={results} onChange={updateQuery} onSelect={select} /></div>
        <div className="tree-list-heading"><span>FILE TREE</span><span>name / size</span></div>
        <FileTree tree={tree} nodes={visibleNodes} expanded={expanded} selectedId={selectedId}
          scrollRef={treeRef} onToggle={toggle} onSelect={select} />
      </section>
      <div className="details-panel">{selected ? <NodeDetails node={selected} tree={tree} search={location.search} />
        : <div className="missing-node"><Icon name="file" /><h2>Node not found</h2>
          <p>This path does not exist in the imported tree.</p><Link className="button secondary" to={`/tree${location.search}`}>Back to root</Link></div>}</div>
    </div>
    <p className="keyboard-hint"><span>↑ ↓ <span>navigate</span></span><span>← → <span>folders</span></span><span>Enter <span>details</span></span>
      <span className="saved-indicator"><Icon name="check" />{isDemo ? 'Demo JSON' : 'Saved locally'}</span></p>
  </div>;
}
