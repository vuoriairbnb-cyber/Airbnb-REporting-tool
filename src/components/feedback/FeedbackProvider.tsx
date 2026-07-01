"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackKind = "success" | "error" | "info";

type FeedbackInput = {
  title: string;
  description?: string;
};

type FeedbackToast = FeedbackInput & {
  id: string;
  kind: FeedbackKind;
};

type FeedbackContextValue = {
  success: (input: FeedbackInput) => void;
  error: (input: FeedbackInput) => void;
  info: (input: FeedbackInput) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<FeedbackToast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: FeedbackKind, input: FeedbackInput) => {
      const toast = {
        ...input,
        id: createToastId(),
        kind
      };

      setToasts((current) => [...current.slice(-2), toast]);
      window.setTimeout(() => dismiss(toast.id), kind === "error" ? 7000 : 4500);
    },
    [dismiss]
  );

  const value = useMemo<FeedbackContextValue>(
    () => ({
      success: (input) => push("success", input),
      error: (input) => push("error", input),
      info: (input) => push("info", input)
    }),
    [push]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-20 z-50 flex flex-col gap-2 md:bottom-5 md:left-auto md:right-5 md:w-96">
        {toasts.map((toast) => (
          <FeedbackToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

function FeedbackToastCard({
  toast,
  onDismiss
}: {
  toast: FeedbackToast;
  onDismiss: (id: string) => void;
}) {
  const Icon =
    toast.kind === "success"
      ? CheckCircle2
      : toast.kind === "error"
        ? AlertTriangle
        : Info;

  return (
    <div
      className={cn(
        "pointer-events-auto flex gap-3 rounded-2xl border bg-card p-4 shadow-card",
        toast.kind === "success" && "border-success/25",
        toast.kind === "error" && "border-destructive/25",
        toast.kind === "info" && "border-primary/25"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          toast.kind === "success" && "text-success",
          toast.kind === "error" && "text-destructive",
          toast.kind === "info" && "text-primary"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {toast.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider.");
  }

  return context;
}
