let deck = [];
let joueur1Main = [];
let joueur2Main = [];
let carteJoueur1 = null;
let carteJoueur2 = null;
let premierJoueur = null;
let tourDe = null;

let carteBataille1 = null;
let carteBataille2 = null;

let joueur1Pile = [];
let joueur2Pile = [];

let numeroTour = 0;
const MAX_TOUR = 90;

let premierAJoueRenfort = false;

let carteJoueurJouee = false;

// Variables pour gérer le blocage de la carte bonus blocage
let cartesBloquees = {
  joueur1: [],
  joueur2: []
};

let carteBonusEnCours = false;
let joueur1EstPremier = false;

// --- 1. Déclarez les cartes bonus possibles et l’état des cartes bonus des joueurs ---
const cartesBonusDisponibles = [
  { nom: "Vol", description: "Permet d'échanger une carte avec l'adversaire" },
  { nom: "Blocage", description: "Bloque 2 cartes de l'adversaire pour ce tour" },
  { nom: "Joker", description: "Permet de choisir n'importe quel bonus existant" }
];

let carteBonusJoueur1 = null;
let carteBonusJoueur1Utilisee = false;
let carteBonusJoueur2 = null;
let carteBonusJoueur2Utilisee = false;

let bonusUtilisableCeTour = true; // Indique si le joueur peut utiliser sa carte bonus ce tour


fetch("data/deck.json")
  .then((response) => response.json())
  .then((data) => {
    deck = data.sort(() => Math.random() - 0.5);
    initialiserJeu();
  });



// Initialisation du jeu
function initialiserJeu() {
  joueur1Main = deck.slice(0, 5);
  joueur2Main = deck.slice(5, 10);
  deck = deck.slice(10);
  
  premierJoueur = Math.random() < 0.5 ? "joueur1" : "joueur2";
  tourDe = premierJoueur;

  joueur1EstPremier = (premierJoueur === "joueur1"); //permet au bot de savoir si il débute la partie ou non

  // Distribuer cartes bonus
  carteBonusJoueur1 = tirerCarteBonus();
  carteBonusJoueur1Utilisee = false;
  carteBonusJoueur2 = tirerCarteBonus();
  carteBonusJoueur2Utilisee = false;

  afficherTour();
  afficherNumeroTour();
  afficherMain(joueur1Main, "player-hand", "joueur1");
  afficherMain(joueur2Main, "opponent-hand", "joueur2");
  majCartesJouees();
  afficherPile();
  afficherCartesBonus('joueur1');
  afficherCartesBonus('joueur2');

  bonusUtilisableCeTour = true; // Dès le premier tour, le joueur actif peut utiliser sa carte bonus
  if (tourDe === "joueur1") {
    console.log("🎮 Joueur1 commence (le bot). Lancement du bot dans 500ms...");
    setTimeout(() => {
      jouerCarteBotAleatoire(); // appel direct
    }, 2000); // court délai pour garantir que le DOM est prêt
  }
}


// LOGIQUE DE JEU DU BOT
function jouerCarteBotAleatoire() {
  if (carteBonusEnCours) {
    setTimeout(jouerCarteBotAleatoire, 500);
    return;
  }

  if (tourDe !== "joueur1" || joueur1Main.length === 0) return;

  const bloquees = cartesBloquees["joueur1"] || [];
  const indicesDisponibles = joueur1Main
    .map((_, i) => i)
    .filter(i => !bloquees.includes(i));

  if (indicesDisponibles.length === 0) return; // aucune carte jouable

  let indexChoisi;

  if (joueur1EstPremier) {
    // Carte avec la plus petite valeur parmi les disponibles
    indexChoisi = indicesDisponibles.reduce((minIndex, currIndex) => {
      return joueur1Main[currIndex].note < joueur1Main[minIndex].note ? currIndex : minIndex;
    });
  } else {
    // Carte avec la plus grande valeur parmi les disponibles
    indexChoisi = indicesDisponibles.reduce((maxIndex, currIndex) => {
      return joueur1Main[currIndex].note > joueur1Main[maxIndex].note ? currIndex : maxIndex;
    });
  }

  jouerCarte("joueur1", indexChoisi);
}



