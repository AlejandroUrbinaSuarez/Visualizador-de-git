import type { RepoState } from '../core/types';

/** The kind of user action a step waits for */
export type StepActionType = 'click' | 'auto';

/** A single tutorial step */
export interface TutorialStep {
  /** Instructional text shown in the bar (Spanish) */
  text: string;
  /** Explanatory text shown AFTER the action completes (Spanish) */
  explanation?: string;
  /** data-tutorial-target value of the element to highlight. null = no highlight */
  highlightTarget: string | null;
  /** What kind of action advances this step */
  actionType: StepActionType;
  /** Validate the new state after user acts. Return true to advance. */
  validate?: (prevState: RepoState, nextState: RepoState) => boolean;
  /** Optional setup function run when the step becomes active */
  setup?: () => void;
}

/** A complete tutorial lesson */
export interface TutorialLesson {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  /** Function to set the repo to the correct starting state */
  initState: () => RepoState;
}

/** Internal state of the tutorial engine */
export interface TutorialState {
  active: boolean;
  currentLessonIndex: number;
  currentStepIndex: number;
  showingExplanation: boolean;
}
