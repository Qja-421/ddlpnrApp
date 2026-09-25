import React, { useState } from 'react';
import { RepublicSeal } from './RepublicSeal.tsx';
import { FieldEstablishment } from '../lib/supabase.ts';

export interface CircuitBrazzavilleProps {
  establishments: FieldEstablishment[];
  onTransmitToBrazzaville: (est: FieldEstablishment) => void;
  onClose?: () => void;
}

export interface TransmissionLog {
  id: string;
  establishmentId: string;
  establishmentName: string;
  promoter: string;
  transmittalNumber: string;
  dateSent: string;
  channel: 'COURRIER_POSTAL' | 'EMAIL_OFFICIEL' | 'WHATSAPP_DGL';
  trackingNumber: string;
  status: 'TRANSMIS' | 'RECEPTIONNE_DGL' | 'EN_EXAMEN' | 'AUTORISE_DGL';
  decisionNotes?: string;
}

const initialTransmissions: TransmissionLog[] = [
  {
    id: 'TR-2026-001',
    establishmentId: 'EST-2026-001',
    establishmentName: 'Le Cercle Privé VIP - Mpita',
    promoter: 'Alain Mambou',
    transmittalNumber: 'BORD-DDLPN/2026-0012',
    dateSent: '15/02/2026',
    channel: 'COURRIER_POSTAL',
    trackingNumber: 'CHRONO-CG-PNR-88412',
    status: 'EN_EXAMEN',
    decisionNotes: 'Dossier instruit favorablement par DDL-PN. En attente visa Directeur Général.',
  },
  {
    id: 'TR-2026-002',
    establishmentId: 'EST-2026-004',
    establishmentName: 'Cabaret Live Le Kouilou',
    promoter: 'Benoît Mabiala',
    transmittalNumber: 'BORD-DDLPN/2026-0008',
    dateSent: '20/01/2026',
    channel: 'EMAIL_OFFICIEL',
    trackingNumber: 'MAIL-MCAPNIT-DGL-019',
    status: 'AUTORISE_DGL',
    decisionNotes: 'Autorisation définitive d\'exploitation accordée par Arrêté N° 045/MCAPNIT/DGL.',
  },
];

