require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const ADMIN_ID = '8147658483'; // Used for admin commands and notifications
const GALLERY_CHANNEL_ID = '@barnichok'; // Admin Showcase Gallery Channel

if (!TELEGRAM_BOT_TOKEN) {
    console.error("Missing TELEGRAM_BOT_TOKEN in environment variables");
    process.exit(1);
}
if (!GOOGLE_CLOUD_PROJECT) {
    console.error("Missing GOOGLE_CLOUD_PROJECT in environment variables");
    process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

const USERS_FILE = path.join(__dirname, 'users.json');
const PROMOS_FILE = path.join(__dirname, 'promos.json');

// --- i18n Definitions ---
const i18n = {
    en: {
        languageName: "English 🇬🇧",
        welcome: "Welcome to the Veo Video Generation Bot!\n\nYou have 1 free generation to start. Click the buttons below or send me a text prompt or an image with a caption.",
        btnGenerate: "🎬 Generate Video",
        btnProfile: "👤 My Profile",
        btnBuy: "⭐️ Buy Generations",
        btnInvite: "🤝 Invite Friend",
        profileInfo: "👤 **My Profile**\n\n🆔 ID: `{userId}`\n🎥 Remaining Generations: **{quota}**\n🤝 Referral Progress: **{refCount}/3**\n🔥 Streak: **{streak} days**",
        vipUnlimited: "♾️ Unlimited (VIP)",
        buyPrompt: "How many generations would you like to buy? Please enter a number (e.g., 5). Each generation costs 50 ⭐️ Telegram Stars.",
        buyVipIgnore: "You are a VIP! You have unlimited generations and don't need to buy any.",
        generatePrompt: "Please send me your text prompt or upload an image with a caption to generate a video. Note: Audio generation is enabled, so you can include audio cues in your prompt!",
        invalidNumber: "Please enter a valid positive number.",
        buyInvoiceTitle: "Buy {amount} Generations",
        buyInvoiceDesc: "Purchase {amount} video generations for the Veo Bot.",
        buyLabel: "{amount} Generations",
        paymentSuccess: "✅ Payment successful! Added {amount} generation(s) to your quota.",
        referralLinkMsg: "🤝 <b>Invite a Friend!</b>\n\nShare this link with your friends. For every <b>3 new users</b> who start the bot using your link, you will receive <b>+1 free generation</b>!\n\nYour referral link:\n{link}",
        referralEarned: "🎉 Someone joined using your link! You've invited 3 friends and just received **+1 free generation**! Your progress has been reset.",
        referralProgress: "🎉 Someone joined using your link! You have invited {count}/3 friends. Invite {needed} more to get a free generation!",
        noQuota: "You don't have any generations left! You can wait until your 24-hour cooldown resets, or purchase more.",
        btnRestoreBonus: "⚡️ Restore Now + 1 Bonus (50 ⭐️)",
        selectFormat: "Please select the aspect ratio for your video:",
        landscape: "16:9 (Landscape)",
        portrait: "9:16 (Portrait)",
        square: "1:1 (Square)",
        generating: "⏳ Generating video, this might take a few minutes...",
        errorWait: "An error occurred while generating the video. Your quota has been refunded. Please try again later.",
        errorVipWait: "An error occurred while generating the video. Please try again later.",
        sessionExpired: "Session expired or invalid state. Please send your prompt again.",
        quotaDepletedWait: "You don't have enough quota.",
        restoredQuota: "✅ Your daily free generation has been restored!",
        restoreInvoiceTitle: "Restore + 1 Bonus",
        restoreInvoiceDesc: "Instantly restore your daily generation and get +1 bonus generation.",
        selectStyle: "Choose a visual style:",
        styleCinematic: "🎬 Cinematic",
        styleAnime: "🏮 Anime",
        styleCyberpunk: "🌌 Cyberpunk",
        styleNone: "✨ None",
        queuePosition: "⏳ You are #{position} in line...",
        adminGrantedVip: "🎁 The admin has granted you VIP status! Enjoy unlimited generations.",
        adminAddedQuota: "🎁 The admin has added {amount} generations to your balance!",
        streakBonus3: "🔥 You hit a 3-day streak! You've received a +1 generation bonus!",
        streakBonus7: "🔥 You hit a 7-day streak! You've received a +3 generation bonus!",
        inactivityReminder: "We miss you! 👋 Come back and generate some amazing videos today!",
        btnExtend: "➕ Extend Video (Cost: 2)",
        extendNotSupported: "Video extension functionality is coming soon!",
        extendInsufficientQuota: "You need 2 generations to extend a video.",
        extendSuccess: "⏳ Extending your video, please wait...",
        promoSuccess: "🎉 Promo code applied successfully! You received {amount} generation(s).",
        promoInvalid: "❌ This promo code is invalid, expired, or has reached its usage limit.",
        promoUsed: "❌ You have already used this promo code.",
        statsMsg: "📊 **Bot Statistics**\n\n👥 Total Users: {totalUsers}\n🎬 Total Generations: {totalGens}\n💰 Total Purchases (Tx): {totalPurchases}\n⭐️ Total Stars Earned: {totalStars}",
        btnSupportCreator: "💖 Support Creator",
        btnBuyVip: "👑 Buy VIP (1000 ⭐️)",
        buyVipInvoiceTitle: "VIP Status",
        buyVipInvoiceDesc: "Purchase lifetime VIP status for unlimited generations.",
        paymentVipSuccess: "✅ Payment successful! You are now a VIP with unlimited generations! 👑",
        publishToGallery: "📢 Publish to Gallery",
        tryItYourself: "🎬 Try it yourself"
    },
    ru: {
        languageName: "Русский 🇷🇺",
        welcome: "Добро пожаловать в бот для генерации видео Veo!\n\nУ вас есть 1 бесплатная генерация для старта. Нажимайте кнопки ниже или отправьте мне текстовый запрос или картинку с подписью.",
        btnGenerate: "🎬 Сгенерировать видео",
        btnProfile: "👤 Мой профиль",
        btnBuy: "⭐️ Купить генерации",
        btnInvite: "🤝 Пригласить друга",
        profileInfo: "👤 **Мой профиль**\n\n🆔 ID: `{userId}`\n🎥 Осталось генераций: **{quota}**\n🤝 Прогресс рефералов: **{refCount}/3**\n🔥 Серия: **{streak} дней**",
        vipUnlimited: "♾️ Безлимит (VIP)",
        buyPrompt: "Сколько генераций вы хотите купить? Введите число (например, 5). Каждая генерация стоит 50 ⭐️ Telegram Stars.",
        buyVipIgnore: "Вы VIP! У вас безлимитные генерации, вам не нужно их покупать.",
        generatePrompt: "Пожалуйста, отправьте текстовый запрос или загрузите картинку с подписью для генерации видео. Примечание: Генерация аудио включена, поэтому вы можете добавлять звуковые описания!",
        invalidNumber: "Пожалуйста, введите корректное положительное число.",
        buyInvoiceTitle: "Купить {amount} генераций",
        buyInvoiceDesc: "Покупка {amount} генераций видео для Veo бота.",
        buyLabel: "{amount} Генераций",
        paymentSuccess: "✅ Оплата успешна! Добавлено {amount} генерации(й) к вашей квоте.",
        referralLinkMsg: "🤝 <b>Пригласи друга!</b>\n\nПоделись этой ссылкой с друзьями. За каждые <b>3 новых пользователей</b>, которые запустят бота по вашей ссылке, вы получите <b>+1 бесплатную генерацию</b>!\n\nВаша реферальная ссылка:\n{link}",
        referralEarned: "🎉 Кто-то присоединился по вашей ссылке! Вы пригласили 3 друзей и только что получили **+1 бесплатную генерацию**! Ваш прогресс сброшен.",
        referralProgress: "🎉 Кто-то присоединился по вашей ссылке! Вы пригласили {count}/3 друзей. Пригласите еще {needed}, чтобы получить бесплатную генерацию!",
        noQuota: "У вас не осталось генераций! Вы можете подождать 24 часа до обновления, или купить еще.",
        btnRestoreBonus: "⚡️ Восстановить + 1 Бонус (50 ⭐️)",
        selectFormat: "Пожалуйста, выберите формат (соотношение сторон) для вашего видео:",
        landscape: "16:9 (Альбомная)",
        portrait: "9:16 (Портретная)",
        square: "1:1 (Квадрат)",
        generating: "⏳ Генерирую видео, это может занять несколько минут...",
        errorWait: "Произошла ошибка при генерации видео. Ваша квота была возвращена. Пожалуйста, попробуйте позже.",
        errorVipWait: "Произошла ошибка при генерации видео. Пожалуйста, попробуйте позже.",
        sessionExpired: "Сессия истекла или неверное состояние. Пожалуйста, отправьте ваш запрос снова.",
        quotaDepletedWait: "У вас недостаточно квоты.",
        restoredQuota: "✅ Ваша ежедневная бесплатная генерация восстановлена!",
        restoreInvoiceTitle: "Восстановить + 1 Бонус",
        restoreInvoiceDesc: "Моментально восстановить вашу дневную генерацию и получить +1 бонус.",
        selectStyle: "Выберите визуальный стиль:",
        styleCinematic: "🎬 Кинематографичный",
        styleAnime: "🏮 Аниме",
        styleCyberpunk: "🌌 Киберпанк",
        styleNone: "✨ Без стиля",
        queuePosition: "⏳ Вы #{position} в очереди...",
        adminGrantedVip: "🎁 Администратор предоставил вам статус VIP! Наслаждайтесь безлимитными генерациями.",
        adminAddedQuota: "🎁 Администратор добавил {amount} генераций на ваш баланс!",
        streakBonus3: "🔥 Серия 3 дня! Вы получили бонус +1 генерация!",
        streakBonus7: "🔥 Серия 7 дней! Вы получили бонус +3 генерации!",
        inactivityReminder: "Мы скучаем! 👋 Возвращайтесь и сгенерируйте потрясающие видео уже сегодня!",
        btnExtend: "➕ Продлить видео (Стоимость: 2)",
        extendNotSupported: "Функция продления видео скоро появится!",
        extendInsufficientQuota: "Вам нужно 2 генерации для продления видео.",
        extendSuccess: "⏳ Продлеваем ваше видео, пожалуйста, подождите...",
        promoSuccess: "🎉 Промокод успешно применен! Вы получили {amount} генерации(й).",
        promoInvalid: "❌ Этот промокод недействителен, истек или достиг лимита использований.",
        promoUsed: "❌ Вы уже использовали этот промокод.",
        statsMsg: "📊 **Статистика Бота**\n\n👥 Всего пользователей: {totalUsers}\n🎬 Всего генераций: {totalGens}\n💰 Всего покупок (Транзакций): {totalPurchases}\n⭐️ Всего заработано звезд: {totalStars}",
        btnSupportCreator: "💖 Поддержать автора",
        btnBuyVip: "👑 Купить VIP (1000 ⭐️)",
        buyVipInvoiceTitle: "VIP Статус",
        buyVipInvoiceDesc: "Покупка VIP статуса для безлимитных генераций навсегда.",
        paymentVipSuccess: "✅ Оплата успешна! Вы теперь VIP с безлимитными генерациями! 👑",
        publishToGallery: "📢 Опубликовать в галерее",
        tryItYourself: "🎬 Попробуй сам"
    },
    am: {
        languageName: "Հայերեն 🇦🇲",
        welcome: "Բարի գալուստ Veo վիդեո գեներացման բոտ:\n\nԴուք ունեք 1 անվճար գեներացիա սկսելու համար: Սեղմեք ներքևի կոճակները կամ ուղարկեք ինձ տեքստային հարցում կամ նկար՝ մակագրությամբ:",
        btnGenerate: "🎬 Գեներացնել վիդեո",
        btnProfile: "👤 Իմ պրոֆիլը",
        btnBuy: "⭐️ Գնել գեներացիաներ",
        btnInvite: "🤝 Հրավիրել ընկերոջ",
        profileInfo: "👤 **Իմ պրոֆիլը**\n\n🆔 ID: `{userId}`\n🎥 Մնացած գեներացիաներ: **{quota}**\n🤝 Ռեֆերալների առաջընթաց: **{refCount}/3**\n🔥 Շարք: **{streak} օր**",
        vipUnlimited: "♾️ Անսահմանափակ (VIP)",
        buyPrompt: "Քանի՞ գեներացիա եք ցանկանում գնել: Մուտքագրեք թիվ (օրինակ՝ 5): Յուրաքանչյուր գեներացիա արժե 50 ⭐️ Telegram Stars:",
        buyVipIgnore: "Դուք VIP եք! Դուք ունեք անսահմանափակ գեներացիաներ և գնելու կարիք չունեք:",
        generatePrompt: "Խնդրում ենք ուղարկել Ձեր տեքստային հարցումը կամ ներբեռնել նկար մակագրությամբ վիդեո գեներացնելու համար: Նշում․ Ձայնի գեներացիան միացված է:",
        invalidNumber: "Խնդրում ենք մուտքագրել վավեր դրական թիվ:",
        buyInvoiceTitle: "Գնել {amount} Գեներացիա",
        buyInvoiceDesc: "Գնել {amount} վիդեո գեներացիա Veo բոտի համար:",
        buyLabel: "{amount} Գեներացիաներ",
        paymentSuccess: "✅ Վճարումը հաջողվեց! Ավելացվեց {amount} գեներացիա Ձեր քվոտային:",
        referralLinkMsg: "🤝 <b>Հրավիրեք ընկերոջ!</b>\n\nԿիսվեք այս հղումով Ձեր ընկերների հետ: Յուրաքանչյուր <b>3 նոր օգտատիրոջ</b> համար, ովքեր կսկսեն բոտը Ձեր հղումով, Դուք կստանաք <b>+1 անվճար գեներացիա</b>!\n\nՁեր ռեֆերալ հղումը:\n{link}",
        referralEarned: "🎉 Ինչ-որ մեկը միացավ Ձեր հղումով! Դուք հրավիրեցիք 3 ընկեր և հենց նոր ստացաք **+1 անվճար գեներացիա**: Ձեր առաջընթացը զրոյացվել է:",
        referralProgress: "🎉 Ինչ-որ մեկը միացավ Ձեր հղումով! Դուք հրավիրել եք {count}/3 ընկեր: Հրավիրեք ևս {needed} անվճար գեներացիա ստանալու համար:",
        noQuota: "Դուք այլևս գեներացիաներ չունեք! Կարող եք սպասել մինչև Ձեր 24-ժամյա ժամկետը լրանա, կամ գնել ավելին:",
        btnRestoreBonus: "⚡️ Վերականգնել հիմա + 1 Բոնուս (50 ⭐️)",
        selectFormat: "Խնդրում ենք ընտրել վիդեոյի ձևաչափը:",
        landscape: "16:9 (Լայնքով)",
        portrait: "9:16 (Ուղղահայաց)",
        square: "1:1 (Քառակուսի)",
        generating: "⏳ Վիդեոն գեներացվում է, դա կարող է տևել մի քանի րոպե...",
        errorWait: "Վիդեոն գեներացնելիս սխալ տեղի ունեցավ: Ձեր քվոտան վերադարձվել է: Խնդրում ենք փորձել ավելի ուշ:",
        errorVipWait: "Վիդեոն գեներացնելիս սխալ տեղի ունեցավ: Խնդրում ենք փորձել ավելի ուշ:",
        sessionExpired: "Սեսիան ավարտվել է կամ կարգավիճակը անվավեր է: Խնդրում ենք նորից ուղարկել Ձեր հարցումը:",
        quotaDepletedWait: "Դուք չունեք բավարար քվոտա:",
        restoredQuota: "✅ Ձեր ամենօրյա անվճար գեներացիան վերականգնվել է!",
        restoreInvoiceTitle: "Վերականգնել + 1 Բոնուս",
        restoreInvoiceDesc: "Անմիջապես վերականգնեք Ձեր ամենօրյա գեներացիան և ստացեք +1 բոնուսային գեներացիա:",
        selectStyle: "Ընտրեք վիզուալ ոճը:",
        styleCinematic: "🎬 Կինեմատոգրաֆիական",
        styleAnime: "🏮 Անիմե",
        styleCyberpunk: "🌌 Կիբերպանկ",
        styleNone: "✨ Ոչ մեկը",
        queuePosition: "⏳ Դուք հերթում #{position}-րդն եք...",
        adminGrantedVip: "🎁 Ադմինիստրատորը ձեզ շնորհել է VIP կարգավիճակ! Վայելեք անսահմանափակ գեներացիաներ:",
        adminAddedQuota: "🎁 Ադմինիստրատորը ձեր հաշվեկշռին ավելացրել է {amount} գեներացիա:",
        streakBonus3: "🔥 Դուք հասաք 3 օրվա շարքին: Ստացաք +1 բոնուսային գեներացիա:",
        streakBonus7: "🔥 Դուք հասաք 7 օրվա շարքին: Ստացաք +3 բոնուսային գեներացիա:",
        inactivityReminder: "Մենք կարոտում ենք ձեզ! 👋 Վերադարձեք և գեներացրեք զարմանալի վիդեոներ այսօր:",
        btnExtend: "➕ Ընդլայնել վիդեոն (Արժեքը: 2)",
        extendNotSupported: "Վիդեոյի ընդլայնման գործառույթը շուտով հասանելի կլինի:",
        extendInsufficientQuota: "Վիդեոն ընդլայնելու համար ձեզ հարկավոր է 2 գեներացիա:",
        extendSuccess: "⏳ Ընդլայնում ենք Ձեր վիդեոն, խնդրում ենք սպասել...",
        promoSuccess: "🎉 Պրոմո կոդը հաջողությամբ կիրառվեց: Դուք ստացաք {amount} գեներացիա:",
        promoInvalid: "❌ Այս պրոմո կոդը անվավեր է, ժամկետանց կամ սպառել է օգտագործման լիմիտը:",
        promoUsed: "❌ Դուք արդեն օգտագործել եք այս պրոմո կոդը:",
        statsMsg: "📊 **Բոտի Վիճակագրություն**\n\n👥 Ընդհանուր օգտատերեր: {totalUsers}\n🎬 Ընդհանուր գեներացիաներ: {totalGens}\n💰 Ընդհանուր գնումներ (Tx): {totalPurchases}\n⭐️ Ընդհանուր վաստակած Աստղեր: {totalStars}",
        btnSupportCreator: "💖 Ստեղծողին աջակցել",
        btnBuyVip: "👑 Գնել VIP (1000 ⭐️)",
        buyVipInvoiceTitle: "VIP Կարգավիճակ",
        buyVipInvoiceDesc: "Գնել VIP կարգավիճակ անսահմանափակ գեներացիաների համար ընդմիշտ:",
        paymentVipSuccess: "✅ Վճարումը հաջողվեց! Դուք այժմ VIP եք անսահմանափակ գեներացիաներով! 👑",
        publishToGallery: "📢 Հրապարակել պատկերասրահում",
        tryItYourself: "🎬 Փորձեք ինքներդ"
    }
};

function t(lang, key, params = {}) {
    let str = i18n[lang] && i18n[lang][key] ? i18n[lang][key] : i18n['en'][key];
    if (!str) return key;
    for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, v);
    }
    return str;
}

