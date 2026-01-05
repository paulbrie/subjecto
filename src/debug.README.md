# 🔍 Subjecto Debug UI

Visual debugging utility for Subject instances with real-time updates and an intuitive interface.

## Features

- 📊 **Real-time Updates** - Watch your Subject's state change live
- 📈 **Graph Visualization** - View history as an interactive timeline graph (numeric values)
- 📜 **History Tracking** - Keep up to 50 entries of value changes with timestamps
- 🔄 **Dual View Modes** - Toggle between list and graph views
- 👥 **Subscriber List** - See all active subscriptions
- ✏️ **Value Editor** - Manually update values via JSON input
- ⏸ **Pause/Resume** - Freeze updates for inspection
- 📋 **Copy to Clipboard** - Export current value as JSON
- 🎨 **Dark Mode Support** - Matches your theme preference
- 🗂 **Collapsible Sections** - Organize your debug view
- 🔔 **Notifications** - Visual feedback for actions
- 📱 **Responsive Design** - Works on all screen sizes
- 0️⃣ **Zero Dependencies** - Pure vanilla JS, no frameworks required

## Installation

```bash
npm install subjecto
```

## Usage

### Basic Example

```typescript
import { Subject } from 'subjecto'
import { debugSubject } from 'subjecto/debug'

const counter = new Subject(0, { name: 'counter' })

// Mount debug UI to a DOM element
const cleanup = debugSubject(
  counter,
  document.getElementById('debug-container')
)

// Update the subject normally
counter.next(1)
counter.next(2)

// Later: cleanup when done
cleanup()
```

### With Options

```typescript
import { debugSubject } from 'subjecto/debug'

debugSubject(subject, container, {
  maxHistory: 100,        // Keep up to 100 history entries (default: 50)
  darkMode: true,         // Enable dark mode (default: false)
  title: 'My Counter',    // Custom title (default: subject name)
  editable: true,         // Enable value editor (default: true)
  collapsible: true,      // Enable collapsible sections (default: true)
})
```

## Examples

### Counter Example

```typescript
import { Subject } from 'subjecto'
import { debugSubject } from 'subjecto/debug'

const counter = new Subject(0, { name: 'counter' })
debugSubject(counter, document.getElementById('debug'))

// UI will show real-time updates
setInterval(() => {
  counter.next(counter.getValue() + 1)
}, 1000)
```

### Todo List Example

```typescript
interface Todo {
  id: number
  text: string
  completed: boolean
}

const todos = new Subject<Todo[]>([], { name: 'todos' })
debugSubject(todos, document.getElementById('debug'))

// Add todo
const addTodo = (text: string) => {
  const current = todos.getValue()
  todos.next([...current, {
    id: Date.now(),
    text,
    completed: false
  }])
}

// Toggle todo
const toggleTodo = (id: number) => {
  const current = todos.getValue()
  todos.next(
    current.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    )
  )
}
```

### User State Example

```typescript
interface UserState {
  name: string
  age: number
  active: boolean
  skills: string[]
}

const user = new Subject<UserState>({
  name: 'Alice',
  age: 28,
  active: true,
  skills: ['JavaScript', 'TypeScript']
}, { name: 'user' })

debugSubject(user, document.getElementById('debug'))
```

### Dark Mode Example

```typescript
const theme = new Subject('light', { name: 'theme' })

debugSubject(theme, document.getElementById('debug'), {
  darkMode: true,
  title: '🌙 Theme Manager'
})
```

## API

### `debugSubject<T>(subject, container, options?)`

Creates a visual debugging UI for a Subject instance.

**Parameters:**
- `subject: Subject<T>` - The Subject instance to debug
- `container: HTMLElement` - DOM element to render the debug UI into
- `options?: DebugOptions` - Optional configuration

**Returns:** `() => void` - Cleanup function to remove the debug UI

### `DebugOptions`

```typescript
interface DebugOptions {
  /**
   * Maximum number of history entries to keep
   * @default 50
   */
  maxHistory?: number

  /**
   * Enable dark mode
   * @default false
   */
  darkMode?: boolean

  /**
   * Title for the debug panel
   * @default Subject name or "Subject Debug"
   */
  title?: string

  /**
   * Enable value editor
   * @default true
   */
  editable?: boolean

  /**
   * Enable collapsible sections
   * @default true
   */
  collapsible?: boolean
}
```

## UI Components

### Header
- **Title**: Shows subject name or custom title
- **Actions**: Pause, Clear history, Copy value buttons

### Current State Section
- **Value**: Current subject value (formatted JSON)
- **Subscribers**: Number of active subscriptions
- **Updates**: Total number of updates (count)
- **Type**: Value type (string, number, object, array, etc.)
- **Editor**: Input field to manually update value (optional)

### History Section
- **View Toggle**: Switch between list and graph views
- **List View**: Timeline of all value changes with timestamps
- **Graph View**: Interactive line chart showing numeric values over time
  - Automatically extracts numeric values (numbers, booleans, array lengths, object key counts)
  - Displays time on X-axis and values on Y-axis
  - Highlights latest value point in green
  - Shows grid lines and axis labels
  - Adapts to light/dark mode
- **Latest Indicator**: Highlights the most recent change (list view)
- **Count Badge**: Shows update number for each entry

### Subscribers Section
- **List**: All active subscriber IDs
- **Empty State**: Message when no subscribers

## Styling

The debug UI comes with built-in styles that are automatically injected. It supports both light and dark modes.

### Customization

You can override styles by targeting these classes:

```css
.subjecto-debug { /* Main container */ }
.subjecto-debug.dark { /* Dark mode */ }
.debug-header { /* Header section */ }
.debug-section { /* Each section */ }
.section-header { /* Section headers */ }
.stat-grid { /* Stats grid */ }
.history-list { /* History list */ }
.subscriber-item { /* Each subscriber */ }
```

## Interactive Features

### Pause/Resume
Click the pause button to freeze updates. Resume to continue tracking.

### View Toggle (Graph/List)
Switch between list and graph views in the History section. Graph view automatically extracts numeric values and displays them as an interactive timeline chart with:
- Time-based X-axis
- Value-based Y-axis with labels
- Grid lines for easy reading
- Color-coded points (blue for historical, green for latest)
- Automatic scaling and padding

The graph supports:
- **Numbers**: Direct values
- **Booleans**: 1 for true, 0 for false
- **Arrays**: Length of array
- **Objects**: Number of keys

### Clear History
Removes all history entries while keeping the current state.

### Copy to Clipboard
Copies the current value as formatted JSON to clipboard.

### Value Editor
Edit the value directly by entering JSON and clicking Update.

### Collapsible Sections
Click section headers to expand/collapse content.

## Use Cases

- **Development**: Debug state changes during development
- **Testing**: Visualize state transitions in tests
- **Demos**: Show state management in live demos
- **Debugging**: Troubleshoot complex state issues
- **Learning**: Understand how observables work

## Performance

The debug UI is optimized for minimal performance impact:
- Updates are batched with RAF
- History is capped at configurable limit
- Styles are injected once globally
- No external dependencies

## Browser Support

Works in all modern browsers that support:
- ES6+ features
- DOM APIs
- CSS Grid
- Flexbox

## Tips

1. **Use meaningful names**: Set `name` in Subject options for better debugging
2. **Pause when needed**: Pause updates to inspect specific states
3. **Limit history**: Adjust `maxHistory` for memory-constrained environments
4. **Dark mode**: Match your IDE theme for better experience
5. **Multiple instances**: Create multiple debug panels for different subjects

## License

MIT
