// src/config.ts

const apiUrl = import.meta.env.VITE_API_URL;

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