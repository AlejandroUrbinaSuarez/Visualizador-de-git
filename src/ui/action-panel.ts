import type { Store, RepoState } from '../core/types';
import { init, commitOp, branchOp, checkoutOp } from '../core/operations';

export function createActionPanel(
  container: HTMLElement,
  store: Store<RepoState>
): void {
  // --- Init ---
  const initSection = createSection('Repository');
  const initBtn = createButton('git init', () => {
    store.setState(() => init());
  });
  initSection.appendChild(initBtn);

  // --- Commit ---
  const commitSection = createSection('Commit');
  const commitInput = createInput('Commit message...');
  const commitBtn = createButton('git commit', () => {
    const { state, result } = commitOp(store.getState(), commitInput.value);
    if (result.success) {
      store.setState(() => state);
      commitInput.value = '';
    } else {
      showError(container, result.error!);
    }
  });
  commitInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitBtn.click();
  });
  commitSection.appendChild(commitInput);
  commitSection.appendChild(commitBtn);

  // --- Branch ---
  const branchSection = createSection('Branch');
  const branchInput = createInput('Branch name...');
  const branchBtn = createButton('git branch', () => {
    const { state, result } = branchOp(store.getState(), branchInput.value);
    if (result.success) {
      store.setState(() => state);
      branchInput.value = '';
    } else {
      showError(container, result.error!);
    }
  });
  branchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') branchBtn.click();
  });
  branchSection.appendChild(branchInput);
  branchSection.appendChild(branchBtn);

  // --- Checkout ---
  const checkoutSection = createSection('Checkout');
  const checkoutInput = createInput('Branch or commit...');
  const checkoutBtn = createButton('git checkout', () => {
    const { state, result } = checkoutOp(store.getState(), checkoutInput.value);
    if (result.success) {
      store.setState(() => state);
      checkoutInput.value = '';
    } else {
      showError(container, result.error!);
    }
  });
  checkoutInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkoutBtn.click();
  });
  checkoutSection.appendChild(checkoutInput);
  checkoutSection.appendChild(checkoutBtn);

  // Quick-checkout buttons (dynamic)
  const quickCheckoutDiv = document.createElement('div');
  quickCheckoutDiv.className = 'quick-checkout';
  checkoutSection.appendChild(quickCheckoutDiv);

  store.subscribe((state) => {
    // Clear old buttons
    while (quickCheckoutDiv.firstChild) {
      quickCheckoutDiv.removeChild(quickCheckoutDiv.firstChild);
    }
    for (const branchName of Object.keys(state.branches)) {
      const btn = document.createElement('button');
      btn.className = 'quick-btn';
      btn.textContent = branchName;
      if (state.head.type === 'branch' && state.head.ref === branchName) {
        btn.classList.add('active-branch');
      }
      btn.addEventListener('click', () => {
        const { state: newState, result } = checkoutOp(store.getState(), branchName);
        if (result.success) store.setState(() => newState);
      });
      quickCheckoutDiv.appendChild(btn);
    }
  });

  // Assemble sections
  container.appendChild(initSection);
  container.appendChild(commitSection);
  container.appendChild(branchSection);
  container.appendChild(checkoutSection);
}

function createSection(title: string): HTMLElement {
  const section = document.createElement('div');
  section.className = 'action-section';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  section.appendChild(h3);
  return section;
}

function createButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function createInput(placeholder: string): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'action-input';
  input.placeholder = placeholder;
  return input;
}

function showError(container: HTMLElement, message: string): void {
  const existing = container.querySelector('.error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
