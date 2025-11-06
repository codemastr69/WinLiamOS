const $ = id => document.getElementById(id);

// ---------- window show/hide helpers (safe: won't block clicks when hidden) ----------
function showWindow(id){
  const el = $(id);
  if(!el) return;
  el.style.display = 'flex';
  el.style.visibility = 'visible';
  el.style.pointerEvents = 'auto';
  // give it a high z-index so it sits above taskbar when open
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
  });

  const closeBtn = win.querySelector('.control.close');
  if(closeBtn) closeBtn.addEventListener('click', ()=> hideWindow(win.id));
}

// initialize all windows
document.querySelectorAll('.window').forEach(win => makeWindow(win));

// ---------- taskbar buttons wiring ----------
$('btnStart').addEventListener('click', ()=> toggleWindow('startWindow'));
$('btnBrowser').addEventListener('click', ()=> toggleWindow('browserWindow'));
$('btnBg').addEventListener('click', ()=> toggleWindow('bgEditorWindow'));
$('btnNotepad').addEventListener('click', ()=> toggleWindow('notepadWindow'));
$('btnTerminal').addEventListener('click', ()=> toggleWindow('terminalWindow'));
$('btnAbout').addEventListener('click', ()=> toggleWindow('aboutWindow'));

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

$('bgSet').addEventListener('click', ()=> { const url = $('bgURL').value.trim(); if(url) document.body.style.background = `url('${url}') center/cover no-repeat`; });
$('bgReset').addEventListener('click', ()=> { document.body.style.background = 'linear-gradient(to bottom right, var(--win-bg-start), var(--win-bg-end))'; });

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

    default:
      out.textContent += `\nCommand not found: ${cmd}`;
  }

  out.scrollTop = out.scrollHeight;
  $('termIn').value = '';
}

// ---------- CALCULATOR APP ----------
$('btnCalculator')?.addEventListener('click', () => {
  showWindow('calculatorWindow');
});

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


// ---------- ACCOUNT SYSTEM ----------
let users = JSON.parse(localStorage.getItem('winliam_users')||'{}');
let currentUser = localStorage.getItem('winliam_currentUser') || null;

function saveUsers(){ localStorage.setItem('winliam_users', JSON.stringify(users)); }
function updateUserDisplay(){ $('usernameDisplay').textContent = currentUser ? currentUser : 'Guest'; }

function loginAs(username){
  currentUser = username;
  localStorage.setItem('winliam_currentUser', username);
  updateUserDisplay();
  hideWindow('loginWindow');
}

$('btnSignUp').addEventListener('click', ()=>{
  const user = $('loginUser').value.trim();
  const pass = $('loginPass').value;
  if(!user||!pass){ $('loginMsg').textContent='Enter a username and password.'; return; }
  if(users[user]){ $('loginMsg').textContent='User already exists.'; return; }
  // NOTE: this is a simple demo. In a real app, never store plain passwords in localStorage.
  users[user] = { password: pass };
  saveUsers();
  $('loginMsg').textContent='Account created! You can sign in now.';
});

$('btnSignIn').addEventListener('click', ()=>{
  const user = $('loginUser').value.trim();
  const pass = $('loginPass').value;
  if(users[user] && users[user].password === pass){
    loginAs(user);
  } else {
    $('loginMsg').textContent = 'Invalid username or password.';
  }
});

$('btnGuest').addEventListener('click', ()=> { loginAs('Guest'); });

// toggle password visibility
$('togglePass').addEventListener('click', ()=>{
  const input = $('loginPass');
  if(input.type === 'password'){ input.type = 'text'; $('togglePass').textContent = '🙈'; }
  else { input.type = 'password'; $('togglePass').textContent = '👁️'; }
});

// logout button
$('btnLogout').addEventListener('click', ()=>{
  localStorage.removeItem('winliam_currentUser');
  currentUser = null;
  updateUserDisplay();
  showWindow('loginWindow');
});

// Auto-login logic on load
window.addEventListener('load', ()=>{
  if(currentUser){
    updateUserDisplay();
    // keep login window hidden (non-blocking)
    hideWindow('loginWindow');
  } else {
    // show the login window on first load
    showWindow('loginWindow');
  }
});

// Ensure login window close button hides it without blocking the taskbar
// (already wired through makeWindow -> close button which calls hideWindow)

// small safety: ensure login window doesn't block clicks even if something else manipulates styles
hideWindow('loginWindow'); // default to hidden (then load handler decides to show if needed)

// ---------- Tic Tac Toe ----------
const boardEl = document.getElementById("ticTacToeBoard");
const msgEl = document.getElementById("ticTacToeMsg");
const resetBtn = document.getElementById("resetTicTacToe");
const modeSelect = document.getElementById("ticMode");

let ticBoard = Array(9).fill(null);
let ticPlayer = "X";
let gameOver = false;

// Build board buttons
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
      border-radius:8px;`;
    cell.dataset.index = i;
    cell.onclick = () => ticMove(i);
    boardEl.appendChild(cell);
  }
}
setupTicTacToeBoard();

function ticMove(i) {
  if (ticBoard[i] || gameOver) return;
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

  ticPlayer = ticPlayer === "X" ? "O" : "X";

  if (modeSelect.value === "computer" && ticPlayer === "O" && !gameOver) {
    setTimeout(ticComputerMove, 400);
  }
}

function ticComputerMove() {
  const empty = ticBoard.map((v, i) => (v ? null : i)).filter(v => v !== null);
  const pick = empty[Math.floor(Math.random() * empty.length)];
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
  for (let cell of boardEl.children) cell.textContent = "";
}

resetBtn.onclick = resetTicTacToe;
modeSelect.onchange = resetTicTacToe;


// Taskbar button
$('btnTicTacToe')?.addEventListener('click', ()=> toggleWindow('ticTacToeWindow'));
$('resetTicTacToe').addEventListener('click', resetGame);
const cursorInput = $('cursorFile');
const setCursorBtn = $('setCursorBtn');
const resetCursorBtn = $('resetCursorBtn');
const cursorMsg = $('cursorMsg');

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

// Taskbar button

$('btnCursorEditor')?.addEventListener('click', () => toggleWindow('cursorEditorWindow'));


