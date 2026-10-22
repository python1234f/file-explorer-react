import { buildTreeIndex, parseTreeJson } from './buildTreeIndex';
import type { InputNode, TreeIndex } from '../types/tree';

export const STORAGE_KEY = 'file-explorer.tree.v1';

export function serializeTree(tree: TreeIndex): string {
  const positions = new Map(tree.orderedNodes.map((node, index) => [node.id, index]));
  return JSON.stringify({
    version: 1,
    nodes: tree.orderedNodes.map(node => ({
      name: node.name, type: node.type, size: node.size,
      parent: node.parentId === null ? null : positions.get(node.parentId),
    })),
  });
}

export function deserializeTree(text: string): TreeIndex {
  const snapshot = parseTreeJson(text) as { version?: unknown; nodes?: unknown } | null;
  if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.nodes) || !snapshot.nodes.length) {
    throw new Error('Invalid saved tree format.');
  }
  const inputs: InputNode[] = [];
  for (const value of snapshot.nodes) {
    if (!value || typeof value !== 'object') throw new Error('The saved tree is corrupted.');
    const record = value as { name: string; type: 'file' | 'folder'; size: number; parent: unknown };
    const node: InputNode = record.type === 'folder'
      ? { name: record.name, type: record.type, children: [] }
      : { name: record.name, type: record.type, size: record.size };
    if (inputs.length === 0) {
      if (record.parent !== null) throw new Error('Invalid saved root.');
    } else {
      if (typeof record.parent !== 'number' || !Number.isInteger(record.parent)
        || record.parent < 0 || record.parent >= inputs.length) throw new Error('Invalid saved parent reference.');
      const parent = inputs[record.parent];
      if (parent.type !== 'folder') throw new Error('The parent must be a folder.');
      parent.children.push(node);
    }
    inputs.push(node);
  }
  return buildTreeIndex(inputs[0]);
}

export function loadTree(): { tree: TreeIndex | null; warning: string | null } {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return { tree: text ? deserializeTree(text) : null, warning: null };
  } catch {
    return { tree: null, warning: 'Could not restore the saved tree. Import it again and check that browser storage is available.' };
  }
}

export function saveTree(tree: TreeIndex): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeTree(tree));
  } catch {
    throw new Error('Could not save the tree. Browser storage is full or blocked. Free up storage, enable localStorage, or try a smaller file. The previous tree has not changed.');
  }
}
