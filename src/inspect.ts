import Subject from './subject'

let lastTime = new Date();
let activated = false;

const inspectStore = (store: any, keys: string[] = []) => {
  if (store) {
    Object.keys(store).forEach((key) => {
      if (
        store[key] instanceof Subject &&
        (keys.includes(store[key].name) || keys.length === 0)
      ) {
        
        store[key].subscribe((value: typeof Subject.prototype['value']) => {
          const elapsed = new Date().getTime() - lastTime.getTime();
          console.groupCollapsed(
            `%cstore%c ${store[key].name} (%c${elapsed / 1000}s)`,
            "background-color:#000000aa; color: #fff; padding: 2px 4px; border-radius: 3px; margin-right: 4px;font-weight: 400;",
            "font-weight: 400;",
            "font-weight: 400;"
          );
          console.log(value);
          console.groupEnd();
          lastTime = new Date();
        });
      }
      if (typeof store === "object") {
        inspectStore(store[key], keys);
      }
    });
  }
};

export default (store: any, keys:string[] = []) => {
    if (!activated) {
        inspectStore(store, keys)
    }
}
