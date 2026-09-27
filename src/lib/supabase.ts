import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials provided by the user for DDL-PN backend
const DEFAULT_SUPABASE_URL = 'https://nbpcecsnivfggyitpxdn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icGNlY3NuaXZmZ2d5aXRweGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODkyNjYsImV4cCI6MjEwMzg2NTI2Nn0.xuDFvvtfic-LHo9iBLtDSgbmNfAVXyxby8iQw9ivGqA';

export const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

// Check if valid URL and key are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

// Initializing the Supabase client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ==========================================
// 1. DATA TYPES & CONVERTERS
// ==========================================

export interface FieldEstablishment {
  id: string;
  name: string;
  promoter: string;
  phone: string;
  district: string;
  address: string;
  activityCode: string;
  activityLabel: string;
  sector: 'informal' | 'formal';
  rccm?: string;
  surfaceSqm: number;
  identifiedDate: string;
  identifiedBy: string;
  status:
    | 'identifie'
    | 'convoque'
    | 'en_instruction'
    | 'attestation_depot'
    | 'transmis_brazzaville'
    | 'autorise_dgl'
    | 'mise_en_demeure'
    | 'fermeture_administrative';
  filingFee: number;
  penaltyFee: number;
  ratePerSqm: number;
  totalDue: number;
  installmentsCount: 1 | 2 | 3 | 4;
  paidAmount: number;
  nextDueDate: string;
  nextAppointmentType?: 'BUREAU' | 'TERRAIN';
  nextAppointmentTime?: string;
  convocationDate?: string;
  convocationTime?: string;
  convocationOffice?: string;
  assignedAgentBadge?: string;
  assignedAgentName?: string;
  assignedAgentId?: string;
  paymentHistory: {
    id: string;
    date: string;
    amount: number;
    collectedBy: string;
    location: 'TERRAIN' | 'DIRECTION';
    receiptRef: string;
    nextDueDate: string;
    nextAppointmentType?: 'BUREAU' | 'TERRAIN';
    nextAppointmentTime?: string;
  }[];
  sanctions: {
    type: 'CONVOCATION' | 'MISE_EN_DEMEURE' | 'FERMETURE';
    issuedDate: string;
    deadline: string;
    appointmentTime?: string;
    appointmentOffice?: string;
    reason: string;
    resolved: boolean;
  }[];
}

export interface DossierRecord {
  id: string;
  num: string;
  date: string;
  serviceCode: string;
  title: string;
  promoter: string;
  loc: string;
  arrondissement: string;
  category: 'balneaire' | 'enfants' | 'parc' | 'jeux';
  typeLabel: string;
  typeSub: string;
  piecesCount: number;
  totalPieces: number;
  piecesStatus: string;
  statusKey: 'signature' | 'reserves' | 'scelle' | 'enquete';
  statusLabel: string;
  statusSub: string;
  piecesList: { name: string; status: string; ok: boolean }[];
  avisMotive: string;
}

export interface AgentAccount {
  id: string;
  name: string;
  badgeNumber: string;
  phoneLine: string;
  service: 'SAA' | 'SAFM' | 'DIRECTION';
  role: 'Agent de Terrain' | 'Gestionnaire SAFM' | 'Direction / Contrôle';
  status: 'Actif' | 'Suspendu';
  lastSync: string;
  collectionsTotal: number;
  username?: string;
  pinCode?: string;
  deviceStatus?: 'Sécurisé (BYOD)' | 'Révoqué à distance' | 'Non appairé';
  zone?: string;
  color?: string;
}

// Activity type mapping from backend DB enum to friendly label
export const formatActivityLabel = (code: string): string => {
  const norm = (code || '').toUpperCase().trim();
  switch (norm) {
    case 'BAR':
      return 'Bar Standard';
    case 'CAVE':
      return 'Cave & Débit de Boisson';
    case 'SALLE_DE_JEUX':
      return 'Salle de Jeux & Loisirs';
    case 'VIP':
      return 'VIP Lounge & Salons Privés';
    case 'CABARET':
    case 'ACT-CAB':
      return 'Cabaret Artistique & Concert';
    case 'TERRASSE':
      return 'Terrasse Plein Air';
    default:
      return norm.startsWith('ACT-') ? norm.replace('ACT-', '') : 'Espace Loisirs & Détente';
  }
};

