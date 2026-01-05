# Subjecto Examples

This folder contains example usage of the Subjecto library in different environments.

## Node.js Example

The `node-example.js` file demonstrates how to use `Subject` and `DeepSubject` in a Node.js environment. It covers:

- Basic Subject usage with subscriptions
- Subject with object state using `nextAssign`
- Subject with array state using `nextPush`
- DeepSubject for nested state management
- Using `before()` for validation
- One-time subscriptions with `once()`
- Completing all subscriptions

To run the Node.js example:

```bash
node examples/node-example.js
```

## React Example

The `react-example.tsx` file demonstrates how to use Subjecto with React hooks:

- `useSubject` hook for basic state management
- `useDeepSubject` hook for subscribing to specific paths in nested state
- `useDeepSubjectSelector` hook for computed/derived state

The React example shows:
- Counter component using `useSubject`
- User profile component with object state
- Multiple components subscribing to different paths in a shared DeepSubject
- Using selectors to compute derived values

To use the React example, you'll need to set up a React project and import the hooks from `subjecto/react`.


