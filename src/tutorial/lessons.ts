import type { TutorialLesson } from './types';
import type { RepoState } from '../core/types';
import { init, commitOp, loadDemoScenario } from '../core/operations';

function commitCount(s: RepoState): number {
  return Object.keys(s.commits).length;
}

// ─── Leccion 1: Basicos ─────────────────────────────────────────────

export const lesson1Basicos: TutorialLesson = {
  id: 'basicos',
  title: 'Leccion 1: Basicos',
  description: 'Aprende a inicializar un repositorio, hacer commits, crear ramas y cambiar de rama.',
  initState: () => init(),
  steps: [
    {
      text: 'Bienvenido al tutorial! Aprenderas los comandos basicos de Git. El repositorio ya fue inicializado con un commit inicial. Haz clic en "Siguiente" para continuar.',
      highlightTarget: null,
      actionType: 'auto',
    },
    {
      text: 'Observa el grafo: hay un solo nodo que representa el "Initial commit" en la rama main. Haz clic en "Siguiente" para continuar.',
      highlightTarget: 'graph-area',
      actionType: 'auto',
    },
    {
      text: 'Vamos a crear un segundo commit. Se ha escrito "Add README" en el campo de mensaje. Haz clic en "Siguiente" y luego pulsa el boton "git commit".',
      highlightTarget: 'commit-input',
      actionType: 'auto',
      setup: () => {
        const input = document.querySelector('[data-tutorial-target="commit-input"]') as HTMLInputElement | null;
        if (input) { input.value = 'Add README'; }
      },
    },
    {
      text: 'Ahora haz clic en el boton "git commit" para crear el commit.',
      highlightTarget: 'commit-btn',
      actionType: 'click',
      validate: (prev, next) => commitCount(next) === commitCount(prev) + 1,
      explanation: 'Perfecto! Se creo un nuevo nodo en el grafo conectado al commit anterior. Asi funciona el historial lineal de Git.',
    },
    {
      text: 'Hagamos otro commit. Se ha escrito "Add tests" en el campo de mensaje. Haz clic en "Siguiente".',
      highlightTarget: 'commit-input',
      actionType: 'auto',
      setup: () => {
        const input = document.querySelector('[data-tutorial-target="commit-input"]') as HTMLInputElement | null;
        if (input) { input.value = 'Add tests'; }
      },
    },
    {
      text: 'Haz clic en "git commit".',
      highlightTarget: 'commit-btn',
      actionType: 'click',
      validate: (prev, next) => commitCount(next) === commitCount(prev) + 1,
      explanation: 'Ahora tienes 3 commits en una linea recta. Cada commit apunta a su padre.',
    },
    {
      text: 'Ahora vamos a crear una rama. Se ha escrito "feature" en el campo de nombre. Haz clic en "Siguiente".',
      highlightTarget: 'branch-input',
      actionType: 'auto',
      setup: () => {
        const input = document.querySelector('[data-tutorial-target="branch-input"]') as HTMLInputElement | null;
        if (input) { input.value = 'feature'; }
      },
    },
    {
      text: 'Haz clic en "git branch" para crear la rama.',
      highlightTarget: 'branch-btn',
      actionType: 'click',
      validate: (_prev, next) => 'feature' in next.branches,
      explanation: 'Rama creada! Observa que aparece una nueva etiqueta "feature" en el mismo commit donde estas. La rama es simplemente un puntero a un commit.',
    },
    {
      text: 'Ahora cambiemos a la rama feature. Se ha escrito "feature" en el campo de checkout. Haz clic en "Siguiente".',
      highlightTarget: 'checkout-input',
      actionType: 'auto',
      setup: () => {
        const input = document.querySelector('[data-tutorial-target="checkout-input"]') as HTMLInputElement | null;
        if (input) { input.value = 'feature'; }
      },
    },
    {
      text: 'Haz clic en "git checkout" para cambiar de rama.',
      highlightTarget: 'checkout-btn',
      actionType: 'click',
      validate: (_prev, next) => next.head.type === 'branch' && next.head.ref === 'feature',
      explanation: 'Listo! Ahora HEAD apunta a "feature". Observa como cambio el indicador de rama activa. Cualquier commit nuevo se hara sobre esta rama.',
    },
    {
      text: 'Felicidades! Completaste la leccion de basicos. Aprendiste: git init, git commit, git branch y git checkout.',
      highlightTarget: null,
      actionType: 'auto',
    },
  ],
};

