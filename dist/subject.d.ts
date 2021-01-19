export declare type Subscription<T> = (value: T) => void;
export declare type SubscriptionHandle = {
    unsubscribe: () => void;
    id?: string;
};
interface Subject<T> {
    name: string;
    next: (nextValue: T) => void;
    nextAssign: (nextValue: T) => void;
    subscribe: (subscription: Subscription<T>) => SubscriptionHandle;
    unsubscribe: (subscriptionId: string) => void;
    value: T;
    subscribers: {
        [key: string]: (value: T) => void;
    };
    subscribersCount: () => number;
    complete: () => void;
    debug: boolean;
}
declare class Subject<T> {
    constructor(initialValue: T, name?: string);
}
export default Subject;
