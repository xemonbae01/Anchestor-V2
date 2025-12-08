const axios = require('axios');

async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

async function fetchGeneratedVideo(query) {
  try {
    const response = await axios.get(`https://redwans-apis.gleeze.com/api/simpvideo?prompt=${encodeURIComponent(query)}`);
    if (
      response.data &&
      response.data.status === true &&
      response.data.data &&
      response.data.data.url
    ) {
      return response.data.data.url;
    } else {
      return null;
    }
  } catch (error) {
    console.error("API request failed:", error);
    return null;
  }
}

module.exports = {
  config: {
    name: "simp",
    aliases: [],
    author: "Redwan",
    version: "1.0",
    shortDescription: {
      en: "Simple video generator by Redwan",
    },
    longDescription: {
      en: "Generates a personalized simp-style video using a prompt you provide. Powered by Redwan.",
    },
    category: "video",
    guide: {
      en: "{p}{n} [your prompt]\n\nExample:\n{p}{n} naruto and hinata",
    },
  },

  onStart: async function ({ api, event, args }) {
    api.setMessageReaction("🎬", event.messageID, (err) => {}, true);

    const query = args.join(" ");
    if (!query) {
      api.sendMessage(
        "⚠️ Please provide a prompt to generate your video.\nExample: simp naruto and hinata",
        event.threadID,
        event.messageID
      );
      return;
    }

    const videoUrl = await fetchGeneratedVideo(query);

    if (!videoUrl) {
      api.sendMessage(
        "❌ Unable to generate a video with the provided prompt. Please try again with a different input.",
        event.threadID,
        event.messageID
      );
      return;
    }

    try {
      const videoStream = await getStreamFromURL(videoUrl);

      await api.sendMessage(
        {
          body: `🎞️ Generated video for: "${query}"`,
          attachment: videoStream,
        },
        event.threadID,
        event.messageID
      );
    } catch (error) {
      console.error("Video streaming error:", error);
      api.sendMessage(
        "🚫 An error occurred while retrieving the video. Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  },
};
