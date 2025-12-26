"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase, supabaseConfigError } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "error">(
    supabaseConfigError ? "error" : "idle"
  );
  const [message, setMessage] = useState(
    supabaseConfigError ?? "Entre com sua conta Google para continuar."
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !supabase) {
      return;
    }

    const redirectUser = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.username) {
        router.replace("/");
      } else {
        router.replace("/onboarding");
      }
    };

    redirectUser();
  }, [loading, router, user]);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setStatus("error");
      setMessage(
        supabaseConfigError ??
          "Supabase não configurado. Confira as variáveis de ambiente."
      );
      return;
    }

    setStatus("loading");

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      setStatus("error");
      setMessage("Não foi possível iniciar o login. Tente novamente.");
    }
  };

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          Login
        </p>
        <h1 className="text-2xl font-semibold text-zinc-100">Entre na OUVI</h1>
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={status === "loading" || !!supabaseConfigError}
        className="w-full rounded-full border border-zinc-700 bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Abrindo Google..." : "Continuar com Google"}
      </button>
      <p className="text-xs text-zinc-500">
        Ao continuar, você concorda com os Termos e a Política de Privacidade da
        OUVI.
      </p>
    </section>
  );
}
