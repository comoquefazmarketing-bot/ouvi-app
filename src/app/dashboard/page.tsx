"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    // 1. GARANTE A IDENTIDADE PELO EMAIL
    const savedEmail = localStorage.getItem("ouvi_user_email");
    if (!savedEmail) {
      router.push("/login");
      return;
    }

    // Tenta carregar o perfil, mas não expulsa se falhar
    const { data: perfil } = await supabase.from('profiles').select('*').eq('email', savedEmail).maybeSingle();
    if (perfil) setCurrentUser(perfil);

    // 2. BUSCA OS POSTS (Lógica resiliente) [cite: 2025-12-30]
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:user_id(id, username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (!error) setPosts(data || []);
    } catch (e) {
      console.error("Sinal de posts fraco...");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Restante do seu JSX...