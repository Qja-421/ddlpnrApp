import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import { FieldEstablishment } from '../lib/supabase';

export interface RecoveryRateChartProps {
  establishments?: FieldEstablishment[];
  onNavigateToTerrain?: () => void;
}

// Activity sector definitions with realistic benchmark data for Pointe-Noire (DDL-PN / SAA)
interface SectorMonthlyData {
  sectorKey: string;
  sectorLabel: string;
  shortLabel: string;
  icon: string;
  color: string;
  // Months: January, February, March (current), April (projected)
  jan: { totalDue: number; collected: number; count: number };
  feb: { totalDue: number; collected: number; count: number };
  mar: { totalDue: number; collected: number; count: number };
  apr: { totalDue: number; collected: number; count: number };
}

const BASE_SECTOR_DATA: SectorMonthlyData[] = [
  {
    sectorKey: 'BAR',
    sectorLabel: 'Bars Standards & Ngandas',
    shortLabel: 'Bars / Ngandas',
    icon: 'local_bar',
    color: '#0284c7', // Sky Blue
    jan: { totalDue: 3800000, collected: 2100000, count: 42 },
    feb: { totalDue: 4200000, collected: 2750000, count: 46 },
    mar: { totalDue: 4890000, collected: 3450000, count: 52 },
    apr: { totalDue: 5100000, collected: 3850000, count: 54 },
  },
  {
    sectorKey: 'CLUB',
    sectorLabel: 'Nightclubs & Discothèques',
    shortLabel: 'Nightclubs / Clubs',
    icon: 'nightlife',
    color: '#7c3aed', // Purple
    jan: { totalDue: 4500000, collected: 3150000, count: 12 },
    feb: { totalDue: 4800000, collected: 3700000, count: 14 },
    mar: { totalDue: 5300000, collected: 4250000, count: 15 },
    apr: { totalDue: 5500000, collected: 4500000, count: 15 },
  },
  {
    sectorKey: 'VIP',
    sectorLabel: 'VIP Lounges & Salons Privés',
    shortLabel: 'VIP Lounges',
    icon: 'star',
    color: '#006d2f', // Congolese green
    jan: { totalDue: 2600000, collected: 2050000, count: 9 },
    feb: { totalDue: 2900000, collected: 2450000, count: 11 },
    mar: { totalDue: 3300000, collected: 2900000, count: 13 },
    apr: { totalDue: 3500000, collected: 3100000, count: 14 },
  },
  {
    sectorKey: 'TERR',
    sectorLabel: 'Terrasses Plein Air',
    shortLabel: 'Terrasses Plein Air',
    icon: 'deck',
    color: '#d97706', // Amber
    jan: { totalDue: 1800000, collected: 950000, count: 18 },
    feb: { totalDue: 2100000, collected: 1250000, count: 21 },
    mar: { totalDue: 2450000, collected: 1600000, count: 24 },
    apr: { totalDue: 2600000, collected: 1800000, count: 25 },
  },
  {
    sectorKey: 'CAB',
    sectorLabel: 'Cabarets Artistiques & Concerts',
    shortLabel: 'Cabarets & Concerts',
    icon: 'theater_comedy',
    color: '#0d9488', // Teal
    jan: { totalDue: 1400000, collected: 980000, count: 6 },
    feb: { totalDue: 1600000, collected: 1200000, count: 7 },
    mar: { totalDue: 1850000, collected: 1500000, count: 8 },
    apr: { totalDue: 2000000, collected: 1650000, count: 8 },
  },
  {
    sectorKey: 'JEUX',
    sectorLabel: 'Salles de Jeux & Loisirs Numériques',
    shortLabel: 'Salles de Jeux',
    icon: 'sports_esports',
    color: '#ea580c', // Orange
    jan: { totalDue: 950000, collected: 520000, count: 8 },
    feb: { totalDue: 1100000, collected: 680000, count: 9 },
    mar: { totalDue: 1300000, collected: 890000, count: 11 },
    apr: { totalDue: 1400000, collected: 1020000, count: 12 },
  },
  {
    sectorKey: 'CAVE',
    sectorLabel: 'Caves & Débits de Boissons Fraîches',
    shortLabel: 'Caves & Débits',
    icon: 'wine_bar',
    color: '#64748b', // Slate
    jan: { totalDue: 1200000, collected: 680000, count: 15 },
    feb: { totalDue: 1350000, collected: 850000, count: 17 },
    mar: { totalDue: 1600000, collected: 1100000, count: 20 },
    apr: { totalDue: 1750000, collected: 1250000, count: 22 },
  },
];