function getMainKeyboard(lang) {
    return Markup.keyboard([
        [t(lang, 'btnGenerate'), t(lang, 'btnProfile')],
        [t(lang, 'btnBuy'), t(lang, 'btnInvite')]
    ]).resize().persistent();
}

// --- Quota & User System ---
function loadUsers() {
    if (fs.existsSync(USERS_FILE)) {
        try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) {}
    }
    return {};
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadPromos() {
    if (fs.existsSync(PROMOS_FILE)) {
        try { return JSON.parse(fs.readFileSync(PROMOS_FILE, 'utf8')); } catch (e) {}
    }
    return {};
}

function savePromos(promos) {
    fs.writeFileSync(PROMOS_FILE, JSON.stringify(promos, null, 2));
}

function initializeUser(userId, username = null) {
    const users = loadUsers();
    let isNew = false;
    let modified = false;

    if (users[userId] === undefined) {
        users[userId] = { 
            quota: 1, // 1 free generation
            isVip: false, 
            referralCount: 0, 
            lang: null, 
            lastDepletedAt: null,
            username: username ? username.toLowerCase() : null,
            purchaseTxCount: 0, 
            lastInteractionDate: new Date().toDateString(),
            streak: 1,
            usedPromos: [],
            totalGenerationsUsed: 0
        }; 
        modified = true;
        isNew = true;
    } else {
        if (users[userId].referralCount === undefined) { users[userId].referralCount = 0; modified = true; }
        if (users[userId].lang === undefined) { users[userId].lang = null; modified = true; }
        if (users[userId].lastDepletedAt === undefined) { users[userId].lastDepletedAt = null; modified = true; }
        if (users[userId].username === undefined || (username && users[userId].username !== username.toLowerCase())) {
            users[userId].username = username ? username.toLowerCase() : users[userId].username;
            modified = true;
        }
        if (users[userId].purchaseTxCount === undefined) { users[userId].purchaseTxCount = 0; modified = true; }
        if (users[userId].lastInteractionDate === undefined) { users[userId].lastInteractionDate = new Date().toDateString(); modified = true; }
        if (users[userId].streak === undefined) { users[userId].streak = 1; modified = true; }
        if (users[userId].usedPromos === undefined) { users[userId].usedPromos = []; modified = true; }
        if (users[userId].totalGenerationsUsed === undefined) { users[userId].totalGenerationsUsed = 0; modified = true; }
    }
    
    if (modified) saveUsers(users);
    return { user: users[userId], isNew };
}

