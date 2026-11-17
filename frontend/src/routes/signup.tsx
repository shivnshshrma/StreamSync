import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field, btnPrimary } from "@/components/ss/AuthShell";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create an account — StreamSync" },
      {
        name: "description",
        content:
          "Create a StreamSync account and open your first private watch room.",
      },
      { property: "og:title", content: "Create an account — StreamSync" },
      {
        property: "og:description",
        content:
          "Create a StreamSync account and open your first private watch room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<
    Partial<Record<"name" | "email" | "pw", string>>
  >({});
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Partial<Record<"name" | "email" | "pw", string>> = {};
    if (name.trim().length < 2)
      er.name = "Display name needs at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(email))
      er.email = "Enter a valid email address.";
    if (pw.length < 8) er.pw = "Use at least 8 characters.";
    setErr(er);
    if (Object.keys(er).length) return;
    if (loading) return;
    setLoading(true);
    try {
      await api.signup(name.trim(), email, pw);
      nav({ to: "/dashboard" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell
      title="Create your account"
      sub={
        <>
          Already have one?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          id="name"
          label="Display name"
          autoComplete="nickname"
          value={name}
          onChange={setName}
          error={err.name}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={err.email}
        />
        <Field
          id="pw"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={setPw}
          error={err.pw}
        />
        <button disabled={loading} className={btnPrimary + " w-full"}>
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-xs text-muted-foreground">
          Rooms you create are private by default.
        </p>
      </form>
    </AuthShell>
  );
}
