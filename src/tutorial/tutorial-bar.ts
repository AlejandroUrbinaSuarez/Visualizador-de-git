import type { TutorialLesson } from './types';

export interface TutorialBarCallbacks {
  onNext: () => void;
  onSkip: () => void;
  onExit: () => void;
}

let barEl: HTMLDivElement | null = null;
let textEl: HTMLParagraphElement | null = null;
let titleEl: HTMLSpanElement | null = null;
let progressEl: HTMLDivElement | null = null;
let nextBtn: HTMLButtonElement | null = null;

export function createTutorialBar(callbacks: TutorialBarCallbacks): void {
  if (barEl) return;

  barEl = document.createElement('div');
  barEl.className = 'tutorial-bar';

  // Top row: title + exit
  const topRow = document.createElement('div');
  topRow.className = 'tutorial-bar__top';

  titleEl = document.createElement('span');
  titleEl.className = 'tutorial-bar__title';
  topRow.appendChild(titleEl);

  const exitBtn = document.createElement('button');
  exitBtn.className = 'tutorial-bar__exit';
  exitBtn.textContent = 'Salir';
  exitBtn.addEventListener('click', callbacks.onExit);
  topRow.appendChild(exitBtn);

  barEl.appendChild(topRow);

  // Text area
  textEl = document.createElement('p');
  textEl.className = 'tutorial-bar__text';
  barEl.appendChild(textEl);

  // Bottom row: progress + buttons
  const bottomRow = document.createElement('div');
  bottomRow.className = 'tutorial-bar__bottom';

  progressEl = document.createElement('div');
  progressEl.className = 'tutorial-bar__progress';
  bottomRow.appendChild(progressEl);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'tutorial-bar__buttons';

  const skipBtn = document.createElement('button');
  skipBtn.className = 'tutorial-bar__btn tutorial-bar__btn--skip';
  skipBtn.textContent = 'Saltar leccion';
  skipBtn.addEventListener('click', callbacks.onSkip);
  btnGroup.appendChild(skipBtn);

  nextBtn = document.createElement('button');
  nextBtn.className = 'tutorial-bar__btn tutorial-bar__btn--next';
  nextBtn.textContent = 'Siguiente';
  nextBtn.addEventListener('click', callbacks.onNext);
  btnGroup.appendChild(nextBtn);

  bottomRow.appendChild(btnGroup);
  barEl.appendChild(bottomRow);

  document.body.appendChild(barEl);
}

export function updateTutorialBar(
  lesson: TutorialLesson,
  stepIndex: number,
  text: string,
  isLastStep: boolean,
  isAutoStep: boolean,
  showingExplanation: boolean,
): void {
  if (!barEl || !textEl || !titleEl || !progressEl || !nextBtn) return;

  titleEl.textContent = lesson.title;
  textEl.textContent = text;

  // Progress dots
  while (progressEl.firstChild) progressEl.removeChild(progressEl.firstChild);
  for (let i = 0; i < lesson.steps.length; i++) {
    const dot = document.createElement('span');
    dot.className = 'tutorial-bar__dot';
    if (i < stepIndex) dot.classList.add('tutorial-bar__dot--done');
    if (i === stepIndex) dot.classList.add('tutorial-bar__dot--active');
    progressEl.appendChild(dot);
  }

  // Next button visibility
  if (isAutoStep || showingExplanation) {
    nextBtn.style.display = '';
    nextBtn.textContent = isLastStep ? 'Finalizar' : 'Siguiente';
  } else {
    nextBtn.style.display = 'none';
  }
}

export function destroyTutorialBar(): void {
  if (barEl) {
    barEl.remove();
    barEl = null;
    textEl = null;
    titleEl = null;
    progressEl = null;
    nextBtn = null;
  }
}
