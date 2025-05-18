import { Subject } from '../../src/'

const subject = new Subject('a');

// add a subscriber
const sub1 = subject.subscribe((value) => {
    console.log('sub1:', value)
})

// add a second subscriber
subject.subscribe((value) => {
    console.log('sub2:', value)
})

// add a one-time subscriber
subject.once((value) => {
    console.log('sub3 (once):', value)
})

// push a new value to the subject
console.log('\n --- Pushing a new value to the subject: "b" --- \n')
subject.next('b')
// console
// -> sub1: b
// -> sub2: b
// -> sub3 (once): b

// push a new value to the subject
console.log('\n --- Pushing a new value to the subject: "c" --- \n')
subject.next('c')
// console
// -> sub1: c
// -> sub2: c

// remove the first subscriber
sub1.unsubscribe()

// push a new value to the subject
console.log('\n --- Pushing a new value to the subject: "d" --- \n')
subject.next('d')
// console
// -> sub2: d

// remover all subscribers
subject.complete()

// push a new value to the subject
console.log('\n --- Pushing a new value to the subject: "e" --- \n')
subject.next('e')

// console
// -> (no output, all subscribers have been removed)

// check if the subject has subscribers
console.log('remaining subscribers:', subject.subscribers.size)
// console.log
// -> 0
