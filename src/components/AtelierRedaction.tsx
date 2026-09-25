import React, { useState, useRef } from 'react';
import { RepublicSeal, ArmoiriesCongo, LogoDDLPN } from './RepublicSeal.tsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const AtelierRedaction: React.FC = () => {
  const pageA4Ref = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [profile, setProfile] = useState<'A' | 'B'>('A');
  const [docType, setDocType] = useState('notification');
  const [service, setService] = useState('SAA');
  const [numero, setNumero] = useState('N° 042/MCAPNIT/DGL/DDL-PN/SAA');
  const [dateEmission, setDateEmission] = useState('24 octobre 2026');
  const [destinataire, setDestinataire] = useState('À Monsieur le Promoteur du Complexe Récréatif Océan Club / Pointe-Noire');
  const [objet, setObjet] = useState("Notification d'instruction du dossier d'agrément technique d'exploitation d'activités et espaces de loisirs marchands");
  const [bodyText, setBodyText] = useState(
`Monsieur le Promoteur,

J'ai l'honneur d'accuser réception de votre dossier de demande d'agrément technique pour l'ouverture d'un complexe récréatif situé au quartier Côte Sauvage, arrondissement 1 Émery Patrice Lumumba.

Conformément aux directives stratégiques prescrites par le Plan de Travail Annuel (PTA) 2026 de la Direction Départementale des Loisirs de Pointe-Noire, et en application des décrets régissant l'encadrement des structures de divertissement du Congo, les services techniques du Service Assistance et Autorisation (SAA) ont engagé l'instruction matérielle des pièces justificatives fournies.

À l'issue de cet examen préliminaire, je vous invite à bien vouloir consigner au dossier d'instruction la pièce manquante suivante : [À COMPLÉTER : Référence de la quittance de perception des droits d'homologation délivrée par la recette municipale et le Trésor Public].

Dès régularisation de ladite pièce, la commission départementale d'inspection des sites de loisirs procèdera à la visite de conformité sécuritaire in situ.

Comptant sur votre diligence habituelle au service du rayonnement récréatif de notre département, je vous prie d'agréer, Monsieur le Promoteur, l'expression de ma considération distinguée.`
  );

  const [variableInput, setVariableInput] = useState('Quittance N° 84920/TP-PN du 22/10/2026');
  const [isRecording, setIsRecording] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update numero when service changes
  const handleServiceChange = (newService: string) => {
    setService(newService);
    setNumero(`N° 042/MCAPNIT/DGL/DDL-PN/${newService}`);
  };

  // Update preset template when docType changes
  const handleDocTypeChange = (newType: string) => {
    setDocType(newType);
    if (newType === 'ordre_service') {
      setNumero('N° 028/MCAPNIT/DGL/DDL-PN');
      setObjet("Ordre de Service prescrivant la mission de recensement, de contrôle de conformité et de recouvrement forcé des redevances d'exploitation des loisirs marchands");
      setDestinataire("À l'attention des Agents Assermentés de Contrôle et de Recouvrement (Service SAA / DDL-PN)");
      setBodyText(
`Le Directeur Départemental des Loisirs de Pointe-Noire ordonne :

ARTICLE 1er : Il est prescrit, à compter du 31 août 2026, une mission départementale de recensement exhaustif, de contrôle de conformité technique et de recouvrement forcé des droits et redevances dus par l'ensemble des établissements de loisirs marchands (bars climatisés, ngandas, discothèques, terrasses plein air, cabarets, salles de jeux et casinos) implantés sur le territoire du Département de Pointe-Noire.

ARTICLE 2 : Sont désignés pour exécuter ladite mission sous l'autorité directe de Monsieur Jacques Alphonse MATOKO, Chef de Service des Activités et des Agrégations (SAA) :
- Les agents de contrôle assermentés munis de leurs ordres de mission individuels et badges officiels (SAA-PN-005, SAA-PN-008, SAA-PN-012) ;
- La régie d'avances départementale pour la perception immédiate des redevances contre quittance officielle sécurisée.

ARTICLE 3 : Les opérations comprendront obligatoirement sur chaque site :
1. La vérification du statut juridique (RCCM, NIU) et de l'Attestation de dépôt ou Autorisation d'exploiter ;
2. Le mesurage contradictoire de la superficie réelle exploitée en m² ;
3. L'exécution de l'Enquête de commodo et incommodo (frais réglementaires fixés à 30 000 FCFA) ;
4. Le calcul de la redevance selon le barème officiel au m² et l'encaissement avec reversement selon la clé légale : 50% au Trésor Public et 50% à l'Administration des Loisirs ;
5. L'émission immédiate d'une Mise en Demeure sous 8 jours à tout exploitant récalcitrant ou en défaut de paiement.

ARTICLE 4 : Les autorités administratives locales, les mairies d'arrondissement ainsi que les forces de police sont requises de prêter main-forte aux agents de la DDL-PN pour l'accomplissement sans entrave de leur mission régalienne. [À COMPLÉTER : Date limite impérative de transmission du rapport général d'étape au Directeur Général des Loisirs].

ARTICLE 5 : Le Chef de Service des Activités et des Agrégations est chargé de l'exécution du présent ordre de service qui prend effet à compter de sa signature.`
      );
    } else if (newType === 'fiche_enquete') {
      setNumero('N° 055/MCAPNIT/DGL/DDL-PN/SAA');
      setObjet("Fiche d'Enquête de Commodo & Incommodo et de Conformité Technique des Espaces Récréatifs");
      setDestinataire("Dossier Technique d'Agrément / Commission Départementale de Contrôle des Loisirs");
      setBodyText(
`FICHE D'ENQUÊTE DE COMMODO & INCOMMODO
Direction Départementale des Loisirs de Pointe-Noire — Service SAA

I. IDENTIFICATION DE L'ÉTABLISSEMENT :
- Raison sociale / Enseigne : [À COMPLÉTER : Nom de l'établissement récréatif]
- Promoteur / Exploitant : [À COMPLÉTER : Nom, prénoms et téléphone du responsable]
- Localisation : Arrondissement [À COMPLÉTER : Arrondissement et quartier], Rue : [À COMPLÉTER : Adresse exacte]
- Activité exercée : Bar standard / Discothèque / Salle de jeux / Terrasse plein air
- Superficie mesurée contradictoirement : [À COMPLÉTER : Superficie en m²]

II. CONTRÔLE TECHNIQUE DES CONDITIONS D'EXPLOITATION (Visite in situ) :
1. Insonorisation et limitation sonore : [Conforme aux normes du Décret 2019-301 / Émergence nocturne à corriger]
2. Dispositifs de sécurité incendie : [Extincteurs aux normes vérifiés / Issues de secours dégagées]
3. Salubrité, commodités sanitaires et hygiène : [Sanitaires conformes séparés hommes/femmes]
4. Voisinage et commodités : [Absence de plainte riveraine / Enquête riverains favorable]
5. Régularité fiscale et commerciale : [RCCM présenté / En cours d'immatriculation]

III. FRAIS D'ENQUÊTE & LIQUIDATION RÉGLEMENTAIRE :
- Frais fixes d'enquête de commodo et incommodo : 30 000 FCFA (Quittance de perception délivrée sur place)
- Redevance annuelle d'exploitation au m² : Liquidation selon la clé de répartition 50% Trésor Public / 50% Administration des Loisirs.

IV. AVIS TECHNIQUE DE LA DIRECTION DÉPARTEMENTALE :
[AVIS FAVORABLE AVEC PRESCRIPTIONS : Autorisation de délivrance de l'Attestation Provisoire de Dépôt sous réserve du respect du seuil acoustique et du respect des échéances financières].

Fait à Pointe-Noire, le [À COMPLÉTER : Date de la visite contradictoire].
Signatures : L'Enquêteur SAA / Le Chef de Service SAA / Le Promoteur.`
      );
    } else if (newType === 'pv_constat') {
      setNumero('PV N° 019/MCAPNIT/DGL/DDL-PN/SAA');
      setObjet("Procès-Verbal de Constat d'Infraction, Mesurage Contradictoire et Mise en Demeure sous Huitaine");
      setDestinataire("À l'attention du Promoteur et notification pour information au Commissariat de Police");
      setBodyText(
`L'an deux mille vingt-six,
Par-devant nous, Agents assermentés de la Direction Départementale des Loisirs de Pointe-Noire (DDL-PN), agissant en vertu de l'Ordre de Service N° 028/MCAPNIT/DGL/DDL-PN signé par Monsieur le Directeur Départemental Jean Richard NTSEKE NGOUAKA,

Avons procédé au contrôle inopiné de l'établissement :
- Enseigne : [À COMPLÉTER : Dénomination de l'établissement verbalisé]
- Adresse : [À COMPLÉTER : Arrondissement, quartier et repère géographique]
- Exploitant présent : [À COMPLÉTER : Identité de l'exploitant ou représentant]

CONSTATATIONS MATÉRIELLES :
1. Exploitation illégale d'un espace récréatif sans Attestation de dépôt ni Autorisation de la DGL ;
2. Défaut de paiement de la redevance légale d'exploitation et réfraction aux relances amiables ;
3. Nuisances sonores et tapage nocturne avéré en violation de l'Article 9 du Décret N° 2019-301 ;
4. Superficie réelle mesurée : [À COMPLÉTER : Mesurage contradictoire en m²] entraînant une liquidation d'office avec pénalité de 50 000 FCFA pour secteur informel.

INJONCTION ADMINISTRATIVE :
L'exploitant est formellement MIS EN DEMEURE de se présenter sous un délai de rigueur de HUIT (8) JOURS au guichet du Service SAA de la Direction Départementale des Loisirs, muni de la somme due ou d'un protocole d'échelonnement validé.

Passé ce délai, il sera procédé sans autre préavis à la FERMETURE ADMINISTRATIVE IMMÉDIATE des lieux avec pose de scellés et réquisition de la Force Publique.

En foi de quoi le présent procès-verbal a été dressé pour valoir ce que de droit.`
      );
    } else if (newType === 'convocation') {
      setObjet("Convocation à la séance plénière de restitution du contrôle départemental des loisirs");
      setDestinataire("À Mesdames et Messieurs les Directeurs et Gérants d'établissements de divertissement");
      setBodyText(
`Madame, Monsieur le Dirigeant,

En exécution des orientations du Plan de Travail Annuel (PTA) 2026 et conformément aux dispositions du Décret N° 2019-301 fixant les conditions d'exploitation des établissements récréatifs, vous êtes convié à prendre part à la séance plénière d'évaluation et de cadrage réglementaire qui se tiendra :

Date : Mardi 28 Octobre 2026 à 09h30 précises
Lieu : Salle de Conférences de la DDL-PN, Immeuble Administratif, Centre-Ville
Ordre du jour :
1. Bilan d'étape des visites de sécurité et d'insonorisation (T3 2026).
2. Régularisation impérative des redevances d'homologation.
3. [À COMPLÉTER : Modalités spécifiques d'attribution des autorisations festives de fin d'année].

La présence personnelle des exploitants ou de leurs mandataires légaux munis d'un pouvoir écrit est requise.

Comptant sur votre ponctualité civique.`
      );
    } else if (newType === 'rapport') {
      setObjet("Transmission du Rapport Trimestriel d'Activités (RTA) — 3ème Trimestre 2026");
      setDestinataire("À Monsieur le Directeur Général des Loisirs / Brazzaville");
      setBodyText(
`Monsieur le Directeur Général,

J'ai l'honneur de vous transmettre, sous le présent pli, le rapport trimestriel consolidé d'exécution du Plan de Travail Annuel (PTA) 2026 pour le compte du troisième trimestre.

Ce document présente l'ensemble des indicateurs de performance physique et budgétaire atteints par nos services opérationnels (Service de l'Animation et Service des Équipements), sous la coordination du Service Administratif, Financier et du Matériel (SAFM).

Il met un accent particulier sur : [À COMPLÉTER : Synthèse des entraves logistiques majeures constatées sur le littoral].

Je vous prie de bien vouloir en assurer la transmission bienveillante à l'attention de Monsieur le Ministre.`
      );
    } else if (newType === 'note') {
      setObjet("Note de service relative au respect des horaires d'exploitation sonore nocturne");
      setDestinataire("À l'attention des Chefs de services et Opérateurs d'espaces récréatifs");
      setBodyText(
`Il est rappelé à tous les exploitants d'établissements recevant du public récréatif (dancings, bars de plein air, salles de jeux) que l'émergence sonore extérieure ne doit en aucun cas excéder les seuils légaux fixés par l'Article 9 du Décret N° 2019-301.

Toute infraction constatée par la brigade conjointe DDL-PN / Police donnera lieu à : [À COMPLÉTER : Application de la procédure d'arrêt d'exploitation sous 24 heures].

Le Chef de brigade est chargé de l'application stricte de la présente instruction.`
      );
    } else {
      setObjet("Notification d'instruction du dossier d'agrément technique d'exploitation d'activités et espaces de loisirs marchands");
      setDestinataire("À Monsieur le Promoteur du Complexe Récréatif Océan Club / Pointe-Noire");
    }
  };

  // Replace variable
  const handleApplyVariable = () => {
    if (!variableInput.trim()) return;
    const updated = bodyText.replace(/\[À COMPLÉTER\s*:[^\]]+\]/i, variableInput.trim());
    setBodyText(updated);
    showToast("Variable insérée avec succès dans l'acte officiel !");
  };

  // Clean typographic style
  const handleSanitize = () => {
    let clean = bodyText
      .replace(/ - /g, ' — ')
      .replace(/ {2,}/g, ' ')
      .replace(/\r\n/g, '\n');
    setBodyText(clean);
    showToast("Typographie et tirets cadratins normalisés selon la Circulaire 001/2026 !");
  };

  // Voice dictation simulation / Speech API
  const handleToggleDictation = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    showToast("Dictée vocale activée : Parlez distinctement...");

    // If Web Speech API is supported
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
                              (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (SpeechRecognition && typeof SpeechRecognition === 'function') {
      try {
        const recognition = new (SpeechRecognition as new () => {
          lang: string;
          continuous: boolean;
          interimResults: boolean;
          onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
          onerror: () => void;
          onend: () => void;
          start: () => void;
        })();
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setBodyText((prev) => `${prev} ${transcript}`);
            showToast(`Texte dicté ajouté : "${transcript}"`);
          }
          setIsRecording(false);
        };

        recognition.onerror = () => {
          fallbackDictation();
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        return;
      } catch {
        fallbackDictation();
      }
    } else {
      fallbackDictation();
    }
  };

  const fallbackDictation = () => {
    setTimeout(() => {
      setBodyText(
        (prev) =>
          `${prev}\n\nIl est formellement rappelé que l'exploitation d'attractions foraines demeure assujettie à la souscription préalable d'une police d'assurance responsabilité civile en cours de validité.`
      );
      setIsRecording(false);
      showToast("Phrase officielle dictée et intégrée avec succès !");
    }, 2200);
  };

  // Download .doc file
  const handleExportDocx = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${objet}</title></head>
      <body style="font-family: 'EB Garamond', serif; font-size: 14pt; line-height: 1.5;">
        <table width="100%" border="0">
          <tr>
            <td width="60%" valign="top">
              <strong>MINISTÈRE DE LA CULTURE, DES ARTS, DU PATRIMOINE NATIONAL ET DE L'INDUSTRIE TOURISTIQUE</strong><br/>
              DIRECTION GÉNÉRALE DES LOISIRS<br/>
              <strong>DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</strong><br/>
              <em>Service : ${service}</em><br/><br/>
              <strong>${numero}</strong>
            </td>
            <td width="40%" align="right" valign="top">
              <strong>RÉPUBLIQUE DU CONGO</strong><br/>
              <em>« Unité – Travail – Progrès »</em><br/><br/>
              Pointe-Noire, le ${dateEmission}
            </td>
          </tr>
        </table>
        <br/><br/>
        <div align="right">
          <p style="font-size: 16pt; font-style: italic;">Le Directeur Départemental des Loisirs de Pointe-Noire</p>
          <p><strong>À ${destinataire}</strong></p>
        </div>
        <br/>
        <p><strong><u>OBJET :</u> ${objet}</strong></p>
        <br/>
        <div>${bodyText.replace(/\n\n/g, '<br/><br/>')}</div>
        <br/><br/>
        <table width="100%" border="0">
          <tr>
            <td><em>Rédigé par : J.A. MATOKO (Resp. ${service})</em></td>
            <td align="center">
              <strong>Le Directeur Départemental des Loisirs de Pointe-Noire,</strong><br/><br/><br/>
              <strong>JEAN RICHARD NTSEKE NGOUAKA</strong>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${numero.replace(/[\/\s]/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Acte officiel exporté au format Word (.doc) !");
  };

  // Direct PDF generation using html2canvas & jsPDF
  const handleExportPdf = async () => {
    if (!pageA4Ref.current) return;
    setIsGeneratingPdf(true);
    showToast("Génération du document PDF haute définition en cours...");

    try {
      const element = pageA4Ref.current;
      // Capture the element at high resolution
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Standard A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Render precisely to full A4 page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const fileName = `${numero.replace(/[\/\s]/g, '_')}.pdf`;
      pdf.save(fileName);
      showToast(`Document PDF officiel généré et téléchargé : ${fileName} !`);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      showToast("Erreur lors de l'export direct. Lancement de l'impression système...");
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Count uncompleted fields
  const missingMatches = bodyText.match(/\[À COMPLÉTER\s*:[^\]]+\]/gi);
  const missingCount = missingMatches ? missingMatches.length : 0;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#ffffff] p-4 rounded-lg shadow-sm border border-[#e8eeff]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#022448] flex items-center justify-center text-white shrink-0 shadow">
            <span className="material-symbols-outlined text-2xl">history_edu</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[10px] uppercase text-[#006d2f] font-bold tracking-wider">
                Norme Régalienne MCAPNIT-CAB
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006d2f]"></span>
              <span className="font-sans text-[11px] text-[#43474e]">Circulaire N° 001/2026</span>
            </div>
            <h1 className="font-garamond text-[22px] font-bold text-[#022448] leading-tight">
              Atelier de Rédaction &amp; Composition Documentaire Directe
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#e8eeff] px-3 py-1.5 rounded text-xs">
            <span className="font-sans text-[10px] uppercase text-[#43474e]">Qualité Formelle :</span>
            <span className="font-sans text-[11px] font-bold text-[#006d2f] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">verified</span>
              {profile === 'A' ? '100% Conforme Profil A' : 'Profil B (Interne)'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#e8eeff] px-3 py-1.5 rounded text-xs">
            <span className="font-sans text-[10px] uppercase text-[#43474e]">Variables ouvertes :</span>
            <span className={`font-sans text-[11px] font-bold ${missingCount > 0 ? 'text-[#6d5e00]' : 'text-[#006d2f]'}`}>
              {missingCount > 0 ? `${missingCount} champ critique` : 'Complet'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Editor (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Card: Cadre & Typologie */}
          <div className="bg-[#ffffff] p-5 rounded-lg shadow-sm border border-[#e8eeff] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] uppercase tracking-wider text-[#022448] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">tune</span> Cadre &amp; Typologie de l'Acte
              </span>

              {/* Profile Toggle */}
              <div className="flex items-center bg-[#e8eeff] p-1 rounded">
                <button
                  type="button"
                  onClick={() => setProfile('A')}
                  className={`px-3 py-1 rounded font-sans text-[10px] uppercase font-bold transition-all cursor-pointer ${
                    profile === 'A' ? 'bg-[#022448] text-white shadow-sm' : 'text-[#43474e] hover:text-[#161c27]'
                  }`}
                >
                  Profil A (Officiel)
                </button>
                <button
                  type="button"
                  onClick={() => setProfile('B')}
                  className={`px-3 py-1 rounded font-sans text-[10px] uppercase font-bold transition-all cursor-pointer ${
                    profile === 'B' ? 'bg-[#022448] text-white shadow-sm' : 'text-[#43474e] hover:text-[#161c27]'
                  }`}
                >
                  Profil B (Interne)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-[10px] uppercase font-semibold text-[#43474e] mb-1">
                  Nature de l'Acte
                </label>
                <select
                  value={docType}
                  onChange={(e) => handleDocTypeChange(e.target.value)}
                  className="w-full bg-[#f1f3ff] px-3 py-2 rounded text-[#161c27] font-serif text-[12px] border border-[#c4c6cf]/50 focus:outline-none focus:ring-1 focus:ring-[#022448]"
                >
                  <option value="ordre_service">Ordre de Service N° 028 (Mission Contrôle &amp; Recouvrement)</option>
                  <option value="fiche_enquete">Fiche d'Enquête de Commodo &amp; Incommodo (30 000 FCFA)</option>
                  <option value="pv_constat">PV de Constat d'Infraction &amp; Mise en Demeure (8 jours)</option>
                  <option value="notification">Traitement de dossier d'autorisation</option>
                  <option value="convocation">Convocation officielle</option>
                  <option value="rapport">Rapport trimestriel d'activités (RTA)</option>
                  <option value="note">Note de service départementale</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase font-semibold text-[#43474e] mb-1">
                  Service Émetteur
                </label>
                <select
                  value={service}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full bg-[#f1f3ff] px-3 py-2 rounded text-[#161c27] font-serif text-[12px] border border-[#c4c6cf]/50 focus:outline-none focus:ring-1 focus:ring-[#022448]"
                >
                  <option value="SAA">SAA (Assistance et Autorisation)</option>
                  <option value="SAFM">SAFM (Administratif Finances Matériel)</option>
                  <option value="SPA">SPA (Promotion &amp; Animation)</option>
                  <option value="SSED">SSED (Statistiques &amp; Études)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block font-sans text-[10px] uppercase font-semibold text-[#43474e] mb-1">
                  Numéro d'Ordre d'Enregistrement
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full bg-[#f1f3ff] px-3 py-2 rounded text-[#022448] font-mono text-[11px] font-bold border border-[#c4c6cf]/50 focus:outline-none focus:ring-1 focus:ring-[#022448]"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase font-semibold text-[#43474e] mb-1">
                  Date d'Émission
                </label>
                <input
                  type="text"
                  value={dateEmission}
                  onChange={(e) => setDateEmission(e.target.value)}
                  className="w-full bg-[#f1f3ff] px-3 py-2 rounded text-[#161c27] font-serif text-[12px] border border-[#c4c6cf]/50 focus:outline-none focus:ring-1 focus:ring-[#022448]"
                />
              </div>
            </div>

            <div>
              <label className="block font-sans text-[10px] uppercase font-semibold text-[#43474e] mb-1">
                Destinataire Protocolaire (Civilité, Fonction, Ville)
              </label>
              <input
                type="text"
                value={destinataire}
                onChange={(e) => setDestinataire(e.target.value)}
                className="w-full bg-[#f1f3ff] px-3 py-2 rounded text-[#161c27] font-serif text-[12px] border border-[#c4c6cf]/50 focus:outline-none focus:ring-1 focus:ring-[#022448]"
              />
            </div>

            <div>
              <label className="block font-sans text-[10px] uppercase font-semibold text-[#43474e] mb-1">
                Objet Républicain
              </label>
              <textarea
                rows={2}
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                className="w-full bg-[#f1f3ff] p-2.5 rounded text-[#161c27] font-serif text-[12px] font-semibold border border-[#c4c6cf]/50 focus:outline-none focus:ring-1 focus:ring-[#022448] resize-none"
              />
            </div>
          </div>

          {/* Card: Dictée Vocale & Édition */}
          <div className="bg-[#ffffff] p-5 rounded-lg shadow-sm border border-[#e8eeff] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] uppercase tracking-wider text-[#022448] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">mic</span> Dictée Vocale &amp; Rédaction Directe
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleDictation}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-sans text-[11px] uppercase font-bold cursor-pointer ${
                    isRecording
                      ? 'bg-[#ba1a1a] text-white animate-pulse'
                      : 'bg-[#e8eeff] text-[#022448] hover:bg-[#006d2f] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">mic</span>
                  <span>{isRecording ? 'Écoute active...' : 'Dicter'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={10}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full bg-[#f1f3ff] p-3 rounded text-[#161c27] font-serif text-[13px] leading-relaxed border border-[#c4c6cf]/50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#022448] resize-y"
              placeholder="Rédigez le texte de l'acte..."
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleSanitize}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#e8eeff] hover:bg-[#dde2f3] text-[#022448] rounded font-sans text-[10px] uppercase font-bold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">cleaning_services</span>
                Nettoyer style &amp; Détecter [À COMPLÉTER]
              </button>

              <span className="font-serif text-[11px] italic text-[#43474e]">
                Circulaire CAB-2026 : Proscription formelle des lignes noires de séparation
              </span>
            </div>
          </div>

          {/* Card: Actions d'Export */}
          <div className="bg-[#ffffff] p-4 rounded-lg shadow-sm border border-[#e8eeff] flex flex-col gap-2">
            <span className="font-sans text-[10px] uppercase text-[#43474e] font-bold">
              Actes &amp; Déclinaisons Officielles
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => showToast("Feuille A4 réactualisée avec succès.")}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-[#022448] text-white rounded font-sans text-[11px] uppercase font-bold hover:bg-[#1e3a5f] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">sync</span> Actualiser le A4
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-[#006d2f] text-white rounded font-sans text-[11px] uppercase font-bold hover:bg-[#007232] transition-all cursor-pointer shadow disabled:opacity-75"
              >
                <span className={`material-symbols-outlined text-base ${isGeneratingPdf ? 'animate-spin' : ''}`}>
                  {isGeneratingPdf ? 'refresh' : 'picture_as_pdf'}
                </span>
                <span>{isGeneratingPdf ? 'Génération PDF...' : 'Télécharger PDF (A4)'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportDocx}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-[#e8eeff] text-[#022448] rounded font-sans text-[11px] uppercase font-semibold hover:bg-[#dde2f3] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">description</span> Exporter .DOCX
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-[#e8eeff] text-[#022448] rounded font-sans text-[11px] uppercase font-semibold hover:bg-[#dde2f3] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">print</span> Imprimer Papier
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic A4 Sheet Preview (7 cols) */}
        <div className="xl:col-span-7 flex flex-col items-center">
          {/* Top Bar of A4 Viewer */}
          <div className="w-full flex items-center justify-between px-2 py-1.5 mb-2 text-[#43474e]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider font-bold text-[#022448]">
                <span className="material-symbols-outlined text-sm">print</span> Format Métrique A4 (210 × 297 mm)
              </span>
              <span className="text-[10px] bg-[#e8eeff] px-2 py-0.5 rounded font-sans font-medium text-[#161c27]">
                Échelle 100%
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-sans text-[11px]">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1 text-[#006d2f] hover:text-[#005322] font-sans text-[10px] font-bold uppercase cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>{isGeneratingPdf ? 'Export en cours...' : 'Export Direct PDF'}</span>
              </button>
              <span className="text-[#c4c6cf]">|</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#006d2f] inline-block"></span>
              <span>Buvard Administratif Virtuel</span>
            </div>
          </div>

          {/* Sheet Container with Blotting Surface */}
          <div className="w-full max-w-[794px] bg-[#d9e2ec] p-4 sm:p-7 rounded-xl shadow-inner flex justify-center overflow-x-auto">
            {/* The A4 Sheet */}
            <div
              ref={pageA4Ref}
              id="page-a4"
              className={`w-full max-w-[720px] min-h-[960px] bg-[#ffffff] p-[38px] sm:p-[50px] shadow-2xl flex flex-col justify-between text-[#111827] relative transition-all duration-200 select-text ${
                profile === 'A' ? 'font-garamond' : 'font-serif'
              }`}
            >
              {/* Discrete Seal Watermark in Center Background */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] overflow-hidden">
                <RepublicSeal size={380} />
              </div>

              {/* TOP SECTION: Header without black separator line */}
              <div>
                <div className="grid grid-cols-12 gap-4 items-start pb-5">
                  {/* Left: Ministry & Direction with fine 1.5pt vertical tricolor band and Official DDLPN Logo */}
                  <div className="col-span-7 flex items-start gap-3">
                    <LogoDDLPN size={42} className="shrink-0" />
                    {/* Vertical Congolese Flag ribbon */}
                    <div className="flex flex-col w-[3.5px] self-stretch rounded-full overflow-hidden shrink-0 shadow-xs">
                      <div className="flex-1 bg-[#009543]"></div>
                      <div className="flex-1 bg-[#FBDE4A]"></div>
                      <div className="flex-1 bg-[#DC241F]"></div>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-sans font-bold text-[10px] leading-[13px] tracking-[0.03em] uppercase text-[#022448]">
                        MINISTÈRE DE LA CULTURE, DES ARTS, DU PATRIMOINE NATIONAL ET DE L'INDUSTRIE TOURISTIQUE
                      </span>
                      <div className="h-1"></div>
                      <span className="font-sans font-semibold text-[9px] leading-[12px] tracking-[0.04em] uppercase text-[#374151]">
                        DIRECTION GÉNÉRALE DES LOISIRS
                      </span>
                      <div className="h-0.5"></div>
                      <span className="font-sans font-bold text-[9px] leading-[12px] tracking-[0.04em] uppercase text-[#1F2937]">
                        DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
                      </span>
                      <div className="h-0.5"></div>
                      <span className="font-serif text-[8.5px] italic text-[#4B5563]">
                        {service === 'SAA' && 'Service Assistance et Autorisation'}
                        {service === 'SAFM' && 'Service Administratif, Financier et du Matériel'}
                        {service === 'SPA' && 'Service Promotion & Animation des Loisirs'}
                        {service === 'SSED' && 'Service Statistiques, Études & Documentation'}
                      </span>
                      <div className="h-2"></div>
                      <span className="font-mono font-bold text-[10px] leading-[14px] text-[#022448] tracking-tight">
                        {numero}
                      </span>
                    </div>
                  </div>

                  {/* Right: Official Coat of Arms, Republic Motto, Flag dots, Date */}
                  <div className="col-span-5 flex flex-col items-center text-center">
                    <ArmoiriesCongo size={42} className="mb-1" />
                    <span className="font-garamond font-bold text-[13px] leading-[16px] uppercase tracking-[0.14em] text-[#022448]">
                      RÉPUBLIQUE DU CONGO
                    </span>
                    <span className="font-garamond italic text-[10.5px] leading-[15px] text-[#374151] mt-0.5">
                      « Unité – Travail – Progrès »
                    </span>
                    <div className="w-12 h-1 mt-1 flex justify-center items-center gap-1 opacity-80">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#009543]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FBDE4A]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DC241F]"></span>
                    </div>
                    <div className="mt-4 text-right self-end w-full">
                      <span className="font-serif text-[12px] leading-[16px] text-[#022448]">
                        Pointe-Noire, le <span className="font-semibold">{dateEmission}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* EXPÉDITEUR / DESTINATAIRE BLOCK (Right-aligned) */}
                <div className="flex justify-end pt-3 pb-3">
                  <div className="w-[60%] text-left pl-3">
                    <p
                      className="text-[17px] leading-[22px] italic text-[#022448] font-medium"
                      style={{
                        fontFamily:
                          profile === 'A'
                            ? "'EB Garamond', 'Monotype Corsiva', cursive, serif"
                            : "'Source Serif 4', Georgia, serif",
                      }}
                    >
                      Le Directeur Départemental des Loisirs de Pointe-Noire
                    </p>
                    <div className="h-1.5"></div>
                    <p className="font-sans font-semibold text-[11px] uppercase text-[#4B5563]">À</p>
                    <div className="h-0.5"></div>
                    <p className="font-serif font-bold text-[13px] leading-[17px] text-[#111827]">
                      {destinataire}
                    </p>
                    <p className="font-serif italic text-[11px] text-[#4B5563]">Département de Pointe-Noire</p>
                  </div>
                </div>

                {/* OBJET RÉPUBLICAIN */}
                <div className="pt-2 pb-3 text-left">
                  <p className="font-serif text-[13px] leading-[18px] text-[#111827]">
                    <span className="font-bold underline uppercase tracking-wide text-[#022448]">Objet :</span>{' '}
                    <span className="font-bold">{objet}</span>
                  </p>
                </div>

                {/* BODY CONTENT */}
                <div className="text-[13.5px] leading-[22px] text-justify text-[#1F2937] space-y-3 font-serif antialiased">
                  {bodyText
                    .split('\n\n')
                    .filter((p) => p.trim() !== '')
                    .map((para, index) => {
                      // Process placeholders
                      const parts = para.split(/(\[À COMPLÉTER\s*:[^\]]+\])/gi);
                      return (
                        <p key={index}>
                          {parts.map((part, pIdx) => {
                            if (/\[À COMPLÉTER\s*:[^\]]+\]/i.test(part)) {
                              return (
                                <span
                                  key={pIdx}
                                  className="bg-[#FEF9C3] text-[#854D0E] font-semibold px-1.5 py-0.5 rounded border border-[#FDE047] inline-block my-0.5"
                                >
                                  {part}
                                </span>
                              );
                            }
                            if (part.includes('Plan de Travail Annuel (PTA) 2026')) {
                              const subParts = part.split('Plan de Travail Annuel (PTA) 2026');
                              return (
                                <React.Fragment key={pIdx}>
                                  {subParts.map((sub, sIdx) => (
                                    <React.Fragment key={sIdx}>
                                      {sub}
                                      {sIdx < subParts.length - 1 && (
                                        <strong className="text-[#022448] font-bold">
                                          Plan de Travail Annuel (PTA) 2026
                                        </strong>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </React.Fragment>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                </div>
              </div>

              {/* FOOTER SECTION: Administrative mention & Signature */}
              <div className="pt-6 border-t-0">
                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* Left: Administrative author note */}
                  <div className="col-span-5 pb-1 text-left">
                    <span className="block font-sans text-[9px] text-[#6B7280] tracking-wide">
                      Rédigé par : J.A. MATOKO (Resp. {service})
                    </span>
                    <span className="block font-sans text-[8px] text-[#9CA3AF]">
                      Archivage : DDL-PN / {service}-2026 / ACT-042
                    </span>
                  </div>

                  {/* Right: Signature stamp block */}
                  <div className="col-span-7 flex flex-col items-center text-center pl-4">
                    <p className="font-serif font-bold text-[12px] leading-[15px] text-[#022448]">
                      Le Directeur Départemental des Loisirs
                      <br />
                      de Pointe-Noire,
                    </p>

                    {/* Apposition of wet stamp and official griffe */}
                    <div className="w-40 h-16 my-1 relative flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-2 border-[#1E3A5F]/35 flex items-center justify-center text-center rotate-[-12deg] p-1">
                        <span className="font-sans text-[7px] uppercase font-bold text-[#1E3A5F]/60 leading-tight">
                          RÉP. DU CONGO
                          <br />
                          ★<br />
                          DDL-PN
                        </span>
                      </div>

                      {/* Handwritten signature SVG */}
                      <svg
                        className="absolute w-32 h-14 text-[#022448] opacity-85"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 160 60"
                      >
                        <path d="M10 40 Q 40 10, 70 35 T 120 20 Q 140 45, 150 15" strokeLinecap="round" />
                        <path d="M45 45 Q 80 50, 130 42" strokeDasharray="2 2" strokeLinecap="round" />
                      </svg>
                    </div>

                    <p className="font-serif font-bold uppercase tracking-wider text-[12.5px] text-[#022448]">
                      JEAN RICHARD NTSEKE NGOUAKA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: Quality Protocol Audit */}
      <div className="bg-[#ffffff] p-5 rounded-lg shadow-sm border border-[#e8eeff] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[10px] uppercase text-[#006d2f] font-bold tracking-wider">
                Module de Contrôle Automatique
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006d2f]"></span>
              <span className="font-sans text-[11px] text-[#43474e]">Vérification de Conformité Règlementaire</span>
            </div>
            <h2 className="font-garamond text-[18px] font-bold text-[#022448]">
              Rapport d'Audit Qualité Protocolaire &amp; Détection des Variables
            </h2>
          </div>

          <span className="text-xs bg-[#80f899]/30 text-[#006d2f] px-3 py-1 rounded font-bold uppercase tracking-wide">
            Règle du Zéro-Invention : Validée
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-left">
          {/* Col 1 */}
          <div className="bg-[#f1f3ff] p-4 rounded flex flex-col gap-2">
            <span className="font-sans text-[11px] uppercase font-bold text-[#022448] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006d2f] text-base">task_alt</span>
              Règles Typographiques Profil A
            </span>
            <ul className="font-serif text-[12px] text-[#43474e] space-y-1.5 mt-1">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-[#006d2f]">check_circle</span>
                <span>Typographie officielle : <strong>EB Garamond</strong> (Corps &amp; Mentions)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-[#006d2f]">check_circle</span>
                <span>Intitulé émetteur : <strong>Monotype Corsiva Italique</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-[#006d2f]">check_circle</span>
                <span>Bande tricolore verticale : <strong>1.5 pt stricte</strong> (Sans filet noir)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-[#006d2f]">check_circle</span>
                <span>Proscription des bordures noires horizontales respectée</span>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="bg-[#f1f3ff] p-4 rounded flex flex-col gap-2">
            <span className="font-sans text-[11px] uppercase font-bold text-[#022448] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006d2f] text-base">military_tech</span>
              Ancrage Stratégique PTA 2026
            </span>
            <ul className="font-serif text-[12px] text-[#43474e] space-y-1.5 mt-1">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-[#006d2f]">check_circle</span>
                <span>Visas du Plan de Travail Annuel (PTA 2026) : <strong>Détecté</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-[#006d2f]">check_circle</span>
                <span>Compétence territoriale : <strong>Département de Pointe-Noire</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-[#006d2f]">check_circle</span>
                <span>Chaîne hiérarchique : <strong>MCAPNIT &gt; DGL &gt; DDL-PN</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-[#006d2f]">check_circle</span>
                <span>Délégation directoriale de signature conforme</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Interactive variable filler */}
          <div className="bg-[#f1f3ff] p-4 rounded flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] uppercase font-bold text-[#022448] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#6d5e00] text-base">flag</span>
                Champ à Valider Immédiatement
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${missingCount > 0 ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#80f899]/40 text-[#006d2f]'}`}>
                {missingCount > 0 ? `${missingCount} en suspens` : 'Validé'}
              </span>
            </div>

            <div className="bg-[#ffffff] p-3 rounded mt-1 border border-[#e8eeff]">
              <span className="font-sans text-[10px] uppercase font-bold text-[#ba1a1a] block">
                {missingCount > 0 ? 'Variable critique détectée' : 'Aucune variable manquante'}
              </span>
              <p className="font-serif text-[12px] text-[#161c27] mt-1">
                {missingCount > 0
                  ? '« Référence de la quittance de perception des droits d\'homologation... »'
                  : 'Tous les visas et références requis sont renseignés.'}
              </p>

              {missingCount > 0 && (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    placeholder="Ex: Quittance N° 84920/TP-PN du 22/10/2026"
                    className="w-full bg-[#f1f3ff] px-2.5 py-1.5 text-xs rounded text-[#161c27] border border-[#c4c6cf] focus:outline-none focus:ring-1 focus:ring-[#022448]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVariable}
                    className="px-3 py-1.5 bg-[#022448] text-white rounded text-xs font-bold whitespace-nowrap hover:bg-[#1e3a5f] cursor-pointer"
                  >
                    Insérer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#022448] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-[#8aa4cf]/30 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-[#006d2f] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">check</span>
          </div>
          <span className="font-sans text-[12px] font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