// ─── Leccion 2: Merge ───────────────────────────────────────────────

export const lesson2Merge: TutorialLesson = {
  id: 'merge',
  title: 'Leccion 2: Merge',
  description: 'Aprende como funciona git merge para combinar ramas.',
  initState: () => loadDemoScenario(),
  steps: [
    {
      text: 'En esta leccion aprenderas a fusionar ramas con git merge. Se cargo un escenario con dos ramas: "main" y "feature" que divergen. Haz clic en "Siguiente".',
      highlightTarget: null,
      actionType: 'auto',
    },
    {
      text: 'Observa el grafo: "main" tiene el commit "Add tests" y "feature" tiene "Add login page" y "Add auth middleware". Ambas ramas divergen desde "Add README". Haz clic en "Siguiente".',
      highlightTarget: 'graph-area',
      actionType: 'auto',
    },
    {
      text: 'Estamos en la rama "main". Vamos a fusionar "feature" dentro de "main". Haz clic en "Siguiente".',
      highlightTarget: null,
      actionType: 'auto',
    },
    {
      text: 'Se ha escrito "feature" en el campo de merge. Haz clic en "Siguiente" y luego pulsa "git merge".',
      highlightTarget: 'merge-input',
      actionType: 'auto',
      setup: () => {
        const input = document.querySelector('[data-tutorial-target="merge-input"]') as HTMLInputElement | null;
        if (input) { input.value = 'feature'; }
      },
    },
    {
      text: 'Haz clic en "git merge" para fusionar feature en main.',
      highlightTarget: 'merge-btn',
      actionType: 'click',
      validate: (prev, next) => {
        const newIds = Object.keys(next.commits).filter(id => !(id in prev.commits));
        if (newIds.length !== 1) return false;
        return next.commits[newIds[0]].parents.length === 2;
      },
      explanation: 'Merge completado! Observa el nuevo "merge commit" que tiene DOS padres: uno de main y otro de feature. Esto es una fusion verdadera (true merge). El grafo muestra las dos lineas de desarrollo unidas.',
    },
    {
      text: 'Excelente! Aprendiste como git merge crea un commit de fusion que une dos historiales divergentes.',
      highlightTarget: null,
      actionType: 'auto',
    },
  ],
};

// ─── Leccion 3: Rebase ──────────────────────────────────────────────

export const lesson3Rebase: TutorialLesson = {
  id: 'rebase',
  title: 'Leccion 3: Rebase',
  description: 'Aprende como git rebase reescribe el historial para crear una linea recta.',
  initState: () => loadDemoScenario(),
  steps: [
    {
      text: 'En esta leccion aprenderas git rebase. Se cargo el mismo escenario con "main" y "feature" divergentes. El rebase "reescribe" los commits de tu rama sobre otra. Haz clic en "Siguiente".',
      highlightTarget: null,
      actionType: 'auto',
    },
    {
      text: 'Para hacer rebase, primero debemos estar en la rama que queremos reescribir. Se ha escrito "feature" en el campo de checkout. Haz clic en "Siguiente".',
      highlightTarget: 'checkout-input',
      actionType: 'auto',
      setup: () => {
        const input = document.querySelector('[data-tutorial-target="checkout-input"]') as HTMLInputElement | null;
        if (input) { input.value = 'feature'; }
      },
    },
    {
      text: 'Haz clic en "git checkout" para cambiar a feature.',
      highlightTarget: 'checkout-btn',
      actionType: 'click',
      validate: (_prev, next) => next.head.type === 'branch' && next.head.ref === 'feature',
      explanation: 'Ahora estamos en "feature". Desde aqui haremos rebase sobre main.',
    },
    {
      text: 'Se ha escrito "main" en el campo de rebase. Haz clic en "Siguiente".',
      highlightTarget: 'rebase-input',
      actionType: 'auto',
      setup: () => {
        const input = document.querySelector('[data-tutorial-target="rebase-input"]') as HTMLInputElement | null;
        if (input) { input.value = 'main'; }
      },
    },
    {
      text: 'Haz clic en "git rebase" para reescribir los commits de feature sobre main.',
      highlightTarget: 'rebase-btn',
      actionType: 'click',
      validate: (_prev, next) => {
        const featureHead = next.branches['feature']?.head;
        if (!featureHead) return false;
        const headCommit = next.commits[featureHead];
        return headCommit?.message.includes('(rebased)') ?? false;
      },
      explanation: 'Rebase completado! Observa que los commits de feature ahora estan DESPUES de los de main, formando una linea recta. Los commits originales fueron reemplazados por copias nuevas (marcadas con "rebased"). A diferencia del merge, no hay commit de fusion.',
    },
    {
      text: 'Genial! Aprendiste la diferencia entre merge y rebase. Merge preserva la historia real; rebase la reescribe para que sea lineal.',
      highlightTarget: null,
      actionType: 'auto',
    },
  ],
};

