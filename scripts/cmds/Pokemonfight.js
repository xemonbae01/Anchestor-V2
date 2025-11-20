const TIMEOUT_SECONDS = 120;
const ongoingFights = new Map();
const gameInstances = new Map();

const pokemonData = {
    pikachu: { type: "Electric", moves: ["Thunderbolt", "Quick Attack", "Iron Tail", "Electro Ball"], hp: 100 },
    charizard: { type: "Fire", moves: ["Flamethrower", "Dragon Claw", "Fly", "Fire Spin"], hp: 120 },
    bulbasaur: { type: "Grass", moves: ["Vine Whip", "Razor Leaf", "Sleep Powder", "Solar Beam"], hp: 90 },
    squirtle: { type: "Water", moves: ["Water Gun", "Tackle", "Shell Smash", "Hydro Pump"], hp: 95 },
    eevee: { type: "Normal", moves: ["Tackle", "Quick Attack", "Bite", "Take Down"], hp: 100 },
    gengar: { type: "Ghost", moves: ["Shadow Ball", "Dark Pulse", "Dream Eater", "Nightmare"], hp: 105 },
    machamp: { type: "Fighting", moves: ["Dynamic Punch", "Cross Chop", "Karate Chop", "Submission"], hp: 115 },
    dragonite: { type: "Dragon", moves: ["Outrage", "Dragon Dance", "Hyper Beam", "Thunder Punch"], hp: 130 },
    snorlax: { type: "Normal", moves: ["Body Slam", "Rest", "Hyper Beam", "Headbutt"], hp: 150 },
    mewtwo: { type: "Psychic", moves: ["Psychic", "Aura Sphere", "Shadow Ball", "Recover"], hp: 140 },
    jolteon: { type: "Electric", moves: ["Thunder Shock", "Pin Missile", "Quick Attack", "Discharge"], hp: 95 },
    flareon: { type: "Fire", moves: ["Flame Wheel", "Heat Wave", "Quick Attack", "Lava Plume"], hp: 100 },
    vaporeon: { type: "Water", moves: ["Aqua Tail", "Ice Beam", "Muddy Water", "Hydro Pump"], hp: 110 },
    alakazam: { type: "Psychic", moves: ["Psybeam", "Future Sight", "Psychic", "Kinesis"], hp: 90 },
    arcanine: { type: "Fire", moves: ["Flamethrower", "Extreme Speed", "Crunch", "Burn Up"], hp: 120 },
    onix: { type: "Rock", moves: ["Rock Throw", "Earthquake", "Iron Tail", "Stone Edge"], hp: 120 },
    pidgeot: { type: "Flying", moves: ["Gust", "Wing Attack", "Hurricane", "Air Slash"], hp: 100 },
    nidoking: { type: "Poison", moves: ["Poison Jab", "Earthquake", "Horn Drill", "Sludge Bomb"], hp: 120 },
    lapras: { type: "Ice", moves: ["Ice Beam", "Surf", "Hydro Pump", "Dragon Pulse"], hp: 130 },
    zapdos: { type: "Electric", moves: ["Thunder", "Drill Peck", "Charge Beam", "Agility"], hp: 125 },
};

module.exports = {
    config: {
        name: "pokemonfight",
        version: "1.4",
        author: "Redwan",
        role: 0,
        shortDescription: { en: "Battle with Pokémon!" },
        longDescription: { en: "Choose a Pokémon and battle against your friends!" },
        category: "fun",
        guide: "{prefix}pokemonfight @mention | [pokemon]",
    },

    onStart: async function({ event, message, args }) {
        const threadID = event.threadID;

        if (ongoingFights.has(threadID)) {
            return message.send("⚔️ A Pokémon battle is already ongoing in this group.");
        }

        const mention = Object.keys(event.mentions);
        if (mention.length !== 1) {
            return message.send("🤔 Please mention one person to challenge them.");
        }

        const input = args.join(" ");
        const parts = input.split("|").map((s) => s.trim());
        if (parts.length < 2) {
            return message.send("❌ Please mention your opponent and specify a Pokémon. Example: /pokemonfight @mention | pikachu");
        }

        const [_, chosenPokemonName] = parts;
        const challengerPokemonName = chosenPokemonName.toLowerCase();

        if (!pokemonData[challengerPokemonName]) {
            return message.send(`❌ Invalid Pokémon! Please choose one of these: ${Object.keys(pokemonData).join(", ")}`);
        }

        const challengerID = event.senderID;
        const opponentID = mention[0];

        const challengerPokemon = { ...pokemonData[challengerPokemonName], owner: challengerID, name: challengerPokemonName };

        const opponentPokemonName = Object.keys(pokemonData)[Math.floor(Math.random() * Object.keys(pokemonData).length)];
        const opponentPokemon = { ...pokemonData[opponentPokemonName], owner: opponentID, name: opponentPokemonName };

        const game = {
            threadID,
            participants: [
                { id: challengerID, pokemon: challengerPokemon, hp: challengerPokemon.hp },
                { id: opponentID, pokemon: opponentPokemon, hp: opponentPokemon.hp }
            ],
            currentPlayer: challengerID,
        };

        gameInstances.set(threadID, game);
        startBattle(game, message);
    },

    onChat: async function({ event, message }) {
        const threadID = event.threadID;
        const game = gameInstances.get(threadID);
        if (!game) return;

        const currentPlayerID = game.currentPlayer;
        if (event.senderID !== currentPlayerID) {
            return message.send("😒 It's not your turn.");
        }

        const attack = event.body.trim().toLowerCase();
        const currentPlayer = game.participants.find((p) => p.id === currentPlayerID);
        const opponent = game.participants.find((p) => p.id !== currentPlayerID);

        const validMoves = currentPlayer.pokemon.moves.map(move => move.toLowerCase());
        if (!validMoves.includes(attack)) {
            return message.send(`❌ Invalid move! Choose one of these: ${currentPlayer.pokemon.moves.join(", ")}`);
        }

        const damage = Math.floor(Math.random() * 20) + 10;
        opponent.hp -= damage;

        message.send(
            `🔥 ${currentPlayer.pokemon.name} used ${attack}! It dealt ${damage} damage to ${opponent.pokemon.name}.\n${opponent.pokemon.name} has ${Math.max(opponent.hp, 0)} HP left.`
        );

        if (opponent.hp <= 0) {
            message.send(`🎉 ${currentPlayer.pokemon.name} wins! ${opponent.pokemon.name} has fainted.`);
            return endBattle(threadID);
        }

        game.currentPlayer = opponent.id;
        message.send(`🔄 It's now ${opponent.pokemon.name}'s turn!`);
    },
};

function startBattle(game, message) {
    const challenger = game.participants[0];
    const opponent = game.participants[1];

    message.send(
        `⚔️ ${challenger.pokemon.name} (${challenger.pokemon.hp} HP) is battling ${opponent.pokemon.name} (${opponent.pokemon.hp} HP)!\n\nIt's ${challenger.pokemon.name}'s turn. Choose an attack!`
    );
}

function endBattle(threadID) {
    ongoingFights.delete(threadID);
    gameInstances.delete(threadID);
            }
          
