export type InputFile = { name: string; type: 'file'; size: number };
export type InputFolder = { name: string; type: 'folder'; children: InputNode[] };
export type InputNode = InputFile | InputFolder;

export type TreeNode = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  totalSize: number;
  depth: number;
  parentId: string | null;
  childrenIds: string[];
};

export type TreeIndex = {
  rootId: string;
  nodes: Map<string, TreeNode>;
  orderedNodes: TreeNode[];
};
