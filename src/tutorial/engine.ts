import type { RepoState, Store } from '../core/types';
import type { TutorialLesson, TutorialState } from './types';
import { allLessons } from './lessons';
import { showOverlay, hideOverlay, highlightElement, clearHighlight } from './overlay';
import {
  createTutorialBar,
  updateTutorialBar,
  destroyTutorialBar,
} from './tutorial-bar';

export class TutorialEngine {
  private store: Store<RepoState>;
  private state: TutorialState = {
    active: false,
    currentLessonIndex: 0,
    currentStepIndex: 0,
    showingExplanation: false,
  };
  private unsubscribe: (() => void) | null = null;
  private prevRepoState: RepoState | null = null;
  private savedRepoState: RepoState | null = null;

  constructor(store: Store<RepoState>) {
    this.store = store;
  }

  getLessons(): TutorialLesson[] {
    return allLessons;
  }

  startLesson(lessonIndex: number): void {
    const lesson = allLessons[lessonIndex];
    if (!lesson) return;

    // Save current repo state to restore on exit
    this.savedRepoState = this.store.getState();

    // Reset repo to the lesson's initial state
    this.store.setState(() => lesson.initState());

    this.state = {
      active: true,
      currentLessonIndex: lessonIndex,
      currentStepIndex: 0,
      showingExplanation: false,
    };

    this.prevRepoState = this.store.getState();
    this.unsubscribe = this.store.subscribe((nextState) => {
      this.onStoreChange(nextState);
    });

    // Scroll action panel back to top
    const actionPanel = document.querySelector('.action-panel');
    if (actionPanel) actionPanel.scrollTop = 0;

    showOverlay();
    createTutorialBar({
      onNext: () => this.handleNext(),
      onSkip: () => this.exit(),
      onExit: () => this.exit(),
    });

    this.activateCurrentStep();
  }

  exit(): void {
    this.state.active = false;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    clearHighlight();
    hideOverlay();
    destroyTutorialBar();

    if (this.savedRepoState) {
      this.store.setState(() => this.savedRepoState!);
      this.savedRepoState = null;
    }
  }

  private onStoreChange(nextState: RepoState): void {
    if (!this.state.active || this.state.showingExplanation) return;

    const lesson = allLessons[this.state.currentLessonIndex];
    const step = lesson.steps[this.state.currentStepIndex];

    if (step.actionType === 'auto') return;

    if (step.validate) {
      const valid = step.validate(this.prevRepoState!, nextState);
      if (valid) {
        this.prevRepoState = nextState;
        if (step.explanation) {
          this.state.showingExplanation = true;
          clearHighlight();
          this.renderBar(step.explanation);
        } else {
          this.advanceStep();
        }
      }
    } else {
      this.prevRepoState = nextState;
      if (step.explanation) {
        this.state.showingExplanation = true;
        clearHighlight();
        this.renderBar(step.explanation);
      } else {
        this.advanceStep();
      }
    }
  }

  private handleNext(): void {
    if (!this.state.active) return;

    const lesson = allLessons[this.state.currentLessonIndex];
    const step = lesson.steps[this.state.currentStepIndex];
    const isLast = this.state.currentStepIndex >= lesson.steps.length - 1;

    if (this.state.showingExplanation) {
      if (isLast) {
        this.exit();
      } else {
        this.advanceStep();
      }
      return;
    }

    if (step.actionType === 'auto') {
      if (isLast) {
        this.exit();
      } else {
        this.advanceStep();
      }
    }
  }

  private advanceStep(): void {
    this.state.showingExplanation = false;
    this.state.currentStepIndex++;
    this.prevRepoState = this.store.getState();
    this.activateCurrentStep();
  }

  private activateCurrentStep(): void {
    const lesson = allLessons[this.state.currentLessonIndex];
    const step = lesson.steps[this.state.currentStepIndex];

    if (step.setup) {
      step.setup();
    }

    clearHighlight();
    highlightElement(step.highlightTarget);

    this.renderBar(step.text);
  }

  private renderBar(text: string): void {
    const lesson = allLessons[this.state.currentLessonIndex];
    const step = lesson.steps[this.state.currentStepIndex];
    const isLast = this.state.currentStepIndex >= lesson.steps.length - 1;

    updateTutorialBar(
      lesson,
      this.state.currentStepIndex,
      text,
      isLast,
      step.actionType === 'auto',
      this.state.showingExplanation,
    );
  }
}
