# Subjecto

## What is it?

Subjecto is a minimal state management library.
It is composed of a standalone observer called "subject" and of a state store composer (coming soon)

## API

```
import { subject } from "subjecto";

// init
const value = new subject("", "my subject");

// debug
value.debug = true;

// subscribe
const handler = value.subscribe((newValue) => {
  console.log("subscription 1", newValue);
});

// push a new value
value.next(new Date().toISOString());

// get handlers uid
console.log(handler.id);

// unsubscribe
handler.unsubscribe();

// flush all subscriptions
value.complete();

```

## Live Demo

https://codesandbox.io/s/distracted-meadow-vsqwd?file=/src/index.ts

## Licence

MIT
