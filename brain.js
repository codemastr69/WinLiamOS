const $ = id => document.getElementById(id);

// ---------- window show/hide helpers (safe: won't block clicks when hidden) ----------
function showWindow(id) {
  const el = $(id);
  if (!el) return;

  el.style.display = "flex";
  el.style.visibility = "visible";
  el.style.pointerEvents = "auto";
  el.style.zIndex = 900;
}
function hideWindow(id){
  const el = $(id);
  if(!el) return;
  el.style.display = 'none';
  el.style.visibility = 'hidden';
  el.style.pointerEvents = 'none';
  // lower the z-index so it can't block clicks
  el.style.zIndex = 1;
}
function toggleWindow(id){
  const el = $(id);
  if(!el) return;
  const visible = getComputedStyle(el).display === 'flex' && el.style.visibility !== 'hidden';
  if(visible) hideWindow(id); else showWindow(id);
}

// ---------- draggable + close behavior for every .window ----------
function makeWindow(win){
  const tb = win.querySelector('.titlebar');
  let isDragging=false, offsetX=0, offsetY=0, prevRect={}, isMax=false;
  tb.addEventListener('pointerdown', e=>{
    if(e.target.classList.contains('close')) return;
    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    tb.setPointerCapture(e.pointerId);
  });
  tb.addEventListener('pointermove', e=>{
    if(!isDragging) return;
    win.style.left = (e.clientX - offsetX) + 'px';
    win.style.top = (e.clientY - offsetY) + 'px';
  });
  tb.addEventListener('pointerup', e=>{
    isDragging=false;
    try{ tb.releasePointerCapture(e.pointerId); }catch(e){}
  });
  tb.addEventListener('pointercancel', e=>{
    isDragging=false;
    try{ tb.releasePointerCapture(e.pointerId); }catch(e){}
  });
  tb.addEventListener('dblclick', ()=>{
    if(!isMax){
      prevRect = {left: win.offsetLeft, top: win.offsetTop, width: win.offsetWidth, height: win.offsetHeight};
      win.style.left = '0px'; win.style.top = '0px'; win.style.width = '100%'; win.style.height = 'calc(100% - 56px)';
      isMax = true;
    } else {
      win.style.left = prevRect.left + 'px'; win.style.top = prevRect.top + 'px';
      win.style.width = prevRect.width + 'px'; win.style.height = prevRect.height + 'px';
      isMax = false;
    }
    if (win.id === "paintWindow") resizePaintCanvas();
  });

  const closeBtn = win.querySelector('.control.close');
  if(closeBtn) closeBtn.addEventListener('click', ()=> hideWindow(win.id));
}

// initialize all windows
document.querySelectorAll('.window').forEach(win => makeWindow(win));

// ---------- browser + bg editor behaviors ----------
// ---------- browser with Enter key + https auto ----------
function openURL() {
  let url = $('browserURL').value.trim();
  if (!url) return;

  // If no protocol, prepend https://
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  $('browserFrame').src = url;
}

// Open on button click
$('browserGo').addEventListener('click', openURL);

// Open on Enter key
$('browserURL').addEventListener('keypress', e => {
  if (e.key === 'Enter') openURL();
});

$('bgSet').addEventListener('click', ()=> { 
  const url = $('bgURL').value.trim(); 
  if (url) {
    const bgStyle = `url('${url}') center/cover no-repeat`;
    document.body.style.background = bgStyle;
    localStorage.setItem('winliam_bg', bgStyle);
  }
});

$('bgReset').addEventListener('click', ()=> { 
  const defaultBg = 'linear-gradient(to bottom right, var(--win-bg-start), var(--win-bg-end))';
  document.body.style.background = defaultBg;
  localStorage.removeItem('winliam_bg');
});


// ---------- background presets (from your old file) ----------
const presetImages = [
  "Windows 11.jpg",
  "Windows 10.png",
  "city.jpeg",
  "earth.jpeg",
  "nature.jpeg"
];

window.addEventListener('load', ()=>{
  // append presets into bg editor content (if exists)
  const bgContent = $('bgEditorWindow')?.querySelector('.content');
  if(bgContent){
    const presetContainer = document.createElement('div');
    presetContainer.style.display = 'flex';
    presetContainer.style.flexWrap = 'wrap';
    presetContainer.style.gap = '8px';
    presetContainer.style.marginTop = '10px';
    presetImages.forEach(name=>{
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = name;
      btn.style.backgroundImage = `url('presets/${name}')`;
      btn.style.backgroundSize = 'cover';
      btn.style.color = '#fff';
      btn.style.width = '100px';
      btn.style.height = '60px';
      btn.style.border = '1px solid rgba(255,255,255,.1)';
      btn.style.textShadow = '0 1px 2px #000';
      btn.addEventListener('click', ()=> {
        document.body.style.background = `url('presets/${name}') center/cover no-repeat`;
      });
      presetContainer.appendChild(btn);
    });
    bgContent.appendChild(presetContainer);
  }
});

