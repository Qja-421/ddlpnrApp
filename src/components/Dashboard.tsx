import React, { useState, useMemo, useEffect } from 'react';
import { RepublicSeal, ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';
import { apiFetchEstablishments, FieldEstablishment, subscribeToSupabase } from '../lib/supabase.ts';
import { RecoveryRateChart } from './RecoveryRateChart.tsx';
import type { TabType } from './Navbar.tsx';

export interface DashboardProps {
  onNavigateToTab?: (tab: TabType) => void;
}

export interface MiseEnDemeureAlert {
  id: string;
  establishmentId: string;
  establishmentName: string;
  promoter: string;
  phone: string;
  district: string;
  activityLabel: string;
  sector: 'formal' | 'informal';
  amountDue: number;
  paidAmount: number;
  issueDate: string;
  deadlineDate: string;
  hoursRemaining: number; // negative if overdue
  status: 'EXPIRED' | 'CRITICAL_24H' | 'URGENT_72H' | 'PENDING';
  infractionReason: string;
  agentName: string;
}

export interface RecentCollection {
  id: string;
  receiptRef: string;
  establishmentName: string;
  promoter: string;
  amount: number;
  location: 'TERRAIN' | 'DIRECTION';
  collectedBy: string;
  timestamp: string;
  nextDueDate: string;
}

export interface DistrictMetric {
  district: string;
  totalIdentified: number;
  formalCount: number;
  informalCount: number;
  totalDue: number;
  collectedAmount: number;
}

const initialAlerts: MiseEnDemeureAlert[] = [
  {
    id: 'MED-2026-004',
    establishmentId: 'EST-2026-003',
    establishmentName: 'Terrasse Océan Bleu',
    promoter: 'Hervé Bitemo',
    phone: '+242 06 910 23 45',
    district: 'Côte Sauvage, Arr. 1 Lumumba',
    activityLabel: 'Terrasse Plein Air',
    sector: 'informal',
    amountDue: 168000,
    paidAmount: 0,
    issueDate: '18/03/2026',
    deadlineDate: '25/03/2026 12:00',
    hoursRemaining: -4, // Overdue by 4 hours
    status: 'EXPIRED',
    infractionReason: 'Défaut total de paiement de la pénalité & 2 faux rendez-vous constatés',
    agentName: 'Agent SAA Tchicaya (Badge N° 05)',
  },
  {
    id: 'MED-2026-005',
    establishmentId: 'EST-2026-017',
    establishmentName: 'Nightclub Le Sphinx Rouge',
    promoter: 'Patrick Moukassa',
    phone: '+242 05 667 89 01',
    district: 'Grand Marché, Arr. 2 Mvoumvou',
    activityLabel: 'Nightclub / Discothèque',
    sector: 'formal',
    amountDue: 530000,
    paidAmount: 200000,
    issueDate: '21/03/2026',
    deadlineDate: '26/03/2026 10:00',
    hoursRemaining: 18, // Within 24 hours
    status: 'CRITICAL_24H',
    infractionReason: 'Échéance de la 2e tranche non honorée depuis 15 jours malgré relance',
    agentName: 'Agent SAA Makosso (Badge N° 08)',
  },
  {
    id: 'MED-2026-006',
    establishmentId: 'EST-2026-029',
    establishmentName: 'Nganda Sans Souci',
    promoter: 'Jeanne Makaya',
    phone: '+242 06 880 12 34',
    district: 'Fond Tié-Tié, Arr. 3 Tié-Tié',
    activityLabel: 'Bar Standard / Nganda',
    sector: 'informal',
    amountDue: 142000,
    paidAmount: 40000,
    issueDate: '22/03/2026',
    deadlineDate: '27/03/2026 16:00',
    hoursRemaining: 48, // Within 72 hours
    status: 'URGENT_72H',
    infractionReason: 'Refus initial de recensement et absence au guichet de régularisation',
    agentName: 'Agent SAA Loubaki (Badge N° 12)',
  },
  {
    id: 'MED-2026-007',
    establishmentId: 'EST-2026-042',
    establishmentName: 'Lounge Club Impérial',
    promoter: 'Christian Samba',
    phone: '+242 05 555 43 21',
    district: 'Aéroport, Arr. 1 Lumumba',
    activityLabel: 'VIP Lounge & Salons Privés',
    sector: 'formal',
    amountDue: 490000,
    paidAmount: 150000,
    issueDate: '23/03/2026',
    deadlineDate: '28/03/2026 15:00',
    hoursRemaining: 68,
    status: 'URGENT_72H',
    infractionReason: 'Mesurage de surface contesté sans justificatif - mise en demeure conservatoire',
    agentName: 'Agent SAA Makosso (Badge N° 08)',
  },
];

const initialRecentCollections: RecentCollection[] = [
  {
    id: 'C-01',
    receiptRef: 'REC-DDL-PN-2026-0188',
    establishmentName: 'Le Cercle Privé VIP - Mpita',
    promoter: 'Alain Mambou',
    amount: 150000,
    location: 'TERRAIN',
    collectedBy: 'Agent SAA Makosso',
    timestamp: 'Il y a 14 min (15:32)',
    nextDueDate: '15/04/2026',
  },
  {
    id: 'C-02',
    receiptRef: 'REC-DDL-PN-2026-0187',
    establishmentName: 'Cabaret Live Le Kouilou',
    promoter: 'Benoît Mabiala',
    amount: 195000,
    location: 'DIRECTION',
    collectedBy: 'Régisseur Central DDL-PN',
    timestamp: 'Il y a 42 min (15:04)',
    nextDueDate: 'Solde Intégral Acquis',
  },
  {
    id: 'C-03',
    receiptRef: 'REC-DDL-PN-2026-0186',
    establishmentName: 'Nganda Ambiance Tié-Tié',
    promoter: 'Sylvie Mboungou',
    amount: 86000,
    location: 'TERRAIN',
    collectedBy: 'Agent SAA Loubaki',
    timestamp: 'Il y a 1h 15m (14:31)',
    nextDueDate: '30/03/2026',
  },
  {
    id: 'C-04',
    receiptRef: 'REC-DDL-PN-2026-0185',
    establishmentName: 'Bar Dancing Étoile du Kouilou',
    promoter: 'Gaston Nzoussi',
    amount: 60000,
    location: 'TERRAIN',
    collectedBy: 'Agent SAA Tchicaya',
    timestamp: 'Il y a 2h 40m (13:06)',
    nextDueDate: '10/04/2026',
  },
  {
    id: 'C-05',
    receiptRef: 'REC-DDL-PN-2026-0184',
    establishmentName: 'Snack Bar La Détente Loandjili',
    promoter: 'Clarisse Pembé',
    amount: 45000,
    location: 'DIRECTION',
    collectedBy: 'Régisseur Central DDL-PN',
    timestamp: 'Il y a 3h 10m (12:36)',
    nextDueDate: '25/04/2026',
  },
];

const districtMetrics: DistrictMetric[] = [
  {
    district: 'Arr. 1 Lumumba (Centre, Mpita, Côte Sauvage)',
    totalIdentified: 48,
    formalCount: 32,
    informalCount: 16,
    totalDue: 11450000,
    collectedAmount: 8200000,
  },
  {
    district: 'Arr. 2 Mvoumvou (Grand Marché, Fond)',
    totalIdentified: 24,
    formalCount: 7,
    informalCount: 17,
    totalDue: 3680000,
    collectedAmount: 2350000,
  },
  {
    district: 'Arr. 3 Tié-Tié (Carrefour Trois Francs, Fond)',
    totalIdentified: 36,
    formalCount: 6,
    informalCount: 30,
    totalDue: 4890000,
    collectedAmount: 2950000,
  },
  {
    district: 'Arr. 4 Loandjili (Faubourgs & Grands Axes)',
    totalIdentified: 18,
    formalCount: 4,
    informalCount: 14,
    totalDue: 2150000,
    collectedAmount: 1350000,
  },
  {
    district: 'Arr. 6 Ngoyo (Zone Touristique & Résidentielle)',
    totalIdentified: 14,
    formalCount: 8,
    informalCount: 6,
    totalDue: 2480000,
    collectedAmount: 1820000,
  },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTab }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [alerts, setAlerts] = useState<MiseEnDemeureAlert[]>(initialAlerts);
  const [recentCollections] = useState<RecentCollection[]>(initialRecentCollections);
  const [activeFilterStatus, setActiveFilterStatus] = useState<'ALL' | 'EXPIRED' | 'CRITICAL' | 'URGENT'>('ALL');
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<MiseEnDemeureAlert | null>(null);
  const [actionModalType, setActionModalType] = useState<'CLOSURE_ORDER' | 'PAYMENT_RECEIPT' | 'MORATORIUM' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveEstablishments, setLiveEstablishments] = useState<FieldEstablishment[]>([]);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

  // Load establishments from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const res = await apiFetchEstablishments([]);
      if (isMounted && res.data.length > 0) {
        setLiveEstablishments(res.data);
        setIsSupabaseLive(res.isSupabase);
      }
    };
    load();

    const unsubscribe = subscribeToSupabase('establishments', () => {
      load();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Live simulation tick indicator
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('À l\'instant (Synchro Supabase)');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalIdentified = districtMetrics.reduce((acc, d) => acc + d.totalIdentified, 0);
    let totalFormal = districtMetrics.reduce((acc, d) => acc + d.formalCount, 0);
    let totalInformal = districtMetrics.reduce((acc, d) => acc + d.informalCount, 0);
    let totalLiquidated = districtMetrics.reduce((acc, d) => acc + d.totalDue, 0);
    let totalCollected = districtMetrics.reduce((acc, d) => acc + d.collectedAmount, 0);

    if (liveEstablishments.length > 0) {
      totalIdentified = liveEstablishments.length;
      totalFormal = liveEstablishments.filter((e) => e.sector === 'formal').length;
      totalInformal = liveEstablishments.filter((e) => e.sector === 'informal').length;
      const liveCollected = liveEstablishments.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
      const liveDue = liveEstablishments.reduce((sum, e) => sum + (e.totalDue || 0), 0);
      if (liveCollected > 0) totalCollected = liveCollected;
      if (liveDue > 0) totalLiquidated = liveDue;
    }

    const remainingToCollect = Math.max(0, totalLiquidated - totalCollected);
    const recoveryRate = totalLiquidated > 0 ? Math.round((totalCollected / totalLiquidated) * 100) : 0;

    const expiredCount = alerts.filter((a) => a.status === 'EXPIRED').length;
    const criticalCount = alerts.filter((a) => a.status === 'CRITICAL_24H').length;
    const urgentCount = alerts.filter((a) => a.status === 'URGENT_72H').length;
    const totalActiveAlerts = alerts.length;

    // Field vs Direction collection split
    const fieldCollected = Math.round(totalCollected * 0.64);
    const directionCollected = totalCollected - fieldCollected;

    return {
      totalIdentified,
      totalFormal,
      totalInformal,
      totalLiquidated,
      totalCollected,
      remainingToCollect,
      recoveryRate,
      expiredCount,
      criticalCount,
      urgentCount,
      totalActiveAlerts,
      fieldCollected,
      directionCollected,
    };
  }, [alerts, liveEstablishments]);

  // Filtered alerts
  const filteredAlerts = alerts.filter((item) => {
    if (activeFilterStatus === 'ALL') return true;
    if (activeFilterStatus === 'EXPIRED') return item.status === 'EXPIRED';
    if (activeFilterStatus === 'CRITICAL') return item.status === 'CRITICAL_24H';
    if (activeFilterStatus === 'URGENT') return item.status === 'URGENT_72H';
    return true;
  });

  // Action: Pronounce closure
  const handleConfirmClosure = (alert: MiseEnDemeureAlert) => {
    setAlerts(alerts.filter((a) => a.id !== alert.id));
    setSelectedAlertForAction(null);
    setActionModalType(null);
    showToast(`ARRÊTÉ DE FERMETURE n° 2026/DDL-PN prononcé pour « ${alert.establishmentName} ». Force Publique requise.`);
  };

  // Action: Grant moratorium (+48h)
  const handleGrantMoratorium = (alert: MiseEnDemeureAlert) => {
    setAlerts(
      alerts.map((a) =>
        a.id === alert.id
          ? {
              ...a,
              status: 'URGENT_72H',
              hoursRemaining: a.hoursRemaining + 48,
              deadlineDate: 'Prolongation accordée (+48h)',
            }
          : a,
      ),
    );
    setSelectedAlertForAction(null);
    setActionModalType(null);
    showToast(`Moratoire exceptionnel de 48 heures accordé au promoteur ${alert.promoter}.`);
  };

  // Action: Regularize payment
  const handleResolvePayment = (alert: MiseEnDemeureAlert) => {
    setAlerts(alerts.filter((a) => a.id !== alert.id));
    setSelectedAlertForAction(null);
    setActionModalType(null);
    showToast(`Paiement de régularisation enregistré pour « ${alert.establishmentName} ». Mise en demeure levée !`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#004528] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-[#006d2f] text-sm font-sans animate-bounce">
          <span className="material-symbols-outlined text-[#4ede80] text-[22px]">verified</span>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Strategic Header Banner */}
      <div className="bg-gradient-to-r from-[#022448] via-[#043366] to-[#004528] text-white rounded-xl shadow-lg p-5 sm:p-6 border-b-4 border-[#006d2f]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-md" title="Armoiries Officielles de la République du Congo">
                <ArmoiriesCongo size={48} />
              </div>
              <div className="w-14 h-14 rounded-xl bg-[#004528] p-1 flex items-center justify-center border border-white/20 shadow-md" title="Logo Officiel de la Direction Départementale des Loisirs de Pointe-Noire">
                <LogoDDLPN size={48} />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest bg-[#006d2f] text-[#a8f3c3] px-2.5 py-0.5 rounded">
                  Tableau de Bord Exécutif
                </span>
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest bg-white/10 text-white/90 px-2 py-0.5 rounded border border-white/20">
                  DDL-PN • MCAPNIT
                </span>
                <span className={`flex items-center gap-1.5 text-[11px] font-sans font-bold px-2.5 py-0.5 rounded shadow-sm ${
                  isSupabaseLive ? 'text-[#a7f3d0] bg-[#065f46] border border-[#34d399]/40' : 'text-[#4ede80] bg-[#004528]/90'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isSupabaseLive ? 'bg-[#34d399]' : 'bg-[#4ede80]'} animate-pulse`}></span>
                  <span>{isSupabaseLive ? `Supabase Connecté (${liveEstablishments.length} établissements)` : 'Flux Temps Réel SAA / SAFM'}</span>
                </span>
              </div>
              <h1 className="font-garamond text-2xl sm:text-3xl font-bold text-white mt-1">
                Indicateurs Clés de Performance &amp; Contrôle du Recouvrement
              </h1>
              <p className="font-serif text-[13px] text-white/80 italic mt-0.5">
                Surveillance continue du parc des loisirs, liquidation fiscale en direct et gestion proactive des mises en demeure sous délai de rigueur.
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Selector */}
            <div className="bg-white/10 p-1 rounded-lg flex items-center gap-1 border border-white/15 text-xs font-sans">
              <button
                type="button"
                onClick={() => setPeriod('day')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  period === 'day' ? 'bg-white text-[#022448] shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                Jour
              </button>
              <button
                type="button"
                onClick={() => setPeriod('week')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  period === 'week' ? 'bg-white text-[#022448] shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                Semaine
              </button>
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  period === 'month' ? 'bg-white text-[#022448] shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                Mois
              </button>
              <button
                type="button"
                onClick={() => setPeriod('year')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  period === 'year' ? 'bg-white text-[#022448] shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                Année 2026
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab && onNavigateToTab('rapport-trimestriel')}
              className="bg-[#006d2f] hover:bg-[#005322] text-white font-sans text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer border border-[#80f899]/30"
              title="Générer et imprimer le rapport trimestriel officiel destiné à la Direction Générale et au Cabinet du Préfet"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Rapport Trimestriel A4</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLastRefreshTime(`Actualisé à ${new Date().toLocaleTimeString('fr-FR')}`);
                showToast('Données synchronisées avec le serveur central de la Direction.');
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-bold px-3 py-2 rounded-lg border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Status sub-line */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between text-[11px] font-sans text-white/75">
          <div className="flex items-center gap-4">
            <span>
              Directeur Dép. : <strong className="text-white">Jean Richard NTSEKE NGOUAKA</strong>
            </span>
            <span>•</span>
            <span>
              Chef de Service SAA : <strong className="text-white">Jacques Alphonse MATOKO</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#a8f3c3]">
            <span className="material-symbols-outlined text-[14px]">cell_tower</span>
            <span>{lastRefreshTime}</span>
          </div>
        </div>
      </div>

      {/* 3 HIGHLIGHT METRICS HERO CARDS (The User's Core Request) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: NOMBRE D'ÉTABLISSEMENTS IDENTIFIÉS */}
        <div className="bg-white rounded-xl shadow-sm border border-[#dde2f3] p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#e3e8f9]/50 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#43474e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#022448] text-[18px]">storefront</span>
                Établissements Identifiés
              </span>
              <span className="font-sans text-[10px] font-bold bg-[#e3e8f9] text-[#022448] px-2 py-0.5 rounded">
                Recensement SAA
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-garamond text-4xl sm:text-5xl font-bold text-[#022448]">
                {stats.totalIdentified}
              </span>
              <span className="font-sans text-xs font-bold text-[#006d2f] bg-[#dcfce7] px-2 py-0.5 rounded">
                +14 cette semaine
              </span>
            </div>
            <p className="font-sans text-xs text-[#43474e] mt-1">
              Établissements de loisirs géolocalisés et inscrits au cadastre de Pointe-Noire.
            </p>

            {/* Split Formel vs Informel */}
            <div className="mt-4 pt-3 border-t border-[#edf0fa] grid grid-cols-2 gap-2 text-xs font-sans">
              <div className="bg-[#f0f9ff] p-2.5 rounded-lg border border-[#bae6fd]">
                <span className="text-[#0369a1] block text-[10px] uppercase font-bold">Piste Formelle (RCCM)</span>
                <span className="font-mono font-bold text-sm text-[#0c4a6e]">{stats.totalFormal}</span>
                <span className="text-[10px] text-[#0369a1] block">
                  ({Math.round((stats.totalFormal / stats.totalIdentified) * 100)}% du parc)
                </span>
              </div>
              <div className="bg-[#fff7ed] p-2.5 rounded-lg border border-[#fed7aa]">
                <span className="text-[#c2410c] block text-[10px] uppercase font-bold">Piste Informelle (Pénalité)</span>
                <span className="font-mono font-bold text-sm text-[#9a3412]">{stats.totalInformal}</span>
                <span className="text-[10px] text-[#c2410c] block">
                  ({Math.round((stats.totalInformal / stats.totalIdentified) * 100)}% du parc)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs font-sans">
            <span className="text-[#747783]">Objectif PTA Annuel : 160</span>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('terrain')}
                className="text-[#022448] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Accéder au terrain</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI 2: MONTANTS RECOUVRÉS EN TEMPS RÉEL */}
        <div className="bg-white rounded-xl shadow-sm border border-[#dde2f3] p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#dcfce7]/50 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#004528] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006d2f] text-[18px]">payments</span>
                Recouvré en Temps Réel
              </span>
              <span className="font-sans text-[10px] font-bold bg-[#dcfce7] text-[#006d2f] px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006d2f] animate-ping"></span>
                En direct
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-garamond text-3xl sm:text-4xl font-bold text-[#004528] tracking-tight">
                {stats.totalCollected.toLocaleString('fr-FR')}
              </span>
              <span className="font-sans text-sm font-bold text-[#004528]">FCFA</span>
            </div>

            {/* Recovery Progress Bar */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px] font-sans font-semibold">
                <span className="text-[#006d2f]">Taux d'encaissement : {stats.recoveryRate}%</span>
                <span className="text-[#747783]">
                  Sur {stats.totalLiquidated.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="w-full bg-[#e6f4ea] h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#006d2f] h-full transition-all duration-700"
                  style={{ width: `${stats.recoveryRate}%` }}
                ></div>
              </div>
            </div>

            {/* Split Terrain vs Guichet Direction */}
            <div className="mt-4 pt-3 border-t border-[#edf0fa] grid grid-cols-2 gap-2 text-xs font-sans">
              <div className="bg-[#f2fcf5] p-2.5 rounded-lg border border-[#bbf7d0]">
                <div className="flex items-center gap-1 text-[#15803d]">
                  <span className="material-symbols-outlined text-[14px]">moped</span>
                  <span className="text-[10px] uppercase font-bold">Terrain (SAA Mobile)</span>
                </div>
                <span className="font-mono font-bold text-xs text-[#14532d] block mt-0.5">
                  {stats.fieldCollected.toLocaleString('fr-FR')} FCFA
                </span>
                <span className="text-[10px] text-[#15803d]">64% des encaissements</span>
              </div>

              <div className="bg-[#f0f4ff] p-2.5 rounded-lg border border-[#c7d2fe]">
                <div className="flex items-center gap-1 text-[#3730a3]">
                  <span className="material-symbols-outlined text-[14px]">account_balance</span>
                  <span className="text-[10px] uppercase font-bold">Guichet Central</span>
                </div>
                <span className="font-mono font-bold text-xs text-[#1e1b4b] block mt-0.5">
                  {stats.directionCollected.toLocaleString('fr-FR')} FCFA
                </span>
                <span className="text-[10px] text-[#3730a3]">36% des encaissements</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs font-sans">
            <span className="text-[#c2410c] font-bold">
              Reste : {stats.remainingToCollect.toLocaleString('fr-FR')} FCFA
            </span>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('tarifs')}
                className="text-[#004528] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Barème &amp; Simulateur</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI 3: ALERTES SUR LES MISES EN DEMEURE */}
        <div className="bg-white rounded-xl shadow-sm border border-[#dde2f3] p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#fee2e2]/50 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#b91c1c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#dc2626] text-[18px]">warning</span>
                Alertes Mises en Demeure
              </span>
              <span className="font-sans text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
                Délai de rigueur
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-garamond text-4xl sm:text-5xl font-bold text-[#b91c1c]">
                {stats.totalActiveAlerts}
              </span>
              <span className="font-sans text-xs font-bold text-white bg-[#dc2626] px-2 py-0.5 rounded">
                Sous surveillance
              </span>
            </div>
            <p className="font-sans text-xs text-[#43474e] mt-1">
              Dossiers avec actes officiels de sommation pour non-paiement ou récidive.
            </p>

            {/* Alert Severity Breakdown */}
            <div className="mt-4 pt-3 border-t border-[#edf0fa] grid grid-cols-3 gap-1.5 text-center text-xs font-sans">
              <div className="bg-[#450a0a] text-white p-2 rounded-lg">
                <span className="font-mono font-bold text-base block leading-tight">{stats.expiredCount}</span>
                <span className="text-[9px] uppercase font-bold tracking-tighter opacity-90">Échue / Fermeture</span>
              </div>
              <div className="bg-[#fee2e2] text-[#991b1b] p-2 rounded-lg border border-[#fca5a5]">
                <span className="font-mono font-bold text-base block leading-tight">{stats.criticalCount}</span>
                <span className="text-[9px] uppercase font-bold tracking-tighter">&lt; 24h restantes</span>
              </div>
              <div className="bg-[#ffedd5] text-[#9a3412] p-2 rounded-lg border border-[#fed7aa]">
                <span className="font-mono font-bold text-base block leading-tight">{stats.urgentCount}</span>
                <span className="text-[9px] uppercase font-bold tracking-tighter">&lt; 72h restantes</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs font-sans">
            <span className="text-[#dc2626] font-bold">1 arrêté de fermeture requis</span>
            <a
              href="#section-alertes-mises-en-demeure"
              className="text-[#b91c1c] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Voir les sommations</span>
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            </a>
          </div>
        </div>
      </div>

      {/* GRAPHIQUE EN BARRES RECHARTS : TAUX DE RECOUVREMENT MENSUEL PAR SECTEUR D'ACTIVITÉ */}
      <RecoveryRateChart
        establishments={liveEstablishments}
        onNavigateToTerrain={onNavigateToTab ? () => onNavigateToTab('terrain') : undefined}
      />

      {/* SECTION PRIORITAIRE : TABLEAU D'ALERTES DES MISES EN DEMEURE ARRIVANT À ÉCHÉANCE */}
      <section
        id="section-alertes-mises-en-demeure"
        className="bg-white rounded-xl shadow-sm border border-[#dde2f3] overflow-hidden"
      >
        {/* Section Header */}
        <div className="px-6 py-4 bg-[#fbfbfe] border-b border-[#dde2f3] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">notification_important</span>
            </div>
            <div>
              <h2 className="font-garamond text-xl font-bold text-[#022448] flex items-center gap-2">
                <span>Registre Actif des Mises en Demeure &amp; Délais de Rigueur</span>
                <span className="text-xs font-sans font-bold bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 rounded-full">
                  {filteredAlerts.length} sommation(s)
                </span>
              </h2>
              <p className="font-sans text-xs text-[#43474e]">
                Surveillance stricte des délais d'expiration avant déclenchement de la fermeture administrative avec concours de la Force Publique.
              </p>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 font-sans text-xs">
            <button
              type="button"
              onClick={() => setActiveFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                activeFilterStatus === 'ALL'
                  ? 'bg-[#022448] text-white shadow-sm'
                  : 'bg-[#f1f3ff] text-[#43474e] hover:bg-[#e4e7f3]'
              }`}
            >
              Toutes ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterStatus('EXPIRED')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilterStatus === 'EXPIRED'
                  ? 'bg-[#450a0a] text-white shadow-sm'
                  : 'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]'
              }`}
            >
              <span>Échues ({stats.expiredCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterStatus('CRITICAL')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                activeFilterStatus === 'CRITICAL'
                  ? 'bg-[#dc2626] text-white shadow-sm'
                  : 'bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]'
              }`}
            >
              &lt; 24h ({stats.criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterStatus('URGENT')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                activeFilterStatus === 'URGENT'
                  ? 'bg-[#c2410c] text-white shadow-sm'
                  : 'bg-[#fff7ed] text-[#c2410c] hover:bg-[#ffedd5]'
              }`}
            >
              &lt; 72h ({stats.urgentCount})
            </button>
          </div>
        </div>

        {/* Critical Alert Warning Strip if any is overdue */}
        {stats.expiredCount > 0 && (
          <div className="bg-[#450a0a] text-white px-6 py-3 flex items-center justify-between gap-4 text-xs font-sans">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-[#fca5a5] animate-bounce">gavel</span>
              <span>
                <strong>Alerte Immédiate de Fermeture :</strong> {stats.expiredCount} établissement a dépassé le délai légal imparti sans régulariser sa situation. L'Arrêté de Clôture Administrative doit être signé.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const firstExpired = alerts.find((a) => a.status === 'EXPIRED');
                if (firstExpired) {
                  setSelectedAlertForAction(firstExpired);
                  setActionModalType('CLOSURE_ORDER');
                }
              }}
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-3 py-1 rounded font-bold uppercase tracking-wider text-[10px] shadow-sm transition-colors cursor-pointer shrink-0"
            >
              Dresser Arrêté Immédiat
            </button>
          </div>
        )}

        {/* Alert Cards / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-[#f1f3ff] text-[#43474e] font-bold text-[10px] uppercase border-b border-[#dde2f3]">
              <tr>
                <th className="px-5 py-3">Réf. Mise en Demeure</th>
                <th className="px-5 py-3">Établissement &amp; Promoteur</th>
                <th className="px-5 py-3">Arrondissement</th>
                <th className="px-5 py-3">Motif de la Sommation</th>
                <th className="px-5 py-3 text-right">Reste à Recouvrer</th>
                <th className="px-5 py-3 text-center">Délai Expirant</th>
                <th className="px-5 py-3 text-right">Action Régisseur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0fa]">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#747783] font-serif italic">
                    Aucune mise en demeure correspondant aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item) => {
                  const isExpired = item.status === 'EXPIRED';
                  const isCritical = item.status === 'CRITICAL_24H';
                  const isUrgent = item.status === 'URGENT_72H';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isExpired
                          ? 'bg-[#fff5f5] hover:bg-[#ffebeb]'
                          : isCritical
                          ? 'bg-[#fffbf0] hover:bg-[#fff7e1]'
                          : 'hover:bg-[#f9f9ff]'
                      }`}
                    >
                      {/* Ref */}
                      <td className="px-5 py-3.5 align-middle">
                        <span className="font-mono font-bold text-[11px] text-[#022448] block">{item.id}</span>
                        <span className="text-[10px] text-[#747783]">Émise le {item.issueDate}</span>
                      </td>

                      {/* Name & Promoter */}
                      <td className="px-5 py-3.5 align-middle">
                        <div className="font-serif font-bold text-sm text-[#161c27]">{item.establishmentName}</div>
                        <div className="text-[11px] text-[#43474e]">
                          Promoteur : <strong className="text-[#161c27]">{item.promoter}</strong> • {item.phone}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            item.sector === 'formal' ? 'bg-[#e0f2fe] text-[#0369a1]' : 'bg-[#ffedd5] text-[#c2410c]'
                          }`}
                        >
                          {item.sector === 'formal' ? 'Formel (RCCM)' : 'Secteur Informel'}
                        </span>
                      </td>

                      {/* District */}
                      <td className="px-5 py-3.5 align-middle text-[#43474e]">
                        <span className="font-medium">{item.district}</span>
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-3.5 align-middle max-w-xs">
                        <p className="text-[11px] text-[#161c27] leading-snug line-clamp-2">{item.infractionReason}</p>
                        <span className="text-[10px] text-[#747783] block mt-0.5">Par : {item.agentName}</span>
                      </td>

                      {/* Financial */}
                      <td className="px-5 py-3.5 align-middle text-right font-mono">
                        <span className="font-bold text-sm text-[#b91c1c]">
                          {(item.amountDue - item.paidAmount).toLocaleString('fr-FR')} FCFA
                        </span>
                        <span className="text-[10px] text-[#747783] block">
                          sur {item.amountDue.toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>

                      {/* Countdown badge */}
                      <td className="px-5 py-3.5 align-middle text-center">
                        {isExpired ? (
                          <span className="inline-flex flex-col items-center px-2.5 py-1 rounded bg-[#450a0a] text-white text-[10px] font-bold tracking-tight">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] text-[#fca5a5]">error</span>
                              <span>DÉLAI EXPIRÉ</span>
                            </span>
                            <span className="text-[9px] text-[#fca5a5]">Dépassement +4h</span>
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex flex-col items-center px-2.5 py-1 rounded bg-[#fee2e2] text-[#991b1b] text-[10px] font-bold border border-[#fca5a5]">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] text-[#dc2626] animate-pulse">
                                timer
                              </span>
                              <span>{item.hoursRemaining}h RESTANTES</span>
                            </span>
                            <span className="text-[9px] text-[#b91c1c]">{item.deadlineDate}</span>
                          </span>
                        ) : (
                          <span className="inline-flex flex-col items-center px-2.5 py-1 rounded bg-[#ffedd5] text-[#9a3412] text-[10px] font-bold border border-[#fed7aa]">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] text-[#c2410c]">schedule</span>
                              <span>{item.hoursRemaining}h RESTANTES</span>
                            </span>
                            <span className="text-[9px] text-[#c2410c]">{item.deadlineDate}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isExpired ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAlertForAction(item);
                                setActionModalType('CLOSURE_ORDER');
                              }}
                              className="bg-[#450a0a] hover:bg-[#2e0707] text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                              title="Dresser l'Arrêté de Fermeture Administrative"
                            >
                              <span className="material-symbols-outlined text-[14px]">lock</span>
                              <span>Fermeture</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAlertForAction(item);
                                setActionModalType('MORATORIUM');
                              }}
                              className="bg-white hover:bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Accorder un moratoire"
                            >
                              <span className="material-symbols-outlined text-[13px]">more_time</span>
                              <span>Moratoire</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAlertForAction(item);
                              setActionModalType('PAYMENT_RECEIPT');
                            }}
                            className="bg-[#004528] hover:bg-[#00341e] text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                            title="Encaisser la régularisation et lever la sommation"
                          >
                            <span className="material-symbols-outlined text-[14px]">point_of_sale</span>
                            <span>Encaisser</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TWO COLUMNS: REAL-TIME RECOVERY STREAM & GEOGRAPHICAL DISTRICT BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real-time Live Collections Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-[#dde2f3] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006d2f] text-[20px]">receipt_long</span>
              <h3 className="font-garamond text-lg font-bold text-[#022448]">
                Derniers Encaissements en Temps Réel
              </h3>
            </div>
            <span className="font-sans text-[10px] uppercase font-bold bg-[#dcfce7] text-[#006d2f] px-2 py-0.5 rounded">
              Journal de caisse
            </span>
          </div>

          <div className="space-y-2.5">
            {recentCollections.map((col) => (
              <div
                key={col.id}
                className="p-3 rounded-lg border border-[#edf0fa] hover:bg-[#fbfbfe] transition-colors flex items-center justify-between gap-3 text-xs font-sans"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#022448] bg-[#f1f3ff] px-1.5 py-0.2 rounded">
                      {col.receiptRef}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        col.location === 'TERRAIN' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e0e7ff] text-[#3730a3]'
                      }`}
                    >
                      {col.location === 'TERRAIN' ? 'Terrain Mobile' : 'Direction'}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#161c27]">{col.establishmentName}</h4>
                  <p className="text-[11px] text-[#43474e]">
                    Par {col.collectedBy} • <span className="text-[#006d2f] font-medium">{col.timestamp}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-bold text-[#006d2f] block">
                    +{col.amount.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="text-[10px] text-[#747783] block">
                    Échéance : {col.nextDueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#edf0fa] flex items-center justify-between text-xs font-sans text-[#747783]">
            <span>Total du jour : <strong>536 000 FCFA</strong></span>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('terrain')}
                className="text-[#006d2f] font-bold hover:underline cursor-pointer"
              >
                Ouvrir la caisse SAA &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Right: Geographical & Arrondissements Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-[#dde2f3] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#022448] text-[20px]">map</span>
              <h3 className="font-garamond text-lg font-bold text-[#022448]">
                Ventilation par Arrondissement (Pointe-Noire)
              </h3>
            </div>
            <span className="font-sans text-[10px] uppercase font-bold bg-[#e3e8f9] text-[#022448] px-2 py-0.5 rounded">
              Cadastre Fiscal
            </span>
          </div>

          <div className="space-y-3.5">
            {districtMetrics.map((d, index) => {
              const districtRate = Math.round((d.collectedAmount / d.totalDue) * 100);
              return (
                <div key={index} className="space-y-1 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#161c27]">{d.district}</span>
                      <span className="text-[10px] bg-[#f1f3ff] text-[#43474e] font-semibold px-1.5 py-0.2 rounded">
                        {d.totalIdentified} lieux ({d.formalCount} formels / {d.informalCount} informels)
                      </span>
                    </div>
                    <div className="font-mono text-right">
                      <strong className="text-[#006d2f]">{d.collectedAmount.toLocaleString('fr-FR')} FCFA</strong>
                      <span className="text-[#747783] text-[10px]"> / {d.totalDue.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#edf0fa] h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#022448] h-full rounded-full transition-all duration-500"
                        style={{ width: `${districtRate}%` }}
                      ></div>
                    </div>
                    <span className="font-mono font-bold text-[11px] text-[#022448] w-10 text-right">
                      {districtRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-[#f0f9ff] rounded-lg border border-[#bae6fd] flex items-start gap-2.5 text-xs font-sans text-[#0369a1]">
            <span className="material-symbols-outlined text-[18px] text-[#0284c7] shrink-0 mt-0.5">info</span>
            <div>
              <strong>Note Stratégique Régie :</strong> L'arrondissement 3 Tié-Tié et l'arrondissement 2 Mvoumvou présentent la plus forte proportion d'établissements du secteur informel (83%). La négociation des échéanciers en 3 ou 4 tranches y a permis de doubler le recouvrement spontané.
            </div>
          </div>
        </div>
      </div>

      {/* WORKFLOW SHORTCUTS & ACTION FOOTER */}
      <div className="bg-[#f0f4fd] border border-[#d3ddfc] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
        <div className="flex items-center gap-2 text-[#022448]">
          <span className="material-symbols-outlined text-[20px] text-[#006d2f]">verified_user</span>
          <span className="font-semibold">
            Système Intégré DDL-PN conforme aux Directives Ministérielles MCAPNIT &amp; Décret ERP N° 2019-301.
          </span>
        </div>

        {onNavigateToTab && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToTab('atelier')}
              className="bg-white hover:bg-[#e4e7f3] text-[#022448] px-3 py-1.5 rounded font-bold border border-[#c4c7d4] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              <span>Atelier de Rédaction A4</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('registre')}
              className="bg-[#022448] hover:bg-[#001730] text-white px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">table_view</span>
              <span>Registre d'Instruction</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL ACTION 1: ARRÊTÉ DE FERMETURE ADMINISTRATIVE */}
      {actionModalType === 'CLOSURE_ORDER' && selectedAlertForAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-[#450a0a] animate-scale-in">
            <div className="bg-[#450a0a] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-[#fca5a5]">gavel</span>
                <div>
                  <h3 className="font-garamond text-lg font-bold">
                    Arrêté Préfectoral &amp; Départemental de Fermeture Administrative
                  </h3>
                  <span className="text-[10px] font-sans text-white/80">
                    Exécution d'office avec concours de la Force Publique
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAlertForAction(null);
                  setActionModalType(null);
                }}
                className="text-white hover:text-white/80 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 font-sans text-xs text-[#161c27]">
              <div className="bg-[#fff5f5] p-3.5 rounded-lg border border-[#fecaca] space-y-1">
                <span className="font-bold text-[#991b1b] uppercase text-[10px] block">
                  Constat de Forclusion &amp; Carence
                </span>
                <p>
                  L'établissement <strong>« {selectedAlertForAction.establishmentName} »</strong> (Promoteur : <strong>{selectedAlertForAction.promoter}</strong>, {selectedAlertForAction.district}) a fait l'objet d'une Mise en Demeure officielle le <strong>{selectedAlertForAction.issueDate}</strong> assortie d'un délai de rigueur expiré le <strong>{selectedAlertForAction.deadlineDate}</strong>.
                </p>
                <p className="text-[#991b1b] font-semibold">
                  Motif : {selectedAlertForAction.infractionReason}. Reste dû au Trésor : {(selectedAlertForAction.amountDue - selectedAlertForAction.paidAmount).toLocaleString('fr-FR')} FCFA.
                </p>
              </div>

              <div className="p-3 bg-[#f9f9ff] rounded border border-[#dde2f3] space-y-1 text-[#43474e]">
                <span className="font-bold text-[#022448] block">Dispositif de l'Acte de Fermeture :</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Pose immédiate des scellés républicains sur les accès de l'établissement.</li>
                  <li>Saisine du Commissariat Central de Police de Pointe-Noire pour exécution coercitive.</li>
                  <li>Suspension de toute délivrance d'Attestation de Dépôt jusqu'à apurement intégral des pénalités.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf0fa]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlertForAction(null);
                    setActionModalType(null);
                  }}
                  className="px-4 py-2 border border-[#c4c7d4] rounded font-bold text-[#43474e] hover:bg-[#f1f3ff] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmClosure(selectedAlertForAction)}
                  className="px-4 py-2 bg-[#450a0a] hover:bg-[#2e0707] text-white rounded font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Confirmer &amp; Exécuter l'Arrêté de Fermeture</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTION 2: MORATOIRE (+48H) */}
      {actionModalType === 'MORATORIUM' && selectedAlertForAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#fed7aa] animate-scale-in">
            <div className="bg-[#c2410c] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">more_time</span>
                <h3 className="font-garamond text-lg font-bold">Octroi d'un Moratoire Exceptionnel (+48h)</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAlertForAction(null);
                  setActionModalType(null);
                }}
                className="text-white hover:text-white/80 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 font-sans text-xs text-[#161c27]">
              <p>
                Vous êtes sur le point d'accorder un moratoire de <strong>48 heures</strong> à l'exploitant <strong>{selectedAlertForAction.promoter}</strong> (« {selectedAlertForAction.establishmentName} »).
              </p>
              <div className="bg-[#fff7ed] p-3 rounded border border-[#fed7aa] text-[#9a3412]">
                Un engagement écrit de versement immédiat d'au moins 50% de la somme due ({(Math.round((selectedAlertForAction.amountDue - selectedAlertForAction.paidAmount) / 2)).toLocaleString('fr-FR')} FCFA) est requis au guichet de la DDL-PN.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#edf0fa]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlertForAction(null);
                    setActionModalType(null);
                  }}
                  className="px-4 py-2 border border-[#c4c7d4] rounded font-bold text-[#43474e] hover:bg-[#f1f3ff] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleGrantMoratorium(selectedAlertForAction)}
                  className="px-4 py-2 bg-[#c2410c] hover:bg-[#9a3412] text-white rounded font-bold shadow-md cursor-pointer"
                >
                  Valider le Moratoire de 48h
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTION 3: ENCAISSER RÉGULARISATION */}
      {actionModalType === 'PAYMENT_RECEIPT' && selectedAlertForAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#bbf7d0] animate-scale-in">
            <div className="bg-[#004528] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">point_of_sale</span>
                <h3 className="font-garamond text-lg font-bold">Encaissement de Régularisation &amp; Mainlevée</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAlertForAction(null);
                  setActionModalType(null);
                }}
                className="text-white hover:text-white/80 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 font-sans text-xs text-[#161c27]">
              <p>
                Régularisation financière pour <strong>« {selectedAlertForAction.establishmentName} »</strong>.
              </p>
              <div className="bg-[#f0fdf4] p-3 rounded border border-[#bbf7d0] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Montant de la liquidation à solder :</span>
                  <span className="font-mono text-[#006d2f]">
                    {(selectedAlertForAction.amountDue - selectedAlertForAction.paidAmount).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <p className="text-[11px] text-[#15803d]">
                  La perception de ce montant entraîne la clôture immédiate de la mise en demeure et la délivrance du reçu officiel numéroté.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#edf0fa]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlertForAction(null);
                    setActionModalType(null);
                  }}
                  className="px-4 py-2 border border-[#c4c7d4] rounded font-bold text-[#43474e] hover:bg-[#f1f3ff] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleResolvePayment(selectedAlertForAction)}
                  className="px-4 py-2 bg-[#004528] hover:bg-[#00341e] text-white rounded font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Encaisser &amp; Lever la Sommation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
