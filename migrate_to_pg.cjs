const fs = require('fs');

const srcServer = 'D:\\Code\\CMR TM Movads\\deploy\\backend\\src\\server\\server.ts';
const dstServer = 'd:\\Code\\Sky Mobile 2\\So-do-to-chuc\\Sky-Mobile-2\\src\\server\\server.ts';

let srvContent = fs.readFileSync(srcServer, 'utf-8');
const usersIdx = srvContent.indexOf("app.get('/api/users'");
const errHandlerIdx = srvContent.indexOf('// Global Error Handler');

if (usersIdx !== -1 && errHandlerIdx !== -1) {
  const routesToCopy = srvContent.substring(usersIdx, errHandlerIdx);
  
  let mySrvContent = fs.readFileSync(dstServer, 'utf-8');
  if (!mySrvContent.includes("app.get('/api/users'")) {
    mySrvContent += '\n\n' + routesToCopy;
    fs.writeFileSync(dstServer, mySrvContent);
    console.log('Migrated routes to server.ts');
  } else {
    console.log('Routes already exist in server.ts');
  }
} else {
    console.log('Could not find indices', usersIdx, errHandlerIdx);
}
