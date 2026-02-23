import type { Commit, Branch, Head } from '../core/types';

export interface LaneAssignment {
  commitLanes: Record<string, number>;
  branchLanes: Record<string, number>;
  maxLane: number;
}

/**
 * Assigns each commit to a horizontal lane (column).
 *
 * Strategy:
 * - "main" always gets lane 0
 * - Other branches get lanes in creation order (approximated by tip timestamp)
 * - Walk each branch's first-parent chain, claiming unclaimed commits
 * - Unclaimed commits fall back to their first parent's lane
 */
export function assignLanes(
  topoOrder: string[],
  commits: Record<string, Commit>,
  branches: Record<string, Branch>,
  _head: Head
): LaneAssignment {
  const commitLanes: Record<string, number> = {};
  const branchLanes: Record<string, number> = {};
  let nextLane = 0;

  // Process branches: main first, then by tip commit timestamp
  const sortedBranches = Object.keys(branches).sort((a, b) => {
    if (a === 'main') return -1;
    if (b === 'main') return 1;
    const aTime = commits[branches[a].head]?.timestamp ?? 0;
    const bTime = commits[branches[b].head]?.timestamp ?? 0;
    return aTime - bTime;
  });

  // Each branch claims its first-parent chain
  for (const branchName of sortedBranches) {
    const lane = nextLane++;
    branchLanes[branchName] = lane;

    let currentId: string | null = branches[branchName].head;
    while (currentId && !Object.prototype.hasOwnProperty.call(commitLanes, currentId)) {
      commitLanes[currentId] = lane;
      const commit: Commit = commits[currentId];
      currentId = commit.parents.length > 0 ? commit.parents[0] : null;
    }
  }

  // Assign any unclaimed commits (orphans, detached HEAD commits)
  for (const commitId of topoOrder) {
    if (!Object.prototype.hasOwnProperty.call(commitLanes, commitId)) {
      const commit = commits[commitId];
      if (commit.parents.length > 0 && Object.prototype.hasOwnProperty.call(commitLanes, commit.parents[0])) {
        commitLanes[commitId] = commitLanes[commit.parents[0]];
      } else {
        commitLanes[commitId] = nextLane++;
      }
    }
  }

  return { commitLanes, branchLanes, maxLane: Math.max(nextLane - 1, 0) };
}
