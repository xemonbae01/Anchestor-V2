const { findUid } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	config: {
		name: "autoaddadmin",
		version: "1.0",
		author: "Redwan",
		description: {
			vi: "Tự động thêm admin khi bot được thêm vào nhóm mới",
			en: "Automatically add admins when the bot is added to a new group"
		},
		category: "system"
	},

	langs: {
		vi: {
			successAdd: "- Đã thêm thành công %1 admin vào nhóm mới",
			failedAdd: "- Không thể thêm %1 admin vào nhóm mới",
			cannotAddUser: "Bot bị chặn hoặc admin chặn người lạ thêm vào nhóm",
			approvalMode: "- Đã thêm %1 admin vào danh sách phê duyệt"
		},
		en: {
			successAdd: "- Successfully added %1 admins to the new group",
			failedAdd: "- Failed to add %1 admins to the new group",
			cannotAddUser: "Bot is blocked or the admin blocked strangers from adding to the group",
			approvalMode: "- Added %1 admins to the approval list"
		}
	},

	onEvent: async function ({ event, api, threadsData, getLang }) {
		if (event.logMessageType === "log:subscribe") {
			const { threadID } = event;

			// Fetch the current group info
			const groupInfo = await api.getThreadInfo(threadID);
			const { adminIDs, approvalMode } = groupInfo;
			const botID = api.getCurrentUserID();

			const success = {
				added: [],
				waitApproval: []
			};
			const failed = [];

			// Add each admin to the group
			for (const admin of adminIDs) {
				const adminID = admin.id;

				try {
					await api.addUserToGroup(adminID, threadID);
					if (approvalMode && !adminIDs.some(a => a.id === botID)) {
						success.waitApproval.push(adminID);
					} else {
						success.added.push(adminID);
					}
				} catch (err) {
					failed.push(adminID);
				}
			}

			// Construct a response message
			let msg = "";
			if (success.added.length) {
				msg += `${getLang("successAdd", success.added.length)}\n`;
			}
			if (success.waitApproval.length) {
				msg += `${getLang("approvalMode", success.waitApproval.length)}\n`;
			}
			if (failed.length) {
				msg += `${getLang("failedAdd", failed.length)}: ${failed.join(", ")}\n`;
			}

			// Send a summary message
			if (msg) {
				await api.sendMessage(msg, threadID);
			}
		}
	}
};
