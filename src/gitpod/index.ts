import { Subject } from "../index";

// init
const value = new Subject(new Date().toISOString());

// subscribe
// each subscription returns a handler with a unique id and an unsubscription method
const handler = value.subscribe((newValue) => {
  console.log("subscription 1", newValue);
});

// optionally, set debug to true to see all listeners and value updates
value.debug = (nextValue) => {
  console.log(nextValue, value.value);
};

// inspect or prepare the value before it is updated in the subject
value.before = (nextValue) => {
  console.log("--- before:", nextValue);
  return nextValue;
};

// push a new value
value.next(new Date().toISOString());

// get handlers uid
console.log(handler.id);

// unsubscribe
handler.unsubscribe();

// flush all subscriptions
value.complete();
