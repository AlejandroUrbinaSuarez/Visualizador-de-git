import type { RepoState } from '../core/types';
import type { LayoutResult } from '../layout/types';
import { computeLayout } from '../layout/compute-layout';
import { renderNodes } from './node-renderer';
import { renderEdges } from './edge-renderer';
import { renderLabels } from './label-renderer';
import { setupPanZoom, type PanZoomState } from './pan-zoom';

export interface SvgRenderer {
  mount(container: HTMLElement): void;
  update(state: RepoState): void;
  destroy(): void;
}

export function createSvgRenderer(
  onCommitClick: (commitId: string) => void
): SvgRenderer {
  let svg: SVGSVGElement | null = null;
  let rootGroup: SVGGElement | null = null;
  let edgeGroup: SVGGElement | null = null;
  let nodeGroup: SVGGElement | null = null;
  let labelGroup: SVGGElement | null = null;
  let panZoom: PanZoomState | null = null;
  let prevLayout: LayoutResult | null = null;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function mount(container: HTMLElement): void {
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'git-graph');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    rootGroup = document.createElementNS(SVG_NS, 'g');
    rootGroup.setAttribute('class', 'graph-root');

    // Layer order: edges behind nodes behind labels
    edgeGroup = document.createElementNS(SVG_NS, 'g');
    edgeGroup.setAttribute('class', 'edges');
    nodeGroup = document.createElementNS(SVG_NS, 'g');
    nodeGroup.setAttribute('class', 'nodes');
    labelGroup = document.createElementNS(SVG_NS, 'g');
    labelGroup.setAttribute('class', 'labels');

    rootGroup.appendChild(edgeGroup);
    rootGroup.appendChild(nodeGroup);
    rootGroup.appendChild(labelGroup);
    svg.appendChild(rootGroup);
    container.appendChild(svg);

    panZoom = setupPanZoom(svg, rootGroup);
  }

  function update(state: RepoState): void {
    if (!svg || !edgeGroup || !nodeGroup || !labelGroup) return;

    const layout = computeLayout(state);

    svg.setAttribute('viewBox', `0 0 ${layout.totalWidth} ${layout.totalHeight}`);

    renderEdges(edgeGroup, layout.edges, prevLayout?.edges ?? []);
    renderNodes(nodeGroup, layout, state, prevLayout, onCommitClick);
    renderLabels(labelGroup, layout, state);

    prevLayout = layout;
  }

  function destroy(): void {
    if (panZoom) panZoom.cleanup();
    if (svg) svg.remove();
    svg = null;
    rootGroup = null;
    edgeGroup = null;
    nodeGroup = null;
    labelGroup = null;
    panZoom = null;
    prevLayout = null;
  }

  return { mount, update, destroy };
}
