const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let loadPromise: Promise<void> | null = null;

export const ensureGoogleScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is not available during server-side rendering"));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity Services script")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script"));
    document.head.appendChild(script);
  });

  return loadPromise;
};
