import React, { useState } from 'react';

type SectionId = 'juridique' | 'protocole' | 'modeles' | 'viewer';

export const ReferentielTextes: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('juridique');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeModel, setActiveModel] = useState<'convocation' | 'compte-rendu' | 'tdr' | 'bordereau'>('convocation');
  const [activeArticle, setActiveArticle] = useState<number>(7);
  const [quickSalute, setQuickSalute] = useState('ministre');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const copyToClipboard = (text: string, notification: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(notification);
    }).catch(() => {
      showToast(notification);
    });
  };

  // Laws Database
  const laws = [
    {
      id: 'ordre-service-028',
      cat: 'ORDRE',
      badge: 'Ordre de Service Régalien',
      date: '31 Août 2026',
      title: 'Ordre de Service N° 028/MCAPNIT/DGL/DDL-PN',
      desc: 'Portant mission de recensement exhaustif, de contrôle de conformité technique (visite de commodo et incommodo) et de recouvrement forcé des droits et redevances des établissements de loisirs marchands à Pointe-Noire. Signé par M. Jean Richard NTSEKE NGOUAKA, Directeur Départemental.',
      tags: ['DDL-PN', 'Mission SAA', 'Enquête Commodo (30 000 FCFA)', 'Répartition 50/50', 'Force Publique'],
      status: 'En Vigueur / Exécutoire',
      actionText: 'Copier Visa',
      visa: 'Vu l\'Ordre de Service N° 028/MCAPNIT/DGL/DDL-PN prescrivant la mission de contrôle et de recouvrement des loisirs à Pointe-Noire ;',
    },
    {
      id: 'circulaire-001',
      cat: 'CIRCULAIRE',
      badge: 'Norme Directrice',
      date: '12 Mai 2026',
      title: 'Circulaire N° 001/MCAPNIT-CAB',
      desc: 'Relative à la normalisation stricte de la correspondance administrative, des en-têtes et du respect absolu des chaînes hiérarchiques au sein des directions centrales et départementales.',
      tags: ['MCAPNIT-CAB', 'Typographie Officielle', 'Application Immédiate'],
      status: 'Vérifié au Journal Officiel',
      actionText: 'Consulter',
      isViewerTarget: true,
      visa: 'Vu la Circulaire ministérielle N° 001/MCAPNIT-CAB relative à la normalisation de la correspondance administrative ;',
    },
    {
      id: 'decret-871',
      cat: 'DECRET',
      badge: 'Décret Présidentiel',
      date: 'J.O. N° 44-2022',
      title: 'Décret N° 2022-871 du 15 Oct. 2022',
      desc: 'Portant attributions et organisation de la Direction Générale des Loisirs (DGL). Fixe la tutelle technique des directions départementales, le contrôle récréatif et le cadre des homologations.',
      tags: ['Attributions DGL', 'Tutelle Régalienne', 'Art. 12 à 24'],
      status: 'Texte de Référence',
      actionText: 'Copier Visa',
      visa: 'Vu le Décret N° 2022-871 portant attributions et organisation de la Direction Générale des Loisirs (DGL) ;',
    },
    {
      id: 'arrete-4118',
      cat: 'DECRET',
      badge: 'Arrêté Ministériel',
      date: 'Brazzaville',
      title: 'Arrêté N° 4118/MCAPNIT/CAB',
      desc: "Fixant les attributions spécifiques de la Direction Départementale des Loisirs de Pointe-Noire (DDL-PN), l'autorité déléguée de signature et la gestion des sections administratives.",
      tags: ['Compétence Territoriale', 'Pointe-Noire', 'Délégation'],
      status: 'Texte de Référence',
      actionText: 'Copier Visa',
      visa: 'Vu l\'Arrêté N° 4118/MCAPNIT/CAB fixant les attributions spécifiques de la DDL-PN ;',
    },
    {
      id: 'decret-2019-301',
      cat: 'ERP',
      badge: 'Sécurité Publique',
      date: 'Décret N° 2019-301',
      title: 'Décret ERP & Salles de Loisirs N° 2019-301',
      desc: "Conditions d'ouverture, d'exploitation technique, d'insonorisation et d'homologation des parcs d'attraction, discothèques, complexes sportivo-récréatifs et centres de jeunesse.",
      tags: ["Capacité d'accueil", 'Visite de conformité', 'Sanctions'],
      status: 'Article 7, 9 & 14',
      actionText: 'Analyser Articles',
      isViewerTarget: true,
      visa: 'Vu le Décret N° 2019-301 fixant les conditions d\'homologation et de sécurité des établissements de loisirs (Art. 7) ;',
    },
    {
      id: 'loi-10-2010',
      cat: 'LOI',
      badge: 'Loi Organique',
      date: 'Loi N° 10-2010',
      title: 'Loi N° 10-2010 portant Orientation des Loisirs',
      desc: 'Définition du droit aux loisirs sains et éducatifs pour les citoyens congolais. Régime des partenariats public-privé et obligations des collectivités territoriales départementales.',
      tags: ['Droit Récréatif', 'Partenariat PPP', 'Loi Fondamentale'],
      status: 'Promulguée',
      actionText: 'Copier Visa',
      visa: 'Vu la Loi N° 10-2010 portant Orientation générale des Loisirs en République du Congo ;',
    },
    {
      id: 'arrete-890',
      cat: 'ERP',
      badge: 'Redevances & Taxes',
      date: 'Arrêté N° 890',
      title: 'Arrêté Interministériel N° 890/2021',
      desc: "Fixation de la grille tarifaire des frais de dossier d'agrément, d'inspection technique préalable et de renouvellement annuel des licences d'exploitation récréative à Pointe-Noire.",
      tags: ['Frais de Dossier', 'Trésor Public', 'Quittance DDL-PN'],
      status: 'Tarifs Validés',
      actionText: 'Copier Visa',
      visa: 'Vu l\'Arrêté Interministériel N° 890/2021 fixant la tarification des droits de contrôle et d\'agrément récréatif ;',
    },
  ];

  const filteredLaws = laws.filter((law) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      !q ||
      law.title.toLowerCase().includes(q) ||
      law.desc.toLowerCase().includes(q) ||
      law.tags.some((t) => t.toLowerCase().includes(q));
    const matchCat = selectedCategory === 'ALL' || law.cat === selectedCategory;
    return matchQ && matchCat;
  });

  // ERP Articles Data
  const articlesData: Record<number, { num: string; text: string; guide: string }> = {
    1: {
      num: 'Article 1er — Champ d’Application Récréatif',
      text: '« Le présent décret détermine sur l\'ensemble du territoire national, et particulièrement dans les départements urbanisés, les règles techniques, sécuritaires, et sanitaires régissant les espaces et infrastructures dédiés aux activités de loisirs, de détente collective et de divertissement. »',
      guide: '• Applicable à tous les promoteurs privés, collectivités locales et établissements scolaires disposant d\'aires ludiques ouvertes aux tiers.',
    },
    7: {
      num: 'Article 7 — Dispositions Impératives d’Exploitation (Clef)',
      text: '« Nul ne peut ouvrir, réaménager ou exploiter un établissement de loisirs, une salle de jeux électroniques, un parc d\'attraction ou un dancing sur l\'étendue du département de Pointe-Noire sans avoir obtenu au préalable l\'Agrément Technique délivré par la Direction Départementale des Loisirs, après avis conforme de la commission de sécurité. »',
      guide: '• Délai légal : 15 jours francs.\n• Autorité compétente : Le Directeur Départemental des Loisirs.\n• Pièces requises : Plan cadastral, quittance du trésor, assurance responsabilité civile.',
    },
    9: {
      num: 'Article 9 — Normes Acoustiques & Salubrité Nocturne',
      text: '« L\'émergence sonore perçue à l\'extérieur des salles de loisirs et complexes festifs ne peut excéder 45 décibels entre 22 heures et 06 heures du matin. Les exploitants ont l\'obligation d\'installer des limiteurs de pression acoustique plombés sous le contrôle des agents assermentés de la DDL-PN. »',
      guide: '• En cas de dépassement constaté par sonomètre homologué : mise en demeure sous 24 heures.\n• Sanction directe : Suspension immédiate de la licence nocturne.',
    },
    14: {
      num: 'Article 14 — Fermeture Administrative et Sanctions',
      text: '« En cas de récidive ou d\'exploitation clandestine sans arrêté d\'homologation, le Directeur Départemental des Loisirs saisit immédiatement le Préfet de Pointe-Noire aux fins de prononcer la fermeture administrative de l\'établissement, sans préjudice des poursuites judiciaires prévues par la loi pénale. »',
      guide: '• Requiert l\'établissement d\'un Procès-Verbal de Constat régulier signé par 2 inspecteurs DDL-PN assermentés.',
    },
    22: {
      num: 'Article 22 — Dispositions Transitoires & Exécution',
      text: '« Les exploitants en exercice à la date de promulgation du présent décret disposent d\'un délai impératif de six mois pour conformer leurs installations aux nouvelles dispositions de sécurité et de filtrage. Le Ministre de la Culture, des Arts et du Tourisme ainsi que le Ministre de l\'Intérieur sont chargés, chacun en ce qui le concerne, de l\'exécution du présent décret. »',
      guide: '• Délai transitoire désormais clos. Tous les établissements sans dossier à jour sont en situation d\'infraction caractérisée.',
    },
  };

  const currentArticle = articlesData[activeArticle] || articlesData[7];

  const handleCopyVisasBlock = () => {
    const visas =
      'Vu la Constitution de la République du Congo ;\nVu la Loi N° 10-2010 portant Orientation des Loisirs ;\nVu le Décret N° 2022-871 portant attributions et organisation de la Direction Générale des Loisirs ;\nVu le Décret N° 2019-301 fixant les conditions d\'homologation des Établissements de Loisirs ;\nVu la Circulaire ministérielle N° 001/MCAPNIT-CAB relative à la normalisation de la correspondance administrative ;';
    copyToClipboard(visas, 'Bloc de Visas Officiels copié pour votre acte !');
  };

  const handleCopyCourtesy = () => {
    let text = '';
    if (quickSalute === 'ministre') {
      text =
        'Monsieur le Ministre,\n\nJe vous prie d\'agréer, Monsieur le Ministre, l\'expression de ma très haute et respectueuse considération.';
    } else if (quickSalute === 'prefet') {
      text =
        'Monsieur le Préfet,\n\nVeuillez agréer, Monsieur le Préfet, les assurances de ma très haute considération.';
    } else if (quickSalute === 'dg') {
      text =
        'Monsieur le Directeur Général,\n\nJe vous prie de croire, Monsieur le Directeur Général, en l\'assurance de ma considération distinguée.';
    } else if (quickSalute === 'maire') {
      text =
        'Monsieur le Député-Maire,\n\nJe vous prie d\'agréer, Monsieur le Député-Maire, l\'expression de mes sentiments distingués.';
    } else {
      text =
        'Monsieur le Promoteur,\n\nVeuillez recevoir, Monsieur le Promoteur, mes salutations distinguées.';
    }
    copyToClipboard(text, 'Formule protocolaire copiée dans le presse-papier !');
  };

  return (
    <div className="flex flex-col w-full text-left gap-6 pb-12">
      {/* BANDEAU SUPÉRIEUR D'AUTORITÉ JURIDIQUE & VEILLE RÉGLEMENTAIRE */}
      <div className="w-full bg-[#f1f3ff] rounded-xl p-6 shadow-sm relative overflow-hidden border border-[#dde2f3]">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#022448]/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-1 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#022448] text-white font-sans text-[10px] uppercase font-bold tracking-wider">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                Principe Zéro Invention
              </span>
              <span className="px-2 py-0.5 rounded bg-[#e8eeff] text-[#43474e] font-sans text-[10px] font-semibold">
                Référentiel Juridique Actif : V4.2 - Mars 2026
              </span>
              <span className="text-[#006d2f] font-sans text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#006d2f] inline-block"></span>
                Base Certifiée MCAPNIT / DGL
              </span>
            </div>

            <h1 className="font-garamond text-[26px] font-bold text-[#022448] mt-1 leading-tight">
              Référentiel Légal, Guide Protocolaire &amp; Bibliothèque d'Actes
            </h1>

            <p className="font-serif text-[13px] text-[#43474e] leading-relaxed">
              Banque institutionnelle d'opposabilité pour le département de Pointe-Noire. Tout visa, appel de décrets, suscription et modèle rédactionnel généré au sein de la DDL-PN doit impérativement concorder avec les textes archivés ci-dessous.
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex items-center gap-4 shrink-0 bg-[#ffffff] p-4 rounded-lg shadow-sm border border-[#e8eeff]">
            <div className="flex flex-col">
              <span className="font-sans text-[9px] uppercase text-[#43474e] font-bold">Textes Consignés</span>
              <span className="font-garamond text-[22px] font-bold text-[#022448]">148</span>
              <span className="font-sans text-[10px] text-[#006d2f] font-bold">100% vérifiés</span>
            </div>

            <div className="w-px h-10 bg-[#c4c6cf]"></div>

            <div className="flex flex-col">
              <span className="font-sans text-[9px] uppercase text-[#43474e] font-bold">Fiches Types</span>
              <span className="font-garamond text-[22px] font-bold text-[#6d5e00]">18</span>
              <span className="font-sans text-[10px] text-[#43474e]">Format A4 Prêt</span>
            </div>

            <div className="w-px h-10 bg-[#c4c6cf]"></div>

            <div className="flex flex-col">
              <span className="font-sans text-[9px] uppercase text-[#43474e] font-bold">Dernière Circulaire</span>
              <span className="font-garamond text-[16px] font-bold text-[#022448]">N° 001/26</span>
              <span className="font-sans text-[10px] text-[#43474e]">12 Mai 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSection('juridique')}
          className={`px-4 py-2 rounded font-sans text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer font-bold ${
            activeSection === 'juridique'
              ? 'bg-[#022448] text-white shadow-sm'
              : 'bg-[#f1f3ff] text-[#43474e] hover:bg-[#e8eeff]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          1. Référentiel Réglementaire &amp; Moteur
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('protocole')}
          className={`px-4 py-2 rounded font-sans text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer font-bold ${
            activeSection === 'protocole'
              ? 'bg-[#022448] text-white shadow-sm'
              : 'bg-[#f1f3ff] text-[#43474e] hover:bg-[#e8eeff]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history_edu</span>
          2. Protocole &amp; Formules Consulaires
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('modeles')}
          className={`px-4 py-2 rounded font-sans text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer font-bold ${
            activeSection === 'modeles'
              ? 'bg-[#022448] text-white shadow-sm'
              : 'bg-[#f1f3ff] text-[#43474e] hover:bg-[#e8eeff]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">description</span>
          3. Modèles de Fiches Types
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('viewer')}
          className={`px-4 py-2 rounded font-sans text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer font-bold ${
            activeSection === 'viewer'
              ? 'bg-[#022448] text-white shadow-sm'
              : 'bg-[#f1f3ff] text-[#43474e] hover:bg-[#e8eeff]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">policy</span>
          4. Consultation Interactive Décret ERP
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1 : RÉFÉRENTIEL DES TEXTES & MOTEUR                             */}
      {/* ========================================================================= */}
      {activeSection === 'juridique' && (
        <section className="flex flex-col gap-6 animate-in fade-in duration-150">
          {/* Search bar & Category Pills */}
          <div className="bg-[#ffffff] p-4 rounded-xl shadow-sm border border-[#e8eeff] flex flex-col md:flex-row gap-3 items-stretch justify-between">
            <div className="flex-1 relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#43474e] text-[20px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par numéro de décret, loi, objet, ERP, mot-clé (ex: ERP, licence, tutelle)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f1f3ff] text-[#161c27] text-serif text-[13px] rounded border border-[#c4c6cf]/50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#022448]"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'LOI', 'DECRET', 'CIRCULAIRE', 'ERP'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded font-sans text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#022448] text-white'
                      : 'bg-[#f1f3ff] text-[#43474e] hover:bg-[#e8eeff]'
                  }`}
                >
                  {cat === 'ALL'
                    ? `Tous (${laws.length})`
                    : cat === 'LOI'
                    ? 'Lois & Codes'
                    : cat === 'DECRET'
                    ? 'Décrets'
                    : cat === 'CIRCULAIRE'
                    ? 'Circulaires'
                    : 'ERP & Récréatif'}
                </button>
              ))}
            </div>
          </div>

          {/* Laws Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredLaws.map((law) => (
              <article
                key={law.id}
                className="bg-[#ffffff] p-4 rounded-xl shadow-sm border border-[#e8eeff] flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded font-sans text-[9px] font-bold uppercase ${
                        law.cat === 'CIRCULAIRE'
                          ? 'bg-[#d5e3ff] text-[#001c3b]'
                          : law.cat === 'ERP'
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : 'bg-[#e8eeff] text-[#022448]'
                      }`}
                    >
                      {law.badge}
                    </span>
                    <span className="font-sans text-[10px] text-[#43474e] font-semibold">{law.date}</span>
                  </div>

                  <h2 className="font-garamond text-[17px] font-bold text-[#022448] mt-1 leading-snug">
                    {law.title}
                  </h2>

                  <p className="font-serif text-[11.5px] text-[#43474e] line-clamp-3 leading-relaxed">
                    {law.desc}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {law.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-sans uppercase font-semibold px-1.5 py-0.5 rounded bg-[#f1f3ff] text-[#43474e]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 mt-4 flex items-center justify-between bg-[#f1f3ff]/60 -mx-4 -mb-4 p-3 rounded-b-xl border-t border-[#e8eeff]">
                  <span className="font-sans text-[10px] text-[#022448] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#006d2f]">check_circle</span>
                    {law.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (law.isViewerTarget) {
                        setActiveSection('viewer');
                        showToast(`Ouverture interactive de ${law.title}...`);
                      } else {
                        copyToClipboard(law.visa, `Visa officiel copié pour ${law.title} !`);
                      }
                    }}
                    className="font-sans text-[11px] text-[#022448] hover:text-[#006d2f] flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <span>{law.actionText}</span>
                    <span className="material-symbols-outlined text-[15px]">
                      {law.isViewerTarget ? 'arrow_forward' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Banner 'Zéro Invention' */}
          <div className="bg-[#022448] text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4 max-w-3xl">
              <span className="material-symbols-outlined text-[36px] text-[#ffe251] shrink-0">shield</span>
              <div className="flex flex-col gap-1">
                <h3 className="font-garamond text-[18px] font-bold text-[#ffe251]">
                  Consigne Impérative de Rédaction Légale : 'Zéro Invention'
                </h3>
                <p className="font-serif text-[12px] text-white/90 leading-relaxed">
                  L'agent ou le greffier administratif ne doit en aucun cas fabriquer ou extrapoler un numéro d'arrêté ou une référence temporelle. Tout projet de courrier, note de service ou arrêté préfectoral intégrant un faux visa sera bloqué lors du contrôle de conformité hiérarchique.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={handleCopyVisasBlock}
                className="px-4 py-2.5 bg-white text-[#022448] font-sans text-[11px] rounded font-bold uppercase hover:bg-[#f1f3ff] transition-colors flex items-center gap-2 cursor-pointer shadow"
              >
                <span className="material-symbols-outlined text-[16px]">format_quote</span>
                Générer Bloc des Visas Officiels
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2 : PROTOCOLE & FORMULES CONSULAIRES                            */}
      {/* ========================================================================= */}
      {activeSection === 'protocole' && (
        <section className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Col 1 : Codification des Références */}
            <div className="bg-[#ffffff] p-6 rounded-xl shadow-sm border border-[#e8eeff] flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#022448] text-[22px]">tag</span>
                <h3 className="font-garamond text-[18px] font-bold text-[#022448]">Codification des Références</h3>
              </div>
              <p className="font-serif text-[12px] text-[#43474e]">
                Norme stricte définie par la Circulaire Ministérielle N° 001/MCAPNIT-CAB pour l'ensemble des dépêches et correspondances de la DDL-PN.
              </p>

              <div className="p-3 bg-[#f1f3ff] rounded-lg flex flex-col gap-1 font-mono text-[11px] text-[#022448] border border-[#dde2f3]">
                <div className="font-sans text-[9px] uppercase text-[#43474e] font-bold">Modèle Type :</div>
                <div className="p-2 bg-white rounded font-bold text-[#022448] select-all border border-[#dde2f3]">
                  N° [___]/MCAPNIT/DGL/DDL-PN/[CODE_SERVICE]
                </div>
                <div className="mt-2 text-[11px] text-[#43474e] font-serif flex flex-col gap-1">
                  <div><strong className="text-[#022448] font-mono">SAA</strong> : Service Assistance et Autorisation</div>
                  <div><strong className="text-[#022448] font-mono">SAFM</strong> : Service Administratif, Financier &amp; Matériel</div>
                  <div><strong className="text-[#022448] font-mono">SPA</strong> : Service Promotion &amp; Activités</div>
                </div>
              </div>

              <div className="p-3 bg-[#e3e8f9] rounded-lg flex flex-col gap-1">
                <span className="font-sans text-[10px] uppercase text-[#022448] font-bold">
                  Règle de Suscription Spécifique
                </span>
                <p className="font-serif text-[12px] text-[#161c27]">
                  Conformément à l'usage de la chancellerie, le titre du signataire en pied de page est traditionnellement composé en police cursive solennelle (<strong className="italic">Monotype Corsiva 20pt</strong> ou <em>EB Garamond Italique Grand Corps</em>) :
                </p>
                <div className="p-3 bg-white rounded text-center italic font-garamond text-[18px] font-bold text-[#022448] border border-[#dde2f3]">
                  Le Directeur Départemental des Loisirs
                </div>
              </div>
            </div>

            {/* Col 2 & 3 : Matrice Hiérarchique */}
            <div className="lg:col-span-2 bg-[#ffffff] p-6 rounded-xl shadow-sm border border-[#e8eeff] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006d2f] text-[22px]">account_balance</span>
                  <h3 className="font-garamond text-[18px] font-bold text-[#022448]">
                    Matrice Protocolaire selon le Destinataire
                  </h3>
                </div>
                <span className="font-sans text-[10px] uppercase text-[#43474e] bg-[#f1f3ff] px-2.5 py-1 rounded font-bold">
                  Usage République du Congo
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-serif text-[11.5px]">
                  <thead>
                    <tr className="bg-[#f1f3ff] text-[#161c27] font-sans text-[10px] uppercase font-bold">
                      <th className="p-3">Destinataire &amp; Rang</th>
                      <th className="p-3">Formule d'Attaque</th>
                      <th className="p-3">Suscription</th>
                      <th className="p-3">Formule Finale de Courtoisie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f3ff]">
                    <tr className="hover:bg-[#f1f3ff]/60">
                      <td className="p-3 align-top font-bold text-[#022448]">
                        Monsieur le Ministre (MCAPNIT)
                        <span className="block text-[10px] font-normal text-[#43474e]">Membre du Gouvernement</span>
                      </td>
                      <td className="p-3 align-top font-mono text-[11px] text-[#022448]">"Monsieur le Ministre,"</td>
                      <td className="p-3 align-top">
                        <span className="px-2 py-0.5 rounded bg-[#d5e3ff] text-[#001c3b] font-sans text-[10px] font-bold">
                          Haute Déférence
                        </span>
                      </td>
                      <td className="p-3 align-top text-[#43474e] italic">
                        "Je vous prie d'agréer, Monsieur le Ministre, l'expression de ma très haute et respectueuse considération."
                      </td>
                    </tr>

                    <tr className="hover:bg-[#f1f3ff]/60">
                      <td className="p-3 align-top font-bold text-[#022448]">
                        Monsieur le Préfet de Pointe-Noire
                        <span className="block text-[10px] font-normal text-[#43474e]">Représentant du Chef de l'État</span>
                      </td>
                      <td className="p-3 align-top font-mono text-[11px] text-[#022448]">"Monsieur le Préfet,"</td>
                      <td className="p-3 align-top">
                        <span className="px-2 py-0.5 rounded bg-[#e8eeff] text-[#022448] font-sans text-[10px] font-bold">
                          Très Haute Considération
                        </span>
                      </td>
                      <td className="p-3 align-top text-[#43474e] italic">
                        "Veuillez agréer, Monsieur le Préfet, les assurances de ma très haute considération."
                      </td>
                    </tr>

                    <tr className="hover:bg-[#f1f3ff]/60">
                      <td className="p-3 align-top font-bold text-[#022448]">
                        Monsieur le Directeur Général des Loisirs
                        <span className="block text-[10px] font-normal text-[#43474e]">Supérieur Hiérarchique</span>
                      </td>
                      <td className="p-3 align-top font-mono text-[11px] text-[#022448]">"Monsieur le Directeur Général,"</td>
                      <td className="p-3 align-top">
                        <span className="px-2 py-0.5 rounded bg-[#e3e8f9] text-[#161c27] font-sans text-[10px] font-bold">
                          Respectueuse Considération
                        </span>
                      </td>
                      <td className="p-3 align-top text-[#43474e] italic">
                        "Je vous prie de croire, Monsieur le Directeur Général, en l'assurance de ma considération distinguée."
                      </td>
                    </tr>

                    <tr className="hover:bg-[#f1f3ff]/60">
                      <td className="p-3 align-top font-bold text-[#022448]">
                        Monsieur le Député-Maire de Pointe-Noire
                        <span className="block text-[10px] font-normal text-[#43474e]">Autorité Municipale Élue</span>
                      </td>
                      <td className="p-3 align-top font-mono text-[11px] text-[#022448]">"Monsieur le Député-Maire,"</td>
                      <td className="p-3 align-top">
                        <span className="px-2 py-0.5 rounded bg-[#f1f3ff] text-[#43474e] font-sans text-[10px] font-bold">
                          Haute Considération
                        </span>
                      </td>
                      <td className="p-3 align-top text-[#43474e] italic">
                        "Je vous prie d'agréer, Monsieur le Député-Maire, l'expression de mes sentiments distingués."
                      </td>
                    </tr>

                    <tr className="hover:bg-[#f1f3ff]/60">
                      <td className="p-3 align-top font-bold text-[#022448]">
                        Promoteurs &amp; Opérateurs Récréatifs
                        <span className="block text-[10px] font-normal text-[#43474e]">Secteur Privé</span>
                      </td>
                      <td className="p-3 align-top font-mono text-[11px] text-[#022448]">"Monsieur le Promoteur,"</td>
                      <td className="p-3 align-top">
                        <span className="px-2 py-0.5 rounded bg-[#f1f3ff] text-[#43474e] font-sans text-[10px] font-bold">
                          Considération Distinguée
                        </span>
                      </td>
                      <td className="p-3 align-top text-[#43474e] italic">
                        "Veuillez recevoir, Monsieur le Promoteur, mes salutations distinguées."
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Fast Injector */}
              <div className="p-4 bg-[#f1f3ff] rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-[#dde2f3]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#022448]">tune</span>
                  <div className="flex flex-col">
                    <span className="font-sans text-[10px] uppercase font-bold text-[#022448]">
                      Injecteur Rapide de Formule
                    </span>
                    <span className="font-serif text-[11px] text-[#43474e]">
                      Sélectionnez le rang pour copier le bloc épistolaire complet dans le presse-papier.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={quickSalute}
                    onChange={(e) => setQuickSalute(e.target.value)}
                    className="px-3 py-1.5 bg-white rounded font-sans text-[11px] text-[#022448] font-bold border border-[#c4c6cf] focus:outline-none"
                  >
                    <option value="ministre">Au Ministre MCAPNIT</option>
                    <option value="prefet">Au Préfet de Pointe-Noire</option>
                    <option value="dg">Au Directeur Général DGL</option>
                    <option value="maire">Au Maire de la Ville</option>
                    <option value="promoteur">Aux Promoteurs Privés</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleCopyCourtesy}
                    className="px-4 py-1.5 bg-[#022448] text-white font-sans text-[11px] uppercase font-bold rounded hover:bg-[#1e3a5f] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    Copier Formule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3 : BIBLIOTHÈQUE DE MODÈLES DE FICHES TYPES                     */}
      {/* ========================================================================= */}
      {activeSection === 'modeles' && (
        <section className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-garamond text-[22px] font-bold text-[#022448]">
                Bibliothèque des Actes et Fiches Types Normalisées
              </h3>
              <p className="font-serif text-[13px] text-[#43474e]">
                Conformes aux modèles d'archivage départemental, visés pour l'exercice administratif 2026.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#80f899]/30 text-[#006d2f] rounded font-sans text-[10px] uppercase font-bold">
              <span className="material-symbols-outlined text-[14px]">checklist</span> 4 Modèles Clés Disponibles
            </span>
          </div>

          {/* Model Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Model 1 */}
            <button
              type="button"
              onClick={() => {
                setActiveModel('convocation');
                showToast('Modèle Convocation chargé !');
              }}
              className={`p-4 bg-white text-left rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer border ${
                activeModel === 'convocation' ? 'border-b-4 border-b-[#022448] border-[#022448]/40' : 'border-[#e8eeff]'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="w-10 h-10 rounded bg-[#d5e3ff] flex items-center justify-center text-[#022448] mb-1">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <span className="font-garamond text-[17px] font-bold text-[#022448]">Fiche Convocation</span>
                <p className="font-serif text-[11.5px] text-[#43474e]">
                  Avec contrôle jour/date automatique, quorum, et délai réglementaire de prévenance de 72h.
                </p>
              </div>
              <span className="font-sans text-[10px] uppercase text-[#022448] font-bold mt-4 flex items-center gap-1">
                Ouvrir le gabarit <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </span>
            </button>

            {/* Model 2 */}
            <button
              type="button"
              onClick={() => {
                setActiveModel('compte-rendu');
                showToast('Modèle Compte-Rendu chargé !');
              }}
              className={`p-4 bg-white text-left rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer border ${
                activeModel === 'compte-rendu' ? 'border-b-4 border-b-[#022448] border-[#022448]/40' : 'border-[#e8eeff]'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="w-10 h-10 rounded bg-[#e8eeff] flex items-center justify-center text-[#022448] mb-1">
                  <span className="material-symbols-outlined">summarize</span>
                </div>
                <span className="font-garamond text-[17px] font-bold text-[#022448]">Compte-Rendu Réunion</span>
                <p className="font-serif text-[11.5px] text-[#43474e]">
                  Ton narratif neutre d'autorité, présences, et tableau décisionnel [Action | Responsable | Délai].
                </p>
              </div>
              <span className="font-sans text-[10px] uppercase text-[#022448] font-bold mt-4 flex items-center gap-1">
                Ouvrir le gabarit <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </span>
            </button>

            {/* Model 3 */}
            <button
              type="button"
              onClick={() => {
                setActiveModel('tdr');
                showToast('Modèle Termes de Référence chargé !');
              }}
              className={`p-4 bg-white text-left rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer border ${
                activeModel === 'tdr' ? 'border-b-4 border-b-[#022448] border-[#022448]/40' : 'border-[#e8eeff]'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="w-10 h-10 rounded bg-[#e8eeff] flex items-center justify-center text-[#022448] mb-1">
                  <span className="material-symbols-outlined">assignment</span>
                </div>
                <span className="font-garamond text-[17px] font-bold text-[#022448]">TDR &amp; Budget FCFA</span>
                <p className="font-serif text-[11.5px] text-[#43474e]">
                  Termes de Référence complets avec fiche signalétique, ventilation financière et chronogramme PTA.
                </p>
              </div>
              <span className="font-sans text-[10px] uppercase text-[#022448] font-bold mt-4 flex items-center gap-1">
                Ouvrir le gabarit <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </span>
            </button>

            {/* Model 4 */}
            <button
              type="button"
              onClick={() => {
                setActiveModel('bordereau');
                showToast('Modèle Bordereau chargé !');
              }}
              className={`p-4 bg-white text-left rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer border ${
                activeModel === 'bordereau' ? 'border-b-4 border-b-[#022448] border-[#022448]/40' : 'border-[#e8eeff]'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="w-10 h-10 rounded bg-[#e8eeff] flex items-center justify-center text-[#022448] mb-1">
                  <span className="material-symbols-outlined">move_to_inbox</span>
                </div>
                <span className="font-garamond text-[17px] font-bold text-[#022448]">Bordereau &amp; Envoi</span>
                <p className="font-serif text-[11.5px] text-[#43474e]">
                  Bordereau de transmission de pièces et lettre de sollicitation officielle de concours technique.
                </p>
              </div>
              <span className="font-sans text-[10px] uppercase text-[#022448] font-bold mt-4 flex items-center gap-1">
                Ouvrir le gabarit <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </span>
            </button>
          </div>

          {/* Model Sheet Preview */}
          <div className="bg-[#f1f3ff] p-6 rounded-xl shadow-inner flex flex-col items-center border border-[#dde2f3]">
            <div className="w-full max-w-4xl flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-sans text-[10px] uppercase text-[#43474e] font-bold">Gabarit Actif :</span>
                <span className="font-garamond text-[18px] font-bold text-[#022448]">
                  {activeModel === 'convocation' && 'Fiche Type : Convocation Officielle avec Quorum'}
                  {activeModel === 'compte-rendu' && 'Fiche Type : Compte-Rendu de Réunion Administrative'}
                  {activeModel === 'tdr' && 'Fiche Type : Termes de Référence de Projet (TDR) & Budget FCFA'}
                  {activeModel === 'bordereau' && 'Fiche Type : Bordereau de Transmission de Pièces'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard('Contenu de la fiche type', 'Texte du gabarit copié !')}
                  className="px-4 py-1.5 bg-white text-[#022448] rounded font-sans text-[11px] uppercase font-bold border border-[#c4c6cf] hover:bg-[#f1f3ff] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  Copier Texte
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#022448] text-white rounded font-sans text-[11px] uppercase font-bold hover:bg-[#1e3a5f] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Imprimer A4
                </button>
              </div>
            </div>

            {/* A4 Sheet Container */}
            <div className="w-full max-w-[794px] bg-white shadow-xl rounded p-8 sm:p-12 flex flex-col gap-6 text-[#161c27] border border-[#dde2f3]">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center text-center max-w-[320px]">
                  <span className="font-sans text-[10px] uppercase font-bold text-[#022448] leading-tight">
                    RÉPUBLIQUE DU CONGO
                  </span>
                  <span className="font-serif text-[9px] text-[#006d2f] italic">Unité • Travail • Progrès</span>
                  <div className="w-16 h-0.5 bg-[#006d2f] my-1"></div>
                  <span className="font-sans text-[8.5px] font-semibold uppercase text-[#022448] leading-tight">
                    MINISTÈRE DE LA CULTURE, DES ARTS, DU PATRIMOINE NATIONAL ET DE L'INDUSTRIE TOURISTIQUE
                  </span>
                  <div className="w-10 h-0.5 bg-[#c4c6cf] my-1"></div>
                  <span className="font-sans text-[8px] uppercase text-[#43474e]">DIRECTION GÉNÉRALE DES LOISIRS</span>
                  <span className="font-sans text-[8.5px] font-bold uppercase text-[#022448] mt-0.5">
                    DIRECTION DÉPARTEMENTALE DE POINTE-NOIRE
                  </span>
                  <span className="font-mono text-[9px] text-[#43474e] mt-1">RÉF : N° 048/MCAPNIT/DGL/DDL-PN/SAA-26</span>
                </div>

                <div className="flex flex-col text-right font-serif text-[12px]">
                  <span className="italic text-[#022448]">Pointe-Noire, le 24 Mars 2026</span>
                  <div className="mt-3 p-2 bg-[#f1f3ff] rounded text-left border-l-2 border-[#022448] text-[11px]">
                    <span className="font-sans text-[9px] uppercase text-[#43474e] block">Destinataire :</span>
                    <span className="font-bold text-[#022448] block">Monsieur le Représentant des Exploitants</span>
                    <span className="text-[#43474e]">Arrondissement 1 Lumumba, Pointe-Noire</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Model Content */}
              {activeModel === 'convocation' && (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="text-center my-2">
                    <h4 className="font-garamond text-[22px] font-bold uppercase tracking-wide text-[#022448] underline underline-offset-8">
                      CONVOCATION
                    </h4>
                    <span className="font-sans text-[11px] text-[#43474e] uppercase mt-1 block font-semibold">
                      Séance Plénière de la Commission de Sécurité et d'Homologation des Loisirs
                    </span>
                  </div>

                  <p className="font-serif text-[12.5px] text-justify leading-relaxed">
                    Il est porté à la connaissance de l'ensemble des membres et exploitants concernés qu'une séance de travail technique est programmée selon les dispositions ci-après :
                  </p>

                  <div className="bg-[#f1f3ff] p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-2 font-serif text-[12px] border border-[#dde2f3]">
                    <div><strong className="font-bold text-[#022448]">Date vérifiée :</strong> Mardi 31 Mars 2026</div>
                    <div><strong className="font-bold text-[#022448]">Heure précise :</strong> 09 heures 30 minutes</div>
                    <div><strong className="font-bold text-[#022448]">Lieu de séance :</strong> Salle DDL-PN, Centre-Ville</div>
                    <div><strong className="font-bold text-[#022448]">Délai de prévenance :</strong> 7 jours francs</div>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <span className="font-sans text-[10px] uppercase font-bold text-[#022448]">ORDRE DU JOUR RETENU :</span>
                    <ol className="list-decimal pl-5 font-serif text-[12px] space-y-1 text-[#161c27]">
                      <li>Examen des dossiers d'homologation des parcs et aires de jeux de l'Arrondissement 2 Mvoumvou.</li>
                      <li>Présentation des directives acoustiques et sécuritaires conformément au Décret N° 2019-301.</li>
                      <li>Modalités de délivrance des attestations temporaires d'ouverture pour la saison récréative 2026.</li>
                      <li>Questions diverses.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeModel === 'compte-rendu' && (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="text-center my-2">
                    <h4 className="font-garamond text-[22px] font-bold uppercase tracking-wide text-[#022448] underline underline-offset-8">
                      COMPTE-RENDU DE RÉUNION
                    </h4>
                    <span className="font-sans text-[11px] text-[#43474e] uppercase mt-1 block font-semibold">
                      Session de Suivi des Inspections de Salubrité et de Sécurité Récréative
                    </span>
                  </div>

                  <div className="bg-[#f1f3ff] p-2 rounded font-serif text-[11.5px] flex justify-between border border-[#dde2f3]">
                    <span><strong>Présidence :</strong> M. Jean Richard NTSEKE NGOUAKA, DDL-PN</span>
                    <span><strong>Rapporteur :</strong> M. Jacques Alphonse MATOKO, SAA</span>
                  </div>

                  <p className="font-serif text-[12.5px] text-justify leading-relaxed">
                    L'an deux mille vingt-six et le vingt-deux mars à dix heures, s'est tenue dans les locaux de la Direction Départementale des Loisirs, la réunion trimestrielle de cadrage opérationnel des inspecteurs de terrain.
                  </p>

                  <span className="font-sans text-[10px] uppercase font-bold text-[#022448]">
                    SYNTHÈSE DES DÉCISIONS ET TABLEAU D'ACTIONS
                  </span>

                  <table className="w-full text-left font-serif text-[11px] border border-[#dde2f3]">
                    <thead className="bg-[#f1f3ff] text-[#022448] font-sans text-[9px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Action Assignée</th>
                        <th className="p-2">Responsable</th>
                        <th className="p-2">Délai Rigoureux</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dde2f3]">
                      <tr>
                        <td className="p-2">Notification formelle aux 12 dancings non homologués</td>
                        <td className="p-2 font-bold text-[#022448]">Chef Service SAA</td>
                        <td className="p-2 text-[#006d2f] font-bold">48 Heures</td>
                      </tr>
                      <tr>
                        <td className="p-2">Consolidation du registre d'immatriculation trimestriel PTA</td>
                        <td className="p-2 font-bold text-[#022448]">Chef Section SAA</td>
                        <td className="p-2 text-[#006d2f] font-bold">Vendredi 27 Mars</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeModel === 'tdr' && (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="text-center my-2">
                    <h4 className="font-garamond text-[22px] font-bold uppercase tracking-wide text-[#022448] underline underline-offset-8">
                      TERMES DE RÉFÉRENCE (TDR)
                    </h4>
                    <span className="font-sans text-[11px] text-[#43474e] uppercase mt-1 block font-semibold">
                      Programme Départemental « Loisirs Sains &amp; Jeunesse Active 2026 »
                    </span>
                  </div>

                  <div className="bg-[#f1f3ff] p-3 rounded font-serif text-[12px] space-y-1 border border-[#dde2f3]">
                    <div><strong className="text-[#022448]">Intitulé :</strong> Campagne d'animation récréative et d'initiation aux jeux patrimoniaux.</div>
                    <div><strong className="text-[#022448]">Département d'exécution :</strong> Pointe-Noire (6 Arrondissements + District de Tchiamba-Nzassi).</div>
                  </div>

                  <table className="w-full text-left font-serif text-[11px] border border-[#dde2f3] mt-2">
                    <thead className="bg-[#f1f3ff] text-[#022448] font-sans text-[9px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Ligne de Dépense</th>
                        <th className="p-2">Détail</th>
                        <th className="p-2 text-right">Montant Total (FCFA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dde2f3]">
                      <tr>
                        <td className="p-2">Logistique et sonorisation agréée ERP</td>
                        <td className="p-2">6 sites communaux</td>
                        <td className="p-2 text-right font-mono font-bold">1 800 000</td>
                      </tr>
                      <tr>
                        <td className="p-2">Indemnités des animateurs et encadreurs DDL-PN</td>
                        <td className="p-2">15 agents / 3 jours</td>
                        <td className="p-2 text-right font-mono font-bold">1 350 000</td>
                      </tr>
                      <tr className="bg-[#022448] text-white font-bold">
                        <td className="p-2" colSpan={2}>TOTAL GÉNÉRAL ARRÊTÉ DU PROJET :</td>
                        <td className="p-2 text-right font-mono font-bold">3 150 000 FCFA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeModel === 'bordereau' && (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="text-center my-2">
                    <h4 className="font-garamond text-[22px] font-bold uppercase tracking-wide text-[#022448] underline underline-offset-8">
                      BORDEREAU D'ENVOI
                    </h4>
                    <span className="font-sans text-[11px] text-[#43474e] uppercase mt-1 block font-semibold">
                      Acheminement Protocolaire de Pièces Administratives
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#f1f3ff] rounded font-serif text-[12px] border border-[#dde2f3]">
                    <strong>À Monsieur le Directeur Général des Loisirs</strong> — Brazzaville (Sous Couvert de la Voie Hiérarchique).
                  </div>

                  <table className="w-full text-left font-serif text-[11px] border border-[#dde2f3] mt-2">
                    <thead className="bg-[#f1f3ff] text-[#022448] font-sans text-[9px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Désignation des Pièces Transmises</th>
                        <th className="p-2 text-center">Nombre</th>
                        <th className="p-2">Observations &amp; Motifs d'Envoi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dde2f3]">
                      <tr>
                        <td className="p-2 font-bold text-[#022448]">Dossier d'agrément technique définitif "Complexe Côte Sauvage"</td>
                        <td className="p-2 text-center font-mono font-bold">01</td>
                        <td className="p-2 text-[#43474e]">Pour visa supérieur et enregistrement au registre central DGL.</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-[#022448]">Rapport trimestriel d'exécution du PTA 2026 (DDL-PN)</td>
                        <td className="p-2 text-center font-mono font-bold">03</td>
                        <td className="p-2 text-[#43474e]">Pour attribution de compétence et archivage d'État.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signature Box */}
              <div className="mt-6 pt-4 flex justify-between items-end border-t border-[#dde2f3]">
                <div className="w-32 h-24 border-2 border-dashed border-[#c4c6cf] rounded flex flex-col items-center justify-center p-2 text-center opacity-60">
                  <span className="material-symbols-outlined text-[24px] text-[#43474e]">drive_file_stream</span>
                  <span className="font-sans text-[8px] uppercase text-[#43474e]">Emplacement Timbre Humide</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <span className="font-serif text-[12px] italic text-[#022448]">Pour le Ministre et par délégation,</span>
                  <span className="font-garamond text-[15px] font-bold text-[#022448] mt-0.5">
                    Le Directeur Départemental des Loisirs
                  </span>
                  <div className="h-12 flex items-center justify-center">
                    <span className="italic font-garamond text-[16px] text-[#022448]/40 select-none">
                      [Signature &amp; Paraphe Officiel]
                    </span>
                  </div>
                  <span className="font-serif text-[13px] font-bold uppercase text-[#022448]">
                    Jean Richard NTSEKE NGOUAKA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4 : CONSULTATION INTERACTIVE DÉCRET ERP                         */}
      {/* ========================================================================= */}
      {activeSection === 'viewer' && (
        <section className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="bg-[#ffffff] p-6 rounded-xl shadow-sm border border-[#e8eeff] flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 bg-[#f1f3ff] p-4 rounded-lg border border-[#dde2f3]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[32px] text-[#006d2f]">verified_user</span>
                <div>
                  <span className="font-sans text-[10px] uppercase text-[#006d2f] font-bold">
                    Texte Certifié Intégral • J.O. Congo
                  </span>
                  <h3 className="font-garamond text-[19px] font-bold text-[#022448]">
                    Décret N° 2019-301 fixant les conditions d'homologation des Établissements de Loisirs
                  </h3>
                  <span className="font-serif text-[11px] text-[#43474e]">
                    Promulgué par le Président de la République • En vigueur dans le Département de Pointe-Noire
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `Vu le Décret N° 2019-301 fixant les conditions d'homologation (${currentArticle.num}) ;`,
                    'Visa juridique de l\'Article copié avec succès !'
                  )
                }
                className="px-4 py-2 bg-[#022448] text-white rounded font-sans text-[11px] uppercase font-bold flex items-center gap-1.5 hover:bg-[#1e3a5f] transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                Copier Visa Juridique
              </button>
            </div>

            {/* Articles Nav & Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Nav (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-2">
                <span className="font-sans text-[10px] uppercase font-bold text-[#43474e] mb-1">
                  Sommaire Réglementaire
                </span>

                {[
                  { id: 1, label: 'Article 1er', sub: "Champ d'application récréatif", badge: 'text-[#006d2f]' },
                  { id: 7, label: 'Article 7 • Clef', sub: "Procédure d'Agrément Technique", badge: 'text-[#ffe251]' },
                  { id: 9, label: 'Article 9 • Clef', sub: 'Normes Acoustiques & Salubrité', badge: 'text-[#006d2f]' },
                  { id: 14, label: 'Article 14 • Répressif', sub: 'Fermeture Administrative DDL-PN', badge: 'text-[#ba1a1a]' },
                  { id: 22, label: 'Article 22', sub: 'Dispositions Transitoires & Exécution', badge: 'text-[#43474e]' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveArticle(item.id)}
                    className={`text-left p-3 rounded font-serif text-[12px] transition-all flex flex-col cursor-pointer border ${
                      activeArticle === item.id
                        ? 'bg-[#022448] text-white shadow border-[#022448]'
                        : 'bg-[#f1f3ff] text-[#161c27] hover:bg-[#e8eeff] border-[#dde2f3]'
                    }`}
                  >
                    <span
                      className={`font-sans text-[10px] font-bold uppercase ${
                        activeArticle === item.id ? item.badge : 'text-[#006d2f]'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="font-bold mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>

              {/* Right Article View (8 cols) */}
              <div className="lg:col-span-8 bg-[#f1f3ff] p-6 rounded-xl flex flex-col gap-4 border border-[#dde2f3]">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded bg-[#80f899]/30 text-[#006d2f] font-sans text-[10px] uppercase font-bold">
                    {currentArticle.num}
                  </span>
                  <span className="text-[#43474e] font-sans text-[10px]">Opposable aux Tiers</span>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm font-serif text-[13.5px] leading-relaxed text-[#161c27] border border-[#e8eeff]">
                  <p className="italic text-[#022448] font-semibold mb-2">{currentArticle.text}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-sans text-[10px] uppercase font-bold text-[#022448] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    Guide d'Instruction pour l'Officier DDL-PN :
                  </span>
                  <div className="p-3 bg-white rounded font-serif text-[12px] text-[#161c27] whitespace-pre-line border border-[#dde2f3] leading-relaxed">
                    {currentArticle.guide}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#022448] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-[#8aa4cf]/30 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-[#006d2f] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">check_circle</span>
          </div>
          <span className="font-sans text-[12px] font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
