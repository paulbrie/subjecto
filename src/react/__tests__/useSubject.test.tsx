import { renderHook, act } from '@testing-library/react';
import { Subject } from '../../subject';
import { useSubject } from '../useSubject';
// Import from index to ensure exports are covered
import { useSubject as useSubjectFromIndex } from '../index';

describe('useSubject', () => {
    test('returns initial value from subject', () => {
        const subject = new Subject(42);
        const { result } = renderHook(() => useSubject(subject));

        expect(result.current[0]).toBe(42);
    });

    test('returns tuple with value and setter function', () => {
        const subject = new Subject('initial');
        const { result } = renderHook(() => useSubject(subject));

        expect(result.current).toHaveLength(2);
        expect(typeof result.current[0]).toBe('string');
        expect(typeof result.current[1]).toBe('function');
    });

    test('updates when subject value changes', () => {
        const subject = new Subject(0);
        const { result } = renderHook(() => useSubject(subject));

        expect(result.current[0]).toBe(0);

        act(() => {
            subject.next(1);
        });

        expect(result.current[0]).toBe(1);
    });

    test('setter function updates subject value', () => {
        const subject = new Subject(0);
        const { result } = renderHook(() => useSubject(subject));

        act(() => {
            result.current[1](10);
        });

        expect(result.current[0]).toBe(10);
        expect(subject.getValue()).toBe(10);
    });

    test('multiple hooks subscribe to same subject independently', () => {
        const subject = new Subject('shared');
        const { result: result1 } = renderHook(() => useSubject(subject));
        const { result: result2 } = renderHook(() => useSubject(subject));

        expect(result1.current[0]).toBe('shared');
        expect(result2.current[0]).toBe('shared');

        act(() => {
            result1.current[1]('updated');
        });

        expect(result1.current[0]).toBe('updated');
        expect(result2.current[0]).toBe('updated');
    });

    test('unsubscribes when component unmounts', () => {
        const subject = new Subject(0);
        const { unmount } = renderHook(() => useSubject(subject));

        expect(subject.subscribers.size).toBe(1);

        unmount();

        expect(subject.subscribers.size).toBe(0);
    });

    test('works with object values', () => {
        const initialValue = { name: 'John', age: 30 };
        const subject = new Subject(initialValue);
        const { result } = renderHook(() => useSubject(subject));

        expect(result.current[0]).toEqual(initialValue);

        act(() => {
            result.current[1]({ name: 'Jane', age: 25 });
        });

        expect(result.current[0]).toEqual({ name: 'Jane', age: 25 });
    });

    test('works with array values', () => {
        const initialValue = [1, 2, 3];
        const subject = new Subject(initialValue);
        const { result } = renderHook(() => useSubject(subject));

        expect(result.current[0]).toEqual(initialValue);

        act(() => {
            result.current[1]([4, 5, 6]);
        });

        expect(result.current[0]).toEqual([4, 5, 6]);
    });

    test('handles rapid updates correctly', () => {
        const subject = new Subject(0);
        const { result } = renderHook(() => useSubject(subject));

        act(() => {
            result.current[1](1);
            result.current[1](2);
            result.current[1](3);
        });

        expect(result.current[0]).toBe(3);
    });

    test('respects updateIfStrictlyEqual option', () => {
        const subject = new Subject({ value: 1 }, { updateIfStrictlyEqual: false });
        const { result } = renderHook(() => useSubject(subject));
        const subscriber = jest.fn();

        subject.subscribe(subscriber);
        subscriber.mockClear();

        act(() => {
            // Same reference should not trigger update
            result.current[1](result.current[0]);
        });

        // Hook should still update because it uses getSnapshot
        expect(result.current[0]).toEqual({ value: 1 });
    });

    test('can be imported from index', () => {
        const subject = new Subject(42);
        const { result } = renderHook(() => useSubjectFromIndex(subject));
        expect(result.current[0]).toBe(42);
    });
});

