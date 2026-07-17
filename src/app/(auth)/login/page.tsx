import Link from "next/link";
import { login } from "./actions";
import { Field, Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div>
      <h1 className="mb-1 text-base font-medium text-primary">Log in</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Track your shipments and clients.
      </p>

      {message && (
        <p className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={login} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </Field>
        <SubmitButton pendingLabel="Logging in…" className="w-full">
          Log in
        </SubmitButton>
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