window.addEventListener('load', () => {
  const savedBg = localStorage.getItem('winliam_bg');
  if (savedBg) {
    document.body.style.background = savedBg;
  }
});


// ---------- notes + recycle bin ----------
let notes = JSON.parse(localStorage.getItem('notes')||'{}');
let recycleBinNotes = JSON.parse(localStorage.getItem('recycleBin')||'{}');
const desktop = $('desktop');

function addDesktopIcon(id, title){
  const icon = document.createElement('div');
  icon.className='desktop-icon';
  icon.style.left = Math.random()*400 + 'px';
  icon.style.top = Math.random()*200 + 'px';
  icon.innerHTML = title || 'Untitled';
  icon.addEventListener('dblclick', ()=> openNoteWindow(id));
  desktop.appendChild(icon);
}

function openNoteWindow(id){
  const note = notes[id];
  if(!note) return;
  const newWin = $('notepadWindow').cloneNode(true);
  newWin.id = 'notepad_'+id;
  newWin.querySelector('#noteTitle').value = note.title;
  newWin.querySelector('#noteBody').value = note.body;
  document.body.appendChild(newWin);
  makeWindow(newWin);
  showWindow(newWin.id);
  newWin.addEventListener('contextmenu', e=>{
    e.preventDefault();
    recycleBinNotes[id]=note;
    delete notes[id];
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('recycleBin', JSON.stringify(recycleBinNotes));
    newWin.remove();
    alert('Moved to Recycle Bin');
  });
}

window.addEventListener('load', ()=>{
  for(const id in notes){ addDesktopIcon(id, notes[id].title); }
});

// note save/clear
$('saveNote').addEventListener('click', ()=>{
  const title = $('noteTitle').value || 'Untitled';
  const body = $('noteBody').value;
  const id = 'note_'+Date.now();
  notes[id] = {title, body};
  localStorage.setItem('notes', JSON.stringify(notes));
  addDesktopIcon(id, title);
  $('noteSaved').textContent='Saved';
});
$('clearNote').addEventListener('click', ()=> {
  $('noteTitle').value=''; $('noteBody').value=''; $('noteSaved').textContent='Cleared';
});

// ---------- clock ----------
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = (hours % 12) || 12;
  const timeString = `${formattedHours}:${minutes} ${ampm}`;
  const dateString = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  $('clock').innerHTML = `${timeString}<br>${dateString}`;
}
updateClock();
setInterval(updateClock, 1000);

// ---------- TERMINAL COMMANDS ----------
$('termSend')?.addEventListener('click', runCommand);
$('termIn')?.addEventListener('keypress', e => { if (e.key === 'Enter') runCommand(); });

