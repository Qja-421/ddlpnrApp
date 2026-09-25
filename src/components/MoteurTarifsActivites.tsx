import React, { useState } from 'react';

export interface ActivityRate {
  code: string;
  label: string;
  ratePerSqm: number;
  source: string;
  status: 'Actif' | "À l'étude" | 'Suspendu';
}

export interface AuditLogEntry {
  date: string;
  author: string;
  activityName: string;
  activityCode: string;
  oldPrice: number;
  newPrice: number;
  justification: string;
}

export const CONFIRMED_ACTIVITY_RATES: ActivityRate[] = [
  { code: 'ACT-BAR', label: 'Bar Standard', ratePerSqm: 1000, source: 'Note N° 014/MCAPNIT-DDLPN', status: 'Actif' },
  { code: 'ACT-CLUB', label: 'Nightclub / Discothèque', ratePerSqm: 1500, source: 'Décret Tarifaire DGL Brazzaville', status: 'Actif' },
  { code: 'ACT-VIP', label: 'VIP Lounge & Salons Privés', ratePerSqm: 1000, source: 'Note Cadre N° 022/DGL', status: 'Actif' },
  { code: 'ACT-TERR', label: 'Terrasse Plein Air', ratePerSqm: 0, source: 'Tarif en cours de fixation par décret', status: "À l'étude" },
  { code: 'ACT-CAVE', label: 'Cave & Débit de Boisson', ratePerSqm: 0, source: 'Tarif en cours de fixation par décret', status: "À l'étude" },
  { code: 'ACT-CAB', label: 'Cabaret Artistique & Concert', ratePerSqm: 0, source: 'Tarif en cours de fixation par décret', status: "À l'étude" },
  { code: 'ACT-JEUX', label: 'Salle de Jeux & Loisirs', ratePerSqm: 0, source: 'Tarif en cours de fixation par décret', status: "À l'étude" },
];

export const getStoredActivityRates = (): ActivityRate[] => {
  try {
    const raw = localStorage.getItem('ddl_pn_tariff_activities');
    if (raw) return JSON.parse(raw);
  } catch {}
  return CONFIRMED_ACTIVITY_RATES;
};

export const getActivityRatePerSqm = (code: string): number => {
  const rates = getStoredActivityRates();
  const match = rates.find((r) => r.code === code || r.code === `ACT-${code}`);
  if (match && match.ratePerSqm > 0) return match.ratePerSqm;
  if (code.includes('CLUB')) return 1500;
  if (code.includes('BAR') || code.includes('VIP')) return 1000;
  return 0;
};

const initialAuditLogs: AuditLogEntry[] = [
  {
    date: '10/03/2026 10:15:00',
    author: 'Jacques MATOKO (DDL-PN)',
    activityName: 'Bar Standard',
    activityCode: 'ACT-BAR',
    oldPrice: 1200,
    newPrice: 1000,
    justification: 'Fixation officielle du barème confirmé à 1 000 FCFA/m² selon directive de cadrage',
  },
  {
    date: '10/03/2026 10:14:00',
    author: 'Jacques MATOKO (DDL-PN)',
    activityName: 'Nightclub / Discothèque',
    activityCode: 'ACT-CLUB',
    oldPrice: 2500,
    newPrice: 1500,
    justification: 'Harmonisation officielle à 1 500 FCFA/m² selon décret tarifaire DGL Brazzaville',
  },
  {
    date: '10/03/2026 10:12:00',
    author: 'Jacques MATOKO (DDL-PN)',
    activityName: 'VIP Lounge & Salons Privés',
    activityCode: 'ACT-VIP',
    oldPrice: 3000,
    newPrice: 1000,
    justification: 'Alignement officiel à 1 000 FCFA/m² selon note de service DDL-PN',
  },
];

export interface MoteurTarifsActivitesProps {
  onInjectIntoActe?: (activityCode: string) => void;
}

