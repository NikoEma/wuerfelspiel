// ============================================================
// Würfelspiel Balance-Simulation
// Simuliert 50 Spiele pro Strategie-Matchup, um zu prüfen
// ob die 3 Aktionen (Angriff, Heilen, Fähigkeiten) balanced sind.
// ============================================================

const GAMES_PER_MATCHUP = 50;
const MAX_TURNS = 200; // Sicherheitslimit gegen Endlosschleifen

// ===== CHARAKTER-TYPEN =====
const CharacterType = { Soldat: 0, Rebell: 1, Taschendieb: 2, Quacksalber: 3 };
const CHAR_NAMES = ['Soldat', 'Rebell', 'Taschendieb', 'Quacksalber'];

// ===== SPIELER =====
class Player {
    constructor(name, character) {
        this.name = name;
        this.character = character;
        this.health = 100;
        this.abilityProgress = [0, 0, 0, 0];
        this.abilityUnlocked = [false, false, false, false];
        this.currentAbilityIndex = 0;
        this.bonusDice = 0;
        this.lastDamageReceived = 0;
    }

    hasAbility(idx) {
        return this.abilityUnlocked[idx] === true;
    }

    addAbilityPoints(points) {
        while (points > 0 && this.currentAbilityIndex < 4) {
            const needed = 10 - this.abilityProgress[this.currentAbilityIndex];
            if (points >= needed) {
                this.abilityProgress[this.currentAbilityIndex] = 10;
                this.abilityUnlocked[this.currentAbilityIndex] = true;
                points -= needed;
                this.currentAbilityIndex++;
            } else {
                this.abilityProgress[this.currentAbilityIndex] += points;
                points = 0;
            }
        }
    }

    reset() {
        this.health = 100;
        this.abilityProgress = [0, 0, 0, 0];
        this.abilityUnlocked = [false, false, false, false];
        this.currentAbilityIndex = 0;
        this.bonusDice = 0;
        this.lastDamageReceived = 0;
    }
}

// ===== HILFSFUNKTIONEN =====
function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
}

function rollNDice(n) {
    const dice = [];
    for (let i = 0; i < n; i++) dice.push(rollDie());
    return dice;
}

// Prüft ob Spieler eine Fähigkeit hat (nativ ODER kopiert via Taschendieb)
function playerHasEffect(player, copiedAbility, charType, abilityIdx) {
    if (player.character === charType && player.hasAbility(abilityIdx)) return true;
    if (copiedAbility && player.character === CharacterType.Taschendieb && player.hasAbility(2)) {
        return copiedAbility.character === charType && copiedAbility.index === abilityIdx;
    }
    return false;
}

// Würfelgruppen berechnen (wie getDiceGroups im Original)
function getDiceGroups(dice) {
    const groups = {};
    for (const val of dice) {
        if (val > 0) groups[val] = (groups[val] || 0) + 1;
    }
    return Object.entries(groups).map(([value, count]) => ({
        value: parseInt(value),
        count
    }));
}

// Prüfe auf kleine Straße (5 aufeinanderfolgend)
function isSmallStraight(unique) {
    if (unique.length < 5) return false;
    for (let i = 0; i <= unique.length - 5; i++) {
        if (unique[i + 4] - unique[i] === 4) return true;
    }
    return false;
}

// Fähigkeitspunkte berechnen (wie calculateAbilityPoints im Original)
function calculateAbilityPoints(dice) {
    if (dice.length === 0) return 0;
    const sorted = dice.slice().sort((a, b) => a - b);
    const groups = getDiceGroups(dice);
    let maxCount = 0;
    for (const g of groups) { if (g.count > maxCount) maxCount = g.count; }

    if (maxCount >= 6) return 10;

    const unique = [...new Set(sorted.filter(v => v > 0))].sort((a, b) => a - b);
    if (unique.length >= 6 && unique[0] === 1 && unique[5] === 6) return 5;
    if (isSmallStraight(unique)) return 3;
    if (maxCount >= 4) return 2;
    if (maxCount >= 3) return 1;
    return 0;
}

