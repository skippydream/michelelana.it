// Driver CDP minimo: nessuna dipendenza, usa il WebSocket integrato in Node 22.
import { writeFileSync } from 'node:fs';

const [,, target, outFile, wStr, hStr, waitStr] = process.argv;
const W = +(wStr || 1400), H = +(hStr || 1050), WAIT = +(waitStr || 12000);

const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);

let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise(res => { const i = ++id; pending.set(i, res);
                       ws.send(JSON.stringify({ id: i, method, params })); });

ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});

await new Promise(r => ws.addEventListener('open', r));

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',
           { width: W, height: H, deviceScaleFactor: 1, mobile: false });
// posizione simulata: Torino. Così l'app carica dati reali invece di restare in attesa.
await send('Browser.grantPermissions',
           { origin: new URL(target).origin, permissions: ['geolocation'] });
await send('Emulation.setGeolocationOverride',
           { latitude: 45.0703, longitude: 7.6869, accuracy: 50 });

await send('Page.navigate', { url: target });
await new Promise(r => setTimeout(r, WAIT));          // attesa vera, non virtuale

const { data } = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(outFile, Buffer.from(data, 'base64'));
console.log(`${outFile}  ${(Buffer.from(data,'base64').length/1024|0)} KB`);
ws.close();
process.exit(0);
