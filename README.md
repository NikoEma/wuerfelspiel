# 🎲 Würfelspiel — Strategisches Würfel-Duell

Ein rundenbasiertes Würfel-Kampfspiel als Web-App (HTML/CSS/JavaScript) mit mittelalterlichem Fantasy-Theme (DnD-inspiriert).

🌐 **Live spielbar:** https://wuerfelspiel.onrender.com

---

## Spielkonzept

Zwei Spieler (oder ein Spieler gegen KI) treten in einem strategischen Würfelduell gegeneinander an. Jeder wählt einen von vier Charakteren mit einzigartigen Fähigkeiten. Durch geschicktes Würfeln, taktische Aktionswahl und das Freischalten von Fähigkeiten versucht man, den Gegner zu besiegen.

**Spielmodi:**
- **Spieler vs. Spieler** (lokaler Multiplayer)
- **Spieler vs. KI** (3 Schwierigkeitsgrade: Leicht, Mittel, Schwer)
- **� Online Multiplayer** (Raum erstellen/beitreten über Raumcode, via Socket.IO)
- **�🏋️ Training** (freies Üben gegen KI — ohne Statistik-/Erfolgs-Tracking)
- **Tutorial** (interaktive Einführung mit geführten Runden)

---

## Siegbedingungen

Es gibt zwei alternative Wege zum Sieg:

| Siegweg | Bedingung | Beschreibung |
|---|---|---|
| 💀 **Elimination** | Gegner auf 0 HP | Klassischer Kampfsieg durch Angriffe |
| 🌟 **Transzendenz** | 40 SP erreichen | Alternativer Sieg durch Punktesammlung |

**Priorität bei gleichzeitigem Sieg:** Der aktive Spieler hat Vorrang. Prüfreihenfolge:
1. Gegner auf 0 HP → aktiver Spieler gewinnt (Elimination)
2. Aktiver Spieler ≥40 SP → aktiver Spieler gewinnt (Transzendenz)
3. Gegner ≥40 SP → Gegner gewinnt (z.B. durch passiven SP-Gain)
4. Aktiver Spieler auf 0 HP → Gegner gewinnt (z.B. durch Vergeltung)

---

## Grundmechanik

- Jeder Spieler startet mit **100 HP**, **5 FP** (Fähigkeitspunkte), **0 SP** (Siegpunkte).
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
| 3er-Pasch | 2 | 3 | 3 gleiche Würfel |
| Zweierpasch | 2 | 4 | Zwei verschiedene Paare |
| 4er-Pasch | 3 | 5 | 4 gleiche Würfel |
| Kleine Straße | 3 | 6 | 5 aufeinanderfolgende Werte |
| Große Straße | 4 | 10 | 1-2-3-4-5-6 |
| 6× gleich | 6 | 18 | Alle 6 Würfel gleich |

**FP** schalten Fähigkeiten frei. **SP** zählen für den Transzendenz-Sieg.

---

## Fähigkeitensystem

- Jede Fähigkeit kostet **10 FP** zum Freischalten.
- Vier Fähigkeiten pro Charakter, sequentiell freigeschaltet (1 → 2 → 3 → 4).
- Überschüssige FP fließen automatisch in die nächste Fähigkeit über.
- Freigeschaltete Fähigkeiten sind **dauerhaft aktiv**.

### SP-Schwelle

Bei **35 SP** erhält der Spieler **+1 permanenten Bonuswürfel** (7 statt 6 Würfel).

### Erschöpfungs-System

Aufeinanderfolgende Angriffe führen zu Erschöpfung:

| Aufeinanderfolgende Angriffe | Effekt |
|---|---|
| 1–3 | Kein Malus (3 Freischüsse) |
| 4 | -1 Würfel |
| 5 | -2 Würfel |
| n (n>3) | -(n-3) Würfel |

