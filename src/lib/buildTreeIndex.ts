import type { TreeIndex, TreeNode } from '../types/tree';

export function parseTreeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Invalid JSON. Check quotes, commas, and brackets.');
  }
}

export function buildTreeIndex(input: unknown): TreeIndex {
  const nodes = new Map<string, TreeNode>();
  const orderedNodes: TreeNode[] = [];
  const seen = new WeakSet<object>();
  const stack: { value: unknown; parent: TreeNode | null }[] = [{ value: input, parent: null }];

  while (stack.length) {
    const { value, parent } = stack.pop()!;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Each node must be an object.');
    }
    if (seen.has(value)) throw new Error('The tree contains a cycle or a repeated object.');
    seen.add(value);
    const record = value as Record<string, unknown>;
    const { name, type, size, children } = record;
    if (typeof name !== 'string' || !name.trim() || name === '.' || name === '..'
      || /[/\\\u0000-\u001f\u007f]/u.test(name)) {
      throw new Error('Names must be nonempty path segments without /, \\, or control characters, and cannot be "." or "..".');
    }
    try {
      encodeURIComponent(name);
    } catch {
      throw new Error('The name contains invalid Unicode characters.');
    }
    if (type !== 'file' && type !== 'folder') throw new Error(`"${name}": type must be file or folder.`);
    if (!parent && type !== 'folder') throw new Error('The root must be a folder.');
    if (type === 'folder' && !Array.isArray(children)) {
      throw new Error(`Folder "${name}" must have a children array, which can be empty.`);
    }
    if (type === 'file' && (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 0)) {
      throw new Error(`File "${name}" must have a size in bytes that is a nonnegative safe integer.`);
    }
    if (type === 'file' && 'children' in record) throw new Error(`File "${name}" cannot have children.`);
    const path = parent ? `${parent.path}/${name}` : name;
    if (nodes.has(path)) throw new Error(`Duplicate path "${path}". Sibling names must be unique.`);
    const fileSize = type === 'file' ? size as number : 0;
    const node: TreeNode = {
      id: path, name, path, type, size: fileSize, totalSize: fileSize,
      depth: parent ? parent.depth + 1 : 0, parentId: parent?.id ?? null, childrenIds: [],
    };
    nodes.set(node.id, node);
    orderedNodes.push(node);
    parent?.childrenIds.push(node.id);
    if (Array.isArray(children)) {
      for (let index = children.length - 1; index >= 0; index--) {
        stack.push({ value: children[index], parent: node });
      }
    }
  }

  for (let index = orderedNodes.length - 1; index >= 0; index--) {
    const node = orderedNodes[index];
    if (node.parentId !== null) {
      const parent = nodes.get(node.parentId)!;
      parent.totalSize += node.totalSize;
      if (!Number.isSafeInteger(parent.totalSize)) throw new Error('The total size exceeds the safe integer range.');
    }
  }
  return { rootId: orderedNodes[0].id, nodes, orderedNodes };
}
