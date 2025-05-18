import { DeepSubject } from '../deepSubject';

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
}); 