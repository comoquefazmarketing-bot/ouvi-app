"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const sintonizarAcesso = async () => {
      // Checa diretamente no Supabase se o usuário é membro ativo
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Já é membro: Dashboard direto [cite: 2025-12-30]
        router.push("/dashboard");
      } else {
        // Não é membro ou deslogado: Tela de acesso
        router.push("/login");
      }
    };
    sintonizarAcesso();
  }, [router]);

  return (
    <div style={{ background: "#000", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src="/logo-dashboard.svg" alt="OUVI" style={{ width: "80px", opacity: 0.3 }} />
    </div>
  );
}