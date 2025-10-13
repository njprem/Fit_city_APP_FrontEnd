import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { loginWithGoogle } from "../api";
import { GOOGLE_CLIENT_ID } from "../config";
import { ensureGoogleScript } from "../services/auth/googleClient";

type Props = {
  className?: string;
  label?: string;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export default function GoogleSignInButton({
  className,
  label = "Continue with Google",
  onStart,
  onSuccess,
  onError,
  disabled,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reportError = useCallback(
    (err: unknown) => {
      const text =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Google sign-in failed. Please try again.";
      console.error("[GoogleSignIn]", err);
      setMessage(text);
      onError?.(text);
    },
    [onError]
  );

  const wrapperClass = useMemo(
    () =>
      ["relative w-full flex flex-col items-center gap-2", className]
        .filter(Boolean)
        .join(" "),
    [className]
  );

  const initButton = useCallback(() => {
    const google = window.google;
    if (!google?.accounts?.id) {
      throw new Error("Google Identity Services are not available.");
    }

    const container = containerRef.current;
    if (!container) {
      throw new Error("Google sign-in container is missing.");
    }

    container.innerHTML = "";

    const handleCredential = async ({ credential }: { credential?: string }) => {
      if (!credential) {
        setLoading(false);
        reportError("No Google credentials were returned.");
        return;
      }

      try {
        setLoading(true);
        setMessage(null);
        onStart?.();
        await loginWithGoogle(credential);
        setLoading(false);
        setMessage(null);
        onSuccess?.();
      } catch (err) {
        setLoading(false);
        reportError(err);
      }
    };

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      ux_mode: "popup",
      context: "signin",
      callback: (response) => {
        void handleCredential(response);
      },
    });

    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: container.clientWidth > 0 ? container.clientWidth : undefined,
    });
  }, [onStart, onSuccess, reportError]);

  useEffect(() => {
    let active = true;

    if (disabled) {
      return () => {
        active = false;
      };
    }

    if (!GOOGLE_CLIENT_ID) {
      const text = "Google sign-in is not configured. Please contact support.";
      setMessage(text);
      onError?.(text);
      return () => {
        active = false;
      };
    }

    ensureGoogleScript()
      .then(() => {
        if (!active) {
          return;
        }

        try {
          initButton();
        } catch (err) {
          reportError(err);
        }
      })
      .catch((err) => {
        if (active) {
          reportError(err);
        }
      });

    return () => {
      active = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [disabled, initButton, onError, reportError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.style.opacity = disabled ? "0.6" : "1";
    container.style.pointerEvents = disabled || loading ? "none" : "auto";
  }, [disabled, loading]);

  return (
    <div className={wrapperClass}>
      <div
        ref={containerRef}
        className="w-full flex justify-center"
        aria-live="polite"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/80 text-sm font-medium text-slate-800">
          Connecting…
        </div>
      )}

      {message && (
        <p className="w-full text-center text-sm text-red-600">{message}</p>
      )}

      {!message && !GOOGLE_CLIENT_ID && (
        <p className="w-full text-center text-sm text-slate-500">
          {label}
        </p>
      )}
    </div>
  );
}
