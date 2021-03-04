//  API
import { Subject, inspect } from "..";

// ---------- Example 1 ----------
// init
const value1 = new Subject(new Date().toISOString());

const store = {
    value1
}

// optionally, you can inspect all subscriptions and value changes
value1.debug = true;

// subscribe to changes
const handler1 = value1.subscribe((newValue: string) => {
  console.log("example 1:", newValue);
});

// get handlers uid
console.log(handler1.id);

// push a new value
value1.next(new Date().toISOString());

// unsubscribe
handler1.unsubscribe();

// flush all subscriptions
value1.complete();

console.log('\n----- Example 2 ----- nextAssign')
// init
const value2 = new Subject({ a: 1, b: 2 });

// subscribe
value2.subscribe((value) => console.log("example 2:", value));

// update using Object.assign in the background
value2.nextAssign({ a: 2 });

console.log('\n----- Example 3 ----- nextPush')
// init
const value3 = new Subject(["a"]);

// subscribe
value3.subscribe((value) => console.log("example 3:", value));

// update using Array.push in the background
value3.nextPush('b');
console.log('\n')

console.log('\n----- Example 4 ----- custom debug function')
value3.debug = function(nextValue) {
    console.log('incoming value is:', nextValue)
    console.log('updated value:', this.value)
}

value3.nextPush("c")

console.log('\n----- Example 5 ----- custom next function')
const value5 = new Subject({ a: 1, b: 1 })
value5.subscribe(newValue => console.log('value5', newValue))

value5.next((prevValue) => {
    return { ...prevValue, a: 2 }
})