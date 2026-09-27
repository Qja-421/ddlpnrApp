import React from 'react';
import {
  RapportTrimestrielDirection,
  ServiceType,
  SERVICES_CONFIG,
  ObjectifAtteintStatus,
  ActiviteService,
} from '../lib/rapportTypes.ts';
import { ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';

interface RapportA4PrintProps {
  data: RapportTrimestrielDirection;
}

export const RapportA4Print: React.FC<RapportA4PrintProps> = ({ data }) => {
  // Calcul des statistiques récapitulatives par service
  const calculateServiceStats = (activites: ActiviteService[]) => {
    const total = activites.length;
    if (total === 0) return { total: 0, oui: 0, non: 0, partiel: 0, tauxMoyen: '0.0' };
    const oui = activites.filter((a) => a.objectifAtteint === 'OUI').length;
    const non = activites.filter((a) => a.objectifAtteint === 'NON').length;
    const partiel = activites.filter((a) => a.objectifAtteint === 'PARTIEL').length;
    const totalTaux = activites.reduce((sum, a) => sum + (Number(a.tauxRealisation) || 0), 0);
    return {
      total,
      oui,
      non,
      partiel,
      tauxMoyen: (totalTaux / total).toFixed(1),
    };
  };

  const statsSAF = calculateServiceStats(data.tableauxServices.SAF);
  const statsSAA = calculateServiceStats(data.tableauxServices.SAA);
  const statsStat = calculateServiceStats(data.tableauxServices.STATISTIQUES);
  const statsProm = calculateServiceStats(data.tableauxServices.PROMOTION);

  const allActivites = [
    ...data.tableauxServices.SAF,
    ...data.tableauxServices.SAA,
    ...data.tableauxServices.STATISTIQUES,
    ...data.tableauxServices.PROMOTION,
  ];
  const globalTotal = allActivites.length;
  const globalOui = allActivites.filter((a) => a.objectifAtteint === 'OUI').length;
  const globalTaux =
    globalTotal > 0
      ? (allActivites.reduce((sum, a) => sum + (Number(a.tauxRealisation) || 0), 0) / globalTotal).toFixed(1)
      : '0.0';

  const totalPersonnel = data.effectifs.reduce((acc, eff) => acc + eff.total, 0);
  const totalFonctionnaires = data.effectifs.reduce((acc, eff) => acc + eff.fonctionnaires, 0);
  const totalContractuels = data.effectifs.reduce((acc, eff) => acc + eff.contractuels, 0);
  const totalStagiaires = data.effectifs.reduce((acc, eff) => acc + eff.stagiaires, 0);

  // Rendu d'un tableau officiel pour un service donné (exactement selon le canevas DGL)
  const renderServiceTable = (
    serviceKey: ServiceType,
    numeroTableau: number,
    stats: ReturnType<typeof calculateServiceStats>
  ) => {
    const config = SERVICES_CONFIG[serviceKey];
    const activites = data.tableauxServices[serviceKey] || [];

    return (
      <div className="mb-6 avoid-break">
        {/* En-tête du tableau de service */}
        <div className="bg-[#022448] text-white px-3 py-2 flex items-center justify-between border border-[#022448]">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[10px] font-bold bg-white text-[#022448] px-1.5 py-0.5 rounded">
              TABLEAU {numeroTableau}
            </span>
            <span className="font-garamond text-[14px] font-bold uppercase tracking-wide">
              {config.label.toUpperCase()} ({config.code})
            </span>
          </div>
          <div className="text-[10px] font-sans flex items-center gap-3">
            <span>
              Objectifs : <strong>{stats.oui} atteints</strong> sur {stats.total}
            </span>
            <span className="bg-[#006d2f] text-white px-2 py-0.5 rounded font-bold">
              Taux : {stats.tauxMoyen}%
            </span>
          </div>
        </div>

        {/* Le tableau réglementaire à 7 colonnes de la Direction Générale */}
        <table className="w-full text-left font-serif text-[11px] border-collapse border border-[#022448]">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#022448] font-sans text-[9px] uppercase font-bold tracking-wider border-b border-[#022448]">
              <th className="p-2 border border-[#022448] w-[45px] text-center">N°</th>
              <th className="p-2 border border-[#022448] min-w-[160px]">Activités programmées au PTA</th>
              <th className="p-2 border border-[#022448] min-w-[130px]">Objectifs / Indicateurs</th>
              <th className="p-2 border border-[#022448] min-w-[130px]">Réalisations concrètes</th>
              <th className="p-2 border border-[#022448] text-center w-[95px] bg-[#e2e8f0]">
                Objectif atteint ?
              </th>
              <th className="p-2 border border-[#022448] text-center w-[60px]">Taux (%)</th>
              <th className="p-2 border border-[#022448] min-w-[150px]">Observations &amp; Motifs d'écart</th>
            </tr>
          </thead>
          <tbody>
            {activites.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-3 text-center text-[#64748b] italic border border-[#022448]">
                  Aucune activité programmée saisie pour ce service.
                </td>
              </tr>
            ) : (
              activites.map((act, idx) => (
                <tr key={act.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                  <td className="p-2 text-center font-mono font-bold text-[#022448] border border-[#022448]">
                    {act.code || `${idx + 1}`}
                  </td>
                  <td className="p-2 font-bold text-[#022448] border border-[#022448] leading-tight">
                    {act.activite}
                  </td>
                  <td className="p-2 text-[10.5px] border border-[#022448]">
                    <div>{act.objectifPta}</div>
                    {act.indicateurCible && (
                      <div className="text-[9.5px] text-[#006d2f] font-semibold mt-0.5">
                        Cible : {act.indicateurCible}
                      </div>
                    )}
                  </td>
                  <td className="p-2 font-semibold text-[#1e293b] border border-[#022448]">
                    {act.realisation}
                  </td>
                  <td className="p-2 text-center border border-[#022448] font-sans text-[10px] font-bold">
                    {act.objectifAtteint === 'OUI' && (
                      <span className="inline-block px-2 py-0.5 bg-[#006d2f] text-white rounded">
                        OUI (Atteint)
                      </span>
                    )}
                    {act.objectifAtteint === 'NON' && (
                      <span className="inline-block px-2 py-0.5 bg-[#ba1a1a] text-white rounded">
                        NON
                      </span>
                    )}
                    {act.objectifAtteint === 'PARTIEL' && (
                      <span className="inline-block px-2 py-0.5 bg-[#ca8a04] text-white rounded">
                        PARTIEL
                      </span>
                    )}
                    {act.objectifAtteint === 'EN_COURS' && (
                      <span className="inline-block px-2 py-0.5 bg-[#0284c7] text-white rounded">
                        EN COURS
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-center font-sans font-bold border border-[#022448]">
                    {act.tauxRealisation}%
                  </td>
                  <td className="p-2 text-[10px] text-[#475569] border border-[#022448] leading-snug">
                    {act.observations}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full bg-white text-[#161c27] font-serif text-[12px] leading-relaxed print:p-0">
      {/* ========================================================================= */}
      {/* PAGE 1 : PAGE DE GARDE SOLENNELLE OFFICIELLE (RÉPUBLIQUE DU CONGO) */}
      {/* ========================================================================= */}
      <section className="min-h-[1050px] p-10 flex flex-col justify-between border border-[#dde2f3] print:border-none relative bg-white page-break-after">
        {/* Bandeau tricolore républicain */}
        <div className="w-full h-2.5 bg-gradient-to-r from-[#006d2f] via-[#c4aa0f] to-[#ba1a1a] rounded-sm mb-6"></div>

        {/* En-tête bicéphale officiel */}
        <div className="grid grid-cols-2 gap-4 pb-6 border-b border-[#022448]/20">
          <div className="flex flex-col text-left font-sans text-[10px] leading-snug text-[#022448]">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#006d2f]">
              RÉPUBLIQUE DU CONGO
            </span>
            <span className="italic text-[9.5px] text-[#43474e] font-serif mb-1">
              Unité • Travail • Progrès
            </span>
            <span className="text-[9px] font-bold uppercase text-[#022448]">
              MINISTÈRE DE L'INDUSTRIE CULTURELLE, TOURISTIQUE, ARTISTIQUE ET DES LOISIRS
            </span>
            <span className="text-[8.5px] uppercase text-[#43474e] font-semibold">
              DIRECTION GÉNÉRALE DES LOISIRS
            </span>
            <span className="text-[9.5px] font-extrabold uppercase text-[#022448] mt-0.5">
              DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
            </span>
            <div className="text-[8px] text-[#43474e] mt-1 space-y-0.5 font-semibold">
              <div>• Service Administratif et Financier (SAF)</div>
              <div>• Service Autorisation et Animation (SAA)</div>
              <div>• Service Statistiques</div>
              <div>• Service Promotion</div>
            </div>
          </div>

          <div className="flex flex-col items-end text-right font-sans text-[10px]">
            <div className="flex items-center gap-3 mb-2">
              <ArmoiriesCongo size={56} />
              <LogoDDLPN size={54} />
            </div>
            <span className="font-mono text-[10px] font-bold text-[#022448] bg-[#f1f3ff] px-2.5 py-1 rounded border border-[#dde2f3]">
              RÉF : {data.referenceNumero}
            </span>
            <span className="text-[9px] text-[#43474e] mt-1 font-serif">
              {data.lieuSignature}, {data.dateSignature}
            </span>
          </div>
        </div>

        {/* Corps de la page de garde */}
        <div className="my-auto py-8 flex flex-col items-center text-center">
          <div className="w-24 h-1 bg-[#006d2f] mb-5"></div>

          <span className="font-sans text-[12px] uppercase font-bold tracking-[0.25em] text-[#006d2f] mb-3">
            DOCUMENT ADMINISTRATIF OFFICIEL D'AUTORITÉ
          </span>

          <h1 className="font-garamond text-[32px] sm:text-[36px] font-extrabold uppercase tracking-wide text-[#022448] leading-tight max-w-3xl px-6 py-3 border-y-2 border-[#022448]">
            RAPPORT D'ACTIVITÉS DU {data.trimestre.toUpperCase()} {data.annee}
          </h1>

          <p className="font-serif italic text-[13.5px] text-[#43474e] mt-4 max-w-2xl leading-relaxed">
            « Exécution du Plan de Travail Annuel (PTA) par les quatre services (SAF, SAA,
            Statistiques, Promotion) et encadrement départemental des loisirs »
          </p>

          <div className="mt-4 px-4 py-1.5 bg-[#f1f3ff] rounded-full border border-[#dde2f3] font-sans text-[11px] font-bold text-[#022448]">
            Période sous revue : {data.periodeMois}
          </div>

          {/* Cadre des destinataires */}
          <div className="mt-8 w-full max-w-xl bg-[#f8fafc] border-2 border-[#022448]/30 rounded-lg p-5 text-left font-serif shadow-sm">
            <span className="font-sans text-[10.5px] uppercase font-extrabold text-[#006d2f] tracking-wider block mb-2.5">
              DESTINATAIRES OFFICIELS STATUTAIRES :
            </span>
            <div className="flex flex-col gap-2 font-bold text-[#022448] text-[13px]">
              <div className="flex items-start gap-2">
                <span className="text-[#006d2f] font-mono text-[14px]">►</span>
                <span>{data.destinataires.directeurGeneral}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#006d2f] font-mono text-[14px]">►</span>
                <span>{data.destinataires.prefet}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de Page de Garde */}
        <div className="pt-6 border-t border-[#022448]/20 grid grid-cols-2 gap-8 text-[11px]">
          <div className="text-left font-sans">
            <span className="text-[9.5px] uppercase text-[#43474e] font-semibold block">Rédigé et présenté par :</span>
            <span className="font-bold text-[#022448] text-[12px] block">{data.signataires.rapporteurNom}</span>
            <span className="text-[10px] text-[#43474e] italic font-serif">{data.signataires.rapporteurTitre}</span>
          </div>

          <div className="text-right font-sans">
            <span className="text-[9.5px] uppercase text-[#43474e] font-semibold block">Visé et transmis par :</span>
            <span className="font-bold text-[#022448] text-[12px] block">{data.signataires.directeurNom}</span>
            <span className="text-[10px] text-[#43474e] italic font-serif">{data.signataires.directeurTitre}</span>
          </div>
        </div>

        {/* Liseré tricolore national inférieur */}
        <div className="w-full h-1.5 bg-gradient-to-r from-[#006d2f] via-[#c4aa0f] to-[#ba1a1a] rounded-sm mt-6"></div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 2 : INTRODUCTION GÉNÉRALE & EFFECTIFS DU PERSONNEL (4 SERVICES) */}
      {/* ========================================================================= */}
      <section className="min-h-[1050px] p-10 flex flex-col justify-between border border-[#dde2f3] print:border-none relative bg-white mt-8 print:mt-0 page-break-after">
        <div>
          {/* Fil conducteur */}
          <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3] text-[9.5px] font-sans text-[#43474e] mb-6">
            <span className="uppercase font-bold text-[#006d2f]">
              DDL-PN • Rapport d'Activités du {data.trimestre} {data.annee}
            </span>
            <span className="font-serif italic">Direction Générale des Loisirs &amp; Cabinet du Préfet</span>
            <span className="font-bold text-[#022448]">Page 2</span>
          </div>

          {/* Sommaire analytique officiel */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-lg mb-6 avoid-break">
            <h2 className="font-sans text-[11px] uppercase font-bold text-[#022448] tracking-wider mb-2 pb-1 border-b border-[#cbd5e1]">
              SOMMAIRE OFFICIEL DU CANEVAS DGL
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-4 text-[11px] font-sans text-[#334155]">
              <div><strong>I.</strong> Introduction générale &amp; Contexte départemental</div>
              <div><strong>IV.</strong> Tableau 3 : Service Statistiques</div>
              <div><strong>II.</strong> Situation du personnel (Direction &amp; 4 Services)</div>
              <div><strong>V.</strong> Tableau 4 : Service Promotion</div>
              <div><strong>III.</strong> Tableau 1 : Service Administratif et Financier (SAF)</div>
              <div><strong>VI.</strong> Activités hors programmation (Ad-hoc)</div>
              <div><strong>IV.</strong> Tableau 2 : Service Autorisation et Animation (SAA)</div>
              <div><strong>VII.</strong> Difficultés, Perspectives &amp; Recommandations</div>
            </div>
          </div>

          {/* SECTION I : INTRODUCTION */}
          <div className="mb-6 avoid-break">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#006d2f]"></span>
              <h2 className="font-garamond text-[17px] font-bold uppercase text-[#022448] tracking-wide">
                I. INTRODUCTION GÉNÉRALE &amp; CONTEXTE DÉPARTEMENTAL
              </h2>
            </div>
            <p className="text-[12px] text-justify leading-relaxed font-serif text-[#1e293b] mb-3 indent-6">
              {data.introduction}
            </p>
            <p className="text-[12px] text-justify leading-relaxed font-serif text-[#1e293b] indent-6">
              {data.contexteDepartemental}
            </p>
          </div>

          {/* SECTION II : RESSOURCES HUMAINES DES 4 SERVICES */}
          <div className="avoid-break">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006d2f]"></span>
                <h2 className="font-garamond text-[17px] font-bold uppercase text-[#022448] tracking-wide">
                  II. SITUATION DU PERSONNEL (DIRECTION &amp; 4 SERVICES)
                </h2>
              </div>
              <span className="font-sans text-[10.5px] font-bold bg-[#e8eeff] text-[#022448] px-2.5 py-0.5 rounded">
                Total : {totalPersonnel} Agents
              </span>
            </div>

            <p className="text-[11.5px] font-serif text-[#334155] mb-3">
              {data.effectifsSynthese}
            </p>

            {/* Tableau des effectifs */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-serif text-[11px] border-collapse border border-[#022448]">
                <thead>
                  <tr className="bg-[#022448] text-white font-sans text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-2 border border-[#022448]">Service / Entité</th>
                    <th className="p-2 text-center border border-[#022448]">Fonctionnaires</th>
                    <th className="p-2 text-center border border-[#022448]">Contractuels</th>
                    <th className="p-2 text-center border border-[#022448]">Stagiaires</th>
                    <th className="p-2 text-center border border-[#022448] bg-[#1e3a5f]">Total</th>
                    <th className="p-2 border border-[#022448]">Missions &amp; Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#022448]/30">
                  {data.effectifs.map((eff) => (
                    <tr key={eff.serviceKey} className="hover:bg-[#f8fafc]">
                      <td className="p-2 font-bold text-[#022448] border border-[#022448]">
                        {eff.serviceNom}
                      </td>
                      <td className="p-2 text-center border border-[#022448]">{eff.fonctionnaires}</td>
                      <td className="p-2 text-center border border-[#022448]">{eff.contractuels}</td>
                      <td className="p-2 text-center border border-[#022448]">{eff.stagiaires}</td>
                      <td className="p-2 text-center font-bold text-[#006d2f] bg-[#f1f3ff] border border-[#022448]">
                        {eff.total}
                      </td>
                      <td className="p-2 text-[10.5px] text-[#475569] border border-[#022448]">{eff.observations}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#f1f5f9] font-bold font-sans text-[10.5px] text-[#022448]">
                    <td className="p-2 border border-[#022448] uppercase">TOTAL DÉPARTEMENTAL POINTE-NOIRE</td>
                    <td className="p-2 text-center border border-[#022448]">{totalFonctionnaires}</td>
                    <td className="p-2 text-center border border-[#022448]">{totalContractuels}</td>
                    <td className="p-2 text-center border border-[#022448]">{totalStagiaires}</td>
                    <td className="p-2 text-center bg-[#022448] text-white border border-[#022448]">
                      {totalPersonnel}
                    </td>
                    <td className="p-2 text-[10px] text-[#006d2f] border border-[#022448]">
                      Répartition équilibrée selon les priorités du terrain
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="pt-3 border-t border-[#dde2f3] flex items-center justify-between text-[9px] font-sans text-[#64748b]">
          <span>République du Congo • Unité - Travail - Progrès</span>
          <span>Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)</span>
          <span>Page 2</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 3 : TABLEAU 1 (SAF) & TABLEAU 2 (SAA) */}
      {/* ========================================================================= */}
      <section className="min-h-[1050px] p-10 flex flex-col justify-between border border-[#dde2f3] print:border-none relative bg-white mt-8 print:mt-0 page-break-after">
        <div>
          {/* Fil conducteur */}
          <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3] text-[9.5px] font-sans text-[#43474e] mb-4">
            <span className="uppercase font-bold text-[#006d2f]">
              DDL-PN • Rapport d'Activités du {data.trimestre} {data.annee}
            </span>
            <span className="font-serif italic">Tableaux Officiels SAF &amp; SAA</span>
            <span className="font-bold text-[#022448]">Page 3</span>
          </div>

          <div className="mb-4">
            <h2 className="font-garamond text-[18px] font-bold uppercase text-[#022448] tracking-wide mb-1">
              III. ÉTAT D'EXÉCUTION DU PTA : SAF &amp; SAA
            </h2>
            <p className="text-[11.5px] font-serif text-[#334155]">
              Contrôle précis de l'atteinte ou non des objectifs assignés dans le Plan de Travail Annuel.
            </p>
          </div>

          {/* TABLEAU 1 : SAF */}
          {renderServiceTable('SAF', 1, statsSAF)}

          {/* TABLEAU 2 : SAA */}
          {renderServiceTable('SAA', 2, statsSAA)}
        </div>

        {/* Pied de page */}
        <div className="pt-3 border-t border-[#dde2f3] flex items-center justify-between text-[9px] font-sans text-[#64748b]">
          <span>République du Congo • Unité - Travail - Progrès</span>
          <span>Tableaux 1 &amp; 2 : SAF &amp; SAA</span>
          <span>Page 3</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 4 : TABLEAU 3 (STATISTIQUES) & TABLEAU 4 (PROMOTION) */}
      {/* ========================================================================= */}
      <section className="min-h-[1050px] p-10 flex flex-col justify-between border border-[#dde2f3] print:border-none relative bg-white mt-8 print:mt-0 page-break-after">
        <div>
          {/* Fil conducteur */}
          <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3] text-[9.5px] font-sans text-[#43474e] mb-4">
            <span className="uppercase font-bold text-[#006d2f]">
              DDL-PN • Rapport d'Activités du {data.trimestre} {data.annee}
            </span>
            <span className="font-serif italic">Tableaux Officiels Statistiques &amp; Promotion</span>
            <span className="font-bold text-[#022448]">Page 4</span>
          </div>

          <div className="mb-4">
            <h2 className="font-garamond text-[18px] font-bold uppercase text-[#022448] tracking-wide mb-1">
              IV. ÉTAT D'EXÉCUTION DU PTA : STATISTIQUES &amp; PROMOTION
            </h2>
            <p className="text-[11.5px] font-serif text-[#334155]">
              Suivi des indicateurs statistiques et de la politique de vulgarisation du loisir sain.
            </p>
          </div>

          {/* TABLEAU 3 : STATISTIQUES */}
          {renderServiceTable('STATISTIQUES', 3, statsStat)}

          {/* TABLEAU 4 : PROMOTION */}
          {renderServiceTable('PROMOTION', 4, statsProm)}
        </div>

        {/* Pied de page */}
        <div className="pt-3 border-t border-[#dde2f3] flex items-center justify-between text-[9px] font-sans text-[#64748b]">
          <span>République du Congo • Unité - Travail - Progrès</span>
          <span>Tableaux 3 &amp; 4 : Statistiques &amp; Promotion</span>
          <span>Page 4</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 5 : ACTIVITÉS AD-HOC & DIFFICULTÉS AYANT ENTRAVÉ LE PTA */}
      {/* ========================================================================= */}
      <section className="min-h-[1050px] p-10 flex flex-col justify-between border border-[#dde2f3] print:border-none relative bg-white mt-8 print:mt-0 page-break-after">
        <div>
          {/* Fil conducteur */}
          <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3] text-[9.5px] font-sans text-[#43474e] mb-4">
            <span className="uppercase font-bold text-[#006d2f]">
              DDL-PN • Rapport d'Activités du {data.trimestre} {data.annee}
            </span>
            <span className="font-serif italic">Activités Ad-hoc &amp; Difficultés Majeures</span>
            <span className="font-bold text-[#022448]">Page 5</span>
          </div>

          {/* SECTION V : ACTIVITÉS AD-HOC */}
          <div className="mb-6 avoid-break">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#006d2f]"></span>
              <h2 className="font-garamond text-[17px] font-bold uppercase text-[#022448] tracking-wide">
                V. ACTIVITÉS RÉALISÉES HORS PROGRAMMATION (AD-HOC)
              </h2>
            </div>

            <table className="w-full text-left font-serif text-[11px] border-collapse border border-[#022448]">
              <thead>
                <tr className="bg-[#1e3a5f] text-white font-sans text-[9px] uppercase font-bold tracking-wider">
                  <th className="p-2 border border-[#022448] w-[45px] text-center">N°</th>
                  <th className="p-2 border border-[#022448] min-w-[170px]">Activité Ponctuelle</th>
                  <th className="p-2 border border-[#022448] w-[70px] text-center">Service</th>
                  <th className="p-2 border border-[#022448] w-[110px]">Date &amp; Lieu</th>
                  <th className="p-2 border border-[#022448] min-w-[140px]">Contexte / Opportunité</th>
                  <th className="p-2 border border-[#022448] min-w-[140px]">Résultats Obtenus</th>
                  <th className="p-2 border border-[#022448] min-w-[120px]">Observations</th>
                </tr>
              </thead>
              <tbody>
                {data.activitesHorsProgrammation.map((adhoc, i) => (
                  <tr key={adhoc.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                    <td className="p-2 font-mono font-bold text-center text-[#022448] border border-[#022448]">
                      {adhoc.code}
                    </td>
                    <td className="p-2 font-bold text-[#022448] border border-[#022448]">{adhoc.titre}</td>
                    <td className="p-2 font-sans font-bold text-center text-[#006d2f] border border-[#022448]">
                      {adhoc.serviceResponsable}
                    </td>
                    <td className="p-2 text-[10px] border border-[#022448]">
                      <div>{adhoc.datePeriode}</div>
                      <div className="italic text-[#475569]">{adhoc.lieu}</div>
                    </td>
                    <td className="p-2 text-[10.5px] text-[#334155] border border-[#022448]">{adhoc.contexte}</td>
                    <td className="p-2 text-[10.5px] text-[#006d2f] font-semibold border border-[#022448]">
                      {adhoc.resultats}
                    </td>
                    <td className="p-2 text-[10px] text-[#475569] border border-[#022448]">{adhoc.observations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION VI : DIFFICULTÉS ET CONTRAINTES */}
          <div className="avoid-break">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              <h2 className="font-garamond text-[17px] font-bold uppercase text-[#ba1a1a] tracking-wide">
                VI. DIFFICULTÉS AYANT EMPÊCHÉ L'ATTEINTE DE CERTAINS OBJECTIFS
              </h2>
            </div>
            <p className="text-[11.5px] font-serif text-[#334155] mb-3">
              Les contraintes ci-après ont directement entravé les missions des services et justifient les
              écarts constatés au regard du PTA :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.difficultes.map((diff) => (
                <div
                  key={diff.id}
                  className="bg-[#fef2f2] border-l-4 border-[#ba1a1a] border-y border-r border-[#fecaca] p-3 rounded-r flex flex-col justify-between"
                >
                  <div>
                    <span className="font-sans text-[9px] uppercase font-bold text-[#ba1a1a] bg-[#fee2e2] px-1.5 py-0.5 rounded inline-block mb-1">
                      Service Concerné : {diff.service}
                    </span>
                    <h4 className="font-bold text-[#022448] text-[11.5px] mb-1">{diff.titre}</h4>
                    <p className="text-[10.5px] text-[#334155] leading-snug mb-1">{diff.description}</p>
                    <div className="text-[10px] text-[#991b1b] font-semibold mb-1">
                      <strong>Impact direct sur le PTA :</strong> {diff.impactPta}
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-[#fca5a5] text-[10px] text-[#475569]">
                    <span className="font-bold text-[#022448]">Attente auprès de la tutelle :</span>{' '}
                    {diff.attenteHierarchie}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="pt-3 border-t border-[#dde2f3] flex items-center justify-between text-[9px] font-sans text-[#64748b]">
          <span>République du Congo • Unité - Travail - Progrès</span>
          <span>Difficultés d'Exécution du PTA</span>
          <span>Page 5</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 6 : PERSPECTIVES, RECOMMANDATIONS, CONCLUSION & SIGNATURES */}
      {/* ========================================================================= */}
      <section className="min-h-[1050px] p-10 flex flex-col justify-between border border-[#dde2f3] print:border-none relative bg-white mt-8 print:mt-0">
        <div>
          {/* Fil conducteur */}
          <div className="flex items-center justify-between pb-3 border-b border-[#dde2f3] text-[9.5px] font-sans text-[#43474e] mb-4">
            <span className="uppercase font-bold text-[#006d2f]">
              DDL-PN • Rapport d'Activités du {data.trimestre} {data.annee}
            </span>
            <span className="font-serif italic">Perspectives, Recommandations &amp; Signatures</span>
            <span className="font-bold text-[#022448]">Page 6</span>
          </div>

          {/* Synthèse générale */}
          <div className="mb-4 p-3 bg-[#f1f3ff] rounded-lg border border-[#dde2f3] flex items-center justify-between font-sans avoid-break">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#43474e] block">
                SYNTHÈSE GÉNÉRALE DES QUATRE SERVICES :
              </span>
              <span className="font-garamond text-[16px] font-bold text-[#022448]">
                {globalTotal} activités programmées • {globalOui} objectifs pleinement atteints •{' '}
                {allActivites.filter((a) => a.objectifAtteint === 'PARTIEL').length} partiels
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#43474e] block">Taux Global d'Atteinte :</span>
              <span className="text-[16px] font-extrabold text-[#006d2f]">{globalTaux}%</span>
            </div>
          </div>

          {/* SECTION VII : PERSPECTIVES */}
          <div className="mb-5 avoid-break">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#006d2f]"></span>
              <h2 className="font-garamond text-[17px] font-bold uppercase text-[#022448] tracking-wide">
                VII. PERSPECTIVES POUR LE PROCHAIN TRIMESTRE
              </h2>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-[11.5px] text-[#334155] bg-[#f8fafc] p-3 rounded border border-[#e2e8f0]">
              {data.perspectives.map((persp, idx) => (
                <li key={idx} className="leading-snug">
                  {persp}
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION VIII : RECOMMANDATIONS */}
          <div className="mb-5 avoid-break">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#006d2f]"></span>
              <h2 className="font-garamond text-[17px] font-bold uppercase text-[#022448] tracking-wide">
                VIII. RECOMMANDATIONS &amp; SOLLICITATIONS D'AUTORITÉ
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-3 rounded">
                <h4 className="font-sans text-[11px] font-extrabold uppercase text-[#166534] mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">domain</span>
                  À l'attention de la Direction Générale :
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-[#14532d]">
                  {data.recommandationsDGL.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#f8fafc] border border-[#cbd5e1] p-3 rounded">
                <h4 className="font-sans text-[11px] font-extrabold uppercase text-[#0f172a] mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  À l'attention du Cabinet de M. le Préfet :
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-[#334155]">
                  {data.recommandationsPrefet.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION IX : CONCLUSION */}
          <div className="mb-5 avoid-break">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#022448]"></span>
              <h2 className="font-garamond text-[17px] font-bold uppercase text-[#022448] tracking-wide">
                IX. CONCLUSION GÉNÉRALE
              </h2>
            </div>
            <p className="text-[12px] text-justify leading-relaxed font-serif text-[#1e293b] indent-6 bg-[#f8fafc] p-3 rounded border border-[#e2e8f0]">
              {data.conclusion}
            </p>
          </div>
        </div>

        {/* BLOC DE SIGNATURES OFFICIELLES & AMPLIATIONS */}
        <div className="avoid-break">
          <div className="text-right text-[11px] font-sans font-bold text-[#022448] mb-3">
            Fait à {data.lieuSignature}, le {data.dateSignature}
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-[#022448]/30">
            {/* Signature Rapporteur */}
            <div className="flex flex-col items-center text-center font-sans">
              <span className="text-[10px] uppercase font-bold text-[#43474e] mb-1">
                Le Chef de Service SAA (Rapporteur)
              </span>
              <div className="h-16 flex items-center justify-center">
                <span className="font-serif italic text-[11px] text-[#006d2f] border-b border-dashed border-[#006d2f] px-4 py-1">
                  [Signature &amp; Paraphe SAA]
                </span>
              </div>
              <span className="font-bold text-[#022448] text-[12px]">{data.signataires.rapporteurNom}</span>
              <span className="text-[10px] text-[#43474e]">{data.signataires.rapporteurTitre}</span>
            </div>

            {/* Signature & Cachet Directeur Départemental */}
            <div className="flex flex-col items-center text-center font-sans relative">
              <span className="text-[10px] uppercase font-bold text-[#022448] mb-1">
                Vu et Transmis avec Avis Favorable :
              </span>
              <span className="text-[9.5px] uppercase font-semibold text-[#43474e]">
                Le Directeur Départemental des Loisirs
              </span>
              <div className="h-16 flex items-center justify-center relative">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#022448]/40 flex items-center justify-center text-[7.5px] text-[#022448] font-bold uppercase rotate-[-8deg] p-1 text-center bg-[#f1f3ff]/40">
                  RÉPUBLIQUE DU CONGO • DDL-PN
                </div>
              </div>
              <span className="font-bold text-[#022448] text-[12px]">{data.signataires.directeurNom}</span>
              <span className="text-[10px] text-[#43474e]">{data.signataires.directeurTitre}</span>
            </div>
          </div>

          {/* AMPLIATIONS */}
          <div className="mt-5 pt-3 border-t border-[#dde2f3] text-[9.5px] font-sans text-[#64748b] flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold uppercase text-[#022448]">Ampliations Officielles :</span>{' '}
              DGL Brazzaville (1) • Cabinet du Préfet de Pointe-Noire (1) • SAF (1) • SAA (1) • Statistiques (1) • Promotion (1) • Archives / Chrono (1)
            </div>
            <div className="font-mono text-[#006d2f] font-bold">
              CONFORME AU CANEVAS OFFICIEL TRANSMIS PAR LA DIRECTION GÉNÉRALE
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
