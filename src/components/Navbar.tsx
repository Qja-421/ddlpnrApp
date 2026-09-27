import React from 'react';
import { RepublicSeal, ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';
import { NotificationCenter } from './NotificationCenter.tsx';

export type TabType =
  | 'dashboard'
  | 'terminal-mobile'
  | 'terrain'
  | 'agenda'
  | 'atelier'
  | 'registre'
  | 'tarifs'
  | 'suivi-pta'
  | 'rapport-trimestriel'
  | 'referentiel';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(2,36,72,0.06)] border-b border-[#e8eeff]">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div
            className="cursor-pointer transition-transform hover:scale-105 flex items-center gap-2"
            onClick={() => onSelectTab('dashboard')}
            title="République du Congo • Direction Départementale des Loisirs de Pointe-Noire"
          >
            <ArmoiriesCongo size={46} />
            <div className="h-8 w-[1px] bg-[#dde2f3] hidden sm:block"></div>
            <LogoDDLPN size={44} className="hidden sm:block" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-sans text-[10px] uppercase font-bold text-[#006d2f] tracking-widest flex items-center gap-1.5">
              <span>Unité • Travail • Progrès</span>
            </span>
            <span className="font-garamond text-[16px] uppercase font-bold text-[#022448] leading-tight tracking-[0.08em]">
              RÉPUBLIQUE DU CONGO
            </span>
            <span className="font-sans text-[11px] uppercase font-semibold text-[#43474e] tracking-wider">
              Direction Départementale des Loisirs • DDL-PN
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#f1f3ff] p-1 rounded-md">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-[#022448] text-white shadow-sm'
                : 'text-[#022448] hover:bg-[#dce6f9] font-extrabold'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">insights</span>
            <span>Dashboard KPI</span>
          </button>

          <button
            onClick={() => onSelectTab('terrain')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terrain'
                ? 'bg-[#004528] text-white shadow-sm'
                : 'text-[#004528] hover:bg-[#dcfce7] font-extrabold'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">add_location_alt</span>
            <span>Terrain &amp; Recouvrement SAA</span>
          </button>

          <button
            onClick={() => onSelectTab('agenda')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'agenda'
                ? 'bg-[#022448] text-[#ffe082] shadow-sm font-extrabold'
                : 'text-[#022448] hover:bg-[#e0e7ff] font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-[#006d2f]">calendar_month</span>
            <span>Agenda Rdv Google</span>
          </button>

          <button
            onClick={() => onSelectTab('atelier')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer ${
              activeTab === 'atelier'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-[#43474e] hover:bg-[#e3e8f9] hover:text-[#161c27]'
            }`}
          >
            Atelier A4 &amp; Actes
          </button>

          <button
            onClick={() => onSelectTab('registre')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer ${
              activeTab === 'registre'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-[#43474e] hover:bg-[#e3e8f9] hover:text-[#161c27]'
            }`}
          >
            Registre
          </button>

          <button
            onClick={() => onSelectTab('tarifs')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer ${
              activeTab === 'tarifs'
                ? 'bg-[#004528] text-white shadow-sm'
                : 'text-[#43474e] hover:bg-[#e3e8f9] hover:text-[#161c27]'
            }`}
          >
            Tarifs m² &amp; Activités
          </button>

          <button
            onClick={() => onSelectTab('suivi-pta')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer ${
              activeTab === 'suivi-pta'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-[#43474e] hover:bg-[#e3e8f9] hover:text-[#161c27]'
            }`}
          >
            Suivi PTA 2026
          </button>

          <button
            onClick={() => onSelectTab('rapport-trimestriel')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rapport-trimestriel'
                ? 'bg-[#006d2f] text-white shadow-sm'
                : 'text-[#006d2f] hover:bg-[#dcfce7] font-extrabold'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">print</span>
            <span>Rapport Trimestriel</span>
          </button>

          <button
            onClick={() => onSelectTab('referentiel')}
            className={`px-3 py-2 font-sans text-[11px] uppercase font-bold rounded transition-colors duration-150 cursor-pointer ${
              activeTab === 'referentiel'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-[#43474e] hover:bg-[#e3e8f9] hover:text-[#161c27]'
            }`}
          >
            Référentiel
          </button>
        </nav>

        {/* Notification Bell & User Identity Zone */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Real-time Deadline & Collection Appointment Notification Bell */}
          <NotificationCenter onNavigateToTab={onSelectTab} />

          <div className="hidden md:flex flex-col text-right justify-center">
            <div className="flex items-center justify-end gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#006d2f] animate-pulse"></span>
              <span className="font-sans text-[10px] uppercase font-bold text-[#43474e]">
                Poste de Rédaction : SAA
              </span>
            </div>
            <span className="font-sans text-[11px] font-semibold text-[#022448]">
              Jacques Alphonse MATOKO
            </span>
            <span className="font-serif text-[11px] italic text-[#43474e]">
              Dir. Dép. : Jean Richard NTSEKE NGOUAKA
            </span>
          </div>

          <div className="relative">
            <img
              alt="Profil Officier Jacques Alphonse MATOKO"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#022448]/20 shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHQsXiqcyZUNPKkrqdhwai7w8H7lchmCQVvMRifimKqkAzyT5W18WnOm0vztZPHh4peUn7eje6wfGOJS5PMKLu9zLU6n2OVvXjtAS_PlrAV5vgvFUTvJcsdrO_OcN4P1J44Ufb1vlCjYgRndsBB81ZtpfWtn2Jhvwn91INigQ3b47OubtgAa8Vbwb2IwXEP8hftwZS46KpMQR7EpPH3aQviVYULJcVxl93AkQYqqOE6NeOaZ_BFLVe"
              onError={(e) => {
                // Fallback to stylized official avatar
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect width="36" height="36" rx="18" fill="%23022448"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="13">JM</text></svg>';
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer Row */}
      <div className="xl:hidden flex items-center justify-around bg-[#f1f3ff] px-2 py-1.5 border-t border-[#dde2f3] overflow-x-auto text-[10px]">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded ${
            activeTab === 'dashboard' ? 'bg-[#022448] text-white' : 'text-[#022448]'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('terrain')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded ${
            activeTab === 'terrain' ? 'bg-[#004528] text-white' : 'text-[#004528]'
          }`}
        >
          Terrain SAA
        </button>
        <button
          onClick={() => onSelectTab('agenda')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded flex items-center gap-1 ${
            activeTab === 'agenda' ? 'bg-[#022448] text-[#ffe082]' : 'text-[#022448]'
          }`}
        >
          <span>Agenda Google</span>
        </button>
        <button
          onClick={() => onSelectTab('atelier')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded ${
            activeTab === 'atelier' ? 'bg-[#1e3a5f] text-white' : 'text-[#43474e]'
          }`}
        >
          Atelier A4
        </button>
        <button
          onClick={() => onSelectTab('registre')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded ${
            activeTab === 'registre' ? 'bg-[#1e3a5f] text-white' : 'text-[#43474e]'
          }`}
        >
          Registre
        </button>
        <button
          onClick={() => onSelectTab('tarifs')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded ${
            activeTab === 'tarifs' ? 'bg-[#004528] text-white' : 'text-[#43474e]'
          }`}
        >
          Tarifs m²
        </button>
        <button
          onClick={() => onSelectTab('suivi-pta')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded ${
            activeTab === 'suivi-pta' ? 'bg-[#1e3a5f] text-white' : 'text-[#43474e]'
          }`}
        >
          Suivi PTA
        </button>
        <button
          onClick={() => onSelectTab('rapport-trimestriel')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded ${
            activeTab === 'rapport-trimestriel' ? 'bg-[#006d2f] text-white' : 'text-[#006d2f] font-bold'
          }`}
        >
          Rapport Trimestriel
        </button>
        <button
          onClick={() => onSelectTab('referentiel')}
          className={`px-2 py-1 uppercase font-bold whitespace-nowrap rounded ${
            activeTab === 'referentiel' ? 'bg-[#1e3a5f] text-white' : 'text-[#43474e]'
          }`}
        >
          Référentiel
        </button>
      </div>
    </header>
  );
};
