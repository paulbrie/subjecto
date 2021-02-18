import log from "./utils/log";
export type Subscription<T> = (value: T) => void;
export type SubscriptionHandle = {
  unsubscribe: () => void;
  id?: string;
};

interface Subject<T> {
  name: string;
  next: (nextValue: T) => void;
  once: (subscription: Subscription<T>) => void;
  nextAssign: (nextValue: T) => void;
  nextPush: (nextValue: T) => void;
  subscribe: (subscription: Subscription<T>) => SubscriptionHandle;
  unsubscribe: (subscriptionId: string) => void;
  value: T;
  subscribers: {
    [key: string]: (value: T) => void;
  };
  subscribersCount: () => number;
  complete: () => void;
  debug: boolean;
  hook: (nextValue?: T) => T;
}

class Subject<T> {
  constructor(initialValue: T, name?: string) {
    this.value = initialValue;
    this.subscribers = {};
    this.name = name || "noName";
    this.debug = false;
  }
}

Subject.prototype.next = function (nextValue: typeof Subject.prototype.value) {
  this.value = nextValue;
  Object.keys(this.subscribers).forEach((key) => {
    if (this.subscribers[key]) {
      this.subscribers[key](this.value);
    }
  });
  if (this.debug) {
    console.log(` ├ nextValue:`, nextValue);
    console.log(
      ` ├ subscribers(${Object.keys(this.subscribers).length}): `,
      this
    );
    console.log(" └ Stack:");
  }
};

Subject.prototype.nextAssign = function (
  newValue: typeof Subject.prototype.value
) {
  try {
    this.next(Object.assign(this.value, newValue));
  } catch (error) {
    this.next(newValue);
  }
};

Subject.prototype.nextPush = function (value: typeof Subject.prototype.value) {
  if (Array.isArray(this.value)) {
    this.next([...this.value, value]);
  }
};

Subject.prototype.subscribe = function <T>(
  subscription: Subscription<T>
): SubscriptionHandle {
  const subscriptionExistsAtIndex = Object.values(this.subscribers).indexOf(
    subscription
  );
  let id = "";
  if (subscriptionExistsAtIndex === -1) {
    id = `${new Date().getTime()}.${Object.keys(this.subscribers).length}`;
    this.subscribers[id] = subscription;
    if (this.debug) {
      log(
        `${this.name} / new subscription - (${
          Object.keys(this.subscribers).length
        })`,
        `debug`
      );
      console.log(" └", this.subscribers);
    }
  } else {
    id = Object.values(Object.keys(this.subscribers))[
      subscriptionExistsAtIndex
    ];
  }

  return {
    unsubscribe: () => {
      this.unsubscribe(id);
      if (this.debug) {
        log(
          `${this.name} has  ${
            Object.keys(this.subscribers).length
          }  subscribers left`,
          "debug"
        );
      }
    },
    id,
  };
};

Subject.prototype.unsubscribe = function (id) {
  delete this.subscribers[id];
};

Subject.prototype.complete = function () {
  Object.keys(this.subscribers).forEach((key) => this.unsubscribe(key));
};

Subject.prototype.once = function <T>(subscription: Subscription<T>): void {
  const handler = (this as Subject<T>).subscribe((value: T) => {
    subscription(value);
    handler.unsubscribe();
  });
};

/**
 * The hook function is a placeholder/template function "slot" meant to be overriden.
 * For example, it could be used to attach a React hook to this subject.
 */
Subject.prototype.hook = function (
  defaultValue?: typeof Subject.prototype.value
) {
  if (defaultValue) {
    this.next(defaultValue);
  }
  return this.value;
};

export default Subject;
