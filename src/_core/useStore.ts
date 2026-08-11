import { useSyncExternalStore } from "react";
import { subscribe } from "./store";

// Re-render a component whenever the local data store changes. Pass a selector
// that reads from the store functions; the value is recomputed on each change.
export function useStore<T>(selector: () => T): T {
  return useSyncExternalStore(subscribe, selector, selector);
}