- Minimum: **1 Würfel** (egal wie erschöpft)
- Nicht-Angriff (Heilen/Blocken/Sammeln): Zähler sinkt um **1** pro Zug
- Bei Zähler ≤3 → wieder 3 Freischüsse
- Erschöpfung wird visuell im Kampfbildschirm angezeigt (⚡-Icons)

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
Fokus: Mehr Punkte pro Sammlung, Heilflexibilität und Ressourcen-Raub.

| # | Fähigkeit | Effekt |
|---|---|---|
| 1 | 💰 Punkt-Bonus | +1 FP und +1 SP pro Sammelaktion |
| 2 | ✨ Zweier-Magisch | 2er-Würfel können auch zum Heilen verwendet werden |
| 3 | 💰 Ressourcen-Raub | Bei ⭐-Sammlung: Gegner verliert 2 FP |
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

| Aspekt | Elimination (HP-Kill) | Transzendenz (40 SP) |
|---|---|---|
| Geschwindigkeit | ~12-15 eigene Züge | ~25-30 eigene Züge |
| Risiko | Gegner heilt/blockt | Gegner greift an, man muss überleben |
| Hauptaktion | Angriff | Sammeln |
| Nebenaktion | — | Heilen/Blocken zum Überleben |

### SP-Quellen pro Zug

| Quelle | SP | Bedingung |
|---|---|---|
| 3er-Pasch (häufigste Combo) | 3 | Sammelaktion |
| Zweierpasch | 4 | Sammelaktion |
| 4er-Pasch | 5 | Sammelaktion |
| Kleine Straße | 6 | Sammelaktion |
| Große Straße | 10 | Sammelaktion (selten) |
| 6× gleich | 18 | Sammelaktion (extrem selten) |
| Kriegsmeister*in (Soldat) | +2 | Pro Angriff ≥12 Schaden |
| Kriegsstrateg*in (Rebell) | +1 | Passiv jede eigene Runde |
| Punkt-Bonus (Taschendieb) | +1 | Pro Sammelaktion |
| Heilungs-Manager*in (Quacksalber) | +1 | Pro Heilaktion |

### Charakter-Philosophie

- **Soldat*in**: Hoher Burst-Schaden, gewinnt schnell über Elimination. SP nur als Nebenprodukt bei starken Angriffen.
- **Rebell*in**: Hybrid — passiver Schaden + SP-Generierung + Verteidigung. Kann beide Siegwege verfolgen.
- **Taschendieb*in**: Ressourceneffizienz — bekommt mehr pro Sammelaktion und schwächt Gegner durch Ressourcen-Raub.
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

### 🪙 Münzen & Würfel-Shop

Münzen werden durch Siege und Erfolge verdient:

| Quelle | Münzen |
|---|---|
| Sieg vs. KI (Leicht) | +10 🪙 |
| Sieg vs. KI (Mittel) | +13 🪙 |
| Sieg vs. KI (Schwer) | +15 🪙 |
| Erfolg freigeschaltet | +20 🪙 |

### 🎲 Würfel-Skins

4 Würfel-Designs, kaufbar im Shop mit Münzen:

| Skin | Darstellung | Preis |
|---|---|---|
| Standard | 1 2 3 4 5 6 | Gratis |
| Gotisch | MedievalSharp-Font | 30 🪙 |
| Strichliste | Strich-Zählung | 60 🪙 |
| Symbole | ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ | 100 🪙 |

---

## Geschlechterinklusivität

Das Spiel unterstützt drei Geschlechteroptionen (Männlich, Weiblich, Divers). Alle Fähigkeitsnamen und Texte werden entsprechend gegendert angezeigt (z.B. Kriegsmeister / Kriegsmeisterin / Kriegsmeister*in).

---

## KI-System

Die KI hat drei Schwierigkeitsgrade:
- **Leicht**: Zufällige/einfache Entscheidungen
- **Mittel**: Berücksichtigt HP-Stand und Würfelergebnisse
- **Schwer**: Strategisches 3-Phasen-System mit vollständiger Spielzustandsanalyse

### Schwere KI — Strategisches Würfeln

