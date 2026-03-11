import { Subject } from '../subject'
import { nextAssign, nextPush, toggle, once, complete } from '../helpers'

describe('nextAssign', () => {
  test('merges partial value into subject', () => {
    const subject = new Subject({ a: 1, b: 2, c: 3 })
    nextAssign(subject, { b: 20 })
    expect(subject.getValue()).toEqual({ a: 1, b: 20, c: 3 })
  })

  test('throws when subject value is not an object', () => {
    const subject = new Subject(42) as unknown as Subject<object>
    expect(() => nextAssign(subject, {})).toThrow('Subject value must be an object')
  })

  test('notifies subscribers', () => {
    const subject = new Subject({ x: 1 })
    const values: { x: number }[] = []
    subject.subscribe((v) => values.push(v))
    nextAssign(subject, { x: 5 })
    expect(values).toEqual([{ x: 1 }, { x: 5 }])
  })
})

describe('nextPush', () => {
  test('pushes value to array subject', () => {
    const subject = new Subject([1, 2, 3])
    nextPush(subject, 4)
    expect(subject.getValue()).toEqual([1, 2, 3, 4])
  })

  test('throws when subject value is not an array', () => {
    const subject = new Subject('not-array') as unknown as Subject<unknown[]>
    expect(() => nextPush(subject, 1)).toThrow('Subject value must be an array')
  })

  test('notifies subscribers', () => {
    const subject = new Subject<number[]>([])
    const values: number[][] = []
    subject.subscribe((v) => values.push(v))
    nextPush(subject, 42)
    expect(values).toEqual([[], [42]])
  })
})

describe('toggle', () => {
  test('flips boolean from false to true', () => {
    const subject = new Subject(false)
    toggle(subject)
    expect(subject.getValue()).toBe(true)
  })

  test('flips boolean from true to false', () => {
    const subject = new Subject(true)
    toggle(subject)
    expect(subject.getValue()).toBe(false)
  })

  test('throws when subject value is not a boolean', () => {
    const subject = new Subject('hello') as unknown as Subject<boolean>
    expect(() => toggle(subject)).toThrow('Subject value must be a boolean')
  })

  test('notifies subscribers', () => {
    const subject = new Subject(false)
    const values: boolean[] = []
    subject.subscribe((v) => values.push(v))
    toggle(subject)
    expect(values).toEqual([false, true])
  })
})

describe('once', () => {
  test('calls callback with current value immediately', () => {
    const subject = new Subject(42)
    const callback = jest.fn()
    once(subject, callback)
    expect(callback).toHaveBeenCalledWith(42)
  })

  test('unsubscribes after first call', () => {
    const subject = new Subject(0)
    const callback = jest.fn()
    once(subject, callback)
    // Called once with initial value
    expect(callback).toHaveBeenCalledTimes(1)

    subject.next(1)
    // Should not be called again
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('complete', () => {
  test('removes all subscribers', () => {
    const subject = new Subject(0)
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    subject.subscribe(callback1)
    subject.subscribe(callback2)
    expect(subject.subscribers.size).toBe(2)

    complete(subject)
    expect(subject.subscribers.size).toBe(0)
  })

  test('subscribers no longer notified after complete', () => {
    const subject = new Subject(0)
    const callback = jest.fn()
    subject.subscribe(callback)
    callback.mockClear()

    complete(subject)
    subject.next(1)
    expect(callback).not.toHaveBeenCalled()
  })
})
