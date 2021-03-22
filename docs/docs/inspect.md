---
title: Inspect
---

## Built-in Inspect utility

Subjecto comes with an inspect tool which will enable you to inspect all the subjects found in a given store.

```ts title="store.ts"
import { Subject, inspect } from Subjecto;

const store = {
  clickCounter: new Subject(0),
  user: new Subject({
    firstName: "John",
    lastName: "Doe",
  }),
  ...
};

// inspect recursively all the subjects found in the store object
inspect(store);

export default store;
```

Once enabled, you'll see in your console the flow of all the data changes occurring in all your store with the elapsed time between each event.

Output example:

![Docusaurus logo](/img/inspect-example.png)
