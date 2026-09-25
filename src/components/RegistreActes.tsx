import React, { useState, useEffect } from 'react';
import {
  apiFetchDossiers,
  apiUpsertDossier,
  subscribeToSupabase,
  isSupabaseConfigured,
  DossierRecord,
} from '../lib/supabase.ts';

export type { DossierRecord };

const initialDossiers: DossierRecord[] = [
  {
    id: 'paradisio',
    num: 'PN-2026-REC-0142',
    date: '14 Fév. 2026',
    serviceCode: 'SAA / J.A.M.',
    title: 'Complexe Paradisio',
    promoter: 'Société Paradisio Loisirs SARL (G. Massamba)',
    loc: 'Arr. 2 Mvou-Mvou / Lumumba',
    arrondissement: 'lumumba',
    category: 'parc',
    typeLabel: "Agrément d'Exploitation",
    typeSub: 'Espace Récréatif & Manèges',
    piecesCount: 5,
    totalPieces: 5,
    piecesStatus: 'Dossier conforme',
    statusKey: 'signature',
    statusLabel: 'Transmis Dir. Dép.',
    statusSub: 'Pour paraphe & signature',
    piecesList: [
      { name: "Statuts notariés & RCCM de l'établissement", status: 'Conforme', ok: true },
      { name: "Plan de masse & d'évacuation des manèges", status: 'Certifié', ok: true },
      { name: 'Certificat Sécurité Incendie (Sapeurs-Pompiers)', status: 'Avis Favorable', ok: true },
      { name: 'Quittance de Redevance Départementale Loisirs', status: 'Trésor Public', ok: true },
      { name: 'Procès-verbal de Commodité & Incommodité', status: 'Signé Mairie', ok: true },
    ],
    avisMotive:
      '« Vu le dossier d\'agrément instruit sous ma supervision, l\'établissement présente les garanties requises de sécurité publique, d\'encadrement des mineurs et de conformité aux normes acoustiques. Favorable sans réserve à la délivrance de l\'Arrêté d\'agrément d\'exploitation pour une durée de 3 ans. »',
  },
  {
    id: 'dauphin',
    num: 'PN-2026-REC-0139',
    date: '08 Fév. 2026',
    serviceCode: 'SAA / J.A.M.',
    title: 'Club Balnéaire Le Dauphin Bleu',
    promoter: 'M. Édouard MOUSSAVOU',
    loc: 'Bande Côtière / Côte Sauvage',
    arrondissement: 'cote-sauvage',
    category: 'balneaire',
    typeLabel: 'Autorisation Temporaire',
    typeSub: 'Loisirs Nautiques & Plage',
    piecesCount: 3,
    totalPieces: 5,
    piecesStatus: 'Manque Sécurité Mer',
    statusKey: 'reserves',
    statusLabel: 'Réserves Techniques',
    statusSub: 'Notification envoyée le 11/02',
    piecesList: [
      { name: "Statuts notariés & RCCM de l'établissement", status: 'Conforme', ok: true },
      { name: 'Plan des installations de plage', status: 'Certifié', ok: true },
      { name: 'Protocole de surveillance maritime & maîtres-nageurs', status: 'En attente', ok: false },
      { name: 'Quittance Trésor Public', status: 'Payé', ok: true },
      { name: 'Attestation médicale équipe de secours', status: 'Manquante', ok: false },
    ],
    avisMotive:
      '« Réserves expresses formulées quant à l\'absence d\'un canot pneumatique d\'urgence et de balises de sécurité pour la baignade. Agrément subordonné à la levée des réserves sous quinzaine. »',
  },
  {
    id: 'gaming',
    num: 'PN-2026-REC-0135',
    date: '02 Fév. 2026',
    serviceCode: 'SAA / J.A.M.',
    title: 'Tié-Tié Gaming Arena',
    promoter: 'ETS KOUBEMBA & Fils',
    loc: 'Arr. 3 Tié-Tié (Marché Central)',
    arrondissement: 'tietie',
    category: 'jeux',
    typeLabel: 'Renouvellement Agrément',
    typeSub: 'Salles de Jeux Vidéos & Num.',
    piecesCount: 5,
    totalPieces: 5,
    piecesStatus: 'Quittance validée',
    statusKey: 'scelle',
    statusLabel: 'Arrêté N°032/DDL Signé',
    statusSub: 'Archives & Retrait guichet',
    piecesList: [
      { name: 'Arrêté initial et bilan des 3 années', status: 'Conforme', ok: true },
      { name: 'Homologation des bornes et limiteurs sonores', status: 'Conforme', ok: true },
      { name: 'Règlement intérieur interdisant mineurs pendant cours', status: 'Validé', ok: true },
      { name: 'Quittance de taxe sur cyber-loisirs', status: 'Validé', ok: true },
      { name: 'Visite sanitaire d\'hygiène', status: 'Favorable', ok: true },
    ],
    avisMotive:
      '« Établissement rigoureusement conforme aux prescriptions départementales. Aucun incident sonore signalé au T2 ou T3. Renouvellement recommandé pour l\'exercice 2026-2029. »',
  },
  {
    id: 'mpita',
    num: 'PN-2026-REC-0131',
    date: '28 Janv. 2026',
    serviceCode: 'SAA / J.A.M.',
    title: 'Mpita Kids Park & Aventures',
    promoter: 'Madame Viviane BASSINGA',
    loc: 'Arr. 1 Mpita (Face Hangar)',
    arrondissement: 'mpita',
    category: 'enfants',
    typeLabel: "Agrément d'Exploitation",
    typeSub: 'Parc Plein Air Enfants',
    piecesCount: 4,
    totalPieces: 5,
    piecesStatus: 'Enquête en cours',
    statusKey: 'enquete',
    statusLabel: 'Enquête Commodité',
    statusSub: 'Avis de voisinage requis',
    piecesList: [
      { name: 'Dossier administratif & inscription RCCM', status: 'Conforme', ok: true },
      { name: 'Contrat de maintenance des structures gonflables', status: 'Conforme', ok: true },
      { name: 'Attestation de sécurité incendie Sapeurs-Pompiers', status: 'Conforme', ok: true },
      { name: 'Quittance de redevance territoriale', status: 'Conforme', ok: true },
      { name: 'PV d\'enquête commodo et incommodo du voisinage', status: 'En cours', ok: false },
    ],
    avisMotive:
      '« Dossier technique complet. En attente du procès-verbal de l\'enquête de commodo et incommodo diligentée par la mairie du premier arrondissement. »',
  },
];

