const axios = require("axios");
const fs = require("fs-extra");
const { getStreamFromURL, formatNumber } = global.utils;

module.exports = {
  config: {
    name: "ytb",
    version: "2.4.0",
    author: "tanvir",
    countDown: 5,
    role: 0,
    shortDescription: "YouTube Downloader",
    longDescription: {
      en: "Download video, audio, or get link from YouTube"
    },
    category: "media",
    guide: {
      en: "   {pn} [video|-v] [<video name>|<video link>]: use to download video from YouTube." +
        "\n   {pn} [audio|-a] [<video name>|<video link>]: use to download audio from YouTube" +
        "\n   {pn} [link|-l] [<video name>|<video link>]: use to get link of a video on YouTube" +
        "\n   Example:" +
        "\n    {pn} -v Never Gonna Give You Up!" +
        "\n    {pn} -a Never Gonna Let You Down" +
        "\n    {pn} -l We Are On The Cruise!!!"
    }
  },

  langs: {
    en: {
      error: "❌ An error occurred: %1",
      noResult: "⭕ No search results match the keyword %1",
      choose: "%1Reply with a number to choose, or any content to cancel.",
      video: "video",
      audio: "audio",
      downloading: "⬇ Downloading %1 \"%2\"",
      noVideo: "⭕ Sorry, no video was found.",
      noAudio: "⭕ Sorry, no audio was found.",
      link: "• %1\n• URL: %2",
      usage: "Usage:\n- {pn} [video|-v] [<video name>|<video link>]\n- {pn} [audio|-a] [<video name>|<video link>]\n- {pn} [link|-l] [<video name>|<video link>]"
    }
  },

  onStart: async function({ args, message, event, commandName, getLang }) {
    let type;
    switch (args[0]) {
      case "-v":
      case "video":
        type = "video";
        break;
      case "-a":
      case "audio":
        type = "audio";
        break;
      case "-l":
      case "link":
        type = "link";
        break;
      default:
        return message.reply(getLang("usage", { pn: commandName }));
    }

    const urlRegex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w|-]{11})(?:\S+)?$/;
    const isUrl = urlRegex.test(args[1]);

    if (isUrl) {
      const url = args[1].match(urlRegex)[0];
      if (type === "link") {
        return message.reply(getLang("link", "YouTube Video", url));
      }

      message.reply(getLang("downloading", getLang(type), url)).then(async msgInfo => {
        await downloadYT({ type, url, message, getLang });
        message.unsend(msgInfo.messageID);
      });
      return;
    }

    const forceFlag = args.includes("--f");
    const query = args.slice(1).filter(arg => arg !== "--f").join(" ");

    if (!query) return message.reply(getLang("usage", { pn: commandName }));

    try {
      const results = await searchYT(query);

      if (results.length === 0) {
        return message.reply(getLang("noResult", query));
      }
      const someResults = results.slice(0, 6);

      if (type === "link") {
        let msg = "";
        let i = 1;
        const thumbnails = [];
        someResults.forEach(video => {
          thumbnails.push(getStreamFromURL(video.thumbnail));
          msg += `${i++}. ${video.title}\n• Duration: ${video.time}\n• Channel: ${video.channel.name}\n\n`;
        });
      }

      if (forceFlag && (type === "audio" || type === "video")) {
        const firstResult = someResults[0];
        const url = `https://youtube.com/watch/${firstResult.id}`;
        message.reply(getLang("downloading", getLang(type), firstResult.title)).then(async msgInfo => {
          await downloadYT({ type, url, message, getLang });
          message.unsend(msgInfo.messageID);
        });
      } else {
        let msg = "";
        let i = 1;
        const thumbnails = [];

        someResults.forEach(video => {
          thumbnails.push(getStreamFromURL(video.thumbnail));
          msg += `${i++}. ${video.title}\n• Duration: ${video.time}\n• Channel: ${video.channel.name}\n\n`;
        });

        message.reply({
          body: getLang("choose", msg),
          attachment: await Promise.all(thumbnails)
        }, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            results: someResults,
            type
          });
        });
      }
    } catch (err) {
      return message.reply(getLang("error", err.message));
    }
  },

  onReply: async ({ event, api, Reply, message, getLang }) => {
    const { results, type } = Reply;
    const choice = parseInt(event.body);

    if (!isNaN(choice) && choice > 0 && choice <= results.length) {
      const selected = results[choice - 1];
      const url = `https://youtube.com/watch/${selected.id}`;
      api.unsendMessage(Reply.messageID);

      if (type === "link") {
        return message.reply({
          body: getLang("link", selected.title, url),
          attachment: await getStreamFromURL(selected.thumbnail)
        });
      }

      message.reply(getLang("downloading", getLang(type), selected.title)).then(async msgInfo => {
        await downloadYT({ type, url, message, getLang });
        message.unsend(msgInfo.messageID);
      });
    } else {
      api.unsendMessage(Reply.messageID);
    }
  }
};

async function downloadYT({ type, url, message, getLang }) {
  try {
    const d = (await axios.get('https://raw.githubusercontent.com/Tanvir0999/stuffs/refs/heads/main/raw/addresses.json')).data.yt;
    const filesize = type === "audio" ? 20 : 34;
    const format = type;
    const { data } = await axios.post(d, {
      url,
      filesize,
      format,
      cookies: fs.readFileSync("cookie.txt", "utf-8")
    });

    await message.reply({
      body: `• ${data.title}\n• Duration: ${data.duration}\n• Upload Date: ${data.upload_date}\n• Stream: ${data.url}`,
      attachment: await getStreamFromURL(data.url)
    });
  } catch (err) {
    return message.reply(getLang("error", err.response?.data || err.message));
  }
}

async function searchYT(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const { data } = await axios.get(url);
  const json = JSON.parse(data.split("ytInitialData = ")[1].split(";</script>")[0]);
  const videos = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

  return videos.filter(item => item.videoRenderer?.videoId).map(video => ({
    id: video.videoRenderer.videoId,
    title: video.videoRenderer.title.runs[0].text,
    thumbnail: video.videoRenderer.thumbnail.thumbnails.pop().url,
    time: video.videoRenderer.lengthText?.simpleText || "Unknown",
    channel: {
      name: video.videoRenderer.ownerText.runs[0].text
    }
  }));
    }
