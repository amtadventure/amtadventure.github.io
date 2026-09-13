"use strict";

/*
 * AMT ADVENTURE
 * Core HTML5 game engine
 *
 * Reward flow:
 * GAMEPLAY -> LEDGER -> CLAIM -> ON-CHAIN
 *
 * The ledger functions below are intentionally local for the
 * first gameplay build. Real AMT settlement should be handled
 * by the backend after validation.
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerHpBar = document.getElementById("playerHp");
const enemyHpBar = document.getElementById("enemyHp");

const playerHpText = document.getElementById("playerHpText");
const enemyHpText = document.getElementById("enemyHpText");

const amtBalance = document.getElementById("amtBalance");
const ledgerBalance = document.getElementById("ledgerBalance");

const battleReward = document.getElementById("battleReward");
const adventureReward = document.getElementById("adventureReward");

const stageNumber = document.getElementById("stageNumber");
const enemyName = document.getElementById("enemyName");
const battleMessage = document.getElementById("battleMessage");

const attackBtn = document.getElementById("attackBtn");
const abilityBtn = document.getElementById("abilityBtn");
const exploreBtn = document.getElementById("exploreBtn");
const claimBtn = document.getElementById("claimBtn");

const gameLog = document.getElementById("gameLog");

const attackStat = document.getElementById("attackStat");
const energyStat = document.getElementById("energyStat");


/* =========================================================
   GAME STATE
========================================================= */

const game = {
  player: {
    name: "Pioneer",
    pet: "Emberfang",
    level: 1,
    hp: 100,
    maxHp: 100,
    attack: 15,
    energy: 100,
    maxEnergy: 100
  },

  enemy: {
    name: "Wild Beast",
    hp: 100,
    maxHp: 100,
    attack: 8
  },

  stage: 1,

  ledger: {
    balance: 0,
    lifetime: 0,
    battleRewards: 0,
    adventureRewards: 0
  },

  battleActive: true,
  enemyDefeated: false,
  actionLocked: false
};


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  drawWorld();
}

window.addEventListener("resize", resizeCanvas);


/* =========================================================
   WORLD DRAWING
========================================================= */

function drawWorld() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.clearRect(0, 0, width, height);

  /* Sky */
  const sky = ctx.createLinearGradient(0, 0, 0, height);

  sky.addColorStop(0, "#122b4b");
  sky.addColorStop(0.48, "#183d42");
  sky.addColorStop(0.49, "#172d24");
  sky.addColorStop(1, "#07120d");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);


  /* Moon */
  ctx.beginPath();
  ctx.arc(width * 0.78, height * 0.18, 34, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(255, 244, 190, 0.88)";
  ctx.shadowBlur = 25;
  ctx.shadowColor = "rgba(255, 230, 150, .65)";
  ctx.fill();

  ctx.shadowBlur = 0;


  /* Mountains */
  ctx.fillStyle = "#10252a";

  ctx.beginPath();
  ctx.moveTo(0, height * 0.55);
  ctx.lineTo(width * 0.22, height * 0.27);
  ctx.lineTo(width * 0.40, height * 0.55);
  ctx.lineTo(width * 0.60, height * 0.25);
  ctx.lineTo(width * 0.82, height * 0.55);
  ctx.lineTo(width, height * 0.32);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();

  ctx.fill();


  /* Ground */
  ctx.fillStyle = "#0a1812";

  ctx.fillRect(0, height * 0.72, width, height * 0.28);


  /* Ground lines */
  ctx.strokeStyle = "rgba(73, 160, 104, .18)";
  ctx.lineWidth = 2;

  for (let i = 0; i < 9; i++) {
    const y = height * 0.73 + i * 18;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + 5);
    ctx.stroke();
  }


  /* Decorative crystals */
  drawCrystal(width * 0.12, height * 0.72, 18);
  drawCrystal(width * 0.88, height * 0.70, 22);


  /* Player */
  drawPet(width * 0.25, height * 0.69, 1);


  /* Enemy */
  if (!game.enemyDefeated) {
    drawEnemy(width * 0.73, height * 0.69);
  }
}


function drawCrystal(x, y, size) {
  ctx.save();

  ctx.translate(x, y);

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.55, -size * 0.25);
  ctx.lineTo(size * 0.35, size);
  ctx.lineTo(-size * 0.35, size);
  ctx.lineTo(-size * 0.55, -size * 0.25);
  ctx.closePath();

  ctx.fillStyle = "rgba(64, 218, 255, .35)";
  ctx.fill();

  ctx.strokeStyle = "rgba(120, 240, 255, .65)";
  ctx.stroke();

  ctx.restore();
}


