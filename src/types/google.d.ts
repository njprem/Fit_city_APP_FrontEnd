export {};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            ux_mode?: "popup" | "redirect";
            context?: "signin" | "signup" | "use";
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: GooglePromptMomentNotification) => void) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }

  interface GooglePromptMomentNotification {
    isDismissedMoment: () => boolean;
    isSkippedMoment: () => boolean;
    isNotDisplayed: () => boolean;
    getDismissedReason?: () => string | null;
    getSkippedReason?: () => string | null;
    getNotDisplayedReason?: () => string | null;
  }
}