// Berechne wie viele Würfel für Ability-Kombination nötig waren
function getUsedDiceForAbility(dice) {
    if (dice.length === 0) return 0;
    const sorted = dice.slice().sort((a, b) => a - b);
    const groups = getDiceGroups(dice);
    let maxCount = 0;
    for (const g of groups) { if (g.count > maxCount) maxCount = g.count; }
    const unique = [...new Set(sorted.filter(v => v > 0))].sort((a, b) => a - b);
    if (unique.length >= 6 && unique[0] === 1 && unique[5] === 6) return 6;
    if (isSmallStraight(unique)) return 5;
    if (maxCount >= 3) return maxCount;
    return 0;
}

// ===== INTELLIGENTES WÜRFEL-KEEPING =====

// Für Angriff: behalte die größte Gruppe gleicher Würfel (höchsten Wert bevorzugen)
function keepForAttack(dice, player, copiedAbility) {
    const groups = getDiceGroups(dice);
    if (groups.length === 0) return [];

    // Fünfer-Upgrade: 5er zählen als 6
    const hasFuenfer = playerHasEffect(player, copiedAbility, CharacterType.Rebell, 3);
    // Doppelwertung oder Kriegsmeister: 2 verschiedene Werte erlaubt
    const hasDoppel = playerHasEffect(player, copiedAbility, CharacterType.Soldat, 3) ||
                      playerHasEffect(player, copiedAbility, CharacterType.Soldat, 1);

    if (hasDoppel) {
        // Top 2 Gruppen nach Schaden sortieren
        groups.sort((a, b) => (b.value * b.count) - (a.value * a.count));
        const keepValues = new Set();
        keepValues.add(groups[0].value);
        if (groups.length > 1) keepValues.add(groups[1].value);
        return dice.map((d, i) => keepValues.has(d));
    }

    if (hasFuenfer) {
        // 5er und 6er zusammenfassen
        const fiveCount = dice.filter(d => d === 5).length;
        const sixCount = dice.filter(d => d === 6).length;
        const combinedCount = fiveCount + sixCount;
        const combinedDamage = combinedCount * 6;

        // Beste Nicht-5/6 Gruppe
        const otherGroups = groups.filter(g => g.value !== 5 && g.value !== 6);
        let bestOther = { value: 0, count: 0 };
        for (const g of otherGroups) {
            if (g.value * g.count > bestOther.value * bestOther.count) bestOther = g;
        }

        if (combinedDamage > bestOther.value * bestOther.count) {
            return dice.map(d => d === 5 || d === 6);
        } else {
            return dice.map(d => d === bestOther.value);
        }
    }

    // Standard: behalte die profitabelste Gruppe (Summe = Wert × Anzahl)
    let best = groups[0];
    for (const g of groups) {
        if (g.value * g.count > best.value * best.count) best = g;
    }
    return dice.map(d => d === best.value);
}

// Für Heilen: behalte alle 1er (und 2er wenn Zweier-Magisch)
function keepForHeal(dice, player, copiedAbility) {
    const hasZweier = playerHasEffect(player, copiedAbility, CharacterType.Taschendieb, 1);
    return dice.map(d => d === 1 || (hasZweier && d === 2));
}

// Für Fähigkeitspunkte: behalte die größte Gruppe (auf Pasch optimieren)
function keepForAbility(dice) {
    const groups = getDiceGroups(dice);
    if (groups.length === 0) return dice.map(() => false);

    // Prüfe ob wir nahe an einer Straße sind
    const unique = [...new Set(dice.filter(v => v > 0))].sort((a, b) => a - b);

    // Wenn 4+ verschiedene Werte → auf Straße gehen
    if (unique.length >= 4) {
        // Behalte je einen von jedem einzigartigen Wert
        const kept = new Set();
        return dice.map(d => {
            if (!kept.has(d) && d > 0) { kept.add(d); return true; }
            return false;
        });
    }

    // Sonst: auf Pasch → größte Gruppe behalten
    let best = groups[0];
    for (const g of groups) {
        if (g.count > best.count || (g.count === best.count && g.value > best.value)) best = g;
    }
    return dice.map(d => d === best.value);
}

