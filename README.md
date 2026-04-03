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
| 🌟 **Transzendenz** | 55 SP erreichen | Alternativer Sieg durch Punktesammlung |

**Priorität bei gleichzeitigem Sieg:** Der aktive Spieler hat Vorrang. Prüfreihenfolge:
1. Gegner auf 0 HP → aktiver Spieler gewinnt (Elimination)
2. Aktiver Spieler ≥55 SP → aktiver Spieler gewinnt (Transzendenz)
3. Gegner ≥55 SP → Gegner gewinnt (z.B. durch passiven SP-Gain)
4. Aktiver Spieler auf 0 HP → Gegner gewinnt (z.B. durch Vergeltung)

---

## Grundmechanik

- Jeder Spieler startet mit **100 HP**, **5 FP** (Fähigkeitspunkte), **0 SP** (Siegpunkte).
- **Zufällige Startspieler-Wahl:** Per Münzwurf wird bestimmt, wer beginnt. Der Zweitspieler erhält **+8 HP** (108 HP) als Kompensation für den Nachteil des späteren Zugs.
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

- Jede Fähigkeit kostet **7 FP** zum Freischalten.
- Vier Fähigkeiten pro Charakter, sequentiell freigeschaltet (1 → 2 → 3 → 4).
- Überschüssige FP fließen automatisch in die nächste Fähigkeit über.
- Freigeschaltete Fähigkeiten sind **dauerhaft aktiv**.

### Erschöpfungs-System

Aufeinanderfolgende Angriffe führen zu Erschöpfung:

| Aufeinanderfolgende Angriffe | Effekt |
|---|---|
| 1–2 | Kein Malus (2 Freischüsse) |
| 3 | -1 Würfel |
| 4 | -2 Würfel |
| n (n>2) | -(n-2) Würfel |

- Minimum: **1 Würfel** (egal wie erschöpft)
- Nicht-Angriff (Heilen/Blocken/Sammeln): Zähler sinkt um **1** pro Zug
- Bei Zähler ≤2 → wieder 2 Freischüsse
- Erschöpfung wird **immer** im Kampfbildschirm angezeigt (Freischüsse + ⚡-Icons bei Malus)

---

## Charaktere & Fähigkeiten

### 🗡️ Soldat*in — Offensiv-Spezialist
Fokus: Maximaler Schaden durch Schadensbonus und flexible Angriffsoptionen.

| # | Fähigkeit | Effekt |
|---|---|---|
| 1 | ⚔️ Kampfinstinkt | +3 Angriffsschaden |
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
| 3 | 👑 Kriegsstrateg*in | Am Zugende: Gegner nimmt 4 auto-Schaden |
| 4 | 🚀 Fünfer-Upgrade | 5er-Würfel zählen als 6 bei Angriff |

**Elimination-Synergie:** Kriegsstrateg*in macht 4 passiven Schaden pro Runde — über ein Spiel hinweg mehr als die Hälfte der gegnerischen HP.

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
| 1 | 🔁 Neuwurf-Bonus | 1 einzelnen Würfel separat neu werfen (1×/Zug) + 1 SP |
| 2 | 💊 Heilungs-Manager*in | Bei Angriff: markierte 1er heilen gleichzeitig + 3 SP pro Heilaktion |
| 3 | 🔮 Gegner*in-Zwang | 1 zufälliger Gegner-Wurf wird erzwungen wiederholt |
| 4 | ♻️ Selber-Neustart | Alle Würfel komplett neu werfen (1×/Zug) |

**SP-Synergie:** Heilungs-Manager*in generiert +3 SP bei jeder Heilung (auch beim Angriff mit 1ern).

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
   ├── Kriegsstrateg*in-Effekt (4 auto-Schaden, falls aktiv)
   ├── Würfel-Diebstahl prüfen (Bonuswürfel für Gegner)
   └── Spieler wechseln
