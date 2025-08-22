const TIMEOUT_SECONDS = 120;
const ongoingFights = new Map();
const gameInstances = new Map();

module.exports = {
  config: {
    name: "fight",
    version: "1.0",
    author: "Shikai | Redwan",
    countDown: 10,
    role: 0,
    shortDescription: {
      vi: "",
      en: "Fight with your friends!",
    },
    longDescription: {
      vi: "",
      en: "Challenge your friends to a fight and see who wins!",
    },
    category: "fun",
    guide: "{prefix}fight @mention",
  },

  onStart: async function ({ event, message, api, usersData, args }) {
    const threadID = event.threadID;
    if (ongoingFights.has(threadID)) {
      return message.send("⚔️ A fight is already in progress in this group.");
    }

    const mention = Object.keys(event.mentions);
    if (mention.length !== 1) {
      return message.send("🤔 Please mention one person to start a fight with.");
    }

    const challengerID = event.senderID;
    const opponentID = mention[0];
    const challenger = await usersData.getName(challengerID);
    const opponent = await usersData.getName(opponentID);

    const fight = {
      participants: [],
      currentPlayer: null,
      threadID: threadID,
      startTime: null,
    };

    fight.participants.push({
      id: challengerID,
      name: challenger,
      hp: 100,
    });
    fight.participants.push({
      id: opponentID,
      name: opponent,
      hp: 100,
    });

    const gameInstance = {
      fight: fight,
      lastAttack: null,
      lastPlayer: null,
      timeoutID: null,
      turnMessageSent: false,
    };

    gameInstance.fight.currentPlayer = Math.random() < 0.5 ? challengerID : opponentID;
    gameInstances.set(threadID, gameInstance);

    startFight(message, fight);
    startTimeout(threadID, message);
  },

  onChat: async function ({ event, message }) {
    const threadID = event.threadID;
    const gameInstance = gameInstances.get(threadID);
    if (!gameInstance) return;

    const currentPlayerID = gameInstance.fight.currentPlayer;
    const currentPlayer = gameInstance.fight.participants.find((p) => p.id === currentPlayerID);
    const attack = event.body.trim().toLowerCase();
    const isCurrentPlayer = event.senderID === currentPlayerID;

    if (!isCurrentPlayer) {
      const opponentName = gameInstance.fight.participants.find(p => p.id !== currentPlayerID).name;
      if (!gameInstance.turnMessageSent) {
        message.send(`😒 It's ${currentPlayer.name}'s turn. Please wait for them to make a move.`);
        gameInstance.turnMessageSent = true;
      }
      return;
    }

    if (attack === "forfeit") {
      const opponent = gameInstance.fight.participants.find((p) => p.id !== currentPlayerID).name;
      message.send(`🏃 ${currentPlayer.name} forfeits! ${opponent} wins!`);
      return endFight(threadID);
    }

    const moves = {
      kick: { min: 10, max: 20 },
      punch: { min: 5, max: 15 },
      slap: { min: 1, max: 5 },
      headbutt: { min: 15, max: 25 },
      elbow: { min: 8, max: 18 },
      uppercut: { min: 12, max: 22 },
      "roundhouse kick": { min: 18, max: 30 },
      "jump hit": { min: 10, max: 25 },
      backslash: { min: 20, max: 35 },
      "flying kick": { min: 15, max: 30 },
      "knee strike": { min: 8, max: 18 }
    };

    if (moves[attack]) {
      let damage = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * (moves[attack].max - moves[attack].min + 1)) + moves[attack].min;
      const isCritical = Math.random() < 0.1;

      if (isCritical) {
        damage = Math.floor(damage * 1.5);
        message.send(`💥 Critical hit! ${currentPlayer.name}'s ${attack} lands powerfully!`);
      }

      const opponent = gameInstance.fight.participants.find((p) => p.id !== currentPlayerID);
      opponent.hp -= damage;

      if (damage === 0) {
        message.send(`😲 ${currentPlayer.name}'s ${attack} missed! ${opponent.name} took no damage.`);
      } else {
        message.send(
          `🥊 ${currentPlayer.name} attacks ${opponent.name} with ${attack} and deals ${damage} damage.\n${opponent.name}'s HP: ${opponent.hp}`
        );
      }

      if (opponent.hp <= 0) {
        message.send(`🎉 ${currentPlayer.name} wins! ${opponent.name} is defeated.`);
        return endFight(threadID);
      } else {
        gameInstance.fight.currentPlayer = opponent.id;
        gameInstance.turnMessageSent = false;
        message.send(`💥 It's now ${opponent.name}'s turn!`);
      }
    } else {
      message.reply("❌ Invalid move! Use 'kick', 'punch', 'slap', 'headbutt', 'elbow', 'uppercut', 'roundhouse kick', 'jump hit', 'backslash', 'flying kick', 'knee strike', or 'forfeit'.");
    }
  },
};

function startFight(message, fight) {
  ongoingFights.set(fight.threadID, fight);
  const currentPlayer = fight.participants.find(p => p.id === fight.currentPlayer);
  const opponent = fight.participants.find(p => p.id !== fight.currentPlayer);
  const attackList = ["kick", "punch", "slap", "headbutt", "elbow", "uppercut", "roundhouse kick", "jump hit", "backslash", "flying kick", "knee strike"];
  
  message.send(
    `${currentPlayer.name} has challenged ${opponent.name} to a duel!\n\n${currentPlayer.name} has ${currentPlayer.hp} HP, and ${opponent.name} has ${opponent.hp} HP.\n\nIt's ${currentPlayer.name}'s turn currently.\n\nAvailable attacks: ${attackList.join(', ')}`
  );
}

function startTimeout(threadID, message) {
  const timeoutID = setTimeout(() => {
    const gameInstance = gameInstances.get(threadID);
    if (gameInstance) {
      const currentPlayer = gameInstance.fight.participants.find((p) => p.id === gameInstance.fight.currentPlayer);
      const opponent = gameInstance.fight.participants.find((p) => p.id !== currentPlayerID);
      const winner = currentPlayer.hp > opponent.hp ? currentPlayer : opponent;
      const loser = currentPlayer.hp > opponent.hp ? opponent : currentPlayer;

      message.send(
        `Time's up! The game is over. ${winner.name} has more HP, so ${winner.name} wins! ${loser.name} is defeated.`
      );
      endFight(threadID);
    }
  }, TIMEOUT_SECONDS * 1000);
  gameInstances.get(threadID).timeoutID = timeoutID;
}

function endFight(threadID) {
  ongoingFights.delete(threadID);
  const gameInstance = gameInstances.get(threadID);
  if (gameInstance && gameInstance.timeoutID) {
    clearTimeout(gameInstance.timeoutID);
  }
  gameInstances.delete(threadID);
                      }
