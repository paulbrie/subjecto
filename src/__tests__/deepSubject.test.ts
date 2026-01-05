import { DeepSubject, matchPath } from '../deepSubject';

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => {
    jest.restoreAllMocks();
});

describe('DeepSubject', () => {
    it('should initialize with the provided value', () => {
        const subject = new DeepSubject({ name: 'John' });
        const value = subject.getValue();
        expect(value).toEqual({ name: 'John' });
    });

    it('should notify subscribers of initial value', () => {
        const subject = new DeepSubject({ name: 'John' });
        const callback = jest.fn();
        subject.subscribe('name', callback);
        expect(callback).toHaveBeenCalledWith('John');
    });

    it('should notify subscribers when value changes', () => {
        const subject = new DeepSubject({ name: 'John' });
        const callback = jest.fn();
        subject.subscribe('name', callback);
        subject.getValue().name = 'Jane';
        expect(callback).toHaveBeenCalledWith('Jane');
    });

    it('should allow unsubscribing', () => {
        const subject = new DeepSubject({ name: 'John' });
        const callback = jest.fn();
        const subscription = subject.subscribe('name', callback);
        subscription.unsubscribe();
        subject.getValue().name = 'Jane';
        expect(callback).toHaveBeenCalledTimes(1); // Only initial value
    });

    it('should handle nested object changes', () => {
        const subject = new DeepSubject({ user: { name: 'John' } });
        const callback = jest.fn();
        subject.subscribe('user/name', callback);
        subject.getValue().user.name = 'Jane';
        expect(callback).toHaveBeenCalledWith('Jane');
    });

    it('should handle undefined paths', () => {
        const subject = new DeepSubject({ name: 'John' });
        const callback = jest.fn();
        subject.subscribe('age', callback);
        expect(callback).toHaveBeenCalledWith(undefined);
    });

    it('should handle parent paths', () => {
        const subject = new DeepSubject({ user: { name: 'John' } });
        const callback = jest.fn();
        subject.subscribe('user', callback);
        subject.getValue().user.name = 'Jane';
        expect(callback).toHaveBeenCalledWith({ name: 'Jane' });
    });

    it('should handle array mutations', () => {
        const subject = new DeepSubject({ items: [1, 2, 3] });
        const callback = jest.fn();
        subject.subscribe('items', callback);
        subject.getValue().items.push(4);
        expect(callback).toHaveBeenCalledWith([1, 2, 3, 4]);
    });

    it('should handle array element changes', () => {
        const subject = new DeepSubject({ items: [1, 2, 3] });
        const callback = jest.fn();
        subject.subscribe('items/0', callback);
        subject.getValue().items[0] = 10;
        expect(callback).toHaveBeenCalledWith(10);
    });

    it('should handle complete state replacement', () => {
        const subject = new DeepSubject({ name: 'John' });
        const callback = jest.fn();
        subject.subscribe('name', callback);
        const newState = { name: 'Jane' };
        Object.assign(subject.getValue(), newState);
        expect(callback).toHaveBeenCalledWith('Jane');
    });

    it('should handle multiple subscribers for the same path', () => {
        const subject = new DeepSubject({ name: 'John' });
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        subject.subscribe('name', callback1);
        subject.subscribe('name', callback2);
        subject.getValue().name = 'Jane';
        expect(callback1).toHaveBeenCalledWith('Jane');
        expect(callback2).toHaveBeenCalledWith('Jane');
    });

    it('should handle deep nested object mutations', () => {
        const subject = new DeepSubject({
            user: {
                profile: {
                    details: {
                        name: 'John'
                    }
                }
            }
        });
        const callback = jest.fn();
        subject.subscribe('user/profile/details/name', callback);
        subject.getValue().user.profile.details.name = 'Jane';
        expect(callback).toHaveBeenCalledWith('Jane');
    });

    it('should handle object replacement', () => {
        const subject = new DeepSubject({ user: { name: 'John' } });
        const callback = jest.fn();
        subject.subscribe('user', callback);
        subject.getValue().user = { name: 'Jane' };
        expect(callback).toHaveBeenCalledWith({ name: 'Jane' });
    });

    it('should handle array method calls', () => {
        const subject = new DeepSubject({ items: [1, 2, 3] });
        const callback = jest.fn();
        subject.subscribe('items', callback);
        subject.getValue().items.splice(1, 1);
        expect(callback).toHaveBeenCalledWith([1, 3]);
    });

    it('should handle multiple path subscriptions', () => {
        const subject = new DeepSubject({ user: { name: 'John', age: 30 } });
        const nameCallback = jest.fn();
        const ageCallback = jest.fn();
        subject.subscribe('user/name', nameCallback);
        subject.subscribe('user/age', ageCallback);
        subject.getValue().user.name = 'Jane';
        subject.getValue().user.age = 31;
        expect(nameCallback).toHaveBeenCalledWith('Jane');
        expect(ageCallback).toHaveBeenCalledWith(31);
    });

    it('should handle array push and pop operations', () => {
        const subject = new DeepSubject({ items: [1, 2, 3] });
        const callback = jest.fn();
        subject.subscribe('items', callback);

        subject.getValue().items.push(4);
        expect(callback).toHaveBeenCalledWith([1, 2, 3, 4]);

        subject.getValue().items.pop();
        expect(callback).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should handle array shift and unshift operations', () => {
        const subject = new DeepSubject({ items: [1, 2, 3] });
        const callback = jest.fn();
        subject.subscribe('items', callback);

        subject.getValue().items.unshift(0);
        expect(callback).toHaveBeenCalledWith([0, 1, 2, 3]);

        subject.getValue().items.shift();
        expect(callback).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should handle nested array operations', () => {
        const subject = new DeepSubject({
            data: {
                items: [1, 2, 3]
            }
        });
        const callback = jest.fn();
        subject.subscribe('data/items', callback);

        subject.getValue().data.items.push(4);
        expect(callback).toHaveBeenCalledWith([1, 2, 3, 4]);
    });

    it('should handle multiple levels of object replacement', () => {
        const subject = new DeepSubject({
            user: {
                profile: {
                    name: 'John'
                }
            }
        });
        const callback = jest.fn();
        subject.subscribe('user/profile', callback);

        subject.getValue().user.profile = { name: 'Jane' };
        expect(callback).toHaveBeenCalledWith({ name: 'Jane' });
    });

    it('should handle null and undefined values', () => {
        const subject = new DeepSubject({
            user: {
                name: 'John',
                age: null,
                email: undefined
            }
        });
        const nameCallback = jest.fn();
        const ageCallback = jest.fn();
        const emailCallback = jest.fn();

        subject.subscribe('user/name', nameCallback);
        subject.subscribe('user/age', ageCallback);
        subject.subscribe('user/email', emailCallback);

        expect(nameCallback).toHaveBeenCalledWith('John');
        expect(ageCallback).toHaveBeenCalledWith(null);
        expect(emailCallback).toHaveBeenCalledWith(undefined);
    });

    it('should handle circular references', () => {
        interface CircularObject {
            b?: CircularObject;
            name?: string;
        }
        const subject = new DeepSubject({ a: {} as CircularObject });
        const obj = subject.getValue().a;

        // Create circular reference
        obj.b = obj;

        // Subscribe to the object
        const callback = jest.fn();
        subject.subscribe('a', callback);

        // Verify initial value
        expect(callback).toHaveBeenCalledWith(obj);

        // Update a property on the circular reference
        obj.name = 'test';
        expect(callback).toHaveBeenCalledWith(obj);

        // Verify the update was applied
        const updatedObj = subject.getValue().a;
        expect((updatedObj as CircularObject).name).toBe('test');
    });

    it('should notify * wildcard subscribers for direct children', () => {
        const subject = new DeepSubject({ user: { name: 'John', age: 30 } });
        const callback = jest.fn();
        subject.subscribe('user/*', callback);
        subject.getValue().user.name = 'Jane';
        expect(callback).toHaveBeenCalledWith('Jane');
        subject.getValue().user.age = 31;
        expect(callback).toHaveBeenCalledWith(31);
    });

    it('should notify ** wildcard subscribers for any depth', () => {
        const subject = new DeepSubject({
            user: {
                profile: {
                    details: {
                        name: 'John',
                        age: 30
                    }
                }
            }
        });
        const callback = jest.fn();
        subject.subscribe('user/**', callback);
        subject.getValue().user.profile.details.name = 'Jane';
        expect(callback).toHaveBeenCalledWith({
            profile: {
                details: {
                    name: 'Jane',
                    age: 30
                }
            }
        });
    });

    it('should notify ** wildcard subscribers for root', () => {
        const subject = new DeepSubject({
            a: { b: { c: 1 } },
            x: 2
        });
        const callback = jest.fn();
        subject.subscribe('**', callback);
        subject.getValue().a.b.c = 42;
        expect(callback).toHaveBeenCalledWith({
            a: { b: { c: 42 } },
            x: 2
        });
        subject.getValue().x = 99;
        expect(callback).toHaveBeenCalledWith({
            a: { b: { c: 42 } },
            x: 99
        });
    });

    it('should remove a callback from all subscriptions with unsubscribe', () => {
        const subject = new DeepSubject({
            user: { name: 'John', age: 30 },
            items: [1, 2, 3]
        });
        const callback = jest.fn((val) => val);
        subject.subscribe('user/name', callback);
        subject.subscribe('user/age', callback);
        subject.subscribe('items', callback);

        // Mutate all paths, callback should be called
        subject.getValue().user.name = 'Jane';
        subject.getValue().user.age = 31;
        subject.getValue().items.push(4);
        expect(callback).toHaveBeenCalledTimes(6); // 3 initial + 3 updates

        // Unsubscribe from all
        subject.unsubscribe(callback);

        // Further mutations should not call callback
        subject.getValue().user.name = 'Alice';
        subject.getValue().user.age = 32;
        subject.getValue().items.push(5);
        expect(callback).toHaveBeenCalledTimes(6); // No new calls
    });
});

