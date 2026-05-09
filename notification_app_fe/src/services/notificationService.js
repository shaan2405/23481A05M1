import axios from "axios";

const apiBase =
  import.meta?.env?.VITE_API_BASE_URL ||
  "http://4.224.186.213/evaluation-service";
const configuredApiToken =
  import.meta?.env?.VITE_API_TOKEN ||
  import.meta?.env?.VITE_LOG_TOKEN ||
  "";
const authPayload = {
  email: import.meta?.env?.VITE_AUTH_EMAIL || "",
  name: import.meta?.env?.VITE_AUTH_NAME || "",
  rollNo: import.meta?.env?.VITE_AUTH_ROLL_NO || "",
  accessCode: import.meta?.env?.VITE_AUTH_ACCESS_CODE || "",
  clientID: import.meta?.env?.VITE_AUTH_CLIENT_ID || "",
  clientSecret: import.meta?.env?.VITE_AUTH_CLIENT_SECRET || ""
};
const hasAuthPayload = Object.values(authPayload).every(Boolean);
const TOKEN_REFRESH_SAFETY_MS = 30 * 1000;
let cachedAuthToken = "";
let cachedAuthTokenExpiresAt = 0;

const client = axios.create({
  baseURL: apiBase,
  timeout: 10_000
});

function normalizeBearerToken(token) {
  const value = String(token || "").trim();
  return value.toLowerCase().startsWith("bearer ")
    ? value.slice(7).trim()
    : value;
}

function parseExpiresIn(expiresIn) {
  const raw = Number(expiresIn);
  if (!Number.isFinite(raw) || raw <= 0) {
    return Date.now() + 10 * 60 * 1000;
  }

  // Some APIs return epoch seconds and some return ttl seconds.
  if (raw > 2_000_000_000) {
    return raw * 1000;
  }

  return Date.now() + raw * 1000;
}

async function getFreshTokenFromAuthApi() {
  if (!hasAuthPayload) return "";

  const response = await axios.post(`${apiBase}/auth`, authPayload, {
    timeout: 10_000
  });
  const nextToken = normalizeBearerToken(response?.data?.access_token);
  if (!nextToken) return "";

  cachedAuthToken = nextToken;
  cachedAuthTokenExpiresAt = parseExpiresIn(response?.data?.expires_in);
  return nextToken;
}

async function resolveAccessToken({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const isCachedTokenValid =
      cachedAuthToken &&
      Date.now() + TOKEN_REFRESH_SAFETY_MS < cachedAuthTokenExpiresAt;
    if (isCachedTokenValid) return cachedAuthToken;

    // Prefer dynamic auth flow when credentials are available.
    if (hasAuthPayload) {
      const freshToken = await getFreshTokenFromAuthApi();
      if (freshToken) return freshToken;
    }

    const staticToken = normalizeBearerToken(configuredApiToken);
    if (staticToken) return staticToken;
  }

  if (hasAuthPayload) {
    return getFreshTokenFromAuthApi();
  }

  return normalizeBearerToken(configuredApiToken);
}

function createValidationError(message, details = {}) {
  const err = new Error(message);
  err.name = "NotificationApiValidationError";
  err.details = details;
  return err;
}

export const fetchNotifications = async ({
  page = 1,
  limit = 10,
  notificationType = "All"
} = {}) => {
  const params = {
    page,
    limit
  };

  if (
    notificationType &&
    String(notificationType).toLowerCase() !== "all"
  ) {
    params.notification_type = notificationType;
  }

  let token = await resolveAccessToken();
  let response;

  try {
    response = await client.get("/notifications", {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  } catch (error) {
    const status = error?.response?.status;
    const shouldRetryWithFreshToken =
      status === 401 && hasAuthPayload;

    if (!shouldRetryWithFreshToken) {
      throw error;
    }

    token = await resolveAccessToken({ forceRefresh: true });
    response = await client.get("/notifications", {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  // Stage requirement explicitly mentions Status Code 200.
  if (response?.status !== 200) {
    throw createValidationError(
      `Expected status 200, received ${response?.status ?? "unknown"}`,
      { status: response?.status }
    );
  }

  const list = response?.data?.notifications;
  if (!Array.isArray(list)) {
    throw createValidationError(
      "Invalid response shape: expected `notifications` array",
      { body: response?.data }
    );
  }

  return {
    status: response.status,
    notifications: list
  };
};