import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TreeNode } from '../types/tree';
import { Icon } from './Icon';

type Props = {
  query: string;
  results: TreeNode[];
  onChange: (query: string) => void;
  onSelect: (id: string) => void;
};

export function Search({ query, results, onChange, onSelect }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(Boolean(query.trim()));
  const [activeIndex, setActiveIndex] = useState(0);
  const visible = open && Boolean(query.trim());
  const getItemKey = useCallback((index: number) => results[index].id, [results]);
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    getItemKey,
    overscan: 6,
    enabled: visible,
  });

  useEffect(() => {
    setActiveIndex(0);
    virtualizer.scrollToOffset(0);
  }, [results, virtualizer]);

  useEffect(() => {
    if (!visible) return;
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [visible]);

  function choose(id: string) {
    setOpen(false);
    onSelect(id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter' && visible) {
      if (results[activeIndex]) choose(results[activeIndex].id);
      event.preventDefault();
      return;
    }
    let nextIndex = activeIndex;
    switch (event.key) {
      case 'ArrowDown': nextIndex = visible ? Math.min(results.length - 1, activeIndex + 1) : 0; break;
      case 'ArrowUp': nextIndex = visible ? Math.max(0, activeIndex - 1) : results.length - 1; break;
      case 'Home': if (!visible) return; nextIndex = 0; break;
      case 'End': if (!visible) return; nextIndex = results.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setOpen(true);
    if (results.length) {
      setActiveIndex(nextIndex);
      virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
    }
  }

  const rows = virtualizer.getVirtualItems();
  const activeMounted = rows.some(row => row.index === activeIndex);

  return <div ref={rootRef} className="search" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <div className="search-box">
      <Icon name="search" />
      <input ref={inputRef} type="search" role="combobox" aria-label="Search the entire tree"
        aria-autocomplete="list" aria-expanded={visible} aria-controls={visible ? listId : undefined}
        aria-activedescendant={visible && activeMounted ? `${listId}-${activeIndex}` : undefined}
        placeholder="Search files and folders…" value={query} onFocus={() => setOpen(true)}
        onChange={event => { onChange(event.target.value); setOpen(true); }} onKeyDown={handleKeyDown} />
      {query && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => {
        onChange('');
        setOpen(false);
        inputRef.current?.focus();
      }}>×</button>}
    </div>
    {visible && <div className="search-dropdown">
      <div className="search-results-heading" role="status">Results: {results.length.toLocaleString('en-US')}</div>
      <div ref={scrollRef} id={listId} role="listbox" aria-label="Search results" className="search-results-scroll"
        style={{ height: Math.min(results.length * 56 || 112, 280) }}>
        {results.length === 0 ? <div className="empty-search"><strong>No results</strong>
          <p>Try a different file or folder name.</p></div>
          : <div className="virtual-content" style={{ height: virtualizer.getTotalSize() }}>
            {rows.map(row => {
              const node = results[row.index];
              return <div key={row.key} id={`${listId}-${row.index}`} role="option" aria-label={node.path}
                aria-selected={row.index === activeIndex} aria-posinset={row.index + 1} aria-setsize={results.length}
                className={`virtual-row search-result${row.index === activeIndex ? ' active' : ''}`}
                style={{ height: 56, transform: `translateY(${row.start}px)` }} title={node.path}
                onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActiveIndex(row.index)}
                onClick={() => choose(node.id)}>
                <Icon name={node.type} className={node.type === 'folder' ? 'folder-icon' : 'file-icon'} />
                <span className="row-text"><span className="row-name">{node.name}</span>
                  <span className="row-path">{node.path}</span></span>
              </div>;
            })}
          </div>}
      </div>
    </div>}
  </div>;
}
