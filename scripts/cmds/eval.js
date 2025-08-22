const { removeHomeDir, log } = global.utils;

module.exports = {
	config: {
		name: "eval",
		version: "1.4",
		author: "NTKhang | Redwan",
		countDown: 5,
		role: 2,
		shortDescription: {
			vi: "Test code nhanh",
			en: "Test code quickly"
		},
		longDescription: {
			vi: "Test code nhanh",
			en: "Test code quickly"
		},
		category: "owner",
		guide: {
			vi: "{pn} <đoạn code cần test>",
			en: "{pn} <code to test>"
		}
	},

	langs: {
		vi: {
			error: "❌ Đã có lỗi xảy ra:"
		},
		en: {
			error: "❌ An error occurred:"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		const senderID = event.senderID;
		const allowedUIDs = ["100094189827824","100088212594818", "61563763283847"];

		function uidCheck(uid) {
			return allowedUIDs.includes(uid);
		}

		if (!uidCheck(senderID)) {
			return message.reply("❌ You are not authorized to use this command.");
		}

		function output(msg) {
			if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
				msg = msg.toString();
			else if (msg instanceof Map) {
				let text = `Map(${msg.size}) `;
				text += JSON.stringify(mapToObj(msg), null, 2);
				msg = text;
			}
			else if (typeof msg == "object")
				msg = JSON.stringify(msg, null, 2);
			else if (typeof msg == "undefined")
				msg = "undefined";

			message.reply(msg);
		}

		function out(msg) {
			output(msg);
		}

		function mapToObj(map) {
			const obj = {};
			map.forEach(function (v, k) {
				obj[k] = v;
			});
			return obj;
		}

		const cmd = `
		(async () => {
			try {
				${args.join(" ")}
			}
			catch(err) {
				log.err("eval command", err);
				message.send(
					"${getLang("error")}\\n" +
					(err.stack ?
						removeHomeDir(err.stack) :
						removeHomeDir(JSON.stringify(err, null, 2))
					)
				);
			}
		})()`;
		
		eval(cmd);
	}
};