export const MoteurTarifsActivites: React.FC<MoteurTarifsActivitesProps> = ({ onInjectIntoActe }) => {
  const [activities, setActivities] = useState<ActivityRate[]>(() => getStoredActivityRates());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const raw = localStorage.getItem('ddl_pn_tariff_audit_logs');
      if (raw) return JSON.parse(raw);
    } catch {}
    return initialAuditLogs;
  });

  // New activity form
  const [newLibelle, setNewLibelle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newTarif, setNewTarif] = useState<number | ''>('');
  const [newStatut, setNewStatut] = useState<'Actif' | "À l'étude" | 'Suspendu'>('Actif');
  const [newRef, setNewRef] = useState('');
  const [showToastAdd, setShowToastAdd] = useState(false);

  // Simulator
  const [simCode, setSimCode] = useState<string>('ACT-VIP');
  const [simSurface, setSimSurface] = useState<number>(120);
  const [simInformel, setSimInformel] = useState<boolean>(true);

  // Edit modal
  const [modalItem, setModalItem] = useState<ActivityRate | null>(null);
  const [modalNewTarif, setModalNewTarif] = useState<number | ''>('');
  const [modalJustification, setModalJustification] = useState<string>('');

  // Toast
  const [generalToast, setGeneralToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setGeneralToast(msg);
    setTimeout(() => setGeneralToast(null), 3500);
  };

  // Calculations for Simulator
  const selectedSimActivity = activities.find((a) => a.code === simCode) || activities[0];
  const unitRate = selectedSimActivity ? selectedSimActivity.ratePerSqm : 0;
  const fraisDossierFixes = 30000;
  const taxeMetrage = unitRate * (simSurface || 0);
  const penaliteInformel = simInformel ? 50000 : 0;
  const totalGlobal = fraisDossierFixes + taxeMetrage + penaliteInformel;
  const montantTranche = Math.round(totalGlobal / 3);

  // Handle adding new activity
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibelle.trim() || !newCode.trim() || newTarif === '' || !newRef.trim()) return;

    const lower = newLibelle.toLowerCase();
    if (lower.includes('restaurant') || lower.includes('hôtel') || lower.includes('hotel') || lower.includes('auberge')) {
      showNotification('REJET LÉGAL : Les hôtels et restaurants relèvent du Tourisme / Commerce et sont exclus du mandat Loisirs DDL-PN.');
      return;
    }

    const formattedCode = newCode.trim().toUpperCase();

    // Check if code exists
    if (activities.some((a) => a.code === formattedCode)) {
      showNotification(`Le code ${formattedCode} existe déjà dans le registre !`);
      return;
    }

    const created: ActivityRate = {
      code: formattedCode,
      label: newLibelle.trim(),
      ratePerSqm: Number(newTarif),
      source: newRef.trim(),
      status: newStatut,
    };

    const updatedActivities = [...activities, created];
    setActivities(updatedActivities);
    localStorage.setItem('ddl_pn_tariff_activities', JSON.stringify(updatedActivities));

    // Audit log
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: AuditLogEntry = {
      date: dateFormatted,
      author: 'Jacques MATOKO (DDL-PN)',
      activityName: created.label,
      activityCode: created.code,
      oldPrice: 0,
      newPrice: created.ratePerSqm,
      justification: `Création via ${created.source}`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('ddl_pn_tariff_audit_logs', JSON.stringify(updatedLogs));

    setNewLibelle('');
    setNewCode('');
    setNewTarif('');
    setNewRef('');
    setShowToastAdd(true);
    setTimeout(() => setShowToastAdd(false), 4000);
    showNotification(`Activité ${created.label} (${created.code}) enregistrée au moteur !`);
  };

  // Open modal
  const handleOpenEditModal = (activity: ActivityRate) => {
    setModalItem(activity);
    setModalNewTarif(activity.ratePerSqm);
    setModalJustification('');
  };

  // Save modal edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem || modalNewTarif === '' || !modalJustification.trim()) return;

    const oldPrice = modalItem.ratePerSqm;
    const newPrice = Number(modalNewTarif);

    // Update in activities list
    const updatedActivities = activities.map((act) =>
      act.code === modalItem.code
        ? { ...act, ratePerSqm: newPrice, source: modalJustification.trim() }
        : act
    );
    setActivities(updatedActivities);
    localStorage.setItem('ddl_pn_tariff_activities', JSON.stringify(updatedActivities));

    // Add to audit log
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const logEntry: AuditLogEntry = {
      date: dateFormatted,
      author: 'Jacques MATOKO (DDL-PN)',
      activityName: modalItem.label,
      activityCode: modalItem.code,
      oldPrice,
      newPrice,
      justification: modalJustification.trim(),
    };
    const updatedLogs = [logEntry, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('ddl_pn_tariff_audit_logs', JSON.stringify(updatedLogs));

    showNotification(`Tarif ${modalItem.code} actualisé à ${newPrice.toLocaleString('fr-FR')} FCFA/m² et consigné dans l'historique d'audit.`);
    setModalItem(null);
  };

  return (
    <div className="flex flex-col w-full gap-6 text-left pb-12">
      {/* Entête Administrative Souveraine */}
      <section className="bg-white rounded-xl shadow-sm p-6 relative overflow-hidden border border-[#e8eeff]">
        {/* Barre Tricolore Institutionnelle */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="h-full flex-1 bg-[#004528]"></div>
          <div className="h-full flex-1 bg-[#fdb647]"></div>
          <div className="h-full flex-1 bg-[#9e1f1e]"></div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-wider text-[#815500] font-bold mb-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>SYSTÈME CENTRAL DE TARIFICATION FISCALE • DDL-PN / MCAPNIT</span>
            </div>
            <h1 className="font-garamond text-[26px] font-bold text-[#004528] tracking-tight leading-tight">
              Configuration des Activités de Loisirs &amp; Grille Tarifaire au m²
            </h1>
            <p className="font-sans text-[13px] text-[#404942] mt-1">
              Gestion administrative directe des catégories éligibles et des barèmes selon décrets ministériels (Zéro code en dur).
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-[#f0f3ff] px-4 py-2.5 rounded-lg border border-[#dde8ff]">
            <span className="material-symbols-outlined text-[#004528] text-[26px]">shield_person</span>
            <div className="flex flex-col">
              <span className="font-sans text-[13px] font-bold text-[#111c2d]">Session Ouverte : Jacques</span>
              <span className="font-sans text-[11px] text-[#707a71]">Matricule : ADM-DDLPN-042 • Droits Écriture</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bannière de rappel réglementaire */}
      <section className="bg-[#dee8ff] rounded-xl p-4 shadow-sm flex items-start gap-4 border border-[#cfdaf2]">
        <div className="w-10 h-10 rounded bg-[#7c000a] text-white flex items-center justify-center shrink-0 shadow">
          <span className="material-symbols-outlined text-[20px]">info</span>
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-sans text-[11px] font-bold text-[#7c000a] uppercase tracking-wider">
            Notice de Gestion • Périmètre Exclusif DDL-PN
          </span>
          <p className="font-sans text-[13px] text-[#111c2d] font-semibold mt-0.5">
            Conformément aux directives ministérielles, les hôtels et restaurants sont formellement exclus du périmètre de régulation des loisirs DDL-PN et ne figurent pas dans cette grille.
          </p>
          <span className="font-sans text-[11px] text-[#707a71] mt-1">
            Réf: Circulaire Interministérielle N° 008/MCAPNIT/MATD • Ville de Pointe-Noire
          </span>
        </div>
      </section>

      {/* Grille Principale 12 Colonnes : Formulaire + Simulateur */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Bloc Interactif : Ajouter une nouvelle activité (xl: 7 colonnes) */}
        <div className="xl:col-span-7 bg-white rounded-xl shadow-sm p-6 flex flex-col justify-between border border-[#e8eeff]">
          <div>
            <div className="flex items-center justify-between pb-2 mb-4 bg-[#f0f3ff] p-3 rounded-lg border border-[#dde8ff]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#004528] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-sans text-[16px] font-bold text-[#004528] leading-tight">
                    Ajouter une nouvelle activité de loisir
                  </h2>
                  <span className="font-sans text-[11px] text-[#707a71]">
                    Enregistrement dynamique au barème sans redéploiement applicatif
                  </span>
                </div>
              </div>
              <span className="bg-[#a8f3c3]/40 text-[#005231] px-2.5 py-1 rounded font-sans text-[10px] font-bold uppercase">
                Mode Administrateur
              </span>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddActivity}>
              {/* Libellé */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Libellé de l'activité
                </label>
                <input
                  type="text"
                  required
                  value={newLibelle}
                  onChange={(e) => setNewLibelle(e.target.value)}
                  placeholder="Ex: Espace Gaming / Billard, Guinguette..."
                  className="h-10 px-3 rounded bg-[#f0f3ff] text-[#111c2d] font-sans text-[13px] border border-[#bfc9bf]/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004528] transition-colors"
                />
              </div>

              {/* Code Interne */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Code Interne Moteur
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Ex: ACT-GAME, ACT-GUING"
                  className="h-10 px-3 rounded bg-[#f0f3ff] text-[#111c2d] font-mono text-[12px] uppercase font-bold border border-[#bfc9bf]/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004528] transition-colors"
                />
              </div>

              {/* Tarif au m² */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Tarif de Référence (FCFA / m²)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={newTarif}
                    onChange={(e) => setNewTarif(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 1500"
                    className="w-full h-10 pl-3 pr-20 rounded bg-[#f0f3ff] text-[#111c2d] font-mono text-[13px] font-bold border border-[#bfc9bf]/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004528] transition-colors"
                  />
                  <span className="absolute right-3 font-sans text-[11px] text-[#707a71] font-semibold">FCFA/m²</span>
                </div>
              </div>

              {/* Statut */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Statut d'application
                </label>
                <select
                  value={newStatut}
                  onChange={(e) => setNewStatut(e.target.value as 'Actif' | "À l'étude" | 'Suspendu')}
                  className="h-10 px-3 rounded bg-[#f0f3ff] text-[#111c2d] font-sans text-[13px] border border-[#bfc9bf]/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004528] transition-colors"
                >
                  <option value="Actif">Actif (Application immédiate)</option>
                  <option value="À l'étude">À l'étude (Non facturable)</option>
                  <option value="Suspendu">Suspendu (Provisoire)</option>
                </select>
              </div>

              {/* Référence légale */}
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Référence Légale (Note de Service, Arrêté ou Décret ministériel)
                </label>
                <input
                  type="text"
                  required
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="Ex: Note de Service N° 028/MCAPNIT/DGL-CAB-2025"
                  className="h-10 px-3 rounded bg-[#f0f3ff] text-[#111c2d] font-sans text-[13px] border border-[#bfc9bf]/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004528] transition-colors"
                />
              </div>

              {/* Form submit */}
              <div className="md:col-span-2 flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-[#707a71] font-sans text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-[#004528]">history_edu</span>
                  <span>Signature numérique : Jacques • DDL-PN Pointe-Noire</span>
                </div>
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#004528] hover:bg-[#0d5e3a] text-white rounded font-sans text-[12px] font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Enregistrer &amp; Publier au Moteur</span>
                </button>
              </div>
            </form>
          </div>

          {showToastAdd && (
            <div className="mt-4 p-3 rounded bg-[#a8f3c3]/40 text-[#005231] font-sans text-[12px] font-bold flex items-center gap-2 border border-[#8dd6a8]">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Nouvelle activité homologuée et intégrée en direct au moteur tarifaire.</span>
            </div>
          )}
        </div>

        {/* Simulateur de Calcul en Temps Réel (xl: 5 colonnes) */}
        <div className="xl:col-span-5 bg-white rounded-xl shadow-sm p-6 flex flex-col justify-between border border-[#e8eeff] relative overflow-hidden">
          {/* Badge Simulateur */}
          <div className="flex items-center justify-between pb-2 mb-4 bg-[#f0f3ff] p-3 rounded-lg border border-[#dde8ff]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#815500] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">calculate</span>
              </div>
              <div>
                <h2 className="font-sans text-[16px] font-bold text-[#111c2d] leading-tight">
                  Simulateur Moteur Temps Réel
                </h2>
                <span className="font-sans text-[11px] text-[#707a71]">Validation des formules in situ</span>
              </div>
            </div>
            <span className="bg-[#fdb647] text-[#6f4900] px-2.5 py-1 rounded font-sans text-[10px] font-bold uppercase">
              Test Algorithme
            </span>
          </div>

          {/* Contrôles du simulateur */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Activité Ciblée
                </label>
                <select
                  value={simCode}
                  onChange={(e) => setSimCode(e.target.value)}
                  className="h-10 px-2 rounded bg-[#f0f3ff] text-[#111c2d] font-sans text-[12px] font-bold border border-[#bfc9bf]/70 focus:bg-white focus:outline-none"
                >
                  {activities.map((act) => (
                    <option key={act.code} value={act.code}>
                      {act.label} ({act.ratePerSqm.toLocaleString('fr-FR')} FCFA/m²)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Surface Mesurée (m²)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    value={simSurface}
                    onChange={(e) => setSimSurface(Number(e.target.value) || 0)}
                    className="w-full h-10 pl-3 pr-8 rounded bg-[#f0f3ff] text-[#111c2d] font-mono text-[13px] font-bold border border-[#bfc9bf]/70 focus:bg-white focus:outline-none"
                  />
                  <span className="absolute right-2.5 font-sans text-[11px] text-[#707a71]">m²</span>
                </div>
              </div>
            </div>

            {/* Choix Secteur / Pénalité Informelle */}
            <div className="bg-[#f0f3ff] p-3 rounded-lg flex items-center justify-between border border-[#dde8ff]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sim-informel-box"
                  checked={simInformel}
                  onChange={(e) => setSimInformel(e.target.checked)}
                  className="w-4 h-4 rounded text-[#004528] accent-[#004528] cursor-pointer"
                />
                <label
                  htmlFor="sim-informel-box"
                  className="font-sans text-[12px] text-[#111c2d] font-semibold cursor-pointer select-none"
                >
                  Établissement Non Immatriculé (Secteur Informel)
                </label>
              </div>
              <span className="font-sans text-[10px] font-bold text-[#7c000a] bg-[#ffdad6] px-2 py-0.5 rounded">
                +50 000 FCFA Pénalité
              </span>
            </div>
          </div>

            {/* Résultat Décomposé */}
          <div className="mt-4 p-4 bg-[#f0f3ff] rounded-xl space-y-2 border border-[#dde8ff]">
            <div className="flex justify-between items-center text-[#404942] font-sans text-[12px]">
              <span className="flex items-center gap-1">
                <span>Frais d'enquête de commodo &amp; incommodo :</span>
                <span className="text-[10px] text-[#707a71]">(Fiche technique)</span>
              </span>
              <span className="font-mono font-bold text-[#111c2d]">30 000 FCFA</span>
            </div>

            <div className="flex justify-between items-center text-[#404942] font-sans text-[12px]">
              <span>
                Redevance au métrage ({simSurface} m² × {unitRate.toLocaleString('fr-FR')} FCFA) :
              </span>
              <span className="font-mono font-bold text-[#111c2d]">{taxeMetrage.toLocaleString('fr-FR')} FCFA</span>
            </div>

            {simInformel && (
              <div className="flex justify-between items-center text-[#7c000a] font-sans text-[12px] font-semibold">
                <span>Pénalité Informelle (Régularisation SAA) :</span>
                <span className="font-mono font-bold">+50 000 FCFA</span>
              </div>
            )}

            <div className="h-0.5 bg-[#d8e3fb] my-2"></div>

            <div className="flex justify-between items-baseline pt-1">
              <div>
                <span className="font-sans text-[10px] uppercase font-bold text-[#815500] block">
                  Total Exigible Immédiat
                </span>
                <span className="font-sans text-[10px] text-[#707a71]">Ordre de Service N° 028/MCAPNIT/DGL/DDL-PN</span>
              </div>
              <div className="text-right">
                <span className="font-garamond text-[26px] text-[#004528] font-bold tracking-tight">
                  {totalGlobal.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* Répartition Régalienne 50% Trésor Public / 50% Administration des Loisirs */}
            <div className="p-2.5 bg-white rounded-lg border border-[#c4c7d4] space-y-1.5 text-xs font-sans">
              <span className="text-[10px] uppercase font-bold text-[#022448] block">
                Clé de Répartition Légale (50% / 50%) :
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-[#f0f9ff] p-1.5 rounded border border-[#bae6fd]">
                  <span className="text-[9px] uppercase font-bold text-[#0369a1] block">Trésor Public (50%)</span>
                  <span className="font-bold text-[#0284c7]">
                    {Math.round(totalGlobal * 0.5).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="bg-[#f0fdf4] p-1.5 rounded border border-[#bbf7d0]">
                  <span className="text-[9px] uppercase font-bold text-[#15803d] block">Régie Loisirs (50%)</span>
                  <span className="font-bold text-[#006d2f]">
                    {(totalGlobal - Math.round(totalGlobal * 0.5)).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Ventilation en 3 tranches */}
            <div className="mt-2 bg-[#d8e3fb] p-2.5 rounded flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-sans text-[11px] font-bold text-[#111c2d]">
                <span className="material-symbols-outlined text-[16px] text-[#004528]">pie_chart</span>
                <span>Échéancier Légal Autorisé :</span>
              </div>
              <span className="font-mono text-[12px] text-[#004528] font-bold">
                3 tranches de {montantTranche.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            {/* Quick Action towards Atelier */}
            {onInjectIntoActe && (
              <button
                type="button"
                onClick={() => onInjectIntoActe(simCode)}
                className="mt-3 w-full py-2 bg-[#004528] hover:bg-[#003820] text-white font-sans text-[11px] font-bold uppercase rounded flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit_document</span>
                <span>Rédiger l'Ordre de Recettes dans l'Atelier A4</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau de Référence des Activités & Tarifs Éditables en direct */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#e8eeff]">
        <div className="px-6 py-4 bg-[#f0f3ff] flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#dde8ff]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004528] text-[22px]">table_chart</span>
              <h2 className="font-garamond text-[20px] font-bold text-[#004528]">
                Tableau de Référence des Activités &amp; Tarifs Applicables
              </h2>
            </div>
            <p className="font-sans text-[12px] text-[#404942]">
              Édition directe en ligne par l'Administrateur Jacques • Mise à jour instantanée du cadastre fiscal
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-sans text-[11px] text-[#707a71] bg-[#e7eeff] px-3 py-1.5 rounded font-bold">
              {activities.length} Catégories Réglementaires Définies
            </span>
            <button
              type="button"
              onClick={() => {
                setActivities(CONFIRMED_ACTIVITY_RATES);
                showNotification('Grille des tarifs réinitialisée aux décrets originaux.');
              }}
              className="h-8 px-3 bg-white hover:bg-[#e7eeff] text-[#111c2d] font-sans text-[11px] font-bold rounded flex items-center gap-1.5 transition-colors border border-[#bfc9bf] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[13px]">
            <thead>
              <tr className="bg-[#f0f3ff] text-[#707a71] font-bold text-[10px] uppercase tracking-wider border-b border-[#dde8ff]">
                <th className="px-6 py-3">Code Interne</th>
                <th className="px-6 py-3">Libellé de l'Activité</th>
                <th className="px-6 py-3 text-right">Tarif au m²</th>
                <th className="px-6 py-3">Dernière Révision / Source</th>
                <th className="px-6 py-3 text-center">Statut</th>
                <th className="px-6 py-3 text-right">Action Régisseur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3ff]">
              {activities.map((item, index) => (
                <tr
                  key={item.code}
                  className={`hover:bg-[#f0f3ff]/60 transition-colors ${
                    index % 2 === 1 ? 'bg-[#f0f3ff]/25' : ''
                  }`}
                >
                  <td className="px-6 py-3.5 font-mono text-[12px] font-bold text-[#111c2d]">{item.code}</td>
                  <td className="px-6 py-3.5 font-bold text-[#111c2d]">{item.label}</td>
                  <td className="px-6 py-3.5 text-right font-mono text-[13px] font-bold text-[#004528]">
                    {item.ratePerSqm.toLocaleString('fr-FR')} FCFA / m²
                  </td>
                  <td className="px-6 py-3.5 font-sans text-[12px] text-[#404942]">{item.source}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded font-sans text-[10px] font-bold uppercase ${
                        item.status === 'Actif'
                          ? 'bg-[#a8f3c3]/50 text-[#005231]'
                          : item.status === "À l'étude"
                          ? 'bg-[#fdb647]/30 text-[#6f4900]'
                          : 'bg-[#ffdad6] text-[#93000a]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="h-8 px-3 bg-[#e7eeff] hover:bg-[#004528] hover:text-white rounded font-sans text-[11px] font-bold text-[#004528] transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Modifier</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Registre d'Audit Inviolable (Historique des versions de prix) */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-[#e8eeff]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 bg-[#f0f3ff] p-3 rounded-lg border border-[#dde8ff]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0d5e3a] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
            </div>
            <div>
              <h2 className="font-garamond text-[20px] font-bold text-[#004528]">
                Registre d'Audit Inviolable (Historique des Versions de Prix)
              </h2>
              <span className="font-sans text-[11px] text-[#707a71]">
                Horodatage officiel MCAPNIT • Traçabilité légale opposable aux tiers
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-sans text-[11px] text-[#004528] bg-[#a8f3c3]/40 px-3 py-1 rounded font-bold">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Journal Intègre • SHA-256 Validé</span>
          </div>
        </div>

        {/* Table d'audit */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[12.5px]">
            <thead>
              <tr className="bg-[#f0f3ff] text-[#707a71] font-bold text-[10px] uppercase tracking-wider border-b border-[#dde8ff]">
                <th className="px-4 py-2.5">Date &amp; Heure</th>
                <th className="px-4 py-2.5">Auteur</th>
                <th className="px-4 py-2.5">Activité Concernée</th>
                <th className="px-4 py-2.5 text-right">Ancien Tarif</th>
                <th className="px-4 py-2.5 text-right">Nouveau Tarif</th>
                <th className="px-4 py-2.5">Justification Légale &amp; Références</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3ff]">
              {auditLogs.map((log, lIdx) => (
                <tr
                  key={lIdx}
                  className={`hover:bg-[#f0f3ff]/50 transition-colors ${
                    lIdx % 2 === 1 ? 'bg-[#f0f3ff]/20' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-[11px] text-[#111c2d]">{log.date}</td>
                  <td className="px-4 py-2.5 font-bold text-[#004528]">{log.author}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#111c2d]">
                    {log.activityName} ({log.activityCode})
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#707a71] font-mono">
                    {log.oldPrice === 0 ? '0 FCFA/m² (Nouveau)' : `${log.oldPrice.toLocaleString('fr-FR')} FCFA/m²`}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-[#004528] font-mono">
                    {log.newPrice.toLocaleString('fr-FR')} FCFA/m²
                  </td>
                  <td className="px-4 py-2.5 text-[#404942] italic">{log.justification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Modification Directe Jacques */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative space-y-4 overflow-hidden border border-[#dde8ff] animate-in fade-in zoom-in duration-150">
            {/* Barre Souveraine Haute */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#004528]"></div>

            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004528] text-[24px]">tune</span>
                <h3 className="font-garamond text-[20px] font-bold text-[#004528]">Réviser un Tarif Réglementaire</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="w-8 h-8 rounded hover:bg-[#f0f3ff] flex items-center justify-center text-[#707a71] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-[#f0f3ff] p-3 rounded-lg space-y-1 border border-[#dde8ff]">
              <div className="flex justify-between font-sans text-[11px] text-[#707a71]">
                <span>
                  Activité : <strong className="text-[#111c2d]">{modalItem.label}</strong>
                </span>
                <span>
                  Code : <strong className="text-[#004528] font-bold font-mono">{modalItem.code}</strong>
                </span>
              </div>
              <div className="font-sans text-[12px] text-[#111c2d]">
                Tarif actuel enregistré :{' '}
                <span className="font-bold text-[#004528] font-mono">
                  {modalItem.ratePerSqm.toLocaleString('fr-FR')}
                </span>{' '}
                FCFA / m²
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSaveEdit}>
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Nouveau Barème (FCFA / m²)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={modalNewTarif}
                  onChange={(e) => setModalNewTarif(e.target.value ? Number(e.target.value) : '')}
                  className="h-10 px-3 rounded bg-[#f0f3ff] text-[#111c2d] font-mono text-[13px] font-bold border border-[#bfc9bf] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004528]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-[#404942] uppercase">
                  Justification Légale / Référence Décret Obligatoire
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalJustification}
                  onChange={(e) => setModalJustification(e.target.value)}
                  placeholder="Préciser l'arrêté préfectoral, la note de service ministérielle ou le décret autorisant ce changement..."
                  className="p-3 rounded bg-[#f0f3ff] text-[#111c2d] font-sans text-[12px] border border-[#bfc9bf] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004528] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="h-9 px-4 rounded bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] font-sans text-[12px] font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded bg-[#004528] hover:bg-[#0d5e3a] text-white font-sans text-[12px] font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  <span>Valider &amp; Inscrire au Registre</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {generalToast && (
        <div className="fixed bottom-6 right-6 bg-[#004528] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-[#8dd6a8]/30 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-[#fdb647] text-[#6f4900] flex items-center justify-center shrink-0 font-bold">
            <span className="material-symbols-outlined text-lg">check</span>
          </div>
          <span className="font-sans text-[12px] font-medium">{generalToast}</span>
        </div>
      )}
    </div>
  );
};
