export interface AppShell {
  actionPanelContainer: HTMLElement;
  graphContainer: HTMLElement;
  inspectorContainer: HTMLElement;
}

export function createAppShell(): AppShell {
  const root = document.getElementById('app')!;
  root.textContent = '';
  root.classList.add('app-shell');

  const actionPanel = document.createElement('aside');
  actionPanel.className = 'panel action-panel';
  const actionTitle = document.createElement('h2');
  actionTitle.className = 'panel-title';
  actionTitle.textContent = 'Actions';
  actionPanel.appendChild(actionTitle);

  const graphArea = document.createElement('main');
  graphArea.className = 'graph-area';
  graphArea.setAttribute('data-tutorial-target', 'graph-area');

  const inspector = document.createElement('aside');
  inspector.className = 'panel inspector-panel';
  const inspectorTitle = document.createElement('h2');
  inspectorTitle.className = 'panel-title';
  inspectorTitle.textContent = 'Inspector';
  inspector.appendChild(inspectorTitle);

  root.appendChild(actionPanel);
  root.appendChild(graphArea);
  root.appendChild(inspector);

  return {
    actionPanelContainer: actionPanel,
    graphContainer: graphArea,
    inspectorContainer: inspector,
  };
}
