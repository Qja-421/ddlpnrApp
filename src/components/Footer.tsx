import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#ffffff] shadow-[0_-1px_6px_rgba(2,36,72,0.04)] border-t border-[#e8eeff] mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="font-garamond text-[16px] uppercase font-bold text-[#022448] tracking-[0.06em]">
            Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)
          </span>
          <span className="font-serif text-[12px] text-[#43474e]">
            Direction Générale des Loisirs — Ministère de la Culture, des Arts, du Patrimoine National et de l'Industrie Touristique
          </span>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1">
          <span className="font-sans text-[10px] uppercase text-[#6d5e00] font-bold tracking-widest">
            Système Intégré de Rédaction Juridique &amp; Administrative
          </span>
          <span className="font-serif text-[12px] text-[#43474e]">
            © 2026 République du Congo. Conservation et archives départementales.
          </span>
        </div>
      </div>
    </footer>
  );
};
