[**subjecto**](../README.md)

***

[subjecto](../README.md) / Subject

# Class: Subject\<T\>

Defined in: [subject.ts:94](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L94)

A Subject represents a value that can be observed. It allows multiple subscribers
to be notified when the value changes.

## Example

```typescript
const mySubject = new Subject<string>("initial value");

const subscription = mySubject.subscribe(value => {
  console.log("Received value:", value);
});

mySubject.next("new value"); // Logs: "Received value: new value"

subscription.unsubscribe();
```

## Type Parameters

### T

`T`

The type of value the Subject holds.

## Constructors

### Constructor

> **new Subject**\<`T`\>(`initialValue`, `options?`): `Subject`\<`T`\>

Defined in: [subject.ts:169](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L169)

Creates a new Subject instance.

#### Parameters

##### initialValue

`T`

The initial value of the Subject.

##### options?

[`SubjectConstructorOptions`](../interfaces/SubjectConstructorOptions.md)

Optional configuration for the Subject.

#### Returns

`Subject`\<`T`\>

#### Example

```typescript
const subject1 = new Subject<string>("hello");
const subject2 = new Subject<number>(123, { name: "Counter" });
const subject3 = new Subject<boolean>(true, { updateIfStrictlyEqual: false });
```

## Properties

### before()

> **before**: (`nextValue`) => `T`

Defined in: [subject.ts:140](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L140)

A function that is called before the value is updated and subscribers are notified.
This function can be used to transform the new value before it is set.

#### Parameters

##### nextValue

`T`

The incoming new value.

#### Returns

`T`

The transformed value that will be set as the Subject's new value.

#### Example

```typescript
const mySubject = new Subject<number>(0);
mySubject.before = (value) => {
  if (value < 0) return 0; // Ensure value is not negative
  return value;
};
mySubject.next(-5);
console.log(mySubject.value); // Logs: 0
```

***

### count

> **count**: `number`

Defined in: [subject.ts:146](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L146)

Tracks the number of times the Subject's value has been updated.
It increments each time `next` is called and the value is actually changed (respecting `updateIfStrictlyEqual`).

***

### debug

> **debug**: `boolean` \| (`nextValue`) => `void`

Defined in: [subject.ts:122](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L122)

Enables or disables debug logging.
If true, logs to the console.
If a function, calls the function with the next value.

#### Example

```typescript
const mySubject = new Subject<number>(0, { name: "MyNumber" });
mySubject.debug = true;
mySubject.next(1); // Logs debug information to the console

mySubject.debug = (nextValue) => {
  console.log(`Custom debug for ${mySubject.options.name}: ${nextValue}`);
};
mySubject.next(2); // Logs "Custom debug for MyNumber: 2"
```

***

### me

> `protected` **me**: `Subject`\<`T`\>

Defined in: [subject.ts:156](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L156)

A reference to the Subject instance itself. Primarily used internally.

***

### options

> **options**: [`SubjectConstructorOptions`](../interfaces/SubjectConstructorOptions.md)

Defined in: [subject.ts:151](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L151)

The configuration options for this Subject instance.

***

### subscribers

> `protected` **subscribers**: `Map`\<`symbol`, [`Subscription`](../type-aliases/Subscription.md)\<`T`\>\>

Defined in: [subject.ts:104](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L104)

A map of all active subscriptions, with symbol IDs as keys and subscription functions as values.

***

### value

> **value**: `T`

Defined in: [subject.ts:99](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L99)

The current value of the Subject.

## Methods

### complete()

> **complete**(): `void`

Defined in: [subject.ts:381](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L381)

Unsubscribes all active subscriptions from the Subject.
After calling this, no subscribers will receive further updates unless they re-subscribe.

#### Returns

`void`

#### Example

```typescript
const mySubject = new Subject<number>(0);
const sub1 = mySubject.subscribe(v => console.log("S1:", v));
const sub2 = mySubject.subscribe(v => console.log("S2:", v));

mySubject.next(1); // S1: 1, S2: 1
mySubject.complete();
mySubject.next(2); // Nothing is logged
console.log(mySubject.subscribers.size); // Logs: 0
```

***

### hook()

> **hook**(`defaultValue?`): `T`

Defined in: [subject.ts:434](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L434)

A placeholder or adaptable hook function.
Its primary purpose is to be potentially overridden in extended classes or used in specific frameworks (e.g., React hooks).
By default, if a `defaultValue` is provided, it updates the Subject's value with it.
It then returns the current value of the Subject.

This method is designed for extensibility. For example, in a React context,
this could be adapted to use `useState` and `useEffect` to integrate with React's lifecycle.

#### Parameters

##### defaultValue?

`T`

An optional value to set as the Subject's current value.

#### Returns

`T`

The current value of the Subject.

#### Example

```typescript
const mySubject = new Subject<number>(10);

// Using .hook() without a default value
console.log(mySubject.hook()); // Logs: 10 (current value)

// Using .hook() with a default value
console.log(mySubject.hook(20)); // Logs: 20 (new value, also updates the subject)
console.log(mySubject.value);   // Logs: 20
```

***

### next()

> **next**(`nextValue`): `void`

Defined in: [subject.ts:225](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L225)

