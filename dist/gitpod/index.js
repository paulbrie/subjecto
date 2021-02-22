"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
// init
var value = new index_1.Subject(new Date().toISOString());
// subscribe
// each subscription returns a handler with a unique id and an unsubscription method
var handler = value.subscribe(function (newValue) {
    console.log("subscription 1", newValue);
});
// optionally, set debug to true to see all listeners and value updates
value.debug = function (nextValue) {
    console.log(nextValue, value.value);
};
// inspect or prepare the value before it is updated in the subject
value.before = function (nextValue) {
    console.log('--- before:', nextValue);
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
