"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bell, MessageCircle } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Busca comentï¿½rios nos posts onde o dono (user_id) ï¿½ o usuï¿½rio logado
      const { data, error } = await supabase
        .from("audio_comments")
        .select("*, posts!inner(user_id)")
        .eq("posts.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (!error) setNotifications(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  return (
    <div style={{ background: "#000", minHeight: "100vh", paddingBottom: "100px" }}>
      <div style={{ padding: "60px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <h1 style={{ color: "#fff", fontSize: "12px", fontWeight: "900", letterSpacing: "3px" }}>ALERTAS</h1>
      </div>
      <div style={{ padding: "10px" }}>
        {loading ? (
          <p style={{color:'#444', textAlign:'center', marginTop:'40px', fontSize:'11px'}}>SINTONIZANDO ATIVIDADES...</p>
        ) : notifications.length > 0 ? (
          notifications.map(n => (
            <div key={n.id} style={{ 
              display: "flex", 
              gap: "15px", 
              padding: "15px", 
              background: "rgba(255,255,255,0.02)", 
              borderRadius: "16px", 
              marginBottom: "10px", 
              alignItems: "center", 
              border: "1px solid rgba(255,255,255,0.03)" 
            }}>
              <div style={{ background: "#111", padding: "8px", borderRadius: "10px" }}>
                <MessageCircle size={16} color="#00f2fe" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.4" }}>
                  <span style={{ color: "#fff", fontWeight: "bold" }}>@{n.username}</span> comentou na sua voz.
                </p>
                <span style={{ color: "#444", fontSize: "10px", marginTop: "4px", display: "block" }}>
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#222', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <Bell size={40} />
            <p style={{ fontSize: '14px' }}>Silï¿½ncio por aqui... Por enquanto.</p>
          </div>
        )}
      </div>
    </div>
  );
}
