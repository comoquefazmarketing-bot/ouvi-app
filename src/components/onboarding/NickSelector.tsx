"use client";
import React, { useState } from "react";

export default function NickSelector({ initialNick, onFinish }: { initialNick: string; onFinish: (nick: string) => void }) {
  const [nick, setNick] = useState(initialNick || "");

  return (
    <div style={styles.stepContainer}>
      <h2 style={styles.title}>COMO O MUNDO TE OUVE?</h2>
      <input 
        type="text" 
        value={nick} 
        onChange={(e) => setNick(e.target.value)} 
        placeholder="@username"
        style={styles.input}
      />
      <button onClick={() => onFinish(nick)} style={styles.nextBtn}>ENTRAR NA SINTONIA</button>
    </div>
  );
}

const styles = {
  stepContainer: { display: "flex", flexDirection: "column" as "column", alignItems: "center", gap: "25px" },
  title: { color: "#fff", fontSize: "14px", letterSpacing: "4px", fontWeight: "900" },
  input: { background: "transparent", border: "none", borderBottom: "1px solid #00f2fe", color: "#fff", fontSize: "24px", textAlign: "center" as "center", outline: "none", width: "80%" },
  nextBtn: { background: "#00f2fe", color: "#000", padding: "15px 40px", borderRadius: "30px", cursor: "pointer", fontSize: "11px", fontWeight: "900", letterSpacing: "2px", border: "none" }
};
