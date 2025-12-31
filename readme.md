<p align="center">
  <img src="./src/logo.svg" alt="Subjecto Logo" width="120" />
</p>

[![CircleCI](https://circleci.com/gh/paulbrie/subjecto.svg?style=shield)](https://circleci.com/gh/paulbrie/subjecto)
![npm](https://img.shields.io/npm/dm/subjecto)

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
- [Advanced Topics](#advanced-topics)
- [TypeScript Support](#typescript-support)
- [Best Practices](#best-practices)
- [Performance Considerations](#performance-considerations)
- [Migration Guide](#migration-guide)
- [React Integration](#react-integration)
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

- **Zero Dependencies**: No external dependencies, keeping your bundle size minimal
- **Type Safety**: Fully typed with TypeScript, no `any` types used
- **Two State Management Patterns**:
  - **Subject**: Simple value container with subscription pattern
  - **DeepSubject**: Deep reactive state with path-based subscriptions
- **Path-based Subscriptions**: Subscribe to nested properties using string paths
- **Wildcard Support**: Use `*` and `**` patterns for flexible subscriptions
- **Automatic Change Detection**: DeepSubject automatically detects nested mutations
- **Error Resilient**: Subscriber errors don't break other subscriptions
- **Debug Support**: Built-in debugging capabilities
- **Memory Efficient**: Uses WeakMap for proxy caching, preventing memory leaks
- **Circular Reference Safe**: Handles circular references gracefully

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
  - `updateIfStrictlyEqual?: boolean` - Whether to notify subscribers when the new value is strictly equal (`===`) to the current value (default: `true`)

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

Self-reference to the subject instance. Useful in certain edge cases.

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

##### `subscribe(pattern: Path, subscriber: DeepSubjectSubscription): DeepSubscriptionHandle`

Subscribe to changes at a specific path or pattern. The subscriber is immediately called with the current value at that path.

**Parameters:**

- `pattern`: A path string (e.g., `"user/name"`) or pattern with wildcards (`"user/*"`, `"user/**"`)
- `subscriber`: A function that receives the value when it changes

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

- `Subject.hook()` has been removed. Use React's `useExternalStore` hook instead (see React Integration section below).

## React Integration

Subjecto works seamlessly with React using the built-in `useExternalStore` hook (available in React 18+). This hook is designed specifically for subscribing to external stores like Subjecto.

### Requirements

- React 18.0 or higher
- `useExternalStore` is available from `react` (no additional packages needed)

### Basic Usage with Subject

```typescript
import { useExternalStore } from "react";
import { Subject } from "subjecto";

// Create a subject outside your component
const countSubject = new Subject<number>(0);

function Counter() {
  // Subscribe to the subject
  const count = useExternalStore(
    countSubject.subscribe.bind(countSubject),
    () => countSubject.getValue()
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => countSubject.next(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Using with DeepSubject

```typescript
import { useExternalStore } from "react";
import { DeepSubject } from "subjecto";

// Create a deep subject outside your component
const appState = new DeepSubject({
  user: {
    name: "John",
    age: 30,
  },
});

function UserProfile() {
  // Subscribe to a specific path
  const userName = useExternalStore(
    (callback) => appState.subscribe("user/name", callback).unsubscribe,
    () => {
      const state = appState.getValue();
      return state.user.name;
    }
  );

  return (
    <div>
      <p>Name: {userName}</p>
      <button
        onClick={() => {
          appState.getValue().user.name = "Jane";
        }}
      >
        Change Name
      </button>
    </div>
  );
}
```

### Creating a Custom Hook

For better reusability, create a custom hook:

```typescript
import { useExternalStore } from "react";
import { Subject } from "subjecto";

function useSubject<T>(subject: Subject<T>): [T, (value: T) => void] {
  const value = useExternalStore(
    subject.subscribe.bind(subject),
    () => subject.getValue()
  );

  return [value, (newValue: T) => subject.next(newValue)];
}

// Usage
const countSubject = new Subject<number>(0);

function Counter() {
  const [count, setCount] = useSubject(countSubject);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Custom Hook for DeepSubject

```typescript
import { useExternalStore } from "react";
import { DeepSubject } from "subjecto";

function useDeepSubject<T extends object>(
  subject: DeepSubject<T>,
  path: string
): unknown {
  return useExternalStore(
    (callback) => subject.subscribe(path, callback).unsubscribe,
    () => {
      const parts = path.split("/");
      let value: any = subject.getValue();
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    }
  );
}

// Usage
const appState = new DeepSubject({
  user: { name: "John" },
});

function UserName() {
  const name = useDeepSubject(appState, "user/name");

  return <p>Name: {name}</p>;
}
```

### Complete Example: Todo App

```typescript
import { useExternalStore } from "react";
import { Subject } from "subjecto";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todosSubject = new Subject<Todo[]>([]);

function TodoApp() {
  const todos = useExternalStore(
    todosSubject.subscribe.bind(todosSubject),
    () => todosSubject.getValue()
  );

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false,
    };
    todosSubject.next([...todos, newTodo]);
  };

  const toggleTodo = (id: number) => {
    todosSubject.next(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <div>
      <TodoForm onAdd={addTodo} />
      <TodoList todos={todos} onToggle={toggleTodo} />
    </div>
  );
}
```

### Advanced: Selective Subscriptions

For better performance, subscribe only to the data you need:

```typescript
import { useExternalStore } from "react";
import { DeepSubject } from "subjecto";

const appState = new DeepSubject({
  user: { name: "John", age: 30 },
  cart: { items: [] },
});

function UserName() {
  // Only re-renders when user.name changes
  const name = useExternalStore(
    (callback) => appState.subscribe("user/name", callback).unsubscribe,
    () => appState.getValue().user.name
  );

  return <p>{name}</p>;
}

function CartCount() {
  // Only re-renders when cart.items changes
  const itemCount = useExternalStore(
    (callback) => appState.subscribe("cart/items", callback).unsubscribe,
    () => appState.getValue().cart.items.length
  );

  return <p>Items in cart: {itemCount}</p>;
}
```

### TypeScript Support

The hooks work perfectly with TypeScript:

```typescript
import { useExternalStore } from "react";
import { Subject } from "subjecto";

interface User {
  id: number;
  name: string;
}

const userSubject = new Subject<User | null>(null);

function UserDisplay() {
  const user = useExternalStore(
    userSubject.subscribe.bind(userSubject),
    () => userSubject.getValue()
  );

  if (!user) return <p>No user</p>;

  return <p>Welcome, {user.name}!</p>;
}
```

### Performance Tips

1. **Create subjects outside components**: This prevents recreating them on every render

   ```typescript
   // ✅ Good - outside component
   const countSubject = new Subject(0);

   // ❌ Bad - inside component (recreated every render)
   function Component() {
     const countSubject = new Subject(0);
   }
   ```

2. **Use specific paths with DeepSubject**: Subscribe to the exact path you need

   ```typescript
   // ✅ Good - specific path
   useDeepSubject(state, "user/name");

   // ❌ Less efficient - subscribes to everything
   useDeepSubject(state, "**");
   ```

3. **Memoize selectors**: For complex derived values
   ```typescript
   const expensiveValue = useExternalStore(
     subject.subscribe.bind(subject),
     () => {
       const value = subject.getValue();
       return expensiveComputation(value);
     }
   );
   ```

### Server-Side Rendering (SSR)

`useExternalStore` handles SSR automatically. Make sure to provide a consistent initial value:

```typescript
// Works with Next.js, Remix, etc.
const stateSubject = new Subject(initialState);

function Component() {
  const state = useExternalStore(
    stateSubject.subscribe.bind(stateSubject),
    () => stateSubject.getValue()
  );
  // ...
}
```

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
