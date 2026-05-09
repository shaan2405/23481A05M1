import axios from "axios";

const DEFAULT_ENDPOINT =
  "http://4.224.186.213/evaluation-service/logs";

function getEnv(key) {

  try {
    return (
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env[key]) ||
      (typeof process !== "undefined" &&
        process.env &&
        process.env[key]) ||
      undefined
    );
  } catch {
    return undefined;
  }
}

export async function Log(stack, level, pkg, message) {
  try {
    const endpoint = getEnv("VITE_LOG_ENDPOINT") || getEnv("LOG_ENDPOINT") || DEFAULT_ENDPOINT;
    const token = getEnv("VITE_LOG_TOKEN") || getEnv("LOG_TOKEN");

    const response = await axios.post(
      endpoint,
      {
        stack,
        level,
        package: pkg,
        message
      },
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
   
    return null;
  }
}
