export type Subscription<T> = (value: T) => void;
export type SubscriptionHandle = {
    unsubscribe: () => void
    id: symbol
};

interface SubjectConstructorOptions {
    name?: string
    updateIfStrictlyEqual?: boolean
    maxSubscribers?: number
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


class Subject<T> {
    value: T
    /**
     * The list of all the subscribers
     */
    subscribers: Map<symbol, Subscription<T>>
    /**
     * Enables debug logs
     * 
     * @param boolean
     */
    debug: boolean | ((nextValue: T) => void)
    /**
     * A function that is called before the value changes. Can be used to check/process/format the new value before updating the subscribers.  
     * 
     * @param nextValue <T>
     */
    before: (nextValue: T) => T
    /**
     * Count the number of value upates.
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
            name: typeof options === 'object' ? options?.name : DEFAULT_NAME,
            updateIfStrictlyEqual:
                typeof options === 'object' && typeof options.updateIfStrictlyEqual === 'boolean' ?
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
     * Assing a new value to the subject.
     * @para newValue <T>
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
     * Push a new item to the subject if it is an array.
     * @para value <unknown>
     */
    nextPush(value: unknown) {
        if (!Array.isArray(this.value)) {
            throw (ERROR_MESSAGES.VALUE_NOT_ARRAY)
        }
        this.next([...this.value, value] as unknown as T)
    };

    /**
     * Subscribe to the subject.
     * @param subscription <Subscription<T>>
     * @returns <SubscriptionHandle>
     */
    subscribe(
        subscription: Subscription<T>
    ): SubscriptionHandle {

        const subscriptionId = Symbol(new Date().getTime())
        this.subscribers.set(subscriptionId, subscription)

        return {
            unsubscribe: () => {
                this.unsubscribe(subscriptionId)
                if (this.debug) {
                    console.log(
                        `Subject \`${this.options.name}\` has \`${this.subscribers.size}\` subscribers left.`
                    )
                    console.log(this.options.name === DEFAULT_NAME ? INFO_MESSAGES : "")
                }
            },
            id: subscriptionId,
        }
    };

    /**
     * Unsubscribe a subscription. Returns a boolean indicating if the unsubscription was successful.
     * @param id symbol
     * @returns boolean
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
     * @param subscription Susbcription<T>
     */
    once(subscription: Subscription<T>): void {
        const handler = (this as Subject<T>).subscribe((value: T) => {
            subscription(value)
            handler.unsubscribe()
        })
    };

    /**
     * A placeholder wrapper function that can be overriden to provide custom behavior without having to override the entire class.
     * 
     * Documentation provides an example for how to use this as React hook.
     * 
     * @param defaultValue<T>
     */
    hook(defaultValue?: T) {
        if (defaultValue) {
            this.next(defaultValue)
        }
        return this.value
    };
}

export default Subject