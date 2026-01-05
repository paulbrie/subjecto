export type DeepSubjectSubscription = (value: unknown) => void;

export type Path = string;
export type DeepValue = object;

export type DeepSubscriptionHandle = {
    unsubscribe: () => void;
};

export interface DeepSubjectConstructorOptions {
    name?: string;
    updateIfStrictlyEqual?: boolean;
}

const DEFAULT_NAME = 'noName'
const DEFAULT_UPDATE_IF_STRICTLY_EQUAL = true
const DEV = process.env.NODE_ENV !== 'production'

// Optimized path matching with memoization for common patterns
const matchCache = new Map<string, boolean>()
const CACHE_SIZE_LIMIT = 100

function matchPath(pattern: string, path: string): boolean {
    const cacheKey = `${pattern}:${path}`
    const cached = matchCache.get(cacheKey)
    if (cached !== undefined) return cached

    let result: boolean

    // Fast path for exact matches
    if (pattern === path) {
        result = true
    }
    // Fast path for root wildcard
    else if (pattern === '**') {
        result = true
    }
    // Fast path for simple wildcards without recursion
    else if (!pattern.includes('**')) {
        const patternParts = pattern.split('/')
        const pathParts = path.split('/')

        if (patternParts.length !== pathParts.length) {
            result = false
        } else {
            result = patternParts.every((p, i) => p === '*' || p === pathParts[i])
        }
    }
    // Full matching for complex patterns
    else {
        result = matchPathRecursive(pattern, path)
    }

    // LRU cache management
    if (matchCache.size >= CACHE_SIZE_LIMIT) {
        const firstKey = matchCache.keys().next().value
        matchCache.delete(firstKey!)
    }
    matchCache.set(cacheKey, result)

    return result
}

function matchPathRecursive(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')

    let i = 0, j = 0
    while (i < patternParts.length && j < pathParts.length) {
        if (patternParts[i] === '**') {
            if (i === patternParts.length - 1) return true
            while (j < pathParts.length) {
                if (matchPathRecursive(patternParts.slice(i + 1).join('/'), pathParts.slice(j).join('/'))) {
                    return true
                }
                j++
            }
            return false
        } else if (patternParts[i] === '*' || patternParts[i] === pathParts[j]) {
            i++
            j++
        } else {
            return false
        }
    }

    while (i < patternParts.length && patternParts[i] === '**') i++
    return i === patternParts.length && j === pathParts.length
}

export { matchPath };

export class DeepSubject<T extends DeepValue> {
    private value: T;
    private subscribers: Map<Path, Set<DeepSubjectSubscription>>;
    private proxyCache: WeakMap<object, object>;
    private options: DeepSubjectConstructorOptions;

    /**
     * Enables debug logs (only works in development mode)
     */
    debug: boolean | ((nextValue: T) => void);
    /**
     * A function that is called before the value changes.
     */
    before: (nextValue: T) => T;
    /**
     * Count the number of value updates.
     */
    count: number;

    constructor(initialValue: T, options?: DeepSubjectConstructorOptions) {
        this.value = initialValue;
        this.subscribers = new Map();
        this.proxyCache = new WeakMap();
        this.options = {
            name: options?.name ?? DEFAULT_NAME,
            updateIfStrictlyEqual: options?.updateIfStrictlyEqual ?? DEFAULT_UPDATE_IF_STRICTLY_EQUAL,
        };
        this.debug = false;
        this.before = (nextValue) => nextValue;
        this.setupProxy();
        this.count = 1;
    }

    private setupProxy() {
        const handler: ProxyHandler<T> = {
            get: (target: T, prop: string | symbol) => {
                const value = target[prop as keyof T];
                if (value && typeof value === 'object') {
                    return this.createProxy(value, prop.toString());
                }
                return value;
            },
            set: (target: T, prop: string | symbol, value: unknown) => {
                let proxiedValue = value;
                if (value && typeof value === 'object') {
                    proxiedValue = this.createProxy(value, prop.toString());
                }
                target[prop as keyof T] = proxiedValue as T[keyof T];
                this.notifySubscribers(prop.toString());
                return true;
            }
        };

        this.value = new Proxy(this.value, handler);
    }

