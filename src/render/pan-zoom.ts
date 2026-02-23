export interface PanZoomState {
  cleanup: () => void;
}

export function setupPanZoom(
  svg: SVGSVGElement,
  rootGroup: SVGGElement
): PanZoomState {
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  function applyTransform(): void {
    rootGroup.setAttribute(
      'transform',
      `translate(${translateX}, ${translateY}) scale(${scale})`
    );
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.3, Math.min(3.0, scale + delta));

    // Zoom toward cursor
    const rect = svg.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    translateX = cursorX - (cursorX - translateX) * (newScale / scale);
    translateY = cursorY - (cursorY - translateY) * (newScale / scale);
    scale = newScale;

    applyTransform();
  }

  function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    // Only pan when clicking empty space
    const target = e.target as Element;
    if (target.closest('.commit-node') || target.closest('.branch-label')) return;
    isPanning = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    svg.style.cursor = 'grabbing';
  }

  function onMouseMove(e: MouseEvent): void {
    if (!isPanning) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
  }

  function onMouseUp(): void {
    isPanning = false;
    svg.style.cursor = 'default';
  }

  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  function cleanup(): void {
    svg.removeEventListener('wheel', onWheel);
    svg.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  return { cleanup };
}
