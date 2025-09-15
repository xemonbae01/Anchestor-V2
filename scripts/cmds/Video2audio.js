const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "v2a",
    aliases: ["video2audio"],
    description: "Convert video to audio",
    version: "1.2",
    author: "XeMo(Redwan Ahemed)",
    countDown: 60,
    longDescription: {
      vi: "Chuyển video thành âm thanh",
      en: "Reply to a video to convert it to audio"
    },
    category: "media",
    guide: {
      en: "{p}{n}"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const fsExtra = require("fs-extra");

      if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
        return api.sendMessage("❌ Please reply to a video message to convert it to audio.", event.threadID, event.messageID);
      }

      const attachment = event.messageReply.attachments[0];
      if (attachment.type !== "video") {
        return api.sendMessage("❌ The replied message must be a video.", event.threadID, event.messageID);
      }

      const videoUrl = attachment.url;
      const audioPath = path.join(__dirname, "/assets/vdtoau.m4a");

      const response = await axios.get(videoUrl, {
        method: 'GET',
        responseType: 'arraybuffer'
      });

      fs.writeFileSync(audioPath, Buffer.from(response.data, 'utf-8'));

      const audioStream = fs.createReadStream(audioPath);
      api.sendMessage({ body: "✅ Here's your audio file:", attachment: audioStream }, event.threadID, event.messageID, async () => {
        try {
          await fsExtra.remove(audioPath);
        } catch (cleanupError) {
          console.error("Failed to clean up audio file:", cleanupError);
        }
      });

    } catch (error) {
      console.error("Conversion error:", error);
      api.sendMessage("❌ An error occurred while converting the video to audio.", event.threadID, event.messageID);
    }
  }
};
                      
