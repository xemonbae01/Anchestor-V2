const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "whitelist",
    aliases: ["wl"],
    version: "1.0",
    author: "NTKhang",
    countDown: 5,
    role: 2,
    description: {
      vi: "Thêm, xóa, sửa quyền admin",
      en: "Add, remove, edit admin role"
    },
    category: "owner",
    guide: {
      vi: '   {pn} [add | -a] <uid | @tag>: Thêm quyền admin cho người dùng' +
        '\n	  {pn} [remove | -r] <uid | @tag>: Xóa quyền admin của người dùng' +
        '\n	  {pn} [list | -l]: Liệt kê danh sách admin',
      en: '   {pn} [add | -a] <uid | @tag>: Add admin role for user' +
        '\n	  {pn} [remove | -r] <uid | @tag>: Remove admin role of user' +
        '\n	  {pn} [list | -l]: List all admins'
    }
  },

  langs: {
    en: {
      added: "✅ | Added whiteListIds role for %1 user:\n%2",
      alreadyAdmin: "\n⚠ | %1 user already have whiteListIds role:\n%2",
      missingIdAdd: "⚠ | Please enter TID to add whiteListIds role",
      removed: "✅ | Removed whiteListIds role of %1 user:\n%2",
      notAdmin: "⚠ | %1 users don't have whiteListIds role:\n%2",
      missingIdRemove: "⚠ | Please enter TID to remove whiteListIds role",
      listAdmin: "👑 | List of whiteListIds:\n%1",
      whiteListModeEnable: "✅ | whiteListMode has been enabled",

      whiteListModeDisable: "✅ | whiteListMode has been disabled"
    }
  },

  onStart: async function({ message, args, usersData, event, getLang }) {
    switch (args[0]) {
      case "add":
      case "-a": {
        if (args[1]) {
          let uids = [];
          if (Object.keys(event.mentions).length > 0)
            uids = Object.keys(event.mentions);
          else if (event.messageReply)
            uids.push(event.messageReply.senderID);
          else
            uids = args.filter(arg => !isNaN(arg));
          const notAdminIds = [];
          const adminIds = [];
          for (const uid of uids) {
            if (config.whiteListMode.whiteListIds.includes(uid))
              adminIds.push(uid);
            else
              notAdminIds.push(uid);
          }

          config.whiteListMode.whiteListIds.push(...notAdminIds);
          const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
          return message.reply(
            (notAdminIds.length > 0 ? getLang("added", notAdminIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "") +
            (adminIds.length > 0 ? getLang("alreadyAdmin", adminIds.length, adminIds.map(uid => `• ${uid}`).join("\n")) : "")
          );
        }
        else
          return message.reply(getLang("missingIdAdd"));
      }
      case "remove":
      case "-r": {
        if (args[1]) {
          let uids = [];
          if (Object.keys(event.mentions).length > 0)
            uids = Object.keys(event.mentions)[0];
          else
            uids = args.filter(arg => !isNaN(arg));
          const notAdminIds = [];
          const adminIds = [];
          for (const uid of uids) {
            if (config.whiteListMode.whiteListIds.includes(uid))
              adminIds.push(uid);
            else
              notAdminIds.push(uid);
          }
          for (const uid of adminIds)
            config.whiteListMode.whiteListIds.splice(config.adminBot.indexOf(uid), 1);
          const getNames = await Promise.all(adminIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
          return message.reply(
            (adminIds.length > 0 ? getLang("removed", adminIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "") +
            (notAdminIds.length > 0 ? getLang("notAdmin", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n")) : "")
          );
        }
        else
          return message.reply(getLang("missingIdRemove"));
      }
      case "list":
      case "-l": {
        const getNames = await Promise.all(config.whiteListMode.whiteListIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
        return message.reply(getLang("listAdmin", getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")));
      }
      case "enable":
      case "on": {
        config.whiteListMode.enable = true;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("whiteListModeEnable"));
      }
      case "disable":
      case "off": {
        config.whiteListMode.enable = false;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("whiteListModeDisable"));
      }
      default:
        return message.SyntaxError();
    }
  }
};