function runCommand() {
  const cmdLine = $('termIn').value.trim();
  const out = $('termOut');
  if (!cmdLine) return;

  out.textContent += `\n> ${cmdLine}`;
  const [cmd, ...args] = cmdLine.split(' ');

  switch (cmd.toLowerCase()) {
    case 'help':
      out.textContent += `
Available commands:
help         - Show this help list
clear        - Clear the terminal
time         - Show current time
date         - Show today's date
echo [text]  - Repeat your text
user         - Show current user
apps         - List available apps
open [app]   - Open an app window
bgreset      - Reset background
reboot       - Reload WinliamOS
shutdown     - Shutdown WinliamOS
matrix       - Enter the matrix
version      - Show system version`;
      break;

    case 'clear':
      out.textContent = 'WinliamOS Terminal — type "help" for commands.';
      break;

    case 'time':
      out.textContent += `\n${new Date().toLocaleTimeString()}`;
      break;

    case 'date':
      out.textContent += `\n${new Date().toLocaleDateString()}`;
      break;

    case 'echo':
      out.textContent += `\n${args.join(' ') || ''}`;
      break;

    case 'user':
      out.textContent += `\nCurrent user: ${currentUser || 'Guest'}`;
      break;

    case 'apps':
      out.textContent += `
Available apps:
- browser
- notepad
- background
- terminal
- tictactoe
- cursor
- calculator
- about`;
      break;

    case 'open':
      const app = args[0]?.toLowerCase();
      const map = {
        browser: 'browserWindow',
        notepad: 'notepadWindow',
        background: 'bgEditorWindow',
        terminal: 'terminalWindow',
        tictactoe: 'ticTacToeWindow',
        cursor: 'cursorEditorWindow',
        about: 'aboutWindow'
      };
      if (map[app]) {
        showWindow(map[app]);
        out.textContent += `\nOpened ${app}`;
      } else {
        out.textContent += `\nUnknown app: ${app}`;
      }
      break;

    case 'bgreset':
      document.body.style.background = 'linear-gradient(to bottom right, var(--win-bg-start), var(--win-bg-end))';
      out.textContent += '\nBackground reset.';
      break;

    case 'reboot':
      out.textContent += '\nRestarting...';
      setTimeout(() => location.reload(), 1000);
      break;

    case 'version':
      out.textContent += '\nWinliamOS Version 3.1';
      break;

// --- MATRIX COMMAND ---
case 'matrix':
  out.textContent += '\nEntering the Matrix...';
  const interval = setInterval(() => {
    out.textContent += '\n' + Array(60)
      .fill(0)
      .map(() => (Math.random() > 0.5 ? '1' : '0'))
      .join('');
    out.scrollTop = out.scrollHeight;
  }, 50);
  setTimeout(() => {
    clearInterval(interval);
    out.textContent += '\nMatrix session ended.';
    out.scrollTop = out.scrollHeight;
  }, 3000);
  break;

// --- SHUTDOWN COMMAND ---
case 'shutdown':
  out.textContent += '\nShutting down WinliamOS...';
  setTimeout(() => {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;
      background:black;color:#0f0;font-family:monospace;font-size:22px;">
        WinliamOS has been shut down.<br><br>Press F5 to restart.
      </div>`;
  }, 1500);
  break;

      case 'notify':
  notify(args.join(" ") || "No message provided.");
  break;

    default:
      out.textContent += `\nCommand not found: ${cmd}`;
  }

  out.scrollTop = out.scrollHeight;
  $('termIn').value = '';
}

// ---------- CALCULATOR APP ----------

const display = $('calcDisplay');
const buttons = $('calcButtons');

// Calculator buttons layout — includes Clear (C)
const calcKeys = [
  '7','8','9','/',
  '4','5','6','*',
  '1','2','3','-',
  '0','.','=','+',
  'C'
];

// Render buttons
buttons.innerHTML = '';
calcKeys.forEach(key => {
  const btn = document.createElement('button');
  btn.textContent = key;
  btn.style.padding = '10px';
  btn.style.fontSize = '18px';
  btn.style.borderRadius = '6px';
  btn.style.cursor = 'pointer';
  btn.style.background = key === 'C' ? '#d9534f' : '#444';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.addEventListener('click', () => handleCalcKey(key));
  buttons.appendChild(btn);
});

let calcExpression = '';

function handleCalcKey(key) {
  if (key === 'C') {
    calcExpression = '';
  } else if (key === '=') {
    try {
      calcExpression = eval(calcExpression).toString();
    } catch {
      calcExpression = 'Error';
    }
  } else {
    calcExpression += key;
  }
  display.value = calcExpression;
}

// ---------- Keyboard Input Support ----------
window.addEventListener('keydown', e => {
  // Only handle keys if calculator is open
  const calcVisible = getComputedStyle($('calculatorWindow')).display !== 'none';
  if (!calcVisible) return;

  const key = e.key;

  if (/[0-9+\-*/.]/.test(key)) {
    calcExpression += key;
  } else if (key === 'Enter' || key === '=') {
    try {
      calcExpression = eval(calcExpression).toString();
    } catch {
      calcExpression = 'Error';
    }
  } else if (key === 'Escape' || key.toLowerCase() === 'c') {
    calcExpression = '';
  } else if (key === 'Backspace') {
    calcExpression = calcExpression.slice(0, -1);
  } else {
    return; // ignore anything else
  }

  display.value = calcExpression;
});


// ---------- ACCOUNT SYSTEM (SERVER-BASED) ----------
let currentUser = localStorage.getItem('winliam_currentUser') || null;

function updateUserDisplay() {
  $('usernameDisplay').textContent = currentUser ? currentUser : 'Guest';
}

function loginAs(username) {
  currentUser = username;
  localStorage.setItem('winliam_currentUser', username);
  updateUserDisplay();
  hideWindow('loginWindow');
}

const SERVER = "https://winliamos-server-nodejs-runtime.up.railway.app";

// --- SIGN UP ---
$('btnSignUp').addEventListener('click', async () => {
  const user = $('loginUser').value.trim();
  const pass = $('loginPass').value;

  if (!user || !pass) {
    $('loginMsg').textContent = "Enter username + password.";
    return;
  }

  const res = await fetch(`${SERVER}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  });

  const data = await res.json();
  $('loginMsg').textContent = data.message;
});

