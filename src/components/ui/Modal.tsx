"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

type Origin = { x: number; y: number };

const CENTER_ORIGIN: Origin = { x: 0, y: 0 };

// Spatial origin transition: the panel grows outward from wherever the
// trigger element was clicked, rather than just fading in place. We
// capture the trigger's viewport position on click and animate the
// panel in from that offset back to its resting (centered) position.
export function Modal({
  trigger,
  title,
  description,
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  trigger?: ReactElement;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: (close: () => void) => React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin>(CENTER_ORIGIN);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // SSR-safe portal target: document.body doesn't exist during server
  // render, so this must flip after the client mounts, not during render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const close = () => setOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      // Basic focus trap: Tab/Shift+Tab wraps within the dialog instead of
      // escaping to the page underneath it (WAI-ARIA dialog pattern).
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        // Initial focus lands on the dialog container itself (tabIndex=-1,
        // so it's not part of `focusable`) -- treat that the same as being
        // on `first` for Shift+Tab, otherwise the very first backward tab
        // escapes the trap before any forward tab has happened.
        if (e.shiftKey && (active === first || active === dialogRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Move focus into the dialog on open, and back to whatever triggered it
  // on close, rather than leaving keyboard/screen-reader users stranded.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    });
    setOpen(true);
  };

  const triggerEl =
    trigger && isValidElement(trigger)
      ? cloneElement(trigger as ReactElement<{ onClick?: React.MouseEventHandler }>, {
          onClick: handleTriggerClick,
        })
      : trigger;

  // Rendered through a portal to document.body: this component's trigger
  // often lives inside a card with a hover transform (Card's
  // hover:-translate-y-0.5), and CSS makes any transformed ancestor the
  // containing block for position:fixed descendants. Without the portal,
  // hovering that card while the modal is open silently breaks the
  // fixed-centered overlay -- it anchors to the card instead of the
  // viewport, shoving the close/submit buttons off-screen.
  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-[#0b1220]/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.4, x: origin.x, y: origin.y }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.4, x: origin.x, y: origin.y }}
            transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.8 }}
            className="glass-surface elevation-lg relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl outline-none"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 p-6 pb-5">
              <div>
                <h2 id="modal-title" className="text-lg font-medium text-primary">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-muted-foreground outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children(close)}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {triggerEl}
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
