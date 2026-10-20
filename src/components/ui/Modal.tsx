import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/ui";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Etichetta serigrafata del "canale" (es. "CH-05 · Generatore") */
  channel: string;
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  /** Colore del filo luminoso superiore */
  accent?: "signal" | "tally" | "cue";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SIZES = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
};

const ACCENTS = {
  signal: "via-signal/70",
  tally: "via-tally/70",
  cue: "via-cue/70",
};

/**
 * Shell comune per tutte le modali: backdrop, chiusura con ESC / click esterno,
 * blocco dello scroll, intestazione con etichetta di canale.
 * Su mobile si apre come "bottom sheet".
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  channel,
  title,
  subtitle,
  icon,
  size = "lg",
  accent = "signal",
  children,
  footer,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}>
      <div
        className="absolute inset-0 animate-fade bg-black/75 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div
        className={cn(
          "panel relative flex max-h-[94vh] w-full animate-rise flex-col overflow-hidden rounded-b-none sm:max-h-[90vh] sm:rounded-xl",
          SIZES[size],
        )}>
        {/* Filo luminoso superiore */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            ACCENTS[accent],
          )}
        />

        {/* Intestazione */}
        <div className="flex items-start justify-between gap-4 border-b border-ink-800 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3.5">
            {icon && (
              <div className="well mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center text-ink-200">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="silk">{channel}</div>
              <h2 className="mt-1 font-display text-[22px] font-medium leading-tight tracking-tight text-ink-100 sm:text-2xl">
                {title}
              </h2>
              {subtitle && (
                <div className="mt-1 text-[13px] text-ink-400">{subtitle}</div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn -mr-1.5 -mt-1"
            aria-label="Chiudi">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-ink-800 bg-ink-900/80 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
