const $ = id => document.getElementById(id);

// ---------- Window Helpers ----------
function showWindow(id){const el=$(id);if(!el)return;el.style.display='flex';el.style.visibility='visible';el.style.pointerEvents='auto';el.style.zIndex=900;}
function hideWindow(id){const el=$(id);if(!el)return;el.style.display='none';el.style.visibility='hidden';el.style.pointerEvents='none';el.style.zIndex=1;}
function toggleWindow(id){const el=$(id);if(!el)return;getComputedStyle(el).display!=='flex'||el.style.visibility==='hidden'?showWindow(id):hideWindow(id);}

// ---------- Draggable + Close ----------
function makeWindow(win){
  const tb=win.querySelector('.titlebar');let isDragging=false,offsetX=0,offsetY=0,prev={},isMax=false;
  tb.addEventListener('pointerdown',e=>{if(e.target.classList.contains('close'))return;isDragging=true;offsetX=e.clientX-win.offsetLeft;offsetY=e.clientY-win.offsetTop;tb.setPointerCapture(e.pointerId);});
  tb.addEventListener('pointermove',e=>{if(!isDragging)return;win.style.left=e.clientX-offsetX+'px';win.style.top=e.clientY-offsetY+'px';});
  tb.addEventListener('pointerup',e=>{isDragging=false;try{tb.releasePointerCapture(e.pointerId);}catch{}});
  tb.addEventListener('pointercancel',e=>{isDragging=false;try{tb.releasePointerCapture(e.pointerId);}catch{}});
  tb.addEventListener('dblclick',()=>{if(!isMax){prev={left:win.offsetLeft,top:win.offsetTop,width:win.offsetWidth,height:win.offsetHeight};win.style.left='0';win.style.top='0';win.style.width='100%';win.style.height='calc(100% - 56px)';isMax=true;}else{win.style.left=prev.left+'px';win.style.top=prev.top+'px';win.style.width=prev.width+'px';win.style.height=prev.height+'px';isMax=false;}});
  const closeBtn=win.querySelector('.control.close');if(closeBtn)closeBtn.addEventListener('click',()=>hideWindow(win.id));
}
document.querySelectorAll('.window').forEach(makeWindow);

// ---------- Taskbar ----------
['Start','Browser','Bg','Notepad','Terminal','TicTacToe','CursorEditor','Calculator','About'].forEach(id=>{
  const el=$('btn'+id);if(el){el.addEventListener('click',()=>toggleWindow(id.toLowerCase()+'Window'));}
});

