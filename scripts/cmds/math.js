const axios = require("axios");

module.exports = {
  config: {
    name: "math",
    aliases: ["mathgame", "quiz"],
    version: "1.7",
    author: "Redwan",
    longDescription: { en: "🧠 𝙏𝙝𝙞𝙣𝙠 𝙮𝙤𝙪'𝙧𝙚 𝙨𝙢𝙖𝙧𝙩? 𝙏𝙧𝙮 𝙩𝙝𝙞𝙨 𝙢𝙖𝙩𝙝 𝙘𝙝𝙖𝙡𝙡𝙚𝙣𝙜𝙚! 🏆" },
    category: "🎮 𝙂𝙖𝙢𝙚𝙨",
    guide: { en: "⚡ 𝙏𝙮𝙥𝙚: **{p}{n}** | 𝙎𝙚𝙩 𝙢𝙤𝙙𝙚: **{p}{n} 𝙨𝙚𝙩 <difficulty> <type>**" },
  },

  userSettings: new Map(),

  onStart: async function ({ message, event, args }) {
    const userID = event.senderID;

    if (!this.userSettings.has(userID)) {
      this.userSettings.set(userID, { difficulty: "normal", type: "text" });
    }

    let userSetting = this.userSettings.get(userID);

    if (args.length === 3 && args[0] === "set") {
      const difficulty = args[1].toLowerCase();
      const type = args[2].toLowerCase();

      const validDifficulties = ["easy", "normal", "hard"];
      const validTypes = ["text", "number"];

      if (!validDifficulties.includes(difficulty) || !validTypes.includes(type)) {
        return message.reply(
          `⚠️ 𝙄𝙣𝙫𝙖𝙡𝙞𝙙 𝙘𝙝𝙤𝙞𝙘𝙚! ❌\n📌 𝘿𝙞𝙛𝙛𝙞𝙘𝙪𝙡𝙩𝙮: **𝙚𝙖𝙨𝙮, 𝙣𝙤𝙧𝙢𝙖𝙡, 𝙝𝙖𝙧𝙙**\n📌 𝙏𝙮𝙥𝙚: **𝙩𝙚𝙭𝙩, 𝙣𝙪𝙢𝙗𝙚𝙧**`
        );
      }

      userSetting.difficulty = difficulty;
      userSetting.type = type;
      this.userSettings.set(userID, userSetting);

      return message.reply(`✅ 𝙎𝙚𝙩𝙩𝙞𝙣𝙜𝙨 𝙐𝙥𝙙𝙖𝙩𝙚𝙙!\n🎯 𝘿𝙞𝙛𝙛𝙞𝙘𝙪𝙡𝙩𝙮: **${difficulty}**\n🎯 𝙏𝙮𝙥𝙚: **${type}**`);
    }

    try {
      const { difficulty, type } = userSetting;
      const apiUrl = `https://global-redwans-apis.onrender.com/api/math?difficulty=${difficulty}&type=${type}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.question || !data.options) {
        return message.reply("❌ 𝙁𝙖𝙞𝙡𝙚𝙙 𝙩𝙤 𝙜𝙚𝙣𝙚𝙧𝙖𝙩𝙚 𝙖 𝙦𝙪𝙚𝙨𝙩𝙞𝙤𝙣!");
      }

      const { question, options, correct_answer: correctAnswer } = data;
      const optionKeys = Object.keys(options);
      let optionsText = optionKeys.map((key, index) => `${index + 1}. ${options[key]}`).join("\n");

      let timeoutDuration = difficulty === "easy" ? 30000 : difficulty === "normal" ? 35000 : 40000;

      message.reply(
        `🎯 𝙈𝘼𝙏𝙃 𝙂𝘼𝙈𝙀 🧮\n\n📢 **𝙌𝙪𝙚𝙨𝙩𝙞𝙤𝙣:** ${question}\n\n${optionsText}\n\n✨ 𝙍𝙚𝙥𝙡𝙮 𝙬𝙞𝙩𝙝 (𝟭,𝟮,𝟯,𝟰) 𝙩𝙤 𝙖𝙣𝙨𝙬𝙚𝙧! (⏳ **𝙏𝙞𝙢𝙚: ${timeoutDuration / 1000} 𝙨𝙚𝙘𝙤𝙣𝙙𝙨**)`,
        (err, info) => {
          if (!err) {
            const timeout = setTimeout(() => {
              if (global.GoatBot.onReply.has(info.messageID)) {
                message.unsend(info.messageID);
                global.GoatBot.onReply.delete(info.messageID);
                message.reply("⏳ **𝙏𝙞𝙢𝙚'𝙨 𝙪𝙥!** ❌ 𝙔𝙤𝙪 𝙡𝙤𝙨𝙚!");
              }
            }, timeoutDuration);

            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              author: event.senderID,
              options: options,
              correctAnswer: correctAnswer,
              timeout: timeout,
            });
          }
        }
      );
    } catch (error) {
      console.error("Error fetching the math problem:", error.message);
      message.reply("❌ 𝙊𝙤𝙥𝙨! 𝙎𝙤𝙢𝙚𝙩𝙝𝙞𝙣𝙜 𝙬𝙚𝙣𝙩 𝙬𝙧𝙤𝙣𝙜!");
    }
  },

  onReply: async function ({ message, event }) {
    try {
      const userAnswer = event.body.trim();
      const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);

      if (!replyData || replyData.author !== event.senderID) return;

      const { options, correctAnswer } = replyData;
      const optionKeys = Object.keys(options);
      const userSelectedOption = optionKeys[parseInt(userAnswer) - 1];

      message.unsend(event.messageReply.messageID);

      if (!userSelectedOption || options[userSelectedOption] === undefined) {
        return message.reply("⚠️ **𝙄𝙣𝙫𝙖𝙡𝙞𝙙 𝘾𝙝𝙤𝙞𝙘𝙚!** ❌ 𝙋𝙡𝙚𝙖𝙨𝙚 𝙨𝙚𝙡𝙚𝙘𝙩 𝙖 𝙣𝙪𝙢𝙗𝙚𝙧 (𝟭-𝟰).");
      }

      const userSelectedAnswer = options[userSelectedOption];

      if (parseFloat(userSelectedAnswer) === parseFloat(correctAnswer)) {
        message.reply("🎉 **𝘾𝙊𝙍𝙍𝙀𝘾𝙏!** 🏆 𝙔𝙤𝙪 𝙬𝙞𝙣!");
      } else {
        message.reply("❌ **𝙒𝙧𝙤𝙣𝙜!** 𝘽𝙚𝙩𝙩𝙚𝙧 𝙡𝙪𝙘𝙠 𝙣𝙚𝙭𝙩 𝙩𝙞𝙢𝙚.");
      }

      global.GoatBot.onReply.delete(event.messageReply.messageID);
    } catch (error) {
      console.error("Error checking answer:", error.message);
      message.reply("⚠️ **𝙀𝙧𝙧𝙤𝙧!**");
    }
  },
};
