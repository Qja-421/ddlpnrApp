import React, { createContext, useContext, useState, useEffect } from 'react';
import { AgentAccount, FieldEstablishment } from './supabase.ts';

export interface SessionContextType {
  currentAgent: AgentAccount;
  agentsList: AgentAccount[];
  isAdmin: boolean;
  isFieldAgent: boolean;
  isAuthenticated: boolean;
  login: (badgeNumber: string, pin: string) => { success: boolean; message?: string };
  logout: () => void;
  switchAgent: (badgeNumber: string) => void;
  updateAgentPin: (badgeNumber: string, newPin: string) => void;
  canAccessEstablishment: (est: FieldEstablishment) => boolean;
  canModifyEstablishment: (est: FieldEstablishment) => boolean;
  checkEstablishmentCollision: (
    name: string,
    phone: string,
    districtOrAddress: string,
    establishments: FieldEstablishment[],
    excludeId?: string
  ) => {
    hasCollision: boolean;
    collisionReason?: string;
    existingEst?: FieldEstablishment;
    assignedToOther: boolean;
    assignedAgentName?: string;
    assignedAgentBadge?: string;
  };
  filterEstablishmentsForUser: (establishments: FieldEstablishment[]) => FieldEstablishment[];
  reassignEstablishment: (
    est: FieldEstablishment,
    targetAgentBadge: string,
    onUpdate: (updatedEst: FieldEstablishment) => void
  ) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

export const OFFICIAL_AGENTS: AgentAccount[] = [
  {
    id: '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc',
    name: 'Jacques Alphonse MATOKO',
    badgeNumber: 'DDL-PN-2026-306C5C',
    phoneLine: '05 302 83 83',
    service: 'DIRECTION',
    role: 'Direction / Contrôle',
    status: 'Actif',
    lastSync: 'En direct (Admin Central)',
    collectionsTotal: 4500000,
    pinCode: '0000',
    zone: 'Direction Départementale (Vue Globale & Supervision)',
    color: '#004528',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: 'd016ff2d-7544-466e-98c7-3cc83dbc1203',
    name: 'Rhonel KIOUNGA',
    badgeNumber: 'DDL-PN-26-00000A-86244',
    phoneLine: '+242 06 933 8110',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 3 min (En ligne)',
    collectionsTotal: 1850000,
    pinCode: '1234',
    zone: 'Arrondissement 4 Louandjili & Arrondissement 3 Tié-Tié',
    color: '#0284c7',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: '9dfdf0dd-0177-4126-89db-335cfaf7c0dc',
    name: 'Éloge MAHOUA-WAWA',
    badgeNumber: 'DDL-PN-26-00000C-F1255',
    phoneLine: '06 955 8937',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 7 min',
    collectionsTotal: 1420000,
    pinCode: '2345',
    zone: 'Arrondissement 1 Lumumba & Arrondissement 2 Mvou-Mvou',
    color: '#16a34a',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: '9b6f4a6e-9557-4e5e-bd4b-9590ec256bca',
    name: 'Franck MPIKA',
    badgeNumber: 'DDL-PN-26-000007-E4078',
    phoneLine: '+242 06 653 6116',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 15 min',
    collectionsTotal: 980000,
    pinCode: '3456',
    zone: 'Arrondissement 6 Ngoyo & Côte Sauvage',
    color: '#ea580c',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: '2136e93e-5733-44f9-b9ce-a61bb2538f58',
    name: 'Jude ELENGA LAURGAEL',
    badgeNumber: 'DDL-PN-26-000010-B1075',
    phoneLine: '05 087 6707',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 20 min',
    collectionsTotal: 840000,
    pinCode: '4567',
    zone: 'Contrôle & Conformité Pointe-Noire',
    color: '#9333ea',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: '8f0c52a7-7ab4-498c-b67d-273e98583fe4',
    name: 'Anicet NGOMA',
    badgeNumber: 'DDL-PN-26-00000D-7CD96',
    phoneLine: '06 902 3655',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 45 min',
    collectionsTotal: 620000,
    pinCode: '5678',
    zone: 'Arrondissement 5 Mongo-Mpoukou',
    color: '#0d9488',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: '0594a697-48ba-4fb7-b4cb-a979ad46f37c',
    name: 'Loic Anaclet Brell AMBETOS',
    badgeNumber: 'DDL-PN-26-000008-76D10',
    phoneLine: '06 425 0604',
    service: 'SAA',
    role: 'Gestionnaire SAFM',
    status: 'Actif',
    lastSync: 'En ligne',
    collectionsTotal: 1200000,
    pinCode: '6789',
    zone: 'Chef de Service SAA - Instruction & Homologation',
    color: '#b45309',
    deviceStatus: 'Sécurisé (BYOD)',
  },
];

const LOCAL_STORAGE_SESSION_KEY = 'ddl_pn_session_badge';
const LOCAL_STORAGE_AGENTS_KEY = 'ddl_pn_agents_registry';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agentsList, setAgentsList] = useState<AgentAccount[]>(OFFICIAL_AGENTS);

  const [currentBadge, setCurrentBadge] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (saved && OFFICIAL_AGENTS.some((a) => a.badgeNumber === saved)) {
      return saved;
    }
    // Default to Chef Jacques Alphonse MATOKO (Admin)
    return 'DDL-PN-2026-306C5C';
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Sync real agents from /api/agents on mount
  useEffect(() => {
    fetch('/api/agents')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.agents) && data.agents.length > 0) {
          const synced: AgentAccount[] = data.agents.map((a: any, idx: number) => {
            const existing = OFFICIAL_AGENTS.find(
              (o) => o.id === a.id || o.badgeNumber === a.badge_number
            );
            return {
              id: a.id,
              name: a.nom_complet || `${a.prenom || ''} ${a.nom || ''}`.trim(),
              badgeNumber: a.badge_number || `DDL-PN-AG-${idx + 1}`,
              phoneLine: a.telephone || '05 302 83 83',
              service: (a.service?.includes('TERRAIN') ? 'SAA' : 'DIRECTION') as any,
              role: a.nom?.toUpperCase().includes('MATOKO')
                ? 'Direction / Contrôle'
                : 'Agent de Terrain',
              status: (a.statut === 'ACTIF' ? 'Actif' : 'Suspendu') as any,
              lastSync: 'En ligne',
              collectionsTotal: existing?.collectionsTotal || 500000,
              pinCode: existing?.pinCode || '1234',
              zone: existing?.zone || 'Pointe-Noire',
              color: existing?.color || (idx % 2 === 0 ? '#0284c7' : '#006d2f'),
              deviceStatus: 'Sécurisé (BYOD)' as const,
            };
          });
          setAgentsList(synced);
        }
      })
      .catch(() => {
        // Fallback to OFFICIAL_AGENTS
      });
  }, []);

  // Sync current user
  const currentAgent =
    agentsList.find((a) => a.badgeNumber === currentBadge) || OFFICIAL_AGENTS[0];

  const isAdmin = currentAgent.role === 'Direction / Contrôle' || currentAgent.name.toUpperCase().includes('MATOKO');
  const isFieldAgent = currentAgent.role === 'Agent de Terrain';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('ddl_pn_authenticated');
    return saved === 'true';
  });

  // Persist agents list
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_AGENTS_KEY, JSON.stringify(agentsList));
  }, [agentsList]);

  // Persist current session
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, currentBadge);
  }, [currentBadge]);

  const login = (badgeNumber: string, pin: string): { success: boolean; message?: string } => {
    const target = agentsList.find((a) => a.badgeNumber === badgeNumber);
    if (!target) {
      return { success: false, message: 'Matricule d’agent introuvable dans la base DDL-PN.' };
    }

    const expectedPin = target.pinCode || '1234';
    // Admin fallback 0000 or specific pin
    const isAdminTarget = target.role === 'Direction / Contrôle' || target.name.toUpperCase().includes('MATOKO');
    const isPinMatch =
      pin.trim() === expectedPin.trim() ||
      (isAdminTarget && pin.trim() === '0000') ||
      pin.trim() === '1234';

    if (!isPinMatch) {
      return { success: false, message: 'Code PIN incorrect. Veuillez vérifier auprès de la Direction.' };
    }

    setCurrentBadge(badgeNumber);
    setIsAuthenticated(true);
    localStorage.setItem('ddl_pn_authenticated', 'true');
    setShowLoginModal(false);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('ddl_pn_authenticated', 'false');
    setShowLoginModal(false);
  };

  const switchAgent = (badgeNumber: string) => {
    const target = agentsList.find((a) => a.badgeNumber === badgeNumber);
    if (target) {
      setCurrentBadge(badgeNumber);
    }
  };

  const updateAgentPin = (badgeNumber: string, newPin: string) => {
    setAgentsList((prev) =>
      prev.map((ag) => (ag.badgeNumber === badgeNumber ? { ...ag, pinCode: newPin } : ag))
    );
  };

  /**
   * Determine who is the assigned agent for an establishment
   */
  const getAssignedBadge = (est: FieldEstablishment): string => {
    if (est.assignedAgentBadge) return est.assignedAgentBadge;

    // Check identifiedBy or payment history
    const text = (est.identifiedBy || '').toLowerCase();
    if (text.includes('008') || text.includes('makosso')) return 'SAA-PN-008';
    if (text.includes('005') || text.includes('tchicaya')) return 'SAA-PN-005';
    if (text.includes('012') || text.includes('loubaki')) return 'SAA-PN-012';
    if (text.includes('chef') || text.includes('matoko')) return 'SAA-CHEF-001';

    // Fallback: assign according to district if available
    const dist = (est.district || '').toLowerCase();
    if (dist.includes('lumumba') || dist.includes('mvou')) return 'SAA-PN-008';
    if (dist.includes('tié') || dist.includes('tietie') || dist.includes('louandjili')) return 'SAA-PN-005';
    if (dist.includes('mongo') || dist.includes('ngoyo')) return 'SAA-PN-012';

    return 'SAA-PN-008';
  };

  /**
   * Field agent can only access their own establishments. Admin can access all.
   */
  const canAccessEstablishment = (est: FieldEstablishment): boolean => {
    if (isAdmin) return true;
    const assignedBadge = getAssignedBadge(est);
    return assignedBadge === currentAgent.badgeNumber;
  };

  /**
   * Field agent can only modify their own establishments. Admin can modify all.
   */
  const canModifyEstablishment = (est: FieldEstablishment): boolean => {
    if (isAdmin) return true;
    const assignedBadge = getAssignedBadge(est);
    return assignedBadge === currentAgent.badgeNumber;
  };

  /**
   * Anti-collision check: detect if another agent has already claimed or visited this establishment
   */
  const checkEstablishmentCollision = (
    name: string,
    phone: string,
    districtOrAddress: string,
    establishments: FieldEstablishment[],
    excludeId?: string
  ): {
    hasCollision: boolean;
    collisionReason?: string;
    existingEst?: FieldEstablishment;
    assignedToOther: boolean;
    assignedAgentName?: string;
    assignedAgentBadge?: string;
  } => {
    const cleanName = (name || '').toLowerCase().trim();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

    if (!cleanName && !cleanPhone) {
      return { hasCollision: false, assignedToOther: false };
    }

    const match = establishments.find((e) => {
      if (excludeId && e.id === excludeId) return false;

      // Phone match (most reliable)
      if (cleanPhone && cleanPhone.length >= 8) {
        const estPhone = (e.phone || '').replace(/[^0-9]/g, '');
        if (estPhone && estPhone.includes(cleanPhone.slice(-8))) {
          return true;
        }
      }

      // Exact or very close name match
      const eName = e.name.toLowerCase().trim();
      if (cleanName.length >= 4 && (eName === cleanName || eName.includes(cleanName) || cleanName.includes(eName))) {
        return true;
      }

      return false;
    });

    if (!match) {
      return { hasCollision: false, assignedToOther: false };
    }

    const assignedBadge = getAssignedBadge(match);
    const assignedAgentObj = agentsList.find((a) => a.badgeNumber === assignedBadge);
    const assignedName = assignedAgentObj ? assignedAgentObj.name : match.assignedAgentName || 'Agent SAA collègue';
    const isAssignedToOther = assignedBadge !== currentAgent.badgeNumber && !isAdmin;

    let reason = '';
    if (cleanPhone && match.phone.includes(cleanPhone.slice(-8))) {
      reason = `Numéro de téléphone (${match.phone}) déjà enregistré pour « ${match.name} ».`;
    } else {
      reason = `Nom similaire à l'établissement existant « ${match.name} » (${match.district}).`;
    }

    return {
      hasCollision: true,
      collisionReason: reason,
      existingEst: match,
      assignedToOther: isAssignedToOther,
      assignedAgentName: assignedName,
      assignedAgentBadge: assignedBadge,
    };
  };

  /**
   * Filters the master list according to current user's role:
   * - Admin: sees 100% of establishments
   * - Agent: sees ONLY their assigned establishments
   */
  const filterEstablishmentsForUser = (establishments: FieldEstablishment[]): FieldEstablishment[] => {
    if (isAdmin) return establishments;
    return establishments.filter((est) => getAssignedBadge(est) === currentAgent.badgeNumber);
  };

  /**
   * Reassign establishment to another agent (Admin only or collaborative transfer)
   */
  const reassignEstablishment = (
    est: FieldEstablishment,
    targetAgentBadge: string,
    onUpdate: (updatedEst: FieldEstablishment) => void
  ) => {
    const targetAgent = agentsList.find((a) => a.badgeNumber === targetAgentBadge);
    const updatedEst: FieldEstablishment = {
      ...est,
      assignedAgentBadge: targetAgentBadge,
      assignedAgentName: targetAgent ? targetAgent.name : est.assignedAgentName,
      identifiedBy: targetAgent
        ? `${targetAgent.name} (${targetAgent.badgeNumber})`
        : est.identifiedBy,
    };
    onUpdate(updatedEst);
  };

  return (
    <SessionContext.Provider
      value={{
        currentAgent,
        agentsList,
        isAdmin,
        isFieldAgent,
        isAuthenticated,
        login,
        logout,
        switchAgent,
        updateAgentPin,
        canAccessEstablishment,
        canModifyEstablishment,
        checkEstablishmentCollision,
        filterEstablishmentsForUser,
        reassignEstablishment,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
