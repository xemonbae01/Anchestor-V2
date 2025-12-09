const axios = require("axios");

module.exports = {
  config: {
    name: "claude",
    aliases: ["sonnet", "claudeai", "claudebot"],
    version: "1.1",
    author: "Redwan (Xe Mo)",
    countDown: 3,
    role: 0,
    shortDescription: "Chat with Claude Sonnet 4.5 AI",
    longDescription: "Conversational AI powered by the Claude Sonnet 4.5 model.",
    category: "AI",
    guide: "{pn} <your message> or reply to a Claude AI message."
  },

  async callAI(uid, msg, envGlobal) {
    const baseUrl = envGlobal?.xemoapiurl || "https://redwans-apis.gleeze.com";
    const apiUrl = `${baseUrl}/api/claude-sonnet-4-5?uid=${uid}&msg=${encodeURIComponent(msg)}`;

    const response = await axios.get(apiUrl);
    return response.data;
  },

  onStart: async function ({ api, event, args, envGlobal }) {
    let query = args.join(" ");

    if (event.type === "message_reply" && event.messageReply?.body) {
      query = event.messageReply.body;
    }

    if (!query) {
      return api.sendMessage("Please enter a message.", event.threadID, event.messageID);
    }

    const thinking = await api.sendMessage("Claude is thinking...", event.threadID);

    try {
      const data = await this.callAI(event.senderID, query, envGlobal);

      api.unsendMessage(thinking.messageID);

      if (data.status !== "success" || !data.reply) {
        return api.sendMessage("AI returned an invalid response.", event.threadID);
      }

      const finalResponse = `Claude Sonnet 4.5\n\n${data.reply}`;

      api.sendMessage(finalResponse, event.threadID, (err, msgInfo) => {
        if (!err) {
          global.GoatBot.onReply.set(msgInfo.messageID, {
            commandName: this.config.name,
            author: event.senderID
          });
        }
      });

    } catch (error) {
      console.error(error);
      api.unsendMessage(thinking.messageID);
      api.sendMessage("Claude AI service is currently unavailable.", event.threadID);
    }
  },

  onReply: async function ({ api, event, envGlobal }) {
    const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);
    if (!replyData || replyData.author !== event.senderID) return;

    const thinking = await api.sendMessage("Claude is thinking...", event.threadID);

    try {
      const data = await this.callAI(event.senderID, event.body.trim(), envGlobal);

      api.unsendMessage(thinking.messageID);

      if (data.status !== "success" || !data.reply) {
        return api.sendMessage("AI returned an invalid response.", event.threadID);
      }

      const finalResponse = `Claude Sonnet 4.5\n\n${data.reply}`;

      api.sendMessage(finalResponse, event.threadID, (err, msgInfo) => {
        if (!err) {
          global.GoatBot.onReply.set(msgInfo.messageID, {
            commandName: replyData.commandName,
            author: event.senderID
          });
        }
      });

    } catch (error) {
      console.error(error);
      api.unsendMessage(thinking.messageID);
      api.sendMessage("Claude AI service is currently unavailable.", event.threadID);
    }
  }
};
        