interface RegistreActesProps {
  onOpenInAtelier?: (dossier: DossierRecord) => void;
}

export const RegistreActes: React.FC<RegistreActesProps> = ({ onOpenInAtelier }) => {
  const [dossiers, setDossiers] = useState<DossierRecord[]>(initialDossiers);
  const [selectedDossier, setSelectedDossier] = useState<DossierRecord>(initialDossiers[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

  // Load dossiers from Supabase / localStorage on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const res = await apiFetchDossiers(initialDossiers);
      if (isMounted) {
        setDossiers(res.data);
        if (res.data.length > 0) {
          setSelectedDossier(res.data[0]);
        }
        setIsSupabaseLive(res.isSupabase);
      }
    };

    loadData();

    // Subscribe to realtime changes on 'dossiers_actes'
    const unsubscribe = subscribeToSupabase('dossiers_actes', () => {
      loadData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Form State for new dossier
  const [newTitle, setNewTitle] = useState('');
  const [newPromoter, setNewPromoter] = useState('');
  const [newType, setNewType] = useState<'parc' | 'balneaire' | 'enfants' | 'jeux'>('parc');
  const [newArrondissement, setNewArrondissement] = useState('lumumba');
  const [newRequestType, setNewRequestType] = useState("Agrément d'Exploitation initial");
  const [checkStatuts, setCheckStatuts] = useState(true);
  const [checkPlan, setCheckPlan] = useState(true);
  const [checkSecurite, setCheckSecurite] = useState(false);
  const [checkQuittance, setCheckQuittance] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCreateDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromoter.trim()) return;

    const nextIndex = dossiers.length + 143;
    const newNum = `PN-2026-REC-0${nextIndex}`;
    const piecesOk = [checkStatuts, checkPlan, checkSecurite, checkQuittance].filter(Boolean).length;

    const newRecord: DossierRecord = {
      id: `dossier-${Date.now()}`,
      num: newNum,
      date: 'Aujourd’hui',
      serviceCode: 'SAA / J.A.M.',
      title: newTitle,
      promoter: newPromoter,
      loc: `${newArrondissement.toUpperCase()} — Pointe-Noire`,
      arrondissement: newArrondissement,
      category: newType,
      typeLabel: newRequestType,
      typeSub: 'Activité récréative',
      piecesCount: piecesOk,
      totalPieces: 5,
      piecesStatus: piecesOk === 5 ? 'Dossier complet' : `${piecesOk}/5 pièces reçues`,
      statusKey: piecesOk >= 4 ? 'signature' : 'reserves',
      statusLabel: piecesOk >= 4 ? 'Transmis Dir. Dép.' : 'Instruction SAA',
      statusSub: 'Nouvelle demande enregistrée',
      piecesList: [
        { name: "Statuts notariés & RCCM de l'établissement", status: checkStatuts ? 'Conforme' : 'Manquant', ok: checkStatuts },
        { name: 'Plan des installations et dispositifs de secours', status: checkPlan ? 'Certifié' : 'Manquant', ok: checkPlan },
        { name: 'Avis Sécurité Sapeurs-Pompiers', status: checkSecurite ? 'Favorable' : 'À fournir', ok: checkSecurite },
        { name: 'Quittance de Redevance Trésor Public', status: checkQuittance ? 'Payé' : 'À régler', ok: checkQuittance },
        { name: 'Procès-verbal de Commodité & Incommodité', status: 'En cours', ok: false },
      ],
      avisMotive: `« Dossier enregistré au guichet unique SAA. Vérification des pièces justificatives en cours sous la responsabilité de M. Jacques Alphonse MATOKO. »`,
    };

    const updated = [newRecord, ...dossiers];
    setDossiers(updated);
    setSelectedDossier(newRecord);
    setShowModal(false);
    setNewTitle('');
    setNewPromoter('');

    // Persist to Supabase
    const res = await apiUpsertDossier(newRecord);
    if (res.isSupabase) {
      showToast(`Demande enregistrée et synchronisée sur Supabase sous le N° ${newNum} !`);
    } else {
      showToast(`Demande enregistrée au grand livre sous le N° ${newNum} !`);
    }
  };

  // Filter logic
  const filtered = dossiers.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      !q ||
      d.num.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.promoter.toLowerCase().includes(q) ||
      d.loc.toLowerCase().includes(q);

    const matchType = filterType === 'all' || d.category === filterType;
    const matchZone = filterZone === 'all' || d.arrondissement === filterZone;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'signature' && d.statusKey === 'signature') ||
      (filterStatus === 'reserves' && d.statusKey === 'reserves') ||
      (filterStatus === 'scelle' && d.statusKey === 'scelle');

    return matchQuery && matchType && matchZone && matchStatus;
  });

  return (
    <div className="flex flex-col w-full gap-6 pb-12 text-left">
      {/* Header Régalienne */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#022448] font-sans text-[10px] uppercase tracking-widest mb-1 font-bold">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#006d2f]"></span>
            <span>MCAPNIT • DGL • DDL-PN • Service Assistance et Autorisation (SAA)</span>
            <span className="text-[#c4c6cf]">•</span>
            {isSupabaseLive ? (
              <span className="inline-flex items-center gap-1 text-[#006d2f] font-bold bg-[#dcfce7] px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006d2f] animate-pulse"></span>
                Supabase Connecté (Temps Réel)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#43474e] font-semibold bg-[#f1f3ff] px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#747783]"></span>
                Supabase Prêt (Cache Local Actif)
              </span>
            )}
          </div>
          <h1 className="font-garamond text-[30px] font-bold text-[#022448] tracking-tight leading-tight">
            Registre d'Instruction des Actes &amp; Demandes d'Autorisation
          </h1>
          <p className="font-serif text-[13px] text-[#43474e] max-w-3xl mt-1 italic">
            Système officiel de recueil, contrôle de conformité documentaire et transmission hiérarchique des dossiers d'agrément technique des établissements de loisirs de la circonscription départementale de Pointe-Noire.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#022448] text-white font-sans text-[12px] font-bold rounded shadow-sm hover:bg-[#1e3a5f] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">post_add</span>
            <span>Enregistrer un Dossier</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ffffff] text-[#022448] font-sans text-[12px] font-bold rounded shadow-sm border border-[#c4c6cf] hover:bg-[#f1f3ff] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Grand Livre Paraphé</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="relative bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff] overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#022448]"></div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] uppercase text-[#43474e] font-bold tracking-wider">
              Instruction en cours
            </span>
            <span className="material-symbols-outlined text-[#022448] text-[22px]">pending_actions</span>
          </div>
          <div className="mt-2">
            <div className="font-garamond text-[26px] font-bold text-[#022448]">
              18 <span className="font-sans text-[12px] font-normal text-[#43474e]">dossiers</span>
            </div>
            <p className="font-serif text-[11px] text-[#43474e] mt-1">Dossiers d'agrément sous examen technique SAA</p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#f1f3ff] flex items-center justify-between text-[#43474e] font-sans text-[10px]">
            <span className="text-[#006d2f] font-bold">Taux d'instruction : 78%</span>
            <span>Mois de Février 2026</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="relative bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff] overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#006d2f]"></div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] uppercase text-[#43474e] font-bold tracking-wider">
              Actes Scellés &amp; Signés
            </span>
            <span className="material-symbols-outlined text-[#006d2f] text-[22px]">verified</span>
          </div>
          <div className="mt-2">
            <div className="font-garamond text-[26px] font-bold text-[#006d2f]">
              42 <span className="font-sans text-[12px] font-normal text-[#43474e]">actes</span>
            </div>
            <p className="font-serif text-[11px] text-[#43474e] mt-1">Arrêtés &amp; notes de service visés par M. le Dir. Dép.</p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#f1f3ff] flex items-center justify-between text-[#43474e] font-sans text-[10px]">
            <span>Prêt pour notification</span>
            <span className="font-bold text-[#022448]">Exercice PTA 2026</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="relative bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff] overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#6d5e00]"></div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] uppercase text-[#43474e] font-bold tracking-wider">
              Inspections de Salubrité
            </span>
            <span className="material-symbols-outlined text-[#6d5e00] text-[22px]">fact_check</span>
          </div>
          <div className="mt-2">
            <div className="font-garamond text-[26px] font-bold text-[#6d5e00]">
              29 <span className="font-sans text-[12px] font-normal text-[#43474e]">rapports</span>
            </div>
            <p className="font-serif text-[11px] text-[#43474e] mt-1">Avis motivés contradictoires rendus in situ</p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#f1f3ff] flex items-center justify-between text-[#43474e] font-sans text-[10px]">
            <span className="font-semibold text-[#161c27]">12 sur Côte Sauvage</span>
            <span>Equipe SAA / Brigade</span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="relative bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff] overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#ba1a1a]"></div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] uppercase text-[#ba1a1a] font-bold tracking-wider">
              Instances &amp; Incomplétude
            </span>
            <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">notification_important</span>
          </div>
          <div className="mt-2">
            <div className="font-garamond text-[26px] font-bold text-[#ba1a1a]">
              07 <span className="font-sans text-[12px] font-normal text-[#43474e]">en suspens</span>
            </div>
            <p className="font-serif text-[11px] text-[#43474e] mt-1">Défaut de pièces (certificat sécurité incendie, quit.)</p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#f1f3ff] flex items-center justify-between text-[#43474e] font-sans text-[10px]">
            <span className="text-[#ba1a1a] font-bold">Mises en demeure : 3</span>
            <span>Délai 15 jours</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#43474e] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par N° enregistrement, promoteur, raison sociale ou parcelle..."
              className="w-full pl-10 pr-4 py-2 bg-[#f1f3ff] text-[#161c27] font-serif text-[13px] rounded border border-[#c4c6cf]/50 focus:outline-none focus:ring-1 focus:ring-[#022448]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#f1f3ff] px-2.5 py-1.5 rounded border border-[#c4c6cf]/40">
              <span className="material-symbols-outlined text-[18px] text-[#43474e]">category</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent font-sans text-[11px] text-[#022448] font-bold focus:outline-none"
              >
                <option value="all">Tous les types de loisirs</option>
                <option value="balneaire">Complexes Balnéaires &amp; Plages</option>
                <option value="enfants">Espaces Récréatifs pour Enfants</option>
                <option value="parc">Parcs d'Attractions &amp; Manèges</option>
                <option value="jeux">Salles de Jeux Vidéos &amp; Cyber</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f1f3ff] px-2.5 py-1.5 rounded border border-[#c4c6cf]/40">
              <span className="material-symbols-outlined text-[18px] text-[#43474e]">location_on</span>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="bg-transparent font-sans text-[11px] text-[#022448] font-bold focus:outline-none"
              >
                <option value="all">Tous arrondissements</option>
                <option value="lumumba">Arr. 1 Patrice Lumumba</option>
                <option value="cote-sauvage">Bande Côtière / Côte Sauvage</option>
                <option value="mpita">Arr. 1 Mpita - Vindoulou</option>
                <option value="tietie">Arr. 3 Tié-Tié</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f1f3ff] px-2.5 py-1.5 rounded border border-[#c4c6cf]/40">
              <span className="material-symbols-outlined text-[18px] text-[#43474e]">hourglass_empty</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent font-sans text-[11px] text-[#022448] font-bold focus:outline-none"
              >
                <option value="all">Tous statuts réglementaires</option>
                <option value="signature">Transmis au Dir. Dép.</option>
                <option value="reserves">Réserves Techniques</option>
                <option value="scelle">Scellé &amp; Enregistré</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid : 8 cols table + 4 cols drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* TABLE (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="bg-[#ffffff] rounded shadow-sm border border-[#e8eeff] overflow-hidden">
            {/* Table Header */}
            <div className="bg-[#f1f3ff] px-4 py-3 flex items-center justify-between border-b border-[#dde2f3]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#022448]">menu_book</span>
                <span className="font-garamond text-[15px] uppercase font-bold text-[#022448] tracking-wider">
                  Grand Registre Chronologique des Actes DDL-PN / 2026
                </span>
              </div>
              <span className="font-sans text-[10px] uppercase bg-[#dde2f3] px-2 py-0.5 rounded text-[#43474e] font-bold">
                {filtered.length} Demandes Visibles
              </span>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#e8eeff]/60 text-[#43474e] font-sans font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">N° Dossier &amp; Dépôt</th>
                    <th className="py-3 px-4">Établissement &amp; Promoteur</th>
                    <th className="py-3 px-4">Objet de l'Acte</th>
                    <th className="py-3 px-4">Conformité Pièces</th>
                    <th className="py-3 px-4">Statut Administratif</th>
                    <th className="py-3 px-4 text-right">Opérations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3ff]">
                  {filtered.map((dossier) => {
                    const isSelected = selectedDossier.id === dossier.id;
                    return (
                      <tr
                        key={dossier.id}
                        onClick={() => setSelectedDossier(dossier)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#e8eeff]/80 font-medium' : 'hover:bg-[#f1f3ff]/60'
                        }`}
                      >
                        {/* Num */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-mono text-[11px] font-bold text-[#022448]">{dossier.num}</div>
                          <div className="font-serif text-[11px] text-[#43474e]">{dossier.date}</div>
                          <span className="inline-block mt-1 font-sans text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#e3e8f9] text-[#022448] font-bold">
                            {dossier.serviceCode}
                          </span>
                        </td>

                        {/* Title & Promoter */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-garamond text-[15px] font-bold text-[#022448] leading-tight">
                            {dossier.title}
                          </div>
                          <div className="font-serif text-[12px] text-[#161c27]">{dossier.promoter}</div>
                          <div className="font-serif text-[11px] italic text-[#43474e]">{dossier.loc}</div>
                        </td>

                        {/* Object */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-[#d5e3ff] text-[#001c3b] uppercase tracking-tight">
                            {dossier.typeLabel}
                          </span>
                          <div className="font-serif text-[11px] text-[#43474e] mt-1">{dossier.typeSub}</div>
                        </td>

                        {/* Pieces Conformity */}
                        <td className="py-3.5 px-4 align-top">
                          <div
                            className={`flex items-center gap-1 font-sans text-[11px] font-bold ${
                              dossier.piecesCount === dossier.totalPieces
                                ? 'text-[#006d2f]'
                                : dossier.piecesCount >= 4
                                ? 'text-[#6d5e00]'
                                : 'text-[#ba1a1a]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {dossier.piecesCount === dossier.totalPieces ? 'check_circle' : 'schedule'}
                            </span>
                            <span>
                              {dossier.piecesCount} / {dossier.totalPieces} pièces
                            </span>
                          </div>
                          <div className="w-20 bg-[#dde2f3] h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${
                                dossier.piecesCount === dossier.totalPieces
                                  ? 'bg-[#006d2f]'
                                  : dossier.piecesCount >= 4
                                  ? 'bg-[#6d5e00]'
                                  : 'bg-[#ba1a1a]'
                              }`}
                              style={{ width: `${(dossier.piecesCount / dossier.totalPieces) * 100}%` }}
                            ></div>
                          </div>
                          <div className="font-serif text-[10px] text-[#43474e] mt-0.5">{dossier.piecesStatus}</div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-sans text-[10px] font-bold uppercase ${
                              dossier.statusKey === 'signature'
                                ? 'bg-[#e8eeff] text-[#022448]'
                                : dossier.statusKey === 'scelle'
                                ? 'bg-[#80f899]/30 text-[#006d2f]'
                                : dossier.statusKey === 'reserves'
                                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                : 'bg-[#ffe251]/40 text-[#4a3f00]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                dossier.statusKey === 'scelle'
                                  ? 'bg-[#006d2f]'
                                  : dossier.statusKey === 'reserves'
                                  ? 'bg-[#ba1a1a]'
                                  : 'bg-[#022448]'
                              }`}
                            ></span>
                            {dossier.statusLabel}
                          </span>
                          <div className="font-serif text-[10px] text-[#43474e] mt-1">{dossier.statusSub}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenInAtelier) onOpenInAtelier(dossier);
                                showToast(`Ouverture de ${dossier.num} dans l'Atelier A4...`);
                              }}
                              title="Ouvrir dans l'Atelier A4"
                              className="p-1 text-[#022448] hover:bg-[#e8eeff] rounded cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit_document</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast(`Bordereau officiel SAA généré pour ${dossier.num}.`);
                              }}
                              title="Bordereau officiel"
                              className="p-1 text-[#43474e] hover:bg-[#e8eeff] rounded cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-[#f1f3ff] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#dde2f3]">
              <span className="font-serif text-[11px] text-[#43474e]">
                Affichage des dossiers répertoriés au SAA pour le 1er trimestre 2026.
              </span>
              <div className="flex items-center gap-1 font-sans text-[11px]">
                <button className="px-2 py-0.5 bg-white text-[#43474e] rounded border border-[#c4c6cf] text-xs">
                  Précédent
                </button>
                <span className="px-2 py-0.5 bg-[#022448] text-white font-bold rounded text-xs">1</span>
                <button className="px-2 py-0.5 bg-white text-[#43474e] rounded border border-[#c4c6cf] text-xs">
                  Suivant
                </button>
              </div>
            </div>
          </div>

          {/* Legal Reminder Box */}
          <div className="bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff]">
            <div className="flex items-center gap-1.5 mb-1 text-[#6d5e00]">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider">
                Rappel des Visas &amp; Références Réglementaires Obligatoires
              </span>
            </div>
            <p className="font-serif text-[12px] text-[#43474e] leading-relaxed">
              Conformément au Décret régissant les attributions du MCAPNIT et aux textes portant organisation de la Direction Générale des Loisirs (DGL), toute ouverture au public d'un établissement à vocation ludique ou récréative dans le département de Pointe-Noire requiert un agrément préalable du Directeur Départemental, après instruction de conformité par le Service Assistance et Autorisation (SAA).
            </p>
          </div>
        </div>

        {/* RIGHT DRAWER: Fiche Technique SAA (4 cols) */}
        <div className="xl:col-span-4 bg-[#ffffff] rounded shadow-sm border border-[#e8eeff] overflow-hidden sticky top-24">
          {/* Congolese Flag Ribbon on top */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#009543] via-[#FBDE4A] to-[#DC241F]"></div>

          {/* Fiche Header */}
          <div className="p-4 bg-[#f1f3ff]/60 border-b border-[#e8eeff]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-[9px] uppercase px-2 py-0.5 rounded bg-[#022448] text-white font-bold">
                Fiche Technique SAA
              </span>
              <span className="font-mono text-[12px] font-bold text-[#022448]">{selectedDossier.num}</span>
            </div>
            <h2 className="font-garamond text-[18px] font-bold text-[#022448] leading-snug">
              {selectedDossier.title}
            </h2>
            <div className="flex items-center gap-1 text-[#43474e] font-serif text-[11px] mt-1">
              <span className="material-symbols-outlined text-[15px] text-[#006d2f]">pin_drop</span>
              <span>{selectedDossier.loc}</span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Metadata Box */}
            <div className="bg-[#f1f3ff] p-3 rounded flex flex-col gap-1.5 font-serif text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#43474e]">Promoteur :</span>
                <span className="font-bold text-[#022448] text-right">{selectedDossier.promoter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#43474e]">Date de dépôt :</span>
                <span className="font-semibold text-[#161c27]">{selectedDossier.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#43474e]">Instructeur SAA :</span>
                <span className="font-semibold text-[#022448]">Jacques Alphonse MATOKO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#43474e]">Autorité de signature :</span>
                <span className="font-semibold text-[#022448]">M. Jean Richard NTSEKE NGOUAKA</span>
              </div>
            </div>

            {/* Verification Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[10px] uppercase text-[#022448] font-bold">
                  Contrôle Réglementaire des Pièces
                </span>
                <span
                  className={`font-sans text-[10px] font-bold ${
                    selectedDossier.piecesCount === selectedDossier.totalPieces
                      ? 'text-[#006d2f]'
                      : 'text-[#ba1a1a]'
                  }`}
                >
                  {selectedDossier.piecesCount}/{selectedDossier.totalPieces} Pièces Reçues
                </span>
              </div>

              <ul className="flex flex-col gap-1.5 font-serif text-[11.5px]">
                {selectedDossier.piecesList.map((piece, pIdx) => (
                  <li
                    key={pIdx}
                    className="flex items-center justify-between p-2 rounded bg-[#f1f3ff]/70 border border-[#dde2f3]/50"
                  >
                    <span className="flex items-center gap-1.5 text-[#161c27]">
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          piece.ok ? 'text-[#006d2f]' : 'text-[#ba1a1a]'
                        }`}
                      >
                        {piece.ok ? 'check_circle' : 'error'}
                      </span>
                      <span>{piece.name}</span>
                    </span>
                    <span
                      className={`font-sans text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        piece.ok ? 'text-[#006d2f] bg-[#80f899]/30' : 'text-[#ba1a1a] bg-[#ffdad6]'
                      }`}
                    >
                      {piece.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Avis Motivé SAA */}
            <div className="bg-[#ffffff] p-3 rounded border border-[#e8eeff]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#022448]">rate_review</span>
                <span className="font-sans text-[10px] uppercase text-[#022448] font-bold">
                  Avis Technique Motivé (Chef SAA)
                </span>
              </div>
              <p className="font-serif text-[11px] text-[#161c27] italic leading-relaxed bg-[#f1f3ff] p-2.5 rounded">
                {selectedDossier.avisMotive}
              </p>
              <div className="flex items-center justify-between mt-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#022448] text-white flex items-center justify-center font-bold text-[10px]">
                    JM
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-[10px] font-bold text-[#022448]">J. A. MATOKO</span>
                    <span className="font-sans text-[8px] text-[#43474e] uppercase">Chef SAA / Instructeur</span>
                  </div>
                </div>
                <span className="font-sans text-[9px] text-[#006d2f] font-bold uppercase bg-[#80f899]/30 px-2 py-0.5 rounded">
                  Visa Favorable
                </span>
              </div>
            </div>

            {/* Decision Hiérarchique Card */}
            <div className="p-3 rounded bg-[#1e3a5f] text-white flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] uppercase tracking-wider text-[#83fb9c] font-bold">
                  Décision Hiérarchique
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#83fb9c]">approval</span>
              </div>
              <div className="font-garamond text-[15px] font-bold">M. Jean Richard NTSEKE NGOUAKA</div>
              <div className="font-serif text-[11px] opacity-85">
                Directeur Départemental des Loisirs de Pointe-Noire
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      `Arrêté d'agrément pour ${selectedDossier.title} visé et soumis avec succès au parapheur électronique !`
                    )
                  }
                  className="w-full py-2 bg-[#006d2f] text-white rounded font-sans text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#005322] transition-colors cursor-pointer shadow"
                >
                  <span className="material-symbols-outlined text-[16px]">draw</span>
                  <span>Viser &amp; Soumettre à la Signature</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenInAtelier) onOpenInAtelier(selectedDossier);
                      showToast("Ouverture de l'acte au format A4 réglementaire...");
                    }}
                    className="flex-1 py-1.5 bg-white text-[#022448] rounded font-sans text-[10px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-[#f1f3ff] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">print</span>
                    <span>Aperçu A4</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(`Bordereau officiel généré pour ${selectedDossier.num} (Archives d'État).`)
                    }
                    className="flex-1 py-1.5 bg-white text-[#022448] rounded font-sans text-[10px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-[#f1f3ff] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                    <span>Bordereau</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Enregistrer un Nouveau Dossier */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#022448]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 border border-[#dde2f3]">
            {/* Ribbon */}
            <div className="h-1.5 w-full bg-[#022448]"></div>

            {/* Header */}
            <div className="px-6 py-4 bg-[#f1f3ff] flex items-center justify-between border-b border-[#dde2f3]">
              <div>
                <span className="font-sans text-[10px] uppercase text-[#006d2f] font-bold">
                  Guichet Unique SAA / DDL-PN
                </span>
                <h3 className="font-garamond text-[20px] font-bold text-[#022448]">
                  Enregistrement d'une Nouvelle Demande d'Autorisation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-[#43474e] hover:text-[#022448] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateDossier} className="p-6 flex flex-col gap-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-sans text-[10px] uppercase font-bold text-[#022448] mb-1">
                    Raison Sociale ou Enseigne *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Baobab Loisirs Parc"
                    className="w-full p-2.5 bg-[#f1f3ff] rounded font-serif text-[13px] border border-[#c4c6cf] focus:bg-white focus:ring-1 focus:ring-[#022448] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[10px] uppercase font-bold text-[#022448] mb-1">
                    Nom du Promoteur / Gérant *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPromoter}
                    onChange={(e) => setNewPromoter(e.target.value)}
                    placeholder="Ex: M. Christian NGOMA"
                    className="w-full p-2.5 bg-[#f1f3ff] rounded font-serif text-[13px] border border-[#c4c6cf] focus:bg-white focus:ring-1 focus:ring-[#022448] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-sans text-[10px] uppercase font-bold text-[#022448] mb-1">
                    Type d'Établissement *
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'parc' | 'balneaire' | 'enfants' | 'jeux')}
                    className="w-full p-2 bg-[#f1f3ff] rounded font-serif text-[12px] border border-[#c4c6cf] focus:bg-white outline-none"
                  >
                    <option value="parc">Parc d'Attraction &amp; Manèges</option>
                    <option value="balneaire">Complexe Balnéaire &amp; Plage</option>
                    <option value="enfants">Espace Récréatif Enfants</option>
                    <option value="jeux">Salle de Jeux Vidéos &amp; Num.</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-[10px] uppercase font-bold text-[#022448] mb-1">
                    Arrondissement *
                  </label>
                  <select
                    value={newArrondissement}
                    onChange={(e) => setNewArrondissement(e.target.value)}
                    className="w-full p-2 bg-[#f1f3ff] rounded font-serif text-[12px] border border-[#c4c6cf] focus:bg-white outline-none"
                  >
                    <option value="lumumba">Arr. 1 Patrice Lumumba</option>
                    <option value="cote-sauvage">Bande Côtière / Côte Sauvage</option>
                    <option value="mpita">Arr. 1 Mpita</option>
                    <option value="tietie">Arr. 3 Tié-Tié</option>
                    <option value="loandjili">Arr. 4 Loandjili</option>
                    <option value="mongo-mpoukou">Arr. 5 Mongo-Mpoukou</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-[10px] uppercase font-bold text-[#022448] mb-1">
                    Nature de la Requête *
                  </label>
                  <select
                    value={newRequestType}
                    onChange={(e) => setNewRequestType(e.target.value)}
                    className="w-full p-2 bg-[#f1f3ff] rounded font-serif text-[12px] border border-[#c4c6cf] focus:bg-white outline-none"
                  >
                    <option value="Agrément d'Exploitation initial">Agrément d'Exploitation initial</option>
                    <option value="Renouvellement quinquennal">Renouvellement quinquennal</option>
                    <option value="Autorisation Temporaire">Autorisation Temporaire</option>
                  </select>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-[#f1f3ff] p-3 rounded">
                <label className="block font-sans text-[10px] uppercase font-bold text-[#022448] mb-2">
                  Pièces Physiques Remises au Guichet
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-serif text-[12px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkStatuts}
                      onChange={(e) => setCheckStatuts(e.target.checked)}
                      className="rounded text-[#022448]"
                    />
                    <span>Statuts notariés ou Pièce d'Identité</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkPlan}
                      onChange={(e) => setCheckPlan(e.target.checked)}
                      className="rounded text-[#022448]"
                    />
                    <span>Plan de masse des installations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkSecurite}
                      onChange={(e) => setCheckSecurite(e.target.checked)}
                      className="rounded text-[#022448]"
                    />
                    <span>Avis Sécurité Sapeurs-Pompiers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkQuittance}
                      onChange={(e) => setCheckQuittance(e.target.checked)}
                      className="rounded text-[#022448]"
                    />
                    <span>Quittance Redevance Trésor Public</span>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[#43474e] font-sans text-[11px] font-semibold hover:bg-[#f1f3ff] rounded cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#022448] text-white font-sans text-[11px] font-bold rounded shadow hover:bg-[#1e3a5f] cursor-pointer"
                >
                  Générer le Numéro d'Ordre &amp; Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#022448] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-[#8aa4cf]/30 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-[#006d2f] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">check</span>
          </div>
          <span className="font-sans text-[12px] font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
