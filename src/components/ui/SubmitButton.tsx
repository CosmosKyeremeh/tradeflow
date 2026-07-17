"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./Button";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" pending={pending} className={className} variant={variant}>
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