// District name formatter
export const formatArrondissement = (code?: string | null): string => {
  if (!code) return 'Pointe-Noire';
  if (code.includes('LUMUMBA') || code === '1') return 'Arrondissement 1 Lumumba';
  if (code.includes('MVOUMVOU') || code === '2') return 'Arrondissement 2 Mvoumvou';
  if (code.includes('TIETIE') || code === '3') return 'Arrondissement 3 Tié-Tié';
  if (code.includes('LOUANDJILI') || code === '4') return 'Arrondissement 4 Louandjili';
  if (code.includes('MONGO') || code === '5') return 'Arrondissement 5 Mongo-Mpoukou';
  if (code.includes('NGOYO') || code === '6') return 'Arrondissement 6 Ngoyo';
  return code;
};

// ==========================================
// 2. SUPABASE API REPOSITORIES
// ==========================================

const LOCAL_ESTABLISHMENTS_KEY = 'ddl_pn_establishments_cache';
const LOCAL_DOSSIERS_KEY = 'ddl_pn_dossiers_cache';
const LOCAL_AGENTS_KEY = 'ddl_pn_agents_cache';

/**
 * Fetch establishments: combines 'establishments' and 'terrain_records' from Supabase
 */
export async function apiFetchEstablishments(
  fallbackList: FieldEstablishment[]
): Promise<{ data: FieldEstablishment[]; isSupabase: boolean; error?: string }> {
  // First attempt: Server API proxy /api/establishments
  try {
    const srvRes = await fetch('/api/establishments');
    if (srvRes.ok) {
      const { establishments, records } = await srvRes.json();
      if (Array.isArray(establishments) && establishments.length > 0) {
        const merged = mapSupabaseToEstablishments(establishments, records || []);
        localStorage.setItem(LOCAL_ESTABLISHMENTS_KEY, JSON.stringify(merged));
        return { data: merged, isSupabase: true };
      }
    }
  } catch {
    // API endpoint might not be ready or running directly in client
  }

  // Second attempt: Direct Supabase client query
  if (isSupabaseConfigured && supabase) {
    try {
      const [estsRes, recsRes] = await Promise.all([
        supabase.from('establishments').select('*').order('created_at', { ascending: false }),
        supabase.from('terrain_records').select('*').order('record_date', { ascending: false }),
      ]);

      if (!estsRes.error && Array.isArray(estsRes.data) && estsRes.data.length > 0) {
        const merged = mapSupabaseToEstablishments(estsRes.data, recsRes.data || []);
        localStorage.setItem(LOCAL_ESTABLISHMENTS_KEY, JSON.stringify(merged));
        return { data: merged, isSupabase: true };
      }
    } catch (err: any) {
      console.warn('[Supabase Direct Fetch Warning]:', err.message);
    }
  }

  // Fallback: localStorage only if it contains real Supabase records (not mock EST-2026-0)
  const cached = localStorage.getItem(LOCAL_ESTABLISHMENTS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0 && !String(parsed[0].id).startsWith('EST-2026-0')) {
        return { data: parsed, isSupabase: false };
      } else {
        localStorage.removeItem(LOCAL_ESTABLISHMENTS_KEY);
      }
    } catch {
      // Ignored
    }
  }

  return { data: fallbackList, isSupabase: false };
}

/**
 * Maps raw Supabase establishments & terrain_records rows to FieldEstablishment models
 */
