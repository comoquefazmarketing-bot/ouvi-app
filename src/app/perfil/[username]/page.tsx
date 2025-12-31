'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, User, Mic, Search } from 'lucide-react'; // Ícones modernos

export default function DashboardPage() {
  const [tab, setTab] = useState(0); // 0 = Geral, 1 = Perfil

  // Função para o botão Home
  const irParaHome = () => setTab(0);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      
      {/* 1. Header de Seleção (Estilo Instagram/TikTok) */}
      <div className="flex justify-center gap-8 py-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md z-50">
        <button 
          onClick={() => setTab(0)}
          className={`text-sm font-bold transition-all duration-300 ${tab === 0 ? 'text-white scale-110' : 'text-zinc-500'}`}
        >
          PARA VOCÊ
        </button>
        <button 
          onClick={() => setTab(1)}
          className={`text-sm font-bold transition-all duration-300 ${tab === 1 ? 'text-white scale-110' : 'text-zinc-500'}`}
        >
          MEU PERFIL
        </button>
      </div>

      {/* 2. Container do Swipe (O "Motor" do movimento) */}
      <motion.div 
        className="flex h-full w-[200vw]"
        animate={{ x: tab === 0 ? '0%' : '-50%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100) setTab(1); // Deslizou para a esquerda -> Perfil
          if (info.offset.x > 100) setTab(0);  // Deslizou para a direita -> Home
        }}
      >
        {/* LADO A: FEED CRONOLÓGICO */}
        <div className="w-[100vw] h-full overflow-y-auto pb-32">
           {/* Aqui entra o seu componente <FeedGeral /> */}
           <div className="p-10 text-center text-zinc-500">Conteúdo do Feed Geral...</div>
        </div>

        {/* LADO B: GRADE 3x3 DO PERFIL */}
        <div className="w-[100vw] h-full overflow-y-auto pb-32 bg-zinc-950">
           {/* Aqui entra o seu componente <GradePerfil /> */}
           <div className="p-10 text-center text-zinc-500">Sua Grade de Posts 3x3...</div>
        </div>
      </motion.div>

      {/* 3. BARRA DE NAVEGAÇÃO INFERIOR (Onde fica o Botão Home) */}
      <nav className="fixed bottom-0 w-full bg-black/90 border-t border-zinc-900 pb-6 pt-3 px-10 flex justify-between items-center z-[100]">
        <button onClick={irParaHome} className={`p-2 transition ${tab === 0 ? 'text-white' : 'text-zinc-600'}`}>
          <Home size={28} fill={tab === 0 ? "white" : "none"} />
        </button>
        
        <button className="text-zinc-600 p-2"><Search size={28} /></button>
        
        {/* Botão Central de Postar (Destaque) */}
        <button className="bg-white text-black p-3 rounded-full -mt-10 shadow-lg shadow-white/10 active:scale-90 transition">
          <Mic size={32} />
        </button>

        <button className="text-zinc-600 p-2"><Search size={28} /></button>

        <button onClick={() => setTab(1)} className={`p-2 transition ${tab === 1 ? 'text-white' : 'text-zinc-600'}`}>
          <User size={28} fill={tab === 1 ? "white" : "none"} />
        </button>
      </nav>

    </div>
  );
}
