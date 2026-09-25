import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { TabType } from './Navbar.tsx';
import { apiFetchEstablishments, FieldEstablishment } from '../lib/supabase.ts';

export interface UrgentNotification {
  id: string;
  category: 'MISE_EN_DEMEURE' | 'RDV_RECOUVREMENT' | 'ECHEANCE_TRANCHE' | 'DOSSIER_RESERVES';
  severity: 'CRITICAL' | 'URGENT' | 'WARNING' | 'INFO';
  title: string;
  establishmentName: string;
  promoter: string;
  district: string;
  phone?: string;
  amountDue?: number;
  deadlineLabel: string;
  hoursRemaining?: number; // negative if overdue
  scheduledTime?: string;
  targetTab: TabType;
  targetRefId?: string;
  agentAssigned: string;
  timestamp: string;
  read: boolean;
}

// Initial realistic seed notifications for DDL-PN agents & Jacques MATOKO
const INITIAL_NOTIFICATIONS: UrgentNotification[] = [
  {
    id: 'NOTIF-MED-001',
    category: 'MISE_EN_DEMEURE',
    severity: 'CRITICAL',
    title: 'Délai de Mise en Demeure Dépassé (Arrêté de Fermeture)',
    establishmentName: 'Terrasse Océan Bleu',
    promoter: 'Hervé Bitemo',
    district: 'Côte Sauvage, Arr. 1 Lumumba',
    phone: '+242 06 910 23 45',
    amountDue: 168000,
    deadlineLabel: 'Échue depuis 4 heures (Délai 72h dépassé)',
    hoursRemaining: -4,
    targetTab: 'dashboard',
    targetRefId: 'MED-2026-004',
    agentAssigned: 'Agent SAA Tchicaya (Badge N° 05)',
    timestamp: 'Aujourd’hui 12:00',
    read: false,
  },
  {
    id: 'NOTIF-RDV-002',
    category: 'RDV_RECOUVREMENT',
    severity: 'URGENT',
    title: 'Rdv Recouvrement & Encaissement 2e Tranche',
    establishmentName: 'Nightclub Le Sphinx Rouge',
    promoter: 'Patrick Moukassa',
    district: 'Grand Marché, Arr. 2 Mvoumvou',
    phone: '+242 05 667 89 01',
    amountDue: 200000,
    deadlineLabel: 'Aujourd’hui à 14h30 (Passage de brigade)',
    scheduledTime: '14:30',
    hoursRemaining: 3,
    targetTab: 'agenda',
    targetRefId: 'EST-2026-017',
    agentAssigned: 'Agent SAA Makosso (Badge N° 08)',
    timestamp: 'Aujourd’hui 08:30',
    read: false,
  },
  {
    id: 'NOTIF-MED-003',
    category: 'MISE_EN_DEMEURE',
    severity: 'URGENT',
    title: 'Mise en Demeure : Moins de 18 heures restantes',
    establishmentName: 'Nightclub Le Sphinx Rouge',
    promoter: 'Patrick Moukassa',
    district: 'Grand Marché, Arr. 2 Mvoumvou',
    phone: '+242 05 667 89 01',
    amountDue: 330000,
    deadlineLabel: 'Échéance légale : Demain à 10h00',
    hoursRemaining: 18,
    targetTab: 'dashboard',
    targetRefId: 'MED-2026-005',
    agentAssigned: 'Agent SAA Makosso (Badge N° 08)',
    timestamp: 'Hier 16:00',
    read: false,
  },
  {
    id: 'NOTIF-RDV-004',
    category: 'RDV_RECOUVREMENT',
    severity: 'WARNING',
    title: 'Visite Technique Contradictoire de Commodo',
    establishmentName: 'Nganda Sans Souci',
    promoter: 'Jeanne Makaya',
    district: 'Fond Tié-Tié, Arr. 3 Tié-Tié',
    phone: '+242 06 880 12 34',
    amountDue: 102000,
    deadlineLabel: 'Demain à 10h00 (Mesurage & Enquête 30 000 F)',
    scheduledTime: '10:00 (Demain)',
    hoursRemaining: 26,
    targetTab: 'agenda',
    targetRefId: 'EST-2026-029',
    agentAssigned: 'Agent SAA Loubaki (Badge N° 12)',
    timestamp: 'Hier 11:15',
    read: false,
  },
  {
    id: 'NOTIF-ECH-005',
    category: 'ECHEANCE_TRANCHE',
    severity: 'WARNING',
    title: 'Échéance Tranche N°3 Non Honorée',
    establishmentName: 'Lounge Club Impérial',
    promoter: 'Christian Samba',
    district: 'Aéroport, Arr. 1 Lumumba',
    phone: '+242 05 555 43 21',
    amountDue: 340000,
    deadlineLabel: 'Exigible sous 48h (Relance téléphonique)',
    hoursRemaining: 48,
    targetTab: 'terrain',
    targetRefId: 'EST-2026-042',
    agentAssigned: 'Chef SAA J.A. MATOKO',
    timestamp: 'Il y a 2 jours',
    read: false,
  },
  {
    id: 'NOTIF-DOS-006',
    category: 'DOSSIER_RESERVES',
    severity: 'INFO',
    title: 'Réserves Techniques : Délai Quinzaine en Cours',
    establishmentName: 'Club Balnéaire Le Dauphin Bleu',
    promoter: 'Édouard Moussavou',
    district: 'Bande Côtière / Côte Sauvage',
    deadlineLabel: 'Manque protocole surveillance mer (7 jours restants)',
    hoursRemaining: 168,
    targetTab: 'registre',
    targetRefId: 'dauphin',
    agentAssigned: 'Commission Sécurité SAA',
    timestamp: 'Il y a 3 jours',
    read: true,
  },
];