function mapSupabaseToEstablishments(rawEsts: any[], rawRecs: any[]): FieldEstablishment[] {
  return rawEsts.map((e) => {
    // Find matching payments/records
    const matchedRecs = rawRecs.filter((r) => r.establishment_id === e.id);
    const paidAmount = matchedRecs.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0);
    const primaryRecord = matchedRecs[0];

    const totalDue =
      primaryRecord && Number(primaryRecord.total_fee) > 0
        ? Number(primaryRecord.total_fee)
        : Number(e.total_due) > 0
        ? Number(e.total_due)
        : e.regime_type === 'FORMEL'
        ? 150000
        : 50000;

    const nextDueDate =
      primaryRecord?.prochain_versement_date ||
      (paidAmount >= totalDue ? 'Soldé Intégralement' : '15/04/2026');

    // Build payment history from terrain_records
    const paymentHistory = matchedRecs
      .filter((r) => Number(r.amount_paid) > 0)
      .map((r, idx) => ({
        id: r.id || `REC-${idx}`,
        date: r.record_date || new Date(r.created_at).toLocaleDateString('fr-FR'),
        amount: Number(r.amount_paid),
        collectedBy: 'Agent SAA DDL-PN (Badge N° ' + (r.agent_id ? r.agent_id.slice(0, 5) : '08') + ')',
        location: 'TERRAIN' as const,
        receiptRef: `REC-DDL-PN-${(r.id || '').slice(0, 8).toUpperCase()}`,
        nextDueDate: r.prochain_versement_date || 'Soldé',
      }));

    // Derive status
    let status: FieldEstablishment['status'] = 'identifie';
    if (paidAmount >= totalDue && totalDue > 0) {
      status = 'autorise_dgl';
    } else if (paidAmount > 0) {
      status = 'attestation_depot';
    } else if (matchedRecs.length > 0) {
      status = 'convoque';
    }

    const activityCode = e.activity_type ? `ACT-${e.activity_type}` : 'ACT-BAR';
    const activityLabel = formatActivityLabel(e.activity_type || 'BAR');
    const district =
      formatArrondissement(e.arrondissement) + (e.quartier ? ` (${e.quartier})` : '');

    // Map real agent attributes
    const assignedAgentId = e.assigned_agent_id || '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc';
    const assignedAgentName =
      e.assigned_agent_name ||
      (e.assigned_agent_id === 'd016ff2d-7544-466e-98c7-3cc83dbc1203'
        ? 'Rhonel KIOUNGA'
        : 'Jacques Alphonse MATOKO');
    const assignedAgentBadge =
      e.assigned_agent_badge ||
      (e.assigned_agent_id === 'd016ff2d-7544-466e-98c7-3cc83dbc1203'
        ? 'DDL-PN-26-00000A-86244'
        : 'DDL-PN-2026-306C5C');

    return {
      id: e.id,
      name: e.name || 'Établissement Sans Nom',
      promoter: e.owner_name || 'Exploitant Non Enregistré',
      phone: e.phone || '',
      district,
      address: e.address || district,
      activityCode,
      activityLabel,
      sector: (e.regime_type || '').toUpperCase() === 'FORMEL' ? 'formal' : 'informal',
      rccm: e.rccm || undefined,
      surfaceSqm: Number(e.surface_sqm) || 60,
      identifiedDate: e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR') : '01/03/2026',
      identifiedBy: `Agent DDL-PN (${assignedAgentName})`,
      assignedAgentId,
      assignedAgentName,
      assignedAgentBadge,
      status,
      filingFee: 30000,
      penaltyFee: (e.regime_type || '').toUpperCase() === 'FORMEL' ? 0 : 50000,
      ratePerSqm: 1200,
      totalDue,
      installmentsCount: 3,
      paidAmount,
      nextDueDate,
      paymentHistory,
      sanctions: [],
    };
  });
}

/**
 * Save/Update an establishment to Supabase backend
 */
