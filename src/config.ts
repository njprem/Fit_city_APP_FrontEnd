// src/config.ts

const rawApiUrl = import.meta.env.VITE_API_URL;
const apiUrl = rawApiUrl?.replace(/\/+$/, "");
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!apiUrl) {
  console.warn(
    "%c⚠️ Warning: Environment variable VITE_API_URL is not set.",
    "color: orange; font-weight: bold"
  );
  console.warn(
    "Using fallback: http://localhost:8080. Please set VITE_API_URL in your .env file or deployment environment."
  );
}

export const API_BASE_URL = apiUrl ?? "http://localhost:8080";

if (!googleClientId) {
  console.warn(
    "%c⚠️ Warning: Environment variable VITE_GOOGLE_CLIENT_ID is not set.",
    "color: orange; font-weight: bold"
  );
  console.warn(
    "Google sign-in will be disabled until VITE_GOOGLE_CLIENT_ID is configured."
  );
}

export const GOOGLE_CLIENT_ID = googleClientId ?? "";
