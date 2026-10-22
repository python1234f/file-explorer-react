import { useEffect, useState } from 'react';
import demoUrl from '../data/demo.json?url';
import { buildTreeIndex, parseTreeJson } from '../lib/buildTreeIndex';
import { loadTree, saveTree } from '../lib/storage';

export function useFileTree() {
  const [{ tree, warning, revision, loading, isDemo }, setState] = useState(() => {
    const saved = loadTree();
    return { ...saved, revision: 0, loading: !saved.tree, isDemo: !saved.tree };
  });

  useEffect(() => {
    if (tree) return;
    const controller = new AbortController();

    async function loadDemo() {
      try {
        const response = await fetch(demoUrl, { signal: controller.signal });
        if (!response.ok) throw new Error('Could not load the demo file.');
        const nextTree = buildTreeIndex(parseTreeJson(await response.text()));
        if (!controller.signal.aborted) {
          setState(previous => previous.tree ? previous : { ...previous, tree: nextTree, loading: false });
        }
      } catch {
        if (!controller.signal.aborted) {
          setState(previous => previous.tree ? previous : {
            ...previous, loading: false, warning: 'Could not load the demo file. Upload a JSON file or paste a structure instead.',
          });
        }
      }
    }

    void loadDemo();
    return () => controller.abort();
  }, [tree]);

  function importTree(input: unknown) {
    const nextTree = buildTreeIndex(input);
    saveTree(nextTree);
    setState(previous => ({ tree: nextTree, warning: null, revision: previous.revision + 1, loading: false, isDemo: false }));
  }

  return { tree, warning, importTree, revision, loading, isDemo };
}
