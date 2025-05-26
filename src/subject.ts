/**
 * Represents a function that receives updates from a Subject.
 * @template T The type of value the subscription receives.
 * @param value The new value from the Subject.
 */
export type Subscription<T> = (value: T) => void;

/**
 * Represents a handle to a subscription, allowing unsubscribing.
 */
export type SubscriptionHandle = {
    /**
     * Unsubscribes the associated subscription from the Subject.
     */
    unsubscribe: () => void;
    /**
     * A unique identifier for the subscription.
     */
    id: symbol;
};

/**
 * Options for configuring a Subject instance.
 */
export interface SubjectConstructorOptions {
    /**
     * An optional name for the Subject, used for debugging purposes.
     * @default 'noName'
     */
    name?: string;
    /**
     * If true, the Subject will update subscribers even if the new value is strictly equal (===) to the current value.
     * @default true
     */
    updateIfStrictlyEqual?: boolean;
    /**
     * An optional maximum number of subscribers allowed.
     * @default undefined (no limit)
     */
    maxSubscribers?: number;
}

/**
 * Default name for Subjects if not specified in options.
 */
export const DEFAULT_NAME = 'noName'
/**
 * Default behavior for updating if the new value is strictly equal to the current value.
 */
export const DEFAULT_UPDATE_IF_STRICTLY_EQUAL = true

import { SubjectInvalidValueError, SubjectNotAnArrayError } from "./errors";

// It seems ERROR_MESSAGES is still used for the error messages themselves.
// So, we keep it, but the throw statements will use the new error classes.
/**
 * Collection of error messages used by the Subject class.
 */
export const ERROR_MESSAGES = {
    /**
     * Error message when attempting to use `nextAssign` with a non-object value.
     */
    VALUE_NOT_OBJECT: 'value must be an object',
    /**
     * Error message when attempting to use `nextPush` with a non-array value.
     */
    VALUE_NOT_ARRAY: 'value must be an array',
}

/**
 * Collection of informational messages used by the Subject class.
 */
export const INFO_MESSAGES = {
    /**
     * Informational message suggesting to use a custom name for better debugging.
     */
    SHOULD_USE_A_NAME: 'You can set a custom name using the initialization options for a better debugging experience.'
}

/**
 * A Subject represents a value that can be observed. It allows multiple subscribers
 * to be notified when the value changes.
 *
 * @template T The type of value the Subject holds.
 * @example
 * ```typescript
 * const mySubject = new Subject<string>("initial value");
 *
 * const subscription = mySubject.subscribe(value => {
 *   console.log("Received value:", value);
 * });
 *
 * mySubject.next("new value"); // Logs: "Received value: new value"
 *
 * subscription.unsubscribe();
 * ```
 */
class Subject<T> {
    /**
     * The current value of the Subject.
     * @public
     */
    value: T
    /**
     * A map of all active subscriptions, with symbol IDs as keys and subscription functions as values.
     * @protected
     */
    subscribers: Map<symbol, Subscription<T>>
    /**
     * Enables or disables debug logging.
     * If true, logs to the console.
     * If a function, calls the function with the next value.
     * @public
     * @example
     * ```typescript
     * const mySubject = new Subject<number>(0, { name: "MyNumber" });
     * mySubject.debug = true;
     * mySubject.next(1); // Logs debug information to the console
     *
     * mySubject.debug = (nextValue) => {
     *   console.log(`Custom debug for ${mySubject.options.name}: ${nextValue}`);
     * };
     * mySubject.next(2); // Logs "Custom debug for MyNumber: 2"
     * ```
     */
    debug: boolean | ((nextValue: T) => void)
    /**
     * A function that is called before the value is updated and subscribers are notified.
     * This function can be used to transform the new value before it is set.
     * @public
     * @param nextValue The incoming new value.
     * @returns The transformed value that will be set as the Subject's new value.
     * @example
     * ```typescript
     * const mySubject = new Subject<number>(0);
     * mySubject.before = (value) => {
     *   if (value < 0) return 0; // Ensure value is not negative
     *   return value;
     * };
     * mySubject.next(-5);
     * console.log(mySubject.value); // Logs: 0
     * ```
     */
    before: (nextValue: T) => T
    /**
     * Tracks the number of times the Subject's value has been updated.
     * It increments each time `next` is called and the value is actually changed (respecting `updateIfStrictlyEqual`).
     * @public
     */
    count: number
    /**
     * The configuration options for this Subject instance.
     * @public
     */
    options: SubjectConstructorOptions
    /**
     * A reference to the Subject instance itself. Primarily used internally.
     * @protected
     */
    me: Subject<T>