// ===== EINEN ZUG SIMULIEREN =====
function simulateTurn(current, opponent, strategy, copiedAbility) {
    // Würfelanzahl bestimmen
    let diceCount = 6;
    if (playerHasEffect(current, copiedAbility, CharacterType.Soldat, 0)) diceCount++;
    diceCount += current.bonusDice;
    current.bonusDice = 0;

    // Gegner-Zwang: bestimme welcher Wurf ungültig wird
    let gegnerZwangRoll = -1;
    if (playerHasEffect(opponent, copiedAbility, CharacterType.Quacksalber, 2)) {
        gegnerZwangRoll = Math.floor(Math.random() * 3) + 1;
    }

    // Würfel-Zerstörer: 1 Würfel weniger
    let destroyedCount = 0;
    if (playerHasEffect(opponent, copiedAbility, CharacterType.Taschendieb, 3)) {
        destroyedCount = 1;
    }

    // Kriegsstratege: 2 auto-Schaden am Gegner
    if (playerHasEffect(current, copiedAbility, CharacterType.Rebell, 2)) {
        opponent.health = Math.max(0, opponent.health - 2);
        if (opponent.health <= 0) return 'win';
    }

    // Würfel rollen mit strategischem Keeping
    let dice = rollNDice(diceCount);
    // Zerstörte Würfel markieren
    for (let i = 0; i < destroyedCount && i < dice.length; i++) {
        dice[i] = -1;
    }

    const activeDice = () => dice.filter(d => d > 0);
    const kept = new Array(diceCount).fill(false);
    // Markiere zerstörte als "kept"
    for (let i = 0; i < diceCount; i++) {
        if (dice[i] === -1) kept[i] = true;
    }

    // Entscheide welche Aktion
    const action = chooseAction(activeDice(), current, opponent, strategy, copiedAbility);

    // 3 Würfe mit strategischem Keeping
    for (let roll = 1; roll <= 3; roll++) {
        // Erster Wurf wurde schon gemacht
        if (roll > 1) {
            // Keep-Strategie anwenden
            const activeIndices = [];
            for (let i = 0; i < diceCount; i++) {
                if (dice[i] > 0) activeIndices.push(i);
            }
            const activeVals = activeIndices.map(i => dice[i]);

            let keepMask;
            switch (action) {
                case 'attack': keepMask = keepForAttack(activeVals, current, copiedAbility); break;
                case 'heal':   keepMask = keepForHeal(activeVals, current, copiedAbility); break;
                case 'ability': keepMask = keepForAbility(activeVals); break;
                case 'block':  keepMask = keepForAttack(activeVals, current, copiedAbility); break;
                default:       keepMask = activeVals.map(() => false);
            }

            for (let k = 0; k < activeIndices.length; k++) {
                if (keepMask[k]) kept[activeIndices[k]] = true;
            }

            // Nicht-gehaltene Würfel neu werfen
            for (let i = 0; i < diceCount; i++) {
                if (!kept[i] && dice[i] !== -1) {
                    dice[i] = rollDie();
                }
            }

            // Gegner-Zwang prüfen
            if (gegnerZwangRoll === roll) {
                for (let i = 0; i < diceCount; i++) {
                    if (!kept[i] && dice[i] !== -1) {
                        dice[i] = rollDie();
                    }
                }
            }
        } else {
            // Gegner-Zwang auf Wurf 1
            if (gegnerZwangRoll === 1) {
                for (let i = 0; i < diceCount; i++) {
                    if (dice[i] !== -1) {
                        dice[i] = rollDie();
                    }
                }
            }
        }
    }

    // Finale Würfel = alle aktiven
    const finalDice = activeDice();

    // Aktion ausführen
    return executeAction(action, finalDice, dice, current, opponent, copiedAbility);
}

