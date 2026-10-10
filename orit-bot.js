const http = require('http');
http.createServer((req,res)=>res.writeHead(200).end('Bot alive')).listen(process.env.PORT||10000);
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote'] }
});
client.on('qr', qr => { console.log('QR_RECEIVED'); qrcode.generate(qr, {small: true}); });
client.on('ready', () => console.log('Client is ready!'));
client.on('message', async msg => {
  if (msg.from.includes('@g.us')) return;
  try {
    const c = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: msg.body }] });
    client.sendMessage(msg.from, c.choices[0].message.content);
  } catch (e) { console.log(e.message); }
});
client.initialize();
