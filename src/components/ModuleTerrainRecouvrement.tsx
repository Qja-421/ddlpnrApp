import React, { useState, useEffect, useMemo } from 'react';
import { RepublicSeal, ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';
import {
  apiFetchEstablishments,
  apiUpsertEstablishment,
  apiRecordPayment,
  apiFetchAgents,
  subscribeToSupabase,
  isSupabaseConfigured,
  FieldEstablishment,
  AgentAccount,
} from '../lib/supabase.ts';
import { getActivityRatePerSqm, CONFIRMED_ACTIVITY_RATES } from './MoteurTarifsActivites.tsx';
import { CircuitBrazzaville } from './CircuitBrazzaville.tsx';
import { EtatVersementTresor } from './EtatVersementTresor.tsx';
import { CalendrierRdvTerrain, addOneYear, getFirstPaymentDate } from './CalendrierRdvTerrain.tsx';

export type { FieldEstablishment, AgentAccount };

// Official Checklists per Track (DDL-PN Regulation)
export const FORMAL_DOCS_CHECKLIST = [
  "Demande manuscrite timbrée adressée à la Directrice Générale des Loisirs",
  "Copie CNI ou Passeport en cours de validité du gérant/promoteur",
  "Extrait de Casier Judiciaire (Bulletin N° 3)",
  "Certificat de Nationalité Congolaise",
  "Quitus de Sécurité Incendie délivré par les Sapeurs-Pompiers",
  "Curriculum Vitae (CV) du Gérant / Exploitant",
  "Schéma d'Aménagement & Photos des Lieux",
  "Immatriculation RCCM ou Numéro d'Identification Unique (NIU)",
  "Attestation d'Assurance Multirisque Professionnelle",
  "Reçu de paiement des droits (requis pour la phase finale d'autorisation)",
];

export const INFORMAL_DOCS_CHECKLIST = [
  "Copie CNI ou Pièce d'Identité de l'exploitant sur place",
  "Extrait de Casier Judiciaire (Bulletin N° 3)",
  "Certificat de Nationalité Congolaise",
  "Fiche d'identification contradictoire établie sur le terrain",
];

const mockEstablishments: FieldEstablishment[] = [
  {
    id: 'EST-2026-001',
    name: 'Le Cercle Privé VIP - Mpita',
    promoter: 'Alain Mambou',
    phone: '+242 06 654 32 10',
    district: 'Mpita, Arrondissement 1 Lumumba',
    address: 'Avenue de la Paix, face Pharmacie des Étoiles',
    activityCode: 'ACT-VIP',
    activityLabel: 'VIP Lounge & Salons Privés',
    sector: 'formal',
    rccm: 'CG-PNR-01-2023-B12-00452',
    surfaceSqm: 140,
    identifiedDate: '10/02/2026',
    identifiedBy: 'Agent SAA Makosso (Badge N° 08)',
    status: 'transmis_brazzaville',
    filingFee: 30000,
    penaltyFee: 0,
    ratePerSqm: 3000,
    totalDue: 450000, // 30000 + 140*3000
    installmentsCount: 3,
    paidAmount: 300000,
    nextDueDate: '15/04/2026',
    paymentHistory: [
      {
        id: 'REC-2026-0089',
        date: '10/02/2026',
        amount: 150000,
        collectedBy: 'Agent SAA Makosso',
        location: 'DIRECTION',
        receiptRef: 'REC-DDL-PN-2026-0089',
        nextDueDate: '10/03/2026',
      },
      {
        id: 'REC-2026-0112',
        date: '12/03/2026',
        amount: 150000,
        collectedBy: 'Agent SAA Tchicaya (Terrain)',
        location: 'TERRAIN',
        receiptRef: 'REC-DDL-PN-2026-0112',
        nextDueDate: '15/04/2026',
      },
    ],
    sanctions: [],
  },
  {
    id: 'EST-2026-002',
    name: 'Nganda Ambiance Tié-Tié',
    promoter: 'Sylvie Mboungou',
    phone: '+242 05 521 88 77',
    district: 'Arrondissement 3 Tié-Tié',
    address: 'Carrefour Trois Francs, Rue des Manguiers',
    activityCode: 'ACT-BAR',
    activityLabel: 'Bar Standard / Nganda',
    sector: 'informal',
    surfaceSqm: 85,
    identifiedDate: '24/02/2026',
    identifiedBy: 'Agent SAA Loubaki (Badge N° 12)',
    status: 'attestation_depot',
    filingFee: 30000,
    penaltyFee: 40000, // Negotiated from 50000
    ratePerSqm: 1200,
    totalDue: 172000, // 30000 + 40000 + 85*1200
    installmentsCount: 4,
    paidAmount: 86000,
    nextDueDate: '30/03/2026',
    paymentHistory: [
      {
        id: 'REC-2026-0130',
        date: '28/02/2026',
        amount: 86000,
        collectedBy: 'Agent SAA Loubaki (Terrain)',
        location: 'TERRAIN',
        receiptRef: 'REC-DDL-PN-2026-0130',
        nextDueDate: '30/03/2026',
      },
    ],
    sanctions: [],
  },
  {
    id: 'EST-2026-003',
    name: 'Terrasse Océan Bleu',
    promoter: 'Hervé Bitemo',
    phone: '+242 06 910 23 45',
    district: 'Côte Sauvage, Arrondissement 1',
    address: 'Boulevard Maritime, face Plage Centrale',
    activityCode: 'ACT-TERR',
    activityLabel: 'Terrasse Plein Air',
    sector: 'informal',
    surfaceSqm: 110,
    identifiedDate: '01/03/2026',
    identifiedBy: 'Agent SAA Tchicaya (Badge N° 05)',
    status: 'mise_en_demeure',
    filingFee: 30000,
    penaltyFee: 50000,
    ratePerSqm: 800,
    totalDue: 168000,
    installmentsCount: 2,
    paidAmount: 0,
    nextDueDate: 'Échue depuis le 15/03/2026',
    paymentHistory: [],
    sanctions: [
      {
        type: 'CONVOCATION',
        issuedDate: '02/03/2026',
        deadline: '06/03/2026',
        reason: 'Exploitation sans identification ni dépôt préalable',
        resolved: false,
      },
      {
        type: 'MISE_EN_DEMEURE',
        issuedDate: '16/03/2026',
        deadline: '24/03/2026',
        reason: 'Réfraction de paiement & absence de régularisation sous 8 jours',
        resolved: false,
      },
    ],
  },
  {
    id: 'EST-2026-004',
    name: 'Cabaret Live Le Kouilou',
    promoter: 'Benoît Mabiala',
    phone: '+242 06 433 99 11',
    district: 'Ngoyo, Arrondissement 6',
    address: 'Route Nationale 4, vers Camp Militaire',
    activityCode: 'ACT-CAB',
    activityLabel: 'Cabaret Artistique & Concert',
    sector: 'formal',
    rccm: 'CG-PNR-02-2024-A10-00891',
    surfaceSqm: 200,
    identifiedDate: '15/01/2026',
    identifiedBy: 'Chef de Service SAA Matoko',
    status: 'autorise_dgl',
    filingFee: 30000,
    penaltyFee: 0,
    ratePerSqm: 1800,
    totalDue: 390000,
    installmentsCount: 2,
    paidAmount: 390000,
    nextDueDate: 'Soldé Intégralement',
    paymentHistory: [
      {
        id: 'REC-2026-0012',
        date: '20/01/2026',
        amount: 195000,
        collectedBy: 'Régie DDL-PN Direction',
        location: 'DIRECTION',
        receiptRef: 'REC-DDL-PN-2026-0012',
        nextDueDate: '20/02/2026',
      },
      {
        id: 'REC-2026-0045',
        date: '18/02/2026',
        amount: 195000,
        collectedBy: 'Agent SAA Makosso (Terrain)',
        location: 'TERRAIN',
        receiptRef: 'REC-DDL-PN-2026-0045',
        nextDueDate: 'Soldé',
      },
    ],
    sanctions: [],
  },
  {
    id: 'EST-2026-005',
    name: 'Espace Toulane (Mpita rond point)',
    promoter: 'Anatole Toulane',
    phone: '+242 06 991 22 33',
    district: 'Mpita, Arrondissement 1 Lumumba',
    address: 'Rond Point BC, Boulevard de la Paix',
    activityCode: 'ACT-BAR',
    activityLabel: 'Bar Standard / Nganda',
    sector: 'informal',
    surfaceSqm: 95,
    identifiedDate: '25/08/2026',
    identifiedBy: 'Agent SAA Makosso (Badge N° 08)',
    status: 'attestation_depot',
    filingFee: 30000,
    penaltyFee: 50000,
    ratePerSqm: 1000,
    totalDue: 175000,
    installmentsCount: 3,
    paidAmount: 60000,
    nextDueDate: '25/09/2026',
    paymentHistory: [
      {
        id: 'REC-2026-0150',
        date: '25/08/2026',
        amount: 60000,
        collectedBy: 'Agent SAA Makosso',
        location: 'TERRAIN',
        receiptRef: 'REC-DDL-PN-2026-0150',
        nextDueDate: '25/09/2026',
      },
    ],
    sanctions: [],
  },
  {
    id: 'EST-2026-006',
    name: 'ESP. SOUS LE SAFOUTIER (Mpaka)',
    promoter: 'Gabriel Mpaka',
    phone: '+242 05 612 34 56',
    district: 'Mpaka, Arrondissement 3 Tié-Tié',
    address: 'Avenue de la Liberté, après le Marché',
    activityCode: 'ACT-TERR',
    activityLabel: 'Terrasse Plein Air',
    sector: 'informal',
    surfaceSqm: 120,
    identifiedDate: '25/08/2026',
    identifiedBy: 'Agent SAA Loubaki (Badge N° 12)',
    status: 'attestation_depot',
    filingFee: 30000,
    penaltyFee: 50000,
    ratePerSqm: 800,
    totalDue: 176000,
    installmentsCount: 2,
    paidAmount: 88000,
    nextDueDate: '25/09/2026',
    paymentHistory: [
      {
        id: 'REC-2026-0151',
        date: '25/08/2026',
        amount: 88000,
        collectedBy: 'Agent SAA Loubaki',
        location: 'TERRAIN',
        receiptRef: 'REC-DDL-PN-2026-0151',
        nextDueDate: '25/09/2026',
      },
    ],
    sanctions: [],
  },
  {
    id: 'EST-2026-007',
    name: 'ESP. MONOPRIX (NGOYO)',
    promoter: 'Claude Makaya',
    phone: '+242 06 444 88 99',
    district: 'Ngoyo, Arrondissement 6',
    address: 'Croisement Marché Ngoyo',
    activityCode: 'ACT-BAR',
    activityLabel: 'Bar Climatisé / Nganda',
    sector: 'formal',
    rccm: 'CG-PNR-01-2025-B10-00331',
    surfaceSqm: 110,
    identifiedDate: '28/08/2026',
    identifiedBy: 'Agent SAA Tchicaya (Badge N° 05)',
    status: 'attestation_depot',
    filingFee: 30000,
    penaltyFee: 0,
    ratePerSqm: 1000,
    totalDue: 140000,
    installmentsCount: 2,
    paidAmount: 70000,
    nextDueDate: '28/09/2026',
    paymentHistory: [
      {
        id: 'REC-2026-0152',
        date: '28/08/2026',
        amount: 70000,
        collectedBy: 'Agent SAA Tchicaya',
        location: 'TERRAIN',
        receiptRef: 'REC-DDL-PN-2026-0152',
        nextDueDate: '28/09/2026',
      },
    ],
    sanctions: [],
  },
  {
    id: 'EST-2026-008',
    name: 'Espace Kremlin (Och)',
    promoter: 'Sylvestre Batila',
    phone: '+242 05 777 12 34',
    district: 'OCH, Arrondissement 1 Lumumba',
    address: 'Zone Résidentielle OCH, Rue 4',
    activityCode: 'ACT-VIP',
    activityLabel: 'VIP Lounge & Salons Privés',
    sector: 'formal',
    rccm: 'CG-PNR-01-2024-B12-00812',
    surfaceSqm: 130,
    identifiedDate: '29/08/2026',
    identifiedBy: 'Chef SAA Matoko',
    status: 'attestation_depot',
    filingFee: 30000,
    penaltyFee: 0,
    ratePerSqm: 1000,
    totalDue: 160000,
    installmentsCount: 2,
    paidAmount: 80000,
    nextDueDate: '29/09/2026',
    paymentHistory: [],
    sanctions: [],
  },
  {
    id: 'EST-2026-009',
    name: 'Cave Ruth (Ngoyo)',
    promoter: 'Ruth Mabondzo',
    phone: '+242 06 555 67 89',
    district: 'Ngoyo, Arrondissement 6',
    address: 'Vers École Publique de Ngoyo',
    activityCode: 'ACT-CAVE',
    activityLabel: 'Cave & Débit de Boisson',
    sector: 'informal',
    surfaceSqm: 75,
    identifiedDate: '26/08/2026',
    identifiedBy: 'Agent SAA Loubaki (Badge N° 12)',
    status: 'attestation_depot',
    filingFee: 30000,
    penaltyFee: 40000,
    ratePerSqm: 1000,
    totalDue: 145000,
    installmentsCount: 3,
    paidAmount: 50000,
    nextDueDate: '26/09/2026',
    paymentHistory: [],
    sanctions: [],
  },
  {
    id: 'EST-2026-010',
    name: 'Espace GAGA (Mvou-Mvou)',
    promoter: 'Auguste Goma',
    phone: '+242 05 333 90 12',
    district: 'Arrondissement 2 Mvou-Mvou',
    address: 'Quartier Rex, Avenue de l’Indépendance',
    activityCode: 'ACT-CLUB',
    activityLabel: 'Nightclub / Dancing',
    sector: 'informal',
    surfaceSqm: 150,
    identifiedDate: '25/08/2026',
    identifiedBy: 'Agent SAA Makosso (Badge N° 08)',
    status: 'convoque',
    filingFee: 30000,
    penaltyFee: 50000,
    ratePerSqm: 1500,
    totalDue: 305000,
    installmentsCount: 3,
    paidAmount: 100000,
    nextDueDate: '25/09/2026',
    paymentHistory: [],
    sanctions: [],
  },
];

const mockAgents: AgentAccount[] = [
  {
    id: 'AGT-01',
    name: 'Jean-Claude MAKOSSO',
    badgeNumber: 'SAA-PN-008',
    phoneLine: '+242 06 700 11 22 (Flotte DDL-PN N°1)',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 3 min (En ligne)',
    collectionsTotal: 1850000,
  },
  {
    id: 'AGT-02',
    name: 'Brice TCHICAYA',
    badgeNumber: 'SAA-PN-005',
    phoneLine: '+242 06 700 11 23 (Flotte DDL-PN N°2)',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 12 min (Mode Déconnecté Prêt)',
    collectionsTotal: 1420000,
  },
  {
    id: 'AGT-03',
    name: 'Anicet LOUBAKI',
    badgeNumber: 'SAA-PN-012',
    phoneLine: '+242 06 700 11 24 (Flotte DDL-PN N°3)',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 25 min',
    collectionsTotal: 960000,
  },
  {
    id: 'AGT-04',
    name: 'Jacques Alphonse MATOKO',
    badgeNumber: 'SAA-CHEF-001',
    phoneLine: '+242 06 700 11 00 (Ligne Directe)',
    service: 'SAA',
    role: 'Direction / Contrôle',
    status: 'Actif',
    lastSync: 'En direct (Admin Central)',
    collectionsTotal: 3450000,
  },
];

export type SubTabType =
  | 'agenda-rdv'
  | 'recensement'
  | 'recouvrement'
  | 'etat-versement'
  | 'brazzaville'
  | 'sanctions'
  | 'safm-agents'
  | 'architecture-spec';

export interface ModuleTerrainRecouvrementProps {
  initialSubTab?: SubTabType;
}

export const ModuleTerrainRecouvrement: React.FC<ModuleTerrainRecouvrementProps> = ({
  initialSubTab = 'agenda-rdv',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [establishments, setEstablishments] = useState<FieldEstablishment[]>(mockEstablishments);
  const [agents, setAgents] = useState<AgentAccount[]>(mockAgents);
  const [selectedEst, setSelectedEst] = useState<FieldEstablishment | null>(establishments[0]);
  const [filterDistrict, setFilterDistrict] = useState<string>('TOUS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<'ALL' | 'formal' | 'informal'>('ALL');
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

  // Pagination for scaling up to 20,000 establishments
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Modals for invitations, Brazzaville transmittals, SAFM PIN, and Document Checklists
  const [showInviteModal, setShowInviteModal] = useState<FieldEstablishment | null>(null);
  const [showBrazzavilleModal, setShowBrazzavilleModal] = useState<FieldEstablishment | null>(null);
  const [showSafmPinModal, setShowSafmPinModal] = useState<AgentAccount | null>(null);
  const [showDocsModal, setShowDocsModal] = useState<FieldEstablishment | null>(null);
  const [collectPaymentMethod, setCollectPaymentMethod] = useState<
    'ESPECES' | 'AIRTEL_MONEY' | 'MTN_MOMO' | 'VIREMENT_TRESOR'
  >('ESPECES');
  const [pinEditValue, setPinEditValue] = useState<string>('1234');
  const [usernameEditValue, setUsernameEditValue] = useState<string>('');
  const [treasuryFilterPeriod, setTreasuryFilterPeriod] = useState<'jour' | 'semaine' | 'mois' | 'tout'>('mois');
  const [brazzavilleChannel, setBrazzavilleChannel] = useState<'COURRIER' | 'EMAIL' | 'WHATSAPP'>('COURRIER');
  const [newNextDueDate, setNewNextDueDate] = useState<string>('15/04/2026');

  // Load from Supabase on mount & listen to changes
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const [res, agentsRes] = await Promise.all([
        apiFetchEstablishments(mockEstablishments),
        apiFetchAgents(mockAgents),
      ]);
      if (isMounted) {
        setEstablishments(res.data);
        if (res.data.length > 0) {
          setSelectedEst(res.data[0]);
        }
        if (agentsRes.data.length > 0) {
          setAgents(agentsRes.data);
        }
        setIsSupabaseLive(res.isSupabase);
      }
    };

    loadData();

    // Realtime subscription
    const unsubscribe = subscribeToSupabase('establishments', () => {
      loadData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // New Identification form state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEstName, setNewEstName] = useState('');
  const [newPromoter, setNewPromoter] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDistrict, setNewDistrict] = useState('Mpita, Arrondissement 1 Lumumba');
  const [newAddress, setNewAddress] = useState('');
  const [newActivity, setNewActivity] = useState('ACT-BAR');
  const [newSector, setNewSector] = useState<'informal' | 'formal'>('informal');
  const [newRccm, setNewRccm] = useState('');
  const [newSurface, setNewSurface] = useState<number>(80);
  const [newNegotiatedPenalty, setNewNegotiatedPenalty] = useState<number>(50000);
  const [newInstallmentsCount, setNewInstallmentsCount] = useState<1 | 2 | 3 | 4>(3);

  // Receipt Modal state
  const [receiptEst, setReceiptEst] = useState<FieldEstablishment | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(50000);
  const [collectLocation, setCollectLocation] = useState<'TERRAIN' | 'DIRECTION'>('TERRAIN');
  const [nextDueDateInput, setNextDueDateInput] = useState<string>('15/04/2026');
  const [generatedReceipt, setGeneratedReceipt] = useState<{
    receiptRef: string;
    estName: string;
    promoter: string;
    amount: number;
    paymentMethod: string;
    nextDueDate: string;
    date: string;
    agent: string;
    balanceRemaining: number;
  } | null>(null);

  // Document Viewer (Attestation de dépôt vs Mise en Demeure vs Autorisation DGL vs Bordereau vs Fiche Enquête vs Ordre Service)
  const [activeDocView, setActiveDocView] = useState<{
    type: 'ATTESTATION' | 'MISE_EN_DEMEURE' | 'CONVOCATION' | 'BORDEREAU_TRANSMISSION' | 'ARRETE_FERMETURE' | 'FICHE_ENQUETE' | 'ORDRE_SERVICE';
    est: FieldEstablishment;
  } | null>(null);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Filter establishments
  const filteredEsts = useMemo(() => {
    return establishments.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.promoter.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.rccm && e.rccm.toLowerCase().includes(q)) ||
        e.district.toLowerCase().includes(q);
      const matchesDistrict = filterDistrict === 'TOUS' || e.district.includes(filterDistrict);
      const matchesSector = selectedSector === 'ALL' || e.sector === selectedSector;
      return matchesSearch && matchesDistrict && matchesSector;
    });
  }, [establishments, searchQuery, filterDistrict, selectedSector]);

  // Paginated establishments
  const totalPages = Math.max(1, Math.ceil(filteredEsts.length / pageSize));
  const paginatedEsts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEsts.slice(start, start + pageSize);
  }, [filteredEsts, currentPage, pageSize]);

  // Handle new establishment creation (Rule 1 & 3: Formal vs Informal Pricing)
  const handleCreateIdentification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstName || !newPromoter) {
      showToast('Veuillez renseigner le nom de l\'établissement et du promoteur.');
      return;
    }

    // Rule 1: Fixed 30,000 FCFA filing fee applies ONLY to formal sector!
    const filing = newSector === 'formal' ? 30000 : 0;
    // Rule 3: Informal fee is freely negotiated on site (e.g. 20,000 / 50,000 / 85,000 FCFA) with no mandatory justification
    const penalty = newSector === 'informal' ? Number(newNegotiatedPenalty || 0) : 0;
    // Rule 2: Per-m² rate pulled dynamically from configuration
    const rate = newSector === 'formal' ? getActivityRatePerSqm(newActivity) : 0;
    const total = newSector === 'formal' ? filing + newSurface * rate : penalty;

    const newId = `EST-2026-${String(establishments.length + 1).padStart(3, '0')}`;
    const activityInfo = CONFIRMED_ACTIVITY_RATES.find((a) => a.code === newActivity);

    const newRecord: FieldEstablishment = {
      id: newId,
      name: newEstName.trim(),
      promoter: newPromoter.trim(),
      phone: newPhone || '+242 06 000 00 00',
      district: newDistrict,
      address: newAddress || 'Quartier Pointe-Noire',
      activityCode: newActivity,
      activityLabel: activityInfo ? activityInfo.label : 'Bar Standard',
      sector: newSector,
      rccm: newSector === 'formal' ? newRccm : undefined,
      surfaceSqm: newSurface,
      identifiedDate: new Date().toLocaleDateString('fr-FR'),
      identifiedBy: 'Agent SAA Makosso (Badge N° 08)',
      status: 'identifie',
      filingFee: filing,
      penaltyFee: penalty,
      ratePerSqm: rate,
      totalDue: total,
      installmentsCount: newInstallmentsCount,
      paidAmount: 0,
      nextDueDate: newInstallmentsCount > 1 ? newNextDueDate : 'Paiement Unique',
      paymentHistory: [],
      sanctions: [
        {
          type: 'CONVOCATION',
          issuedDate: new Date().toLocaleDateString('fr-FR'),
          deadline: 'Sous 48h à la DDL-PN',
          reason: 'Identification proactive terrain - régularisation obligatoire',
          resolved: false,
        },
      ],
    };

    setEstablishments([newRecord, ...establishments]);
    setSelectedEst(newRecord);
    setShowNewModal(false);
    // Reset
    setNewEstName('');
    setNewPromoter('');

    // Persist to Supabase
    apiUpsertEstablishment(newRecord).then((res) => {
      if (res.isSupabase) {
        showToast(`Établissement « ${newEstName} » recensé et synchronisé sur Supabase !`);
      } else {
        showToast(`Établissement « ${newEstName} » recensé avec succès. Convocation générée !`);
      }
    });
  };

  // On-the-spot Collection
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptEst || collectAmount <= 0) return;

    const newPaid = receiptEst.paidAmount + collectAmount;
    const receiptCode = `REC-DDL-PN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newHistoryEntry = {
      id: receiptCode,
      date: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      amount: collectAmount,
      collectedBy: collectLocation === 'TERRAIN' ? 'Agent SAA Terrain (Badge N° 08)' : 'Régisseur DDL-PN',
      location: collectLocation,
      receiptRef: receiptCode,
      nextDueDate: nextDueDateInput,
    };

    const isSettled = newPaid >= receiptEst.totalDue && receiptEst.totalDue > 0;
    const firstDate = getFirstPaymentDate(receiptEst);
    const renewalAnniversaryDate = addOneYear(firstDate);

    const updatedEst: FieldEstablishment = {
      ...receiptEst,
      paidAmount: newPaid,
      nextDueDate: isSettled ? renewalAnniversaryDate : nextDueDateInput,
      status: isSettled
        ? 'autorise_dgl'
        : receiptEst.status === 'identifie' || receiptEst.status === 'convoque'
        ? 'attestation_depot'
        : receiptEst.status,
      paymentHistory: [newHistoryEntry, ...receiptEst.paymentHistory],
    };

    setEstablishments(establishments.map((item) => (item.id === receiptEst.id ? updatedEst : item)));
    if (selectedEst?.id === receiptEst.id) {
      setSelectedEst(updatedEst);
    }

    setGeneratedReceipt({
      receiptRef: receiptCode,
      estName: receiptEst.name,
      promoter: receiptEst.promoter,
      amount: collectAmount,
      paymentMethod: collectPaymentMethod,
      nextDueDate: nextDueDateInput,
      date: newHistoryEntry.date,
      agent: newHistoryEntry.collectedBy,
      balanceRemaining: Math.max(0, receiptEst.totalDue - newPaid),
    });

    setReceiptEst(null);

    // Persist payment to Supabase
    apiRecordPayment({
      establishmentId: receiptEst.id,
      amount: collectAmount,
      totalFee: receiptEst.totalDue,
      nextDueDate: nextDueDateInput,
    });

    apiUpsertEstablishment(updatedEst).then((res) => {
      if (res.isSupabase) {
        showToast(`Paiement de ${collectAmount.toLocaleString('fr-FR')} FCFA encaissé & synchronisé sur Supabase.`);
      } else {
        showToast(`Paiement de ${collectAmount.toLocaleString('fr-FR')} FCFA encaissé avec succès. Reçu émis.`);
      }
    });
  };

  // Issue Mise en Demeure
  const handleIssueMiseEnDemeure = (est: FieldEstablishment) => {
    const updated: FieldEstablishment = {
      ...est,
      status: 'mise_en_demeure',
      sanctions: [
        {
          type: 'MISE_EN_DEMEURE',
          issuedDate: new Date().toLocaleDateString('fr-FR'),
          deadline: 'Délai légal de rigueur : 72 Heures',
          reason: 'Défaut de paiement réitéré et rendez-vous non honoré',
          resolved: false,
        },
        ...est.sanctions,
      ],
    };
    setEstablishments(establishments.map((e) => (e.id === est.id ? updated : e)));
    setSelectedEst(updated);
    setActiveDocView({ type: 'MISE_EN_DEMEURE', est: updated });

    // Persist sanction to Supabase
    apiUpsertEstablishment(updated).then(() => {
      showToast(`Mise en demeure officielle émise pour « ${est.name} ». Délai de rigueur : 72h.`);
    });
  };

  // Trigger Administrative Closure
  const handleTriggerClosure = (est: FieldEstablishment) => {
    const updated: FieldEstablishment = {
      ...est,
      status: 'fermeture_administrative',
      sanctions: [
        {
          type: 'FERMETURE',
          issuedDate: new Date().toLocaleDateString('fr-FR'),
          deadline: 'Exécution Immédiate avec le concours de la Force Publique',
          reason: 'Non-respect de la mise en demeure - Clôture administrative prononcée',
          resolved: false,
        },
        ...est.sanctions,
      ],
    };
    setEstablishments(establishments.map((e) => (e.id === est.id ? updated : e)));
    setSelectedEst(updated);

    // Persist closure to Supabase
    apiUpsertEstablishment(updated).then(() => {
      showToast(`ARRÊTÉ DE FERMETURE ADMINISTRATIVE prononcé pour « ${est.name} » !`);
    });
  };

  // Transmit complete file to Brazzaville
  const handleTransmitBrazzaville = (est: FieldEstablishment) => {
    const updated: FieldEstablishment = {
      ...est,
      status: 'transmis_brazzaville',
    };
    setEstablishments(establishments.map((e) => (e.id === est.id ? updated : e)));
    setSelectedEst(updated);

    // Persist to Supabase
    apiUpsertEstablishment(updated).then(() => {
      showToast(`Dossier complet de « ${est.name} » transmis à la Direction Générale des Loisirs (Brazzaville) sous bordereau officiel.`);
    });
  };

  // Google Calendar View Handlers
  const handleCalendarRecordPayment = (
    est: FieldEstablishment,
    amount: number,
    nextDueDate: string,
    paymentMethod: string,
    location: 'TERRAIN' | 'DIRECTION'
  ) => {
    const newPaid = (est.paidAmount || 0) + amount;
    const receiptCode = `REC-DDL-PN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newHistoryEntry = {
      id: receiptCode,
      date:
        new Date().toLocaleDateString('fr-FR') +
        ' ' +
        new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      amount,
      collectedBy:
        location === 'TERRAIN'
          ? 'Agent SAA Terrain (Badge N° 08)'
          : 'Régisseur DDL-PN (Guichet Central)',
      location,
      receiptRef: receiptCode,
      nextDueDate,
    };

    const isYearSettled = newPaid >= est.totalDue && est.totalDue > 0;

    const updatedEst: FieldEstablishment = {
      ...est,
      paidAmount: newPaid,
      nextDueDate,
      status: isYearSettled
        ? 'autorise_dgl'
        : est.status === 'identifie' || est.status === 'convoque'
        ? 'attestation_depot'
        : est.status,
      paymentHistory: [newHistoryEntry, ...est.paymentHistory],
    };

    setEstablishments((prev) => prev.map((item) => (item.id === est.id ? updatedEst : item)));
    if (selectedEst?.id === est.id) {
      setSelectedEst(updatedEst);
    }

    // Persist payment to Supabase
    apiRecordPayment({
      establishmentId: est.id,
      amount,
      totalFee: est.totalDue,
      nextDueDate,
    });

    apiUpsertEstablishment(updatedEst).then((res) => {
      if (res.isSupabase) {
        showToast(`Acompte de ${amount.toLocaleString('fr-FR')} FCFA enregistré & synchronisé sur Supabase.`);
      } else {
        showToast(`Acompte de ${amount.toLocaleString('fr-FR')} FCFA enregistré avec succès.`);
      }
    });
  };

  const handleCalendarUpdateEstablishment = (updatedEst: FieldEstablishment) => {
    setEstablishments((prev) => prev.map((item) => (item.id === updatedEst.id ? updatedEst : item)));
    if (selectedEst?.id === updatedEst.id) {
      setSelectedEst(updatedEst);
    }
    apiUpsertEstablishment(updatedEst);
  };

  const handleCalendarAddNewEstablishment = (newEst: FieldEstablishment) => {
    setEstablishments((prev) => [newEst, ...prev]);
    setSelectedEst(newEst);
    apiUpsertEstablishment(newEst).then(() => {
      showToast(`Établissement « ${newEst.name} » créé et enregistré avec succès.`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#004528] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-[#006d2f] animate-fade-in text-sm font-sans">
          <span className="material-symbols-outlined text-[20px] text-[#4ede80]">check_circle</span>
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Top Banner with PWA Offline Indicator and Service Identity */}
      <div className="bg-[#022448] text-white rounded-xl shadow-md p-5 sm:p-6 border-b-4 border-[#004528]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-sm" title="Armoiries Officielles de la République du Congo">
                <ArmoiriesCongo size={40} />
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#004528] p-1 flex items-center justify-center border border-white/20 shadow-sm" title="Logo Officiel de la Direction Départementale des Loisirs de Pointe-Noire">
                <LogoDDLPN size={40} />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest bg-[#004528] text-[#a8f3c3] px-2.5 py-0.5 rounded">
                  Service Assistance &amp; Autorisations (SAA)
                </span>
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest bg-white/10 text-white/90 px-2 py-0.5 rounded border border-white/20">
                  PWA Mobile &amp; Guichet Central
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[#4ede80] font-sans font-bold bg-[#004528]/80 px-2.5 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-[#4ede80] animate-pulse"></span>
                  Synchro Centrale Active (Zéro Base Locale Isolée)
                </span>
                {isSupabaseLive ? (
                  <span className="flex items-center gap-1 text-[11px] text-[#a8f3c3] font-sans font-bold bg-[#046335] px-2.5 py-0.5 rounded border border-[#4ede80]/50">
                    <span className="material-symbols-outlined text-[13px]">database</span>
                    <span>Supabase Live</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-white/90 font-sans font-medium bg-white/10 px-2.5 py-0.5 rounded border border-white/20">
                    <span className="material-symbols-outlined text-[13px]">cloud_sync</span>
                    <span>Supabase Prêt (Cache Local)</span>
                  </span>
                )}
              </div>
              <h1 className="font-garamond text-[24px] sm:text-[28px] font-bold text-white mt-1">
                Plateforme Tactique Terrain, Recensement &amp; Caisse de Recouvrement
              </h1>
              <p className="font-serif text-[13px] text-white/80 italic mt-0.5">
                Direction Départementale des Loisirs de Pointe-Noire • Règle d'or : Propriété intégrale DDL &amp; fiche exploitant unique partagée.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="bg-[#006d2f] hover:bg-[#005524] text-white font-sans text-xs uppercase font-bold px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer border border-[#4ede80]/40"
            >
              <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
              <span>Identifier un Établissement (Terrain)</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveSubTab('agenda-rdv')}
            className={`px-3.5 py-1.5 rounded font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'agenda-rdv'
                ? 'bg-[#ffe082] text-[#022448] shadow-sm font-extrabold ring-2 ring-white/50'
                : 'bg-white/10 text-[#ffe082] hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>📅 Agenda &amp; Rdv (Google Calendar)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('recensement')}
            className={`px-3.5 py-1.5 rounded font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'recensement'
                ? 'bg-white text-[#022448] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            <span>1. Recensement Proactif &amp; Pistes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('recouvrement')}
            className={`px-3.5 py-1.5 rounded font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'recouvrement'
                ? 'bg-white text-[#022448] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>2. Recouvrement &amp; Reçus Échéancés</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('etat-versement')}
            className={`px-3.5 py-1.5 rounded font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'etat-versement'
                ? 'bg-white text-[#022448] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            <span>État de Versement (Trésor)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('brazzaville')}
            className={`px-3.5 py-1.5 rounded font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'brazzaville'
                ? 'bg-white text-[#022448] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">send_and_archive</span>
            <span>Circuit Brazzaville (DGL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sanctions')}
            className={`px-3.5 py-1.5 rounded font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'sanctions'
                ? 'bg-white text-[#022448] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Mises en Demeure &amp; Fermetures</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('safm-agents')}
            className={`px-3.5 py-1.5 rounded font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'safm-agents'
                ? 'bg-white text-[#022448] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>Flotte Agents (SAFM)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('architecture-spec')}
            className={`px-3.5 py-1.5 rounded font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'architecture-spec'
                ? 'bg-[#ffe082] text-[#002448] shadow-sm font-extrabold'
                : 'text-[#ffe082]/90 hover:bg-white/10 hover:text-[#ffe082]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span>Architecture &amp; Spécification</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 0: AGENDA & RENDEZ-VOUS (STYLE GOOGLE CALENDAR) */}
      {activeSubTab === 'agenda-rdv' && (
        <CalendrierRdvTerrain
          establishments={establishments}
          onUpdateEstablishment={handleCalendarUpdateEstablishment}
          onRecordPayment={handleCalendarRecordPayment}
          onAddNewEstablishment={handleCalendarAddNewEstablishment}
          agents={agents}
        />
      )}

      {/* SUB-TAB: ÉTAT DE VERSEMENT TRÉSOR */}
      {activeSubTab === 'etat-versement' && (
        <EtatVersementTresor establishments={establishments} agents={agents} />
      )}

      {/* SUB-TAB: CIRCUIT BRAZZAVILLE */}
      {activeSubTab === 'brazzaville' && (
        <CircuitBrazzaville
          establishments={establishments}
          onTransmitToBrazzaville={handleTransmitBrazzaville}
        />
      )}

      {/* SUB-TAB 1: RECENSEMENT PROACTIF & GESTION DES DEUX PISTES */}
      {activeSubTab === 'recensement' && (
        <div className="space-y-6">
          {/* Key KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#dde2f3] shadow-sm flex items-center justify-between">
              <div>
                <span className="font-sans text-[10px] font-bold uppercase text-[#43474e]">Total Recensés Terrain</span>
                <div className="font-garamond text-3xl font-bold text-[#022448] mt-0.5">{establishments.length}</div>
                <span className="font-sans text-[11px] text-[#006d2f] font-semibold">100% rattachés à la DDL</span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#e3e8f9] text-[#022448] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">map</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#dde2f3] shadow-sm flex items-center justify-between">
              <div>
                <span className="font-sans text-[10px] font-bold uppercase text-[#43474e]">Piste Secteur Informel</span>
                <div className="font-garamond text-3xl font-bold text-[#c2410c] mt-0.5">
                  {establishments.filter((e) => e.sector === 'informal').length}
                </div>
                <span className="font-sans text-[11px] text-[#c2410c] font-semibold">Pénalité + Échéancier 2-4x</span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#ffedd5] text-[#c2410c] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">store</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#dde2f3] shadow-sm flex items-center justify-between">
              <div>
                <span className="font-sans text-[10px] font-bold uppercase text-[#43474e]">Attestations de Dépôt DDL</span>
                <div className="font-garamond text-3xl font-bold text-[#0284c7] mt-0.5">
                  {establishments.filter((e) => e.status === 'attestation_depot' || e.status === 'transmis_brazzaville').length}
                </div>
                <span className="font-sans text-[11px] text-[#0284c7] font-semibold">Titre provisoire d'exploitation</span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">history_edu</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#dde2f3] shadow-sm flex items-center justify-between">
              <div>
                <span className="font-sans text-[10px] font-bold uppercase text-[#43474e]">Transmis à Brazzaville (DGL)</span>
                <div className="font-garamond text-3xl font-bold text-[#006d2f] mt-0.5">
                  {establishments.filter((e) => e.status === 'transmis_brazzaville' || e.status === 'autorise_dgl').length}
                </div>
                <span className="font-sans text-[11px] text-[#006d2f] font-semibold">Circuit régalien respecté</span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#dcfce7] text-[#006d2f] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">send_time_extension</span>
              </div>
            </div>
          </div>

          {/* Regulatory Reminder Box */}
          <div className="bg-[#f0f9ff] border-l-4 border-[#0284c7] p-4 rounded-r-lg text-sm text-[#0c4a6e] flex items-start gap-3">
            <span className="material-symbols-outlined text-[#0284c7] text-[22px] shrink-0 mt-0.5">verified</span>
            <div className="font-sans text-xs space-y-1">
              <span className="font-bold text-[13px] block text-[#0369a1]">
                Nuance Réglementaire Cruciale : DDL-PN vs Direction Générale des Loisirs (Brazzaville)
              </span>
              <p>
                La DDL-PN <strong>ne délivre pas</strong> l'« Autorisation d'exploitation » définitive. Elle instruit le dossier, perçoit les frais légaux et délivre une <strong>« Attestation de dépôt »</strong> permettant d'ouvrir temporairement. Le dossier complet est formellement transmis à la Direction Générale à Brazzaville, qui seule délivre l'autorisation finale.
              </p>
            </div>
          </div>

          {/* Main List and Detailed Dossier View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Establishments List */}
            <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-[#dde2f3] p-4 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher par nom, promoteur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#c4c7d4] rounded-lg focus:outline-none focus:border-[#022448]"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[#747783] text-[18px]">search</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value as any)}
                    className="flex-1 text-xs border border-[#c4c7d4] rounded-lg px-2 py-1.5 bg-white"
                  >
                    <option value="ALL">Tous les secteurs</option>
                    <option value="formal">Secteur Formel (RCCM)</option>
                    <option value="informal">Secteur Informel (Pénalité)</option>
                  </select>

                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="flex-1 text-xs border border-[#c4c7d4] rounded-lg px-2 py-1.5 bg-white"
                  >
                    <option value="TOUS">Tous arrondissements</option>
                    <option value="Mpita">Arr. 1 Lumumba / Mpita</option>
                    <option value="Tié-Tié">Arr. 3 Tié-Tié</option>
                    <option value="Ngoyo">Arr. 6 Ngoyo</option>
                  </select>
                </div>
              </div>

              {/* Establishments Items */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {filteredEsts.map((est) => {
                  const isSelected = selectedEst?.id === est.id;
                  const balance = est.totalDue - est.paidAmount;
                  return (
                    <div
                      key={est.id}
                      onClick={() => setSelectedEst(est)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#022448] bg-[#f2f6ff] shadow-sm'
                          : 'border-[#e4e7f3] hover:bg-[#fafbff]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-[#747783]">{est.id}</span>
                          <h3 className="font-serif font-bold text-sm text-[#161c27]">{est.name}</h3>
                          <p className="font-sans text-[11px] text-[#43474e]">
                            Promoteur : <span className="font-semibold text-[#161c27]">{est.promoter}</span>
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase whitespace-nowrap ${
                            est.sector === 'formal'
                              ? 'bg-[#e0f2fe] text-[#0369a1]'
                              : 'bg-[#ffedd5] text-[#c2410c]'
                          }`}
                        >
                          {est.sector === 'formal' ? 'Formel' : 'Informel'}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] font-sans pt-2 border-t border-[#e4e7f3]">
                        <span className="text-[#43474e]">{est.activityLabel}</span>
                        <span className="font-mono font-bold text-[#006d2f]">
                          {est.paidAmount.toLocaleString('fr-FR')} / {est.totalDue.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>

                      {/* Status Tag */}
                      <div className="mt-1.5 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-0.5 rounded ${
                            est.status === 'autorise_dgl'
                              ? 'bg-[#dcfce7] text-[#15803d]'
                              : est.status === 'transmis_brazzaville'
                              ? 'bg-[#e0e7ff] text-[#4338ca]'
                              : est.status === 'attestation_depot'
                              ? 'bg-[#fef9c3] text-[#a16207]'
                              : est.status === 'mise_en_demeure'
                              ? 'bg-[#fee2e2] text-[#b91c1c]'
                              : est.status === 'fermeture_administrative'
                              ? 'bg-[#450a0a] text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {est.status === 'autorise_dgl' && 'Autorisé (DGL Brazzaville)'}
                          {est.status === 'transmis_brazzaville' && 'Transmis à Brazzaville'}
                          {est.status === 'attestation_depot' && 'Attestation de Dépôt (DDL)'}
                          {est.status === 'mise_en_demeure' && 'Mise en Demeure Active'}
                          {est.status === 'fermeture_administrative' && 'Fermeture Administrative'}
                          {est.status === 'identifie' && 'Identifié Terrain'}
                          {est.status === 'convoque' && 'Convoqué Direction'}
                        </span>

                        {balance > 0 ? (
                          <span className="text-[10px] font-sans text-[#c2410c] font-bold">
                            Reste: {balance.toLocaleString('fr-FR')} FCFA
                          </span>
                        ) : (
                          <span className="text-[10px] font-sans text-[#15803d] font-bold">Soldé</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Establishment File */}
            <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-[#dde2f3] p-5 space-y-5">
              {selectedEst ? (
                <>
                  {/* File Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dde2f3]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#747783] bg-[#f1f3ff] px-2 py-0.5 rounded">
                          {selectedEst.id}
                        </span>
                        <span
                          className={`font-sans text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            selectedEst.sector === 'formal'
                              ? 'bg-[#e0f2fe] text-[#0369a1]'
                              : 'bg-[#ffedd5] text-[#c2410c]'
                          }`}
                        >
                          Secteur {selectedEst.sector === 'formal' ? 'Formel (RCCM)' : 'Informel (Pénalité Régularisée)'}
                        </span>
                      </div>
                      <h2 className="font-garamond text-2xl font-bold text-[#022448] mt-1">{selectedEst.name}</h2>
                      <p className="font-sans text-xs text-[#43474e]">
                        {selectedEst.district} • {selectedEst.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptEst(selectedEst);
                          setCollectAmount(Math.min(50000, selectedEst.totalDue - selectedEst.paidAmount));
                        }}
                        className="bg-[#004528] hover:bg-[#00341e] text-white font-sans text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                        <span>Encaisser un Versement</span>
                      </button>
                    </div>
                  </div>

                  {/* Promoter & Technical Inspection Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#f9f9ff] p-3.5 rounded-lg border border-[#e4e7f3] space-y-1.5 text-xs font-sans">
                      <span className="font-bold text-[#022448] uppercase text-[10px] tracking-wider block">
                        Informations Exploitant &amp; Contact
                      </span>
                      <div>
                        <span className="text-[#747783]">Promoteur : </span>
                        <span className="font-bold text-[#161c27]">{selectedEst.promoter}</span>
                      </div>
                      <div>
                        <span className="text-[#747783]">Téléphone : </span>
                        <span className="font-mono font-bold text-[#161c27]">{selectedEst.phone}</span>
                      </div>
                      <div>
                        <span className="text-[#747783]">Numéro RCCM : </span>
                        <span className="font-mono text-[#161c27]">
                          {selectedEst.rccm || 'Non immatriculé (Secteur informel)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#747783]">Agent recenseur : </span>
                        <span className="text-[#161c27]">{selectedEst.identifiedBy}</span>
                      </div>
                    </div>

                    <div className="bg-[#f9f9ff] p-3.5 rounded-lg border border-[#e4e7f3] space-y-1.5 text-xs font-sans">
                      <span className="font-bold text-[#022448] uppercase text-[10px] tracking-wider block">
                        Assiette Fiscale &amp; Visite Technique
                      </span>
                      <div>
                        <span className="text-[#747783]">Activité assujettie : </span>
                        <span className="font-bold text-[#161c27]">{selectedEst.activityLabel}</span>
                      </div>
                      <div>
                        <span className="text-[#747783]">Superficie mesurée : </span>
                        <span className="font-mono font-bold text-[#006d2f]">{selectedEst.surfaceSqm} m²</span>
                        <span className="text-[#747783]"> ({selectedEst.ratePerSqm.toLocaleString('fr-FR')} FCFA/m²)</span>
                      </div>
                      <div>
                        <span className="text-[#747783]">Frais de dossier fixes : </span>
                        <span className="font-mono text-[#161c27]">{selectedEst.filingFee.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      {selectedEst.penaltyFee > 0 && (
                        <div>
                          <span className="text-[#c2410c]">Pénalité secteur informel : </span>
                          <span className="font-mono font-bold text-[#c2410c]">
                            +{selectedEst.penaltyFee.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Installment Plan (Échéancier en 2 à 4 tranches) */}
                  <div className="bg-[#f0f4fd] p-4 rounded-xl border border-[#d3ddfc] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#004528] text-[20px]">account_balance_wallet</span>
                        <h4 className="font-sans font-bold text-sm text-[#022448]">
                          Échéancier de Recouvrement ({selectedEst.installmentsCount} Tranches Légalement Négociées)
                        </h4>
                      </div>
                      <span className="font-mono text-xs text-[#004528] font-bold">
                        Total Liquidé : {selectedEst.totalDue.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-sans font-semibold">
                        <span className="text-[#006d2f]">
                          Encaissé : {selectedEst.paidAmount.toLocaleString('fr-FR')} FCFA (
                          {Math.round((selectedEst.paidAmount / selectedEst.totalDue) * 100)}%)
                        </span>
                        <span className="text-[#c2410c]">
                          Reste à recouvrer : {(selectedEst.totalDue - selectedEst.paidAmount).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <div className="w-full bg-[#d7e1fc] h-3 rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#006d2f] h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (selectedEst.paidAmount / selectedEst.totalDue) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Tranches breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-sans text-xs">
                      {Array.from({ length: selectedEst.installmentsCount }).map((_, idx) => {
                        const trancheAmount = Math.round(selectedEst.totalDue / selectedEst.installmentsCount);
                        const isPaid = selectedEst.paidAmount >= trancheAmount * (idx + 1);
                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded border ${
                              isPaid
                                ? 'bg-[#dcfce7] border-[#86efac] text-[#15803d]'
                                : 'bg-white border-[#d3ddfc] text-[#43474e]'
                            }`}
                          >
                            <span className="font-bold block text-[10px] uppercase">Tranche N°{idx + 1}</span>
                            <span className="font-mono font-bold text-xs">
                              {trancheAmount.toLocaleString('fr-FR')} FCFA
                            </span>
                            <span className="block text-[10px] mt-0.5 font-medium">
                              {isPaid ? 'Acquittée' : idx === 0 ? 'Exigible' : 'À terme'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Workflow Action Buttons: Attestation vs Brazzaville vs Mise en demeure vs Fiche Enquête */}
                  <div className="pt-2 border-t border-[#dde2f3] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDocView({ type: 'FICHE_ENQUETE', est: selectedEst })}
                        className="bg-[#004528] hover:bg-[#00341e] text-white font-sans text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        title="Générer et imprimer la fiche d'enquête de commodo et incommodo (30 000 FCFA)"
                      >
                        <span className="material-symbols-outlined text-[16px]">fact_check</span>
                        <span>Fiche d'Enquête Commodo (30 000 F)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveDocView({ type: 'ORDRE_SERVICE', est: selectedEst })}
                        className="bg-[#022448] hover:bg-[#142943] text-white font-sans text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        title="Consulter l'Ordre de Service N° 028/MCAPNIT/DGL/DDL-PN"
                      >
                        <span className="material-symbols-outlined text-[16px]">assignment</span>
                        <span>Ordre de Service N° 028</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveDocView({ type: 'ATTESTATION', est: selectedEst })}
                        className="bg-white hover:bg-[#f1f3ff] text-[#022448] border border-[#022448] font-sans text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">description</span>
                        <span>Attestation de Dépôt DDL</span>
                      </button>

                      {selectedEst.status !== 'transmis_brazzaville' && selectedEst.status !== 'autorise_dgl' && (
                        <button
                          type="button"
                          onClick={() => handleTransmitBrazzaville(selectedEst)}
                          className="bg-[#1e3a5f] hover:bg-[#142943] text-white font-sans text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
                          <span>Transmettre à Brazzaville</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleIssueMiseEnDemeure(selectedEst)}
                        className="bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] border border-[#fca5a5] font-sans text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        <span>Mise en Demeure</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTriggerClosure(selectedEst)}
                        className="bg-[#450a0a] hover:bg-[#2e0707] text-white font-sans text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                        <span>Arrêté de Fermeture</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment History Table */}
                  <div className="space-y-2">
                    <span className="font-sans font-bold text-xs uppercase text-[#43474e] tracking-wider block">
                      Historique des Encaissements &amp; Échéances Définies
                    </span>
                    {selectedEst.paymentHistory.length === 0 ? (
                      <p className="font-serif italic text-xs text-[#747783] bg-[#f9f9ff] p-3 rounded text-center">
                        Aucun paiement enregistré pour l'instant. L'exploitant est en cours de régularisation.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-[#e4e7f3] rounded-lg">
                        <table className="w-full text-left font-sans text-xs">
                          <thead className="bg-[#f2f4fc] text-[#43474e] font-bold text-[10px] uppercase">
                            <tr>
                              <th className="p-2.5">Date &amp; Heure</th>
                              <th className="p-2.5">Référence Reçu</th>
                              <th className="p-2.5">Montant Perçu</th>
                              <th className="p-2.5">Lieu d'Encaissement</th>
                              <th className="p-2.5">Agent / Régisseur</th>
                              <th className="p-2.5">Prochaine Échéance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e4e7f3]">
                            {selectedEst.paymentHistory.map((h) => (
                              <tr key={h.id} className="hover:bg-[#f9f9ff]">
                                <td className="p-2.5 font-mono text-[11px]">{h.date}</td>
                                <td className="p-2.5 font-mono font-bold text-[#022448]">{h.receiptRef}</td>
                                <td className="p-2.5 font-mono font-bold text-[#006d2f]">
                                  {h.amount.toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      h.location === 'TERRAIN'
                                        ? 'bg-[#fef3c7] text-[#92400e]'
                                        : 'bg-[#e0e7ff] text-[#3730a3]'
                                    }`}
                                  >
                                    {h.location === 'TERRAIN' ? 'Sur le Terrain' : 'À la Direction'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-[#43474e]">{h.collectedBy}</td>
                                <td className="p-2.5 font-semibold text-[#c2410c]">{h.nextDueDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-[#747783] font-serif italic">
                  Sélectionnez un établissement pour afficher son dossier complet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RECOUVREMENT SUR LE TERRAIN & REÇUS D'ÉCHÉANCE */}
      {activeSubTab === 'recouvrement' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#dde2f3] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#dde2f3]">
              <div>
                <h3 className="font-garamond text-xl font-bold text-[#022448]">
                  Caisse Mobile de Terrain &amp; Autorité d'Encaissement Immédiat
                </h3>
                <p className="font-sans text-xs text-[#43474e] mt-0.5">
                  Conformément au processus métier DDL-PN : Les agents SAA sont habilités à percevoir sur place, avec délivrance obligatoire d'un reçu stipulant la <strong>prochaine date d'échéance</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('agenda-rdv')}
                  className="bg-[#022448] hover:bg-[#001c3b] text-[#ffe082] font-sans text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span>Basculer vers l&apos;Agenda Rdv Google</span>
                </button>
                <span className="font-sans text-xs font-bold text-[#006d2f] bg-[#dcfce7] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Perception Habilitée DDL-PN</span>
                </span>
              </div>
            </div>

            {/* Quick action grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {establishments.map((est) => {
                const remaining = est.totalDue - est.paidAmount;
                return (
                  <div key={est.id} className="p-4 rounded-xl border border-[#dde2f3] bg-[#fdfdfe] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#747783]">{est.id}</span>
                        <h4 className="font-serif font-bold text-sm text-[#161c27]">{est.name}</h4>
                        <span className="text-xs text-[#43474e] block">{est.promoter}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          remaining === 0 ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#991b1b]'
                        }`}
                      >
                        {remaining === 0 ? 'Soldé' : 'Solde Dû'}
                      </span>
                    </div>

                    <div className="bg-[#f1f3ff] p-2.5 rounded font-sans text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#747783]">Total Dû :</span>
                        <span className="font-mono font-bold">{est.totalDue.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#747783]">Déjà Versé :</span>
                        <span className="font-mono font-bold text-[#006d2f]">{est.paidAmount.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#d3ddfc]">
                        <span className="font-bold text-[#c2410c]">Reste :</span>
                        <span className="font-mono font-bold text-[#c2410c]">{remaining.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="text-[11px] text-[#43474e] pt-1">
                        Prochaine échéance : <span className="font-semibold text-[#022448]">{est.nextDueDate}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={remaining <= 0}
                      onClick={() => {
                        setReceiptEst(est);
                        setCollectAmount(Math.min(50000, remaining));
                      }}
                      className={`w-full py-2 rounded-lg font-sans text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors ${
                        remaining <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#004528] hover:bg-[#00341e] text-white shadow-sm cursor-pointer'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      <span>{remaining <= 0 ? 'Entièrement Acquitté' : 'Encaisser & Émettre Reçu'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SANCTIONS, MISES EN DEMEURE & FERMETURES */}
      {activeSubTab === 'sanctions' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#dde2f3] shadow-sm space-y-4">
            <div>
              <h3 className="font-garamond text-xl font-bold text-[#991b1b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
                <span>Chaîne de Sanctions : Non-Paiement, Faux Rendez-Vous &amp; Récidive</span>
              </h3>
              <p className="font-sans text-xs text-[#43474e] mt-1">
                Protocole strict : (1) Constat d'infraction &rarr; (2) Convocation &rarr; (3) Mise en demeure officielle avec délai de rigueur &rarr; (4) Arrêté de Fermeture Administrative avec scellés.
              </p>
            </div>

            <div className="overflow-x-auto border border-[#fecaca] rounded-xl">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-[#fef2f2] text-[#991b1b] font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Établissement &amp; Promoteur</th>
                    <th className="p-3">Arrondissement</th>
                    <th className="p-3">Statut Infraction</th>
                    <th className="p-3">Motif Notifié</th>
                    <th className="p-3">Dernière Action Légale</th>
                    <th className="p-3 text-right">Action Immédiate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fee2e2]">
                  {establishments
                    .filter((e) => e.status === 'mise_en_demeure' || e.status === 'fermeture_administrative' || e.sanctions.length > 0)
                    .map((est) => (
                      <tr key={est.id} className="hover:bg-[#fff7f7]">
                        <td className="p-3">
                          <span className="font-mono text-[10px] text-[#747783]">{est.id}</span>
                          <div className="font-serif font-bold text-sm text-[#161c27]">{est.name}</div>
                          <span className="text-xs text-[#43474e]">{est.promoter} ({est.phone})</span>
                        </td>
                        <td className="p-3 text-[#43474e]">{est.district}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                              est.status === 'fermeture_administrative'
                                ? 'bg-[#450a0a] text-white'
                                : 'bg-[#fee2e2] text-[#991b1b]'
                            }`}
                          >
                            {est.status === 'fermeture_administrative' ? 'Fermé Administrativement' : 'Sous Mise en Demeure'}
                          </span>
                        </td>
                        <td className="p-3 text-[#7f1d1d] font-serif italic max-w-xs">
                          {est.sanctions[0]?.reason || 'Défaut de paiement et d’immatriculation'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#991b1b]">
                          {est.sanctions[0]?.deadline || 'Échéance légale'}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setActiveDocView({ type: 'MISE_EN_DEMEURE', est })}
                            className="px-3 py-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] border border-[#fca5a5] rounded text-xs font-bold cursor-pointer"
                          >
                            Voir l'Acte
                          </button>
                          {est.status !== 'fermeture_administrative' && (
                            <button
                              type="button"
                              onClick={() => handleTriggerClosure(est)}
                              className="px-3 py-1 bg-[#450a0a] hover:bg-[#2e0707] text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Prononcer Fermeture
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GESTION DE LA FLOTTE SAFM & MULTI-TENANT */}
      {activeSubTab === 'safm-agents' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#dde2f3] shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#dde2f3]">
              <div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#006d2f] bg-[#dcfce7] px-2.5 py-0.5 rounded">
                  Service Administratif, Finances et Matériel (SAFM)
                </span>
                <h3 className="font-garamond text-xl font-bold text-[#022448] mt-1">
                  Gestion des Comptes Agents de Terrain &amp; Attribution Matérielle
                </h3>
                <p className="font-sans text-xs text-[#43474e]">
                  Conformément à la règle de sécurité régalienne : le SAFM gère les badges, les lignes téléphoniques professionnelles et les accès.
                </p>
              </div>

              <div className="text-right">
                <span className="font-sans text-xs text-[#747783] block">Flotte Active DDL-PN</span>
                <span className="font-garamond text-2xl font-bold text-[#022448]">{agents.length} Agents Habilités</span>
              </div>
            </div>

            {/* Agents Table */}
            <div className="overflow-x-auto border border-[#dde2f3] rounded-xl">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-[#f0f3ff] text-[#43474e] font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Identifiant &amp; Agent</th>
                    <th className="p-3">Badge Matricule</th>
                    <th className="p-3">Ligne Téléphonique Attribuée</th>
                    <th className="p-3">Rôle Opérationnel</th>
                    <th className="p-3">Dernière Synchronisation</th>
                    <th className="p-3">Total Recouvrements</th>
                    <th className="p-3 text-right">Statut SAFM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dde2f3]">
                  {agents.map((ag) => (
                    <tr key={ag.id} className="hover:bg-[#f9f9ff]">
                      <td className="p-3">
                        <span className="font-mono text-[10px] text-[#747783]">{ag.id}</span>
                        <div className="font-bold text-sm text-[#161c27]">{ag.name}</div>
                        <span className="text-[10px] text-[#006d2f] font-semibold">{ag.service}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#022448]">{ag.badgeNumber}</td>
                      <td className="p-3 font-mono text-xs text-[#43474e]">{ag.phoneLine}</td>
                      <td className="p-3 font-semibold text-[#161c27]">{ag.role}</td>
                      <td className="p-3 text-[11px] text-[#43474e]">{ag.lastSync}</td>
                      <td className="p-3 font-mono font-bold text-[#006d2f]">
                        {ag.collectionsTotal.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dcfce7] text-[#15803d]">
                          {ag.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Multi-Tenant Reusability Showcase */}
            <div className="bg-[#f0f9ff] p-5 rounded-xl border border-[#bae6fd] space-y-3">
              <div className="flex items-center gap-2 text-[#0369a1]">
                <span className="material-symbols-outlined text-[24px]">domain_add</span>
                <h4 className="font-garamond text-lg font-bold">
                  Architecture Multi-Tenant : Déploiement &amp; Monétisation Autres Administrations
                </h4>
              </div>
              <p className="font-sans text-xs text-[#0c4a6e]">
                La plateforme a été isolée architecturalement pour permettre une instanciation immédiate pour d'autres directions et mairies sans réécriture du cœur :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="bg-white p-3 rounded-lg border border-[#bae6fd] text-xs font-sans">
                  <span className="font-bold text-[#022448] block text-[11px]">🏛️ Mairie de Pointe-Noire</span>
                  <span className="text-[#43474e] text-[11px] block mt-0.5">
                    Occupation du domaine public (ODP), marchés domaniaux, terrasses communales.
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#bae6fd] text-xs font-sans">
                  <span className="font-bold text-[#022448] block text-[11px]">📦 Direction du Commerce</span>
                  <span className="text-[#43474e] text-[11px] block mt-0.5">
                    Recensement des commerces de détail, licence d'exploitation commerciale, contrôles de prix.
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#bae6fd] text-xs font-sans">
                  <span className="font-bold text-[#022448] block text-[11px]">🚕 Transports Urbains</span>
                  <span className="text-[#43474e] text-[11px] block mt-0.5">
                    Taxis, bus urbains, vignettes communales de stationnement et droits de ligne.
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#bae6fd] text-xs font-sans">
                  <span className="font-bold text-[#022448] block text-[11px]">📐 Cadastre &amp; Urbanisme</span>
                  <span className="text-[#43474e] text-[11px] block mt-0.5">
                    Taxes foncières d'aménagement, permis de construire et droits de place temporaires.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SPÉCIFICATION FONCTIONNELLE & TECHNIQUE COMPLÈTE */}
      {activeSubTab === 'architecture-spec' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#dde2f3] shadow-sm space-y-8 text-[#161c27]">
          {/* Header */}
          <div className="border-b border-[#dde2f3] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase text-[#006d2f] bg-[#dcfce7] px-3 py-1 rounded">
                DOCUMENT D'ARCHITECTURE OFFICIEL • DDL-PN SAAS V1.0
              </span>
              <h2 className="font-garamond text-3xl font-bold text-[#022448] mt-2">
                Spécification Fonctionnelle &amp; Technique d'Architecture SaaS
              </h2>
              <p className="font-serif italic text-sm text-[#43474e] mt-1">
                Plateforme Intégrée de Recensement, Recouvrement Échéancé, Traçabilité Régisseur &amp; Rédaction Juridique
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs text-[#747783] block">Cible : Google AI Studio &amp; Vercel</span>
              <span className="font-mono text-xs text-[#747783] block">Articulations : Android DDL-Autorisations (Firebase)</span>
            </div>
          </div>

          {/* Section 1: Business Process Source of Truth */}
          <div className="space-y-4">
            <h3 className="font-garamond text-2xl font-bold text-[#022448] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#004528] text-white flex items-center justify-center font-sans text-sm">1</span>
              <span>Processus Métier Strict &amp; Double Piste de Traitement</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans leading-relaxed">
              <div className="bg-[#f8faff] p-4 rounded-xl border border-[#d3ddfc] space-y-2">
                <h4 className="font-bold text-sm text-[#022448] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#0284c7]">corporate_fare</span>
                  <span>Piste A : Secteur Formel (RCCM Immatriculé)</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-[#43474e]">
                  <li>L'exploitant dispose d'un RCCM ou équivalent officiel d'immatriculation.</li>
                  <li>Instruction formelle complète avec vérification d'hygiène, sécurité et salubrité.</li>
                  <li>Frais de dossier fixes : <strong>30 000 FCFA</strong>.</li>
                  <li>Redevance au m² selon le barème dynamique de la table de configuration (ex: 3 000 FCFA pour VIP, 2 500 pour Club, 1 200 pour Bar).</li>
                  <li>Délivrance de l'Attestation de Dépôt DDL-PN puis transmission à Brazzaville.</li>
                </ul>
              </div>

              <div className="bg-[#fffbf7] p-4 rounded-xl border border-[#fed7aa] space-y-2">
                <h4 className="font-bold text-sm text-[#c2410c] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#c2410c]">storefront</span>
                  <span>Piste B : Secteur Informel (Pénalité &amp; Échéancier)</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-[#43474e]">
                  <li>Établissement non immatriculé identifié proactivement sur le terrain par un agent SAA.</li>
                  <li>Pénalité de <strong>50 000 FCFA</strong> (négociable et modulable pour ne pas asphyxier l'activité).</li>
                  <li>Fractionnement systématique de l'échéancier en <strong>2 à 4 tranches</strong>.</li>
                  <li>Fiche exploitant unique partagée entre le terrain et la direction pour prévenir toute double perception.</li>
                  <li>Encaissement sur place possible avec reçu immédiat portant mention de la prochaine date d'échéance.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Database Schema & Entity Relationships */}
          <div className="space-y-4">
            <h3 className="font-garamond text-2xl font-bold text-[#022448] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#004528] text-white flex items-center justify-center font-sans text-sm">2</span>
              <span>Modèle de Données &amp; Schéma Relationnel Centralisé</span>
            </h3>
            <div className="bg-[#1e293b] text-[#f8fafc] p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
              <div className="text-[#38bdf8] font-bold">// Entités Clés du Schéma de Données DDL-PN</div>
              <p>
                <strong>Establishment</strong> (id, code, name, district, address, surface_sqm, activity_type_code, sector [formal|informal], rccm, created_at, status [identifie | attestation_depot | transmis_brazzaville | autorise_dgl | mise_en_demeure | fermeture])
              </p>
              <p>
                <strong>Operator_Tenant</strong> (id, establishment_id, full_name, phone_primary, phone_secondary, national_id, email)
              </p>
              <p>
                <strong>Payment_Installment</strong> (id, establishment_id, receipt_ref, tranche_number, amount_paid, total_tranche, payment_date, collected_by_agent_id, collection_location [TERRAIN|DIRECTION], next_due_date, sync_timestamp)
              </p>
              <p>
                <strong>Activity_Pricing_Config</strong> (code, label, rate_per_sqm, is_leisure_qualified, decree_reference, last_modified_by, version)
              </p>
              <p>
                <strong>Sanction_Audit</strong> (id, establishment_id, sanction_type [CONVOCATION | MISE_EN_DEMEURE | FERMETURE], date_issued, deadline, reason, signed_by, status)
              </p>
              <p>
                <strong>Agent_SAFM</strong> (id, badge_number, full_name, phone_line, service [SAA|SAFM|DIR], status [ACTIF|SUSPENDU], last_sync_at)
              </p>
            </div>
          </div>

          {/* Section 3: User Roles & Permissions Matrix */}
          <div className="space-y-4">
            <h3 className="font-garamond text-2xl font-bold text-[#022448] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#004528] text-white flex items-center justify-center font-sans text-sm">3</span>
              <span>Matrice des Rôles &amp; Permissions (RBAC)</span>
            </h3>
            <div className="overflow-x-auto border border-[#dde2f3] rounded-xl text-xs font-sans">
              <table className="w-full text-left">
                <thead className="bg-[#f0f3ff] text-[#022448] font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Fonction / Rôle</th>
                    <th className="p-3">Recensement Terrain</th>
                    <th className="p-3">Encaissement &amp; Reçus</th>
                    <th className="p-3">Attestation Dépôt</th>
                    <th className="p-3">Mise en Demeure / Fermeture</th>
                    <th className="p-3">Gestion Tarifs &amp; Comptes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dde2f3]">
                  <tr>
                    <td className="p-3 font-bold text-[#022448]">Agent de Terrain (SAA)</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Création &amp; Géoloc</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Émission Reçu Immédiat</td>
                    <td className="p-3 text-[#747783]">Lecture seule</td>
                    <td className="p-3 text-[#747783]">Signalement</td>
                    <td className="p-3 text-red-500 font-bold">✗ Interdit</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-[#022448]">Chef de Service SAFM</td>
                    <td className="p-3 text-[#747783]">Supervision</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Encaissement Guichet</td>
                    <td className="p-3 text-[#747783]">Archivage</td>
                    <td className="p-3 text-[#747783]">Notification financière</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Flotte &amp; Badges</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-[#022448]">Direction DDL-PN / Jacques</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Contrôle Total</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Validation Caisse</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Signature &amp; Délivrance</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Signature Arrêtés</td>
                    <td className="p-3 text-[#006d2f] font-bold">✓ Évolution Tarifs m²</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Roadmap in 4 Phases */}
          <div className="space-y-4">
            <h3 className="font-garamond text-2xl font-bold text-[#022448] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#004528] text-white flex items-center justify-center font-sans text-sm">4</span>
              <span>Feuille de Route en 4 Phases (Roadmap)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
              <div className="p-4 rounded-xl border border-[#dde2f3] bg-[#f8faff] space-y-2">
                <span className="font-bold text-[#0284c7] block text-xs uppercase">Phase 1 : MVP</span>
                <p className="font-bold text-[#022448]">Administration &amp; Cœur Tactique</p>
                <p className="text-[#43474e]">
                  Atelier A4, Registre des dossiers, identification de base sur le terrain, grille tarifaire paramétrable par Jacques.
                </p>
                <span className="text-[10px] text-[#006d2f] font-semibold block">Délai : 3 semaines</span>
              </div>

              <div className="p-4 rounded-xl border border-[#dde2f3] bg-[#f8faff] space-y-2">
                <span className="font-bold text-[#006d2f] block text-xs uppercase">Phase 2 : Version Pro</span>
                <p className="font-bold text-[#022448]">Recouvrement Mobile &amp; Sanctions</p>
                <p className="text-[#43474e]">
                  Caisse de terrain, gestion des 2 à 4 tranches, reçus instantanés avec date de prochaine échéance, mise en demeure et fermetures.
                </p>
                <span className="text-[10px] text-[#006d2f] font-semibold block">Délai : 4 semaines</span>
              </div>

              <div className="p-4 rounded-xl border border-[#dde2f3] bg-[#f8faff] space-y-2">
                <span className="font-bold text-[#d97706] block text-xs uppercase">Phase 3 : Multi-Tenant</span>
                <p className="font-bold text-[#022448]">Revente aux Administrations</p>
                <p className="text-[#43474e]">
                  Cloisonnement multi-tenants, intégration Mairie de Pointe-Noire (ODP), Commerce, Transports et Cadastre.
                </p>
                <span className="text-[10px] text-[#006d2f] font-semibold block">Délai : 6 semaines</span>
              </div>

              <div className="p-4 rounded-xl border border-[#dde2f3] bg-[#f8faff] space-y-2">
                <span className="font-bold text-[#7c3aed] block text-xs uppercase">Phase 4 : IA &amp; Prédictif</span>
                <p className="font-bold text-[#022448]">Optimisation des Tournées &amp; Recouvrement</p>
                <p className="text-[#43474e]">
                  Détection des zones informelles par analyse cadastrale, génération automatique des rapports trimestriels pour Brazzaville.
                </p>
                <span className="text-[10px] text-[#006d2f] font-semibold block">Délai : 4 semaines</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORMULAIRE DE RECENSEMENT PROACTIF TERRAIN */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-[#dde2f3] my-8 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006d2f] text-[24px]">add_location_alt</span>
                <h3 className="font-garamond text-xl font-bold text-[#022448]">
                  Fiche de Recensement Proactif sur le Terrain
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateIdentification} className="space-y-4 mt-4 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#161c27] block mb-1">Nom Présumé de l'Établissement *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Le Cercle des Artistes"
                    value={newEstName}
                    onChange={(e) => setNewEstName(e.target.value)}
                    className="w-full p-2 border border-[#c4c7d4] rounded-lg focus:outline-none focus:border-[#004528]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#161c27] block mb-1">Nom de l'Exploitant / Promoteur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean-Marie NGOMA"
                    value={newPromoter}
                    onChange={(e) => setNewPromoter(e.target.value)}
                    className="w-full p-2 border border-[#c4c7d4] rounded-lg focus:outline-none focus:border-[#004528]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#161c27] block mb-1">Téléphone Promoteur</label>
                  <input
                    type="text"
                    placeholder="+242 06 ..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 border border-[#c4c7d4] rounded-lg focus:outline-none focus:border-[#004528]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#161c27] block mb-1">Arrondissement / Zone</label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full p-2 border border-[#c4c7d4] rounded-lg bg-white"
                  >
                    <option value="Mpita, Arrondissement 1 Lumumba">Arr. 1 Lumumba (Mpita)</option>
                    <option value="Arrondissement 2 Mvou-Mvou">Arr. 2 Mvou-Mvou</option>
                    <option value="Arrondissement 3 Tié-Tié">Arr. 3 Tié-Tié</option>
                    <option value="Arrondissement 4 Loandjili">Arr. 4 Loandjili</option>
                    <option value="Arrondissement 5 Mongo-Mpoukou">Arr. 5 Mongo-Mpoukou</option>
                    <option value="Ngoyo, Arrondissement 6">Arr. 6 Ngoyo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#161c27] block mb-1">Adresse ou Repère Visuel Précis</label>
                <input
                  type="text"
                  placeholder="Ex: Face Marché Central, vers la Boulangerie..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full p-2 border border-[#c4c7d4] rounded-lg focus:outline-none focus:border-[#004528]"
                />
              </div>

              {/* Sector selection */}
              <div className="p-3 bg-[#f8faff] rounded-xl border border-[#d3ddfc] space-y-2">
                <span className="font-bold text-[#022448] block text-[11px] uppercase">
                  Piste de Traitement Réglementaire
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sector"
                      value="informal"
                      checked={newSector === 'informal'}
                      onChange={() => setNewSector('informal')}
                    />
                    <span className="font-semibold text-[#c2410c]">Secteur Informel (Pénalité 50 000 FCFA + Échéancier)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sector"
                      value="formal"
                      checked={newSector === 'formal'}
                      onChange={() => setNewSector('formal')}
                    />
                    <span className="font-semibold text-[#0369a1]">Secteur Formel (RCCM Enregistré)</span>
                  </label>
                </div>

                {newSector === 'formal' ? (
                  <div className="mt-2">
                    <label className="block text-[11px] font-bold text-[#43474e] mb-1">Numéro RCCM *</label>
                    <input
                      type="text"
                      placeholder="CG-PNR-..."
                      value={newRccm}
                      onChange={(e) => setNewRccm(e.target.value)}
                      className="w-full p-1.5 border border-[#c4c7d4] rounded bg-white"
                    />
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#43474e] mb-1">Pénalité Négociée (FCFA)</label>
                      <input
                        type="number"
                        value={newNegotiatedPenalty}
                        onChange={(e) => setNewNegotiatedPenalty(Number(e.target.value))}
                        className="w-full p-1.5 border border-[#c4c7d4] rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#43474e] mb-1">Nombre de Tranches</label>
                      <select
                        value={newInstallmentsCount}
                        onChange={(e) => setNewInstallmentsCount(Number(e.target.value) as any)}
                        className="w-full p-1.5 border border-[#c4c7d4] rounded bg-white"
                      >
                        <option value={2}>2 Tranches</option>
                        <option value={3}>3 Tranches</option>
                        <option value={4}>4 Tranches</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity and Surface */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#161c27] block mb-1">Type d'Activité de Loisirs</label>
                  <select
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    className="w-full p-2 border border-[#c4c7d4] rounded-lg bg-white"
                  >
                    <option value="ACT-BAR">Bar Standard (1 200 FCFA/m²)</option>
                    <option value="ACT-CLUB">Nightclub / Discothèque (2 500 FCFA/m²)</option>
                    <option value="ACT-VIP">VIP Lounge (3 000 FCFA/m²)</option>
                    <option value="ACT-TERR">Terrasse Plein Air (800 FCFA/m²)</option>
                    <option value="ACT-CAB">Cabaret Artistique (1 800 FCFA/m²)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#161c27] block mb-1">Superficie Estimée (m²)</label>
                  <input
                    type="number"
                    value={newSurface}
                    onChange={(e) => setNewSurface(Number(e.target.value))}
                    className="w-full p-2 border border-[#c4c7d4] rounded-lg focus:outline-none focus:border-[#004528]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#dde2f3] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-[#c4c7d4] rounded-lg text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004528] hover:bg-[#00341e] text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Enregistrer &amp; Émettre Convocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENCAISSEMENT SUR LE TERRAIN & ÉMISSION REÇU */}
      {receiptEst && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-[#dde2f3] animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006d2f] text-[24px]">point_of_sale</span>
                <h3 className="font-garamond text-xl font-bold text-[#022448]">
                  Encaissement &amp; Reçu de Perception Officiel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptEst(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4 mt-4 font-sans text-xs">
              <div className="bg-[#f0f9ff] p-3 rounded-lg border border-[#bae6fd] space-y-1">
                <span className="font-bold text-[#0369a1] block">Établissement Assujetti</span>
                <div className="text-[#0c4a6e] font-bold text-sm">{receiptEst.name}</div>
                <div className="text-[#0c4a6e]">Promoteur : {receiptEst.promoter}</div>
                <div className="flex justify-between pt-1 border-t border-[#bae6fd] text-[11px] font-mono">
                  <span>Total : {receiptEst.totalDue.toLocaleString('fr-FR')} FCFA</span>
                  <span className="text-[#c2410c] font-bold">
                    Reste : {(receiptEst.totalDue - receiptEst.paidAmount).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#161c27] block mb-1">Montant Perçu en Espèces (FCFA) *</label>
                <input
                  type="number"
                  required
                  min={5000}
                  max={receiptEst.totalDue - receiptEst.paidAmount}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-[#c4c7d4] rounded-lg font-mono text-sm font-bold text-[#004528] focus:outline-none focus:border-[#004528]"
                />
              </div>

              <div>
                <label className="font-bold text-[#161c27] block mb-1">Lieu de Recouvrement</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="loc"
                      value="TERRAIN"
                      checked={collectLocation === 'TERRAIN'}
                      onChange={() => setCollectLocation('TERRAIN')}
                    />
                    <span className="font-semibold text-[#161c27]">Sur le Terrain (Agent SAA)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="loc"
                      value="DIRECTION"
                      checked={collectLocation === 'DIRECTION'}
                    />
                    <span className="font-semibold text-[#161c27]">Guichet Central Direction</span>
                  </label>
                </div>
              </div>

              {/* Obligatory Next Due Date */}
              <div className="p-3 bg-[#fffbf7] rounded-lg border border-[#fed7aa]">
                <label className="font-bold text-[#9a3412] block mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>Date de la Prochaine Échéance (Mention Obligatoire sur le Reçu) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 15/04/2026"
                  value={nextDueDateInput}
                  onChange={(e) => setNextDueDateInput(e.target.value)}
                  className="w-full p-2 border border-[#fed7aa] rounded bg-white text-xs font-bold text-[#9a3412]"
                />
                <span className="text-[10px] text-[#747783] block mt-1">
                  Cette date sera imprimée sur le reçu remis à l'exploitant et déclenchera le rappel automatique.
                </span>
              </div>

              <div className="pt-3 border-t border-[#dde2f3] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptEst(null)}
                  className="px-4 py-2 border border-[#c4c7d4] rounded-lg text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004528] hover:bg-[#00341e] text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Valider l'Encaissement &amp; Émettre Reçu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AFFICHAGE DU REÇU OFFICIEL AVEC PROCHAINE ÉCHÉANCE */}
      {generatedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-[#022448] animate-fade-in text-center font-sans space-y-4">
            <div className="flex justify-center items-center gap-3">
              <ArmoiriesCongo size={46} />
              <div className="h-8 w-[1px] bg-gray-200"></div>
              <LogoDDLPN size={44} />
            </div>

            <div className="border-b-2 border-[#022448] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-[#022448]">
                RÉPUBLIQUE DU CONGO
              </span>
              <span className="text-[9px] text-[#43474e] block">Unité - Travail - Progrès</span>
              <span className="text-[10px] font-bold text-[#004528] block mt-1 uppercase">
                Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)
              </span>
              <h4 className="font-garamond text-lg font-bold text-[#022448] mt-1">
                REÇU DE PERCEPTION RÉGALIENNE N° {generatedReceipt.receiptRef}
              </h4>
            </div>

            <div className="bg-[#f8faff] p-3 rounded-lg border border-[#d3ddfc] text-left text-xs space-y-1">
              <div>
                <span className="text-[#747783]">Établissement : </span>
                <span className="font-bold text-[#161c27]">{generatedReceipt.estName}</span>
              </div>
              <div>
                <span className="text-[#747783]">Promoteur : </span>
                <span className="font-semibold text-[#161c27]">{generatedReceipt.promoter}</span>
              </div>
              <div>
                <span className="text-[#747783]">Montant Encaissé : </span>
                <span className="font-mono font-bold text-[#006d2f] text-sm">
                  {generatedReceipt.amount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div>
                <span className="text-[#747783]">Solde Restant à cette date : </span>
                <span className="font-mono font-bold text-[#c2410c]">
                  {generatedReceipt.balanceRemaining.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="p-2 bg-[#ffedd5] rounded mt-2 border border-[#fed7aa]">
                <span className="text-[10px] font-bold uppercase text-[#9a3412] block">
                  Prochaine Date d'Échéance Légale :
                </span>
                <span className="font-mono text-sm font-bold text-[#9a3412] block">
                  {generatedReceipt.nextDueDate}
                </span>
              </div>
              <div className="text-[10px] text-[#747783] pt-1">
                Perçu le {generatedReceipt.date} par {generatedReceipt.agent}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-[#022448] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Imprimer Reçu Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setGeneratedReceipt(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VISIONNEUSE D'ACTE OFFICIEL (ATTESTATION / MISE EN DEMEURE / FICHE ENQUÊTE / ORDRE DE SERVICE) */}
      {activeDocView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-[#dde2f3] animate-fade-in space-y-6">
            <div className="flex justify-between items-start border-b border-[#dde2f3] pb-3">
              <span className="font-mono text-xs font-bold uppercase text-[#022448]">
                {activeDocView.type === 'FICHE_ENQUETE' && "FICHE D'ENQUÊTE DE COMMODO & INCOMMODO • SAA / DDL-PN"}
                {activeDocView.type === 'ORDRE_SERVICE' && 'ORDRE DE SERVICE N° 028/MCAPNIT/DGL/DDL-PN'}
                {activeDocView.type === 'ATTESTATION' && 'ATTESTATION OFFICIELLE DE DÉPÔT (DDL-PN)'}
                {activeDocView.type === 'MISE_EN_DEMEURE' && 'ACTE DE MISE EN DEMEURE AVANT FERMETURE ADMINISTRATIVE'}
              </span>
              <button
                type="button"
                onClick={() => setActiveDocView(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Official Document Sheet Preview */}
            <div className="p-6 sm:p-8 bg-white border border-[#c4c7d4] rounded shadow-inner font-serif text-xs text-[#161c27] space-y-4 leading-relaxed">
              {/* Header */}
              <div className="flex justify-between items-start text-[10px] font-sans">
                <div>
                  <p className="font-bold text-[#022448] uppercase">MINISTÈRE DE LA CULTURE, DES ARTS,</p>
                  <p className="font-bold text-[#022448] uppercase">DU PATRIMOINE NATIONAL ET DU TOURISME</p>
                  <p className="text-[#43474e]">DIRECTION GÉNÉRALE DES LOISIRS</p>
                  <p className="font-bold text-[#006d2f]">DIRECTION DÉPARTEMENTALE DE POINTE-NOIRE</p>
                  <p className="font-mono mt-1 text-[#747783]">
                    {activeDocView.type === 'FICHE_ENQUETE' && `RÉF : DDL-PN/SAA/ENQ-2026-${activeDocView.est.id.replace('EST-', '')}`}
                    {activeDocView.type === 'ORDRE_SERVICE' && 'RÉF : N° 028/MCAPNIT/DGL/DDL-PN'}
                    {activeDocView.type === 'ATTESTATION' && `RÉF : DDL-PN/SAA/ATT-2026-${activeDocView.est.id.replace('EST-', '')}`}
                    {activeDocView.type === 'MISE_EN_DEMEURE' && `RÉF : DDL-PN/SAA/MED-2026-${activeDocView.est.id.replace('EST-', '')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#022448] uppercase">RÉPUBLIQUE DU CONGO</p>
                  <p className="italic text-[#43474e]">Unité - Travail - Progrès</p>
                  <div className="flex justify-end mt-1">
                    <RepublicSeal size={32} />
                  </div>
                </div>
              </div>

              {/* Tricolor line */}
              <div className="h-0.5 w-full flex">
                <div className="h-full w-1/3 bg-[#006d2f]"></div>
                <div className="h-full w-1/3 bg-[#fbbf24]"></div>
                <div className="h-full w-1/3 bg-[#dc2626]"></div>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1">
                <h3 className="font-garamond text-xl font-bold uppercase text-[#022448]">
                  {activeDocView.type === 'FICHE_ENQUETE' && "FICHE D'ENQUÊTE DE COMMODO & INCOMMODO / CONFORMITÉ TECHNIQUE"}
                  {activeDocView.type === 'ORDRE_SERVICE' && 'ORDRE DE SERVICE N° 028/MCAPNIT/DGL/DDL-PN'}
                  {activeDocView.type === 'ATTESTATION' && 'ATTESTATION PROVISOIRE DE DÉPÔT DE DOSSIER'}
                  {activeDocView.type === 'MISE_EN_DEMEURE' && 'MISE EN DEMEURE OFFICIELLE AVANT FERMETURE ADMINISTRATIVE'}
                </h3>
                <p className="text-[11px] font-sans italic text-[#747783]">
                  {activeDocView.type === 'FICHE_ENQUETE' && "Visite technique in situ préalable à l'homologation & perception des droits légaux"}
                  {activeDocView.type === 'ORDRE_SERVICE' && 'Mission départementale de recensement, contrôle et recouvrement forcé des loisirs'}
                  {activeDocView.type === 'ATTESTATION' && 'Valable pendant l’instruction préalable à la transmission à la Direction Générale (Brazzaville)'}
                  {activeDocView.type === 'MISE_EN_DEMEURE' && 'Délai légal de rigueur : 8 jours (ou 72h) à compter de la présente notification'}
                </p>
              </div>

              {/* Body Content according to type */}
              {activeDocView.type === 'FICHE_ENQUETE' && (
                <div className="space-y-3 font-sans text-xs">
                  <div className="p-3 bg-gray-50 border-l-4 border-[#006d2f] space-y-1 text-xs">
                    <div className="font-bold text-[#006d2f] uppercase text-[10px]">1. Identification du Site :</div>
                    <p><strong>Établissement :</strong> {activeDocView.est.name} ({activeDocView.est.activityLabel})</p>
                    <p><strong>Promoteur :</strong> {activeDocView.est.promoter} • Tél : {activeDocView.est.phone}</p>
                    <p><strong>Adresse :</strong> {activeDocView.est.district} — {activeDocView.est.address}</p>
                    <p><strong>Superficie mesurée :</strong> {activeDocView.est.surfaceSqm} m² • <strong>Régime :</strong> Secteur {activeDocView.est.sector === 'formal' ? 'Formel (RCCM)' : 'Informel'}</p>
                  </div>

                  <div className="p-3 bg-[#f8faff] rounded border border-[#dde2f3] space-y-1.5">
                    <div className="font-bold text-[#022448] uppercase text-[10px]">2. Constatations Techniques in Situ :</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>&bull; Insonorisation : Conforme seuils légaux</div>
                      <div>&bull; Sécurité Incendie : Extincteurs vérifiés</div>
                      <div>&bull; Issues de Secours : Dégagées &amp; conformes</div>
                      <div>&bull; Salubrité &amp; Sanitaires : Hommes/Femmes séparés</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#f0fdf4] rounded border border-[#bbf7d0] flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#15803d] block">Frais Fixes d'Enquête de Commodo &amp; Incommodo :</span>
                      <span className="text-[10px] text-[#747783]">Quittance de perception immédiate &bull; Clé légale 50/50</span>
                    </div>
                    <span className="font-mono text-base font-bold text-[#006d2f]">30 000 FCFA</span>
                  </div>

                  <div className="p-3 bg-[#fff7ed] rounded border border-[#fed7aa] text-xs">
                    <span className="font-bold text-[#c2410c] block">Avis Technique du Service SAA :</span>
                    <p className="italic text-[#43474e] mt-0.5">
                      « Avis Favorable sous réserve de maintenir les limiteurs sonores nocturnes en bon état et de respecter l'échéancier convenu pour la redevance départementale. »
                    </p>
                  </div>
                </div>
              )}

              {activeDocView.type === 'ORDRE_SERVICE' && (
                <div className="space-y-3 font-serif text-[12px] leading-relaxed">
                  <p className="font-sans font-bold text-[#022448] text-xs uppercase">
                    Le Directeur Départemental des Loisirs de Pointe-Noire ordonne :
                  </p>
                  <p>
                    <strong>ARTICLE 1er :</strong> Il est prescrit une mission de recensement exhaustif, de contrôle de conformité technique et de recouvrement forcé des droits et redevances dus par les établissements de loisirs marchands implantés dans le Département de Pointe-Noire.
                  </p>
                  <p>
                    <strong>ARTICLE 2 :</strong> Sont désignés pour exécuter la présente mission sous la direction de M. Jacques Alphonse MATOKO (Chef de Service SAA) : les agents assermentés munis de leurs ordres de mission et badges officiels, assistés de la régie d'avances pour l'encaissement immédiat contre quittance officielle.
                  </p>
                  <p>
                    <strong>ARTICLE 3 :</strong> Tout exploitant en défaut de paiement ou non immatriculé fera l'objet d'une enquête de commodo et incommodo (30 000 FCFA), d'une liquidation au m², et d'une Mise en Demeure sous 8 jours en cas de réfraction.
                  </p>
                  <p>
                    <strong>ARTICLE 4 :</strong> Les forces de police et autorités municipales sont requises de prêter main-forte aux agents de la DDL-PN.
                  </p>
                </div>
              )}

              {activeDocView.type === 'ATTESTATION' && (
                <div className="space-y-3 font-serif text-[12px]">
                  <p>Le Directeur Départemental des Loisirs de Pointe-Noire soussigné, atteste que l'établissement dénommé :</p>
                  <div className="p-3 bg-gray-50 border-l-4 border-[#022448] font-sans text-xs space-y-1">
                    <p><strong>Dénomination : </strong> {activeDocView.est.name}</p>
                    <p><strong>Promoteur / Exploitant : </strong> {activeDocView.est.promoter}</p>
                    <p><strong>Activité déclarée : </strong> {activeDocView.est.activityLabel} (Superficie : {activeDocView.est.surfaceSqm} m²)</p>
                    <p><strong>Localisation : </strong> {activeDocView.est.district} — {activeDocView.est.address}</p>
                    <p><strong>Statut Fiscal : </strong> Secteur {activeDocView.est.sector === 'formal' ? 'Formel' : 'Informel'} (Régularisation en cours)</p>
                  </div>
                  <p>
                    A satisfait aux formalités de dépôt initial de dossier et s'est acquitté des premières échéances réglementaires. La présente attestation lui confère la tolérance d'exploitation temporaire, dans l'attente de la décision définitive de la <strong>Direction Générale des Loisirs à Brazzaville</strong>, seule autorité habilitée à délivrer l'Autorisation d'Exploitation finale.
                  </p>
                </div>
              )}

              {activeDocView.type === 'MISE_EN_DEMEURE' && (
                <div className="space-y-3 font-serif text-[12px]">
                  <p>Notification officielle à l'exploitant :</p>
                  <div className="p-3 bg-[#fee2e2] border-l-4 border-[#dc2626] font-sans text-xs space-y-1">
                    <p><strong>Établissement Sommé : </strong> {activeDocView.est.name}</p>
                    <p><strong>Promoteur : </strong> {activeDocView.est.promoter} &bull; Tél : {activeDocView.est.phone}</p>
                    <p><strong>Montant Restant Dû : </strong> {(activeDocView.est.totalDue - activeDocView.est.paidAmount).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <p className="text-[#991b1b] font-semibold">
                    EST FORMELLEMENT MIS EN DEMEURE de régulariser ses droits d'exploitation et de solder son échéance de retard sous un délai impératif de <strong>HUIT (8) JOURS</strong>. Passé ce délai, la Direction Départementale procédera à la <strong>FERMETURE ADMINISTRATIVE IMMÉDIATE</strong> de l'établissement avec pose de scellés et recours à la Force Publique.
                  </p>
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between pt-6 font-sans text-[11px] border-t border-[#edf0fa]">
                <div>
                  <p className="text-[#747783]">L'Agent Enquêteur / Chef SAA</p>
                  <p className="font-bold mt-8">Jacques Alphonse MATOKO</p>
                </div>
                <div className="text-right">
                  <p className="text-[#747783]">Pointe-Noire, le {new Date().toLocaleDateString('fr-FR')}</p>
                  <p className="font-bold">Pour le Directeur Départemental,</p>
                  <p className="font-bold mt-8 text-[#022448]">Jean Richard NTSEKE NGOUAKA</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#022448] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-[#142943]"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Imprimer l'Acte Officiel</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDocView(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
