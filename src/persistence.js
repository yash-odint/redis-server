const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

const logger = require("./utils/logger")("persistence");

class Persistence {
  DATA_FILE = path.join(__dirname, "data.rdb");
  AOF_FILE = path.join(__dirname, "data.aof");

  constructor() {
    this.store = {};
    this.expirationTimes = {};
  }

  async saveSnapshot() {
    const data = JSON.stringify({
      store: this.store,
      expirationTimes: this.expirationTimes,
    });

    try {
      await fsp.writeFile(this.DATA_FILE, data);
      logger.log(`Saved datastore to file: ${this.DATA_FILE}`);
    } catch (error) {
      logger.error(`Failed to save datastore: ${error.message}`);
    }
  }

  loadSnapshotSync() {
    try {
      const data = fs.readFileSync(this.DATA_FILE).toString();

      if (data) {
        const { store: loadedStore, expirationTimes: loadedExpirationTimes } =
          JSON.parse(data);

        Object.assign(this.store, loadedStore);
        Object.assign(this.expirationTimes, loadedExpirationTimes);

        logger.log(`Datastore loaded successfully`);
      }
    } catch (error) {
      logger.error(`Failed to load datastore`);
    }
  }

  async appendAof(command, args) {
    let aofLog = `${command} ${args.join(" ")}\r\n`;
    try {
      await fsp.appendFile(this.AOF_FILE, aofLog);
      logger.log(`Appended to AOF file : ${aofLog.trim()}`);
    } catch (error) {
      logger.error(`Failed to append to AOF file : ${error.message}`);
    }
  }

  replayAofSync(executeCommand) {
    if (!fs.existsSync(this.AOF_FILE)) return;

    try {
      const data = fs.readFileSync(this.AOF_FILE).toString();

      if (!data) return;

      const logs = data.split("\r\n").filter(Boolean);

      logger.log("Replay AOF started");

      for (const logEntry of logs) {
        const [command, ...args] = logEntry.split(" ");
        executeCommand(command, args, true);
      }
    } catch (error) {
      logger.error(`Failed to replay AOF: ${error.message}`);
    }
  }
}

module.exports = new Persistence();