// --- SIGN IN ---
$('btnSignIn').addEventListener('click', async () => {
  const user = $('loginUser').value.trim();
  const pass = $('loginPass').value;

  if (!user || !pass) {
    $('loginMsg').textContent = "Enter username + password.";
    return;
  }

  const res = await fetch(`${SERVER}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  });

  const data = await res.json();

  $('loginMsg').textContent = data.message;

  if (data.success) {
    loginAs(user);
  }
});

// --- GUEST MODE ---
$('btnGuest').addEventListener('click', () => {
  loginAs("Guest");
});

// --- PASSWORD TOGGLE ---
$('togglePass').addEventListener('click', () => {
  const input = $('loginPass');
  input.type = input.type === "password" ? "text" : "password";
  $('togglePass').textContent = input.type === "password" ? "👁️" : "🙈";
});

// --- LOGOUT ---
$('btnLogout').addEventListener('click', () => {
  localStorage.removeItem('winliam_currentUser');
  currentUser = null;
  updateUserDisplay();
  showWindow('loginWindow');
});
// --- AUTO LOGIN ---
window.addEventListener('load', () => {
  if (currentUser) {
    updateUserDisplay();
    hideWindow('loginWindow');
  } else {
    showWindow('loginWindow');
  }
});

// Safety: ensure login window doesn't block UI
hideWindow('loginWindow');

// refresh friends list
async function loadFriends() {
  if (!currentUser) return;

  const res = await fetch(SERVER + "/users");
  const all = await res.json();

  const me = all[currentUser];
  const myFriends = me?.friends || [];

  const box = $("friendList");
  box.innerHTML = "";

  myFriends.forEach(friend => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = friend;
    btn.onclick = () => openChat(friend);
    box.appendChild(btn);
  });
  btn.style.position = "relative";

const dot = document.createElement("div");
dot.style.width = "10px";
dot.style.height = "10px";
dot.style.borderRadius = "50%";
dot.style.position = "absolute";
dot.style.right = "6px";
dot.style.top = "6px";
dot.style.background = all[friend]?.online ? "#0f0" : "#777";

btn.appendChild(dot);
}

// add friend
$("addFriendBtn").addEventListener("click", async () => {
  const friend = $("addFriendInput").value.trim();
  if (!friend) return;

  const res = await fetch(SERVER + "/addFriend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, friend })
  });

  const data = await res.json();
  $("addFriendMsg").textContent = data.message;

  loadFriends();
});

let currentChatFriend = null;

// open chat window
function openChat(friend) {
  currentChatFriend = friend;
  $("chatWithLabel").textContent = "Chat with " + friend;
  showWindow("chatWindow");
  loadMessages();
}

// send message
$("chatSendBtn").addEventListener("click", async () => {
  const text = $("chatInput").value.trim();
  if (!text) return;

  await fetch(SERVER + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: currentUser,
      to: currentChatFriend,
      text
    })
  });

  $("chatInput").value = "";
  loadMessages();
});

// load messages from server
let lastMessageTimestamps = {}; // stores last message time per friend

async function loadMessages() {
  if (!currentChatFriend) return;

  const res = await fetch(SERVER + "/getMessages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: currentUser,
      friend: currentChatFriend
    })
  });

  const msgs = await res.json();
  const box = $("chatMessages");

  box.innerHTML = msgs
    .map(m => `${m.from}: ${m.text}`)
    .join("\n");

  box.scrollTop = box.scrollHeight;

  // 🔥 NOTIFICATION CHECK
  if (msgs.length > 0) {
    const lastMsg = msgs[msgs.length - 1];

    // ignore our own messages
    if (lastMsg.from !== currentUser) {
      // if message is new
      if (!lastMessageTimestamps[currentChatFriend] ||
          lastMsg.time > lastMessageTimestamps[currentChatFriend]) {

        notify(`📩 New message from ${currentChatFriend}`);
      }

      lastMessageTimestamps[currentChatFriend] = lastMsg.time;
    }
  }
}

// ---------- Tic Tac Toe (Medium AI) ----------
const boardEl = document.getElementById("ticTacToeBoard");
const msgEl = document.getElementById("ticTacToeMsg");
const resetBtn = document.getElementById("resetTicTacToe");
const modeSelect = document.getElementById("ticMode");

let ticBoard = Array(9).fill(null);
let ticPlayer = "X";
let gameOver = false;

// create board UI
function setupTicTacToeBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.cssText = `
      width:80px;height:80px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(255,255,255,.05);
      font-size:28px;cursor:pointer;
      border-radius:8px;
    `;
    cell.dataset.index = i;
    cell.onclick = () => ticMove(i);
    boardEl.appendChild(cell);
  }
}
setupTicTacToeBoard();

function ticMove(i) {
  if (ticBoard[i] || gameOver) return;
  // place current player's mark
  ticBoard[i] = ticPlayer;
  boardEl.children[i].textContent = ticPlayer;

  if (checkWin(ticPlayer)) {
    msgEl.textContent = `${ticPlayer} wins!`;
    gameOver = true;
    return;
  }

  if (ticBoard.every(v => v)) {
    msgEl.textContent = "It's a tie!";
    gameOver = true;
    return;
  }

  // swap player
  ticPlayer = ticPlayer === "X" ? "O" : "X";

  // if vs computer and it's O's turn, have the AI move
  if (modeSelect && modeSelect.value === "computer" && ticPlayer === "O" && !gameOver) {
    setTimeout(ticComputerMoveMedium, 400);
  }
}

// medium AI: win > block > center > corners > sides, but with occasional random mistake
function ticComputerMoveMedium() {
  const empty = ticBoard.map((v, i) => (v ? null : i)).filter(v => v !== null);
  if (empty.length === 0) return;

  // small randomness: 25% chance to pick totally random to simulate mistakes
  if (Math.random() < 0.25) {
    const pick = empty[Math.floor(Math.random() * empty.length)];
    ticMove(pick);
    return;
  }

  // helper to find winning/blocking move for a player
  const findCritical = (player) => {
    const wins = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const line of wins) {
      const values = line.map(i => ticBoard[i]);
      const countPlayer = values.filter(v => v === player).length;
      const countEmpty = values.filter(v => v === null).length;
      if (countPlayer === 2 && countEmpty === 1) {
        const idx = line.find(i => ticBoard[i] === null);
        if (idx !== undefined) return idx;
      }
    }
    return null;
  };

  // 1) can O win now?
  let pick = findCritical("O");
  if (pick !== null) { ticMove(pick); return; }

  // 2) can we block X?
  pick = findCritical("X");
  if (pick !== null) { ticMove(pick); return; }

  // 3) take center if available
  if (ticBoard[4] === null) { ticMove(4); return; }

  // 4) take any available corner (prefer corners)
  const corners = [0,2,6,8].filter(i => ticBoard[i] === null);
  if (corners.length) {
    pick = corners[Math.floor(Math.random() * corners.length)];
    ticMove(pick);
    return;
  }

  // 5) fallback to any side
  const sides = [1,3,5,7].filter(i => ticBoard[i] === null);
  if (sides.length) {
    pick = sides[Math.floor(Math.random() * sides.length)];
    ticMove(pick);
    return;
  }

  // 6) last resort random
  pick = empty[Math.floor(Math.random() * empty.length)];
  ticMove(pick);
}

function checkWin(p) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(line => line.every(i => ticBoard[i] === p));
}

function resetTicTacToe() {
  ticBoard = Array(9).fill(null);
  ticPlayer = "X";
  gameOver = false;
  msgEl.textContent = "";
  Array.from(boardEl.children).forEach(c => c.textContent = "");
}

// wire up controls safely
if (resetBtn) resetBtn.onclick = resetTicTacToe;
if (modeSelect) modeSelect.onchange = resetTicTacToe;

// Taskbar button
$('resetTicTacToe').addEventListener('click', resetTicTacToe);
const cursorInput = $('cursorFile');
const setCursorBtn = $('setCursorBtn');
const resetCursorBtn = $('resetCursorBtn');
const cursorMsg = $('cursorMsg');
// ---- Online Tic Tac Toe frontend ----
// state
let onlineGameId = null;
let onlineSide = null; // 'X' or 'O'
let onlinePolling = null;

function initOnlineUI() {
  const ticContent = document.querySelector("#ticTacToeWindow .content");
  if (!ticContent) return;

  // build online controls (only once)
  if (document.getElementById("onlineControls")) return;

  const container = document.createElement("div");
  container.id = "onlineControls";
  container.style.marginTop = "12px";
  container.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;">
      <button class="btn" id="createGameBtn">Create Online Game</button>
      <input id="joinGameInput" placeholder="game id" style="padding:6px;border-radius:6px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.06);color:#fff;">
      <button class="btn" id="joinGameBtn">Join</button>
      <button class="btn" id="leaveGameBtn" style="background:#c0392b;">Leave</button>
    </div>
    <div style="margin-top:8px;opacity:.9;font-size:13px;">
      <span id="onlineStatus">Not connected</span>
      <span id="onlineGameInfo" style="margin-left:12px"></span>
    </div>
  `;
  ticContent.appendChild(container);

  document.getElementById("createGameBtn").onclick = createOnlineGame;
  document.getElementById("joinGameBtn").onclick = () => joinOnlineGame(document.getElementById("joinGameInput").value.trim());
  document.getElementById("leaveGameBtn").onclick = leaveOnlineGame;
}
initOnlineUI();

// override ticMove to support online games
const originalTicMove = ticMove;
function ticMove(i) {
  // if an online game is active
  if (onlineGameId) {
    // local validation: only allow if it's our turn
    if (!onlineSide) return notify("Not joined as a player.");
    // fetch state to check turn quickly (server authoritative)
    fetch(`${SERVER}/games/state`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id: onlineGameId })
    }).then(r => r.json()).then(d => {
      if (!d.success) return notify(d.error || "Can't fetch game");
      const game = d.game;
      const side = onlineSide;
      if (game.winner) return notify("Game finished. Leave or create a new one.");
      if (game.turn !== side) return notify("Not your turn.");
      // send move
      fetch(`${SERVER}/games/move`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id: onlineGameId, player: currentUser, index: i })
      }).then(r => r.json()).then(res => {
        if (!res.success) return notify(res.error || "Move failed");
        // refresh display from server state immediately
        applyOnlineGameState(res.game);
      });
    });
    return;
  }

  // otherwise use local mode
  originalTicMove(i);
}

