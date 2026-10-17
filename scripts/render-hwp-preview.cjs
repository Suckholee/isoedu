// Isolated converter: a malformed native document cannot crash the web process.
const fs=require('node:fs');
const {toHtml}=require('@ohah/hwpjs');
const html=toHtml(fs.readFileSync(process.argv[2]),{includeVersion:false,includePageInfo:true});
fs.writeFileSync(process.argv[3],html);