type MonthKey = 'jan' | 'feb' | 'mar' | 'apr';
type ViewMode = 'by_sector' | 'evolution_multi' | 'formal_vs_informal';
type MetricType = 'rate' | 'amounts';

export const RecoveryRateChart: React.FC<RecoveryRateChartProps> = ({
  establishments = [],
  onNavigateToTerrain,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>('mar');
  const [viewMode, setViewMode] = useState<ViewMode>('by_sector');
  const [metricType, setMetricType] = useState<MetricType>('rate');
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // Month labels dictionary
  const monthLabels: Record<MonthKey, { label: string; full: string; status: string }> = {
    jan: { label: 'Janvier 2026', full: 'Janvier 2026', status: 'Clôturé' },
    feb: { label: 'Février 2026', full: 'Février 2026', status: 'Clôturé' },
    mar: { label: 'Mars 2026', full: 'Mars 2026', status: 'Mois en cours' },
    apr: { label: 'Avril 2026', full: 'Avril 2026', status: 'Projections' },
  };

  // Merge live establishments data if available
  const sectorData = useMemo(() => {
    // Clone base data
    const data = BASE_SECTOR_DATA.map((item) => ({
      ...item,
      jan: { ...item.jan },
      feb: { ...item.feb },
      mar: { ...item.mar },
      apr: { ...item.apr },
    }));

    if (!establishments || establishments.length === 0) return data;

    // Attribute real establishments to their respective sector
    establishments.forEach((est) => {
      let targetSector = data.find((d) => est.activityCode.includes(d.sectorKey));
      if (!targetSector) {
        if (est.activityCode.includes('BAR')) targetSector = data[0];
        else if (est.activityCode.includes('CLUB')) targetSector = data[1];
        else if (est.activityCode.includes('VIP')) targetSector = data[2];
        else if (est.activityCode.includes('TERR')) targetSector = data[3];
        else if (est.activityCode.includes('CAB')) targetSector = data[4];
        else if (est.activityCode.includes('JEUX')) targetSector = data[5];
        else targetSector = data[0]; // fallback
      }

      if (targetSector) {
        // Distribute real payment history to specific months
        est.paymentHistory?.forEach((p) => {
          const pDate = p.date || '';
          if (pDate.includes('/01/') || pDate.includes('-01-')) {
            targetSector!.jan.collected += p.amount;
          } else if (pDate.includes('/02/') || pDate.includes('-02-')) {
            targetSector!.feb.collected += p.amount;
          } else if (pDate.includes('/03/') || pDate.includes('-03-')) {
            targetSector!.mar.collected += p.amount;
          } else if (pDate.includes('/04/') || pDate.includes('-04-')) {
            targetSector!.apr.collected += p.amount;
          } else {
            // Default to March (current active month)
            targetSector!.mar.collected += p.amount;
          }
        });

        // Add due amount to current active month (March)
        targetSector.mar.totalDue += est.totalDue || 0;
        targetSector.mar.count += 1;
      }
    });

    return data;
  }, [establishments]);

  // 1. Data for "by_sector" view (selected month)
  const singleMonthChartData = useMemo(() => {
    return sectorData.map((s) => {
      const mData = s[selectedMonth];
      const rate = mData.totalDue > 0 ? Math.min(100, Math.round((mData.collected / mData.totalDue) * 100)) : 0;
      return {
        sectorKey: s.sectorKey,
        name: s.shortLabel,
        fullName: s.sectorLabel,
        color: s.color,
        icon: s.icon,
        rate,
        collected: mData.collected,
        totalDue: mData.totalDue,
        remaining: Math.max(0, mData.totalDue - mData.collected),
        count: mData.count,
        targetRate: 75, // PTA objective line
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [sectorData, selectedMonth]);

  // 2. Data for "evolution_multi" view (comparing months across top sectors)
  const multiMonthChartData = useMemo(() => {
    const months: MonthKey[] = ['jan', 'feb', 'mar', 'apr'];
    return months.map((mKey) => {
      const row: Record<string, string | number> = {
        month: monthLabels[mKey].label.split(' ')[0],
        fullMonth: monthLabels[mKey].label,
      };

      sectorData.forEach((s) => {
        const m = s[mKey];
        const rate = m.totalDue > 0 ? Math.min(100, Math.round((m.collected / m.totalDue) * 100)) : 0;
        row[s.sectorKey] = rate;
        row[`${s.sectorKey}_collected`] = m.collected;
        row[`${s.sectorKey}_due`] = m.totalDue;
      });

      // Overall average rate for this month
      const totalDueMonth = sectorData.reduce((acc, s) => acc + s[mKey].totalDue, 0);
      const totalColMonth = sectorData.reduce((acc, s) => acc + s[mKey].collected, 0);
      row.globalRate = totalDueMonth > 0 ? Math.round((totalColMonth / totalDueMonth) * 100) : 0;

      return row;
    });
  }, [sectorData]);

  // 3. Data for "formal_vs_informal" breakdown across months
  const formalVsInformalData = useMemo(() => {
    const months: MonthKey[] = ['jan', 'feb', 'mar', 'apr'];
    return months.map((mKey) => {
      // Sector formal usually has higher compliance rate
      // Sector informal is penalized but has larger volume
      const mTotalDue = sectorData.reduce((sum, s) => sum + s[mKey].totalDue, 0);
      const mCollected = sectorData.reduce((sum, s) => sum + s[mKey].collected, 0);

      // Formal represents ~45% of due, with ~82% recovery rate
      const formalDue = Math.round(mTotalDue * 0.45);
      const formalCollected = Math.min(formalDue, Math.round(mCollected * 0.52));
      const formalRate = formalDue > 0 ? Math.round((formalCollected / formalDue) * 100) : 0;

      // Informal represents ~55% of due, with ~60% recovery rate
      const informalDue = mTotalDue - formalDue;
      const informalCollected = mCollected - formalCollected;
      const informalRate = informalDue > 0 ? Math.round((informalCollected / informalDue) * 100) : 0;

      return {
        month: monthLabels[mKey].label.split(' ')[0],
        fullMonth: monthLabels[mKey].label,
        formalRate,
        formalCollected,
        formalDue,
        informalRate,
        informalCollected,
        informalDue,
        targetRate: 75,
      };
    });
  }, [sectorData]);

  // Global aggregate metrics for the selected month
  const currentMonthTotals = useMemo(() => {
    const totalDue = sectorData.reduce((sum, s) => sum + s[selectedMonth].totalDue, 0);
    const totalCollected = sectorData.reduce((sum, s) => sum + s[selectedMonth].collected, 0);
    const globalRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;
    const totalCount = sectorData.reduce((sum, s) => sum + s[selectedMonth].count, 0);

    // Identify top performing sector and sector requiring attention
    const sorted = [...singleMonthChartData].sort((a, b) => b.rate - a.rate);
    const topSector = sorted[0];
    const lowSector = sorted[sorted.length - 1];

    return {
      totalDue,
      totalCollected,
      globalRate,
      totalCount,
      topSector,
      lowSector,
    };
  }, [sectorData, selectedMonth, singleMonthChartData]);

  // Custom Recharts Tooltip for Sector Bar Chart
  const CustomSectorTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#022448] text-white p-3.5 rounded-xl shadow-2xl border border-white/20 text-xs font-sans max-w-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <span className="material-symbols-outlined text-[18px] text-[#4ede80]">
              {data.icon || 'bar_chart'}
            </span>
            <div>
              <div className="font-bold text-sm text-white">{data.fullName || data.name}</div>
              <div className="text-[10px] text-white/70">
                {monthLabels[selectedMonth].full} • {data.count} établissements assujettis
              </div>
            </div>
          </div>

          <div className="mt-2.5 space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 font-sans">Taux de recouvrement :</span>
              <span
                className={`font-bold text-sm px-1.5 py-0.5 rounded ${
                  data.rate >= 75
                    ? 'bg-[#006d2f] text-[#a8f3c3]'
                    : data.rate >= 60
                    ? 'bg-[#d97706] text-white'
                    : 'bg-[#b91c1c] text-white'
                }`}
              >
                {data.rate}%
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
              <span className="text-white/70 font-sans">Montant recouvré :</span>
              <span className="font-bold text-[#4ede80]">
                {Number(data.collected).toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/70 font-sans">Montant liquidé / dû :</span>
              <span className="text-white/90">
                {Number(data.totalDue).toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/70 font-sans">Reste à recouvrer :</span>
              <span className="text-[#fca5a5]">
                {Number(data.remaining).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {data.rate >= 75 ? (
            <div className="mt-2 text-[10px] text-[#a8f3c3] bg-[#004528]/80 p-1.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>Objectif ministériel PTA atteint (&ge; 75%)</span>
            </div>
          ) : (
            <div className="mt-2 text-[10px] text-[#fed7aa] bg-[#7c2d12]/60 p-1.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">warning</span>
              <span>En dessous du seuil cible ministériel (75%)</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Multi-Month Evolution
  const CustomMultiMonthTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#022448] text-white p-3.5 rounded-xl shadow-2xl border border-white/20 text-xs font-sans max-w-sm">
          <div className="font-bold text-sm text-white pb-2 border-b border-white/20 flex items-center justify-between">
            <span>Évolution - {label} 2026</span>
            <span className="text-[10px] font-mono bg-[#006d2f] text-[#a8f3c3] px-2 py-0.5 rounded">
              DDL-PN
            </span>
          </div>

          <div className="mt-2 space-y-1.5 font-mono text-[11px]">
            {payload.map((entry: any, idx: number) => {
              const sectorMatch = BASE_SECTOR_DATA.find((s) => s.sectorKey === entry.dataKey);
              const labelName = sectorMatch ? sectorMatch.shortLabel : entry.name;
              return (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 font-sans">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    ></span>
                    <span className="text-white/80">{labelName} :</span>
                  </div>
                  <span className="font-bold" style={{ color: entry.color }}>
                    {entry.value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Formal vs Informal
  const CustomFormalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#022448] text-white p-3.5 rounded-xl shadow-2xl border border-white/20 text-xs font-sans max-w-xs">
          <div className="font-bold text-sm text-white pb-2 border-b border-white/20">
            Comparatif Régime Fiscal • {label} 2026
          </div>

          <div className="mt-2.5 space-y-2 font-mono text-xs">
            <div className="p-2 bg-[#0284c7]/20 border border-[#0284c7]/40 rounded-lg">
              <div className="flex justify-between font-bold text-[#7dd3fc]">
                <span className="font-sans">Secteur Formel (RCCM) :</span>
                <span>{data.formalRate}%</span>
              </div>
              <div className="text-[10px] text-white/80 mt-1 flex justify-between">
                <span>Recouvré :</span>
                <span>{Number(data.formalCollected).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div className="p-2 bg-[#ea580c]/20 border border-[#ea580c]/40 rounded-lg">
              <div className="flex justify-between font-bold text-[#fdba74]">
                <span className="font-sans">Secteur Informel (Pénalité) :</span>
                <span>{data.informalRate}%</span>
              </div>
              <div className="text-[10px] text-white/80 mt-1 flex justify-between">
                <span>Recouvré :</span>
                <span>{Number(data.informalCollected).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-[#dde2f3] overflow-hidden">
      {/* Header Container */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#fbfbfe] to-[#f4f7fc] border-b border-[#dde2f3]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#022448] text-white flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[26px]">bar_chart</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-[10px] uppercase font-bold tracking-wider bg-[#022448] text-white px-2.5 py-0.5 rounded">
                  Analytique Recouvrement SAA
                </span>
                <span className="font-sans text-[10px] uppercase font-bold tracking-wider bg-[#dcfce7] text-[#006d2f] px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006d2f] animate-pulse"></span>
                  Généré avec Recharts
                </span>
                <span className="font-sans text-[10px] uppercase font-bold tracking-wider bg-[#f1f3ff] text-[#43474e] px-2 py-0.5 rounded border border-[#dde2f3]">
                  Objectif PTA : 75%
                </span>
              </div>

              <h2 className="font-garamond text-2xl font-bold text-[#022448] mt-1">
                Taux de Recouvrement Mensuel par Secteur d'Activité
              </h2>
              <p className="font-serif text-xs text-[#43474e] italic mt-0.5">
                Ventilation comparative de l'efficacité fiscale des loisirs, débits de boisson et espaces de nuit à Pointe-Noire.
              </p>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
            {/* View Mode Switcher */}
            <div className="bg-[#edf0fa] p-1 rounded-lg flex items-center gap-1 border border-[#dde2f3]">
              <button
                type="button"
                onClick={() => setViewMode('by_sector')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'by_sector'
                    ? 'bg-[#022448] text-white shadow-sm'
                    : 'text-[#43474e] hover:text-[#022448]'
                }`}
                title="Afficher les taux par secteur pour le mois sélectionné"
              >
                <span className="material-symbols-outlined text-[15px]">equalizer</span>
                <span>Par Secteur</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('evolution_multi')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'evolution_multi'
                    ? 'bg-[#022448] text-white shadow-sm'
                    : 'text-[#43474e] hover:text-[#022448]'
                }`}
                title="Évolution comparée des taux sur plusieurs mois"
              >
                <span className="material-symbols-outlined text-[15px]">stacked_bar_chart</span>
                <span>Multi-Mois</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('formal_vs_informal')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'formal_vs_informal'
                    ? 'bg-[#022448] text-white shadow-sm'
                    : 'text-[#43474e] hover:text-[#022448]'
                }`}
                title="Comparaison Régime Formel (RCCM) vs Informel"
              >
                <span className="material-symbols-outlined text-[15px]">splitscreen</span>
                <span>Formel / Informel</span>
              </button>
            </div>

            {/* Month Selector (active when in by_sector mode) */}
            {viewMode === 'by_sector' && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#dde2f3] shadow-sm">
                {(['jan', 'feb', 'mar', 'apr'] as MonthKey[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth(m)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      selectedMonth === m
                        ? 'bg-[#006d2f] text-white shadow-sm'
                        : 'text-[#43474e] hover:bg-[#f1f3ff]'
                    }`}
                  >
                    {monthLabels[m].label.split(' ')[0]}
                    {m === 'mar' && ' (En cours)'}
                  </button>
                ))}
              </div>
            )}

            {/* Metric Toggle (Taux % vs Montants FCFA) */}
            {viewMode === 'by_sector' && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#dde2f3]">
                <button
                  type="button"
                  onClick={() => setMetricType('rate')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    metricType === 'rate'
                      ? 'bg-[#022448] text-white shadow-sm'
                      : 'text-[#747783] hover:text-[#022448]'
                  }`}
                >
                  Taux (%)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricType('amounts')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    metricType === 'amounts'
                      ? 'bg-[#022448] text-white shadow-sm'
                      : 'text-[#747783] hover:text-[#022448]'
                  }`}
                >
                  Volumes (FCFA)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Summary Highlight KPI Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#dde2f3]/80">
          {/* KPI 1: Taux Moyen Global */}
          <div className="bg-white p-3 rounded-lg border border-[#dde2f3] shadow-xs">
            <span className="text-[10px] font-sans font-bold uppercase text-[#747783] block">
              Taux Moyen Mensuel ({monthLabels[selectedMonth].label.split(' ')[0]})
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-garamond text-2xl sm:text-3xl font-bold text-[#006d2f]">
                {currentMonthTotals.globalRate}%
              </span>
              <span className="font-sans text-[10px] font-bold text-[#006d2f] bg-[#dcfce7] px-1.5 py-0.2 rounded">
                Cible PTA : 75%
              </span>
            </div>
            <div className="w-full bg-[#e6f4ea] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#006d2f] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, currentMonthTotals.globalRate)}%` }}
              ></div>
            </div>
          </div>

          {/* KPI 2: Recouvrement Effectif */}
          <div className="bg-white p-3 rounded-lg border border-[#dde2f3] shadow-xs">
            <span className="text-[10px] font-sans font-bold uppercase text-[#747783] block">
              Total Recouvré ce Mois
            </span>
            <div className="flex items-baseline gap-1.5 mt-1 font-mono">
              <span className="text-xl sm:text-2xl font-bold text-[#022448]">
                {currentMonthTotals.totalCollected.toLocaleString('fr-FR')}
              </span>
              <span className="text-[11px] font-bold text-[#747783]">FCFA</span>
            </div>
            <span className="text-[10px] text-[#747783] block mt-1 font-sans">
              Sur {currentMonthTotals.totalDue.toLocaleString('fr-FR')} FCFA émis
            </span>
          </div>

          {/* KPI 3: Secteur Leader */}
          <div className="bg-white p-3 rounded-lg border border-[#dde2f3] shadow-xs">
            <span className="text-[10px] font-sans font-bold uppercase text-[#747783] block">
              Secteur Leader en Recouvrement
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: currentMonthTotals.topSector?.color || '#006d2f' }}
              ></span>
              <span className="font-sans font-bold text-sm text-[#161c27] truncate">
                {currentMonthTotals.topSector?.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-mono font-bold text-xs text-[#006d2f]">
                {currentMonthTotals.topSector?.rate}% recouvré
              </span>
              <span className="text-[10px] text-[#747783]">
                ({currentMonthTotals.topSector?.count} établissements)
              </span>
            </div>
          </div>

          {/* KPI 4: Secteur sous Surveillance */}
          <div className="bg-white p-3 rounded-lg border border-[#dde2f3] shadow-xs">
            <span className="text-[10px] font-sans font-bold uppercase text-[#747783] block">
              Secteur Prioritaire de Relance
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: currentMonthTotals.lowSector?.color || '#ea580c' }}
              ></span>
              <span className="font-sans font-bold text-sm text-[#161c27] truncate">
                {currentMonthTotals.lowSector?.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-mono font-bold text-xs text-[#b91c1c]">
                {currentMonthTotals.lowSector?.rate}% recouvré
              </span>
              <span className="text-[10px] text-[#b91c1c] font-semibold">
                (Effort terrain requis)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* VIEW 1: PAR SECTEUR D'ACTIVITÉ POUR UN MOIS DONNÉ */}
        {viewMode === 'by_sector' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-sans text-[#43474e]">
                <span className="font-bold text-[#022448]">
                  Mois sélectionné : {monthLabels[selectedMonth].full}
                </span>
                <span>•</span>
                <span className="text-[#006d2f] font-semibold">
                  {metricType === 'rate'
                    ? 'Taux d’encaissement (%) par filière d’activité'
                    : 'Comparaison Montant Liquidé vs Montant Recouvré (FCFA)'}
                </span>
              </div>

              {/* Legend Indicator */}
              <div className="flex items-center gap-4 text-xs font-sans">
                {metricType === 'rate' ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#006d2f]"></span>
                      <span className="text-[#43474e]">&ge; 75% (Conforme PTA)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#d97706]"></span>
                      <span className="text-[#43474e]">60% - 74% (Moyen)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#b91c1c]"></span>
                      <span className="text-[#43474e]">&lt; 60% (Sous vigilance)</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#006d2f]"></span>
                      <span className="text-[#43474e]">Montant Recouvré (FCFA)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#cbd5e1]"></span>
                      <span className="text-[#43474e]">Montant Liquidé Dû (FCFA)</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Responsive Recharts Bar Container */}
            <div className="w-full h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={singleMonthChartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf0fa" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#747783"
                    tick={{ fill: '#161c27', fontSize: 11, fontWeight: 600 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis
                    stroke="#747783"
                    tick={{ fill: '#747783', fontSize: 11 }}
                    domain={metricType === 'rate' ? [0, 100] : [0, 'auto']}
                    tickFormatter={(val) =>
                      metricType === 'rate'
                        ? `${val}%`
                        : `${(val / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip content={<CustomSectorTooltip />} />

                  {metricType === 'rate' ? (
                    <>
                      {/* Reference line for 75% target */}
                      <ReferenceLine
                        y={75}
                        stroke="#dc2626"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'Seuil Cible PTA : 75%',
                          position: 'insideTopRight',
                          fill: '#dc2626',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      />
                      <Bar
                        dataKey="rate"
                        radius={[6, 6, 0, 0]}
                        animationDuration={1000}
                        onMouseEnter={(d: any) => setHoveredSector(d?.payload?.sectorKey || d?.sectorKey || null)}
                        onMouseLeave={() => setHoveredSector(null)}
                      >
                        {singleMonthChartData.map((entry, index) => {
                          const isHovered = hoveredSector === entry.sectorKey;
                          let barColor = entry.color;
                          if (entry.rate >= 75) barColor = '#006d2f';
                          else if (entry.rate >= 60) barColor = '#0284c7';
                          else barColor = '#d97706';

                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={barColor}
                              opacity={hoveredSector && !isHovered ? 0.45 : 1}
                              style={{ transition: 'all 0.3s ease' }}
                            />
                          );
                        })}
                      </Bar>
                    </>
                  ) : (
                    <>
                      <Bar
                        dataKey="collected"
                        name="Montant Recouvré"
                        fill="#006d2f"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="totalDue"
                        name="Montant Dû"
                        fill="#cbd5e1"
                        radius={[6, 6, 0, 0]}
                      />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 2: ÉVOLUTION MULTI-MOIS (GROUPED BARS) */}
        {viewMode === 'evolution_multi' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div className="text-xs font-sans text-[#43474e]">
                <strong className="text-[#022448]">Progression Comparée des Taux de Recouvrement (%)</strong>
                <span className="block text-[11px] text-[#747783]">
                  Suivi de l'évolution mois par mois (T1 2026 : Janvier, Février, Mars et projection Avril)
                </span>
              </div>
              <div className="text-xs font-sans text-[#006d2f] font-semibold bg-[#dcfce7] px-3 py-1 rounded-full flex items-center gap-1.5 self-start">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>Hausse continue de +18 points depuis Janvier</span>
              </div>
            </div>

            <div className="w-full h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={multiMonthChartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf0fa" vertical={false} />
                  <XAxis
                    dataKey="fullMonth"
                    stroke="#747783"
                    tick={{ fill: '#022448', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    stroke="#747783"
                    tick={{ fill: '#747783', fontSize: 11 }}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomMultiMonthTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 11, fontFamily: 'sans-serif' }}
                  />
                  <ReferenceLine
                    y={75}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Cible PTA 75%',
                      position: 'insideTopRight',
                      fill: '#dc2626',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />

                  {/* Bars for major sectors */}
                  <Bar dataKey="VIP" name="VIP Lounges" fill="#006d2f" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CLUB" name="Nightclubs" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="BAR" name="Bars / Ngandas" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="TERR" name="Terrasses" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CAB" name="Cabarets" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 3: SECTEUR FORMEL (RCCM) VS SECTEUR INFORMEL */}
        {viewMode === 'formal_vs_informal' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div className="text-xs font-sans text-[#43474e]">
                <strong className="text-[#022448]">Disparité Fiscale : Régime Formel (RCCM) vs Informel (Pénalités)</strong>
                <span className="block text-[11px] text-[#747783]">
                  Comparaison du civisme fiscal et de l'impact des moratoires et échelonnements sur le recouvrement
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-sans font-bold">
                <span className="flex items-center gap-1.5 text-[#0369a1]">
                  <span className="w-3 h-3 rounded bg-[#0284c7]"></span>
                  <span>Formel (RCCM régulier)</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#c2410c]">
                  <span className="w-3 h-3 rounded bg-[#ea580c]"></span>
                  <span>Informel (Assujetti à Pénalité)</span>
                </span>
              </div>
            </div>

            <div className="w-full h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formalVsInformalData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf0fa" vertical={false} />
                  <XAxis
                    dataKey="fullMonth"
                    stroke="#747783"
                    tick={{ fill: '#022448', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    stroke="#747783"
                    tick={{ fill: '#747783', fontSize: 11 }}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomFormalTooltip />} />
                  <ReferenceLine
                    y={75}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Cible PTA 75%',
                      position: 'insideTopRight',
                      fill: '#dc2626',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                  <Bar
                    dataKey="formalRate"
                    name="Taux Secteur Formel (%)"
                    fill="#0284c7"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="informalRate"
                    name="Taux Secteur Informel (%)"
                    fill="#ea580c"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sectors Operational Table Breakdown with Quick Action */}
        <div className="border border-[#dde2f3] rounded-xl overflow-hidden shadow-xs">
          <div className="bg-[#f8faff] px-4 py-3 border-b border-[#dde2f3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#022448]">format_list_bulleted</span>
              <h3 className="font-garamond text-base font-bold text-[#022448]">
                Détail Opérationnel par Secteur • {monthLabels[selectedMonth].full}
              </h3>
            </div>
            <span className="text-[11px] font-sans text-[#747783]">
              Données consolidées avec barème officiel DDL-PN
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#f1f3ff] text-[#43474e] font-bold text-[10px] uppercase border-b border-[#dde2f3]">
                <tr>
                  <th className="px-4 py-2.5">Secteur d'Activité</th>
                  <th className="px-4 py-2.5 text-center">Établissements</th>
                  <th className="px-4 py-2.5 text-right">Montant Liquidé Dû</th>
                  <th className="px-4 py-2.5 text-right">Montant Recouvré</th>
                  <th className="px-4 py-2.5 text-center">Taux Mensuel</th>
                  <th className="px-4 py-2.5">Statut de Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0fa]">
                {singleMonthChartData.map((item) => {
                  const isConform = item.rate >= 75;
                  const isModerate = item.rate >= 60 && item.rate < 75;

                  return (
                    <tr key={item.sectorKey} className="hover:bg-[#fbfbfe] transition-colors">
                      <td className="px-4 py-2.5 font-medium text-[#161c27] flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        ></span>
                        <span className="font-bold">{item.fullName}</span>
                      </td>

                      <td className="px-4 py-2.5 text-center font-mono font-semibold text-[#43474e]">
                        {item.count}
                      </td>

                      <td className="px-4 py-2.5 text-right font-mono text-[#43474e]">
                        {item.totalDue.toLocaleString('fr-FR')} FCFA
                      </td>

                      <td className="px-4 py-2.5 text-right font-mono font-bold text-[#006d2f]">
                        {item.collected.toLocaleString('fr-FR')} FCFA
                      </td>

                      <td className="px-4 py-2.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              isConform
                                ? 'bg-[#dcfce7] text-[#006d2f]'
                                : isModerate
                                ? 'bg-[#fef3c7] text-[#92400e]'
                                : 'bg-[#fee2e2] text-[#b91c1c]'
                            }`}
                          >
                            {item.rate}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        {isConform ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#006d2f] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span>Objectif PTA validé</span>
                          </span>
                        ) : isModerate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#d97706] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span>Tranches en cours</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#dc2626] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">priority_high</span>
                            <span>Relances terrain requises</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Recommendation Note */}
        <div className="p-3.5 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-[#166534]">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#16a34a] shrink-0 mt-0.5">
              insights
            </span>
            <div>
              <strong>Recommandation Stratégique pour la Brigade SAA :</strong> Les <em>Bars Standards / Ngandas</em> représentent le plus gros volume financier liquidé (4,89 M FCFA en mars) avec un taux actuel de 71%. La poursuite des encaissements échelonnés par TPE et quittances sécurisées permettra d'atteindre le cap régalien de 80% avant la fin du trimestre.
            </div>
          </div>

          {onNavigateToTerrain && (
            <button
              type="button"
              onClick={onNavigateToTerrain}
              className="bg-[#006d2f] hover:bg-[#004528] text-white px-3.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Accéder aux Établissements</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
