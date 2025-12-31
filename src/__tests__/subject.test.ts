import Subject, { ERROR_MESSAGES, DEFAULT_NAME, DEFAULT_UPDATE_IF_STRICTLY_EQUAL, INFO_MESSAGES } from '../subject'

describe('instantiation', () => {
    test('assigns a value to the subject', () => {
        const subject = new Subject('a')
        expect(subject.getValue()).toBe("a")
    })

    test('checks count after next', () => {
        const subject = new Subject('a', {
            updateIfStrictlyEqual: false,
        })
        subject.next('a')
        expect(subject.count).toBe(1)
    })

    test('sets a custom name', () => {
        const subject = new Subject('a', {
            name: "test"
        })
        expect(subject.options.name).toBe("test")
    })

    test('sets default options', () => {
        const subject = new Subject('a')
        expect(subject.options).toStrictEqual({
            name: DEFAULT_NAME,
            updateIfStrictlyEqual: DEFAULT_UPDATE_IF_STRICTLY_EQUAL,
        })
    })

    test('sets default name when options object has no name property', () => {
        const subject = new Subject('a', { updateIfStrictlyEqual: true })
        // When name is not provided, options.name is undefined, so DEFAULT_NAME is used
        expect(subject.options.name).toBe(DEFAULT_NAME)
    })
})

describe('subscription', () => {
    test('called with the new value', () => {
        const subject = new Subject('a')

        const subscriber = jest.fn()
        subject.subscribe(subscriber)

        subject.next('b')

        expect(subject.getValue()).toEqual('b')
        expect(subscriber).toHaveBeenCalledWith('b')
    })
})

describe('assigning values', () => {
    test('next', () => {
        const subject = new Subject('a')
        subject.next('b')
        expect(subject.getValue()).toBe('b')
    })

    test('next with updateIfStrictlyEqual false skips same reference', () => {
        const obj = { a: 1 }
        const subject = new Subject(obj, { updateIfStrictlyEqual: false })
        const initialCount = subject.count
        subject.next(obj) // Same reference
        expect(subject.count).toBe(initialCount)
    })

    test('next with updateIfStrictlyEqual false updates different reference', () => {
        const subject = new Subject({ a: 1 }, { updateIfStrictlyEqual: false })
        const initialCount = subject.count
        subject.next({ a: 1 }) // Different reference, same value
        expect(subject.count).toBe(initialCount + 1)
    })

    test('nextAssign: new object value', () => {
        const subject = new Subject<null | { a: number, b: number }>(null!)
        const newValue = { a: 1, b: 1 }
        subject.nextAssign(newValue)
        expect(subject.getValue()).toEqual(newValue)
    })

    test('nextAssign: update', () => {
        const subject = new Subject({ a: 1 })
        subject.nextAssign({ a: 2 })
        expect(subject.getValue().a).toBe(2)
    })

    test('nextAssign: fail message', () => {
        const subject = new Subject('a')
        expect(() => {
            // @ts-expect-error bad type
            subject.nextAssign(100)
        }).toThrow(ERROR_MESSAGES.VALUE_NOT_OBJECT)
        expect(subject.getValue()).toBe('a')
    })

    test('nextPush: update', () => {
        const subject = new Subject(['a'])
        subject.nextPush('b')
        expect(subject.getValue()[1]).toBe('b')
    })

    test('nextPush: fail message', () => {
        const subject = new Subject('a')
        expect(() => {
            subject.nextPush(100)
        }).toThrow(ERROR_MESSAGES.VALUE_NOT_ARRAY)
        expect(subject.getValue()).toBe('a')
    })

    test('toggle', () => {
        const subject = new Subject(false)
        subject.toggle()
        expect(subject.getValue() === true)
    })

    test('toggle does nothing when value is not boolean', () => {
        const subject = new Subject('not a boolean')
        const initialValue = subject.getValue()
        subject.toggle()
        expect(subject.getValue()).toBe(initialValue)
    })

    test('before', () => {
        const subject = new Subject(false)
        subject.before = (value: boolean) => !value
        subject.next(true)
        expect(subject.getValue()).toStrictEqual(false)
    })
})

describe('handler', () => {
    test('handler is registered', () => {
        const subject = new Subject('a')
        const onNewValue = (value: string) => value
        const handler = subject.subscribe(onNewValue)
        expect(subject.subscribers.get(handler.id) === onNewValue)
    })

    test('handler format is correct', () => {
        const subject = new Subject('a')
        const handler = subject.subscribe(() => null)
        expect(typeof handler.id === "symbol")
        expect(typeof handler.unsubscribe === "function")
    })

})

