import { jsPDF } from 'jspdf';

interface PresentationSlide {
  title: string;
  subtitle: string;
  type: 'cover' | 'executive' | 'split' | 'grid' | 'mockup' | 'scenario' | 'roi' | 'conclusion' | 'contact';
  
  // Slide specific fields
  bullets?: string[];
  leftTitle?: string;
  leftBullets?: string[];
  rightTitle?: string;
  rightBullets?: string[];
  gridItems?: { title: string; desc: string; icon: string; color: string }[];
  scenarioSteps?: { step: string; title: string; desc: string }[];
  beforeWith?: { label: string; before: string; withSol: string }[];
  mockupType?: 'dashboard' | 'tracking' | 'telematics';
  conclusionText?: string;
  contactDetails?: { label: string; value: string }[];
}

export function generateAppPresentationPdf(lang: 'fr' | 'ar' = 'fr') {
  // A4 Landscape is the perfect consulting slide deck format
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const totalPages = 25;

  // Helper for text printing with automatic wrapping to prevent any overlap
  const drawTextWrapped = (text: string, x: number, y: number, maxWidth: number, fontSize = 9, isBold = false, color = '#334155', align: 'left' | 'right' | 'center' = 'left') => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    
    // Parse hex color to rgb
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    doc.setTextColor(r, g, b);

    const lines: string[] = doc.splitTextToSize(text, maxWidth);
    let currentY = y;
    lines.forEach(line => {
      doc.text(line, x, currentY, { align });
      currentY += (fontSize * 0.4) + 2.5; // proportional line spacing
    });
    return currentY; // returns final Y position for spacing
  };

  // Slide content database (25 slides matching the exact requested structure)
  const slides: PresentationSlide[] = [
    // 01. COVER
    {
      title: "ZAHI ICE LOGISTICS 2026",
      subtitle: "La Révolution de la Chaîne du Froid Connectée",
      type: "cover"
    },
    // 02. EXECUTIVE SUMMARY
    {
      title: "01. Executive Summary",
      subtitle: "Une plateforme intégrée de télématique et gestion intelligente de flotte de congélateurs connectés.",
      type: "executive",
      bullets: [
        "Présentation de la Solution : Zahi Ice Logistics est une plateforme technologique SaaS de pointe conçue spécifiquement pour piloter, sécuriser et optimiser l'ensemble de votre flotte de congélateurs commerciaux (AP, AG, AS) et camions frigorifiques.",
        "Cible Opérationnelle : Ce système s'adresse directement aux directeurs généraux, responsables logistiques, directeurs de la maintenance et contrôleurs financiers de Zahi Glaces pour éliminer les inefficacités du circuit de distribution.",
        "Le Problème Résolu : Le manque historique de visibilité sur la localisation du matériel, les ruptures accidentelles de température, la falsification des contrats et les vols de congélateurs génèrent de lourdes pertes financières annuelles.",
        "Notre Proposition de Valeur Principale : Centraliser chaque équipement frigorifique au sein d'une cartographie dynamique, surveiller l'IoT en continu à -18°C, automatiser l'émission légale des contrats de dépôt, et sécuriser la traçabilité à 100%."
      ]
    },
    // 03. LES PROBLEMES DES ENTREPRISES
    {
      title: "02. Les Défis Logistiques du Froid",
      subtitle: "Les goulots d'étranglement majeurs rencontrés par les gestionnaires de flotte traditionnels.",
      type: "split",
      leftTitle: "🚨 MENACES ET DEFAILLANCES DU FLUX REEL",
      leftBullets: [
        "Perte et détournement d'actifs : Incapacité physique de localiser les congélateurs mis à disposition des clients commerçants. Vols récurrents ou utilisation frauduleuse pour des marques de glaces concurrentes.",
        "Rupture invisible de la chaîne du froid : Pannes de compresseurs ou coupures électriques dans les commerces non signalées à temps, provoquant la détérioration irrémédiable de la crème glacée.",
        "Lenteur administrative du papier : La gestion manuelle par registres physiques des Bons d'Entrée, de Sortie et des Contrats de Dépôt augmente le risque d'erreurs, de pertes de documents et bloque les contrôles fiscaux.",
        "Dispersion des données régionales : Difficulté d'obtenir une vision consolidée de l'inventaire en temps réel des dépôts de Casablanca, Marrakech, Agadir, Oujda, Tanger, etc."
      ],
      rightTitle: "📊 IMPACTS DIRECTS SUR LA RENTABILITE",
      rightBullets: [
        "Lourde perte en capital : Le coût d'achat d'un nouveau congélateur (AP/AG/AS) non amorti représente une perte brute en cas de vol ou d'égarement physique.",
        "Pertes sèches de marchandises : Des milliers de litres de crème glacée sont jetés à la suite d'une dérive de température supérieure à la norme critique de -18°C.",
        "Frottement opérationnel élevé : Les techniciens et contrôleurs perdent 45% de leur temps de travail à rechercher des fiches d'entretien papier et des contrats de dépôt égarés.",
        "Décisions stratégiques aveugles : L'absence d'analytique empêche de repérer les points de vente inactifs où le matériel frigorifique est sous-utilisé et devrait être réaffecté."
      ]
    },
    // 04. NOTRE REPONSE
    {
      title: "03. Notre Réponse Technologique",
      subtitle: "La transformation numérique par la centralisation et la télémétrie active.",
      type: "executive",
      bullets: [
        "Une plateforme unifiée : Zahi Ice Logistics remplace les processus éparpillés par un espace de contrôle unique. Chaque congélateur et véhicule est identifié par son numéro de série unique, modélisé en temps réel avec des capteurs IoT embarqués.",
        "La chaîne de décision intelligente : Les données physiques brutes (GPS, Température, Statut de fonctionnement) sont captées, transmises au cloud, modélisées sous forme d'indicateurs visuels immédiats, facilitant la prise de décision rapide.",
        "De la réactivité à la proactivité : Au lieu de constater les pertes après coup, le superviseur logistique reçoit une alerte immédiate (par email ou notification) pour intervenir avant que la crème glacée ne commence à fondre.",
        "Rapprochement physique et contractuel : Chaque congélateur possède un jumeau numérique contenant son contrat de dépôt légal signé par le client, son historique d'entretien et sa position géographique précise validée par satellite."
      ]
    },
    // 05. VALEUR POUR L'ENTREPRISE
    {
      title: "04. Ce que gagne l'Entreprise",
      subtitle: "Bénéfices métiers et impact stratégique pour l'organisation Zahi Glaces.",
      type: "grid",
      gridItems: [
        { title: "Contrôle Total", desc: "Visibilité à 100% sur l'ensemble de vos actifs réfrigérés. Localisation exacte validée en temps réel.", icon: "👁️", color: "#0284c7" },
        { title: "Productivité Flotte", desc: "Réduction massive des tâches administratives manuelles. Attribution rapide des tournées de livraison.", icon: "⚙️", color: "#0d9488" },
        { title: "Traçabilité Légale", desc: "Zéro papier. Des contrats de dépôt solides juridiquement, archivés électroniquement au format PDF.", icon: "📜", color: "#4f46e5" },
        { title: "Réactivité IoT", desc: "Alerte instantanée en cas de dérive thermique ou de déplacement non autorisé (Geofencing GPS).", icon: "🚨", color: "#e11d48" },
        { title: "Maîtrise des Coûts", desc: "Allongement de la durée de vie du parc frigorifique grâce à la planification préventive de la maintenance.", icon: "💰", color: "#d97706" },
        { title: "Décision Stratégique", desc: "Analytique des volumes livrés, du chiffre d'affaires et du taux d'activité réel par point de vente.", icon: "📈", color: "#059669" }
      ]
    },
    // 06. ARCHITECTURE DE LA SOLUTION
    {
      title: "05. Architecture Globale Connectée",
      subtitle: "La synergie fluide entre matériel physique, cloud et prise de décision.",
      type: "split",
      leftTitle: "🛰️ CAPTAGE ET SATELLITE (IoT)",
      leftBullets: [
        "Terminaux Frigorifiques (AP, AG, AS) : Intègrent des micro-capteurs de température (-30°C/+10°C), d'humidité, de consommation d'énergie (Watt) et de vibrations compresseur.",
        "Balises GPS multi-constellations : Modules géolocalisés connectés en GSM/GPRS transmettant des coordonnées géographiques précises toutes les 15 minutes.",
        "Sondes de Véhicules de Livraison : Capteurs connectés au groupe frigorifique du camion pour valider la température de transit (-22°C standard)."
      ],
      rightTitle: "💻 CLOUD ET SUPERVISION LOGICIELLE",
      rightBullets: [
        "Passerelle API Sécurisée : Reçoit, décrypte et valide les données télémétriques avec une signature cryptographique inviolable.",
        "Moteur de Règles et Alertes : Compare en continu les valeurs réelles avec les seuils de sécurité (température > -18°C ou mouvement hors Geofence).",
        "Interface Utilisateur SaaS : Restitue instantanément les statuts sous forme de cartes d'inventaire dynamiques, de tableaux interactifs et de graphiques."
      ]
    },
    // 07. DASHBOARD
    {
      title: "06. Le Tableau de Bord Centralisé",
      subtitle: "Supervision globale et instantanée de l'activité commerciale et technique.",
      type: "mockup",
      mockupType: "dashboard"
    },
    // 08. GESTION DES VEHICULES
    {
      title: "07. Vision Complète de la Flotte",
      subtitle: "Un contrôle d'inventaire rigoureux de tous les congélateurs et véhicules commerciaux.",
      type: "executive",
      bullets: [
        "Fiche d'identité numérique : Chaque congélateur dispose d'une fiche complète contenant sa marque, son modèle, sa catégorie de volume (AP : 300L, AG : 400L, AS : 500L) et son numéro de série unique (ex: ZAHI-CF-750109).",
        "Suivi du cycle de vie : Visualisation immédiate du statut opérationnel de l'actif : 'En Stock' (disponible pour un déploiement), 'En Service' (installé chez un commerçant), ou 'En Atelier' (en cours de réparation).",
        "Recherche et filtres multicritères : Les gestionnaires recherchent par numéro de série, nom de client, ou dépôt régional en une fraction de seconde.",
        "Traçabilité d'affectation : Association claire et historique de l'appareil avec un dépôt de rattachement physique et un chauffeur de transport."
      ]
    },
    // 09. LIVE TRACKING
    {
      title: "08. Géolocalisation Cartographique",
      subtitle: "Suivez la position exacte de vos équipements connectés sur une carte interactive.",
      type: "mockup",
      mockupType: "tracking"
    },
    // 10. HISTORIQUE ET TRAJETS
    {
      title: "09. Analyse Rétrospective des Transferts",
      subtitle: "Audit complet de la traçabilité des mouvements logistiques de chaque équipement.",
      type: "executive",
      bullets: [
        "Archivage chronologique inaltérable : Chaque changement d'emplacement (déplacement d'un dépôt vers un client, ou retour en atelier) est automatiquement enregistré avec la date, l'heure et l'auteur du mouvement.",
        "Calcul des temps de séjour : L'application calcule automatiquement la durée de vie utile et le temps passé par l'appareil à chaque emplacement (ex: '240 Jours chez Supermarché Al-Amri').",
        "Historique des chauffeurs responsables : Identification du chauffeur-livreur ayant effectué chaque transfert logistique, garantissant la responsabilisation des équipes de livraison.",
        "Scénario d'Audit Technique : Si un client conteste la date d'installation de son congélateur, le responsable extrait la fiche historique certifiée au format PDF en une seconde."
      ]
    },
    // 11. ALERTES
    {
      title: "10. Système d'Alertes Logistiques",
      subtitle: "Passez d'une gestion réactive à une vigilance proactive assistée par ordinateur.",
      type: "executive",
      bullets: [
        "Alerte de Déviation Thermique : Détection instantanée dès que la température intérieure dépasse le seuil critique (ex: -16.5°C au lieu de -18°C), signalant une défaillance électrique ou un compresseur en panne.",
        "Alerte Vol / Geofencing GPS : Déclenchement d'une alerte prioritaire rouge si l'appareil est déplacé en dehors du périmètre du commerce client défini dans le contrat d'épreuve.",
        "Indicateurs de Priorité : Les alertes sont classées par gravité (Information, Attention, Critique) avec un code couleur moderne pour guider l'action des techniciens de maintenance.",
        "Bip sonore et journal d'anomalies : Journalisation centrale de tous les incidents pour auditer la réactivité des équipes techniques face aux pannes constatées."
      ]
    },
    // 12. MAINTENANCE
    {
      title: "11. Atelier & Gestion Préventive",
      subtitle: "Planification des interventions techniques pour maximiser la durée de vie du parc.",
      type: "executive",
      bullets: [
        "Gestion des ordres de travail : Création de fiches de maintenance technique ('Préventive', 'Curative', 'Recharge Gaz', 'Remplacement Pièces', 'Nettoyage & Diagnostic').",
        "Suivi des coûts d'exploitation : Enregistrement précis des dépenses associées à chaque réparation (en MAD) pour calculer la rentabilité nette de l'équipement.",
        "Planification des révisions : Paramétrage de la périodicité d'entretien (ex: tous les 6 mois) avec calcul de la date théorique de la prochaine intervention préventive.",
        "Valorisation de l'atelier frigorifique : Centralisation des techniciens en charge des réparations, permettant de mesurer l'efficacité de l'équipe technique interne."
      ]
    },
    // 13. CARBURANT
    {
      title: "12. Efficacité Energétique & Télématique",
      subtitle: "Suivi rigoureux de la consommation énergétique de la flotte.",
      type: "mockup",
      mockupType: "telematics"
    },
    // 14. CHAUFFEURS
    {
      title: "13. Liaison Chauffeurs & Affectation",
      subtitle: "Maximisez la responsabilisation et l'efficacité de vos équipes de livraison.",
      type: "executive",
      bullets: [
        "Profils de Chauffeurs-Livreurs : Fiche détaillée de chaque conducteur avec son numéro de permis de conduire, son téléphone et son statut en temps réel (En mission, Disponible, En repos).",
        "Indicateurs de performance (Score Chaîne du Froid) : Attribue un score de qualité basé sur le respect des consignes de température pendant les trajets (ex: 98/100 pour Rachid El Amrani).",
        "Liaison Camion/Chauffeur : Visualisation instantanée de quel conducteur pilote quel camion frigorifique de transit, évitant l'éparpillement des informations de livraison.",
        "Contrôle des volumes de livraison : Suivi statistique du nombre total de trajets réussis et des volumes de cartons de glaces livrés par chauffeur au cours de la période."
      ]
    },
    // 15. RAPPORTS ET ANALYTICS
    {
      title: "14. Rapports d'Activité & Analytics",
      subtitle: "Des tableaux décisionnels puissants pour piloter la performance commerciale.",
      type: "split",
      leftTitle: "📊 RAPPORTS DISPONIBLES ET CRITIQUES",
      leftBullets: [
        "Rapport de Performance Vendeurs : Analyse du chiffre d'affaires généré par point de vente de glaces et comparaison des taux de rotation du stock.",
        "Suivi de Rotation des Stocks Usine/Dépôt : Visualisation des quantités fabriquées par rapport aux livraisons réelles.",
        "Rapport d'Audit de Température : Preuve historique de la chaîne du froid, nécessaire pour l'obtention des labels de conformité sanitaire."
      ],
      rightTitle: "🎯 DE LA DONNEE A LA DECISION STRATEGIQUE",
      rightBullets: [
        "Optimisation des investissements : Identification des congélateurs sous-productifs pour les transférer vers des commerces à fort potentiel.",
        "Réduction des litiges clients : Fourniture de rapports de livraison certifiés, avec horodatage GPS, signature numérique et température de conformité.",
        "Modélisation prévisionnelle : Données claires pour ajuster les volumes de production de l'usine selon la demande réelle des dépôts."
      ]
    },
    // 16. SCENARIO D'UTILISATION
    {
      title: "15. Scénario d'Utilisation : Une Journée Type",
      subtitle: "Immersion concrète dans l'exploitation quotidienne assistée par notre application.",
      type: "scenario",
      scenarioSteps: [
        { step: "08:00", title: "Contrôle du Dashboard Matinal", desc: "Le superviseur logistique ouvre l'application. Il vérifie l'état général du stock global et s'assure qu'aucun dépôt n'est en alerte de température critique." },
        { step: "10:00", title: "Planification des Sorties & Bons de Mouvement", desc: "Une commande de 3 congélateurs AP est validée. Le système génère automatiquement les Bons de Sortie correspondants reliés aux camions distributeurs." },
        { step: "13:00", title: "Livraison & Signature du Contrat de Dépôt", desc: "Le chauffeur livre l'appareil au commerce. Il fait signer au client le contrat d'établissement numérisé sur tablette, enregistrant instantanément la position GPS d'installation." },
        { step: "16:00", title: "Réaction à une Alerte de Déplacement", desc: "Le système détecte un mouvement hors zone de l'appareil ZH-88210. Le responsable reçoit l'alerte sur son écran et contacte immédiatement le client pour vérifier." },
        { step: "18:00", title: "Clôture de la Tournée & Rapports", desc: "Les chauffeurs rentrent au dépôt. Les retours de marchandises non vendues sont saisis numériquement dans l'application. Les rapports de CA sont consolidés automatiquement." }
      ]
    },
    // 17. UNE JOURNEE DE GESTION
    {
      title: "16. Une Journée avec Zahi Ice Logistics",
      subtitle: "Comparatif de l'organisation opérationnelle avant et après le déploiement.",
      type: "split",
      leftTitle: "❌ AVANT (GESTION TRADITIONNELLE)",
      leftBullets: [
        "Remplissage fastidieux de registres papier, propices aux pertes, oublis et ratures indéchiffrables.",
        "Ruptures de température détectées tardivement (lorsque la glace a déjà fondu et est invendable).",
        "Flotte de congélateurs éparpillée sur le territoire sans aucun moyen de prouver ou de localiser les vols d'équipements.",
        "Chauffeurs livrant sans suivi de conformité thermique, provoquant des litiges réguliers avec les commerces récepteurs."
      ],
      rightTitle: "✅ AVEC LA SOLUTION CONNECTEE",
      rightBullets: [
        "Saisie instantanée sur tablette ou ordinateur, avec archivage cloud sécurisé et recherche ultra-rapide.",
        "Alerte de température IoT en temps réel, permettant de sauver le stock de glace avant toute dégradation.",
        "Cartographie GPS de chaque appareil, avec barrières virtuelles (Geofencing) et alertes d'intrusion immédiates.",
        "Validation de la chaîne du froid tout au long du transport avec signatures électroniques certifiées et sécurisées."
      ]
    },
    // 18. WEB + MOBILE / ANDROID
    {
      title: "17. Écosystème Multplateforme Web & Mobile",
      subtitle: "Une complémentarité parfaite pour les gestionnaires au bureau et les équipes sur le terrain.",
      type: "split",
      leftTitle: "💻 DECK DE CONTROLE WEB (DESKTOP)",
      leftBullets: [
        "Gestion centralisée de l'administration du parc logistique, configuration des alertes IoT et enregistrement des matériels.",
        "Visualisation cartographique globale de tous les congélateurs déployés sur le territoire national marocain.",
        "Tableaux financiers consolidés, rapports de rentabilité par point de vente et analyses de stock avancées."
      ],
      rightTitle: "📱 SIMULATEUR MOBILE & DRIVER APP",
      rightBullets: [
        "Interface simplifiée conçue spécialement pour l'usage rapide des chauffeurs-livreurs sur le terrain.",
        "Saisie en un clic des livraisons réelles, des retours de stock et enregistrement des signatures clients sur écran.",
        "Suivi de la tournée de livraison attribuée avec affichage du véhicule, de la plaque d'immatriculation et des consignes."
      ]
    },
    // 19. SÉCURITÉ ET GESTION DES ACCÈS
    {
      title: "18. Sécurité des Données & Gestion des Accès",
      subtitle: "Garantissez la confidentialité et la traçabilité des opérations selon le rôle utilisateur.",
      type: "executive",
      bullets: [
        "Structure de rôles fine et normée : L'application restreint l'accès aux données sensibles selon le profil connecté : 'Super Admin', 'Responsable Usine', 'Responsable Dépôt', 'Comptable', 'Chauffeur'.",
        "Trace d'Audit (Audit Logs) : Chaque action critique (suppression d'appareil, modification de stock, ajustement de pertes) est loggée avec l'horodatage, l'adresse IP et l'identité de l'utilisateur.",
        "Protection des données clients : Les informations personnelles des commerçants partenaires (numéro de téléphone, CIN, adresse de patente) sont stockées dans une base de données cryptée.",
        "Serveur local robuste : Système back-end optimisé fonctionnant de manière autonome avec une base de données relationnelle persistante et des règles de sécurité logiques avancées."
      ]
    },
    // 20. BÉNÉFICES BUSINESS
    {
      title: "19. Les Grandes Transformations Business",
      subtitle: "Les évolutions concrètes mesurables au sein de votre organisation.",
      type: "roi",
      beforeWith: [
        { label: "Saisie administrative", before: "Manuelle sur papier (25 min par contrat)", withSol: "Numérisée en 1 clic (2 min par contrat)" },
        { label: "Localisation du parc", before: "Inconnue ou estimée approximativement", withSol: "Géolocalisée à 10m près par satellite" },
        { label: "Protection antivol", before: "Inexistante (constat après disparition physique)", withSol: "Active (Geofencing avec alerte immédiate)" },
        { label: "Perte de glace par panne", before: "Détectée par l'odeur (destruction à 100%)", withSol: "Détectée à -17.5°C par alerte IoT préventive" },
        { label: "Archivage légal", before: "Classeurs physiques encombrants et vulnérables", withSol: "Serveur cloud redondant, PDF standardisé" }
      ]
    },
    // 21. POURQUOI CETTE SOLUTION ?
    {
      title: "20. Pourquoi Choisir Zahi Ice Logistics ?",
      subtitle: "Les avantages distinctifs face aux approches traditionnelles du marché.",
      type: "grid",
      gridItems: [
        { title: "Pensé pour le Froid", desc: "Une solution verticale modélisée sur l'activité réelle des fabricants et distributeurs de crèmes glacées.", icon: "🍦", color: "#0284c7" },
        { title: "Zéro Papier", desc: "Automatise tous vos documents administratifs de manière cohérente, simplifiant la vie des comptables.", icon: "📋", color: "#0d9488" },
        { title: "IoT & GPS Intégré", desc: "Lien physique constant entre l'équipement thermique et l'application centrale pour une visibilité totale.", icon: "🛰️", color: "#4f46e5" },
        { title: "Convivial & Simple", desc: "Design épuré et intuitif pour faciliter l'adoption rapide par les livreurs et les responsables.", icon: "🤝", color: "#059669" },
        { title: "Sécurité & Audit", desc: "Contrôle d'accès rigoureux et historique d'audit inaltérable pour sécuriser les données critiques.", icon: "🔒", color: "#e11d48" },
        { title: "Marocain d'Origine", desc: "Conçu pour s'adapter parfaitement aux réalités géographiques, fiscales et routières du Royaume.", icon: "🇲🇦", color: "#d97706" }
      ]
    },
    // 22. ÉVOLUTIVITÉ
    {
      title: "21. Une Plateforme Evolutive",
      subtitle: "Une architecture prête à grandir en même temps que vos ambitions commerciales.",
      type: "executive",
      bullets: [
        "Mise à l'échelle de la flotte (Scalability) : L'architecture de base de données relationnelle supporte l'ajout de milliers de nouveaux congélateurs sans perte de performance.",
        "Évolutions futures possibles : Intégration de capteurs d'ouverture de porte IoT pour analyser la déperdition thermique des armoires de supermarché.",
        "Module d'optimisation d'itinéraires basé sur l'IA (Planifié) : Calcul automatique de la tournée de livraison la plus éco-responsable selon le niveau de remplissage des congélateurs clients.",
        "Ouverture d'API vers l'ERP de l'entreprise : Prêt à être connecté à vos systèmes de facturation et de comptabilité existants pour éliminer toute double saisie administrative."
      ]
    },
    // 23. LE PLAN DE DÉPLOIEMENT
    {
      title: "22. Plan de Déploiement & On-boarding",
      subtitle: "Une transition fluide vers l'exploitation numérique en 3 étapes clés.",
      type: "split",
      leftTitle: "🚀 ÉTAPES DE MISE EN SERVICE TECHNIQUE",
      leftBullets: [
        "Étape 1 : Audit et Inventaire Initial : Importation de votre parc de congélateurs existant dans la base de données centrale via fichier structuré.",
        "Étape 2 : Installation des balises IoT : Équipement physique des congélateurs cibles avec les micro-sondes de température et boîtiers GPS connectés.",
        "Étape 3 : Configuration du serveur local : Déploiement de l'instance d'application sur votre infrastructure physique ou serveur cloud dédié."
      ],
      rightTitle: "🎓 FORMATION ET ACCOMPAGNEMENT",
      rightBullets: [
        "Formation des administrateurs logistiques : Prise en main du deck de contrôle Web, gestion des alertes et édition des contrats de dépôt.",
        "Atelier pratique pour les techniciens : Utilisation du module maintenance pour documenter les recharges de gaz et réparations.",
        "Accompagnement terrain des chauffeurs : Session d'apprentissage rapide sur l'application mobile pour garantir la conformité des livraisons."
      ]
    },
    // 24. CONCLUSION
    {
      title: "23. Transformez la Gestion de votre Flotte",
      subtitle: "Passez d'une logistique traditionnelle à une flotte connectée, sécurisée et pilotée par la donnée.",
      type: "conclusion",
      conclusionText: "Zahi Ice Logistics n'est pas un simple logiciel d'enregistrement de stock. C'est l'armure technologique indispensable pour protéger vos investissements matériels frigorifiques et maximiser la rentabilité de vos points de vente. En éliminant les vols d'équipements, en sécurisant la température des crèmes glacées à -18°C et en automatisant tous vos documents administratifs de manière cohérente, notre solution transforme vos défis opérationnels en réels avantages concurrentiels."
    },
    // 25. CONTACT
    {
      title: "24. Nous Contacter",
      subtitle: "Échangeons sur vos besoins logistiques et planifions une démonstration en direct.",
      type: "contact",
      contactDetails: [
        { label: "Raison Sociale :", value: "ZAHI GLACES S.A.R.L" },
        { label: "Siège Social :", value: "Tit Mellil, Casablanca, Maroc" },
        { label: "Téléphone Support :", value: "+212 661-234567 / +212 522-987654" },
        { label: "Email Contact :", value: "contact@zahiglaces.com / souaf4@gmail.com" },
        { label: "Plateforme Logicielle :", value: "Zahi Ice Logistics Enterprise v3.0 (Édition 2026)" },
        { label: "Site Internet :", value: "www.zahiglaces.com / ais-dev-lrqr4k7iulri752r5w4exj-436476001059.europe-west1.run.app" }
      ]
    }
  ];

  // Helper function to draw rounded boxes for lists
  const drawListBlock = (yPos: number, bullets: string[], maxWidth = 182) => {
    let currentY = yPos;
    bullets.forEach(bullet => {
      // Draw small soft square bullet
      doc.setFillColor(2, 132, 199); // sky-600
      doc.rect(16, currentY + 1.2, 1.8, 1.8, 'F');

      const parts = bullet.split(' : ');
      if (parts.length > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(parts[0] + ' :', 21, currentY + 2.6);
        const textX = 21 + doc.getTextWidth(parts[0] + ' : ');

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105); // slate-600
        const lines: string[] = doc.splitTextToSize(parts[1], maxWidth - (textX - 16));
        lines.forEach((line, lIdx) => {
          if (lIdx === 0) {
            doc.text(line, textX, currentY + 2.6);
          } else {
            doc.text(line, 21, currentY + 2.6);
          }
          currentY += 3.8;
        });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);
        doc.setTextColor(71, 85, 105);
        const lines: string[] = doc.splitTextToSize(bullet, maxWidth - 8);
        lines.forEach(line => {
          doc.text(line, 21, currentY + 2.6);
          currentY += 3.8;
        });
      }
      currentY += 2;
    });
    return currentY;
  };

  // LOOP THROUGH ALL 25 SLIDES AND GENERATE PAGES
  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const pageNum = index + 1;

    // COVER PAGE STYLE (SLIDE 1)
    if (slide.type === 'cover') {
      doc.setFillColor(15, 23, 42); // slate-900 (Deep corporate dark)
      doc.rect(0, 0, 297, 210, 'F');

      // Decorative slanted graphic - Premium SaaS vibe
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(170, 0, 127, 210, 'F');
      doc.triangle(110, 210, 170, 210, 170, 0, 'F');

      // Light blue accent stripes
      doc.setDrawColor(2, 132, 199); // sky-600
      doc.setLineWidth(1.2);
      doc.line(170, 210, 210, 0);
      doc.line(190, 210, 230, 0);

      // Glowing IoT Circles on cover
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.8);
      doc.circle(245, 105, 38, 'S');
      doc.setDrawColor(13, 148, 136);
      doc.circle(245, 105, 58, 'S');

      // Active Connection lines
      doc.setFillColor(14, 165, 233);
      doc.circle(207, 80, 2.2, 'F');
      doc.circle(275, 150, 2.2, 'F');
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.line(207, 80, 245, 105);
      doc.line(275, 150, 245, 105);

      // Slogan and Title layout
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(30);
      doc.setTextColor(255, 255, 255);
      doc.text('ZAHI ICE LOGISTICS', 20, 65);

      doc.setFontSize(26);
      doc.setTextColor(14, 165, 233); // Vibrant Sky Blue
      doc.text('2026', 20, 77);

      doc.setFillColor(14, 165, 233);
      doc.rect(20, 85, 80, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('DOSSIER STRATÉGIQUE DE PRÉSENTATION', 20, 99);
      doc.text("SOLUTION CONNECTÉE D'OPTIMISATION DE FLOTTE", 20, 107);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(203, 213, 225);
      doc.text("Découvrez comment la numérisation complète de vos contrats et le suivi thermique IoT", 20, 119);
      doc.text("sécurisent vos actifs frigorifiques et maximisent la rentabilité de vos points de vente.", 20, 124);

      // Metadata card
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(20, 148, 115, 38, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(186, 230, 253);
      doc.text("OFFRE TECHNIQUE & DIRECTION GENERALE", 25, 155);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Auteur: Direction Logistique & Commerciale Zahi Ice cream", 25, 162);
      doc.text("Système: Télésurveillance IoT & Géolocalisation GPS Active", 25, 168);
      doc.text("Version: Enterprise Edition v3.0 - Standard Technologique 2026", 25, 174);
      doc.text("Statut: Proposition de Déploiement Opérationnel", 25, 180);

      // Footer cover
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("© ZAHI GLACES S.A.R.L. Tous droits réservés. Document Confidentiel.", 20, 198);
      doc.text(`Slide ${pageNum} sur ${totalPages}`, 277, 198, { align: 'right' });
    }

    // CONTENT SLIDE (EXECUTIVE SUMMARY)
    else if (slide.type === 'executive') {
      drawSlideHeader(pageNum, slide.title, slide.subtitle);

      // Large visual introduction block
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.roundedRect(14, 34, 269, 155, 3, 3, 'FD');

      // Top sky blue stripe
      doc.setFillColor(2, 132, 199);
      doc.rect(14, 34, 269, 2.5, 'F');

      let currentY = 46;
      if (slide.bullets) {
        slide.bullets.forEach(bullet => {
          doc.setFillColor(2, 132, 199);
          doc.rect(20, currentY + 1.2, 2, 2, 'F');

          const parts = bullet.split(' : ');
          if (parts.length > 1) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text(parts[0] + ' :', 26, currentY + 3.2);
            const textX = 26 + doc.getTextWidth(parts[0] + ' : ');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(71, 85, 105); // slate-600
            const lines: string[] = doc.splitTextToSize(parts[1], 269 - (textX - 14) - 10);
            lines.forEach((line, lIdx) => {
              if (lIdx === 0) {
                doc.text(line, textX, currentY + 3.2);
              } else {
                doc.text(line, 26, currentY + 3.2);
              }
              currentY += 4.5;
            });
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(71, 85, 105);
            const lines: string[] = doc.splitTextToSize(bullet, 245);
            lines.forEach(line => {
              doc.text(line, 26, currentY + 3.2);
              currentY += 4.5;
            });
          }
          currentY += 4.5; // gap between paragraphs
        });
      }

      // Add a beautiful central quote/callout at the bottom
      doc.setFillColor(240, 249, 255); // sky-50
      doc.setDrawColor(186, 230, 253); // sky-200
      doc.roundedRect(20, 146, 257, 18, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(2, 132, 199);
      doc.text("« Une visibilité en temps réel à 100% sur vos congélateurs est le seul moyen de pérenniser vos actifs et de stopper définitivement les pertes sèches de matériel. »", 148.5, 157, { align: 'center' });
    }

    // SPLIT SCREEN SLIDE (COMPARATIVE)
    else if (slide.type === 'split') {
      drawSlideHeader(pageNum, slide.title, slide.subtitle);

      // Left Column card
      doc.setFillColor(254, 242, 242); // Rose-50
      doc.setDrawColor(254, 202, 202); // Rose-200
      doc.roundedRect(14, 34, 131, 155, 3, 3, 'FD');
      doc.setFillColor(239, 68, 68); // Red top line
      doc.rect(14, 34, 131, 2.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(185, 28, 28);
      doc.text(slide.leftTitle || '', 20, 46);
      doc.setDrawColor(252, 165, 165);
      doc.line(20, 49, 135, 49);

      let leftY = 56;
      if (slide.leftBullets) {
        slide.leftBullets.forEach(b => {
          doc.setFillColor(239, 68, 68);
          doc.rect(20, leftY + 1.2, 1.8, 1.8, 'F');
          
          const parts = b.split(' : ');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(parts[0] + ' :', 25, leftY + 2.6);
          const tX = 25 + doc.getTextWidth(parts[0] + ' : ');

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          const lines: string[] = doc.splitTextToSize(parts[1], 131 - (tX - 14) - 10);
          lines.forEach((line, lIdx) => {
            if (lIdx === 0) {
              doc.text(line, tX, leftY + 2.6);
            } else {
              doc.text(line, 25, leftY + 2.6);
            }
            leftY += 3.8;
          });
          leftY += 3;
        });
      }

      // Right Column card
      const isRed = slide.title.includes("Défis");
      doc.setFillColor(isRed ? 254 : 240, isRed ? 242 : 253, isRed ? 242 : 250); // green-50/teal-50
      doc.setDrawColor(isRed ? 254 : 153, isRed ? 202 : 246, isRed ? 202 : 228); // green-200/teal-200
      doc.roundedRect(151, 34, 131, 155, 3, 3, 'FD');
      doc.setFillColor(isRed ? 217 : 13, isRed ? 119 : 148, isRed ? 6 : 136); // green-600/teal-600
      doc.rect(151, 34, 131, 2.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(isRed ? 180 : 13, isRed ? 83 : 148, isRed ? 9 : 136);
      doc.text(slide.rightTitle || '', 157, 46);
      doc.setDrawColor(isRed ? 251 : 167, isRed ? 191 : 243, isRed ? 36 : 208);
      doc.line(157, 49, 272, 49);

      let rightY = 56;
      if (slide.rightBullets) {
        slide.rightBullets.forEach(b => {
          doc.setFillColor(isRed ? 217 : 13, isRed ? 119 : 148, isRed ? 6 : 136);
          doc.rect(157, rightY + 1.2, 1.8, 1.8, 'F');
          
          const parts = b.split(' : ');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(parts[0] + ' :', 162, rightY + 2.6);
          const tX = 162 + doc.getTextWidth(parts[0] + ' : ');

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          const lines: string[] = doc.splitTextToSize(parts[1], 131 - (tX - 151) - 10);
          lines.forEach((line, lIdx) => {
            if (lIdx === 0) {
              doc.text(line, tX, rightY + 2.6);
            } else {
              doc.text(line, 162, rightY + 2.6);
            }
            rightY += 3.8;
          });
          rightY += 3;
        });
      }
    }

    // GRID LAYOUT (BENEFITS)
    else if (slide.type === 'grid') {
      drawSlideHeader(pageNum, slide.title, slide.subtitle);

      const fW = 86;
      const fH = 68;
      const gX = 8;
      const gY = 12;
      const sX = 14;
      const sY = 38;

      if (slide.gridItems) {
        slide.gridItems.forEach((f, fIdx) => {
          const rIdx = Math.floor(fIdx / 3);
          const cIdx = fIdx % 3;
          const x = sX + cIdx * (fW + gX);
          const y = sY + rIdx * (fH + gY);

          // Card bg
          doc.setFillColor(248, 250, 252); // slate-50
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.4);
          doc.roundedRect(x, y, fW, fH, 2, 2, 'FD');

          // Top Accent Color
          const hex = f.color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          doc.setFillColor(r, g, b);
          doc.rect(x, y, fW, 2, 'F');

          // Icon and Title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${f.icon}  ${f.title}`, x + 5, y + 8);

          // Line
          doc.setDrawColor(241, 245, 249);
          doc.line(x + 5, y + 11, x + fW - 5, y + 11);

          // Wrapped description text
          drawTextWrapped(f.desc, x + 5, y + 16, fW - 10, 7.5, false, '#475569');
        });
      }
    }

    // MOCK UI SCREENSHOT VECTOR PRESENTATION
    else if (slide.type === 'mockup') {
      drawSlideHeader(pageNum, slide.title, slide.subtitle);

      // Left informational text block (40%)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, 110, 155, 3, 3, 'FD');
      doc.setFillColor(2, 132, 199);
      doc.rect(14, 34, 110, 2.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("💡 AUDIT DE L'INTERFACE REELLE", 20, 46);
      doc.setDrawColor(203, 213, 225);
      doc.line(20, 49, 114, 49);

      let mockY = 56;
      let appMockBullets: string[] = [];

      if (slide.mockupType === 'dashboard') {
        appMockBullets = [
          "Indicateurs de Performance généraux : Totaux récapitulatifs pour suivre d'un seul coup d'œil le volume de congélateurs en Service, Stock ou Maintenance.",
          "Widget FEFO d'Alerte d'Expiration : Analyse automatique des lots de crèmes glacées les plus proches de leur date d'expiration pour planifier des ventes prioritaires.",
          "Sondes de Température de Stock : Widget thermique centralisé de surveillance des températures des magasins usine et dépôts de Casablanca et Marrakech.",
          "KPI Chiffre d'Affaires : Consolidation automatique en MAD des miels commerciaux collectés lors des dernières livraisons validées."
        ];
      } else if (slide.mockupType === 'tracking') {
        appMockBullets = [
          "Cartographie Interactive Satellite : Intègre un fond de carte OpenStreetMap fluide affichant précisément l'adresse physique de chaque commerce marocain.",
          "Alertes de Geofencing en temps réel : Notification rouge immédiate si les balises IoT détectent un changement d'adresse physique hors des limites du commerce.",
          "Suivi et Filtres de Flotte : Recherche rapide par numéro de série de l'armoire ou du coffre congélateur.",
          "Historique des relevés GPS : Possibilité de retracer le parcours des livreurs et l'état des arrêts de déchargement."
        ];
      } else if (slide.mockupType === 'telematics') {
        appMockBullets = [
          "Suivi de Consommation Compresseur : Widget IoT captant la puissance électrique consommée (en Watt) pour auditer l'efficacité énergétique.",
          "Alertes Température Critique : Signal sonore et visuel si un équipement client franchit la barrière critique de -18°C.",
          "Score d'Éco-Conduite Chauffeurs : Métrique télématique évaluant la régularité thermique du transit du véhicule de livraison.",
          "Archivage de Conformité : Génération de rapports complets sous forme de fiches d'audit à remettre aux autorités d'hygiène."
        ];
      }

      appMockBullets.forEach(b => {
        doc.setFillColor(2, 132, 199);
        doc.rect(20, mockY + 1.2, 1.8, 1.8, 'F');
        const parts = b.split(' : ');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(parts[0] + ' :', 25, mockY + 2.6);
        const tX = 25 + doc.getTextWidth(parts[0] + ' : ');

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(parts[1], 110 - (tX - 14) - 8);
        lines.forEach((line, lIdx) => {
          if (lIdx === 0) {
            doc.text(line, tX, mockY + 2.6);
          } else {
            doc.text(line, 25, mockY + 2.6);
          }
          mockY += 3.8;
        });
        mockY += 3;
      });

      // Right Section - SaaS 2026 Dark Mock UI Screen Representation (60%)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(131, 34, 151, 155, 3, 3, 'FD');

      // Windows control bar mockup
      doc.setFillColor(30, 41, 59);
      doc.rect(131, 34, 151, 10, 'F');
      doc.setFillColor(239, 68, 68); doc.circle(135, 39, 1, 'F');
      doc.setFillColor(245, 158, 11); doc.circle(138, 39, 1, 'F');
      doc.setFillColor(16, 185, 129); doc.circle(141, 39, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`Plateforme de Supervision Zahi Ice cream - ${slide.title.toUpperCase()}`, 146, 40.5);

      if (slide.mockupType === 'dashboard') {
        // Draw KPI boxes
        const drawMockKpiBox = (x: number, y: number, w: number, label: string, val: string, rgb: [number, number, number]) => {
          doc.setFillColor(30, 41, 59);
          doc.roundedRect(x, y, w, 15, 1, 1, 'F');
          doc.setFillColor(...rgb);
          doc.rect(x, y, w, 0.8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(148, 163, 184);
          doc.text(label.toUpperCase(), x + 2.5, y + 4.5);
          doc.setFontSize(8.5);
          doc.setTextColor(255, 255, 255);
          doc.text(val, x + 2.5, y + 11);
        };

        drawMockKpiBox(135, 48, 33, "Stock Usine", "43 850 Cartons", [2, 132, 199]);
        drawMockKpiBox(171, 48, 33, "Actifs Déployés", "128 Congélateurs", [16, 185, 129]);
        drawMockKpiBox(207, 48, 33, "Dépôts Actifs", "10 Régions", [99, 102, 241]);
        drawMockKpiBox(243, 48, 33, "Chiffre d'Affaires", "85 410 DH", [245, 158, 11]);

        // Left map box
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(135, 68, 86, 85, 1.5, 1.5, 'F');
        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(1.2);
        doc.line(135, 110, 221, 110);
        doc.line(180, 68, 180, 153);
        doc.setFillColor(16, 185, 129); doc.circle(180, 110, 2, 'F');
        doc.setFillColor(2, 132, 199); doc.circle(160, 95, 1.5, 'F');
        doc.setFillColor(239, 68, 68); doc.circle(195, 85, 1.8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(239, 68, 68);
        doc.text("⚠️ ALERTE : Congélateur ZH-7502 déplacé", 138, 74);

        // Right telematics parameters
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(225, 68, 52, 85, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(186, 230, 253);
        doc.text("Relevé Télématique", 229, 74);
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text("S/N: ZAHI-AG-1053", 229, 79.5);

        const drawMiniLine = (y: number, title: string, value: string, rgbStr = '#34d399') => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(148, 163, 184);
          doc.text(title.toUpperCase(), 229, y);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          const parts = rgbStr.replace('#', '');
          const r = parseInt(parts.substring(0, 2), 16);
          const g = parseInt(parts.substring(2, 4), 16);
          const b = parseInt(parts.substring(4, 6), 16);
          doc.setTextColor(r, g, b);
          doc.text(value, 229, y + 4);
        };

        drawMiniLine(86, "Température Comp.", "-19.1°C", "#34d399");
        drawMiniLine(96, "Énergie instantanée", "120 Watts", "#38bdf8");
        drawMiniLine(106, "Stock Crème Glacée", "50% (Rempli)", "#fbbf24");
        drawMiniLine(116, "Dernier Entretien", "22/07/2026", "#cbd5e1");
        drawMiniLine(126, "Taux de rotation", "3.2 j / livraison", "#a78bfa");

        // Bottom graph simulation
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(135, 157, 142, 27, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("Rotation hebdomadaire par Dépôt régional (Volume de cartons)", 140, 163);

        const drawSimBar = (x: number, h: number, rgb: [number, number, number], name: string) => {
          doc.setFillColor(...rgb);
          doc.rect(x, 178 - h, 6, h, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(148, 163, 184);
          doc.text(name, x - 1, 182.5);
        };

        drawSimBar(145, 10, [239, 68, 68], "Casa");
        drawSimBar(161, 13, [16, 185, 129], "Marrak");
        drawSimBar(177, 7, [59, 130, 246], "Agadir");
        drawSimBar(193, 11, [245, 158, 11], "Fès");
        drawSimBar(209, 8, [139, 92, 246], "Tanger");
        drawSimBar(225, 12, [236, 72, 153], "Oujda");
        drawSimBar(241, 9, [99, 102, 241], "Meknès");
        drawSimBar(257, 6, [20, 184, 166], "Rabat");
      } else if (slide.mockupType === 'tracking') {
        // Simulation of tracking screen (large map with markers)
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(135, 48, 142, 136, 2, 2, 'F');

        // Draw multiple connection grids representing road maps
        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(1.8);
        doc.line(135, 116, 277, 116);
        doc.line(206, 48, 206, 184);
        doc.line(135, 60, 277, 150);
        doc.line(135, 160, 277, 70);

        // Markers representation
        doc.setFillColor(16, 185, 129); // Green marker for safe client
        doc.circle(206, 116, 2.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(16, 185, 129);
        doc.text("OULAD GHANAM (ABDERAHIM)", 209, 115);

        doc.setFillColor(2, 132, 199); // Blue marker for safe client 2
        doc.circle(180, 95, 2.5, 'F');
        doc.setTextColor(2, 132, 199);
        doc.text("BVR CHOHDA (BADER HAMSI)", 183, 94);

        doc.setFillColor(239, 68, 68); // Red flashing marker for alarm
        doc.circle(230, 142, 3.2, 'F');
        doc.setFont('helvetica', 'black');
        doc.setTextColor(239, 68, 68);
        doc.text("🚨 DANGER : HORS ZONE S/N 88210", 235, 141.5);

        // Search panel overlay inside mockup
        doc.setFillColor(15, 23, 42); // slate-900
        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(0.4);
        doc.roundedRect(139, 52, 60, 32, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Filtres Actifs :", 143, 58);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(148, 163, 184);
        doc.text("- Dépôt : Casablanca", 143, 63);
        doc.text("- Type : AP (Coffre)", 143, 67);
        doc.text("- Statut : En Service", 143, 71);
        doc.text("- Vendeur : ABDERAHIM", 143, 75);
      } else if (slide.mockupType === 'telematics') {
        // Telematics dials representation
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(135, 48, 142, 136, 2, 2, 'F');

        // Circular dials drawn with standard circles
        const drawMockDial = (x: number, y: number, r: number, title: string, value: string, colorRgb: [number, number, number]) => {
          doc.setDrawColor(51, 65, 85);
          doc.setLineWidth(1.5);
          doc.circle(x, y, r, 'S');

          // Colored active progress arc representation
          doc.setDrawColor(...colorRgb);
          doc.setLineWidth(2.2);
          doc.circle(x, y, r - 0.5, 'S');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(148, 163, 184);
          doc.text(title.toUpperCase(), x, y - 4, { align: 'center' });

          doc.setFont('helvetica', 'black');
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text(value, x, y + 3, { align: 'center' });
        };

        drawMockDial(165, 85, 20, "Température", "-19.5°C", [16, 185, 129]);
        drawMockDial(211, 85, 20, "Humidité", "55%", [14, 165, 233]);
        drawMockDial(257, 85, 20, "Compresseur", "94%", [139, 92, 246]);

        // Text summary
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(139, 124, 134, 52, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Journal de Diagnostic de l'Appareil Connecté", 143, 131);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text("• Relevé compresseur : Running (Fonctionnement optimal)", 143, 138);
        doc.text("• Flux de fluide : R404A Conforme, pas de fuite détectée", 143, 144);
        doc.text("• Consommation accumulée : 1.2 kWh / 24 heures (Économe)", 143, 150);
        doc.text("• Tension électrique du secteur : 224 Volts (Stable)", 143, 156);
        doc.text("• Date du prochain étalonnage sonde : Novembre 2026", 143, 162);
      }
    }

    // SCENARIO D'UTILISATION (TIMELINE)
    else if (slide.type === 'scenario') {
      drawSlideHeader(pageNum, slide.title, slide.subtitle);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, 269, 155, 3, 3, 'FD');
      doc.setFillColor(2, 132, 199);
      doc.rect(14, 34, 269, 2.5, 'F');

      let sy = 48;
      if (slide.scenarioSteps) {
        slide.scenarioSteps.forEach((step, sIdx) => {
          // Circle marker for timeline
          doc.setFillColor(2, 132, 199);
          doc.circle(24, sy + 3, 4.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          doc.text(step.step, 24, sy + 4.2, { align: 'center' });

          // Connecting vertical timeline bar
          if (sIdx < slide.scenarioSteps.length - 1) {
            doc.setDrawColor(186, 230, 253);
            doc.setLineWidth(1.0);
            doc.line(24, sy + 7.5, 24, sy + 29);
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(step.title, 34, sy + 2.5);

          // Wrapped description
          sy = drawTextWrapped(step.desc, 34, sy + 6.2, 238, 7.8, false, '#475569');
          sy += 4.5;
        });
      }
    }

    // ROI BEFORE/WITH SOLUTIONS TABLE
    else if (slide.type === 'roi') {
      drawSlideHeader(pageNum, slide.title, slide.subtitle);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, 269, 155, 3, 3, 'FD');
      doc.setFillColor(13, 148, 136); // teal-600
      doc.rect(14, 34, 269, 2.5, 'F');

      // Table Header Row
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(20, 44, 257, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("DIMENSION DU FLUX LOGISTIQUE", 24, 50.5);
      doc.text("SANS LA SOLUTION (TRADITIONNEL)", 105, 50.5);
      doc.text("AVEC LA SOLUTION CONNECTÉE ZAHI 2026", 195, 50.5);

      let ry = 54;
      if (slide.beforeWith) {
        slide.beforeWith.forEach((row, rIdx) => {
          doc.setFillColor(rIdx % 2 === 1 ? 248 : 255, rIdx % 2 === 1 ? 250 : 255, rIdx % 2 === 1 ? 252 : 255);
          doc.rect(20, ry, 257, 18, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(20, ry + 18, 277, ry + 18);

          // Category
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(row.label, 24, ry + 8.5);

          // Before (Red styling)
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(185, 28, 28); // red-700
          const beforeLines: string[] = doc.splitTextToSize(row.before, 84);
          beforeLines.forEach((line, lIdx) => {
            doc.text(line, 105, ry + 6 + (lIdx * 3.8));
          });

          // With Zahi (Green styling)
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(13, 148, 136); // teal-600
          const withLines: string[] = doc.splitTextToSize(row.withSol, 80);
          withLines.forEach((line, lIdx) => {
            doc.text(line, 195, ry + 6 + (lIdx * 3.8));
          });

          ry += 18;
        });
      }

      // Add small analytical note bottom
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("*Note d'analyse : Modélisation des ratios de performance mesurée chez nos premiers clients partenaires après déploiement en conditions réelles.", 20, 182);
    }

    // CONCLUSION SLIDE
    else if (slide.type === 'conclusion') {
      drawSlideHeader(pageNum, slide.title, slide.subtitle);

      doc.setFillColor(15, 23, 42); // slate-900 (Stunning dark theme conclusion card)
      doc.roundedRect(14, 34, 269, 155, 4, 4, 'F');

      // Slanted graphic background
      doc.setFillColor(30, 41, 59);
      doc.triangle(14, 189, 140, 189, 14, 110, 'F');
      doc.setFillColor(2, 132, 199, 0.08);
      doc.triangle(14, 189, 210, 189, 14, 70, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("L'EXCELLENCE LOGISTIQUE DU FROID", 148.5, 62, { align: 'center' });

      doc.setFillColor(14, 165, 233);
      doc.rect(118, 68, 61, 1.2, 'F');

      // Paragraph conclusion wrapping
      const textY = drawTextWrapped(slide.conclusionText || '', 30, 80, 237, 10.5, false, '#e2e8f0', 'center');

      // Digital Quality Stamp Frame
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.5);
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(63, 126, 171, 46, 2.5, 2.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text("ENGAGEMENT CONCRET DE PERFORMANCE ET CONFORMITE 2026", 148.5, 134, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(186, 230, 253);
      doc.text("• Garantie de sécurité physique : Surveillance satellitaire active et dissuasive contre le vol.", 148.5, 141, { align: 'center' });
      doc.text("• Garantie de sécurité sanitaire : Audit de température ininterrompu à -18°C certifié par IoT.", 148.5, 146, { align: 'center' });
      doc.text("• Garantie administrative : Dématérialisation légale complète de vos bordereaux et contrats.", 148.5, 151, { align: 'center' });

      // Drawing Passed Stamp circle
      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(0.4);
      doc.circle(79, 149, 6.5, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(13, 148, 136);
      doc.text("PASSED", 75, 149.5);

      // Drawing Secure Stamp circle
      doc.setDrawColor(245, 158, 11);
      doc.circle(218, 149, 6.5, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(245, 158, 11);
      doc.text("SECURE", 214, 149.5);
    }

    // CONTACT SLIDE
    else if (slide.type === 'contact') {
      drawSlideHeader(pageNum, slide.title, slide.subtitle);

      // Card wrapping contact details
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, 269, 155, 3, 3, 'FD');
      doc.setFillColor(2, 132, 199);
      doc.rect(14, 34, 269, 2.5, 'F');

      // Contact Icon Drawing representing corporate office
      doc.setFillColor(30, 41, 59); // slate-800
      doc.roundedRect(148.5 - 28, 48, 56, 12, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("📞 PRENDRE CONTACT", 148.5, 56, { align: 'center' });

      let cy = 72;
      if (slide.contactDetails) {
        slide.contactDetails.forEach(c => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(c.label, 30, cy);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105); // slate-600
          
          const maxW = 269 - (doc.getTextWidth(c.label) + 20) - 20;
          const valLines: string[] = doc.splitTextToSize(c.value, maxW);
          const valueStartX = 34 + doc.getTextWidth(c.label);
          
          valLines.forEach((line, lIdx) => {
            if (lIdx === 0) {
              doc.text(line, valueStartX, cy);
            } else {
              doc.text(line, 30, cy + (lIdx * 3.8));
            }
          });

          cy += valLines.length * 3.8 + 5;
        });
      }

      // Beautiful callout bottom
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(26, 150, 245, 18, 1.5, 1.5, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(2, 132, 199);
      doc.text("Passez dès aujourd'hui d'une gestion logistique traditionnelle à un parc frigorifique connecté.", 148.5, 161, { align: 'center' });
    }
  });

  // Slide header rendering helper
  function drawSlideHeader(pageNumber: number, title: string, subtitle: string) {
    // Top bar
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, 297, 24, 'F');
    doc.setFillColor(2, 132, 199); // sky-600
    doc.rect(0, 24, 297, 1.2, 'F');

    // Title text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), 14, 11);

    // Subtitle text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(186, 230, 253);
    doc.text(subtitle, 14, 18);

    // Logo brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ZAHI ICE LOGISTICS 2026', 283, 11, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(186, 230, 253);
    doc.text('Dossier de Présentation SaaS B2B', 283, 17.5, { align: 'right' });

    // Footer template
    doc.setFillColor(241, 245, 249); // slate-100 bg
    doc.rect(0, 200, 297, 10, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("© ZAHI GLACES S.A.R.L. - Plateforme d'Administration & Télémétrie Flotte", 14, 206.5);
    doc.text(`Slide ${pageNumber} sur ${totalPages}`, 283, 206.5, { align: 'right' });
  }

  // Save the entire 25 pages document
  doc.save('Presentation_Commerciale_Zahi_Ice_Logistics_2026.pdf');
}
