import React, { useState, useMemo } from 'react';
import { RepublicSeal } from './RepublicSeal.tsx';
import { FieldEstablishment, AgentAccount } from '../lib/supabase.ts';

export interface EtatVersementTresorProps {
  establishments: FieldEstablishment[];
  agents: AgentAccount[];
  onClose?: () => void;
}

export const EtatVersementTresor: React.FC<EtatVersementTresorProps> = ({
  establishments,
  agents,
  onClose,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'jour' | 'semaine' | 'mois' | 'tout'>('mois');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('TOUS');

  // Flatten all payment history entries
  const allPayments = useMemo(() => {
    const list: {
      id: string;
      receiptRef: string;
      estId: string;
      estName: string;
      promoter: string;
      district: string;
      sector: 'formal' | 'informal';
      amount: number;
      location: 'TERRAIN' | 'DIRECTION';
      collectedBy: string;
      date: string;
      paymentMethod: string;
    }[] = [];

    establishments.forEach((est) => {
      (est.paymentHistory || []).forEach((p) => {
        list.push({
          id: p.id,
          receiptRef: p.receiptRef || p.id,
          estId: est.id,
          estName: est.name,
          promoter: est.promoter,
          district: est.district,
          sector: est.sector,
          amount: p.amount,
          location: p.location,
          collectedBy: p.collectedBy || 'Agent SAA DDL-PN',
          date: p.date,
          paymentMethod: 'Espèces (Caisse Régie)',
        });
      });
    });

    return list;
  }, [establishments]);

  // Aggregate by Agent
  const agentAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        agentName: string;
        badge: string;
        totalAmount: number;
        terrainAmount: number;
        directionAmount: number;
        receiptCount: number;
        establishmentsList: Set<string>;
      }
    >();

    // Initialize with known agents
    agents.forEach((ag) => {
      map.set(ag.name, {
        agentName: ag.name,
        badge: ag.badgeNumber,
        totalAmount: 0,
        terrainAmount: 0,
        directionAmount: 0,
        receiptCount: 0,
        establishmentsList: new Set(),
      });
    });

    // Populate from payments
    allPayments.forEach((p) => {
      // Find matching agent
      let targetKey = Array.from(map.keys()).find((k) => p.collectedBy.includes(k) || k.includes(p.collectedBy));
      if (!targetKey) {
        targetKey = p.collectedBy;
        if (!map.has(targetKey)) {
          map.set(targetKey, {
            agentName: targetKey,
            badge: 'SAA-PN-REGIE',
            totalAmount: 0,
            terrainAmount: 0,
            directionAmount: 0,
            receiptCount: 0,
            establishmentsList: new Set(),
          });
        }
      }

      const rec = map.get(targetKey)!;
      rec.totalAmount += p.amount;
      if (p.location === 'TERRAIN') {
        rec.terrainAmount += p.amount;
      } else {
        rec.directionAmount += p.amount;
      }
      rec.receiptCount += 1;
      rec.establishmentsList.add(p.estName);
    });

    return Array.from(map.values()).filter((a) => a.totalAmount > 0 || agents.some((ag) => ag.name === a.agentName));
  }, [allPayments, agents]);

  // Global totals
  const totals = useMemo(() => {
    const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const terrainTotal = allPayments.filter((p) => p.location === 'TERRAIN').reduce((sum, p) => sum + p.amount, 0);
    const directionTotal = allPayments.filter((p) => p.location === 'DIRECTION').reduce((sum, p) => sum + p.amount, 0);
    const receiptsCount = allPayments.length;
    return { totalCollected, terrainTotal, directionTotal, receiptsCount };
  }, [allPayments]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Référence Reçu',
      'Date & Heure',
      'Établissement',
      'Promoteur',
      'Secteur',
      'Arrondissement',
      'Montant (FCFA)',
      'Lieu Perception',
      'Agent Encaisseur',
      'Mode de Paiement',
    ];

    const rows = allPayments.map((p) => [
      `"${p.receiptRef}"`,
      `"${p.date}"`,
      `"${p.estName.replace(/"/g, '""')}"`,
      `"${p.promoter.replace(/"/g, '""')}"`,
      `"${p.sector === 'formal' ? 'Formel' : 'Informel'}"`,
      `"${p.district.replace(/"/g, '""')}"`,
      p.amount,
      `"${p.location === 'TERRAIN' ? 'Terrain Mobile' : 'Guichet Direction'}"`,
      `"${p.collectedBy.replace(/"/g, '""')}"`,
      `"${p.paymentMethod}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DDL_PN_Etat_Versement_Tresor_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#dde2f3] p-6 space-y-6 text-[#161c27]">
      {/* Official Header */}
      <div className="border-b border-[#dde2f3] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#f1f3ff] p-1 flex items-center justify-center shrink-0 border border-[#c4c7d4]">
            <RepublicSeal size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[10px] uppercase font-bold text-[#006d2f] bg-[#dcfce7] px-2.5 py-0.5 rounded">
                Bordereau Financier Régalien • Trésor Public
              </span>
              <span className="font-sans text-[10px] uppercase font-bold text-[#747783] bg-gray-100 px-2.5 py-0.5 rounded">
                Régie DDL-PN
              </span>
            </div>
            <h2 className="font-garamond text-2xl sm:text-3xl font-bold text-[#022448] mt-1">
              État Récapitulatif des Versements au Trésor Public
            </h2>
            <p className="font-serif italic text-xs text-[#43474e]">
              Rapprochement contradictoire des perceptions sur le terrain (Agents SAA) et au guichet central pour reversement légal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg font-sans text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">table_view</span>
            <span>Exporter en Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-[#022448] hover:bg-[#142943] text-white rounded-lg font-sans text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimer Bordereau PDF</span>
          </button>
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
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#f0f9ff] p-4 rounded-xl border border-[#bae6fd]">
          <span className="font-sans text-[10px] uppercase font-bold text-[#0369a1] block">
            Total Perçu Global
          </span>
          <div className="font-mono text-2xl font-bold text-[#022448] mt-1">
            {totals.totalCollected.toLocaleString('fr-FR')} FCFA
          </div>
          <span className="text-[11px] text-[#0369a1] font-semibold block mt-0.5">
            {totals.receiptsCount} quittances de perception enregistrées
          </span>
        </div>

        <div className="bg-[#f0fdf4] p-4 rounded-xl border border-[#bbf7d0]">
          <span className="font-sans text-[10px] uppercase font-bold text-[#15803d] block">
            Perceptions Mobiles Terrain (Agents SAA)
          </span>
          <div className="font-mono text-2xl font-bold text-[#006d2f] mt-1">
            {totals.terrainTotal.toLocaleString('fr-FR')} FCFA
          </div>
          <span className="text-[11px] text-[#15803d] font-semibold block mt-0.5">
            Cash collecté sur place avec reçu immédiat
          </span>
        </div>

        <div className="bg-[#f5f3ff] p-4 rounded-xl border border-[#ddd6fe]">
          <span className="font-sans text-[10px] uppercase font-bold text-[#6d28d9] block">
            Perceptions Guichet Central Direction
          </span>
          <div className="font-mono text-2xl font-bold text-[#5b21b6] mt-1">
            {totals.directionTotal.toLocaleString('fr-FR')} FCFA
          </div>
          <span className="text-[11px] text-[#6d28d9] font-semibold block mt-0.5">
            Régularisations spontanées ou sous convocation
          </span>
        </div>

        <div className="bg-[#fff7ed] p-4 rounded-xl border border-[#fed7aa]">
          <span className="font-sans text-[10px] uppercase font-bold text-[#c2410c] block">
            Modes de Paiement Enregistrés
          </span>
          <div className="font-sans text-sm font-bold text-[#9a3412] mt-1">
            Espèces (100% en vigueur)
          </div>
          <span className="text-[10px] text-[#c2410c] block mt-0.5">
            Provisions techniques prêtes pour Airtel Money &amp; MTN MoMo
          </span>
        </div>
      </div>

      {/* RÈGLE LÉGALE DE RÉPARTITION : 50% TRÉSOR PUBLIC / 50% ADMINISTRATION DES LOISIRS */}
      <div className="p-4 bg-gradient-to-r from-[#f0fdf4] via-[#f8faff] to-[#f0f9ff] rounded-xl border border-[#bbf7d0] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#dde2f3]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#006d2f] text-[22px]">account_balance</span>
            <div>
              <div className="font-sans text-[10px] uppercase font-bold text-[#006d2f] tracking-wider">
                Cadre Régalien &bull; Ordre de Service N° 028/MCAPNIT/DGL/DDL-PN
              </div>
              <h3 className="font-garamond text-base font-bold text-[#022448]">
                Clé de Répartition Légale des Recettes : 50% Trésor Public &bull; 50% Administration des Loisirs
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-sans font-bold bg-[#006d2f] text-white px-2.5 py-1 rounded">
            Reversement Contradictoire Obligatoire
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="p-3 bg-white rounded-lg border border-[#bae6fd] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase text-[#0369a1] block">
                Quote-Part Trésor Public (50%)
              </span>
              <span className="text-[11px] font-sans text-[#747783] block">
                Versements directs au compte du Trésorier Payeur Général
              </span>
            </div>
            <div className="font-mono text-xl font-bold text-[#0284c7]">
              {Math.round(totals.totalCollected * 0.5).toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-[#bbf7d0] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase text-[#15803d] block">
                Quote-Part Régie Administration des Loisirs (50%)
              </span>
              <span className="text-[11px] font-sans text-[#747783] block">
                Frais d'investigation de commodo &amp; fonctionnement brigade SAA
              </span>
            </div>
            <div className="font-mono text-xl font-bold text-[#006d2f]">
              {(totals.totalCollected - Math.round(totals.totalCollected * 0.5)).toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>
      </div>

      {/* Period & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8faff] p-3 rounded-xl border border-[#dde2f3] text-xs font-sans">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#43474e]">Période de Rapprochement :</span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#c4c7d4]">
            <button
              type="button"
              onClick={() => setSelectedPeriod('jour')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                selectedPeriod === 'jour' ? 'bg-[#022448] text-white' : 'text-[#43474e] hover:bg-gray-100'
              }`}
            >
              Jour
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('semaine')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                selectedPeriod === 'semaine' ? 'bg-[#022448] text-white' : 'text-[#43474e] hover:bg-gray-100'
              }`}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('mois')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                selectedPeriod === 'mois' ? 'bg-[#022448] text-white' : 'text-[#43474e] hover:bg-gray-100'
              }`}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('tout')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                selectedPeriod === 'tout' ? 'bg-[#022448] text-white' : 'text-[#43474e] hover:bg-gray-100'
              }`}
            >
              Toutes
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[#43474e]">Filtrer par Agent :</span>
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="p-1.5 border border-[#c4c7d4] rounded-lg bg-white"
          >
            <option value="TOUS">Tous les agents SAA / SAFM</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.name}>
                {ag.name} ({ag.badgeNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Breakdown Table Grouped by Agent */}
      <div className="space-y-3">
        <h3 className="font-sans font-bold text-sm text-[#022448] uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#006d2f]">group</span>
          <span>Ventilation des Recouvrements par Agent Responsable</span>
        </h3>

        <div className="overflow-x-auto border border-[#dde2f3] rounded-xl">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-[#f0f3ff] text-[#43474e] font-bold text-[10px] uppercase">
              <tr>
                <th className="p-3">Agent / Matricule Badge</th>
                <th className="p-3">Rôle &amp; Affectation</th>
                <th className="p-3 text-center">Quittances Émises</th>
                <th className="p-3 text-right">Cash Terrain</th>
                <th className="p-3 text-right">Direction</th>
                <th className="p-3 text-right font-bold">Total Perçu</th>
                <th className="p-3 text-center">Statut Reversement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde2f3]">
              {agentAggregates
                .filter((ag) => selectedAgentFilter === 'TOUS' || ag.agentName.includes(selectedAgentFilter))
                .map((ag) => (
                  <tr key={ag.agentName} className="hover:bg-[#f9f9ff]">
                    <td className="p-3">
                      <div className="font-bold text-sm text-[#161c27]">{ag.agentName}</div>
                      <span className="font-mono text-[10px] text-[#747783]">{ag.badge}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] text-[#43474e] block">Contrôleur SAA</span>
                      <span className="text-[10px] text-[#006d2f] font-semibold">Habilité à percevoir</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{ag.receiptCount}</td>
                    <td className="p-3 text-right font-mono text-[#006d2f]">
                      {ag.terrainAmount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3 text-right font-mono text-[#5b21b6]">
                      {ag.directionAmount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#022448] text-sm">
                      {ag.totalAmount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dcfce7] text-[#15803d]">
                        Émargé / Conforme
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot className="bg-[#f0f3ff] font-bold text-xs border-t-2 border-[#022448]">
              <tr>
                <td colSpan={2} className="p-3 uppercase font-sans text-[#022448]">
                  Total Général à Reverser au Trésor Public
                </td>
                <td className="p-3 text-center font-mono">{totals.receiptsCount}</td>
                <td className="p-3 text-right font-mono text-[#006d2f]">
                  {totals.terrainTotal.toLocaleString('fr-FR')} FCFA
                </td>
                <td className="p-3 text-right font-mono text-[#5b21b6]">
                  {totals.directionTotal.toLocaleString('fr-FR')} FCFA
                </td>
                <td className="p-3 text-right font-mono text-sm text-[#022448]">
                  {totals.totalCollected.toLocaleString('fr-FR')} FCFA
                </td>
                <td className="p-3 text-center">
                  <span className="font-sans text-[10px] uppercase text-[#006d2f] font-extrabold">Certifié Conforme</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Official Signatures Section for Treasury Bordereau */}
      <div className="pt-6 border-t border-[#dde2f3] grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <span className="font-bold text-[#43474e] block mb-1 uppercase text-[10px]">1. Visa du Régisseur des Recettes</span>
          <p className="text-[#161c27] font-semibold">Jacques Alphonse MATOKO</p>
          <span className="text-[11px] text-[#747783] block mt-0.5">Chef de Service SAA • Contrôle Qualité</span>
          <div className="mt-8 pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-500 italic">
            Signature &amp; Date
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <span className="font-bold text-[#43474e] block mb-1 uppercase text-[10px]">2. Visa du Chef SAFM</span>
          <p className="text-[#161c27] font-semibold">Service Administratif, Finances &amp; Matériel</p>
          <span className="text-[11px] text-[#747783] block mt-0.5">Rapprochement bancaire &amp; comptable</span>
          <div className="mt-8 pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-500 italic">
            Signature &amp; Date
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <span className="font-bold text-[#022448] block mb-1 uppercase text-[10px]">3. Approbation Directeur Départemental</span>
          <p className="text-[#022448] font-bold">Jean Richard NTSEKE NGOUAKA</p>
          <span className="text-[11px] text-[#747783] block mt-0.5">Direction Départementale des Loisirs DDL-PN</span>
          <div className="mt-8 pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-500 italic">
            Sceau &amp; Signature Officielle
          </div>
        </div>
      </div>
    </div>
  );
};
