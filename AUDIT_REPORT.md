# Codebase Audit Report - Subjecto

**Date:** 2024  
**Version:** 0.0.58  
**Auditor:** AI Code Audit

## Executive Summary

This audit covers code quality, security, potential bugs, and best practices for the Subjecto state management library. Overall, the codebase is well-structured with good test coverage (90.9% statement coverage), but several issues were identified that should be addressed.

---

## 🔴 Critical Issues

### 1. Test Configuration Issue
**Location:** `package.json` - Jest configuration  
**Issue:** Tests are running on compiled `dist/` files, causing ESM import errors  
**Impact:** Test failures in dist files (though source tests pass)  
**Recommendation:** Update Jest configuration to exclude `dist/` directory or fix module resolution

```json
// Current jest config should exclude dist/
"testRegex": "(/src/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$",
```

---

## 🟡 Security Issues

### 1. Dependency Vulnerabilities
**Location:** `package.json`  
**Issue:** 5 vulnerabilities found in dev dependencies:
- `@babel/helpers` - Moderate severity (RegExp complexity)
- `@eslint/plugin-kit` - Low severity (ReDoS)
- `brace-expansion` - Low severity (ReDoS)
- `js-yaml` - Moderate severity (prototype pollution)

**Impact:** Low (dev dependencies only, not production)  
**Recommendation:** Run `npm audit fix` to update vulnerable packages

---

## 🟠 Code Quality Issues

### 1. Typos in Comments
**Location:** `src/subject.ts`
- Line 44: "Count the number of value upates" → should be "updates"
- Line 80: "Assing a new value" → should be "Assign"

### 2. Incorrect Map Usage
**Location:** `src/subject.ts:102`  
**Issue:** Using `Object.keys(this.subscribers).length` on a `Map` instead of `this.subscribers.size`  
**Code:**
```typescript
console.log(` └ subscribers(${Object.keys(this.subscribers).length}): `, ...)
```
**Fix:** Should use `this.subscribers.size`

### 3. Incorrect Test Assertions
**Location:** `src/__tests__/subject.test.ts`
- Line 123: Expects `typeof handler.id === "string"` but `handler.id` is a `Symbol`
- Lines 134, 141: Uses `Object.keys(subject.subscribers).length` instead of `subject.subscribers.size`

### 4. Unused Option
**Location:** `src/subject.ts:10`  
**Issue:** `maxSubscribers` option is defined in `SubjectConstructorOptions` but never implemented  
**Recommendation:** Either implement the feature or remove the option

### 5. Parameter Reassignment
**Location:** `src/deepSubject.ts:100, 138`  
**Issue:** Reassigning function parameters (`value`) is not a best practice  
**Code:**
```typescript
set: (target: T, prop: string | symbol, value: unknown) => {
    if (value && typeof value === 'object') {
        value = this.createProxy(value, prop.toString()); // ❌ Reassigning parameter
    }
```
**Recommendation:** Use a local variable instead

### 6. Trailing Comma in JSON
**Location:** `tsconfig.json:24`  
**Issue:** Trailing comma after `moduleResolution: "node"`  
**Impact:** May cause parsing issues in strict JSON parsers

### 7. Repository URL Missing Protocol
**Location:** `package.json:33`  
**Issue:** Repository URL is `"github.com/paulbrie/subjecto"` without protocol  
**Recommendation:** Should be `"https://github.com/paulbrie/subjecto"`

---

## 🔵 Potential Bugs

### 1. Proxy Cache Not Reset on `next()`
**Location:** `src/deepSubject.ts:265-299`  
**Issue:** When `next()` replaces the entire value, the `proxyCache` WeakMap retains references to old objects. While WeakMap handles this automatically, the new value's proxy setup might not be optimal.

**Current behavior:** `setupProxy()` is only called in constructor  
**Recommendation:** Consider resetting proxy cache or re-proxying when `next()` is called with a new object

### 2. Array Method Wrapping Edge Case
**Location:** `src/deepSubject.ts:125-132`  
**Issue:** Array mutating methods are wrapped, but if an array is replaced entirely via `next()`, the new array won't have wrapped methods until accessed through the proxy.

**Impact:** Low - mutations through proxy work correctly, but direct array replacement might not trigger notifications for array methods

### 3. Circular Reference Handling
**Location:** `src/deepSubject.ts:112-149`  
**Status:** ✅ Handled correctly via WeakMap cache  
**Note:** The proxy cache correctly prevents infinite loops with circular references

---

## 🟢 Best Practices & Improvements

### 1. Error Handling
**Status:** ✅ Good - Subscriber errors are caught and logged without breaking other subscribers

### 2. Type Safety
**Status:** ✅ Excellent - No use of `any`, fully typed API

### 3. Test Coverage
**Status:** ✅ Good - 90.9% statement coverage, 85.85% branch coverage

### 4. Documentation
**Status:** ✅ Good - JSDoc comments present, README with examples

### 5. Code Organization
**Status:** ✅ Good - Clean separation of concerns, well-structured classes

---

## 📋 Recommendations Priority

### High Priority
1. ✅ Fix test configuration to exclude dist files
2. ✅ Fix Map usage (`Object.keys` → `.size`)
3. ✅ Fix test assertions (Symbol vs string)
4. ✅ Fix typos in comments
5. ✅ Run `npm audit fix` for security updates

### Medium Priority
1. ⚠️ Remove or implement `maxSubscribers` option
2. ⚠️ Fix parameter reassignment in DeepSubject
3. ⚠️ Fix repository URL in package.json
4. ⚠️ Remove trailing comma in tsconfig.json

### Low Priority
1. 💡 Consider resetting proxy cache on `next()` for DeepSubject
2. 💡 Add more edge case tests for array replacement scenarios

---

## 📊 Code Metrics

- **Total Lines:** ~600 (source + tests)
- **Test Coverage:** 90.9% statements, 85.85% branches
- **Dependencies:** 0 production dependencies ✅
- **TypeScript:** Strict mode enabled ✅
- **Linting:** ESLint configured, no errors ✅

---

## ✅ Positive Aspects

1. **Zero Production Dependencies** - Excellent for a library
2. **Strong Type Safety** - No `any` types used
3. **Good Test Coverage** - Comprehensive test suite
4. **Clean API Design** - Intuitive and well-documented
5. **Error Resilience** - Subscriber errors don't break the system
6. **Modern JavaScript** - Uses Map, WeakMap, Proxy, Symbols appropriately

---

## Summary

The codebase is in good shape overall. The main issues are:
- Minor code quality fixes (typos, incorrect Map usage)
- Test configuration issues
- Security updates needed for dev dependencies
- A few potential edge cases in DeepSubject proxy handling

Most issues are straightforward fixes that can be addressed quickly. The code demonstrates good practices and maintains high quality standards.

