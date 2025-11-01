const { log } = global.utils;
const config = require('../config.json'); 

module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText }) {
    
    
    log.info("Bot Info", "This bot has been fully modified by Redwan (xemon). Thanks for using my project.");

    
    setInterval(async () => {
        api.refreshFb_dtsg()
            .then(() => {
                log.success("refreshFb_dtsg", getText("custom", "refreshedFb_dtsg"));
            })
            .catch((err) => {
                log.error("refreshFb_dtsg", getText("custom", "refreshedFb_dtsgError"), err);
            });
    }, 1000 * 60 * 60 * 48); 
};
