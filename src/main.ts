import './global.css';
import './render/animations.css';
import './tutorial/tutorial.css';

import type { RepoState } from './core/types';
import { createStore } from './core/store';
import { init } from './core/operations';
import { createSvgRenderer } from './render/svg-renderer';
import { createAppShell } from './ui/app-shell';
import { createActionPanel } from './ui/action-panel';
import { createInspectorPanel } from './ui/inspector-panel';
import { createThemeToggle } from './ui/theme-toggle';
import { loadState, createAutoSaver } from './storage/local-storage';
import { TutorialEngine } from './tutorial/engine';

function showLessonPicker(engine: TutorialEngine): void {
  const existing = document.querySelector('.lesson-picker-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'lesson-picker-overlay';

  const modal = document.createElement('div');
  modal.className = 'lesson-picker';

  const title = document.createElement('h2');
  title.className = 'lesson-picker__title';
  title.textContent = 'Elige una leccion';
  modal.appendChild(title);

  const lessons = engine.getLessons();
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const card = document.createElement('button');
    card.className = 'lesson-picker__card';

    const cardTitle = document.createElement('strong');
    cardTitle.textContent = lesson.title;
    card.appendChild(cardTitle);

    const cardDesc = document.createElement('p');
    cardDesc.textContent = lesson.description;
    card.appendChild(cardDesc);

    card.addEventListener('click', () => {
      overlay.remove();
      engine.startLesson(i);
    });

    modal.appendChild(card);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lesson-picker__close';
  closeBtn.textContent = 'Cancelar';
  closeBtn.addEventListener('click', () => overlay.remove());
  modal.appendChild(closeBtn);

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

function bootstrap(): void {
  // Load persisted state or initialize fresh
  const savedState = loadState();
  const initialState: RepoState = savedState ?? init();

  const store = createStore<RepoState>(initialState);

  // Build DOM
  const shell = createAppShell();
  document.documentElement.setAttribute('data-theme', initialState.config.theme);

  // SVG renderer with commit-click handler and state accessor for highlights
  const renderer = createSvgRenderer(
    (commitId) => {
      store.setState(prev => ({
        ...prev,
        selectedCommitId: prev.selectedCommitId === commitId ? null : commitId,
      }));
    },
    () => store.getState()
  );
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

  // Tutorial engine
  const tutorialEngine = new TutorialEngine(store);
  document.addEventListener('open-tutorial-picker', () => {
    showLessonPicker(tutorialEngine);
  });

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