function getUserData(userId) {
    const users = loadUsers();
    return users[userId] || initializeUser(userId).user;
}

function updateInteractionAndStreak(userId) {
    const users = loadUsers();
    if (!users[userId]) return;

    const today = new Date().toDateString();
    const lastDateStr = users[userId].lastInteractionDate;
    
    if (lastDateStr !== today) {
        const lastDate = new Date(lastDateStr);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
            users[userId].streak += 1;
            
            if (users[userId].streak === 3) {
                users[userId].quota += 1;
                bot.telegram.sendMessage(userId, t(users[userId].lang || 'en', 'streakBonus3')).catch(()=>{});
            } else if (users[userId].streak === 7) {
                users[userId].quota += 3;
                bot.telegram.sendMessage(userId, t(users[userId].lang || 'en', 'streakBonus7')).catch(()=>{});
            }
        } else {
            users[userId].streak = 1;
        }
        users[userId].lastInteractionDate = today;
        saveUsers(users);
    }
}

function setUserLanguage(userId, langCode) {
    const users = loadUsers();
    if (users[userId]) {
        users[userId].lang = langCode;
        saveUsers(users);
    }
}

function isUserVip(userId) {
    const user = getUserData(userId);
    if (ADMIN_ID && userId.toString() === ADMIN_ID) {
        return true; 
    }
    return !!user.isVip;
}

