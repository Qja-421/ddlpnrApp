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
    id: 'AGT-04',
    name: 'Jacques Alphonse MATOKO',
    badgeNumber: 'SAA-CHEF-001',
    phoneLine: '+242 06 700 11 00 (Ligne Directe)',
    service: 'DIRECTION',
    role: 'Direction / Contrôle',
    status: 'Actif',
    lastSync: 'En direct (Admin Central)',
    collectionsTotal: 3450000,
    pinCode: '0000',
    zone: 'Direction Départementale (Vue Globale & Contrôle)',
    color: '#004528',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: 'AGT-01',
    name: 'Jean-Claude MAKOSSO',
    badgeNumber: 'SAA-PN-008',
    phoneLine: '+242 06 700 11 22 (Flotte DDL-PN N°1)',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 3 min (En ligne)',
    collectionsTotal: 1850000,
    pinCode: '1234',
    zone: 'Arrondissement 1 Lumumba & Arrondissement 2 Mvou-Mvou',
    color: '#0284c7',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: 'AGT-02',
    name: 'Brice TCHICAYA',
    badgeNumber: 'SAA-PN-005',
    phoneLine: '+242 06 700 11 23 (Flotte DDL-PN N°2)',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 12 min (Mode Déconnecté)',
    collectionsTotal: 1420000,
    pinCode: '2345',
    zone: 'Arrondissement 3 Tié-Tié & Arrondissement 4 Louandjili',
    color: '#16a34a',
    deviceStatus: 'Sécurisé (BYOD)',
  },
  {
    id: 'AGT-03',
    name: 'Anicet LOUBAKI',
    badgeNumber: 'SAA-PN-012',
    phoneLine: '+242 06 700 11 24 (Flotte DDL-PN N°3)',
    service: 'SAA',
    role: 'Agent de Terrain',
    status: 'Actif',
    lastSync: 'Il y a 25 min',
    collectionsTotal: 960000,
    pinCode: '3456',
    zone: 'Arrondissement 5 Mongo-Mpoukou & Arrondissement 6 Ngoyo',
    color: '#ea580c',
    deviceStatus: 'Sécurisé (BYOD)',
  },
];

const LOCAL_STORAGE_SESSION_KEY = 'ddl_pn_session_badge';
const LOCAL_STORAGE_AGENTS_KEY = 'ddl_pn_agents_registry';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agentsList, setAgentsList] = useState<AgentAccount[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_AGENTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback
      }
    }
    return OFFICIAL_AGENTS;
  });

  const [currentBadge, setCurrentBadge] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (saved && OFFICIAL_AGENTS.some((a) => a.badgeNumber === saved)) {
      return saved;
    }
    // Default to Chef Jacques Alphonse MATOKO (Admin)
    return 'SAA-CHEF-001';
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Sync current user
  const currentAgent =
    agentsList.find((a) => a.badgeNumber === currentBadge) || OFFICIAL_AGENTS[0];

  const isAdmin = currentAgent.role === 'Direction / Contrôle';
  const isFieldAgent = currentAgent.role === 'Agent de Terrain';
  const isAuthenticated = true;

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
    if (pin.trim() !== expectedPin.trim()) {
      return { success: false, message: 'Code PIN incorrect. Veuillez vérifier auprès de la Direction.' };
    }

    setCurrentBadge(badgeNumber);
    setShowLoginModal(false);
    return { success: true };
  };

  const logout = () => {
    // Switch to prompt login modal
    setShowLoginModal(true);
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
