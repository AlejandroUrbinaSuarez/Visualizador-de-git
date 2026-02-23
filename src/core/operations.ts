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
