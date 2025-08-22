const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "fbpost",
    version: "1.1",
    author: "Redwan",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Create an epic post on Facebook."
    },
    longDescription: {
      en: "Unleash your thoughts on Facebook with text, images, and videos."
    },
    category: "Social",
    guide: {
      en: "{pn}: post something legendary!"
    }
  },

  onStart: async function ({ event, api, commandName }) {
    const { threadID, messageID, senderID } = event;
    const uuid = getGUID();
    const formData = {
      "input": {
        "composer_entry_point": "inline_composer",
        "composer_source_surface": "timeline",
        "idempotence_token": uuid + "_FEED",
        "source": "WWW",
        "attachments": [],
        "audience": {
          "privacy": {
            "allow": [],
            "base_state": "FRIENDS",
            "deny": [],
            "tag_expansion_state": "UNSPECIFIED"
          }
        },
        "message": {
          "ranges": [],
          "text": ""
        },
        "actor_id": api.getCurrentUserID(),
        "client_mutation_id": Math.floor(Math.random() * 17)
      }
    };

    return api.sendMessage(
      "🔥 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Who shall witness your masterpiece? 🔥\n\n1️⃣ 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Everyone (Public)\n2️⃣ 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Only Friends\n3️⃣ 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Just Me (Private)",
      threadID,
      (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: senderID,
          formData,
          type: "whoSee"
        });
      },
      messageID
    );
  },

  onReply: async function ({ Reply, event, api, commandName }) {
    const handleReply = Reply;
    const { type, author, formData } = handleReply;
    if (event.senderID !== author) return;

    const { threadID, messageID, attachments, body } = event;
    const botID = api.getCurrentUserID();

    async function uploadAttachments(attachments) {
      let uploads = [];
      for (const attachment of attachments) {
        const form = { file: attachment };
        uploads.push(api.httpPostFormData(`https://www.facebook.com/profile/picture/upload/?profile_id=${botID}&photo_source=57&av=${botID}`, form));
      }
      uploads = await Promise.all(uploads);
      return uploads;
    }

    if (type === "whoSee") {
      if (!["1", "2", "3"].includes(body))
        return api.sendMessage("⚠️ 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Please choose 1, 2, or 3.", threadID, messageID);

      formData.input.audience.privacy.base_state = body === "1" ? "EVERYONE" : body === "2" ? "FRIENDS" : "SELF";

      api.unsendMessage(handleReply.messageID, () => {
        api.sendMessage(
          "📝 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Share your brilliant words below! (Send `0` to skip)",
          threadID,
          (e, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: author,
              formData,
              type: "content"
            });
          },
          messageID
        );
      });
    } else if (type === "content") {
      if (event.body !== "0") formData.input.message.text = event.body;

      api.unsendMessage(handleReply.messageID, () => {
        api.sendMessage(
          "📸 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Elevate your post with stunning visuals! (Send `0` to skip)",
          threadID,
          (e, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: author,
              formData,
              type: "media"
            });
          },
          messageID
        );
      });
    } else if (type === "media") {
      if (event.body !== "0") {
        const allStreamFile = [];

        for (const attach of attachments) {
          if (attach.type === "photo") {
            const getFile = (await axios.get(attach.url, { responseType: "arraybuffer" })).data;
            const imagePath = `${__dirname}/cache/imagePost.png`;
            fs.writeFileSync(imagePath, Buffer.from(getFile));
            allStreamFile.push(fs.createReadStream(imagePath));
          } else if (attach.type === "video") {
            const videoPath = `${__dirname}/cache/videoPost.mp4`;
            const videoFile = await axios.get(attach.url, { responseType: "stream" });
            const writer = fs.createWriteStream(videoPath);

            await new Promise((resolve, reject) => {
              videoFile.data.pipe(writer);
              writer.on("finish", resolve);
              writer.on("error", reject);
            });

            allStreamFile.push(fs.createReadStream(videoPath));
          }
        }

        const uploadFiles = await uploadAttachments(allStreamFile);
        for (let result of uploadFiles) {
          if (typeof result === "string") result = JSON.parse(result.replace("for (;;);", ""));

          if (result.payload && result.payload.fbid) {
            formData.input.attachments.push({
              "photo": { "id": result.payload.fbid.toString() }
            });
          }
        }
      }

      const form = {
        av: botID,
        fb_api_req_friendly_name: "ComposerStoryCreateMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "7711610262190099",
        variables: JSON.stringify(formData)
      };

      api.httpPost("https://www.facebook.com/api/graphql/", form, (e, info) => {
        api.unsendMessage(handleReply.messageID);
        try {
          if (e) throw e;
          if (typeof info === "string") info = JSON.parse(info.replace("for (;;);", ""));
          const postID = info.data.story_create.story.legacy_story_hideable_id;
          const urlPost = info.data.story_create.story.url;
          if (!postID) throw info.errors;

          try {
            fs.unlinkSync(`${__dirname}/cache/imagePost.png`);
            fs.unlinkSync(`${__dirname}/cache/videoPost.mp4`);
          } catch (e) {}

          return api.sendMessage(
            `🎉 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Success! Your epic post is now live! 🎉\n\n📌 Post ID: ${postID}\n🔗 View it here: ${urlPost}`,
            threadID,
            messageID
          );
        } catch (e) {
          console.error("❌ Post Error:", e);
          return api.sendMessage("❌ 𝘛𝘩𝘪𝘴 𝘵𝘦𝘹𝘵: Uh-oh, something went awry. Please try again later.", threadID, messageID);
        }
      });
    }
  }
};

function getGUID() {
  var sectionLength = Date.now();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.floor((sectionLength + Math.random() * 16) % 16);
    sectionLength = Math.floor(sectionLength / 16);
    return (c === "x" ? r : (r & 7) | 8).toString(16);
  });
  }
