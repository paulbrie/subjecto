export declare type Subscription<T> = (value: T) => void;
export declare type SubscriptionHandle = {
    unsubscribe: () => void;
    id?: string;
};
interface Subject<T> {
    before: (nextValue: T) => T;
    name: string;
    next: (nextValue: T | {
        (prevValue: T): T;
    }) => void;
    once: (subscription: Subscription<T>) => void;
    nextAssign: (nextValue: Partial<T>) => void;
    nextPush: (nextValue: any) => void;
    subscribe: (subscription: Subscription<T>) => SubscriptionHandle;
    unsubscribe: (subscriptionId: string) => void;
    value: T;
    subscribers: {
        [key: string]: (value: T) => void;
    };
    subscribersCount: () => number;
    complete: () => void;
    debug: ((nextValue: T) => void) | boolean;
    hook: (nextValue?: T) => T;
}
declare class Subject<T> {
    constructor(initialValue: T, name?: string);
}
export default Subject;