    private createProxy(obj: object, parentPath: string): object {
        const cached = this.proxyCache.get(obj)
        if (cached) return cached

        const handler: ProxyHandler<object> = {
            get: (target: object, prop: string | symbol) => {
                const value = target[prop as keyof typeof target];

                if (value && typeof value === 'object') {
                    return this.createProxy(value, `${parentPath}/${prop.toString()}`);
                }

                if (Array.isArray(target) && typeof prop === 'string' && [
                    'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'
                ].includes(prop)) {
                    return (...args: unknown[]): unknown => {
                        const result = (value as (...args: unknown[]) => unknown).apply(target, args);
                        this.notifySubscribers(parentPath);
                        return result;
                    };
                }
                return value;
            },
            set: (target: object, prop: string | symbol, value: unknown) => {
                let proxiedValue = value;
                if (value && typeof value === 'object') {
                    proxiedValue = this.createProxy(value, `${parentPath}/${prop.toString()}`);
                }
                target[prop as keyof typeof target] = proxiedValue as typeof target[keyof typeof target];
                this.notifySubscribers(`${parentPath}/${prop.toString()}`);
                return true;
            }
        };

        const proxy = new Proxy(obj, handler);
        this.proxyCache.set(obj, proxy);
        return proxy;
    }

    private notifySubscribers(path: string) {
        const notifySet = (subs: Set<DeepSubjectSubscription>, value: unknown) => {
            subs.forEach((subscriber) => {
                try {
                    subscriber(value);
                } catch (error) {
                    if (DEV) {
                        console.error('Error in subscriber:', error);
                    }
                }
            });
        }

        // Notify exact path subscribers
        const subscribers = this.subscribers.get(path);
        if (subscribers) {
            const value = this.getValueAtPath(path);
            notifySet(subscribers, value)
        }

        // Notify wildcard subscribers
        for (const [pattern, subs] of Array.from(this.subscribers.entries())) {
            if (pattern === path) continue

            if (pattern === '**') {
                notifySet(subs, this.value)
            } else if (matchPath(pattern, path)) {
                const patternParts = pattern.split('/');
                let value: DeepValue | undefined;

                if (patternParts.includes('*')) {
                    const pathParts = path.split('/');
                    const parentPath = pathParts.slice(0, -1).join('/');
                    const childName = pathParts[pathParts.length - 1];
                    value = this.getValueAtPath(`${parentPath}/${childName}`);
                } else if (patternParts.includes('**')) {
                    const patternIndex = patternParts.indexOf('**');
                    const beforeWildcard = patternParts.slice(0, patternIndex).join('/');
                    value = this.getValueAtPath(beforeWildcard);
                }

                if (value !== undefined) {
                    notifySet(subs, value)
                }
            }
        }
    }

    private getValueAtPath(path: string): DeepValue | undefined {
        if (path === '') return this.value

        const parts = path.split('/');
        let current: DeepValue | undefined = this.value;

        for (const part of parts) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = (current as Record<string, DeepValue>)[part];
        }

        return current;
    }

    subscribe(
        pattern: Path,
        subscriber: DeepSubjectSubscription,
        options?: { skipInitialCall?: boolean }
    ): DeepSubscriptionHandle {
        if (!this.subscribers.has(pattern)) {
            this.subscribers.set(pattern, new Set());
        }
        this.subscribers.get(pattern)!.add(subscriber);

        if (!options?.skipInitialCall) {
            const value = pattern === '**' ? this.value : this.getValueAtPath(pattern)
            try {
                subscriber(value);
            } catch (error) {
                if (DEV) {
                    console.error('Error in subscriber:', error);
                }
            }
        }

        return {
            unsubscribe: () => {
                const subscribers = this.subscribers.get(pattern);
                if (subscribers) {
                    subscribers.delete(subscriber);
                    if (subscribers.size === 0) {
                        this.subscribers.delete(pattern);
                    }
                }
            }
        };
    }

    getValue(): T {
        return this.value;
    }

    next(nextValue: T) {
        if (!this.options.updateIfStrictlyEqual && this.value === nextValue) {
            return;
        }

        this.value = this.before(nextValue);
        this.count++;

        for (const [pattern, subscribers] of Array.from(this.subscribers.entries())) {
            const value = this.getValueAtPath(pattern);
            if (value !== undefined) {
                subscribers.forEach((subscriber: DeepSubjectSubscription) => {
                    try {
                        subscriber(value);
                    } catch (error) {
                        if (DEV) {
                            console.error('Error in subscriber:', error);
                        }
                    }
                });
            }
        }

        if (DEV && this.debug) {
            if (typeof this.debug === "function") {
                this.debug(nextValue);
            } else {
                console.log(`\n--- SUBJECTO DEBUG: \`${this.options.name}\` ---`);
                console.log(` ├ nextValue:`, nextValue);
                console.log(` └ subscribers(${this.subscribers.size}): `, this, "\n");
            }
        }
    }

    unsubscribe(subscriber: DeepSubjectSubscription): void {
        for (const [pattern, subscribers] of Array.from(this.subscribers.entries())) {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                this.subscribers.delete(pattern);
            }
        }
    }
}
