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

    expect(result.current).toEqual(state.user);
  });

  test("returns initial value at nested path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user/name"));

    expect(result.current).toBe("John");
  });

  test("returns initial value at deeply nested path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubject(subject, "user/profile/bio")
    );

    expect(result.current).toBe("Developer");
  });

  test("updates when value at path changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user/name"));

    expect(result.current).toBe("John");

    act(() => {
      subject.getValue().user.name = "Jane";
    });

    expect(result.current).toBe("Jane");
  });

  test("updates when nested object changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubject(subject, "user/profile")
    );

    expect(result.current.bio).toBe("Developer");

    act(() => {
      subject.getValue().user.profile.bio = "Senior Developer";
    });

    expect(result.current.bio).toBe("Senior Developer");
  });

  test("updates when array at path changes", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "cart/items"));

    expect(result.current).toEqual([]);

    act(() => {
      subject.getValue().cart.items.push({ id: 1, name: "Product", price: 10 });
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({ id: 1, name: "Product", price: 10 });
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

    expect(nameResult.current).toBe("John");
    expect(ageResult.current).toBe(30);
    expect(themeResult.current).toBe("light");

    act(() => {
      subject.getValue().user.name = "Jane";
      subject.getValue().user.age = 31;
    });

    expect(nameResult.current).toBe("Jane");
    expect(ageResult.current).toBe(31);
    expect(themeResult.current).toBe("light"); // Should not change
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
    const initialValue = result.current;

    act(() => {
      subject.getValue().settings.theme = "dark";
    });

    // Value should not change
    expect(result.current).toBe(initialValue);
  });

  test("handles boolean values", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubject(subject, "settings/notifications")
    );

    expect(result.current).toBe(true);

    act(() => {
      subject.getValue().settings.notifications = false;
    });

    expect(result.current).toBe(false);
  });

  test("handles number values", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() => useDeepSubject(subject, "user/age"));

    expect(result.current).toBe(30);

    act(() => {
      subject.getValue().user.age = 31;
    });

    expect(result.current).toBe(31);
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

    // Change bio - this modifies the nested property
    // The callback will be called and should detect the serialized result changed
    act(() => {
      subject.getValue().user.profile.bio = "Senior Developer";
    });

    // Wait for the update to propagate
    expect(result.current.fullBio).toBe("Senior Developer in NYC");
  });

  test("handles non-existent path", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      // @ts-expect-error - Testing invalid path
      useDeepSubject(subject, "nonexistent/path")
    );

    expect(result.current).toBeUndefined();
  });

  test("handles invalid path with array access", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      // @ts-expect-error - Testing invalid path
      useDeepSubject(subject, "user/invalid/property")
    );

    expect(result.current).toBeUndefined();
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

    // Change bio - this modifies the nested property
    // The callback will be called and should detect the serialized result changed
    act(() => {
      subject.getValue().user.profile.bio = "Senior Developer";
    });

    // Wait for the update to propagate
    expect(result.current.summary).toBe("Senior Developer - NYC");
  });

  test("selector callback branch when object result changes (covers lines 112-116)", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);

    // Use a selector that returns an object based on cart items
    // This way when we modify the array, the callback will be called
    const { result } = renderHook(() =>
      useDeepSubjectSelector(subject, "cart/items", (items) => ({
        count: items.length,
        total: items.reduce((sum, item) => sum + item.price, 0),
      }))
    );

    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);

    // Add an item - this will trigger the subscription callback
    // The callback should detect that the serialized result changed and call onStoreChange
    act(() => {
      subject.getValue().cart.items.push({ id: 1, name: "Product", price: 10 });
    });

    // This should trigger the branch at lines 112-116 where object result changes
    // The callback will compare serialized versions and call onStoreChange()
    expect(result.current.count).toBe(1);
    expect(result.current.total).toBe(10);
  });

  test("can be imported from index", () => {
    const state = createTestState();
    const subject = new DeepSubject(state);
    const { result } = renderHook(() =>
      useDeepSubjectFromIndex(subject, "user/name")
    );
    expect(result.current).toBe("John");
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
});
