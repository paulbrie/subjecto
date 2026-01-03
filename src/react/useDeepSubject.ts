import { useSyncExternalStore, useRef } from 'react';
import { DeepSubject } from '../deepSubject';
import type { Paths, PathValue } from './types';

/**
 * Helper function to get value at path
 * Returns primitive values directly, or a stable reference for objects/arrays
 */
function getValueAtPath<T extends object>(subject: DeepSubject<T>, path: string): unknown {
    const parts = path.split('/');
    let value: unknown = subject.getValue();
    for (const part of parts) {
        if (value && typeof value === 'object' && !Array.isArray(value) && part in value) {
            value = (value as Record<string, unknown>)[part];
        } else {
            return undefined;
        }
    }
    return value;
}

/**
 * Custom hook for using DeepSubject in React components with type-safe paths
 * @param subject - The DeepSubject instance to subscribe to
 * @param path - The path to subscribe to (e.g., "user/name" or "cart/items")
 * @returns The current value at the specified path with correct typing
 * 
 * @example
 * const userName = useDeepSubject(appState, "user/name"); // TypeScript knows this is string
 * const cartItems = useDeepSubject(appState, "cart/items"); // TypeScript knows this is Array<...>
 */
export function useDeepSubject<
    T extends object,
    P extends Paths<T>
>(
    subject: DeepSubject<T>,
    path: P
): PathValue<T, P> {
    const getSnapshot = () => getValueAtPath(subject, path);

    return useSyncExternalStore(
        (onStoreChange) => {
            // Use skipInitialCall option to prevent DeepSubject from calling the callback immediately
            // React's useSyncExternalStore will get the initial value via getSnapshot instead
            // Subscribe with /** wildcard to catch nested property changes
            const subscribePath = `${path}/**`;
            const handle = subject.subscribe(subscribePath, onStoreChange, { skipInitialCall: true });
            return () => handle.unsubscribe();
        },
        getSnapshot,
        getSnapshot // Server snapshot
    ) as PathValue<T, P>;
}

/**
 * Custom hook for using DeepSubject with type safety and custom selector
 * @param subject - The DeepSubject instance to subscribe to
 * @param path - The path to subscribe to (type-safe)
 * @param selector - Function to extract/transform the value from the state
 * @returns The selected value
 */
export function useDeepSubjectSelector<
    T extends object,
    P extends Paths<T>,
    R
>(
    subject: DeepSubject<T>,
    path: P,
    selector: (value: PathValue<T, P>) => R
): R {
    // Cache to prevent infinite loops when selector returns new object/array references
    const lastValueRef = useRef<unknown>(undefined);
    const lastResultRef = useRef<R | undefined>(undefined);
    const lastResultStringRef = useRef<string | undefined>(undefined);

    const getSnapshot = () => {
        const value = getValueAtPath(subject, path);
        
        // Only recompute if the input value reference changed
        if (value !== lastValueRef.current) {
            lastValueRef.current = value;
            const newResult = selector(value as PathValue<T, P>);
            
            // For objects/arrays, compare serialized versions to detect actual changes
            if (typeof newResult === 'object' && newResult !== null) {
                const newResultString = JSON.stringify(newResult);
                if (newResultString !== lastResultStringRef.current) {
                    lastResultStringRef.current = newResultString;
                    lastResultRef.current = newResult;
                }
            } else {
                // For primitives, use direct comparison
                lastResultRef.current = newResult;
            }
        }
        
        return lastResultRef.current!;
    };

    return useSyncExternalStore(
        (onStoreChange) => {
            // Use skipInitialCall option to prevent DeepSubject from calling the callback immediately
            // React's useSyncExternalStore will get the initial value via getSnapshot instead
            // Subscribe with /** wildcard to catch nested property changes
            const subscribePath = `${path}/**`;
            const handle = subject.subscribe(subscribePath, () => {
                // When notified of a change, always recalculate the selector
                // The callback is only called when the value actually changed
                const value = getValueAtPath(subject, path);
                const newResult = selector(value as PathValue<T, P>);

                // Always update value ref since we were notified
                lastValueRef.current = value;

                // Compare result and notify if changed
                // For objects/arrays, compare serialized versions to detect actual content changes
                if (typeof newResult === 'object' && newResult !== null) {
                    const newResultString = JSON.stringify(newResult);
                    // Always update cache and notify if serialized result changed
                    // This handles cases where object reference is same but content changed
                    if (newResultString !== lastResultStringRef.current) {
                        lastResultStringRef.current = newResultString;
                        lastResultRef.current = newResult;
                        onStoreChange();
                    }
                } else {
                    // For primitives, compare directly
                    if (newResult !== lastResultRef.current) {
                        lastResultRef.current = newResult;
                        onStoreChange();
                    }
                }
            }, { skipInitialCall: true });
            return () => handle.unsubscribe();
        },
        getSnapshot,
        getSnapshot // Server snapshot
    ) as R;
}

