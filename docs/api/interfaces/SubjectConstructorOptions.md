[**subjecto**](../README.md)

***

[subjecto](../README.md) / SubjectConstructorOptions

# Interface: SubjectConstructorOptions

Defined in: [subject.ts:25](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L25)

Options for configuring a Subject instance.

## Properties

### maxSubscribers?

> `optional` **maxSubscribers**: `number`

Defined in: [subject.ts:40](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L40)

An optional maximum number of subscribers allowed.

#### Default

```ts
undefined (no limit)
```

***

### name?

> `optional` **name**: `string`

Defined in: [subject.ts:30](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L30)

An optional name for the Subject, used for debugging purposes.

#### Default

```ts
'noName'
```

***

### updateIfStrictlyEqual?

> `optional` **updateIfStrictlyEqual**: `boolean`

Defined in: [subject.ts:35](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L35)

If true, the Subject will update subscribers even if the new value is strictly equal (===) to the current value.

#### Default

```ts
true
```
