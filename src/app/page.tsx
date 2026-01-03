"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Sem travas de convite: logou, entra. Não logou, login. [cite: 2025-12-29]
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  return (
    <div style={{ background: "#000", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src="/logo-dashboard.svg" alt="OUVI" style={{ width: "80px", opacity: 0.5 }} />
    </div>
  );
}