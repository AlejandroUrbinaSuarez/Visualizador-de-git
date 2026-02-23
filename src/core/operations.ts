import type { RepoState, Commit, Branch, OperationResult } from './types';
import { generateCommitId } from './id';

// Resolves the current HEAD to a concrete commit ID
export function resolveHeadCommitId(state: RepoState): string | null {
  if (state.head.type === 'branch') {
    const branch = state.branches[state.head.ref];
    return branch ? branch.head : null;
  }
  return state.head.ref;
}

function emptyStage() {
  return { added: [], modified: [], deleted: [] };
}

// Initialize a fresh repository with "main" branch and initial commit
export function init(): RepoState {
  const commitId = generateCommitId();
  const commit: Commit = {
    id: commitId,
    message: 'Initial commit',
    parents: [],
    timestamp: Date.now(),
  };
  const mainBranch: Branch = { name: 'main', head: commitId };
  return {
    commits: { [commitId]: commit },
    branches: { main: mainBranch },
    head: { type: 'branch', ref: 'main' },
    selectedCommitId: null,
    stage: emptyStage(),
    config: { theme: 'dark', layoutMode: 'vertical' },
  };
}

// Create a new commit on the current HEAD
export function commitOp(
  state: RepoState,
  message: string
): { state: RepoState; result: OperationResult } {
  const parentId = resolveHeadCommitId(state);
  if (!parentId) {
    return { state, result: { success: false, error: 'No HEAD to commit on' } };
  }
  if (!message.trim()) {
    return { state, result: { success: false, error: 'Commit message cannot be empty' } };
  }

  const commitId = generateCommitId();
  const newCommit: Commit = {
    id: commitId,
    message: message.trim(),
    parents: [parentId],
    timestamp: Date.now(),
  };

  let newBranches = state.branches;
  let newHead = state.head;

  if (state.head.type === 'branch') {
    const branchName = state.head.ref;
    newBranches = {
      ...state.branches,
      [branchName]: { ...state.branches[branchName], head: commitId },
    };
  } else {
    newHead = { type: 'detached', ref: commitId };
  }

  return {
    state: {
      ...state,
      commits: { ...state.commits, [commitId]: newCommit },
      branches: newBranches,
      head: newHead,
      stage: emptyStage(),
    },
    result: { success: true },
  };
}

// Create a new branch at the current HEAD commit (does NOT checkout)
export function branchOp(
  state: RepoState,
  name: string
): { state: RepoState; result: OperationResult } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { state, result: { success: false, error: 'Branch name cannot be empty' } };
  }
  if (state.branches[trimmed]) {
    return { state, result: { success: false, error: `Branch '${trimmed}' already exists` } };
  }
  if (!/^[a-zA-Z0-9_\-/]+$/.test(trimmed)) {
    return { state, result: { success: false, error: 'Invalid branch name characters' } };
  }

  const headCommitId = resolveHeadCommitId(state);
  if (!headCommitId) {
    return { state, result: { success: false, error: 'No HEAD commit to branch from' } };
  }

  const newBranch: Branch = { name: trimmed, head: headCommitId };
  return {
    state: {
      ...state,
      branches: { ...state.branches, [trimmed]: newBranch },
    },
    result: { success: true },
  };
}

// Switch HEAD to a branch or detach at a commit
export function checkoutOp(
  state: RepoState,
  ref: string
): { state: RepoState; result: OperationResult } {
  const trimmed = ref.trim();

  // Try as branch name first
  if (state.branches[trimmed]) {
    return {
      state: { ...state, head: { type: 'branch', ref: trimmed } },
      result: { success: true },
    };
  }

  // Try as commit ID (full or prefix match)
  const matchId = Object.keys(state.commits).find(
    id => id === trimmed || id.startsWith(trimmed)
  );
  if (matchId) {
    return {
      state: { ...state, head: { type: 'detached', ref: matchId } },
      result: { success: true },
    };
  }

  return { state, result: { success: false, error: `'${trimmed}' is not a branch or commit` } };
}

