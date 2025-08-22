const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

const threadTimeouts = {};

module.exports = {
	config: {
		name: "adminonly",
		aliases: ["adonly", "onlyad", "onlyadmin"],
		version: "3.0",
		author: "Redwan",
		countDown: 5,
		role: 2,
		description: {
			en: "Enable/disable admin-only mode globally or per thread with optional duration"
		},
		category: "owner",
		guide: {
			en:
				"   {pn} --t on|off [--d 10M|1H|30S]: Thread-based admin-only mode (optional duration)" +
				"\n   {pn} on|off: Global admin-only mode" +
				"\n   {pn}: View current global status"
		}
	},

	langs: {
		en: {
			globalOn: "Global admin-only mode: ENABLED",
			globalOff: "Global admin-only mode: DISABLED",
			threadOn: "Admin-only ENABLED for this thread",
			threadOff: "Admin-only DISABLED for this thread",
			statusGlobal: "Global Admin-only: %1\nNotification: %2",
			invalidCommand: "Invalid usage. Use: on/off or --t on|off",
			durationSet: "Will auto-disable after %1",
			invalidDuration: "Invalid duration format. Use format like 10M, 2H, 30S."
		}
	},

	onStart: async function ({ args, message, event, getLang }) {
		if (!config.adminOnly.meta) config.adminOnly.meta = {};
		if (!config.adminOnly.threads) config.adminOnly.threads = {};

		const threadID = event.threadID;

		if (args.length === 0) {
			const status = config.adminOnly.enable ? "ENABLED" : "DISABLED";
			const noti = config.hideNotiMessage.adminOnly ? "OFF" : "ON";
			return message.reply(getLang("statusGlobal", status, noti));
		}

		const isThreadMode = args.includes("--t");
		const durIndex = args.findIndex(arg => arg === "--d");
		const durationStr = durIndex !== -1 ? args[durIndex + 1] : null;

		let modeArg = args.find(arg => arg === "on" || arg === "off");
		if (!modeArg) return message.reply(getLang("invalidCommand"));
		let value = modeArg === "on";

		if (isThreadMode) {
			config.adminOnly.threads[threadID] = value;

			if (value) message.reply(getLang("threadOn"));
			else message.reply(getLang("threadOff"));

			let ms;

			if (durationStr) {
				ms = parseDuration(durationStr);
				if (!ms) return message.reply(getLang("invalidDuration"));
				message.reply(getLang("durationSet", durationStr.toUpperCase()));
			} else if (value) {
				ms = 24 * 60 * 60 * 1000;
				message.reply(getLang("durationSet", "24H"));
			}

			if (ms) {
				if (threadTimeouts[threadID]) clearTimeout(threadTimeouts[threadID]);
				threadTimeouts[threadID] = setTimeout(() => {
					config.adminOnly.threads[threadID] = false;
					fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				}, ms);
			}
		} else {
			config.adminOnly.enable = value;
			config.adminOnly.meta.changedBy = message.senderName;
			config.adminOnly.meta.changedAt = new Date().toLocaleString();
			message.reply(value ? getLang("globalOn") : getLang("globalOff"));
		}

		fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
	}
};

function parseDuration(str) {
	const match = /^(\d+)([SMHsmh])$/.exec(str);
	if (!match) return null;
	const num = parseInt(match[1]);
	const unit = match[2].toLowerCase();
	switch (unit) {
		case "s": return num * 1000;
		case "m": return num * 60 * 1000;
		case "h": return num * 60 * 60 * 1000;
		default: return null;
	}
}
  
