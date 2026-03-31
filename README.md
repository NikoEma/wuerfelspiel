# 🎲 Würfelspiel — Strategisches Würfel-Duell

Ein rundenbasiertes Würfel-Kampfspiel als Web-App (HTML/CSS/JavaScript) mit mittelalterlichem Fantasy-Theme (DnD-inspiriert).

---

## Spielkonzept

Zwei Spieler (oder ein Spieler gegen KI) treten in einem strategischen Würfelduell gegeneinander an. Jeder wählt einen von vier Charakteren mit einzigartigen Fähigkeiten. Durch geschicktes Würfeln, taktische Aktionswahl und das Freischalten von Fähigkeiten versucht man, den Gegner zu besiegen.

**Spielmodi:**
- **Spieler vs. Spieler** (lokaler Multiplayer)
- **Spieler vs. KI** (3 Schwierigkeitsgrade: Leicht, Mittel, Schwer)
- **🏋️ Training** (freies Üben gegen KI — ohne Statistik-/Erfolgs-Tracking)
- **Tutorial** (interaktive Einführung mit geführten Runden)

---

## Siegbedingungen

Es gibt zwei alternative Wege zum Sieg:

| Siegweg | Bedingung | Beschreibung |
|---|---|---|
| 💀 **Elimination** | Gegner auf 0 HP | Klassischer Kampfsieg durch Angriffe |
| 🌟 **Transzendenz** | 60 SP erreichen | Alternativer Sieg durch Punktesammlung |

**Priorität bei gleichzeitigem Sieg:** Der aktive Spieler hat Vorrang. Prüfreihenfolge:
1. Gegner auf 0 HP → aktiver Spieler gewinnt (Elimination)
2. Aktiver Spieler ≥60 SP → aktiver Spieler gewinnt (Transzendenz)
3. Gegner ≥60 SP → Gegner gewinnt (z.B. durch passiven SP-Gain)
4. Aktiver Spieler auf 0 HP → Gegner gewinnt (z.B. durch Vergeltung)

---

## Grundmechanik

- Jeder Spieler startet mit **100 HP**, **0 FP** (Fähigkeitspunkte), **0 SP** (Siegpunkte).
- Pro Zug hat der Spieler **3 Würfe** mit **6 Würfeln** (Bonuswürfel durch Fähigkeiten/SP möglich).
- Nach jedem Wurf können Würfel **markiert (gehalten)** werden — markierte Würfel werden bei weiteren Würfen nicht erneut geworfen.
- Nach dem Würfeln wählt der Spieler eine von vier **Aktionen** und bestätigt sie.

### Aktionen

| Aktion | Beschreibung | Regeln |
|---|---|---|
| ⚔ **Angriff** | Schaden am Gegner | Nur gleiche Würfelwerte markieren. Schaden = Summe der markierten Würfel |
| 💚 **Heilen** | HP wiederherstellen | Nur 1er markieren. Jede 1 = 5 HP Heilung (max. 100 HP) |
| ⭐ **Fähigkeitspunkte** | FP und SP sammeln | Würfelkombinationen ergeben FP + SP (siehe Tabelle unten) |
| 🛡️ **Blocken** | Schaden abwehren | Nur mit Rebell-Fähigkeit verfügbar. Summe ≥ erlittener Schaden = volle Heilung |

### Fähigkeitspunkte-Kombinationen

Beim Sammeln (⭐-Aktion) geben bestimmte Würfelkombinationen sowohl FP als auch SP:

| Kombination | FP | SP | Beschreibung |
|---|---|---|---|
| 3er-Pasch | 2 | 2 | 3 gleiche Würfel |
| Zweierpasch | 2 | 3 | Zwei verschiedene Paare |
| 4er-Pasch | 3 | 4 | 4 gleiche Würfel |
| Kleine Straße | 3 | 5 | 5 aufeinanderfolgende Werte |
| Große Straße | 4 | 8 | 1-2-3-4-5-6 |
| 6× gleich | 6 | 15 | Alle 6 Würfel gleich |

**FP** schalten Fähigkeiten frei. **SP** zählen für den Transzendenz-Sieg.

---

## Fähigkeitensystem