// Collect all ancestor commit IDs (inclusive) by walking all parent links
export function getAncestors(commits: Record<string, Commit>, startId: string): Set<string> {
  const ancestors = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (ancestors.has(id)) continue;
    ancestors.add(id);
    const commit = commits[id];
    if (commit) {
      for (const parentId of commit.parents) {
        queue.push(parentId);
      }
    }
  }
  return ancestors;
}

// Find the first common ancestor between two commits
function findCommonAncestor(
  commits: Record<string, Commit>,
  idA: string,
  idB: string
): string | null {
  const ancestorsA = getAncestors(commits, idA);
  // BFS from B until we hit an ancestor of A
  const queue = [idB];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    if (ancestorsA.has(id)) return id;
    const commit = commits[id];
    if (commit) {
      for (const parentId of commit.parents) {
        queue.push(parentId);
      }
    }
  }
  return null;
}

// Check if `ancestorId` is an ancestor of `descendantId`
function isAncestor(commits: Record<string, Commit>, ancestorId: string, descendantId: string): boolean {
  return getAncestors(commits, descendantId).has(ancestorId);
}

// Merge sourceBranch into the current branch
export function mergeOp(
  state: RepoState,
  sourceBranchName: string
): { state: RepoState; result: OperationResult } {
  if (state.head.type !== 'branch') {
    return { state, result: { success: false, error: 'Cannot merge in detached HEAD state' } };
  }

  const currentBranchName = state.head.ref;
  const trimmed = sourceBranchName.trim();

  if (!state.branches[trimmed]) {
    return { state, result: { success: false, error: `Branch '${trimmed}' does not exist` } };
  }
  if (trimmed === currentBranchName) {
    return { state, result: { success: false, error: 'Cannot merge a branch into itself' } };
  }

  const currentHead = state.branches[currentBranchName].head;
  const sourceHead = state.branches[trimmed].head;

  // Already up to date?
  if (isAncestor(state.commits, sourceHead, currentHead)) {
    return { state, result: { success: false, error: 'Already up to date' } };
  }

  // Fast-forward: current is ancestor of source — just advance pointer
  if (isAncestor(state.commits, currentHead, sourceHead)) {
    return {
      state: {
        ...state,
        branches: {
          ...state.branches,
          [currentBranchName]: { ...state.branches[currentBranchName], head: sourceHead },
        },
      },
      result: { success: true },
    };
  }

  // True merge: create merge commit with 2 parents
  const mergeId = generateCommitId();
  const mergeCommit: Commit = {
    id: mergeId,
    message: `Merge '${trimmed}' into '${currentBranchName}'`,
    parents: [currentHead, sourceHead],
    timestamp: Date.now(),
  };

  return {
    state: {
      ...state,
      commits: { ...state.commits, [mergeId]: mergeCommit },
      branches: {
        ...state.branches,
        [currentBranchName]: { ...state.branches[currentBranchName], head: mergeId },
      },
      stage: emptyStage(),
    },
    result: { success: true },
  };
}