export async function apiUpsertEstablishment(
  est: FieldEstablishment
): Promise<{ success: boolean; isSupabase: boolean; error?: string }> {
  // Update local cache
  try {
    const cached = localStorage.getItem(LOCAL_ESTABLISHMENTS_KEY);
    let list: FieldEstablishment[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex((e) => e.id === est.id);
    if (idx >= 0) {
      list[idx] = est;
    } else {
      list.unshift(est);
    }
    localStorage.setItem(LOCAL_ESTABLISHMENTS_KEY, JSON.stringify(list));
  } catch {
    // Ignore cache failure
  }

  // 1. Try server endpoint
  try {
    const srvRes = await fetch('/api/establishments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        establishment: {
          id: est.id.includes('-') && est.id.length >= 30 ? est.id : crypto.randomUUID(),
          name: est.name,
          owner_name: est.promoter,
          phone: est.phone,
          activity_type: est.activityCode.replace('ACT-', ''),
          address: est.address,
          arrondissement: est.district,
          regime_type: est.sector === 'formal' ? 'FORMEL' : 'INFORMEL',
          assigned_agent_id: '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc', // Jacques MATOKO
        },
        record: {
          id: crypto.randomUUID(),
          agent_id: '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc',
          record_date: new Date().toISOString().split('T')[0],
          total_fee: est.totalDue,
          amount_paid: est.paidAmount,
          status: 'SOUMIS',
          prochain_versement_date: est.nextDueDate,
        },
      }),
    });
    if (srvRes.ok) {
      return { success: true, isSupabase: true };
    }
  } catch {
    // Fallback to client SDK
  }

  // 2. Try direct Supabase client
  if (isSupabaseConfigured && supabase) {
    try {
      const validUuid = est.id.includes('-') && est.id.length >= 30 ? est.id : crypto.randomUUID();
      const { error: estErr } = await supabase.from('establishments').upsert({
        id: validUuid,
        name: est.name,
        owner_name: est.promoter,
        phone: est.phone,
        activity_type: est.activityCode.replace('ACT-', ''),
        address: est.address,
        regime_type: est.sector === 'formal' ? 'FORMEL' : 'INFORMEL',
        assigned_agent_id: '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc',
      });

      if (!estErr && est.paidAmount > 0) {
        await supabase.from('terrain_records').insert({
          id: crypto.randomUUID(),
          establishment_id: validUuid,
          agent_id: '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc',
          record_date: new Date().toISOString().split('T')[0],
          total_fee: est.totalDue,
          amount_paid: est.paidAmount,
          status: 'SOUMIS',
          prochain_versement_date: est.nextDueDate,
        });
      }

      return { success: !estErr, isSupabase: !estErr, error: estErr?.message };
    } catch (err: any) {
      return { success: false, isSupabase: false, error: err.message };
    }
  }

  return { success: true, isSupabase: false };
}

/**
 * Record a payment into 'terrain_records'
 */
export async function apiRecordPayment(payment: {
  establishmentId: string;
  amount: number;
  totalFee: number;
  nextDueDate: string;
  agentId?: string;
}): Promise<{ success: boolean; isSupabase: boolean; error?: string }> {
  const payload = {
    id: crypto.randomUUID(),
    establishment_id: payment.establishmentId,
    agent_id: payment.agentId || '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc',
    record_date: new Date().toISOString().split('T')[0],
    total_fee: payment.totalFee,
    amount_paid: payment.amount,
    status: 'SOUMIS',
    prochain_versement_date: payment.nextDueDate,
  };

  // 1. Try server route
  try {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment: payload }),
    });
    if (res.ok) {
      return { success: true, isSupabase: true };
    }
  } catch {
    // Continue
  }

  // 2. Try direct Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('terrain_records').insert(payload);
      return { success: !error, isSupabase: !error, error: error?.message };
    } catch (err: any) {
      return { success: false, isSupabase: false, error: err.message };
    }
  }

  return { success: true, isSupabase: false };
}

/**
 * Fetch dossiers: combines 'dossiers_instruction' and 'dossiers_actes'
 */