// Fonction utilitaire pour tirer une carte bonus aléatoire
function tirerCarteBonus() {
  const randomIndex = Math.floor(Math.random() * cartesBonusDisponibles.length);
  return cartesBonusDisponibles[randomIndex];
}


// Afficher carte bonus
function afficherCartesBonus(joueur) {
  const conteneur = document.getElementById(`bonus-${joueur}`);
  conteneur.innerHTML = ''; // On vide avant de réafficher

    const carteBonus = joueur === 'joueur1' ? carteBonusJoueur1 : carteBonusJoueur2;
  const utilisee = joueur === 'joueur1' ? carteBonusJoueur1Utilisee : carteBonusJoueur2Utilisee;

  if (carteBonus && !utilisee) {
    const divCarte = document.createElement('div');
    divCarte.className = 'carte-bonus';
    divCarte.textContent = `${carteBonus.nom} - ${carteBonus.description}`;
    divCarte.style.padding = '5px 10px';
    divCarte.style.marginBottom = '5px';
    divCarte.style.border = '1px solid #555';
    divCarte.style.borderRadius = '4px';
    divCarte.style.backgroundColor = '#ecf0f1';
    divCarte.style.color = '#2c3e50';
    divCarte.style.fontSize = '0.9em';
    conteneur.appendChild(divCarte);
  } else if (utilisee) {
    const divUtilisee = document.createElement('div');
    divUtilisee.textContent = 'Carte bonus utilisée';
    divUtilisee.style.color = '#7f8c8d';
    divUtilisee.style.fontStyle = 'italic';
    conteneur.appendChild(divUtilisee);
  }
}



// Utilisation d'une carte bonus par un joueur
async function utiliserCarteBonus(joueur) {
  // Vérifie que la carte bonus est utilisable en début de tour
  if (!bonusUtilisableCeTour || carteJoueurJouee) {
    alert("Vous ne pouvez utiliser votre carte bonus qu'en début de tour, avant qu'une carte ne soit jouée.");
    return;
  }

  // Récupère la carte bonus du joueur
  let carteBonus = joueur === "joueur1" ? carteBonusJoueur1 : carteBonusJoueur2;

  // Vérifie que le joueur a bien une carte bonus
  if (!carteBonus) {
    alert("Vous avez déjà utilisé votre carte bonus.");
    return;
  }

  // Vérifie si ce joueur a déjà utilisé sa carte bonus définitivement
  if ((joueur === "joueur1" && carteBonusJoueur1Utilisee) ||
      (joueur === "joueur2" && carteBonusJoueur2Utilisee)) {
    alert("Vous avez déjà utilisé votre carte bonus.");
    return;
  }

  // NOUVEAU : Bloquer le jeu pendant l'utilisation du bonus
  carteBonusEnCours = true;

  // Exécute l'effet de la carte bonus
  if (carteBonus.nom === "Vol") {
    await utiliserCarteBonusVol(joueur);
  } else if (carteBonus.nom === "Blocage") {
    await utiliserCarteBonusBlocage(joueur);
  } else if (carteBonus.nom === "Joker") {
    await utiliserCarteBonusJoker(joueur);
  }

  // Marque la carte bonus comme utilisée définitivement
  if (joueur === "joueur1") {
    carteBonusJoueur1Utilisee = true;
    carteBonusJoueur1 = null;
  } else {
    carteBonusJoueur2Utilisee = true;
    carteBonusJoueur2 = null;
  }

  // Si les deux cartes bonus ont été utilisées ou une carte a été jouée, on désactive l'option
  if (carteBonusJoueur1Utilisee && carteBonusJoueur2Utilisee) {
    bonusUtilisableCeTour = false;
  }

  // NOUVEAU : Débloquer le jeu
  carteBonusEnCours = false;

  // Rafraîchit l'affichage
  afficherCartesBonus('joueur1');
  afficherCartesBonus('joueur2');
  afficherMain(joueur1Main, "player-hand", "joueur1");
  afficherMain(joueur2Main, "opponent-hand", "joueur2");
}