export const CircuitBrazzaville: React.FC<CircuitBrazzavilleProps> = ({
  establishments,
  onTransmitToBrazzaville,
  onClose,
}) => {
  const [transmissions, setTransmissions] = useState<TransmissionLog[]>(initialTransmissions);
  const [selectedBordereauEst, setSelectedBordereauEst] = useState<FieldEstablishment | null>(null);
  const [sendChannel, setSendChannel] = useState<'COURRIER_POSTAL' | 'EMAIL_OFFICIEL' | 'WHATSAPP_DGL'>('COURRIER_POSTAL');
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [showBordereauModal, setShowBordereauModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Eligible establishments for transmission: must have attestation de dépôt or first installment paid
  const eligibleEstablishments = establishments.filter(
    (e) =>
      e.status === 'attestation_depot' ||
      e.status === 'en_instruction' ||
      e.paidAmount > 0 ||
      e.sector === 'formal'
  );

  // Handle packaging and transmission
  const handleExecuteTransmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBordereauEst) return;

    const bordNum = `BORD-DDLPN/2026-${String(transmissions.length + 1).padStart(4, '0')}`;
    const newLog: TransmissionLog = {
      id: `TR-2026-${String(transmissions.length + 1).padStart(3, '0')}`,
      establishmentId: selectedBordereauEst.id,
      establishmentName: selectedBordereauEst.name,
      promoter: selectedBordereauEst.promoter,
      transmittalNumber: bordNum,
      dateSent: new Date().toLocaleDateString('fr-FR'),
      channel: sendChannel,
      trackingNumber: trackingInput || `REF-ENVOI-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'TRANSMIS',
      decisionNotes: 'Bordereau officiel généré par DDL-PN et transmis à la Direction Générale.',
    };

    setTransmissions([newLog, ...transmissions]);
    onTransmitToBrazzaville(selectedBordereauEst);
    setShowBordereauModal(false);
    showToast(`Dossier de « ${selectedBordereauEst.name} » formellement transmis à Brazzaville (${bordNum}) !`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#dde2f3] p-6 space-y-6 text-[#161c27]">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#022448] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-white/20 text-sm font-sans animate-fade-in">
          <span className="material-symbols-outlined text-[#4ede80]">mark_email_read</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#dde2f3] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#f0f3ff] p-1 flex items-center justify-center shrink-0 border border-[#c4c7d4]">
            <RepublicSeal size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[10px] uppercase font-bold text-[#0284c7] bg-[#e0f2fe] px-2.5 py-0.5 rounded">
                Circuit Régalien Hiérarchique
              </span>
              <span className="font-sans text-[10px] uppercase font-bold text-[#43474e] bg-gray-100 px-2.5 py-0.5 rounded">
                Pointe-Noire &rarr; Brazzaville
              </span>
            </div>
            <h2 className="font-garamond text-2xl sm:text-3xl font-bold text-[#022448] mt-1">
              Circuit de Transmission des Dossiers à la DGL Brazzaville
            </h2>
            <p className="font-serif italic text-xs text-[#43474e]">
              Rappel institutionnel impératif : La DDL-PN délivre uniquement l'« Attestation de Dépôt ». L'« Autorisation d'Exploitation » relève de la compétence exclusive de la Direction Générale à Brazzaville.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
          <span className="font-sans text-[10px] uppercase font-bold text-[#0369a1] block">
            1. Attestations de Dépôt DDL
          </span>
          <div className="font-mono text-2xl font-bold text-[#022448] mt-1">
            {establishments.filter((e) => e.status === 'attestation_depot').length}
          </div>
          <span className="text-[11px] text-[#0369a1] font-semibold block mt-0.5">
            Dossiers instruits à Pointe-Noire
          </span>
        </div>

        <div className="bg-[#fef9c3] p-4 rounded-xl border border-[#fef08a]">
          <span className="font-sans text-[10px] uppercase font-bold text-[#a16207] block">
            2. Prêts pour Transmission
          </span>
          <div className="font-mono text-2xl font-bold text-[#854d0e] mt-1">
            {eligibleEstablishments.filter((e) => e.status !== 'transmis_brazzaville' && e.status !== 'autorise_dgl').length}
          </div>
          <span className="text-[11px] text-[#854d0e] font-semibold block mt-0.5">
            Pièces requises &amp; droits perçus
          </span>
        </div>

        <div className="bg-[#e0e7ff] p-4 rounded-xl border border-[#c7d2fe]">
          <span className="font-sans text-[10px] uppercase font-bold text-[#4338ca] block">
            3. En Cours à Brazzaville (DGL)
          </span>
          <div className="font-mono text-2xl font-bold text-[#3730a3] mt-1">
            {transmissions.filter((t) => t.status === 'TRANSMIS' || t.status === 'EN_EXAMEN').length}
          </div>
          <span className="text-[11px] text-[#3730a3] font-semibold block mt-0.5">
            Bordereaux acheminés sous pli officiel
          </span>
        </div>

        <div className="bg-[#dcfce7] p-4 rounded-xl border border-[#bbf7d0]">
          <span className="font-sans text-[10px] uppercase font-bold text-[#15803d] block">
            4. Autorisations Accordées (DGL)
          </span>
          <div className="font-mono text-2xl font-bold text-[#166534] mt-1">
            {transmissions.filter((t) => t.status === 'AUTORISE_DGL').length +
              establishments.filter((e) => e.status === 'autorise_dgl').length}
          </div>
          <span className="text-[11px] text-[#166534] font-semibold block mt-0.5">
            Arrêtés d'exploitation définitifs
          </span>
        </div>
      </div>

      {/* Eligible Files Ready to be Packaged and Transmitted */}
      <div className="bg-[#f8faff] p-5 rounded-xl border border-[#dde2f3] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-sans font-bold text-sm text-[#022448] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#0284c7]">send_and_archive</span>
              <span>Dossiers Éligibles à l'Émission d'un Bordereau de Transmission DGL</span>
            </h3>
            <p className="font-sans text-xs text-[#43474e] mt-0.5">
              Sélectionnez un établissement ayant déposé son dossier et réglé au moins sa première tranche pour générer le bordereau.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {eligibleEstablishments
            .filter((e) => e.status !== 'transmis_brazzaville' && e.status !== 'autorise_dgl')
            .slice(0, 6)
            .map((est) => (
              <div key={est.id} className="p-3.5 bg-white rounded-lg border border-[#dde2f3] shadow-sm space-y-2 text-xs font-sans">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#747783] block">{est.id}</span>
                    <h4 className="font-bold text-sm text-[#022448]">{est.name}</h4>
                    <span className="text-[#43474e]">{est.promoter}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      est.sector === 'formal' ? 'bg-[#e0f2fe] text-[#0369a1]' : 'bg-[#ffedd5] text-[#c2410c]'
                    }`}
                  >
                    {est.sector === 'formal' ? 'Formel' : 'Informel'}
                  </span>
                </div>

                <div className="text-[11px] text-[#43474e]">
                  <span>Activité : </span>
                  <span className="font-semibold text-[#161c27]">{est.activityLabel}</span>
                  <span className="block mt-0.5 font-mono text-[#006d2f] font-bold">
                    Perçu : {est.paidAmount.toLocaleString('fr-FR')} / {est.totalDue.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBordereauEst(est);
                    setShowBordereauModal(true);
                  }}
                  className="w-full py-2 bg-[#022448] hover:bg-[#142943] text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">outgoing_mail</span>
                  <span>Générer Bordereau &amp; Transmettre</span>
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Ongoing Transmissions Registry */}
      <div className="space-y-3">
        <h3 className="font-sans font-bold text-sm text-[#022448] uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#004528]">checklist_rtl</span>
          <span>Registre des Bordereaux Transmis &amp; Suivi DGL Brazzaville</span>
        </h3>

        <div className="overflow-x-auto border border-[#dde2f3] rounded-xl">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-[#f0f3ff] text-[#43474e] font-bold text-[10px] uppercase">
              <tr>
                <th className="p-3">Réf Bordereau &amp; Date</th>
                <th className="p-3">Établissement &amp; Promoteur</th>
                <th className="p-3">Canal de Transmission</th>
                <th className="p-3">N° de Suivi / Décharge</th>
                <th className="p-3">Statut DGL Brazzaville</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde2f3]">
              {transmissions.map((t) => (
                <tr key={t.id} className="hover:bg-[#f9f9ff]">
                  <td className="p-3">
                    <div className="font-mono font-bold text-[#022448]">{t.transmittalNumber}</div>
                    <span className="text-[11px] text-[#747783]">Envoyé le {t.dateSent}</span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-sm text-[#161c27]">{t.establishmentName}</div>
                    <span className="text-[#43474e] text-xs">{t.promoter}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-[#43474e]">
                      {t.channel === 'COURRIER_POSTAL' && '📦 Courrier Postal'}
                      {t.channel === 'EMAIL_OFFICIEL' && '✉️ Email Officiel DGL'}
                      {t.channel === 'WHATSAPP_DGL' && '📱 WhatsApp DGL'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-[#0284c7] font-semibold">
                    {t.trackingNumber}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        t.status === 'AUTORISE_DGL'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : t.status === 'EN_EXAMEN'
                          ? 'bg-[#fef9c3] text-[#a16207]'
                          : 'bg-[#e0e7ff] text-[#4338ca]'
                      }`}
                    >
                      {t.status === 'AUTORISE_DGL' && 'Autorisation DGL Accordée'}
                      {t.status === 'EN_EXAMEN' && 'En Examen Technique'}
                      {t.status === 'TRANSMIS' && 'Transmis / En Acheminement'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-white border border-[#c4c7d4] hover:bg-gray-50 rounded text-xs font-bold text-[#022448] cursor-pointer"
                    >
                      Imprimer Bordereau
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PACKAGING & GENERATING TRANSMISSION BORDEREAU */}
      {showBordereauModal && selectedBordereauEst && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-[#dde2f3] animate-fade-in font-sans space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#022448] text-[24px]">send</span>
                <h3 className="font-garamond text-xl font-bold text-[#022448]">
                  Bordereau de Transmission Officiel • DGL Brazzaville
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBordereauModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleExecuteTransmission} className="space-y-4 text-xs">
              <div className="bg-[#f0f4fd] p-3.5 rounded-xl border border-[#d3ddfc] space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-[#0369a1] block">
                  Dossier Sélectionné pour Transmission
                </span>
                <div className="text-sm font-bold text-[#022448]">{selectedBordereauEst.name}</div>
                <div className="text-[#43474e]">Promoteur : {selectedBordereauEst.promoter}</div>
                <div className="text-[#43474e]">Activité : {selectedBordereauEst.activityLabel} ({selectedBordereauEst.surfaceSqm} m²)</div>
                <div className="text-[#006d2f] font-mono font-bold">
                  Montant acquitté : {selectedBordereauEst.paidAmount.toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              {/* Required Documents Package Checklist */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <span className="font-bold text-[#161c27] block text-[11px] uppercase tracking-wider">
                  Pièces Jointes au Bordereau (Package d'Instruction) :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#43474e]">
                  <div className="flex items-center gap-1.5 text-[#006d2f] font-semibold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Demande manuscrite timbrée</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#006d2f] font-semibold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Copie CNI / Passeport</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#006d2f] font-semibold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Casier Judiciaire B3</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#006d2f] font-semibold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Certificat de Nationalité</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#006d2f] font-semibold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Attestation de Dépôt DDL</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#006d2f] font-semibold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Quitus Sécurité Pompiers</span>
                  </div>
                </div>
              </div>

              {/* Transmission Channel */}
              <div>
                <label className="font-bold text-[#161c27] block mb-1">Canal Officiel d'Expédition *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendChannel('COURRIER_POSTAL')}
                    className={`p-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      sendChannel === 'COURRIER_POSTAL'
                        ? 'border-[#022448] bg-[#022448] text-white shadow-sm'
                        : 'border-[#c4c7d4] bg-white text-[#43474e] hover:bg-gray-50'
                    }`}
                  >
                    📦 Courrier Postal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendChannel('EMAIL_OFFICIEL')}
                    className={`p-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      sendChannel === 'EMAIL_OFFICIEL'
                        ? 'border-[#022448] bg-[#022448] text-white shadow-sm'
                        : 'border-[#c4c7d4] bg-white text-[#43474e] hover:bg-gray-50'
                    }`}
                  >
                    ✉️ Email DGL
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendChannel('WHATSAPP_DGL')}
                    className={`p-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      sendChannel === 'WHATSAPP_DGL'
                        ? 'border-[#004528] bg-[#004528] text-white shadow-sm'
                        : 'border-[#c4c7d4] bg-white text-[#43474e] hover:bg-gray-50'
                    }`}
                  >
                    📱 WhatsApp DGL
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#161c27] block mb-1">N° de Suivi / Récépissé d'Envoi</label>
                <input
                  type="text"
                  placeholder="Ex: CHRONO-CG-2026-9912 ou Réf Décharge Secrétariat"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="w-full p-2 border border-[#c4c7d4] rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-[#dde2f3] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBordereauModal(false)}
                  className="px-4 py-2 border border-[#c4c7d4] rounded-lg text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#022448] hover:bg-[#142943] text-white rounded-lg font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Valider l'Envoi à Brazzaville</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