// ---------- Browser ----------
function openURL(){let url=$('browserURL').value.trim();if(!url)return;if(!/^https?:\/\//i.test(url))url='https://'+url;$('browserFrame').src=url;}
$('browserGo').addEventListener('click',openURL);
$('browserURL').addEventListener('keypress',e=>{if(e.key==='Enter')openURL();});

// ---------- Background ----------
const defaultBg='linear-gradient(to bottom right, var(--win-bg-start), var(--win-bg-end))';
window.addEventListener('load',()=>{const saved=localStorage.getItem('winliam_bg');if(saved)document.body.style.background=saved;});
$('bgSet').addEventListener('click',()=>{const url=$('bgURL').value.trim();if(!url)return;const bg=`url('${url}') center/cover no-repeat`;document.body.style.background=bg;localStorage.setItem('winliam_bg',bg);});
$('bgReset').addEventListener('click',()=>{document.body.style.background=defaultBg;localStorage.setItem('winliam_bg',defaultBg);});

// Presets
const presets=["Windows 11.jpg","Windows 10.png","city.jpeg","earth.jpeg","nature.jpeg"];
const bgContent=$('bgEditorWindow')?.querySelector('.content');
if(bgContent){const container=document.createElement('div');container.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:10px';presets.forEach(name=>{const b=document.createElement('button');b.className='btn';b.textContent=name;b.style.cssText=`background-image:url("presets/${name}");background-size:cover;color:#fff;width:100px;height:60px;border:1px solid rgba(255,255,255,.1);text-shadow:0 1px 2px #000`;b.addEventListener('click',()=>{const bg=`url('presets/${name}') center/cover no-repeat`;document.body.style.background=bg;localStorage.setItem('winliam_bg',bg);});container.appendChild(b);});bgContent.appendChild(container);}

// ---------- Notes + Recycle Bin ----------
let notes=JSON.parse(localStorage.getItem('notes')||'{}');
let recycleBin=JSON.parse(localStorage.getItem('recycleBin')||'{}');
const desktop=$('desktop');
function addDesktopIcon(id,title){const icon=document.createElement('div');icon.className='desktop-icon';icon.style.left=Math.random()*400+'px';icon.style.top=Math.random()*200+'px';icon.innerHTML=title||'Untitled';icon.addEventListener('dblclick',()=>openNoteWindow(id));desktop.appendChild(icon);}
function openNoteWindow(id){const note=notes[id];if(!note)return;const newWin=$('notepadWindow').cloneNode(true);newWin.id='notepad_'+id;newWin.querySelector('#noteTitle').value=note.title;newWin.querySelector('#noteBody').value=note.body;document.body.appendChild(newWin);makeWindow(newWin);showWindow(newWin.id);newWin.addEventListener('contextmenu',e=>{e.preventDefault();recycleBin[id]=note;delete notes[id];localStorage.setItem('notes',JSON.stringify(notes));localStorage.setItem('recycleBin',JSON.stringify(recycleBin));newWin.remove();alert('Moved to Recycle Bin');});}
window.addEventListener('load',()=>{for(const id in notes)addDesktopIcon(id,notes[id].title);});

// ---------- Note Save/Clear ----------
$('saveNote').addEventListener('click',()=>{const title=$('noteTitle').value||'Untitled';const body=$('noteBody').value;const id='note_'+Date.now();notes[id]={title,body};localStorage.setItem('notes',JSON.stringify(notes));addDesktopIcon(id,title);$('noteSaved').textContent='Saved';});
$('clearNote').addEventListener('click',()=>{$('noteTitle').value='';$('noteBody').value='';$('noteSaved').textContent='Cleared';});

// ---------- Clock ----------
function updateClock(){const now=new Date();const h=now.getHours();const m=now.getMinutes().toString().padStart(2,'0');const ampm=h>=12?'PM':'AM';const fh=(h%12)||12;$('clock').innerHTML=`${fh}:${m} ${ampm}<br>${now.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;}
updateClock();setInterval(updateClock,1000);

// ---------- Terminal ----------
$('termSend')?.addEventListener('click',runCommand);
$('termIn')?.addEventListener('keypress',e=>{if(e.key==='Enter')runCommand();});
function runCommand(){const cmdLine=$('termIn').value.trim();const out=$('termOut');if(!cmdLine)return;out.textContent+=`\n> ${cmdLine}`;const [cmd,...args]=cmdLine.split(' ');switch(cmd.toLowerCase()){case 'help':out.textContent+=`\nAvailable commands:\nhelp\nclear\ntime\ndate\necho [text]\nuser\napps\nopen [app]\nbgreset\nreboot\nshutdown\nmatrix\nversion`;break;case 'clear':out.textContent='WinliamOS Terminal — type "help" for commands.';break;case 'time':out.textContent+='\n'+new Date().toLocaleTimeString();break;case 'date':out.textContent+='\n'+new Date().toLocaleDateString();break;case 'echo':out.textContent+='\n'+args.join(' ');break;case 'user':out.textContent+='\nCurrent user: '+(currentUser||'Guest');break;case 'apps':out.textContent+='\nAvailable apps:\n- browser\n- notepad\n- background\n- terminal\n- tictactoe\n- cursor\n- calculator\n- about';break;case 'open':const app=args[0]?.toLowerCase();const map={browser:'browserWindow',notepad:'notepadWindow',background:'bgEditorWindow',terminal:'terminalWindow',tictactoe:'ticTacToeWindow',cursor:'cursorEditorWindow',about:'aboutWindow'};if(map[app]){showWindow(map[app]);out.textContent+='\nOpened '+app;}else out.textContent+='\nUnknown app: '+app;break;case 'bgreset':document.body.style.background=defaultBg;out.textContent+='\nBackground reset.';break;case 'reboot':out.textContent+='\nRestarting...';setTimeout(()=>location.reload(),1000);break;case 'version':out.textContent+='\nWinliamOS Version 3.1';break;case 'matrix':out.textContent+='\nEntering the Matrix...';const interval=setInterval(()=>{out.textContent+='\n'+Array(60).fill(0).map(()=>Math.random()>0.5?'1':'0').join('');out.scrollTop=out.scrollHeight;},50);setTimeout(()=>{clearInterval(interval);out.textContent+='\nMatrix session ended.';out.scrollTop=out.scrollHeight;},3000);break;case 'shutdown':out.textContent+='\nShutting down WinliamOS...';setTimeout(()=>{document.body.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:black;color:#0f0;font-family:monospace;font-size:22px;">WinliamOS has been shut down.<br><br>Press F5 to restart.</div>`;},1500);break;default:out.textContent+='\nCommand not found: '+cmd;}out.scrollTop=out.scrollHeight;$('termIn').value='';}