- Jede Fähigkeit kostet **10 FP** zum Freischalten.
- Vier Fähigkeiten pro Charakter, sequentiell freigeschaltet (1 → 2 → 3 → 4).
- Überschüssige FP fließen automatisch in die nächste Fähigkeit über.
- Freigeschaltete Fähigkeiten sind **dauerhaft aktiv**.

### SP-Schwelle

Bei **50 SP** erhält der Spieler **+1 permanenten Bonuswürfel** (7 statt 6 Würfel).

---

## Charaktere & Fähigkeiten

### 🗡️ Soldat*in — Offensiv-Spezialist
Fokus: Maximaler Schaden durch Bonuswürfel und flexible Angriffsoptionen.

| # | Fähigkeit | Effekt |
|---|---|---|
| 1 | ⚡ Extrawürfel | 7 Würfel statt 6 |
| 2 | 🎯 Kriegsmeister*in | +2 Schaden. Bei ≥12 Schaden: +2 SP |
| 3 | 🔄 Vergeltung | Reflektiert 1 Würfelwert als Gegenschaden bei eintreffendem Angriff |
| 4 | 🎪 Doppelwertung | 2 verschiedene Würfelwert-Gruppen für Angriff markierbar |

**SP-Synergie:** Kriegsmeister*in generiert +2 SP bei Angriffen ≥12 Schaden.

### ⚔ Rebell*in — Taktiker/Hybrid
Fokus: Verteidigung, passive Schadenszufügung und Würfelmanipulation.

| # | Fähigkeit | Effekt |
|---|---|---|
| 1 | 🎲 Würfel-Diebstahl | +1 Bonuswürfel nächste Runde, wenn Gegner ungenutzte Würfel hatte |
| 2 | 🛡️ Schadensblockade | Neue Aktion „Blocken": Wenn Summe ≥ erlittenem Schaden → volle Heilung |
| 3 | 👑 Kriegsstrateg*in | Am Zugende: Gegner nimmt 2 auto-Schaden + 1 SP für den Rebell |
| 4 | 🚀 Fünfer-Upgrade | 5er-Würfel zählen als 6 bei Angriff |

**SP-Synergie:** Kriegsstrateg*in generiert +1 SP pro eigener Runde (passiv).

### 🗝️ Taschendieb*in — Ressourcen-Spezialist
Fokus: Mehr Punkte pro Sammlung, Heilflexibilität und das Kopieren gegnerischer Fähigkeiten.

| # | Fähigkeit | Effekt |
|---|---|---|
| 1 | 💰 Punkt-Bonus | +1 FP und +1 SP pro Sammelaktion |
| 2 | ✨ Zweier-Magisch | 2er-Würfel können auch zum Heilen verwendet werden |
| 3 | 🎭 Fähigkeits-Kopie | Kopiert beim Freischalten eine freigeschaltete Gegner-Fähigkeit |
| 4 | 💣 Würfel-Zerstörer*in | Zerstört zu Zugbeginn 1 zufälligen Gegner-Würfel |

**SP-Synergie:** Punkt-Bonus steigert jede Sammlung um +1 SP.

### 🧪 Quacksalber*in — Würfel-Manipulator/Heiler
Fokus: Würfelkontrolle, Kombination von Angriff und Heilung, und Gegnerbehinderung.

| # | Fähigkeit | Effekt |
|---|---|---|
| 1 | 🔁 Neuwurf-Bonus | 1 einzelnen Würfel separat neu werfen (1×/Zug) |
| 2 | 💊 Heilungs-Manager*in | Bei Angriff: markierte 1er heilen gleichzeitig + 1 SP pro Heilaktion |
| 3 | 🔮 Gegner*in-Zwang | 1 zufälliger Gegner-Wurf wird erzwungen wiederholt |
| 4 | ♻️ Selber-Neustart | Alle Würfel komplett neu werfen (1×/Zug) |

**SP-Synergie:** Heilungs-Manager*in generiert +1 SP bei jeder Heilung (auch beim Angriff mit 1ern).

---

## Rundenablauf (Detail)

