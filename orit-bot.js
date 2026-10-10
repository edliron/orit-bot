const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { OpenAI } = require('openai');

const GROUP_NAME = "מנהלות באר שבע🌺";
const EMAIL_TO = "1002115334@edu-darom.org.il";

if (!fs.existsSync('./files')) fs.mkdirSync('./files');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const client = new Client({
    authStrategy: new LocalAuth(),
puppeteer: { 
      headless: true, 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ] 
    }
client.on('qr', qr => {
    console.log('--- סרקי את ה-QR הזה בוואטסאפ ---');
    qrcode.generate(qr, {small: true});
});
client.on('ready', () => console.log('הבוט מוכן ומאזין לקבוצה: ' + GROUP_NAME));

client.on('message', async msg => {
    try {
        const chat = await msg.getChat();
        if (!chat.isGroup || chat.name!== GROUP_NAME) return;

        const contact = await msg.getContact();
        const authorName = contact.pushname || contact.name || "";
        if (!authorName.includes("אורית") &&!msg.author.includes("אורית")) {
             // בדיקה נוספת לפי שם - אם אצלך היא שמורה אחרת תגידי לי
             if(!msg.body.includes("אורית")) {
                // נבדוק רק אם השולח זה אורית זוזוט - לפי המספר שלה אם צריך
             }
        }

        console.log(`נתפסה הודעה מאורית: ${msg.body.substring(0,50)}`);

        let attachments = [];
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            const filename = `./files/${Date.now()}_${media.filename || 'file.pdf'}`;
            fs.writeFileSync(filename, media.data, 'base64');
            attachments.push(filename);
        }

        // סיכום עם OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{role: "user", content: `נסחי כמשימה לביצוע בעברית ברורה. אם זו לא משימה - תחזירי "לא משימה": ${msg.body}`}]
        });
        const summary = completion.choices[0].message.content;

        if (summary.includes("לא משימה")) {
            console.log("זו לא משימה, לא שולח מייל");
            return;
        }

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
        });

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: EMAIL_TO,
            subject: `משימה חדשה מאורית זוזוט - ${new Date().toLocaleDateString('he-IL')}`,
            text: `הודעה מקורית:\n${msg.body}\n\n---\nסיכום משימה:\n${summary}`,
            attachments: attachments.map(f => ({ path: f }))
        });
        console.log("מייל נשלח בהצלחה!");

    } catch (e) { console.error(e); }
});

client.initialize();
