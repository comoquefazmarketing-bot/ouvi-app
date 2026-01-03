"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/dashboard/Header/DashboardHeader";
import TabBar from "@/components/dashboard/Navigation/TabBar";
import SensoryBackground from "@/components/dashboard/Visuals/SensorySphere";
import ActionDrawer from "@/components/dashboard/Navigation/ActionDrawer";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isThreadPage = pathname.includes("/post") || pathname.includes("/thread");

  // Blindagem de Sessão Híbrida [cite: 2025-12-30]
  useEffect(() => {
    const manualId = localStorage.getItem("ouvi_session_id");
    
    // Escuta mudanças de auth, mas respeita o ID manual [cite: 2025-12-30]
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !manualId) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#000", overflow: "hidden", position: "relative" }}>
      <SensoryBackground />

      {!isThreadPage && (
        <header style={{ position: "fixed", top: 0, width: "100%", zIndex: 300, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ maxWidth: "480px", margin: "0 auto", width: "100%", padding: "0 18px" }}>
            <Header />
          </div>
        </header>
      )}

      <main style={{ flex: 1, overflowY: "auto", width: "100%", paddingTop: isThreadPage ? "10px" : "100px", paddingBottom: "120px", scrollbarWidth: "none" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", width: "100%", padding: "0 18px" }}>
          {children}
        </div>
      </main>

      {!isThreadPage && (
        <footer style={{ position: "fixed", bottom: "30px", width: "100%", zIndex: 300, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: "480px", padding: "0 18px" }}>
             <TabBar onPlusClick={() => setIsDrawerOpen(true)} />
          </div>
        </footer>
      )}

      <ActionDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}