module.exports = {
  config: {
    name: "sharecontact",
    aliases: ["contact", "sendcontact", "sc"],
    version: "1.0.0",
    author: "Redwan",
    countDown: 5,
    role: 0,
    shortDescription: "Share a user's contact",
    longDescription: "Share the contact information of a mentioned user or the sender of a replied message.",
    category: "utilities",
    guide: "{p}sharecontact @mention\n{p}sharecontact (reply to a message)"
  },

  onStart: async function ({ api, event }) {
    let userID;

    if (Object.keys(event.mentions).length > 0) {
      userID = Object.keys(event.mentions)[0];
    } else if (event.messageReply) {
      userID = event.messageReply.senderID;
    } else {
      return api.sendMessage("Please mention a user or reply to their message to share their contact.", event.threadID, event.messageID);
    }

    await api.shareContact("Here's the contact information:", userID, event.threadID, function(err) {
      if (err) return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    });
  }
};
