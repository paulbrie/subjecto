import { useSyncExternalStore, useRef, useCallback } from 'react';
import { DeepSubject } from '../deepSubject';
import type { Paths, PathValue } from './types';

/**
 * Helper function to get value at path.
 * Traverses through the proxy so nested objects return stable cached proxies.
 */
function getValueAtPath<T extends object>(subject: DeepSubject<T>, path: string): unknown {
    const parts = path.split('/');
    let value: unknown = subject.getValue();
    for (const part of parts) {
        if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
            value = (value as Record<string, unknown>)[part];
        } else {
            return undefined;
        }
    }
    return value;
}

/**
 * Helper function to set value at path via proxy (triggers notifications).
 */
function setValueAtPath<T extends object>(subject: DeepSubject<T>, path: string, newValue: unknown): void {
    const parts = path.split('/');
    let current: unknown = subject.getValue();
    for (let i = 0; i < parts.length - 1; i++) {
        if (current && typeof current === 'object') {
            current = (current as Record<string, unknown>)[parts[i]];
        } else {
            return;
        }
    }
    if (current && typeof current === 'object') {
        (current as Record<string, unknown>)[parts[parts.length - 1]] = newValue;
    }
}

/**
 * Default shallow equality check for selector results.
 */
function shallowEqual<R>(a: R, b: R): boolean {
    if (Object.is(a, b)) return true;
    if (
        typeof a !== 'object' || a === null ||
        typeof b !== 'object' || b === null
    ) {
        return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (
            !Object.prototype.hasOwnProperty.call(b, key) ||
            !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        ) {
            return false;
        }
    }
    return true;
}

/**
 * Custom hook for using DeepSubject in React components with type-safe paths.
 *
 * Uses a version counter internally so mutable proxy references still trigger
 * re-renders via useSyncExternalStore.
 *
 * @param subject - The DeepSubject instance to subscribe to
 * @param path - The path to subscribe to (e.g., "user/name" or "cart/items")
 * @returns A tuple containing the current value and a setter function
 *
 * @example
 * const [userName, setUserName] = useDeepSubject(appState, "user/name");
 * const [cartItems] = useDeepSubject(appState, "cart/items");
 */
export function useDeepSubject<
    T extends object,
    P extends Paths<T>
>(
    subject: DeepSubject<T>,
    path: P
): [PathValue<T, P>, (value: PathValue<T, P>) => void] {
    const storeRef = useRef({ value: getValueAtPath(subject, path), version: 0 });

    // Stable subscribe function - only changes when subject or path changes
    // path/** matches both the exact path and all descendants (** matches zero segments)
    const subscribe = useCallback((onStoreChange: () => void) => {
        const handle = subject.subscribe(`${path}/**`, () => {
            storeRef.current = {
                value: getValueAtPath(subject, path),
                version: storeRef.current.version + 1,
            };
            onStoreChange();
        }, { skipInitialCall: true });

        return () => handle.unsubscribe();
    }, [subject, path]);

    const getSnapshot = useCallback(() => storeRef.current, []);

    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setter = useCallback(
        (newValue: PathValue<T, P>) => setValueAtPath(subject, path as string, newValue),
        [subject, path],
    );

    return [snapshot.value as PathValue<T, P>, setter];
}

/**
 * Custom hook for using DeepSubject with type safety and custom selector.
 *
 * @param subject - The DeepSubject instance to subscribe to
 * @param path - The path to subscribe to (type-safe)
 * @param selector - Function to extract/transform the value from the state
 * @param isEqual - Optional equality function (defaults to shallow equality)
 * @returns The selected value
 */
export function useDeepSubjectSelector<
    T extends object,
    P extends Paths<T>,
    R
>(
    subject: DeepSubject<T>,
    path: P,
    selector: (value: PathValue<T, P>) => R,
    isEqual: (a: R, b: R) => boolean = shallowEqual,
): R {
    // Use refs for selector and isEqual so subscribe closure stays stable
    const selectorRef = useRef(selector);
    selectorRef.current = selector;
    const isEqualRef = useRef(isEqual);
    isEqualRef.current = isEqual;

    const storeRef = useRef<{ result: R; version: number }>({
        result: selector(getValueAtPath(subject, path) as PathValue<T, P>),
        version: 0,
    });

    const subscribe = useCallback((onStoreChange: () => void) => {
        const onChange = () => {
            const value = getValueAtPath(subject, path);
            const newResult = selectorRef.current(value as PathValue<T, P>);

            if (!isEqualRef.current(storeRef.current.result, newResult)) {
                storeRef.current = {
                    result: newResult,
                    version: storeRef.current.version + 1,
                };
                onStoreChange();
            }
        };

        const handle = subject.subscribe(`${path}/**`, onChange, { skipInitialCall: true });

        return () => handle.unsubscribe();
    }, [subject, path]);

    const getSnapshot = useCallback(() => storeRef.current, []);

    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return snapshot.result;
}
