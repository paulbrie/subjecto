[**subjecto**](../README.md)

***

[subjecto](../README.md) / SubscriptionHandle

# Type Alias: SubscriptionHandle

> **SubscriptionHandle** = `object`

Defined in: [subject.ts:11](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L11)

Represents a handle to a subscription, allowing unsubscribing.

## Properties

### id

> **id**: `symbol`

Defined in: [subject.ts:19](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L19)

A unique identifier for the subscription.

***

### unsubscribe()

> **unsubscribe**: () => `void`

Defined in: [subject.ts:15](https://github.com/paulbrie/subjecto/blob/1495145ee287010b4056758fd8e9ddab66bb639b/src/subject.ts#L15)

Unsubscribes the associated subscription from the Subject.

#### Returns

`void`
