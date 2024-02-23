const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('6895852282:AAEKSv96V4-oJg7BKnnTTOJMKibTXdq6sZI');
const targetBotId = '5306177516'; // Replace with the desired target bot's ID
const jobRequests = {};

bot.start((ctx) => ctx.reply("Assalomu alaykum! Tabriklayman, mening ish yuklaydigan botimga gap qilib berishingizdan xursandman. Boshlanishga, qaysi ish ekanligi haqidaizohlab bering agar sizning ma'lumotlaringiz faylda bo'lsa, faylni junatishingiz mumkin. Ko'proq ma'limot uchun /help tugmasini bosing"));

// Function to generate formatted text for job request
function formatJobRequest(jobRequest) {
    return `*Ishga so'rov*\n\n` +
           `Tavsif: ${jobRequest.description}\n\n` +
           `Habar: ${jobRequest.message}`;
}
bot.command('help', (ctx) => {
    ctx.reply("Ish so'rovi botiga xush kelibsiz!\n\n" +
              "Siz menga bunday ish haqida ma'lumotlarni junating:\n" +
              '- Talablar.\n' +
              '- Kompaniya.\n' +
              '- Ish turi.\n' +
              '- Maosh. Yoki (suhbat asosida)\n' +
              '- Qo‘shimcha.\n' +
              '- Murojaat uchun(aloqa uchun raqam)\n' +
              '- Manzil.\n\n' +
              '- Qulayliklar.(Shartmas)\n\n' +
              "Agar sizning ma'lumotlaringiz faylda bo'lsa, faylni junatishingiz mumkin. Boshlash uchun /start ni bosing");
});
bot.on('text', async (ctx) => {
    const userId = ctx.message.from.id;
    const message = ctx.message.text;

    if (!message) return; // Ignore empty messages

    console.log('Received message:', message);

    if (!jobRequests[userId]) {
        const messageId = ctx.message.message_id; // Store message ID
        jobRequests[userId] = { userId, messageId, message };
        console.log('New job request:', jobRequests[userId]);
        return ctx.reply("Iltimos, izlayotgan ish haqida qushimcha ma'lumot bering.");
    }

    const userRequest = jobRequests[userId];

    if (!userRequest.description) {
        userRequest.description = message;
        console.log('Job description:', userRequest.description);
        return ctx.reply('Iltimos, ish turi, ish haqi kutilishi va h.k. kabi batafsil maʼlumotlarni kiriting.');
    }

    // Confirmation message with job request details
    await ctx.replyWithMarkdown(
        `Iltimos, ish so'rovingizni ko'rib chiqing:\n\n${formatJobRequest(userRequest)}`,
        Markup.inlineKeyboard([
            Markup.button.callback('Ha', 'confirm'),
            Markup.button.callback("Yo'q", 'cancel')
        ])
    );
});

// Handling files or photos
bot.on(['photo', 'document'], async (ctx) => {
    const userId = ctx.message.from.id;
    const fileId = ctx.message.photo ? ctx.message.photo[0].file_id : ctx.message.document.file_id;
    const description = ctx.message.caption || 'Fayl biriktirilgan';

    console.log('Received file or photo with ID:', fileId);

    if (!jobRequests[userId]) {
        const messageId = ctx.message.message_id; // Store message ID
        jobRequests[userId] = { userId, messageId, fileId, description };
        console.log('New job request:', jobRequests[userId]);
        return ctx.reply("Iltimos, izlayotgan ish haqida qushimcha ma'lumot bering.");
    }

    const userRequest = jobRequests[userId];

    if (!userRequest.description) {
        userRequest.description = description;
        console.log('Job description:', userRequest.description);
        return ctx.reply('Iltimos, ish turi, ish haqi kutilishi va h.k. kabi batafsil maʼlumotlarni kiriting.');
    }

    // Confirmation message with job request details
    await ctx.replyWithMarkdown(
        `Please review your job request:\n\n${formatJobRequest(userRequest, false)}`,
        Markup.inlineKeyboard([
            Markup.button.callback('Ha', 'confirm'),
            Markup.button.callback("Yo'q", 'cancel')
        ])
    );
});

// Handling skipping
bot.action('skip', async (ctx) => {
    const userId = ctx.update.callback_query.from.id;

    // Skip directly to providing a message
    await ctx.reply("Iltimos, izlayotgan ish haqida qushimcha ma'lumot bering.Agar yo'q bo'lsa yo'q deb yozing");
});


// Handling confirmation or cancellation
bot.action('confirm', async (ctx) => {
    // Fetch job request based on the user's ID
    const userId = ctx.update.callback_query.from.id;
    const userRequest = jobRequests[userId];

    // Forward the message
    await bot.telegram.forwardMessage(targetBotId, ctx.chat.id, userRequest.messageId, userId);
    
    // Notify user
    ctx.reply("Sizning ish so'rovingiz qabul qilindi. Rahmat!");

    // Cleanup
    delete jobRequests[userId];
});

bot.action('cancel', (ctx) => {
    ctx.reply('Operatsiya bekor qilindi.');
    const userId = ctx.update.callback_query.from.id;
    delete jobRequests[userId];
});

bot.launch();
