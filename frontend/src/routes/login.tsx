import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field, btnPrimary } from "@/components/ss/AuthShell";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — StreamSync" },
      {
        name: "description",
        content: "Log in to your StreamSync watch rooms.",
      },
      { property: "og:title", content: "Log in — StreamSync" },
      {
        property: "og:description",
        content: "Log in to your StreamSync watch rooms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<
    Partial<Record<"name" | "email" | "pw", string>>
  >({});
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Partial<Record<"name" | "email" | "pw", string>> = {};
    if (!/^\S+@\S+\.\S+$/.test(email))
      er.email = "Enter a valid email address.";
    if (pw.length < 8) er.pw = "Password must be at least 8 characters.";
    setErr(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try {
      await api.login(email, pw);
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
      title="Welcome back"
      sub={
        <>
          New here?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
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
          autoComplete="current-password"
          value={pw}
          onChange={setPw}
          error={err.pw}
          right={
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          }
        />
        <button disabled={loading} className={btnPrimary + " w-full"}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