describe('DeepSubject additional coverage', () => {
    it('should matchPath with ** at root', () => {
        const ds = new DeepSubject<{ a: { b: number } }>({ a: { b: 1 } });
        const handler = jest.fn();
        ds.subscribe('**', handler);
        ds.getValue().a.b = 2;
        expect(handler).toHaveBeenCalledWith({ a: { b: 2 } });
    });

    it('matchPath: should return true immediately for root ** pattern', () => {
        // This directly tests the early return at line 28
        expect(matchPath('**', 'any/path')).toBe(true);
        expect(matchPath('**', '')).toBe(true);
        expect(matchPath('**', 'a')).toBe(true);
        expect(matchPath('**', 'a/b/c/d/e')).toBe(true);
    });

    it('should matchPath with * wildcard', () => {
        const ds = new DeepSubject<{ a: { b: number; c: number } }>({ a: { b: 1, c: 2 } });
        const handler = jest.fn();
        ds.subscribe('a/*', handler);
        ds.getValue().a.b = 3;
        expect(handler).toHaveBeenCalledWith(3);
    });

    it('should handle unsubscribing twice gracefully', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        const handler = jest.fn();
        const sub = ds.subscribe('a', handler);
        sub.unsubscribe();
        expect(() => sub.unsubscribe()).not.toThrow();
    });

    it('should trigger debug logging (boolean)', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 }, { name: 'testDS' });
        jest.spyOn(console, 'log').mockImplementation(() => { });
        ds.debug = true;
        const handler = jest.fn();
        ds.subscribe('a', handler);
        ds.next({ a: 2 });

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('SUBJECTO DEBUG')
        );
        (console.log as jest.Mock).mockRestore();
    });

    it('should trigger debug logging (function)', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        const debugFn = jest.fn();
        ds.debug = debugFn;
        ds.next({ a: 2 });
        expect(debugFn).toHaveBeenCalledWith({ a: 2 });
    });

    it('should call before hook', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        ds.before = (nextValue) => ({ a: nextValue.a + 1 });
        const handler = jest.fn();
        ds.subscribe('a', handler);
        ds.next({ a: 2 });
        expect(handler).toHaveBeenCalledWith(3);
    });

    it('should getValueAtPath with empty path', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        expect(ds["getValueAtPath"]('')).toEqual(ds.getValue());
    });

    it('should getValueAtPath with non-existent path', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        expect(ds["getValueAtPath"]('b')).toBeUndefined();
    });

    it('should handle array sort and reverse', () => {
        const ds = new DeepSubject<{ arr: number[] }>({ arr: [3, 1, 2] });
        const handler = jest.fn();
        ds.subscribe('arr', handler);
        ds.getValue().arr.sort();
        ds.getValue().arr.reverse();
        const calls = handler.mock.calls.map(call => call[0]);
        expect(calls).toEqual(
            expect.arrayContaining([
                expect.arrayContaining([1, 2, 3]),
                expect.arrayContaining([3, 2, 1])
            ])
        );
    });

    it('should handle errors in subscribers gracefully', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        const errorHandler = jest.fn(() => { throw new Error('fail'); });
        const goodHandler = jest.fn();
        ds.subscribe('a', errorHandler);
        ds.subscribe('a', goodHandler);
        expect(() => { ds.getValue().a = 2; }).not.toThrow();
        expect(goodHandler).toHaveBeenCalledWith(2);
        expect(console.error).toHaveBeenCalledWith('Error in subscriber:', expect.any(Error));
        (console.error as jest.Mock).mockRestore();
    });

    it('should handle errors in subscribers in next() gracefully', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        const errorHandler = jest.fn(() => { throw new Error('fail'); });
        const goodHandler = jest.fn();
        ds.subscribe('a', errorHandler);
        ds.subscribe('a', goodHandler);
        expect(() => { ds.next({ a: 2 }); }).not.toThrow();
        expect(goodHandler).toHaveBeenCalledWith(2);
        expect(console.error).toHaveBeenCalledWith('Error in subscriber:', expect.any(Error));
        (console.error as jest.Mock).mockRestore();
    });

    it('should handle errors in ** wildcard subscribers gracefully', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        const errorHandler = jest.fn(() => { throw new Error('fail'); });
        const goodHandler = jest.fn();
        ds.subscribe('**', errorHandler);
        ds.subscribe('**', goodHandler);
        expect(() => { ds.getValue().a = 2; }).not.toThrow();
        expect(goodHandler).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith('Error in subscriber:', expect.any(Error));
        jest.restoreAllMocks();
    });

    it('should handle errors in wildcard pattern subscribers (with * pattern)', () => {
        const ds = new DeepSubject<{ user: { name: string; age: number } }>({
            user: { name: 'John', age: 30 }
        });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        const errorHandler = jest.fn(() => { throw new Error('fail'); });
        const goodHandler = jest.fn();
        ds.subscribe('user/*', errorHandler);
        ds.subscribe('user/*', goodHandler);
        expect(() => { ds.getValue().user.name = 'Jane'; }).not.toThrow();
        expect(goodHandler).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith('Error in subscriber:', expect.any(Error));
        jest.restoreAllMocks();
    });

    it('should not notify if updateIfStrictlyEqual is false and value is the same reference', () => {
        const obj = { a: 1 };
        const ds = new DeepSubject(obj, { updateIfStrictlyEqual: false });
        const handler = jest.fn();
        ds.subscribe('a', handler);
        const initialCount = ds.count;
        // Note: DeepSubject wraps objects in Proxy, so we need to pass the proxied value
        const proxiedValue = ds.getValue();
        ds.next(proxiedValue as typeof obj); // Same proxied reference
        expect(ds.count).toBe(initialCount); // Count should not increment
        expect(handler).toHaveBeenCalledTimes(1); // Only initial call
    });

    it('should notify if updateIfStrictlyEqual is false but value is different reference', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 }, { updateIfStrictlyEqual: false });
        const handler = jest.fn();
        ds.subscribe('a', handler);
        ds.next({ a: 1 }); // Different reference, same value
        expect(handler).toHaveBeenCalledTimes(2); // Initial + update
    });

    it('should unsubscribe all subscribers', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        ds.subscribe('a', handler1);
        ds.subscribe('a', handler2);
        ds.unsubscribe(handler1);
        ds.unsubscribe(handler2);
        ds.getValue().a = 2;
        expect(handler1).not.toHaveBeenCalledWith(2);
        expect(handler2).not.toHaveBeenCalledWith(2);
    });

    it('should notify ** wildcard for deep changes', () => {
        const ds = new DeepSubject<{ a: { b: { c: number } } }>({ a: { b: { c: 1 } } });
        const handler = jest.fn();
        ds.subscribe('**', handler);
        ds.getValue().a.b.c = 2;
        expect(handler).toHaveBeenCalledWith({ a: { b: { c: 2 } } });
    });

    it('should notify user/** wildcard for changes at any depth', () => {
        const ds = new DeepSubject<{ user: { a: { b: number } } }>({ user: { a: { b: 1 } } });
        const handler = jest.fn();
        ds.subscribe('user/**', handler);
        ds.getValue().user.a.b = 2;
        expect(handler).toHaveBeenCalledWith({ a: { b: 2 } });
    });
});

