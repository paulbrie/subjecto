/**
 * Helper utilities for Subject - tree-shakeable
 * Import only the helpers you need to keep bundle size minimal
 */

import { Subject } from './subject'

/**
 * Object assign helper for Subject.
 * Merges a partial value with the current value.
 *
 * @param subject - The subject to update
 * @param newValue - Partial value to merge
 * @throws Error if the current value is not an object
 *
 * @example
 * ```typescript
 * import { nextAssign } from 'subjecto/helpers'
 *
 * const subject = new Subject({ a: 1, b: 2 })
 * nextAssign(subject, { b: 3 }) // { a: 1, b: 3 }
 * ```
 */
export function nextAssign<T extends object>(
  subject: Subject<T>,
  newValue: Partial<T>
): void {
  subject.nextAssign(newValue)
}

/**
 * Push helper for Subject with array values.
 * Appends a new item to the array.
 *
 * @param subject - The subject with array value
 * @param value - Value to push
 * @throws Error if the current value is not an array
 *
 * @example
 * ```typescript
 * import { nextPush } from 'subjecto/helpers'
 *
 * const subject = new Subject([1, 2, 3])
 * nextPush(subject, 4) // [1, 2, 3, 4]
 * ```
 */
export function nextPush<T>(subject: Subject<T[]>, value: T): void {
  subject.nextPush(value)
}

/**
 * Toggle helper for Subject with boolean values.
 * Flips the boolean value.
 *
 * @param subject - The subject with boolean value
 * @throws Error if the current value is not a boolean
 *
 * @example
 * ```typescript
 * import { toggle } from 'subjecto/helpers'
 *
 * const subject = new Subject(false)
 * toggle(subject) // true
 * toggle(subject) // false
 * ```
 */
export function toggle(subject: Subject<boolean>): void {
  subject.toggle()
}

/**
 * Subscribe once helper.
 * Subscribes to the next value change only, then automatically unsubscribes.
 *
 * @param subject - The subject to subscribe to
 * @param callback - Callback function to call once
 *
 * @example
 * ```typescript
 * import { once } from 'subjecto/helpers'
 *
 * const subject = new Subject(0)
 * once(subject, (value) => {
 *   console.log('This will only be called once:', value)
 * })
 * ```
 */
export function once<T>(
  subject: Subject<T>,
  callback: (value: T) => void
): void {
  subject.once(callback)
}

/**
 * Complete helper.
 * Unsubscribes all subscribers from the subject.
 *
 * @param subject - The subject to complete
 *
 * @example
 * ```typescript
 * import { complete } from 'subjecto/helpers'
 *
 * const subject = new Subject(0)
 * complete(subject) // Removes all subscribers
 * ```
 */
export function complete<T>(subject: Subject<T>): void {
  subject.complete()
}
