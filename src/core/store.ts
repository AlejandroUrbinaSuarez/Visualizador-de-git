import type { Store, Subscriber, Unsubscribe } from './types';

export function createStore<T>(initialState: T): Store<T> {
  let state: T = initialState;
  const subscribers: Set<Subscriber<T>> = new Set();

  function getState(): T {
    return state;
  }

  function setState(updater: (prev: T) => T): void {
    const nextState = updater(state);
    if (nextState === state) return;
    state = nextState;
    subscribers.forEach(fn => fn(state));
  }

  function subscribe(fn: Subscriber<T>): Unsubscribe {
    subscribers.add(fn);
    return () => { subscribers.delete(fn); };
  }

  return { getState, setState, subscribe };
}