Updates the Subject's value and notifies all subscribers.
The `before` function is called with `nextValue` before the value is set.
If `options.updateIfStrictlyEqual` is false, subscribers are only notified if `nextValue` is different from the current value.

#### Parameters

##### nextValue

`T`

The new value for the Subject.

#### Returns

`void`

#### Example

```typescript
const nameSubject = new Subject<string>("Initial Name");
nameSubject.subscribe(name => console.log(`Name changed to: ${name}`));
nameSubject.next("Updated Name"); // Logs: "Name changed to: Updated Name"
```

***

### nextAssign()

> **nextAssign**(`newValue`): `void`

Defined in: [subject.ts:205](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L205)

Updates the Subject's value by merging the existing object value with a new partial object.
This method is a convenience wrapper around `next` and `Object.assign`.
Throws an error if the current value is not an object.

#### Parameters

##### newValue

`Partial`\<`T`\>

A partial object to merge with the current value.

#### Returns

`void`

#### Throws

Will throw an error if `this.value` is not an object.

#### Example

```typescript
const userSubject = new Subject<{ id: number, name: string, age?: number }>({ id: 1, name: "Alice" });
userSubject.nextAssign({ name: "Bob" });
// userSubject.value is now { id: 1, name: "Bob" }
userSubject.nextAssign({ age: 30 });
// userSubject.value is now { id: 1, name: "Bob", age: 30 }

// Example of error:
// const stringSubject = new Subject<string>("hello");
// stringSubject.nextAssign({} as any); // Throws "value must be an object"
```

***

### nextPush()

> **nextPush**(`item`): `void`

Defined in: [subject.ts:271](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L271)

Appends an item to the Subject's value if the value is an array.
This method is a convenience wrapper around `next`.
Throws an error if the current value is not an array.

#### Parameters

##### item

`unknown`

The item to push to the array.

#### Returns

`void`

#### Throws

Will throw an error if `this.value` is not an array.

#### Example

```typescript
const listSubject = new Subject<string[]>(["a", "b"]);
listSubject.subscribe(list => console.log(`List updated: ${list.join(", ")}`));
listSubject.nextPush("c"); // Logs: "List updated: a, b, c"
// listSubject.value is now ["a", "b", "c"]

// Example of error:
// const stringSubject = new Subject<string>("hello");
// stringSubject.nextPush("world" as any); // Throws "value must be an array"
```

***

### once()

> **once**(`subscription`): `void`

Defined in: [subject.ts:404](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L404)

Subscribes to the Subject for a single emission.
After the subscription function is called once, it is automatically unsubscribed.

#### Parameters

##### subscription

[`Subscription`](../type-aliases/Subscription.md)\<`T`\>

The function to call with the Subject's next value.

#### Returns

`void`

#### Example

```typescript
const mySubject = new Subject<string>("initial");

mySubject.once(value => {
  console.log("Once received:", value); // This will log "Once received: first update"
});

mySubject.next("first update");
mySubject.next("second update"); // The 'once' subscription will not receive this.
```

***

### subscribe()

> **subscribe**(`subscription`): [`SubscriptionHandle`](../type-aliases/SubscriptionHandle.md)

Defined in: [subject.ts:296](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L296)

Subscribes to changes in the Subject's value.

#### Parameters

##### subscription

[`Subscription`](../type-aliases/Subscription.md)\<`T`\>

A function that will be called with the new value whenever the Subject's value changes.

#### Returns

[`SubscriptionHandle`](../type-aliases/SubscriptionHandle.md)

A `SubscriptionHandle` object which contains an `unsubscribe` method and the subscription `id`.

#### Example

```typescript
const mySubject = new Subject<number>(0);
const handle = mySubject.subscribe(value => {
  console.log("New value:", value);
});

mySubject.next(1); // Logs: "New value: 1"

handle.unsubscribe();
mySubject.next(2); // Nothing logged, as the subscription is removed.
```

***

### toggle()

> **toggle**(): `void`

Defined in: [subject.ts:360](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L360)

Toggles the Subject's value if it is a boolean.
If the current value is not a boolean, this method does nothing.

#### Returns

`void`

#### Example

```typescript
const toggleSubject = new Subject<boolean>(false);
toggleSubject.subscribe(value => console.log(`Toggled to: ${value}`));
toggleSubject.toggle(); // Logs: "Toggled to: true"
toggleSubject.toggle(); // Logs: "Toggled to: false"

const numberSubject = new Subject<number>(0);
numberSubject.toggle(); // Does nothing, value remains 0
console.log(numberSubject.value); // Logs: 0
```

***

### unsubscribe()

> **unsubscribe**(`id`): `boolean`

Defined in: [subject.ts:341](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L341)

Unsubscribes a specific subscription from the Subject.

#### Parameters

##### id

`symbol`

The `Symbol` ID of the subscription to remove. This is obtained from the `SubscriptionHandle`.

#### Returns

`boolean`

`true` if the subscription was found and removed, `false` otherwise.

#### Example

```typescript
const mySubject = new Subject<number>(0);
const handle1 = mySubject.subscribe(value => console.log("Sub1:", value));
const handle2 = mySubject.subscribe(value => console.log("Sub2:", value));

mySubject.unsubscribe(handle1.id);
mySubject.next(1); // Only "Sub2: 1" is logged.
```