function drawPet(x, y, scale) {
  ctx.save();

  ctx.translate(x, y);
  ctx.scale(scale, scale);

  /* Shadow */
  ctx.beginPath();
  ctx.ellipse(0, 15, 52, 13, 0, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fill();


  /* Body */
  ctx.beginPath();
  ctx.ellipse(0, -20, 43, 48, 0, 0, Math.PI * 2);

  const bodyGradient = ctx.createLinearGradient(-30, -60, 30, 20);

  bodyGradient.addColorStop(0, "#ffdb62");
  bodyGradient.addColorStop(0.55, "#ef8f20");
  bodyGradient.addColorStop(1, "#8b3218");

  ctx.fillStyle = bodyGradient;
  ctx.fill();


  /* Head */
  ctx.beginPath();
  ctx.arc(0, -68, 36, 0, Math.PI * 2);

  ctx.fillStyle = "#f6a52c";
  ctx.fill();


  /* Ears */
  ctx.beginPath();
  ctx.moveTo(-28, -92);
  ctx.lineTo(-46, -124);
  ctx.lineTo(-9, -103);
  ctx.closePath();

  ctx.fillStyle = "#c95b20";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(28, -92);
  ctx.lineTo(46, -124);
  ctx.lineTo(9, -103);
  ctx.closePath();

  ctx.fillStyle = "#c95b20";
  ctx.fill();


  /* Eyes */
  ctx.fillStyle = "#07101a";

  ctx.beginPath();
  ctx.arc(-13, -72, 5, 0, Math.PI * 2);
  ctx.arc(13, -72, 5, 0, Math.PI * 2);
  ctx.fill();


  /* Fire core */
  ctx.beginPath();
  ctx.arc(0, -22, 10, 0, Math.PI * 2);

  ctx.fillStyle = "#ffd84a";
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#ff9d00";
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.restore();
}


function drawEnemy(x, y) {
  ctx.save();

  ctx.translate(x, y);

  /* Shadow */
  ctx.beginPath();
  ctx.ellipse(0, 17, 55, 14, 0, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(0,0,0,.4)";
  ctx.fill();


  /* Body */
  ctx.beginPath();
  ctx.ellipse(0, -22, 48, 51, 0, 0, Math.PI * 2);

  const gradient = ctx.createLinearGradient(-30, -60, 35, 20);

  gradient.addColorStop(0, "#8d95a6");
  gradient.addColorStop(0.5, "#50596b");
  gradient.addColorStop(1, "#252d3b");

  ctx.fillStyle = gradient;
  ctx.fill();


  /* Head */
  ctx.beginPath();
  ctx.arc(0, -70, 38, 0, Math.PI * 2);

  ctx.fillStyle = "#687286";
  ctx.fill();


  /* Horns */
  ctx.fillStyle = "#242a37";

  ctx.beginPath();
  ctx.moveTo(-23, -96);
  ctx.lineTo(-40, -126);
  ctx.lineTo(-5, -105);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(23, -96);
  ctx.lineTo(40, -126);
  ctx.lineTo(5, -105);
  ctx.closePath();
  ctx.fill();


  /* Eyes */
  ctx.fillStyle = "#ff405c";

  ctx.beginPath();
  ctx.arc(-13, -72, 5, 0, Math.PI * 2);
  ctx.arc(13, -72, 5, 0, Math.PI * 2);
  ctx.fill();


  ctx.restore();
}


/* =========================================================
   UI
========================================================= */

function updateUI() {
  const p = game.player;
  const e = game.enemy;

  playerHpBar.style.width =
    `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;

  enemyHpBar.style.width =
    `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;

  playerHpText.textContent =
    `${Math.max(0, p.hp)} / ${p.maxHp}`;

  enemyHpText.textContent =
    `${Math.max(0, e.hp)} / ${e.maxHp}`;

  amtBalance.textContent =
    game.ledger.balance.toFixed(2);

  ledgerBalance.textContent =
    `${game.ledger.balance.toFixed(2)} AMT`;

  battleReward.textContent =
    `${game.ledger.battleRewards.toFixed(2)} AMT`;

  adventureReward.textContent =
    `${game.ledger.adventureRewards.toFixed(2)} AMT`;

  stageNumber.textContent = game.stage;

  attackStat.textContent = p.attack;
  energyStat.textContent = p.energy;

  claimBtn.disabled = game.ledger.balance <= 0;

  drawWorld();
}


/* =========================================================
   GAME LOG
========================================================= */

function logMessage(message) {
  const entry = document.createElement("p");

  entry.textContent = message;

  gameLog.prepend(entry);

  while (gameLog.children.length > 8) {
    gameLog.removeChild(gameLog.lastChild);
  }
}


function setBattleMessage(message) {
  battleMessage.textContent = message;
}


/* =========================================================
   AMT LEDGER
========================================================= */

/*
 * This is the game-side ledger interface.
 *
 * Later:
 *   POST /api/game/reward
 *
 * The backend should validate the event and record the
 * actual reward in PostgreSQL.
 */

function addLedgerReward(amount, type) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  game.ledger.balance += amount;
  game.ledger.lifetime += amount;

  if (type === "battle") {
    game.ledger.battleRewards += amount;
  }

  if (type === "adventure") {
    game.ledger.adventureRewards += amount;
  }

  saveLocalGame();

  logMessage(`+${amount.toFixed(2)} AMT added to ledger.`);
  updateUI();
}


/* =========================================================
   PLAYER ATTACK
========================================================= */

function playerAttack() {
  if (!game.battleActive || game.actionLocked) {
    return;
  }

  game.actionLocked = true;

  const damage =
    game.player.attack +
    Math.floor(Math.random() * 8);

  game.enemy.hp -= damage;

  setBattleMessage(
    `${game.player.pet} dealt ${damage} damage!`
  );

  logMessage(
    `${game.player.pet} attacked for ${damage} damage.`
  );

  updateUI();

  if (game.enemy.hp <= 0) {
    enemyDefeated();
    return;
  }

  setTimeout(enemyAttack, 650);
}


/* =========================================================
   SPECIAL ABILITY
========================================================= */

function useAbility() {
  if (!game.battleActive || game.actionLocked) {
    return;
  }

  if (game.player.energy < 25) {
    setBattleMessage("Not enough energy.");
    logMessage("Ability failed: not enough energy.");
    return;
  }

  game.actionLocked = true;

  game.player.energy -= 25;

  const damage =
    game.player.attack * 2 +
    Math.floor(Math.random() * 10);

  game.enemy.hp -= damage;

  setBattleMessage(
    `${game.player.pet} unleashed Flame Burst!`
  );

  logMessage(
    `Flame Burst dealt ${damage} damage.`
  );

  updateUI();

  if (game.enemy.hp <= 0) {
    enemyDefeated();
    return;
  }

  setTimeout(enemyAttack, 650);
}


/* =========================================================
   ENEMY ATTACK
========================================================= */

function enemyAttack() {
  if (!game.battleActive) {
    return;
  }

  const damage =
    game.enemy.attack +
    Math.floor(Math.random() * 6);

  game.player.hp -= damage;

  setBattleMessage(
    `${game.enemy.name} attacked for ${damage}!`
  );

  logMessage(
    `${game.enemy.name} dealt ${damage} damage.`
  );

  if (game.player.hp <= 0) {
    playerDefeated();
    return;
  }

  /* Recover a little energy each turn */
  game.player.energy =
    Math.min(
      game.player.maxEnergy,
      game.player.energy + 8
    );

  game.actionLocked = false;

  updateUI();
}


/* =========================================================
   BATTLE WIN
========================================================= */

function enemyDefeated() {
  game.battleActive = false;
  game.enemyDefeated = true;

  game.actionLocked = true;

  const reward =
    5 + game.stage * 1.5;

  addLedgerReward(reward, "battle");

  setBattleMessage(
    `Victory! +${reward.toFixed(2)} AMT`
  );

  logMessage(
    `Stage ${game.stage} completed.`
  );

  attackBtn.disabled = true;
  abilityBtn.disabled = true;

  updateUI();
}


/* =========================================================
   PLAYER DEFEAT
========================================================= */

function playerDefeated() {
  game.battleActive = false;
  game.actionLocked = true;

  game.player.hp = 0;

  setBattleMessage(
    "Your pet has fallen. Recover and continue."
  );

  logMessage("Battle lost.");

  attackBtn.disabled = true;
  abilityBtn.disabled = true;

  updateUI();

  setTimeout(() => {
    recoverPlayer();
  }, 1800);
}


function recoverPlayer() {
  game.player.hp = game.player.maxHp;
  game.player.energy = game.player.maxEnergy;

  game.enemyDefeated = false;
  game.battleActive = true;
  game.actionLocked = false;

  attackBtn.disabled = false;
  abilityBtn.disabled = false;

  resetEnemy();

  setBattleMessage(
    "Your pet recovered. Continue the adventure!"
  );

  updateUI();
}


/* =========================================================
   EXPLORE
========================================================= */

function explore() {
  if (game.battleActive) {
    setBattleMessage(
      "Defeat the current enemy first."
    );

    return;
  }

  const reward =
    1 + Math.random() * 2;

  addLedgerReward(reward, "adventure");

  game.stage++;

  game.player.hp = game.player.maxHp;
  game.player.energy = game.player.maxEnergy;

  resetEnemy();

  game.battleActive = true;
  game.enemyDefeated = false;
  game.actionLocked = false;

  attackBtn.disabled = false;
  abilityBtn.disabled = false;

  setBattleMessage(
    `New area discovered! Stage ${game.stage}`
  );

  logMessage(
    `Exploration reward: +${reward.toFixed(2)} AMT`
  );

  updateUI();
}


/* =========================================================
   RESET ENEMY
========================================================= */

function resetEnemy() {
  const enemies = [
    "Wild Beast",
    "Shadow Fang",
    "Forest Ravager",
    "Crystal Claw",
    "Ancient Guardian"
  ];

  const index =
    (game.stage - 1) % enemies.length;

  const enemyLevel =
    Math.max(1, Math.floor((game.stage - 1) / 3) + 1);

  game.enemy.name = enemies[index];

  game.enemy.maxHp =
    100 + (game.stage - 1) * 18;

  game.enemy.hp =
    game.enemy.maxHp;

  game.enemy.attack =
    8 + (game.stage - 1) * 2;

  enemyName.textContent =
    game.enemy.name;

  const levelElement =
    enemyName.nextElementSibling;

  if (levelElement) {
    levelElement.textContent =
      `Lv. ${enemyLevel}`;
  }
}


/* =========================================================
   CLAIM
========================================================= */

/*
 * IMPORTANT:
 *
 * This function does NOT transfer real blockchain tokens yet.
 *
 * Production flow will be:
 *
 * 1. Player presses Claim
 * 2. Backend authenticates player
 * 3. Backend checks ledger
 * 4. Backend prevents duplicate claim
 * 5. Backend performs/requests on-chain settlement
 * 6. Transaction hash is recorded
 * 7. UI shows confirmed transaction
 */

function claimAMT() {
  const amount = game.ledger.balance;

  if (amount <= 0) {
    setBattleMessage("No AMT available to claim.");
    return;
  }

  setBattleMessage(
    `${amount.toFixed(2)} AMT ready for secure claim.`
  );

  logMessage(
    `Claim request prepared for ${amount.toFixed(2)} AMT.`
  );

  /*
   * Backend integration will replace this section.
   *
   * Example future endpoint:
   *
   * fetch("https://YOUR-AMT-BACKEND/api/game/claim", {
   *   method: "POST",
   *   headers: { "Content-Type": "application/json" },
   *   body: JSON.stringify({
   *     amount
   *   })
   * });
   */

  alert(
    `Claim system ready.\n\n` +
    `${amount.toFixed(2)} AMT is recorded in the game ledger.\n\n` +
    `On-chain settlement will be handled by the AMT backend.`
  );
}


/* =========================================================
   LOCAL SAVE
========================================================= */

function saveLocalGame() {
  try {
    localStorage.setItem(
      "amtAdventureLedger",
      JSON.stringify(game.ledger)
    );

    localStorage.setItem(
      "amtAdventureStage",
      String(game.stage)
    );
  } catch (error) {
    console.warn("Local save unavailable.");
  }
}


function loadLocalGame() {
  try {
    const ledger =
      localStorage.getItem("amtAdventureLedger");

    const stage =
      localStorage.getItem("amtAdventureStage");

    if (ledger) {
      const parsed = JSON.parse(ledger);

      if (parsed && typeof parsed === "object") {
        game.ledger.balance =
          Number(parsed.balance) || 0;

        game.ledger.lifetime =
          Number(parsed.lifetime) || 0;

        game.ledger.battleRewards =
          Number(parsed.battleRewards) || 0;

        game.ledger.adventureRewards =
          Number(parsed.adventureRewards) || 0;
      }
    }

    if (stage) {
      game.stage =
        Math.max(1, Number(stage) || 1);
    }
  } catch (error) {
    console.warn("Could not load local game data.");
  }
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

attackBtn.addEventListener(
  "click",
  playerAttack
);

abilityBtn.addEventListener(
  "click",
  useAbility
);

exploreBtn.addEventListener(
  "click",
  explore
);

claimBtn.addEventListener(
  "click",
  claimAMT
);


/* =========================================================
   START GAME
========================================================= */

function startGame() {
  loadLocalGame();

  resetEnemy();

  resizeCanvas();

  updateUI();

  logMessage(
    "AMT Adventure initialized."
  );

  logMessage(
    "Defeat enemies to earn AMT rewards."
  );

  setBattleMessage(
    "A wild creature appeared!"
  );
}

startGame();