Die schwere KI nutzt einen mehrstufigen Entscheidungsprozess:

1. **Analyse nach jedem Wurf**: `analyzeDice()` und `calcSPForDice()` bewerten Angriffsstärke, Heilpotential und SP-Kombinationen
2. **Strategische Re-Rolls**: Über 3 Würfe hinweg wird die Strategie angepasst — Würfel die zur gewählten Strategie passen, werden behalten
3. **Finale Anpassung**: Nach dem letzten Wurf wählt die KI die bestmögliche Aktion basierend auf den tatsächlichen Ergebnissen

**Strategieentscheidung** berücksichtigt:
- Kill-Erkennung (Gegner mit einem Angriff besiegbar?)
- SP-Rennen-Bewusstsein (Gegner nah an 40 SP?)
- HP-abhängige Heilschwellen
- Fähigkeits-Freischaltungs-Nähe
- **Niemals-verschwendeter-Zug**: Fallback-Logik stellt sicher, dass immer eine Aktion ausgeführt wird

---

## Online Multiplayer

Das Spiel unterstützt Online-Multiplayer über Socket.IO:

1. **Raum erstellen**: Spieler 1 erstellt einen Raum und erhält einen 5-stelligen Raumcode
2. **Raum beitreten**: Spieler 2 gibt den Code ein und tritt bei
3. **Synchronisierung**: Alle Aktionen werden über den Server synchronisiert
4. **Server-seitige Würfel**: Würfelwerte werden serverseitig generiert (Manipulationsschutz)
5. **Aufgeben**: Beide Spieler können jederzeit aufgeben (🏳️ Aufgeben-Button)

---

## Audio-System

Das gesamte Audio wird per **Web Audio API** im Browser synthetisiert — keine externen Audiodateien nötig.

### 🔊 Sound-Effekte (SFX)

| Sound | Beschreibung |
|---|---|
| 🎲 Würfeln | 12 Noise-Bursts + Sinus-Aufprall |
| ⚔️ Angriff | Sägezahn-Sweep + Noise-Burst |
| 💚 Heilung | 4-Ton aufsteigende Akkordfolge (C-E-G-C) |
| ⭐ Sammeln | 4-Ton Dur-Tonleiter (A-D-E-A) |
| 🖱️ Klick | Rechteck-Welle Beep |
| 🏆 Sieg | 7-Ton triumphale Fanfare |
| 💀 Niederlage | 4-Ton absteigende Moll-Folge |

### 🎵 Hintergrundmusik

Prozedural generierte Musik mit Melodie, Bass, Harmonien und Rhythmus:

- **Lobby-Musik**: 4 melodische Phrasen (A→B→A→C→B→D), Glockenspiel-Effekt, Rhythmus-Puls, 480ms Tempo
- **Kampf-Musik**: Aggressiveres Muster mit Percussion-artigen Noise-Bursts und schnelleren Arpeggios
- **Stummschalten**: 🔇/🔊 Button im Kampfbildschirm

---

## Visuelle Effekte

| Effekt | Beschreibung | Auslöser |
|---|---|---|
| 🎲 Würfel-Animation | 3D-Tumble mit Zahlenflackern (0.7s) | Jeder Wurf |
| 💥 Bildschirm-Wackeln | ±6px random Offsets (0.5s) | Angriff |
| ⚡ Blitz-Flash | SVG-Blitz mit Stroke-Animation | Angriff |
| ✨ Funken/Ripples | 5 Ripple-Ringe mit Skalierung + Glow | Sammeln |
| 💚 Heil-Effekt | Grüner Flash + 35 Partikel (Herzen, Plus, Sparkles) + 40 Glitter | Heilung |
| 🌟 Fähigkeits-Unlock | Glow-Animation auf dem Pergament-Scroll | Fähigkeit freigeschaltet |
| 🟡 Gold-Markierung | Goldener Rahmen + Glow auf markierbaren Würfeln | Aktion gewählt |

---

## Barrierefreiheit

