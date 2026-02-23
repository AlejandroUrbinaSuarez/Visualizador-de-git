export interface Commit {
  id: string;
  message: string;
  parents: string[];
  timestamp: number;
}

export interface Branch {
  name: string;
  head: string;
}

export interface Head {
  type: 'branch' | 'detached';
  ref: string;
}

export interface Stage {
  added: string[];
  modified: string[];
  deleted: string[];
}

export type Theme = 'dark' | 'light';

export interface RepoConfig {
  theme: Theme;
  layoutMode: 'vertical';
}

export interface RepoState {
  commits: Record<string, Commit>;
  branches: Record<string, Branch>;
  head: Head;
  selectedCommitId: string | null;
  stage: Stage;
  config: RepoConfig;
}

export type Subscriber<T> = (state: T) => void;
export type Unsubscribe = () => void;

export interface Store<T> {
  getState: () => T;
  setState: (updater: (prev: T) => T) => void;
  subscribe: (fn: Subscriber<T>) => Unsubscribe;
}

export interface OperationResult {
  success: boolean;
  error?: string;
}