describe('DeepSubject edge and uncovered lines', () => {
    it('matchPath: should handle trailing ** in pattern', () => {
        expect(matchPath('a/**', 'a/b/c')).toBe(true);
        expect(matchPath('a/**', 'a')).toBe(true);
        expect(matchPath('a/**', 'b')).toBe(false);
    });

    it('matchPath: should return false for non-matching patterns', () => {
        expect(matchPath('a/b', 'a/c')).toBe(false);
        expect(matchPath('a/*/c', 'a/b/d')).toBe(false);
    });

    it('matchPath: should handle empty pattern and path', () => {
        expect(matchPath('', '')).toBe(true);
        expect(matchPath('', 'a')).toBe(false);
        expect(matchPath('a', '')).toBe(false);
    });

    it('matchPath: should handle ** wildcard in middle of pattern', () => {
        // Test recursive matching when ** is not at the end
        expect(matchPath('a/**/c', 'a/b/c')).toBe(true);
        expect(matchPath('a/**/c', 'a/b/d/c')).toBe(true);
        expect(matchPath('a/**/c', 'a/x/y/z/c')).toBe(true);
        expect(matchPath('a/**/c', 'a/c')).toBe(true);
        expect(matchPath('a/**/c', 'a/b/d')).toBe(false);
        expect(matchPath('a/**/c', 'b/c')).toBe(false);
    });

    it('matchPath: should handle ** wildcard recursive matching edge cases', () => {
        // Test when ** needs to find a match recursively
        expect(matchPath('a/**/b/**/c', 'a/x/b/y/c')).toBe(true);
        expect(matchPath('a/**/b/**/c', 'a/x/y/b/z/c')).toBe(true);
        expect(matchPath('a/**/b/**/c', 'a/b/c')).toBe(true);
    });

    it('notifySubscribers: should not notify if matchPath returns false', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        const handler = jest.fn();
        ds.subscribe('b', handler);
        ds.getValue().a = 2;
        expect(handler).toHaveBeenCalledWith(undefined); // only initial call
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('subscribe: unsubscribing when subscriber is not present should not throw', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        const handler = jest.fn();
        const sub = ds.subscribe('a', handler);
        sub.unsubscribe();
        // Unsubscribe again
        expect(() => sub.unsubscribe()).not.toThrow();
    });

    it('getValueAtPath: should return undefined if current is undefined/null', () => {
        const ds = new DeepSubject<{ a?: { b?: number } }>({});
        expect(ds["getValueAtPath"]('a/b')).toBeUndefined();
    });

    it('next: should call debug as a function', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        const debugFn = jest.fn();
        ds.debug = debugFn;
        ds.next({ a: 2 });
        expect(debugFn).toHaveBeenCalledWith({ a: 2 });
    });

    it('next: should call debug as true and log', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 }, { name: 'testDS' });
        jest.spyOn(console, 'log').mockImplementation(() => { });
        ds.debug = true;
        ds.next({ a: 2 });

        expect(console.log).toHaveBeenCalled();
        (console.log as jest.Mock).mockRestore();
    });
});

