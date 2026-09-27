import React, { useState } from 'react';
import { useSession } from '../lib/sessionContext.tsx';
import { LogoDDLPN, ArmoiriesCongo } from './RepublicSeal.tsx';

export const SessionLoginModal: React.FC = () => {
  const {
    showLoginModal,
    setShowLoginModal,
    agentsList,
    currentAgent,
    login,
    isAdmin,
  } = useSession();

  const [selectedBadge, setSelectedBadge] = useState<string>(currentAgent.badgeNumber);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!showLoginModal) return null;

  const targetAgent = agentsList.find((a) => a.badgeNumber === selectedBadge) || agentsList[0];

  const handleDigitClick = (digit: string) => {
    if (pinInput.length < 4) {
      setPinInput((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput) {
      setErrorMsg('Veuillez composer votre code PIN à 4 chiffres.');
      return;
    }

    const res = login(selectedBadge, pinInput);
    if (!res.success) {
      setErrorMsg(res.message || 'Code PIN invalide.');
      setPinInput('');
    } else {
      setPinInput('');
      setErrorMsg(null);
    }
  };

  // Quick switch for supervisor testing / demonstration
  const handleDirectSelect = (badge: string) => {
    setSelectedBadge(badge);
    setPinInput('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#dde2f3] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Républicain */}
        <div className="bg-gradient-to-r from-[#022448] via-[#004528] to-[#022448] text-white p-6 relative">
          <button
            type="button"
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 shadow">
              <LogoDDLPN size={38} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffe082] bg-white/10 px-2 py-0.5 rounded">
                AUTHENTIFICATION & SESSIONS CLOISONNÉES
              </span>
              <h2 className="text-xl font-bold font-garamond text-white">
                Connexion Agent & Direction DDL-PN
              </h2>
            </div>
          </div>
          <p className="text-xs text-white/80 leading-relaxed mt-2">
            Chaque agent accède exclusivement à ses établissements et rendez-vous attribués.
            Seul l'Administrateur Central dispose de la vue unifiée sur toute l'équipe.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Agent Selector Carousel / Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Sélectionnez votre profil ou matricule :
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {agentsList.map((ag) => {
                const isSelected = ag.badgeNumber === selectedBadge;
                const isCurrentActive = ag.badgeNumber === currentAgent.badgeNumber;
                return (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => handleDirectSelect(ag.badgeNumber)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#006d2f] bg-[#f0fdf4] shadow-md ring-2 ring-[#006d2f]/30'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: ag.color || '#004528' }}
                      >
                        {ag.name.slice(0, 2).toUpperCase()}
                      </span>
                      {ag.role === 'Direction / Contrôle' ? (
                        <span className="bg-[#ffe082] text-[#022448] text-[9px] font-black px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          TERRAIN
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-gray-900 leading-tight">
                      {ag.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {ag.badgeNumber}
                    </div>
                    <div className="text-[9px] text-gray-500 truncate mt-1">
                      {ag.zone || 'Zone non définie'}
                    </div>
                    {isCurrentActive && (
                      <span className="mt-1 inline-block text-[9px] font-bold text-[#006d2f]">
                        ● Session active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile selected summary */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-[#022448]">lock</span>
              <div>
                <div className="text-xs font-bold text-gray-900">
                  {targetAgent.name} ({targetAgent.badgeNumber})
                </div>
                <div className="text-[11px] text-gray-600">
                  Rôle : <span className="font-semibold">{targetAgent.role}</span> • Code PIN requis
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-white px-2 py-1 rounded border">
              PIN Démo: {targetAgent.pinCode || '1234'}
            </span>
          </div>

          {/* PIN Input Dots */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="text-xs font-semibold text-gray-600">Saisissez votre code PIN (4 chiffres) :</div>
            <div className="flex items-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      filled
                        ? 'bg-[#006d2f] border-[#006d2f] scale-110 shadow-sm'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  />
                );
              })}
            </div>
            {errorMsg && (
              <div className="text-red-600 text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Tactile Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitClick(digit)}
                className="py-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              className="py-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">backspace</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pinInput.length !== 4}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              pinInput.length === 4
                ? 'bg-[#006d2f] hover:bg-[#005524] text-white shadow-[#006d2f]/30 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-base">login</span>
            Ouvrir la session sécurisée
          </button>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-[11px] text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Base Supabase DDL-PN Synchronisée
          </span>
          <span className="text-gray-400">Pointe-Noire • 2026</span>
        </div>
      </div>
    </div>
  );
};