// ---------- Calculator ----------
$('btnCalculator')?.addEventListener('click',()=>showWindow('calculatorWindow'));
const display=$('calcDisplay'),buttons=$('calcButtons');const keys=['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'];buttons.innerHTML='';keys.forEach(k=>{const b=document.createElement('button');b.textContent=k;b.style.cssText=`padding:10px;font-size:18px;border-radius:6px;cursor:pointer;border:none;color:#fff;background:${k==='C'?'#d9534f':'#444'}`;b.addEventListener('click',()=>handleCalcKey(k));buttons.appendChild(b);});let calcExpr='';function handleCalcKey(k){if(k==='C'){calcExpr='';}else if(k==='='){try{calcExpr=eval(calcExpr).toString();}catch{calcExpr='Error';}}else calcExpr+=k;display.value=calcExpr;}

// Keyboard support
window.addEventListener('keydown',e=>{const visible=getComputedStyle($('calculatorWindow')).display!=='none';if(!visible)return;const k=e.key;if(/[0-9+\-*/.]/.test(k))calcExpr+=k;else if(k==='Enter'||k==='='){try{calcExpr=eval(calcExpr).toString();}catch{calcExpr='Error';}}else if(k==='Escape'||k.toLowerCase()==='c')calcExpr='';else if(k==='Backspace')calcExpr=calcExpr.slice(0,-1);else return;display.value=calcExpr;});

// ---------- Account System ----------
let users=JSON.parse(localStorage.getItem('winliam_users')||'{}'),currentUser=localStorage.getItem('winliam_currentUser')||null;
function saveUsers(){localStorage.setItem('winliam_users',JSON.stringify(users));}
function updateUserDisplay(){ $('usernameDisplay').textContent=currentUser||'Guest';}
function loginAs(user){currentUser=user;localStorage.setItem('winliam_currentUser',user);updateUserDisplay();hideWindow('loginWindow');}

$('btnSignUp').addEventListener('click',()=>{const u=$('loginUser').value.trim(),p=$('loginPass').value;if(!u||!p){$('loginMsg').textContent='Enter username and password.';return;}if(users[u]){$('loginMsg').textContent='User already exists.';return;}users[u]={password:p};saveUsers();$('loginMsg').textContent='Account created! You can sign in now.';});
$('btnSignIn').addEventListener('click',()=>{const u=$('loginUser').value.trim(),p=$('loginPass').value;if(users[u]&&users[u].password===p){loginAs(u);}else{$('loginMsg').textContent='Invalid username or password.';}});
$('btnGuest').addEventListener('click',()=>loginAs('Guest'));

// Toggle password
$('togglePass').addEventListener('click',()=>{const i=$('loginPass');i.type==='password'?(i.type='text',$('togglePass').textContent='🙈'):(i.type='password',$('togglePass').textContent='👁️');});

// Logout
$('btnLogout').addEventListener('click',()=>{localStorage.removeItem('winliam_currentUser');currentUser=null;updateUserDisplay();showWindow('loginWindow');});

// Auto-login
window.addEventListener('load',()=>{if(currentUser){updateUserDisplay();hideWindow('loginWindow');}else showWindow('loginWindow');});

// ---------- Cursor Editor ----------
const cursorInput=$('cursorFile'),setCursorBtn=$('setCursorBtn'),resetCursorBtn=$('resetCursorBtn'),cursorMsg=$('cursorMsg');
function resizeImage(file,max=16,cb){const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>h){if(w>max){h*=max/w;w=max;}}else{if(h>max){w*=max/h;h=max;}}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/png'));};img.src=e.target.result;};r.readAsDataURL(file);}
setCursorBtn.addEventListener('click',()=>{const f=cursorInput.files[0];if(!f){cursorMsg.textContent='Select an image first.';return;}resizeImage(f,64,d=>{document.body.style.cursor=`url(${d}) 0 0,auto`;cursorMsg.textContent='Cursor updated!';localStorage.setItem('winliam_cursor',d);});});
resetCursorBtn.addEventListener('click',()=>{document.body.style.cursor='default';cursorMsg.textContent='Cursor reset.';localStorage.removeItem('winliam_cursor');});
window.addEventListener('load',()=>{const s=localStorage.getItem('winliam_cursor');if(s)document.body.style.cursor=`url(${s}) 0 0,auto`;});
