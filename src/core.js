const logger = require("./utils/logger")("core");

const store = {};
const expirationTime = {};

const isExpired = (key) => {
    return expirationTime[key] && expirationTime[key] < Date.now();
};

const checkExpiry = (key) => {
    if(isExpired(key)){
        delete store[key];
        delete expirationTime[key];
        return true;
    }
    return false;
};

const commandHandlers = {
    SET : (args) => {
        if(args.length < 2){
            return "-ERR wrong number of arguments for 'set' command\r\n";
        }
        const [key, value] = args;
        store[key] = {type: "string", value};
        return "+OK\r\n";
    },
    GET : (args) => {
        if(args.length < 1){
            return "-ERR wrong number of arguments for 'get' command\r\n";
        }
        const [key] = args;

        if(checkExpiry(key) || !store[key] || store[key].type !== "string"){
            return "$-1\r\n";
        }
        const value = store[key].value;
        return `$${value.length}\r\n${value}\r\n`;
    },
    DEL : (args) => {
        if(args.length < 1){
            return "-ERR wrong number of arguments for 'del' command";
        }
        const [key] = args;
        if(store[key]){
            delete store[key];
            delete expirationTime[key];
            return ":1\r\n";
        } else{
            return ":0\r\n";
        }
    },
    EXPIRE : (args) => {
        if(args.length < 2){
            return "-ERR wrong number of arguments for 'expire' command\r\n";
        }
        const [key, seconds] = args;
        
        if(!store[key]) return ":0\r\n";

        expirationTime[key] = Date.now() + seconds * 1000;

        return ":1\r\n";
    },
    TTL : (args) => {
        if(args.length < 1){
            return "-ERR wrong number of arguments for 'ttl' command\r\n";
        }

        const [key] = args;

        if(!store[key]){
            return ":-2\r\n";
        }

        if(!expirationTime[key]){
            return ":-1\r\n";
        }

        const timeInMiliseconds = expirationTime[key] - Date.now();
        const ttl = Math.floor(timeInMiliseconds / 1000);
        return ttl > 0 ? `:${ttl}\r\n` : ":-2\r\n";
        
    },
    COMMAND : () => "+OK\r\n"
};

const executeCommand = (command, args) => {
    logger.log("Received " + command);
    const handler = commandHandlers[command];
    if(!handler){
        return "-ERR unknown command\r\n";
    }
    return handler(args);
};

const parseCommand = (data) => {
    const lines = data
    .toString()
    .split("\r\n")
    .filter(line => !!line);
    const command = lines[2].toUpperCase();
    const args = lines.slice(4).filter((_, index) => index % 2 == 0);
    return {
        command,
        args,
    };
};

const init = () => {
    logger.log("Persistence mode : 'in-memory'");
}

module.exports = {
    init,
    parseCommand,
    executeCommand
};