function checkAutoRegeneration(userId) {
    if (isUserVip(userId)) return false;
    
    const users = loadUsers();
    if (!users[userId]) return false;
    
    const now = Date.now();
    const lastDepleted = users[userId].lastDepletedAt;
    
    if (users[userId].quota <= 0 && lastDepleted) {
        if (now - lastDepleted >= 86400000) {
            users[userId].quota += 1;
            users[userId].lastDepletedAt = null;
            saveUsers(users);
            return true;
        }
    }
    return false;
}

function decrementQuota(userId, amount = 1) {
    const users = loadUsers();
    if (!users[userId]) return false;
    
    users[userId].totalGenerationsUsed = (users[userId].totalGenerationsUsed || 0) + amount;

    if (isUserVip(userId)) {
        saveUsers(users);
        return true; 
    }

    if (users[userId].quota >= amount) {
        users[userId].quota -= amount;
        
        if (users[userId].quota === 0) {
            users[userId].lastDepletedAt = Date.now();
        }
        
        saveUsers(users);
        return true;
    }
    return false;
}

function addQuota(userId, amount) {
    const users = loadUsers();
    if (users[userId] === undefined) {
        initializeUser(userId);
    }
    users[userId].quota += amount;
    
    if (users[userId].quota > 0) {
        users[userId].lastDepletedAt = null;
    }
    saveUsers(users);
}

function setVip(userId, status) {
    const users = loadUsers();
    if (users[userId] === undefined) {
        initializeUser(userId);
    }
    users[userId].isVip = status;
    saveUsers(users);
}

function incrementReferral(referrerId) {
    const users = loadUsers();
    if (users[referrerId] === undefined) return null; 
    
    if (users[referrerId].referralCount === undefined) {
        users[referrerId].referralCount = 0;
    }
    
    users[referrerId].referralCount += 1;
    let earnedReward = false;
    
    if (users[referrerId].referralCount >= 3) {
        users[referrerId].quota += 1;
        users[referrerId].referralCount = 0; 
        if (users[referrerId].quota > 0) {
            users[referrerId].lastDepletedAt = null;
        }
        earnedReward = true;
    }
    
    const newCount = users[referrerId].referralCount;
    saveUsers(users);
    return { earnedReward, newCount, lang: users[referrerId].lang || 'en' };
}

function findUserIdByUsername(username) {
    const users = loadUsers();
    const cleanUsername = username.replace('@', '').toLowerCase();
    for (const [userId, data] of Object.entries(users)) {
        if (data.username === cleanUsername) {
            return userId;
        }
    }
    return null;
}

function getPriceForPurchase(amount) {
    return 50 * amount;
}

function recordPurchase(userId, amount) {
    const users = loadUsers();
    if (users[userId]) {
        users[userId].purchaseTxCount = (users[userId].purchaseTxCount || 0) + 1;
        users[userId].quota += amount;
        
        if (!users.globalStats) users.globalStats = { totalStars: 0 };
        users.globalStats.totalStars += getPriceForPurchase(amount);

        if (users[userId].quota > 0) {
            users[userId].lastDepletedAt = null;
        }
        saveUsers(users);
    }
}