`
1. Spieler ist am Zug
   ├── Pre-Dice-Effekte (Würfel-Zerstörer, Gegner-Zwang werden vorbereitet)
   ├── Würfel initialisieren (6 + Bonuswürfel)
   ├── Post-Dice-Effekte (Würfel-Zerstörer zerstört 1 Würfel, Gegner-Zwang setzt Wurf fest)
   │
   ├── Wurf 1 (automatisch oder manuell)
   ├── Würfel markieren / halten
   ├── Wurf 2 (optional)
   ├── Würfel markieren / halten
   ├── Wurf 3 (optional)
   │
   ├── Aktion wählen (Angriff / Heilen / Sammeln / Blocken)
   ├── Würfel für Aktion markieren
   ├── Aktion bestätigen → Effekt wird ausgeführt
   │
   ├── Kriegsstrateg*in-Effekt (2 auto-Schaden + 1 SP, falls aktiv)
   ├── Würfel-Diebstahl prüfen (Bonuswürfel für Gegner)
   └── Spieler wechseln
`

---

## Balance-Analyse

### Siegwege im Vergleich

| Aspekt | Elimination (HP-Kill) | Transzendenz (60 SP) |
|---|---|---|
| Geschwindigkeit | ~12-15 eigene Züge | ~25-30 eigene Züge |
| Risiko | Gegner heilt/blockt | Gegner greift an, man muss überleben |
| Hauptaktion | Angriff | Sammeln |
| Nebenaktion | — | Heilen/Blocken zum Überleben |

### SP-Quellen pro Zug

| Quelle | SP | Bedingung |
|---|---|---|
| 3er-Pasch (häufigste Combo) | 2 | Sammelaktion |
| Zweierpasch | 3 | Sammelaktion |
| 4er-Pasch | 4 | Sammelaktion |
| Kleine Straße | 5 | Sammelaktion |
| Große Straße | 8 | Sammelaktion (selten) |
| 6× gleich | 15 | Sammelaktion (extrem selten) |
| Kriegsmeister*in (Soldat) | +2 | Pro Angriff ≥12 Schaden |
| Kriegsstrateg*in (Rebell) | +1 | Passiv jede eigene Runde |
| Punkt-Bonus (Taschendieb) | +1 | Pro Sammelaktion |
| Heilungs-Manager*in (Quacksalber) | +1 | Pro Heilaktion |

### Charakter-Philosophie

- **Soldat*in**: Hoher Burst-Schaden, gewinnt schnell über Elimination. SP nur als Nebenprodukt bei starken Angriffen.
- **Rebell*in**: Hybrid — passiver Schaden + SP-Generierung + Verteidigung. Kann beide Siegwege verfolgen.
- **Taschendieb*in**: Ressourceneffizienz — bekommt mehr pro Sammelaktion, aber braucht Fähigkeits-Kopie für defensive/offensive Flexibilität.
- **Quacksalber*in**: Würfelkontrolle — kann gleichzeitig angreifen und heilen, dadurch SP generieren, ohne auf Sammeln angewiesen zu sein.

---

## Meta-Fortschritt

Alle Meta-Daten werden im Browser (localStorage) gespeichert und überleben Seitenneuladen. Training-Partien zählen **nicht** für Statistiken oder Erfolge.

### 👤 Spieler-Profile

- Bis zu **5 unabhängige Profile** auf demselben Gerät
- Jedes Profil hat eigene Statistiken, Erfolge und Skin-Auswahl
- Profile können erstellt, umbenannt und gelöscht werden (letztes Profil geschützt)
- Aktives Profil wird im Hauptmenü angezeigt
- **Auto-Migration**: Bestehende Daten aus dem alten Format werden beim ersten Laden als „Profil 1" importiert

### 📊 Chronik (Statistiken)

Pergament-Ansicht mit Spielstatistiken des aktiven Profils:
- Gespielte Partien, Siege, Niederlagen, Siegquote
- Siege pro Charakter (mit Balkendiagramm)
- Rekorde: Höchster Einzelschaden, Schnellster Sieg
- Siegarten: Elimination vs. Transzendenz
- KI-Kämpfe: Partien, Siege, Siege gegen Schwere KI
- Zurücksetzbar pro Profil

