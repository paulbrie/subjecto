//  API
import { Subject, Inspect } from "..";

const store = {
  value1: new Subject(new Date().toISOString()),
  level2: {
    demo: new Subject(""),
    level3: {
      aha: new Subject(""),
    },
  },
};

Inspect(store);
store.value1.next("something");
store.level2.demo.next("test");
store.level2.demo.next("test1");
store.level2.level3.aha.next("test1");
