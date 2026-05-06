// 📡 Socket.io Initialization
// Replace 'https://your-railway-url.up.railway.app' with your actual Railway URL after deploying!
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? window.location.origin 
    : 'https://ajjo-production.up.railway.app'; 

const socket = io(SOCKET_URL);
const ROOM_CODE = 'ajjjo-abhijeet-jenny';

let myIdentity = ''; // 'ABHIJEET' or 'JENNY'
let partnerIdentity = '';
let currentMoney = 0;

const keys = {
    'jenny5515521c': 'ABHIJEET',
    'abh5515521c': 'JENNY'
};

// 🔒 Login Logic
const loginOverlay = document.getElementById('loginOverlay');
const entryKeyInput = document.getElementById('entryKey');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const mainApp = document.getElementById('mainApp');

function login() {
    const key = entryKeyInput.value.trim();
    if (keys[key]) {
        myIdentity = keys[key];
        partnerIdentity = myIdentity === 'ABHIJEET' ? 'JENNY' : 'ABHIJEET';
        setupApp();
    } else {
        loginError.style.display = 'block';
        spawnHeartsLocal(window.innerWidth / 2, window.innerHeight / 2);
    }
}

loginBtn.addEventListener('click', login);
entryKeyInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });

function setupApp() {
    loginOverlay.style.display = 'none';
    mainApp.style.display = 'flex';
    
    document.getElementById('myNameLabel').innerText = myIdentity;
    document.getElementById('partnerNameLabel').innerText = partnerIdentity;
    document.getElementById('chatPartnerName').innerText = partnerIdentity;
    document.getElementById('phoneFromName').innerText = `💌 from: ${partnerIdentity}`;
    document.getElementById('welcomeNames').innerText = `${myIdentity} & ${partnerIdentity}`;
    
    document.getElementById('myAvatar').innerText = myIdentity === 'ABHIJEET' ? '🐰' : '🐻';
    document.getElementById('partnerAvatar').innerText = '😴';
    document.getElementById('chatAvatarEmoji').innerText = partnerIdentity === 'ABHIJEET' ? '🐰' : '🐻';

    socket.emit('join-room', ROOM_CODE);
    syncAction('PARTNER_ONLINE');
    
    spawnHeartsLocal(window.innerWidth / 2, window.innerHeight / 2);
}

function syncAction(type, payload = {}) {
    socket.emit('action', { type, payload, identity: myIdentity, ts: Date.now() });
}

// 🔔 Notification System
const mainNotif = document.getElementById('mainNotif');
function showNotif(title, subtitle) {
    mainNotif.querySelector('.notif-title').innerText = title;
    mainNotif.querySelector('.notif-subtitle').innerText = subtitle;
    mainNotif.classList.add('active');
    setTimeout(() => mainNotif.classList.remove('active'), 5000);
    
    // Play a little sound effect feel with hearts
    spawnHeartsLocal(window.innerWidth / 2, 100);
}

// 💥 Heart Burst System
function spawnHeartsLocal(x, y) {
    const emojis = ['💗', '💜', '💖', '🩷', '✨', '⭐', '🌸'];
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'heart-pop';
            heart.innerText = emojis[Math.floor(Math.random() * emojis.length)];
            heart.style.left = `${x + (Math.random() * 60 - 30)}px`;
            heart.style.top = `${y + (Math.random() * 30 - 15)}px`;
            heart.style.setProperty('--x', `${Math.random() * 100 - 50}px`);
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 1000);
        }, i * 60);
    }
}

function popHearts(event) {
    spawnHeartsLocal(event.clientX, event.clientY);
    syncAction('HEART_BURST', { x: event.clientX, y: event.clientY });
}

// 💬 Chat Interaction
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const messageArea = document.getElementById('messageArea');
const clearBtn = document.getElementById('clearChat');

function appendBubble(text, side) {
    const msg = document.createElement('div');
    msg.className = `message ${side}`;
    msg.innerText = text;
    messageArea.appendChild(msg);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendBubble(text, 'mine');
    syncAction('CHAT_MSG', { text });
    chatInput.value = '';
    spawnHeartsLocal(window.innerWidth / 2, window.innerHeight / 2);
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
clearBtn.addEventListener('click', () => { messageArea.innerHTML = ''; syncAction('CLEAR_CHAT'); });

let typingTimer;
chatInput.addEventListener('input', () => {
    syncAction('TYPING_START');
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => syncAction('TYPING_STOP'), 1500);
});

