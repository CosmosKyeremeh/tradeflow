import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="mb-1 text-base font-medium text-primary">Create your account</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Sets up your organization automatically.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={signup} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm text-foreground">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
