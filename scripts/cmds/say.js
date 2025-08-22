const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "say",
    version: "2.0",
    author: "SiAM",
    countDown: 5,
    role: 0,
    category: "Fun",
    ShortDescription: "text to voice",
    LongDescription: "bot will make your text into voice.",
    guide: {
      en: "{pn} your text"
    }
  },

  onStart: async function ({ api, args, message, event }) {
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);

    let text;
    
    if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments.length > 0 && ["photo", "sticker"].includes(event.messageReply.attachments[0].type)) {
      const imageUrl = event.messageReply.attachments[0].url;     
      try {
        const ocrResponse = await axios.get(`https://sex.sex/api/image/imgtotext?imageUrl=${encodeURIComponent(imageUrl)}`);
        text = ocrResponse.data.result;
      } catch (ocrError) {
        console.error(ocrError);
        message.reply("Error extracting text from image.");
        return;
      }
    } else if (event.type === "message_reply") {
      text = event.messageReply.body;
    } else {
      text = args && args.length > 0 ? args.join(" ") : '';
    }
    
    if (!text) {
      return message.reply(`Provide some text \n\nExample:\n${p}say hi there`);
    }

    const path = "./tts.mp3";
    const apiURL = `https://tts-siam-apiproject.vercel.app/speech?text=${encodeURIComponent(text)}`;

    try {
      const response = await axios({
        method: "get",
        url: apiURL,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(path);
      response.data.pipe(writer);
      writer.on("finish", () => {
        message.reply({
           
          attachment: fs.createReadStream(path)
        }, () => {
          fs.remove(path);
        });
      });
    } catch (err) {
      console.error(err);
      message.reply("Error while processing text to voice.");
    }
  }
};
