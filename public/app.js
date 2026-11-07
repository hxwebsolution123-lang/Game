const socket = io();
const $ = id => document.getElementById(id);
let myId = null, roomCode = null, roomState = null, myHand = [], selectedId = null, timerInterval = null, dragId = null;

function formatClock(seconds){const n=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;}
function toast(msg) { const el=$("toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove("show"),3000); }
function suitRed(s){return s==="♥"||s==="♦";}
function cardMarkup(c, cls="hand-card") {
  const red=suitRed(c.suit)?" red":"";
  return `<div class="${cls}${red}" data-id="${c.id}" draggable="true"><span class="rank">${c.rank}</span><span class="suit">${c.suit}</span><span class="rank corner-bottom">${c.rank}</span></div>`;
}
function renderHand() {
  $("hand").innerHTML = myHand.map(c=>cardMarkup(c, "hand-card"+(selectedId===c.id?" selected":""))).join("");
  $("hand").querySelectorAll(".hand-card").forEach(el=>{
    el.addEventListener("click",()=>{selectedId=selectedId===el.dataset.id?null:el.dataset.id;renderHand();});
    el.addEventListener("dragstart",e=>{dragId=el.dataset.id;el.classList.add("dragging");e.dataTransfer.setData("text/plain",dragId);});
    el.addEventListener("dragend",()=>el.classList.remove("dragging"));
    el.addEventListener("dragover",e=>e.preventDefault());
    el.addEventListener("drop",e=>{e.preventDefault();const from=myHand.findIndex(c=>c.id===dragId),to=myHand.findIndex(c=>c.id===el.dataset.id);if(from<0||to<0)return;const [c]=myHand.splice(from,1);myHand.splice(to,0,c);renderHand();});
  });
  updateActions();
}
function updateActions(){
  const me=roomState?.players.find(p=>p.id===myId);
  const isTurn=!!me?.isTurn;
  const canDraw=isTurn && myHand.length===9;
  $("deckBtn").disabled=!canDraw;
  $("drawDiscardBtn").disabled=!canDraw || !roomState?.discardTop;
  $("discardBtn").disabled=!isTurn || myHand.length!==10 || !selectedId;
  $("showBtn").disabled=!roomState || roomState.status!=="playing" || !isTurn || myHand.length!==9;
}
function renderRoom(state){
  roomState=state;
  $("roomCodeLabel").textContent=state.code;
  $("deckCount").textContent=state.deckCount;
  $("jokerCard").className="playing-card"+(state.joker&&suitRed(state.joker.suit)?" red":"");
  $("jokerCard").textContent=state.joker?`${state.joker.rank}${state.joker.suit}`:"?";
  const d=state.discardTop;
  $("discardCard").className="playing-card"+(d&&suitRed(d.suit)?" red":"");
  $("discardCard").textContent=d?`${d.rank}${d.suit}`:"—";
  const seats=["seat1","seat2","seat3"];
  const others=state.players.filter(p=>p.id!==myId);
  seats.forEach((id,i)=>{const p=others[i];const el=$(id);el.classList.toggle("active",!!p?.isTurn);el.innerHTML=p?`<div class="avatar">${p.name.slice(0,1).toUpperCase()}</div><b>${escapeHtml(p.name)}</b><small>${p.isTurn?"● PLAYING":p.ready?"● READY":"WAITING"} · ${p.cardCount} CARDS</small>`:`<div class="avatar">?</div><b>Waiting</b><small>EMPTY SEAT</small>`;});
  const me=state.players.find(p=>p.id===myId);
  if(me){$("myName").textContent=me.name.toUpperCase();$("myAvatar").textContent=me.name.slice(0,1).toUpperCase();$("myTurnLabel").textContent=me.isTurn?"YOUR TURN":state.status==="playing"?"WAITING FOR TURN": "IN LOBBY";}
  const current=state.players.find(p=>p.isTurn);
  $("turnBanner").textContent=state.status==="lobby"?"WAITING FOR HOST TO START":current?`${current.name.toUpperCase()}'S TURN`:"GAME OVER";
  $("playersStrip").innerHTML=state.players.map(p=>`<span class="player-chip ${p.isTurn?"active":""}">${escapeHtml(p.name)} · ${p.cardCount} cards</span>`).join("");
  const isHost=state.hostId===myId;
  $("hostTools").classList.toggle("hidden",!isHost);
  $("startBtn").classList.toggle("hidden",state.status!=="lobby");
  clearInterval(timerInterval);
  if(state.turnEndsAt){const updateClock=()=>$("timerText").textContent=formatClock((state.turnEndsAt-Date.now())/1000);updateClock();timerInterval=setInterval(updateClock,200);}
  else $("timerText").textContent=formatClock(state.turnSeconds);
  updateActions();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("createBtn").onclick=()=>{const name=$("playerName").value.trim();if(!name)return toast("Pehle apna player name likho.");socket.emit("room:create",{name});};
$("joinBtn").onclick=()=>{const name=$("playerName").value.trim(),code=$("roomCode").value.trim();if(!name||!code)return toast("Name aur room code dono likho.");socket.emit("room:join",{name,code});};
$("copyRoom").onclick=async()=>{try{await navigator.clipboard.writeText(roomCode);toast("Room code copied!");}catch{toast(`Room code: ${roomCode}`);}};
$("startBtn").onclick=()=>socket.emit("game:start");
$("deckBtn").onclick=()=>socket.emit("card:draw",{from:"deck"});
$("drawDiscardBtn").onclick=()=>socket.emit("card:draw",{from:"discard"});
$("discardBtn").onclick=()=>{if(selectedId){socket.emit("card:discard",{cardId:selectedId});selectedId=null;}};
$("showBtn").onclick=()=>socket.emit("game:show");
$("closeModal").onclick=()=>$("showModal").classList.add("hidden");
socket.on("connect",()=>{$("connectionState").innerHTML="<i></i> CONNECTED";const saved=JSON.parse(localStorage.getItem("hxCardsSession")||"null");if(saved?.code&&saved?.token&&!roomCode)socket.emit("room:reconnect",{code:saved.code,playerToken:saved.token});});
socket.on("disconnect",()=>{$("connectionState").textContent="RECONNECTING…";});
socket.on("room:joined",({code,playerId,playerToken})=>{roomCode=code;myId=playerId;localStorage.setItem("hxCardsSession",JSON.stringify({code,token:playerToken||playerId}));$("lobby").classList.add("hidden");$("roomView").classList.remove("hidden");toast(`Room ${code} ready. Friends ko code share karo.`);});
socket.on("room:update",renderRoom);
socket.on("hand:update",({hand})=>{myHand=hand||[];if(!myHand.some(c=>c.id===selectedId))selectedId=null;renderHand();});
socket.on("game:notice",toast);
socket.on("app:error",toast);
socket.on("game:show",data=>{
  const ok=data.validation==="valid";
  $("showTitle").textContent=`${data.playerName}: ${ok?"VALID SHOW ✓":"INVALID SHOW ✕"}`;
  $("revealedCards").innerHTML=data.cards.map(c=>cardMarkup(c,"hand-card")).join("");
  const note=document.querySelector("#showModal .modal-card p");
  note.textContent=ok?"Valid hand: 2 pairs + 1 same-suit 4-card sequence. Everyone in this room can see these cards.":`${data.reason} Everyone in this room can see these cards.`;
  $("showModal").classList.remove("hidden");
});
socket.on("game:winner",data=>toast(`🏆 ${data.playerName} WINS HX CARDS PLAY!`));
socket.on("room:ended",()=>localStorage.removeItem("hxCardsSession"));
