<p align="center">
  <img src="./src/logo.svg" alt="Subjecto Logo" width="120" />
</p>

![npm](https://img.shields.io/npm/dm/subjecto)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/subjecto)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)

# Subjecto

A minimalistic, zero-dependency JavaScript state management library built with TypeScript. Subjecto provides a simple and powerful API for managing application state with full type safety and modern JavaScript features.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [API Reference](#api-reference)
  - [Subject](#subject)
  - [DeepSubject](#deepsubject)
- [Usage Examples](#usage-examples)
  - [Example 8: Using Built-in React Hooks](#example-8-using-built-in-react-hooks)
- [Advanced Topics](#advanced-topics)
  - [Path Patterns in DeepSubject](#path-patterns-in-deepsubject)
  - [Performance Comparison](#performance-comparison)
  - [Error Handling](#error-handling)
  - [Memory Management](#memory-management)
  - [Circular References](#circular-references)
- [TypeScript Support](#typescript-support)
  - [Type Exports](#type-exports)
  - [Advanced Type Utilities](#advanced-type-utilities-react-integration)
- [Best Practices](#best-practices)
- [Performance Considerations](#performance-considerations)
- [Migration Guide](#migration-guide)
- [React Integration](#react-integration)
  - [Built-in React Hooks](#built-in-react-hooks)
  - [useSubject](#usesubjectt)
  - [useDeepSubject](#usedeepsubjectt-p)
  - [useDeepSubjectSelector](#usedeepsubjectselectort-p-r)
  - [Understanding useSyncExternalStore](#understanding-usesyncexternalstore-advanced)
  - [Performance Tips for React](#performance-tips-for-react)
  - [Server-Side Rendering (SSR)](#server-side-rendering-ssr)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install subjecto
```

```bash
yarn add subjecto
```

```bash
pnpm add subjecto
```

## Quick Start

### Basic Subject Usage

```typescript
import { Subject } from "subjecto";

// Create a subject with an initial value
const count = new Subject<number>(0);

// Subscribe to changes
const subscription = count.subscribe((value) => {
  console.log("Count changed:", value);
});

// Update the value
count.next(1); // Logs: "Count changed: 1"
count.next(2); // Logs: "Count changed: 2"

// Get current value
console.log(count.getValue()); // 2

// Unsubscribe
subscription.unsubscribe();
```

### DeepSubject Usage

```typescript
import { DeepSubject } from "subjecto";

// Create a deep subject with nested data
const state = new DeepSubject({
  user: {
    name: "John",
    age: 30,
    preferences: {
      theme: "dark",
    },
  },
});

// Subscribe to specific paths
state.subscribe("user/name", (name) => {
  console.log("Name changed:", name);
});

// Mutate values directly
state.getValue().user.name = "Jane"; // Triggers subscription

// Unsubscribe
const handle = state.subscribe("user/name", callback);
handle.unsubscribe();
```

## Features

- **Zero Dependencies**: No external dependencies, keeping your bundle size minimal (peer dependency on React 18+ for optional React hooks)
- **Type Safety**: Fully typed with TypeScript, no `any` types used
- **Two State Management Patterns**:
  - **Subject**: Simple value container with subscription pattern
  - **DeepSubject**: Deep reactive state with path-based subscriptions
- **Built-in React Hooks**: First-class React integration with type-safe hooks (`useSubject`, `useDeepSubject`, `useDeepSubjectSelector`)
- **Path-based Subscriptions**: Subscribe to nested properties using string paths with full TypeScript inference
- **Wildcard Support**: Use `*` and `**` patterns for flexible subscriptions
- **Automatic Change Detection**: DeepSubject automatically detects nested mutations
- **Error Resilient**: Subscriber errors don't break other subscriptions
- **Debug Support**: Built-in debugging capabilities
- **Memory Efficient**: Uses WeakMap for proxy caching, preventing memory leaks
- **Circular Reference Safe**: Handles circular references gracefully
- **SSR Compatible**: Works seamlessly with server-side rendering (Next.js, Remix, etc.)

## API Reference

### Subject

A simple, type-safe container for a value that notifies subscribers when the value changes.

#### Constructor

```typescript
new Subject<T>(initialValue: T, options?: SubjectConstructorOptions)
```

**Parameters:**

- `initialValue` (required): The initial value of the subject
- `options` (optional): Configuration object
  - `name?: string` - Custom name for debugging (default: `'noName'`)
  - `updateIfStrictlyEqual?: boolean` - When `true` (default), subscribers are notified even when the new value is strictly equal (`===`) to the old value. Set to `false` to skip notifications for equal values, which can improve performance when you know the value hasn't meaningfully changed

**Example:**

```typescript
const subject = new Subject<string>("hello", {
  name: "mySubject",
  updateIfStrictlyEqual: false,
});
```

#### Methods

##### `subscribe(subscription: SubjectSubscription<T>): SubscriptionHandle`

Subscribe to value changes. The subscription callback is immediately called with the current value.

**Parameters:**

- `subscription`: A function that receives the new value when it changes

**Returns:** A `SubscriptionHandle` object with:

- `unsubscribe(): void` - Unsubscribe from updates
- `id: symbol` - Unique identifier for this subscription

**Example:**

```typescript
const handle = subject.subscribe((value) => {
  console.log("New value:", value);
});

// Later...
handle.unsubscribe();
```

##### `next(nextValue: T): void`

Update the subject's value and notify all subscribers.

**Parameters:**

- `nextValue`: The new value

**Example:**

```typescript
subject.next("world");
```

##### `nextAssign(newValue: Partial<T>): void`

Update the subject's value by merging with the current value (object assign). Only works when the current value is an object.

**Throws:** `Error` if the current value is not an object

**Example:**

```typescript
const subject = new Subject({ a: 1, b: 2 });
subject.nextAssign({ b: 3 }); // { a: 1, b: 3 }
```

##### `nextPush(value: unknown): void`

Push a new item to the subject if it's an array.

**Throws:** `Error` if the current value is not an array

**Example:**

```typescript
const subject = new Subject([1, 2, 3]);
subject.nextPush(4); // [1, 2, 3, 4]
```

##### `toggle(): void`

Toggle a boolean value. Only works when the current value is a boolean.

**Example:**

```typescript
const subject = new Subject(false);
subject.toggle(); // true
subject.toggle(); // false
```

##### `once(subscription: SubjectSubscription<T>): void`

Subscribe to the next value change only. The subscription is automatically removed after being called once.

**Example:**

```typescript
subject.once((value) => {
  console.log("This will only be called once:", value);
});
```

##### `complete(): void`

Unsubscribe all subscribers at once.

**Example:**

```typescript
subject.complete();
```

##### `unsubscribe(id: symbol): boolean`

Unsubscribe a specific subscription by its ID.

**Parameters:**

- `id`: The subscription ID (from `SubscriptionHandle.id`)

**Returns:** `true` if the subscription was found and removed, `false` otherwise

##### `getValue(): T`

Get the current value of the subject.

**Returns:** The current value

#### Properties

##### `subscribers: Map<symbol, SubjectSubscription<T>>`

A Map of all active subscriptions. Useful for debugging and introspection.

##### `debug: boolean | ((nextValue: T) => void)`

Enable debug logging. Set to `true` for default logging, or provide a custom function.

**Example:**

```typescript
// Default debug logging
subject.debug = true;

// Custom debug function
subject.debug = (value) => {
  console.log("Custom debug:", value);
};
```

##### `before: (nextValue: T) => T`

A function that transforms the value before it's set and subscribers are notified. Useful for validation, normalization, or transformation.

**Example:**

```typescript
subject.before = (value) => {
  // Ensure value is always positive
  return Math.abs(value);
};

subject.next(-5); // Actually sets 5
```

##### `count: number`

The number of times `next()` has been called (including initialization). Starts at `1`.

##### `options: SubjectConstructorOptions`

The options passed to the constructor.

##### `me: Subject<T>`

Self-reference to the subject instance. This property returns the Subject itself and can be useful for method chaining or passing the subject instance as a parameter while maintaining type safety.

---

### DeepSubject

A reactive state container that automatically tracks changes to nested objects and arrays, allowing you to subscribe to specific paths in your data structure.

#### Constructor

```typescript
new DeepSubject<T extends DeepValue>(initialValue: T, options?: DeepSubjectConstructorOptions)
```

**Parameters:**

- `initialValue` (required): The initial object value (must be an object)
- `options` (optional): Configuration object
  - `name?: string` - Custom name for debugging (default: `'noName'`)
  - `updateIfStrictlyEqual?: boolean` - Whether to notify subscribers when the new value is strictly equal (`===`) to the current value (default: `true`)

**Example:**

```typescript
const state = new DeepSubject(
  {
    user: { name: "John" },
  },
  {
    name: "appState",
    updateIfStrictlyEqual: false,
  }
);
```

#### Methods

##### `subscribe(pattern: Path, subscriber: DeepSubjectSubscription, options?: SubscribeOptions): DeepSubscriptionHandle`

Subscribe to changes at a specific path or pattern. By default, the subscriber is immediately called with the current value at that path.

**Parameters:**

- `pattern`: A path string (e.g., `"user/name"`) or pattern with wildcards (`"user/*"`, `"user/**"`)
- `subscriber`: A function that receives the value when it changes
- `options` (optional): Configuration object
  - `skipInitialCall?: boolean` - When `true`, the subscriber will not be called immediately with the current value. This is useful when integrating with React's `useSyncExternalStore` to avoid duplicate renders. Default: `false`

**Returns:** A `DeepSubscriptionHandle` object with:

- `unsubscribe(): void` - Unsubscribe from updates

**Path Examples:**

- `"user"` - Subscribe to the `user` property
- `"user/name"` - Subscribe to `user.name`
- `"user/profile/details"` - Subscribe to `user.profile.details`

**Wildcard Patterns:**

- `"user/*"` - Subscribe to any direct child of `user` (e.g., `user.name`, `user.age`)
- `"user/**"` - Subscribe to any descendant of `user` at any depth
- `"**"` - Subscribe to all changes in the entire object

**Important Notes:**

- Array index subscriptions (e.g., `"cart/items/0"`) are not supported. Subscribe to the array itself (`"cart/items"`) or use wildcard patterns (`"cart/**"`) instead
- When subscribing to nested object paths (e.g., `"user/profile"`), changes to deeper properties (e.g., `"user/profile/bio"`) will not trigger the subscription unless you use a wildcard pattern (e.g., `"user/profile/**"`)

**Example:**

```typescript
const state = new DeepSubject({
  user: {
    name: "John",
    profile: { age: 30 },
  },
});

// Exact path
state.subscribe("user/name", (name) => {
  console.log("Name:", name);
});

// Wildcard - any direct child
state.subscribe("user/*", (value) => {
  console.log("Any user property changed:", value);
});

// Deep wildcard - any descendant
state.subscribe("user/**", (value) => {
  console.log("User subtree changed:", value);
});

// Root wildcard - everything
state.subscribe("**", (value) => {
  console.log("Anything changed:", value);
});
```

##### `next(nextValue: T): void`

Replace the entire state object and notify all subscribers.

**Parameters:**

- `nextValue`: The new state object

**Example:**

```typescript
state.next({
  user: { name: "Jane", age: 25 },
});
```

##### `unsubscribe(subscriber: DeepSubjectSubscription): void`

Remove a subscriber function from all paths/patterns it's subscribed to.

**Parameters:**

- `subscriber`: The callback function to remove

**Example:**

```typescript
const callback = (value) => console.log(value);
state.subscribe("user/name", callback);
state.subscribe("user/age", callback);

// Remove from all subscriptions
state.unsubscribe(callback);
```

##### `getValue(): T`

Get the current state object. The returned object is proxied, so mutations will trigger subscriptions.

**Returns:** The current state object (proxied)

**Example:**

```typescript
const stateObj = state.getValue();
stateObj.user.name = "Jane"; // Triggers subscriptions
```

#### Properties

##### `debug: boolean | ((nextValue: T) => void)`

Enable debug logging. Set to `true` for default logging, or provide a custom function.

##### `before: (nextValue: T) => T`

A function that transforms the value before it's set and subscribers are notified.

##### `count: number`

The number of times `next()` has been called (including initialization). Starts at `1`.

---

## Usage Examples

### Example 1: Form State Management

```typescript
import { Subject } from "subjecto";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const form = new Subject<FormData>({
  email: "",
  password: "",
  rememberMe: false,
});

// Subscribe to form changes
form.subscribe((data) => {
  console.log("Form updated:", data);
});

// Update form fields
form.nextAssign({ email: "user@example.com" });
form.nextAssign({ password: "secret123" });
form.nextAssign({ rememberMe: true });

// Toggle remember me
form.getValue().rememberMe = false;
form.toggle(); // Only works if rememberMe is boolean
```

### Example 2: Shopping Cart

```typescript
import { Subject } from "subjecto";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const cart = new Subject<CartItem[]>([]);

// Add item
cart.subscribe((items) => {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  console.log(`Cart total: $${total.toFixed(2)}`);
});

cart.nextPush({ id: 1, name: "Product A", price: 10, quantity: 2 });
cart.nextPush({ id: 2, name: "Product B", price: 15, quantity: 1 });
```

### Example 3: Application State with DeepSubject

```typescript
import { DeepSubject } from "subjecto";

interface AppState {
  user: {
    id: number;
    name: string;
    preferences: {
      theme: "light" | "dark";
      notifications: boolean;
    };
  };
  cart: {
    items: Array<{ id: number; quantity: number }>;
    total: number;
  };
}

const appState = new DeepSubject<AppState>({
  user: {
    id: 1,
    name: "John",
    preferences: {
      theme: "dark",
      notifications: true,
    },
  },
  cart: {
    items: [],
    total: 0,
  },
});

// Subscribe to user name changes
appState.subscribe("user/name", (name) => {
  console.log("User name changed to:", name);
});

// Subscribe to theme changes
appState.subscribe("user/preferences/theme", (theme) => {
  document.body.className = theme;
});

// Subscribe to any cart changes
appState.subscribe("cart/**", (cartData) => {
  console.log("Cart updated:", cartData);
});

// Mutate state
appState.getValue().user.name = "Jane";
appState.getValue().user.preferences.theme = "light";
appState.getValue().cart.items.push({ id: 1, quantity: 2 });
```

### Example 4: Real-time Data Updates

```typescript
import { Subject } from "subjecto";

interface Message {
  id: number;
  text: string;
  timestamp: Date;
}

const messages = new Subject<Message[]>([]);

// Subscribe to new messages
messages.subscribe((msgs) => {
  console.log(`You have ${msgs.length} messages`);
});

// Simulate receiving messages
setInterval(() => {
  messages.nextPush({
    id: Date.now(),
    text: `Message ${Date.now()}`,
    timestamp: new Date(),
  });
}, 1000);
```

### Example 5: Settings Management

```typescript
import { DeepSubject } from "subjecto";

const settings = new DeepSubject({
  appearance: {
    theme: "dark",
    fontSize: 14,
  },
  privacy: {
    shareAnalytics: false,
    shareLocation: true,
  },
});

// Subscribe to all appearance changes
settings.subscribe("appearance/**", (appearance) => {
  console.log("Appearance updated:", appearance);
  // Apply theme changes
  applyTheme(appearance.theme);
});

// Subscribe to specific privacy setting
settings.subscribe("privacy/shareAnalytics", (value) => {
  console.log("Analytics sharing:", value);
});

// Update settings
settings.getValue().appearance.theme = "light";
settings.getValue().privacy.shareAnalytics = true;
```

### Example 6: Validation with `before` Hook

```typescript
import { Subject } from "subjecto";

const age = new Subject<number>(0);

// Validate and normalize before setting
age.before = (value) => {
  if (value < 0) return 0;
  if (value > 120) return 120;
  return Math.floor(value); // Ensure integer
};

age.subscribe((value) => {
  console.log("Validated age:", value);
});

age.next(-5); // Sets to 0
age.next(150); // Sets to 120
age.next(25.7); // Sets to 25
```

### Example 7: One-time Subscriptions

```typescript
import { Subject } from "subjecto";

const dataLoaded = new Subject<boolean>(false);

// Wait for data to load once
dataLoaded.once((loaded) => {
  if (loaded) {
    console.log("Data loaded! Initializing app...");
    initializeApp();
  }
});

// Simulate async data loading
fetchData().then(() => {
  dataLoaded.next(true); // Triggers once subscription
  dataLoaded.next(true); // Does nothing (subscription already removed)
});
```

### Example 8: Using Built-in React Hooks

Subjecto provides first-class React integration with built-in, type-safe hooks:

```typescript
import { Subject, DeepSubject } from "subjecto";
import {
  useSubject,
  useDeepSubject,
  useDeepSubjectSelector,
} from "subjecto/react";

// Create subjects outside components
const counterSubject = new Subject(0);
const appState = new DeepSubject({
  user: {
    name: "Alice",
    profile: {
      bio: "Software Engineer",
      location: "San Francisco",
    },
  },
  cart: {
    items: [] as Array<{ id: number; name: string; price: number }>,
  },
});

// Simple counter with useSubject
function Counter() {
  const [count, setCount] = useSubject(counterSubject);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Subscribe to specific nested path with useDeepSubject
function UserName() {
  // TypeScript knows this returns string
  const name = useDeepSubject(appState, "user/name");

  return (
    <div>
      <h3>User: {name}</h3>
      <button
        onClick={() => {
          appState.getValue().user.name = "Bob";
        }}
      >
        Change Name
      </button>
    </div>
  );
}

// Subscribe to nested object with useDeepSubject
function UserProfile() {
  // TypeScript knows this returns { bio: string; location: string }
  const profile = useDeepSubject(appState, "user/profile");

  return (
    <div>
      <p>Bio: {profile.bio}</p>
      <p>Location: {profile.location}</p>
      <button
        onClick={() => {
          // Changes to nested properties trigger updates
          appState.getValue().user.profile.bio = "Senior Engineer";
        }}
      >
        Update Bio
      </button>
    </div>
  );
}

// Computed/derived values with useDeepSubjectSelector
function CartSummary() {
  // Subscribe to cart items and compute total
  const total = useDeepSubjectSelector(appState, "cart/items", (items) =>
    items.reduce((sum, item) => sum + item.price, 0)
  );

  const itemCount = useDeepSubjectSelector(
    appState,
    "cart/items",
    (items) => items.length
  );

  return (
    <div>
      <p>Items: {itemCount}</p>
      <p>Total: ${total.toFixed(2)}</p>
      <button
        onClick={() => {
          appState.getValue().cart.items.push({
            id: Date.now(),
            name: "Product",
            price: 10,
          });
        }}
      >
        Add Item
      </button>
    </div>
  );
}

// App component using all hooks
function App() {
  return (
    <div>
      <Counter />
      <UserName />
      <UserProfile />
      <CartSummary />
    </div>
  );
}
```

**Key Benefits:**

- **Type Safety**: Full TypeScript inference for paths and return types
- **Performance**: Only re-renders when subscribed data changes
- **Automatic Cleanup**: Subscriptions are cleaned up on unmount
- **SSR Compatible**: Works with Next.js, Remix, etc.
- **Nested Change Detection**: Uses wildcard patterns internally to catch all nested changes

## Advanced Topics

### Path Patterns in DeepSubject

DeepSubject supports flexible path patterns for subscribing to multiple paths:

#### Single Wildcard (`*`)

Matches any single level in the path:

```typescript
// Matches: user/name, user/age, user/email
// Does NOT match: user/profile/name
state.subscribe("user/*", callback);
```

#### Double Wildcard (`**`)

Matches any depth:

```typescript
// Matches: user/name, user/profile/name, user/profile/details/age
state.subscribe("user/**", callback);
```

#### Root Wildcard (`**`)

Subscribe to all changes:

```typescript
// Matches everything
state.subscribe("**", callback);
```

#### Performance Comparison

Different subscription patterns have different performance characteristics:

| Pattern | Description | Performance | Use When |
|---------|-------------|-------------|----------|
| Exact path<br/>`"user/name"` | Single specific property | ⚡⚡⚡ Fastest | You need only one specific value |
| Single wildcard<br/>`"user/*"` | Direct children only | ⚡⚡ Fast | You need any direct child property |
| Deep wildcard<br/>`"user/**"` | Any descendant at any depth | ⚡ Moderate | You need any property within a subtree |
| Root wildcard<br/>`"**"` | Everything in the object | 🐢 Slower | Global state tracking, debugging |

**Best Practices:**
- Use the most specific path possible for best performance
- Avoid root wildcard (`**`) in production unless necessary
- Single wildcards (`*`) are a good balance between flexibility and performance
- Deep wildcards (`path/**`) are ideal for React hooks that need to detect all nested changes

### Error Handling

Subjecto is designed to be resilient. If a subscriber throws an error, it won't break other subscriptions:

```typescript
const subject = new Subject<number>(0);

subject.subscribe((value) => {
  throw new Error("This won't break other subscribers");
});

subject.subscribe((value) => {
  console.log("This still works:", value);
});

subject.next(1); // Both subscribers are called, error is logged
```

### Memory Management

Subjecto uses `WeakMap` for proxy caching in DeepSubject, which means:

- Objects are automatically garbage collected when no longer referenced
- No memory leaks from circular references
- Efficient memory usage

Always remember to unsubscribe when you're done:

```typescript
const subscription = subject.subscribe(callback);

// When component unmounts or you're done:
subscription.unsubscribe();
```

### Circular References

DeepSubject handles circular references gracefully:

```typescript
const state = new DeepSubject({ a: {} });
const obj = state.getValue().a;

// Create circular reference
obj.b = obj;

// This works fine
state.subscribe("a", (value) => {
  console.log(value); // Safe to use
});
```

## TypeScript Support

Subjecto is built with TypeScript and provides excellent type safety:

```typescript
// Type inference
const count = new Subject(0); // Subject<number>

// Explicit types
const user = new Subject<User | null>(null);

// Generic constraints
const state = new DeepSubject<AppState>({
  /* ... */
});
```

### Type Exports

All types are exported for your use:

```typescript
import {
  Subject,
  DeepSubject,
  SubjectSubscription,
  SubscriptionHandle,
  DeepSubjectSubscription,
  DeepSubscriptionHandle,
  SubjectConstructorOptions,
  DeepSubjectConstructorOptions,
} from "subjecto";
```

### Advanced Type Utilities (React Integration)

When using the built-in React hooks, Subjecto provides advanced TypeScript utilities for path type inference:

```typescript
import type { Paths, PathValue } from "subjecto/react";

interface AppState {
  user: {
    name: string;
    age: number;
    profile: {
      bio: string;
      location: string;
    };
  };
  cart: {
    items: Array<{ id: number; price: number }>;
  };
}

// Paths<T> generates a union of all valid paths
type ValidPaths = Paths<AppState>;
// Result: "user" | "user/name" | "user/age" | "user/profile" |
//         "user/profile/bio" | "user/profile/location" | "cart" | "cart/items"

// PathValue<T, P> extracts the type at a given path
type UserNameType = PathValue<AppState, "user/name">; // string
type UserProfileType = PathValue<AppState, "user/profile">; // { bio: string; location: string }
type CartItemsType = PathValue<AppState, "cart/items">; // Array<{ id: number; price: number }>
```

**How This Works:**

The `useDeepSubject` hook uses these utilities to provide full type safety:

```typescript
const state = new DeepSubject<AppState>({...});

// TypeScript knows this returns string
const userName = useDeepSubject(state, "user/name");

// TypeScript knows this returns { bio: string; location: string }
const profile = useDeepSubject(state, "user/profile");

// TypeScript error: Invalid path!
const invalid = useDeepSubject(state, "user/invalid");
```

This ensures you can't subscribe to paths that don't exist, catching typos at compile time.

## Best Practices

1. **Always Unsubscribe**: Clean up subscriptions to prevent memory leaks

   ```typescript
   const handle = subject.subscribe(callback);
   // ... later
   handle.unsubscribe();
   ```

2. **Use Meaningful Names**: Set custom names for better debugging

   ```typescript
   const state = new Subject(data, { name: "userState" });
   ```

3. **Leverage Type Safety**: Use TypeScript types for better IDE support

   ```typescript
   interface MyState {
     /* ... */
   }
   const state = new Subject<MyState>(initialState);
   ```

4. **Use `before` for Validation**: Transform and validate values before they're set

   ```typescript
   subject.before = (value) => validateAndNormalize(value);
   ```

5. **Prefer DeepSubject for Complex State**: Use DeepSubject when you have nested objects and need granular subscriptions

6. **Use Wildcards Wisely**: Wildcard subscriptions can be powerful but may trigger more often than needed

7. **Enable Debug Mode During Development**: Use `debug` property to track state changes
   ```typescript
   if (process.env.NODE_ENV === "development") {
     subject.debug = true;
   }
   ```

## Performance Considerations

- **Subject**: O(n) where n is the number of subscribers. Very fast for typical use cases.
- **DeepSubject**: Uses JavaScript Proxies which have minimal overhead. Proxy caching ensures objects are only proxied once.
- **Wildcard Matching**: Pattern matching is optimized but may have slight overhead with many wildcard subscriptions.
- **Memory**: WeakMap usage ensures efficient memory management. No memory leaks from circular references.

For most applications, performance is excellent. If you have thousands of subscribers or very deep object structures, consider:

- Using more specific path subscriptions instead of wildcards
- Batching updates when possible
- Using `updateIfStrictlyEqual: false` to skip unnecessary notifications

## Migration Guide

### From v0.0.57 to v0.0.58+

- `Subject.value` is now private. Use `getValue()` instead:

  ```typescript
  // Old
  const value = subject.value;

  // New
  const value = subject.getValue();
  ```

- `Subject.hook()` has been removed. Use React's `useSyncExternalStore` hook instead (see React Integration section below).

## React Integration

Subjecto provides **first-class React integration** with built-in, type-safe hooks. Simply install Subjecto and import the hooks from `subjecto/react`.

### Installation & Requirements

```bash
npm install subjecto
```

**Requirements:**
- React 18.0 or higher (for `useSyncExternalStore` support)
- TypeScript (recommended for full type safety)

**Import:**
```typescript
import { useSubject, useDeepSubject, useDeepSubjectSelector } from "subjecto/react";
```

---

## Built-in React Hooks

### `useSubject<T>`

Subscribe to a `Subject` and get its current value with a setter function, similar to React's `useState`.

**Signature:**
```typescript
function useSubject<T>(subject: Subject<T>): [T, (value: T) => void]
```

**Example:**

```typescript
import { Subject } from "subjecto";
import { useSubject } from "subjecto/react";

// Create subject outside component
const countSubject = new Subject(0);

function Counter() {
  const [count, setCount] = useSubject(countSubject);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

**Features:**
- Returns `[value, setter]` tuple like `useState`
- Automatic cleanup on unmount
- Type-safe with full TypeScript inference

---

### `useDeepSubject<T, P>`

Subscribe to a specific path in a `DeepSubject` with full type safety and automatic nested change detection.

**Signature:**
```typescript
function useDeepSubject<T extends object, P extends Paths<T>>(
  subject: DeepSubject<T>,
  path: P
): PathValue<T, P>
```

**Example:**

```typescript
import { DeepSubject } from "subjecto";
import { useDeepSubject } from "subjecto/react";

const appState = new DeepSubject({
  user: {
    name: "Alice",
    profile: { bio: "Engineer", location: "SF" }
  }
});

function UserName() {
  // TypeScript infers return type as string
  const name = useDeepSubject(appState, "user/name");

  return (
    <div>
      <p>Name: {name}</p>
      <button onClick={() => {
        appState.getValue().user.name = "Bob";
      }}>
        Change Name
      </button>
    </div>
  );
}

function UserProfile() {
  // TypeScript infers return type as { bio: string; location: string }
  const profile = useDeepSubject(appState, "user/profile");

  return (
    <div>
      <p>Bio: {profile.bio}</p>
      <p>Location: {profile.location}</p>
      <button onClick={() => {
        // Nested property changes are automatically detected!
        appState.getValue().user.profile.bio = "Senior Engineer";
      }}>
        Update Bio
      </button>
    </div>
  );
}
```

**Features:**
- **Type-safe paths**: TypeScript validates paths at compile time
- **Nested change detection**: Uses wildcard subscriptions internally (`path/**`) to detect all nested property changes
- **Automatic cleanup**: Unsubscribes on unmount
- **Type inference**: Return type is automatically inferred from the path

---

### `useDeepSubjectSelector<T, P, R>`

Subscribe to a path and compute a derived value with a selector function. Useful for complex calculations or data transformations.

**Signature:**
```typescript
function useDeepSubjectSelector<T extends object, P extends Paths<T>, R>(
  subject: DeepSubject<T>,
  path: P,
  selector: (value: PathValue<T, P>) => R
): R
```

**Example:**

```typescript
import { DeepSubject } from "subjecto";
import { useDeepSubjectSelector } from "subjecto/react";

const appState = new DeepSubject({
  cart: {
    items: [] as Array<{ id: number; name: string; price: number }>
  }
});

function CartSummary() {
  // Compute total price
  const total = useDeepSubjectSelector(
    appState,
    "cart/items",
    (items) => items.reduce((sum, item) => sum + item.price, 0)
  );

  // Compute item count
  const count = useDeepSubjectSelector(
    appState,
    "cart/items",
    (items) => items.length
  );

  return (
    <div>
      <p>Items: {count}</p>
      <p>Total: ${total.toFixed(2)}</p>
    </div>
  );
}
```

**Features:**
- **Memoized selectors**: Only recomputes when the input value changes
- **Object comparison**: Uses JSON.stringify for object/array results to detect deep changes
- **Type inference**: Result type is inferred from selector return type

---

## Understanding useSyncExternalStore (Advanced)

Under the hood, the built-in hooks use React's `useSyncExternalStore` API. If you need custom behavior, you can implement your own hooks using this pattern:

```typescript
import { useSyncExternalStore } from "react";
import { Subject } from "subjecto";

function useCustomSubject<T>(subject: Subject<T>): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      // Subscribe with skipInitialCall to avoid duplicate renders
      const handle = subject.subscribe(onStoreChange);
      return () => handle.unsubscribe();
    },
    () => subject.getValue(),
    () => subject.getValue() // Server snapshot for SSR
  );
}
```

**Note:** The built-in hooks are recommended for most use cases as they handle edge cases and optimizations.

---

## Performance Tips for React

1. **Create subjects outside components**
   ```typescript
   // ✅ Good - created once
   const counterSubject = new Subject(0);

   function Component() {
     const [count] = useSubject(counterSubject);
   }

   // ❌ Bad - recreated on every render
   function Component() {
     const counterSubject = new Subject(0);
     const [count] = useSubject(counterSubject);
   }
   ```

2. **Use specific paths with DeepSubject**
   ```typescript
   // ✅ Good - specific path
   const name = useDeepSubject(state, "user/name");

   // ❌ Less efficient - subscribes to everything
   const everything = useDeepSubject(state, "**");
   ```

3. **Use selectors for derived values**
   ```typescript
   // ✅ Good - only recomputes when items change
   const total = useDeepSubjectSelector(state, "cart/items",
     (items) => items.reduce((sum, i) => sum + i.price, 0)
   );

   // ❌ Bad - recomputes on every render
   function Component() {
     const items = useDeepSubject(state, "cart/items");
     const total = items.reduce((sum, i) => sum + i.price, 0);
   }
   ```

---

## Server-Side Rendering (SSR)

The built-in hooks work seamlessly with SSR frameworks like Next.js and Remix:

```typescript
// Works with Next.js, Remix, etc.
const userSubject = new Subject({ name: "Alice", age: 30 });

function UserProfile() {
  const [user] = useSubject(userSubject);

  return <div>Welcome, {user.name}!</div>;
}
```

The hooks use `useSyncExternalStore` which handles SSR hydration automatically.

---

## Complete React Example

For a comprehensive example using all three hooks (`useSubject`, `useDeepSubject`, `useDeepSubjectSelector`), see [Example 8: Using Built-in React Hooks](#example-8-using-built-in-react-hooks) in the Usage Examples section above.

---

## Troubleshooting

### Common Issues

**Issue: Component not re-rendering when state changes**

Solution: Ensure you're calling `getValue()` on the subject to get the proxied object (for DeepSubject):

```typescript
// ✅ Correct
appState.getValue().user.name = "New Name";

// ❌ Won't trigger subscriptions
const state = appState.getValue();
state.user = { name: "New Name" }; // Replaces entire user object
```

**Issue: TypeScript errors with path subscriptions**

Solution: Make sure your state interface matches your actual data structure:

```typescript
interface AppState {
  user: {
    name: string;
  };
}

const state = new DeepSubject<AppState>({...});

// ✅ TypeScript validates this path
const name = useDeepSubject(state, "user/name");

// ❌ TypeScript error - path doesn't exist
const invalid = useDeepSubject(state, "user/invalid");
```

**Issue: Nested property changes not detected**

The built-in hooks automatically handle this by using wildcard subscriptions internally. If you're implementing custom hooks, use the `path/**` pattern:

```typescript
// ✅ Detects nested changes
const handle = subject.subscribe("user/profile/**", callback);

// ❌ Won't detect changes to user.profile.bio
const handle = subject.subscribe("user/profile", callback);
```

**Issue: Memory leaks**

Solution: Always clean up subscriptions. The built-in React hooks handle this automatically, but if you're subscribing manually:

```typescript
useEffect(() => {
  const handle = subject.subscribe(callback);
  return () => handle.unsubscribe(); // Clean up!
}, []);
```

**Issue: Performance problems with many subscribers**

Solutions:
- Use more specific paths instead of wildcards
- Use `updateIfStrictlyEqual: false` for subjects that don't need strict equality checks
- Consider batching state updates

### FAQ

**Q: Can I use Subjecto with React < 18?**

A: No, the built-in hooks require React 18+ for `useSyncExternalStore`. For React 17 and below, you'll need to use the `use-sync-external-store` shim package.

**Q: How does Subjecto compare to Redux/Zustand/Jotai?**

A: Subjecto is lighter than Redux (~16KB vs ~40KB), has built-in nested reactivity unlike Zustand, and uses mutable updates like MobX but with explicit subscriptions. See the [performance comparison table](#performance-comparison) for more details.

**Q: Can I use Subjecto for large applications?**

A: Yes! The library is designed for production use with excellent performance. For very large apps, consider:
- Breaking state into multiple smaller subjects
- Using specific path subscriptions
- Avoiding root wildcard (`**`) subscriptions in hot paths

**Q: Does Subjecto support middleware?**

A: Not built-in, but you can implement middleware using the `before` hook on subjects to transform/validate values before they're set.

**Q: Can I use Subjecto outside of React?**

A: Absolutely! Subjecto is framework-agnostic. The React hooks are optional. See the [Node.js examples](#example-1-form-state-management) for non-React usage.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

**Made with ❤️ by [Paul Brie](https://github.com/paulbrie)**
