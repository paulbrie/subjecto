---
title: Building a store
---

## Store module

As soon as an app starts to grow, we need to manage its state in a centralised way. One way of achieving this is by creating a store module.
Here's a basic example:

```ts title="store.ts"
import { Subject } from Subjecto;

const store = {
  clickCounter: new Subject(0),
  user: new Subject({
    firstName: "John",
    lastName: "Doe",
  }),
};

export default store;
```

## React example (basic)

```tsx title="index.tsx"
import React from "react";
import store from "./store";

const App = () => {
  // load existing values from the store
  const [clickCounter, setClickCounter] = useState(store.clickCounter.value)
  const [user, setUser] = useState = (store.user.value)

  // increment function
  const increment = () => {
    store.clickCounter.next(store.clickCounter.value + 1)}
  }

  // subscribe to store events on mount
  useEffect(() => {
    const clickSubscription = store.clickCounter.subscribe(setClickCounter)
    const userSubscription = store.user.subscribe(setUser)
    return () => {
      // unsubscribe from store events on unmount
      clickSubscription.unsubscribe()
      userSubscription.unsubscribe()
    }
  }, [])

  return (
    <div>
      <div>User: ${user.firstName} ${user.lastName}</div>
      <button
        onClick={increment}
      >
        Click Me! (${clickCounter})
      </button>
    </div>
  );
};
```

## React with hooks

The previous implementation is functional but verbose. React hooks, implemented at the store level, offer a very elegant solution.

```ts title="store.ts"
import { useState, useEffect } from "react";
import { Subject } from Subjecto;

// add a default onMount hook
Subject.prototype.hook = function () {
  const [value, setValue] = useState(this.value);
  useEffect(() => this.subscribe(setValue).unsubscribe, []);
  return value;
};

const store = {
  clickCounter: new Subject(0),
  user: new Subject({
    firstName: "John",
    lastName: "Doe",
  }),
};

export default store;
```

Now, our React component becomes much simpler:

```tsx title="index.tsx"
import React from "react";
import store from "./store";

const App = () => {
  // hook values to the store
  const clickCounter = store.clickCounter.hook()
  const user = store.user.hook()

  // increment function
  const increment = () => {
    store.clickCounter.next(store.clickCounter.value + 1)}
  }

  return (
    <div>
      <div>User: ${user.firstName} ${user.lastName}</div>
      <button
        onClick={increment}
      >
        Click Me! (${clickCounter})
      </button>
    </div>
  );
};
```
