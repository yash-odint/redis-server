const config = require("../config.json");
const auth = (command, args) => {
  if (command === "AUTH") {
    const [password] = args;
    if (password === config.password) {
      return {
        match: true,
      };
    }
  }
  return {
    match: false,
  };
};

module.exports = auth;
