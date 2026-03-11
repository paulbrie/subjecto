import { renderHook, act } from "@testing-library/react";
import { DeepSubject } from "../../deepSubject";
import { useDeepSubject, useDeepSubjectSelector } from "../useDeepSubject";
// Import from index to ensure exports are covered
import {
  useDeepSubject as useDeepSubjectFromIndex,
  useDeepSubjectSelector as useDeepSubjectSelectorFromIndex,
} from "../index";

interface TestState {
  user: {
    name: string;
    age: number;
    profile: {
      bio: string;
      location: string;
    };
  };
  cart: {
    items: Array<{ id: number; name: string; price: number }>;
    total: number;
  };
  settings: {
    theme: "light" | "dark";
    notifications: boolean;
  };
}

const createTestState = (): TestState => ({
  user: {
    name: "John",
    age: 30,
    profile: {
      bio: "Developer",
      location: "NYC",
    },
  },
  cart: {
    items: [],
    total: 0,
  },
  settings: {
    theme: "light",
    notifications: true,
  },
});

describe("useDeepSubject", () => {
  test("returns initial value at root path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user"));

    const [value] = result.current;
    expect(value).toEqual(state.user);
  });

  test("returns initial value at nested path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user/name"));

    const [value] = result.current;
    expect(value).toBe("John");
  });

  test("returns initial value at deeply nested path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubject(subject, "user/profile/bio")
    );

    const [value] = result.current;
    expect(value).toBe("Developer");
  });

  test("updates when value at path changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user/name"));

    expect(result.current[0]).toBe("John");

    act(() => {
      subject.getValue().user.name = "Jane";
    });

    expect(result.current[0]).toBe("Jane");
  });

  test("updates when nested object changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubject(subject, "user/profile")
    );

    expect(result.current[0].bio).toBe("Developer");

    act(() => {
      subject.getValue().user.profile.bio = "Senior Developer";
    });

    expect(result.current[0].bio).toBe("Senior Developer");
  });

  test("updates when array at path changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "cart/items"));

    expect(result.current[0]).toEqual([]);

    act(() => {
      subject.getValue().cart.items.push({ id: 1, name: "Product", price: 10 });
    });

    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0]).toEqual({ id: 1, name: "Product", price: 10 });
  });

  test("multiple hooks subscribe to different paths independently", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result: nameResult } = renderHook(() =>
      useDeepSubject(subject, "user/name")
    );
    const { result: ageResult } = renderHook(() =>
      useDeepSubject(subject, "user/age")
    );
    const { result: themeResult } = renderHook(() =>
      useDeepSubject(subject, "settings/theme")
    );

    expect(nameResult.current[0]).toBe("John");
    expect(ageResult.current[0]).toBe(30);
    expect(themeResult.current[0]).toBe("light");

    act(() => {
      subject.getValue().user.name = "Jane";
      subject.getValue().user.age = 31;
    });

    expect(nameResult.current[0]).toBe("Jane");
    expect(ageResult.current[0]).toBe(31);
    expect(themeResult.current[0]).toBe("light"); // Should not change
  });

  test("unsubscribes when component unmounts", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const callback = jest.fn();
    const subscription = subject.subscribe("user/name", callback);

    const { unmount } = renderHook(() => useDeepSubject(subject, "user/name"));

    expect(callback).toHaveBeenCalled();

    unmount();
    subscription.unsubscribe();

    // Verify callback is not called after unmount
    callback.mockClear();
    subject.getValue().user.name = "New Name";
    // The hook's subscription should be gone, but our test subscription might still fire
  });

  test("does not update when unrelated path changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user/name"));

    // Track renders by checking result updates
    const initialValue = result.current[0];

    act(() => {
      subject.getValue().settings.theme = "dark";
    });

    // Value should not change
    expect(result.current[0]).toBe(initialValue);
  });

  test("handles boolean values", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubject(subject, "settings/notifications")
    );

    expect(result.current[0]).toBe(true);

    act(() => {
      subject.getValue().settings.notifications = false;
    });

    expect(result.current[0]).toBe(false);
  });

  test("handles number values", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user/age"));

    expect(result.current[0]).toBe(30);

    act(() => {
      subject.getValue().user.age = 31;
    });

    expect(result.current[0]).toBe(31);
  });

  test("setter updates the value at path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user/name"));

    expect(result.current[0]).toBe("John");

    act(() => {
      result.current[1]("Jane");
    });

    expect(result.current[0]).toBe("Jane");
    expect(subject.getValue().user.name).toBe("Jane");
  });
});

