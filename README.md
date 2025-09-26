Ce projet est la concrétisation du cahier des charges de Leets, visant à créer une interface de streaming de nouvelle génération. Il applique l'intégralité des concepts HTML / CSS vus en cours, en mettant l'accent sur l'expérience utilisateur et l'architecture de code modulaire.

✨ Design & Expérience Utilisateur : L'Art de l'Immersif
L'esthétique de StreamFlix repose sur un design moderne et sombre, conçu pour plonger l'utilisateur dans l'univers du cinéma dès la première seconde.

Caractéristique Clé	Impact sur l'Interface	Fondement Technique
Mobile-First	Garantie d'une ergonomie parfaite, quel que soit l'appareil.	Layout entièrement responsive et fluide.
Hero Section	Zone d'accroche visuelle forte et dynamique.	Application des Transitions fluides sur les éléments d'appel à l'action.
Grilles & Catalogue	Organisation claire et élégante du contenu.	Combinaison de CSS Grid (catalogues) et Flexbox (navigation/alignement).
Interactions	Sentiment de réactivité et de qualité premium.	Hover effects systématiques et animation de fond subtile.

Exporter vers Sheets
💡 Architecture CSS Avancée : La Force des Design Tokens
La modularité et la cohérence visuelle sont au cœur de ce projet. Toute la charte graphique est gérée par des Variables CSS définies à la racine (:root), agissant comme des Design Tokens.

Token	Rôle Stratégique	Exemple
--color-accent	Couleur de marque, attire le regard sur les CTA primaires.	#e50914 (Rouge Vif)
--transition-easing	Définition d'un comportement de mouvement unique.	cubic-bezier(0.25, 0.8, 0.25, 1) (Effet de "Ressort" doux)
--border-radius	Cohérence des formes à travers tous les composants.	16px (Arrondis modernes)

Exporter vers Sheets
🚀 Le Défi Avancé : Modularité & Effets Dynamiques
1. Système de Thèmes Dynamique (Défi Réussi)
Un système de thèmes multiples a été implémenté, démontrant une maîtrise des variables en cascade. Le changement d'ambiance se fait par la simple modification d'une classe sur le <body>, et la transition est gérée par la propriété transition, assurant une fluidité visuelle sans rupture.

Thème	Ambiance	Usage
Sombre (Défaut)	Moderne et profond.	Visionnage nocturne.
Clair	Lumineux et contrasté.	Utilisation en plein jour.
Cinéma	Ambre/sépia, riche en contraste.	Ambiance rétro et chaleureuse.

Exporter vers Sheets
2. Glassmorphism Liquide
L'effet de verre est appliqué aux composants clés (Header, Modales, Boutons Secondaires) via la classe utilitaire .glassmorphism-effect.

Le Secret du "Liquide" : L'effet va au-delà du simple flou. La valeur accentuée de --glass-blur: 20px rend le "verre" moins rigide.

Dynamisme : L'élément en verre réagit et se fond sur le fond animé du body (@keyframes background-pan), créant une sensation de profondeur et de mouvement constant, typique des interfaces futuristes.

⚙️ Structure et Démarrage
Organisation du CSS
Le fichier CSS est rigoureusement structuré pour la lisibilité et la maintenance :

VARIABLES CSS (Design Tokens)

STYLES DE BASE ET FOND ANIMÉ

GLASSMORPHISM LIQUIDE UTILITAIRE

CLASSES UTILITAIRES

COMPOSANTS GÉNÉRIQUES

Pour Démarrer le Projet
Clonez le dépôt du projet.

Ouvrez directement le fichier index.html dans n'importe quel navigateur moderne.