const LOCAL_STORAGE_NOTIFS_KEY = 'ddl_pn_notifications_v1';
const LOCAL_STORAGE_READ_IDS_KEY = 'ddl_pn_notifications_read_ids';

interface NotificationCenterProps {
  onNavigateToTab: (tab: TabType) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigateToTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MISE_EN_DEMEURE' | 'RDV_RECOUVREMENT' | 'ECHEANCE_TRANCHE'>('ALL');
  const [notifications, setNotifications] = useState<UrgentNotification[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  });

  const panelRef = useRef<HTMLDivElement>(null);

  // Sync live establishments from Supabase or localStorage
  useEffect(() => {
    let isMounted = true;
    const loadLiveAlerts = async () => {
      try {
        const res = await apiFetchEstablishments([]);
        if (!isMounted || !res.data || res.data.length === 0) return;

        // Check if any establishment has overdue status or close due date
        const liveNotifs: UrgentNotification[] = [...notifications];
        let hasChanges = false;

        res.data.forEach((est: FieldEstablishment) => {
          if (est.status === 'mise_en_demeure') {
            const exists = liveNotifs.some((n) => n.establishmentName === est.name && n.category === 'MISE_EN_DEMEURE');
            if (!exists) {
              liveNotifs.unshift({
                id: `NOTIF-LIVE-MED-${est.id}`,
                category: 'MISE_EN_DEMEURE',
                severity: 'CRITICAL',
                title: 'Mise en Demeure Active (Sommation de rigueur)',
                establishmentName: est.name,
                promoter: est.promoter,
                district: est.district,
                phone: est.phone,
                amountDue: est.totalDue - est.paidAmount,
                deadlineLabel: est.nextDueDate || 'Échéance sous 72h',
                hoursRemaining: 12,
                targetTab: 'terrain',
                targetRefId: est.id,
                agentAssigned: est.identifiedBy || 'Agent SAA DDL-PN',
                timestamp: 'À l’instant',
                read: false,
              });
              hasChanges = true;
            }
          }
        });

        if (hasChanges && isMounted) {
          setNotifications(liveNotifs);
          localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(liveNotifs));
        }
      } catch {
        // Keep initial notifications
      }
    };

    loadLiveAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes
  const saveNotifications = (newList: UrgentNotification[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(newList));
    } catch {}
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Derived counts
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const criticalCount = useMemo(() => {
    return notifications.filter((n) => n.severity === 'CRITICAL' && !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'ALL') return notifications;
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  // Mark all as read
  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  // Mark single as read
  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  // Action click handler
  const handleNotificationClick = (notif: UrgentNotification) => {
    handleMarkAsRead(notif.id);
    setIsOpen(false);
    onNavigateToTab(notif.targetTab);

    // If target has a hash or section
    if (notif.targetTab === 'dashboard' && notif.category === 'MISE_EN_DEMEURE') {
      setTimeout(() => {
        const el = document.getElementById('section-alertes-mises-en-demeure');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  // Reset to initial
  const handleResetNotifications = () => {
    saveNotifications(INITIAL_NOTIFICATIONS);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Centre de notifications et alertes"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-[#022448] text-white shadow-md'
            : 'bg-[#f1f3ff] text-[#022448] hover:bg-[#e4e9f7]'
        }`}
        title="Alertes échéances & rendez-vous de recouvrement"
      >
        <span className="material-symbols-outlined text-[22px]">
          {unreadCount > 0 ? 'notifications_active' : 'notifications'}
        </span>

        {/* Badge with count */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 font-mono text-[10px] font-extrabold text-white px-1.5 py-0.2 rounded-full shadow-md flex items-center justify-center min-w-[20px] h-[20px] ${
              criticalCount > 0
                ? 'bg-[#dc2626] animate-pulse'
                : 'bg-[#ea580c]'
            }`}
          >
            {unreadCount}
          </span>
        )}

        {/* Small pulsing indicator if there are critical items */}
        {criticalCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#dc2626] rounded-full ring-2 ring-white animate-ping"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 md:w-[420px] bg-white rounded-2xl shadow-2xl border border-[#dde2f3] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-[#161c27]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#022448] to-[#142943] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <span className="material-symbols-outlined text-[18px] text-[#ffe082]">
                    notifications_active
                  </span>
                </div>
                <div>
                  <h3 className="font-garamond text-lg font-bold text-white leading-tight">
                    Alertes &amp; Échéances SAA
                  </h3>
                  <p className="font-sans text-[10px] text-white/75">
                    Surveillance régalienne des délais de rigueur et rdv terrain
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <span className="font-sans text-[10px] font-bold bg-[#dc2626] text-white px-2 py-0.5 rounded-full shadow-xs">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/15 overflow-x-auto text-[10px] font-sans">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === 'ALL'
                    ? 'bg-white text-[#022448] shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('MISE_EN_DEMEURE')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'MISE_EN_DEMEURE'
                    ? 'bg-[#dc2626] text-white shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#fca5a5]"></span>
                <span>Sommations</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('RDV_RECOUVREMENT')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'RDV_RECOUVREMENT'
                    ? 'bg-[#006d2f] text-white shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#86efac]"></span>
                <span>Rdv Terrain</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('ECHEANCE_TRANCHE')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'ECHEANCE_TRANCHE'
                    ? 'bg-[#d97706] text-white shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span>Tranches</span>
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#edf0fa]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#747783] font-sans space-y-2">
                <span className="material-symbols-outlined text-[36px] text-gray-300">
                  check_circle
                </span>
                <p className="text-xs font-semibold">Aucune notification dans cette catégorie</p>
                <p className="text-[11px] text-[#747783]">
                  Toutes les échéances et rendez-vous sont à jour.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isCritical = notif.severity === 'CRITICAL';
                const isOverdue = (notif.hoursRemaining ?? 1) < 0;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 sm:p-4 transition-all duration-150 cursor-pointer flex items-start gap-3 relative group ${
                      notif.read ? 'bg-white hover:bg-[#f8faff]' : 'bg-[#f4f7ff] hover:bg-[#eaf0ff]'
                    }`}
                  >
                    {/* Unread dot indicator */}
                    {!notif.read && (
                      <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                    )}

                    {/* Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isCritical
                          ? 'bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]'
                          : notif.category === 'RDV_RECOUVREMENT'
                          ? 'bg-[#dcfce7] text-[#006d2f] border border-[#86efac]'
                          : notif.category === 'MISE_EN_DEMEURE'
                          ? 'bg-[#ffedd5] text-[#c2410c] border border-[#fed7aa]'
                          : 'bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {notif.category === 'MISE_EN_DEMEURE'
                          ? isOverdue
                            ? 'lock'
                            : 'warning'
                          : notif.category === 'RDV_RECOUVREMENT'
                          ? 'calendar_clock'
                          : notif.category === 'ECHEANCE_TRANCHE'
                          ? 'payments'
                          : 'folder_open'}
                      </span>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0 font-sans">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            isCritical
                              ? 'bg-[#450a0a] text-white'
                              : notif.severity === 'URGENT'
                              ? 'bg-[#fee2e2] text-[#991b1b]'
                              : notif.severity === 'WARNING'
                              ? 'bg-[#fef3c7] text-[#92400e]'
                              : 'bg-[#e0e7ff] text-[#3730a3]'
                          }`}
                        >
                          {isOverdue ? 'Délai Expiré' : notif.severity}
                        </span>
                        <span className="text-[10px] text-[#747783] shrink-0 font-mono">
                          {notif.timestamp}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-[#022448] mt-1 leading-snug group-hover:text-[#004528] transition-colors">
                        {notif.title}
                      </h4>

                      <div className="text-[11px] text-[#161c27] font-semibold mt-0.5 truncate">
                        {notif.establishmentName} &bull; <span className="text-[#43474e] font-normal">{notif.promoter}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] text-[#43474e]">
                        <span className="flex items-center gap-1 text-[#022448] font-bold">
                          <span className="material-symbols-outlined text-[13px] text-[#dc2626]">
                            schedule
                          </span>
                          <span>{notif.deadlineLabel}</span>
                        </span>

                        {notif.amountDue && notif.amountDue > 0 && (
                          <span className="font-mono font-bold text-[#006d2f] bg-[#dcfce7] px-1 rounded">
                            {notif.amountDue.toLocaleString('fr-FR')} FCFA
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-[#747783]">
                        <span className="truncate">{notif.district}</span>
                        <span className="text-[#022448] font-bold flex items-center gap-0.5 group-hover:underline">
                          <span>Traiter</span>
                          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 bg-[#f8faff] border-t border-[#dde2f3] flex items-center justify-between gap-2 text-xs font-sans">
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-bold text-[#022448] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">done_all</span>
                  <span>Tout marquer comme lu</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetNotifications}
                className="text-[10px] text-[#747783] hover:text-[#022448] cursor-pointer"
                title="Réinitialiser les alertes de test"
              >
                Actualiser
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToTab('agenda');
                }}
                className="px-2.5 py-1 bg-[#022448] hover:bg-[#142943] text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                Ouvrir Agenda Rdv
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
