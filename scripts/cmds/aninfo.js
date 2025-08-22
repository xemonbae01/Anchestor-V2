const fetch = require('node-fetch');

module.exports = { 
  config: { 
    name: "aninfo", 
    version: "1.0", 
    author: "Redwan", 
    cooldown: 5, 
    role: 0, 
    shortDescription: "Search for anime info", 
    longDescription: "Search for an anime and get detailed information.", 
    category: "Anime", 
    guide: "{p}anime <anime name>" 
  },

  onStart: async function ({ event, api, args }) { 
    if (!args.length) { 
      return api.sendMessage("𝙋𝙡𝙚𝙖𝙨𝙚 𝙚𝙣𝙩𝙚𝙧 𝙖𝙣 𝙖𝙣𝙞𝙢𝙚 𝙣𝙖𝙢𝙚 𝙩𝙤 𝙨𝙚𝙖𝙧𝙘𝙝.", event.threadID, event.messageID); 
    }

    const query = encodeURIComponent(args.join(" "));
    const searchUrl = `65.109.80.126:20511/api/animesearch?query=${query}`;

    try {
      const res = await fetch(searchUrl);
      
      if (!res.ok) {
        console.error("Failed to fetch anime data. HTTP Status: ", res.status);
        return api.sendMessage("𝙀𝙧𝙧𝙤𝙧 𝙛𝙚𝙩𝙘𝙝𝙞𝙣𝙜 𝙖𝙣𝙞𝙢𝙚 𝙙𝙖𝙩𝙖.", event.threadID, event.messageID);
      }

      const data = await res.json();
      if (!data || data.length === 0) {
        return api.sendMessage("𝙉𝙤 𝙧𝙚𝙨𝙪𝙡𝙩𝙨 𝙛𝙤𝙪𝙣𝙙.", event.threadID, event.messageID);
      }

      const selectedAnimes = data.slice(0, 10);

      let msg = "𝙎𝙚𝙡𝙚𝙘𝙩 𝙖𝙣 𝙖𝙣𝙞𝙢𝙚 𝙗𝙮 𝙧𝙚𝙥𝙡𝙮𝙞𝙣𝙜 𝙬𝙞𝙩𝙝 𝙩𝙝𝙚 𝙣𝙪𝙢𝙗𝙚𝙧:\n";
      selectedAnimes.forEach((anime, index) => {
        msg += `${index + 1}. ${anime.title} (⭐ ${anime.score})\n📺 𝙏𝙮𝙥𝙚: ${anime.type} | 🔢 𝙀𝙥𝙞𝙨𝙤𝙙𝙚𝙨: ${anime.episodes}\n📖 𝘿𝙚𝙨𝙘𝙧𝙞𝙥𝙩𝙞𝙤𝙣: ${anime.description}\n\n`;
      });

      api.sendMessage(msg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "aninfo",
          messageID: info.messageID,
          author: event.senderID,
          animeList: selectedAnimes
        });
      });
    } catch (error) {
      console.error("Error fetching anime data: ", error);
      api.sendMessage("𝙀𝙧𝙧𝙤𝙧 𝙛𝙚𝙩𝙘𝙝𝙞𝙣𝙜 𝙖𝙣𝙞𝙢𝙚 𝙙𝙖𝙩𝙖.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ event, api, Reply }) { 
    const { author, animeList, messageID } = Reply; 
    if (event.senderID !== author) return;

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > animeList.length) {
      return api.sendMessage("𝙄𝙣𝙫𝙖𝙡𝙞𝙙 𝙨𝙚𝙡𝙚𝙘𝙩𝙞𝙤𝙣. 𝙋𝙡𝙚𝙖𝙨𝙚 𝙚𝙣𝙩𝙚𝙧 𝙖 𝙫𝙖𝙡𝙞𝙙 𝙣𝙪𝙢𝙗𝙚𝙧.", event.threadID, event.messageID);
    }

    const selectedAnime = animeList[choice - 1];
    const infoUrl = `65.109.80.126:20511/api/animeinfo?url=${encodeURIComponent(selectedAnime.link)}`;

    try {
      const res = await fetch(infoUrl);
      
      if (!res.ok) {
        console.error("Failed to fetch anime details. HTTP Status: ", res.status);
        return api.sendMessage("𝙀𝙧𝙧𝙤𝙧 𝙛𝙚𝙩𝙘𝙝𝙞𝙣𝙜 𝙖𝙣𝙞𝙢𝙚 𝙙𝙚𝙩𝙖𝙞𝙡𝙨.", event.threadID, event.messageID);
      }

      const info = await res.json();

      let details = `🎬 **𝙏𝙞𝙩𝙡𝙚**: ${info.title}\n`;
      details += `📌 **𝘼𝙡𝙩𝙚𝙧𝙣𝙖𝙩𝙞𝙫𝙚 𝙏𝙞𝙩𝙡𝙚𝙨**:\n- 𝙀𝙣𝙜𝙡𝙞𝙨𝙝: ${info.alternativeTitles.english || "𝙉/𝘼"}\n- 𝙅𝙖𝙥𝙖𝙣𝙚𝙨𝙚: ${info.alternativeTitles.japanese || "𝙉/𝘼"}\n- 𝙎𝙮𝙣𝙤𝙣𝙮𝙢𝙨: ${info.alternativeTitles.synonyms || "𝙉/𝘼"}\n\n`;

      details += `📖 **𝙎𝙮𝙣𝙤𝙥𝙨𝙞𝙨**: ${info.synopsis || "𝙉𝙤 𝙨𝙮𝙣𝙤𝙥𝙨𝙞𝙨 𝙖𝙫𝙖𝙞𝙡𝙖𝙗𝙡𝙚."}\n\n`;

      details += `📺 **𝙏𝙮𝙥𝙚**: ${info.information.type}\n`;
      details += `🔢 **𝙀𝙥𝙞𝙨𝙤𝙙𝙚𝙨**: ${info.information.episodes}\n`;
      details += `📅 **𝘼𝙞𝙧𝙚𝙙**: ${info.information.aired}\n`;
      details += `🎭 **𝙂𝙚𝙣𝙧𝙚𝙨**: ${info.information.genres || "𝙉𝙤𝙣𝙚"}\n`;
      details += `🏷️ **𝘿𝙚𝙢𝙤𝙜𝙧𝙖𝙥𝙝𝙞𝙘**: ${info.information.demographic || "𝙉𝙤𝙣𝙚"}\n`;
      details += `⏳ **𝘿𝙪𝙧𝙖𝙩𝙞𝙤𝙣**: ${info.information.duration}\n`;
      details += `📑 **𝙎𝙤𝙪𝙧𝙘𝙚**: ${info.information.source}\n`;
      details += `⚠️ **𝙍𝙖𝙩𝙞𝙣𝙜**: ${info.information.rating}\n`;

      details += `⭐ **𝙎𝙘𝙤𝙧𝙚**: ${info.statistics.score} | 📊 **𝙋𝙤𝙥𝙪𝙡𝙖𝙧𝙞𝙩𝙮**: #${info.statistics.popularity} | 👥 **𝙈𝙚𝙢𝙗𝙚𝙧𝙨**: ${info.statistics.members}\n`;
      details += `❤️ **𝙁𝙖𝙫𝙤𝙧𝙞𝙩𝙚𝙨**: ${info.statistics.favorites}\n`;

      if (info.externalLinks.length > 0) {
        details += "🔗 **𝙀𝙭𝙩𝙚𝙧𝙣𝙖𝙡 𝙇𝙞𝙣𝙠𝙨**:\n";
        info.externalLinks.forEach(link => {
          details += `- [${link.name}](${link.url})\n`;
        });
        details += "\n";
      }

      details += `🔗 [𝙈𝙤𝙧𝙚 𝙄𝙣𝙛𝙤](${info.link})\n`;

      api.unsendMessage(messageID);

      api.sendMessage({
        body: details,
        attachment: await global.utils.getStreamFromURL(info.imageUrl)
      }, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error fetching anime details: ", error);
      api.sendMessage("𝙀𝙧𝙧𝙤𝙧 𝙛𝙚𝙩𝙘𝙝𝙞𝙣𝙜 𝙖𝙣𝙞𝙢𝙚 𝙙𝙚𝙩𝙖𝙞𝙡𝙨.", event.threadID, event.messageID);
    }
  } 
};
    
