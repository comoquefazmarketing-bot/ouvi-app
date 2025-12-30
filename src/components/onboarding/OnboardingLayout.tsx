"use client";
import React from "react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.main}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  main: { height: "100vh", background: "#000", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" as "relative", overflow: "hidden" },
  overlay: { position: "absolute" as "absolute", width: "100%", height: "100%", background: "radial-gradient(circle, rgba(0,242,254,0.05) 0%, rgba(0,0,0,1) 80%)" },
  content: { zIndex: 10, width: "100%", maxWidth: "400px", textAlign: "center" as "center", padding: "20px" }
};