// Fonctionnement de la carte bonus Vol
async function utiliserCarteBonusVol(joueur) {
  const mainJoueur = joueur === "joueur1" ? joueur1Main : joueur2Main;
  const mainAdversaire = joueur === "joueur1" ? joueur2Main : joueur1Main;

  alert("Sélectionnez une carte dans la main de l’adversaire à échanger.");

  const indexCarteAdversaire = await choisirCarte(mainAdversaire, joueur === "joueur1" ? "opponent-hand" : "player-hand");
  if (indexCarteAdversaire === null) {
    alert("Échange annulé.");
    return;
  }

  alert("Sélectionnez une carte dans votre main à échanger.");

  const indexCarteJoueur = await choisirCarte(mainJoueur, joueur === "joueur1" ? "player-hand" : "opponent-hand");
  if (indexCarteJoueur === null) {
    alert("Échange annulé.");
    return;
  }

  // Échange des cartes
  const temp = mainJoueur[indexCarteJoueur];
  mainJoueur[indexCarteJoueur] = mainAdversaire[indexCarteAdversaire];
  mainAdversaire[indexCarteAdversaire] = temp;

  alert("Échange effectué avec succès !");
}



// Fonctionnement de la carte bonus Blocage
async function utiliserCarteBonusBlocage(joueur) {
  const adversaire = joueur === "joueur1" ? "joueur2" : "joueur1";
  const mainAdversaire = joueur === "joueur1" ? joueur2Main : joueur1Main;
  const elementAdversaire = joueur === "joueur1" ? "opponent-hand" : "player-hand";

  alert("Sélectionnez la première carte à bloquer chez l'adversaire.");
  
  const indexCarte1 = await choisirCarte(mainAdversaire, elementAdversaire);
  if (indexCarte1 === null) {
    alert("Blocage annulé.");
    return;
  }

  alert("Sélectionnez la deuxième carte à bloquer chez l'adversaire.");
  
  const indexCarte2 = await choisirCarte(mainAdversaire.filter((_, i) => i !== indexCarte1), elementAdversaire);
  if (indexCarte2 === null) {
    alert("Blocage annulé.");
    return;
  }

  // Ajuster l'index de la deuxième carte
  const realIndex2 = indexCarte2 >= indexCarte1 ? indexCarte2 + 1 : indexCarte2;

  // Bloquer les cartes
  cartesBloquees[adversaire] = [indexCarte1, realIndex2];
  
  alert(`Deux cartes de ${adversaire === "joueur1" ? "Joueur 1" : "Joueur 2"} sont bloquées pour ce tour !`);
}



// Fonctionnement de la carte bonus Joker
async function utiliserCarteBonusJoker(joueur) {
  // Liste des bonus disponibles (excluant le Joker lui-même)
  const bonusDisponibles = cartesBonusDisponibles.filter(carte => carte.nom !== "Joker");
  
  const choix = await choisirBonus(bonusDisponibles);
  if (choix === null) {
    alert("Utilisation du Joker annulée.");
    return;
  }

  const bonusChoisi = bonusDisponibles[choix];
  alert(`Vous avez choisi d'utiliser : ${bonusChoisi.nom}`);

  // Exécuter le bonus choisi
  if (bonusChoisi.nom === "Vol") {
    await utiliserCarteBonusVol(joueur);
  } else if (bonusChoisi.nom === "Blocage") {
    await utiliserCarteBonusBlocage(joueur);
  }
}



// Choisir son bonus quand on a la carte Joker
function choisirBonus(bonusDisponibles) {
  return new Promise((resolve) => {
    // Créer une interface temporaire pour choisir le bonus
    const body = document.body;
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "1000";

    const container = document.createElement("div");
    container.style.backgroundColor = "#ecf0f1";
    container.style.padding = "20px";
    container.style.borderRadius = "10px";
    container.style.textAlign = "center";
    container.style.color = "#2c3e50";

    const titre = document.createElement("h3");
    titre.textContent = "Choisissez un bonus à utiliser :";
    container.appendChild(titre);

    bonusDisponibles.forEach((bonus, index) => {
      const bouton = document.createElement("button");
      bouton.textContent = `${bonus.nom} - ${bonus.description}`;
      bouton.style.display = "block";
      bouton.style.margin = "10px auto";
      bouton.style.padding = "10px 15px";
      bouton.style.backgroundColor = "#3498db";
      bouton.style.color = "white";
      bouton.style.border = "none";
      bouton.style.borderRadius = "5px";
      bouton.style.cursor = "pointer";
      bouton.style.minWidth = "300px";
      
      bouton.onclick = () => {
        body.removeChild(overlay);
        resolve(index);
      };
      
      container.appendChild(bouton);
    });


    overlay.appendChild(container);
    body.appendChild(overlay);
  });
}



