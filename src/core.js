const logger = require("./utils/logger")("core");
const config = require("./config.json");
const persistence = require("./persistence");
const {store, expirationTimes} = persistence;

const isExpired = (key) => {
    return expirationTimes[key] && expirationTimes[key] < Date.now();
};

const checkExpiry = (key) => {
    if(isExpired(key)){
        delete store[key];
        delete expirationTimes[key];
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
            delete expirationTimes[key];
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

        expirationTimes[key] = Date.now() + seconds * 1000;

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

        if(!expirationTimes[key]){
            return ":-1\r\n";
        }

        const timeInMiliseconds = expirationTimes[key] - Date.now();
        const ttl = Math.floor(timeInMiliseconds / 1000);
        return ttl > 0 ? `:${ttl}\r\n` : ":-2\r\n";
        
    },
    INCR : (args) => {
        if(args.length < 1){
            return "-ERR wrong number of arguments for 'incr' command\r\n";
        }

        const [key] = args;

        if(!store[key]){
            store[key] = {type: "string", value: "1"};
            return ":1\r\n";
        }

        const value = parseInt(store[key].value, 10);

        if(isNaN(value)) return "-ERR value is not an integer or out of range\r\n";
        store[key].value = (value + 1).toString();
        return `:${value + 1}\r\n`;
    },
    DECR : (args) => {
        if(args.length < 1){
            return "-ERR wrong number of arguments for 'incr' command\r\n";
        }

        const [key] = args;

        if(!store[key]){
            store[key] = {type: "string", value: "-1"};
            return ":-1\r\n";
        }

        const value = parseInt(store[key].value, 10);

        if(isNaN(value)) return "-ERR value is not an integer or out of range\r\n";
        store[key].value = (value - 1).toString();
        return `:${value - 1}\r\n`;
    },
    LPUSH : (args) => {
        if(args.length < 2){
            return "-ERR wrong number of arguments for 'lpush' command\r\n";
        }

        const [key, ...values] = args;
        if(!store[key]){
            store[key] = {type : "list", value : []};
        }

        if(store[key].type !== "list"){
            return "-ERR wrong type of key\r\n";
        }

        store[key].value.unshift(...values);

        return `:${store[key].value.length}\r\n`;

    },
    LRANGE : (args) => {
        if(args.length < 3){
            return "-ERR wrong number of arguments for 'lrange' command";
        }

        const [key, start, stop] = args;

        if(checkExpiry(key) || !store[key] || store[key].type !== "list"){
            return "$-1\r\n";
        }

        const list = store[key].value;
        const startIndex = parseInt(start, 10);
        const stopIndex = parseInt(stop, 10);
        const range = list.slice(startIndex, stopIndex + 1);
        
        let response = `*${range.length}\r\n`;
        range.forEach(item => {
            response += `$${item.length}\r\n${item}\r\n`;
        });

        return response;

    },
    RPUSH : (args) => {
        if(args.length < 2){
            return "-ERR wrong number of arguments for 'rpush' command\r\n";
        }

        const [key, ...values] = args;
        if(!store[key]){
            store[key] = {type : "list", value : []};
        }

        if(store[key].type !== "list"){
            return "-ERR wrong type of key\r\n";
        }

        store[key].value.push(...values);

        return `:${store[key].value.length}\r\n`;

    },
    LPOP : (args) => {
        if(args.length < 1){
            return "-ERR wrong number of arguments for 'lpop' command\r\n";
        }

        const [key] = args;

        if(checkExpiry(key) || !store[key] || store[key].type !== "list" || store[key].value.length === 0){
            return "$-1\r\n";
        }

        const list = store[key].value;
        const poppedValue = list.shift();

        return `$${poppedValue.length}\r\n${poppedValue}\r\n`;

    },
    RPOP : (args) => {
        if(args.length < 1){
            return "-ERR wrong number of arguments for 'rpop' command\r\n";
        }

        const [key] = args;

        if(checkExpiry(key) || !store[key] || store[key].type !== "list" || store[key].value.length === 0){
            return "$-1\r\n";
        }
        
        const list = store[key].value;
        const poppedValue = list.pop();

        return `$${poppedValue.length}\r\n${poppedValue}\r\n`;

    },
    COMMAND : () => "+OK\r\n"
};

const executeCommand = (command, args) => {
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
    if(config.snapshot){
        logger.log("Persistence mode : 'snapshot'");
        persistence.loadSnapshotSync();

        setInterval(async () => {
            await persistence.saveSnapshot();
        }, config.snapshotInterval)
    } else{
        logger.log("Persistence mode : 'in-memory'");
    }
}

module.exports = {
    init,
    parseCommand,
    executeCommand
};
