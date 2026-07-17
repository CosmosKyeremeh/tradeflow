"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
} from "react";
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

  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const close = () => setOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <>
      {triggerEl}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, scale: 0.4, x: origin.x, y: origin.y }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.4, x: origin.x, y: origin.y }}
              transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.8 }}
              className="glass-surface elevation-lg relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
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
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {children(close)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
