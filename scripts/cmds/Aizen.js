const axios = require("axios");

module.exports = {
  config: {
    name: "aizen",
    aliases: ["sosukeaizen", "aizenai"],
    version: "2.0",
    author: "Redwan (Xe Mo)",
    countDown: 3,
    role: 0,
    shortDescription: "Chat with Aizen AI",
    longDescription: "Interact with the powerful and arrogant Sōsuke Aizen AI from Redwan's Core.",
    category: "AI",
    guide: "{pn} <your message> or reply to an AI message."
  },

  onStart: async function ({ api, event, args }) {
    let query = args.join(" ");
    if (event.type === "message_reply" && event.messageReply) {
      query = event.messageReply.body;
    }
    if (!query) {
      return api.sendMessage("⚠️ Please enter a message!", event.threadID, event.messageID);
    }

    const uid = event.senderID;
    const apiUrl = `https://xemo.up.railway.app/api/Sosukeaizen?uid=${uid}&msg=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.status !== "success" || !data.reply) {
        return api.sendMessage("❌ AI service returned an invalid response.", event.threadID, event.messageID);
      }

      const finalResponse = `⚔️ 𝙎𝙊̄𝙎𝙐𝙆𝙀 𝘼𝙄𝙕𝙀𝙉 𝘼𝙄 ⚔️\n\n${data.reply}`;

      api.sendMessage(finalResponse, event.threadID, (err, msgInfo) => {
        if (!err) {
          global.GoatBot.onReply.set(msgInfo.messageID, {
            commandName: module.exports.config.name,
            author: event.senderID
          });
        }
      }, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Aizen AI service is currently unavailable!", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event }) {
    try {
      const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);
      if (!replyData || replyData.author !== event.senderID) return;

      const userAnswer = event.body.trim();
      const uid = event.senderID;
      const apiUrl = `https://xemo.up.railway.app/api/Sosukeaizen?uid=${uid}&msg=${encodeURIComponent(userAnswer)}`;

      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.status !== "success" || !data.reply) {
        return api.sendMessage("❌ AI service returned an invalid response.", event.threadID, event.messageID);
      }

      const finalResponse = `⚔️ 𝙎𝙊̄𝙎𝙐𝙆𝙀 𝘼𝙄𝙕𝙀𝙉 𝘼𝙄 ⚔️\n\n${data.reply}`;

      api.sendMessage(finalResponse, event.threadID, (err, msgInfo) => {
        if (!err) {
          global.GoatBot.onReply.set(msgInfo.messageID, {
            commandName: replyData.commandName,
            author: event.senderID
          });
        }
      }, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Aizen AI service is currently unavailable!", event.threadID, event.messageID);
    }
  }
};
