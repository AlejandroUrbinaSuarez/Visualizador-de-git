import type { LayoutResult } from '../layout/types';
import type { RepoState } from '../core/types';
import { RENDER } from './constants';

const SVG_NS = 'http://www.w3.org/2000/svg';

function clearChildren(el: Element): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function renderLabels(
  container: SVGGElement,
  layout: LayoutResult,
  state: RepoState
): void {
  // Labels are cheap — rebuild every frame
  clearChildren(container);

  // Group labels by commit for stacking
  const labelsPerCommit: Record<string, typeof layout.branchLabels> = {};
  for (const label of layout.branchLabels) {
    if (!labelsPerCommit[label.commitId]) {
      labelsPerCommit[label.commitId] = [];
    }
    labelsPerCommit[label.commitId].push(label);
  }

  for (const labels of Object.values(labelsPerCommit)) {
    labels.forEach((label, index) => {
      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('class', 'branch-label');
      if (label.isHead) group.classList.add('is-head-branch');
      // Stack vertically upward when multiple labels share a commit
      const yOffset = -(index * 24);
      group.setAttribute('transform', `translate(${label.x + 20}, ${label.y + yOffset})`);

      const text = label.isHead
        ? `HEAD \u2192 ${label.branchName}`
        : label.branchName;
      const estimatedWidth = text.length * 7.5 + RENDER.LABEL_PADDING_X * 2;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('rx', String(RENDER.LABEL_BORDER_RADIUS));
      rect.setAttribute('ry', String(RENDER.LABEL_BORDER_RADIUS));
      rect.setAttribute('class', 'label-bg');
      rect.setAttribute('width', String(estimatedWidth));
      rect.setAttribute('height', '22');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '-11');

      const textEl = document.createElementNS(SVG_NS, 'text');
      textEl.setAttribute('class', 'label-text');
      textEl.setAttribute('x', String(RENDER.LABEL_PADDING_X));
      textEl.setAttribute('y', '4');
      textEl.setAttribute('font-size', String(RENDER.LABEL_FONT_SIZE));
      textEl.textContent = text;

      group.appendChild(rect);
      group.appendChild(textEl);
      container.appendChild(group);
    });
  }

  // Detached HEAD indicator
  if (state.head.type === 'detached' && layout.headCommitId) {
    const nodePos = layout.nodes.find(n => n.commitId === layout.headCommitId);
    if (nodePos) {
      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('class', 'branch-label is-detached-head');
      group.setAttribute('transform', `translate(${nodePos.x + 44}, ${nodePos.y})`);

      const text = 'HEAD (detached)';
      const w = text.length * 7.5 + RENDER.LABEL_PADDING_X * 2;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('rx', String(RENDER.LABEL_BORDER_RADIUS));
      rect.setAttribute('ry', String(RENDER.LABEL_BORDER_RADIUS));
      rect.setAttribute('class', 'label-bg detached-bg');
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', '22');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '-11');

      const textEl = document.createElementNS(SVG_NS, 'text');
      textEl.setAttribute('class', 'label-text');
      textEl.setAttribute('x', String(RENDER.LABEL_PADDING_X));
      textEl.setAttribute('y', '4');
      textEl.textContent = text;

      group.appendChild(rect);
      group.appendChild(textEl);
      container.appendChild(group);
    }
  }
}
