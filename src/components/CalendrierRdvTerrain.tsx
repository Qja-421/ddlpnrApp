import React, { useState, useMemo } from 'react';
import { FieldEstablishment, AgentAccount } from '../lib/supabase.ts';
import { ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';
import { useSession } from '../lib/sessionContext.tsx';

interface CalendrierRdvTerrainProps {
  establishments: FieldEstablishment[];
  onUpdateEstablishment: (est: FieldEstablishment) => void;
  onRecordPayment: (
    est: FieldEstablishment,
    amount: number,
    nextDueDate: string,
    paymentMethod: string,
    location: 'TERRAIN' | 'DIRECTION'
  ) => void;
  onAddNewEstablishment?: (newEst: FieldEstablishment) => void;
  agents: AgentAccount[];
}

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

// Helper: Normalize French date (DD/MM/YYYY) or ISO (YYYY-MM-DD) to ISO format (YYYY-MM-DD)
export function normalizeDateToISO(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const str = dateStr.trim();
  if (str.toLowerCase().includes('soldé') || str.toLowerCase().includes('solde')) {
    // If it says "Soldé (Renouvellement DD/MM/YYYY)", try extracting date
    const match = str.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return null;
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const frMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (frMatch) {
    const day = frMatch[1].padStart(2, '0');
    const month = frMatch[2].padStart(2, '0');
    const year = frMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Check YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return null;
}

// Format YYYY-MM-DD to DD/MM/YYYY
export function formatISOToFR(isoStr: string): string {
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

// Compute +1 year from a date string (DD/MM/YYYY or YYYY-MM-DD)
export function addOneYear(dateStr: string): string {
  const iso = normalizeDateToISO(dateStr);
  if (iso) {
    const [y, m, d] = iso.split('-');
    const nextYear = parseInt(y, 10) + 1;
    return `${d}/${m}/${nextYear}`;
  }
  const now = new Date();
  const nextYear = now.getFullYear() + 1;
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${nextYear}`;
}

// Find the date of the very first payment made by this establishment
export function getFirstPaymentDate(est: FieldEstablishment, fallbackDate: string = '24/09/2026'): string {
  if (est.paymentHistory && est.paymentHistory.length > 0) {
    const validDates = est.paymentHistory
      .map((p) => {
        const iso = normalizeDateToISO(p.date);
        return { raw: p.date, iso };
      })
      .filter((item): item is { raw: string; iso: string } => item.iso !== null);

    if (validDates.length > 0) {
      // Sort chronologically ascending to find the earliest payment
      validDates.sort((a, b) => a.iso.localeCompare(b.iso));
      return formatISOToFR(validDates[0].iso);
    }
  }

  // If no prior payment exists in history, use the establishment's identifiedDate or fallback
  const identifiedISO = normalizeDateToISO(est.identifiedDate);
  if (identifiedISO) {
    return formatISOToFR(identifiedISO);
  }

  return fallbackDate;
}

// Helper: Convert numbers to French words (FCFA)
export function numberToWordsFCFA(amount: number): string {
  if (amount === 0) return 'Zéro Franc CFA';
  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-sept', 'Dix-huit', 'Dix-neuf'];
  const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-dix', 'Quatre-vingts', 'Quatre-vingt-dix'];

  function convertSmall(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 70) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      return u === 1 ? `${tens[t]} et un` : `${tens[t]}${u ? '-' + units[u] : ''}`;
    }
    if (n < 80) {
      const u = n - 60;
      return u === 11 ? 'Soixante et onze' : `Soixante-${teens[u - 10] || units[u]}`;
    }
    if (n < 100) {
      const u = n - 80;
      return u === 0 ? 'Quatre-vingts' : `Quatre-vingt-${teens[u - 10] || units[u]}`;
    }
    const h = Math.floor(n / 100);
    const r = n % 100;
    const hStr = h === 1 ? 'Cent' : `${units[h]} cents`;
    return r ? `${hStr} ${convertSmall(r)}` : hStr;
  }

  if (amount < 1000) {
    return `${convertSmall(amount)} Francs CFA`;
  }

  const thousands = Math.floor(amount / 1000);
  const remainder = amount % 1000;
  const thStr = thousands === 1 ? 'Mille' : `${convertSmall(thousands)} mille`;
  const remStr = remainder ? ` ${convertSmall(remainder)}` : '';

  return `${thStr}${remStr} Francs CFA`;
}

export interface OfficialReceiptPayload {
  receiptRef: string;
  establishmentName: string;
  promoter: string;
  phone: string;
  district: string;
  amount: number;
  amountInWords: string;
  balanceRemaining: number;
  paymentMethod: string;
  location: string;
  agentName: string;
  dateStr: string;
  isYearSettled: boolean;
  firstPaymentDate: string;
  nextRenewalDate: string;
  nextDueDate: string;
}

export const CalendrierRdvTerrain: React.FC<CalendrierRdvTerrainProps> = ({
  establishments,
  onUpdateEstablishment,
  onRecordPayment,
  onAddNewEstablishment,
  agents,
}) => {
  const {
    currentAgent,
    isAdmin,
    isFieldAgent,
    canAccessEstablishment,
    canModifyEstablishment,
    checkEstablishmentCollision,
    reassignEstablishment,
    setShowLoginModal,
    agentsList,
  } = useSession();

  // Current reference date: default to 24 September 2026 (matching system context)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date(2026, 8, 24);
  });

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDayISO, setSelectedDayISO] = useState<string>('2026-09-24');

  // Filters & Google Calendar Side Panel
  const [filterArrondissement, setFilterArrondissement] = useState<string>('TOUS');
  const [filterStatus, setFilterStatus] = useState<string>('TOUS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('TOUS');
  const [showGoogleSidebar, setShowGoogleSidebar] = useState<boolean>(true);

  // Manual Convocation & RDV fields
  const [manualRdvTime, setManualRdvTime] = useState<string>('09:30');
  const [manualRdvType, setManualRdvType] = useState<'BUREAU' | 'TERRAIN'>('BUREAU');
  const [manualRdvOffice, setManualRdvOffice] = useState<string>(
    'Service Autorisation & Animation (SAA) - Bureau N° 4, Direction Départementale des Loisirs, Avenue Moe Pratt'
  );
  const [collisionWarning, setCollisionWarning] = useState<{
    hasCollision: boolean;
    collisionReason?: string;
    assignedToOther: boolean;
    assignedAgentName?: string;
    assignedAgentBadge?: string;
  } | null>(null);

  // Modals
  const [quickPayEst, setQuickPayEst] = useState<FieldEstablishment | null>(null);
  const [rescheduleEst, setRescheduleEst] = useState<FieldEstablishment | null>(null);
  const [showNewRdvModal, setShowNewRdvModal] = useState<boolean>(false);
  const [selectedDayForNewRdv, setSelectedDayForNewRdv] = useState<string>('2026-09-24');
  const [showSettledListModal, setShowSettledListModal] = useState<boolean>(false);
  const [officialReceiptModal, setOfficialReceiptModal] = useState<OfficialReceiptPayload | null>(null);

  // Quick Payment form states
  const [payAmount, setPayAmount] = useState<number>(0);
  const [nextAppointmentDate, setNextAppointmentDate] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('ESPECES');
  const [payLocation, setPayLocation] = useState<'TERRAIN' | 'DIRECTION'>('TERRAIN');
  const [selectedAgentBadge, setSelectedAgentBadge] = useState<string>(currentAgent.badgeNumber);

  // Reschedule form state
  const [rescheduleNewDate, setRescheduleNewDate] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('Convenu avec le promoteur sur le terrain');

  // New Rendez-vous / Establishment form state
  const [newRdvMode, setNewRdvMode] = useState<'existing' | 'new'>('existing');
  const [newRdvSearchFilter, setNewRdvSearchFilter] = useState<string>('');
  const [selectedExistingEstId, setSelectedExistingEstId] = useState<string>('');
  const [newEstName, setNewEstName] = useState<string>('');
  const [newEstPromoter, setNewEstPromoter] = useState<string>('');
  const [newEstPhone, setNewEstPhone] = useState<string>('');
  const [newEstDistrict, setNewEstDistrict] = useState<string>('Arrondissement 1 Lumumba');
  const [newEstAddress, setNewEstAddress] = useState<string>('');
  const [newEstActivity, setNewEstActivity] = useState<string>('ACT-BAR');
  const [newEstSector, setNewEstSector] = useState<'informal' | 'formal'>('informal');
  const [newEstNegotiatedAmount, setNewEstNegotiatedAmount] = useState<number>(50000);

  // Success Notification banner
  const [bannerAlert, setBannerAlert] = useState<{
    title: string;
    msg: string;
    type: 'success' | 'annual';
  } | null>(null);

  const showBanner = (title: string, msg: string, type: 'success' | 'annual' = 'success') => {
    setBannerAlert({ title, msg, type });
    setTimeout(() => {
      setBannerAlert(null);
    }, 7000);
  };

  // Group establishments by ISO appointment date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, FieldEstablishment[]>();

    establishments.forEach((est) => {
      // 🔒 Cloisonnement de session : un agent de terrain ne voit QUE ses établissements attribués !
      if (isFieldAgent && !canAccessEstablishment(est)) {
        return;
      }

      // 👁️ Vue Direction Centrale : l'administrateur peut filtrer par agent ou tout afficher
      if (isAdmin && selectedAgentFilter !== 'TOUS') {
        const assignedBadge =
          est.assignedAgentBadge ||
          (est.identifiedBy?.includes('008') || est.identifiedBy?.includes('Makosso')
            ? 'SAA-PN-008'
            : est.identifiedBy?.includes('005') || est.identifiedBy?.includes('Tchicaya')
            ? 'SAA-PN-005'
            : est.identifiedBy?.includes('012') || est.identifiedBy?.includes('Loubaki')
            ? 'SAA-PN-012'
            : 'SAA-CHEF-001');
        if (assignedBadge !== selectedAgentFilter) return;
      }

      // Filtering by district
      if (
        filterArrondissement !== 'TOUS' &&
        !est.district.toLowerCase().includes(filterArrondissement.toLowerCase())
      ) {
        return;
      }

      // Filtering by status
      if (filterStatus === 'SOLDE') {
        const isSettled = est.paidAmount >= est.totalDue && est.totalDue > 0;
        if (!isSettled) return;
      } else if (filterStatus === 'EN_COURS') {
        const isSettled = est.paidAmount >= est.totalDue && est.totalDue > 0;
        if (isSettled) return;
      } else if (filterStatus === 'RETARD') {
        if (!est.nextDueDate) return;
        const iso = normalizeDateToISO(est.nextDueDate);
        if (!iso || iso >= '2026-09-24' || (est.paidAmount >= est.totalDue && est.totalDue > 0)) {
          return;
        }
      }

      // Filtering by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          est.name.toLowerCase().includes(q) ||
          est.promoter.toLowerCase().includes(q) ||
          est.phone.toLowerCase().includes(q) ||
          est.district.toLowerCase().includes(q);
        if (!matches) return;
      }

      // If nextDueDate is "Soldé" or not set, compute the next renewal anniversary
      let targetDueDate = est.nextDueDate;
      if (!targetDueDate || targetDueDate.toLowerCase().includes('solde')) {
        const firstDate = getFirstPaymentDate(est);
        targetDueDate = addOneYear(firstDate);
      }

      const isoDate = normalizeDateToISO(targetDueDate);
      if (isoDate) {
        if (!map.has(isoDate)) {
          map.set(isoDate, []);
        }
        map.get(isoDate)!.push(est);
      }
    });

    return map;
  }, [
    establishments,
    filterArrondissement,
    filterStatus,
    searchQuery,
    isFieldAgent,
    isAdmin,
    selectedAgentFilter,
    canAccessEstablishment,
  ]);

  // List of all settled establishments whose annual fees are fully settled
  const settledEstablishments = useMemo(() => {
    return establishments.filter((est) => est.paidAmount >= est.totalDue && est.totalDue > 0);
  }, [establishments]);

  // Chronological group of all events for Google Calendar Agenda View
  const upcomingAgendaEvents = useMemo(() => {
    const sortedDates = Array.from(eventsByDate.keys()).sort();
    return sortedDates
      .map((iso) => ({
        iso,
        frDate: formatISOToFR(iso),
        isToday: iso === '2026-09-24',
        dayName: new Intl.DateTimeFormat('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date(iso + 'T12:00:00')),
        establishments: eventsByDate.get(iso) || [],
      }))
      .filter((group) => group.establishments.length > 0);
  }, [eventsByDate]);

  // Calendar calculations for Month View
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Month grid days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is 0 in European calendar
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const days: {
      date: Date;
      iso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const iso = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: prevDate,
        iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: iso === '2026-09-24',
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, month, d);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: curDate,
        iso,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: iso === '2026-09-24',
      });
    }

    // Next month filler days (fill up to 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const iso = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: nextDate,
        iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: iso === '2026-09-24',
      });
    }

    return days;
  }, [year, month]);

  // Navigate dates
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() - 7);
      setCurrentDate(newD);
    } else {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() - 1);
      setCurrentDate(newD);
      const iso = `${newD.getFullYear()}-${String(newD.getMonth() + 1).padStart(2, '0')}-${String(newD.getDate()).padStart(2, '0')}`;
      setSelectedDayISO(iso);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() + 7);
      setCurrentDate(newD);
    } else {
      const newD = new Date(currentDate);
      newD.setDate(newD.getDate() + 1);
      setCurrentDate(newD);
      const iso = `${newD.getFullYear()}-${String(newD.getMonth() + 1).padStart(2, '0')}-${String(newD.getDate()).padStart(2, '0')}`;
      setSelectedDayISO(iso);
    }
  };

  const handleToday = () => {
    const today = new Date(2026, 8, 24);
    setCurrentDate(today);
    setSelectedDayISO('2026-09-24');
  };

  const handleJumpToYear = (targetYear: number) => {
    setCurrentDate(new Date(targetYear, month, 1));
  };

  const handleJumpToMonth = (targetMonth: number) => {
    setCurrentDate(new Date(year, targetMonth, 1));
  };

  // Click on a calendar day
  const handleDayClick = (iso: string) => {
    setSelectedDayISO(iso);
  };

  // Open Quick Pay Modal
  const openQuickPay = (est: FieldEstablishment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQuickPayEst(est);

    const remaining = Math.max(0, est.totalDue - est.paidAmount);
    // Proposed amount: next installment or remaining
    const defaultInstallment =
      est.installmentsCount > 1
        ? Math.round(est.totalDue / est.installmentsCount)
        : remaining;
    setPayAmount(Math.min(remaining, defaultInstallment || 25000));

    // Default proposed next date: 14 days later
    const curIso = normalizeDateToISO(est.nextDueDate) || selectedDayISO || '2026-09-24';
    const [y, m, d] = curIso.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 14);
    const nextIso = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    setNextAppointmentDate(nextIso);
  };

  // Date shortcut helper (+X days from current appointment day)
  const setQuickDateOffset = (days: number) => {
    const baseIso = selectedDayISO || '2026-09-24';
    const [y, m, d] = baseIso.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const nextIso = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    setNextAppointmentDate(nextIso);
  };

  // Submit Payment and Trigger Auto-Disappearance & Rescheduling
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayEst) return;

    if (payAmount <= 0) {
      showBanner('Montant invalide', 'Veuillez saisir un montant perçu supérieur à 0 FCFA.');
      return;
    }

    const currentPaid = quickPayEst.paidAmount || 0;
    const newPaidTotal = currentPaid + payAmount;
    const isYearFullySettled = newPaidTotal >= quickPayEst.totalDue && quickPayEst.totalDue > 0;

    let computedNextDueDate: string;
    let toastType: 'success' | 'annual' = 'success';
    let toastTitle = '';
    let toastMsg = '';

    // First payment date extraction
    // If establishment already has a payment history, take earliest date. If not, this is their first payment!
    const effectiveFirstPaymentDate = getFirstPaymentDate(
      quickPayEst,
      formatISOToFR(selectedDayISO || '2026-09-24')
    );
    const renewalNextDueDate = addOneYear(effectiveFirstPaymentDate);

    if (isYearFullySettled) {
      // RULE: Annual exploitation authorization is renewable annually!
      // When an establishment settles the year, the day of its VERY FIRST payment
      // becomes the appointment date for the following year!
      computedNextDueDate = renewalNextDueDate;
      toastType = 'annual';
      toastTitle = `🎉 EXERCICE ANNUEL SOLDÉ : « ${quickPayEst.name} » !`;
      toastMsg = `Autorisation annuelle en règle. Conformément à la réglementation DDL-PN, l'établissement disparaît de l'agenda de ce jour et réapparaît automatiquement au ${computedNextDueDate} (date anniversaire du 1er versement).`;
    } else {
      // Not settled yet: agent selected next appointment date
      if (!nextAppointmentDate) {
        showBanner('Date requise', 'Veuillez sélectionner la date du prochain rendez-vous / acompte.');
        return;
      }
      computedNextDueDate = formatISOToFR(nextAppointmentDate);
      toastType = 'success';
      toastTitle = `Acompte de ${payAmount.toLocaleString('fr-FR')} FCFA Encaissé !`;
      toastMsg = `« ${quickPayEst.name} » disparaît immédiatement du ${formatISOToFR(selectedDayISO)} et est repositionné au ${computedNextDueDate} (Reste dû: ${(quickPayEst.totalDue - newPaidTotal).toLocaleString('fr-FR')} FCFA).`;
    }

    // Receipt Code
    const receiptCode = `REC-DDL-PN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const agentObj = agents.find((a) => a.badgeNumber === selectedAgentBadge) || agents[0];
    const agentLabel = agentObj ? `${agentObj.name} (${agentObj.badgeNumber})` : 'Agent SAA Makosso (SAA-PN-008)';

    const newHistoryEntry = {
      id: receiptCode,
      date: `${formatISOToFR(selectedDayISO)} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      amount: payAmount,
      collectedBy: agentLabel,
      location: payLocation,
      receiptRef: receiptCode,
      nextDueDate: computedNextDueDate,
    };

    // Callback to persist payment and update database
    onRecordPayment(
      quickPayEst,
      payAmount,
      computedNextDueDate,
      payMethod,
      payLocation
    );

    // Build updated establishment
    const updatedEst: FieldEstablishment = {
      ...quickPayEst,
      paidAmount: newPaidTotal,
      nextDueDate: computedNextDueDate,
      status: isYearFullySettled
        ? 'autorise_dgl'
        : quickPayEst.status === 'identifie' || quickPayEst.status === 'convoque'
        ? 'attestation_depot'
        : quickPayEst.status,
      paymentHistory: [newHistoryEntry, ...(quickPayEst.paymentHistory || [])],
    };

    onUpdateEstablishment(updatedEst);

    // Prepare Official Receipt Modal
    setOfficialReceiptModal({
      receiptRef: receiptCode,
      establishmentName: quickPayEst.name,
      promoter: quickPayEst.promoter,
      phone: quickPayEst.phone,
      district: quickPayEst.district,
      amount: payAmount,
      amountInWords: numberToWordsFCFA(payAmount),
      balanceRemaining: Math.max(0, quickPayEst.totalDue - newPaidTotal),
      paymentMethod:
        payMethod === 'ESPECES'
          ? 'Espèces (Cash Régi)'
          : payMethod === 'AIRTEL_MONEY'
          ? 'Airtel Money Mobile'
          : payMethod === 'MTN_MOMO'
          ? 'MTN Mobile Money'
          : 'Chèque Trésor Public',
      location: payLocation === 'TERRAIN' ? 'Perception Mobile de Terrain (SAA)' : 'Guichet Central DDL-PN',
      agentName: agentLabel,
      dateStr: newHistoryEntry.date,
      isYearSettled: isYearFullySettled,
      firstPaymentDate: effectiveFirstPaymentDate,
      nextRenewalDate: renewalNextDueDate,
      nextDueDate: computedNextDueDate,
    });

    // Close quick pay modal
    setQuickPayEst(null);
    showBanner(toastTitle, toastMsg, toastType);
  };

  // Reschedule without payment
  const openReschedule = (est: FieldEstablishment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRescheduleEst(est);
    const curIso = normalizeDateToISO(est.nextDueDate) || selectedDayISO;
    setRescheduleNewDate(curIso);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleEst || !rescheduleNewDate) return;

    const frDate = formatISOToFR(rescheduleNewDate);
    const updated: FieldEstablishment = {
      ...rescheduleEst,
      nextDueDate: frDate,
    };

    onUpdateEstablishment(updated);
    setRescheduleEst(null);
    showBanner(
      'Rendez-vous Déplacé',
      `Le rendez-vous pour « ${rescheduleEst.name} » disparaît de ce jour et a été reprogrammé au ${frDate}. Motif: ${rescheduleReason}.`
    );
  };

  // Open New RDV Modal
  const openNewRdvModal = (dayISO: string) => {
    setSelectedDayForNewRdv(dayISO);
    setShowNewRdvModal(true);
  };

  // Filtered establishments for New RDV existing selection (cloisonné pour les agents)
  const filteredExistingEstablishments = useMemo(() => {
    let list = establishments;
    if (isFieldAgent) {
      list = list.filter((e) => canAccessEstablishment(e));
    }
    if (!newRdvSearchFilter.trim()) return list;
    const q = newRdvSearchFilter.toLowerCase();
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.promoter.toLowerCase().includes(q) ||
        e.district.toLowerCase().includes(q)
    );
  }, [establishments, newRdvSearchFilter, isFieldAgent, canAccessEstablishment]);

  const handleCreateNewRdv = (e: React.FormEvent) => {
    e.preventDefault();
    const frDate = formatISOToFR(selectedDayForNewRdv);

    if (newRdvMode === 'existing') {
      const target = establishments.find((item) => item.id === selectedExistingEstId);
      if (!target) {
        showBanner('Sélection requise', 'Veuillez sélectionner un établissement dans la liste.');
        return;
      }
      const updated: FieldEstablishment = {
        ...target,
        nextDueDate: frDate,
        nextAppointmentType: manualRdvType,
        nextAppointmentTime: manualRdvTime,
      };
      onUpdateEstablishment(updated);
      setShowNewRdvModal(false);
      showBanner(
        'Rendez-vous Programmé',
        `« ${target.name} » a été positionné au ${frDate} à ${manualRdvTime} (${manualRdvType === 'BUREAU' ? 'Convocation Bureau' : 'Visite Terrain'}).`
      );
    } else {
      if (!newEstName.trim()) {
        showBanner('Nom requis', 'Veuillez renseigner le nom de l’établissement.');
        return;
      }

      // 🛡️ VÉRIFICATION STRICTE D'ANTI-COLLISION / ANTI-DOUBLON
      const collision = checkEstablishmentCollision(
        newEstName,
        newEstPhone,
        newEstDistrict,
        establishments
      );
      if (collision.hasCollision && collision.assignedToOther) {
        showBanner(
          '⛔ DOUBLON STRICTEMENT INTERDIT',
          `L'établissement « ${collision.existingEst?.name} » est DÉJÀ PRIS EN CHARGE par votre collègue ${collision.assignedAgentName} (${collision.assignedAgentBadge}) ! Pour préserver la coordination de la direction et éviter les doubles visites sur le terrain, vous ne pouvez pas créer ce dossier.`
        );
        return;
      }

      const totalFee =
        newEstSector === 'formal'
          ? 30000 + 60 * 1200 // 102,000 FCFA
          : newEstNegotiatedAmount;

      const newEst: FieldEstablishment = {
        id: `EST-2026-${String(establishments.length + 1).padStart(3, '0')}`,
        name: newEstName.trim(),
        promoter: newEstPromoter.trim() || 'Exploitant Non Renseigné',
        phone: newEstPhone.trim() || '+242 06 000 00 00',
        district: newEstDistrict,
        address: newEstAddress.trim() || newEstDistrict,
        activityCode: newEstActivity,
        activityLabel:
          newEstActivity === 'ACT-BAR'
            ? 'Bar Standard / Nganda'
            : newEstActivity === 'ACT-CLUB'
            ? 'Night-club & Discothèque'
            : newEstActivity === 'ACT-VIP'
            ? 'VIP Lounge & Salons Privés'
            : newEstActivity === 'ACT-CAVE'
            ? 'Cave & Débit de Boisson'
            : 'Espace Loisirs & Détente',
        sector: newEstSector,
        surfaceSqm: 60,
        identifiedDate: frDate,
        identifiedBy: `${currentAgent.name} (${currentAgent.badgeNumber})`,
        assignedAgentBadge: currentAgent.badgeNumber,
        assignedAgentName: currentAgent.name,
        status: manualRdvType === 'BUREAU' ? 'convoque' : 'identifie',
        filingFee: newEstSector === 'formal' ? 30000 : 0,
        penaltyFee: newEstSector === 'formal' ? 0 : newEstNegotiatedAmount,
        ratePerSqm: 1200,
        totalDue: totalFee,
        installmentsCount: 3,
        paidAmount: 0,
        nextDueDate: frDate,
        nextAppointmentType: manualRdvType,
        nextAppointmentTime: manualRdvTime,
        convocationDate: frDate,
        convocationTime: manualRdvTime,
        convocationOffice: manualRdvOffice,
        paymentHistory: [],
        sanctions:
          manualRdvType === 'BUREAU'
            ? [
                {
                  type: 'CONVOCATION',
                  issuedDate: new Date().toLocaleDateString('fr-FR'),
                  deadline: `Convocation fixée manuellement au ${frDate} à ${manualRdvTime}`,
                  appointmentTime: manualRdvTime,
                  appointmentOffice: manualRdvOffice,
                  reason:
                    'Convocation manuelle au bureau SAA pour régularisation des droits d’exploitation',
                  resolved: false,
                },
              ]
            : [],
      };

      if (onAddNewEstablishment) {
        onAddNewEstablishment(newEst);
      } else {
        onUpdateEstablishment(newEst);
      }

      setShowNewRdvModal(false);
      // Reset form
      setNewEstName('');
      setNewEstPromoter('');
      setNewEstPhone('');
      setCollisionWarning(null);
      showBanner(
        'Nouvel Établissement Enregistré',
        `« ${newEst.name} » a été attribué à votre portefeuille (${currentAgent.name}) et programmé pour le ${frDate} à ${manualRdvTime}.`
      );
    }
  };

  // Selected Day appointments
  const selectedDayEstablishments = eventsByDate.get(selectedDayISO) || [];

  // Week view calculations
  const weekDays = useMemo(() => {
    const cur = new Date(currentDate);
    const dayOfWeek = (cur.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(cur);
    monday.setDate(cur.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        iso,
        dayName: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d),
        dayNumber: d.getDate(),
        isToday: iso === '2026-09-24',
      });
    }
    return days;
  }, [currentDate]);

  return (
    <div className="space-y-4">
      {/* Banner Alert for Instant Rescheduling & Annual Renewal */}
      {bannerAlert && (
        <div
          className={`p-4 rounded-xl shadow-lg border animate-fade-in flex items-start justify-between gap-3 text-white ${
            bannerAlert.type === 'annual'
              ? 'bg-gradient-to-r from-[#006d2f] via-[#022448] to-[#004528] border-[#4ede80]/50 ring-2 ring-[#4ede80]/40'
              : 'bg-[#004528] border-[#4ede80]/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-[#4ede80]">
              {bannerAlert.type === 'annual' ? 'verified' : 'check_circle'}
            </span>
            <div>
              <h4 className="font-bold text-sm tracking-wide text-[#ffe082]">
                {bannerAlert.title}
              </h4>
              <p className="text-xs text-white/90 mt-0.5 leading-relaxed">
                {bannerAlert.msg}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBannerAlert(null)}
            className="text-white/70 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Main Google Calendar Header Bar */}
      <div className="bg-white rounded-2xl border border-[#dde2f3] shadow-sm p-4 sm:p-5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Left: Brand / Title + Prev/Next Controls + Month/Year Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGoogleSidebar((prev) => !prev)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 cursor-pointer transition-colors"
            title="Afficher/Masquer le volet latéral (Google Agenda)"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>

          <div className="flex items-center gap-2 bg-[#f1f3ff] text-[#022448] px-3 py-1.5 rounded-lg border border-[#dde2f3]">
            <span className="material-symbols-outlined text-xl text-[#006d2f]">
              calendar_month
            </span>
            <span className="font-sans text-xs uppercase font-extrabold tracking-wider">
              Agenda Rdv Google SAA
            </span>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-[#dde2f3] font-sans text-xs font-bold text-[#022448] hover:bg-[#f1f3ff] transition-colors cursor-pointer"
          >
            Aujourd&apos;hui
          </button>

          <div className="flex items-center gap-0.5 bg-[#f8f9ff] rounded-lg p-0.5 border border-[#dde2f3]">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 hover:bg-white rounded-md text-[#022448] cursor-pointer transition-colors"
              title="Précédent"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 hover:bg-white rounded-md text-[#022448] cursor-pointer transition-colors"
              title="Suivant"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          {/* Month Dropdown */}
          <select
            value={month}
            onChange={(e) => handleJumpToMonth(Number(e.target.value))}
            className="text-xs bg-white border border-[#dde2f3] rounded-lg px-2.5 py-1.5 font-sans font-bold text-[#022448] focus:outline-none focus:ring-2 focus:ring-[#006d2f] cursor-pointer"
          >
            <option value={0}>Janvier</option>
            <option value={1}>Février</option>
            <option value={2}>Mars</option>
            <option value={3}>Avril</option>
            <option value={4}>Mai</option>
            <option value={5}>Juin</option>
            <option value={6}>Juillet</option>
            <option value={7}>Août</option>
            <option value={8}>Septembre</option>
            <option value={9}>Octobre</option>
            <option value={10}>Novembre</option>
            <option value={11}>Décembre</option>
          </select>

          {/* Year Dropdown */}
          <select
            value={year}
            onChange={(e) => handleJumpToYear(Number(e.target.value))}
            className="text-xs bg-[#022448] text-white border border-[#022448] rounded-lg px-2.5 py-1.5 font-sans font-bold focus:outline-none focus:ring-2 focus:ring-[#4ede80] cursor-pointer"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026 (Exercice Actuel)</option>
            <option value={2027}>2027 (Renouvellements N+1)</option>
            <option value={2028}>2028</option>
          </select>

          {/* Quick jump to Next Year Renewal */}
          <button
            type="button"
            onClick={() => handleJumpToYear(2027)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
              year === 2027
                ? 'bg-[#ffe082] text-[#022448] border-[#ffe082]'
                : 'bg-[#ecfdf5] text-[#065f46] border-[#10b981]/40 hover:bg-[#d1fae5]'
            }`}
            title="Consulter les établissements programmés pour renouvellement annuel l'année prochaine"
          >
            <span className="material-symbols-outlined text-[15px]">event_repeat</span>
            <span>Aller à 2027 ({settledEstablishments.length} Soldés)</span>
          </button>
        </div>

        {/* Right: View Switchers + Filters + Add RDV */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Agent Filter (Admin) or Private Session Badge (Agent) */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 bg-[#f8faff] border border-[#dde2f3] rounded-lg px-2.5 py-1.5 shadow-2xs">
              <span className="material-symbols-outlined text-sm text-[#006d2f]">group</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Vue :</span>
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="text-xs bg-transparent font-bold text-[#022448] focus:outline-none cursor-pointer"
              >
                <option value="TOUS">👥 Tous les agents (Vue Direction)</option>
                {agentsList
                  .filter((a) => a.role === 'Agent de Terrain')
                  .map((a) => (
                    <option key={a.id} value={a.badgeNumber}>
                      {a.name} ({a.badgeNumber})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-emerald-100 shadow-2xs"
              title="Votre session est strictement cloisonnée à vos établissements attribués (Cliquez pour changer d'agent ou entrer votre code PIN)"
            >
              <span className="material-symbols-outlined text-sm text-emerald-600">lock</span>
              <span>Mon Portefeuille : {currentAgent.name}</span>
              <span className="text-[10px] text-emerald-600 font-mono">({currentAgent.badgeNumber})</span>
            </div>
          )}

          {/* View Mode Toggle (Google Calendar Style) */}
          <div className="inline-flex bg-[#f1f3ff] p-0.5 rounded-xl border border-[#dde2f3]">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'month'
                  ? 'bg-white text-[#022448] shadow-sm'
                  : 'text-[#43474e] hover:text-[#022448]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">calendar_view_month</span>
              <span>Mois</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'week'
                  ? 'bg-white text-[#022448] shadow-sm'
                  : 'text-[#43474e] hover:text-[#022448]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">calendar_view_week</span>
              <span>Semaine</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'day'
                  ? 'bg-white text-[#022448] shadow-sm'
                  : 'text-[#43474e] hover:text-[#022448]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">calendar_view_day</span>
              <span>Jour</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'agenda'
                  ? 'bg-white text-[#022448] shadow-sm'
                  : 'text-[#43474e] hover:text-[#022448]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_agenda</span>
              <span>Planning</span>
            </button>
          </div>

          {/* District Filter */}
          <select
            value={filterArrondissement}
            onChange={(e) => setFilterArrondissement(e.target.value)}
            className="text-xs bg-white border border-[#dde2f3] rounded-lg px-2.5 py-1.5 font-sans font-semibold text-[#022448] focus:outline-none focus:ring-2 focus:ring-[#006d2f]"
          >
            <option value="TOUS">Tous Arrondissements</option>
            <option value="Lumumba">Arr. 1 Lumumba</option>
            <option value="Mvoumvou">Arr. 2 Mvoumvou</option>
            <option value="Tié-Tié">Arr. 3 Tié-Tié</option>
            <option value="Louandjili">Arr. 4 Louandjili</option>
            <option value="Mongo">Arr. 5 Mongo-Mpoukou</option>
            <option value="Ngoyo">Arr. 6 Ngoyo</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-white border border-[#dde2f3] rounded-lg px-2.5 py-1.5 font-sans font-semibold text-[#022448] focus:outline-none focus:ring-2 focus:ring-[#006d2f]"
          >
            <option value="TOUS">Tous Statuts</option>
            <option value="EN_COURS">À Encaisser / Acompte</option>
            <option value="SOLDE">Soldé (Renouvellement Annuel N+1)</option>
            <option value="RETARD">Échéance Échue / Retard</option>
          </select>

          {/* Button to view all Settled Establishments & their Renewal Dates */}
          <button
            type="button"
            onClick={() => setShowSettledListModal(true)}
            className="bg-[#022448] hover:bg-[#001730] text-[#ffe082] font-sans text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ouvrir le registre des établissements ayant soldé et la date de renouvellement"
          >
            <span className="material-symbols-outlined text-[15px]">verified</span>
            <span>Soldés ({settledEstablishments.length})</span>
          </button>

          {/* Quick Add Button Google style */}
          <button
            type="button"
            onClick={() => openNewRdvModal(selectedDayISO)}
            className="bg-[#006d2f] hover:bg-[#005524] text-white font-sans text-xs uppercase font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cliquer pour enregistrer un établissement ou planifier un acompte sur la date sélectionnée"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ Nouveau Rendez-vous</span>
          </button>
        </div>
      </div>

      {/* Main View Area: Side by Side with Google Calendar Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Google Calendar Left Sidebar (Mini-Calendar + Portefeuilles) */}
        {showGoogleSidebar && (
          <div className="w-full lg:w-64 bg-white rounded-2xl border border-[#dde2f3] shadow-sm p-4 space-y-4 shrink-0">
            {/* Big Google "+ Créer" style button */}
            <button
              type="button"
              onClick={() => openNewRdvModal(selectedDayISO)}
              className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 border border-gray-200 shadow-md hover:shadow-lg transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-500 to-blue-500 flex items-center justify-center text-white shadow-xs group-hover:rotate-90 transition-transform">
                <span className="material-symbols-outlined text-lg">add</span>
              </div>
              <span className="font-bold text-xs text-gray-800 tracking-wide uppercase">
                + Nouveau Rendez-vous
              </span>
            </button>

            {/* Interactive Mini-Month Datepicker */}
            <div className="border border-gray-100 rounded-xl p-2.5 bg-slate-50/60">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-2 px-1">
                <span className="capitalize">{monthName}</span>
                <div className="flex items-center gap-1 text-gray-600">
                  <button type="button" onClick={handlePrev} className="p-0.5 hover:bg-white rounded">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button type="button" onClick={handleNext} className="p-0.5 hover:bg-white rounded">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-1">
                <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
              </div>
              <div className="grid grid-cols-7 text-center gap-y-1 text-xs">
                {calendarDays.slice(0, 35).map((d) => {
                  const hasEvents = (eventsByDate.get(d.iso) || []).length > 0;
                  const isSel = d.iso === selectedDayISO;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => handleDayClick(d.iso)}
                      className={`w-6 h-6 mx-auto rounded-full flex flex-col items-center justify-center text-[11px] font-semibold transition-all relative ${
                        isSel
                          ? 'bg-[#006d2f] text-white font-bold'
                          : d.isToday
                          ? 'bg-[#022448] text-white font-bold'
                          : d.isCurrentMonth
                          ? 'text-gray-700 hover:bg-gray-200'
                          : 'text-gray-300'
                      }`}
                    >
                      <span>{d.dayNumber}</span>
                      {hasEvents && !isSel && (
                        <span className="w-1 h-1 rounded-full bg-[#006d2f] absolute bottom-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catégories & Types d'Agenda */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Types de rendez-vous
              </div>
              <div className="space-y-1.5 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
                  <span className="truncate">🏢 Convocation Bureau (Manuel)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0" />
                  <span className="truncate">📍 Visite Terrain Recouvrement</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shrink-0" />
                  <span className="truncate">🔄 Soldé (Anniversaire +1 an)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0" />
                  <span className="truncate">⚠️ Relance / Retard</span>
                </div>
              </div>
            </div>

            {/* Portefeuilles Agents (Admin) ou Isolation (Agent) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {isAdmin ? 'Agents de Terrain DDL-PN' : 'Mon Portefeuille Exclusif'}
              </div>
              {isAdmin ? (
                <div className="space-y-1 text-xs">
                  {agentsList.map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() =>
                        setSelectedAgentFilter(
                          selectedAgentFilter === ag.badgeNumber ? 'TOUS' : ag.badgeNumber
                        )
                      }
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors text-left ${
                        selectedAgentFilter === ag.badgeNumber
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ag.color || '#004528' }}
                        />
                        <span className="truncate text-[11px]">{ag.name.split(' ')[0]} {ag.name.split(' ')[1] || ''}</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-400">{ag.badgeNumber.replace('SAA-', '')}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-emerald-600">lock</span>
                    <span>Session Isolée & Sécurisée</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-tight">
                    Vos collègues ne peuvent pas consulter vos dossiers.
                  </p>
                </div>
              )}
            </div>

            {/* Anti-collision shield badge */}
            <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-[#006d2f]">shield</span>
              <span>Base Unique Supabase • Anti-doublon</span>
            </div>
          </div>
        )}

        {/* Main View Area: Month, Week, Day or Agenda */}
        <div className="flex-1 w-full min-w-0 grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Left Column (3 or 4 cols): Calendar Grid or Agenda Timeline */}
        <div className={`${viewMode === 'agenda' ? 'xl:col-span-4' : 'xl:col-span-3'} bg-white rounded-2xl border border-[#dde2f3] shadow-sm overflow-hidden flex flex-col`}>
          {/* SEARCH BAR & SUMMARY */}
          <div className="p-3 bg-[#f8f9ff] border-b border-[#dde2f3] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Rechercher par nom d'établissement, promoteur, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#dde2f3] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#006d2f]"
              />
            </div>
            <div className="flex items-center gap-3 text-gray-600 font-sans text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
                <span>Acompte dû</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                <span>Soldé (Renouv. +1 an)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                <span>Échu / Retard</span>
              </span>
            </div>
          </div>

          {/* VIEW: MONTH */}
          {viewMode === 'month' && (
            <div className="flex-1 flex flex-col">
              {/* Day header */}
              <div className="grid grid-cols-7 border-b border-[#dde2f3] bg-[#f1f3ff] text-center text-xs font-bold text-[#022448] py-2">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mer</div>
                <div>Jeu</div>
                <div>Ven</div>
                <div>Sam</div>
                <div>Dim</div>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 auto-rows-fr flex-1 divide-x divide-y divide-[#dde2f3] min-h-[580px]">
                {calendarDays.map((day) => {
                  const dayEvents = eventsByDate.get(day.iso) || [];
                  const isSelected = day.iso === selectedDayISO;

                  return (
                    <div
                      key={day.iso}
                      onClick={() => handleDayClick(day.iso)}
                      onDoubleClick={() => openNewRdvModal(day.iso)}
                      className={`min-h-[110px] p-1.5 flex flex-col transition-all cursor-pointer relative group ${
                        !day.isCurrentMonth
                          ? 'bg-[#fcfcff] text-gray-400'
                          : isSelected
                          ? 'bg-[#eaf1ff] ring-2 ring-[#022448] ring-inset z-10'
                          : 'bg-white hover:bg-[#f6f8ff]'
                      }`}
                      title="Cliquer pour sélectionner • Double-cliquer pour enregistrer un établissement ce jour"
                    >
                      {/* Top Day Header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                            day.isToday
                              ? 'bg-[#022448] text-white shadow-sm ring-1 ring-[#ffe082]'
                              : isSelected
                              ? 'bg-[#006d2f] text-white font-extrabold'
                              : 'text-gray-700'
                          }`}
                        >
                          {day.dayNumber}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e0e7ff] text-[#022448]">
                            {dayEvents.length} rdv
                          </span>
                        )}

                        {/* Instant Quick Add Button: Always accessible on hover or click */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openNewRdvModal(day.iso);
                          }}
                          className="opacity-40 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-[#d5e3ff] rounded text-[#022448]"
                          title="Enregistrer un établissement ou planifier un acompte ce jour"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#006d2f]">add_circle</span>
                        </button>
                      </div>

                      {/* Event Chips (Google Calendar Style) */}
                      <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] pr-0.5 scrollbar-thin">
                        {dayEvents.slice(0, 3).map((est) => {
                          const isSettled =
                            est.paidAmount >= est.totalDue && est.totalDue > 0;
                          const isOverdue =
                            day.iso < '2026-09-24' && !isSettled;

                          const chipColor = isSettled
                            ? 'bg-[#ecfdf5] border-[#10b981] text-[#065f46] hover:bg-[#d1fae5]'
                            : isOverdue
                            ? 'bg-[#fef2f2] border-[#ef4444] text-[#991b1b] hover:bg-[#fee2e2]'
                            : 'bg-[#fff7ed] border-[#f97316] text-[#9a3412] hover:bg-[#ffedd5]';

                          return (
                            <div
                              key={est.id}
                              onClick={(e) => openQuickPay(est, e)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-medium border flex items-center justify-between gap-1 shadow-xs transition-colors cursor-pointer ${chipColor}`}
                              title={`Cliquer pour encaisser : ${est.name} (Reste : ${(est.totalDue - est.paidAmount).toLocaleString('fr-FR')} F)`}
                            >
                              <span className="truncate font-semibold max-w-[85px]">
                                {est.name}
                              </span>
                              <span className="text-[9px] font-bold shrink-0">
                                {isSettled ? 'Soldé ✓' : `${Math.round((est.totalDue - est.paidAmount) / 1000)}k F`}
                              </span>
                            </div>
                          );
                        })}

                        {dayEvents.length > 3 && (
                          <div className="text-[9px] font-bold text-gray-500 pl-1">
                            +{dayEvents.length - 3} autres...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: WEEK */}
          {viewMode === 'week' && (
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-7 border-b border-[#dde2f3] bg-[#f1f3ff] text-center text-xs py-2 divide-x divide-[#dde2f3]">
                {weekDays.map((wd) => (
                  <div
                    key={wd.iso}
                    onClick={() => handleDayClick(wd.iso)}
                    className={`cursor-pointer transition-colors p-1 ${
                      wd.iso === selectedDayISO ? 'bg-[#dce6f9]' : 'hover:bg-white'
                    }`}
                  >
                    <span className="text-gray-500 capitalize block text-[10px]">
                      {wd.dayName}
                    </span>
                    <span
                      className={`inline-block font-bold text-sm px-2 py-0.5 rounded-full ${
                        wd.isToday
                          ? 'bg-[#022448] text-white'
                          : wd.iso === selectedDayISO
                          ? 'bg-[#006d2f] text-white'
                          : 'text-[#022448]'
                      }`}
                    >
                      {wd.dayNumber}
                    </span>
                  </div>
                ))}
              </div>

              {/* Week slots */}
              <div className="grid grid-cols-7 flex-1 divide-x divide-[#dde2f3] min-h-[480px]">
                {weekDays.map((wd) => {
                  const evts = eventsByDate.get(wd.iso) || [];
                  return (
                    <div
                      key={wd.iso}
                      onClick={() => handleDayClick(wd.iso)}
                      className={`p-2 space-y-1.5 flex flex-col cursor-pointer transition-colors ${
                        wd.iso === selectedDayISO ? 'bg-[#f4f7ff]' : 'hover:bg-[#fafbff]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-gray-400 border-b pb-1">
                        <span>{evts.length} rdv</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openNewRdvModal(wd.iso);
                          }}
                          className="hover:text-[#006d2f]"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>

                      {evts.map((est) => {
                        const isSettled = est.paidAmount >= est.totalDue && est.totalDue > 0;
                        return (
                          <div
                            key={est.id}
                            onClick={(e) => openQuickPay(est, e)}
                            className={`p-1.5 rounded-lg text-xs border font-sans cursor-pointer transition-shadow shadow-xs ${
                              isSettled
                                ? 'bg-[#ecfdf5] border-[#10b981] text-[#065f46]'
                                : 'bg-[#fff7ed] border-[#f97316] text-[#9a3412]'
                            }`}
                          >
                            <p className="font-bold text-[11px] truncate">{est.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{est.promoter}</p>
                            <div className="flex justify-between items-center text-[9px] font-bold mt-1">
                              <span>{isSettled ? 'Soldé Annuel' : 'Reste:'}</span>
                              <span>
                                {isSettled
                                  ? '✓'
                                  : `${(est.totalDue - est.paidAmount).toLocaleString('fr-FR')} F`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: DAY */}
          {viewMode === 'day' && (
            <div className="p-5 flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-garamond text-xl font-bold text-[#022448]">
                    Planning Détaillé du {formatISOToFR(selectedDayISO)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedDayEstablishments.length} établissement(s) programmé(s) pour visite / perception.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openNewRdvModal(selectedDayISO)}
                  className="bg-[#006d2f] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Ajouter sur ce jour</span>
                </button>
              </div>

              {selectedDayEstablishments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">
                    event_busy
                  </span>
                  <p className="text-sm">Aucun rendez-vous fixé pour ce jour.</p>
                  <button
                    type="button"
                    onClick={() => openNewRdvModal(selectedDayISO)}
                    className="mt-3 text-xs text-[#006d2f] font-bold hover:underline cursor-pointer"
                  >
                    + Enregistrer une visite ou planifier un acompte
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEstablishments.map((est) => {
                    const isSettled = est.paidAmount >= est.totalDue && est.totalDue > 0;
                    const remaining = Math.max(0, est.totalDue - est.paidAmount);

                    return (
                      <div
                        key={est.id}
                        className="bg-[#fcfcff] border border-[#dde2f3] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#022448]">
                              {est.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                est.sector === 'formal'
                                  ? 'bg-[#dce6f9] text-[#022448]'
                                  : 'bg-[#fef3c7] text-[#92400e]'
                              }`}
                            >
                              {est.sector === 'formal' ? 'Piste Formelle (RCCM)' : 'Piste Informelle'}
                            </span>
                            {isSettled && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#065f46]">
                                Soldé Annuel
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            <strong>Exploitant :</strong> {est.promoter} • <strong>Tél :</strong>{' '}
                            {est.phone} • <strong>Zone :</strong> {est.district}
                          </p>
                          <div className="flex items-center gap-3 text-xs pt-1">
                            <span className="text-[#006d2f] font-bold">
                              Payé : {est.paidAmount.toLocaleString('fr-FR')} FCFA
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-[#991b1b] font-bold">
                              Reste dû : {remaining.toLocaleString('fr-FR')} FCFA
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600 font-medium">
                              Total fixé : {est.totalDue.toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <button
                            type="button"
                            onClick={() => openQuickPay(est)}
                            className="flex-1 md:flex-initial bg-[#006d2f] hover:bg-[#005524] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span className="material-symbols-outlined text-base">payments</span>
                            <span>Encaisser Acompte</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openReschedule(est)}
                            className="bg-white hover:bg-gray-50 border border-[#dde2f3] text-[#022448] text-xs font-bold px-2.5 py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                            title="Reporter le rendez-vous"
                          >
                            <span className="material-symbols-outlined text-base">update</span>
                            <span>Reporter</span>
                          </button>

                          <a
                            href={`https://wa.me/${est.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Bonjour M. ${est.promoter}, nous vous confirmons le passage de l'agent de la Direction Départementale des Loisirs (DDL-PN) ce jour concernant votre acompte d'autorisation.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#25D366] hover:bg-[#20ba5a] text-white p-2 rounded-lg flex items-center justify-center cursor-pointer"
                            title="Contacter sur WhatsApp"
                          >
                            <span className="material-symbols-outlined text-base">chat</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: AGENDA (PLANNING LIST STYLE GOOGLE CALENDAR) */}
          {viewMode === 'agenda' && (
            <div className="p-5 flex-1 flex flex-col space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-garamond text-xl font-bold text-[#022448] flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-[#006d2f]">
                      view_agenda
                    </span>
                    <span>Planning Chronologique des Rendez-vous &amp; Convocations</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Vue ordonnée par date de toutes les échéances prévues dans votre portefeuille DDL-PN.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openNewRdvModal(selectedDayISO)}
                  className="bg-[#006d2f] hover:bg-[#005524] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>+ Nouveau Rendez-vous</span>
                </button>
              </div>

              {upcomingAgendaEvents.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-3 text-gray-300">
                    event_available
                  </span>
                  <p className="text-base font-semibold text-gray-600">Aucun rendez-vous planifié dans cette sélection.</p>
                  <p className="text-xs text-gray-400 mt-1">Utilisez le bouton "+ Nouveau Rendez-vous" pour programmer une visite de terrain ou une convocation.</p>
                  <button
                    type="button"
                    onClick={() => openNewRdvModal(selectedDayISO)}
                    className="mt-4 px-4 py-2 bg-[#006d2f] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Programmer un rendez-vous</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingAgendaEvents.map((group) => (
                    <div key={group.iso} className="space-y-2">
                      <div className="flex items-center gap-2 border-b border-[#dde2f3] pb-1.5">
                        <span
                          className={`font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            group.isToday
                              ? 'bg-[#006d2f] text-white'
                              : 'bg-[#e8eeff] text-[#022448]'
                          }`}
                        >
                          {group.isToday ? 'AUJOURD\'HUI' : group.frDate}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 capitalize">
                          {group.dayName}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          ({group.establishments.length} rdv)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.establishments.map((est) => {
                          const isSettled = est.paidAmount >= est.totalDue && est.totalDue > 0;
                          const remaining = Math.max(0, est.totalDue - est.paidAmount);
                          const assignedColor =
                            agents.find((a) => a.badgeNumber === est.assignedAgentBadge)?.color ||
                            '#006d2f';

                          return (
                            <div
                              key={est.id}
                              className="bg-white border border-[#dde2f3] rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                              style={{ borderLeftWidth: 4, borderLeftColor: assignedColor }}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-[#022448] truncate">
                                      {est.name}
                                    </h4>
                                    <p className="text-[11px] text-gray-500 truncate">
                                      {est.promoter} • {est.district}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0 ${
                                      isSettled
                                        ? 'bg-[#dcfce7] text-[#065f46]'
                                        : 'bg-[#fff7ed] text-[#9a3412]'
                                    }`}
                                  >
                                    {isSettled ? 'Soldé Annuel' : `${Math.round(remaining / 1000)}k F dû`}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                                    {est.nextAppointmentTime || '09:30'}
                                  </span>
                                  <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-semibold">
                                    {est.nextAppointmentType === 'BUREAU' ? '🏢 Convocation Bureau' : '📍 Visite Terrain'}
                                  </span>
                                  {isAdmin && est.assignedAgentName && (
                                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium">
                                      👤 {est.assignedAgentName}
                                    </span>
                                  )}
                                </div>

                                <div className="bg-[#f8f9ff] p-2 rounded-lg text-[11px] flex items-center justify-between">
                                  <span className="text-gray-500">Avancement :</span>
                                  <span className="font-bold text-[#006d2f]">
                                    {est.paidAmount.toLocaleString('fr-FR')} / {est.totalDue.toLocaleString('fr-FR')} F
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => openQuickPay(est)}
                                  className="flex-1 bg-[#006d2f] hover:bg-[#005524] text-white text-xs font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-sm">payments</span>
                                  <span>Encaisser</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openReschedule(est)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Reporter le rendez-vous"
                                >
                                  <span className="material-symbols-outlined text-sm">update</span>
                                  <span>Reporter</span>
                                </button>
                                <a
                                  href={`https://wa.me/${est.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Bonjour M. ${est.promoter}, nous vous confirmons votre rendez-vous avec la Direction Départementale des Loisirs (DDL-PN).`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white p-1.5 rounded-lg flex items-center justify-center cursor-pointer"
                                  title="WhatsApp Promoteur"
                                >
                                  <span className="material-symbols-outlined text-sm">chat</span>
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 col): Selected Day Detail & Instant Actions */}
        {viewMode !== 'agenda' && (
          <div className="bg-white rounded-2xl border border-[#dde2f3] shadow-sm p-4 flex flex-col space-y-4">
          <div className="border-b border-[#dde2f3] pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-sans uppercase font-bold text-gray-400">
                Rendez-vous du jour
              </span>
              <h3 className="font-garamond text-xl font-bold text-[#022448]">
                {formatISOToFR(selectedDayISO)}
              </h3>
              <p className="text-xs text-[#006d2f] font-semibold mt-0.5">
                {selectedDayEstablishments.length} établissement(s) prévu(s)
              </p>
            </div>
            <button
              type="button"
              onClick={() => openNewRdvModal(selectedDayISO)}
              className="p-1.5 bg-[#f1f3ff] hover:bg-[#006d2f] text-[#022448] hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Ajouter un établissement sur ce jour"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>

          {/* Quick List for Selected Day */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
            {selectedDayEstablishments.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-xs bg-[#f8f9ff] rounded-xl border border-dashed border-[#dde2f3]">
                <span className="material-symbols-outlined text-2xl text-gray-300 block mb-1">
                  event_available
                </span>
                <p>Aucun établissement fixé pour ce jour.</p>
                <button
                  type="button"
                  onClick={() => openNewRdvModal(selectedDayISO)}
                  className="mt-2 text-[#006d2f] font-bold text-xs hover:underline block mx-auto cursor-pointer"
                >
                  + Fixer un rendez-vous
                </button>
              </div>
            ) : (
              selectedDayEstablishments.map((est) => {
                const isSettled =
                  est.paidAmount >= est.totalDue && est.totalDue > 0;
                const remaining = Math.max(0, est.totalDue - est.paidAmount);

                return (
                  <div
                    key={est.id}
                    className="p-3 rounded-xl border border-[#dde2f3] bg-[#fafbff] space-y-2 hover:border-[#022448] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-xs text-[#022448] leading-tight">
                        {est.name}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isSettled
                            ? 'bg-[#ecfdf5] text-[#065f46]'
                            : 'bg-[#fff7ed] text-[#c2410c]'
                        }`}
                      >
                        {isSettled ? 'Soldé' : 'Acompte'}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-600 space-y-0.5">
                      <div>
                        <strong>Promoteur :</strong> {est.promoter}
                      </div>
                      <div>
                        <strong>Téléphone :</strong> {est.phone}
                      </div>
                      <div>
                        <strong>Lieu :</strong> {est.district}
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between text-xs font-sans">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Déjà versé</span>
                        <span className="font-bold text-[#006d2f]">
                          {est.paidAmount.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Reste dû</span>
                        <span className="font-bold text-[#991b1b]">
                          {remaining.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                    </div>

                    {/* Instant Action buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => openQuickPay(est)}
                        className="bg-[#006d2f] hover:bg-[#005524] text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm">payments</span>
                        <span>Encaisser</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openReschedule(est)}
                        className="bg-white hover:bg-gray-100 text-[#022448] border border-[#dde2f3] text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">event</span>
                        <span>Reporter</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Schedule Button at Bottom */}
          <button
            type="button"
            onClick={() => openNewRdvModal(selectedDayISO)}
            className="w-full bg-[#006d2f] hover:bg-[#005223] text-white font-sans text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Programmer sur le {formatISOToFR(selectedDayISO)}</span>
          </button>
        </div>
        )}
      </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ENCAISSER UN ACOMPTE ET CHOISIR DATE DU PROCHAIN RENDEZ-VOUS     */}
      {/* ========================================================================= */}
      {quickPayEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#dde2f3]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#022448] via-[#004528] to-[#022448] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-[#ffe082]">
                    receipt_long
                  </span>
                </div>
                <div>
                  <h3 className="font-garamond text-lg font-bold leading-tight">
                    Encaisser un Acompte &amp; Déplacer Rdv
                  </h3>
                  <p className="text-xs text-white/80">
                    {quickPayEst.name} • {quickPayEst.promoter} ({quickPayEst.district})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPayEst(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-2 bg-[#f8f9ff] p-3 rounded-xl border border-[#dde2f3] text-center text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Total Dû Fixé</span>
                  <span className="font-bold text-[#022448]">
                    {quickPayEst.totalDue.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Déjà Versé</span>
                  <span className="font-bold text-[#006d2f]">
                    {quickPayEst.paidAmount.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Reste Actuel</span>
                  <span className="font-bold text-[#991b1b]">
                    {Math.max(0, quickPayEst.totalDue - quickPayEst.paidAmount).toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>

              {/* Amount to Collect */}
              <div>
                <label className="block text-xs font-bold text-[#022448] mb-1">
                  Montant Perçu sur le Terrain (FCFA) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    payments
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-bold text-[#022448] bg-white border border-[#dde2f3] rounded-xl focus:ring-2 focus:ring-[#006d2f] focus:outline-none"
                    placeholder="ex: 25000"
                  />
                </div>
                {/* Shortcut amount buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPayAmount(
                        Math.max(0, quickPayEst.totalDue - quickPayEst.paidAmount)
                      )
                    }
                    className="text-[10px] font-bold text-[#006d2f] bg-[#eafaf1] px-2.5 py-1 rounded-lg border border-[#86efac] hover:bg-[#d4f5e2] cursor-pointer"
                  >
                    Régler la totalité (Soldé)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(20000)}
                    className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-200 cursor-pointer"
                  >
                    20 000 F
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(50000)}
                    className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-200 cursor-pointer"
                  >
                    50 000 F
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(100000)}
                    className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-200 cursor-pointer"
                  >
                    100 000 F
                  </button>
                </div>
              </div>

              {/* AUTOMATION EXPLANATION BOX */}
              {quickPayEst.paidAmount + payAmount >= quickPayEst.totalDue && quickPayEst.totalDue > 0 ? (
                <div className="p-3.5 bg-gradient-to-br from-[#ecfdf5] to-[#f0fdf4] border-2 border-[#10b981] rounded-xl text-xs text-[#065f46] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#047857]">
                    <span className="material-symbols-outlined text-xl text-[#10b981]">
                      celebration
                    </span>
                    <span>EXERCICE 2026 SOLDÉ À 100% !</span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg border border-[#a7f3d0] space-y-1">
                    <p className="text-[11px] leading-relaxed">
                      📜 <strong>Règle Administrative Régalienne :</strong> L&apos;autorisation d&apos;exploitation est <strong>annuelle et renouvelable</strong>.
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      📅 <strong>Date du 1er versement :</strong>{' '}
                      <span className="font-bold underline text-[#022448]">
                        {getFirstPaymentDate(quickPayEst, formatISOToFR(selectedDayISO))}
                      </span>
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      🔄 <strong>Prochain paiement de renouvellement annuel (N+1) :</strong>{' '}
                      <span className="font-extrabold text-[#006d2f] text-xs">
                        {addOneYear(getFirstPaymentDate(quickPayEst, formatISOToFR(selectedDayISO)))}
                      </span>
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-600 italic">
                    ⚡ <em>Dès validation, l&apos;établissement disparaît immédiatement du calendrier de cette année et est automatiquement reprogrammé à la date anniversaire l&apos;année prochaine.</em>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#022448]">
                      Date du Prochain Rendez-vous / Acompte <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Reste après paiement: {(quickPayEst.totalDue - (quickPayEst.paidAmount + payAmount)).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    value={nextAppointmentDate}
                    onChange={(e) => setNextAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#dde2f3] rounded-xl font-bold text-[#022448] focus:ring-2 focus:ring-[#006d2f] focus:outline-none"
                  />
                  {/* Quick date shortcuts */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[10px] text-gray-400 self-center">Raccourcis :</span>
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(7)}
                      className="text-[10px] font-semibold bg-[#f1f3ff] hover:bg-[#dce6f9] text-[#022448] px-2 py-0.5 rounded cursor-pointer"
                    >
                      +7 jours
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(14)}
                      className="text-[10px] font-semibold bg-[#f1f3ff] hover:bg-[#dce6f9] text-[#022448] px-2 py-0.5 rounded cursor-pointer"
                    >
                      +14 jours
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(21)}
                      className="text-[10px] font-semibold bg-[#f1f3ff] hover:bg-[#dce6f9] text-[#022448] px-2 py-0.5 rounded cursor-pointer"
                    >
                      +21 jours
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDateOffset(30)}
                      className="text-[10px] font-semibold bg-[#f1f3ff] hover:bg-[#dce6f9] text-[#022448] px-2 py-0.5 rounded cursor-pointer"
                    >
                      +1 mois
                    </button>
                  </div>
                  <p className="text-[11px] text-[#006d2f] font-medium bg-[#f0fdf4] p-2 rounded-lg border border-[#bbf7d0]">
                    💡 <em>L&apos;établissement disparaît instantanément de la date d&apos;aujourd&apos;hui ({formatISOToFR(selectedDayISO)}) et réapparaîtra automatiquement à cette nouvelle date dans l&apos;agenda.</em>
                  </p>
                </div>
              )}

              {/* Payment Method & Location */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-[#022448] mb-1">Mode de Paiement</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full p-2 bg-white border border-[#dde2f3] rounded-lg font-semibold"
                  >
                    <option value="ESPECES">Espèces (Cash Régi)</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="MTN_MOMO">MTN Mobile Money</option>
                    <option value="CHEQUE_TRESOR">Chèque Trésor Public</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#022448] mb-1">Canal de Perception</label>
                  <select
                    value={payLocation}
                    onChange={(e) => setPayLocation(e.target.value as 'TERRAIN' | 'DIRECTION')}
                    className="w-full p-2 bg-white border border-[#dde2f3] rounded-lg font-semibold"
                  >
                    <option value="TERRAIN">Terrain Mobile (Agent SAA)</option>
                    <option value="DIRECTION">Guichet Central Direction</option>
                  </select>
                </div>
              </div>

              {/* Agent In Charge */}
              <div>
                <label className="block text-xs font-bold text-[#022448] mb-1">Agent Collecteur Assermenté</label>
                <select
                  value={selectedAgentBadge}
                  onChange={(e) => setSelectedAgentBadge(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-[#dde2f3] rounded-lg font-semibold"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.badgeNumber}>
                      {ag.name} — Badge N° {ag.badgeNumber} ({ag.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#dde2f3]">
                <button
                  type="button"
                  onClick={() => setQuickPayEst(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#006d2f] hover:bg-[#005524] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>Enregistrer &amp; Déplacer Automatiquement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REPORTER / REPROGRAMMER SANS PAIEMENT                            */}
      {/* ========================================================================= */}
      {rescheduleEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#dde2f3]">
            <div className="bg-[#022448] text-white p-4 flex items-center justify-between">
              <h3 className="font-garamond text-base font-bold">
                Reporter le Rendez-vous de Terrain
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleEst(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="p-5 space-y-4">
              <div>
                <span className="text-xs text-gray-400 block">Établissement</span>
                <span className="font-bold text-sm text-[#022448]">
                  {rescheduleEst.name}
                </span>
                <p className="text-xs text-gray-500">
                  Exploitant : {rescheduleEst.promoter} • {rescheduleEst.phone}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#022448] mb-1">
                  Nouvelle Date du Rendez-vous <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleNewDate}
                  onChange={(e) => setRescheduleNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#dde2f3] rounded-xl font-bold text-[#022448]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#022448] mb-1">
                  Motif du Report
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="ex: Promoteur en déplacement, report convenu"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#dde2f3] rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#dde2f3]">
                <button
                  type="button"
                  onClick={() => setRescheduleEst(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#022448] text-white text-xs font-bold px-4 py-2 rounded-xl shadow cursor-pointer"
                >
                  Reprogrammer &amp; Déplacer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PROGRAMMER UN RDV SUR CE JOUR / CRÉER ÉTABLISSEMENT              */}
      {/* ========================================================================= */}
      {showNewRdvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#dde2f3]">
            <div className="bg-gradient-to-r from-[#022448] to-[#006d2f] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-garamond text-lg font-bold">
                  Programmer sur le {formatISOToFR(selectedDayForNewRdv)}
                </h3>
                <p className="text-xs text-white/80">
                  Planifier un acompte pour un établissement existant ou en créer un nouveau.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewRdvModal(false)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateNewRdv} className="p-5 space-y-4">
              {/* Mode Toggle */}
              <div className="flex bg-[#f1f3ff] p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setNewRdvMode('existing')}
                  className={`flex-1 py-2 rounded-lg text-center cursor-pointer transition-colors ${
                    newRdvMode === 'existing'
                      ? 'bg-white text-[#022448] shadow-sm'
                      : 'text-gray-500 hover:text-[#022448]'
                  }`}
                >
                  1. Établissement Déjà Recensé
                </button>
                <button
                  type="button"
                  onClick={() => setNewRdvMode('new')}
                  className={`flex-1 py-2 rounded-lg text-center cursor-pointer transition-colors ${
                    newRdvMode === 'new'
                      ? 'bg-white text-[#022448] shadow-sm'
                      : 'text-gray-500 hover:text-[#022448]'
                  }`}
                >
                  2. Créer Nouveau sur le Terrain
                </button>
              </div>

              {newRdvMode === 'existing' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#022448] mb-1">
                      Filtrer par nom ou promoteur
                    </label>
                    <input
                      type="text"
                      placeholder="Tapez pour filtrer la liste..."
                      value={newRdvSearchFilter}
                      onChange={(e) => setNewRdvSearchFilter(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-[#dde2f3] rounded-lg mb-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#022448] mb-1">
                      Sélectionner l&apos;établissement ({filteredExistingEstablishments.length} trouvé(s)) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedExistingEstId}
                      onChange={(e) => setSelectedExistingEstId(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-[#dde2f3] rounded-xl font-medium focus:ring-2 focus:ring-[#006d2f]"
                      size={5}
                    >
                      {filteredExistingEstablishments.map((est) => (
                        <option key={est.id} value={est.id} className="py-1">
                          {est.name} — {est.district} (Actuel: {est.nextDueDate} • Reste: {(est.totalDue - est.paidAmount).toLocaleString('fr-FR')} F)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#022448] mb-1">
                      Nom de l&apos;Établissement <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Espace Culturel Le Makélékélé"
                      value={newEstName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewEstName(val);
                        const col = checkEstablishmentCollision(val, newEstPhone, newEstDistrict, establishments);
                        setCollisionWarning(col.hasCollision ? col : null);
                      }}
                      className="w-full p-2 text-xs bg-white border border-[#dde2f3] rounded-xl focus:ring-2 focus:ring-[#006d2f]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#022448] mb-1">
                        Promoteur / Gérant
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Jean Mboungou"
                        value={newEstPromoter}
                        onChange={(e) => setNewEstPromoter(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-[#dde2f3] rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#022448] mb-1">
                        Téléphone
                      </label>
                      <input
                        type="text"
                        placeholder="+242 06..."
                        value={newEstPhone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewEstPhone(val);
                          const col = checkEstablishmentCollision(newEstName, val, newEstDistrict, establishments);
                          setCollisionWarning(col.hasCollision ? col : null);
                        }}
                        className="w-full p-2 text-xs bg-white border border-[#dde2f3] rounded-xl focus:ring-2 focus:ring-[#006d2f]"
                      />
                    </div>
                  </div>

                  {/* 🛡️ Alerte Anti-Collision en direct */}
                  {collisionWarning && collisionWarning.hasCollision && (
                    <div className="p-3 bg-red-50 border-2 border-red-400 rounded-xl text-xs text-red-900 shadow-sm animate-pulse">
                      <div className="flex items-center gap-1.5 font-bold text-red-800">
                        <span className="material-symbols-outlined text-base text-red-600">shield</span>
                        <span>DOUBLON DÉTECTÉ : Établissement déjà pris en charge !</span>
                      </div>
                      <p className="mt-1 text-[11px] text-red-700">{collisionWarning.collisionReason}</p>
                      <div className="mt-1.5 font-semibold text-[11px] bg-red-100/80 px-2 py-1 rounded border border-red-200">
                        Agent en charge : <span className="font-bold text-red-900">{collisionWarning.assignedAgentName}</span> ({collisionWarning.assignedAgentBadge})
                      </div>
                      <p className="text-[10px] text-red-600 font-bold mt-1">
                        ⛔ Pour éviter tout double contact sur le terrain, vous ne devez pas créer ce dossier.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#022448] mb-1">
                        Arrondissement
                      </label>
                      <select
                        value={newEstDistrict}
                        onChange={(e) => setNewEstDistrict(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-[#dde2f3] rounded-xl"
                      >
                        <option value="Arrondissement 1 Lumumba">Arr. 1 Lumumba</option>
                        <option value="Arrondissement 2 Mvoumvou">Arr. 2 Mvoumvou</option>
                        <option value="Arrondissement 3 Tié-Tié">Arr. 3 Tié-Tié</option>
                        <option value="Arrondissement 4 Louandjili">Arr. 4 Louandjili</option>
                        <option value="Arrondissement 5 Mongo-Mpoukou">Arr. 5 Mongo-Mpoukou</option>
                        <option value="Arrondissement 6 Ngoyo">Arr. 6 Ngoyo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#022448] mb-1">
                        Piste
                      </label>
                      <select
                        value={newEstSector}
                        onChange={(e) => setNewEstSector(e.target.value as 'informal' | 'formal')}
                        className="w-full p-2 text-xs bg-white border border-[#dde2f3] rounded-xl"
                      >
                        <option value="informal">Informel (Négocié sur le terrain)</option>
                        <option value="formal">Formel (RCCM / NIU)</option>
                      </select>
                    </div>
                  </div>

                  {newEstSector === 'informal' && (
                    <div>
                      <label className="block text-xs font-bold text-[#022448] mb-1">
                        Montant Libre Négocié sur place (FCFA)
                      </label>
                      <input
                        type="number"
                        step="5000"
                        value={newEstNegotiatedAmount}
                        onChange={(e) => setNewEstNegotiatedAmount(Number(e.target.value))}
                        className="w-full p-2 text-xs font-bold bg-white border border-[#dde2f3] rounded-xl"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SECTION CONVOCATION MANUELLE ET MODALITÉS DU RENDEZ-VOUS */}
              <div className="bg-[#f8faff] p-3.5 rounded-xl border border-[#dde2f3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#022448] flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[#006d2f] text-base">schedule</span>
                    Délai &amp; Heure fixés manuellement
                  </span>
                  <span className="text-[10px] bg-[#dcfce7] text-[#065f46] font-bold px-2 py-0.5 rounded">
                    Manuel 100%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Modalité du Rdv</label>
                    <select
                      value={manualRdvType}
                      onChange={(e) => setManualRdvType(e.target.value as 'BUREAU' | 'TERRAIN')}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-[#022448]"
                    >
                      <option value="BUREAU">🏢 Convocation au Bureau SAA</option>
                      <option value="TERRAIN">📍 Visite de Terrain (Recouvrement)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Heure Convenue</label>
                    <input
                      type="time"
                      value={manualRdvTime}
                      onChange={(e) => setManualRdvTime(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold font-mono text-[#022448]"
                    />
                  </div>
                </div>

                {manualRdvType === 'BUREAU' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bureau &amp; Lieu de Convocation</label>
                    <input
                      type="text"
                      value={manualRdvOffice}
                      onChange={(e) => setManualRdvOffice(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#dde2f3]">
                <button
                  type="button"
                  onClick={() => setShowNewRdvModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={collisionWarning?.hasCollision && collisionWarning?.assignedToOther}
                  className={`text-white text-xs font-bold px-4 py-2 rounded-xl shadow cursor-pointer flex items-center gap-1 transition-all ${
                    collisionWarning?.hasCollision && collisionWarning?.assignedToOther
                      ? 'bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-[#006d2f] hover:bg-[#005524]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">event</span>
                  <span>Confirmer la Programmation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: QUITTANCE OFFICIELLE D'ENCAISSEMENT & REÇU RÉGALIEN IMPRIMABLE   */}
      {/* ========================================================================= */}
      {officialReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-[#dde2f3] my-8">
            {/* Top Bar with Print & Close */}
            <div className="bg-[#022448] text-white px-6 py-3 flex items-center justify-between">
              <span className="font-sans text-xs uppercase font-extrabold tracking-wider text-[#ffe082]">
                Quittance Régalienne Officielle DDL-PN
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#006d2f] hover:bg-[#005223] text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>Imprimer A4 / Reçu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfficialReceiptModal(null)}
                  className="text-white/70 hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-6 sm:p-8 space-y-6 bg-white text-[#161c27]">
              {/* Official Header with Armoiries & Logo DDLPN */}
              <div className="flex items-start justify-between border-b-2 border-[#022448] pb-4">
                <div className="flex items-center gap-3">
                  <ArmoiriesCongo size={56} />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#006d2f] tracking-widest block">
                      Unité • Travail • Progrès
                    </span>
                    <h3 className="font-garamond text-base uppercase font-bold text-[#022448]">
                      RÉPUBLIQUE DU CONGO
                    </h3>
                    <p className="text-[10px] text-gray-600 font-sans">
                      Ministère de l'Industrie Culturelle, Artistique et des Loisirs
                    </p>
                    <p className="text-[11px] font-bold text-[#022448] font-sans">
                      Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <LogoDDLPN size={52} />
                  <span className="font-mono text-xs font-extrabold text-[#022448] mt-1">
                    {officialReceiptModal.receiptRef}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Date : {officialReceiptModal.dateStr}
                  </span>
                </div>
              </div>

              {/* Title Banner */}
              <div className="text-center py-2 bg-[#f0f3ff] rounded-xl border border-[#dde8ff]">
                <h4 className="font-garamond text-lg font-bold text-[#022448] uppercase">
                  {officialReceiptModal.isYearSettled
                    ? 'QUITTANCE LIBÉRATOIRE & REÇU DE SOLDE ANNUEL'
                    : 'QUITTANCE D’ACOMPTE & REÇU DE PERCEPTION'}
                </h4>
                <p className="text-xs text-[#006d2f] font-semibold">
                  Service des Activités et des Agrégations (SAA)
                </p>
              </div>

              {/* Establishment Details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Assujetti</span>
                  <div className="font-bold text-sm text-[#022448]">{officialReceiptModal.establishmentName}</div>
                  <div><strong>Promoteur :</strong> {officialReceiptModal.promoter}</div>
                  <div><strong>Téléphone :</strong> {officialReceiptModal.phone}</div>
                  <div><strong>Localisation :</strong> {officialReceiptModal.district}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Perception</span>
                  <div><strong>Mode :</strong> {officialReceiptModal.paymentMethod}</div>
                  <div><strong>Canal :</strong> {officialReceiptModal.location}</div>
                  <div><strong>Agent Régisseur :</strong> {officialReceiptModal.agentName}</div>
                  <div><strong>Exercice Fiscal :</strong> 2026</div>
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-4 bg-[#f8f9ff] border border-[#dde2f3] rounded-xl space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-gray-600">Montant Perçu ce Jour :</span>
                  <span className="font-mono text-xl font-extrabold text-[#006d2f]">
                    {officialReceiptModal.amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="text-xs text-gray-700 italic border-t pt-1">
                  <strong>Somme en toutes lettres :</strong> {officialReceiptModal.amountInWords}
                </div>
                <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t">
                  <span className="text-gray-500">Solde Restant Dû :</span>
                  <span className={`font-mono font-bold ${officialReceiptModal.balanceRemaining === 0 ? 'text-[#006d2f]' : 'text-[#991b1b]'}`}>
                    {officialReceiptModal.balanceRemaining === 0
                      ? '0 FCFA (DOSSIER 100% SOLDÉ)'
                      : `${officialReceiptModal.balanceRemaining.toLocaleString('fr-FR')} FCFA`}
                  </span>
                </div>
              </div>

              {/* Regulatory Notice & Annual Renewal Schedule */}
              {officialReceiptModal.isYearSettled ? (
                <div className="p-4 bg-gradient-to-r from-[#ecfdf5] to-[#f0fdf4] border-2 border-[#10b981] rounded-xl space-y-2 text-xs text-[#065f46]">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#047857]">
                    <span className="material-symbols-outlined text-lg">verified</span>
                    <span>AUTORISATION D'EXPLOITATION ANNUELLE EN RÈGLE</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Vu la réglementation de la DDL-PN, l'autorisation d'exploitation étant <strong>annuelle et renouvelable</strong>, le premier versement effectué le{' '}
                    <strong>{officialReceiptModal.firstPaymentDate}</strong> fixe l'échéance du prochain paiement de renouvellement au{' '}
                    <strong className="text-xs text-[#022448] underline">{officialReceiptModal.nextRenewalDate}</strong>.
                  </p>
                  <p className="text-[10px] text-gray-600 italic">
                    L'établissement est reconduit dans l'agenda à cette date pour l'exercice suivant.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-[#fff7ed] border border-[#f97316] rounded-xl text-xs text-[#9a3412] flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Prochain Rendez-vous de Recouvrement Fixé au :</span>
                    <span className="text-sm font-extrabold text-[#022448]">
                      {officialReceiptModal.nextDueDate}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-[#f97316]">
                    event_upcoming
                  </span>
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t text-xs text-center font-sans">
                <div>
                  <span className="font-bold text-gray-500 block mb-8">L'Exploitant / Promoteur</span>
                  <span className="text-gray-400 italic">(Signature ou Empreinte)</span>
                </div>
                <div>
                  <span className="font-bold text-[#022448] block mb-8">
                    Pour la Direction Départementale des Loisirs
                  </span>
                  <span className="font-semibold text-gray-700">L'Agent Régisseur Assermenté</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3">
              <a
                href={`https://wa.me/${officialReceiptModal.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `DIRECTION DÉPARTEMENTALE DES LOISIRS (DDL-PN)\nQuittance N° ${officialReceiptModal.receiptRef}\nÉtablissement: ${officialReceiptModal.establishmentName}\nMontant encaissé: ${officialReceiptModal.amount.toLocaleString('fr-FR')} FCFA\n${
                    officialReceiptModal.isYearSettled
                      ? `Exercice Soldé ! Renouvellement annuel fixé au: ${officialReceiptModal.nextRenewalDate}`
                      : `Prochain rendez-vous: ${officialReceiptModal.nextDueDate} (Reste: ${officialReceiptModal.balanceRemaining.toLocaleString('fr-FR')} FCFA)`
                  }`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                <span>Partager via WhatsApp</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOfficialReceiptModal(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#022448] hover:bg-[#001730] text-[#ffe082] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Imprimer la Quittance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RÉPERTOIRE DES ÉTABLISSEMENTS SOLDÉS & RENOUVELLEMENT ANNUEL     */}
      {/* ========================================================================= */}
      {showSettledListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-[#dde2f3] max-h-[85vh] flex flex-col">
            <div className="bg-[#022448] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-[#ffe082]">
                  verified
                </span>
                <div>
                  <h3 className="font-garamond text-lg font-bold">
                    Établissements Soldés &amp; Échéances de Renouvellement Annuel (N+1)
                  </h3>
                  <p className="text-xs text-white/80">
                    Règle DDL-PN : Le jour du premier versement est le jour du prochain paiement l'année suivante.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettledListModal(false)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs bg-[#f8f9ff] p-3 rounded-xl border border-[#dde2f3]">
                <span className="font-bold text-[#022448]">
                  Total des établissements soldés : {settledEstablishments.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleJumpToYear(2027);
                    setShowSettledListModal(false);
                  }}
                  className="bg-[#006d2f] text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  <span>Basculer l'agenda sur 2027</span>
                </button>
              </div>

              {settledEstablishments.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Aucun établissement n'a encore soldé intégralement ses droits d'exploitation.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-[#dde2f3] rounded-xl overflow-hidden">
                  {settledEstablishments.map((est) => {
                    const firstDate = getFirstPaymentDate(est);
                    const renewalDate = addOneYear(firstDate);

                    return (
                      <div
                        key={est.id}
                        className="p-3.5 hover:bg-[#fafbff] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-[#022448]">{est.name}</h4>
                          <p className="text-gray-600">
                            <strong>Exploitant :</strong> {est.promoter} • <strong>Tél :</strong> {est.phone} • {est.district}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-[#006d2f] font-semibold mt-1">
                            <span>Total acquitté : {est.paidAmount.toLocaleString('fr-FR')} FCFA</span>
                            <span>•</span>
                            <span>Date 1er versement : {firstDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">
                              Renouvellement N+1
                            </span>
                            <span className="font-mono text-sm font-extrabold text-[#022448] bg-[#ecfdf5] px-2.5 py-1 rounded-lg border border-[#10b981]">
                              {renewalDate}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const iso = normalizeDateToISO(renewalDate);
                              if (iso) {
                                const [y, m] = iso.split('-').map(Number);
                                setCurrentDate(new Date(y, m - 1, 1));
                                setSelectedDayISO(iso);
                                setViewMode('day');
                                setShowSettledListModal(false);
                              }
                            }}
                            className="bg-[#f1f3ff] hover:bg-[#dce6f9] text-[#022448] p-2 rounded-lg cursor-pointer"
                            title="Ouvrir dans l'agenda"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 border-t text-right">
              <button
                type="button"
                onClick={() => setShowSettledListModal(false)}
                className="bg-[#022448] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
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
