module.exports = {
  config: {
    name: "fblink",
    aliases: ["facebooklink"],
    version: "1.1",
    author: "Redwan",
    countDown: 5,
    role: 0,
    shortDescription: "Share Facebook profile link",
    longDescription: "Share the Facebook profile link of a replied user or mentioned user.",
    category: "utility",
    guide: "{pn} [Reply to a message or mention someone]"
  },

  onStart: async function ({ message, event, api }) {
    let contactID;

    if (Object.keys(event.mentions).length > 0) {
      contactID = Object.keys(event.mentions)[0];
    } else if (event.messageReply) {
      contactID = event.messageReply.senderID;
    } else {
      return message.reply("Please reply to a message or mention someone to share their Facebook link.");
    }

    const profileLink = `https://www.facebook.com/${contactID}`;

    api.sendMessage(`Here is the Facebook profile link: ${profileLink}`, event.threadID, (err) => {
      if (err) {
        return message.reply(`Error: ${err.message}`);
      }
    });
  }
};
