import type { RepoState } from '../core/types';
import type { LayoutResult, LayoutNode, LayoutEdge, BranchLabel } from './types';
import { topologicalSort } from './topological-sort';
import { assignLanes } from './lane-assignment';
import { resolveHeadCommitId } from '../core/operations';

export const LAYOUT = {
  NODE_SPACING_Y: 80,
  LANE_SPACING_X: 150,
  PADDING_TOP: 60,
  PADDING_LEFT: 80,
  PADDING_BOTTOM: 60,
  PADDING_RIGHT: 120,
  LABEL_OFFSET_X: 24,
} as const;

export function computeLayout(state: RepoState): LayoutResult {
  const { commits, branches, head } = state;

  if (Object.keys(commits).length === 0) {
    return { nodes: [], edges: [], branchLabels: [], headCommitId: null, totalWidth: 0, totalHeight: 0 };
  }

  const topoOrder = topologicalSort(commits);
  const { commitLanes, maxLane } = assignLanes(topoOrder, commits, branches, head);

  // Build positioned nodes
  const nodes: LayoutNode[] = topoOrder.map((id, index) => ({
    commitId: id,
    lane: commitLanes[id],
    x: LAYOUT.PADDING_LEFT + commitLanes[id] * LAYOUT.LANE_SPACING_X,
    y: LAYOUT.PADDING_TOP + index * LAYOUT.NODE_SPACING_Y,
  }));

  // Position lookup
  const nodePos: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    nodePos[node.commitId] = { x: node.x, y: node.y };
  }

  // Build edges (child → parent, drawn top to bottom since parent is above)
  const edges: LayoutEdge[] = [];
  for (const commit of Object.values(commits)) {
    const from = nodePos[commit.id];
    if (!from) continue;
    commit.parents.forEach((parentId, parentIndex) => {
      const to = nodePos[parentId];
      if (!to) return;
      edges.push({
        fromCommitId: commit.id,
        toCommitId: parentId,
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        isMergeEdge: parentIndex > 0,
      });
    });
  }

  // Branch labels positioned right of their head commit
  const headCommitId = resolveHeadCommitId(state);
  const branchLabels: BranchLabel[] = Object.values(branches).map(branch => {
    const pos = nodePos[branch.head] ?? { x: 0, y: 0 };
    const isHead = head.type === 'branch' && head.ref === branch.name;
    return {
      branchName: branch.name,
      commitId: branch.head,
      x: pos.x + LAYOUT.LABEL_OFFSET_X,
      y: pos.y,
      isHead,
    };
  });

  const totalWidth = LAYOUT.PADDING_LEFT + (maxLane + 1) * LAYOUT.LANE_SPACING_X + LAYOUT.PADDING_RIGHT;
  const totalHeight = LAYOUT.PADDING_TOP + topoOrder.length * LAYOUT.NODE_SPACING_Y + LAYOUT.PADDING_BOTTOM;

  return { nodes, edges, branchLabels, headCommitId, totalWidth, totalHeight };
}
