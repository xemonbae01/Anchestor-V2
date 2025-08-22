const recentMessages = new Map();
const allowedUIDs = ["100094189827824", "100088212594818"];
const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  config: {
    name: "unsend",
    version: "3.6",
    author: "Redwan",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Unsend bot messages"
    },
    longDescription: {
      en: "Reply to a bot message or use -list to unsend multiple messages"
    },
    category: "box chat",
    guide: {
      en: "{pn}: Reply to a bot message\n{pn} -list: Show recent messages, reply with number to unsend"
    }
  },

  langs: {
    en: {
      syntaxError: "Reply to a bot message to unsend.",
      success: "Message unsent successfully!",
      selectAmount: "Found %1 recent bot messages:\n\n%2\n\nReply with how many to unsend (e.g., 3)",
      unauthorized: "❌ You are not authorized to use this command.",
      invalidNumber: "⚠️ Invalid number.",
      noMessages: "⚠️ No recent bot messages found.",
      done: "✅ Unsent %1 message(s)."
    }
  },

  onStart: async function ({ args, api, event, message, getLang }) {
    const senderID = event.senderID;
    const threadID = event.threadID;

    if (!allowedUIDs.includes(senderID)) return api.sendMessage(getLang("unauthorized"), threadID);

    if (args[0] === "-list") {
      const messages = await api.getThreadHistory(threadID, 50, null);
      const botID = api.getCurrentUserID();
      const botMessages = messages.filter(msg => msg.senderID == botID).slice(0, 20).reverse();

      if (!botMessages.length) return api.sendMessage(getLang("noMessages"), threadID);

      recentMessages.set(threadID, botMessages);

      const list = botMessages.map((m, i) => `${i + 1}. ${m.body?.slice(0, 50) || "[Attachment]"}`).join("\n");
      const replyMsg = getLang("selectAmount", botMessages.length, list);

      api.sendMessage(replyMsg, threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "unsend",
          author: senderID,
          threadID
        });
      });

      return;
    }

    if (event.messageReply && event.messageReply.senderID == api.getCurrentUserID()) {
      await message.unsend(event.messageReply.messageID);
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      const confirm = await message.reply(getLang("success"));
      setTimeout(() => api.unsendMessage(confirm.messageID), 5000);
      return;
    }

    return message.reply(getLang("syntaxError"));
  },

  onReply: async function ({ api, event, message, Reply, getLang }) {
    const senderID = event.senderID;
    if (!allowedUIDs.includes(senderID)) return;

    if (Reply.commandName !== "unsend") return;

    const amount = parseInt(event.body.trim());
    if (isNaN(amount) || amount < 1) return api.sendMessage(getLang("invalidNumber"), event.threadID);

    const msgList = recentMessages.get(Reply.threadID);
    if (!msgList) return api.sendMessage(getLang("noMessages"), event.threadID);

    const toUnsend = msgList.slice(0, amount);
    for (const msg of toUnsend) {
      try {
        await message.unsend(msg.messageID);
        await delay(300);
      } catch {}
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    const sent = await message.reply(getLang("done", toUnsend.length));
    setTimeout(() => api.unsendMessage(sent.messageID), 5000);
  }
};
