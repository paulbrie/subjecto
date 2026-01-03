/**
 * Utility types for type-safe DeepSubject paths
 */

import type { DeepSubject } from '../deepSubject';

/**
 * Converts a nested object type into all possible path strings
 * Example: { user: { name: string } } -> "user" | "user/name"
 * 
 * Note: Arrays are treated as terminal values (you subscribe to "cart/items", not "cart/items/0")
 */
export type Paths<T> = T extends object
    ? T extends readonly unknown[] // Exclude arrays from path generation
    ? never
    : {
        [K in keyof T]: K extends string
        ? T[K] extends object
        ? T[K] extends readonly unknown[] // Arrays are terminal
        ? K
        : K | `${K}/${Paths<T[K]>}`
        : K
        : never;
    }[keyof T]
    : never;

/**
 * Gets the value type at a given path
 * Example: PathValue<AppState, "user/name"> -> string
 */
export type PathValue<T, P extends Paths<T>> = P extends `${infer K}/${infer Rest}`
    ? K extends keyof T
    ? Rest extends Paths<T[K]>
    ? PathValue<T[K], Rest>
    : never
    : never
    : P extends keyof T
    ? T[P]
    : never;

/**
 * Helper type to extract paths from a DeepSubject type
 */
export type DeepSubjectPaths<T extends DeepSubject<object>> = T extends DeepSubject<infer U>
    ? Paths<U>
    : never;

