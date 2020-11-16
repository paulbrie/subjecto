const styles = {
  info: "color: #aaa",
  debug: "color: blue",
  error: "color: red",
};

const log = (value: string, level: "info" | "debug" | "error") => {
  console.log(
    `%c SUBJECTO %c ${value}`,
    `background-color: #000; padding: 2px 0; border-radius: 3px; font-size: 9px; color: #fff`,
    `color: ${styles[level]}`
  );
};

export default log;
