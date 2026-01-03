import { useSyncExternalStore } from 'react';
import { Subject } from '../subject';

/**
 * Custom hook for using Subject in React components
 * @param subject - The Subject instance to subscribe to
 * @returns A tuple containing the current value and a function to update it
 */
export function useSubject<T>(subject: Subject<T>): [T, (value: T) => void] {
    const getSnapshot = () => subject.getValue();

    const value = useSyncExternalStore(
        (onStoreChange) => {
            const handle = subject.subscribe(onStoreChange);
            return () => handle.unsubscribe();
        },
        getSnapshot,
        getSnapshot // Server snapshot
    );

    return [value, (newValue: T) => subject.next(newValue)];
}

