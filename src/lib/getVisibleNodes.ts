import type { TreeIndex, TreeNode } from '../types/tree';

export function getVisibleNodes(tree: TreeIndex, expanded: ReadonlySet<string>): TreeNode[] {
  const visible: TreeNode[] = [];
  const stack = [tree.rootId];
  while (stack.length) {
    const node = tree.nodes.get(stack.pop()!)!;
    visible.push(node);
    if (expanded.has(node.id)) {
      for (let index = node.childrenIds.length - 1; index >= 0; index--) stack.push(node.childrenIds[index]);
    }
  }
  return visible;
}