// --- Queue System ---
const generationQueue = [];
let isProcessingQueue = false;

async function processQueue() {
    if (isProcessingQueue || generationQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (generationQueue.length > 0) {
        const task = generationQueue.shift(); 
        
        for (let i = 0; i < generationQueue.length; i++) {
            const item = generationQueue[i];
            const lang = getUserData(item.userId).lang || 'en';
            try {
                await bot.telegram.editMessageText(item.chatId, item.statusMsgId, undefined, t(lang, 'queuePosition', { position: i + 1 }));
            } catch(e) {}
        }

        try {
            await executeGeneration(task);
        } catch (error) {
            console.error("Queue execution error:", error);
        }
    }
    
    isProcessingQueue = false;
}

async function addWatermark(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoFilters("drawtext=text='@yoobiatch_bot':x=w-tw-10:y=h-th-10:fontsize=24:fontcolor=white@0.5:box=1:boxcolor=black@0.3")
            .outputOptions('-c:a copy') // Copy audio without re-encoding
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .save(outputPath);
    });
}

async function executeGeneration(task) {
    const { ctx, userId, requestData, format, styleModifier, statusMsgId } = task;
    const lang = getUserData(userId).lang || 'en';

    try {
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsgId, undefined, t(lang, 'generating'));
        
        let requestBody = {
            instances: [],
            parameters: {
                sampleCount: 1,
                generateAudio: true,
                durationSeconds: 4,
                aspectRatio: format === '1:1' ? '16:9' : format 
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" }
            ]
        };
        requestBody.parameters.aspectRatio = format;

        let finalPrompt = requestData.prompt;
        if (styleModifier) {
            finalPrompt = `${finalPrompt}, ${styleModifier}`;
        }

        if (requestData.type === 'text') {
            requestBody.instances.push({ prompt: finalPrompt });
        } else if (requestData.type === 'photo') {
            const file = await ctx.telegram.getFile(requestData.fileId);
            const url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            const base64Image = buffer.toString('base64');
            
            const ext = path.extname(file.file_path).toLowerCase();
            let mimeType = 'image/jpeg';
            if (ext === '.png') mimeType = 'image/png';
            if (ext === '.webp') mimeType = 'image/webp';

            requestBody.instances.push({
                prompt: finalPrompt,
                image: {
                    bytesBase64Encoded: base64Image,
                    mimeType: mimeType
                }
            });
        } else if (requestData.type === 'extend') {
             ctx.telegram.deleteMessage(ctx.chat.id, statusMsgId).catch(() => {});
             addQuota(userId, 2); // Refund the 2 cost
             return ctx.telegram.sendMessage(ctx.chat.id, t(lang, 'extendNotSupported')).catch(()=>{});
        }

        const operationInfo = await predictLongRunning(requestBody);
        const operationName = operationInfo.name;

        let operationDone = false;
        let finalResponse = null;

        while (!operationDone) {
            await new Promise((resolve) => setTimeout(resolve, 15000));
            const status = await fetchPredictOperation(operationName);
            if (status.done) {
                operationDone = true;
                finalResponse = status.response;
            }
        }

        if (finalResponse && finalResponse.videos && finalResponse.videos.length > 0) {
             const videoBase64 = finalResponse.videos[0].bytesBase64Encoded;
             const videoBuffer = Buffer.from(videoBase64, 'base64');
             const filename = `video_${ctx.chat.id}_${Date.now()}.mp4`;
             const downloadPath = path.join(__dirname, filename);
             
             fs.writeFileSync(downloadPath, videoBuffer);
             
             let fileToSend = downloadPath;
             let watermarkedPath = path.join(__dirname, `wm_${filename}`);
             
             // Check VIP status to apply watermark
             if (!isUserVip(userId)) {
                 try {
                     await addWatermark(downloadPath, watermarkedPath);
                     fileToSend = watermarkedPath;
                 } catch (wmError) {
                     console.error("Watermark error:", wmError);
                     // Fallback to sending original if ffmpeg fails
                     fileToSend = downloadPath; 
                 }
             }
             
             const sentMsg = await ctx.telegram.sendVideo(ctx.chat.id, { source: fileToSend }, {
                 reply_markup: {
                     inline_keyboard: [[ Markup.button.callback(t(lang, 'btnExtend'), `extend_video`) ]]
                 }
             });
             
             // Send to Admin for Gallery
             if (ADMIN_ID) {
                 bot.telegram.sendVideo(ADMIN_ID, { source: fileToSend }, {
                     caption: `User ID: \`${userId}\`\nPrompt: ${finalPrompt}`,
                     parse_mode: 'Markdown',
                     reply_markup: {
                         inline_keyboard: [[ Markup.button.callback(t('en', 'publishToGallery'), `publish_${sentMsg.message_id}_${userId}`) ]]
                     }
                 }).catch(console.error);
                 
                 // Store temporary mapping for the callback query
                 userStates[`gallery_${sentMsg.message_id}`] = {
                     fileId: sentMsg.video.file_id,
                     prompt: finalPrompt
                 };
             }
             
             // Cleanup files
             if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
             if (fs.existsSync(watermarkedPath)) fs.unlinkSync(watermarkedPath);
             
             ctx.telegram.deleteMessage(ctx.chat.id, statusMsgId).catch(() => {});
        } else {
             throw new Error("No video returned in response.");
        }

    } catch (error) {
        console.error("Error generating video:", error?.response?.data || error.message);
        if (!isUserVip(userId)) {
             addQuota(userId, 1);
             ctx.telegram.sendMessage(ctx.chat.id, t(lang, 'errorWait')).catch(()=>{});
        } else {
             ctx.telegram.sendMessage(ctx.chat.id, t(lang, 'errorVipWait')).catch(()=>{});
        }
    }
}


// --- Inactivity Push System ---
function checkInactivity() {
    const users = loadUsers();
    const today = new Date();
    
    for (const [userId, data] of Object.entries(users)) {
        if (!data.lastInteractionDate) continue;
        
        const lastDate = new Date(data.lastInteractionDate);
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 3 && !data.inactivityPushed) {
            const lang = data.lang || 'en';
            bot.telegram.sendMessage(userId, t(lang, 'inactivityReminder')).catch(()=>{});
            users[userId].inactivityPushed = true;
            saveUsers(users);
        } else if (diffDays < 3 && data.inactivityPushed) {
             users[userId].inactivityPushed = false;
             saveUsers(users);
        }
    }
}
setInterval(checkInactivity, 12 * 60 * 60 * 1000);

