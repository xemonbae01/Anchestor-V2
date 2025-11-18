const axios = require('axios');
const fs = require('fs');

async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

module.exports = {
  config: {
    name: "screenrecord",
    aliases: ["sr"],
    author: "Redwan",
    version: "1.0",
    shortDescription: {
      en: "Record a website as a video",
    },
    longDescription: {
      en: "Records the screen of a given URL for a specified duration and sends the video.",
    },
    category: "Utility",
    guide: {
      en: "{p}{n} --url <website> --dt <duration in seconds>",
    },
  },
  onStart: async function ({ api, event, args }) {
    api.setMessageReaction("🎬", event.messageID, (err) => {}, true);

    const urlArgIndex = args.findIndex(arg => arg.startsWith("--url"));
    const dtArgIndex = args.findIndex(arg => arg.startsWith("--dt"));

    if (urlArgIndex === -1 || !args[urlArgIndex + 1]) {
      api.sendMessage({ body: "❌ Please provide a URL using --url <website>" }, event.threadID, event.messageID);
      return;
    }

    const url = args[urlArgIndex + 1];
    let duration = 4.5;
    if (dtArgIndex !== -1 && args[dtArgIndex + 1]) {
      const parsed = Number(args[dtArgIndex + 1]);
      if (!isNaN(parsed)) duration = parsed;
    }

    try {
      const fetchUrl = `https://xemo.up.railway.app/api/screenrecord?url=${encodeURIComponent(url)}&duration=${duration}`;
      const videoStream = await getStreamFromURL(fetchUrl);

      await api.sendMessage({
        body: `🎥 Screen recording of ${url} for ${duration} seconds`,
        attachment: videoStream,
      }, event.threadID, event.messageID);

    } catch (error) {
      console.error("Error recording screen:", error);
      api.sendMessage({ body: "❌ Failed to record the screen. Try again later." }, event.threadID, event.messageID);
    }
  },
};
      
