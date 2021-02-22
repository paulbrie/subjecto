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

handler.unsubscribe()
test('unsubscription is successful', () => {
   expect(Object.keys(testSubject.subscribers).length === 0)
})