    /**
     * Creates a new Subject instance.
     * @param initialValue The initial value of the Subject.
     * @param options Optional configuration for the Subject.
     * @example
     * ```typescript
     * const subject1 = new Subject<string>("hello");
     * const subject2 = new Subject<number>(123, { name: "Counter" });
     * const subject3 = new Subject<boolean>(true, { updateIfStrictlyEqual: false });
     * ```
     */
    constructor(initialValue: T, options?: SubjectConstructorOptions) {
        this.me = this
        this.options = {
            name: typeof options === 'object' ? options?.name : DEFAULT_NAME,
            updateIfStrictlyEqual:
                typeof options === 'object' && typeof options.updateIfStrictlyEqual === 'boolean' ?
                    options.updateIfStrictlyEqual :
                    DEFAULT_UPDATE_IF_STRICTLY_EQUAL,
            maxSubscribers: options?.maxSubscribers
        }
        this.value = initialValue
        this.subscribers = new Map()
        this.debug = false
        this.before = (nextValue) => nextValue
        this.count = 1 // Initialized to 1 as the initialValue is considered the first "update"
    }

    /**
     * Updates the Subject's value by merging the existing object value with a new partial object.
     * This method is a convenience wrapper around `next` and `Object.assign`.
     * Throws an error if the current value is not an object.
     * @param newValue A partial object to merge with the current value.
     * @throws Will throw an error if `this.value` is not an object.
     * @example
     * ```typescript
     * const userSubject = new Subject<{ id: number, name: string, age?: number }>({ id: 1, name: "Alice" });
     * userSubject.nextAssign({ name: "Bob" });
     * // userSubject.value is now { id: 1, name: "Bob" }
     * userSubject.nextAssign({ age: 30 });
     * // userSubject.value is now { id: 1, name: "Bob", age: 30 }
     *
     * // Example of error:
     * // const stringSubject = new Subject<string>("hello");
     * // stringSubject.nextAssign({} as any); // Throws "value must be an object"
     * ```
     */
    nextAssign(newValue: Partial<T>) {
        if (typeof this.value !== "object" || this.value === null) {
            throw new SubjectInvalidValueError(ERROR_MESSAGES.VALUE_NOT_OBJECT)
        }
        this.next(Object.assign({}, this.value, newValue))
    };


    /**
     * Updates the Subject's value and notifies all subscribers.
     * The `before` function is called with `nextValue` before the value is set.
     * If `options.updateIfStrictlyEqual` is false, subscribers are only notified if `nextValue` is different from the current value.
     * @param nextValue The new value for the Subject.
     * @example
     * ```typescript
     * const nameSubject = new Subject<string>("Initial Name");
     * nameSubject.subscribe(name => console.log(`Name changed to: ${name}`));
     * nameSubject.next("Updated Name"); // Logs: "Name changed to: Updated Name"
     * ```
     */
    next(nextValue: T) {
        if (!this.options.updateIfStrictlyEqual && this.value === nextValue) {
            return
        }

        this.value = this.before(nextValue)

        this.count++

        this.subscribers.forEach((subscription) => {
            subscription(this.value)
        })

        if (this.debug) {
            if (typeof this.debug === "function") {
                this.debug(nextValue)
            } else {
                console.log(`\n--- SUBJECTO DEBUG: \`${this.options.name}\` ---`)
                console.log(` ├ nextValue:`, nextValue)
                console.log(
                    ` └ subscribers(${Object.keys(this.subscribers).length}): `,
                    this,
                    "\n"
                )
            }
        }
    };

    /**
     * Appends an item to the Subject's value if the value is an array.
     * This method is a convenience wrapper around `next`.
     * Throws an error if the current value is not an array.
     * @param item The item to push to the array.
     * @throws Will throw an error if `this.value` is not an array.
     * @example
     * ```typescript
     * const listSubject = new Subject<string[]>(["a", "b"]);
     * listSubject.subscribe(list => console.log(`List updated: ${list.join(", ")}`));
     * listSubject.nextPush("c"); // Logs: "List updated: a, b, c"
     * // listSubject.value is now ["a", "b", "c"]
     *
     * // Example of error:
     * // const stringSubject = new Subject<string>("hello");
     * // stringSubject.nextPush("world" as any); // Throws "value must be an array"
     * ```
     */
    nextPush(item: unknown) {
        if (!Array.isArray(this.value)) {
            throw new SubjectNotAnArrayError(ERROR_MESSAGES.VALUE_NOT_ARRAY)
        }
        this.next([...this.value, item] as unknown as T)
    };

