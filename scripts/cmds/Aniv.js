const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "aniv",
    aliases: ["anya", "zundamon"],
    author: "Redwan",
    version: "3.4",
    cooldowns: 5,
    role: 0,
    shortDescription: { en: "Chat with anime voices!" },
    longDescription: {
      en: `Talk with various anime-style voices! You can select a speaker using '| number'.\n\n🎙️ **Available Speakers:**\n
1️⃣ **四国めたん (Shikoku Metan)** - Energetic and lively  
2️⃣ **ずんだもん (Zundamon)** - Playful and cute  
3️⃣ **春日部つむぎ (Kasugabe Tsumugi)** - Soft and kind  
4️⃣ **雨晴はう (Amahare Hau)** - Calm and soothing  
5️⃣ **波音リツ (Anya)** - Default voice, smart and curious  
6️⃣ **玄野武宏 (Kurono Takehiro)** - Deep and serious  
7️⃣ **白上虎太郎 (Shirakami Kotaro)** - Cool and mysterious  
8️⃣ **青山龍星 (Aoyama Ryusei)** - Strong and confident`,
    },
    category: "ai",
    guide: { en: "{p}{n} [text] | [speaker number]" },
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      const { createReadStream, unlinkSync } = fs;
      const { resolve } = path;
      const { messageID, threadID, senderID } = event;

      const getUserInfo = async (api, userID) => {
        try {
          const userInfo = await api.getUserInfo(userID);
          return userInfo[userID]?.firstName || "User";
        } catch {
          return "User";
        }
      };

      const greetings = ["Konichiwa", "Yaho", "Ohayo", "Senpai~", "Moshi Moshi"];
      const userName = await getUserInfo(api, senderID);
      const greeting = `${greetings[Math.floor(Math.random() * greetings.length)]} ${userName}!`;

      if (!args[0]) return message.reply(greeting);

      let chat = args.join(" ");
      let speaker = 5;

      if (chat.includes("|")) {
        const parts = chat.split("|").map(part => part.trim());
        chat = parts[0];
        const speakerNum = parseInt(parts[1], 10);
        if (!isNaN(speakerNum) && speakerNum >= 1 && speakerNum <= 8) {
          speaker = speakerNum;
        }
      }

      const speakerNames = {
        1: "四国めたん (Shikoku Metan)",
        2: "ずんだもん (Zundamon)",
        3: "春日部つむぎ (Kasugabe Tsumugi)",
        4: "雨晴はう (Amahare Hau)",
        5: "波音リツ (Anya)",
        6: "玄野武宏 (Kurono Takehiro)",
        7: "白上虎太郎 (Shirakami Kotaro)",
        8: "青山龍星 (Aoyama Ryusei)",
      };

      const translateResponse = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(chat)}`
      );
      const translatedText = translateResponse.data?.[0]?.[0]?.[0] || chat;

      const ttsResponse = await axios.get(
        `http:65.109.80.126:20511/api/api/aniv?speaker=${encodeURIComponent(speaker)}&text=${encodeURIComponent(translatedText)}`
      );

      if (!ttsResponse.data || !ttsResponse.data.success || !ttsResponse.data.data) {
        return message.reply("⚠️ Failed to generate the voice. Try again later!");
      }

      const { mp3StreamingUrl } = ttsResponse.data.data;
      
      if (!mp3StreamingUrl) {
        return message.reply("⚠️ Audio file URL is missing. Please try again later.");
      }

      const audioPath = resolve(__dirname, "cache", `${threadID}_${senderID}.mp3`);

      const downloadFile = async (url, path) => {
        const response = await axios({ url, method: "GET", responseType: "stream" });
        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(path);
          response.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      };

      await downloadFile(mp3StreamingUrl, audioPath);

      message.reply(
        { body: `🎙️ **Speaker:** ${speakerNames[speaker]}\n📜 ${translatedText}`, attachment: createReadStream(audioPath) },
        threadID,
        () => unlinkSync(audioPath)
      );
    } catch (error) {
      console.error(error);
      message.reply("⚠️ An error occurred while processing your request. Please try again later.");
    }
  },
};
