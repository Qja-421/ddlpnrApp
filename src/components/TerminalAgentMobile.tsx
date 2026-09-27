import React, { useState, useMemo } from 'react';
import { ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';
import {
  FieldEstablishment,
  AgentAccount,
  apiUpsertEstablishment,
  apiRecordPayment,
} from '../lib/supabase.ts';
import { CONFIRMED_ACTIVITY_RATES, getActivityRatePerSqm } from './MoteurTarifsActivites.tsx';
import { addOneYear, getFirstPaymentDate, formatISOToFR, normalizeDateToISO, numberToWordsFCFA } from './CalendrierRdvTerrain.tsx';
import { useSession } from '../lib/sessionContext.tsx';

interface TerminalAgentMobileProps {
  establishments: FieldEstablishment[];
  onUpdateEstablishment: (est: FieldEstablishment) => void;
  onAddNewEstablishment: (est: FieldEstablishment) => void;
  agents: AgentAccount[];
}

export type MobileTab = 'recensement' | 'recouvrement' | 'planning' | 'caisse';

export const TerminalAgentMobile: React.FC<TerminalAgentMobileProps> = ({
  establishments,
  onUpdateEstablishment,
  onAddNewEstablishment,
  agents: _agents,
}) => {
  const {
    currentAgent,
    isAdmin,
    isFieldAgent,
    canAccessEstablishment,
    checkEstablishmentCollision,
    filterEstablishmentsForUser,
    setShowLoginModal,
    switchAgent,
    agentsList,
  } = useSession();

  const [activeTab, setActiveTab] = useState<MobileTab>('recensement');
  const [collisionWarning, setCollisionWarning] = useState<{
    hasCollision: boolean;
    collisionReason?: string;
    assignedToOther: boolean;
    assignedAgentName?: string;
    assignedAgentBadge?: string;
  } | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // -------------------------------------------------------------
  // FORMULAIRE MISSION 1 : IDENTIFIER & CONVOQUER (NON RÉPERTORIÉ)
  // -------------------------------------------------------------
  const [newEstName, setNewEstName] = useState('');
  const [newPromoter, setNewPromoter] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDistrict, setNewDistrict] = useState('Mpita, Arrondissement 1 Lumumba');
  const [newAddress, setNewAddress] = useState('');
  const [newActivity, setNewActivity] = useState('ACT-BAR');
  const [newSector, setNewSector] = useState<'informal' | 'formal'>('informal');
  const [newRccm, setNewRccm] = useState('');
  const [newSurface, setNewSurface] = useState<number>(60);
  const [newNegotiatedPenalty, setNewNegotiatedPenalty] = useState<number>(50000);

  // DÉLAI FIXÉ MANUELLEMENT POUR VENIR AU BUREAU (Demande explicite de l'utilisateur)
  // Par défaut : date de demain ou dans 48h, mais 100% modifiable manuellement
  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [manualConvocationDate, setManualConvocationDate] = useState<string>(getTomorrowISO());
  const [manualConvocationTime, setManualConvocationTime] = useState<string>('09:30');
  const [manualOfficeService, setManualOfficeService] = useState<string>(
    'Service Autorisation & Animation (SAA) - Bureau N° 4, Direction Départementale du Tourisme et des Loisirs, Avenue Moe Pratt (Face Mairie Centrale)'
  );

  // Raccourcis pour aider l'agent sur le terrain tout en gardant la main manuelle
  const setQuickConvocationOffset = (days: number, time: string = '09:30') => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setManualConvocationDate(iso);
    setManualConvocationTime(time);
  };

  // Modal d'invitation générée
  const [generatedConvocation, setGeneratedConvocation] = useState<{
    ref: string;
    estName: string;
    promoter: string;
    phone: string;
    district: string;
    address: string;
    activityLabel: string;
    sector: 'informal' | 'formal';
    convocationDateFR: string;
    convocationTime: string;
    office: string;
    agentName: string;
    agentBadge: string;
    createdDateFR: string;
  } | null>(null);

  const handleCreateAndConvene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstName.trim() || !newPromoter.trim()) {
      showToast("Veuillez renseigner le nom de l'établissement et du promoteur.");
      return;
    }

    if (!manualConvocationDate) {
      showToast("Veuillez obligatoirement fixer manuellement la date de convocation au bureau.");
      return;
    }

    // 🛡️ VÉRIFICATION STRICTE D'ANTI-COLLISION / ANTI-DOUBLON
    const collision = checkEstablishmentCollision(newEstName, newPhone, newDistrict, establishments);
    if (collision.hasCollision && collision.assignedToOther) {
      showToast(`⛔ DOUBLON STRICTEMENT INTERDIT : « ${collision.existingEst?.name} » est déjà pris en charge par ${collision.assignedAgentName} (${collision.assignedAgentBadge}) !`);
      return;
    }

    const filing = newSector === 'formal' ? 30000 : 0;
    const penalty = newSector === 'informal' ? Number(newNegotiatedPenalty || 0) : 0;
    const rate = newSector === 'formal' ? getActivityRatePerSqm(newActivity) : 0;
    const total = newSector === 'formal' ? filing + newSurface * rate : penalty;

    const newId = `EST-2026-${String(establishments.length + 1).padStart(3, '0')}`;
    const activityInfo = CONFIRMED_ACTIVITY_RATES.find((a) => a.code === newActivity);
    const convocationDateFR = formatISOToFR(manualConvocationDate);
    const convocationRef = `CONV-DDL-PN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: FieldEstablishment = {
      id: newId,
      name: newEstName.trim(),
      promoter: newPromoter.trim(),
      phone: newPhone.trim() || '+242 06 000 00 00',
      district: newDistrict,
      address: newAddress.trim() || newDistrict,
      activityCode: newActivity,
      activityLabel: activityInfo ? activityInfo.label : 'Bar Standard / Nganda',
      sector: newSector,
      rccm: newSector === 'formal' ? newRccm.trim() : undefined,
      surfaceSqm: newSurface,
      identifiedDate: new Date().toLocaleDateString('fr-FR'),
      identifiedBy: `${currentAgent.name} (${currentAgent.badgeNumber})`,
      assignedAgentBadge: currentAgent.badgeNumber,
      assignedAgentName: currentAgent.name,
      status: 'convoque',
      filingFee: filing,
      penaltyFee: penalty,
      ratePerSqm: rate,
      totalDue: total,
      installmentsCount: 3,
      paidAmount: 0,
      nextDueDate: convocationDateFR,
      nextAppointmentType: 'BUREAU',
      nextAppointmentTime: manualConvocationTime,
      convocationDate: convocationDateFR,
      convocationTime: manualConvocationTime,
      convocationOffice: manualOfficeService,
      paymentHistory: [],
      sanctions: [
        {
          type: 'CONVOCATION',
          issuedDate: new Date().toLocaleDateString('fr-FR'),
          deadline: `Rendez-vous fixé manuellement au ${convocationDateFR} à ${manualConvocationTime} au bureau SAA`,
          appointmentTime: manualConvocationTime,
          appointmentOffice: manualOfficeService,
          reason: 'Identification proactive terrain - Convocation obligatoire pour régularisation des droits d’exploitation',
          resolved: false,
        },
      ],
    };

    onAddNewEstablishment(newRecord);
    apiUpsertEstablishment(newRecord);

    setGeneratedConvocation({
      ref: convocationRef,
      estName: newRecord.name,
      promoter: newRecord.promoter,
      phone: newRecord.phone,
      district: newRecord.district,
      address: newRecord.address,
      activityLabel: newRecord.activityLabel,
      sector: newRecord.sector,
      convocationDateFR,
      convocationTime: manualConvocationTime,
      office: manualOfficeService,
      agentName: currentAgent.name,
      agentBadge: currentAgent.badgeNumber,
      createdDateFR: new Date().toLocaleDateString('fr-FR'),
    });

    showToast(`Établissement « ${newRecord.name} » recensé ! Convocation fixée manuellement au ${convocationDateFR}.`);

    // Reset du formulaire
    setNewEstName('');
    setNewPromoter('');
    setNewPhone('');
    setNewAddress('');
  };

  // -------------------------------------------------------------
  // FORMULAIRE MISSION 2 : RECOUVREMENT (COMPTANT OU ACOMPTE)
  // -------------------------------------------------------------
  const [searchEstQuery, setSearchEstQuery] = useState('');
  const [selectedEstForPay, setSelectedEstForPay] = useState<FieldEstablishment | null>(null);
  const [payMode, setPayMode] = useState<'comptant' | 'acompte'>('acompte');
  const [collectAmount, setCollectAmount] = useState<number>(30000);
  const [paymentChannel, setPaymentChannel] = useState<'ESPECES' | 'AIRTEL_MONEY' | 'MTN_MOMO'>('ESPECES');
  const [collectLocation, setCollectLocation] = useState<'TERRAIN' | 'DIRECTION'>('TERRAIN');

  // PROCHAIN RENDEZ-VOUS : DÉLAI FIXÉ MANUELLEMENT (Demande explicite)
  // Option A : "Le tenancier vient au bureau régulariser"
  // Option B : "L'agent de terrain passe sur place pour second recouvrement"
  const [nextRdvType, setNextRdvType] = useState<'BUREAU' | 'TERRAIN'>('BUREAU');
  const [manualNextDate, setManualNextDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [manualNextTime, setManualNextTime] = useState<string>('10:00');
  const [manualNextNote, setManualNextNote] = useState<string>('');

  // Raccourcis manuels pour le prochain RDV
  const setQuickNextDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setManualNextDate(iso);
  };

  // Modal de Quittance / Reçu généré
  const [generatedReceipt, setGeneratedReceipt] = useState<{
    receiptRef: string;
    estName: string;
    promoter: string;
    phone: string;
    district: string;
    amountPaid: number;
    amountInWords: string;
    balanceRemaining: number;
    totalDue: number;
    payMethod: string;
    location: string;
    agentName: string;
    dateStr: string;
    isFullySettled: boolean;
    firstPaymentDate: string;
    nextYearAnniversaryDate?: string;
    nextAppointmentType?: 'BUREAU' | 'TERRAIN';
    nextAppointmentDateFR?: string;
    nextAppointmentTime?: string;
  } | null>(null);

  // Sélection d'un établissement pour encaissement
  const handleSelectEstForPay = (est: FieldEstablishment) => {
    setSelectedEstForPay(est);
    const remaining = Math.max(0, est.totalDue - est.paidAmount);
    if (payMode === 'comptant') {
      setCollectAmount(remaining);
    } else {
      const defaultInstallment = est.installmentsCount > 1
        ? Math.round(est.totalDue / est.installmentsCount)
        : remaining;
      setCollectAmount(Math.min(remaining, defaultInstallment || 25000));
    }
  };

  // Basculer mode comptant vs acompte
  const togglePayMode = (mode: 'comptant' | 'acompte') => {
    setPayMode(mode);
    if (selectedEstForPay) {
      const remaining = Math.max(0, selectedEstForPay.totalDue - selectedEstForPay.paidAmount);
      if (mode === 'comptant') {
        setCollectAmount(remaining);
      } else {
        setCollectAmount(Math.min(remaining, Math.round(remaining / 2) || 20000));
      }
    }
  };

  // Encaisser le paiement
  const handleExecuteCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstForPay) {
      showToast('Veuillez sélectionner un établissement.');
      return;
    }
    if (collectAmount <= 0) {
      showToast('Le montant encaissé doit être supérieur à 0 FCFA.');
      return;
    }

    const currentPaid = selectedEstForPay.paidAmount || 0;
    const newPaidTotal = currentPaid + collectAmount;
    const isYearFullySettled = newPaidTotal >= selectedEstForPay.totalDue && selectedEstForPay.totalDue > 0;

    // Date du tout premier versement (historique existant ou premier encaissement aujourd'hui)
    const effectiveFirstPaymentDate = getFirstPaymentDate(
      selectedEstForPay,
      new Date().toLocaleDateString('fr-FR')
    );
    // Date anniversaire automatique pour l'année suivante (+1 an à partir du 1er versement)
    const nextYearRenewalDate = addOneYear(effectiveFirstPaymentDate);

    let nextDueDateToSave: string;
    const manualNextDateFR = formatISOToFR(manualNextDate);

    if (isYearFullySettled) {
      // RÈGLE : Quand la taxe est intégralement payée (au comptant ou au dernier acompte),
      // automatiquement le prochain paiement de l'année suivante apparaît au jour de son premier versement !
      nextDueDateToSave = nextYearRenewalDate;
    } else {
      // RÈGLE : En cas d'acompte, date fixée MANUELLEMENT par l'agent
      nextDueDateToSave = manualNextDateFR;
    }

    const receiptRef = `REC-DDL-PN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateFormatted = `${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const newHistoryEntry = {
      id: receiptRef,
      date: dateFormatted,
      amount: collectAmount,
      collectedBy: `${currentAgent.name} (${currentAgent.badgeNumber})`,
      location: collectLocation,
      receiptRef,
      nextDueDate: nextDueDateToSave,
      nextAppointmentType: isYearFullySettled ? undefined : nextRdvType,
      nextAppointmentTime: isYearFullySettled ? undefined : manualNextTime,
    };

    const updatedEst: FieldEstablishment = {
      ...selectedEstForPay,
      paidAmount: newPaidTotal,
      nextDueDate: nextDueDateToSave,
      nextAppointmentType: isYearFullySettled ? undefined : nextRdvType,
      nextAppointmentTime: isYearFullySettled ? undefined : manualNextTime,
      status: isYearFullySettled
        ? 'autorise_dgl'
        : selectedEstForPay.status === 'identifie' || selectedEstForPay.status === 'convoque'
        ? 'attestation_depot'
        : selectedEstForPay.status,
      paymentHistory: [newHistoryEntry, ...(selectedEstForPay.paymentHistory || [])],
    };

    onUpdateEstablishment(updatedEst);
    apiRecordPayment({
      establishmentId: selectedEstForPay.id,
      amount: collectAmount,
      totalFee: selectedEstForPay.totalDue,
      nextDueDate: nextDueDateToSave,
    });
    apiUpsertEstablishment(updatedEst);

    // Émission du reçu officiel
    setGeneratedReceipt({
      receiptRef,
      estName: selectedEstForPay.name,
      promoter: selectedEstForPay.promoter,
      phone: selectedEstForPay.phone,
      district: selectedEstForPay.district,
      amountPaid: collectAmount,
      amountInWords: numberToWordsFCFA(collectAmount),
      balanceRemaining: Math.max(0, selectedEstForPay.totalDue - newPaidTotal),
      totalDue: selectedEstForPay.totalDue,
      payMethod:
        paymentChannel === 'ESPECES'
          ? 'Espèces (Cash Terrain)'
          : paymentChannel === 'AIRTEL_MONEY'
          ? 'Airtel Money'
          : 'MTN Mobile Money',
      location: collectLocation === 'TERRAIN' ? 'Sur le Terrain (Visite SAA)' : 'Au Bureau (Direction DDL-PN)',
      agentName: `${currentAgent.name} (${currentAgent.badgeNumber})`,
      dateStr: dateFormatted,
      isFullySettled: isYearFullySettled,
      firstPaymentDate: effectiveFirstPaymentDate,
      nextYearAnniversaryDate: isYearFullySettled ? nextYearRenewalDate : undefined,
      nextAppointmentType: isYearFullySettled ? undefined : nextRdvType,
      nextAppointmentDateFR: isYearFullySettled ? undefined : manualNextDateFR,
      nextAppointmentTime: isYearFullySettled ? undefined : manualNextTime,
    });

    if (isYearFullySettled) {
      showToast(`🎉 TAXE SOLDÉE À 100% ! Prochain paiement annuel programmé au ${nextYearRenewalDate}.`);
    } else {
      showToast(`Acompte de ${collectAmount.toLocaleString('fr-FR')} FCFA encaissé. Prochain RDV fixé au ${manualNextDateFR}.`);
    }
  };

  // -------------------------------------------------------------
  // FILTRAGE ET LISTES POUR PLANNING & CAISSE (CLOISONNÉ)
  // -------------------------------------------------------------
  const filteredEstablishments = useMemo(() => {
    let list = establishments;
    if (isFieldAgent) {
      list = list.filter((e) => canAccessEstablishment(e));
    }
    if (!searchEstQuery.trim()) return list;
    const q = searchEstQuery.toLowerCase();
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.promoter.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        e.district.toLowerCase().includes(q)
    );
  }, [establishments, searchEstQuery, isFieldAgent, canAccessEstablishment]);

  // Établissements avec convocations / rendez-vous
  const [filterPlanningType, setFilterPlanningType] = useState<'ALL' | 'BUREAU' | 'TERRAIN' | 'SOLDE'>('ALL');
  const planningList = useMemo(() => {
    return establishments.filter((e) => {
      if (isFieldAgent && !canAccessEstablishment(e)) return false;
      const isSettled = e.paidAmount >= e.totalDue && e.totalDue > 0;
      if (filterPlanningType === 'SOLDE') return isSettled;
      if (filterPlanningType === 'BUREAU') return !isSettled && (e.nextAppointmentType === 'BUREAU' || e.status === 'convoque');
      if (filterPlanningType === 'TERRAIN') return !isSettled && e.nextAppointmentType === 'TERRAIN';
      return true;
    });
  }, [establishments, filterPlanningType, isFieldAgent, canAccessEstablishment]);

  // Total encaissé aujourd'hui
  const todayReceipts = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('fr-FR');
    const list: {
      estName: string;
      amount: number;
      ref: string;
      time: string;
      location: string;
      agent: string;
    }[] = [];

    establishments.forEach((est) => {
      (est.paymentHistory || []).forEach((p) => {
        if (p.date.includes(todayStr) || p.date.includes('27/09/2026') || p.date.includes('24/09/2026')) {
          list.push({
            estName: est.name,
            amount: p.amount,
            ref: p.receiptRef,
            time: p.date,
            location: p.location,
            collectedBy: p.collectedBy,
          } as any);
        }
      });
    });
    return list;
  }, [establishments]);

  const totalCollectedToday = useMemo(() => {
    return todayReceipts.reduce((acc, curr) => acc + curr.amount, 0);
  }, [todayReceipts]);

  // WhatsApp share link helper
  const generateWhatsAppConvocationLink = (conv: NonNullable<typeof generatedConvocation>) => {
    const cleanPhone = conv.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `*RÉPUBLIQUE DU CONGO*\n` +
      `*DIRECTION DÉPARTEMENTALE DU TOURISME ET DES LOISIRS DE POINTE-NOIRE*\n` +
      `*Service Autorisation & Animation (SAA)*\n\n` +
      `*CONVOCATION OFFICIELLE N° ${conv.ref}*\n` +
      `Destinataire : M./Mme *${conv.promoter}*, Promoteur de l'établissement *${conv.estName}* (${conv.district})\n\n` +
      `Vous êtes formellement invité(e) à vous présenter au bureau :\n` +
      `📅 *Date : ${conv.convocationDateFR}*\n` +
      `⏰ *Heure : ${conv.convocationTime}*\n` +
      `🏢 *Lieu : ${conv.office}*\n\n` +
      `*Objet :* Identification proactive de terrain, immatriculation et régularisation des droits annuels d'exploitation des loisirs.\n` +
      `*Pièces à apporter :* Copie CNI ou passeport, immatriculation RCCM/NIU (si formel), bail ou titre d'occupation.\n\n` +
      `Agent SAA : ${conv.agentName} (Matricule: ${conv.agentBadge})\n` +
      `_Direction Départementale des Loisirs, Avenue Moe Pratt, Pointe-Noire._`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const generateWhatsAppReceiptLink = (rc: NonNullable<typeof generatedReceipt>) => {
    const cleanPhone = rc.phone.replace(/[^0-9]/g, '');
    let rdvMsg = '';
    if (rc.isFullySettled) {
      rdvMsg = `🎉 *EXERCICE ANNUEL SOLDÉ À 100%*\n🔄 *Prochaine taxe annuelle due au : ${rc.nextYearAnniversaryDate}* (date anniversaire de votre premier versement).`;
    } else {
      rdvMsg = `📌 *PROCHAIN RENDEZ-VOUS CONVENU :*\n` +
        `Modalité : *${rc.nextAppointmentType === 'BUREAU' ? 'Vous venez régulariser au bureau DDL-PN' : "L'agent SAA repasse sur place pour second recouvrement"}*\n` +
        `📅 Date : *${rc.nextAppointmentDateFR}* à *${rc.nextAppointmentTime}*`;
    }

    const text = encodeURIComponent(
      `*RÉPUBLIQUE DU CONGO*\n` +
      `*DIRECTION DÉPARTEMENTALE DU TOURISME ET DES LOISIRS DE POINTE-NOIRE*\n` +
      `*QUITTANCE OFFICIELLE D'ENCAISSEMENT N° ${rc.receiptRef}*\n\n` +
      `Établissement : *${rc.estName}* (${rc.promoter})\n` +
      `💰 *Montant perçu : ${rc.amountPaid.toLocaleString('fr-FR')} FCFA*\n` +
      `(${rc.amountInWords})\n` +
      `Mode : ${rc.payMethod} • Lieu : ${rc.location}\n` +
      `📉 *Reste à payer : ${rc.balanceRemaining.toLocaleString('fr-FR')} FCFA*\n\n` +
      `${rdvMsg}\n\n` +
      `Agent Percepteur : ${rc.agentName}\n` +
      `Date : ${rc.dateStr}\n` +
      `_Quittance officielle délivrée conformément à la réglementation républicaine._`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 font-sans text-gray-900 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#004528] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border-2 border-[#4ede80] text-sm font-bold animate-bounce">
          <span className="material-symbols-outlined text-[#4ede80]">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP BAR TACTILE : IDENTITÉ DE L'AGENT & STATUT */}
      <div className="bg-gradient-to-r from-[#022448] via-[#004528] to-[#022448] text-white rounded-2xl p-4 shadow-lg border-b-4 border-[#ffe082]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
              <LogoDDLPN size={40} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#ffe082] text-[#022448] text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                  TERMINAL MOBILE & TABLETTE TERRAIN
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[#4ede80] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#4ede80] animate-pulse"></span>
                  En Ligne SAA
                </span>
              </div>
              <h2 className="font-garamond text-xl font-bold text-white leading-tight">
                Direction Départementale du Tourisme et des Loisirs • Pointe-Noire
              </h2>
            </div>
          </div>

          {/* Profil agent connecté avec Code PIN / Changement */}
          <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/20">
            <div
              className="w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-sm shrink-0 border border-white/30"
              style={{ backgroundColor: currentAgent.color || '#004528' }}
            >
              {currentAgent.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left min-w-0">
              <span className="text-[10px] text-[#ffe082] block uppercase font-bold tracking-wider">
                {isAdmin ? 'Direction / Contrôle' : 'Agent de Terrain Connecté'}
              </span>
              <div className="text-white text-xs font-extrabold truncate">
                {currentAgent.name}
              </div>
              <div className="text-[10px] text-white/70 font-mono">
                Badge : {currentAgent.badgeNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="ml-1 p-2 bg-white/20 hover:bg-white/30 text-[#ffe082] rounded-lg transition-colors cursor-pointer shrink-0"
              title="Changer d'agent ou entrer code PIN"
            >
              <span className="material-symbols-outlined text-lg">lock_reset</span>
            </button>
          </div>
        </div>

        {/* 4 GRANDES TOUCHES PRINCIPALES ERGONOMIQUES (POUCE / DOIGT SUR SMARTPHONE) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('recensement')}
            className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'recensement'
                ? 'bg-[#ffe082] text-[#022448] shadow-lg scale-102 ring-2 ring-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">add_business</span>
            <span className="text-center leading-tight">1. Recenser &amp; Convoquer</span>
            <span className="text-[9px] opacity-80 font-normal">Délai manuel au bureau</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recouvrement')}
            className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'recouvrement'
                ? 'bg-[#ffe082] text-[#022448] shadow-lg scale-102 ring-2 ring-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">payments</span>
            <span className="text-center leading-tight">2. Encaisser Taxe</span>
            <span className="text-[9px] opacity-80 font-normal">Comptant ou Acompte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('planning')}
            className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'planning'
                ? 'bg-[#ffe082] text-[#022448] shadow-lg scale-102 ring-2 ring-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">calendar_month</span>
            <span className="text-center leading-tight">3. Planning Rdv</span>
            <span className="text-[9px] opacity-80 font-normal">Bureau vs Passages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('caisse')}
            className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'caisse'
                ? 'bg-[#ffe082] text-[#022448] shadow-lg scale-102 ring-2 ring-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            <span className="text-center leading-tight">4. Ma Caisse Jour</span>
            <span className="text-[9px] opacity-80 font-normal">{totalCollectedToday.toLocaleString('fr-FR')} F</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1 : RECENSEMENT D'UN ÉTABLISSEMENT NON RÉPERTORIÉ + CONVOCATION   */}
      {/* ========================================================================= */}
      {activeTab === 'recensement' && (
        <div className="bg-white rounded-2xl shadow-md border border-[#dde2f3] overflow-hidden">
          <div className="bg-[#022448] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#ffe082] text-2xl">add_location_alt</span>
              <div>
                <h3 className="font-garamond text-lg font-bold">
                  Recensement d'un Établissement Non Répertorié sur le Terrain
                </h3>
                <p className="text-xs text-white/80">
                  Mission SAA : Identifier sur place et adresser une convocation officielle avec délai fixé manuellement
                </p>
              </div>
            </div>
            <span className="text-xs bg-[#004528] text-[#a8f3c3] font-bold px-2.5 py-1 rounded-lg border border-[#4ede80]/40">
              Étape 1 sur 2
            </span>
          </div>

          <form onSubmit={handleCreateAndConvene} className="p-4 sm:p-6 space-y-4">
            {/* 1. Identification physique */}
            <div className="bg-[#f8faff] p-3.5 rounded-xl border border-[#dde2f3] space-y-3">
              <div className="flex items-center gap-2 text-[#022448] font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-base text-[#006d2f]">storefront</span>
                <span>1. Informations de l'Établissement Découvert</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nom / Enseigne de l'Établissement <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nganda Chez Tantine, VIP Club Lumumba..."
                    value={newEstName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewEstName(val);
                      const col = checkEstablishmentCollision(val, newPhone, newDistrict, establishments);
                      setCollisionWarning(col.hasCollision ? col : null);
                    }}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-[#006d2f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nom &amp; Prénom du Tenancier / Promoteur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: M. Jean-Paul MAMPASSI"
                    value={newPromoter}
                    onChange={(e) => setNewPromoter(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-[#006d2f] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Téléphone Tenancier (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+242 06 000 00 00"
                    value={newPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPhone(val);
                      const col = checkEstablishmentCollision(newEstName, val, newDistrict, establishments);
                      setCollisionWarning(col.hasCollision ? col : null);
                    }}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-[#006d2f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Arrondissement</label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-[#006d2f] focus:outline-none"
                  >
                    <option value="Mpita, Arrondissement 1 Lumumba">Arr. 1 Lumumba (Mpita, Centre)</option>
                    <option value="Arrondissement 2 Mvou-Mvou">Arr. 2 Mvou-Mvou</option>
                    <option value="Arrondissement 3 Tié-Tié">Arr. 3 Tié-Tié (Grand Marché, 3 Francs)</option>
                    <option value="Arrondissement 4 Loandjili">Arr. 4 Loandjili</option>
                    <option value="Arrondissement 5 Mongo-Mpoukou">Arr. 5 Mongo-Mpoukou</option>
                    <option value="Ngoyo, Arrondissement 6">Arr. 6 Ngoyo (Côte Sauvage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Repère ou Rue Précise</label>
                  <input
                    type="text"
                    placeholder="Ex: Face Pharmacie, Vers l'École..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-[#006d2f] focus:outline-none"
                  />
                </div>
              </div>

              {/* 🛡️ Alerte Anti-Collision Live */}
              {collisionWarning && collisionWarning.hasCollision && (
                <div className="p-3.5 bg-red-50 border-2 border-red-400 rounded-xl text-xs text-red-900 shadow-md animate-pulse">
                  <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
                    <span className="material-symbols-outlined text-red-600 text-xl">shield</span>
                    <span>ATTENTION : ÉTABLISSEMENT DÉJÀ ATTRIBUÉ À UN COLLÈGUE</span>
                  </div>
                  <p className="mt-1 text-xs text-red-700 leading-relaxed">
                    {collisionWarning.collisionReason}
                  </p>
                  <div className="mt-2 text-xs font-semibold bg-red-100/90 p-2 rounded-lg border border-red-300 flex items-center justify-between">
                    <span>Agent responsable : <strong className="text-red-900">{collisionWarning.assignedAgentName}</strong></span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-red-300">
                      Matricule: {collisionWarning.assignedAgentBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-700 font-bold mt-2">
                    ⛔ CONTRÔLE ANTI-COLLISION : Vous ne devez pas intervenir ni programmer ce dossier. Seul l'agent en charge ou la Direction peut le gérer.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Type d'activité & barème */}
            <div className="bg-[#fdfaf5] p-3.5 rounded-xl border border-[#f3e5ab] space-y-3">
              <div className="flex items-center gap-2 text-[#b45309] font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">category</span>
                <span>2. Secteur et Régime Fiscal des Loisirs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSector('informal')}
                    className={`flex-1 p-2.5 rounded-xl border font-bold text-xs text-left cursor-pointer transition-all ${
                      newSector === 'informal'
                        ? 'bg-[#fff7ed] border-[#ea580c] text-[#c2410c] shadow-xs ring-2 ring-[#fed7aa]'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">handshake</span>
                      <span>Secteur Informel</span>
                    </div>
                    <span className="text-[10px] block opacity-80 mt-0.5">Forfait négocié sur le terrain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSector('formal')}
                    className={`flex-1 p-2.5 rounded-xl border font-bold text-xs text-left cursor-pointer transition-all ${
                      newSector === 'formal'
                        ? 'bg-[#f0f9ff] border-[#0284c7] text-[#0369a1] shadow-xs ring-2 ring-[#bae6fd]'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">corporate_fare</span>
                      <span>Secteur Formel</span>
                    </div>
                    <span className="text-[10px] block opacity-80 mt-0.5">RCCM + Barème superficie m²</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Catégorie d'Activité</label>
                  <select
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-semibold text-sm"
                  >
                    <option value="ACT-BAR">Bar Standard / Nganda (1 200 F/m²)</option>
                    <option value="ACT-CLUB">Boîte de Nuit / Discothèque (2 500 F/m²)</option>
                    <option value="ACT-VIP">VIP Lounge / Salons Privés (3 000 F/m²)</option>
                    <option value="ACT-REST">Restaurant Traditionnel / Maquis (1 500 F/m²)</option>
                    <option value="ACT-TERR">Terrasse Plein Air (800 F/m²)</option>
                    <option value="ACT-HOTEL">Hôtel / Résidence Touristique (3 500 F/m²)</option>
                    <option value="ACT-AUB">Auberge de Nuitée (1 800 F/m²)</option>
                  </select>
                </div>
              </div>

              {newSector === 'informal' ? (
                <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-xl border border-orange-100">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                      Montant Forfaitaire Négocié (FCFA)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={newNegotiatedPenalty}
                      onChange={(e) => setNewNegotiatedPenalty(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold text-sm text-[#c2410c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Superficie estimée</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={newSurface}
                        onChange={(e) => setNewSurface(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold text-sm"
                      />
                      <span className="text-xs text-gray-500 font-bold">m²</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-xl border border-sky-100">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Numéro RCCM / NIU</label>
                    <input
                      type="text"
                      placeholder="CG-PNR-..."
                      value={newRccm}
                      onChange={(e) => setNewRccm(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold text-sm text-[#0369a1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Superficie mesurée (m²)</label>
                    <input
                      type="number"
                      value={newSurface}
                      onChange={(e) => setNewSurface(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. FIXATION MANUELLE DU DÉLAI / CONVOCATION AU BUREAU (POINT CLÉ DEMANDÉ PAR L'UTILISATEUR) */}
            <div className="bg-gradient-to-br from-[#f0fdf4] to-[#e6f9ee] p-4 rounded-xl border-2 border-[#16a34a] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#16a34a] text-xl font-bold">event_available</span>
                  <span className="font-bold text-[#065f46] text-xs uppercase tracking-wider">
                    3. FIXATION MANUELLE DE LA DATE DU RENDEZ-VOUS AU BUREAU
                  </span>
                </div>
                <span className="bg-[#16a34a] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  SAISIE MANUELLE OBLIGATOIRE
                </span>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed font-sans">
                👉 <em>« C&apos;est vous qui fixez manuellement le jour et l&apos;heure auxquels le tenancier doit impérativement se présenter au bureau de la Direction Départementale. »</em>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#022448] mb-1">
                    Date Manuelle de Présentation au Bureau <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={manualConvocationDate}
                    onChange={(e) => setManualConvocationDate(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#16a34a] rounded-xl font-bold text-sm text-[#022448] shadow-xs focus:ring-2 focus:ring-[#16a34a] focus:outline-none"
                  />
                  {/* Boutons d'ajustement rapide modifiables manuellement */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-500 self-center">Ajuster vite :</span>
                    <button
                      type="button"
                      onClick={() => setQuickConvocationOffset(1, '09:00')}
                      className="text-[10px] font-bold bg-white text-[#065f46] border border-[#86efac] px-2 py-0.5 rounded-md hover:bg-[#dcfce7] cursor-pointer"
                    >
                      Demain 09h00
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickConvocationOffset(2, '09:30')}
                      className="text-[10px] font-bold bg-white text-[#065f46] border border-[#86efac] px-2 py-0.5 rounded-md hover:bg-[#dcfce7] cursor-pointer"
                    >
                      Dans 48h
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickConvocationOffset(3, '10:00')}
                      className="text-[10px] font-bold bg-white text-[#065f46] border border-[#86efac] px-2 py-0.5 rounded-md hover:bg-[#dcfce7] cursor-pointer"
                    >
                      Dans 3 jours
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickConvocationOffset(7, '09:30')}
                      className="text-[10px] font-bold bg-white text-[#065f46] border border-[#86efac] px-2 py-0.5 rounded-md hover:bg-[#dcfce7] cursor-pointer"
                    >
                      Dans 7 jours
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#022448] mb-1">
                    Heure Précise Fixée <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={manualConvocationTime}
                    onChange={(e) => setManualConvocationTime(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#16a34a] rounded-xl font-bold text-sm text-[#022448] shadow-xs focus:ring-2 focus:ring-[#16a34a] focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['08:30', '09:00', '10:00', '11:30', '14:00', '15:00'].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setManualConvocationTime(h)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                          manualConvocationTime === h
                            ? 'bg-[#16a34a] text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#022448] mb-1">
                  Bureau d'Accueil &amp; Adresse Officielle à Mentionner sur la Convocation
                </label>
                <input
                  type="text"
                  value={manualOfficeService}
                  onChange={(e) => setManualOfficeService(e.target.value)}
                  className="w-full p-2 bg-white border border-[#86efac] rounded-lg text-xs font-medium text-gray-800"
                />
              </div>
            </div>

            {/* Bouton de validation tactile géant */}
            <button
              type="submit"
              disabled={collisionWarning?.hasCollision && collisionWarning?.assignedToOther}
              className={`w-full py-4 rounded-2xl font-sans font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-transform active:scale-98 border-2 ${
                collisionWarning?.hasCollision && collisionWarning?.assignedToOther
                  ? 'bg-gray-400 border-gray-500 text-gray-200 cursor-not-allowed opacity-60'
                  : 'bg-[#006d2f] hover:bg-[#005524] text-white border-[#4ede80]/50'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {collisionWarning?.hasCollision && collisionWarning?.assignedToOther ? 'block' : 'send_and_archive'}
              </span>
              <span>
                {collisionWarning?.hasCollision && collisionWarning?.assignedToOther
                  ? 'Doublon Détecté : Dossier déjà pris en charge'
                  : "Enregistrer l'Établissement & Générer l'Invitation Officielle"}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / FICHE D'INVITATION OFFICIELLE À SE PRÉSENTER AU BUREAU             */}
      {/* ========================================================================= */}
      {generatedConvocation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-[#022448] overflow-hidden my-6">
            {/* Header officiel républicain */}
            <div className="bg-[#022448] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ArmoiriesCongo size={36} />
                <div>
                  <span className="text-[10px] text-[#ffe082] font-black uppercase tracking-widest block">
                    RÉPUBLIQUE DU CONGO • UNR
                  </span>
                  <h3 className="font-garamond text-base sm:text-lg font-bold leading-tight">
                    Invitation &amp; Convocation Officielle à se Présenter au Bureau
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedConvocation(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Corps du document formaté officiel */}
            <div className="p-5 sm:p-6 space-y-4 font-serif text-sm bg-white" id="printable-convocation">
              <div className="text-center border-b pb-3 border-gray-200">
                <p className="font-sans text-[11px] font-bold uppercase text-[#006d2f] tracking-widest">
                  MINISTÈRE DU TOURISME ET DES LOISIRS
                </p>
                <p className="font-garamond text-base font-bold text-[#022448] uppercase">
                  DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
                </p>
                <p className="font-sans text-[11px] font-bold text-gray-600">
                  Service Autorisation et Animation (SAA) • Brigade Mobile de Terrain
                </p>
                <div className="mt-2 inline-block bg-[#022448] text-white px-3 py-1 rounded font-mono text-xs font-bold">
                  RÉF : {generatedConvocation.ref}
                </div>
              </div>

              {/* Destinataire */}
              <div className="p-3 bg-[#f8faff] rounded-xl border border-[#dde2f3] font-sans text-xs space-y-1">
                <div className="text-[10px] uppercase font-bold text-gray-500">Destinataire Notifié sur le Terrain :</div>
                <div className="text-sm font-bold text-[#022448]">
                  M./Mme {generatedConvocation.promoter}
                </div>
                <div>Tenancier(ère) / Exploitant(e) de : <strong>{generatedConvocation.estName}</strong></div>
                <div>Activité : {generatedConvocation.activityLabel} • Régime : Secteur {generatedConvocation.sector === 'formal' ? 'Formel' : 'Informel'}</div>
                <div>Localisation : {generatedConvocation.district} — {generatedConvocation.address}</div>
                <div>Téléphone : <strong>{generatedConvocation.phone}</strong></div>
              </div>

              {/* Rendez-vous fixé manuellement */}
              <div className="p-4 bg-[#f0fdf4] rounded-xl border-2 border-[#16a34a] font-sans text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#16a34a] font-black uppercase text-xs">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                  <span>DATE ET HEURE DU RENDEZ-VOUS FIXÉES AU BUREAU :</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-[#022448] pl-2">
                  📅 <span className="underline decoration-[#16a34a] decoration-2">{generatedConvocation.convocationDateFR}</span> à <span className="text-[#16a34a] font-black">{generatedConvocation.convocationTime}</span>
                </div>
                <div className="text-xs text-gray-700 pl-2">
                  🏢 <strong>Lieu de Présentation :</strong> {generatedConvocation.office}
                </div>
                <div className="text-xs text-gray-700 pl-2">
                  👤 <strong>Agent enquêteur ayant notifié :</strong> {generatedConvocation.agentName} (Matricule: {generatedConvocation.agentBadge})
                </div>
              </div>

              {/* Objet et avertissement légal */}
              <div className="space-y-2 text-xs leading-relaxed text-gray-800">
                <p>
                  <strong>OBJET :</strong> Régularisation administrative de l'établissement, ouverture du dossier de recensement, et fixation/perception de la taxe annuelle d'exploitation des loisirs.
                </p>
                <p>
                  <strong>PIÈCES À APPORTER IMPÉRATIVEMENT :</strong>
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-gray-700 font-sans">
                  <li>Pièce d'identité de l'exploitant (CNI ou Passeport en cours de validité)</li>
                  <li>Registre du Commerce (RCCM) ou Numéro d'Identification Unique (NIU) si disponible</li>
                  <li>Titre d'occupation des lieux (Bail commercial ou Titre foncier)</li>
                  <li>Justificatifs des versements ou acomptes antérieurs éventuels</li>
                </ul>
                <div className="p-2.5 bg-[#fee2e2] rounded-lg border border-[#f87171] text-[#991b1b] text-[11px] font-sans font-bold">
                  ⚠️ AVERTISSEMENT LÉGAL : En cas de non-présentation à la date et à l'heure fixées ci-dessus, la Direction Départementale engagera la procédure de mise en demeure avec fermeture administrative immédiate sous scellés, conformément à la réglementation en vigueur en République du Congo.
                </div>
              </div>

              {/* Signature officielle */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-200 font-sans text-xs">
                <div>
                  <p className="text-gray-500 text-[10px]">L'Agent Notificateur de Terrain :</p>
                  <p className="font-bold text-[#022448] mt-4">{generatedConvocation.agentName}</p>
                  <p className="text-[10px] text-gray-500">Matricule : {generatedConvocation.agentBadge}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px]">Fait à Pointe-Noire, le {generatedConvocation.createdDateFR}</p>
                  <p className="font-bold text-[#022448] mt-4">Pour le Directeur Départemental,</p>
                  <p className="text-[10px] font-bold text-[#006d2f]">Le Chef de Service SAA</p>
                </div>
              </div>
            </div>

            {/* Actions tactiles : Imprimer, Partager WhatsApp, Fermer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <a
                href={generateWhatsAppConvocationLink(generatedConvocation)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-[#25d366] hover:bg-[#128c7e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                <span>Envoyer par WhatsApp au Tenancier</span>
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-[#022448] hover:bg-[#142943] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Imprimer la Convocation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedConvocation(null)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : RECOUVREMENT (AU COMPTANT OU PAR ACOMPTE AVEC PROCHAIN RDV)    */}
      {/* ========================================================================= */}
      {activeTab === 'recouvrement' && (
        <div className="space-y-4">
          {/* Recherche & Sélection rapide d'un établissement */}
          <div className="bg-white rounded-2xl shadow-md p-4 border border-[#dde2f3] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006d2f] text-xl">search</span>
                <span className="font-bold text-[#022448] text-xs uppercase tracking-wider">
                  Rechercher un Établissement à Recouvrer
                </span>
              </div>
              <span className="text-[11px] text-gray-500 font-sans">
                {filteredEstablishments.length} établissement(s) répertorié(s)
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Tapez le nom, promoteur, téléphone ou quartier..."
                value={searchEstQuery}
                onChange={(e) => setSearchEstQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium text-sm focus:ring-2 focus:ring-[#006d2f] focus:outline-none"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                store
              </span>
            </div>

            {/* Liste de résultats compacte et tactile */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-gray-100 pr-1">
              {filteredEstablishments.map((est) => {
                const remaining = Math.max(0, est.totalDue - est.paidAmount);
                const isSettled = remaining === 0 && est.totalDue > 0;
                const isSelected = selectedEstForPay?.id === est.id;

                return (
                  <div
                    key={est.id}
                    onClick={() => handleSelectEstForPay(est)}
                    className={`p-3 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#eafaf1] border-2 border-[#16a34a] shadow-xs'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#022448] truncate">{est.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            isSettled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isSettled ? 'Soldé' : 'En cours'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 truncate">
                        {est.promoter} • {est.phone} • {est.district}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-gray-400">Reste dû</div>
                      <div className={`text-xs font-bold ${isSettled ? 'text-[#006d2f]' : 'text-[#991b1b]'}`}>
                        {remaining.toLocaleString('fr-FR')} F
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulaire d'encaissement quand un établissement est sélectionné */}
          {selectedEstForPay ? (
            <div className="bg-white rounded-2xl shadow-md border border-[#dde2f3] overflow-hidden">
              <div className="bg-[#022448] text-white p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#ffe082] font-black uppercase tracking-wider block">
                    ÉTABLISSEMENT SÉLECTIONNÉ :
                  </span>
                  <h3 className="font-garamond text-lg font-bold leading-tight">
                    {selectedEstForPay.name}
                  </h3>
                  <p className="text-xs text-white/80">
                    {selectedEstForPay.promoter} ({selectedEstForPay.phone}) • {selectedEstForPay.district}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEstForPay(null)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Changer
                </button>
              </div>

              {/* État financier actuel */}
              <div className="grid grid-cols-3 gap-2 bg-[#f8f9ff] p-3 text-center text-xs border-b border-[#dde2f3]">
                <div>
                  <span className="text-gray-400 text-[10px] block">Droit Total Fixé</span>
                  <span className="font-bold text-[#022448] text-sm">
                    {selectedEstForPay.totalDue.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Déjà Perçu</span>
                  <span className="font-bold text-[#006d2f] text-sm">
                    {selectedEstForPay.paidAmount.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Reste à Solder</span>
                  <span className="font-bold text-[#991b1b] text-sm">
                    {Math.max(0, selectedEstForPay.totalDue - selectedEstForPay.paidAmount).toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>

              <form onSubmit={handleExecuteCollect} className="p-4 sm:p-6 space-y-4">
                {/* Choix clair : AU COMPTANT ou PAR ACOMPTE */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#022448]">
                    Modalité de Règlement Aujourd'hui <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => togglePayMode('comptant')}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        payMode === 'comptant'
                          ? 'bg-[#ecfdf5] border-[#10b981] text-[#065f46] shadow-sm ring-2 ring-[#a7f3d0]'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-sm">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>AU COMPTANT</span>
                      </div>
                      <span className="text-[10px] font-normal opacity-85">
                        Paiement intégral immédiat (Solde = 0)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePayMode('acompte')}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        payMode === 'acompte'
                          ? 'bg-[#fffbeb] border-[#f59e0b] text-[#b45309] shadow-sm ring-2 ring-[#fde68a]'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-sm">
                        <span className="material-symbols-outlined text-base">pie_chart</span>
                        <span>PAR ACOMPTE</span>
                      </div>
                      <span className="text-[10px] font-normal opacity-85">
                        Versement partiel + Prochain RDV
                      </span>
                    </button>
                  </div>
                </div>

                {/* Saisie du montant perçu */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#022448]">
                      Montant Perçu sur le Terrain (FCFA) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Reste après ce versement :{' '}
                      <strong className="text-[#991b1b]">
                        {Math.max(0, selectedEstForPay.totalDue - (selectedEstForPay.paidAmount + collectAmount)).toLocaleString('fr-FR')} F
                      </strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full p-3 bg-white border-2 border-[#dde2f3] rounded-xl font-bold text-lg text-[#022448] focus:border-[#006d2f] focus:outline-none"
                  />
                  {/* Boutons d'ajustement rapide */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCollectAmount(Math.max(0, selectedEstForPay.totalDue - selectedEstForPay.paidAmount))
                      }
                      className="text-[10px] font-bold bg-[#eafaf1] text-[#006d2f] border border-[#86efac] px-2.5 py-1 rounded-lg hover:bg-[#d4f5e2] cursor-pointer"
                    >
                      Tout solder ({(selectedEstForPay.totalDue - selectedEstForPay.paidAmount).toLocaleString('fr-FR')} F)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectAmount(25000)}
                      className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-200 cursor-pointer"
                    >
                      25 000 F
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectAmount(50000)}
                      className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-200 cursor-pointer"
                    >
                      50 000 F
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectAmount(100000)}
                      className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-200 cursor-pointer"
                    >
                      100 000 F
                    </button>
                  </div>
                </div>

                {/* CAS 1 : SI COMPTANT OU SOLDE ATTEINT (Calcul automatique N+1 à la date anniversaire) */}
                {selectedEstForPay.paidAmount + collectAmount >= selectedEstForPay.totalDue && selectedEstForPay.totalDue > 0 ? (
                  <div className="p-4 bg-gradient-to-br from-[#ecfdf5] to-[#f0fdf4] border-2 border-[#10b981] rounded-xl text-xs text-[#065f46] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#047857]">
                      <span className="material-symbols-outlined text-2xl text-[#10b981]">celebration</span>
                      <span>EXERCICE ANNUEL ENTIÈREMENT SOLDÉ (100%) !</span>
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-[#a7f3d0] space-y-1 font-sans">
                      <p className="text-[11px] leading-relaxed">
                        📜 <strong>Règle Réglementaire DDL-PN :</strong> L'autorisation d'exploitation touristique est annuelle et renouvelable.
                      </p>
                      <p className="text-[11px]">
                        📅 <strong>Date de son premier versement :</strong>{' '}
                        <span className="font-bold underline text-[#022448]">
                          {getFirstPaymentDate(selectedEstForPay, new Date().toLocaleDateString('fr-FR'))}
                        </span>
                      </p>
                      <p className="text-xs">
                        🔄 <strong>Prochain paiement de l'année suivante (N+1) :</strong>{' '}
                        <span className="font-extrabold text-[#006d2f] text-sm bg-white px-2 py-0.5 rounded border border-[#86efac]">
                          {addOneYear(getFirstPaymentDate(selectedEstForPay, new Date().toLocaleDateString('fr-FR')))}
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-500 italic mt-1">
                        ⚡ Conformément à votre consigne, le renouvellement est programmé automatiquement au jour anniversaire de son tout premier versement !
                      </p>
                    </div>
                  </div>
                ) : (
                  /* CAS 2 : PAR ACOMPTE -> FIXATION MANUELLE DU PROCHAIN RDV */
                  <div className="p-4 bg-[#fffbeb] rounded-xl border-2 border-[#f59e0b] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#b45309] text-xl">event_upcoming</span>
                        <span className="font-bold text-[#b45309] text-xs uppercase tracking-wider">
                          PROCHAIN RENDEZ-VOUS CONVENU (FIXATION MANUELLE)
                        </span>
                      </div>
                      <span className="text-[10px] bg-[#f59e0b] text-white font-bold px-2 py-0.5 rounded">
                        OBLIGATOIRE
                      </span>
                    </div>

                    {/* Choix de la modalité du prochain RDV (Demande explicite) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Modalité du Prochain Rendez-vous :
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNextRdvType('BUREAU')}
                          className={`p-2.5 rounded-xl border-2 font-bold text-xs text-left cursor-pointer transition-all flex items-center gap-2 ${
                            nextRdvType === 'BUREAU'
                              ? 'bg-white border-[#022448] text-[#022448] shadow-xs'
                              : 'bg-white/60 border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl text-[#022448]">domain</span>
                          <div>
                            <span className="block font-bold">Le Tenancier Vient au Bureau</span>
                            <span className="text-[10px] font-normal text-gray-500">Pour régulariser au SAA</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNextRdvType('TERRAIN')}
                          className={`p-2.5 rounded-xl border-2 font-bold text-xs text-left cursor-pointer transition-all flex items-center gap-2 ${
                            nextRdvType === 'TERRAIN'
                              ? 'bg-white border-[#006d2f] text-[#006d2f] shadow-xs'
                              : 'bg-white/60 border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl text-[#006d2f]">directions_walk</span>
                          <div>
                            <span className="block font-bold">L'Agent Repasse sur Place</span>
                            <span className="text-[10px] font-normal text-gray-500">Pour second recouvrement</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Date et Heure fixées MANUELLEMENT */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1">
                          Date du Prochain RDV (Fixée Manuellement) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={manualNextDate}
                          onChange={(e) => setManualNextDate(e.target.value)}
                          className="w-full p-2 bg-white border-2 border-[#f59e0b] rounded-xl font-bold text-sm text-[#022448] focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setQuickNextDateOffset(7)}
                            className="text-[10px] font-semibold bg-white text-gray-700 border border-gray-300 px-2 py-0.5 rounded cursor-pointer"
                          >
                            +7 jours
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickNextDateOffset(14)}
                            className="text-[10px] font-semibold bg-white text-gray-700 border border-gray-300 px-2 py-0.5 rounded cursor-pointer"
                          >
                            +14 jours
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickNextDateOffset(21)}
                            className="text-[10px] font-semibold bg-white text-gray-700 border border-gray-300 px-2 py-0.5 rounded cursor-pointer"
                          >
                            +21 jours
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickNextDateOffset(30)}
                            className="text-[10px] font-semibold bg-white text-gray-700 border border-gray-300 px-2 py-0.5 rounded cursor-pointer"
                          >
                            +1 mois
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1">
                          Heure du Prochain RDV <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={manualNextTime}
                          onChange={(e) => setManualNextTime(e.target.value)}
                          className="w-full p-2 bg-white border-2 border-[#f59e0b] rounded-xl font-bold text-sm text-[#022448] focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Note / Observation (facultatif)..."
                          value={manualNextNote}
                          onChange={(e) => setManualNextNote(e.target.value)}
                          className="w-full mt-2 p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode de règlement & Canal */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Moyen de Paiement</label>
                    <select
                      value={paymentChannel}
                      onChange={(e) => setPaymentChannel(e.target.value as any)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold"
                    >
                      <option value="ESPECES">Espèces (Cash Régi)</option>
                      <option value="AIRTEL_MONEY">Airtel Money</option>
                      <option value="MTN_MOMO">MTN Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Lieu de Perception</label>
                    <select
                      value={collectLocation}
                      onChange={(e) => setCollectLocation(e.target.value as any)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold"
                    >
                      <option value="TERRAIN">Sur le Terrain (Visite SAA)</option>
                      <option value="DIRECTION">Au Bureau (Direction DDL-PN)</option>
                    </select>
                  </div>
                </div>

                {/* Bouton tactile géant pour valider et émettre quittance */}
                <button
                  type="submit"
                  className="w-full py-4 bg-[#006d2f] hover:bg-[#005223] text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-transform active:scale-98 border-2 border-[#4ede80]/50"
                >
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                  <span>Encaisser {collectAmount.toLocaleString('fr-FR')} F &amp; Émettre la Quittance</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#f8faff] rounded-2xl p-8 text-center border-2 border-dashed border-[#dde2f3] space-y-2">
              <span className="material-symbols-outlined text-4xl text-gray-400">touch_app</span>
              <p className="font-bold text-gray-700 text-sm">
                Veuillez sélectionner un établissement dans la liste ci-dessus pour procéder à l'encaissement.
              </p>
              <p className="text-xs text-gray-500">
                Vous pourrez choisir un paiement au comptant ou par acompte avec fixation manuelle du prochain rendez-vous.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / QUITTANCE OFFICIELLE D'ENCAISSEMENT                               */}
      {/* ========================================================================= */}
      {generatedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border-2 border-[#006d2f] overflow-hidden my-6">
            <div className="bg-[#004528] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogoDDLPN size={36} />
                <div>
                  <span className="text-[10px] text-[#a8f3c3] font-black uppercase tracking-wider block">
                    QUITTANCE OFFICIELLE D'ENCAISSEMENT
                  </span>
                  <h3 className="font-garamond text-base sm:text-lg font-bold leading-tight">
                    Réf : {generatedReceipt.receiptRef}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedReceipt(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Corps du reçu */}
            <div className="p-5 sm:p-6 space-y-4 font-sans text-xs bg-white" id="printable-receipt">
              <div className="text-center border-b pb-3 border-gray-200">
                <p className="text-[10px] font-bold uppercase text-[#006d2f] tracking-widest">
                  RÉPUBLIQUE DU CONGO • MINISTÈRE DU TOURISME ET DES LOISIRS
                </p>
                <p className="font-garamond text-sm sm:text-base font-bold text-[#022448]">
                  Direction Départementale du Tourisme et des Loisirs de Pointe-Noire
                </p>
                <p className="text-[10px] text-gray-500">Régie des Recettes &bull; Quittance Officielle Sécurisée</p>
              </div>

              <div className="bg-[#f0fdf4] p-3.5 rounded-xl border border-[#bbf7d0] space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#15803d]">Établissement &amp; Promoteur :</div>
                <div className="text-sm font-bold text-[#022448]">{generatedReceipt.estName}</div>
                <div>Promoteur : <strong>{generatedReceipt.promoter}</strong> • Tél : {generatedReceipt.phone}</div>
                <div>Lieu : {generatedReceipt.district}</div>
              </div>

              {/* Montant encaissé */}
              <div className="p-4 bg-[#f8faff] rounded-xl border-2 border-[#022448] text-center space-y-1">
                <span className="text-gray-500 text-[10px] uppercase font-bold block">Montant Encaissé ce Jour :</span>
                <span className="font-mono text-2xl sm:text-3xl font-black text-[#006d2f] block">
                  {generatedReceipt.amountPaid.toLocaleString('fr-FR')} FCFA
                </span>
                <p className="text-[11px] text-gray-600 italic">« {generatedReceipt.amountInWords} »</p>
                <div className="pt-2 flex justify-center gap-3 text-[11px] text-gray-500 border-t border-gray-200 mt-2">
                  <span>Moyen : <strong>{generatedReceipt.payMethod}</strong></span>
                  <span>&bull;</span>
                  <span>Canal : <strong>{generatedReceipt.location}</strong></span>
                </div>
              </div>

              {/* Solde restant & Prochaine étape */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 text-[10px] block">Droit Total Fixé</span>
                  <span className="font-bold text-[#022448]">
                    {generatedReceipt.totalDue.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 text-[10px] block">Solde Restant à Payer</span>
                  <span className={`font-bold ${generatedReceipt.balanceRemaining === 0 ? 'text-[#006d2f]' : 'text-[#991b1b]'}`}>
                    {generatedReceipt.balanceRemaining.toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>

              {/* Prochain RDV manuel OU Taxe Année Suivante */}
              {generatedReceipt.isFullySettled ? (
                <div className="p-3 bg-[#ecfdf5] rounded-xl border-2 border-[#10b981] space-y-1 text-center">
                  <div className="text-xs font-bold text-[#065f46]">
                    🎉 EXERCICE ANNUEL ENTIÈREMENT SOLDÉ (100%) !
                  </div>
                  <div className="text-[11px] text-gray-700">
                    Prochaine taxe annuelle due au :{' '}
                    <strong className="text-[#006d2f] underline">
                      {generatedReceipt.nextYearAnniversaryDate}
                    </strong>{' '}
                    (date anniversaire du 1er versement : {generatedReceipt.firstPaymentDate}).
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#fffbeb] rounded-xl border-2 border-[#f59e0b] space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#b45309]">
                    PROCHAIN RENDEZ-VOUS CONVENU (FIXÉ MANUELLEMENT) :
                  </div>
                  <div className="text-xs font-bold text-[#022448]">
                    {generatedReceipt.nextAppointmentType === 'BUREAU'
                      ? '🏢 Le tenancier se présentera au bureau SAA'
                      : "🚶 L'agent de terrain repassera sur place pour le second recouvrement"}
                  </div>
                  <div className="text-xs text-gray-700">
                    📅 Date : <strong>{generatedReceipt.nextAppointmentDateFR}</strong> à <strong>{generatedReceipt.nextAppointmentTime}</strong>
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between items-end pt-3 border-t border-gray-200 text-[11px]">
                <div>
                  <p className="text-gray-400 text-[10px]">Agent Percepteur Assermenté :</p>
                  <p className="font-bold text-[#022448]">{generatedReceipt.agentName}</p>
                  <p className="text-[10px] text-gray-400">{generatedReceipt.dateStr}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-[10px]">Visa du Régisseur :</p>
                  <p className="font-bold text-[#006d2f]">Reçu et Enregistré</p>
                </div>
              </div>
            </div>

            {/* Actions tactiles */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <a
                href={generateWhatsAppReceiptLink(generatedReceipt)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-[#25d366] hover:bg-[#128c7e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                <span>Partager le Reçu par WhatsApp</span>
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-[#022448] hover:bg-[#142943] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Imprimer Quittance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedReceipt(null)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : PLANNING DES RDV & RELANCES (BUREAU vs PASSAGES TERRAIN)       */}
      {/* ========================================================================= */}
      {activeTab === 'planning' && (
        <div className="bg-white rounded-2xl shadow-md border border-[#dde2f3] overflow-hidden p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div>
              <h3 className="font-garamond text-xl font-bold text-[#022448]">
                Planning des Rendez-vous &amp; Relances
              </h3>
              <p className="text-xs text-gray-500">
                Suivi des convocations au bureau, des passages sur le terrain et des dates anniversaires annuelles
              </p>
            </div>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilterPlanningType('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterPlanningType === 'ALL'
                    ? 'bg-[#022448] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({establishments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPlanningType('BUREAU')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 ${
                  filterPlanningType === 'BUREAU'
                    ? 'bg-[#006d2f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">domain</span>
                <span>Au Bureau</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterPlanningType('TERRAIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 ${
                  filterPlanningType === 'TERRAIN'
                    ? 'bg-[#d97706] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">directions_walk</span>
                <span>Passages Terrain</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterPlanningType('SOLDE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 ${
                  filterPlanningType === 'SOLDE'
                    ? 'bg-[#047857] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">event_repeat</span>
                <span>Échéances N+1</span>
              </button>
            </div>
          </div>

          {/* Liste des rendez-vous */}
          <div className="space-y-3">
            {planningList.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Aucun rendez-vous ne correspond à ce filtre.
              </div>
            ) : (
              planningList.map((est) => {
                const remaining = Math.max(0, est.totalDue - est.paidAmount);
                const isSettled = remaining === 0 && est.totalDue > 0;
                const isBureau = est.nextAppointmentType === 'BUREAU' || est.status === 'convoque';

                return (
                  <div
                    key={est.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-[#022448] transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#022448]">{est.name}</span>
                        {isSettled ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            <span>Soldé &bull; Renouvellement Annuel</span>
                          </span>
                        ) : isBureau ? (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">domain</span>
                            <span>Convocation au Bureau</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">directions_walk</span>
                            <span>Second Recouvrement Terrain</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-600">
                        {est.promoter} • <a href={`tel:${est.phone}`} className="text-[#006d2f] underline font-bold">{est.phone}</a> • {est.district}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Date convenue :</span>
                        <span className="font-bold text-[#022448] bg-gray-100 px-2 py-0.5 rounded">
                          📅 {est.nextDueDate} {est.nextAppointmentTime ? `à ${est.nextAppointmentTime}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEstForPay(est);
                          setActiveTab('recouvrement');
                        }}
                        className="px-3.5 py-2 bg-[#006d2f] hover:bg-[#005223] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">payments</span>
                        <span>Encaisser</span>
                      </button>
                      <a
                        href={`tel:${est.phone}`}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center cursor-pointer"
                        title="Appeler le promoteur"
                      >
                        <span className="material-symbols-outlined text-base">call</span>
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 4 : CAISSE DU JOUR & BORDEREAU DE TRANSMISSION                     */}
      {/* ========================================================================= */}
      {activeTab === 'caisse' && (
        <div className="bg-white rounded-2xl shadow-md border border-[#dde2f3] overflow-hidden p-4 sm:p-6 space-y-4">
          <div className="bg-gradient-to-r from-[#022448] to-[#004528] text-white p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-[#ffe082] uppercase font-black tracking-wider block">
                POINT FINANCIER DU JOUR • BRIGADE SAA
              </span>
              <h3 className="font-garamond text-2xl font-bold">
                Caisse de Terrain : {totalCollectedToday.toLocaleString('fr-FR')} FCFA
              </h3>
              <p className="text-xs text-white/80">
                {todayReceipts.length} quittance(s) délivrée(s) aujourd'hui par l'agent {currentAgent.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-[#ffe082] text-[#022448] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Imprimer Bordereau Trésor</span>
            </button>
          </div>

          {/* Liste des quittances du jour */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase text-[#022448] tracking-wider">
              Détail des Encaisses du Jour :
            </h4>
            {todayReceipts.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs bg-gray-50 rounded-xl">
                Aucun encaissement enregistré aujourd'hui pour l'instant.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {todayReceipts.map((rc, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#022448]">{rc.estName}</div>
                      <div className="text-[10px] text-gray-500">
                        Réf : {rc.ref} &bull; {rc.time} &bull; {rc.location === 'TERRAIN' ? 'Sur le Terrain' : 'Au Bureau'}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[#006d2f] text-sm">
                      {rc.amount.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
