"use client";

import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const loginComGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          prompt: 'select_account', // Força a exibição do seletor de contas do Google
          access_type: 'offline',
        },
      },
    });
    if (error) alert("Erro ao conectar: " + error.message);
  };

  return (
    <div style={{ background: "#000", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Logo centralizada conforme design do projeto */}
      <img src="/logo-ouvi.svg" alt="OUVI" style={{ width: "160px", marginBottom: "40px" }} />
      
      <button 
        onClick={loginComGoogle}
        style={{ 
          padding: "14px 28px", 
          borderRadius: "12px", 
          border: "none", 
          background: "#fff", 
          color: "#000", 
          fontWeight: "bold", 
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "1rem"
        }}
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="" />
        Continuar com Google
      </button>
    </div>
  );
}