import type { LayoutEdge } from '../layout/types';
import { RENDER } from './constants';

const SVG_NS = 'http://www.w3.org/2000/svg';

function edgePath(edge: LayoutEdge): string {
  const { fromX, fromY, toX, toY } = edge;

  if (fromX === toX) {
    // Same lane: straight vertical line
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }

  // Cross-lane: cubic bezier S-curve
  const midY = (fromY + toY) / 2;
  return `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
}

function edgeKey(edge: LayoutEdge): string {
  return `${edge.fromCommitId}->${edge.toCommitId}`;
}

export function renderEdges(
  container: SVGGElement,
  edges: LayoutEdge[],
  _prevEdges: LayoutEdge[]
): void {
  const existing = new Map<string, SVGPathElement>();
  container.querySelectorAll<SVGPathElement>('[data-edge-key]').forEach(el => {
    existing.set(el.dataset.edgeKey!, el);
  });

  const currentKeys = new Set(edges.map(edgeKey));

  // Remove old edges
  existing.forEach((el, key) => {
    if (!currentKeys.has(key)) {
      el.classList.add('edge-exit');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
  });

  // Add or update edges
  for (const edge of edges) {
    const key = edgeKey(edge);
    const d = edgePath(edge);

    let path = existing.get(key);
    if (path) {
      path.setAttribute('d', d);
      path.classList.toggle('merge-edge', edge.isMergeEdge);
    } else {
      path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('data-edge-key', key);
      path.setAttribute('d', d);
      path.setAttribute('class', 'commit-edge edge-enter');
      if (edge.isMergeEdge) path.classList.add('merge-edge');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-width', String(RENDER.EDGE_STROKE_WIDTH));
      container.appendChild(path);

      path.addEventListener('animationend', () => {
        path!.classList.remove('edge-enter');
      }, { once: true });
    }
  }
}
