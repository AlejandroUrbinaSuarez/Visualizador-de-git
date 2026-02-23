import type { Store, RepoState } from '../core/types';
import { resolveHeadCommitId } from '../core/operations';

export function createInspectorPanel(
  container: HTMLElement,
  store: Store<RepoState>
): void {
  const headInfo = document.createElement('div');
  headInfo.className = 'inspector-section';

  const branchesList = document.createElement('div');
  branchesList.className = 'inspector-section';

  const commitDetails = document.createElement('div');
  commitDetails.className = 'inspector-section';

  const stageInfo = document.createElement('div');
  stageInfo.className = 'inspector-section';

  container.appendChild(headInfo);
  container.appendChild(branchesList);
  container.appendChild(commitDetails);
  container.appendChild(stageInfo);

  store.subscribe((state) => {
    renderHeadInfo(headInfo, state);
    renderBranchesList(branchesList, state);
    renderCommitDetails(commitDetails, state);
    renderStageInfo(stageInfo, state);
  });
}

function clearAndAppend(el: HTMLElement, ...children: HTMLElement[]): void {
  while (el.firstChild) el.removeChild(el.firstChild);
  for (const child of children) el.appendChild(child);
}

function h3(text: string): HTMLElement {
  const el = document.createElement('h3');
  el.textContent = text;
  return el;
}

function infoRow(label: string, value: string, mono = false): HTMLElement {
  const row = document.createElement('div');
  row.className = 'info-row';
  const labelEl = document.createElement('span');
  labelEl.className = 'info-label';
  labelEl.textContent = label;
  const valueEl = document.createElement('span');
  valueEl.className = `info-value${mono ? ' mono' : ''}`;
  valueEl.textContent = value;
  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

function renderHeadInfo(el: HTMLElement, state: RepoState): void {
  const headCommitId = resolveHeadCommitId(state);
  clearAndAppend(el,
    h3('HEAD'),
    infoRow('Type:', state.head.type),
    infoRow('Ref:', state.head.ref),
    infoRow('Commit:', headCommitId ?? 'none', true),
  );
}

function renderBranchesList(el: HTMLElement, state: RepoState): void {
  const branchNames = Object.keys(state.branches);
  const heading = h3(`Branches (${branchNames.length})`);
  const list = document.createElement('ul');
  list.className = 'branch-list';

  for (const name of branchNames) {
    const li = document.createElement('li');
    const isActive = state.head.type === 'branch' && state.head.ref === name;
    if (isActive) li.classList.add('active');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${isActive ? '* ' : ''}${name}`;

    const hashSpan = document.createElement('span');
    hashSpan.className = 'mono';
    hashSpan.textContent = state.branches[name].head;

    li.appendChild(nameSpan);
    li.appendChild(hashSpan);
    list.appendChild(li);
  }

  clearAndAppend(el, heading, list);
}

function renderCommitDetails(el: HTMLElement, state: RepoState): void {
  if (!state.selectedCommitId || !state.commits[state.selectedCommitId]) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Click a commit node to inspect';
    clearAndAppend(el, h3('Commit Details'), p);
    return;
  }

  const commit = state.commits[state.selectedCommitId];
  clearAndAppend(el,
    h3('Commit Details'),
    infoRow('Hash:', commit.id, true),
    infoRow('Message:', commit.message),
    infoRow('Parents:', commit.parents.length > 0 ? commit.parents.join(', ') : 'none (root)', true),
    infoRow('Time:', new Date(commit.timestamp).toLocaleString()),
  );
}

function renderStageInfo(el: HTMLElement, state: RepoState): void {
  const { added, modified, deleted } = state.stage;
  const total = added.length + modified.length + deleted.length;
  const heading = h3(total > 0 ? `Stage (${total})` : 'Stage');

  if (total === 0) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Nothing staged';
    clearAndAppend(el, heading, p);
    return;
  }

  const items: HTMLElement[] = [heading];
  for (const f of added) {
    const div = document.createElement('div');
    div.className = 'stage-file';
    div.textContent = `A ${f}`;
    div.style.color = 'var(--color-success)';
    items.push(div);
  }
  for (const f of modified) {
    const div = document.createElement('div');
    div.className = 'stage-file';
    div.textContent = `M ${f}`;
    div.style.color = 'var(--color-warning)';
    items.push(div);
  }
  for (const f of deleted) {
    const div = document.createElement('div');
    div.className = 'stage-file';
    div.textContent = `D ${f}`;
    div.style.color = 'var(--color-error)';
    items.push(div);
  }
  clearAndAppend(el, ...items);
}
