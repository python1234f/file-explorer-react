import { describe, expect, it } from 'vitest';
import { buildTreeIndex, parseTreeJson } from './buildTreeIndex';
import { getVisibleNodes } from './getVisibleNodes';
import { searchNodes } from './searchNodes';

const fixture = {
  name: 'root', type: 'folder', children: [
    { name: 'src', type: 'folder', children: [
      { name: 'index.ts', type: 'file', size: 1024 },
      { name: 'components', type: 'folder', children: [{ name: 'Button.tsx', type: 'file', size: 512 }] },
    ] },
    { name: 'package.json', type: 'file', size: 300 },
    { name: 'empty', type: 'folder', children: [] },
  ],
};

describe('tree index', () => {
  it('preserves order, stable IDs, and depth, and calculates subtree sizes', () => {
    const tree = buildTreeIndex(fixture);
    expect(tree.rootId).toBe('root');
    expect(tree.nodes.size).toBe(7);
    expect(tree.nodes.get('root')?.childrenIds).toEqual(['root/src', 'root/package.json', 'root/empty']);
    expect(tree.nodes.get('root')?.totalSize).toBe(1836);
    expect(tree.nodes.get('root/src')?.totalSize).toBe(1536);
    expect(tree.nodes.get('root/src/components/Button.tsx')).toMatchObject({ depth: 3, size: 512, parentId: 'root/src/components' });
    expect(tree.nodes.get('root/empty')?.totalSize).toBe(0);
    expect(buildTreeIndex(fixture).orderedNodes.map(node => node.id)).toEqual(tree.orderedNodes.map(node => node.id));
  });

  it.each([
    null, [], {}, { name: 'root', type: 'file', size: 1 },
    { name: 'root', type: 'folder' },
    ...['', ' ', '.', '..', 'a/b', 'a\\b', '\u0000', '\ud800'].map(name => ({ name, type: 'folder', children: [] })),
    ...[-1, NaN, Infinity, 0.5, '1', Number.MAX_SAFE_INTEGER + 1].map(size => ({
      name: 'root', type: 'folder', children: [{ name: 'file', type: 'file', size }],
    })),
    { name: 'root', type: 'folder', children: [{ name: 'file', type: 'file', size: 0, children: [] }] },
    { name: 'root', type: 'folder', children: [null] },
    { name: 'root', type: 'folder', children: [{ name: 'file', type: 'other' }] },
  ])('rejects invalid input: %j', value => {
    expect(() => buildTreeIndex(value)).toThrow();
  });

  it('rejects duplicate sibling names but allows the same name in different folders', () => {
    const file = { name: 'same.ts', type: 'file', size: 1 };
    expect(() => buildTreeIndex({ name: 'root', type: 'folder', children: [file, { ...file }] })).toThrow('Duplicate path');
    expect(buildTreeIndex({ name: 'root', type: 'folder', children: [file, {
      name: 'other', type: 'folder', children: [{ ...file }],
    }] }).nodes.size).toBe(4);
  });

  it('rejects cycles and totals outside the safe integer range', () => {
    const cyclic: { name: string; type: string; children: unknown[] } = { name: 'root', type: 'folder', children: [] };
    cyclic.children.push(cyclic);
    expect(() => buildTreeIndex(cyclic)).toThrow('cycle');
    expect(() => buildTreeIndex({ name: 'root', type: 'folder', children: [
      { name: 'a', type: 'file', size: Number.MAX_SAFE_INTEGER }, { name: 'b', type: 'file', size: 1 },
    ] })).toThrow('total size');
  });

  it('parses and processes 6,000 levels without recursive stack overflow', () => {
    const text = '{"name":"d","type":"folder","children":['.repeat(6000)
      + '{"name":"leaf.ts","type":"file","size":17}' + ']}'.repeat(6000);
    const tree = buildTreeIndex(parseTreeJson(text));
    expect(tree.nodes.size).toBe(6001);
    expect(tree.orderedNodes.at(-1)?.depth).toBe(6000);
    expect(tree.nodes.get(tree.rootId)?.totalSize).toBe(17);
    expect(getVisibleNodes(tree, new Set(tree.nodes.keys()))).toHaveLength(6001);
    expect(searchNodes(tree.orderedNodes, 'leaf')).toHaveLength(1);
  });
});

it('searches the entire index case-insensitively, including collapsed folders', () => {
  const tree = buildTreeIndex(fixture);
  expect(getVisibleNodes(tree, new Set())).toHaveLength(1);
  expect(searchNodes(tree.orderedNodes, ' BUTTON ')).toEqual([tree.nodes.get('root/src/components/Button.tsx')]);
  expect(searchNodes(tree.orderedNodes, 'missing')).toEqual([]);
  expect(searchNodes(tree.orderedNodes, ' ')).toEqual([]);
});

it('flattens only expanded folders in the original order', () => {
  const tree = buildTreeIndex(fixture);
  expect(getVisibleNodes(tree, new Set(['root', 'root/src'])).map(node => node.path)).toEqual([
    'root', 'root/src', 'root/src/index.ts', 'root/src/components', 'root/package.json', 'root/empty',
  ]);
});

it('returns a readable error for invalid JSON', () => {
  expect(() => parseTreeJson('{')).toThrow('Invalid JSON');
});

it('indexes, expands, and searches an import larger than the demo', () => {
  const children = Array.from({ length: 12_000 }, (_, index) => ({ name: `file-${index}.ts`, type: 'file', size: 1 }));
  const tree = buildTreeIndex({ name: 'root', type: 'folder', children });
  expect(tree.nodes.size).toBe(12_001);
  expect(tree.nodes.get('root')?.totalSize).toBe(12_000);
  expect(getVisibleNodes(tree, new Set(['root']))).toHaveLength(12_001);
  expect(searchNodes(tree.orderedNodes, 'file-11999.ts').map(node => node.path)).toEqual(['root/file-11999.ts']);
});