// helper to apply server game to board UI
function applyOnlineGameState(game) {
  ticBoard = game.board.slice();
  Array.from(boardEl.children).forEach((cell, idx) => cell.textContent = ticBoard[idx] || "");
  msgEl.textContent = game.winner ? (game.winner === "T" ? "Tie!" : `${game.winner} wins!`) : `Turn: ${game.turn}`;
  document.getElementById("onlineStatus").textContent = `Side: ${onlineSide || '-'} • Turn: ${game.turn} • ${game.players.X || '-'} vs ${game.players.O || '-'}`;
  if (game.winner) stopPolling();
}

// create game
async function createOnlineGame() {
  if (!currentUser || currentUser === "Guest") return notify("Sign in to play online.");
  const res = await fetch(`${SERVER}/games/create`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ player: currentUser })
  });
  const data = await res.json();
  if (!data.success) return notify(data.error || "Create failed");
  onlineGameId = data.id;
  onlineSide = "X";
  document.getElementById("onlineGameInfo").textContent = "Game ID: " + onlineGameId;
  notify("Created game " + onlineGameId);
  startPolling();
  showWindow("ticTacToeWindow");
}

// join game
async function joinOnlineGame(id) {
  if (!id) return notify("Enter a game id.");
  if (!currentUser || currentUser === "Guest") return notify("Sign in to play online.");
  const res = await fetch(`${SERVER}/games/join`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ id, player: currentUser })
  });
  const data = await res.json();
  if (!data.success) return notify(data.error || "Join failed");
  onlineGameId = id;
  onlineSide = (data.side) ? data.side : (data.game.players.X === currentUser ? "X" : "O");
  document.getElementById("onlineGameInfo").textContent = "Game ID: " + onlineGameId;
  notify("Joined game " + onlineGameId + " as " + onlineSide);
  startPolling();
  showWindow("ticTacToeWindow");
}

