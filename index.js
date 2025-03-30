#!/usr/bin/env node

const parser = require("./src/parser");
const download = require("./src/download");
const Magnet2torrent = require("magnet2torrent-js");

const magnet = process.argv[2];
if (!magnet) {
  console.log("usage:");
  console.log('    bitter ["magnet_link"]');
  process.exit(1);
}

const m2t = new Magnet2torrent({ timeout: 60 });

m2t
  .getTorrent(magnet)
  .then((tor) => {
    const torrent = parser.decode(tor.toTorrentFile());
    console.log(`[*] torrent: ${torrent.info.name}`);

    download(torrent, torrent.info.name);
  })
  .catch((e) => {
    console.error("[!] invalid magnet", e);
  });