// ─── Leccion 4: Reset ───────────────────────────────────────────────

function lesson4InitState(): RepoState {
  const base = loadDemoScenario();
  const { state } = commitOp(base, 'Commit extra para reset');
  return state;
}

export const lesson4Reset: TutorialLesson = {
  id: 'reset',
  title: 'Leccion 4: Reset',
  description: 'Aprende a deshacer commits con git reset --soft y --hard.',
  initState: lesson4InitState,
  steps: [
    {
      text: 'En esta leccion aprenderas git reset. Se cargo un escenario con un commit extra en main. Reset mueve el puntero de la rama hacia atras, "deshaciendo" commits. Haz clic en "Siguiente".',
      highlightTarget: null,
      actionType: 'auto',
    },
    {
      text: 'Hay dos modos: --soft mantiene los cambios en el stage (area de preparacion), --hard descarta todo. Primero probaremos --soft. Haz clic en "Siguiente".',
      highlightTarget: null,
      actionType: 'auto',
    },
    {
      text: 'Haz clic en "git reset --soft" para retroceder un commit manteniendo los cambios staged.',
      highlightTarget: 'reset-soft-btn',
      actionType: 'click',
      validate: (prev, next) => {
        if (prev.head.type !== 'branch') return false;
        const prevHead = prev.branches[prev.head.ref]?.head;
        const nextHead = next.branches[next.head.ref]?.head;
        if (!prevHead || !nextHead) return false;
        const prevCommit = prev.commits[prevHead];
        return prevCommit?.parents[0] === nextHead;
      },
      explanation: 'Hecho! El puntero de main retrocedio un commit. Con --soft, el commit salio del historial de la rama pero los cambios quedarian en el stage (en un Git real).',
    },
    {
      text: 'Ahora probaremos --hard. Este modo es mas destructivo: retrocede el puntero Y descarta todos los cambios. Haz clic en "Siguiente".',
      highlightTarget: null,
      actionType: 'auto',
    },
    {
      text: 'Haz clic en "git reset --hard" para retroceder otro commit descartando todo.',
      highlightTarget: 'reset-hard-btn',
      actionType: 'click',
      validate: (prev, next) => {
        if (prev.head.type !== 'branch') return false;
        const prevHead = prev.branches[prev.head.ref]?.head;
        const nextHead = next.branches[next.head.ref]?.head;
        if (!prevHead || !nextHead) return false;
        const prevCommit = prev.commits[prevHead];
        return prevCommit?.parents[0] === nextHead;
      },
      explanation: 'Con --hard, el puntero retrocedio Y el stage se limpio completamente. En Git real, los cambios se perderian por completo (a menos que uses reflog).',
    },
    {
      text: 'Completaste todas las lecciones! Ahora conoces los comandos fundamentales de Git: commit, branch, checkout, merge, rebase y reset.',
      highlightTarget: null,
      actionType: 'auto',
    },
  ],
};

// ─── Export all lessons ─────────────────────────────────────────────

export const allLessons: TutorialLesson[] = [
  lesson1Basicos,
  lesson2Merge,
  lesson3Rebase,
  lesson4Reset,
];
