import Subject, { ERROR_MESSAGES, DEFAULT_NAME, DEFAULT_UPDATE_IF_STRICTLY_EQUAL } from '../subject'

describe('instantiation', () => {
    test('assigns a value to the subject', () => {
        const subject = new Subject('a')
        expect(subject.getValue()).toBe("a")
    })

    test('sets option strictly equal', () => {
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

describe('debug', () => {
    test('logs the next value', () => {
        const subject = new Subject('a')
        console.log = jest.fn()
        subject.debug = true
        subject.next('b')
        expect(console.log).toHaveBeenCalled()
    })

    test('logs when unsubscribing', () => {
        const subject = new Subject('a')
        subject.debug = true
        const sub = subject.subscribe(() => null)
        console.log = jest.fn()
        sub.unsubscribe()
        expect(console.log).toHaveBeenCalled()
    })

    test('executes custom debug function', () => {
        const subject = new Subject('a')
        const debug = jest.fn()
        subject.debug = debug
        subject.next('b')
        expect(debug).toHaveBeenCalledWith('b')
    })
})

describe('assigning values', () => {
    test('next', () => {
        const subject = new Subject('a')
        subject.next('b')
        expect(subject.getValue()).toBe('b')
    })

    test('next with function', () => {
        const subject = new Subject('a')
        subject.next('b')
        expect(subject.getValue()).toBe('b')
    })

    test('nextAssign: new object value', () => {
        const subject = new Subject<null | { a: number, b: number }>(null!)
        const newValue = { a: 1, b: 1 }
        subject.nextAssign(newValue)
        expect(subject.getValue() === newValue)
    })

    test('nextAssign: update', () => {
        const subject = new Subject({ a: 1 })
        subject.nextAssign({ a: 2 })
        expect(subject.getValue().a === 2)
    })

    test('nextAssign: fail message', () => {
        const subject = new Subject('a')
        try {
            // @ts-expect-error bad type
            subject.nextAssign(100)
        } catch (err) {
            expect(err === ERROR_MESSAGES.VALUE_NOT_OBJECT && subject.getValue() === "a")
        }
    })

    test('nextPush: update', () => {
        const subject = new Subject(['a'])
        subject.nextPush('b')
        expect(subject.getValue()[1] === 'b')
    })

    test('nextPush: fail message', () => {
        const subject = new Subject('a')
        try {
            subject.nextPush(100)
        } catch (err) {
            expect(err === ERROR_MESSAGES.VALUE_NOT_ARRAY && subject.getValue() === "a")
        }
    })

    test('toggle', () => {
        const subject = new Subject(false)
        subject.toggle()
        expect(subject.getValue() === true)
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
        const onNewValue = (value: string) => console.log(value)
        const handler = subject.subscribe(onNewValue)
        expect(subject.subscribers.get(handler.id) === onNewValue)
    })

    test('handler format is correct', () => {
        const subject = new Subject('a')
        const handler = subject.subscribe(() => null)
        expect(typeof handler.id === "string")
        expect(typeof handler.unsubscribe === "function")
    })

})

describe('unsubscribe', () => {
    test('unsubscription', () => {
        const subject = new Subject('a')
        const handler = subject.subscribe(() => null)
        handler.unsubscribe()
        expect(Object.keys(subject.subscribers).length === 0)
    })

    test('unsubscription with id', () => {
        const subject = new Subject('a')
        const handler = subject.subscribe(() => null)
        subject.unsubscribe(handler.id)
        expect(Object.keys(subject.subscribers).length === 0)
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

    test('complete', () => {
        const subject = new Subject('a')
        const sub = () => null
        subject.subscribe(sub)
        subject.complete()
        expect(subject.subscribers.size).toBe(0)
    })
})

describe('others', () => {
    test('hook', () => {
        const subject = new Subject('a')
        const next = jest.fn()
        subject.next = next
        subject.hook('b')
        expect(next).toHaveBeenCalledWith('b')
        expect(subject.hook() === subject.getValue())
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