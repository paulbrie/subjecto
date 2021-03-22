---
title: Debug a subject
slug: /debug-a-subject
sidebar_label: Debug
---

## Out of the box

At any moment in time you can toggle the debugging process of a given subject. Just set the `debug` attribute to `true`:

```js
import { Subject } from "subjecto";

// init
const value = new Subject(1);

// enable debugging
value.debug = true;

// handler
const onValueChange = (update) => console.log(update);

// subscribe to value updates
value.subscribe(onValueChange);
// --- console output ---
// SUBJECTO noName / new subscription - (1)
// └ {1616354720971.0: ƒ ()}

value.next(2);
// --- console output ---
// 2
// --- SUBJECTO DEBUG: `noName` ---
// ├ nextValue: 2
// └ subscribers(1):  Subject { value: 3, subscribers: ..., name: "noName", debug: true, .... }
```

By default, the default debug function:

- informs you about new subscriptions (or unsubscriptions)
- shows value changes
- lets you inspect all the properties of your subject after each value change

## Custom debug function

If the default debug mechanism is too verbose or if you have more advanced needs, you can pass to your subject's `debug` attribute a custom function:

```js
import { Subject } from "subjecto";

// init
const value = new Subject(1);

// custom debugging
value.debug = (value) => console.log(value, new Error().stack);

// handler
const onValueChange = (update) => console.log(update);

// subscribe to value updates
value.subscribe(onValueChange);
// --- console output ---
// SUBJECTO noName / new subscription - (1)
// └ {1616354720971.0: ƒ ()}

value.next(2);
// --- console output ---
// 2
// Error
//   at Subject.value.debug ...
//   at Subject.next ...
//   ...
```

## Note

By default, each new `subject` instance has a default name `noName`. If your application becomes bigger, this might be confusing if you debug several subjects simultaneously. To solve this issue you can pass a custom name to your subject when you instantiate it:

```js
import { Subject } from "subjecto";

// init
const value = new Subject(1, "My increment subject");
```