// Rebase current branch onto target branch (simplified)
export function rebaseOp(
  state: RepoState,
  targetBranchName: string
): { state: RepoState; result: OperationResult } {
  if (state.head.type !== 'branch') {
    return { state, result: { success: false, error: 'Cannot rebase in detached HEAD state' } };
  }

  const currentBranchName = state.head.ref;
  const trimmed = targetBranchName.trim();

  if (!state.branches[trimmed]) {
    return { state, result: { success: false, error: `Branch '${trimmed}' does not exist` } };
  }
  if (trimmed === currentBranchName) {
    return { state, result: { success: false, error: 'Cannot rebase a branch onto itself' } };
  }

  const currentHead = state.branches[currentBranchName].head;
  const targetHead = state.branches[trimmed].head;

  const ancestor = findCommonAncestor(state.commits, currentHead, targetHead);
  if (!ancestor) {
    return { state, result: { success: false, error: 'No common ancestor found' } };
  }

  // Already up to date (current is ahead or same as target with no divergence)
  if (currentHead === ancestor) {
    return { state, result: { success: false, error: 'Already up to date — nothing to rebase' } };
  }

  // Collect exclusive commits: walk first-parent from currentHead back to ancestor (exclusive)
  const exclusiveCommits: Commit[] = [];
  let walkId: string | null = currentHead;
  while (walkId && walkId !== ancestor) {
    const commit: Commit = state.commits[walkId];
    if (!commit) break;
    exclusiveCommits.push(commit);
    walkId = commit.parents.length > 0 ? commit.parents[0] : null;
  }
  exclusiveCommits.reverse(); // oldest first for replay

  if (exclusiveCommits.length === 0) {
    return { state, result: { success: false, error: 'No commits to rebase' } };
  }

  // Replay commits onto targetHead
  let newCommits = { ...state.commits };
  let parentId = targetHead;
  let lastNewId = targetHead;

  for (const original of exclusiveCommits) {
    const newId = generateCommitId();
    const replayed: Commit = {
      id: newId,
      message: original.message + ' (rebased)',
      parents: [parentId],
      timestamp: Date.now(),
    };
    newCommits = { ...newCommits, [newId]: replayed };
    parentId = newId;
    lastNewId = newId;
  }

  return {
    state: {
      ...state,
      commits: newCommits,
      branches: {
        ...state.branches,
        [currentBranchName]: { ...state.branches[currentBranchName], head: lastNewId },
      },
      stage: emptyStage(),
    },
    result: { success: true },
  };
}

// Reset current branch to parent commit
export function resetOp(
  state: RepoState,
  mode: 'soft' | 'hard'
): { state: RepoState; result: OperationResult } {
  if (state.head.type !== 'branch') {
    return { state, result: { success: false, error: 'Cannot reset in detached HEAD state' } };
  }

  const branchName = state.head.ref;
  const currentCommitId = state.branches[branchName].head;
  const currentCommit = state.commits[currentCommitId];

  if (!currentCommit || currentCommit.parents.length === 0) {
    return { state, result: { success: false, error: 'Cannot reset past the initial commit' } };
  }

  const parentId = currentCommit.parents[0];

  return {
    state: {
      ...state,
      branches: {
        ...state.branches,
        [branchName]: { ...state.branches[branchName], head: parentId },
      },
      stage: mode === 'hard' ? emptyStage() : state.stage,
    },
    result: { success: true },
  };
}

// Pre-built demo scenario with a visible fork
export function loadDemoScenario(): RepoState {
  const now = Date.now();
  const ids = ['a1b2c3d', 'e4f5g6h', 'i7j8k9l', 'm0n1o2p', 'q3r4s5t'];

  const commits: Record<string, Commit> = {
    [ids[0]]: { id: ids[0], message: 'Initial commit', parents: [], timestamp: now - 5000 },
    [ids[1]]: { id: ids[1], message: 'Add README', parents: [ids[0]], timestamp: now - 4000 },
    [ids[2]]: { id: ids[2], message: 'Add tests', parents: [ids[1]], timestamp: now - 3000 },
    [ids[3]]: { id: ids[3], message: 'Add login page', parents: [ids[1]], timestamp: now - 2000 },
    [ids[4]]: { id: ids[4], message: 'Add auth middleware', parents: [ids[3]], timestamp: now - 1000 },
  };

  const branches: Record<string, Branch> = {
    main: { name: 'main', head: ids[2] },
    feature: { name: 'feature', head: ids[4] },
  };

  return {
    commits,
    branches,
    head: { type: 'branch', ref: 'main' },
    selectedCommitId: null,
    stage: emptyStage(),
    config: { theme: 'dark', layoutMode: 'vertical' },
  };
}
