import Subject from './subject'

let lastTime = new Date()
let activated = false

const inspectStore = (store: Record<string, unknown>, keys: string[] = [], path = '') => {
  if (store) {
    Object.keys(store).forEach((key) => {
      if (
        store[key] instanceof Subject &&
        (keys.includes(store[key].options.name || '') || keys.length === 0)
      ) {
        store[key].subscribe((value: ReturnType<typeof Subject.prototype.getValue>) => {
          const elapsed = new Date().getTime() - lastTime.getTime()
          const subject = store[key] as typeof Subject.prototype
          console.groupCollapsed(
            `%cstore%c ${path}.${key} (%c${elapsed / 1000}s) subs: ${subject.subscribers.size} / count: ${subject.count}`,
            "background-color:#000000aa; color: #fff; padding: 2px 4px; border-radius: 3px; margin-right: 4px;font-weight: 400;",
            "font-weight: 400;",
            "font-weight: 400;"
          )
          console.log(value)
          console.groupEnd()
          lastTime = new Date()
        })
      } else if (typeof store === "object") {
        inspectStore(store[key] as Record<string, unknown>, keys, `${path}.${key}`)
      }
    })
  }
}

export default (store: Record<string, unknown>, keys: string[] = []) => {
  if (!activated) {
    inspectStore(store, keys)
  }
  activated = true
}
