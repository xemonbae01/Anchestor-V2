const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const log = require("./logger/log.js");
const cron = require("node-cron");

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFilePath = path.join(logDir, "restartCount.txt");
let restartCount = 0;

if (fs.existsSync(logFilePath)) {
    const fileContent = fs.readFileSync(logFilePath, "utf-8").trim();
    const lastLine = fileContent.split("\n").pop();
    const lastCount = lastLine.match(/Restart #(\d+)/);
    restartCount = lastCount ? parseInt(lastCount[1]) : 0;
}

let child;

function startProject() {
    restartCount++;
    const now = new Date().toLocaleString();
    const logEntry = `[${now}] Restart #${restartCount}\n`;
    fs.appendFileSync(logFilePath, logEntry);

    log.info(`Restarting Project... (Restart #${restartCount})`);

    if (child) {
        log.info("Stopping previous instance...");
        child.kill();
    }

    child = spawn("node", ["Goat.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (code) => {
        if (code === 2) {
            startProject();
        }
    });
}

startProject();

cron.schedule("0 */2 * * *", () => {
    log.info("Scheduled restart triggered...");
    startProject();
});

console.log("Auto-restart set for every 2 hours");