// Mood Pills
document.querySelectorAll('.mood-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const emoji = pill.innerText.split(' ')[0];
        syncAction('MOOD_CHANGE', { emoji, label: pill.innerText });
        document.getElementById('myAvatar').innerText = emoji;
    });
});

// 💸 Money Logic
function updateMoneyUI(amount) {
    currentMoney = amount;
    document.getElementById('moneyVal').innerText = currentMoney.toFixed(2);
}

function addMoney(val) {
    currentMoney += val;
    updateMoneyUI(currentMoney);
    syncAction('MONEY_UPDATE', { amount: currentMoney });
}

function requestMoney() {
    const amount = prompt("How much do you need, love? 💸");
    if (amount && !isNaN(amount)) {
        syncAction('MONEY_REQUEST', { amount, requester: myIdentity, id: Date.now() });
        showNotif("Request Sent!", `Asked ${partnerIdentity} for ₹${amount} ✨`);
    }
}

function handleGive(amount, reqId) {
    const item = document.getElementById(`req-${reqId}`);
    if (item) item.remove();
    
    // Increment the shared savings when money is "given"
    addMoney(amount); 
    
    syncAction('MONEY_RESPONSE', { amount, type: 'GIVE', reqId });
    showNotif("Money Given! 💖", "ni kosam em ayina ra");
}

function handlePoor(reqId) {
    const item = document.getElementById(`req-${reqId}`);
    if (item) item.remove();
    syncAction('MONEY_RESPONSE', { type: 'POOR', reqId });
    showNotif("Denied! 💀", "kalisi adukundham padha, we da reel poor");
}

function addRequestToList(amount, id, requester) {
    const list = document.getElementById('moneyRequestList');
    const item = document.createElement('div');
    item.className = 'request-item';
    item.id = `req-${id}`;
    item.innerHTML = `
        <div class="request-txt">${requester} wants ₹${amount}</div>
        <div class="request-btns">
            <button class="req-btn give" onclick="handleGive(${amount}, ${id})">Give 💖</button>
            <button class="req-btn poor" onclick="handlePoor(${id})">No Money 💀</button>
        </div>
    `;
    list.appendChild(item);
}

// Watchlist Logic
const movieNight = document.getElementById('movieNight');
const watchlistModal = document.getElementById('watchlistModal');
const watchlistItems = document.getElementById('watchlistItems');

movieNight.addEventListener('click', (e) => {
    watchlistModal.classList.add('active');
    syncAction('WATCHLIST_OPEN');
});

function closeWatchlist() {
    watchlistModal.classList.remove('active');
    syncAction('WATCHLIST_CLOSE');
}

watchlistItems.addEventListener('input', () => {
    syncAction('WATCHLIST_UPDATE', { html: watchlistItems.innerHTML });
});

// Food Cravings Logic
const foodCravings = document.getElementById('foodCravings');
const cravingsModal = document.getElementById('cravingsModal');
const cravingsItems = document.getElementById('cravingsItems');

foodCravings.addEventListener('click', (e) => {
    cravingsModal.classList.add('active');
    syncAction('CRAVINGS_OPEN');
});

function closeCravings() {
    cravingsModal.classList.remove('active');
    syncAction('CRAVINGS_CLOSE');
}

cravingsItems.addEventListener('input', () => {
    syncAction('CRAVINGS_UPDATE', { html: cravingsItems.innerHTML });
});

// Note Logic
const homeNote = document.getElementById('homeNote');
homeNote.addEventListener('input', () => {
    syncAction('NOTE_UPDATE', { text: homeNote.innerText });
});

// Phone Logic
const phone = document.getElementById('retroPhone');
const phoneMsg = document.getElementById('phoneMsg');
phone.addEventListener('click', () => {
    const messages = ["LOVE YOU!", "MISS YOU!", "CAN'T WAIT!", "YOU'RE THE BEST!", "MUAH! 💋"];
    const randMsg = messages[Math.floor(Math.random() * messages.length)];
    phoneMsg.innerText = randMsg;
    syncAction('PHONE_MSG', { text: randMsg });
});

// Cursor Tracking
document.addEventListener('mousemove', (e) => {
    if (myIdentity && Date.now() % 10 === 0) {
        syncAction('CURSOR_MOVE', { x: e.clientX, y: e.clientY });
    }
});