// Choisir une carte en cliquant dessus
function choisirCarte(main, elementId) {
  return new Promise((resolve) => {
    const container = document.getElementById(elementId);
    container.innerHTML = "";

    const message = document.createElement("div");
    message.innerText = `Cliquez sur une carte pour la sélectionner, ou annulez :`;
    container.appendChild(message);

    main.forEach((carte, index) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <strong>${carte.nom}</strong>
        <span>${carte.poste}</span>
        <span>${carte.note}</span>
        <span>${carte.nationalite}${carte.legende ? " ⭐" : ""}</span>
      `;
      div.onclick = () => resolve(index);
      container.appendChild(div);
    });

    const annulerBtn = document.createElement("button");
    annulerBtn.innerText = "Annuler";
    annulerBtn.onclick = () => resolve(null);
    container.appendChild(annulerBtn);
  });
}



// Afficher la main des joueurs
function afficherMain(cartes, elementId, joueur) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";
  cartes.forEach((carte, index) => {
    const div = document.createElement("div");
    div.className = "card";
    
    // Vérifier si la carte est bloquée
    const estBloquee = cartesBloquees[joueur].includes(index);
    
    if (estBloquee) {
      div.classList.add("blocked");
      div.style.opacity = "0.5";
      div.style.border = "2px solid #e74c3c";
      div.style.cursor = "not-allowed";
    }
    
    div.innerHTML = `
      <strong>${carte.nom}</strong>
      <span>${carte.poste}</span>
      <span>${carte.note}</span>
      <span>${carte.nationalite}${carte.legende ? " ⭐" : ""}</span>
      ${estBloquee ? '<span style="color: #e74c3c;">🚫 BLOQUÉE</span>' : ''}
    `;
    
    if (!estBloquee) {
      div.onclick = () => jouerCarte(joueur, index);
    }
    
    container.appendChild(div);
  });
}



// Afficher quel joueur doit jouer
function afficherTour() {
  const info = document.getElementById("tour-info");
  if (!tourDe) {
    info.innerText = "🚫 La partie est terminée.";
  } else {
    info.innerText = `🕹️ C'est au tour de ${tourDe === "joueur1" ? "Joueur 2" : "Joueur 1"} de jouer.`;
  }
}



// Afficher le tour de la partie
function afficherNumeroTour() {
  const tourDiv = document.getElementById("tour-numero");
  tourDiv.innerText = `Temps de jeu : ${numeroTour} minutes`;
}



// Afficher le nombre de carte gagnées de chaque joueur
function afficherPile() {
  const pileJ1 = document.getElementById("pile-joueur1");
  const pileJ2 = document.getElementById("pile-joueur2");
  if (pileJ1 && pileJ2) {
    pileJ1.innerText = `Cartes gagnées Joueur 2 : ${joueur1Pile.length}`;
    pileJ2.innerText = `Cartes gagnées Joueur 1 : ${joueur2Pile.length}`;
  }
}




function jouerCarte(joueur, index) {
  if (!tourDe) {
    alert("La partie est terminée, plus aucun coup possible.");
    return;
  }
  if (tourDe !== joueur) {
    alert("Ce n'est pas ton tour !");
    return;
  }

  carteJoueurJouee = true;
  bonusUtilisableCeTour = false;

  const carte = (joueur === "joueur1" ? joueur1Main : joueur2Main).splice(index, 1)[0];

  if (tourDe === "joueur1") {
    carteJoueur1 = carte;
    afficherMain(joueur1Main, "player-hand", "joueur1");
    tourDe = "joueur2";
  } else {
    carteJoueur2 = carte;
    afficherMain(joueur2Main, "opponent-hand", "joueur2");
    tourDe = "joueur1";
  }

  majCartesJouees();
  afficherTour();

  // Si les deux cartes sont posées, comparer après un petit délai si le bot vient de jouer en second
  if (carteJoueur1 && carteJoueur2) {
    // Si l'ordinateur est le second joueur, retarde l'appel pour afficher la carte
    const botJoueEnSecond = (joueur === "joueur1"); // car l'humain est joueur2 dans ce cas
    const delay = botJoueEnSecond ? 1000 : 0;

    setTimeout(() => {
      comparerCartes(carteJoueur1, carteJoueur2, true);
    }, delay);
  }

  // Si c’est maintenant au bot de jouer, et qu’il n’a pas encore joué :
  if (tourDe === "joueur1" && !carteJoueur1) {
    setTimeout(jouerCarteBotAleatoire, 1000);
  }
}





function calculerScoreAvecBonus(carteA, carteB) {
  let score = carteA.note;

  const bonusConditions = {
    "ATTAQUANT": "GARDIEN",
    "GARDIEN": "MILIEU",
    "MILIEU": "DEFENSEUR",
    "DEFENSEUR": "ATTAQUANT"
  };

  if (bonusConditions[carteA.poste] === carteB.poste) {
    score += 2;
  }

  return score;
}




function renfortBotDisponible(nationalite, main, bloquees) {
  return main.some((c, i) => c.nationalite === nationalite && !bloquees.includes(i));
}

function choisirRenfortBotDisponible(nationalite, main, bloquees = []) {
  for (let i = 0; i < main.length; i++) {
    if (bloquees.includes(i)) continue;
    if (main[i].nationalite === nationalite) return i;
  }
  return null;
}

async function comparerCartes(c1, c2, utiliserBonus = true) {
  if (c1.legende && c2.legende) {
    alert(`⚔️ Les deux cartes sont des légendes (${c1.nom} vs ${c2.nom}) ! Bataille automatique !`);
    if (deck.length < 2) {
      alert("Pas assez de cartes pour la bataille. Tour annulé.");
      finDuTour();
      return;
    }
    carteBataille1 = deck.shift();
    carteBataille2 = deck.shift();
    majCartesJouees();
    setTimeout(() => {
      const s1 = carteBataille1.note;
      const s2 = carteBataille2.note;
      let msg = `🃏 Bataille légende : ${carteBataille1.nom} (${s1}) VS ${carteBataille2.nom} (${s2}) → `;
      if (s1 > s2) {
        msg += "✅ Joueur 2 gagne !";
        joueur1Pile.push(c1, c2, carteBataille1, carteBataille2);
      } else if (s2 > s1) {
        msg += "✅ Joueur 1 gagne !";
        joueur2Pile.push(c1, c2, carteBataille1, carteBataille2);
      } else {
        msg += "⚖️ Égalité !";
        joueur1Pile.push(c1, carteBataille1);
        joueur2Pile.push(c2, carteBataille2);
      }
      alert(msg);
      finDuTour();
    }, 3000);
    return;
  }

  let score1 = utiliserBonus ? calculerScoreAvecBonus(c1, c2) : c1.note;
  let score2 = utiliserBonus ? calculerScoreAvecBonus(c2, c1) : c2.note;

  if (c1.nationalite === c2.nationalite && Math.abs(score1 - score2) <= 4) {
    alert(`⚔️ ${c1.nom} et ${c2.nom} sont tous deux ${c1.nationalite}, et leur écart de score est faible (${score1} vs ${score2}) : bataille immédiate !`);
    if (deck.length < 2) {
      alert("Pas assez de cartes pour la bataille. Tour annulé.");
      finDuTour();
      return;
    }
    carteBataille1 = deck.shift();
    carteBataille2 = deck.shift();
    majCartesJouees();
    setTimeout(() => {
      const s1 = carteBataille1.note;
      const s2 = carteBataille2.note;
      let msg = `🃏 Bataille spéciale : ${carteBataille1.nom} (${s1}) VS ${carteBataille2.nom} (${s2}) → `;
      if (s1 > s2) {
        msg += "✅ Joueur 2 gagne !";
        joueur1Pile.push(c1, c2, carteBataille1, carteBataille2);
      } else if (s2 > s1) {
        msg += "✅ Joueur 1 gagne !";
        joueur2Pile.push(c1, c2, carteBataille1, carteBataille2);
      } else {
        msg += "⚖️ Égalité !";
        joueur1Pile.push(c1, carteBataille1);
        joueur2Pile.push(c2, carteBataille2);
      }
      alert(msg);
      finDuTour();
    }, 3000);
    return;
  }

  let renfort1 = null;
  let renfort2 = null;
  let premierAJoueRenfort = false;
  let message = `${c1.nom} (${score1}) VS ${c2.nom} (${score2})`;

  const bloqueesJ1 = cartesBloquees["joueur1"] || [];
  const bloqueesJ2 = cartesBloquees["joueur2"] || [];

  if (score1 === score2) {
    if (premierJoueur === "joueur1" && renfortBotDisponible(c1.nationalite, joueur1Main, bloqueesJ1)) {
      const choix = choisirRenfortBotDisponible(c1.nationalite, joueur1Main, bloqueesJ1);
      if (choix !== null) {
        renfort1 = joueur1Main.splice(choix, 1)[0];
        score1 += renfort1.note;
        carteJoueur1 = renfort1;
        afficherMain(joueur1Main, "player-hand", "joueur1");
        majCartesJouees();
        premierAJoueRenfort = true;
      }
    } else if (premierJoueur === "joueur2" && renfortBotDisponible(c2.nationalite, joueur2Main, bloqueesJ2)) {
      const choix = await choisirRenfort(c2.nationalite, joueur2Main, "opponent-hand", "Joueur 2", bloqueesJ2);
      if (choix !== null) {
        renfort2 = joueur2Main.splice(choix, 1)[0];
        score2 += renfort2.note;
        carteJoueur2 = renfort2;
        afficherMain(joueur2Main, "opponent-hand", "joueur2");
        majCartesJouees();
        premierAJoueRenfort = true;
      }
    }

    // ✅ Correction ici : autorise la réponse si score2 <= score1, pas seulement score2 < score1
    if (premierAJoueRenfort) {
      if (premierJoueur === "joueur1" && score2 <= score1 && renfortBotDisponible(c2.nationalite, joueur2Main, bloqueesJ2)) {
        const choix = await choisirRenfort(c2.nationalite, joueur2Main, "opponent-hand", "Joueur 2", bloqueesJ2);
        if (choix !== null) {
          renfort2 = joueur2Main.splice(choix, 1)[0];
          score2 += renfort2.note;
          carteJoueur2 = renfort2;
          afficherMain(joueur2Main, "opponent-hand", "joueur2");
          majCartesJouees();
        }
      } else if (premierJoueur === "joueur2" && score1 <= score2 && renfortBotDisponible(c1.nationalite, joueur1Main, bloqueesJ1)) {
        const choix = choisirRenfortBotDisponible(c1.nationalite, joueur1Main, bloqueesJ1);
        if (choix !== null) {
          renfort1 = joueur1Main.splice(choix, 1)[0];
          score1 += renfort1.note;
          carteJoueur1 = renfort1;
          afficherMain(joueur1Main, "player-hand", "joueur1");
          majCartesJouees();
        }
      }
    }

    message = `${c1.nom} (${score1}${renfort1 ? " + " + renfort1.note : ""}) VS ${c2.nom} (${score2}${renfort2 ? " + " + renfort2.note : ""})`;
  }


  if (score1 < score2) {
    if (premierJoueur === "joueur1" && renfortBotDisponible(c1.nationalite, joueur1Main, bloqueesJ1)) {
      const choix = choisirRenfortBotDisponible(c1.nationalite, joueur1Main, bloqueesJ1);
      if (choix !== null) {
        renfort1 = joueur1Main.splice(choix, 1)[0];
        score1 += renfort1.note;
        carteJoueur1 = renfort1;
        afficherMain(joueur1Main, "player-hand", "joueur1");
        majCartesJouees();
        premierAJoueRenfort = true;
      }
    }

    // ✅ Permet la réponse même si égalité ou dépassement
    if (premierAJoueRenfort) {
      if (premierJoueur === "joueur1" && score2 <= score1 && renfortBotDisponible(c2.nationalite, joueur2Main, bloqueesJ2)) {
        const choix = await choisirRenfort(c2.nationalite, joueur2Main, "opponent-hand", "Joueur 2", bloqueesJ2);
        if (choix !== null) {
          renfort2 = joueur2Main.splice(choix, 1)[0];
          score2 += renfort2.note;
          carteJoueur2 = renfort2;
          afficherMain(joueur2Main, "opponent-hand", "joueur2");
          majCartesJouees();
        }
      }
    }

    message = `${c1.nom} (${score1}${renfort1 ? " + " + renfort1.note : ""}) VS ${c2.nom} (${score2}${renfort2 ? " + " + renfort2.note : ""})`;
  }

  if (score1 > score2) {
    if (premierJoueur === "joueur2" && renfortBotDisponible(c2.nationalite, joueur2Main, bloqueesJ2)) {
      const choix = await choisirRenfort(c2.nationalite, joueur2Main, "opponent-hand", "Joueur 2", bloqueesJ2);
      if (choix !== null) {
        renfort2 = joueur2Main.splice(choix, 1)[0];
        score2 += renfort2.note;
        carteJoueur2 = renfort2;
        afficherMain(joueur2Main, "opponent-hand", "joueur2");
        majCartesJouees();
        premierAJoueRenfort = true;
      }
    }

    // ✅ Permet la réponse même si égalité ou dépassement
    if (premierAJoueRenfort) {
      if (premierJoueur === "joueur2" && score1 <= score2 && renfortBotDisponible(c1.nationalite, joueur1Main, bloqueesJ1)) {
        const choix = choisirRenfortBotDisponible(c1.nationalite, joueur1Main, bloqueesJ1);
        if (choix !== null) {
          renfort1 = joueur1Main.splice(choix, 1)[0];
          score1 += renfort1.note;
          carteJoueur1 = renfort1;
          afficherMain(joueur1Main, "player-hand", "joueur1");
          majCartesJouees();
        }
      }
    }

    message = `${c1.nom} (${score1}${renfort1 ? " + " + renfort1.note : ""}) VS ${c2.nom} (${score2}${renfort2 ? " + " + renfort2.note : ""})`;
  }


  if (score1 > score2) {
    alert(`${message} → ✅ Joueur 2 gagne ce tour !`);
    joueur1Pile.push(c1, c2);
    if (renfort1) joueur1Pile.push(renfort1);
    if (renfort2) joueur1Pile.push(renfort2);
    finDuTour();
  } else if (score2 > score1) {
    alert(`${message} → ✅ Joueur 1 gagne ce tour !`);
    joueur2Pile.push(c1, c2);
    if (renfort1) joueur2Pile.push(renfort1);
    if (renfort2) joueur2Pile.push(renfort2);
    finDuTour();
  } else {
    alert(`${message} → ⚖️ Égalité ! 🔁 Bataille`);
    if (deck.length < 2) {
      alert("Pas assez de cartes pour la bataille. Tour annulé.");
      finDuTour();
      return;
    }

    carteBataille1 = deck.shift();
    carteBataille2 = deck.shift();
    majCartesJouees();
    setTimeout(() => {
      const s1 = carteBataille1.note;
      const s2 = carteBataille2.note;
      let msg = `🃏 Bataille : ${carteBataille1.nom} (${s1}) VS ${carteBataille2.nom} (${s2}) → `;
      if (s1 > s2) {
        msg += "✅ Joueur 1 gagne la bataille !";
        joueur1Pile.push(c1, c2, carteBataille1, carteBataille2);
        if (renfort1) joueur1Pile.push(renfort1);
        if (renfort2) joueur1Pile.push(renfort2);
      } else if (s2 > s1) {
        msg += "✅ Joueur 2 gagne la bataille !";
        joueur2Pile.push(c1, c2, carteBataille1, carteBataille2);
        if (renfort1) joueur2Pile.push(renfort1);
        if (renfort2) joueur2Pile.push(renfort2);
      } else {
        msg += "⚖️ Nouvelle égalité. Manche nulle.";
        joueur1Pile.push(c1, carteBataille1);
        joueur2Pile.push(c2, carteBataille2);
        if (renfort1) joueur1Pile.push(renfort1);
        if (renfort2) joueur2Pile.push(renfort2);
      }
      alert(msg);
      finDuTour();
    }, 3000);
  }
}


function finDuTour() {
  carteJoueur1 = null;
  carteJoueur2 = null;
  carteBataille1 = null;
  carteBataille2 = null;

    // Réinitialiser les cartes bloquées
  cartesBloquees = {
    joueur1: [],
    joueur2: []
  };

  piocherCartes();
  majCartesJouees();
  afficherPile();

  numeroTour += 5;
  afficherNumeroTour();

  if (numeroTour > MAX_TOUR) {
    alert("🎉 La partie est terminée !");
    tourDe = null;
    afficherTour();
    afficherResultatFinal();
    return;
  }

  premierJoueur = premierJoueur === "joueur1" ? "joueur2" : "joueur1";
  joueur1EstPremier = (premierJoueur === "joueur1");
  tourDe = premierJoueur;
  bonusUtilisableCeTour = true; // Le joueur actif peut utiliser sa carte bonus au début du tour
  carteJoueurJouee = false;
  afficherTour();

  if (tourDe === "joueur1") {
    setTimeout(jouerCarteBotAleatoire, 1000);
  }
}




function afficherResultatFinal() {
  const resultDiv = document.getElementById("resultat-final");
  resultDiv.style.display = "block";

  const top11J1 = [...joueur1Pile].sort((a, b) => b.note - a.note).slice(0, 11);
  const top11J2 = [...joueur2Pile].sort((a, b) => b.note - a.note).slice(0, 11);

  const totalJ1 = top11J1.reduce((acc, carte) => acc + carte.note, 0);
  const totalJ2 = top11J2.reduce((acc, carte) => acc + carte.note, 0);

  const gagnant =
    totalJ1 > totalJ2
      ? "🏆 Joueur 2 gagne la partie !"
      : totalJ2 > totalJ1
      ? "🏆 Joueur 1 gagne la partie !"
      : "🤝 Égalité parfaite !";

  resultDiv.innerHTML = `
    <h2>Résultat final</h2>
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
      <div style="flex: 1;">
        <h3>Top 11 Joueur 1 (Total : ${totalJ1})</h3>
        ${top11J1.map(c => `<div class="card"><strong>${c.nom}</strong> - ${c.note}</div>`).join("")}
      </div>
      <div style="flex: 1;">
        <h3>Top 11 Joueur 2 (Total : ${totalJ2})</h3>
        ${top11J2.map(c => `<div class="card"><strong>${c.nom}</strong> - ${c.note}</div>`).join("")}
      </div>
    </div>
    <h3 style="margin-top: 20px;">${gagnant}</h3>
    <button onclick="location.reload()">🔁 Rejouer</button>
  `;
}




function majCartesJouees() {
  const board = document.getElementById("played-cards");
  board.innerHTML = "";

  const emplacements = [
    { carte: carteBataille2, isBattle: true },
    { carte: carteJoueur2, isBattle: false },
    { carte: carteJoueur1, isBattle: false },
    { carte: carteBataille1, isBattle: true },
  ];

  emplacements.forEach(({ carte, isBattle }) => {
    const div = document.createElement("div");
    div.className = "card-slot";

    if (carte) {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card selected" + (isBattle ? " battle-card" : "");
      cardDiv.innerHTML = `
        <strong>${carte.nom}</strong>
        <span>${carte.poste}</span>
        <span>${carte.note}</span>
        <span>${carte.nationalite}${carte.legende ? " ⭐" : ""}</span>
      `;
      div.appendChild(cardDiv);
    }

    board.appendChild(div);
  });
}


function piocherCartes() {
  while (joueur1Main.length < 5 && deck.length > 0) {
    joueur1Main.push(deck.shift());
  }
  while (joueur2Main.length < 5 && deck.length > 0) {
    joueur2Main.push(deck.shift());
  }
  afficherMain(joueur1Main, "player-hand", "joueur1");
  afficherMain(joueur2Main, "opponent-hand", "joueur2");
}


function choisirRenfort(nationalite, mainJoueur, elementId, joueurLabel) {
  return new Promise((resolve) => {
    const container = document.getElementById(elementId);
    container.innerHTML = "";

    const message = document.createElement("div");
    message.innerText = `Ajouter coéquipier ou passer :`;
    container.appendChild(message);

    mainJoueur.forEach((carte, index) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <strong>${carte.nom}</strong>
        <span>${carte.poste}</span>
        <span>${carte.note}</span>
        <span>${carte.nationalite}${carte.legende ? " ⭐" : ""}</span>
      `;
      if (carte.nationalite === nationalite) {
        div.onclick = () => resolve(index);
      } else {
        div.classList.add("disabled");
      }
      container.appendChild(div);
    });

    const passerBtn = document.createElement("button");
    passerBtn.innerText = "Passer";
    passerBtn.onclick = () => resolve(null);
    container.appendChild(passerBtn);
  });
}

