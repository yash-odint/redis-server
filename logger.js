const debugNamespace = (process.env.DEBUG || "*")
                        .split(",")
                        .map((ns) => ns.trim());

const logger = (namespace) => {
    const log = (mode, message) => {
        const logMessage = `${new Date().toISOString()} ${mode} [${namespace}] : ${message}`;
        
        if(debugNamespace.includes("*") || debugNamespace.includes(namespace)) {
            console[mode](logMessage);
        }
    };

    return {
        log: (message) => {log("log", message)},
        error: (message) => {log("error", message)},
        warn: (message) => {log("warn", message)},
        debug: (message) => {log("debug", message)}
    };
};

module.exports = logger;