const partnerCursor = document.createElement('div');
partnerCursor.id = 'partner-cursor';
partnerCursor.innerHTML = '🩷';
partnerCursor.style.position = 'fixed';
partnerCursor.style.pointerEvents = 'none';
partnerCursor.style.zIndex = '9999';
partnerCursor.style.fontSize = '20px';
partnerCursor.style.display = 'none';
document.body.appendChild(partnerCursor);

// 📥 Incoming Actions
socket.on('action', ({ type, payload, identity }) => {
    if (identity === myIdentity) return;
    const partnerAvatar = document.getElementById('partnerAvatar');
    switch(type) {
        case 'CHAT_MSG': appendBubble(payload.text, 'theirs'); break;
        case 'CLEAR_CHAT': messageArea.innerHTML = ''; break;
        case 'MOOD_CHANGE': partnerAvatar.innerText = payload.emoji; break;
        case 'HEART_BURST': spawnHeartsLocal(payload.x, payload.y); break;
        case 'WATCHLIST_OPEN': watchlistModal.classList.add('active'); break;
        case 'WATCHLIST_CLOSE': watchlistModal.classList.remove('active'); break;
        case 'WATCHLIST_UPDATE': watchlistItems.innerHTML = payload.html; break;
        case 'CRAVINGS_OPEN': cravingsModal.classList.add('active'); break;
        case 'CRAVINGS_CLOSE': cravingsModal.classList.remove('active'); break;
        case 'CRAVINGS_UPDATE': cravingsItems.innerHTML = payload.html; break;
        case 'MONEY_UPDATE': updateMoneyUI(payload.amount); break;
        case 'MONEY_REQUEST': 
            showNotif(`₹${payload.amount} requested!`, `From ${identity}: "I need some love (and cash) 💸"`);
            addRequestToList(payload.amount, payload.id, identity);
            break;
        case 'MONEY_RESPONSE':
            if (payload.type === 'GIVE') {
                showNotif("HE GAVE IT! 💖", "ni kosam em ayina ra");
                // Optional: Update money if desired, though user didn't explicitly ask to subtract
            } else {
                showNotif("WE POOR 💀", "kalisi adukundham padha, we da reel poor");
            }
            break;
        case 'TYPING_START': document.querySelector('.typing-indicator').style.display = 'flex'; break;
        case 'TYPING_STOP': document.querySelector('.typing-indicator').style.display = 'none'; break;
        case 'NOTE_UPDATE': homeNote.innerText = payload.text; break;
        case 'PHONE_MSG': phoneMsg.innerText = payload.text; break;
        case 'CURSOR_MOVE':
            partnerCursor.style.display = 'block';
            partnerCursor.style.left = `${payload.x}px`;
            partnerCursor.style.top = `${payload.y}px`;
            break;
        case 'PARTNER_ONLINE':
            partnerAvatar.innerText = partnerIdentity === 'ABHIJEET' ? '🐰' : '🐻';
            document.querySelector('.s-dot.pink').style.background = '#27C93F';
            syncAction('I_AM_ONLINE');
            break;
        case 'I_AM_ONLINE':
            partnerAvatar.innerText = partnerIdentity === 'ABHIJEET' ? '🐰' : '🐻';
            document.querySelector('.s-dot.pink').style.background = '#27C93F';
            break;
        case 'PARTNER_OFFLINE':
            partnerAvatar.innerText = '😴';
            document.querySelector('.s-dot.pink').style.background = '#FF3B3B';
            partnerCursor.style.display = 'none';
            break;
    }
});

socket.on('init-state', (state) => {
    if (state.note) homeNote.innerText = state.note;
    if (state.watchlist) watchlistItems.innerHTML = state.watchlist;
    if (state.cravings) cravingsItems.innerHTML = state.cravings;
    if (state.money !== undefined) updateMoneyUI(state.money);
});

socket.on('connect', () => { if (myIdentity) { syncAction('PARTNER_ONLINE'); document.querySelector('.s-dot.yellow').style.background = '#27C93F'; } });
socket.on('disconnect', () => { document.querySelector('.s-dot.yellow').style.background = '#FF3B3B'; });

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.typing-indicator').style.display = 'none';
});

window.addMoney = addMoney;
window.requestMoney = requestMoney;
window.handleGive = handleGive;
window.handlePoor = handlePoor;
window.closeWatchlist = closeWatchlist;
window.closeCravings = closeCravings;