// ===== AKTION WÄHLEN =====
function chooseAction(dice, current, opponent, strategy, copiedAbility) {
    const groups = getDiceGroups(dice);
    let bestDmg = 0;
    for (const g of groups) {
        let dmg = g.value * g.count;
        if (playerHasEffect(current, copiedAbility, CharacterType.Rebell, 3) && g.value === 5) {
            dmg = 6 * g.count;
        }
        if (dmg > bestDmg) bestDmg = dmg;
    }

    const hasZweier = playerHasEffect(current, copiedAbility, CharacterType.Taschendieb, 1);
    const healCount = dice.filter(d => d === 1 || (hasZweier && d === 2)).length;
    const healAmt = healCount * 5;
    const abilPts = calculateAbilityPoints(dice);

    // Block verfügbar?
    const canBlock = playerHasEffect(current, copiedAbility, CharacterType.Rebell, 1) &&
                     current.lastDamageReceived > 0;

    switch (strategy) {
        case 'always_attack':
            return 'attack';

        case 'always_heal':
            return 'heal';

        case 'always_ability':
            // Wenn alle 4 Fähigkeiten freigeschaltet → angreifen
            if (current.currentAbilityIndex >= 4) return 'attack';
            return 'ability';

        case 'ki_schwer':
            if (bestDmg > 15) return 'attack';
            if (current.health <= 35 && healAmt > 0) return 'heal';
            if (abilPts >= 3) return 'ability';
            if (bestDmg > 0) return 'attack';
            return 'attack';

        case 'ki_mittel':
            if (current.health <= 35 && healAmt > 0) return 'heal';
            if (abilPts >= 3) return 'ability';
            if (bestDmg > 10) return 'attack';
            return 'attack';

        case 'hybrid_aggro':
            // Erste Fähigkeit freischalten, dann nur angreifen
            if (!current.hasAbility(0) && abilPts > 0) return 'ability';
            return 'attack';

        case 'hybrid_balanced':
            // Block wenn möglich und lohnend
            if (canBlock && current.lastDamageReceived >= 10) return 'block';
            // Heilen wenn HP niedrig
            if (current.health <= 40 && healAmt > 0) return 'heal';
            // Ability sammeln wenn guter Pasch und noch nicht alles freigeschaltet
            if (current.currentAbilityIndex < 4 && abilPts >= 2) return 'ability';
            // Angreifen
            return 'attack';

        default:
            return 'attack';
    }
}

// ===== AKTION AUSFÜHREN =====
function executeAction(action, finalDice, allDice, current, opponent, copiedAbility) {
    switch (action) {
        case 'attack':
            return executeAttack(finalDice, current, opponent, copiedAbility);
        case 'heal':
            return executeHeal(finalDice, current, copiedAbility);
        case 'ability':
            return executeAbility(finalDice, current, copiedAbility);
        case 'block':
            return executeBlock(finalDice, current);
        default:
            return null;
    }
}

function executeAttack(dice, current, opponent, copiedAbility) {
    let attackDice = dice.slice();
    let healDice = [];

    // Heilungs-Manager: 1er separieren für gleichzeitige Heilung
    if (playerHasEffect(current, copiedAbility, CharacterType.Quacksalber, 1)) {
        healDice = attackDice.filter(d => d === 1);
        attackDice = attackDice.filter(d => d !== 1);
    }

    if (attackDice.length === 0) return null;

    // Fünfer-Upgrade vor Gruppen-Check
    const hasFuenfer = playerHasEffect(current, copiedAbility, CharacterType.Rebell, 3);
    const hasDoppel = playerHasEffect(current, copiedAbility, CharacterType.Soldat, 3) ||
                      playerHasEffect(current, copiedAbility, CharacterType.Soldat, 1);

    let damage;
    if (hasDoppel) {
        // 2 verschiedene Werte erlaubt → alle markierten Würfel summieren (nur Top-2-Gruppen)
        const groups = getDiceGroups(attackDice);
        groups.sort((a, b) => (b.value * b.count) - (a.value * a.count));
        damage = 0;
        const top2 = groups.slice(0, 2);
        for (const g of top2) damage += g.value * g.count;
    } else if (hasFuenfer) {
        // 5er zählen als 6 → fasse 5+6 zusammen
        const fiveCount = attackDice.filter(d => d === 5).length;
        const sixCount = attackDice.filter(d => d === 6).length;
        const combined = fiveCount + sixCount;
        const combinedDamage = combined * 6;

        const otherGroups = getDiceGroups(attackDice.filter(d => d !== 5 && d !== 6));
        let bestOther = 0;
        for (const g of otherGroups) {
            if (g.value * g.count > bestOther) bestOther = g.value * g.count;
        }

        if (combinedDamage >= bestOther && combined > 0) {
            damage = combinedDamage;
        } else {
            // Beste einzelne Gruppe
            const groups = getDiceGroups(attackDice);
            let best = groups[0];
            for (const g of groups) {
                let d = g.value * g.count;
                if (g.value === 5) d = 6 * g.count;
                if (d > best.value * best.count) best = g;
            }
            damage = best.value === 5 ? 6 * best.count : best.value * best.count;
        }
    } else {
        // Standard: nur gleiche Würfel → beste Gruppe
        const groups = getDiceGroups(attackDice);
        let best = { value: 0, count: 0 };
        for (const g of groups) {
            if (g.value * g.count > best.value * best.count) best = g;
        }
        damage = best.value * best.count;
    }

    if (damage <= 0) return null;

    // Kriegsmeister: +2
    if (playerHasEffect(current, copiedAbility, CharacterType.Soldat, 1)) {
        damage += 2;
    }

    // Vergeltung: Gegner reflektiert einen Würfelwert
    if (playerHasEffect(opponent, copiedAbility, CharacterType.Soldat, 2)) {
        const groups = getDiceGroups(attackDice);
        if (groups.length > 0) {
            // Reflektiere den Wert des ersten Angriffswürfels (nicht 1)
            let reflectVal = 0;
            for (const g of groups) {
                if (g.value > 1) { reflectVal = g.value; break; }
            }
            if (reflectVal === 0 && groups.length > 0) reflectVal = groups[0].value;
            current.health = Math.max(0, current.health - reflectVal);
        }
    }

    // Schaden anwenden
    opponent.lastDamageReceived = damage;
    opponent.health = Math.max(0, opponent.health - damage);

    // Heilungs-Manager Heilung
    if (healDice.length > 0) {
        current.health = Math.min(100, current.health + healDice.length * 5);
    }

    if (opponent.health <= 0) return 'win';
    if (current.health <= 0) return 'lose';
    return null;
}