Über den 👓-Button (unten rechts) erreichbar:

| Modus | Beschreibung |
|---|---|
| **LRS-Modus** | OpenDyslexic-Schrift, erhöhter Zeilenabstand (1.8), Buchstabenabstand |
| **Farbenblind-Modus** | Höherer Kontrast (#c0b0d4), dickere Würfelrahmen (4px), stärkere Glow-Effekte |
| **Rot-Grün-Schwäche** | HP-Balken: Grün→Blau, Rot→Orange; alle UI-Elemente umgefärbt |
| **Größere Schrift** | Basis-Schriftgröße 1.45em, alle Elemente proportional skaliert |

Einstellungen werden in `localStorage` gespeichert und überdauern Seitenneuladen.

---

## Mobile Unterstützung

Das Spiel ist responsiv und auf allen Geräten spielbar:

- **Tablets** (≤1024px): 2-spaltige Layouts, angepasste Schriftgrößen
- **Smartphones** (≤600px): 1-spaltige Layouts, 48px Würfel, kompakte Buttons, ein-/ausblendbare Info-Box

---

## Technische Umsetzung

| Aspekt | Detail |
|---|---|
| **Architektur** | Single-Page HTML-App (~7800 Zeilen) |
| **Sprachen** | HTML, CSS, JavaScript (ES5-kompatibel, kein Framework) |
| **JS-Stil** | Prototyp-basiert (var, function, .prototype) |
| **Fonts** | Cinzel (Titel), VT323 (Body), Press Start 2P (Buttons), MedievalSharp (Gotisch-Skin), OpenDyslexic (LRS) |
| **CSS-Theme** | Mittelalter/DnD: dunkle Erdtöne, Goldakzente, Partikel-Effekte |
| **Audio** | Web Audio API — Synthesizer für SFX + prozedurale Hintergrundmusik |
| **UI-Feedback** | Pergament-Scroll-Overlay mit Warteschlange für Spielmeldungen |
| **Server** | Node.js + Express + Socket.IO (für Online-Multiplayer) |
| **Port** | 3000 (lokal) / env PORT (Deployment) |
| **Deployment** | Render (https://wuerfelspiel.onrender.com) |
| **Offline** | Komplett offline spielbar per Doppelklick auf index.html (ohne Online-Modus) |
| **Persistenz** | localStorage (Profile, Statistiken, Erfolge, Skins, Münzen, Barrierefreiheit) |

---

## Installation & Start

### Variante 1: Online spielen
Einfach öffnen: https://wuerfelspiel.onrender.com

### Variante 2: Direkt im Browser (ohne Server)
Doppelklick auf `public/index.html` — fertig. (Offline-Modus, kein Online-Multiplayer)

### Variante 3: Mit Node.js-Server (lokal)
```bash
npm install
npm start
```
Dann öffnen: http://localhost:3000 (inkl. Online-Multiplayer im LAN)

### Variante 4: Weitergabe an Freunde
1. Ordner `public/` als ZIP komprimieren
2. ZIP versenden (E-Mail, Cloud, USB)
3. Empfänger entpackt und öffnet `index.html` im Browser

---

## Projektstruktur

```
Wuerfelspiel_dice/
├── server.js              # Express + Socket.IO Server (Online-Multiplayer)
├── package.json           # Node.js-Abhängigkeiten (express, socket.io)
├── simulate.js            # Simulationsskript
├── start_game.bat         # Windows Quick-Start
├── README.md              # Diese Dokumentation
└── public/
    ├── index.html         # Komplettes Spiel (HTML + CSS + JS, ~7800 Zeilen)
    ├── README.txt          # Kurzanleitung für Endnutzer
    └── images/            # Charakterbilder (soldat.png, rebell.png, etc.)
```

---

## Links

- 🌐 **Live**: https://wuerfelspiel.onrender.com
- 📦 **GitHub**: https://github.com/NikoEma/wuerfelspiel

---

## Autor

Erstellt als Hobbyprojekt.