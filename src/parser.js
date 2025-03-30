const bencode = require("bencode");
const crypto = require("crypto");
const bignum = require("bignum");

module.exports.decode = (data) => {
  const torrent = bencode.decode(data);
  if (!torrent.announce)
    torrent.announce = "udp://tracker.opentrackr.org:1337/announce";
  return torrent;
};

module.exports.infoHash = (torrent) => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash("sha1").update(info).digest();
};

module.exports.size = (torrent) => {
  const size = torrent.info.files
    ? torrent.info.files
        .map((file) => file.length)
        .reduce((acc, len) => acc + len)
    : torrent.info.length;

  return bignum.toBuffer(size, { size: 8 });
};

module.exports.BLOCK_LEN = Math.pow(2, 14);

module.exports.pieceLen = (torrent, pieceIndex) => {
  const totalLength = bignum.fromBuffer(this.size(torrent)).toNumber();
  const pieceLength = torrent.info["piece length"];
  const lastPieceLength = totalLength % pieceLength;
  const lastPieceIndex = Math.floor(totalLength / pieceLength);

  return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
};

module.exports.blocksPerPiece = (torrent, pieceIndex) => {
  const pieceLength = this.pieceLen(torrent, pieceIndex);
  return Math.ceil(pieceLength / this.BLOCK_LEN);
};

module.exports.blockLen = (torrent, pieceIndex, blockIndex) => {
  const pieceLength = this.pieceLen(torrent, pieceIndex);
  const lastPieceLength = pieceLength % this.BLOCK_LEN;
  const lastPieceIndex = Math.floor(pieceLength / this.BLOCK_LEN);

  return blockIndex === lastPieceIndex ? lastPieceLength : this.BLOCK_LEN;
};
