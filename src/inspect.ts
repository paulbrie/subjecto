import Subject from './subject';

let lastTime = new Date();
let activated = false; // Global flag for the Inspect function itself

// Renamed to inspectStoreRecursive and added visited parameter
const inspectStoreRecursive = (
    store: Record<string, unknown>,
    keys: string[], // Keys to filter Subjects by name
    path: string,   // Current path string for logging
    visited: Set<unknown> // Set to track visited objects in the current traversal
) => {
    // Base case for recursion: if store is null, undefined, or already visited in this path
    if (!store || visited.has(store)) {
        return;
    }
    visited.add(store); // Mark current object as visited for this traversal path

    Object.keys(store).forEach((key) => {
        const currentValue = store[key]; // Get the value of the current key

        if (currentValue instanceof Subject) {
            // Check if this subject should be inspected based on keys filter
            if (keys.length === 0 || keys.includes(currentValue.options.name || '')) {
                currentValue.subscribe((value: typeof Subject.prototype.value) => {
                    const elapsed = new Date().getTime() - lastTime.getTime();
                    // Cast to access Subject-specific properties like options, subscribers, count
                    const subjectInstance = currentValue as Subject<unknown>; 
                    console.groupCollapsed(
                        `%cstore%c ${path}.${key} (%c${elapsed / 1000}s) subs: ${subjectInstance.subscribers.size} / count: ${subjectInstance.count}`,
                        "background-color:#000000aa; color: #fff; padding: 2px 4px; border-radius: 3px; margin-right: 4px;font-weight: 400;",
                        "font-weight: 400;",
                        "font-weight: 400;"
                    );
                    console.log(value);
                    console.groupEnd();
                    lastTime = new Date();
                });
            }
        } else if (typeof currentValue === "object" && currentValue !== null) {
            // If it's an object and not null, recurse
            inspectStoreRecursive(currentValue as Record<string, unknown>, keys, `${path}.${key}`, visited);
        }
        // If it's not a Subject and not a non-null object (e.g., primitive), do nothing and don't recurse.
    });
    // Optional: If allowing multiple paths to the same object but want to avoid cycles within one path
    // visited.delete(store); 
    // For this use case, keeping it in visited for the whole Inspect() call is fine.
};

// Default exported function
export default (store: Record<string, unknown>, keys: string[] = []) => {
    if (!activated) { // Global activated flag for the Inspect utility
        // Create a new Set for visited objects for each top-level call to Inspect.
        // The path starts empty for the root store object.
        inspectStoreRecursive(store, keys, '', new Set());
    }
    activated = true; // Mark Inspect as having been run once.
};
