export type ServiceType =
  | 'SAF'
  | 'SAA'
  | 'STATISTIQUES'
  | 'PROMOTION';

export const SERVICES_CONFIG: Record<
  ServiceType,
  { code: ServiceType; label: string; subLabel: string; color: string; defaultChef: string }
> = {
  SAF: {
    code: 'SAF',
    label: 'Service Administratif et Financier',
    subLabel: 'SAF',
    color: '#022448',
    defaultChef: 'Chef de Service Administratif et Financier',
  },
  SAA: {
    code: 'SAA',
    label: 'Service Autorisation et Animation',
    subLabel: 'SAA',
    color: '#006d2f',
    defaultChef: 'Jacques Alphonse MATOKO (Chef de Service)',
  },
  STATISTIQUES: {
    code: 'STATISTIQUES',
    label: 'Service Statistiques',
    subLabel: 'Service Statistiques & Données',
    color: '#6d5e00',
    defaultChef: 'Chef de Service Statistiques',
  },
  PROMOTION: {
    code: 'PROMOTION',
    label: 'Service Promotion',
    subLabel: 'Service Promotion des Loisirs & Partenariats',
    color: '#1e3a5f',
    defaultChef: 'Chef de Service Promotion',
  },
};

export type ObjectifAtteintStatus = 'OUI' | 'NON' | 'PARTIEL' | 'EN_COURS';

export interface ActiviteService {
  id: string;
  code: string; // Ex: ACT-SAF-01, ACT-SAA-01...
  activite: string; // Intitulé précis de l'activité au PTA
  objectifPta: string; // Objectif prescrit par le PTA
  indicateurCible: string; // Cible chiffrée
  realisation: string; // Réalisation concrète du trimestre
  objectifAtteint: ObjectifAtteintStatus; // OUI | NON | PARTIEL | EN_COURS
  tauxRealisation: number; // 0 à 100%
  periode: string; // Ex: Avril-Juin 2026
  observations: string; // Motifs si non atteint, contraintes, écarts
}

export interface ActiviteHorsProgrammation {
  id: string;
  code: string;
  titre: string;
  serviceResponsable: ServiceType;
  datePeriode: string;
  lieu: string;
  contexte: string;
  resultats: string;
  observations: string;
}

export interface DifficulteService {
  id: string;
  service: ServiceType | 'DIRECTION_GENERALE';
  titre: string;
  description: string;
  impactPta: string; // Impact direct sur l'atteinte des objectifs du PTA
  solutionProposee: string;
  attenteHierarchie: string;
}

export interface EffectifService {
  serviceKey: ServiceType | 'DIRECTION';
  serviceNom: string;
  fonctionnaires: number;
  contractuels: number;
  stagiaires: number;
  total: number;
  observations: string;
}

export interface RapportTrimestrielDirection {
  id: string;
  referenceNumero: string;
  trimestre: '1er Trimestre' | '2ème Trimestre' | '3ème Trimestre' | '4ème Trimestre';
  annee: number;
  periodeMois: string;
  dateSignature: string;
  lieuSignature: string;
  destinataires: {
    directeurGeneral: string;
    prefet: string;
  };
  signataires: {
    rapporteurNom: string;
    rapporteurTitre: string;
    directeurNom: string;
    directeurTitre: string;
  };
  introduction: string;
  contexteDepartemental: string;
  effectifs: EffectifService[];
  effectifsSynthese: string;

  // LES QUATRE TABLEAUX OFFICIELS DES QUATRE SERVICES
  tableauxServices: {
    SAF: ActiviteService[];
    SAA: ActiviteService[];
    STATISTIQUES: ActiviteService[];
    PROMOTION: ActiviteService[];
  };

  activitesHorsProgrammation: ActiviteHorsProgrammation[];
  difficultes: DifficulteService[];
  perspectives: string[];
  recommandationsDGL: string[];
  recommandationsPrefet: string[];
  conclusion: string;
}