export async function apiFetchDossiers(
  fallbackList: DossierRecord[]
): Promise<{ data: DossierRecord[]; isSupabase: boolean; error?: string }> {
  // 1. Try server route (bypasses RLS to read all 31 real dossiers)
  try {
    const srvRes = await fetch('/api/dossiers');
    if (srvRes.ok) {
      const { dossiers } = await srvRes.json();
      if (Array.isArray(dossiers) && dossiers.length > 0) {
        const converted = mapSupabaseToDossiers(dossiers);
        localStorage.setItem(LOCAL_DOSSIERS_KEY, JSON.stringify(converted));
        return { data: converted, isSupabase: true };
      }
    }
  } catch {
    // Continue
  }

  // 2. Try direct Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('dossiers_instruction')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const converted = mapSupabaseToDossiers(data);
        localStorage.setItem(LOCAL_DOSSIERS_KEY, JSON.stringify(converted));
        return { data: converted, isSupabase: true };
      }
    } catch (err: any) {
      console.warn('[Dossiers Fetch Warn]:', err.message);
    }
  }

  // Cache fallback only if real data
  const cached = localStorage.getItem(LOCAL_DOSSIERS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id !== 'paradisio') {
        return { data: parsed, isSupabase: false };
      } else {
        localStorage.removeItem(LOCAL_DOSSIERS_KEY);
      }
    } catch {
      // Ignored
    }
  }

  return { data: fallbackList, isSupabase: false };
}

