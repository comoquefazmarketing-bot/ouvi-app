'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function InstallStories({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-white rounded-2xl mb-8 flex items-center justify-center shadow-2xl">
        <span className="text-black font-black text-2xl">OUVI</span>
      </div>
      <h2 className="text-white text-xl font-black tracking-tighter mb-4">INSTALE O APP</h2>
      <p className="text-zinc-500 text-sm mb-12 leading-relaxed">Para uma experiência sensorial completa, adicione o OUVI à sua tela de início.</p>
      <button 
        onClick={onComplete}
        className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black tracking-[2px]"
      >
        COMEÇAR EXPERIÊNCIA
      </button>
    </div>
  );
}
