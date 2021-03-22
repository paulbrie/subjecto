---
title: Getting Started
slug: /
---

## Install Subjecto

```shell
npm i subjecto
```

## Basic usage

```js
import { Subject } from "subjecto";

// init
const value = new Subject(1);

// handler
const onValueChange = (update) => console.log(update);

// subscribe to value updates
const subscription = value.subscribe(onValueChange);

// push a new value
value.next(2); // console output: --> 2

// once you're done, you can unsubscribe
subscription.unsubscribe();
```
