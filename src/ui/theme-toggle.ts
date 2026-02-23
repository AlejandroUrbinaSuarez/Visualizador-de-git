import type { Store, RepoState } from '../core/types';

export function createThemeToggle(
  container: HTMLElement,
  store: Store<RepoState>
): void {
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle theme');

  btn.addEventListener('click', () => {
    store.setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        theme: prev.config.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  });

  store.subscribe(state => {
    btn.textContent = state.config.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    document.documentElement.setAttribute('data-theme', state.config.theme);
  });

  container.prepend(btn);
}
