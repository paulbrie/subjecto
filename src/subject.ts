export type SubjectSubscription<T> = (value: T) => void;
export type SubscriptionHandle = {
    unsubscribe: () => void
    id: symbol
};

export interface SubjectConstructorOptions {
    name?: string
    updateIfStrictlyEqual?: boolean
}

// defaults
export const DEFAULT_NAME = 'noName'
export const DEFAULT_UPDATE_IF_STRICTLY_EQUAL = true

// export ERROR_MESSAGES for tests
export const ERROR_MESSAGES = {
    VALUE_NOT_OBJECT: 'value must be an object',
    VALUE_NOT_ARRAY: 'value must be an array',
}

export const INFO_MESSAGES = {
    SHOULD_USE_A_NAME: 'You can set a custom name using the initialization options for a better debugging experience.'
}


export class Subject<T> {
    private value: T
    /**
     * The list of all the subscribers
     */
    subscribers: Map<symbol, SubjectSubscription<T>>
    /**
     * Enables debug logs
     */
    debug: boolean | ((nextValue: T) => void)
    /**
     * A function that is called before the value changes. Can be used to check/process/format the new value before updating the subscribers.  
     */
    before: (nextValue: T) => T
    /**
     * Count the number of value updates.
     */
    count: number
    /**
     * Subject options
     */
    options: SubjectConstructorOptions
    me: Subject<T>

    constructor(initialValue: T, options?: SubjectConstructorOptions) {
        this.me = this
        this.options = {
            name: typeof options === 'object' && options !== null
                ? (options.name !== undefined ? options.name : DEFAULT_NAME)
                : DEFAULT_NAME,
            updateIfStrictlyEqual:
                typeof options === 'object' && options !== null && typeof options.updateIfStrictlyEqual === 'boolean' ?
                    options.updateIfStrictlyEqual :
                    DEFAULT_UPDATE_IF_STRICTLY_EQUAL,
        }
        this.value = initialValue
        this.subscribers = new Map()
        this.debug = false
        this.before = (nextValue) => nextValue
        this.count = 1
    }

    /**
     * Object assign wrap for the `next` method.
     */
    nextAssign(newValue: Partial<T>) {
        if (typeof this.value !== "object") {
            throw (ERROR_MESSAGES.VALUE_NOT_OBJECT)
        }
        this.next(Object.assign({}, this.value, newValue))
    };


    /**
     * Assign a new value to the subject.
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
                    ` └ subscribers(${this.subscribers.size}): `,
                    this,
                    "\n"
                )
            }
        }
    };

    /**
     * Push a new item to the subject if it is an array.
     */
    nextPush(value: unknown) {
        if (!Array.isArray(this.value)) {
            throw (ERROR_MESSAGES.VALUE_NOT_ARRAY)
        }
        this.next([...this.value, value] as unknown as T)
    };

    /**
     * Subscribe to the subject.
     */
    subscribe(
        subscription: SubjectSubscription<T>
    ): SubscriptionHandle {
        const id = Symbol('subscriber');
        this.subscribers.set(id, subscription);
        subscription(this.value);
        return {
            unsubscribe: () => {
                this.unsubscribe(id);
                if (this.debug) {
                    console.log(
                        `Subject \`${this.options.name}\` has \`${this.subscribers.size}\` subscribers left.`
                    );
                    console.log(this.options.name === DEFAULT_NAME ? INFO_MESSAGES : "");
                }
            },
            id,
        };
    };

    /**
     * Unsubscribe a subscription. Returns a boolean indicating if the unsubscription was successful.
     */
    unsubscribe(id: symbol) {
        return this.subscribers.delete(id)
    };

    /**
     * Toggles a boolean value.
     */
    toggle() {
        if (typeof this.value === "boolean") {
            this.me.next(!this.value as unknown as T)
        }
    };

    /**
     * Unsubscribes all the subscribers.
     */
    complete() {
        Array.from(this.subscribers.keys()).forEach((id) => {
            this.me.unsubscribe(id)
        })
    }

    /**
     * A subscription that is called once, then unsubscribed automatically.
     */
    once(subscription: SubjectSubscription<T>): void {
        const id = Symbol('subscriber-once');
        this.subscribers.set(id, (value: T) => {
            subscription(value);
            this.unsubscribe(id);
        });
        // Immediately call with the current value
        const subscriber = this.subscribers.get(id);
        if (subscriber) {
            subscriber(this.value);
        }
    };

    getValue(): T {
        return this.value;
    }
}

export default Subject