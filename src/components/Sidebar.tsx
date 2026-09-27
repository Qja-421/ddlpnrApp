import React, { useState } from 'react';
import { ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';
import type { TabType } from './Navbar.tsx';
import { useSession } from '../lib/sessionContext.tsx';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

interface MenuItem {
  id: TabType;
  label: string;
  subLabel?: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentAgent, isAdmin, setShowLoginModal, logout } = useSession();

  const sections: MenuSection[] = [
    {
      title: '1. OPÉRATIONS DE TERRAIN (SAA)',
      items: [
        {
          id: 'agenda',
          label: 'Google Agenda Rdv',
          subLabel: 'Planning, Tournées & Anti-doublon',
          icon: 'calendar_month',
          badge: 'GOOGLE CALENDAR',
          badgeColor: 'bg-[#0284c7] text-white',
        },
        {
          id: 'terrain',
          label: 'Répertoire Établissements',
          subLabel: 'Annuaire des 113+ Établissements Réels',
          icon: 'storefront',
          badge: 'SUPABASE',
          badgeColor: 'bg-[#006d2f] text-white',
        },
        {
          id: 'terminal-mobile',
          label: 'Terminal Mobile Agent',
          subLabel: 'Saisie Tactile Rapide (Tournées)',
          icon: 'smartphone',
          badge: 'BYOD',
          badgeColor: 'bg-[#d97706] text-white',
        },
      ],
    },
    {
      title: '2. DIRECTION & RECOUVREMENT',
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de Bord & KPI',
          subLabel: 'Indicateurs Globaux & Recouvrements',
          icon: 'insights',
        },
        {
          id: 'registre',
          label: 'Registre des Instructions',
          subLabel: '31 Dossiers d’Agrément Officiels',
          icon: 'fact_check',
          badge: 'ACTES',
          badgeColor: 'bg-[#1e3a5f] text-white',
        },
        {
          id: 'atelier',
          label: 'Atelier de Rédaction A4',
          subLabel: 'Convocations, Mises en Demeure & Arrêtés',
          icon: 'edit_document',
        },
      ],
    },
    {
      title: '3. RAPPORTS & PILOTAGE OFFICIEL',
      items: [
        {
          id: 'rapport-trimestriel',
          label: 'Rapports Trimestriels DGL',
          subLabel: 'Les 4 Services (SAF, SAA, Stat, Prom)',
          icon: 'description',
          badge: 'CANEVAS DGL',
          badgeColor: 'bg-[#006d2f] text-white',
        },
        {
          id: 'suivi-pta',
          label: 'Suivi PTA 2026',
          subLabel: 'Plan de Travail Annuel Départemental',
          icon: 'checklist',
        },
      ],
    },
    {
      title: '4. RÉGLEMENTATION & BARÈMES',
      items: [
        {
          id: 'tarifs',
          label: 'Barème des Tarifs m²',
          subLabel: 'Redevances Annuelles & Calculateur',
          icon: 'calculate',
        },
        {
          id: 'referentiel',
          label: 'Textes & Lois de la République',
          subLabel: 'Décrets, Lois & Arrêtés Ministériels',
          icon: 'gavel',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Top Header (only visible on small screens < lg) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#dde2f3] px-4 py-2.5 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 rounded-lg text-[#022448] hover:bg-[#f1f3ff] transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileOpen ? 'close' : 'menu'}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <ArmoiriesCongo size={34} />
            <div className="flex flex-col">
              <span className="font-garamond text-[14px] font-bold text-[#022448] uppercase leading-tight">
                DDL-PN
              </span>
              <span className="font-sans text-[9px] uppercase font-bold text-[#006d2f] tracking-wider">
                République du Congo
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-1.5 bg-[#f1f3ff] text-[#022448] px-2 py-1 rounded-lg text-[10px] font-bold border border-[#dde2f3] cursor-pointer"
            title="Changer d'agent ou entrer code PIN"
          >
            <span
              className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
              style={{ backgroundColor: currentAgent.color || '#004528' }}
            >
              {currentAgent.name.slice(0, 1)}
            </span>
            <span className="font-mono">{currentAgent.badgeNumber.replace('SAA-', '')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('rapport-trimestriel');
              setIsMobileOpen(false);
            }}
            className="bg-[#006d2f] text-white px-2.5 py-1 rounded text-[11px] font-sans font-bold flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Rapport A4</span>
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-[#022448]/50 z-40 backdrop-blur-xs no-print"
        />
      )}

      {/* VERTICAL SIDEBAR (Desktop fixed, Mobile sliding drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#022448] text-white flex flex-col justify-between shadow-2xl transition-transform duration-200 ease-in-out border-r border-[#1e3a5f] no-print ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Brand Header */}
        <div className="p-5 border-b border-white/10 shrink-0 bg-[#001c3b]/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow shrink-0">
              <ArmoiriesCongo size={42} />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-sans text-[9px] uppercase font-bold text-[#80f899] tracking-widest flex items-center gap-1">
                <span>UNITÉ • TRAVAIL • PROGRÈS</span>
              </span>
              <span className="font-garamond text-[16px] uppercase font-bold text-white leading-tight tracking-[0.05em] truncate">
                RÉPUBLIQUE DU CONGO
              </span>
              <span className="font-sans text-[10px] text-white/70 truncate">
                Direction Départementale des Loisirs
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-sans text-white/80">
            <span className="font-bold text-[#ffe082]">Pointe-Noire (DDL-PN)</span>
            <span className="bg-[#006d2f] text-white font-bold px-1.5 py-0.2 rounded text-[9px]">
              TUTELLE MCAPNIT
            </span>
          </div>
        </div>

        {/* Middle Navigation Items List (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 text-left custom-scrollbar">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pt-1 pb-1 font-sans text-[9.5px] uppercase font-bold tracking-wider text-white/40">
                {section.title}
              </div>

              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left font-sans transition-all cursor-pointer flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#006d2f] text-white font-bold shadow-md shadow-black/20'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`material-symbols-outlined text-[18px] shrink-0 transition-transform ${
                          isActive
                            ? 'text-white scale-110'
                            : 'text-white/60 group-hover:text-white group-hover:scale-105'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] truncate">{item.label}</span>
                        {item.subLabel && (
                          <span
                            className={`text-[9.5px] font-normal truncate ${
                              isActive ? 'text-white/90 font-medium' : 'text-white/50'
                            }`}
                          >
                            {item.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`font-sans text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          item.badgeColor || 'bg-white/20 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Profile & Institution Credentials */}
        <div className="p-3 border-t border-white/10 shrink-0 bg-[#001c3b]/80 font-sans text-[11px] text-white/80">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-[12px] shrink-0 border border-white/20 shadow-sm"
                style={{ backgroundColor: currentAgent.color || '#006d2f' }}
              >
                {currentAgent.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-[11.5px] truncate">
                  {currentAgent.name}
                </span>
                <span className="text-[9.5px] text-[#80f899] font-mono truncate">
                  {currentAgent.badgeNumber} • {isAdmin ? 'Admin Direction' : 'Agent Terrain'}
                </span>
              </div>
            </div>

            {/* Switch user & Logout buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-[#ffe082] rounded-lg transition-colors cursor-pointer"
                title="Changer de session / Code PIN"
              >
                <span className="material-symbols-outlined text-[16px]">lock_reset</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Déconnexion / Verrouiller l'accès"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] text-white/50">
            <span className="truncate">
              {isAdmin ? '👁️ Vue Globale Décloisonnée' : '🔒 Session Terrain Isolée'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="text-[#ffe082] hover:underline cursor-pointer"
              >
                Code PIN
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={logout}
                className="text-red-300 hover:underline cursor-pointer"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