function executeHeal(dice, current, copiedAbility) {
    const hasZweier = playerHasEffect(current, copiedAbility, CharacterType.Taschendieb, 1);
    const healCount = dice.filter(d => d === 1 || (hasZweier && d === 2)).length;
    if (healCount === 0) return null;
    current.health = Math.min(100, current.health + healCount * 5);
    return null;
}

function executeAbility(dice, current, copiedAbility) {
    let points = calculateAbilityPoints(dice);
    if (points <= 0) return null;
    // Punkt-Bonus: +2
    if (playerHasEffect(current, copiedAbility, CharacterType.Taschendieb, 0)) {
        points += 2;
    }
    current.addAbilityPoints(points);
    return null;
}

function executeBlock(dice, current) {
    if (current.lastDamageReceived <= 0) return null;
    const groups = getDiceGroups(dice);
    let best = { value: 0, count: 0 };
    for (const g of groups) {
        if (g.value * g.count > best.value * best.count) best = g;
    }
    const blockSum = best.value * best.count;
    if (blockSum >= current.lastDamageReceived) {
        current.health = Math.min(100, current.health + current.lastDamageReceived);
        current.lastDamageReceived = 0;
    }
    return null;
}

// ===== EIN SPIEL SIMULIEREN =====
function simulateGame(char1, char2, strategy1, strategy2) {
    const p1 = new Player('P1', char1);
    const p2 = new Player('P2', char2);

    let turn = 0;
    let currentIdx = 0; // 0 = p1, 1 = p2

    while (p1.health > 0 && p2.health > 0 && turn < MAX_TURNS) {
        turn++;
        const current = currentIdx === 0 ? p1 : p2;
        const opponent = currentIdx === 0 ? p2 : p1;
        const strategy = currentIdx === 0 ? strategy1 : strategy2;

        // Kopierte Fähigkeit berechnen (Taschendieb)
        let copiedAbility = null;
        if (current.character === CharacterType.Taschendieb && current.hasAbility(2)) {
            for (let i = 0; i < 4; i++) {
                if (opponent.hasAbility(i)) {
                    copiedAbility = { character: opponent.character, index: i };
                    break;
                }
            }
        }

        const result = simulateTurn(current, opponent, strategy, copiedAbility);

        // Würfel-Diebstahl am Ende des Zugs
        if (opponent.character === CharacterType.Rebell && opponent.hasAbility(0)) {
            opponent.bonusDice = 1; // Vereinfacht: immer +1 (im Spiel abhängig von ungenutzten Würfeln)
        }

        if (result === 'win') return currentIdx === 0 ? 1 : 2;
        if (result === 'lose') return currentIdx === 0 ? 2 : 1;
        if (p1.health <= 0) return 2;
        if (p2.health <= 0) return 1;

        currentIdx = currentIdx === 0 ? 1 : 0;
    }

    // Timeout → Spieler mit mehr HP gewinnt
    if (p1.health > p2.health) return 1;
    if (p2.health > p1.health) return 2;
    return 0; // Unentschieden
}