describe('unsubscribe', () => {
    test('unsubscription', () => {
        const subject = new Subject('a')
        const handler = subject.subscribe(() => null)
        handler.unsubscribe()
        expect(subject.subscribers.size === 0)
    })

    test('unsubscription with id', () => {
        const subject = new Subject('a')
        const handler = subject.subscribe(() => null)
        subject.unsubscribe(handler.id)
        expect(subject.subscribers.size === 0)
    })

    test('once', () => {
        const subject = new Subject('a')
        const sub = jest.fn()
        subject.once(sub)
        subject.next('b')
        subject.next('c')

        expect(sub).toHaveBeenCalledTimes(1)
        expect(subject.subscribers.size).toBe(0)
    })

    test('once handles case when subscriber is removed before get call', () => {
        const subject = new Subject('a')
        const sub = jest.fn()
        const id = Symbol('test')
        // Manually add and remove to simulate edge case
        subject.subscribers.set(id, sub)
        subject.subscribers.delete(id)
        // This should not throw even if subscriber was removed
        subject.subscribers.get(id)?.(subject.getValue())
    })

    test('once calls subscriber immediately and only once', () => {
        const subject = new Subject('b')
        const sub = jest.fn()

        subject.once(sub)
        // Should be called immediately with current value
        expect(sub).toHaveBeenCalledWith('b')

        // Subsequent next calls should not trigger again
        subject.next('c')
        expect(sub).toHaveBeenCalledTimes(1)
    })

    test('complete', () => {
        const subject = new Subject('a')
        const sub = () => null
        subject.subscribe(sub)
        subject.complete()
        expect(subject.subscribers.size).toBe(0)
    })
})

describe('Subject', () => {
    it('should initialize with the provided value', () => {
        const subject = new Subject("a")
        expect(subject.getValue()).toBe("a")
    })

    it('should notify subscribers of the initial value', () => {
        const subject = new Subject("a")
        const callback = jest.fn()
        subject.subscribe(callback)
        expect(callback).toHaveBeenCalledWith("a")
    })

    it('should notify subscribers when value changes', () => {
        const subject = new Subject("a")
        const callback = jest.fn()
        subject.subscribe(callback)
        subject.next("b")
        expect(callback).toHaveBeenCalledWith("b")
    })

    it('should allow unsubscribing', () => {
        const subject = new Subject("a")
        const callback = jest.fn()
        const subscription = subject.subscribe(callback)
        subscription.unsubscribe()
        subject.next("b")
        expect(callback).toHaveBeenCalledTimes(1) // Only initial value
    })

    it('should handle multiple subscribers', () => {
        const subject = new Subject("a")
        const callback1 = jest.fn()
        const callback2 = jest.fn()
        subject.subscribe(callback1)
        subject.subscribe(callback2)
        subject.next("b")
        expect(callback1).toHaveBeenCalledWith("b")
        expect(callback2).toHaveBeenCalledWith("b")
    })

    it('should handle object values', () => {
        const subject = new Subject({ a: 1 })
        expect(subject.getValue().a).toBe(1)
        subject.next({ a: 2 })
        expect(subject.getValue().a).toBe(2)
    })

    it('should handle array values', () => {
        const subject = new Subject(['a'])
        expect(subject.getValue()[0]).toBe('a')
        subject.next(['b'])
        expect(subject.getValue()[0]).toBe('b')
    })

    it('should handle boolean values', () => {
        const subject = new Subject(true)
        expect(subject.getValue()).toBe(true)
        subject.next(false)
        expect(subject.getValue()).toBe(false)
    })

    it('should handle null values', () => {
        const subject = new Subject(null)
        expect(subject.getValue()).toBeNull()
        subject.next(null)
        expect(subject.getValue()).toBeNull()
    })

    it('should handle undefined values', () => {
        const subject = new Subject(undefined)
        expect(subject.getValue()).toBeUndefined()
        subject.next(undefined)
        expect(subject.getValue()).toBeUndefined()
    })
})

describe('Subject debug logging', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        (console.log as jest.Mock).mockRestore();
    });

    test('should log debug info when debug is true', () => {
        const subject = new Subject('test', { name: 'testSubject' });
        subject.debug = true;
        subject.next('newValue');

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('SUBJECTO DEBUG')
        );
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('testSubject')
        );
    });

    test('should call custom debug function when debug is a function', () => {
        const subject = new Subject('test');
        const debugFn = jest.fn();
        subject.debug = debugFn;
        subject.next('newValue');

        expect(debugFn).toHaveBeenCalledWith('newValue');
    });

    test('should log debug info on unsubscribe when debug is true', () => {
        const subject = new Subject('test', { name: 'testSubject' });
        subject.debug = true;
        const handle = subject.subscribe(() => { });

        handle.unsubscribe();

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('subscribers left')
        );
    });

    test('should show info message when name is default and debug is true', () => {
        const subject = new Subject('test'); // Uses DEFAULT_NAME
        subject.debug = true;
        const handle = subject.subscribe(() => { });

        handle.unsubscribe();

        // The code logs INFO_MESSAGES object when name is DEFAULT_NAME
        expect(console.log).toHaveBeenCalledWith(INFO_MESSAGES);
    });

    test('should not show info message when name is custom and debug is true', () => {
        const subject = new Subject('test', { name: 'customName' });
        subject.debug = true;
        const handle = subject.subscribe(() => { });

        handle.unsubscribe();

        expect(console.log).not.toHaveBeenCalledWith(
            expect.stringContaining(INFO_MESSAGES.SHOULD_USE_A_NAME)
        );
    });
})