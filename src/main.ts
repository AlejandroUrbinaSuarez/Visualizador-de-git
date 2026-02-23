import './global.css';
import './render/animations.css';

import type { RepoState } from './core/types';
import { createStore } from './core/store';
import { init } from './core/operations';
import { createSvgRenderer } from './render/svg-renderer';
import { createAppShell } from './ui/app-shell';
import { createActionPanel } from './ui/action-panel';
import { createInspectorPanel } from './ui/inspector-panel';
import { createThemeToggle } from './ui/theme-toggle';
import { loadState, createAutoSaver } from './storage/local-storage';

function bootstrap(): void {
  // Load persisted state or initialize fresh
  const savedState = loadState();
  const initialState: RepoState = savedState ?? init();

  const store = createStore<RepoState>(initialState);

  // Build DOM
  const shell = createAppShell();
  document.documentElement.setAttribute('data-theme', initialState.config.theme);

  // SVG renderer with commit-click handler
  const renderer = createSvgRenderer((commitId) => {
    store.setState(prev => ({
      ...prev,
      selectedCommitId: prev.selectedCommitId === commitId ? null : commitId,
    }));
  });
  renderer.mount(shell.graphContainer);

  // Subscribe renderer to state changes
  store.subscribe((state) => renderer.update(state));

  // UI panels
  createActionPanel(shell.actionPanelContainer, store);
  createInspectorPanel(shell.inspectorContainer, store);
  createThemeToggle(shell.graphContainer, store);

  // Persist state on changes (debounced)
  const autoSave = createAutoSaver(store.getState);
  store.subscribe(autoSave);

  // Initial render (subscriptions don't fire retroactively)
  renderer.update(store.getState());

  // Trigger initial subscriber call for UI panels
  store.setState(prev => ({ ...prev }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
