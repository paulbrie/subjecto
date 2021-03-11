import log from "./utils/log";
export type Subscription<T> = (value: T) => void;
export type SubscriptionHandle = {
  unsubscribe: () => void;
  id?: string;
};

interface Subject<T> {
  before: (nextValue: T) => T;
  count: number;
  name: string;
  next: (nextValue: T|{ (prevValue:T):T }) => void;
  once: (subscription: Subscription<T>) => void;
  nextAssign: (nextValue: Partial<T>) => void;
  nextPush: (nextValue: any) => void;
  subscribe: (subscription: Subscription<T>) => SubscriptionHandle;
  toggle: () => void
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

class Subject<T> {
  constructor(initialValue: T, name?: string) {
    this.value = initialValue;
    this.subscribers = {};
    this.name = name || "noName";
    this.debug = false;
    this.before = (nextValue) => nextValue;
    this.count = 1
  }
}

Subject.prototype.next = function (nextValue) {
  this.value = this.before(typeof nextValue === 'function' ? nextValue(this.value): nextValue);
  this.count++
  Object.keys(this.subscribers).forEach((key) => {
    if (this.subscribers[key]) {
      this.subscribers[key](this.value);
    }
  });
  if (this.debug) {
    if (typeof this.debug === "function") {
      this.debug(nextValue);
    } else {
      console.log(`\n--- SUBJECTO DEBUG: \`${this.name}\` ---`)
      console.log(` ├ nextValue:`, nextValue);
      console.log(
        ` └ subscribers(${Object.keys(this.subscribers).length}): `,
        this,
        '\n'
      );
    }
  }
};

Subject.prototype.nextAssign = function (newValue) {
  try {
    this.next(Object.assign(this.value, newValue));
  } catch (error) {
    this.next(newValue);
  }
  this.count++
};

Subject.prototype.nextPush = function (value: typeof Subject.prototype.value) {
  if (Array.isArray(this.value)) {
    this.next([...this.value, value]);
    this.count++
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
          `Subject \`${this.name}\` has \`${
            Object.keys(this.subscribers).length
          }\` subscribers left.`,
          "debug"
        );
      }
    },
    id,
  };
};

Subject.prototype.toggle = function() {
    if (typeof this.value === 'boolean') {
        this.next(!this.value)
    }
}

/**
 * Unsubscribes the listener from the subject
 * @param id
 */
Subject.prototype.unsubscribe = function (id) {
  delete this.subscribers[id];
};

/**
 * Unsubscribes all current listeners
 */
Subject.prototype.complete = function () {
  Object.keys(this.subscribers).forEach((key) => this.unsubscribe(key));
};

/**
 * Execute once and then unsubscribe
 */
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
Subject.prototype.hook = function (defaultValue) {
  if (defaultValue) {
    this.next(defaultValue);
  }
  return this.value;
};

export default Subject;
