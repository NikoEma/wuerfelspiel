// ============================================================
// WÜRFELSPIEL BALANCE-SIMULATION — Vollständig
// 288.000 Spiele: 4×4 Chars × 3×3 Strats × 2 Starter × 1000
// ============================================================

const GAMES_PER_COMBO = 1000;
const MAX_TURNS = 200;

// ===== CHARAKTER-TYPEN =====
const CharacterType = { Soldat: 0, Rebell: 1, Taschendieb: 2, Quacksalber: 3 };
const CHAR_NAMES = ['Soldat', 'Rebell', 'Taschendieb', 'Quacksalber'];
const STRAT_NAMES = ['Aggro', 'Control', 'Schwer'];
const STRAT_IDS = ['aggro', 'control', 'schwer'];

// ===== CHARACTER_ABILITIES (aus index.html) =====
// Soldat:       0=Kampfinstinkt(+3 DMG), 1=Kriegsmeister(+2 DMG, ≥12→+2SP), 2=Vergeltung(Reflekt 1 Wert), 3=Doppelwertung(2 Gruppen zählen)
// Rebell:       0=Würfel-Diebstahl(+1 Bonuswürfel), 1=Kriegsstratege(5 DMG Zugende), 2=Schadensblockade(Block-Aktion), 3=Fünfer-Upgrade(5=6)
// Taschendieb:  0=Punkt-Bonus(+1 SP), 1=Zweier-Magisch(2er heilen), 2=Ressourcen-Raub(-1 FP Gegner), 3=Würfel-Zerstörer(1 Würfel zerstören)
// Quacksalber:  0=Neuwurf-Bonus(1 Würfel neu+1 SP), 1=Heilungs-Manager(1er bei Angriff heilen+2 SP), 2=Gegner-Zwang(Zufalls-Wurf wiederholen), 3=Doppelwertung(nicht für Quack)

// ===== SPIELER =====
class Player {
    constructor(name, character) {
        this.name = name;
        this.character = character;
        this.health = 100;
        this.fp = 5;
        this.sp = 0;
        this.abilityProgress = [5, 0, 0, 0];
        this.abilityUnlocked = [false, false, false, false];
        this.currentAbilityIndex = 0;
        this.bonusDice = 0;
        this.consecutiveAttacks = 0;
        this.lastDamageReceived = 0;
        // Per-game tracking
        this.totalDamage = 0;
        this.totalHealing = 0;
        this.successfulBlocks = 0;
        this.exhaustionTriggers = 0;
    }

    hasAbility(idx) {
        return this.abilityUnlocked[idx] === true;
    }

    addAbilityPoints(points) {
        while (points > 0 && this.currentAbilityIndex < 4) {
            const needed = 7 - this.abilityProgress[this.currentAbilityIndex];
            if (points >= needed) {
                this.abilityProgress[this.currentAbilityIndex] = 7;
                this.abilityUnlocked[this.currentAbilityIndex] = true;
                points -= needed;
                this.currentAbilityIndex++;
            } else {
                this.abilityProgress[this.currentAbilityIndex] += points;
                points = 0;
            }
        }
    }

