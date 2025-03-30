const crypto = require("crypto");
const { Buffer } = require("node:buffer");

let id = null;

module.exports.genId = () => {
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from("-BT0001-").copy(id, 0);
  }

  return id;
};
