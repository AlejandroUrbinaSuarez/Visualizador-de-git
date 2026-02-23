import type { LayoutResult } from '../layout/types';
import type { RepoState } from '../core/types';
import { RENDER } from './constants';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function renderNodes(
  container: SVGGElement,
  layout: LayoutResult,
  state: RepoState,
  _prevLayout: LayoutResult | null,
  onCommitClick: (commitId: string) => void
): void {
  const existing = new Map<string, SVGGElement>();
  container.querySelectorAll<SVGGElement>('[data-commit-id]').forEach(el => {
    existing.set(el.dataset.commitId!, el);
  });

  const currentIds = new Set(layout.nodes.map(n => n.commitId));

  // Remove old nodes
  existing.forEach((el, id) => {
    if (!currentIds.has(id)) {
      el.classList.add('node-exit');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
  });

  // Add or update nodes
  for (const node of layout.nodes) {
    const commit = state.commits[node.commitId];
    if (!commit) continue;

    const isHead = layout.headCommitId === node.commitId;
    const isSelected = state.selectedCommitId === node.commitId;

    let group = existing.get(node.commitId);
    if (group) {
      // Update position (CSS transition animates the move)
      group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      group.classList.toggle('is-head', isHead);
      group.classList.toggle('is-selected', isSelected);
    } else {
      // Create new node with entrance animation
      group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('data-commit-id', node.commitId);
      group.setAttribute('class', 'commit-node node-enter');
      group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      if (isHead) group.classList.add('is-head');
      if (isSelected) group.classList.add('is-selected');

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('r', String(RENDER.NODE_RADIUS));
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('class', 'commit-circle');

      const hashText = document.createElementNS(SVG_NS, 'text');
      hashText.setAttribute('class', 'commit-hash');
      hashText.setAttribute('x', '0');
      hashText.setAttribute('y', String(RENDER.NODE_RADIUS + 14));
      hashText.setAttribute('text-anchor', 'middle');
      hashText.textContent = node.commitId;

      const msgText = document.createElementNS(SVG_NS, 'text');
      msgText.setAttribute('class', 'commit-message');
      msgText.setAttribute('x', '0');
      msgText.setAttribute('y', String(RENDER.NODE_RADIUS + 28));
      msgText.setAttribute('text-anchor', 'middle');
      const displayMsg = commit.message.length > 24
        ? commit.message.slice(0, 22) + '...'
        : commit.message;
      msgText.textContent = displayMsg;

      group.appendChild(circle);
      group.appendChild(hashText);
      group.appendChild(msgText);

      group.addEventListener('click', () => onCommitClick(node.commitId));
      group.style.cursor = 'pointer';
      container.appendChild(group);

      group.addEventListener('animationend', () => {
        group!.classList.remove('node-enter');
      }, { once: true });
    }
  }
}
