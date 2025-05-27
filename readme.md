[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/paulbrie/subjecto)
[![CI](https://github.com/paulbrie/subjecto/actions/workflows/main.yml/badge.svg)](https://github.com/paulbrie/subjecto/actions/workflows/main.yml)
![npm](https://img.shields.io/npm/dm/subjecto)

# Subjecto

## What is it?

Subjecto is a minimalistic state management library with no dependencies. Its API is inspired from RxJs' Subject.

## API

```javascript
import { subject } from "subjecto";

// init
const value = new subject(new Date().toISOString())

// subscribe
const handler = value.subscribe((newValue) => {
  console.log("subscription 1", newValue);
});

// optionally, set debug to true to see all listeners and value updates
value.debug = true;

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

## Licence

MIT