// --- State Management ---
const userStates = {};

// --- Vertex AI API Configs ---
async function getAccessToken() {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
}

async function predictLongRunning(requestBody) {
    const token = await getAccessToken();
    const url = `https://${GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT}/locations/${GOOGLE_CLOUD_LOCATION}/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;
    
    const response = await axios.post(url, requestBody, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
}

async function fetchPredictOperation(operationName) {
    const token = await getAccessToken();
    const endpointUrl = `https://${GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT}/locations/${GOOGLE_CLOUD_LOCATION}/publishers/google/models/veo-3.1-generate-preview:fetchPredictOperation`;
    
    try {
        const response = await axios.post(endpointUrl, {
            operationName: operationName
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch(err) {
        const getUrl = `https://${GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/${operationName}`;
        const getResponse = await axios.get(getUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return getResponse.data;
    }
}

function notifyAdmin(message) {
    if (ADMIN_ID) {
        bot.telegram.sendMessage(ADMIN_ID, `🛡 **Admin Notification**\n${message}`, { parse_mode: 'Markdown' }).catch(console.error);
    }
}

// --- Handlers ---
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const referralParam = ctx.payload; 
    
    const { user, isNew } = initializeUser(userId, username);
    updateInteractionAndStreak(userId);

    if (isNew) {
        userStates[userId] = { state: 'CHOOSING_LANGUAGE', referralParam: referralParam };
    } else if (!user.lang) {
        userStates[userId] = { state: 'CHOOSING_LANGUAGE' };
    }

    if (userStates[userId] && userStates[userId].state === 'CHOOSING_LANGUAGE') {
        return ctx.reply("Please select your language / Пожалуйста, выберите язык / Խնդրում ենք ընտրել ձեր լեզուն:", Markup.inlineKeyboard([
            [Markup.button.callback('English 🇬🇧', 'setlang_en')],
            [Markup.button.callback('Русский 🇷🇺', 'setlang_ru')],
            [Markup.button.callback('Հայերեն 🇦🇲', 'setlang_am')]
        ]));
    }

    if (checkAutoRegeneration(userId)) {
        ctx.reply(t(user.lang, 'restoredQuota'));
    }

    ctx.reply(t(user.lang, 'welcome'), getMainKeyboard(user.lang));
});

bot.action(/setlang_(en|ru|am)/, async (ctx) => {
    const userId = ctx.from.id;
    const langCode = ctx.match[1];
    
    setUserLanguage(userId, langCode);
    updateInteractionAndStreak(userId);
    ctx.answerCbQuery();
    
    ctx.deleteMessage().catch(()=> { });

    const state = userStates[userId];
    const referralParam = state ? state.referralParam : null;
    delete userStates[userId];

    if (referralParam) {
        const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
        notifyAdmin(`New user joined: ${username} (ID: \`${userId}\`)`);

        if (!isNaN(parseInt(referralParam))) {
            const referrerId = parseInt(referralParam);
            const usersBefore = loadUsers();
            
            if (referrerId !== userId && usersBefore[referrerId]) {
                const result = incrementReferral(referrerId);
                if (result) {
                    if (result.earnedReward) {
                         bot.telegram.sendMessage(referrerId, t(result.lang, 'referralEarned'), { parse_mode: 'Markdown' }).catch(console.error);
                    } else {
                         bot.telegram.sendMessage(referrerId, t(result.lang, 'referralProgress', { count: result.newCount, needed: 3 - result.newCount })).catch(console.error);
                    }
                }
            }
        }
    }
    
    ctx.reply(t(langCode, 'welcome'), getMainKeyboard(langCode));
});

bot.action(/publish_(.+)/, async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return ctx.answerCbQuery("Unauthorized.");
    
    const originalMsgId = ctx.match[1].split('_')[0];
    const galleryData = userStates[`gallery_${originalMsgId}`];
    
    if (!galleryData) return ctx.answerCbQuery("Error: Media not found in cache.");
    
    ctx.answerCbQuery("Publishing...");
    
    const lang = 'en'; // Assuming default for channel
    bot.telegram.sendVideo(GALLERY_CHANNEL_ID, galleryData.fileId, {
        caption: galleryData.prompt,
        reply_markup: {
            inline_keyboard: [[ Markup.button.url(t(lang, 'tryItYourself'), `https://t.me/yoobiatch_bot`) ]]
        }
    }).then(() => {
        ctx.editMessageReplyMarkup({ inline_keyboard: [[ Markup.button.callback("✅ Published", "ignore") ]] });
    }).catch(err => {
        console.error("Gallery publish error:", err);
        ctx.reply("Failed to publish.");
    });
});

bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id) {
        updateInteractionAndStreak(ctx.from.id);
        
        if (ctx.from.username) {
             const users = loadUsers();
             if (users[ctx.from.id] && users[ctx.from.id].username !== ctx.from.username.toLowerCase()) {
                  users[ctx.from.id].username = ctx.from.username.toLowerCase();
                  saveUsers(users);
             }
        }
    }

    if (ctx.message && ctx.message.text) {
        const text = ctx.message.text;
        const user = getUserData(ctx.from.id);
        const lang = user.lang || 'en';

        if (checkAutoRegeneration(ctx.from.id)) {
            ctx.reply(t(lang, 'restoredQuota'));
        }

        if (text === t(lang, 'btnGenerate')) {
            ctx.reply(t(lang, 'generatePrompt'), {
                reply_markup: {
                    inline_keyboard: [[ Markup.button.url(t(lang, 'btnSupportCreator'), `https://t.me/p1nkmanyo`) ]]
                }
            });
            return;
        } else if (text === t(lang, 'btnProfile')) {
            const isVip = isUserVip(ctx.from.id);
            const quotaDisplay = isVip ? t(lang, 'vipUnlimited') : getUserData(ctx.from.id).quota;
            const refCount = user.referralCount || 0;
            const streak = user.streak || 1;
            
            ctx.reply(t(lang, 'profileInfo', { userId: ctx.from.id, quota: quotaDisplay, refCount, streak }), { 
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[ Markup.button.url(t(lang, 'btnSupportCreator'), `https://t.me/p1nkmanyo`) ]]
                }
            });
            return;
        } else if (text === t(lang, 'btnBuy')) {
            if (isUserVip(ctx.from.id)) {
                 return ctx.reply(t(lang, 'buyVipIgnore'));
            }
            userStates[ctx.from.id] = { state: 'WAITING_FOR_BUY_AMOUNT' };
            ctx.reply(t(lang, 'buyPrompt'), Markup.inlineKeyboard([
                [Markup.button.callback(t(lang, 'btnBuyVip'), 'buy_vip')]
            ]));
            return;
        } else if (text === t(lang, 'btnInvite')) {
            const botInfo = await bot.telegram.getMe();
            const botUsername = botInfo.username;
            const referralLink = `https://t.me/${botUsername}?start=${ctx.from.id}`;
            ctx.reply(t(lang, 'referralLinkMsg', { link: referralLink }), { parse_mode: 'HTML' });
            return;
        }
    }
    return next();
});

