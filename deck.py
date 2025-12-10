import json
import random

# Définir les données de base pour les cartes
prenoms = [
    "Lionel", "Cristiano", "Kylian", "Erling", "Luka", "Kevin", "Virgil", "Karim", "Robert", "Neymar",
    "Sadio", "Mo", "Harry", "Son", "Bruno", "Vinicius", "Pedri", "Gavi", "Declan", "Jude",
    "Thibaut", "Ederson", "Manuel", "Alisson", "Gianluigi"
]
noms = [
    "Messi", "Ronaldo", "Mbappé", "Haaland", "Modrić", "De Bruyne", "van Dijk", "Benzema", "Lewandowski", "Jr",
    "Mané", "Salah", "Kane", "Heung-min", "Fernandes", "Júnior", "González", "Martínez", "Rice", "Bellingham",
    "Courtois", "Moraes", "Neuer", "Becker", "Donnarumma"
]
nationalites = ["FR", "BR", "DE", "PT", "AR", "BE", "EN", "ES", "IT", "NL", "KR", "NO", "HR", "PL", "SN", "EG", "CI"]
postes = ["GARDIEN", "DEFENSEUR", "MILIEU", "ATTAQUANT"]

# Générer 50 cartes aléatoires
cartes = []
used_names = set()

while len(cartes) < 50:
    prenom = random.choice(prenoms)
    nom = random.choice(noms)
    nom_complet = f"{prenom} {nom}"

    if nom_complet in used_names:
        continue

    carte = {
        "nom": nom_complet,
        "note": random.randint(70, 96),
        "poste": random.choice(postes),
        "nationalite": random.choice(nationalites),
        "legende": random.random() < 0.1  # 10% des cartes sont des légendes
    }

    cartes.append(carte)
    used_names.add(nom_complet)

# Ajout manuel de Zidane et Neuer comme exemples existants
cartes.insert(0, {"nom": "Zinedine Zidane", "note": 94, "poste": "MILIEU", "nationalite": "FR", "legende": True})
cartes.insert(1, {"nom": "Manuel Neuer", "note": 90, "poste": "GARDIEN", "nationalite": "DE", "legende": False})

# Sauvegarde dans un fichier JSON
deck_path = "data/deck.json"
with open(deck_path, "w", encoding="utf-8") as f:
    json.dump(cartes, f, ensure_ascii=False, indent=2)

deck_path
