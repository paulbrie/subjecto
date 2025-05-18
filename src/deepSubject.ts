import { DEFAULT_NAME, DEFAULT_UPDATE_IF_STRICTLY_EQUAL } from './subject';

export type Path = string;
export type DeepValue = object;
export type SubscriptionHandle = {
    unsubscribe: () => void;
};

export interface DeepSubjectConstructorOptions {
    name?: string;
    updateIfStrictlyEqual?: boolean;
}

export type Subscription<T> = (value: T | undefined) => void;

function matchPath(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    // Handle root level **
    if (pattern === '**') return true;

    let i = 0, j = 0;
    while (i < patternParts.length && j < pathParts.length) {
        if (patternParts[i] === '**') {
            // If ** is the last pattern part, it matches everything
            if (i === patternParts.length - 1) return true;
            // Try to find a match for the next pattern part
            while (j < pathParts.length) {
                if (matchPath(patternParts.slice(i + 1).join('/'), pathParts.slice(j).join('/'))) {
                    return true;
                }
                j++;
            }
            return false;
        } else if (patternParts[i] === '*' || patternParts[i] === pathParts[j]) {
            i++;
            j++;
        } else {
            return false;
        }
    }

    // Handle trailing ** in pattern
    while (i < patternParts.length && patternParts[i] === '**') i++;
    return i === patternParts.length && j === pathParts.length;
}

export class DeepSubject<T extends DeepValue> {
    private value: T;
    private subscribers: Map<Path, Set<Subscription<DeepValue>>>;
    private proxyCache: WeakMap<object, object>;
    private options: DeepSubjectConstructorOptions;
    /**
     * Enables debug logs
     */
    debug: boolean | ((nextValue: T) => void);
    /**
     * A function that is called before the value changes. Can be used to check/process/format the new value before updating the subscribers.
     */
    before: (nextValue: T) => T;

    constructor(initialValue: T, options?: DeepSubjectConstructorOptions) {
        this.value = initialValue;
        this.subscribers = new Map();
        this.proxyCache = new WeakMap();
        this.options = {
            name: options?.name || DEFAULT_NAME,
            updateIfStrictlyEqual: options?.updateIfStrictlyEqual ?? DEFAULT_UPDATE_IF_STRICTLY_EQUAL,
        };
        this.debug = false;
        this.before = (nextValue) => nextValue;
        this.setupProxy();
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
                if (value && typeof value === 'object') {
                    value = this.createProxy(value, prop.toString());
                }
                target[prop as keyof T] = value as T[keyof T];
                this.notifySubscribers(prop.toString());
                return true;
            }
        };

        this.value = new Proxy(this.value, handler);
    }

    private createProxy(obj: object, parentPath: string): object {
        if (this.proxyCache.has(obj)) {
            return this.proxyCache.get(obj)!;
        }

        const handler: ProxyHandler<object> = {
            get: (target: object, prop: string | symbol) => {
                const value = target[prop as keyof typeof target];
                if (value && typeof value === 'object') {
                    return this.createProxy(value, `${parentPath}/${prop.toString()}`);
                }
                return value;
            },
            set: (target: object, prop: string | symbol, value: unknown) => {
                if (value && typeof value === 'object') {
                    value = this.createProxy(value, `${parentPath}/${prop.toString()}`);
                }
                target[prop as keyof typeof target] = value as typeof target[keyof typeof target];
                this.notifySubscribers(`${parentPath}/${prop.toString()}`);
                return true;
            }
        };

        const proxy = new Proxy(obj, handler);
        this.proxyCache.set(obj, proxy);
        return proxy;
    }

    private notifySubscribers(path: string) {
        // Notify exact path subscribers
        const subscribers = this.subscribers.get(path);
        if (subscribers) {
            const value = this.getValueAtPath(path);
            subscribers.forEach((subscriber) => {
                try {
                    subscriber(value);
                } catch (error) {
                    console.error('Error in subscriber:', error);
                }
            });
        }

        // Notify wildcard subscribers
        for (const [pattern, subscribers] of Array.from(this.subscribers.entries())) {
            if (pattern !== path) {
                if (pattern === '**') {
                    // Root level ** should always get the root object
                    const value = this.value;
                    if (value !== undefined) {
                        subscribers.forEach((subscriber) => {
                            try {
                                subscriber(value);
                            } catch (error) {
                                console.error('Error in subscriber:', error);
                            }
                        });
                    }
                } else if (matchPath(pattern, path)) {
                    const patternParts = pattern.split('/');
                    let value: DeepValue | undefined;

                    if (patternParts.includes('*')) {
                        // For * pattern, get the direct child value
                        const pathParts = path.split('/');
                        const parentPath = pathParts.slice(0, -1).join('/');
                        const childName = pathParts[pathParts.length - 1];
                        value = this.getValueAtPath(`${parentPath}/${childName}`);
                    } else if (patternParts.includes('**')) {
                        // For user/**, always return getValueAtPath('user')
                        const patternIndex = patternParts.indexOf('**');
                        const beforeWildcard = patternParts.slice(0, patternIndex).join('/');
                        value = this.getValueAtPath(beforeWildcard);
                    }

                    if (value !== undefined) {
                        subscribers.forEach((subscriber) => {
                            try {
                                subscriber(value);
                            } catch (error) {
                                console.error('Error in subscriber:', error);
                            }
                        });
                    }
                }
            }
        }
    }

    private getValueAtPath(path: string): DeepValue | undefined {
        if (path === '') {
            return this.value;
        }

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

    subscribe(pattern: Path, subscriber: Subscription<DeepValue>): SubscriptionHandle {
        if (!this.subscribers.has(pattern)) {
            this.subscribers.set(pattern, new Set());
        }
        this.subscribers.get(pattern)!.add(subscriber);

        // Notify immediately with the current value
        let value: DeepValue | undefined;
        if (pattern === '**') {
            value = this.value;
        } else {
            value = this.getValueAtPath(pattern);
        }
        try {
            subscriber(value);
        } catch (error) {
            console.error('Error in subscriber:', error);
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

        for (const [pattern, subscribers] of Array.from(this.subscribers.entries())) {
            const value = this.getValueAtPath(pattern);
            if (value !== undefined) {
                subscribers.forEach((subscriber) => {
                    try {
                        subscriber(value);
                    } catch (error) {
                        console.error('Error in subscriber:', error);
                    }
                });
            }
        }

        if (this.debug) {
            if (typeof this.debug === "function") {
                this.debug(nextValue);
            } else {
                console.log(`\n--- SUBJECTO DEBUG: \`${this.options.name}\` ---`);
                console.log(` ├ nextValue:`, nextValue);
                console.log(
                    ` └ subscribers(${this.subscribers.size}): `,
                    this,
                    "\n"
                );
            }
        }
    }
} 