### 🏆 Erfolge (Achievements)

10 freischaltbare Erfolge mit gegenderten Titeln (Geschlecht wird beim Freischalten gespeichert):

| Erfolg | Bedingung |
|---|---|
| 🔥 Berserker(*in) | 30+ Schaden in einer Runde |
| 💡 Erleuchtung | Sieg durch Transzendenz |
| 🎓 Meister(*in) | Sieg gegen Schwere KI |
| 🖼️ Goldrahmen | 10 Siege erreichen |
| 💥 Zerstörer(*in) | Gegner mit einem Angriff von ≥50 HP besiegen |
| ⚡ Blitzkrieg | Sieg in ≤10 Zügen |
| 🛡️ Überlebend(e/*e) | Mit ≤10 HP gewinnen |
| 🧲 Sammler(*in) | 40+ FP in einer Partie sammeln |
| ⭐ Veteran(*in) | 25 Spiele absolvieren |
| 👑 Legende | Alle anderen Erfolge freischalten |

### 🎲 Würfel-Skins

4 Würfel-Designs, davon 3 durch Erfolge freischaltbar:

| Skin | Darstellung | Freischaltung |
|---|---|---|
| Standard | 1 2 3 4 5 6 | Immer verfügbar |
| Gotisch | MedievalSharp-Font | 👑 Legende |
| Römisch | Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ Ⅵ | 💡 Erleuchtung |
| Symbole | ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ | ⭐ Veteran(*in) |

---

## Geschlechterinklusivität

Das Spiel unterstützt drei Geschlechteroptionen (Männlich, Weiblich, Divers). Alle Fähigkeitsnamen und Texte werden entsprechend gegendert angezeigt (z.B. Kriegsmeister / Kriegsmeisterin / Kriegsmeister*in).

---

## KI-System

Die KI hat drei Schwierigkeitsgrade:
- **Leicht**: Zufällige/einfache Entscheidungen
- **Mittel**: Berücksichtigt HP-Stand und Würfelergebnisse
- **Schwer**: Optimiert Aktionswahl, nutzt Fähigkeiten strategisch

Die KI wählt automatisch Würfel, Aktionen und Markierungen basierend auf dem aktuellen Spielzustand.

---

## Technische Umsetzung

| Aspekt | Detail |
|---|---|
| **Architektur** | Single-Page HTML-App (~2400 Zeilen) |
| **Sprachen** | HTML, CSS, JavaScript (ES5-kompatibel, kein Framework) |
| **JS-Stil** | Prototyp-basiert (var, function, .prototype) |
| **CSS-Theme** | Mittelalter/DnD: Cinzel + Crimson Text Fonts, dunkle Erdtöne, Goldakzente |
| **UI-Feedback** | Pergament-Scroll-Overlay für alle Spielmeldungen |
| **Server** | Node.js + Express (optional, für lokales Hosting) |
| **Port** | 3000 (lokal) |
| **Offline** | Komplett offline spielbar per Doppelklick auf index.html |
| **Persistenz** | localStorage (Profile, Statistiken, Erfolge, Skins) |

---

## Installation & Start

### Variante 1: Direkt im Browser (ohne Server)
Doppelklick auf `public/index.html` — fertig.

### Variante 2: Mit Node.js-Server
`ash
npm install
npm start
`
Dann öffnen: http://localhost:3000

### Variante 3: Weitergabe an Freunde
1. Ordner `public/` als ZIP komprimieren
2. ZIP versenden (E-Mail, Cloud, USB)
3. Empfänger entpackt und öffnet `index.html` im Browser

---

## Projektstruktur

```
Wuerfelspiel_dice/
├── server.js              # Express-Server (optional)
├── package.json           # Node.js-Abhängigkeiten
├── simulate.js            # Simulationsskript
├── start_game.bat         # Windows Quick-Start
├── README.md              # Diese Dokumentation
└── public/
    ├── index.html         # Spielversion (Hauptdatei)
    ├── README.txt          # Kurzanleitung für Endnutzer
    └── images/            # Charakterbilder (soldat.png, rebell.png, etc.)
```

---

## Autor

Erstellt als Hobbyprojekt.