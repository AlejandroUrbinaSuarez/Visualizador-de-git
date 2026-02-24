let overlayEl: HTMLDivElement | null = null;

/** Create and show the semi-transparent overlay (visual only, does not block interaction) */
export function showOverlay(): void {
  if (overlayEl) return;
  overlayEl = document.createElement('div');
  overlayEl.className = 'tutorial-overlay';
  document.body.appendChild(overlayEl);
}

/** Remove the overlay */
export function hideOverlay(): void {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}

/** Highlight a specific element by data-tutorial-target value */
export function highlightElement(targetId: string | null): void {
  clearHighlight();
  if (!targetId) return;

  const el = document.querySelector(`[data-tutorial-target="${targetId}"]`) as HTMLElement | null;
  if (!el) return;

  el.classList.add('tutorial-highlight');

  // Scroll the element into view within its scrollable parent
  const panel = el.closest('.action-panel');
  if (panel) {
    // Use a tiny delay so the DOM settles after step transitions
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

/** Remove highlight from all elements */
export function clearHighlight(): void {
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight');
  });
}