`

---

## Balance-Analyse

### Siegwege im Vergleich

| Aspekt | Elimination (HP-Kill) | Transzendenz (55 SP) |
|---|---|---|
| Geschwindigkeit | ~12-15 eigene Züge | ~33-38 eigene Züge |
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
| ~~Kriegsstrateg*in (Rebell)~~ | ~~+1~~ | ~~Entfernt — Rebell fokussiert Elimination~~ |
| Punkt-Bonus (Taschendieb) | +1 | Pro Sammelaktion |
| Neuwurf-Bonus (Quacksalber) | +1 | Pro Neuwurf (1×/Zug) |
| Heilungs-Manager*in (Quacksalber) | +3 | Pro Heilaktion |

### Charakter-Philosophie

- **Soldat*in**: Hoher Burst-Schaden, gewinnt schnell über Elimination. SP nur als Nebenprodukt bei starken Angriffen. Kampfinstinkt (+3) und Kriegsmeister*in (+2) geben zusammen +5 Angriffsschaden.
- **Rebell*in**: Hybrid — passiver Schaden + Verteidigung. Kann beide Siegwege verfolgen, mit Fokus auf Elimination durch Kriegsstrateg*in.
- **Taschendieb*in**: Ressourceneffizienz — bekommt mehr pro Sammelaktion und schwächt Gegner durch Ressourcen-Raub.
- **Quacksalber*in**: Würfelkontrolle — kann gleichzeitig angreifen und heilen, dadurch SP generieren, ohne auf Sammeln angewiesen zu sein.

---

## 🤖 KI-System

Drei Schwierigkeitsgrade mit unterschiedlichem Verhalten:

| Stufe | Verhalten |
|---|---|
| **Leicht / Mittel** | Feste Strategie: 3-Wurf-System mit situativer Aktionswahl (Angriff, Heilung, SP-Sammeln). Berücksichtigt HP, SP, Erschöpfung und Fähigkeiten. |
| **Schwer** | Adaptive KI — lernt aus dem Spielverhalten des Spielers und wird mit der Zeit stärker. |

### Adaptive Schwere KI

Die schwere KI analysiert das Spielverhalten über Partien hinweg und passt ihre Strategie an:

- **Lernfortschritt**: Skaliert von 0% bis 100% über ~100 Partien (`adaptFactor = gamesPlayed / 100`)
- **Spieler-Profil**: Trackt Aktionsverteilung (Angriff/Heilung/SP/Block), durchschnittlichen Schaden, Heil-Schwellenwerte und Charakter-Picks
- **Matchup-Tracking**: Gewinn/Verlust-Quote pro Charakter-Kombination

**Adaptive Verbesserungen (mit steigendem Lernfortschritt):**

| adaptFactor | Verbesserung |
|---|---|
| > 0.2 | Block-Aktion nutzen (Schadensblockade) |
| > 0.3 | Spieler-Profil auswerten: aggressiver gegen Angreifer, defensiver gegen SP-Sammler |
| > 0.4 | Nachträgliche Block-Entscheidung bei hohem Einzelschaden |
| > 0.5 | 2-Zug-Kill-Planung: aggressiv bleiben wenn Gegner ≤40 HP |
| > 0.6 | Spieler heilt spät → KI bleibt aggressiv statt zu heilen |

**Zusätzliche Verbesserungen gegenüber Leicht/Mittel:**
- Dynamischer Heil-Schwellenwert: 40 HP (Start) → 60 HP (bei adaptFactor 1.0)
- SP-Bedrohungserkennung: reagiert früher auf gegnerische SP-Fortschritte
- Taschendieb-Synergie: nutzt 2er zum Heilen (falls Fähigkeit aktiv)
- Kriegsmeister-Bonusschaden wird bei Kill-Berechnung berücksichtigt
- Keine versteckten Stat-Boni — nur bessere Entscheidungen

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
| 🔥 Berserker(*in) | Gewinne ohne zu heilen |
| 🌟 Erleuchtung | Gewinne durch Transzendenz |
| 👑 Meister(*in) | Gewinne mit jedem Charakter |
| 🏆 Goldrahmen | Besiege die schwere KI |
| 💥 Zerstörer(*in) | Verursache ≥25 Schaden in einem Angriff |
| ⚡ Blitzkrieg | Gewinne in ≤20 Zügen |
| 💪 Überlebenskünstler(*in) | Gewinne mit ≤10 HP |
| 📚 Sammler(*in) | Schalte alle 4 Fähigkeiten in einem Spiel frei |
| 🎖️ Veteran(*in) | Spiele 20 Partien |
| 🏅 Legende | Gewinne 10 Partien |

### 🪙 Münzen & Shop-System

Münzen werden durch Siege, Erfolge, Aufträge, Meilensteine und das Glücksrad verdient:

| Quelle | Münzen |
|---|---|
| Sieg vs. KI (Leicht) | +10 🪙 |
| Sieg vs. KI (Mittel) | +13 🪙 |
| Sieg vs. KI (Schwer) | +15 🪙 |
| Erfolg freigeschaltet | +20 🪙 |
| Aufträge (Quests) | +20–70 🪙 |
| Meilensteine | +50–500 🪙 |
| Tägliches Glücksrad | +10–200 🪙 |

Der **Shop** (🛒) bietet 6 rein kosmetische Kategorien:

### 🎲 Würfel-Skins (13 Designs)

| Skin | Darstellung | Preis |
|---|---|---|
| Standard | 1 2 3 4 5 6 | Gratis |
| Gotisch | MedievalSharp-Font | 30 🪙 |
| Strichliste | Strich-Zählung | 60 🪙 |
| Symbole | CSS Pip-Dots | 100 🪙 |
| Urzeit | Steinzeitliche Zahlen | 50 🪙 |
| Kristall | Funkelnde Zahlen | 80 🪙 |
| Knochen | Zahlen aus Knochen | 100 🪙 |
| Feuer 🔥 | Flammen-Glow | 150 🪙 |
| Eis ❄️ | Frost-Effekt | 150 🪙 |
| Nekromant 💀 | Dunkle Aura | 200 🪙 |
| Himmelsschmiede ⚒️ | Gold/Weiß-Farbwechsel | 300 🪙 |
| Void 🕳️ | Wabernder Umriss | 500 🪙 |
| Regenbogen 🌈 | Animierter Farbwechsel | 1000 🪙 ⭐ |

### 🎯 Tisch-Designs (7 Designs)

| Design | Beschreibung | Preis |
|---|---|---|
| Standard | Klassisches Spielfeld | Gratis |
| Taverne 🍺 | Holz- und Kerzenlicht | 50 🪙 |
| Wald 🌲 | Moos und Blätter | 80 🪙 |
| Kerker ⛓️ | Stein und Fackelschein | 100 🪙 |
| Sternenhimmel ✨ | Kosmischer Hintergrund | 150 🪙 |
| Drachenhort 🐉 | Gold und Schuppen | 200 🪙 |
| Thronsaal 👑 | Königlicher Prunk | 500 🪙 ⭐ |

### 🖼️ Profilrahmen (7 Rahmen)

| Rahmen | Beschreibung | Preis |
|---|---|---|
| Standard | Einfacher Rahmen | Gratis |
| Silber 🥈 | Silberner Glanz | 30 🪙 |
| Gold 🥇 | Goldener Schimmer | 80 🪙 |
| Smaragd 💚 | Grüner Edelstein | 120 🪙 |
| Rubin ❤️ | Roter Edelstein | 150 🪙 |
| Flammen 🔥 | Animierter Feuerrahmen | 300 🪙 |
| Krone 👑 | Königlicher Rahmen | 500 🪙 ⭐ |

### 🏆 Sieges-Animationen (6 Animationen)

| Animation | Beschreibung | Preis |
|---|---|---|
| Standard | Keine Extra-Animation | Gratis |
| Konfetti 🎊 | Bunte Partikel fallen | 50 🪙 |
| Blitz ⚡ | SVG-Blitzschlag | 100 🪙 |
| Feuerwerk 🎆 | 3 Explosionen | 120 🪙 |
| Drachenfeuer 🐲 | Drache mit Feueratem | 250 🪙 |
| Götterdämmerung 🌟 | Radiale Lichtexplosion | 500 🪙 ⭐ |

### 🔊 Sound-Packs (5 Packs)

| Pack | Beschreibung | Preis |
|---|---|---|
| Standard | Original (Würfeln, Angriff, Heilung, Sammeln, Sieg, Klick) | Gratis |
| Taverne 🍺 | Dumpfe Holztöne (Würfeln, Angriff, Sammeln, Klick, Musik) | 80 🪙 |
| 8-Bit 👾 | Retro-Chiptune (Würfeln, Angriff, Heilung, Sammeln, Sieg, Klick, Musik) | 100 🪙 |
| Mystisch 🔮 | Ätherische Klänge (Würfeln, Angriff, Heilung, Sammeln, Sieg, Klick, Musik) | 120 🪙 |
| Kriegstrommeln 🥁 | Epische Trommeln (Würfeln, Angriff, Heilung, Sammeln, Sieg, Musik) | 150 🪙 |

⭐ = Legendärer Gegenstand (mit goldenem Leuchteffekt)

### 📋 Auftrags-System (Quests)

- 3 aktive Aufträge gleichzeitig
- Zufällig aus 12 verschiedenen Auftragstypen generiert
- Auftragstypen: Siege, Partien, Angriffe, Heilungen, SP-Sammlungen, Schaden, KI-Siege, Transzendenz-Siege
- Abgeschlossene Aufträge können eingelöst werden → Münzbelohnung + neuer Auftrag
- Fortschritt wird automatisch während des Spielens getrackt

### 🎖️ Meilensteine

6 einmalige Errungenschaften mit steigenden Belohnungen:

| Meilenstein | Bedingung | Belohnung |
|---|---|---|
| Erste Schritte | 10 Siege | 50 🪙 |
| Aufsteigend | 25 Siege | 100 🪙 |
| Veteran | 50 Siege | 200 🪙 + Urzeit-Skin |
| Legende | 100 Siege | 500 🪙 + Flammen-Rahmen |
| Halbzeit | 50 Partien | 100 🪙 |
| Marathonläufer | 100 Partien | 250 🪙 |

### 🎡 Tägliches Glücksrad

- Einmal pro Tag drehbar
- 8 Segmente mit gewichteter Zufallsverteilung
- Gewinne: 10 bis 200 Münzen
- Animiertes Drehen mit Ergebnis-Anzeige

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
- SP-Rennen-Bewusstsein (Gegner nah an 55 SP?)
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

Über den 👓-Button (unten rechts) oder im Hauptmenü unter „Barrierefreiheit" erreichbar. Alle Modi sind **opt-in** (standardmäßig deaktiviert).

| Modus | Beschreibung |
|---|---|
| **LRS-Modus** | OpenDyslexic-Schrift, erhöhter Zeilenabstand (1.8), Buchstabenabstand |
| **Farbenblind-Modus** | Höherer Kontrast (#c0b0d4), dickere Würfelrahmen (4px), stärkere Glow-Effekte, dickere Button-Borders, unterstrichene Spielernamen, HP-Balken mit weißem Rand |
| **Rot-Grün-Schwäche** | HP-Balken: Grün→Blau, Rot→Orange; alle inline-Farben über `rgColor()`/`rgEmoji()` umgemappt; Tutorial-Animationen, Rainbow-Skin angepasst |
| **Größere Schrift** | Basis-Schriftgröße 1.45em, alle Elemente proportional skaliert |
| **Animationen reduzieren** | Bildschirmwackeln, Blitz-Effekte, Heal-Partikel und Sparkles deaktiviert. Sound bleibt aktiv. Respektiert auch `prefers-reduced-motion` des Betriebssystems |
| **Getrennte Lautstärke** | Im Kampf erscheinen zwei separate Stumm-Buttons (🎵 Musik / 🔊 Effekte) statt einem globalen |

### Tastatursteuerung & ARIA
- Alle interaktiven Elemente (Buttons, Würfel, Einstellungs-Karten) sind per Tab-Taste erreichbar
- Dynamische Würfel haben `role="button"` und `aria-label` mit aktuellem Wert
- Barrierefreiheits-Optionen haben `tabindex="0"` und reagieren auf Enter/Leertaste

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
| **Persistenz** | localStorage (Profile, Statistiken, Erfolge, Shop-Items, Münzen, Aufträge, Meilensteine, Barrierefreiheit) |

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

## Balance-Simulation

Automatisierte Balance-Überprüfung durch KI-vs-KI-Spiele.

**288.000 Spiele** (4 Charaktere × 4 Gegner × 3 Strategien × 3 Gegenstrategien × 2 Startspieler × 2.000 Wiederholungen).

### Strategien
| Strategie | Verhalten |
|---|---|
| **Aggro** | Greift fast immer an. Heilt nur bei ≤30 HP. Ziel: schnelle Elimination. |
| **Control** | Sammelt SP für Transzendenz. Heilt bei ≤50 HP. Greift nur bei Kill-Chance an. |
| **Schwer** | Bildet die schwere KI nach — dynamische Hybrid-Entscheidung. |

### Starten
- **Doppelklick** auf `start_simulation.bat` (öffnet Ergebnis automatisch in Notepad)
- **Oder**: `node simulate.js` im Terminal

### Ausgabe
Ergebnis in `simulation_ergebnis.txt` — 9-Abschnitt-Report mit:
Charakter-Winrates, Matchup-Matrix, Strategie-Analyse, Startspieler-Vorteil, Siegbedingungen, Spiellänge, Erschöpfungs-Statistik, Fähigkeiten-Statistik, Charakter-Detailanalyse + Fazit mit [OK]/[!]-Indikatoren.

---

## Projektstruktur

```
Wuerfelspiel_dice/
├── server.js              # Express + Socket.IO Server (Online-Multiplayer)
├── package.json           # Node.js-Abhängigkeiten (express, socket.io)
├── simulate.js            # Balance-Simulationsskript (288k KI-Spiele)
├── start_game.bat         # Windows Quick-Start
├── start_simulation.bat   # Simulation per Doppelklick starten
├── simulation_ergebnis.txt # Simulationsergebnis (generiert)
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