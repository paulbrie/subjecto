/**
 * React Example: Using Subjecto with React Hooks
 *
 * This example demonstrates how to use Subject and DeepSubject
 * in a React application using the provided hooks.
 */

import React from 'react';
import { Subject, DeepSubject, batch } from 'subjecto';
import { useSubject, useDeepSubject, useDeepSubjectSelector } from 'subjecto/react';

// ============================================
// Example 1: Basic useSubject Hook
// ============================================

// Create a subject outside the component (or in a module)
const counterSubject = new Subject(0, { name: 'counter' });

export function CounterExample() {
  const [count, setCount] = useSubject(counterSubject);

  return (
    <div>
      <h2>Counter Example</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// ============================================
// Example 2: useSubject with Object State
// ============================================

interface User {
  name: string;
  age: number;
  email: string;
}

const userSubject = new Subject<User>(
  { name: 'John Doe', age: 30, email: 'john@example.com' },
  { name: 'user' }
);

export function UserProfileExample() {
  const [user] = useSubject(userSubject);

  return (
    <div>
      <h2>User Profile Example</h2>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
      <p>Email: {user.email}</p>
      <button onClick={() => userSubject.nextAssign({ name: 'Jane Doe' })}>
        Change Name
      </button>
      <button onClick={() => userSubject.nextAssign({ age: user.age + 1 })}>
        Increment Age
      </button>
    </div>
  );
}

// ============================================
// Example 3: useDeepSubject Hook
// ============================================

interface AppState {
  user: {
    name: string;
    profile: {
      bio: string;
      location: string;
    };
  };
  cart: {
    items: Array<{ id: number; name: string; price: number }>;
    total: number;
  };
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const appState = new DeepSubject<AppState>(
  {
    user: {
      name: 'Alice',
      profile: {
        bio: 'Software developer',
        location: 'San Francisco',
      },
    },
    cart: {
      items: [],
      total: 0,
    },
    settings: {
      theme: 'light',
      notifications: true,
    },
  },
  { name: 'appState' }
);

export function UserNameDisplay() {
  // Subscribe only to user/name — component re-renders only when name changes
  const [userName, setUserName] = useDeepSubject(appState, 'user/name');

  return (
    <div>
      <h3>User Name Component</h3>
      <p>Name: {userName}</p>
      <button onClick={() => setUserName('Bob')}>Change Name</button>
    </div>
  );
}

export function ThemeDisplay() {
  // Subscribe only to settings/theme
  const [theme, setTheme] = useDeepSubject(appState, 'settings/theme');

  return (
    <div>
      <h3>Theme Component</h3>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
}

export function CartItemsDisplay() {
  // Subscribe only to cart/items
  const [items] = useDeepSubject(appState, 'cart/items');

  const addItem = () => {
    appState.getValue().cart.items.push({
      id: Date.now(),
      name: `Product ${items.length + 1}`,
      price: Math.random() * 100,
    });
  };

  return (
    <div>
      <h3>Cart Items Component</h3>
      <p>Items in cart: {items.length}</p>
      <ul>
        {items.map((item: { id: number; name: string; price: number }) => (
          <li key={item.id}>
            {item.name} - ${item.price.toFixed(2)}
          </li>
        ))}
      </ul>
      <button onClick={addItem}>Add Item</button>
    </div>
  );
}

// ============================================
// Example 4: useDeepSubjectSelector Hook
// ============================================

export function CartTotalDisplay() {
  // Use selector to compute derived state
  const total = useDeepSubjectSelector(
    appState,
    'cart/items',
    (items: Array<{ id: number; name: string; price: number }>) =>
      items.reduce((sum: number, item) => sum + item.price, 0),
  );

  return (
    <div>
      <h3>Cart Total Component</h3>
      <p>Total: ${total.toFixed(2)}</p>
    </div>
  );
}

export function UserBioDisplay() {
  // Use selector to derive a formatted string from the profile object
  const formattedBio = useDeepSubjectSelector(
    appState,
    'user/profile',
    (profile: { bio: string; location: string }) => `${profile.bio} in ${profile.location}`,
  );

  return (
    <div>
      <h3>Formatted Bio</h3>
      <p>{formattedBio}</p>
    </div>
  );
}

// ============================================
// Example 5: Batched Updates
// ============================================

export function BatchedUpdateExample() {
  const [userName] = useDeepSubject(appState, 'user/name');
  const [theme] = useDeepSubject(appState, 'settings/theme');

  const updateBoth = () => {
    // Without batch: two separate notification cycles
    // With batch: subscribers notified once after both mutations
    batch(() => {
      appState.getValue().user.name = 'Charlie';
      appState.getValue().settings.theme = 'dark';
    });
  };

  return (
    <div>
      <h3>Batched Update Example</h3>
      <p>Name: {userName}, Theme: {theme}</p>
      <button onClick={updateBoth}>Update Both (Batched)</button>
    </div>
  );
}

// ============================================
// Full App
// ============================================

export function AppExample() {
  return (
    <div>
      <h1>Subjecto React Examples</h1>
      <CounterExample />
      <hr />
      <UserProfileExample />
      <hr />
      <UserNameDisplay />
      <ThemeDisplay />
      <CartItemsDisplay />
      <CartTotalDisplay />
      <UserBioDisplay />
      <hr />
      <BatchedUpdateExample />
    </div>
  );
}
