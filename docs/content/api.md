---
title: Subject API
---

## Helper Types

```ts
type Subscription<T> = (value: T) => void;

type SubscriptionHandle = {
    unsubscribe: () => void;
    id: symbol;
};

interface SubjectConstructorOptions {
    name?: string;
    updateIfStrictlyEqual?: boolean;
}
```

## Class

```ts
class Subject<T> {
  value: T;
  subscribers: Map<symbol, Subscription<T>>;
  debug: boolean | ((nextValue: T) => void);
  before: (nextValue: T) => T;
  count: number;
  options: SubjectConstructorOptions;

  constructor(initialValue: T, options?: SubjectConstructorOptions) {
    this.options = {
        name: typeof options === 'object' ? options?.name : 'noName', // DEFAULT_NAME from subject.ts
        updateIfStrictlyEqual:
            typeof options === 'object' && typeof options.updateIfStrictlyEqual === 'boolean' ?
                options.updateIfStrictlyEqual :
                true, // DEFAULT_UPDATE_IF_STRICTLY_EQUAL from subject.ts
    };
    this.value = initialValue;
    this.subscribers = new Map();
    this.debug = false; // Default value
    this.before = (nextValue) => nextValue; // Default behavior
    this.count = 1; // Initial count
  }

  // Method summaries (actual implementation details are in the source)

  /**
   * Object assign wrap for the `next` method.
   * Throws if current value is not an object.
   */
  nextAssign(newValue: Partial<T>): void;

  /**
   * Assigns a new value to the subject and notifies subscribers.
   * Considers `options.updateIfStrictlyEqual`.
   * Calls `before` hook.
   * Increments `count`.
   * Triggers `debug` logging if enabled.
   */
  next(nextValue: T): void;

  /**
   * Push a new item to the subject if its current value is an array.
   * Throws if current value is not an array.
   */
  nextPush(value: unknown): void;

  /**
   * Subscribe to value changes.
   * Returns a handle with an `unsubscribe` method and `id`.
   */
  subscribe(subscription: Subscription<T>): SubscriptionHandle;

  /**
   * Unsubscribe a specific subscription by its ID.
   * Returns true if a subscription was removed, false otherwise.
   */
  unsubscribe(id: symbol): boolean;

  /**
   * Toggles the value if it is a boolean.
   */
  toggle(): void;

  /**
   * Unsubscribes all current subscribers.
   */
  complete(): void;

  /**
   * A subscription that is called only once, then unsubscribed automatically.
   */
  once(subscription: Subscription<T>): void;

  /**
   * A placeholder wrapper function. Can be overridden for custom behavior,
   * e.g., for integrating with UI framework hooks like React.
   * If `defaultValue` is provided, it calls `next()` with this value.
   * Returns the current subject value.
   */
  hook(defaultValue?: T): T;
}
```

## Interface

This interface describes the public API of a `Subject` instance.

```ts
interface Subject<T> {
  /**
   * A function that is called before the value changes.
   * Can be used to check/process/format the new value before updating the subscribers.
   */
  before: (nextValue: T) => T;

  /**
   * Read-only: count the number of value updates. Starts at 1.
   */
  count: number;

  /**
   * Read-only: Subject options provided at construction.
   * Includes `name` and `updateIfStrictlyEqual`.
   */
  options: SubjectConstructorOptions;

  /**
   * Assigns a new value to the subject and notifies subscribers.
   */
  next: (nextValue: T) => void;

  /**
   * A subscription that will be called only once, then unsubscribed automatically.
   */
  once: (subscription: Subscription<T>) => void;

  /**
   * If the subject's value is an object, updates it using `Object.assign({}, oldValue, newValue)`.
   * Throws an error if the current value is not an object.
   */
  nextAssign: (nextValue: Partial<T>) => void;

  /**
   * If the subject's value is an array, pushes `nextValue` into it.
   * Throws an error if the current value is not an array.
   * The type of `nextValue` is `unknown` as it's pushed into an array that could hold mixed types,
   * though typically it would be an element of type T or a related type if T is `Array<SomeType>`.
   */
  nextPush: (nextValue: unknown) => void;

  /**
   * Subscribe to value changes.
   * Returns a `SubscriptionHandle` which contains an `unsubscribe` method and the subscription `id`.
   */
  subscribe: (subscription: Subscription<T>) => SubscriptionHandle;

  /**
   * If the subject's value is a boolean, toggles it.
   */
  toggle: () => void;

  /**
   * Unsubscribe a specific subscription by its `id`.
   * Returns `true` if a subscription was found and removed, `false` otherwise.
   */
  unsubscribe: (id: symbol) => boolean;

  /**
   * Read-only: current value of the subject.
   */
  value: T;

  /**
   * Read-only: A Map of current subscribers, with symbol IDs as keys and subscription functions as values.
   */
  subscribers: Map<symbol, Subscription<T>>;

  /**
   * Unsubscribes all current subscribers from the subject.
   */
  complete: () => void;

  /**
   * Enables or disables debug logging.
   * If `true`, uses default console logging.
   * If a function, calls that function with `nextValue` when `next()` is called.
   * Default is `false`.
   */
  debug: ((nextValue: T) => void) | boolean;

  /**
   * A placeholder wrapper function that can be overridden to provide custom behavior,
   * for example, to integrate with UI framework hooks (e.g., React).
   * If `defaultValue` is provided, it calls `next()` with this value.
   * Returns the current subject value.
   */
  hook: (defaultValue?: T) => T;
}
```
