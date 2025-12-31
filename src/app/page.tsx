"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  return (
    <div style={{ 
      background: "#000", 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      {/* Usando a logo que está na sua pasta public */}
      <img src="/logo-dashboard.svg" alt="OUVI" style={{ width: "80px", opacity: 0.8 }} />
    </div>
  );
}
