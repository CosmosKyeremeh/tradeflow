import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="mb-1 text-base font-medium text-primary">Log in</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Track your shipments and clients.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={login} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/signup" className="text-primary underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </div>
  );
}