// Admin Commands
bot.command('add', (ctx) => {
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID) return ctx.reply("Unauthorized.");
    
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply("Usage: /add @username [amount] OR /add [userId] [amount]");
    
    let targetUserId = args[1].startsWith('@') ? findUserIdByUsername(args[1]) : parseInt(args[1]);
    if (!targetUserId || isNaN(targetUserId)) return ctx.reply("User not found or invalid ID.");

    const amount = parseInt(args[2]);
    if (isNaN(amount)) return ctx.reply("Invalid amount.");

    addQuota(targetUserId, amount);
    ctx.reply(`Successfully added ${amount} generations to ${args[1]}.`);
    
    const lang = getUserData(targetUserId).lang || 'en';
    bot.telegram.sendMessage(targetUserId, t(lang, 'adminAddedQuota', { amount })).catch(()=>{});
});

bot.command('vip', (ctx) => {
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID) return ctx.reply("Unauthorized.");
    
    const args = ctx.message.text.split(' ');
    if (args.length !== 2) return ctx.reply("Usage: /vip @username OR /vip [userId]");
    
    let targetUserId = args[1].startsWith('@') ? findUserIdByUsername(args[1]) : parseInt(args[1]);
    if (!targetUserId || isNaN(targetUserId)) return ctx.reply("User not found or invalid ID.");

    setVip(targetUserId, true);
    ctx.reply(`Successfully granted VIP status to ${args[1]}.`);
    
    const lang = getUserData(targetUserId).lang || 'en';
    bot.telegram.sendMessage(targetUserId, t(lang, 'adminGrantedVip')).catch(()=>{});
});

bot.command('createpromo', (ctx) => {
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID) return ctx.reply("Unauthorized.");
    
    const args = ctx.message.text.split(' ');
    if (args.length !== 4) return ctx.reply("Usage: /createpromo [code] [generations] [max_uses]");
    
    const code = args[1].toUpperCase();
    const amount = parseInt(args[2]);
    const maxUses = parseInt(args[3]);
    
    if (isNaN(amount) || isNaN(maxUses)) return ctx.reply("Amount and max uses must be integers.");
    
    const promos = loadPromos();
    promos[code] = { amount, maxUses, currentUses: 0 };
    savePromos(promos);
    
    ctx.reply(`✅ Created promo code ${code} for ${amount} generations (${maxUses} uses max).`);
});

bot.command('send', (ctx) => {
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID) return ctx.reply("Unauthorized.");
    
    const msg = ctx.message.text.substring('/send '.length).trim();
    if (!msg) return ctx.reply("Usage: /send [message]");
    
    const users = loadUsers();
    let sentCount = 0;
    
    for (const userId of Object.keys(users)) {
        if (userId === "globalStats") continue;
        bot.telegram.sendMessage(userId, msg).then(() => sentCount++).catch(()=>{});
    }
    
    ctx.reply(`Broadcasting message to users...`);
});

bot.command('stats', (ctx) => {
    if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID) return ctx.reply("Unauthorized.");
    
    const users = loadUsers();
    const totalUsers = Object.keys(users).filter(k => k !== 'globalStats').length;
    
    let totalGens = 0;
    let totalPurchases = 0;
    for (const [key, data] of Object.entries(users)) {
         if (key !== 'globalStats') {
              totalGens += data.totalGenerationsUsed || 0;
              totalPurchases += data.purchaseTxCount || 0;
         }
    }
    
    const totalStars = users.globalStats ? users.globalStats.totalStars : 0;
    
    ctx.reply(t('en', 'statsMsg', { totalUsers, totalGens, totalPurchases, totalStars }), { parse_mode: 'Markdown' });
});

bot.command('promo', (ctx) => {
    const args = ctx.message.text.split(' ');
    const userId = ctx.from.id;
    const user = getUserData(userId);
    const lang = user.lang || 'en';
    
    if (args.length !== 2) return ctx.reply("Usage: /promo [code]");
    
    const code = args[1].toUpperCase();
    const promos = loadPromos();
    
    if (!promos[code] || promos[code].currentUses >= promos[code].maxUses) {
        return ctx.reply(t(lang, 'promoInvalid'));
    }
    
    if (user.usedPromos && user.usedPromos.includes(code)) {
        return ctx.reply(t(lang, 'promoUsed'));
    }
    
    promos[code].currentUses += 1;
    savePromos(promos);
    
    const users = loadUsers();
    if (!users[userId]) initializeUser(userId);
    
    users[userId].usedPromos.push(code);
    users[userId].quota += promos[code].amount;
    saveUsers(users);
    
    ctx.reply(t(lang, 'promoSuccess', { amount: promos[code].amount }));
});

// Handling incoming text and photos
bot.on('text', async (ctx, next) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    const user = getUserData(userId);
    const lang = user.lang || 'en';

    if (text.startsWith('/')) return next();

    if (userStates[userId] && userStates[userId].state === 'WAITING_FOR_BUY_AMOUNT') {
        const amount = parseInt(text);
        if (isNaN(amount) || amount <= 0) {
            return ctx.reply(t(lang, 'invalidNumber'));
        }
        
        delete userStates[userId]; 
        
        const totalPrice = getPriceForPurchase(amount);

        return ctx.replyWithInvoice({
            title: t(lang, 'buyInvoiceTitle', { amount }),
            description: t(lang, 'buyInvoiceDesc', { amount }),
            payload: `buy_gen_${userId}_${amount}`,
            provider_token: "", // Empty for Telegram Stars
            currency: "XTR",
            prices: [{ label: t(lang, 'buyLabel', { amount }), amount: totalPrice }]
        });
    }

    startGenerationProcess(ctx, { type: 'text', prompt: text });
});

bot.on('photo', async (ctx) => {
    const prompt = ctx.message.caption || "Animate this image";
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    
    startGenerationProcess(ctx, { type: 'photo', prompt: prompt, fileId: photo.file_id });
});