describe('DeepSubject count property', () => {
    it('should start at 1 after initialization', () => {
        const ds = new DeepSubject<{ a: number }>({ a: 1 });
        expect(ds.count).toBe(1);
    });
    it('should increment count on each next()', () => {
        const ds = new DeepSubject<Record<string, unknown>>({ a: 1 });
        ds.next({ a: 2, b: 2 });
        expect(ds.count).toBe(2);
        ds.next({ a: 3, b: 3 });
        expect(ds.count).toBe(3);
    });
    it('should not increment count if updateIfStrictlyEqual is false and value is the same reference', () => {
        const obj = { a: 1 };
        const ds = new DeepSubject(obj, { updateIfStrictlyEqual: false });
        obj.a = 1;
        expect(ds.count).toBe(1);
    });
});

describe('DeepSubject LRU cache eviction', () => {
    it('should evict oldest entry when cache exceeds 100 entries', () => {
        // Create a large nested object to trigger many path matches
        const initialState: Record<string, { value: number }> = {};
        for (let i = 0; i < 110; i++) {
            initialState[`key${i}`] = { value: i };
        }

        const ds = new DeepSubject(initialState);
        const callbacks: Array<() => void> = [];

        // Subscribe to 110 different paths to fill and exceed cache
        for (let i = 0; i < 110; i++) {
            let called = false;
            const callback = () => { called = true; };
            callbacks.push(() => expect(called).toBe(true));

            ds.subscribe(`key${i}/**`, callback);
        }

        // Trigger updates to cause cache lookups and eviction
        for (let i = 0; i < 110; i++) {
            ds.getValue()[`key${i}`].value = i + 1;
        }

        // Verify all callbacks were called (cache eviction didn't break functionality)
        callbacks.forEach(check => check());
    });

    it('should still match paths correctly after cache eviction', () => {
        const ds = new DeepSubject<Record<string, { nested: number }>>({});
        const subscribers: Array<jest.Mock> = [];

        // Create 105 subscribers to force cache eviction
        for (let i = 0; i < 105; i++) {
            ds.getValue()[`prop${i}`] = { nested: i };
            const mock = jest.fn();
            subscribers.push(mock);
            ds.subscribe(`prop${i}/nested`, mock, { skipInitialCall: true });
        }

        // Update a property that was added early (should have been evicted from cache)
        ds.getValue().prop0.nested = 999;

        // Verify the subscriber still works correctly after cache eviction
        expect(subscribers[0]).toHaveBeenCalledWith(999);

        // Update a property added later (likely still in cache)
        ds.getValue().prop104.nested = 888;
        expect(subscribers[104]).toHaveBeenCalledWith(888);
    });
}); 