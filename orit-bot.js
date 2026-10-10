const http = require('http');
let lastQR = '';

const server = http.createServer((req,res)=>{
  if(lastQR){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column"><h1>סרקי אותי בוואטסאפ</h1><img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(lastQR)}" /><p>מתרענן כל 30 שניות</p><script>setTimeout(()=>location.reload(), 30000)</script></body></html>`);
  } else {
    res.writeHead(200).end('Bot alive - waiting for QR...');
  }
});
server.listen(process.env.PORT||10000);

const { Client, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote'] }
});

client.on('qr', qr => {
  lastQR = qr;
  console.log('QR updated - open your render URL to scan');
});

client.on('ready', () => { console.log('Client is ready!'); lastQR = ''; });
client.on('message', async msg => {
  if (msg.from.includes('@g.us')) return;
  try {
    const c = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: msg.body }] });
    client.sendMessage(msg.from, c.choices[0].message.content);
  } catch (e) { console.log(e.message); }
});
client.initialize();