async function startGenerationProcess(ctx, requestData) {
    const userId = ctx.from.id;
    const isVip = isUserVip(userId);
    const user = getUserData(userId);
    const lang = user.lang || 'en';
    const quota = user.quota;

    if (!isVip && quota <= 0) {
        return ctx.reply(t(lang, 'noQuota'), Markup.inlineKeyboard([
             [Markup.button.callback(t(lang, 'btnRestoreBonus'), `restore_bonus`)]
        ]));
    }

    userStates[userId] = { state: 'WAITING_FOR_FORMAT', requestData: requestData };

    ctx.reply(t(lang, 'selectFormat'), Markup.inlineKeyboard([
        Markup.button.callback(t(lang, 'landscape'), 'format_16:9'),
        Markup.button.callback(t(lang, 'portrait'), 'format_9:16'),
        Markup.button.callback(t(lang, 'square'), 'format_1:1')
    ]));
}

bot.action('buy_vip', (ctx) => {
    const userId = ctx.from.id;
    const user = getUserData(userId);
    const lang = user.lang || 'en';
    
    ctx.answerCbQuery();

    return ctx.replyWithInvoice({
        title: t(lang, 'buyVipInvoiceTitle'),
        description: t(lang, 'buyVipInvoiceDesc'),
        payload: `buy_vip_${userId}`,
        provider_token: "", 
        currency: "XTR",
        prices: [{ label: "VIP", amount: 1000 }]
    });
});

bot.action('restore_bonus', (ctx) => {
    const userId = ctx.from.id;
    const user = getUserData(userId);
    const lang = user.lang || 'en';
    
    ctx.answerCbQuery();

    // 50 Stars for 2 generations (1 restore + 1 bonus)
    return ctx.replyWithInvoice({
        title: t(lang, 'restoreInvoiceTitle'),
        description: t(lang, 'restoreInvoiceDesc'),
        payload: `restore_gen_${userId}_2`,
        provider_token: "", 
        currency: "XTR",
        prices: [{ label: t(lang, 'btnRestoreBonus'), amount: 50 }]
    });
});

bot.action(/format_(.+)/, async (ctx) => {
    const userId = ctx.from.id;
    const format = ctx.match[1];
    const user = getUserData(userId);
    const lang = user.lang || 'en';
    
    if (!userStates[userId] || userStates[userId].state !== 'WAITING_FOR_FORMAT') {
        return ctx.answerCbQuery(t(lang, 'sessionExpired'));
    }

    userStates[userId].state = 'WAITING_FOR_STYLE';
    userStates[userId].format = format;

    ctx.answerCbQuery();
    
    ctx.editMessageText(t(lang, 'selectStyle'), Markup.inlineKeyboard([
        [Markup.button.callback(t(lang, 'styleCinematic'), 'style_cinematic')],
        [Markup.button.callback(t(lang, 'styleAnime'), 'style_anime')],
        [Markup.button.callback(t(lang, 'styleCyberpunk'), 'style_cyberpunk')],
        [Markup.button.callback(t(lang, 'styleNone'), 'style_none')]
    ])).catch(()=>{});
});

bot.action(/style_(.+)/, async (ctx) => {
    const userId = ctx.from.id;
    const styleChoice = ctx.match[1];
    const user = getUserData(userId);
    const lang = user.lang || 'en';
    
    if (!userStates[userId] || userStates[userId].state !== 'WAITING_FOR_STYLE') {
        return ctx.answerCbQuery(t(lang, 'sessionExpired'));
    }

    const requestData = userStates[userId].requestData;
    const format = userStates[userId].format;
    delete userStates[userId]; 

    if (!decrementQuota(userId)) {
        return ctx.answerCbQuery(t(lang, 'quotaDepletedWait'), { show_alert: true });
    }

    ctx.answerCbQuery();

    let styleModifier = "";
    if (styleChoice === 'cinematic') styleModifier = "cinematic, masterpiece, high quality, 8k, highly detailed, photorealistic";
    else if (styleChoice === 'anime') styleModifier = "anime style, studio ghibli, high quality animation, vibrant colors, beautifully drawn";
    else if (styleChoice === 'cyberpunk') styleModifier = "cyberpunk style, neon lighting, futuristic, highly detailed, sci-fi, dark atmosphere";

    const position = generationQueue.length + 1;
    const statusMsg = await ctx.reply(t(lang, 'queuePosition', { position }));

    generationQueue.push({
        ctx,
        userId,
        requestData,
        format,
        styleModifier,
        chatId: ctx.chat.id,
        statusMsgId: statusMsg.message_id
    });

    processQueue();
});

bot.action('extend_video', async (ctx) => {
    const userId = ctx.from.id;
    const user = getUserData(userId);
    const lang = user.lang || 'en';
    
    ctx.answerCbQuery();
    
    if (!decrementQuota(userId, 2)) {
        return ctx.telegram.sendMessage(ctx.chat.id, t(lang, 'extendInsufficientQuota')).catch(()=>{});
    }
    
    const statusMsg = await ctx.reply(t(lang, 'extendSuccess'));
    
    generationQueue.push({
        ctx,
        userId,
        requestData: { type: 'extend' },
        format: "16:9",
        styleModifier: "",
        chatId: ctx.chat.id,
        statusMsgId: statusMsg.message_id
    });
    
    processQueue();
});


// --- Telegram Stars Payment Handling ---
bot.on('pre_checkout_query', (ctx) => {
    ctx.answerPreCheckoutQuery(true).catch(console.error);
});

bot.on('successful_payment', (ctx) => {
    const payload = ctx.message.successful_payment.invoice_payload;
    const userId = ctx.from.id;
    const user = getUserData(userId);
    const lang = user.lang || 'en';

    if (payload.startsWith('buy_gen_') || payload.startsWith('restore_gen_')) {
        const parts = payload.split('_');
        const amount = parseInt(parts[3]);
        
        recordPurchase(userId, amount);
        ctx.reply(t(lang, 'paymentSuccess', { amount }));
        
        notifyAdmin(`💰 User \`${userId}\` bought **${amount}** generations!`);
    } else if (payload.startsWith('buy_vip_')) {
        setVip(userId, true);
        ctx.reply(t(lang, 'paymentVipSuccess'));
        
        notifyAdmin(`👑 User \`${userId}\` purchased VIP for 1000 ⭐️!`);
        
        const users = loadUsers();
        if (!users.globalStats) users.globalStats = { totalStars: 0 };
        users.globalStats.totalStars += 1000;
        saveUsers(users);
    }
});

bot.launch().then(() => {
    console.log("Bot started!");
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));