// leave current online game
function leaveOnlineGame() {
  onlineGameId = null;
  onlineSide = null;
  document.getElementById("onlineGameInfo").textContent = "";
  document.getElementById("onlineStatus").textContent = "Not connected";
  stopPolling();
  resetTicTacToe(); // local reset
  notify("Left online game.");
}

// polling
function startPolling() {
  if (onlinePolling) return;
  onlinePolling = setInterval(async () => {
    if (!onlineGameId) return;
    const res = await fetch(`${SERVER}/games/state`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id: onlineGameId })
    });
    const d = await res.json();
    if (d.success) applyOnlineGameState(d.game);
    else {
      notify(d.error || "Couldn't load game");
      stopPolling();
    }
  }, 1200);
}

function stopPolling() {
  if (onlinePolling) { clearInterval(onlinePolling); onlinePolling = null; }
}

// make sure UI created when tic window opens
document.getElementById("btnTicTacToe")?.addEventListener("click", () => {
  setTimeout(initOnlineUI, 100); // ensure content exists
});

// Helper: resize image to max dimension
function resizeImage(file, maxSize = 16, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      // Calculate new size
      let width = img.width;
      let height = img.height;
      if(width > height) {
        if(width > maxSize) { height *= maxSize/width; width = maxSize; }
      } else {
        if(height > maxSize) { width *= maxSize/height; height = maxSize; }
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      callback(canvas.toDataURL('image/png')); // return resized data URL
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

setCursorBtn.addEventListener('click', () => {
  const file = cursorInput.files[0];
  if(!file) { 
    cursorMsg.textContent = 'Select an image first.';
    return; 
  }

  resizeImage(file, 64, dataURL => {
    document.body.style.cursor = `url(${dataURL}) 0 0, auto`;
    cursorMsg.textContent = 'Cursor updated!';
    localStorage.setItem('winliam_cursor', dataURL);
  });
});

resetCursorBtn.addEventListener('click', () => {
  document.body.style.cursor = 'default';
  cursorMsg.textContent = 'Cursor reset.';
  localStorage.removeItem('winliam_cursor');
});

// Load previously saved cursor on startup
window.addEventListener('load', () => {
  const savedCursor = localStorage.getItem('winliam_cursor');
  if(savedCursor) document.body.style.cursor = `url(${savedCursor}) 0 0, auto`;
});

// ---------- Taskbar Button Wiring ----------
const taskbarMap = {
  btnStart: 'startWindow',
  btnBrowser: 'browserWindow',
  btnBg: 'bgEditorWindow',
  btnNotepad: 'notepadWindow',
  btnTerminal: 'terminalWindow',
  btnAbout: 'aboutWindow',
  btnTicTacToe: 'ticTacToeWindow',
  btnCursorEditor: 'cursorEditorWindow',
  btnCalculator: 'calculatorWindow',
  btnFriends: "friendsWindow",
  btnChat: "chatWindow",
  btnPaint: 'paintWindow'
};

for (const [btnId, winId] of Object.entries(taskbarMap)) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.addEventListener('click', () => toggleWindow(winId));
  }
}
// ---------- VOICE COMMANDS ----------
if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  function startVoice() {
    recognition.start();
    $('termOut').textContent += '\n🎤 Listening for command...';
  }

  function stopVoice() {
    recognition.stop();
  }

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase().trim();
    $('termOut').textContent += `\nYou said: "${command}"`;

    if (command.includes('open tic-tac-toe')) {
      showWindow('ticTacToeWindow');
      $('termOut').textContent += '\nOpened Tic Tac Toe.';
    } 
    else if (command.startsWith('browser ')) {
      const query = command.replace('browser ', '').trim();
      $('browserURL').value = query;
      openURL();
      showWindow('browserWindow');
      $('termOut').textContent += `\nOpened browser with: ${query}`;
    } 
    else if (command.includes('open browser')) {
      showWindow('browserWindow');
      $('termOut').textContent += '\nOpened browser.';
    } 
    else if (command.includes('open notepad')) {
      showWindow('notepadWindow');
      $('termOut').textContent += '\nOpened Notepad.';
    } 
    else if (command.includes('open terminal')) {
      showWindow('terminalWindow');
      $('termOut').textContent += '\nOpened Terminal.';
    } 
    else if (command.includes('open background')) {
      showWindow('bgEditorWindow');
      $('termOut').textContent += '\nOpened Background Editor.';
    } 
        else if (command.includes('open calculator')) {
      showWindow('calculatorWindow');
      $('termOut').textContent += '\nOpened calculator.';
    } 
          else if (command.includes('open friends')) {
      showWindow('friendsWindow');
      $('termOut').textContent += '\nOpened friends.';
    } 
            else if (command.includes('open chat')) {
      showWindow('chatWindow');
      $('termOut').textContent += '\nOpened calculator.';
    } 
              else if (command.includes('open paint')) {
      showWindow('paintWindow');
      $('termOut').textContent += '\nOpened paint.';
    } 
    else {
      $('termOut').textContent += '\nUnrecognized voice command.';
    }

    $('termOut').scrollTop = $('termOut').scrollHeight;
    stopVoice();
  };

  recognition.onerror = () => {
    $('termOut').textContent += '\n🎤 Error recognizing voice.';
  };

  // Add a keyboard shortcut (Ctrl + Shift + V) to start voice
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
      startVoice();
    }
  });
} else {
  console.warn('Voice recognition not supported in this browser.');
}
//notifications