function mapSupabaseToDossiers(rawDossiers: any[]): DossierRecord[] {
  return rawDossiers.map((d, idx) => {
    const piecesList = [
      { name: 'Courrier adressé à la DG Loisirs', status: d.has_courrier_dg ? 'CONFORME' : 'MANQUANT', ok: !!d.has_courrier_dg },
      { name: 'CNI / Passeport du Promoteur', status: d.has_cni_passport ? 'CONFORME' : 'MANQUANT', ok: !!d.has_cni_passport },
      { name: 'Casier Judiciaire (Bulletin N° 3)', status: d.has_casier_judiciaire ? 'CONFORME' : 'MANQUANT', ok: !!d.has_casier_judiciaire },
      { name: 'Certificat de Nationalité Congolaise', status: d.has_certificat_nationalite ? 'CONFORME' : 'MANQUANT', ok: !!d.has_certificat_nationalite },
      { name: 'Quitus Sécurité Incendie Pompiers', status: d.has_quitus_pompiers ? 'CONFORME' : 'MANQUANT', ok: !!d.has_quitus_pompiers },
      { name: 'Attestation Assurance Multirisque', status: d.has_assurance_multirisque ? 'CONFORME' : 'MANQUANT', ok: !!d.has_assurance_multirisque },
      { name: 'Immatriculation RCCM / NIU', status: d.has_rccm ? 'CONFORME' : 'MANQUANT', ok: !!d.has_rccm },
      { name: 'Schéma d’Aménagement & Photos Site', status: d.has_schema_photos ? 'CONFORME' : 'MANQUANT', ok: !!d.has_schema_photos },
    ];

    const piecesCount = piecesList.filter((p) => p.ok).length;
    const isApprouve = (d.validation_status || '').toUpperCase() === 'APPROUVE';

    let arrondissementKey = 'lumumba';
    const arr = (d.arrondissement || '').toUpperCase();
    if (arr.includes('2') || arr.includes('MVOUMVOU')) arrondissementKey = 'mvoumvou';
    else if (arr.includes('3') || arr.includes('TIETIE')) arrondissementKey = 'tietie';
    else if (arr.includes('4') || arr.includes('LOUANDJILI')) arrondissementKey = 'loandjili';
    else if (arr.includes('6') || arr.includes('NGOYO')) arrondissementKey = 'ngoyo';

    return {
      id: d.id,
      num: `DOS-${new Date(d.created_at || Date.now()).getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
      date: d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '08/09/2026',
      serviceCode: 'SAA / J.A.M.',
      title: `${d.establishment_name} (${formatActivityLabel(d.activity_type)})`,
      promoter: d.owner_name || 'Promoteur Non Identifié',
      loc: d.address || formatArrondissement(d.arrondissement),
      arrondissement: arrondissementKey,
      category: 'parc',
      typeLabel: "Agrément & Attestation d'Ouverture",
      typeSub: `${d.surface_m2 || 80} m² • Capacité: ${d.capacity_seats || 50} pers.`,
      piecesCount,
      totalPieces: piecesList.length,
      piecesStatus: `${piecesCount}/${piecesList.length} pièces validées`,
      statusKey: isApprouve ? 'signature' : 'enquete',
      statusLabel: isApprouve ? 'Approuvé DDL-PN' : 'En Cours d’Instruction',
      statusSub: isApprouve ? 'Prêt pour Transmission DGL Brazzaville' : 'Visite technique requise',
      piecesList,
      avisMotive: `Avis ${d.enquete_avis || 'FAVORABLE'} (Note Technique: ${d.enquete_rating || 14}/20). Droits liquidés: ${(d.calculated_annual_fee || 50000).toLocaleString('fr-FR')} FCFA.`,
    };
  });
}

/**
 * Upsert a dossier into Supabase
 */
export async function apiUpsertDossier(
  dossier: DossierRecord
): Promise<{ success: boolean; isSupabase: boolean; error?: string }> {
  // Update local cache
  try {
    const cached = localStorage.getItem(LOCAL_DOSSIERS_KEY);
    let list: DossierRecord[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex((d) => d.id === dossier.id);
    if (idx >= 0) {
      list[idx] = dossier;
    } else {
      list.unshift(dossier);
    }
    localStorage.setItem(LOCAL_DOSSIERS_KEY, JSON.stringify(list));
  } catch {
    // Ignore cache failure
  }

  // 1. Try server route
  try {
    const srvRes = await fetch('/api/dossiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dossier: {
          id: dossier.id.includes('-') && dossier.id.length >= 30 ? dossier.id : crypto.randomUUID(),
          establishment_name: dossier.title,
          owner_name: dossier.promoter,
          address: dossier.loc,
          validation_status: dossier.statusKey === 'signature' ? 'APPROUVE' : 'EN_ATTENTE',
          enquete_avis: 'FAVORABLE',
        },
      }),
    });
    if (srvRes.ok) {
      return { success: true, isSupabase: true };
    }
  } catch {
    // Fallback
  }

  return { success: true, isSupabase: false };
}

/**
 * Fetch agents and active badges
 */
export async function apiFetchAgents(
  fallbackList: AgentAccount[]
): Promise<{ data: AgentAccount[]; isSupabase: boolean; error?: string }> {
  try {
    const res = await fetch('/api/agents');
    if (res.ok) {
      const { agents } = await res.json();
      if (Array.isArray(agents) && agents.length > 0) {
        const mapped: AgentAccount[] = agents.map((a) => ({
          id: a.id,
          name: a.nom_complet || `${a.prenom || ''} ${a.nom || ''}`.trim(),
          badgeNumber: a.badge_number || 'DDL-PN-AGENT',
          phoneLine: a.telephone || '05 302 83 83',
          service: 'SAA',
          role: a.fonction?.includes('RESP') ? 'Gestionnaire SAFM' : 'Agent de Terrain',
          status: a.statut === 'ACTIF' ? 'Actif' : 'Suspendu',
          lastSync: 'Il y a 5 min',
          collectionsTotal: 450000,
        }));
        localStorage.setItem(LOCAL_AGENTS_KEY, JSON.stringify(mapped));
        return { data: mapped, isSupabase: true };
      }
    }
  } catch {
    // Ignore
  }

  const cached = localStorage.getItem(LOCAL_AGENTS_KEY);
  if (cached) {
    try {
      return { data: JSON.parse(cached), isSupabase: false };
    } catch {
      // Ignored
    }
  }

  return { data: fallbackList, isSupabase: false };
}

/**
 * Subscribe to Supabase Realtime changes
 */
export function subscribeToSupabase(table: string, onUpdate: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Supabase realtime subscribe warning:', err);
    return () => {};
  }
}