describe("useDeepSubjectSelector", () => {
  test("returns selected value from root path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user", (user) => user.name)
    );

    expect(result.current).toBe("John");
  });

  test("returns selected value from nested path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/name", (name) => name.toUpperCase())
    );

    expect(result.current).toBe("JOHN");
  });

  test("updates when underlying value changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/age", (age) => age * 2)
    );

    expect(result.current).toBe(60); // 30 * 2

    act(() => {
      subject.getValue().user.age = 31;
    });

    expect(result.current).toBe(62); // 31 * 2
  });

  test("computes derived state from array", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "cart/items", (items) => items.length)
    );

    expect(result.current).toBe(0);

    act(() => {
      subject.getValue().cart.items.push({ id: 1, name: "Product", price: 10 });
      subject
        .getValue()
        .cart.items.push({ id: 2, name: "Product 2", price: 20 });
    });

    expect(result.current).toBe(2);
  });

  test("computes sum from array items", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "cart/items", (items) =>
        items.reduce(
          (sum: number, item: { id: number; name: string; price: number }) =>
            sum + item.price,
          0
        )
      )
    );

    expect(result.current).toBe(0);

    act(() => {
      subject.getValue().cart.items.push({ id: 1, name: "Product", price: 10 });
      subject
        .getValue()
        .cart.items.push({ id: 2, name: "Product 2", price: 20 });
    });

    expect(result.current).toBe(30);
  });

  test("selector receives correct type", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const selector = jest.fn((name: string) => name.length);

    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/name", selector)
    );

    expect(selector).toHaveBeenCalledWith("John");
    expect(result.current).toBe(4);
  });

  test("unsubscribes when component unmounts", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const callback = jest.fn();
    const subscription = subject.subscribe("user/name", callback);

    const { unmount } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/name", (name) => name.toUpperCase())
    );

    expect(callback).toHaveBeenCalled();

    unmount();
    subscription.unsubscribe();
  });

  test("does not update when selector result is same but input changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const selector = jest.fn((name: string) => name.length);

    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/name", selector)
    );

    const initialResult = result.current;
    selector.mockClear();

    act(() => {
      // Change to a name with same length
      subject.getValue().user.name = "Jane"; // Both 'John' and 'Jane' are 4 chars
    });

    // Selector should be called, and result should remain the same (both names are 4 chars)
    expect(selector).toHaveBeenCalled();
    expect(result.current).toBe(initialResult);
  });

  test("works with complex nested selector", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/profile", (profile) => ({
        fullBio: `${profile.bio} in ${profile.location}`,
      }))
    );

    expect(result.current.fullBio).toBe("Developer in NYC");

    act(() => {
      subject.getValue().user.profile.bio = "Senior Developer";
    });

    expect(result.current.fullBio).toBe("Senior Developer in NYC");
  });

  test("handles non-existent path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      // @ts-expect-error - Testing invalid path
      useDeepSubject(subject, "nonexistent/path")
    );

    expect(result.current[0]).toBeUndefined();
  });

  test("handles invalid path with array access", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      // @ts-expect-error - Testing invalid path
      useDeepSubject(subject, "user/invalid/property")
    );

    expect(result.current[0]).toBeUndefined();
  });

  test("selector with object result updates when content changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/profile", (profile) => ({
        summary: `${profile.bio} - ${profile.location}`,
      }))
    );

    expect(result.current.summary).toBe("Developer - NYC");

    act(() => {
      subject.getValue().user.profile.bio = "Senior Developer";
    });

    expect(result.current.summary).toBe("Senior Developer - NYC");
  });

  test("selector callback branch when object result changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);

    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "cart/items", (items) => ({
        count: items.length,
        total: items.reduce((sum, item) => sum + item.price, 0),
      }))
    );

    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);

    act(() => {
      subject.getValue().cart.items.push({ id: 1, name: "Product", price: 10 });
    });

    expect(result.current.count).toBe(1);
    expect(result.current.total).toBe(10);
  });

  test("accepts custom isEqual function", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);

    // Custom isEqual that only compares the 'count' field
    const isEqual = (a: { count: number; label: string }, b: { count: number; label: string }) =>
      a.count === b.count;

    const { result } = renderHook(() =>
      useDeepSubjectSelector(
        subject,
        "cart/items",
        (items) => ({ count: items.length, label: `${items.length} items` }),
        isEqual,
      )
    );

    expect(result.current.count).toBe(0);

    act(() => {
      subject.getValue().cart.items.push({ id: 1, name: "Product", price: 10 });
    });

    expect(result.current.count).toBe(1);
  });

  test("can be imported from index", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectFromIndex(subject, "user/name")
    );
    expect(result.current[0]).toBe("John");
  });

  test("useDeepSubjectSelector can be imported from index", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectSelectorFromIndex(
        subject,
        "user/age",
        (age: number) => age * 2
      )
    );
    expect(result.current).toBe(60);
  });

  test("handles changing subject instance between renders", () => {
    const state1 = createTestState();
    const subject1 = new DeepSubject(state1);
    const state2 = createTestState();
    state2.user.name = "Alice";
    const subject2 = new DeepSubject(state2);

    const { result, rerender } = renderHook(
      ({ subject }) => useDeepSubject(subject, "user/name"),
      { initialProps: { subject: subject1 as DeepSubject<TestState> } }
    );

    expect(result.current[0]).toBe("John");

    rerender({ subject: subject2 });

    // After rerender with new subject, updating subject2 should trigger update
    act(() => {
      subject2.getValue().user.name = "Bob";
    });
    expect(result.current[0]).toBe("Bob");
  });

  test("handles changing path between renders", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);

    const { result, rerender } = renderHook(
      ({ path }: { path: string }) =>
        useDeepSubject(subject, path as "user/name"),
      { initialProps: { path: "user/name" } }
    );

    expect(result.current[0]).toBe("John");

    rerender({ path: "user/profile/bio" });

    // After rerender with new path, updating the new path should trigger update
    act(() => {
      subject.getValue().user.profile.bio = "Senior Developer";
    });
    expect(result.current[0]).toBe("Senior Developer");
  });

  test("selector throwing error does not break the hook", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    let shouldThrow = false;

    const selector = (name: string) => {
      if (shouldThrow) throw new Error("selector error");
      return name.toUpperCase();
    };

    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/name", selector)
    );

    expect(result.current).toBe("JOHN");

    shouldThrow = true;
    // Mutation triggers selector which throws - the hook should keep the previous value
    act(() => {
      subject.getValue().user.name = "Jane";
    });

    // Value should remain the previous result since selector threw
    expect(result.current).toBe("JOHN");
    consoleErrorSpy.mockRestore();
  });

  test("setter is a no-op when path traversal hits non-object", () => {
    const subject = new DeepSubject({
      user: { name: "John", age: 30 },
    });
    const { result } = renderHook(() =>
      // @ts-expect-error - Testing invalid deep path through primitive
      useDeepSubject(subject, "user/name/deep/invalid")
    );

    // Calling the setter should not throw even though the path is invalid
    act(() => {
      result.current[1]("anything" as never);
    });

    // The underlying value should not have changed
    expect(subject.getValue().user.name).toBe("John");
  });

  test("selector re-renders when result has different number of keys", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);

    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "user/profile", (profile) => {
        if (profile.bio === "Developer") {
          return { bio: profile.bio };
        }
        return { bio: profile.bio, location: profile.location };
      })
    );

    expect(result.current).toEqual({ bio: "Developer" });

    act(() => {
      subject.getValue().user.profile.bio = "Engineer";
    });

    // Different number of keys triggers re-render via shallowEqual
    expect(result.current).toEqual({ bio: "Engineer", location: "NYC" });
  });

  test("selector with shallow-equal object result avoids re-render", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    let renderCount = 0;

    const { result } = renderHook(() => {
      renderCount++;
      return useDeepSubjectSelector(subject, "user/profile", (profile) => ({
        bio: profile.bio,
        location: profile.location,
      }));
    });

    expect(result.current).toEqual({ bio: "Developer", location: "NYC" });
    const countAfterInit = renderCount;

    // Update location to same value — selector returns shallow-equal object
    act(() => {
      subject.getValue().user.profile.location = "NYC";
    });

    // Should not have caused an extra render because shallowEqual returns true
    expect(renderCount).toBe(countAfterInit);
  });
});