    /**
     * Subscribes to changes in the Subject's value.
     *
     * @param subscription A function that will be called with the new value whenever the Subject's value changes.
     * @returns A `SubscriptionHandle` object which contains an `unsubscribe` method and the subscription `id`.
     * @example
     * ```typescript
     * const mySubject = new Subject<number>(0);
     * const handle = mySubject.subscribe(value => {
     *   console.log("New value:", value);
     * });
     *
     * mySubject.next(1); // Logs: "New value: 1"
     *
     * handle.unsubscribe();
     * mySubject.next(2); // Nothing logged, as the subscription is removed.
     * ```
     */
    subscribe(
        subscription: Subscription<T>
    ): SubscriptionHandle {
        if (this.options.maxSubscribers && this.subscribers.size >= this.options.maxSubscribers) {
            console.warn(`Subject \`${this.options.name}\` has reached its maximum subscriber limit of ${this.options.maxSubscribers}. Subscription rejected.`);
            // Return a dummy handle that does nothing, or throw an error
            return { unsubscribe: () => {}, id: Symbol('max_subscribers_reached') };
        }

        const subscriptionId = Symbol(String(new Date().getTime()) + String(this.subscribers.size));
        this.subscribers.set(subscriptionId, subscription);

        // Optionally, immediately call the subscription with the current value
        // subscription(this.value);

        return {
            unsubscribe: () => {
                const unsubscribed = this.unsubscribe(subscriptionId);
                if (unsubscribed && this.debug) {
                    console.log(
                        `Subject \`${this.options.name}\` unsubscribed ${String(subscriptionId)}. \`${this.subscribers.size}\` subscribers left.`
                    );
                    if (this.options.name === DEFAULT_NAME) {
                        console.log(INFO_MESSAGES.SHOULD_USE_A_NAME);
                    }
                }
            },
            id: subscriptionId,
        };
    };

    /**
     * Unsubscribes a specific subscription from the Subject.
     * @param id The `Symbol` ID of the subscription to remove. This is obtained from the `SubscriptionHandle`.
     * @returns `true` if the subscription was found and removed, `false` otherwise.
     * @example
     * ```typescript
     * const mySubject = new Subject<number>(0);
     * const handle1 = mySubject.subscribe(value => console.log("Sub1:", value));
     * const handle2 = mySubject.subscribe(value => console.log("Sub2:", value));
     *
     * mySubject.unsubscribe(handle1.id);
     * mySubject.next(1); // Only "Sub2: 1" is logged.
     * ```
     */
    unsubscribe(id: symbol): boolean {
        return this.subscribers.delete(id);
    };

    /**
     * Toggles the Subject's value if it is a boolean.
     * If the current value is not a boolean, this method does nothing.
     * @example
     * ```typescript
     * const toggleSubject = new Subject<boolean>(false);
     * toggleSubject.subscribe(value => console.log(`Toggled to: ${value}`));
     * toggleSubject.toggle(); // Logs: "Toggled to: true"
     * toggleSubject.toggle(); // Logs: "Toggled to: false"
     *
     * const numberSubject = new Subject<number>(0);
     * numberSubject.toggle(); // Does nothing, value remains 0
     * console.log(numberSubject.value); // Logs: 0
     * ```
     */
    toggle() {
        if (typeof this.value === "boolean") {
            this.me.next(!this.value as unknown as T);
        }
    };

    /**
     * Unsubscribes all active subscriptions from the Subject.
     * After calling this, no subscribers will receive further updates unless they re-subscribe.
     * @example
     * ```typescript
     * const mySubject = new Subject<number>(0);
     * const sub1 = mySubject.subscribe(v => console.log("S1:", v));
     * const sub2 = mySubject.subscribe(v => console.log("S2:", v));
     *
     * mySubject.next(1); // S1: 1, S2: 1
     * mySubject.complete();
     * mySubject.next(2); // Nothing is logged
     * console.log(mySubject.subscribers.size); // Logs: 0
     * ```
     */
    complete() {
        Array.from(this.subscribers.keys()).forEach((id) => {
            this.me.unsubscribe(id);
        });
    }

    /**
     * Subscribes to the Subject for a single emission.
     * After the subscription function is called once, it is automatically unsubscribed.
     *
     * @param subscription The function to call with the Subject's next value.
     * @example
     * ```typescript
     * const mySubject = new Subject<string>("initial");
     *
     * mySubject.once(value => {
     *   console.log("Once received:", value); // This will log "Once received: first update"
     * });
     *
     * mySubject.next("first update");
     * mySubject.next("second update"); // The 'once' subscription will not receive this.
     * ```
     */
    once(subscription: Subscription<T>): void {
        const handler = this.subscribe((value: T) => {
            subscription(value);
            handler.unsubscribe();
        });
    };

    /**
     * A placeholder or adaptable hook function.
     * Its primary purpose is to be potentially overridden in extended classes or used in specific frameworks (e.g., React hooks).
     * By default, if a `defaultValue` is provided, it updates the Subject's value with it.
     * It then returns the current value of the Subject.
     *
     * This method is designed for extensibility. For example, in a React context,
     * this could be adapted to use `useState` and `useEffect` to integrate with React's lifecycle.
     *
     * @param defaultValue An optional value to set as the Subject's current value.
     * @returns The current value of the Subject.
     * @example
     * ```typescript
     * const mySubject = new Subject<number>(10);
     *
     * // Using .hook() without a default value
     * console.log(mySubject.hook()); // Logs: 10 (current value)
     *
     * // Using .hook() with a default value
     * console.log(mySubject.hook(20)); // Logs: 20 (new value, also updates the subject)
     * console.log(mySubject.value);   // Logs: 20
     * ```
     */
    hook(defaultValue?: T): T {
        if (defaultValue !== undefined) {
            this.next(defaultValue)
        }
        return this.value
    };
}

export default Subject