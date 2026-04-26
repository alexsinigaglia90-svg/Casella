"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "glass-card border border-border",
          title: "text-fg-primary text-sm",
          description: "text-fg-secondary",
        },
      }}
      closeButton
      richColors
    />
  );
}
