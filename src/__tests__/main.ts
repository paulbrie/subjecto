import { Subject } from '../index'

const testSubject = new Subject('', 'name')
test('instantiation', () => {
  expect(testSubject.value === '')
  expect(testSubject.name === 'name')
});

testSubject.next('new value')
test('new value is added correctly', () => {
    expect(testSubject.value === 'new value')
})

const onNewValue = (value:string) => console.log(value)
const handler = testSubject.subscribe(onNewValue)
test('handler is registered', () => {
    expect(testSubject.subscribers[0] === onNewValue)
})

test('handler format is correct', () => {
    expect(typeof handler.id === "string")
    expect(typeof handler.unsubscribe === "function")
})

test('hook is working', () => {
    expect(testSubject.hook() === testSubject.value)
})

handler.unsubscribe()
test('unsubscription is successful', () => {
   expect(Object.keys(testSubject.subscribers).length === 0)
})

const testSubjectAssign = new Subject<null | { a: number, b: number }>(null)

testSubjectAssign.nextAssign({ a: 1, b: 1})
test('nextAssign new object value', () => {
   expect(testSubjectAssign.value === { a: 1, b: 1 })
})

testSubjectAssign.nextAssign({ a: 2 })
test('nextAssign update', () => {
   expect(testSubjectAssign.value === { a: 2, b: 1 })
})

const testSubjectPush = new Subject(['a'])
testSubjectPush.nextPush('b')
test('nextPush update', () => {
   expect(testSubjectPush.value === ['a','b'])
})

const testToggle = new Subject(false)
testToggle.toggle()
test('toggle', () => {
    expect(testToggle.value === true)
})

const testOnce = new Subject(1)
testOnce.once(() => {})
test('once', () => {
    expect(Object.keys(testOnce.subscribers).length === 0)
})