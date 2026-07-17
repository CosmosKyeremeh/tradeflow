import { AuthCard } from "./AuthCard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-muted px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-lg font-medium text-primary">TradeFlow</span>
        </div>
        <AuthCard>{children}</AuthCard>
      </div>
    </div>
  );
}
