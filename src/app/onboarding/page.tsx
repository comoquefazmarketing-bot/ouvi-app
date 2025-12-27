"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase, supabaseConfigError } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(
    supabaseConfigError ?? null
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!supabase) {
      setMessage(
        supabaseConfigError ??
          "Supabase não configurado. Confira as variáveis de ambiente."
      );
      return;
    }

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.username) {
        router.replace("/");
      }
    };

    setDisplayName(
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        ""
    );

    loadProfile();
  }, [loading, router, user]);

  const validateUsername = (value: string) => {
    const normalized = value.trim().replace(/^@/, "").toLowerCase();

    if (!USERNAME_REGEX.test(normalized)) {
      return {
        valid: false,
        normalized,
        error:
          "Use entre 3 e 20 caracteres: letras, números e underscore apenas.",
      };
    }

    return { valid: true, normalized };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !user) {
      setStatus("error");
      setMessage(
        supabaseConfigError ??
          "Supabase não configurado. Confira as variáveis de ambiente."
      );
      return;
    }

    const validation = validateUsername(username);

    if (!validation.valid) {
      setStatus("error");
      setMessage(validation.error ?? "Username inválido.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", validation.normalized)
      .maybeSingle();

    if (existingError) {
      setStatus("error");
      setMessage("Erro ao validar username. Tente novamente.");
      return;
    }

    if (existing && existing.id !== user.id) {
      setStatus("error");
      setMessage("Esse username já está em uso.");
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username: validation.normalized,
      display_name: displayName || validation.normalized,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    });

    if (insertError) {
      setStatus("error");
      setMessage("Não foi possível salvar seu username. Tente novamente.");
      return;
    }

    router.replace("/");
  };

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          Onboarding
        </p>
        <h1 className="text-2xl font-semibold text-zinc-100">
          Escolha seu username
        </h1>
        <p className="text-sm text-zinc-400">
          Esse será seu identificador público na OUVI.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-zinc-400" htmlFor="username">
          Username
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3">
          <span className="text-sm text-zinc-500">@</span>
          <input
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="seunome"
            className="w-full bg-transparent text-sm text-zinc-100 outline-none"
          />
        </div>
        {message ? (
          <p className="text-xs text-rose-400">{message}</p>
        ) : (
          <p className="text-xs text-zinc-500">
            Mínimo 3, máximo 20 caracteres. Apenas letras, números e “_”.
          </p>
        )}
        <button
          type="submit"
          disabled={status === "loading" || !user || !!supabaseConfigError}
          className="w-full rounded-full border border-zinc-700 bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Salvando..." : "Concluir"}
        </button>
      </form>
    </section>
  );
}
