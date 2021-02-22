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
handler.unsubscribe();
test('unsubscription is successful', function () {
    expect(Object.keys(testSubject.subscribers).length === 0);
});
