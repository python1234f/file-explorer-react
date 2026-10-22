import type { TreeNode } from '../types/tree';

export function searchNodes(nodes: readonly TreeNode[], query: string): TreeNode[] {
  const phrase = query.trim().toLowerCase();
  if (!phrase) return [];
  return nodes.filter(node => node.name.toLowerCase().includes(phrase));
}