// ===== STRATEGIEN =====
const STRATEGIES = [
    { id: 'always_attack',    name: 'Immer Angriff' },
    { id: 'always_heal',      name: 'Immer Heilen' },
    { id: 'always_ability',   name: 'Immer Fähigkeiten' },
    { id: 'ki_schwer',        name: 'KI-Schwer' },
    { id: 'ki_mittel',        name: 'KI-Mittel' },
    { id: 'hybrid_aggro',     name: 'Hybrid-Aggro' },
    { id: 'hybrid_balanced',  name: 'Hybrid-Balanced' },
];

// ===== SIMULATION DURCHFÜHREN =====
function runSimulation() {
    console.log('='.repeat(80));
    console.log('  WÜRFELSPIEL BALANCE-SIMULATION');
    console.log('  ' + GAMES_PER_MATCHUP + ' Spiele pro Matchup, max ' + MAX_TURNS + ' Züge pro Spiel');
    console.log('='.repeat(80));
    console.log();

    // ===== TEIL 1: Gleicher Charakter, verschiedene Strategien =====
    console.log('━'.repeat(80));
    console.log('  TEIL 1: STRATEGIE-VERGLEICH (Soldat vs Soldat)');
    console.log('  Gleicher Charakter, um reine Strategie-Unterschiede zu messen');
    console.log('━'.repeat(80));
    console.log();

    const stratResults = {};
    const totalWins = {};
    const totalGames = {};
    for (const s of STRATEGIES) {
        totalWins[s.id] = 0;
        totalGames[s.id] = 0;
    }

    for (let i = 0; i < STRATEGIES.length; i++) {
        for (let j = i + 1; j < STRATEGIES.length; j++) {
            const s1 = STRATEGIES[i];
            const s2 = STRATEGIES[j];
            let wins1 = 0, wins2 = 0, draws = 0;

            for (let g = 0; g < GAMES_PER_MATCHUP; g++) {
                const result = simulateGame(CharacterType.Soldat, CharacterType.Soldat, s1.id, s2.id);
                if (result === 1) wins1++;
                else if (result === 2) wins2++;
                else draws++;
            }

            const key = s1.id + ' vs ' + s2.id;
            stratResults[key] = { wins1, wins2, draws, name1: s1.name, name2: s2.name };

            totalWins[s1.id] += wins1;
            totalWins[s2.id] += wins2;
            totalGames[s1.id] += GAMES_PER_MATCHUP;
            totalGames[s2.id] += GAMES_PER_MATCHUP;

            const wr1 = ((wins1 / GAMES_PER_MATCHUP) * 100).toFixed(0);
            const wr2 = ((wins2 / GAMES_PER_MATCHUP) * 100).toFixed(0);
            console.log(`  ${s1.name.padEnd(20)} ${wr1.padStart(3)}% vs ${wr2.padStart(3)}%  ${s2.name.padEnd(20)}  (${wins1}-${wins2}-${draws})`);
        }
    }

    console.log();
    console.log('  ── GESAMTRANKING (Soldat vs Soldat) ──');
    const ranking = STRATEGIES
        .map(s => ({
            name: s.name,
            winRate: totalGames[s.id] > 0 ? (totalWins[s.id] / totalGames[s.id] * 100) : 0,
            wins: totalWins[s.id],
            games: totalGames[s.id]
        }))
        .sort((a, b) => b.winRate - a.winRate);

    for (let r = 0; r < ranking.length; r++) {
        const entry = ranking[r];
        console.log(`  ${(r + 1)}. ${entry.name.padEnd(20)} ${entry.winRate.toFixed(1).padStart(5)}% Winrate  (${entry.wins}/${entry.games})`);
    }

    // ===== TEIL 2: Charakter-Vergleich =====
    console.log();
    console.log('━'.repeat(80));
    console.log('  TEIL 2: CHARAKTER-VERGLEICH');
    console.log('  Jeder Charakter mit KI-Schwer Strategie gegeneinander');
    console.log('━'.repeat(80));
    console.log();

    const charWins = [0, 0, 0, 0];
    const charGames = [0, 0, 0, 0];

    for (let c1 = 0; c1 < 4; c1++) {
        for (let c2 = c1 + 1; c2 < 4; c2++) {
            let wins1 = 0, wins2 = 0, draws = 0;
            for (let g = 0; g < GAMES_PER_MATCHUP; g++) {
                const result = simulateGame(c1, c2, 'ki_schwer', 'ki_schwer');
                if (result === 1) wins1++;
                else if (result === 2) wins2++;
                else draws++;
            }
            charWins[c1] += wins1;
            charWins[c2] += wins2;
            charGames[c1] += GAMES_PER_MATCHUP;
            charGames[c2] += GAMES_PER_MATCHUP;

            const wr1 = ((wins1 / GAMES_PER_MATCHUP) * 100).toFixed(0);
            const wr2 = ((wins2 / GAMES_PER_MATCHUP) * 100).toFixed(0);
            console.log(`  ${CHAR_NAMES[c1].padEnd(15)} ${wr1.padStart(3)}% vs ${wr2.padStart(3)}%  ${CHAR_NAMES[c2].padEnd(15)}  (${wins1}-${wins2}-${draws})`);
        }
    }

    console.log();
    console.log('  ── CHARAKTER-RANKING (mit KI-Schwer) ──');
    const charRanking = CHAR_NAMES
        .map((name, i) => ({
            name,
            winRate: charGames[i] > 0 ? (charWins[i] / charGames[i] * 100) : 0,
            wins: charWins[i],
            games: charGames[i]
        }))
        .sort((a, b) => b.winRate - a.winRate);

    for (let r = 0; r < charRanking.length; r++) {
        const entry = charRanking[r];
        console.log(`  ${(r + 1)}. ${entry.name.padEnd(15)} ${entry.winRate.toFixed(1).padStart(5)}% Winrate  (${entry.wins}/${entry.games})`);
    }

    // ===== TEIL 3: "Immer Angriff" vs Rest – ist es dominant? =====
    console.log();
    console.log('━'.repeat(80));
    console.log('  TEIL 3: IST "IMMER ANGREIFEN" DOMINANT?');
    console.log('  Immer-Angriff vs jede andere Strategie, alle 4 Charaktere');
    console.log('━'.repeat(80));
    console.log();

    let attackTotalWins = 0, attackTotalGames = 0;
    for (const s of STRATEGIES) {
        if (s.id === 'always_attack') continue;
        let atkWins = 0, otherWins = 0;
        for (let c = 0; c < 4; c++) {
            for (let g = 0; g < GAMES_PER_MATCHUP; g++) {
                const result = simulateGame(c, c, 'always_attack', s.id);
                if (result === 1) atkWins++;
                else if (result === 2) otherWins++;
            }
        }
        const total = GAMES_PER_MATCHUP * 4;
        attackTotalWins += atkWins;
        attackTotalGames += total;
        const wr = ((atkWins / total) * 100).toFixed(1);
        console.log(`  Immer Angriff vs ${s.name.padEnd(20)}: ${wr}% Winrate  (${atkWins}/${total})`);
    }

    console.log();
    const overallWr = ((attackTotalWins / attackTotalGames) * 100).toFixed(1);
    console.log(`  >>> GESAMTE WINRATE von "Immer Angriff": ${overallWr}% <<<`);

    // ===== TEIL 4: Durchschnittlichen Schaden/Heilung pro Aktion messen =====
    console.log();
    console.log('━'.repeat(80));
    console.log('  TEIL 4: ERWARTUNGSWERTE PRO AKTION (1000 Simulationen)');
    console.log('  6 Würfel, 3 Würfe mit intelligentem Keeping');
    console.log('━'.repeat(80));
    console.log();

    const SIMS = 1000;
    // Schaden messen
    let totalDmg = 0;
    for (let i = 0; i < SIMS; i++) {
        let dice = rollNDice(6);
        for (let roll = 1; roll <= 3; roll++) {
            if (roll > 1) {
                const mask = keepForAttack(dice, { character: -1, hasAbility: () => false }, null);
                dice = dice.map((d, idx) => mask[idx] ? d : rollDie());
            }
        }
        const groups = getDiceGroups(dice);
        let best = 0;
        for (const g of groups) {
            if (g.value * g.count > best) best = g.value * g.count;
        }
        totalDmg += best;
    }
    console.log(`  Ø Angriffs-Schaden:     ${(totalDmg / SIMS).toFixed(1)} pro Zug`);

    // Heilung messen
    let totalHeal = 0;
    for (let i = 0; i < SIMS; i++) {
        let dice = rollNDice(6);
        for (let roll = 1; roll <= 3; roll++) {
            if (roll > 1) {
                const mask = keepForHeal(dice, { character: -1, hasAbility: () => false }, null);
                dice = dice.map((d, idx) => mask[idx] ? d : rollDie());
            }
        }
        const ones = dice.filter(d => d === 1).length;
        totalHeal += ones * 5;
    }
    console.log(`  Ø Heilung:              ${(totalHeal / SIMS).toFixed(1)} HP pro Zug`);

    // Fähigkeitspunkte messen
    let totalAP = 0;
    for (let i = 0; i < SIMS; i++) {
        let dice = rollNDice(6);
        for (let roll = 1; roll <= 3; roll++) {
            if (roll > 1) {
                const mask = keepForAbility(dice);
                dice = dice.map((d, idx) => mask[idx] ? d : rollDie());
            }
        }
        totalAP += calculateAbilityPoints(dice);
    }
    console.log(`  Ø Fähigkeitspunkte:     ${(totalAP / SIMS).toFixed(1)} pro Zug`);

    // ===== FAZIT =====
    console.log();
    console.log('='.repeat(80));
    console.log('  FAZIT');
    console.log('='.repeat(80));
    console.log();

    if (parseFloat(overallWr) > 60) {
        console.log('  ⚠️  "IMMER ANGREIFEN" IST DOMINANT (' + overallWr + '% Gesamt-Winrate)');
        console.log('  → Angriff ist stärker als Heilen und Fähigkeiten sammeln.');
        console.log('  → Die drei Aktionen sind NICHT gut balanced.');
    } else if (parseFloat(overallWr) > 55) {
        console.log('  ⚡  "IMMER ANGREIFEN" hat einen leichten Vorteil (' + overallWr + '%)');
        console.log('  → Aggression wird belohnt, aber gemischte Strategien können mithalten.');
    } else if (parseFloat(overallWr) > 45) {
        console.log('  ✅  Die Aktionen scheinen RELATIV BALANCED (' + overallWr + '% für Immer-Angriff)');
        console.log('  → Keine einzelne Strategie dominiert klar.');
    } else {
        console.log('  🛡️  "IMMER ANGREIFEN" ist SCHWÄCHER als gemischte Strategien (' + overallWr + '%)');
        console.log('  → Heilen und Fähigkeiten werden richtig belohnt.');
    }

    console.log();
    console.log('  Die beste Strategie im Ranking ist: ' + ranking[0].name +
                ' (' + ranking[0].winRate.toFixed(1) + '% Winrate)');
    console.log('  Die schwächste Strategie ist: ' + ranking[ranking.length - 1].name +
                ' (' + ranking[ranking.length - 1].winRate.toFixed(1) + '% Winrate)');

    const avgDmg = (totalDmg / SIMS).toFixed(1);
    const avgHeal = (totalHeal / SIMS).toFixed(1);
    const avgAP = (totalAP / SIMS).toFixed(1);
    console.log();
    console.log('  Erwartungswerte pro Zug:');
    console.log(`    Angriff:  Ø ${avgDmg} Schaden  (kann jeden Würfelwert nutzen)`);
    console.log(`    Heilen:   Ø ${avgHeal} HP       (nur 1er zählen → P=1/6 pro Würfel)`);
    console.log(`    Fähigk.:  Ø ${avgAP} Punkte   (braucht mind. 3er-Pasch für 1 Pkt)`);
    console.log();

    if (parseFloat(avgDmg) > parseFloat(avgHeal) * 1.5) {
        console.log('  📊 Angriff erzeugt ' + (parseFloat(avgDmg) / parseFloat(avgHeal) * 5).toFixed(1) + 
                    '× mehr Schaden als Heilen HP wiederherstellt.');
        console.log('     → Heilen kann den Schaden nicht kompensieren!');
    }
    console.log();
}

// Start!
runSimulation();
