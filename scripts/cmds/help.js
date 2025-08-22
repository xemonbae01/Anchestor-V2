const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "1.20",
    author: "Redwan",
    countDown: 0,
    role: 0,
    shortDescription: {
      en: "View all bot commands with styled layout"
    },
    longDescription: {
      en: "Dynamically list all categorized bot commands using elegant format"
    },
    category: "info",
    guide: {
      en: "{pn} / help <command>"
    }
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);

    if (args.length === 0) {
      const allCategories = {};

      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;
        const category = (value.config.category || "Others").toUpperCase();
        allCategories[category] = allCategories[category] || [];
        allCategories[category].push(name);
      }

      const categoryTitles = {
        "AI-CHAT": "𝗔𝗜 𝘾𝙃𝘼𝙏𝙄𝙉𝙂",
        "AI-IMAGE": "𝗔𝗜 𝙄𝙈𝘼𝙂𝙀 𝙂𝙀𝙉𝙀𝙍𝘼𝙏𝙄𝙊𝙉",
        "OTHERS": "𝙊𝙏𝙃𝙀𝙍𝙎"
      };

      let finalMsg = "Redwans Bot's CMDS\n";

      for (const [rawCategory, cmds] of Object.entries(allCategories)) {
        let titleKey = rawCategory.toUpperCase();
        let boxTitle = categoryTitles[titleKey] || titleKey;

        finalMsg += `\n╭─╼━━━━━━━━╾─╮\n│    ${boxTitle}\n`;
        for (const cmd of cmds.sort()) {
          finalMsg += `│ • ${cmd}\n`;
        }
        finalMsg += `╰─╼━━━━━━━━╾─╯\n`;
      }

      finalMsg += `\n╭─╼━━━━━━━━╾─╮
│   𝘼𝙗𝙤𝙪𝙩 𝘽𝙊𝙏
│ - only AI related cmd
│   available.
│ - Only active for personal
│   usages
│ - Not Available in other's GC
╰─━━━━━━━━━╾─╯

─────⭔
│ » Type ${prefix}help <cmd> to learn.
├────────⭔
│ [Redwan | 𝙏𝙚𝙩𝙧𝙤𝙭𝙞𝙙𝙚]
╰─────────────

🌟 Have a great time! 🌟`;

      return message.reply(finalMsg);
    } else {
      const input = args[0].toLowerCase();
      const command = commands.get(input) || commands.get(aliases.get(input));
      if (!command) return message.reply(`Command "${input}" not found.`);

      const cfg = command.config;
      const roleStr = ["All Users", "Group Admin", "Bot Admin"][cfg.role] || "Unknown";

      const usage = (cfg.guide?.en || "No guide available.")
        .replace(/{p}/g, prefix)
        .replace(/{n}/g, cfg.name);

      return message.reply(
        `╭── INFO FOR '${cfg.name}' ─⭓
├ Description: ${cfg.longDescription?.en || "No description"}
├ Aliases: ${cfg.aliases?.join(", ") || "None"}
├ Version: ${cfg.version || "1.0"}
├ Role: ${roleStr}
├ Cooldown: ${cfg.countDown || 0}s
├ Author: ${cfg.author || "Unknown"}
├ Usage: ${usage}
╰━━━━━━━━━━━━━`
      );
    }
  }
};
