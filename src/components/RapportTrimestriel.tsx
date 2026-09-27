import React, { useState, useEffect, useRef } from 'react';
import {
  RapportTrimestrielDirection,
  ServiceType,
  SERVICES_CONFIG,
  ObjectifAtteintStatus,
  ActiviteService,
  ActiviteHorsProgrammation,
  DifficulteService,
  RAPPORT_OFFICIEL_PROTOTYPE,
} from '../lib/rapportTypes.ts';
import { RapportA4Print } from './RapportA4Print.tsx';

const STORAGE_KEY = 'ddl_pn_rapport_4_services_v3';

export const RapportTrimestriel: React.FC = () => {
  const [data, setData] = useState<RapportTrimestrielDirection>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.tableauxServices?.SAF && parsed?.tableauxServices?.SAA) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return RAPPORT_OFFICIEL_PROTOTYPE;
  });

  const [activeMainTab, setActiveMainTab] = useState<
    'tableaux' | 'adhoc' | 'difficultes' | 'effectifs' | 'perspectives' | 'parametres'
  >('tableaux');
  const [selectedService, setSelectedService] = useState<ServiceType>('SAF');
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('preview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [data]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handlePrint = () => {
    // Direct call to window.print()
    window.print();
  };

  const handleLoadPrototype = () => {
    if (
      window.confirm(
        'Charger le prototype officiel conforme de la Direction Générale (avec les 4 services SAF, SAA, Statistiques, Promotion) ? Vos modifications actuelles seront remplacées.'
      )
    ) {
      setData(RAPPORT_OFFICIEL_PROTOTYPE);
      showToast('Prototype officiel DGL rechargé avec succès.');
    }
  };

  const handleNewReport = () => {
    if (
      window.confirm(
        'Initialiser un nouveau rapport vierge avec les 4 tableaux officiels des 4 services ?'
      )
    ) {
      const blank: RapportTrimestrielDirection = {
        id: `rapport-${Date.now()}`,
        referenceNumero: 'N° 022/MCAPNIT/DGL/DDL-PN/2026',
        trimestre: '3ème Trimestre',
        annee: 2026,
        periodeMois: 'Juillet - Août - Septembre 2026',
        dateSignature: 'Le 05 Octobre 2026',
        lieuSignature: 'Pointe-Noire',
        destinataires: {
          directeurGeneral: 'À Monsieur le Directeur Général des Loisirs (Brazzaville)',
          prefet: 'À Monsieur le Préfet du Département de Pointe-Noire (Cabinet du Préfet)',
        },
        signataires: {
          rapporteurNom: 'Jacques Alphonse MATOKO',
          rapporteurTitre: 'Chef de Service Autorisation et Animation (SAA)',
          directeurNom: 'Jean Richard NTSEKE NGOUAKA',
          directeurTitre: 'Directeur Départemental des Loisirs de Pointe-Noire',
        },
        introduction:
          "Le présent rapport trimestriel d'activités synthétise l'état d'exécution du Plan de Travail Annuel (PTA) au sein de la Direction Départementale des Loisirs de Pointe-Noire pour les quatre services opérationnels (SAF, SAA, Statistiques, Promotion)...",
        contexteDepartemental:
          "Le département de Pointe-Noire poursuit son encadrement récréatif avec des exigences accrues de contrôle, de conformité et de régulation...",
        effectifs: [
          {
            serviceKey: 'DIRECTION',
            serviceNom: 'Direction & Secrétariat',
            fonctionnaires: 2,
            contractuels: 1,
            stagiaires: 1,
            total: 4,
            observations: 'Coordination générale',
          },
          {
            serviceKey: 'SAF',
            serviceNom: 'Service Administratif et Financier (SAF)',
            fonctionnaires: 3,
            contractuels: 1,
            stagiaires: 1,
            total: 5,
            observations: 'Administration et finances',
          },
          {
            serviceKey: 'SAA',
            serviceNom: 'Service Autorisation et Animation (SAA)',
            fonctionnaires: 5,
            contractuels: 2,
            stagiaires: 2,
            total: 9,
            observations: 'Agréments et contrôles',
          },
          {
            serviceKey: 'STATISTIQUES',
            serviceNom: 'Service Statistiques',
            fonctionnaires: 2,
            contractuels: 1,
            stagiaires: 1,
            total: 4,
            observations: 'Recensement et base de données',
          },
          {
            serviceKey: 'PROMOTION',
            serviceNom: 'Service Promotion',
            fonctionnaires: 2,
            contractuels: 1,
            stagiaires: 0,
            total: 3,
            observations: 'Points focaux et loisirs éducatifs',
          },
        ],
        effectifsSynthese: 'Effectif global de 25 agents répartis entre les quatre services et la direction.',
        tableauxServices: {
          SAF: [],
          SAA: [],
          STATISTIQUES: [],
          PROMOTION: [],
        },
        activitesHorsProgrammation: [],
        difficultes: [],
        perspectives: [
          'Poursuite des contrôles et des instructions d’agrément.',
          'Consolidation de la base de données statistique départementale.',
        ],
        recommandationsDGL: ['Attribution en urgence d’un véhicule 4x4 de fonction.'],
        recommandationsPrefet: ['Appui continu de la Police Nationale pour les opérations conjointes.'],
        conclusion: 'Bilan satisfaisant et volonté affirmée d’atteindre les objectifs du prochain trimestre.',
      };
      setData(blank);
      setViewMode('editor');
      showToast('Nouveau rapport vierge initialisé.');
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport_DGL_4Services_${data.trimestre.replace(/\s+/g, '_')}_${data.annee}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fichier JSON de sauvegarde exporté avec succès.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.tableauxServices) {
          setData(parsed);
          showToast('Rapport importé avec succès.');
        } else {
          showToast('Fichier JSON incompatible avec le prototype officiel des 4 services.');
        }
      } catch {
        showToast('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Actions sur les activités des 4 services
  const handleAddActiviteService = (service: ServiceType) => {
    const currentList = data.tableauxServices[service] || [];
    const newAct: ActiviteService = {
      id: `act-${service.toLowerCase()}-${Date.now()}`,
      code: `${service}-0${currentList.length + 1}`,
      activite: `Nouvelle activité du ${SERVICES_CONFIG[service].label}`,
      objectifPta: 'Objectif prescrit par le PTA',
      indicateurCible: 'Cible chiffrée',
      realisation: 'Réalisation concrète du trimestre',
      objectifAtteint: 'OUI',
      tauxRealisation: 100,
      periode: data.periodeMois,
      observations: 'Observations, motifs d’écarts éventuels',
    };

    setData({
      ...data,
      tableauxServices: {
        ...data.tableauxServices,
        [service]: [...currentList, newAct],
      },
    });
    showToast(`Activité ajoutée au ${SERVICES_CONFIG[service].subLabel}.`);
  };

  const handleUpdateActiviteService = (
    service: ServiceType,
    index: number,
    field: keyof ActiviteService,
    value: any
  ) => {
    const currentList = [...data.tableauxServices[service]];
    currentList[index] = { ...currentList[index], [field]: value };
    setData({
      ...data,
      tableauxServices: {
        ...data.tableauxServices,
        [service]: currentList,
      },
    });
  };

  const handleDeleteActiviteService = (service: ServiceType, index: number) => {
    if (window.confirm('Supprimer cette activité de ce service ?')) {
      const currentList = data.tableauxServices[service].filter((_, i) => i !== index);
      setData({
        ...data,
        tableauxServices: {
          ...data.tableauxServices,
          [service]: currentList,
        },
      });
      showToast('Activité retirée.');
    }
  };

  // Stats par service
  const getStats = (service: ServiceType) => {
    const list = data.tableauxServices[service] || [];
    const total = list.length;
    const oui = list.filter((a) => a.objectifAtteint === 'OUI').length;
    const non = list.filter((a) => a.objectifAtteint === 'NON').length;
    const partiel = list.filter((a) => a.objectifAtteint === 'PARTIEL').length;
    const totalTaux = list.reduce((sum, a) => sum + (Number(a.tauxRealisation) || 0), 0);
    const moyenne = total > 0 ? (totalTaux / total).toFixed(1) : '0.0';
    return { total, oui, non, partiel, moyenne };
  };

  const allList = [
    ...data.tableauxServices.SAF,
    ...data.tableauxServices.SAA,
    ...data.tableauxServices.STATISTIQUES,
    ...data.tableauxServices.PROMOTION,
  ];
  const globalTotal = allList.length;
  const globalOui = allList.filter((a) => a.objectifAtteint === 'OUI').length;
  const globalTaux =
    globalTotal > 0
      ? (allList.reduce((sum, a) => sum + (Number(a.tauxRealisation) || 0), 0) / globalTotal).toFixed(1)
      : '0.0';

  return (
    <div className="flex flex-col w-full text-left gap-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#022448] text-white px-5 py-3 rounded-lg shadow-xl border border-[#dde2f3] flex items-center gap-3 animate-fade-in no-print">
          <span className="material-symbols-outlined text-[#80f899] text-xl">check_circle</span>
          <span className="font-sans text-[12px] font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />

      {/* ===================================================================== */}
      {/* ZONE ÉCRAN : INTERFACE DE GESTION & APERÇU (MASQUÉE À L'IMPRESSION) */}
      {/* ===================================================================== */}
      <div className="no-print flex flex-col gap-5">
        {/* BANDEAU SUPÉRIEUR D'AUTORITÉ */}
        <section className="bg-white p-5 rounded-xl shadow-xs border border-[#dde2f3]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#022448] text-white font-sans text-[10px] px-2.5 py-0.5 rounded tracking-wider uppercase font-bold">
                  CANEVAS DIRECTION GÉNÉRALE DES LOISIRS
                </span>
                <span className="bg-[#e8eeff] text-[#022448] font-sans text-[11px] px-2 py-0.5 rounded font-bold">
                  4 Services : SAF • SAA • Statistiques • Promotion
                </span>
                <span className="bg-[#006d2f]/10 text-[#006d2f] font-sans text-[11px] px-2 py-0.5 rounded font-bold">
                  PTA Global : {globalTaux}% ({globalOui}/{globalTotal} objectifs atteints)
                </span>
              </div>

              <h1 className="font-garamond text-[24px] sm:text-[26px] font-bold text-[#022448] tracking-tight leading-tight">
                Rapport Trimestriel d'Activités — Canevas Réglementaire des 4 Services
              </h1>

              <p className="font-serif text-[12.5px] text-[#43474e] max-w-4xl leading-relaxed">
                Renseignez directement si l'objectif par rapport au PTA est <strong>Atteint (OUI)</strong> ou <strong>Non atteint (NON)</strong> dans les quatre tableaux, puis lancez l'impression A4 pour obtenir le document administratif exact destiné à la Direction Générale et au Cabinet du Préfet.
              </p>
            </div>

            {/* Actions principales */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-[#006d2f] hover:bg-[#005322] text-white px-5 py-2.5 rounded-lg shadow-sm font-sans text-[12px] font-bold transition-all cursor-pointer hover:shadow-md"
                title="Lancer l'impression officielle du document A4"
              >
                <span className="material-symbols-outlined text-lg">print</span>
                <span>Imprimer le Rapport Officiel</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'preview' ? 'editor' : 'preview')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-sm font-sans text-[12px] font-bold transition-all cursor-pointer border ${
                  viewMode === 'editor'
                    ? 'bg-[#022448] text-white border-[#022448]'
                    : 'bg-white text-[#022448] border-[#022448]/30 hover:bg-[#f1f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {viewMode === 'editor' ? 'visibility' : 'edit_document'}
                </span>
                <span>{viewMode === 'editor' ? 'Aperçu Document A4' : 'Saisie dans les 4 Tableaux'}</span>
              </button>
            </div>
          </div>

          {/* Actions secondaires */}
          <div className="mt-3 pt-3 border-t border-[#dde2f3] flex flex-wrap items-center justify-between gap-3 text-[11px] font-sans">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#43474e] uppercase text-[10px]">Modèles Canevas :</span>
              <button
                type="button"
                onClick={handleLoadPrototype}
                className="px-2.5 py-1 bg-[#f1f3ff] hover:bg-[#e0e7ff] text-[#022448] rounded border border-[#dde2f3] font-semibold transition-colors cursor-pointer"
              >
                Recharger Prototype T2-2026 (4 Services)
              </button>
              <button
                type="button"
                onClick={handleNewReport}
                className="px-2.5 py-1 bg-white hover:bg-[#f1f3ff] text-[#ba1a1a] rounded border border-[#fecaca] font-semibold transition-colors cursor-pointer"
              >
                Nouveau Rapport Vierge
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="px-2.5 py-1 bg-white hover:bg-[#f1f3ff] text-[#43474e] rounded border border-[#dde2f3] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Sauvegarde JSON</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-white hover:bg-[#f1f3ff] text-[#43474e] rounded border border-[#dde2f3] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">upload</span>
                <span>Importer JSON</span>
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* MODE ÉDITEUR (SAISIE DANS LES 4 TABLEAUX) */}
        {/* ===================================================================== */}
        {viewMode === 'editor' && (
          <div className="flex flex-col gap-5">
            {/* Onglets principaux de saisie */}
            <div className="flex items-center gap-1 bg-[#e8eeff] p-1.5 rounded-lg overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveMainTab('tableaux')}
                className={`px-4 py-2 font-sans text-[11px] uppercase font-bold rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeMainTab === 'tableaux'
                    ? 'bg-[#022448] text-white shadow-sm'
                    : 'text-[#022448] hover:bg-[#dce6f9]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">table_chart</span>
                <span>1. Les 4 Tableaux des 4 Services</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('adhoc')}
                className={`px-4 py-2 font-sans text-[11px] uppercase font-bold rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeMainTab === 'adhoc'
                    ? 'bg-[#022448] text-white shadow-sm'
                    : 'text-[#022448] hover:bg-[#dce6f9]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">celebration</span>
                <span>2. Activités Hors Programmation ({data.activitesHorsProgrammation.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('difficultes')}
                className={`px-4 py-2 font-sans text-[11px] uppercase font-bold rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeMainTab === 'difficultes'
                    ? 'bg-[#ba1a1a] text-white shadow-sm'
                    : 'text-[#ba1a1a] hover:bg-[#fee2e2]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>3. Difficultés Rencontrées ({data.difficultes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('effectifs')}
                className={`px-4 py-2 font-sans text-[11px] uppercase font-bold rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeMainTab === 'effectifs'
                    ? 'bg-[#022448] text-white shadow-sm'
                    : 'text-[#022448] hover:bg-[#dce6f9]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <span>4. Effectifs du Personnel</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('perspectives')}
                className={`px-4 py-2 font-sans text-[11px] uppercase font-bold rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeMainTab === 'perspectives'
                    ? 'bg-[#022448] text-white shadow-sm'
                    : 'text-[#022448] hover:bg-[#dce6f9]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>5. Perspectives &amp; Recommandations</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('parametres')}
                className={`px-4 py-2 font-sans text-[11px] uppercase font-bold rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeMainTab === 'parametres'
                    ? 'bg-[#022448] text-white shadow-sm'
                    : 'text-[#022448] hover:bg-[#dce6f9]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>6. Paramètres &amp; Signataires</span>
              </button>
            </div>

            {/* CONTENU ONGLET 1 : LES 4 TABLEAUX DES 4 SERVICES */}
            {activeMainTab === 'tableaux' && (
              <div className="flex flex-col gap-4">
                {/* 4 Boutons Sélecteurs des 4 Services */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(['SAF', 'SAA', 'STATISTIQUES', 'PROMOTION'] as ServiceType[]).map((serviceKey, idx) => {
                    const conf = SERVICES_CONFIG[serviceKey];
                    const st = getStats(serviceKey);
                    const isSelected = selectedService === serviceKey;

                    return (
                      <button
                        key={serviceKey}
                        type="button"
                        onClick={() => setSelectedService(serviceKey)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#022448] text-white border-[#022448] shadow-md ring-2 ring-[#022448]/30'
                            : 'bg-white hover:bg-[#f8fafc] text-[#022448] border-[#dde2f3]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`font-sans text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-[#e8eeff] text-[#022448]'
                            }`}
                          >
                            Tableau {idx + 1}
                          </span>
                          <span
                            className={`font-sans text-[11px] font-bold ${
                              isSelected ? 'text-[#a8f3c3]' : 'text-[#006d2f]'
                            }`}
                          >
                            {st.moyenne}%
                          </span>
                        </div>
                        <div className="font-bold text-[13px] leading-tight mb-1">{conf.label}</div>
                        <div
                          className={`text-[10.5px] font-sans ${
                            isSelected ? 'text-white/80' : 'text-[#64748b]'
                          }`}
                        >
                          {st.oui} atteints sur {st.total} activités
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Tableau du service sélectionné */}
                <div className="bg-white p-5 rounded-xl shadow-xs border border-[#dde2f3] flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dde2f3]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#022448] text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded">
                          SERVICE : {SERVICES_CONFIG[selectedService].code}
                        </span>
                        <h3 className="font-garamond text-[20px] font-bold text-[#022448]">
                          {SERVICES_CONFIG[selectedService].label}
                        </h3>
                      </div>
                      <p className="font-serif text-[12px] text-[#43474e] mt-0.5">
                        Renseignez pour chaque activité si l'objectif du PTA est <strong>Atteint (OUI)</strong> ou <strong>Non atteint (NON)</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddActiviteService(selectedService)}
                      className="inline-flex items-center gap-1.5 bg-[#006d2f] hover:bg-[#005322] text-white px-3.5 py-1.5 rounded font-sans text-[11px] font-bold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      <span>Ajouter une Activité au {SERVICES_CONFIG[selectedService].code}</span>
                    </button>
                  </div>

                  {/* Lignes du service */}
                  <div className="flex flex-col gap-4">
                    {(data.tableauxServices[selectedService] || []).length === 0 ? (
                      <div className="p-8 text-center text-[#64748b] bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1]">
                        <p className="font-serif text-[13px] mb-2">
                          Aucune activité enregistrée pour le {SERVICES_CONFIG[selectedService].label}.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddActiviteService(selectedService)}
                          className="px-3 py-1 bg-[#022448] text-white text-[11px] font-sans font-bold rounded"
                        >
                          Ajouter la première activité
                        </button>
                      </div>
                    ) : (
                      data.tableauxServices[selectedService].map((act, index) => (
                        <div
                          key={act.id}
                          className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex flex-col gap-3 relative hover:border-[#cbd5e1] transition-colors"
                        >
                          {/* Ligne 1 : Code, Intitulé, Objectif atteint ?, Taux, Supprimer */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                              <span className="font-mono text-[11px] font-bold bg-[#022448] text-white px-2 py-0.5 rounded shrink-0">
                                {act.code}
                              </span>
                              <input
                                type="text"
                                value={act.activite}
                                onChange={(e) =>
                                  handleUpdateActiviteService(
                                    selectedService,
                                    index,
                                    'activite',
                                    e.target.value
                                  )
                                }
                                placeholder="Activité programmée au PTA..."
                                className="font-bold text-[#022448] text-[13px] bg-transparent border-b border-[#cbd5e1] focus:border-[#022448] outline-none w-full"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Sélecteur OUI / NON de l'objectif */}
                              <div className="flex items-center gap-1.5 font-sans text-[11px]">
                                <label className="text-[#022448] font-bold uppercase text-[10px]">
                                  Objectif atteint ? :
                                </label>
                                <select
                                  value={act.objectifAtteint}
                                  onChange={(e) =>
                                    handleUpdateActiviteService(
                                      selectedService,
                                      index,
                                      'objectifAtteint',
                                      e.target.value as ObjectifAtteintStatus
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded font-sans text-[11px] font-bold outline-none cursor-pointer ${
                                    act.objectifAtteint === 'OUI'
                                      ? 'bg-[#006d2f] text-white'
                                      : act.objectifAtteint === 'PARTIEL'
                                      ? 'bg-[#ca8a04] text-white'
                                      : act.objectifAtteint === 'NON'
                                      ? 'bg-[#ba1a1a] text-white'
                                      : 'bg-[#0284c7] text-white'
                                  }`}
                                >
                                  <option value="OUI">OUI (Atteint)</option>
                                  <option value="PARTIEL">PARTIEL</option>
                                  <option value="NON">NON (Non atteint)</option>
                                  <option value="EN_COURS">EN COURS</option>
                                </select>
                              </div>

                              {/* Taux % */}
                              <div className="flex items-center gap-1 font-sans text-[11px]">
                                <label className="text-[#43474e] font-semibold">Taux :</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={act.tauxRealisation}
                                  onChange={(e) =>
                                    handleUpdateActiviteService(
                                      selectedService,
                                      index,
                                      'tauxRealisation',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-16 px-1.5 py-0.5 rounded border border-[#cbd5e1] bg-white text-center font-bold text-[#006d2f] outline-none"
                                />
                                <span className="font-bold">%</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteActiviteService(selectedService, index)}
                                className="text-[#ba1a1a] hover:bg-[#fee2e2] p-1 rounded transition-colors cursor-pointer"
                                title="Supprimer cette activité"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Ligne 2 : Objectifs / Indicateurs & Réalisations */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-sans">
                            <div>
                              <label className="block text-[#43474e] font-semibold mb-1">
                                Objectif poursuivi :
                              </label>
                              <input
                                type="text"
                                value={act.objectifPta}
                                onChange={(e) =>
                                  handleUpdateActiviteService(
                                    selectedService,
                                    index,
                                    'objectifPta',
                                    e.target.value
                                  )
                                }
                                placeholder="Objectif fixé par le PTA"
                                className="w-full p-2 bg-white rounded border border-[#cbd5e1] outline-none font-serif text-[11.5px]"
                              />
                            </div>

                            <div>
                              <label className="block text-[#43474e] font-semibold mb-1">
                                Cible / Indicateur :
                              </label>
                              <input
                                type="text"
                                value={act.indicateurCible}
                                onChange={(e) =>
                                  handleUpdateActiviteService(
                                    selectedService,
                                    index,
                                    'indicateurCible',
                                    e.target.value
                                  )
                                }
                                placeholder="Cible chiffrée"
                                className="w-full p-2 bg-white rounded border border-[#cbd5e1] outline-none font-serif text-[11.5px]"
                              />
                            </div>

                            <div>
                              <label className="block text-[#43474e] font-semibold mb-1">
                                Réalisation concrète :
                              </label>
                              <input
                                type="text"
                                value={act.realisation}
                                onChange={(e) =>
                                  handleUpdateActiviteService(
                                    selectedService,
                                    index,
                                    'realisation',
                                    e.target.value
                                  )
                                }
                                placeholder="Résultats concrets du trimestre"
                                className="w-full p-2 bg-white rounded border border-[#cbd5e1] outline-none font-serif text-[11.5px] font-semibold text-[#022448]"
                              />
                            </div>
                          </div>

                          {/* Ligne 3 : Observations / Motifs */}
                          <div>
                            <label className="block text-[#43474e] font-semibold text-[11px] mb-1">
                              Observations (Motifs des retards, contraintes ou mesures prises) :
                            </label>
                            <input
                              type="text"
                              value={act.observations}
                              onChange={(e) =>
                                handleUpdateActiviteService(
                                  selectedService,
                                  index,
                                  'observations',
                                  e.target.value
                                )
                              }
                              placeholder="Justification administrative si l'objectif n'est pas atteint..."
                              className="w-full p-2 bg-white rounded border border-[#cbd5e1] outline-none font-serif text-[11.5px]"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CONTENU ONGLET 2 : ACTIVITÉS HORS PROGRAMMATION */}
            {activeMainTab === 'adhoc' && (
              <div className="bg-white p-5 rounded-xl shadow-xs border border-[#dde2f3] flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3]">
                  <div>
                    <h3 className="font-garamond text-[20px] font-bold text-[#022448]">
                      Activités Réalisées Hors Programmation (Ad-hoc)
                    </h3>
                    <p className="font-serif text-[12px] text-[#43474e]">
                      Événements spontanés, fête du travail, tournois, initiations non programmés au PTA.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newAdhoc: ActiviteHorsProgrammation = {
                        id: `adh-${Date.now()}`,
                        code: `ADH-0${data.activitesHorsProgrammation.length + 1}`,
                        titre: 'Nouvelle activité ad-hoc',
                        serviceResponsable: selectedService,
                        datePeriode: 'Date de l’événement',
                        lieu: 'Pointe-Noire',
                        contexte: 'Sollicitation officielle',
                        resultats: 'Résultats obtenus',
                        observations: 'Commentaires',
                      };
                      setData({
                        ...data,
                        activitesHorsProgrammation: [...data.activitesHorsProgrammation, newAdhoc],
                      });
                      showToast('Activité ad-hoc ajoutée.');
                    }}
                    className="bg-[#006d2f] text-white px-3 py-1.5 rounded font-sans text-[11px] font-bold"
                  >
                    + Ajouter une Activité Ponctuelle
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {data.activitesHorsProgrammation.map((adhoc, idx) => (
                    <div key={adhoc.id} className="p-3 bg-[#f8fafc] rounded border border-[#cbd5e1] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-mono text-[11px] font-bold bg-[#1e3a5f] text-white px-2 py-0.5 rounded">
                            {adhoc.code}
                          </span>
                          <input
                            type="text"
                            value={adhoc.titre}
                            onChange={(e) => {
                              const updated = [...data.activitesHorsProgrammation];
                              updated[idx].titre = e.target.value;
                              setData({ ...data, activitesHorsProgrammation: updated });
                            }}
                            className="font-bold text-[#022448] text-[13px] bg-transparent border-b border-[#cbd5e1] outline-none flex-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = data.activitesHorsProgrammation.filter((_, i) => i !== idx);
                            setData({ ...data, activitesHorsProgrammation: updated });
                          }}
                          className="text-[#ba1a1a] p-1"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-sans">
                        <input
                          type="text"
                          value={adhoc.datePeriode}
                          onChange={(e) => {
                            const updated = [...data.activitesHorsProgrammation];
                            updated[idx].datePeriode = e.target.value;
                            setData({ ...data, activitesHorsProgrammation: updated });
                          }}
                          placeholder="Date"
                          className="p-1.5 bg-white border border-[#cbd5e1] rounded"
                        />
                        <input
                          type="text"
                          value={adhoc.resultats}
                          onChange={(e) => {
                            const updated = [...data.activitesHorsProgrammation];
                            updated[idx].resultats = e.target.value;
                            setData({ ...data, activitesHorsProgrammation: updated });
                          }}
                          placeholder="Résultats"
                          className="p-1.5 bg-white border border-[#cbd5e1] rounded"
                        />
                        <input
                          type="text"
                          value={adhoc.observations}
                          onChange={(e) => {
                            const updated = [...data.activitesHorsProgrammation];
                            updated[idx].observations = e.target.value;
                            setData({ ...data, activitesHorsProgrammation: updated });
                          }}
                          placeholder="Observations"
                          className="p-1.5 bg-white border border-[#cbd5e1] rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONTENU ONGLET 3 : DIFFICULTÉS RENCONTRÉES */}
            {activeMainTab === 'difficultes' && (
              <div className="bg-white p-5 rounded-xl shadow-xs border border-[#dde2f3] flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3]">
                  <div>
                    <h3 className="font-garamond text-[20px] font-bold text-[#ba1a1a]">
                      Difficultés ayant Empêché l'Atteinte des Objectifs du PTA
                    </h3>
                    <p className="font-serif text-[12px] text-[#43474e]">
                      Justifications factuelles (véhicules, carburant, papier, crédits) à destination de la hiérarchie.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newDiff: DifficulteService = {
                        id: `diff-${Date.now()}`,
                        service: selectedService,
                        titre: 'Nouvelle difficulté constatée',
                        description: 'Description factuelle',
                        impactPta: 'Impact sur le PTA',
                        solutionProposee: 'Mesure palliative',
                        attenteHierarchie: 'Attente prioritaire',
                      };
                      setData({ ...data, difficultes: [...data.difficultes, newDiff] });
                      showToast('Difficulté ajoutée.');
                    }}
                    className="bg-[#ba1a1a] text-white px-3 py-1.5 rounded font-sans text-[11px] font-bold"
                  >
                    + Ajouter une Difficulté
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.difficultes.map((diff, idx) => (
                    <div key={diff.id} className="p-3 bg-[#fef2f2] rounded border border-[#fecaca] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <select
                          value={diff.service}
                          onChange={(e) => {
                            const updated = [...data.difficultes];
                            updated[idx].service = e.target.value as any;
                            setData({ ...data, difficultes: updated });
                          }}
                          className="p-1 rounded bg-white border border-[#fca5a5] text-[10px] font-bold text-[#ba1a1a]"
                        >
                          <option value="DIRECTION_GENERALE">Direction / Tous Services</option>
                          <option value="SAF">SAF</option>
                          <option value="SAA">SAA</option>
                          <option value="STATISTIQUES">Statistiques</option>
                          <option value="PROMOTION">Promotion</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = data.difficultes.filter((_, i) => i !== idx);
                            setData({ ...data, difficultes: updated });
                          }}
                          className="text-[#ba1a1a] p-1"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={diff.titre}
                        onChange={(e) => {
                          const updated = [...data.difficultes];
                          updated[idx].titre = e.target.value;
                          setData({ ...data, difficultes: updated });
                        }}
                        placeholder="Titre"
                        className="font-bold text-[#022448] text-[12px] bg-transparent border-b border-[#fca5a5] outline-none"
                      />

                      <textarea
                        rows={2}
                        value={diff.description}
                        onChange={(e) => {
                          const updated = [...data.difficultes];
                          updated[idx].description = e.target.value;
                          setData({ ...data, difficultes: updated });
                        }}
                        placeholder="Description"
                        className="p-1.5 bg-white border border-[#fca5a5] rounded text-[11px]"
                      />

                      <input
                        type="text"
                        value={diff.impactPta}
                        onChange={(e) => {
                          const updated = [...data.difficultes];
                          updated[idx].impactPta = e.target.value;
                          setData({ ...data, difficultes: updated });
                        }}
                        placeholder="Impact direct sur le PTA"
                        className="p-1.5 bg-white border border-[#fca5a5] rounded text-[11px] font-semibold text-[#991b1b]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONTENU ONGLET 4 : EFFECTIFS */}
            {activeMainTab === 'effectifs' && (
              <div className="bg-white p-5 rounded-xl shadow-xs border border-[#dde2f3] flex flex-col gap-4">
                <h3 className="font-garamond text-[20px] font-bold text-[#022448]">
                  Tableau du Personnel (Direction &amp; 4 Services)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-serif text-[11.5px] border-collapse border border-[#cbd5e1]">
                    <thead>
                      <tr className="bg-[#022448] text-white font-sans text-[10px] uppercase font-bold">
                        <th className="p-2 border border-[#022448]/40">Service</th>
                        <th className="p-2 text-center border border-[#022448]/40 w-24">Fonctionnaires</th>
                        <th className="p-2 text-center border border-[#022448]/40 w-24">Contractuels</th>
                        <th className="p-2 text-center border border-[#022448]/40 w-24">Stagiaires</th>
                        <th className="p-2 text-center border border-[#022448]/40 w-20 bg-[#1e3a5f]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.effectifs.map((eff, idx) => (
                        <tr key={eff.serviceKey}>
                          <td className="p-2 font-bold text-[#022448] border border-[#e2e8f0]">
                            {eff.serviceNom}
                          </td>
                          <td className="p-2 text-center border border-[#e2e8f0]">
                            <input
                              type="number"
                              min="0"
                              value={eff.fonctionnaires}
                              onChange={(e) => {
                                const updated = [...data.effectifs];
                                const v = Number(e.target.value);
                                updated[idx].fonctionnaires = v;
                                updated[idx].total = v + updated[idx].contractuels + updated[idx].stagiaires;
                                setData({ ...data, effectifs: updated });
                              }}
                              className="w-16 p-1 text-center bg-white border border-[#cbd5e1] rounded font-bold"
                            />
                          </td>
                          <td className="p-2 text-center border border-[#e2e8f0]">
                            <input
                              type="number"
                              min="0"
                              value={eff.contractuels}
                              onChange={(e) => {
                                const updated = [...data.effectifs];
                                const v = Number(e.target.value);
                                updated[idx].contractuels = v;
                                updated[idx].total = updated[idx].fonctionnaires + v + updated[idx].stagiaires;
                                setData({ ...data, effectifs: updated });
                              }}
                              className="w-16 p-1 text-center bg-white border border-[#cbd5e1] rounded font-bold"
                            />
                          </td>
                          <td className="p-2 text-center border border-[#e2e8f0]">
                            <input
                              type="number"
                              min="0"
                              value={eff.stagiaires}
                              onChange={(e) => {
                                const updated = [...data.effectifs];
                                const v = Number(e.target.value);
                                updated[idx].stagiaires = v;
                                updated[idx].total = updated[idx].fonctionnaires + updated[idx].contractuels + v;
                                setData({ ...data, effectifs: updated });
                              }}
                              className="w-16 p-1 text-center bg-white border border-[#cbd5e1] rounded font-bold"
                            />
                          </td>
                          <td className="p-2 text-center font-bold text-[#006d2f] bg-[#f1f3ff] border border-[#e2e8f0]">
                            {eff.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CONTENU ONGLET 5 : PERSPECTIVES & CONCLUSION */}
            {activeMainTab === 'perspectives' && (
              <div className="bg-white p-5 rounded-xl shadow-xs border border-[#dde2f3] flex flex-col gap-4">
                <h3 className="font-garamond text-[20px] font-bold text-[#022448]">
                  Perspectives &amp; Recommandations d'Autorité
                </h3>

                <div>
                  <label className="block font-sans text-[11px] font-bold text-[#022448] mb-1">
                    Perspectives pour le prochain trimestre :
                  </label>
                  <textarea
                    rows={4}
                    value={data.perspectives.join('\n')}
                    onChange={(e) =>
                      setData({
                        ...data,
                        perspectives: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                      })
                    }
                    className="w-full p-2 bg-[#f8fafc] border border-[#cbd5e1] rounded font-serif text-[12px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-[11px] font-bold text-[#166534] mb-1">
                      Recommandations à la Direction Générale :
                    </label>
                    <textarea
                      rows={3}
                      value={data.recommandationsDGL.join('\n')}
                      onChange={(e) =>
                        setData({
                          ...data,
                          recommandationsDGL: e.target.value
                            .split('\n')
                            .filter((l) => l.trim().length > 0),
                        })
                      }
                      className="w-full p-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded font-serif text-[11.5px]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[11px] font-bold text-[#022448] mb-1">
                      Sollicitations au Cabinet du Préfet :
                    </label>
                    <textarea
                      rows={3}
                      value={data.recommandationsPrefet.join('\n')}
                      onChange={(e) =>
                        setData({
                          ...data,
                          recommandationsPrefet: e.target.value
                            .split('\n')
                            .filter((l) => l.trim().length > 0),
                        })
                      }
                      className="w-full p-2 bg-[#f8fafc] border border-[#cbd5e1] rounded font-serif text-[11.5px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-[11px] font-bold text-[#022448] mb-1">
                    Conclusion générale :
                  </label>
                  <textarea
                    rows={3}
                    value={data.conclusion}
                    onChange={(e) => setData({ ...data, conclusion: e.target.value })}
                    className="w-full p-2 bg-[#f8fafc] border border-[#cbd5e1] rounded font-serif text-[12px]"
                  />
                </div>
              </div>
            )}

            {/* CONTENU ONGLET 6 : PARAMÈTRES & SIGNATAIRES */}
            {activeMainTab === 'parametres' && (
              <div className="bg-white p-5 rounded-xl shadow-xs border border-[#dde2f3] flex flex-col gap-4">
                <h3 className="font-garamond text-[20px] font-bold text-[#022448]">
                  Paramètres &amp; Signataires du Rapport
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-sans text-[11px] font-bold text-[#43474e] mb-1">
                      Trimestre :
                    </label>
                    <select
                      value={data.trimestre}
                      onChange={(e) => setData({ ...data, trimestre: e.target.value as any })}
                      className="w-full p-2 bg-white border border-[#cbd5e1] font-sans text-[12px] font-bold text-[#022448]"
                    >
                      <option value="1er Trimestre">1er Trimestre</option>
                      <option value="2ème Trimestre">2ème Trimestre</option>
                      <option value="3ème Trimestre">3ème Trimestre</option>
                      <option value="4ème Trimestre">4ème Trimestre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-sans text-[11px] font-bold text-[#43474e] mb-1">
                      Année :
                    </label>
                    <input
                      type="number"
                      value={data.annee}
                      onChange={(e) => setData({ ...data, annee: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-[#cbd5e1] font-sans text-[12px] font-bold text-[#022448]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[11px] font-bold text-[#43474e] mb-1">
                      Référence Officielle :
                    </label>
                    <input
                      type="text"
                      value={data.referenceNumero}
                      onChange={(e) => setData({ ...data, referenceNumero: e.target.value })}
                      className="w-full p-2 bg-white border border-[#cbd5e1] font-mono text-[11.5px] font-bold text-[#022448]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-sans text-[11px] font-bold text-[#43474e] mb-1">
                      Période couverte :
                    </label>
                    <input
                      type="text"
                      value={data.periodeMois}
                      onChange={(e) => setData({ ...data, periodeMois: e.target.value })}
                      className="w-full p-2 bg-white border border-[#cbd5e1] font-serif text-[12px]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[11px] font-bold text-[#43474e] mb-1">
                      Date de signature :
                    </label>
                    <input
                      type="text"
                      value={data.dateSignature}
                      onChange={(e) => setData({ ...data, dateSignature: e.target.value })}
                      className="w-full p-2 bg-white border border-[#cbd5e1] font-serif text-[12px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODE PRÉVISUALISATION A4 À L'ÉCRAN */}
        {/* ===================================================================== */}
        {viewMode === 'preview' && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full max-w-4xl bg-white p-3 rounded-xl border border-[#dde2f3] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006d2f] text-xl">verified</span>
                <span className="font-sans text-[12px] font-bold text-[#022448]">
                  Aperçu du Rapport A4 Conforme au Canevas de la Direction Générale
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('editor')}
                  className="px-3 py-1.5 rounded bg-[#f1f3ff] hover:bg-[#e0e7ff] text-[#022448] font-sans text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  <span>Saisie dans les 4 Tableaux</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-1.5 rounded bg-[#006d2f] hover:bg-[#005322] text-white font-sans text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Imprimer Maintenant</span>
                </button>
              </div>
            </div>

            <div className="w-full max-w-4xl bg-white shadow-xl rounded-sm border border-[#cbd5e1]">
              <RapportA4Print data={data} />
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* ZONE EXCLUSIVE POUR L'IMPRESSION PHYSIQUE (@media print) */}
      {/* ===================================================================== */}
      <div className="hidden print:block w-full">
        <RapportA4Print data={data} />
      </div>
    </div>
  );
};
