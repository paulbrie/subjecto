"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
//  API
var __1 = require("..");
// ---------- Example 1 ----------
// init
var value1 = new __1.Subject(new Date().toISOString());
// optionally, you can inspect all subscriptions and value changes
value1.debug = true;
// subscribe to changes
var handler1 = value1.subscribe(function (newValue) {
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
console.log('\n----- Example 2 ----- nextAssign');
// init
var value2 = new __1.Subject({ a: 1, b: 2 });
// subscribe
value2.subscribe(function (value) { return console.log("example 2:", value); });
// update using Object.assign in the background
value2.nextAssign({ a: 2 });
console.log('\n----- Example 3 ----- nextPush');
// init
var value3 = new __1.Subject(["a"]);
// subscribe
value3.subscribe(function (value) { return console.log("example 3:", value); });
// update using Array.push in the background
value3.nextPush('b');
console.log('\n');
console.log('\n----- Example 4 ----- custom debug function');
value3.debug = function (nextValue) {
    console.log('incoming value is:', nextValue);
    console.log('updated value:', this.value);
};
value3.nextPush("c");
console.log('\n----- Example 5 ----- custom next function');
var value5 = new __1.Subject({ a: 1, b: 1 });
value5.subscribe(function (newValue) { return console.log('value5', newValue); });
value5.next(function (prevValue) {
    return __assign(__assign({}, prevValue), { a: 2 });
});
