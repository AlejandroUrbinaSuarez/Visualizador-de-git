# Git Visual Simulator

Simulador visual interactivo de un repositorio Git. Permite ejecutar operaciones (init, commit, branch, checkout, merge, rebase, reset) y ver el grafo de commits animado en tiempo real con SVG.

100% frontend, sin backend. El estado se persiste en LocalStorage.

## Ejecutar

```bash
npm install
npm run dev
```

Abrir http://localhost:5173

## Desplegar como sitio estatico

```bash
npm run build
```

Subir el contenido de `/dist` a cualquier hosting estatico (Netlify, Vercel, GitHub Pages, etc.).

## Operaciones disponibles

| Operacion | Descripcion |
|-----------|-------------|
| **git init** | Crea branch `main` con un commit inicial |
| **git commit** | Crea commit con parent = HEAD actual. Si HEAD esta en branch, avanza la branch |
| **git branch** | Crea nueva branch en el commit actual de HEAD (no hace checkout) |
| **git checkout** | Cambia HEAD a una branch o se detacha en un commit |
| **git merge** | Merge de una branch fuente hacia la branch actual (fast-forward o merge commit) |
| **git rebase** | Reaplica commits exclusivos de la branch actual sobre la branch destino |
| **git reset --soft** | Mueve la branch un commit atras (el commit queda visible) |
| **git reset --hard** | Igual que soft pero limpia el staging area |
| **Load Demo** | Carga un escenario pre-armado con fork para probar merge/rebase |

## Reglas simplificadas

- **Merge**: Si la branch actual es ancestro de la fuente, hace fast-forward. Si no, crea merge commit con 2 parents.
- **Rebase**: Encuentra el ancestro comun, recolecta commits exclusivos, los replica con nuevos IDs sobre el destino. Los originales quedan como commits huerfanos.
- **Reset**: Solo retrocede 1 commit (al primer parent). No elimina commits del grafo.

## Interacciones

- **Click en commit** → muestra detalles en el panel Inspector
- **Hover en commit/branch** → resalta el camino ancestral completo
- **Pan** → arrastrar en espacio vacio del grafo
- **Zoom** → scroll del mouse (zoom hacia el cursor)
- **Dark/Light** → boton en la esquina superior derecha del grafo

## Arquitectura

```
src/
  core/       → tipos, store pub/sub, operaciones puras (sin DOM)
  layout/     → topo-sort, asignacion de lanes, coordenadas pixel
  render/     → SVG renderer con reconciliacion keyed, pan/zoom, animaciones
  ui/         → panel de acciones, inspector, toggle de tema
  storage/    → persistencia en LocalStorage (debounced)
  main.ts     → punto de entrada, conecta todo
```

## Stack

- Vite + TypeScript
- SVG para el grafo (sin Canvas)
- CSS custom properties para temas dark/light
- Sin dependencias de runtime
