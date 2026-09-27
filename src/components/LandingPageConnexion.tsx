import React, { useState } from 'react';
import { useSession } from '../lib/sessionContext.tsx';
import { ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';
import type { TabType } from './Navbar.tsx';

interface LandingPageConnexionProps {
  onSuccessLogin?: (tab: TabType) => void;
}

export const LandingPageConnexion: React.FC<LandingPageConnexionProps> = ({ onSuccessLogin }) => {
  const { agentsList, login } = useSession();

  // Mode: 'admin' (Direction) vs 'agent' (Terrain SAA)
  const [activePortal, setActivePortal] = useState<'admin' | 'agent'>('admin');

  // Admin state
  const adminAgent = agentsList.find((a) => a.role === 'Direction / Contrôle' || a.name.includes('MATOKO')) || agentsList[0];
  const [adminPin, setAdminPin] = useState<string>('');
  const [showAdminPin, setShowAdminPin] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState<boolean>(false);

  // Agent state
  const fieldAgents = agentsList.filter((a) => a.role !== 'Direction / Contrôle');
  const [selectedAgentBadge, setSelectedAgentBadge] = useState<string>(
    fieldAgents[0]?.badgeNumber || 'DDL-PN-26-00000A-86244'
  );
  const [agentPin, setAgentPin] = useState<string>('');
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isAgentSubmitting, setIsAgentSubmitting] = useState<boolean>(false);

  const selectedAgent = fieldAgents.find((a) => a.badgeNumber === selectedAgentBadge) || fieldAgents[0];

  // Admin Login Handler
  const handleAdminLogin = (e?: React.FormEvent, customPin?: string) => {
    if (e) e.preventDefault();
    const pinToUse = customPin !== undefined ? customPin : adminPin;
    if (!pinToUse) {
      setAdminError('Veuillez saisir votre code secret PIN d’accréditation.');
      return;
    }

    setIsAdminSubmitting(true);
    setAdminError(null);

    setTimeout(() => {
      const res = login(adminAgent.badgeNumber, pinToUse);
      if (res.success) {
        if (onSuccessLogin) onSuccessLogin('dashboard');
      } else {
        setAdminError(res.message || 'Code PIN administrateur incorrect.');
        setIsAdminSubmitting(false);
      }
    }, 250);
  };

  // Agent Login Handler
  const handleAgentLogin = (customPin?: string) => {
    const pinToUse = customPin !== undefined ? customPin : agentPin;
    if (!pinToUse) {
      setAgentError('Veuillez composer votre code PIN à 4 chiffres.');
      return;
    }

    setIsAgentSubmitting(true);
    setAgentError(null);

    setTimeout(() => {
      const res = login(selectedAgent.badgeNumber, pinToUse);
      if (res.success) {
        if (onSuccessLogin) onSuccessLogin('terminal-mobile');
      } else {
        setAgentError(res.message || 'Code PIN agent invalide.');
        setIsAgentSubmitting(false);
      }
    }, 250);
  };

  // Pin pad interactions for agent
  const handleAgentDigitClick = (digit: string) => {
    if (agentPin.length < 4) {
      const next = agentPin + digit;
      setAgentPin(next);
      setAgentError(null);
      if (next.length === 4) {
        // Auto trigger submit
        setTimeout(() => handleAgentLogin(next), 200);
      }
    }
  };

  const handleAgentBackspace = () => {
    setAgentPin((prev) => prev.slice(0, -1));
    setAgentError(null);
  };

  const handleAgentClear = () => {
    setAgentPin('');
    setAgentError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001c3b] via-[#022448] to-[#002f1a] text-white flex flex-col justify-between selection:bg-[#c59b27] selection:text-[#001c3b] relative overflow-x-hidden font-sans">
      {/* Decorative Republic Motif & Geometric Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#006d2f]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#0284c7]/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* TOP OFFICIAL HEADER */}
      <header className="relative z-10 w-full border-b border-white/10 bg-[#00142b]/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          {/* Official Heraldic Branding */}
          <div className="flex items-center gap-3.5">
            <ArmoiriesCongo size={46} className="shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffe082]">
                République du Congo
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/70">
                Ministère de l'Industrie Culturelle, Touristique, Artistique et des Loisirs
              </span>
              <div className="flex items-center gap-1.5 text-[9px] text-white/50 font-mono">
                <span>Direction Générale des Loisirs</span>
                <span>·</span>
                <span className="text-white/80 font-bold">Direction Départementale de Pointe-Noire (DDL-PN)</span>
              </div>
            </div>
          </div>

          {/* Republic Motto & Connection Status */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex flex-col text-right">
              <span className="font-garamond italic text-[13px] text-[#ffe082]">
                « Unité · Travail · Progrès »
              </span>
              <span className="text-[9.5px] font-mono text-white/60">
                Portail Sécurisé SIG-DDLPN v2.6
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#004528]/80 text-[#86efac] border border-[#006d2f] px-2.5 py-1 rounded-full text-[10.5px] font-mono font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
              <span>Supabase Direct 113+ Dossiers</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN HERO & AUTHENTICATION HUB */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        {/* Title & Introduction */}
        <div className="text-center mb-8 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1 rounded-full text-[11px] font-mono text-[#ffe082] shadow-inner mb-2">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            <span>SYSTÈME INTÉGRÉ D'INSTRUCTION, AGRÉMENTS & RECOUVREMENT</span>
          </div>

          <h1 className="font-garamond text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-sm leading-tight">
            Accès Sécurisé aux Services des Loisirs
          </h1>
          <p className="text-sm sm:text-base text-white/75 font-sans max-w-2xl mx-auto leading-relaxed">
            Authentification institutionnelle de la Direction Départementale de Pointe-Noire.
            Sélectionnez votre portail d'accréditation ci-dessous pour ouvrir votre session.
          </p>
        </div>

        {/* PORTAL SWITCHER: SEGMENTED CONTROLS (ANTI-SLOP ZERO-PILL) */}
        <div className="w-full max-w-xl bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl mb-6 flex">
          <button
            type="button"
            onClick={() => {
              setActivePortal('admin');
              setAdminError(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activePortal === 'admin'
                ? 'bg-gradient-to-r from-[#004528] to-[#006d2f] text-white shadow-lg border border-[#34d399]/40'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            <span>1. Accès Direction & Contrôle</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('agent');
              setAgentError(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activePortal === 'agent'
                ? 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white shadow-lg border border-[#7dd3fc]/40'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">smartphone</span>
            <span>2. Terminal Agents de Terrain (SAA)</span>
          </button>
        </div>

        {/* PORTAL CARDS */}
        <div className="w-full max-w-xl bg-white text-[#0f172a] rounded-3xl shadow-2xl overflow-hidden border border-white/20 transition-all">
          {/* ========================================================================= */}
          {/* PORTAL 1: DIRECTION / SUPERVISION CENTRALE */}
          {/* ========================================================================= */}
          {activePortal === 'admin' && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header profile block */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004528] to-[#002f1a] text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0 border border-[#006d2f]">
                    JA
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#006d2f] font-bold bg-[#dcfce7] px-2 py-0.5 rounded">
                      SUPERVISEUR DÉPARTEMENTAL
                    </span>
                    <h2 className="font-garamond text-xl font-bold text-[#0f172a] mt-0.5">
                      {adminAgent.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Matricule : {adminAgent.badgeNumber} · Ligne : {adminAgent.phoneLine}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block shrink-0">
                  <LogoDDLPN size={46} />
                </div>
              </div>

              {/* Scope description */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5 font-sans">
                <div className="font-bold text-[#022448] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006d2f]">visibility</span>
                  <span>Prérogatives Débloquées (100% Département)</span>
                </div>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600 list-disc list-inside">
                  <li>Tableau de bord consolidé</li>
                  <li>Registre des 31 dossiers officiels</li>
                  <li>Atelier de rédaction & arrêtés</li>
                  <li>Rapports trimestriels DGL & Préfet</li>
                  <li>Réassignation des agents</li>
                  <li>Contrôle de caisse centralisé</li>
                </ul>
              </div>

              {/* Login form */}
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-pin-field"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Code Secret PIN d'Accréditation :
                  </label>
                  <div className="relative">
                    <input
                      id="admin-pin-field"
                      type={showAdminPin ? 'text' : 'password'}
                      value={adminPin}
                      onChange={(e) => {
                        setAdminPin(e.target.value);
                        setAdminError(null);
                      }}
                      placeholder="Entrez votre code PIN (ex. 0000)"
                      autoComplete="current-password"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#004528] focus:bg-white focus:ring-2 focus:ring-[#004528]/20 rounded-xl px-4 py-3 text-sm font-mono text-[#0f172a] tracking-wider transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPin(!showAdminPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showAdminPin ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                    Code par défaut pour la direction : <strong>0000</strong>
                  </span>
                </div>

                {adminError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                    <span>{adminError}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isAdminSubmitting}
                    className="flex-1 bg-gradient-to-r from-[#004528] to-[#006d2f] hover:from-[#003820] hover:to-[#005a26] text-white py-3 px-5 rounded-xl font-bold text-sm shadow-md shadow-[#004528]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAdminSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Vérification d'accréditation...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">lock_open</span>
                        <span>Ouvrir la Session Direction</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdminLogin(undefined, '0000')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title="Connexion immédiate avec le code de test officiel"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#006d2f]">bolt</span>
                    <span>Accès Rapide (0000)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PORTAL 2: TERMINAL AGENTS DE TERRAIN (SAA) */}
          {/* ========================================================================= */}
          {activePortal === 'agent' && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Instructions banner */}
              <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 text-xs text-[#0369a1] flex items-start gap-2.5 font-sans">
                <span className="material-symbols-outlined text-[20px] text-[#0284c7] shrink-0 mt-0.5">
                  touch_app
                </span>
                <div>
                  <strong className="block font-bold">Connexion Tactile BYOD (Tournées & Contrôles) :</strong>
                  <span>
                    Touchez votre profil dans la liste ci-dessous, puis tapez votre code PIN à 4 chiffres sur le pavé numérique.
                  </span>
                </div>
              </div>

              {/* Agent Carousel / Selectable Badges */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Choisissez votre identité d'agent :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50">
                  {fieldAgents.map((ag) => {
                    const isSelected = ag.badgeNumber === selectedAgentBadge;
                    return (
                      <button
                        key={ag.id}
                        type="button"
                        onClick={() => {
                          setSelectedAgentBadge(ag.badgeNumber);
                          setAgentPin('');
                          setAgentError(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0284c7] bg-white shadow-md ring-2 ring-[#0284c7]/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: ag.color || '#0284c7' }}
                          >
                            {ag.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            PIN: {ag.pinCode || '1234'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate leading-tight">
                          {ag.name.split(' ')[0]} {ag.name.split(' ')[1] || ''}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                          {ag.badgeNumber.slice(-8)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected agent detail summary */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                    style={{ backgroundColor: selectedAgent.color || '#0284c7' }}
                  >
                    {selectedAgent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block truncate">{selectedAgent.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono truncate">
                      {selectedAgent.zone || 'Pointe-Noire'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-mono uppercase bg-[#e0f2fe] text-[#0369a1] font-bold px-2 py-0.5 rounded">
                    Cloisonné SAA
                  </span>
                </div>
              </div>

              {/* PIN Code Visual Feedback */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 text-center">
                  2. Saisissez votre code PIN (4 chiffres) :
                </label>
                <div className="flex items-center justify-center gap-3 py-2">
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = agentPin.length > index;
                    return (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                          isFilled
                            ? 'bg-[#0284c7] scale-110 shadow-sm shadow-[#0284c7]/40 ring-4 ring-[#0284c7]/20'
                            : 'bg-slate-200'
                        }`}
                      ></div>
                    );
                  })}
                </div>

                {agentError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium text-center flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                    <span>{agentError}</span>
                  </div>
                )}
              </div>

              {/* Tactile Keypad */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleAgentDigitClick(digit)}
                    className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-[#0284c7] active:text-white rounded-xl text-lg font-bold font-mono text-slate-800 transition-colors shadow-2xs flex items-center justify-center cursor-pointer select-none"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAgentClear}
                  className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl text-xs font-bold text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                  title="Effacer tout"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleAgentDigitClick('0')}
                  className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-[#0284c7] active:text-white rounded-xl text-lg font-bold font-mono text-slate-800 transition-colors shadow-2xs flex items-center justify-center cursor-pointer select-none"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleAgentBackspace}
                  className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                  title="Effacer le dernier chiffre"
                >
                  <span className="material-symbols-outlined text-[20px]">backspace</span>
                </button>
              </div>

              {/* Direct Submit & Shortcut Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAgentLogin()}
                  disabled={isAgentSubmitting || agentPin.length < 4}
                  className="flex-1 bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0274af] hover:to-[#025684] text-white py-3 px-5 rounded-xl font-bold text-sm shadow-md shadow-[#0284c7]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAgentSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">smartphone</span>
                      <span>Accéder à mon Portefeuille</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleAgentLogin(selectedAgent.pinCode || '1234')}
                  className="bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Valider automatiquement avec le PIN officiel de cet agent"
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Accès Rapide ({selectedAgent.pinCode || '1234'})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER RÉPUBLICAIN & ASSISTANCE */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#001024]/90 backdrop-blur-md px-4 sm:px-8 py-4 text-white/60 font-sans text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex flex-col">
            <span className="text-white/90 font-bold">
              Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)
            </span>
            <span className="text-[11px] text-white/50">
              Décret N° 2010-449 portant organisation du Ministère · Arrondissement 1 Lumumba, Pointe-Noire, République du Congo
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-white/80">
              <span className="material-symbols-outlined text-[14px] text-[#ffe082]">support_agent</span>
              <span>Assistance : <strong>05 302 83 83</strong></span>
            </span>
            <span>·</span>
            <span>Sécurité : Chiffrement SSL/TLS</span>
            <span>·</span>
            <span className="text-[#86efac]">Base Supabase Synchronisée</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
