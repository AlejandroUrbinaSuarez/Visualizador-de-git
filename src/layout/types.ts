export interface LayoutNode {
  commitId: string;
  x: number;
  y: number;
  lane: number;
}

export interface LayoutEdge {
  fromCommitId: string;
  toCommitId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isMergeEdge: boolean;
}

export interface BranchLabel {
  branchName: string;
  commitId: string;
  x: number;
  y: number;
  isHead: boolean;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  branchLabels: BranchLabel[];
  headCommitId: string | null;
  totalWidth: number;
  totalHeight: number;
}
