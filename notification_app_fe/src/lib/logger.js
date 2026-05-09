import { Log as remoteLog } from "../../../logging-middleware/logger";

const isDev =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.DEV;

export async function logEvent({ stack, level, pkg, message }) {
  const payload = {
    stack: stack || "frontend",
    level: level || "info",
    pkg: pkg || "app",
    message: String(message || "")
  };

  try {
    await remoteLog(payload.stack, payload.level, payload.pkg, payload.message);
  } catch {
    // `remoteLog` already swallows errors; keep double-safety.
  }

  if (isDev) {
    const fn =
      payload.level === "error"
        ? console.error
        : payload.level === "warn"
          ? console.warn
          : console.log;
    fn(`[${payload.stack}] ${payload.pkg}: ${payload.message}`);
  }
}

