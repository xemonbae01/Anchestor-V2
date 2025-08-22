const moment = require("moment");
const fetch = require("node-fetch");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "github",
    author: "Redwan",
    countdown: 5,
    role: 0,
    category: "utility",
    shortDescription: {
      en: "",
    },
  },

  onStart: async function ({ api, event, args }) {
    if (!args[0]) {
      api.sendMessage("🚨 Please provide a GitHub username! 🚨", event.threadID, event.messageID);
      return;
    }

    fetch(`https://api.github.com/users/${encodeURI(args.join(" "))}`)
      .then((res) => res.json())
      .then(async (body) => {
        if (body.message) {
          api.sendMessage("❌ User not found. Please provide a valid username! ❌", event.threadID, event.messageID);
          return;
        }

        const { login, avatar_url, name, id, html_url, public_repos, followers, following, location, created_at, bio } = body;

        const info = `🌟 **GitHub Profile Info** 🌟\n\n` +
          `**Username:** ${login}\n` +
          `**ID:** ${id}\n` +
          `**Bio:** ${bio || "*No Bio*"}\n` +
          `**Public Repos:** ${public_repos || "*None*"}\n` +
          `**Followers:** ${followers}\n` +
          `**Following:** ${following}\n` +
          `**Location:** ${location || "*No Location*"}\n` +
          `**Account Created:** ${moment.utc(created_at).format("dddd, MMMM Do YYYY")}\n` +
          `🎨 **Avatar:**`;

        const imageBuffer = await axios.get(avatar_url, { responseType: "arraybuffer" }).then((res) => res.data);
        fs.writeFileSync(__dirname + "/cache/avatargithub.png", Buffer.from(imageBuffer, "utf-8"));

        api.sendMessage(
          {
            attachment: fs.createReadStream(__dirname + "/cache/avatargithub.png"),
            body: info,
          },
          event.threadID,
          () => fs.unlinkSync(__dirname + "/cache/avatargithub.png")
        );
      })
      .catch((err) => {
        console.error(err);
        api.sendMessage("⚠️ An error occurred while fetching the user's information. Please try again later. ⚠️", event.threadID, event.messageID);
      });
  },
};
