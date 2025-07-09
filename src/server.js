const net = require("net");
const logger = require("./utils/logger")("server");
const { parseCommand, executeCommand, init } = require("./core");
const authUser = require("./utils/auth");

const server = net.createServer();
const port = 6379;
const host = "127.0.0.1";

server.on("connection", (socket) => {
  logger.log("Connection connected");

  socket.isAuthenticated = false;

  socket.on("data", (data) => {
    let response;
    try {
      const { command, args } = parseCommand(data);

      if (!socket.isAuthenticated && command === "AUTH") {
        const { match } = authUser(command, args);
        socket.isAuthenticated = match;
      }

      response = executeCommand(command, args, {
        isAuth: socket.isAuthenticated,
      });
    } catch (err) {
      response = "-ERR unknown command\r\n";
    }
    socket.write(response);
  });

  socket.on("end", () => {
    logger.log("Connection disconnected");
  });
});

server.listen(port, host, () => {
  init();
  logger.log(`Server running on ${host}:${port}`);
});
