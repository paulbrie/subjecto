"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var log_1 = __importDefault(require("./utils/log"));
var Subject = /** @class */ (function () {
    function Subject(initialValue, name) {
        this.value = initialValue;
        this.subscribers = {};
        this.name = name || "noName";
        this.debug = false;
    }
    return Subject;
}());
Subject.prototype.next = function (nextValue) {
    var _this = this;
    this.value = nextValue;
    Object.keys(this.subscribers).forEach(function (key) {
        if (_this.subscribers[key]) {
            _this.subscribers[key](_this.value);
        }
    });
    if (this.debug) {
        console.log(" \u251C nextValue:", nextValue);
        console.log(" \u251C subscribers(" + Object.keys(this.subscribers).length + "): ", this);
        console.log(" └ Stack:");
    }
};
Subject.prototype.nextAssign = function (newValue) {
    try {
        this.next(Object.assign(this.value, newValue));
    }
    catch (error) {
        this.next(newValue);
    }
};
Subject.prototype.subscribe = function (subscription) {
    var _this = this;
    var subscriptionExistsAtIndex = Object.values(this.subscribers).indexOf(subscription);
    var id = "";
    if (subscriptionExistsAtIndex === -1) {
        id = new Date().getTime() + "." + Object.keys(this.subscribers).length;
        this.subscribers[id] = subscription;
        if (this.debug) {
            log_1.default(this.name + " / new subscription - (" + Object.keys(this.subscribers).length + ")", "debug");
            console.log(" └", this.subscribers);
        }
    }
    else {
        id = Object.values(Object.keys(this.subscribers))[subscriptionExistsAtIndex];
    }
    return {
        unsubscribe: function () {
            _this.unsubscribe(id);
            if (_this.debug) {
                log_1.default(_this.name + " has  " + Object.keys(_this.subscribers).length + "  subscribers left", "debug");
            }
        },
        id: id,
    };
};
Subject.prototype.unsubscribe = function (id) {
    delete this.subscribers[id];
};
Subject.prototype.complete = function () {
    var _this = this;
    Object.keys(this.subscribers).forEach(function (key) { return _this.unsubscribe(key); });
};
exports.default = Subject;
