import Subject from '../subject'
import { ERROR_MESSAGES, DEFAULT_NAME, DEFAULT_MAX_SUBSCRIBERS, DEFAULT_UPDATE_IF_STRICTLY_EQUAL } from '../subject'

describe('instantiation', () => {
    test('assigns a value to the subject', () => {
        const subject = new Subject('a');
        expect(subject.value).toBe("a");
    });

    test('sets option strictly equal', () => {
        const subject = new Subject('a', {
            updateIfStrictlyEqual: false,
        });
        subject.next('a');
        expect(subject.count).toBe(1);
    });

    test('sets option maxSubscribers', () => {
        const subject = new Subject('a', {
            maxSubscribers: 1
        });
        try {
            const sub1 = subject.subscribe(() => null);
            const sub2 = subject.subscribe(() => null);
        } catch (error) {
            expect(error).toBe(ERROR_MESSAGES.MAX_SUBSCRIBERS_REACHED);
            expect(subject.subscribers.size).toBe(1);
        }
    })

    test('sets a custom name', () => {
        const subject = new Subject('a', {
            name: "test"
        });
        expect(subject.options.name).toBe("test");
    });

    test('sets default options', () => {
        const subject = new Subject('a');
        expect(subject.options).toStrictEqual({
            name: DEFAULT_NAME,
            updateIfStrictlyEqual: DEFAULT_UPDATE_IF_STRICTLY_EQUAL,
            maxSubscribers: DEFAULT_MAX_SUBSCRIBERS,
        });
    })
})

describe('subscription', () => {
    test('called with the new value', () => {
        const subject = new Subject('a');

        const subscriber = jest.fn();
        subject.subscribe(subscriber);

        subject.next('b');

        expect(subject.value).toEqual('b');
        expect(subscriber).toHaveBeenCalledWith('b');
    })
})

describe('debug', () => {
    test('logs the next value', () => {
        const subject = new Subject('a');
        console.log = jest.fn();
        subject.debug = true;
        subject.next('b');
        expect(console.log).toHaveBeenCalled()
    });

    test('logs when unsubscribing', () => {
        const subject = new Subject('a');
        subject.debug = true;
        const sub = subject.subscribe(() => null);
        console.log = jest.fn();
        sub.unsubscribe();
        expect(console.log).toHaveBeenCalled();
    });

    test('executes custom debug function', () => {
        const subject = new Subject('a');
        const debug = jest.fn();
        subject.debug = debug;
        subject.next('b');
        expect(debug).toHaveBeenCalledWith('b');
    });
})

describe('assigning values', () => {
    test('next', () => {
        const subject = new Subject('a');
        subject.next('b');
        expect(subject.value).toBe('b');
    });

    test('next with function', () => {
        const subject = new Subject('a');
        subject.next('b');
        expect(subject.value).toBe('b');
    });

    test('nextAssign: new object value', () => {
        const subject = new Subject<null | { a: number, b: number }>(null!);
        const newValue = { a: 1, b: 1 };
        subject.nextAssign(newValue)
        expect(subject.value === newValue);
    })

    test('nextAssign: update', () => {
        const subject = new Subject({ a: 1 })
        subject.nextAssign({ a: 2 });
        expect(subject.value.a === 2);
    })

    test('nextAssign: fail message', () => {
        const subject = new Subject('a');
        try {
            // @ts-expect-error bad type
            subject.nextAssign(100);
        } catch (err) {
            expect(err === ERROR_MESSAGES.VALUE_NOT_OBJECT && subject.value === "a");
        }
    })

    test('nextPush: update', () => {
        const subject = new Subject(['a'])
        subject.nextPush('b')
        expect(subject.value[1] === 'b')
    })

    test('nextPush: fail message', () => {
        const subject = new Subject('a');
        try {
            subject.nextPush(100);
        } catch (err) {
            expect(err === ERROR_MESSAGES.VALUE_NOT_ARRAY && subject.value === "a");
        }
    })

    test('toggle', () => {
        const subject = new Subject(false)
        subject.toggle()
        expect(subject.value === true)
    })

    test('before', () => {
        const subject = new Subject(false)
        subject.before = (value: boolean) => !value;
        subject.next(true);
        expect(subject.value).toStrictEqual(false);
    })
})

describe('handler', () => {
    test('handler is registered', () => {
        const subject = new Subject('a');
        const onNewValue = (value: string) => console.log(value);
        const handler = subject.subscribe(onNewValue);
        expect(subject.subscribers.get(handler.id) === onNewValue);
    })

    test('handler format is correct', () => {
        const subject = new Subject('a');
        const handler = subject.subscribe(() => null)
        expect(typeof handler.id === "string")
        expect(typeof handler.unsubscribe === "function")
    })

})

describe('unsubscribe', () => {
    test('unsubscription', () => {
        const subject = new Subject('a');
        const handler = subject.subscribe(() => null)
        handler.unsubscribe();
        expect(Object.keys(subject.subscribers).length === 0);
    })

    test('unsubscription with id', () => {
        const subject = new Subject('a');
        const handler = subject.subscribe(() => null)
        subject.unsubscribe(handler.id)
        expect(Object.keys(subject.subscribers).length === 0);
    });

    test('once', () => {
        const subject = new Subject('a');
        const sub = jest.fn()
        subject.once(sub);
        subject.next('b');
        subject.next('c');

        expect(sub).toBeCalledTimes(1);
        expect(Object.keys(subject.subscribers).length === 0);
    })

    test('complete', () => {
        const subject = new Subject('a');
        subject.complete();
        expect(Object.keys(subject.subscribers).length === 0);
    })
})

describe('others', () => {
    test('hook', () => {
        const subject = new Subject('a');
        const next = jest.fn();
        subject.next = next;
        subject.hook('b');
        expect(next).toHaveBeenCalledWith('b');
        expect(subject.hook() === subject.value)
    });
})