setInterval(() => {
  if (currentUser) loadFriends(); 
  if (currentChatFriend) loadMessages(); 
}, 1500);

    function notify(text) {
  const note = document.createElement("div");
  note.className = "notification";
  note.textContent = text;

  document.getElementById("notificationContainer").appendChild(note);

  setTimeout(() => {
    note.style.opacity = "0";
    setTimeout(() => note.remove(), 300);
  }, 3000);
}  // ← THIS WAS MISSING
  

// DELETE ACCOUNT BUTTON
$("btnDeleteAccount").addEventListener("click", async () => {
  if (!currentUser || currentUser === "Guest") {
    $("deleteMsg").textContent = "You can't delete the Guest account.";
    return;
  }

  if (!confirm("Are you SURE? This permanently deletes your account?")) {
    return;
  }

  const res = await fetch(`${SERVER}/deleteAccount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser })
  });

  const data = await res.json();
  $("deleteMsg").textContent = data.message;

  if (data.success) {
    localStorage.removeItem("winliam_currentUser");
    currentUser = null;
    updateUserDisplay();
    showWindow("loginWindow");
  }
});

// ---- PAINT APP ----
$("btnPaint")?.addEventListener("click", () => {
  toggleWindow("paintWindow");
  resizePaintCanvas();
});

const canvas = $("paintCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", e => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", e => {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.strokeStyle = $("paintColor").value;
  ctx.lineWidth = $("paintSize").value;
  ctx.lineCap = "round";
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseleave", () => drawing = false);

// Clear
$("paintClear").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Save as Image
$("paintSave").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "winliamos_draw.png";
  link.href = canvas.toDataURL();
  link.click();
});

function resizePaintCanvas() {
  const win = document.getElementById("paintWindow");
  const canvas = document.getElementById("paintCanvas");
  const ctx = canvas.getContext("2d");

  // save drawing  
  const saved = canvas.toDataURL();

  // resize canvas to window content area
  const content = win.querySelector(".content");
  canvas.width = content.clientWidth - 10;
  canvas.height = content.clientHeight - 10;

  // restore drawing  
  const img = new Image();
  img.src = saved;
  img.onload = () => ctx.drawImage(img, 0, 0);
}
// ---------- BATTERY DISPLAY ----------
async function initBattery() {
  if (!navigator.getBattery) {
    $("batteryDisplay").textContent = "Battery: N/A";
    return;
  }

  const battery = await navigator.getBattery();

  function updateBattery() {
    const level = Math.round(battery.level * 100);
    const charging = battery.charging ? "⚡" : "";
    $("batteryDisplay").textContent = `${charging}${level}%`;
  }

  updateBattery();

  // auto-updates when battery state changes
  battery.addEventListener("levelchange", updateBattery);
  battery.addEventListener("chargingchange", updateBattery);
}
initBattery();
document.getElementById("btnCall")?.addEventListener("click", () => toggleWindow("callWindow"));
document.getElementById("btnCall")?.addEventListener("click", async () => {
  showWindow("callWindow");
  await initCamera();
});
document.querySelector("#callWindow .titlebar").addEventListener("click", async () => {
  if (getComputedStyle(callWindow).display !== "none") {
    await initCamera();
  }
});
$("btnCall").addEventListener("click", async () => {
  showWindow("callWindow");
});
let bootCountdown = 3;
let bootMenuTriggered = false;

// Listen for ESC to open boot menu
window.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    bootMenuTriggered = true;
    showWindow("bootMenu");
    document.getElementById("bootScreen").style.display = "none";
  }
});

// countdown timer
const bootInterval = setInterval(() => {
  if (bootMenuTriggered) {
    clearInterval(bootInterval);
    return;
  }

  bootCountdown--;
  document.getElementById("bootCountdown").textContent =
    `Press ESC for Boot Menu… ${bootCountdown}`;

  if (bootCountdown <= 0) {
    clearInterval(bootInterval);
    // boot normally
    document.getElementById("bootScreen").style.display = "none";
    showWindow("startWindow"); // your login window
  }
}, 1000);
// Boot Menu buttons
$("bootNormal").onclick = () => {
  document.getElementById("bootMenu").style.display = "none";
  showWindow("startWindow");
};

$("bootSafeMode").onclick = () => {
  alert("Safe Mode activated — looks the same but trust me it's safer 💀");
};

$("bootReset").onclick = () => {
  alert("Reset feature coming soon (or tell me exactly what you want it to do).");
};

