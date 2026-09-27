import React, { useState } from 'react';
import type { TabType } from './Navbar.tsx';

interface SuiviPTAProps {
  onNavigateToTab?: (tab: TabType) => void;
}

export const SuiviPTA: React.FC<SuiviPTAProps> = ({ onNavigateToTab }) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCompile = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setIsCompiling(false);
      setToastMessage(
        'Rapport Trimestriel T3-2026 officiel compilé avec visas I à IX et contraintes logistiques intégrées.'
      );
      if (onNavigateToTab) {
        onNavigateToTab('rapport-trimestriel');
      }
      setTimeout(() => {
        setToastMessage(null);
      }, 4500);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full text-left gap-6">
      {/* BANDEAU SUPÉRIEUR D'AUTORITÉ RÉPUBLICAINE & PILOTAGE TRIMESTRIEL */}
      <section className="bg-[#ffffff] p-6 shadow-sm rounded-xl relative overflow-hidden border border-[#e8eeff]">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#022448]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-80 h-32 bg-[#006d2f]/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#022448] text-white font-sans text-[10px] px-2.5 py-0.5 rounded tracking-widest uppercase font-bold">
                RÉFÉRENCE DDL-PN / SAFM / PTA-2026
              </span>
              <span className="bg-[#e8eeff] text-[#43474e] font-sans text-[11px] px-2.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm text-[#006d2f]">verified</span>
                Émetteur Central : Service Administratif, Financier et du Matériel (SAFM)
              </span>
              <span className="bg-[#006d2f]/10 text-[#006d2f] font-sans text-[11px] px-2.5 py-0.5 rounded font-bold">
                Période : 3ème Trimestre 2026
              </span>
            </div>

            <h1 className="font-garamond text-[26px] font-bold text-[#022448] tracking-tight leading-tight">
              Pilotage du Plan de Travail Annuel (PTA 2026) &amp; Consolidation Trimestrielle
            </h1>

            <p className="font-serif text-[13px] text-[#43474e] max-w-4xl leading-relaxed">
              Supervision départementale des activités régaliennes et synthèse consolidée par le SAFM chapeautant les services opérationnels (Service de l'Animation et des Activités — SAA, et Service des Équipements). Intégration directe des contraintes logistiques pour transmission officielle à la Direction Générale des Loisirs (DGL Brazzaville).
            </p>
          </div>

          {/* Action Compilation SAFM */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCompile}
              disabled={isCompiling}
              className="inline-flex items-center gap-2 bg-[#022448] hover:bg-[#1e3a5f] text-white px-5 py-2.5 rounded shadow transition-all cursor-pointer group disabled:opacity-75"
            >
              <span className={`material-symbols-outlined text-lg ${isCompiling ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`}>
                {isCompiling ? 'refresh' : 'description'}
              </span>
              <span className="font-sans text-[12px] font-bold tracking-wide">
                {isCompiling ? 'Compilation SAFM en cours...' : 'Compiler le Rapport Trimestriel Officiel (Format Word SAFM)'}
              </span>
            </button>
            <div className="flex items-center gap-1.5 text-[#43474e] font-serif text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#006d2f]"></span>
              <span>Protocole DGL-MCAPNIT certifié • Données actualisées T3</span>
            </div>
          </div>
        </div>

        {/* INDICATEURS CLÉS D'EXÉCUTION & MINISTÉRIELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 bg-[#f1f3ff] p-4 rounded-lg border border-[#dde2f3]/50">
          {/* Card 1: Gauge */}
          <div className="flex items-center gap-4 bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff]">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#d4daea]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                ></path>
                <path
                  className="text-[#006d2f]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="68.4, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                ></path>
              </svg>
              <span className="absolute font-sans text-[11px] text-[#022448] font-bold">68.4%</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-[10px] uppercase text-[#43474e] font-bold">Taux d'Exécution Global</span>
              <span className="font-garamond text-[17px] font-bold text-[#022448]">PTA Année 2026</span>
              <span className="font-serif text-[11px] text-[#006d2f] font-semibold">Cible T3 : 75.0% (-6.6% écart)</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center gap-4 bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff]">
            <div className="w-12 h-12 rounded bg-[#022448]/10 flex items-center justify-center text-[#022448] shrink-0">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-[10px] uppercase text-[#43474e] font-bold">Contrôles Inopinés T3</span>
              <span className="font-garamond text-[17px] font-bold text-[#022448]">42 / 60 Prévus</span>
              <span className="font-serif text-[11px] text-[#43474e]">70.0% exécuté par le SAA</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center gap-4 bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff]">
            <div className="w-12 h-12 rounded bg-[#6d5e00]/10 flex items-center justify-center text-[#6d5e00] shrink-0">
              <span className="material-symbols-outlined text-2xl">fact_check</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-[10px] uppercase text-[#43474e] font-bold">Cartographie &amp; Espaces</span>
              <span className="font-garamond text-[17px] font-bold text-[#022448]">128 Recensés</span>
              <span className="font-serif text-[11px] text-[#6d5e00] font-semibold">85.3% de la cible communale</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex items-center gap-4 bg-[#ffffff] p-4 rounded shadow-sm border border-[#e8eeff]">
            <div className="w-12 h-12 rounded bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-[10px] uppercase text-[#ba1a1a] font-bold">Contraintes Matérielles</span>
              <span className="font-garamond text-[17px] font-bold text-[#ba1a1a]">4 Alertes Majeures</span>
              <span className="font-serif text-[11px] text-[#43474e]">Intégration directe au rapport</span>
            </div>
          </div>
        </div>
      </section>

      {/* TWO COLUMNS: Matrice & Contraintes (Left 7 cols) + Previsualisation A4 (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* MATRICE DU PTA 2026 */}
          <div className="bg-[#ffffff] rounded-xl shadow-sm p-6 flex flex-col gap-4 border border-[#e8eeff]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#f1f3ff]">
              <div>
                <span className="font-sans text-[10px] uppercase text-[#6d5e00] font-bold tracking-wider">
                  Matrice Réglementaire MCAPNIT
                </span>
                <h2 className="font-garamond text-[20px] font-bold text-[#022448]">
                  État d'Exécution des Activités Ministérielles — PTA 2026
                </h2>
              </div>
              <span className="px-3 py-1 bg-[#e8eeff] text-[#022448] font-sans text-[10px] rounded uppercase font-bold mt-2 sm:mt-0">
                DDL-PN • 3e Trimestre
              </span>
            </div>

            {/* Structured Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-serif text-[12px]">
                <thead>
                  <tr className="bg-[#e3e8f9] text-[#022448] font-sans text-[10px] uppercase tracking-wider font-bold">
                    <th className="p-3">N°</th>
                    <th className="p-3 min-w-[190px]">Activité Prévue au PTA</th>
                    <th className="p-3">Service Resp.</th>
                    <th className="p-3">Période</th>
                    <th className="p-3">Réalisation</th>
                    <th className="p-3">Taux</th>
                    <th className="p-3 min-w-[180px]">Observations &amp; Justifications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eeff]">
                  {/* Ligne 1 */}
                  <tr className="hover:bg-[#f1f3ff] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#022448]">ACT-01</td>
                    <td className="p-3">
                      <div className="font-bold text-[#022448]">Recensement des espaces de loisirs</div>
                      <div className="text-[11px] text-[#43474e]">Établissements marchands et non-marchands (Pointe-Noire)</div>
                    </td>
                    <td className="p-3 font-sans text-[10px] font-bold">SAFM / SAA</td>
                    <td className="p-3 text-[11px]">Juil. - Août</td>
                    <td className="p-3 font-bold text-[#022448]">128 fiches établies</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#006d2f]/10 text-[#006d2f] font-sans text-[11px] font-bold">
                        85.3%
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-[#43474e]">
                      Opération ralentie dans les arrondissements 5 (Mongo-Poukou) et 6 (Ngoyo) par absence de carburant et tablettes.
                    </td>
                  </tr>

                  {/* Ligne 2 */}
                  <tr className="hover:bg-[#f1f3ff] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#022448]">ACT-02</td>
                    <td className="p-3">
                      <div className="font-bold text-[#022448]">Contrôles inopinés de sécurité &amp; conformité</div>
                      <div className="text-[11px] text-[#43474e]">Vérification des arrêtés d'ouverture, sécurité ERP</div>
                    </td>
                    <td className="p-3 font-sans text-[10px] font-bold">SAA / DDL</td>
                    <td className="p-3 text-[11px]">Juillet - Sept.</td>
                    <td className="p-3 font-bold text-[#022448]">42 missions menées</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#6d5e00]/10 text-[#6d5e00] font-sans text-[11px] font-bold">
                        70.0%
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-[#43474e]">
                      Exécuté principalement au centre-ville (Patrice Lumumba) faute de véhicules pour les zones périphériques.
                    </td>
                  </tr>

                  {/* Ligne 3 */}
                  <tr className="hover:bg-[#f1f3ff] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#022448]">ACT-03</td>
                    <td className="p-3">
                      <div className="font-bold text-[#022448]">Organisation des journées récréatives</div>
                      <div className="text-[11px] text-[#43474e]">Encadrement socio-éducatif des jeunes en vacances</div>
                    </td>
                    <td className="p-3 font-sans text-[10px] font-bold">SAA</td>
                    <td className="p-3 text-[11px]">Août 2026</td>
                    <td className="p-3 font-bold text-[#022448]">3 événements tenus</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#006d2f]/10 text-[#006d2f] font-sans text-[11px] font-bold">
                        75.0%
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-[#43474e]">
                      Succès d'audience à Tié-Tié et Mpita. Forte sollicitation des associations locales de jeunesse.
                    </td>
                  </tr>

                  {/* Ligne 4 */}
                  <tr className="hover:bg-[#f1f3ff] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#022448]">ACT-04</td>
                    <td className="p-3">
                      <div className="font-bold text-[#022448]">Formation des agents d'animation</div>
                      <div className="text-[11px] text-[#43474e]">Renforcement des capacités en régulation ludique</div>
                    </td>
                    <td className="p-3 font-sans text-[10px] font-bold">SAFM</td>
                    <td className="p-3 text-[11px]">Septembre</td>
                    <td className="p-3 font-bold text-[#022448]">1 session / 2 prévues</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] font-sans text-[11px] font-bold">
                        50.0%
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-[#43474e]">
                      Report partiel dû au retard d'approvisionnement en kits pédagogiques et fournitures au SAFM.
                    </td>
                  </tr>

                  {/* Ligne 5 */}
                  <tr className="hover:bg-[#f1f3ff] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#022448]">ACT-05</td>
                    <td className="p-3">
                      <div className="font-bold text-[#022448]">Instruction des agréments &amp; autorisations</div>
                      <div className="text-[11px] text-[#43474e]">Formalisation des dossiers d'exploitation économique</div>
                    </td>
                    <td className="p-3 font-sans text-[10px] font-bold">SAFM</td>
                    <td className="p-3 text-[11px]">Permanent</td>
                    <td className="p-3 font-bold text-[#022448]">19 arrêtés validés</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#006d2f]/10 text-[#006d2f] font-sans text-[11px] font-bold">
                        80.0%
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-[#43474e]">
                      Conformité stricte au Décret d'attribution ministériel. Recouvrement suivi par le SAFM.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* DIFFICULTÉS LOGISTIQUES ET MATÉRIELLES CONSTATÉES (SAFM) */}
          <div className="bg-[#ffffff] rounded-xl shadow-sm p-6 flex flex-col gap-4 border border-[#e8eeff]">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[#ba1a1a] font-sans text-[10px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">report</span>
                  Intégration Directe au Rapport Ministériel — Chapitre V
                </div>
                <h2 className="font-garamond text-[20px] font-bold text-[#022448]">
                  Difficultés Logistiques &amp; Matérielles Constatées
                </h2>
                <p className="font-serif text-[12px] text-[#43474e]">
                  Les contraintes ci-dessous ont été enregistrées formellement par le SAFM sans délai ni conditionnement préalable :
                </p>
              </div>
              <span className="bg-[#ba1a1a]/10 text-[#ba1a1a] font-sans text-[10px] px-3 py-1 rounded font-bold uppercase">
                Priorité Élevée DGL
              </span>
            </div>

            {/* 4 Mandatory Constraints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contrainte 1 */}
              <div className="bg-[#f1f3ff] p-4 rounded-lg flex flex-col justify-between border border-[#dde2f3]/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-lg">directions_car</span>
                    <span className="font-sans text-[10px] uppercase font-bold">Matériel Roulant Lourd</span>
                  </div>
                  <h4 className="font-garamond text-[16px] font-bold text-[#022448]">Manque de véhicule de service</h4>
                  <p className="font-serif text-[11px] text-[#43474e] leading-relaxed">
                    Impossibilité matérielle d'effectuer les rondes interurbaines et périphériques régulières vers <strong>Tchiamba-Nzassi</strong>, les lisières de <strong>Loandjili</strong> et les plages côtières éloignées.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#dde2f3] font-sans text-[10px] text-[#43474e] font-semibold">
                  Impact : 30% des établissements extra-muros non contrôlés au T3.
                </div>
              </div>

              {/* Contrainte 2 */}
              <div className="bg-[#f1f3ff] p-4 rounded-lg flex flex-col justify-between border border-[#dde2f3]/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-lg">two_wheeler</span>
                    <span className="font-sans text-[10px] uppercase font-bold">Mobilité des Inspecteurs</span>
                  </div>
                  <h4 className="font-garamond text-[16px] font-bold text-[#022448]">Dotation insuffisante en motocyclettes</h4>
                  <p className="font-serif text-[11px] text-[#43474e] leading-relaxed">
                    Parc motorisé restreint pour les équipes d'inspection du <strong>Service de l'Animation et des Activités (SAA)</strong>, freinant le déploiement rapide lors des contrôles inopinés en milieu dense.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#dde2f3] font-sans text-[10px] text-[#43474e] font-semibold">
                  Impact : Dépendance aux transports publics individuels pour les agents.
                </div>
              </div>

              {/* Contrainte 3 */}
              <div className="bg-[#f1f3ff] p-4 rounded-lg flex flex-col justify-between border border-[#dde2f3]/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-lg">tablet_mac</span>
                    <span className="font-sans text-[10px] uppercase font-bold">Transition Numérique</span>
                  </div>
                  <h4 className="font-garamond text-[16px] font-bold text-[#022448]">Carence en tablettes tactiles</h4>
                  <p className="font-serif text-[11px] text-[#43474e] leading-relaxed">
                    Absence de terminaux mobiles dédiés pour la <strong>numérisation instantanée des fiches de conformité</strong>, forçant une ressaisie manuelle archaïque et générant un risque de déperdition d'éléments probants.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#dde2f3] font-sans text-[10px] text-[#43474e] font-semibold">
                  Impact : Latence de transmission de 5 jours ouvrés au secrétariat SAFM.
                </div>
              </div>

              {/* Contrainte 4 */}
              <div className="bg-[#f1f3ff] p-4 rounded-lg flex flex-col justify-between border border-[#dde2f3]/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-lg">print</span>
                    <span className="font-sans text-[10px] uppercase font-bold">Régie &amp; Secrétariat Général</span>
                  </div>
                  <h4 className="font-garamond text-[16px] font-bold text-[#022448]">Besoins en consommables bureautiques</h4>
                  <p className="font-serif text-[11px] text-[#43474e] leading-relaxed">
                    Tension critique sur les <strong>rames de papier réglementaire (80g)</strong>, cartouches de toner haute capacité et chemises d'archivage cotées au SAFM, entravant la délivrance prompte des récépissés officiels.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#dde2f3] font-sans text-[10px] text-[#43474e] font-semibold">
                  Impact : Risque de blocage de l'édition des attestations départementales.
                </div>
              </div>
            </div>

            {/* Mesures Correctives */}
            <div className="bg-[#e3e8f9] p-4 rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[#022448] font-sans text-[11px] uppercase font-bold">
                <span className="material-symbols-outlined text-[#006d2f] text-base">gavel</span>
                Mesures Correctives Locales &amp; Recommandations d'Autorité
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-serif text-[11.5px]">
                <div className="bg-white p-3 rounded border border-[#dde2f3]">
                  <span className="font-sans text-[10px] uppercase text-[#006d2f] font-bold block mb-1">
                    Mesures Palliatives DDL-PN (T3 2026) :
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#43474e]">
                    <li>Mutualisation ponctuelle des patrouilles pédestres par zone contiguë.</li>
                    <li>Numérisation différée des fiches manuelles sur poste central SAFM.</li>
                    <li>Priorisation stricte des consommables aux seuls actes exécutoires.</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border border-[#dde2f3]">
                  <span className="font-sans text-[10px] uppercase text-[#6d5e00] font-bold block mb-1">
                    Plaidoyer DGL Brazzaville &amp; Cabinet :
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#43474e]">
                    <li>Attribution en urgence d'une ligne d'équipement roulant 4x4 tout-terrain.</li>
                    <li>Acquisition d'un lot de 6 tablettes sécurisées pour le SI-Loisirs.</li>
                    <li>Dotation trimestrielle indexée pour le fonctionnement matériel SAFM.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Prévisualisation A4 Réglementaire (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-[#ffffff] p-3 rounded-xl shadow-sm border border-[#e8eeff]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#022448]">visibility</span>
              <span className="font-sans text-[11px] uppercase font-bold text-[#022448]">
                Prévisualisation A4 Réglementaire
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-[#e8eeff] px-2.5 py-0.5 rounded text-[#022448] font-sans text-[10px] font-bold">
                Format A4 (1:√2)
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1 rounded hover:bg-[#e8eeff] text-[#022448] transition-colors cursor-pointer"
                title="Imprimer ou Exporter PDF"
              >
                <span className="material-symbols-outlined text-base">print</span>
              </button>
            </div>
          </div>

          {/* SIMULATED A4 REPORT SHEET */}
          <div
            className="bg-white rounded-lg shadow-xl p-6 text-[#161c27] relative overflow-hidden text-left border border-[#dde2f3]"
            style={{ minHeight: '820px' }}
          >
            {/* Header Tricolor Line */}
            <div className="w-full h-1 bg-gradient-to-r from-[#006d2f] via-[#c4aa0f] to-[#ba1a1a] mb-4"></div>

            {/* Republic Two-Column Header */}
            <div className="grid grid-cols-2 gap-2 pb-3 mb-3 border-b border-[#dde2f3]">
              <div className="flex flex-col text-left font-sans text-[8.5px] leading-tight text-[#022448]">
                <span className="font-bold uppercase tracking-wider text-[9px]">RÉPUBLIQUE DU CONGO</span>
                <span className="italic text-[8px] text-[#43474e]">Unité • Travail • Progrès</span>
                <span className="text-[7.5px] mt-1 font-semibold uppercase">
                  MINISTÈRE DE LA CULTURE, DES ARTS, DU PATRIMOINE NATIONAL ET DE L'INDUSTRIE TOURISTIQUE
                </span>
                <span className="text-[7.5px] uppercase">DIRECTION GÉNÉRALE DES LOISIRS</span>
                <span className="text-[7.5px] font-bold uppercase text-[#006d2f]">
                  DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
                </span>
                <span className="text-[7.5px] font-bold text-[#6d5e00]">
                  SERVICE ADMINISTRATIF, FINANCIER ET DU MATÉRIEL (SAFM)
                </span>
              </div>

              <div className="flex flex-col text-right font-sans text-[8.5px] leading-tight text-[#43474e]">
                <span className="text-[#022448] font-bold text-[9px]">POINTE-NOIRE, LE 30 SEPTEMBRE 2026</span>
                <span className="text-[8px] mt-1 font-mono">N° 248 / MCAPNIT / DGL / DDL-PN / SAFM</span>
                <span className="text-[7.5px] uppercase mt-1 text-[#022448] font-bold">DESTINATAIRE :</span>
                <span className="text-[8px] font-semibold">Monsieur le Directeur Général des Loisirs</span>
                <span className="italic text-[8px]">Brazzaville (République du Congo)</span>
              </div>
            </div>

            {/* Solemn Title */}
            <div className="text-center my-3">
              <span className="font-sans text-[9px] uppercase tracking-widest text-[#006d2f] font-bold">
                RAPPORT D'ACTIVITÉS DU 3ÈME TRIMESTRE 2026
              </span>
              <h3 className="font-garamond text-[17px] uppercase text-[#022448] tracking-normal font-bold">
                BILAN D'EXÉCUTION DU PLAN DE TRAVAIL ANNUEL (PTA 2026)
              </h3>
              <p className="font-serif text-[10.5px] italic text-[#43474e]">
                Période sous revue : Du 1er Juillet au 30 Septembre 2026 — DDL Pointe-Noire
              </p>
            </div>

            {/* Chapters I to IX */}
            <div className="space-y-3 font-serif text-[11px] leading-relaxed text-[#161c27] mt-3 max-h-[580px] overflow-y-auto pr-1">
              {/* I */}
              <div>
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                  <span>I.</span> INTRODUCTION GÉNÉRALE
                </h4>
                <p className="text-justify text-[10.5px]">
                  En exécution des directives ministérielles et de la feuille de route départementale, le présent rapport trimestriel récapitule l'ensemble des actions menées par la Direction Départementale des Loisirs de Pointe-Noire (DDL-PN). Synthétisé sous l'égide du Service Administratif, Financier et du Matériel (SAFM), il apprécie le niveau d'atteinte des objectifs opérationnels pour le troisième trimestre de l'année 2026.
                </p>
              </div>

              {/* II */}
              <div>
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                  <span>II.</span> CADRE DE RÉFÉRENCE ET DE POLITIQUE PUBLIQUE
                </h4>
                <p className="text-justify text-[10.5px]">
                  L'action de la DDL-PN s'inscrit rigoureusement dans le <strong>Plan de Travail Annuel (PTA 2026)</strong> validé par la Direction Générale des Loisirs, le Décret régissant les attributions du MCAPNIT, ainsi que les délibérations relatives à l'assainissement moral et sécuritaire des structures de détente récréative dans le département de Pointe-Noire.
                </p>
              </div>

              {/* III */}
              <div>
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                  <span>III.</span> BILAN D'EXÉCUTION DES ACTIVITÉS DU PTA 2026
                </h4>
                <p className="text-justify text-[10.5px]">
                  Sur les actions programmées pour le compte du trimestre T3, le taux d'exécution physique s'établit à <strong>68.4%</strong>. Les jalons principaux concernent :
                </p>
                <ul className="list-disc list-inside space-y-0.5 mt-1 text-[#43474e] text-[10px]">
                  <li>Recensement de 128 espaces de loisirs (marchands et associatifs).</li>
                  <li>42 missions inopinées de contrôle de conformité et sécurité publique.</li>
                  <li>Instruction et homologation de 19 agréments d'exploitation économique.</li>
                </ul>
              </div>

              {/* IV */}
              <div>
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                  <span>IV.</span> ACTIVITÉS DILIGENTÉES HORS PTA
                </h4>
                <p className="text-justify text-[10.5px]">
                  Participation imprévue aux commissions mixtes de salubrité préfectorale de Pointe-Noire et régulation d'urgence d'une nuisance sonore récurrente dans l'arrondissement 3 Tié-Tié, ayant mobilisé les effectifs du SAA sur ordre direct de la tutelle.
                </p>
              </div>

              {/* V */}
              <div className="bg-[#f1f3ff] p-2 rounded border border-[#dde2f3]">
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#ba1a1a] flex items-center gap-1">
                  <span>V.</span> CONTRAINTES LOGISTIQUES ET MATÉRIELLES MAJEURES (SAFM)
                </h4>
                <p className="text-justify font-medium text-[10.5px]">
                  Le SAFM consigne de manière directe et sans réserve les entraves suivantes ayant directement pénalisé le rendement :
                </p>
                <ol className="list-decimal list-inside space-y-0.5 mt-1 text-[10px] text-[#161c27]">
                  <li><strong>Véhicule de service :</strong> Absence d'automobile roulante pour la couverture des secteurs extra-urbains (Tchiamba-Nzassi, confins de Loandjili).</li>
                  <li><strong>Motocyclettes :</strong> Déficit critique pour les inspecteurs de terrain du SAA.</li>
                  <li><strong>Tablettes informatiques :</strong> Carence d'outils numériques pour le renseignement dématérialisé in situ des constats.</li>
                  <li><strong>Consommables de bureau :</strong> Pénurie de papier 80g et toner pour l'édition et l'archivage légal au SAFM.</li>
                </ol>
              </div>

              {/* VI */}
              <div>
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                  <span>VI.</span> MESURES PALLIATIVES MISES EN OEUVRE LOCALEMENT
                </h4>
                <p className="text-justify text-[10.5px]">
                  Réorganisation des secteurs de contrôle sous forme de zonage groupé à pied ; recours temporaire au traitement sur poste fixe pour les dossiers urgents ; rationalisation drastique des tirages papier.
                </p>
              </div>

              {/* VII */}
              <div>
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                  <span>VII.</span> PERSPECTIVES POUR LE 4ÈME TRIMESTRE (T4 2026)
                </h4>
                <p className="text-justify text-[10.5px]">
                  Finalisation de l'annuaire statistique des loisirs 2026 ; campagnes renforcées de sécurisation des fêtes de fin d'année dans les établissements recevant du public récréatif ; bouclage budgétaire du PTA.
                </p>
              </div>

              {/* VIII */}
              <div>
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                  <span>VIII.</span> RECOMMANDATIONS À LA DIRECTION GÉNÉRALE &amp; AU CABINET
                </h4>
                <p className="text-justify text-[10.5px]">
                  Plaidoyer formel pour l'arbitrage budgétaire prioritaire d'un véhicule de tournée et de 4 motos de fonction, assorti de la mise à disposition de kits numériques de contrôle pour moderniser la collecte administrative de Pointe-Noire.
                </p>
              </div>

              {/* IX */}
              <div>
                <h4 className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                  <span>IX.</span> CONCLUSION
                </h4>
                <p className="text-justify text-[10.5px]">
                  Nonobstant les contraintes logistiques constatées par le SAFM, le personnel départemental demeure résolument engagé pour le rayonnement culturel et récréatif de Pointe-Noire et la pleine réalisation du PTA 2026.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-4 mt-4 border-t border-[#dde2f3] grid grid-cols-2 gap-4">
                <div className="flex flex-col text-left">
                  <span className="font-sans text-[9px] uppercase text-[#43474e]">Visa de l'Émetteur :</span>
                  <span className="font-bold text-[10px] text-[#022448]">Le Chef de Service SAFM</span>
                  <span className="font-serif text-[10px] italic mt-6 text-[#43474e]">[Timbre Humide &amp; Paraphe]</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-sans text-[9px] uppercase text-[#43474e]">Approbation d'Autorité :</span>
                  <span className="font-bold text-[10px] text-[#022448]">Le Directeur Départemental des Loisirs</span>
                  <span className="font-serif text-[10px] font-bold text-[#006d2f]">Jean Richard NTSEKE NGOUAKA</span>
                  <span className="font-serif text-[10px] italic mt-4 text-[#43474e]">[Signature et Sceau d'État]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#022448] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-[#8aa4cf]/30 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-[#006d2f] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">download_done</span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[11px] font-bold text-[#ffe251] uppercase">Consolidation SAFM Réussie</span>
            <span className="font-serif text-[12px]">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
