"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase, supabaseConfigError } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [message, setMessage] = useState(
    supabaseConfigError ?? "Finalizando o login..."
  );

  useEffect(() => {
    if (supabaseConfigError || !supabase) {
      return;
    }

    const handleRedirect = async () => {
      if (!loading && !user) {
        router.replace("/login");
        return;
      }

      if (!user) {
        return;
      }

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

    handleRedirect().catch(() => {
      setMessage("Não foi possível finalizar o login. Tente novamente.");
    });
  }, [loading, router, user]);

  return (
    <section className="mx-auto max-w-md space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
        Autenticação
      </p>
      <h1 className="text-2xl font-semibold text-zinc-100">
        Entrando na OUVI
      </h1>
      <p className="text-sm text-zinc-400">{message}</p>
    </section>
  );
}
