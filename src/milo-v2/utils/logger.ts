type LogLevel = "debug" | "info" | "warn" | "error";

const IS_DEV = process.env.NODE_ENV !== "production";

class MiloLogger {
  private prefix = "🐾 [Milo V2]";

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!IS_DEV && level === "debug") return;

    const timestamp = new Date().toISOString();
    const formattedPrefix = `${this.prefix} [${level.toUpperCase()}] [${timestamp}]:`;

    switch (level) {
      case "debug":
        console.log(formattedPrefix, message, ...args);
        break;
      case "info":
        console.info(formattedPrefix, message, ...args);
        break;
      case "warn":
        console.warn(formattedPrefix, message, ...args);
        break;
      case "error":
        console.error(formattedPrefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]) {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log("error", message, ...args);
  }
}

export const logger = new MiloLogger();
export default logger;
