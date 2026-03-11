import { useSyncExternalStore, useCallback } from 'react';
import { Subject } from '../subject';

/**
 * Custom hook for using Subject in React components
 * @param subject - The Subject instance to subscribe to
 * @returns A tuple containing the current value and a function to update it
 */
export function useSubject<T>(subject: Subject<T>): [T, (value: T) => void] {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const handle = subject.subscribe(onStoreChange);
            return () => handle.unsubscribe();
        },
        [subject],
    );

    const getSnapshot = useCallback(() => subject.getValue(), [subject]);

    const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setter = useCallback((newValue: T) => subject.next(newValue), [subject]);

    return [value, setter];
}
