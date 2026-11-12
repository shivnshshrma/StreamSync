import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field, btnPrimary } from "@/components/ss/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — StreamSync" },
      { name: "description", content: "Reset your StreamSync password." },
      { property: "og:title", content: "Reset password — StreamSync" },
      {
        property: "og:description",
        content: "Reset your StreamSync password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});
function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  return (
    <AuthShell
      title="Reset your password"
      sub={
        <Link to="/login" className="text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-md border border-border bg-card p-4 text-sm">
          If an account exists for <b>{email}</b>, a reset link is on its way.
        </p>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email))
              return setErr("Enter a valid email address.");
            setSent(true);
          }}
          className="space-y-4"
        >
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={err}
          />
          <button className={btnPrimary + " w-full"}>Send reset link</button>
        </form>
      )}
    </AuthShell>
  );
}
