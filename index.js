#!/usr/bin/env node

const parser = require("./src/parser");
const download = require("./src/download");

const torrent = parser.open("file.torrent");
console.log(`[*] torrent: ${torrent.info.name}`);

download(torrent, torrent.info.name);