// PROTOTYPE OFFICIEL RÉALISTE AVEC LES 4 SERVICES REQUIS PAR LA DIRECTION GÉNÉRALE
export const RAPPORT_OFFICIEL_PROTOTYPE: RapportTrimestrielDirection = {
  id: 'rapport-t2-2026-dgl-conforme',
  referenceNumero: 'N° 018/MCAPNIT/DGL/DDL-PN/2026',
  trimestre: '2ème Trimestre',
  annee: 2026,
  periodeMois: 'Avril - Mai - Juin 2026',
  dateSignature: 'Le 08 Juillet 2026',
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
    "Le présent rapport trimestriel d'activités pour le deuxième trimestre 2026 est élaboré conformément au canevas officiel transmis par la Direction Générale des Loisirs. Il présente de manière exhaustive l'état d'exécution du Plan de Travail Annuel (PTA 2026) au sein de la Direction Départementale des Loisirs de Pointe-Noire, à travers les quatre services opérationnels : le Service Administratif et Financier (SAF), le Service Autorisation et Animation (SAA), le Service Statistiques et le Service Promotion. Il rend compte de l'atteinte ou non des objectifs fixés et soumet à la hiérarchie les contraintes majeures rencontrées.",
  contexteDepartemental:
    "Dans le département de Pointe-Noire, pôle économique et balnéaire majeur, l'encadrement des structures de divertissement, le contrôle des autorisations d'exploiter et la promotion des loisirs sains constituent des impératifs républicains. Les quatre services se sont mobilisés malgré des moyens logistiques très restreints.",
  effectifs: [
    {
      serviceKey: 'DIRECTION',
      serviceNom: 'Direction & Secrétariat',
      fonctionnaires: 2,
      contractuels: 1,
      stagiaires: 1,
      total: 4,
      observations: 'Coordination, expédition du courrier et relations tutélaires',
    },
    {
      serviceKey: 'SAF',
      serviceNom: 'Service Administratif et Financier (SAF)',
      fonctionnaires: 3,
      contractuels: 1,
      stagiaires: 1,
      total: 5,
      observations: 'Gestion du personnel, budget, matériel et régie financière',
    },
    {
      serviceKey: 'SAA',
      serviceNom: 'Service Autorisation et Animation (SAA)',
      fonctionnaires: 5,
      contractuels: 2,
      stagiaires: 2,
      total: 9,
      observations: 'Instruction des agréments, inspections de conformité et encadrement',
    },
    {
      serviceKey: 'STATISTIQUES',
      serviceNom: 'Service Statistiques',
      fonctionnaires: 2,
      contractuels: 1,
      stagiaires: 1,
      total: 4,
      observations: 'Recensement, cartographie, base de données et fiches d’enquête',
    },
    {
      serviceKey: 'PROMOTION',
      serviceNom: 'Service Promotion',
      fonctionnaires: 2,
      contractuels: 1,
      stagiaires: 0,
      total: 3,
      observations: 'Points focaux en entreprises, partenariats et vulgarisation',
    },
  ],
  effectifsSynthese:
    'Effectif total consolidé : 25 agents (14 fonctionnaires de l’État, 6 contractuels et 5 stagiaires opérationnels) répartis entre la Direction et les 4 services techniques.',

  // LES QUATRE TABLEAUX OFFICIELS EXACTS
  tableauxServices: {
    // 1. TABLEAU SERVICE ADMINISTRATIF ET FINANCIER (SAF)
    SAF: [
      {
        id: 'act-saf-1',
        code: 'SAF-01',
        activite: 'Gestion administrative, tenue des registres et suivi de la carrière des agents',
        objectifPta: 'Assurer la présence effective et le traitement des actes administratifs',
        indicateurCible: '100% des dossiers et courriers traités à bonne date',
        realisation: 'Traitement régulier des courriers arrivées/départs et états d’assiduité',
        objectifAtteint: 'OUI',
        tauxRealisation: 100,
        periode: 'Avril - Juin 2026',
        observations: 'Tenue satisfaisante du courrier malgré la pénurie de papier et fournitures.',
      },
      {
        id: 'act-saf-2',
        code: 'SAF-02',
        activite: 'Suivi de l’exécution du budget de fonctionnement et comptabilité matière',
        objectifPta: 'Ordonnancement des dépenses prioritaires et inventaire du patrimoine',
        indicateurCible: '2 inventaires trimestriels et clôture comptable régulière',
        realisation: '1 inventaire physique réalisé ; clôture comptable T2 effectuée',
        objectifAtteint: 'PARTIEL',
        tauxRealisation: 65,
        periode: 'Mai - Juin 2026',
        observations:
          'Objectif partiellement atteint en raison du non-décaissement des crédits de fonctionnement.',
      },
      {
        id: 'act-saf-3',
        code: 'SAF-03',
        activite: 'Perception et reversement des redevances d’agrément au Trésor Public',
        objectifPta: 'Sécuriser le recouvrement des droits régaliels selon la clé 50%-50%',
        indicateurCible: '15 000 000 FCFA prévisionnels à recouvrer',
        realisation: '12 450 000 FCFA recouvrés avec quittances officielles',
        objectifAtteint: 'OUI',
        tauxRealisation: 83,
        periode: 'Permanent',
        observations:
          'Objectif atteint à 83%. Reversement rigoureux au Trésor Public et à l’Administration.',
      },
      {
        id: 'act-saf-4',
        code: 'SAF-04',
        activite: 'Approvisionnement et dotation des services en consommables et matériel',
        objectifPta: 'Dotation mensuelle en fournitures et carburant pour les 4 services',
        indicateurCible: '3 dotations mensuelles régulières pour le T2',
        realisation: '1 seule dotation partielle effectuée',
        objectifAtteint: 'NON',
        tauxRealisation: 33,
        periode: 'Avril - Juin 2026',
        observations:
          'Objectif non atteint : absence de trésorerie locale, rupture de papier et de carburant.',
      },
    ],

    // 2. TABLEAU SERVICE AUTORISATION ET ANIMATION (SAA)
    SAA: [
      {
        id: 'act-saa-1',
        code: 'SAA-01',
        activite: 'Instruction technique des dossiers de demande d’autorisation et d’agrément',
        objectifPta: 'Instruire tous les dossiers des promoteurs d’espaces de loisirs marchands',
        indicateurCible: '30 dossiers à instruire et soumettre au Directeur',
        realisation: '24 dossiers instruits avec procès-verbaux de commodo/incommodo',
        objectifAtteint: 'OUI',
        tauxRealisation: 80,
        periode: 'Avril - Juin 2026',
        observations: 'Dossiers restants en attente de régularisation des quittances de paiement.',
      },
      {
        id: 'act-saa-2',
        code: 'SAA-02',
        activite: 'Contrôles inopinés de sécurité, conformité et nuisances sonores',
        objectifPta: 'Inspecter les établissements nocturnes et terrasses de Pointe-Noire',
        indicateurCible: '60 contrôles inopinés ciblés dans les 6 arrondissements',
        realisation: '42 contrôles inopinés exécutés sur le terrain',
        objectifAtteint: 'PARTIEL',
        tauxRealisation: 70,
        periode: 'Tout le trimestre',
        observations:
          'Objectif partiellement atteint : impossibilité de couvrir la nuit les arrondissements périphériques (Mongo-Poukou, Ngoyo) sans véhicule.',
      },
      {
        id: 'act-saa-3',
        code: 'SAA-03',
        activite: 'Organisation d’activités de loisirs sains et socio-éducatifs pour les jeunes',
        objectifPta: 'Créer des cadres de divertissement pour les élèves et la jeunesse',
        indicateurCible: '4 événements récréatifs programmés au PTA',
        realisation: '3 événements organisés avec succès (Mpita, Tié-Tié, Lumumba)',
        objectifAtteint: 'OUI',
        tauxRealisation: 75,
        periode: 'Mai - Juin 2026',
        observations:
          'Tournoi de jeux traditionnels et kermesses populaires très appréciés par les familles.',
      },
      {
        id: 'act-saa-4',
        code: 'SAA-04',
        activite: 'Concertations obligatoires avec les collectifs de tenanciers et usagers',
        objectifPta: 'Sensibiliser les usagers sur la réglementation et les horaires légaux',
        indicateurCible: '6 rencontres (1 par arrondissement communal)',
        realisation: '4 rencontres départementales organisées',
        objectifAtteint: 'PARTIEL',
        tauxRealisation: 66.7,
        periode: 'Avril - Mai 2026',
        observations:
          'Rencontres menées à Lumumba, Mvoumvou, Tié-Tié et Loandjili. Report pour Tchiamba-Nzassi faute de moyen de transport.',
      },
    ],

    // 3. TABLEAU SERVICE STATISTIQUES
    STATISTIQUES: [
      {
        id: 'act-stat-1',
        code: 'STAT-01',
        activite: 'Recensement exhaustif et actualisation de la base de données des établissements',
        objectifPta: 'Dénombrer les structures de loisirs marchandes et non marchandes',
        indicateurCible: '150 établissements recensés avec fiches techniques individuelles',
        realisation: '118 fiches statistiques complétées et enregistrées',
        objectifAtteint: 'OUI',
        tauxRealisation: 78.7,
        periode: 'Avril - Juin 2026',
        observations:
          'Données collectées manuellement sur papier. Retard dans la saisie informatique faute de terminaux mobiles.',
      },
      {
        id: 'act-stat-2',
        code: 'STAT-02',
        activite: 'Cartographie spatiale des espaces de loisirs par arrondissement',
        objectifPta: 'Établir la géolocalisation et la densité des débits de boisson et terrasses',
        indicateurCible: 'Cartographie des 6 arrondissements de Pointe-Noire',
        realisation: 'Arrondissements 1 (Lumumba) et 2 (Mvoumvou) cartographiés',
        objectifAtteint: 'PARTIEL',
        tauxRealisation: 50,
        periode: 'Mai - Juin 2026',
        observations:
          'Difficultés pour géolocaliser les zones périurbaines en raison de l’absence de GPS et de moyens roulants.',
      },
      {
        id: 'act-stat-3',
        code: 'STAT-03',
        activite: 'Élaboration du bulletin trimestriel des statistiques départementales des loisirs',
        objectifPta: 'Produire le tableau de bord statistique consolidé pour la DGL',
        indicateurCible: '1 bulletin trimestriel validé à transmettre à la tutelle',
        realisation: 'Bulletin T2 rédigé et intégré au présent rapport',
        objectifAtteint: 'OUI',
        tauxRealisation: 100,
        periode: 'Fin Juin 2026',
        observations: 'Document finalisé et visé par le Chef de Service Statistiques.',
      },
    ],

    // 4. TABLEAU SERVICE PROMOTION
    PROMOTION: [
      {
        id: 'act-prom-1',
        code: 'PROM-01',
        activite: 'Installation et animation des points focaux de loisirs dans les entreprises',
        objectifPta: 'Implanter des clubs de détente et de bien-être en milieu professionnel',
        indicateurCible: '8 entreprises ciblées dans le secteur formel ponténégrin',
        realisation: '5 points focaux officiellement installés (Secteur portuaire et logistique)',
        objectifAtteint: 'PARTIEL',
        tauxRealisation: 62.5,
        periode: 'Avril - Mai 2026',
        observations:
          'Excellente réception dans les sociétés de transit. Négociations en cours avec les banques et compagnies pétrolières.',
      },
      {
        id: 'act-prom-2',
        code: 'PROM-02',
        activite: 'Sensibilisation et vulgarisation des loisirs éducatifs et traditionnels',
        objectifPta: 'Faire la promotion des jeux de l’esprit et du patrimoine récréatif congolais',
        indicateurCible: '3 campagnes d’information grand public',
        realisation: '2 campagnes tenues (initiation au Scrabble, promotion du Nzango)',
        objectifAtteint: 'PARTIEL',
        tauxRealisation: 66.7,
        periode: 'Mai - Juin 2026',
        observations:
          'Partenariat noué avec les ligues départementales sportives et récréatives.',
      },
      {
        id: 'act-prom-3',
        code: 'PROM-03',
        activite: 'Développement de partenariats institutionnels et privés pour l’aménagement d’aires',
        objectifPta: 'Signer des conventions pour créer des aires de loisirs gratuites',
        indicateurCible: '2 conventions de partenariat signées',
        realisation: '1 protocole d’accord préliminaire rédigé avec la Mairie',
        objectifAtteint: 'EN_COURS',
        tauxRealisation: 50,
        periode: 'Tout le trimestre',
        observations: 'Projet en cours de validation juridique à la Mairie centrale de Pointe-Noire.',
      },
    ],
  },

  activitesHorsProgrammation: [
    {
      id: 'adhoc-01',
      code: 'ADH-01',
      titre: 'Encadrement récréatif de la Journée Internationale du Travail (1er Mai)',
      serviceResponsable: 'SAA',
      datePeriode: '1er Mai 2026',
      lieu: 'Place de la République & Plage Côte Sauvage',
      contexte: 'Sollicitation officielle par le Cabinet du Préfet de Pointe-Noire',
      resultats: 'Encadrement de 1 200 participants dans des épreuves ludiques et sportives populaires',
      observations: 'Remerciements formels de l’autorité préfectorale.',
    },
    {
      id: 'adhoc-02',
      code: 'ADH-02',
      titre: 'Séance exceptionnelle d’initiation au Scrabble de compétition pour les scolaires',
      serviceResponsable: 'PROMOTION',
      datePeriode: '14 Juin 2026',
      lieu: 'Centre Culturel Jean-Baptiste Tati Loutard',
      contexte: 'Demande des associations de parents d’élèves pour occuper les vacances',
      resultats: '85 élèves formés aux règles officielles du Scrabble francophone',
      observations: 'Création d’un club scolaire de loisirs de l’esprit.',
    },
  ],

  difficultes: [
    {
      id: 'diff-01',
      service: 'DIRECTION_GENERALE',
      titre: 'Absence totale de véhicule de service et moyens de mobilité',
      description:
        'La Direction Départementale et les 4 services ne disposent d’aucun véhicule ni motocyclette de service.',
      impactPta:
        'Empêche la réalisation de 35% des contrôles de conformité et des rondes nocturnes en périphérie.',
      solutionProposee: 'Utilisation des moyens personnels des agents avec frais de transport avancés.',
      attenteHierarchie: 'Attribution urgente d’un véhicule 4x4 tout-terrain par la Direction Générale.',
    },
    {
      id: 'diff-02',
      service: 'SAF',
      titre: 'Pénurie critique en papier réglementaire et fournitures de bureau',
      description:
        'Rupture fréquente de papier A4 80g, encres d’imprimante et chemises d’archivage sécurisées.',
      impactPta: 'Ralentit la délivrance des autorisations d’exploiter et les attestations départementales.',
      solutionProposee: 'Mutualisation ponctuelle avec la régie de recettes.',
      attenteHierarchie: 'Octroi d’une dotation trimestrielle indexée en consommables administratifs.',
    },
    {
      id: 'diff-03',
      service: 'STATISTIQUES',
      titre: 'Absence de terminaux numériques (tablettes) pour la collecte statistique',
      description:
        'Le Service Statistiques opère exclusivement sur des questionnaires papier vulnérables.',
      impactPta: 'Retards importants de traitement et risque de perte d’éléments de preuve.',
      solutionProposee: 'Centralisation et ressaisie hebdomadaire manuelle au bureau.',
      attenteHierarchie: 'Dotation d’au moins 4 tablettes numériques pour le recensement sur le terrain.',
    },
    {
      id: 'diff-04',
      service: 'SAF',
      titre: 'Non-déblocage des crédits de fonctionnement de la Direction Départementale',
      description:
        'Aucun fonds de roulement n’a été décaissé pour couvrir les charges courantes du trimestre.',
      impactPta: 'Paralysie des missions interurbaines et des actions de promotion sur le terrain.',
      solutionProposee: 'Sollicitation de facilités auprès des partenaires locaux.',
      attenteHierarchie: 'Plaidoyer auprès du Ministère pour la mise à disposition des crédits délégués.',
    },
  ],

  perspectives: [
    'Poursuite et intensification du recensement exhaustif des établissements de loisirs par le Service Statistiques.',
    'Renforcement des contrôles inopinés de conformité et de sécurité par le Service Autorisation et Animation (SAA).',
    'Amplification de l’implantation des points focaux de loisirs en milieu professionnel par le Service Promotion.',
    'Amélioration du taux de recouvrement des droits régaliels et consolidation de la régie financière par le SAF.',
    'Lancement de la campagne de sensibilisation des jeunes contre la consommation de stupéfiants dans les espaces de divertissement.',
  ],

  recommandationsDGL: [
    'Attribuer en priorité un véhicule de service 4x4 à la Direction Départementale des Loisirs de Pointe-Noire.',
    'Doter les services de tablettes numériques connectées pour la dématérialisation des fiches statistiques et d’inspection.',
    'Assurer la régularité du versement des crédits de fonctionnement alloués à la DDL-PN.',
  ],

  recommandationsPrefet: [
    'Instruire la Police Nationale et la Gendarmerie pour assister les brigades du SAA lors des opérations de fermeture d’établissements irréguliers.',
    'Faciliter l’octroi de parcelles du domaine public pour l’aménagement de plateformes récréatives populaires pour la jeunesse.',
    'Soutenir les initiatives de promotion du loisir sain en milieu d’entreprise auprès des employeurs du département.',
  ],

  conclusion:
    "En définitive, ce deuxième trimestre 2026 démontre la rigueur et la détermination des quatre services (SAF, SAA, Statistiques, Promotion) sous la supervision de la Direction Départementale des Loisirs de Pointe-Noire. Bien que plusieurs objectifs du PTA n'aient pu être atteints à 100% en raison du manque de véhicules et de matériel, le bilan général confirme l'efficacité du dispositif républicain au service des populations de Pointe-Noire et des orientations de la Direction Générale.",
};
