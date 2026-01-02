"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ManifestoPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ocioso" | "sintonizando" | "sucesso" | "erro">("ocioso");

  // DERRUBANDO A BARREIRA: Redirecionamento imediato para o Dashboard
  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  const entrarNaFila = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("sintonizando");
    try {
      const { error } = await supabase.from('waitlist').insert([{ email: email.toLowerCase() }]);
      if (error) throw error;
      setStatus("sucesso");
    } catch (err) {
      console.error("Erro na sintonização:", err);
      setStatus("erro");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.vignette} />
      <motion.main initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 2 }} style={styles.content}>
        <header style={styles.header}>
          <motion.span initial={{ letterSpacing: "15px", opacity: 0 }} animate={{ letterSpacing: "4px", opacity: 0.4 }} transition={{ duration: 3 }} style={styles.preTitle}>ESTADO DE ESPERA</motion.span>
          <h1 style={styles.title}>OUVI</h1>
        </header>
        <div style={styles.actionArea}>
           <p style={{color: '#00f2fe', fontWeight: '900', letterSpacing: '2px'}}>SINTONIZANDO ACESSO...</p>
        </div>
      </motion.main>
    </div>
  );
}

const styles = {
  container: { background: "#000", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" as const },
  vignette: { position: "absolute" as const, inset: 0, background: "radial-gradient(circle, transparent 20%, #000 100%)", zIndex: 1 },
  content: { zIndex: 2, textAlign: "center" as const, padding: "40px 20px", maxWidth: "700px" },
  header: { marginBottom: "60px" },
  preTitle: { color: "#fff", fontSize: "10px", fontWeight: "900" as const, display: "block", marginBottom: "10px" },
  title: { fontSize: "4rem", letterSpacing: "12px", color: "#fff", margin: 0, fontWeight: "900" as const },
  actionArea: { minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }
};