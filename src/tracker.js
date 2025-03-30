const dgram = require("dgram");
const { Buffer } = require("node:buffer");
const crypto = require("crypto");
const utils = require("./utils");
const parser = require("./parser");

module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket("udp4");
  const url = torrent.announce.toString("utf-8");

  udpSend(socket, buildConnReq(), url);

  socket.on("error", () => {
    console.error(`[!] failed to connect`);
  });
  socket.on("message", (res) => {
    if (resType(res) === "connect") {
      const connRes = parseConnRes(res);
      const announceReq = buildAnnounceReq(connRes.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (resType(res) === "announce") {
      const announceRes = parseAnnounceRes(res);
      callback(announceRes.peers);
    } else if (resType(res) === "unknown") {
      console.error("connection failed");
    }
  });
};

function udpSend(socket, message, rawUrl, callback = () => {}) {
  const url = new URL(rawUrl);
  socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

function resType(res) {
  const action = res.readUInt32BE(0);
  if (action === 0) return "connect";
  if (action === 1) return "announce";
  return "unknown";
}

function buildConnReq() {
  const buf = Buffer.alloc(16);

  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  buf.writeUInt32BE(0, 8);

  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnRes(res) {
  return {
    action: res.readUInt32BE(0),
    transactionId: res.readUInt32BE(4),
    connectionId: res.slice(8),
  };
}

function buildAnnounceReq(connId, torrent, port = 6881) {
  const buf = Buffer.allocUnsafe(98);

  connId.copy(buf, 0);
  buf.writeUInt32BE(1, 8);
  crypto.randomBytes(4).copy(buf, 12);
  parser.infoHash(torrent).copy(buf, 16);
  utils.genId().copy(buf, 36);
  Buffer.alloc(8).copy(buf, 56);
  parser.size(torrent).copy(buf, 64);
  Buffer.alloc(8).copy(buf, 72);
  buf.writeUInt32BE(0, 80);
  buf.writeUInt32BE(0, 84);
  crypto.randomBytes(4).copy(buf, 88);
  buf.writeInt32BE(-1, 92);
  buf.writeUInt16BE(port, 96);

  return buf;
}

function parseAnnounceRes(res) {
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: res.readUInt32BE(0),
    transactionId: res.readUInt32BE(4),
    leechers: res.readUInt32BE(8),
    seeders: res.readUInt32BE(12),
    peers: group(res.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join("."),
        port: address.readUInt16BE(4),
      };
    }),
  };
}
