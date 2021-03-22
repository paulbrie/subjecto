---
title: Subject API
---

## Class

```ts
class Subject<T> {
  constructor(initialValue: T, name?: string) {
    this.value = initialValue;
    this.subscribers = {};
    this.name = name || "noName";
    this.debug = false;
    this.before = (nextValue) => nextValue;
    this.count = 1;
  }
}
```

## Interface

```ts
interface Subject<T> {
  // execute a check before changing the value and calling the subscribers
  // can be used to pre-process and eventually alter the incoming value
  before: (nextValue: T) => T;

  // read-only: count the number of value changes
  count: number;

  // optional: custom name
  name: string;

  // push a new value
  next: (nextValue: T | { (prevValue: T): T }) => void;

  // a subscription that will be called only once
  once: (subscription: Subscription<T>) => void;

  // if the value is an object, update using Object.assign({}, oldValue, newValue)
  nextAssign: (nextValue: Partial<T>) => void;

  // if the value is an array, push nextValue
  nextPush: (nextValue: any) => void;

  // subscribe to value changes
  subscribe: (subscription: Subscription<T>) => SubscriptionHandle;

  // if the value is a boolean, toggle it
  toggle: () => void;

  // unsubscribe
  unsubscribe: (subscriptionId: string) => void;

  // read-only: current value
  value: T;

  // read-only: current subscribers
  subscribers: {
    [key: string]: (value: T) => void;
  };

  // flush all subscriptions
  complete: () => void;

  // debug using default function or the custom provided function
  debug: ((nextValue: T) => void) | boolean;

  // placeholder to be overwritten (nice for React hooks)
  hook: (nextValue?: T) => T;
}
```
