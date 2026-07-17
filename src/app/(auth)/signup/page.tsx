import Link from "next/link";
import { signup } from "./actions";
import { Field, Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={signup} className="space-y-4">
        <Field label="Full name" htmlFor="fullName">
          <Input id="fullName" name="fullName" type="text" required autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <SubmitButton pendingLabel="Creating account…" className="w-full">
          Create account
        </SubmitButton>
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
