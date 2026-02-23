import type { Commit } from '../core/types';

/**
 * Kahn's BFS topological sort: root commits first, newest tips last.
 * Timestamp ascending as tiebreaker, commit ID as secondary tiebreaker.
 */
export function topologicalSort(commits: Record<string, Commit>): string[] {
  const ids = Object.keys(commits);
  if (ids.length === 0) return [];

  // Build child map and in-degree (number of parents)
  const childrenOf: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  for (const id of ids) {
    childrenOf[id] = [];
    inDegree[id] = 0;
  }

  for (const commit of Object.values(commits)) {
    inDegree[commit.id] = commit.parents.length;
    for (const parentId of commit.parents) {
      if (childrenOf[parentId]) {
        childrenOf[parentId].push(commit.id);
      }
    }
  }

  // Seed with root commits (in-degree 0)
  const queue: string[] = ids.filter(id => inDegree[id] === 0);
  const result: string[] = [];

  while (queue.length > 0) {
    // Stable sort: timestamp ascending, then ID for full determinism
    queue.sort((a, b) => {
      const dt = commits[a].timestamp - commits[b].timestamp;
      return dt !== 0 ? dt : a.localeCompare(b);
    });

    const id = queue.shift()!;
    result.push(id);

    for (const childId of childrenOf[id]) {
      inDegree[childId]--;
      if (inDegree[childId] === 0) {
        queue.push(childId);
      }
    }
  }

  return result;
}
