import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { inputClass } from "./Input";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(inputClass, "bg-surface", className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";
