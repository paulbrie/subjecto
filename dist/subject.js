"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
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
        this.before = function (nextValue) { return nextValue; };
    }
    return Subject;
}());
Subject.prototype.next = function (nextValue) {
    var _this = this;
    this.value = this.before(typeof nextValue === 'function' ? nextValue(this.value) : nextValue);
    Object.keys(this.subscribers).forEach(function (key) {
        if (_this.subscribers[key]) {
            _this.subscribers[key](_this.value);
        }
    });
    if (this.debug) {
        if (typeof this.debug === "function") {
            this.debug(nextValue);
        }
        else {
            console.log("\n--- SUBJECTO DEBUG: `" + this.name + "` ---");
            console.log(" \u251C nextValue:", nextValue);
            console.log(" \u2514 subscribers(" + Object.keys(this.subscribers).length + "): ", this, '\n');
        }
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
Subject.prototype.nextPush = function (value) {
    if (Array.isArray(this.value)) {
        this.next(__spreadArrays(this.value, [value]));
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
                log_1.default("Subject `" + _this.name + "` has `" + Object.keys(_this.subscribers).length + "` subscribers left.", "debug");
            }
        },
        id: id,
    };
};
/**
 * Unsubscribes the listener from the subject
 * @param id
 */
Subject.prototype.unsubscribe = function (id) {
    delete this.subscribers[id];
};
/**
 * Unsubscribes all current listeners
 */
Subject.prototype.complete = function () {
    var _this = this;
    Object.keys(this.subscribers).forEach(function (key) { return _this.unsubscribe(key); });
};
Subject.prototype.once = function (subscription) {
    var handler = this.subscribe(function (value) {
        subscription(value);
        handler.unsubscribe();
    });
};
/**
 * The hook function is a placeholder/template function "slot" meant to be overriden.
 * For example, it could be used to attach a React hook to this subject.
 */
Subject.prototype.hook = function (defaultValue) {
    if (defaultValue) {
        this.next(defaultValue);
    }
    return this.value;
};
exports.default = Subject;