"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var testSubject = new index_1.Subject('', 'name');
test('instantiation', function () {
    expect(testSubject.value === '');
    expect(testSubject.name === 'name');
});
testSubject.next('new value');
test('new value is added correctly', function () {
    expect(testSubject.value === 'new value');
});
var onNewValue = function (value) { return console.log(value); };
var handler = testSubject.subscribe(onNewValue);
test('handler is registered', function () {
    expect(testSubject.subscribers[0] === onNewValue);
});
test('handler format is correct', function () {
    expect(typeof handler.id === "string");
    expect(typeof handler.unsubscribe === "function");
});
test('hook is working', function () {
    expect(testSubject.hook() === testSubject.value);
});
handler.unsubscribe();
test('unsubscription is successful', function () {
    expect(Object.keys(testSubject.subscribers).length === 0);
});
var testSubjectAssign = new index_1.Subject(null);
testSubjectAssign.nextAssign({ a: 1, b: 1 });
test('nextAssign new object value', function () {
    expect(testSubjectAssign.value === { a: 1, b: 1 });
});
testSubjectAssign.nextAssign({ a: 2 });
test('nextAssign update', function () {
    expect(testSubjectAssign.value === { a: 2, b: 1 });
});
var testSubjectPush = new index_1.Subject(['a']);
testSubjectPush.nextPush('b');
test('nextPush update', function () {
    expect(testSubjectPush.value === ['a', 'b']);
});
