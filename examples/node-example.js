/**
 * Node.js Example: Using Subjecto for State Management
 *
 * This example demonstrates how to use Subject and DeepSubject
 * in a Node.js environment for managing application state.
 *
 * Note: This example uses CommonJS require() syntax for Node.js.
 * In a real project, you might use ES modules instead.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { Subject, DeepSubject } = require("subjecto");

// ============================================
// Example 1: Basic Subject Usage
// ============================================

console.log("\n=== Example 1: Basic Subject ===\n");

// Create a subject with an initial value
const counter = new Subject(0, { name: "counter" });

// Subscribe to changes
const subscription1 = counter.subscribe((value) => {
  console.log(`Subscriber 1: Counter is now ${value}`);
});

const subscription2 = counter.subscribe((value) => {
  console.log(`Subscriber 2: Counter is now ${value}`);
});

// Update the value
counter.next(1);
counter.next(2);
counter.next(3);

// Unsubscribe one subscriber
subscription1.unsubscribe();
// subscription2 is kept active to demonstrate continued updates

// Only subscriber 2 will receive this update
counter.next(4);

// ============================================
// Example 2: Subject with Object State
// ============================================

console.log("\n=== Example 2: Subject with Object State ===\n");

const userState = new Subject(
  { name: "John", age: 30, email: "john@example.com" },
  { name: "userState" }
);

userState.subscribe((user) => {
  console.log("User updated:", JSON.stringify(user, null, 2));
});

// Update using nextAssign for partial updates
userState.nextAssign({ age: 31 });
userState.nextAssign({ email: "john.doe@example.com" });

// ============================================
// Example 3: Subject with Array State
// ============================================

console.log("\n=== Example 3: Subject with Array State ===\n");

const todoList = new Subject(["Buy groceries", "Walk the dog"], {
  name: "todoList",
});

todoList.subscribe((todos) => {
  console.log("Todo list:", todos);
});

// Add a new todo using nextPush
todoList.nextPush("Finish project");

// Replace the entire array
todoList.next(["Buy groceries", "Walk the dog", "Finish project", "Call mom"]);

// ============================================
// Example 4: DeepSubject for Nested State
// ============================================

console.log("\n=== Example 4: DeepSubject for Nested State ===\n");

const appState = new DeepSubject(
  {
    user: {
      name: "Alice",
      profile: {
        bio: "Software developer",
        location: "San Francisco",
      },
    },
    cart: {
      items: [],
      total: 0,
    },
    settings: {
      theme: "light",
      notifications: true,
    },
  },
  { name: "appState" }
);

// Subscribe to specific paths
// Note: These subscriptions are kept active to demonstrate the updates
appState.subscribe("user/name", (name) => {
  console.log(`User name changed to: ${name}`);
});

appState.subscribe("cart/items", (items) => {
  console.log(`Cart items:`, items);
});

appState.subscribe("settings/theme", (theme) => {
  console.log(`Theme changed to: ${theme}`);
});

// Update nested values directly
appState.getValue().user.name = "Bob";
appState.getValue().cart.items.push({ id: 1, name: "Product A", price: 29.99 });
appState.getValue().settings.theme = "dark";

// ============================================
// Example 5: Using before() for Validation
// ============================================

console.log("\n=== Example 5: Using before() for Validation ===\n");

const ageSubject = new Subject(25, { name: "age" });

// Add validation using before()
ageSubject.before = (nextValue) => {
  if (nextValue < 0) {
    console.log("Age cannot be negative, keeping current value");
    return ageSubject.getValue();
  }
  if (nextValue > 150) {
    console.log("Age seems unrealistic, capping at 150");
    return 150;
  }
  return nextValue;
};

ageSubject.subscribe((age) => {
  console.log(`Age is now: ${age}`);
});

ageSubject.next(30);
ageSubject.next(-5); // Will be rejected
ageSubject.next(200); // Will be capped at 150

// ============================================
// Example 6: Using once() for One-time Subscriptions
// ============================================

console.log("\n=== Example 6: Using once() for One-time Subscriptions ===\n");

const eventSubject = new Subject("initial", { name: "event" });

eventSubject.once((value) => {
  console.log(`One-time subscription received: ${value}`);
});

eventSubject.next("first event");
eventSubject.next("second event"); // Won't trigger the once subscription

// ============================================
// Example 7: Complete all subscriptions
// ============================================

console.log("\n=== Example 7: Complete all subscriptions ===\n");

const tempSubject = new Subject("temp", { name: "temp" });

tempSubject.subscribe(() => console.log("Subscriber A"));
tempSubject.subscribe(() => console.log("Subscriber B"));
tempSubject.subscribe(() => console.log("Subscriber C"));

console.log(`Subscribers before complete: ${tempSubject.subscribers.size}`);
tempSubject.complete();
console.log(`Subscribers after complete: ${tempSubject.subscribers.size}`);

console.log("\n=== Examples Complete ===\n");
