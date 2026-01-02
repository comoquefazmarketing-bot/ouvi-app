/**
 * PROJETO OUVI – Manifesto (Nível 1-B)
 * Local: src/app/manifesto/page.tsx
 * Autor: Felipe Makarios
 * Funcionalidade: Captura de Leads e Redirecionamento Automático
 */

"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ManifestoPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ocioso" | "sintonizando" | "sucesso" | "erro">("ocioso");

  // PORTAL AUTOMÁTICO: Se o Luciano (ou qualquer membro) já estiver logado, pula a landing
  useEffect(() => {
    const verificarSintonia = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    verificarSintonia();
  }, [router]);

  const entrarNaFila = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("sintonizando");

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email: email.toLowerCase() }]);

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

      <motion.main 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={styles.content}
      >
        <header style={styles.header}>
          <motion.span 
            initial={{ letterSpacing: "15px", opacity: 0 }}
            animate={{ letterSpacing: "4px", opacity: 0.4 }}
            transition={{ duration: 3 }}
            style={styles.preTitle}
          >
            ESTADO DE ESPERA
          </motion.span>
          <h1 style={styles.title}>OUVI</h1>
        </header>

        <section style={styles.manifestoBody}>
          <p style={styles.quote}>"O silêncio que antecede o trovão."</p>
          
          <div style={styles.paragraphs}>
            <p style={styles.p}>
              O mundo digital perdeu a voz entre bilhões de imagens vazias. 
              Aqui, a frequência é outra [cite: 2025-12-30, 2026-01-01].
            </p>
            <p style={styles.p}>
              Não buscamos atenção, buscamos presença. 
              O microfone é o nosso altar e a sua voz é a única chave [cite: 2025-12-30].
            </p>
            <p style={styles.goldText}>
              SINTONIAS LIMITADAS. APENAS POR CONVITE.
            </p>
          </div>
        </section>

        <div style={styles.actionArea}>
          <AnimatePresence mode="wait">
            {status === "sucesso" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.successBox}
              >
                <p style={styles.successText}>SINAL CAPTURADO.</p>
                <p style={styles.subSuccess}>Aguarde o trovão no seu e-mail.</p>
              </motion.div>
            ) : (
              <motion.div 
                exit={{ opacity: 0, scale: 0.9 }}
                style={styles.inputWrapper}
              >
                <input 
                  type="email" 
                  placeholder="Deixe seu sinal (e-mail)..." 
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && entrarNaFila()}
                  disabled={status === "sintonizando"}
                />
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0, 242, 254, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  style={styles.button}
                  onClick={entrarNaFila}
                  disabled={status === "sintonizando"}
                >
                  {status === "sintonizando" ? "SINTONIZANDO..." : "ENTRAR NA FILA"}
                </motion.button>
                {status === "erro" && (
                  <p style={styles.errorMsg}>Sinal já registrado ou frequência instável.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
  manifestoBody: { marginBottom: "80px" },
  quote: { fontSize: "1.4rem", color: "#444", fontStyle: "italic", marginBottom: "40px", fontWeight: "300" as const },
  paragraphs: { display: "flex", flexDirection: "column" as const, gap: "20px" },
  p: { color: "#888", fontSize: "1.1rem", lineHeight: "1.8", fontWeight: "300" as const },
  goldText: { color: "#FFD700", fontSize: "0.9rem", fontWeight: "900" as const, letterSpacing: "2px", marginTop: "20px" },
  actionArea: { minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" },
  inputWrapper: { display: "flex", flexDirection: "column" as const, gap: "15px", alignItems: "center", width: "100%" },
  input: { background: "rgba(255,255,255,0.03)", border: "1px solid #111", padding: "18px 25px", borderRadius: "100px", color: "#fff", width: "100%", maxWidth: "320px", outline: "none", textAlign: "center" as const, fontSize: "14px" },
  button: { background: "transparent", border: "1px solid #00f2fe", color: "#00f2fe", padding: "16px 45px", borderRadius: "100px", fontWeight: "900" as const, fontSize: "11px", cursor: "pointer", letterSpacing: "1px" },
  successBox: { textAlign: "center" as const },
  successText: { color: "#00f2fe", fontWeight: "900" as const, letterSpacing: "4px", fontSize: "1.2rem" },
  subSuccess: { color: "#444", fontSize: "0.9rem", marginTop: "5px" },
  errorMsg: { color: "#ff4444", fontSize: "10px", marginTop: "10px", letterSpacing: "1px" }
};