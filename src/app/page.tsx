"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/**
 * PROJETO OUVI – Sintonização de Acesso Direto
 * Engenharia Reversa: Remoção total de Landing Pages e Convites.
 * Objetivo: Garantir o sucesso do membro através da sessão do Supabase.
 */

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const sintonizarAcesso = async () => {
      // 1. O PONTO DE FALHA EVITADO: 
      // Não olhamos mais para URLSearchParams ou localStorage de convites.
      // O único critério de verdade é a sessão ativa no Supabase.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro na sintonização de segurança:", error.message);
        router.push("/login");
        return;
      }

      // 2. O FLUXO DE SUCESSO:
      if (session) {
        // Se o membro já existe e está logado, entra no ecossistema sensorial imediatamente.
        router.push("/dashboard");
      } else {
        // Se não há rastro de login, o destino único é a porta de entrada.
        router.push("/login");
      }
    };

    sintonizarAcesso();
  }, [router]);

  // 3. INTERFACE DE TRANSIÇÃO (PREMEDITATIO MALORUM):
  // Enquanto o código decide o destino, exibimos apenas a alma do app (logo)
  // para evitar flashes de páginas inexistentes ou erros visuais.
  return (
    <div style={styles.container}>
      <img 
        src="/logo-dashboard.svg" 
        alt="OUVI" 
        style={styles.logo} 
      />
      <span style={styles.tag}>SINTONIZANDO ACESSO...</span>
    </div>
  );
}

const styles = {
  container: { 
    background: "#000", 
    height: "100vh", 
    display: "flex", 
    flexDirection: "column" as const,
    alignItems: "center", 
    justifyContent: "center",
    gap: "20px"
  },
  logo: { 
    width: "80px", 
    opacity: 0.3,
    filter: "drop-shadow(0 0 20px rgba(0,242,254,0.1))"
  },
  tag: {
    color: "#111",
    fontSize: "8px",
    fontWeight: "900" as const,
    letterSpacing: "2px"
  }
};