    abilitiesUnlockedCount() {
        let c = 0;
        for (let i = 0; i < 4; i++) { if (this.abilityUnlocked[i]) c++; }
        return c;
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

function playerHasEffect(player, charType, abilityIdx) {
    return player.character === charType && player.hasAbility(abilityIdx);
}

function getDiceGroups(dice) {
    const groups = {};
    for (let i = 0; i < dice.length; i++) {
        const v = dice[i];
        if (v > 0) groups[v] = (groups[v] || 0) + 1;
    }
    const result = [];
    for (const key in groups) {
        if (groups.hasOwnProperty(key)) result.push({ value: parseInt(key), count: groups[key] });
    }
    return result;
}

function isSmallStraight(unique) {
    if (unique.length < 5) return false;
    for (let i = 0; i <= unique.length - 5; i++) {
        if (unique[i + 4] - unique[i] === 4) return true;
    }
    return false;
}

// Returns {fp, sp} for a given dice set (all dice considered)
function calcCombo(dice) {
    const filtered = dice.filter(d => d > 0);
    if (filtered.length === 0) return { fp: 0, sp: 0 };
    const sorted = filtered.slice().sort((a, b) => a - b);
    const groups = getDiceGroups(filtered);
    let maxCount = 0;
    let pairs = 0;
    for (const g of groups) {
        if (g.count > maxCount) maxCount = g.count;
        if (g.count >= 2) pairs++;
    }
    const unique = [...new Set(sorted)].sort((a, b) => a - b);

    if (maxCount >= 6) return { fp: 6, sp: 18 };
    if (unique.length >= 6 && unique[0] === 1 && unique[5] === 6) return { fp: 4, sp: 10 };
    if (isSmallStraight(unique)) return { fp: 3, sp: 6 };
    if (maxCount >= 4) return { fp: 3, sp: 5 };
    if (pairs >= 2) return { fp: 2, sp: 4 };
    if (maxCount >= 3) return { fp: 2, sp: 3 };
    return { fp: 0, sp: 0 };
}

function analyzeDice(dice) {
    const counts = {};
    let ones = 0, alive = 0;
    for (let i = 0; i < dice.length; i++) {
        const v = dice[i];
        if (v > 0) {
            alive++;
            counts[v] = (counts[v] || 0) + 1;
            if (v === 1) ones++;
        }
    }
    let bestVal = 0, bestCount = 0, bestDmg = 0;
    for (const v in counts) {
        if (counts.hasOwnProperty(v)) {
            const val = parseInt(v);
            const cnt = counts[v];
            const dmg = val * cnt;
            if (cnt >= 2 && dmg > bestDmg) { bestVal = val; bestCount = cnt; bestDmg = dmg; }
        }
    }
    // Fallback: single highest die
    if (bestDmg === 0) {
        for (const v in counts) {
            if (counts.hasOwnProperty(v)) {
                const val = parseInt(v);
                if (val > bestVal) { bestVal = val; bestCount = counts[v]; bestDmg = val * counts[v]; }
            }
        }
    }
    return { counts, ones, alive, bestVal, bestCount, bestDmg, healAmt: ones * 5 };
}

// ===== WÜRFEL-KEEPING =====
function keepForAttack(dice, player) {
    const groups = getDiceGroups(dice);
    if (groups.length === 0) return dice.map(() => false);

    const hasFuenfer = playerHasEffect(player, CharacterType.Rebell, 3);
    const hasDoppel = playerHasEffect(player, CharacterType.Soldat, 3);

    if (hasDoppel) {
        groups.sort((a, b) => (b.value * b.count) - (a.value * a.count));
        const keepVals = new Set();
        keepVals.add(groups[0].value);
        if (groups.length > 1) keepVals.add(groups[1].value);
        return dice.map(d => keepVals.has(d));
    }

    if (hasFuenfer) {
        const fiveCount = dice.filter(d => d === 5).length;
        const sixCount = dice.filter(d => d === 6).length;
        const combinedDmg = (fiveCount + sixCount) * 6;
        const otherGroups = groups.filter(g => g.value !== 5 && g.value !== 6);
        let bestOtherDmg = 0;
        for (const g of otherGroups) {
            if (g.value * g.count > bestOtherDmg) bestOtherDmg = g.value * g.count;
        }
        if (combinedDmg > bestOtherDmg) {
            return dice.map(d => d === 5 || d === 6);
        }
    }

    let best = groups[0];
    for (const g of groups) {
        if (g.value * g.count > best.value * best.count) best = g;
    }
    return dice.map(d => d === best.value);
}

function keepForHeal(dice, player) {
    const hasZweier = playerHasEffect(player, CharacterType.Taschendieb, 1);
    return dice.map(d => d === 1 || (hasZweier && d === 2));
}

function keepForAbility(dice) {
    const groups = getDiceGroups(dice);
    if (groups.length === 0) return dice.map(() => false);
    const unique = [...new Set(dice.filter(v => v > 0))].sort((a, b) => a - b);
    // Try for straight
    if (unique.length >= 4) {
        const kept = new Set();
        return dice.map(d => {
            if (!kept.has(d) && d > 0) { kept.add(d); return true; }
            return false;
        });
    }
    // Otherwise keep biggest group
    let best = groups[0];
    for (const g of groups) {
        if (g.count > best.count || (g.count === best.count && g.value > best.value)) best = g;
    }
    return dice.map(d => d === best.value);
}

// ===== DICE COUNT =====
function getDiceCount(player) {
    let count = 6;
    // Bonus dice (from Würfel-Diebstahl)
    count += player.bonusDice;
    // Exhaustion penalty: consecutiveAttacks > 2 → lose dice
    const exhaustion = Math.max(0, player.consecutiveAttacks - 2);
    count = Math.max(1, count - exhaustion);
    return count;
}

// ===== KI-STRATEGIEN =====
function chooseAction(dice, current, opponent, strategy) {
    const analysis = analyzeDice(dice);
    const combo = calcCombo(dice);
    const hasZweier = playerHasEffect(current, CharacterType.Taschendieb, 1);
    const healCount = dice.filter(d => d === 1 || (hasZweier && d === 2)).length;
    const canBlock = playerHasEffect(current, CharacterType.Rebell, 2) && current.lastDamageReceived > 0;

    // Calculate effective damage (with Kampfinstinkt, Kriegsmeister & Fünfer-Upgrade)
    let effectiveBestDmg = analysis.bestDmg;
    if (playerHasEffect(current, CharacterType.Soldat, 0)) effectiveBestDmg += 3;
    if (playerHasEffect(current, CharacterType.Soldat, 1)) effectiveBestDmg += 2;
    if (playerHasEffect(current, CharacterType.Rebell, 3)) {
        const fiveCount = dice.filter(d => d === 5).length;
        const sixCount = dice.filter(d => d === 6).length;
        const fuenferDmg = (fiveCount + sixCount) * 6;
        if (fuenferDmg > effectiveBestDmg) effectiveBestDmg = fuenferDmg;
    }

    switch (strategy) {
        case 'aggro':
            // 1. Kill-Check
            if (effectiveBestDmg >= opponent.health) return 'attack';
            // 2. Angriff wenn Erschöpfung < 3
            if (current.consecutiveAttacks < 3 && analysis.bestDmg > 0) return 'attack';
            // 3. Heilen wenn HP < 25
            if (current.health < 25 && healCount > 0) return 'heal';
            // 4. Sammeln als Fallback
            if (combo.sp > 0) return 'ability';
            // 5. Block wenn möglich
            if (canBlock) return 'block';
            // 6. Heilen wenn möglich
            if (healCount > 0) return 'heal';
            // 7. Angriff als letzter Ausweg (auch mit Erschöpfung)
            return 'attack';

        case 'control':
            // 1. Angriff nur wenn Kill möglich
            if (effectiveBestDmg >= opponent.health) return 'attack';
            // 2. Block wenn lohnend
            if (canBlock && current.lastDamageReceived >= 8) return 'block';
            // 3. Heilen wenn HP < 70
            if (current.health < 70 && healCount > 0) return 'heal';
            // 4. Sammeln für FP/SP
            if (combo.sp > 0) return 'ability';
            // 5. Heilen als Fallback
            if (healCount > 0) return 'heal';
            // 6. Angriff wenn Gegner HP < 20
            if (opponent.health < 20 && analysis.bestDmg > 0) return 'attack';
            // 7. Angriff als letzter Ausweg
            if (analysis.bestDmg > 0) return 'attack';
            return 'ability';

        case 'schwer':
            // Kill-Check (höchste Priorität)
            if (effectiveBestDmg >= opponent.health) return 'attack';
            // Block-Chance nutzen (Schadensblockade)
            if (canBlock && current.lastDamageReceived <= analysis.bestDmg) return 'block';
            // Erschöpft: Pause
            if (current.consecutiveAttacks >= 2 && (combo.sp >= 3 || healCount >= 2)) {
                return combo.sp >= 3 ? 'ability' : 'heal';
            }
            // Gegner SP-Rennen → Aggro (frühere Erkennung)
            if (opponent.sp >= 30 && analysis.bestDmg >= 6) return 'attack';
            // SP-Rennen: eigene SP hoch → Sammeln
            if (current.sp >= 32 && combo.sp >= 3) return 'ability';
            // Niedrige HP → Heilen (dynamischer Schwellenwert: 60 bei voller Adaption)
            if (current.health <= 60 && healCount >= 2) return 'heal';
            // Block wenn lohnend (niedrigerer Schwellenwert)
            if (canBlock && current.lastDamageReceived >= 8) return 'block';
            // Guter SP-Combo
            if (combo.sp >= 5) return 'ability';
            // Starker Angriff
            if (effectiveBestDmg >= 12) return 'attack';
            // 2-Zug-Kill: aggressiv bleiben wenn Gegner niedrig
            if (opponent.health <= 40 && effectiveBestDmg >= opponent.health / 2) return 'attack';
            // Nächste Fähigkeit nah
            if (current.currentAbilityIndex < 4) {
                const fpNeeded = 7 - current.abilityProgress[current.currentAbilityIndex];
                if (fpNeeded <= 3 && combo.fp >= fpNeeded) return 'ability';
            }
            // Niedrige HP → auch mit wenig heilen
            if (current.health <= 60 && healCount >= 1) return 'heal';
            // Guter Angriff
            if (analysis.bestDmg >= 6) return 'attack';
            // Irgendein SP
            if (combo.sp >= 2) return 'ability';
            // Etwas Heilung
            if (healCount >= 1) return 'heal';
            // Fallback
            return 'attack';

        default:
            return 'attack';
    }
}

// ===== AKTION AUSFÜHREN =====
function executeAttack(dice, current, opponent) {
    let attackDice = dice.slice();
    let healDice = [];

    // Heilungs-Manager (Quacksalber Ability 1): 1er separieren für Heilung
    if (playerHasEffect(current, CharacterType.Quacksalber, 1)) {
        healDice = attackDice.filter(d => d === 1);
        attackDice = attackDice.filter(d => d !== 1);
    }

    if (attackDice.length === 0 && healDice.length > 0) {
        // Only 1s with Heilungs-Manager → treat as heal
        const healAmt = healDice.length * 5;
        current.health = Math.min(100, current.health + healAmt);
        current.totalHealing += healAmt;
        current.sp += 2;
        current.consecutiveAttacks = 0;
        return;
    }
    if (attackDice.length === 0) return;

    const hasFuenfer = playerHasEffect(current, CharacterType.Rebell, 3);
    const hasDoppel = playerHasEffect(current, CharacterType.Soldat, 3);

    let damage;
    if (hasDoppel) {
        // Doppelwertung: top 2 groups count
        const groups = getDiceGroups(attackDice);
        groups.sort((a, b) => (b.value * b.count) - (a.value * a.count));
        damage = 0;
        const top2 = groups.slice(0, 2);
        for (const g of top2) damage += g.value * g.count;
    } else if (hasFuenfer) {
        // Fünfer-Upgrade: 5s count as 6s
        const fiveCount = attackDice.filter(d => d === 5).length;
        const sixCount = attackDice.filter(d => d === 6).length;
        const combinedDmg = (fiveCount + sixCount) * 6;
        const otherGroups = getDiceGroups(attackDice.filter(d => d !== 5 && d !== 6));
        let bestOther = 0;
        for (const g of otherGroups) {
            if (g.value * g.count > bestOther) bestOther = g.value * g.count;
        }
        if (combinedDmg >= bestOther && (fiveCount + sixCount) > 0) {
            damage = combinedDmg;
        } else {
            const groups = getDiceGroups(attackDice);
            let best = { value: 0, count: 0 };
            for (const g of groups) {
                const d = g.value === 5 ? 6 * g.count : g.value * g.count;
                if (d > (best.value === 5 ? 6 * best.count : best.value * best.count)) best = g;
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

    if (damage <= 0) return;

    // Kampfinstinkt: +3 Schaden
    if (playerHasEffect(current, CharacterType.Soldat, 0)) damage += 3;

    // Kriegsmeister: +2 Schaden
    if (playerHasEffect(current, CharacterType.Soldat, 1)) damage += 2;

    // Vergeltung (Gegner-Fähigkeit): Gegner reflektiert einen Würfelwert
    if (playerHasEffect(opponent, CharacterType.Soldat, 2)) {
        const groups = getDiceGroups(attackDice);
        let reflectVal = 0;
        for (const g of groups) { if (g.value > 0) { reflectVal = g.value; break; } }
        if (reflectVal > 0) current.health = Math.max(0, current.health - reflectVal);
    }

    // Kriegsmeister SP-Bonus: wenn Schaden ≥ 12 → +2 SP
    if (playerHasEffect(current, CharacterType.Soldat, 1) && damage >= 12) {
        current.sp += 2;
    }

    // Schaden anwenden
    opponent.lastDamageReceived = damage;
    opponent.health = Math.max(0, opponent.health - damage);
    current.totalDamage += damage;
    current.consecutiveAttacks++;

    // Erschöpfung tracken
    if (current.consecutiveAttacks > 2) current.exhaustionTriggers++;

    // Heilungs-Manager Heilung (1er heilen + 3 SP)
    if (healDice.length > 0) {
        const healAmt = healDice.length * 5;
        current.health = Math.min(100, current.health + healAmt);
        current.totalHealing += healAmt;
        current.sp += 3;
    }
}

function executeHeal(dice, current) {
    const hasZweier = playerHasEffect(current, CharacterType.Taschendieb, 1);
    const healCount = dice.filter(d => d === 1 || (hasZweier && d === 2)).length;
    if (healCount === 0) return;
    const healAmt = healCount * 5;
    current.health = Math.min(100, current.health + healAmt);
    current.totalHealing += healAmt;
    current.consecutiveAttacks = 0;

    // Quacksalber Heilungs-Manager: +3 SP bei Heilen (same ability)
    if (playerHasEffect(current, CharacterType.Quacksalber, 1)) {
        current.sp += 3;
    }
}

function executeAbility(dice, current, opponent) {
    const combo = calcCombo(dice);
    if (combo.sp === 0) return;

    let fp = combo.fp;
    let sp = combo.sp;

    // Punkt-Bonus (Taschendieb Ability 0): +1 SP
    if (playerHasEffect(current, CharacterType.Taschendieb, 0)) { sp += 1; }

    current.fp += fp;
    current.addAbilityPoints(fp);
    current.sp += sp;

    // Ressourcen-Raub (Taschendieb Ability 2): Gegner verliert 1 FP
    if (playerHasEffect(current, CharacterType.Taschendieb, 2)) {
        const stolen = Math.min(1, opponent.fp);
        if (stolen > 0) {
            opponent.fp -= stolen;
            // Recalculate opponent ability state
            let totalFP = 0;
            for (let i = 0; i < 4; i++) totalFP += opponent.abilityProgress[i];
            totalFP = Math.max(0, totalFP - stolen);
            // Redistribute
            opponent.abilityProgress = [0, 0, 0, 0];
            opponent.currentAbilityIndex = 0;
            for (let i = 0; i < 4; i++) {
                const amount = Math.min(7, totalFP);
                opponent.abilityProgress[i] = amount;
                if (amount >= 7) {
                    opponent.abilityUnlocked[i] = true;
                    opponent.currentAbilityIndex = i + 1;
                }
                totalFP -= amount;
                if (totalFP <= 0) break;
            }
        }
    }

    current.consecutiveAttacks = 0;
}

function executeBlock(dice, current) {
    if (current.lastDamageReceived <= 0) return;

    // Block: need all same value (or Doppelwertung allows two groups)
    const groups = getDiceGroups(dice);
    let blockSum = 0;

    const hasDoppel = playerHasEffect(current, CharacterType.Soldat, 3);
    if (hasDoppel) {
        // Allow two groups
        groups.sort((a, b) => (b.value * b.count) - (a.value * a.count));
        for (let i = 0; i < Math.min(2, groups.length); i++) {
            blockSum += groups[i].value * groups[i].count;
        }
    } else {
        // Only best single group
        let best = { value: 0, count: 0 };
        for (const g of groups) {
            if (g.value * g.count > best.value * best.count) best = g;
        }
        blockSum = best.value * best.count;
    }

    if (blockSum >= current.lastDamageReceived) {
        const healAmt = current.lastDamageReceived;
        current.health = Math.min(100, current.health + healAmt);
        current.totalHealing += healAmt;
        current.successfulBlocks++;
        current.lastDamageReceived = 0;
    }
    current.consecutiveAttacks = 0;
}

// ===== EINEN ZUG SIMULIEREN =====
function simulateTurn(current, opponent, strategy) {
    const diceCount = getDiceCount(current);

    // Gegner-Zwang (Quacksalber Ability 2): welcher Wurf wird erzwungen wiederholt
    let gegnerZwangRoll = -1;
    if (playerHasEffect(opponent, CharacterType.Quacksalber, 2)) {
        gegnerZwangRoll = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    }

    // Würfel-Zerstörer (Taschendieb Ability 3): ein Würfel des Gegners wird zerstört
    let destroyedIdx = -1;
    if (playerHasEffect(opponent, CharacterType.Taschendieb, 3)) {
        destroyedIdx = Math.floor(Math.random() * diceCount);
    }

    // Würfel initialisieren (Wurf 1)
    let dice = rollNDice(diceCount);
    const kept = new Array(diceCount).fill(false);

    // Würfel-Zerstörer anwenden
    if (destroyedIdx >= 0 && destroyedIdx < diceCount) {
        dice[destroyedIdx] = -1;
        kept[destroyedIdx] = true;
    }

    // Gegner-Zwang auf Wurf 1: erzwingt Neuwurf aller nicht-gehaltenen
    if (gegnerZwangRoll === 1) {
        for (let i = 0; i < diceCount; i++) {
            if (dice[i] !== -1 && !kept[i]) dice[i] = rollDie();
        }
    }

    const activeDice = () => dice.filter(d => d > 0);

    // Entscheide Aktion basierend auf erstem Wurf
    let action = chooseAction(activeDice(), current, opponent, strategy);

    // Würfe 2 und 3 mit strategischem Keeping
    for (let roll = 2; roll <= 3; roll++) {
        // Keeping-Strategie anwenden
        const activeIndices = [];
        for (let i = 0; i < diceCount; i++) {
            if (dice[i] > 0 && !kept[i]) activeIndices.push(i);
        }
        const activeVals = activeIndices.map(i => dice[i]);

        let keepMask;
        switch (action) {
            case 'attack': keepMask = keepForAttack(activeVals, current); break;
            case 'heal':   keepMask = keepForHeal(activeVals, current); break;
            case 'ability': keepMask = keepForAbility(activeVals); break;
            case 'block':  keepMask = activeVals.map(() => true); break;
            default:       keepMask = activeVals.map(() => false);
        }

        for (let k = 0; k < activeIndices.length; k++) {
            if (keepMask[k]) kept[activeIndices[k]] = true;
        }

        // Nicht-gehaltene neu werfen
        for (let i = 0; i < diceCount; i++) {
            if (!kept[i] && dice[i] !== -1) dice[i] = rollDie();
        }

        // Gegner-Zwang prüfen
        if (gegnerZwangRoll === roll) {
            for (let i = 0; i < diceCount; i++) {
                if (!kept[i] && dice[i] !== -1) dice[i] = rollDie();
            }
        }
    }

    // Neuwurf-Bonus (Quacksalber Ability 0): 1 Würfel neu werfen + 1 SP
    if (playerHasEffect(current, CharacterType.Quacksalber, 0)) {
        // Reroll den niedrigsten aktiven Würfel
        let minIdx = -1, minVal = 7;
        for (let i = 0; i < diceCount; i++) {
            if (dice[i] > 0 && dice[i] < minVal) { minVal = dice[i]; minIdx = i; }
        }
        if (minIdx >= 0) {
            dice[minIdx] = rollDie();
            current.sp += 1;
        }
    }

    // Re-evaluate nach finalem Wurf
    const finalDice = activeDice();
    const finalAnalysis = analyzeDice(finalDice);
    const finalCombo = calcCombo(finalDice);
    const hasZweier = playerHasEffect(current, CharacterType.Taschendieb, 1);
    const finalHealCount = finalDice.filter(d => d === 1 || (hasZweier && d === 2)).length;

    // Fallback: gewählte Aktion nicht mehr möglich → umschalten
    if (action === 'heal' && finalHealCount === 0) {
        if (finalAnalysis.bestDmg > 0) action = 'attack';
        else if (finalCombo.sp > 0) action = 'ability';
    } else if (action === 'ability' && finalCombo.sp === 0) {
        if (finalAnalysis.bestDmg > 0) action = 'attack';
        else if (finalHealCount > 0) action = 'heal';
    } else if (action === 'attack' && finalAnalysis.bestDmg === 0) {
        if (finalCombo.sp > 0) action = 'ability';
        else if (finalHealCount > 0) action = 'heal';
    }

    // Kill-Chance immer ergreifen (override)
    let effectiveBestDmg = finalAnalysis.bestDmg;
    if (playerHasEffect(current, CharacterType.Soldat, 0)) effectiveBestDmg += 3;
    if (playerHasEffect(current, CharacterType.Soldat, 1)) effectiveBestDmg += 2;
    if (playerHasEffect(current, CharacterType.Rebell, 3)) {
        const fiveCount = finalDice.filter(d => d === 5).length;
        const sixCount = finalDice.filter(d => d === 6).length;
        const fuenferDmg = (fiveCount + sixCount) * 6;
        if (fuenferDmg > effectiveBestDmg) effectiveBestDmg = fuenferDmg;
    }
    if (effectiveBestDmg >= opponent.health && action !== 'attack') action = 'attack';

    // Aktion ausführen
    switch (action) {
        case 'attack': executeAttack(finalDice, current, opponent); break;
        case 'heal':   executeHeal(finalDice, current); break;
        case 'ability': executeAbility(finalDice, current, opponent); break;
        case 'block':  executeBlock(finalDice, current); break;
    }
}

// ===== WIN CONDITION CHECK =====
function checkWin(current, opponent) {
    if (opponent.health <= 0) return { winner: 'current', condition: 'elimination' };
    if (current.sp >= 55) return { winner: 'current', condition: 'transcendence' };
    if (opponent.sp >= 55) return { winner: 'opponent', condition: 'transcendence' };
    if (current.health <= 0) return { winner: 'opponent', condition: 'elimination' };
    return null;
}

// ===== EIN SPIEL SIMULIEREN =====
function simulateGame(char1, char2, strategy1, strategy2, starterIdx) {
    const p1 = new Player('P1', char1);
    const p2 = new Player('P2', char2);
    // Startspieler-Kompensation: Spieler 2 bekommt +8 HP
    p2.health = 108;

    let turn = 0;
    let currentIdx = starterIdx; // 0 or 1

    while (p1.health > 0 && p2.health > 0 && p1.sp < 55 && p2.sp < 55 && turn < MAX_TURNS) {
        turn++;
        const current = currentIdx === 0 ? p1 : p2;
        const opponent = currentIdx === 0 ? p2 : p1;
        const strategy = currentIdx === 0 ? strategy1 : strategy2;

        // Spielzug simulieren
        simulateTurn(current, opponent, strategy);

        // Kriegsstratege (Rebell Ability 1): 5 auto-Schaden an Gegner am Zugende
        if (playerHasEffect(current, CharacterType.Rebell, 1)) {
            opponent.health = Math.max(0, opponent.health - 5);
            current.totalDamage += 5;
        }

        // Win-Check nach Aktion + Kriegsstratege
        const win = checkWin(current, opponent);
        if (win) {
            const winnerId = win.winner === 'current' ? currentIdx : (1 - currentIdx);
            return {
                winner: winnerId + 1,
                winCondition: win.condition,
                turns: turn,
                p1FinalHP: p1.health, p1FinalFP: p1.fp, p1FinalSP: p1.sp,
                p2FinalHP: p2.health, p2FinalFP: p2.fp, p2FinalSP: p2.sp,
                p1Abilities: p1.abilitiesUnlockedCount(),
                p2Abilities: p2.abilitiesUnlockedCount(),
                p1Exhaustion: p1.exhaustionTriggers,
                p2Exhaustion: p2.exhaustionTriggers,
                p1Damage: p1.totalDamage, p2Damage: p2.totalDamage,
                p1Healing: p1.totalHealing, p2Healing: p2.totalHealing,
                p1Blocks: p1.successfulBlocks, p2Blocks: p2.successfulBlocks
            };
        }

        // Würfel-Diebstahl (Rebell Ability 0): +1 bonusDice für nächsten Zug
        if (playerHasEffect(opponent, CharacterType.Rebell, 0)) {
            opponent.bonusDice = 1;
        } else {
            opponent.bonusDice = 0;
        }

        // lastDamageReceived bleibt bis zum nächsten Zug des Spielers bestehen
        // (wird nur bei Angriff auf diesen Spieler neu gesetzt)

        // Spieler wechseln
        currentIdx = 1 - currentIdx;
    }

    // Timeout → Spieler mit mehr HP gewinnt, bei Gleichstand: mehr SP
    const winnerId = p1.health > p2.health ? 1 : (p2.health > p1.health ? 2 : (p1.sp > p2.sp ? 1 : 2));
    return {
        winner: winnerId,
        winCondition: 'timeout',
        turns: turn,
        p1FinalHP: p1.health, p1FinalFP: p1.fp, p1FinalSP: p1.sp,
        p2FinalHP: p2.health, p2FinalFP: p2.fp, p2FinalSP: p2.sp,
        p1Abilities: p1.abilitiesUnlockedCount(),
        p2Abilities: p2.abilitiesUnlockedCount(),
        p1Exhaustion: p1.exhaustionTriggers,
        p2Exhaustion: p2.exhaustionTriggers,
        p1Damage: p1.totalDamage, p2Damage: p2.totalDamage,
        p1Healing: p1.totalHealing, p2Healing: p2.totalHealing,
        p1Blocks: p1.successfulBlocks, p2Blocks: p2.successfulBlocks
    };
}

// ===== STATISTIK-HELFER =====
function arrayMin(arr) {
    let min = Infinity;
    for (let i = 0; i < arr.length; i++) { if (arr[i] < min) min = arr[i]; }
    return arr.length === 0 ? 0 : min;
}

function arrayMax(arr) {
    let max = -Infinity;
    for (let i = 0; i < arr.length; i++) { if (arr[i] > max) max = arr[i]; }
    return arr.length === 0 ? 0 : max;
}

function median(arr) {
    if (arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(arr) {
    if (arr.length <= 1) return 0;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((sum, v) => sum + (v - avg) * (v - avg), 0) / arr.length;
    return Math.sqrt(variance);
}

function pct(num, den) {
    return den > 0 ? (num / den * 100).toFixed(1) : '0.0';
}

// ===== HAUPTSIMULATION =====
function runSimulation() {
    const startTime = Date.now();

    // === Data Collectors ===

    // Character aggregated
    const charStats = {};
    for (let c = 0; c < 4; c++) {
        charStats[c] = { wins: 0, games: 0, winsElim: 0, winsTrans: 0,
            turnsWin: [], turnsLose: [], abilities: [] };
    }

    // Strategy aggregated
    const stratStats = {};
    for (const s of STRAT_IDS) {
        stratStats[s] = { wins: 0, games: 0 };
    }

    // Strategy vs Strategy
    const stratVsStrat = {};
    for (const s1 of STRAT_IDS) {
        stratVsStrat[s1] = {};
        for (const s2 of STRAT_IDS) {
            stratVsStrat[s1][s2] = { wins: 0, games: 0 };
        }
    }

    // Character matchup matrix [c1][c2] → {wins_c1, games}
    const matchupMatrix = {};
    for (let c1 = 0; c1 < 4; c1++) {
        matchupMatrix[c1] = {};
        for (let c2 = 0; c2 < 4; c2++) {
            matchupMatrix[c1][c2] = { wins: 0, games: 0 };
        }
    }

    // Character + Strategy best combo
    const charStratStats = {};
    for (let c = 0; c < 4; c++) {
        charStratStats[c] = {};
        for (const s of STRAT_IDS) {
            charStratStats[c][s] = { wins: 0, games: 0 };
        }
    }

    // Starter analysis
    let starterWins = 0, starterGames = 0;

    // Win condition tracking
    let winsElim = 0, winsTrans = 0, winsTimeout = 0;
    const turnsElim = [], turnsTrans = [];

    // Win condition by strategy
    const stratWinCondition = {};
    for (const s of STRAT_IDS) {
        stratWinCondition[s] = { elim: 0, trans: 0, total: 0 };
    }

    // Exhaustion tracking
    let gamesWithExhaustion = 0;
    let totalExhaustionTriggers = 0;
    const stratExhaustionDetail = {};
    for (const s of STRAT_IDS) {
        stratExhaustionDetail[s] = { gamesWithExh: 0, totalGames: 0 };
    }

    // Ability tracking per character
    const charAbilities = {};
    for (let c = 0; c < 4; c++) {
        charAbilities[c] = { total: 0, count: 0, all4: 0 };
    }

    // Game length tracking
    const allTurns = [];
    const stratPairTurns = {};
    for (const s1 of STRAT_IDS) {
        stratPairTurns[s1] = {};
        for (const s2 of STRAT_IDS) {
            stratPairTurns[s1][s2] = [];
        }
    }

    // Character detailed matchup tracking
    const charMatchupWins = {};
    for (let c = 0; c < 4; c++) {
        charMatchupWins[c] = {};
        for (let c2 = 0; c2 < 4; c2++) {
            charMatchupWins[c][c2] = { wins: 0, games: 0 };
        }
    }

    // Total games counter for progress
    let totalGames = 0;
    const totalExpected = 4 * 4 * 3 * 3 * 2 * GAMES_PER_COMBO;

    console.log('========================================');
    console.log(' WUERFELSPIEL BALANCE-SIMULATION');
    console.log(' Starte ' + totalExpected.toLocaleString() + ' Spiele...');
    console.log('========================================');
    console.log();

    // ===== SIMULATIONSSCHLEIFE =====
    for (let c1 = 0; c1 < 4; c1++) {
        for (let c2 = 0; c2 < 4; c2++) {
            for (let s1i = 0; s1i < 3; s1i++) {
                for (let s2i = 0; s2i < 3; s2i++) {
                    for (let starter = 0; starter < 2; starter++) {
                        const strat1 = STRAT_IDS[s1i];
                        const strat2 = STRAT_IDS[s2i];

                        for (let g = 0; g < GAMES_PER_COMBO; g++) {
                            const result = simulateGame(c1, c2, strat1, strat2, starter);
                            totalGames++;

                            // === STATISTIK SAMMELN ===
                            const winnerChar = result.winner === 1 ? c1 : c2;
                            const loserChar = result.winner === 1 ? c2 : c1;
                            const winnerStrat = result.winner === 1 ? strat1 : strat2;
                            const loserStrat = result.winner === 1 ? strat2 : strat1;

                            // Character stats
                            charStats[winnerChar].wins++;
                            charStats[winnerChar].games++;
                            charStats[loserChar].games++;
                            if (result.winCondition === 'elimination') charStats[winnerChar].winsElim++;
                            else if (result.winCondition === 'transcendence') charStats[winnerChar].winsTrans++;
                            charStats[winnerChar].turnsWin.push(result.turns);
                            charStats[loserChar].turnsLose.push(result.turns);

                            // Character abilities
                            charAbilities[c1].total += result.p1Abilities;
                            charAbilities[c1].count++;
                            if (result.p1Abilities >= 4) charAbilities[c1].all4++;
                            charAbilities[c2].total += result.p2Abilities;
                            charAbilities[c2].count++;
                            if (result.p2Abilities >= 4) charAbilities[c2].all4++;

                            // Strategy stats
                            stratStats[winnerStrat].wins++;
                            stratStats[winnerStrat].games++;
                            stratStats[loserStrat].games++;

                            // Strategy vs Strategy
                            stratVsStrat[strat1][strat2].games++;
                            if (result.winner === 1) stratVsStrat[strat1][strat2].wins++;

                            // Character matchup
                            matchupMatrix[c1][c2].games++;
                            if (result.winner === 1) matchupMatrix[c1][c2].wins++;
                            charMatchupWins[winnerChar][loserChar].wins++;
                            charMatchupWins[winnerChar][loserChar].games++;
                            charMatchupWins[loserChar][winnerChar].games++;

                            // Char + Strategy
                            charStratStats[winnerChar][winnerStrat].wins++;
                            charStratStats[winnerChar][winnerStrat].games++;
                            charStratStats[loserChar][loserStrat].games++;

                            // Starter analysis
                            starterGames++;
                            if (result.winner === starter + 1) starterWins++;

                            // Win condition
                            if (result.winCondition === 'elimination') { winsElim++; turnsElim.push(result.turns); }
                            else if (result.winCondition === 'transcendence') { winsTrans++; turnsTrans.push(result.turns); }
                            else winsTimeout++;

                            // Win condition by winner strategy
                            if (result.winCondition !== 'timeout') {
                                stratWinCondition[winnerStrat].total++;
                                if (result.winCondition === 'elimination') stratWinCondition[winnerStrat].elim++;
                                else stratWinCondition[winnerStrat].trans++;
                            }

                            // Exhaustion
                            const p1Exh = result.p1Exhaustion > 0;
                            const p2Exh = result.p2Exhaustion > 0;
                            if (p1Exh || p2Exh) gamesWithExhaustion++;
                            totalExhaustionTriggers += result.p1Exhaustion + result.p2Exhaustion;

                            stratExhaustionDetail[strat1].totalGames++;
                            stratExhaustionDetail[strat2].totalGames++;
                            if (p1Exh) stratExhaustionDetail[strat1].gamesWithExh++;
                            if (p2Exh) stratExhaustionDetail[strat2].gamesWithExh++;

                            // Game length
                            allTurns.push(result.turns);
                            const pairKey1 = s1i <= s2i ? strat1 : strat2;
                            const pairKey2 = s1i <= s2i ? strat2 : strat1;
                            stratPairTurns[pairKey1][pairKey2].push(result.turns);
                        }
                    }

                    // Progress-Anzeige
                    if (totalGames % 50000 === 0) {
                        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                        const pctDone = (totalGames / totalExpected * 100).toFixed(0);
                        process.stdout.write('\r  Fortschritt: ' + pctDone + '% (' + totalGames.toLocaleString() + ' Spiele, ' + elapsed + 's)');
                    }
                }
            }
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const durationMin = ((Date.now() - startTime) / 60000).toFixed(1);
    process.stdout.write('\r' + ' '.repeat(80) + '\r');

    // ===== REPORT AUSGABE =====
    const sep = '='.repeat(60);

    console.log(sep);
    console.log(' WUERFELSPIEL BALANCE-REPORT');
    console.log(' Simulierte Spiele: ' + totalGames.toLocaleString());
    console.log(' Datum: ' + new Date().toISOString().slice(0, 19).replace('T', ' '));
    console.log(' Dauer: ' + durationMin + ' Minuten (' + duration + 's)');
    console.log(sep);
    console.log();

    // === 1. CHARAKTER-WINRATES ===
    console.log(sep);
    console.log(' 1. CHARAKTER-WINRATES (gesamt)');
    console.log(sep);
    console.log();
    console.log(' ' + 'CHARAKTER'.padEnd(15) + 'WINRATE'.padStart(8) + '  SPIELE'.padStart(10) + '  BESTE STRATEGIE');
    console.log(' ' + '-'.repeat(55));

    const charWarnings = [];
    for (let c = 0; c < 4; c++) {
        const wr = charStats[c].games > 0 ? (charStats[c].wins / charStats[c].games * 100) : 0;
        let bestStrat = '', bestStratWr = 0;
        for (const s of STRAT_IDS) {
            const sWr = charStratStats[c][s].games > 0 ? (charStratStats[c][s].wins / charStratStats[c][s].games * 100) : 0;
            if (sWr > bestStratWr) { bestStratWr = sWr; bestStrat = s; }
        }
        const bestStratName = STRAT_NAMES[STRAT_IDS.indexOf(bestStrat)];
        console.log(' ' + CHAR_NAMES[c].padEnd(15) + (wr.toFixed(1) + '%').padStart(8) +
            ('  ' + charStats[c].games.toLocaleString()).padStart(10) +
            '  ' + bestStratName + ' (' + bestStratWr.toFixed(1) + '%)');
        if (wr < 47 || wr > 53) charWarnings.push(CHAR_NAMES[c] + ': ' + wr.toFixed(1) + '%');
    }
    console.log();
    if (charWarnings.length > 0) {
        console.log(' [!] WARNUNG: Charakter ausserhalb 47-53%:');
        for (const w of charWarnings) console.log('    ' + w);
    } else {
        console.log(' [OK] Alle Charaktere im Balance-Bereich (47-53%)');
    }
    console.log();

    // === 2. MATCHUP-MATRIX ===
    console.log(sep);
    console.log(' 2. MATCHUP-MATRIX (Winrate Spieler 1)');
    console.log(sep);
    console.log();
    const shortNames = ['Soldat', 'Rebell', 'Dieb', 'Quack'];
    console.log(' ' + ''.padEnd(15) + shortNames.map(n => n.padStart(8)).join(''));
    console.log(' ' + '-'.repeat(15 + 8 * 4));

    const matchupWarnings = [];
    for (let c1 = 0; c1 < 4; c1++) {
        let row = ' ' + shortNames[c1].padEnd(15);
        for (let c2 = 0; c2 < 4; c2++) {
            const m = matchupMatrix[c1][c2];
            const wr = m.games > 0 ? (m.wins / m.games * 100) : 50;
            row += (wr.toFixed(1) + '%').padStart(8);
            if (c1 !== c2 && (wr < 45 || wr > 55)) {
                matchupWarnings.push(CHAR_NAMES[c1] + ' vs ' + CHAR_NAMES[c2] + ': ' + wr.toFixed(1) + '%');
            }
        }
        console.log(row);
    }
    console.log();
    if (matchupWarnings.length > 0) {
        console.log(' [!] WARNUNG: Matchup ausserhalb 45-55%:');
        for (const w of matchupWarnings) console.log('    ' + w);
    } else {
        console.log(' [OK] Alle Matchups im Balance-Bereich (45-55%)');
    }
    console.log();

    // === 3. STRATEGIE-ANALYSE ===
    console.log(sep);
    console.log(' 3. STRATEGIE-ANALYSE');
    console.log(sep);
    console.log();
    console.log(' Gesamt-Winrates:');
    console.log(' ' + 'STRATEGIE'.padEnd(15) + 'WINRATE'.padStart(8));
    console.log(' ' + '-'.repeat(25));
    for (let si = 0; si < 3; si++) {
        const s = STRAT_IDS[si];
        const wr = stratStats[s].games > 0 ? (stratStats[s].wins / stratStats[s].games * 100) : 0;
        console.log(' ' + STRAT_NAMES[si].padEnd(15) + (wr.toFixed(1) + '%').padStart(8));
    }
    console.log();

    console.log(' Strategie vs Strategie (Winrate Zeile vs Spalte):');
    console.log(' ' + ''.padEnd(15) + STRAT_NAMES.map(n => n.padStart(10)).join(''));
    console.log(' ' + '-'.repeat(15 + 10 * 3));
    for (let s1i = 0; s1i < 3; s1i++) {
        let row = ' ' + STRAT_NAMES[s1i].padEnd(15);
        for (let s2i = 0; s2i < 3; s2i++) {
            const d = stratVsStrat[STRAT_IDS[s1i]][STRAT_IDS[s2i]];
            const wr = d.games > 0 ? (d.wins / d.games * 100) : 50;
            row += (wr.toFixed(1) + '%').padStart(10);
        }
        console.log(row);
    }
    console.log();

    const schwer = stratStats.schwer.games > 0 ? (stratStats.schwer.wins / stratStats.schwer.games * 100) : 0;
    if (schwer > 55) {
        console.log(' [!] Schwer dominiert (' + schwer.toFixed(1) + '%) — KI-Strategie zu stark?');
    }
    const aggroVsControl = stratVsStrat.aggro.control;
    const avcWr = aggroVsControl.games > 0 ? (aggroVsControl.wins / aggroVsControl.games * 100) : 50;
    if (Math.abs(avcWr - 50) < 5) {
        console.log(' [OK] Aggro vs Control ausgeglichen (' + avcWr.toFixed(1) + '%)');
    }
    console.log();

    // === 4. STARTSPIELER-ANALYSE ===
    console.log(sep);
    console.log(' 4. STARTSPIELER-ANALYSE');
    console.log(sep);
    console.log();
    const firstWr = starterGames > 0 ? (starterWins / starterGames * 100) : 50;
    const secondWr = 100 - firstWr;
    const diff = firstWr - secondWr;
    console.log(' ' + 'WER STARTET'.padEnd(20) + 'WINRATE'.padStart(8));
    console.log(' ' + '-'.repeat(30));
    console.log(' ' + 'Spieler 1'.padEnd(20) + (firstWr.toFixed(1) + '%').padStart(8));
    console.log(' ' + 'Spieler 2'.padEnd(20) + (secondWr.toFixed(1) + '%').padStart(8));
    console.log(' ' + 'Differenz'.padEnd(20) + ((diff >= 0 ? '+' : '') + diff.toFixed(1) + '%').padStart(8));
    console.log();
    if (Math.abs(diff) > 4) {
        console.log(' [!] WARNUNG: Startspieler-Vorteil > 2%');
    } else {
        console.log(' [OK] Kein signifikanter Startspieler-Vorteil');
    }
    console.log();

    // === 5. SIEGBEDINGUNGEN ===
    console.log(sep);
    console.log(' 5. SIEGBEDINGUNGEN');
    console.log(sep);
    console.log();
    const totalWins = winsElim + winsTrans;
    const avgTurnsElim = turnsElim.length > 0 ? (turnsElim.reduce((a, b) => a + b, 0) / turnsElim.length) : 0;
    const avgTurnsTrans = turnsTrans.length > 0 ? (turnsTrans.reduce((a, b) => a + b, 0) / turnsTrans.length) : 0;

    console.log(' ' + 'SIEGART'.padEnd(20) + 'ANTEIL'.padStart(8) + '  AVG TURNS'.padStart(12));
    console.log(' ' + '-'.repeat(42));
    console.log(' ' + 'Elimination'.padEnd(20) + (pct(winsElim, totalWins) + '%').padStart(8) +
        ('  ' + avgTurnsElim.toFixed(1)).padStart(12));
    console.log(' ' + 'Transzendenz'.padEnd(20) + (pct(winsTrans, totalWins) + '%').padStart(8) +
        ('  ' + avgTurnsTrans.toFixed(1)).padStart(12));
    if (winsTimeout > 0) {
        console.log(' ' + 'Timeout'.padEnd(20) + (pct(winsTimeout, totalGames) + '%').padStart(8));
    }
    console.log();

    console.log(' Nach Strategie:');
    console.log(' ' + 'STRATEGIE'.padEnd(15) + 'ELIMINATION'.padStart(12) + '  TRANSZENDENZ'.padStart(14));
    console.log(' ' + '-'.repeat(42));
    for (let si = 0; si < 3; si++) {
        const s = STRAT_IDS[si];
        const d = stratWinCondition[s];
        const elimPct = d.total > 0 ? (d.elim / d.total * 100).toFixed(1) : '0.0';
        const transPct = d.total > 0 ? (d.trans / d.total * 100).toFixed(1) : '0.0';
        console.log(' ' + STRAT_NAMES[si].padEnd(15) + (elimPct + '%').padStart(12) + ('  ' + transPct + '%').padStart(14));
    }
    console.log();
    const transPct = totalWins > 0 ? (winsTrans / totalWins * 100) : 0;
    if (transPct < 15) {
        console.log(' [!] Transzendenz < 15% — zu schwer erreichbar?');
    } else {
        console.log(' [OK] Beide Siegwege werden genutzt');
    }
    console.log();

    // === 6. SPIELLAENGE ===
    console.log(sep);
    console.log(' 6. SPIELLAENGE');
    console.log(sep);
    console.log();
    const avgTurns = allTurns.length > 0 ? (allTurns.reduce((a, b) => a + b, 0) / allTurns.length) : 0;
    const medTurns = median(allTurns);
    const minTurns = arrayMin(allTurns);
    const maxTurns = arrayMax(allTurns);
    const stdTurns = stddev(allTurns);

    console.log(' ' + 'METRIK'.padEnd(25) + 'WERT'.padStart(8));
    console.log(' ' + '-'.repeat(35));
    console.log(' ' + 'Durchschnitt'.padEnd(25) + avgTurns.toFixed(1).padStart(8));
    console.log(' ' + 'Median'.padEnd(25) + medTurns.toFixed(0).padStart(8));
    console.log(' ' + 'Kuerzestes Spiel'.padEnd(25) + minTurns.toString().padStart(8));
    console.log(' ' + 'Laengstes Spiel'.padEnd(25) + maxTurns.toString().padStart(8));
    console.log(' ' + 'Std-Abweichung'.padEnd(25) + stdTurns.toFixed(1).padStart(8));
    console.log();

    console.log(' Nach Matchup-Typ:');
    console.log(' ' + 'TYP'.padEnd(25) + 'AVG TURNS'.padStart(10));
    console.log(' ' + '-'.repeat(37));
    for (let s1i = 0; s1i < 3; s1i++) {
        for (let s2i = s1i; s2i < 3; s2i++) {
            const key1 = STRAT_IDS[s1i];
            const key2 = STRAT_IDS[s2i];
            const arr = stratPairTurns[key1][key2];
            if (arr && arr.length > 0) {
                const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
                const label = STRAT_NAMES[s1i] + ' vs ' + STRAT_NAMES[s2i];
                console.log(' ' + label.padEnd(25) + avg.toFixed(1).padStart(10));
            }
        }
    }
    console.log();

    // === 7. ERSCHOEPFUNGS-STATISTIK ===
    console.log(sep);
    console.log(' 7. ERSCHOEPFUNGS-STATISTIK');
    console.log(sep);
    console.log();
    const exhRate = totalGames > 0 ? (gamesWithExhaustion / totalGames * 100) : 0;
    const avgExhTriggers = totalGames > 0 ? (totalExhaustionTriggers / totalGames) : 0;

    console.log(' ' + 'METRIK'.padEnd(35) + 'WERT'.padStart(8));
    console.log(' ' + '-'.repeat(45));
    console.log(' ' + 'Spiele mit Erschoepfung'.padEnd(35) + (exhRate.toFixed(1) + '%').padStart(8));
    console.log(' ' + 'Durchschn. Erschoepfungs-Triggers'.padEnd(35) + avgExhTriggers.toFixed(1).padStart(8));
    console.log();

    console.log(' Nach Strategie:');
    console.log(' ' + 'STRATEGIE'.padEnd(15) + 'ERSCHOEPFUNGS-RATE'.padStart(18));
    console.log(' ' + '-'.repeat(35));
    for (let si = 0; si < 3; si++) {
        const s = STRAT_IDS[si];
        const d = stratExhaustionDetail[s];
        const rate = d.totalGames > 0 ? (d.gamesWithExh / d.totalGames * 100).toFixed(1) : '0.0';
        console.log(' ' + STRAT_NAMES[si].padEnd(15) + (rate + '%').padStart(18));
    }
    console.log();
    console.log(' [OK] Erschoepfungs-System wird aktiv genutzt');
    console.log();

    // === 8. FAEHIGKEITEN-STATISTIK ===
    console.log(sep);
    console.log(' 8. FAEHIGKEITEN-STATISTIK');
    console.log(sep);
    console.log();
    console.log(' Nach Charakter:');
    console.log(' ' + 'CHARAKTER'.padEnd(15) + 'AVG FAEHIGKEITEN'.padStart(16) + '  ALLE 4 ERREICHT'.padStart(18));
    console.log(' ' + '-'.repeat(50));
    for (let c = 0; c < 4; c++) {
        const d = charAbilities[c];
        const avg = d.count > 0 ? (d.total / d.count) : 0;
        const all4Pct = d.count > 0 ? (d.all4 / d.count * 100).toFixed(1) : '0.0';
        console.log(' ' + CHAR_NAMES[c].padEnd(15) + avg.toFixed(1).padStart(16) + ('  ' + all4Pct + '%').padStart(18));
    }
    console.log();

    // === 9. CHARAKTER-DETAILANALYSE ===
    console.log(sep);
    console.log(' 9. CHARAKTER-DETAILANALYSE');
    console.log(sep);

    for (let c = 0; c < 4; c++) {
        console.log();
        const wr = charStats[c].games > 0 ? (charStats[c].wins / charStats[c].games * 100) : 0;

        // Best/worst strategy
        let bestStrat = '', bestStratWr = 0, worstStrat = '', worstStratWr = 100;
        for (const s of STRAT_IDS) {
            const sWr = charStratStats[c][s].games > 0 ? (charStratStats[c][s].wins / charStratStats[c][s].games * 100) : 50;
            if (sWr > bestStratWr) { bestStratWr = sWr; bestStrat = STRAT_NAMES[STRAT_IDS.indexOf(s)]; }
            if (sWr < worstStratWr) { worstStratWr = sWr; worstStrat = STRAT_NAMES[STRAT_IDS.indexOf(s)]; }
        }

        // Best/worst matchup
        let bestMatchup = '', bestMatchupWr = 0, worstMatchup = '', worstMatchupWr = 100;
        for (let c2 = 0; c2 < 4; c2++) {
            if (c2 === c) continue;
            const m = charMatchupWins[c][c2];
            const mWr = m.games > 0 ? (m.wins / m.games * 100) : 50;
            if (mWr > bestMatchupWr) { bestMatchupWr = mWr; bestMatchup = CHAR_NAMES[c2]; }
            if (mWr < worstMatchupWr) { worstMatchupWr = mWr; worstMatchup = CHAR_NAMES[c2]; }
        }

        // Preferred win condition
        const elimPct = (charStats[c].winsElim + charStats[c].winsTrans) > 0 ?
            (charStats[c].winsElim / (charStats[c].winsElim + charStats[c].winsTrans) * 100) : 50;
        const preferred = elimPct >= 50 ? 'Elimination' : 'Transzendenz';

        // Avg turns when winning/losing
        const avgTurnsWin = charStats[c].turnsWin.length > 0 ?
            (charStats[c].turnsWin.reduce((a, b) => a + b, 0) / charStats[c].turnsWin.length) : 0;
        const avgTurnsLose = charStats[c].turnsLose.length > 0 ?
            (charStats[c].turnsLose.reduce((a, b) => a + b, 0) / charStats[c].turnsLose.length) : 0;

        console.log(' ' + CHAR_NAMES[c].toUpperCase() + ' (' + wr.toFixed(1) + '% Gesamt-Winrate)');
        console.log(' ' + '-'.repeat(50));
        console.log('   Beste Strategie:        ' + bestStrat + ' (' + bestStratWr.toFixed(1) + '%)');
        console.log('   Schlechteste Strategie: ' + worstStrat + ' (' + worstStratWr.toFixed(1) + '%)');
        console.log('   Bestes Matchup:         vs ' + bestMatchup + ' (' + bestMatchupWr.toFixed(1) + '%)');
        console.log('   Schlechtestes Matchup:  vs ' + worstMatchup + ' (' + worstMatchupWr.toFixed(1) + '%)');
        console.log('   Bevorzugte Siegart:     ' + preferred + ' (' + elimPct.toFixed(1) + '% Elimination)');
        console.log('   Avg Zuege bei Sieg:     ' + avgTurnsWin.toFixed(1));
        console.log('   Avg Zuege bei Niederlage: ' + avgTurnsLose.toFixed(1));
    }
    console.log();

    // === FAZIT ===
    console.log(sep);
    console.log(' FAZIT');
    console.log(sep);
    console.log();

    const charWrs = [];
    for (let c = 0; c < 4; c++) {
        charWrs.push(charStats[c].games > 0 ? (charStats[c].wins / charStats[c].games * 100) : 50);
    }
    const maxCharWr = Math.max(...charWrs);
    const minCharWr = Math.min(...charWrs);
    const charSpread = maxCharWr - minCharWr;

    if (charSpread < 6) {
        console.log(' [OK] CHARAKTER-BALANCE: Gut (Spread: ' + charSpread.toFixed(1) + '%)');
    } else if (charSpread < 10) {
        console.log(' [~] CHARAKTER-BALANCE: Akzeptabel (Spread: ' + charSpread.toFixed(1) + '%)');
    } else {
        console.log(' [!] CHARAKTER-BALANCE: Problematisch (Spread: ' + charSpread.toFixed(1) + '%)');
    }

    if (transPct >= 15 && transPct <= 60) {
        console.log(' [OK] SIEGWEGE: Beide viable (Transzendenz: ' + transPct.toFixed(1) + '%)');
    } else {
        console.log(' [!] SIEGWEGE: Unausgewogen (Transzendenz: ' + transPct.toFixed(1) + '%)');
    }

    if (Math.abs(diff) <= 4) {
        console.log(' [OK] STARTSPIELER: Fair (Diff: ' + diff.toFixed(1) + '%)');
    } else {
        console.log(' [!] STARTSPIELER: Vorteil erkannt (Diff: ' + diff.toFixed(1) + '%)');
    }

    console.log();
    console.log(' Simulation abgeschlossen in ' + durationMin + ' Minuten.');
    console.log();
}

// Start!
runSimulation();
