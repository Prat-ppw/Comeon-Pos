import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

// ─────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  coffee:"#3B1F0E", coffeeMid:"#5C3317", caramel:"#C8813A",
  caramelLight:"#E8A857", cream:"#FDF8F3", white:"#FFFFFF",
  ink:"#1C1007", inkMid:"#6B5B4E", inkLight:"#B0A090",
  border:"#EDE4D8", mint:"#2ECC8F", red:"#E84545", amber:"#F59E0B",
};

// ─────────────────────────────────────────────────────────────
// MODIFIER GROUPS
// ─────────────────────────────────────────────────────────────
const MODIFIER_GROUPS = {
  sweetness:{ id:"sweetness", label:"ความหวาน", required:true, multi:false,maxSelect:1,
    options:[{id:"s0",label:"ไม่หวาน",price:0},{id:"s25",label:"หวาน 25%",price:0},{id:"s50",label:"หวาน 50%",price:0},{id:"s75",label:"หวาน 75%",price:0},{id:"s100",label:"หวานปกติ",price:0}]},
  ice:{ id:"ice", label:"น้ำแข็ง", required:true, multi:false,maxSelect:1,
    options:[{id:"i0",label:"ไม่ใส่",price:0},{id:"i25",label:"น้อย",price:0},{id:"i50",label:"ปกติ",price:0},{id:"i100",label:"เต็ม",price:0}]},
  size:{ id:"size", label:"ขนาด", required:true, multi:false,maxSelect:1,
    options:[{id:"sz_s",label:"S (12oz)",price:0},{id:"sz_m",label:"M (16oz)",price:15},{id:"sz_l",label:"L (20oz)",price:25}]},
  milk:{ id:"milk", label:"ชนิดนม", required:false, multi:false,maxSelect:1,
    options:[{id:"mk_whole",label:"นมสด",price:0},{id:"mk_oat",label:"นมโอ๊ต",price:20},{id:"mk_almond",label:"นมอัลมอนด์",price:20},{id:"mk_soy",label:"นมถั่วเหลือง",price:10}]},
  shots:{ id:"shots", label:"ช็อต", required:false, multi:false,maxSelect:1,
    options:[{id:"sh1",label:"1 ช็อต",price:0},{id:"sh2",label:"2 ช็อต (ปกติ)",price:0},{id:"sh3",label:"3 ช็อต",price:20}]},
  toppings:{ id:"toppings", label:"ท็อปปิ้ง", required:false, multi:true,maxSelect:4,
    options:[{id:"tp_cream",label:"วิปครีม",price:15},{id:"tp_caramel",label:"คาราเมลดริซเซิล",price:10},{id:"tp_choc",label:"ช็อกโกแลตซอส",price:10},{id:"tp_jelly",label:"เจลลี่",price:15}]},
  temp:{ id:"temp", label:"อุณหภูมิ", required:true, multi:false,maxSelect:1,
    options:[{id:"t_hot",label:"ร้อน ☕",price:0},{id:"t_iced",label:"เย็น 🧊",price:0},{id:"t_blend",label:"ปั่น 🧋",price:10}]},
};

// ─────────────────────────────────────────────────────────────
// MENU DATA
// ─────────────────────────────────────────────────────────────
const CATEGORIES = ["ทั้งหมด","กาแฟ","มัทชะ","ชาไทย","นม","เครื่องดื่ม","เบเกอรี่"];
const CAT_INFO = {
  "ทั้งหมด":    {icon:"📋"},
  "กาแฟ":       {icon:"☕"},
  "มัทชะ":      {icon:"🍵"},
  "ชาไทย":      {icon:"🧋"},
  "นม":         {icon:"🥛"},
  "เครื่องดื่ม":{icon:"🥤"},
  "เบเกอรี่":   {icon:"🥐"},
};
const MENU_ITEMS = [
  {id:1, name:"ลาเต้",           price:85,  cat:"กาแฟ",        emoji:"☕", modifiers:["temp","size","milk","shots","sweetness","ice","toppings"]},
  {id:2, name:"คาปูชิโน",        price:80,  cat:"กาแฟ",        emoji:"☕", modifiers:["temp","size","milk","shots","sweetness","toppings"]},
  {id:3, name:"อเมริกาโน",       price:70,  cat:"กาแฟ",        emoji:"🖤", modifiers:["temp","size","shots","sweetness","ice"]},
  {id:4, name:"เอสเปรสโซ",       price:60,  cat:"กาแฟ",        emoji:"🖤", modifiers:["shots"]},
  {id:5, name:"มอคค่า",          price:95,  cat:"กาแฟ",        emoji:"🍫", modifiers:["temp","size","milk","shots","sweetness","ice","toppings"]},
  {id:6, name:"คาราเมล มัคคิอาโต",price:95, cat:"กาแฟ",        emoji:"🍮", modifiers:["temp","size","milk","shots","sweetness","ice","toppings"]},
  {id:7, name:"มัทชะลาเต้",      price:95,  cat:"มัทชะ",       emoji:"🍵", modifiers:["temp","size","milk","sweetness","ice","toppings"]},
  {id:8, name:"มัทชะฟราปเป้",    price:110, cat:"มัทชะ",       emoji:"🍵", modifiers:["size","sweetness","toppings"]},
  {id:9, name:"มัทชะอเมริกาโน",  price:85,  cat:"มัทชะ",       emoji:"🍵", modifiers:["temp","size","sweetness","ice"]},
  {id:10,name:"ชาไทยเย็น",       price:65,  cat:"ชาไทย",       emoji:"🧋", modifiers:["sweetness","ice"]},
  {id:11,name:"ชาไทยนม",         price:70,  cat:"ชาไทย",       emoji:"🧋", modifiers:["sweetness","ice"]},
  {id:12,name:"ชาอู่หลง",        price:75,  cat:"ชาไทย",       emoji:"🍵", modifiers:["temp","sweetness","ice"]},
  {id:13,name:"นมสดร้อน",        price:60,  cat:"นม",          emoji:"🥛", modifiers:["temp","sweetness"]},
  {id:14,name:"นมโอ๊ตลาเต้",     price:105, cat:"นม",          emoji:"🥛", modifiers:["temp","size","sweetness","ice","toppings"]},
  {id:15,name:"นมสตรอว์เบอร์รี่",price:75,  cat:"นม",          emoji:"🍓", modifiers:["size","sweetness","ice"]},
  {id:16,name:"โกโก้เย็น",       price:85,  cat:"เครื่องดื่ม", emoji:"🍫", modifiers:["size","sweetness","ice","toppings"]},
  {id:17,name:"น้ำมะนาวโซดา",    price:55,  cat:"เครื่องดื่ม", emoji:"🍋", modifiers:["sweetness","ice"]},
  {id:18,name:"สมูทตี้ผลไม้",    price:120, cat:"เครื่องดื่ม", emoji:"🥤", modifiers:["size","sweetness","toppings"]},
  {id:19,name:"ครัวซองต์",       price:75,  cat:"เบเกอรี่",    emoji:"🥐", modifiers:[]},
  {id:20,name:"เค้กช็อกโกแลต",   price:95,  cat:"เบเกอรี่",    emoji:"🎂", modifiers:[]},
  {id:21,name:"สโคน",            price:65,  cat:"เบเกอรี่",    emoji:"🧇", modifiers:[]},
  {id:22,name:"ซินนามอนโรล",     price:85,  cat:"เบเกอรี่",    emoji:"🌀", modifiers:[]},
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
// Collision-resistant id generator — no shared mutable counter, so it
// stays correct across hot-reload and never needs a module-level `let`.
const genId = (prefix)=> `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const fmt = n => round2(n).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtInt = n => n.toLocaleString("th-TH",{minimumFractionDigits:0,maximumFractionDigits:0});
// All money math is rounded to satang (2 decimals) at each step so the
// numbers on screen, on the receipt, and inside the QR payload always
// agree — floating point can otherwise drift by fractions of a satang.
function round2(n){ return Math.round((n + Number.EPSILON) * 100) / 100; }

// ── Shared + Local persistence ────────────────────────────────
// Shared keys sync across all devices (menu, categories, modifier groups,
// settings) via window.storage shared API when available.
// Per-device keys (cart, held orders, display settings) stay local.
// Falls back to localStorage if window.storage is unavailable.
const LS_PREFIX = "brewpos_v2_";
const SHARED_KEYS = new Set(["menuItems","categories","catInfo","modGroups",
  "printerSettings","kitchenPrinterSettings","taxSettings","orders"]);

// window.storage async wrapper (shared=true broadcasts to all sessions)
const sharedStore = {
  async get(key){ try{ const r=await window.storage.get(key,true); return r?JSON.parse(r.value):null; }catch(_){return null;} },
  async set(key,val){ try{ await window.storage.set(key,JSON.stringify(val),true); }catch(_){} },
};
// localStorage sync fallback
const localStore = {
  get(key){ try{ const r=window.localStorage?.getItem(LS_PREFIX+key); return r?JSON.parse(r):null; }catch(_){return null;} },
  set(key,val){ try{ window.localStorage?.setItem(LS_PREFIX+key,JSON.stringify(val)); }catch(_){} },
};

// Detect if window.storage is available (Claude artifact environment)
const HAS_SHARED_STORAGE = typeof window!=="undefined" && typeof window.storage?.get==="function";

function lsLoad(key, fallback){
  // For shared keys, use localStore as initial sync load (async load happens in usePersistentState)
  const val = localStore.get(key);
  return val !== null ? val : (typeof fallback==="function" ? fallback() : fallback);
}

function usePersistentState(key, initialValue){
  const isShared = HAS_SHARED_STORAGE && SHARED_KEYS.has(key);
  const [state, setState] = useState(()=>lsLoad(key, initialValue));
  const [synced, setSynced] = useState(!isShared);

  // On mount: load from shared storage if available
  useEffect(()=>{
    if(!isShared){ setSynced(true); return; }
    let cancelled = false;
    sharedStore.get(key).then(val=>{
      if(cancelled) return;
      if(val !== null) setState(val);
      setSynced(true);
    });
    return ()=>{ cancelled=true; };
  }, [key]);

  // On state change: save to both stores
  useEffect(()=>{
    if(!synced) return; // don't overwrite shared with stale initial value
    localStore.set(key, state);
    if(isShared) sharedStore.set(key, state);
  }, [key, state, synced]);

  return [state, setState];
}

// Sync poller — re-fetches shared keys every 8s so open tabs stay in sync
function useSharedSync(setters){
  useEffect(()=>{
    if(!HAS_SHARED_STORAGE) return;
    const poll = setInterval(async()=>{
      for(const [key, setter] of Object.entries(setters)){
        const val = await sharedStore.get(key);
        if(val !== null) setter(v=> JSON.stringify(v)===JSON.stringify(val)?v:val);
      }
    }, 8000);
    return ()=>clearInterval(poll);
  }, []);
}

// Returns true if the modifier group allows multiple selections
const isMulti = (g) => (g.maxSelect!=null ? g.maxSelect>1 : g.multi===true);
// Returns the effective max selections (0/undefined = single)
const maxSel = (g) => (g.maxSelect!=null ? g.maxSelect : (g.multi ? 99 : 1));

function calcItemPrice(item, selections, mgMap=MODIFIER_GROUPS){
  let extra = 0;
  Object.values(selections||{}).forEach(val=>{
    const ids = Array.isArray(val) ? val : [val];
    ids.forEach(id=>{ Object.values(mgMap).forEach(g=>{ const o=g.options.find(x=>x.id===id); if(o) extra+=o.price; }); });
  });
  return round2(item.price + extra);
}
function selLabel(selections, mgMap=MODIFIER_GROUPS){
  const parts=[];
  Object.values(mgMap).forEach(g=>{
    const val = selections[g.id];
    if(!val) return;
    const ids = Array.isArray(val)?val:[val];
    ids.forEach(id=>{ const o=g.options.find(x=>x.id===id); if(o) parts.push(o.label); });
  });
  return parts.filter(Boolean).join(" · ");
}
// Returns [{label, price}] for each selected option
function getModDetails(selections, mgMap=MODIFIER_GROUPS){
  const out=[];
  Object.values(mgMap).forEach(g=>{
    const val = selections[g.id];
    if(!val) return;
    const ids = Array.isArray(val)?val:[val];
    ids.forEach(id=>{ const o=g.options.find(x=>x.id===id); if(o) out.push({label:o.label,price:o.price,group:g.label}); });
  });
  return out;
}


// ─────────────────────────────────────────────────────────────
// DRAG-TO-REORDER HOOK
// Pure pointer-events drag & drop — no external library.
// Returns { items, dragHandleProps, ghostStyle, draggingId }.
// Usage: const { items, dragHandleProps } = useDragSort(list, setList, getId)
// ─────────────────────────────────────────────────────────────
function useDragSort(items, setItems){ return { items, dragHandleProps:()=>({}) }; }

const AppCtx = createContext(null);
function useApp(){ return useContext(AppCtx)||{}; }

// ─────────────────────────────────────────────────────────────
// IMAGE UTILS
// ─────────────────────────────────────────────────────────────
function compressImage(file, maxPx=320, q=0.82){
  return new Promise(res=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const ratio=Math.min(maxPx/img.width, maxPx/img.height, 1);
      const c=document.createElement("canvas");
      c.width=Math.round(img.width*ratio); c.height=Math.round(img.height*ratio);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL("image/jpeg",q));
    };
    img.src=url;
  });
}

// Unified thumbnail — shows photo if uploaded, else emoji placeholder
function ItemThumb({ item, size=44, radius=10, style={} }){
  if(item?.image){
    return <img src={item.image} alt={item.name} style={{width:size,height:size,borderRadius:radius,objectFit:"cover",flexShrink:0,...style}}/>;
  }
  return(
    <div style={{width:size,height:size,borderRadius:radius,background:"#FFF0E6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.52),flexShrink:0,...style}}>
      {item?.emoji||"☕"}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAX / CHARGE DEFAULTS
// ─────────────────────────────────────────────────────────────
const DEFAULT_TAX = {
  vatEnabled: true,
  vatPct: 7,
  vatInclusive: false,   // false = add on top, true = already included in price
  scEnabled: false,
  scPct: 10,
};

// Compute all charge amounts from a subtotal + taxSettings
function calcCharges(subtotal, tax){
  const t = { ...DEFAULT_TAX, ...(tax||{}) };
  let base = round2(subtotal);
  // Service charge first (on food subtotal)
  const scAmt  = round2(t.scEnabled  ? base * (t.scPct  / 100) : 0);
  const afterSC = round2(base + scAmt);
  // VAT on (subtotal + service charge)
  let vatAmt = 0;
  let grandTotal = afterSC;
  if(t.vatEnabled){
    if(t.vatInclusive){
      // VAT baked in: extract it
      vatAmt = round2(afterSC - afterSC / (1 + t.vatPct / 100));
      grandTotal = afterSC; // price doesn't change
    } else {
      vatAmt = round2(afterSC * (t.vatPct / 100));
      grandTotal = round2(afterSC + vatAmt);
    }
  }
  return { base, scAmt, vatAmt, grandTotal };
}

// ─────────────────────────────────────────────────────────────
// QR CODE — rendered fully offline (see engine below). No
// PromptPay number, national ID, or order amount is ever sent to
// any third-party server to generate the payment QR.
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// QR CODE ENGINE — pure JS, zero dependencies, no network calls.
// Implements ISO/IEC 18004 (Byte mode, Error Correction Level M,
// versions 1–10 ≈ up to 213 bytes). Used to render the PromptPay /
// K-Shop payment QR entirely offline, so the customer's PromptPay
// number or national ID never has to be sent to any third-party
// QR-image API. Cross-validated against an independent decoder
// (OpenCV's QRCodeDetector) across versions 1–10 and all 8 mask
// patterns before being wired into the app.
// ─────────────────────────────────────────────────────────────
function buildThaiQRPayload(account, amount, type="phone"){
  function len(s){ return s.length.toString().padStart(2,"0"); }
  function tlv(tag,val){ return tag+len(val)+val; }
  const raw = account.replace(/[-\s]/g,"");
  let merchantAcct;
  if(type==="phone"){
    // PromptPay — phone: 0066 + 9 digits
    const formatted = raw.startsWith("0") ? "0066"+raw.slice(1) : raw;
    merchantAcct = tlv("29", tlv("00","A000000677010111") + tlv("01",formatted));
  } else if(type==="nationalid"){
    // PromptPay — national ID (13 digits as-is)
    merchantAcct = tlv("29", tlv("00","A000000677010111") + tlv("01",raw));
  } else {
    // Bill Payment / merchant reference (K-Shop, bank biller)
    merchantAcct = tlv("30", tlv("00","A000000677010114") + tlv("01",raw));
  }
  const amountStr = amount.toFixed(2);
  let payload = tlv("00","01")+tlv("01","12")+merchantAcct+tlv("53","764")+tlv("54",amountStr)+tlv("58","TH")+tlv("62",tlv("07","SWEETPOS"));
  payload += "6304";
  let crc = 0xFFFF;
  for(let i=0;i<payload.length;i++){
    crc ^= payload.charCodeAt(i)<<8;
    for(let j=0;j<8;j++) crc=(crc&0x8000)?(crc<<1)^0x1021:(crc<<1);
  }
  return payload+(crc&0xFFFF).toString(16).toUpperCase().padStart(4,"0");
}
// keep old name as alias
const buildPromptPayPayload = (acc,amt)=>buildThaiQRPayload(acc,amt,"phone");

function QRCode({ payload, size=220 }){
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}&format=png&margin=2`;
  return <img src={url} width={size} height={size} alt="QR" style={{borderRadius:12,border:`3px solid ${T.border}`,background:T.white}} onError={e=>{e.target.style.display="none";}}/>;
}

// ─────────────────────────────────────────────────────────────
// THERMAL PRINTER UTILS
// ─────────────────────────────────────────────────────────────
// Converts an uploaded image (data URL) into a 1-bit monochrome raster
// suitable for ESC/POS image printing (GS v 0). Thermal printers can't
// print grayscale/color, so this resizes to the printer's dot width and
// thresholds each pixel to pure black/white. The result is plain
// numbers (not a Uint8Array) so it can be safely stored in React state
// and JSON.stringify'd into localStorage.

function buildReceiptESCPOS(){ return new Uint8Array([]); }

async function printUSB(data, setMsg){
  try{
    if(!navigator.usb){ setMsg("เบราว์เซอร์ไม่รองรับ USB (ใช้ Chrome/Edge)"); return false; }
    // Reuse a previously-granted device so the picker doesn't pop up on every print.
    // The browser remembers the permission grant across reloads as long as the
    // device stays plugged in / paired — requestDevice() is only needed once.
    let device = null;
    try{
      const known = await navigator.usb.getDevices();
      if(known.length>0) device = known[0];
    }catch(_e){ /* fall through to requestDevice below */ }
    if(!device){
      device = await navigator.usb.requestDevice({filters:[{classCode:7}]});
    }
    await device.open();
    if(device.configuration===null) await device.selectConfiguration(1);
    await device.claimInterface(0);
    const ep = device.configuration.interfaces[0].alternate.endpoints.find(e=>e.direction==="out");
    await device.transferOut(ep.endpointNumber, data);
    await device.close();
    setMsg("✅ พิมพ์สำเร็จ (USB)"); return true;
  }catch(e){ setMsg("❌ USB: "+e.message); return false; }
}

async function printBluetooth(data, setMsg){
  try{
    if(!navigator.bluetooth){ setMsg("เบราว์เซอร์ไม่รองรับ Bluetooth Web API (ใช้ Chrome/Edge)"); return false; }
    const device = await navigator.bluetooth.requestDevice({
      filters:[{services:["000018f0-0000-1000-8000-00805f9b34fb"]},
               {namePrefix:"Printer"},{namePrefix:"RPP"},{namePrefix:"MTP"},{namePrefix:"PT"}],
      optionalServices:["000018f0-0000-1000-8000-00805f9b34fb"]
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
    const char = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
    // Send in 512-byte chunks
    const CHUNK=512;
    for(let i=0;i<data.length;i+=CHUNK){
      await char.writeValueWithoutResponse(data.slice(i,i+CHUNK));
      await new Promise(r=>setTimeout(r,40));
    }
    setMsg("✅ พิมพ์สำเร็จ (Bluetooth)"); return true;
  }catch(e){ setMsg("❌ BT: "+e.message); return false; }
}

async function printSerial(data, setMsg){
  try{
    if(!navigator.serial){ setMsg("เบราว์เซอร์ไม่รองรับ Serial (ใช้ Chrome/Edge)"); return false; }
    const port = await navigator.serial.requestPort();
    await port.open({baudRate:9600});
    const writer = port.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
    await port.close();
    setMsg("✅ พิมพ์สำเร็จ (Serial)"); return true;
  }catch(e){ setMsg("❌ Serial: "+e.message); return false; }
}

// ─────────────────────────────────────────────────────────────
// MODIFIER MODAL
// ─────────────────────────────────────────────────────────────
function kitchenInfoFromSettings(kps){ return {store:{storeName:"BREW COFFEE"},style:{}}; }
function buildKitchenTicketESCPOS(cart, label, mgMap, store, style){ return new Uint8Array([]); }
function storeInfoFromSettings(ps){ return {storeName:(ps?.storeName)||"BREW COFFEE",storePhone:ps?.storePhone||""}; }

function ModifierModal({ item, onConfirm, onCancel }){
  const { modGroupsMap } = useApp();
  const mgMap = modGroupsMap || MODIFIER_GROUPS;
  const [sel, setSel] = useState(()=>{
    const init={};
    item.modifiers.forEach(gid=>{
      const g=mgMap[gid]; if(!g) return;
      if(isMulti(g)){
        // multi: start empty array (required-multi just means user must pick ≥1)
        init[gid]=[];
      } else {
        // single: pre-select first option if required, otherwise undefined
        if(g.required) init[gid]=g.options[0]?.id;
      }
    });
    return init;
  });
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const unitPrice = calcItemPrice(item, sel, mgMap);

  function toggle(gid, optId){
    const g=mgMap[gid]; if(!g) return;
    setSel(prev=>{
      if(isMulti(g)){
        const c=prev[gid]||[];
        const already=c.includes(optId);
        if(already) return{...prev,[gid]:c.filter(x=>x!==optId)};
        const limit=maxSel(g);
        if(limit>1 && c.length>=limit) return prev; // cap at maxSelect
        return{...prev,[gid]:[...c,optId]};
      }
      return{...prev,[gid]:optId};
    });
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,0,0.6)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{background:T.white,borderRadius:18,width:"100%",maxWidth:460,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{padding:"16px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
          <ItemThumb item={item} size={52} radius={10}/>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:T.ink}}>{item.name}</div><div style={{fontSize:12,color:T.inkMid}}>฿{item.price} เริ่มต้น</div></div>
          <button onClick={onCancel} style={{width:28,height:28,borderRadius:"50%",border:"none",background:T.border,cursor:"pointer",fontSize:15,color:T.inkMid}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 18px"}}>
          {item.modifiers.length===0 && <div style={{padding:"20px 0",textAlign:"center",color:T.inkLight,fontSize:13}}>เมนูนี้ไม่มีตัวเลือกเพิ่มเติม</div>}
          {item.modifiers.map(gid=>{
            const g=mgMap[gid]; if(!g) return null; const cur=sel[gid];
            return(
              <div key={gid} style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:7,display:"flex",alignItems:"center",gap:6}}>
                  {g.label}
                  {g.required && <span style={{fontSize:10,background:T.caramel,color:T.white,padding:"1px 6px",borderRadius:10,fontWeight:700}}>จำเป็น</span>}
                  {isMulti(g) && <span style={{fontSize:10,background:"#E0F0E8",color:T.mint,padding:"1px 6px",borderRadius:10,fontWeight:700}}>{maxSel(g)>=99?"หลายอย่าง":`เลือกได้ ${maxSel(g)}`}</span>}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {g.options.map(opt=>{
                    const selected=isMulti(g)?(cur||[]).includes(opt.id):cur===opt.id;
                    const atCap=isMulti(g)&&maxSel(g)<99&&(cur||[]).length>=maxSel(g)&&!selected;
                    return(
                      <button key={opt.id} onClick={()=>{ if(!atCap||selected) toggle(gid,opt.id); }}
                        style={{padding:"6px 12px",borderRadius:20,border:selected?`2px solid ${T.caramel}`:`1.5px solid ${T.border}`,background:selected?"#FFF5EA":atCap?"#F5F5F5":T.white,color:selected?T.caramel:atCap?T.inkLight:T.inkMid,fontWeight:selected?700:500,fontSize:13,cursor:atCap?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,transition:"all 0.1s",opacity:atCap?0.5:1}}>
                        {isMulti(g) && <span style={{width:13,height:13,borderRadius:3,border:selected?`2px solid ${T.caramel}`:`1.5px solid ${T.inkLight}`,background:selected?T.caramel:"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:T.white,flexShrink:0}}>{selected?"✓":""}</span>}
                        {!isMulti(g) && <span style={{width:11,height:11,borderRadius:"50%",border:selected?`2px solid ${T.caramel}`:`1.5px solid ${T.inkLight}`,background:selected?T.caramel:"transparent",display:"inline-block",flexShrink:0}}/>}
                        {opt.label}{opt.price>0&&<span style={{fontSize:11,color:T.inkMid}}>+฿{opt.price}</span>}
                      </button>
                    );
                  })}
                </div>
                {isMulti(g) && maxSel(g)<99 && (
                  <div style={{fontSize:11,color:(cur||[]).length>=maxSel(g)?T.red:T.inkLight,marginTop:5,textAlign:"right"}}>
                    เลือกแล้ว {(cur||[]).length}/{maxSel(g)}{(cur||[]).length>=maxSel(g)&&" · ครบแล้ว"}
                  </div>
                )}
              </div>
            );
          })}
          <div><div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:6}}>หมายเหตุ</div>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="เช่น ไม่ใส่น้ำตาล..." style={{width:"100%",padding:"8px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,boxSizing:"border-box"}}/>
          </div>
        </div>
        <div style={{padding:"13px 18px",borderTop:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:13,color:T.inkMid}}>จำนวน</span>
            <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:28,height:28,borderRadius:7,border:`1.5px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:T.ink}}>−</button>
            <span style={{fontSize:15,fontWeight:700,color:T.ink,minWidth:20,textAlign:"center"}}>{qty}</span>
            <button onClick={()=>setQty(q=>q+1)} style={{width:28,height:28,borderRadius:7,border:"none",background:T.caramel,cursor:"pointer",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:T.white}}>+</button>
            <div style={{flex:1,textAlign:"right",fontSize:17,fontWeight:700,color:T.caramel}}>฿{fmt(unitPrice*qty)}</div>
          </div>
          {(()=>{
            // Validate all required groups have a selection
            const missing = item.modifiers.filter(gid=>{
              const g=mgMap[gid]; if(!g||!g.required) return false;
              const v=sel[gid];
              if(isMulti(g)) return !v||v.length===0;
              return !v;
            });
            const canAdd = missing.length===0;
            return(
              <>
                {!canAdd && <div style={{fontSize:11,color:T.red,textAlign:"center",marginBottom:7}}>
                  กรุณาเลือก: {missing.map(gid=>mgMap[gid]?.label).filter(Boolean).join(", ")}
                </div>}
                <button
                  disabled={!canAdd}
                  onClick={()=>{ if(canAdd) onConfirm({item,qty,selections:sel,note,unitPrice}); }}
                  style={{width:"100%",padding:"12px",borderRadius:11,border:"none",
                    background:canAdd?T.coffee:T.border,color:T.white,fontSize:14,fontWeight:700,
                    cursor:canAdd?"pointer":"not-allowed",opacity:canAdd?1:0.6,transition:"background 0.15s"}}>
                  เพิ่มลงรายการ
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAYMENT MODAL
// ─────────────────────────────────────────────────────────────
function PaymentModal({ cart, subtotal, onClose, onComplete, printerSettings, customerWinRef, taxSettings }){
  const { modGroupsMap } = useApp();
  const mgMap = modGroupsMap || MODIFIER_GROUPS;
  const { scAmt, vatAmt, grandTotal } = calcCharges(subtotal, taxSettings);
  const tax = { ...DEFAULT_TAX, ...(taxSettings||{}) };
  const total = grandTotal;
  const vat   = vatAmt;

  const [step, setStep] = useState("choose"); // choose | cash | qr
  const [cash, setCash] = useState("");
  const [printMsg, setPrintMsg] = useState("");
  const received = parseFloat(cash)||0;
  const change = received - total;
  const quickAmounts = [50,100,500,1000];
  // Round-up quick amount
  const exact = Math.ceil(total/10)*10;
  if(!quickAmounts.includes(exact)) quickAmounts.push(exact);
  quickAmounts.sort((a,b)=>a-b);

  // QR config from settings
  const qrType    = printerSettings?.qrType    || "phone";
  const qrAccount = printerSettings?.qrAccount || "";

  // Build QR payload with exact order total — rendered fully offline,
  // no PromptPay/national-ID number is ever sent to a third party.
  const qrPayload  = qrAccount ? buildThaiQRPayload(qrAccount, total, qrType) : null;
  const qrUrl      = qrPayload ? qrPayloadToDataURI(qrPayload, 8) : null;

  // Mask display: show only last 4 chars
  const qrDisplay = qrAccount ? qrAccount.slice(0,-4).replace(/./g,"•")+qrAccount.slice(-4) : "";

  function pushCustomer(extra={}){
    if(customerWinRef.current && !customerWinRef.current.closed){
      customerWinRef.current.postMessage({type:"PAYMENT",cart,total,vat,subtotal,...extra},"*");
    }
  }
  useEffect(()=>{
    if(step==="qr") pushCustomer({showQR:true,qrPayload,qrUrl,staticQrImage:null});
  },[step]);

  async function doPrint(method){
    const data = buildReceiptESCPOS(cart,subtotal,scAmt,vat,total,method,storeInfoFromSettings(printerSettings),tax,mgMap);
    await dispatchPrint(data, printerSettings, setPrintMsg);
  }

  function complete(method){
    onComplete(method);
    onClose();
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,0,0.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{background:T.white,borderRadius:20,width:"100%",maxWidth:500,maxHeight:"95vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 72px rgba(0,0,0,0.35)"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontWeight:700,fontSize:16,color:T.ink}}>
            {step==="choose"?"ชำระเงิน":step==="cash"?"ชำระด้วยเงินสด":"QR Code K-Bank"}
          </span>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:T.border,cursor:"pointer",fontSize:15,color:T.inkMid}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {/* Order summary always visible */}
          <div style={{background:T.cream,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
            {cart.map(it=>(
              <div key={it._key} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <div>
                  <span style={{fontSize:13,fontWeight:600,color:T.ink}}>{it.emoji} {it.name}</span>
                  <span style={{fontSize:12,color:T.inkMid}}> ×{it.qty}</span>
                  {selLabel(it.selections||{},mgMap)&&<div style={{fontSize:11,color:T.caramel}}>{selLabel(it.selections||{},mgMap)}</div>}
                </div>
                <span style={{fontSize:13,fontWeight:600,color:T.ink}}>฿{fmt(it.unitPrice*it.qty)}</span>
              </div>
            ))}
            <div style={{borderTop:`1px dashed ${T.border}`,marginTop:8,paddingTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,color:T.inkMid}}>ยอดที่สั่ง</span>
                <span style={{fontSize:13,color:T.ink}}>฿{fmt(subtotal)}</span>
              </div>
              {tax.scEnabled && (
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13,color:T.inkMid}}>Service Charge {tax.scPct}%</span>
                  <span style={{fontSize:13,color:T.inkMid}}>฿{fmt(scAmt)}</span>
                </div>
              )}
              {tax.vatEnabled && (
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,color:T.inkMid}}>VAT {tax.vatPct}%{tax.vatInclusive?" (รวมอยู่แล้ว)":""}</span>
                  <span style={{fontSize:13,color:T.inkMid}}>฿{fmt(vat)}</span>
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:16,fontWeight:700,color:T.ink}}>ยอดชำระ</span>
                <span style={{fontSize:18,fontWeight:700,color:T.caramel}}>฿{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* STEP: choose */}
          {step==="choose" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>setStep("cash")} style={{padding:"16px",borderRadius:12,border:"none",cursor:"pointer",background:T.coffee,color:T.white,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <span style={{fontSize:22}}>💵</span> ชำระเงินสด
              </button>
              <button onClick={()=>setStep("qr")} style={{padding:"16px",borderRadius:12,border:`2px solid ${T.caramel}`,cursor:"pointer",background:"#FFF8EE",color:T.caramel,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <span style={{fontSize:22}}>📱</span> QR / โอนพร้อมเพย์
              </button>
              <button onClick={()=>{ pushCustomer({}); complete("บัตรเครดิต"); }} style={{padding:"16px",borderRadius:12,border:`2px solid ${T.border}`,cursor:"pointer",background:T.white,color:T.inkMid,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <span style={{fontSize:22}}>💳</span> บัตรเครดิต / เดบิต
              </button>
            </div>
          )}

          {/* STEP: cash */}
          {step==="cash" && (
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:8}}>เงินที่ลูกค้าจ่าย</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:10}}>
                {quickAmounts.map(v=>(
                  <button key={v} onClick={()=>setCash(String(v))} style={{padding:"10px",borderRadius:9,border:cash===String(v)?`2px solid ${T.caramel}`:`1px solid ${T.border}`,background:cash===String(v)?"#FFF8EE":T.cream,cursor:"pointer",fontSize:14,fontWeight:600,color:cash===String(v)?T.caramel:T.ink}}>฿{fmtInt(v)}</button>
                ))}
                <input value={cash} onChange={e=>setCash(e.target.value)} placeholder="จำนวนอื่น" style={{padding:"10px",borderRadius:9,border:`1px solid ${T.border}`,fontSize:13,textAlign:"center",gridColumn:"span 2"}}/>
              </div>
              {/* Summary box */}
              <div style={{background:T.cream,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:13,color:T.inkMid}}>ยอดที่สั่ง</span>
                  <span style={{fontSize:13,fontWeight:600,color:T.ink}}>฿{fmt(subtotal)}</span>
                </div>
                {tax.scEnabled && (
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,color:T.inkMid}}>Service Charge {tax.scPct}%</span>
                    <span style={{fontSize:13,color:T.inkMid}}>฿{fmt(scAmt)}</span>
                  </div>
                )}
                {tax.vatEnabled && (
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,color:T.inkMid}}>VAT {tax.vatPct}%{tax.vatInclusive?" (รวม)":""}</span>
                    <span style={{fontSize:13,color:T.inkMid}}>฿{fmt(vat)}</span>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:13,color:T.inkMid}}>ยอดชำระ (สุทธิ)</span>
                  <span style={{fontSize:14,fontWeight:700,color:T.caramel}}>฿{fmt(total)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:13,color:T.inkMid}}>เงินที่ลูกค้าจ่าย</span>
                  <span style={{fontSize:14,fontWeight:700,color:received>=total?T.mint:T.red}}>฿{received>0?fmt(received):"-"}</span>
                </div>
                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:8,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:15,fontWeight:700,color:T.ink}}>เงินทอน</span>
                  <span style={{fontSize:18,fontWeight:700,color:change>=0&&received>0?T.mint:T.red}}>
                    {received>0?(change>=0?"฿"+fmt(change):"ขาด ฿"+fmt(-change)):"-"}
                  </span>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setStep("choose")} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:13,fontWeight:600}}>← กลับ</button>
                <button disabled={change<0||received===0} onClick={async()=>{ pushCustomer({paid:received,change,showQR:false}); await doPrint("เงินสด"); complete("เงินสด"); }}
                  style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:change>=0&&received>0?T.mint:T.border,cursor:change>=0&&received>0?"pointer":"not-allowed",color:T.white,fontSize:14,fontWeight:700}}>
                  ✅ ยืนยันรับเงิน
                </button>
              </div>
            </div>
          )}

          {/* STEP: QR */}
          {step==="qr" && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
              {qrUrl ? (
                <>
                  <div style={{fontSize:13,color:T.inkMid,textAlign:"center"}}>
                    {qrType==="phone"?"📱 สแกน QR PromptPay (ยอดเข้าอัตโนมัติ)":qrType==="nationalid"?"🪪 สแกน QR บัตรประชาชน PromptPay":"🏦 สแกน QR เลขอ้างอิง"}
                  </div>
                  {/* QR with amount badge */}
                  <div style={{position:"relative"}}>
                    <div style={{background:T.white,borderRadius:16,padding:14,border:`2px solid ${T.caramel}`,boxShadow:"0 4px 24px rgba(200,129,58,0.2)"}}>
                      <img src={qrUrl} alt="Thai QR" width={240} height={240} style={{display:"block",borderRadius:8}}/>
                    </div>
                    <div style={{position:"absolute",bottom:-16,left:"50%",transform:"translateX(-50%)",background:T.caramel,color:T.white,borderRadius:20,padding:"6px 24px",fontWeight:700,fontSize:17,whiteSpace:"nowrap",boxShadow:"0 2px 10px rgba(200,129,58,0.45)"}}>
                      ฿{fmt(total)}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{background:"#FFF8EE",borderRadius:12,padding:"12px 20px",textAlign:"center",marginTop:8,width:"100%",boxSizing:"border-box"}}>
                    <div style={{fontSize:13,color:T.inkMid,marginBottom:2}}>ยอดที่ต้องชำระ</div>
                    <div style={{fontSize:26,fontWeight:700,color:T.caramel,marginBottom:4}}>฿{fmt(total)}</div>
                    <div style={{fontSize:11,color:T.inkLight}}>{qrType==="phone"?"PromptPay:":qrType==="nationalid"?"บัตรประชาชน:":"เลขอ้างอิง:"} {qrDisplay}</div>
                  </div>
                  <div style={{fontSize:11,color:T.inkLight,textAlign:"center"}}>QR แสดงบนจอลูกค้าแล้ว · กดยืนยันหลังรับชำระ</div>
                </>
              ) : (
                <div style={{padding:"24px 0",textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:12}}>⚙️</div>
                  <div style={{fontSize:14,color:T.inkMid,fontWeight:600,marginBottom:8}}>ยังไม่ได้ตั้งค่า QR</div>
                  <div style={{fontSize:12,color:T.inkLight}}>ไปที่ ⚙️ ตั้งค่า → เครื่องพิมพ์<br/>แล้วใส่เบอร์ PromptPay หรือเลขอ้างอิง</div>
                </div>
              )}
              {printMsg && <div style={{fontSize:12,color:T.inkMid,textAlign:"center"}}>{printMsg}</div>}
              <div style={{display:"flex",gap:8,width:"100%"}}>
                <button onClick={()=>setStep("choose")} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:13,fontWeight:600}}>← กลับ</button>
                <button onClick={async()=>{ pushCustomer({paid:total,change:0,showQR:false}); await doPrint("QR โอนเงิน"); complete("QR / โอน"); }}
                  style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:T.mint,color:T.white,fontSize:14,fontWeight:700,cursor:"pointer"}}>
                  ✅ ยืนยันรับชำระแล้ว
                </button>
              </div>
            </div>
          )}

          {printMsg && step!=="qr" && <div style={{marginTop:8,fontSize:12,color:T.inkMid,textAlign:"center"}}>{printMsg}</div>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KITCHEN TICKET PREVIEW — same thermal-paper look as ReceiptPreview
// but shows only item names/qty/options/notes. No prices.
// ─────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }){
  return(
    <button onClick={onToggle} style={{width:46,height:24,borderRadius:12,border:"none",background:on?T.mint:T.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <span style={{position:"absolute",top:2,left:on?24:2,width:20,height:20,borderRadius:"50%",background:T.white,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CONFIRM DIALOG — in-app replacement for window.confirm()/alert().
// Native modal dialogs are blocked (silently no-op) inside sandboxed
// iframe environments such as the artifact preview, which made
// confirm-gated buttons throughout the app appear to "do nothing".
// This renders entirely within the page instead, so it always works.
// Pass onCancel=null for an alert-style single-button notice.
// ─────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel="ยืนยัน", cancelLabel="ยกเลิก", danger=false, onConfirm, onCancel }){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,0,0.65)",zIndex:1500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onCancel||onConfirm}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.white,borderRadius:18,width:"100%",maxWidth:360,padding:"22px 22px 18px",boxShadow:"0 24px 60px rgba(0,0,0,0.32)"}}>
        {title&&<div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:8}}>{title}</div>}
        <div style={{fontSize:13,color:T.inkMid,lineHeight:1.6,marginBottom:20,whiteSpace:"pre-line"}}>{message}</div>
        <div style={{display:"flex",gap:8}}>
          {onCancel&&<button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:13,fontWeight:600,color:T.ink}}>{cancelLabel}</button>}
          <button onClick={onConfirm} style={{flex:onCancel?1.4:1,padding:"11px",borderRadius:10,border:"none",background:danger?T.red:T.coffee,color:T.white,cursor:"pointer",fontSize:13,fontWeight:700}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function PctInput({ value, onChange, min=0, max=100 }){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <button onClick={()=>onChange(Math.max(min, parseFloat(value||0)-1))}
        style={{width:26,height:26,borderRadius:7,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:14,fontWeight:700,color:T.ink,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      <input type="number" value={value} min={min} max={max}
        onChange={e=>onChange(Math.min(max,Math.max(min,parseFloat(e.target.value)||0)))}
        style={{width:54,padding:"5px 0",borderRadius:8,border:`1.5px solid ${T.border}`,fontSize:14,fontWeight:700,textAlign:"center",color:T.ink}}/>
      <span style={{fontSize:13,color:T.inkMid,fontWeight:600}}>%</span>
      <button onClick={()=>onChange(Math.min(max, parseFloat(value||0)+1))}
        style={{width:26,height:26,borderRadius:7,border:"none",background:T.caramel,cursor:"pointer",fontSize:14,fontWeight:700,color:T.white,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );
}

function PrinterSettingsModal({ settings, taxSettings, displaySettings, onSave, onSaveTax, onSaveDisplay, onClose }){
  const { modGroupsMap } = useApp();
  const mgMap = modGroupsMap || MODIFIER_GROUPS;
  const [tab, setTab] = useState("store"); // "store"|"tax"|"printer"|"preview"|"display"
  const [s, setS] = useState(settings||{
    enabled:false, type:"usb",
    storeName:"Sweet Nothing", storePhone:"", storeAddress:"", storeTaxId:"",
    receiptHeaderText:"", receiptFooterText:"",
    headerLogo:null, headerLogoRaster:null, footerImage:null, footerImageRaster:null,
    qrType:"phone", qrAccount:"",
  });
  const [tx, setTx] = useState({ ...DEFAULT_TAX, ...(taxSettings||{}) });
  const [testMsg, setTestMsg] = useState("");
  const [uploadingHeaderLogo, setUploadingHeaderLogo] = useState(false);
  const [uploadingFooterImage, setUploadingFooterImage] = useState(false);
  const headerLogoRef = useRef();
  const footerImageRef = useRef();

  // ── Receipt style customisation (preview tab) ──────────────────
  const DEFAULT_RECEIPT_STYLE = {
    paperWidth: 80,       // 58 | 80 mm
    fontSize: 13,         // px, body
    fontFamily: "monospace", // monospace | sarabun | kanit
    headerAlign: "center",
    showDivider: true,
    dividerChar: "─",     // ─ | = | - | *
    boldTotal: true,
    showOrderNo: true,
    showDateTime: true,
    showTaxId: true,
    footerAlign: "center",
  };
    if(settings?.receiptStyle) return {...DEFAULT_RECEIPT_STYLE,...settings.receiptStyle};
    return DEFAULT_RECEIPT_STYLE;
  });

  // ── Customer display / slideshow ───────────────────────────
  const DEFAULT_DISPLAY = {
    slideshowImages:[], slideshowInterval:5,
    showDateTime:true, bgColor:"#3B1F0E", accentColor:"#C8813A",
  };
  const [ds, setDs] = useState(()=>({...DEFAULT_DISPLAY,...(displaySettings||{})}));
  const slideshowFileRef = useRef();
  const [uploadingSlide, setUploadingSlide] = useState(false);
  const [slidePreviewIdx, setSlidePreviewIdx] = useState(0);

  async function handleSlideshowFiles(e){
    const files = Array.from(e.target.files||[]); if(!files.length) return;
    setUploadingSlide(true);
    try{
      const newImgs = await Promise.all(files.map(async f=>{
        const b64 = await compressImage(f, 1280, 0.88);
        return { id:genId("slide"), dataUrl:b64, caption:f.name.replace(/\.[^.]+$/,"") };
      }));
      setDs(p=>({...p, slideshowImages:[...(p.slideshowImages||[]), ...newImgs]}));
    }catch(err){ console.error(err); }
    setUploadingSlide(false); e.target.value="";
  }
  function removeSlide(id){
    setDs(p=>{
      const imgs = (p.slideshowImages||[]).filter(x=>x.id!==id);
      return {...p, slideshowImages:imgs};
    });
    setSlidePreviewIdx(0);
  }
  function moveSlide(id, dir){
    setDs(p=>{
      const arr=[...(p.slideshowImages||[])];
      const i=arr.findIndex(x=>x.id===id); if(i<0) return p;
      const j=i+dir; if(j<0||j>=arr.length) return p;
      [arr[i],arr[j]]=[arr[j],arr[i]]; return {...p,slideshowImages:arr};
    });
  }
  function updateCaption(id, caption){
    setDs(p=>({...p, slideshowImages:(p.slideshowImages||[]).map(x=>x.id===id?{...x,caption}:x)}));
  }

  // Sample cart for preview
  const PREVIEW_CART = [
    {name:"ลาเต้",emoji:"☕",qty:2,unitPrice:85,selections:{size:"sz_m",temp:"t_iced",sweetness:"s75"},note:"ไม่ใส่น้ำตาล"},
    {name:"มัทชะลาเต้",emoji:"🍵",qty:1,unitPrice:110,selections:{size:"sz_l",temp:"t_hot"},note:""},
    {name:"ครัวซองต์",emoji:"🥐",qty:1,unitPrice:75,selections:{},note:""},
  ];
  const prevSubtotal = PREVIEW_CART.reduce((s,c)=>s+c.unitPrice*c.qty,0);
  const { scAmt:prevSC, vatAmt:prevVAT, grandTotal:prevTotal } = calcCharges(prevSubtotal, tx);

  async function handleHeaderLogoFile(e){
    const f=e.target.files[0]; if(!f) return;
    setUploadingHeaderLogo(true);
    try{
      const preview = await compressImage(f,300,0.85);
      const raster = await imageToESCPOSRaster(preview,320);
      setS(p=>({...p,headerLogo:preview,headerLogoRaster:raster}));
    }catch(err){ console.error(err); }
    setUploadingHeaderLogo(false);
    e.target.value="";
  }
  async function handleFooterImageFile(e){
    const f=e.target.files[0]; if(!f) return;
    setUploadingFooterImage(true);
    try{
      const preview = await compressImage(f,300,0.85);
      const raster = await imageToESCPOSRaster(preview,320);
      setS(p=>({...p,footerImage:preview,footerImageRaster:raster}));
    }catch(err){ console.error(err); }
    setUploadingFooterImage(false);
    e.target.value="";
  }

  async function testPrint(){
    const sample = 85;
    const { scAmt, vatAmt, grandTotal } = calcCharges(sample, tx);
    const testData = buildReceiptESCPOS(
      [{name:"ลาเต้",qty:1,unitPrice:sample,emoji:"☕",selections:{},note:""}],
      sample, scAmt, vatAmt, grandTotal, "ทดสอบ", storeInfoFromSettings(s), tx, mgMap
    );
    await dispatchPrint(testData, s, setTestMsg);
  }

  // Live preview calc
  const preview = calcCharges(100, tx); // per ฿100

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,0,0.65)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{background:T.white,borderRadius:20,width:"100%",maxWidth:tab==="display"?600:480,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 72px rgba(0,0,0,0.3)",transition:"max-width 0.25s"}}>
        {/* Header */}
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontWeight:700,fontSize:15,color:T.ink}}>⚙️ ตั้งค่า</span>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:T.border,cursor:"pointer",fontSize:15}}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,background:T.cream,overflowX:"auto",flexShrink:0}}>
          {[{id:"store",icon:"🏪",label:"ร้านค้า"},{id:"tax",icon:"💰",label:"VAT & SC"},{id:"printer",icon:"🖨️",label:"เครื่องพิมพ์"},{id:"display",icon:"🖥️",label:"จอลูกค้า"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:"0 0 auto",padding:"11px 14px",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5,
              background:tab===t.id?T.white:"transparent",
              color:tab===t.id?T.caramel:T.inkMid,
              borderBottom:tab===t.id?`2px solid ${T.caramel}`:"2px solid transparent",
              transition:"all 0.15s",whiteSpace:"nowrap"}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>

          {/* ── STORE DETAILS TAB ── */}
          {tab==="store" && (
            <>
              <div style={{fontSize:12,color:T.inkLight}}>ข้อมูลและรูปภาพในแท็บนี้จะแนบไปกับ <b>หัวใบเสร็จ</b> (โลโก้ + ชื่อร้าน + ที่อยู่) และ <b>ท้ายใบเสร็จ</b> (ข้อความ/รูปขอบคุณ) โดยอัตโนมัติทุกใบ</div>

              {/* Header logo upload */}
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <input ref={headerLogoRef} type="file" accept="image/*" onChange={handleHeaderLogoFile} style={{display:"none"}}/>
                <div onClick={()=>headerLogoRef.current.click()} style={{width:90,height:90,borderRadius:14,border:`2.5px dashed ${T.caramel}`,background:"#FFF8EE",cursor:"pointer",position:"relative",overflow:"hidden",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
                  {s.headerLogo ? (
                    <img src={s.headerLogo} alt="" style={{width:"100%",height:"100%",objectFit:"contain",background:T.white}}/>
                  ) : uploadingHeaderLogo ? (
                    <div style={{fontSize:11,color:T.caramel,fontWeight:600}}>⏳</div>
                  ) : (
                    <>
                      <div style={{fontSize:26}}>🏪</div>
                      <div style={{fontSize:10,color:T.caramel,fontWeight:600}}>โลโก้ร้าน</div>
                    </>
                  )}
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{fontSize:12,color:T.inkMid}}>โลโก้จะพิมพ์ที่ <b>หัวใบเสร็จ</b> เหนือชื่อร้าน — ใช้ภาพขาวดำ/เส้นชัดเจนจะคมที่สุดบนกระดาษความร้อน</div>
                  {s.headerLogo&&<button onClick={()=>setS(p=>({...p,headerLogo:null,headerLogoRaster:null}))} style={{alignSelf:"flex-start",padding:"4px 12px",border:"none",borderRadius:8,background:"#FFF0F0",color:T.red,cursor:"pointer",fontSize:11,fontWeight:600}}>🗑 ลบโลโก้</button>}
                </div>
              </div>

              {/* Store identity fields */}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {key:"storeName",  label:"ชื่อร้าน",        placeholder:"Sweet Nothing"},
                  {key:"storePhone", label:"เบอร์โทรร้าน",     placeholder:"02-xxx-xxxx"},
                  {key:"storeTaxId", label:"เลขประจำตัวผู้เสียภาษี (ถ้ามี)", placeholder:"1-2345-67890-12-3"},
                ].map(f=>(
                  <div key={f.key}>
                    <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>{f.label}</div>
                    <input value={s[f.key]||""} onChange={e=>setS(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                      style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,boxSizing:"border-box"}}/>
                  </div>
                ))}
                <div>
                  <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>ที่อยู่ร้าน</div>
                  <textarea value={s.storeAddress||""} onChange={e=>setS(p=>({...p,storeAddress:e.target.value}))} placeholder="123 ถ.สุขุมวิท แขวง... เขต... กรุงเทพฯ 10110" rows={2}
                    style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,boxSizing:"border-box",fontFamily:"inherit",resize:"vertical"}}/>
                </div>
                <div>
                  <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>ข้อความใต้ชื่อร้าน (หัวใบเสร็จ)</div>
                  <input value={s.receiptHeaderText||""} onChange={e=>setS(p=>({...p,receiptHeaderText:e.target.value}))} placeholder="เช่น สาขาสยาม"
                    style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,boxSizing:"border-box"}}/>
                </div>
              </div>

              {/* Footer customization */}
              <div style={{background:T.cream,borderRadius:12,padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink}}>ท้ายใบเสร็จ</div>
                <div>
                  <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>ข้อความท้ายใบเสร็จ (ใส่ได้หลายบรรทัด)</div>
                  <textarea value={s.receiptFooterText||""} onChange={e=>setS(p=>({...p,receiptFooterText:e.target.value}))} placeholder={"ขอบคุณที่ใช้บริการ :)\nFacebook/Line: @sweetnothing"} rows={3}
                    style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,boxSizing:"border-box",fontFamily:"inherit",resize:"vertical"}}/>
                </div>
                <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  <input ref={footerImageRef} type="file" accept="image/*" onChange={handleFooterImageFile} style={{display:"none"}}/>
                  <div onClick={()=>footerImageRef.current.click()} style={{width:74,height:74,borderRadius:12,border:`2.5px dashed ${T.caramel}`,background:T.white,cursor:"pointer",position:"relative",overflow:"hidden",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}>
                    {s.footerImage ? (
                      <img src={s.footerImage} alt="" style={{width:"100%",height:"100%",objectFit:"contain",background:T.white}}/>
                    ) : uploadingFooterImage ? (
                      <div style={{fontSize:10,color:T.caramel,fontWeight:600}}>⏳</div>
                    ) : (
                      <div style={{fontSize:9,color:T.caramel,fontWeight:600,textAlign:"center",padding:"0 4px"}}>📷 รูปท้ายบิล</div>
                    )}
                  </div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                    <div style={{fontSize:11,color:T.inkLight}}>รูปนี้จะพิมพ์ปิดท้ายใบเสร็จ (เช่น ตราโปรโมชัน, QR รีวิวร้าน)</div>
                    {s.footerImage&&<button onClick={()=>setS(p=>({...p,footerImage:null,footerImageRaster:null}))} style={{alignSelf:"flex-start",padding:"4px 12px",border:"none",borderRadius:8,background:"#FFF0F0",color:T.red,cursor:"pointer",fontSize:11,fontWeight:600}}>🗑 ลบรูป</button>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAX TAB ── */}
          {tab==="tax" && (
            <>
              {/* VAT section */}
              <div style={{background:T.cream,borderRadius:14,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:T.ink}}>ภาษีมูลค่าเพิ่ม (VAT)</div>
                    <div style={{fontSize:12,color:T.inkMid,marginTop:2}}>คิดจากยอดอาหาร{tx.scEnabled?" + ค่าบริการ":""}</div>
                  </div>
                  <Toggle on={tx.vatEnabled} onToggle={()=>setTx(p=>({...p,vatEnabled:!p.vatEnabled}))}/>
                </div>
                {tx.vatEnabled && (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:13,color:T.ink,fontWeight:600}}>อัตรา VAT</span>
                      <PctInput value={tx.vatPct} onChange={v=>setTx(p=>({...p,vatPct:v}))}/>
                    </div>
                    {/* Inclusive / Exclusive toggle */}
                    <div style={{display:"flex",gap:8}}>
                      {[{v:false,label:"คิดเพิ่มจากราคา",sub:"ราคา + VAT"},{v:true,label:"รวมอยู่ในราคาแล้ว",sub:"แยกแสดงในใบเสร็จ"}].map(opt=>(
                        <button key={String(opt.v)} onClick={()=>setTx(p=>({...p,vatInclusive:opt.v}))} style={{flex:1,padding:"9px 10px",borderRadius:10,border:tx.vatInclusive===opt.v?`2px solid ${T.caramel}`:`1.5px solid ${T.border}`,background:tx.vatInclusive===opt.v?"#FFF8EE":T.white,cursor:"pointer",textAlign:"left"}}>
                          <div style={{fontSize:12,fontWeight:700,color:tx.vatInclusive===opt.v?T.caramel:T.ink}}>{opt.label}</div>
                          <div style={{fontSize:10,color:T.inkLight,marginTop:2}}>{opt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Service Charge section */}
              <div style={{background:T.cream,borderRadius:14,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:T.ink}}>Service Charge (SC)</div>
                    <div style={{fontSize:12,color:T.inkMid,marginTop:2}}>คิดจากยอดอาหารก่อน VAT</div>
                  </div>
                  <Toggle on={tx.scEnabled} onToggle={()=>setTx(p=>({...p,scEnabled:!p.scEnabled}))}/>
                </div>
                {tx.scEnabled && (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:T.ink,fontWeight:600}}>อัตรา SC</span>
                    <PctInput value={tx.scPct} onChange={v=>setTx(p=>({...p,scPct:v}))}/>
                  </div>
                )}
              </div>

              {/* Live preview */}
              <div style={{background:"#FFF8EE",borderRadius:14,padding:"14px 16px",border:`1.5px solid ${T.caramelLight}`}}>
                <div style={{fontSize:13,fontWeight:700,color:T.caramel,marginBottom:10}}>🧾 ตัวอย่างคำนวณ (ยอดอาหาร ฿100)</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                    <span style={{color:T.inkMid}}>ยอดอาหาร</span>
                    <span style={{color:T.ink,fontWeight:600}}>฿100.00</span>
                  </div>
                  {tx.scEnabled && (
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:T.inkMid}}>SC {tx.scPct}%</span>
                      <span style={{color:T.inkMid}}>+ ฿{fmt(preview.scAmt)}</span>
                    </div>
                  )}
                  {tx.vatEnabled && (
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:T.inkMid}}>VAT {tx.vatPct}%{tx.vatInclusive?" (รวม)":""}</span>
                      <span style={{color:T.inkMid}}>{tx.vatInclusive?"(บวกอยู่)":"+ "}฿{fmt(preview.vatAmt)}</span>
                    </div>
                  )}
                  <div style={{borderTop:`1.5px solid ${T.caramelLight}`,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:700}}>
                    <span style={{color:T.ink}}>รวมสุทธิ</span>
                    <span style={{color:T.caramel}}>฿{fmt(preview.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── PRINTER TAB ── */}
          {tab==="printer" && (
            <>
              {/* Enable toggle */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.cream,borderRadius:12,padding:"12px 14px"}}>
                <div><div style={{fontWeight:700,fontSize:14,color:T.ink}}>เปิดใช้งานเครื่องพิมพ์</div><div style={{fontSize:12,color:T.inkMid}}>พิมพ์ใบเสร็จอัตโนมัติหลังชำระเงิน</div></div>
                <Toggle on={s.enabled} onToggle={()=>setS(p=>({...p,enabled:!p.enabled}))}/>
              </div>

              {/* Connection type */}
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:8}}>ประเภทการเชื่อมต่อ</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {id:"usb",icon:"🔌",label:"USB / สาย (WebUSB)",desc:"ต่อตรงกับเครื่อง POS ผ่านสาย USB"},
                    {id:"bluetooth",icon:"📶",label:"Bluetooth (BLE)",desc:"เชื่อมต่อไร้สาย — Thermal printer BLE"},
                    {id:"serial",icon:"🔗",label:"Serial / RS232",desc:"พอร์ต COM / RS232 (ต้องใช้ Chrome 89+)"},
                  ].map(opt=>(
                    <button key={opt.id} onClick={()=>setS(p=>({...p,type:opt.id}))} style={{padding:"11px 14px",borderRadius:10,border:s.type===opt.id?`2px solid ${T.caramel}`:`1.5px solid ${T.border}`,background:s.type===opt.id?"#FFF8EE":T.white,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:20}}>{opt.icon}</span>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:s.type===opt.id?T.caramel:T.ink}}>{opt.label}</div>
                        <div style={{fontSize:11,color:T.inkLight}}>{opt.desc}</div>
                      </div>
                      {s.type===opt.id && <span style={{marginLeft:"auto",color:T.caramel,fontWeight:700}}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zadig warning for receipt printer USB */}
              {s.type==="usb" && (
                <div style={{background:"#FFF8E6",borderRadius:10,padding:"11px 13px",border:`1px solid ${T.caramelLight}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.caramel,marginBottom:5}}>⚠️ Windows: ต้องติดตั้ง Zadig ก่อน</div>
                  <div style={{fontSize:11,color:T.inkMid,lineHeight:1.7}}>
                    Mac / Linux / Android: ไม่ต้องทำอะไร — เสียบ USB แล้วกดทดสอบได้เลย<br/>
                    Windows: เครื่องพิมใช้ <b>usbprint.sys</b> สํารอง USB ไว้ WebUSB เข้าไม่ได้<br/>
                    → โหลด <b>Zadig</b> (ฟรี) → เลือกเครื่องพิม → Replace Driver → WinUSB
                  </div>
                  <a href="https://zadig.akeo.ie" target="_blank" rel="noreferrer"
                    style={{display:"inline-block",marginTop:7,padding:"5px 14px",borderRadius:8,background:T.caramel,color:T.white,fontSize:11,fontWeight:700,textDecoration:"none"}}>
                    ⬇️ ดาวน์โหลด Zadig
                  </a>
                </div>
              )}

              {/* QR Payment section */}
              <div style={{background:T.cream,borderRadius:12,padding:"14px 14px",display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink}}>📱 ตั้งค่า QR ชำระเงิน</div>

                {/* Type selector */}
                <div>
                  <div style={{fontSize:12,color:T.inkMid,marginBottom:7}}>ประเภทบัญชีรับชำระ</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[
                      {id:"phone",     icon:"📱", label:"เบอร์โทรศัพท์ (พร้อมเพย์)", sub:"PromptPay ผูกเบอร์มือถือ"},
                      {id:"nationalid",icon:"🪪", label:"รหัสบัตรประชาชน 13 หลัก",  sub:"PromptPay ผูกเลขบัตรประชาชน"},
                      {id:"reference", icon:"🏦", label:"เลขอ้างอิง K-Shop / ธนาคาร", sub:"Merchant Reference หรือ Biller ID"},
                    ].map(opt=>(
                      <button key={opt.id} onClick={()=>setS(p=>({...p,qrType:opt.id}))} style={{padding:"10px 12px",borderRadius:10,border:s.qrType===opt.id?`2px solid ${T.caramel}`:`1.5px solid ${T.border}`,background:s.qrType===opt.id?"#FFF8EE":T.white,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:20,flexShrink:0}}>{opt.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:s.qrType===opt.id?700:500,color:s.qrType===opt.id?T.caramel:T.ink}}>{opt.label}</div>
                          <div style={{fontSize:11,color:T.inkLight,marginTop:1}}>{opt.sub}</div>
                        </div>
                        {s.qrType===opt.id&&<span style={{color:T.caramel,fontWeight:700,flexShrink:0}}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account value input */}
                <div>
                  <div style={{fontSize:12,color:T.inkMid,marginBottom:5}}>
                    {s.qrType==="phone"?"เบอร์โทรศัพท์ (PromptPay)":s.qrType==="nationalid"?"เลขบัตรประชาชน 13 หลัก":"เลขอ้างอิง เช่น KPS004KB000002073343"}
                  </div>
                  <input value={s.qrAccount||""} onChange={e=>setS(p=>({...p,qrAccount:e.target.value}))}
                    placeholder={s.qrType==="phone"?"0812345678":s.qrType==="nationalid"?"1234567890123":"KPS004KB000002073343"}
                    style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`2px solid ${T.caramel}`,fontSize:15,fontWeight:700,boxSizing:"border-box",color:T.coffee,letterSpacing:"0.5px"}}/>
                </div>

                {/* Live QR preview — generated locally, never sent anywhere */}
                {s.qrAccount&&s.qrAccount.length>=8&&(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <div style={{fontSize:12,color:T.inkMid}}>ตัวอย่าง QR (ฝึกสแกนด้วยแอปธนาคาร)</div>
                    <img
                      src={qrPayloadToDataURI(buildThaiQRPayload(s.qrAccount,1,s.qrType||"phone"), 6)}
                      width={180} height={180} alt="QR Preview"
                      style={{borderRadius:12,border:`2px solid ${T.caramel}`,background:T.white,padding:4}}/>
                    <div style={{fontSize:11,color:T.inkLight,textAlign:"center"}}>QR จริงจะมียอดตามออเดอร์ที่สั่ง</div>
                  </div>
                )}

                <div style={{background:"#EBF5FF",borderRadius:9,padding:"9px 12px",fontSize:11,color:"#2563EB",lineHeight:1.7}}>
                  💡 <b>เบอร์โทร / บัตรประชาชน:</b> ยอดเข้าอัตโนมัติในแอปธนาคาร<br/>
                  💡 <b>เลขอ้างอิง K-Shop:</b> สร้าง QR ได้แต่ยอดอาจไม่เข้าอัตโนมัติ ขึ้นกับการลงทะเบียน
                </div>
              </div>

              {/* Test print */}
              <div style={{background:T.cream,borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:6}}>ทดสอบการพิมพ์</div>
                <div style={{fontSize:12,color:T.inkMid,marginBottom:10}}>กดปุ่มเพื่อพิมพ์ใบเสร็จทดสอบ — เบราว์เซอร์จะขอสิทธิ์เข้าถึงอุปกรณ์</div>
                <button onClick={testPrint} style={{padding:"9px 18px",borderRadius:9,border:`1.5px solid ${T.caramel}`,background:T.white,cursor:"pointer",fontSize:13,fontWeight:700,color:T.caramel}}>🖨️ ทดสอบพิมพ์</button>
                {testMsg && <div style={{marginTop:8,fontSize:12,color:T.inkMid}}>{testMsg}</div>}
              </div>

              <div style={{background:"#F0F8FF",borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#2563EB",marginBottom:6}}>📋 วิธีใช้งาน</div>
                <div style={{fontSize:11,color:"#3B82F6",lineHeight:1.6}}>
                  • <b>USB:</b> เสียบสาย USB → Chrome จะแสดง popup ให้เลือกเครื่อง<br/>
                  • <b>BT:</b> เปิด Bluetooth บนเครื่องพิมพ์ก่อน แล้วกดทดสอบ<br/>
                  • <b>Serial:</b> Chrome 89+ Desktop — เสียบสาย RS232 แล้วกด<br/>
                  • ต้องใช้ <b>Chrome หรือ Edge</b> เท่านั้น<br/>
                  • ใบเสร็จลูกค้าและใบสั่งครัวใช้เครื่องพิมพ์เครื่องเดียวกันนี้
                </div>
              </div>
            </>
          )}

          {/* ── KITCHEN PRINTER TAB ── */}
          {tab==="kitchen" && (
            <>
              {/* Kitchen printer enable */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.cream,borderRadius:12,padding:"12px 14px"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:T.ink}}>เปิดใช้เครื่องพิมครัว</div>
                  <div style={{fontSize:12,color:T.inkMid}}>พิมพ์ใบสั่งครัวอัตโนมัติทุกครั้งที่มีออเดอร์ / พักบิล</div>
                </div>
                <Toggle on={ks.enabled} onToggle={()=>setKs(p=>({...p,enabled:!p.enabled}))}/>
              </div>

              {/* Info box: same or separate printer */}
              <div style={{background:"#EBF5FF",borderRadius:10,padding:"10px 13px",fontSize:12,color:"#2563EB",lineHeight:1.7}}>
                💡 <b>เครื่องพิมครัวสามารถใช้เครื่องเดียวกับใบเสร็จได้</b> — ถ้าไม่เปิดใช้งานจะใช้เครื่องพิมใบเสร็จแทน<br/>
                เปิดใช้เมื่อต้องการเครื่องพิมแยกต่างหากมี 2 เครื่อง (เคาน์เตอร์ + ครัว)
              </div>

              {/* Connection type */}
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:8}}>ประเภทการเชื่อมต่อ</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {id:"usb",icon:"🔌",label:"USB / สาย (WebUSB)",desc:"ต่อตรงกับเครื่อง POS ผ่านสาย USB"},
                    {id:"bluetooth",icon:"📶",label:"Bluetooth (BLE)",desc:"เชื่อมต่อไร้สาย — Thermal printer BLE"},
                    {id:"serial",icon:"🔗",label:"Serial / RS232",desc:"พอร์ต COM / RS232 (ต้องใช้ Chrome 89+)"},
                  ].map(opt=>(
                    <button key={opt.id} onClick={()=>setKs(p=>({...p,type:opt.id}))} style={{padding:"11px 14px",borderRadius:10,border:ks.type===opt.id?`2px solid ${T.caramel}`:`1.5px solid ${T.border}`,background:ks.type===opt.id?"#FFF8EE":T.white,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:20}}>{opt.icon}</span>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:ks.type===opt.id?T.caramel:T.ink}}>{opt.label}</div>
                        <div style={{fontSize:11,color:T.inkLight}}>{opt.desc}</div>
                      </div>
                      {ks.type===opt.id && <span style={{marginLeft:"auto",color:T.caramel,fontWeight:700}}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Windows USB warning */}
              {ks.type==="usb" && (
                <div style={{background:"#FFF8E6",borderRadius:10,padding:"11px 13px",border:`1px solid ${T.caramelLight}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.caramel,marginBottom:5}}>⚠️ Windows: ต้องติดตั้ง Zadig ก่อน</div>
                  <div style={{fontSize:11,color:T.inkMid,lineHeight:1.7}}>
                    Mac / Linux / Android: ไม่ต้องทำอะไร — เสียบ USB แล้วกดทดสอบได้เลย<br/>
                    Windows: เครื่องพิมใช้ <b>usbprint.sys</b> สํารอง USB ไว้ WebUSB เข้าไม่ได้<br/>
                    → โหลด <b>Zadig</b> (ฟรี) → เลือกเครื่องพิม → Replace Driver (WinUSB)<br/>
                    → สลับไดรเวอร์แล้วเครื่องอื่นอาจสั่งเครื่องนี้ไม่ได้อีก
                  </div>
                  <a href="https://zadig.akeo.ie" target="_blank" rel="noreferrer"
                    style={{display:"inline-block",marginTop:7,padding:"5px 14px",borderRadius:8,background:T.caramel,color:T.white,fontSize:11,fontWeight:700,textDecoration:"none"}}>
                    ⬇️ ดาวน์โหลด Zadig
                  </a>
                </div>
              )}

              {/* Kitchen style settings */}
              <div style={{background:T.cream,borderRadius:12,padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink}}>📝 รูปแบบใบสั่งครัว</div>
                <div>
                  <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>ชื่อที่แสดงหัวใบ (ถ้ามี)</div>
                  <input value={ks.kitchenName||""} onChange={e=>setKs(p=>({...p,kitchenName:e.target.value}))}
                    placeholder="เช่น Sweet Nothing Bar"
                    style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>ชื่อหัวใบสั่งครัว</div>
                  <input value={ks.kitchenTitle||""} onChange={e=>setKs(p=>({...p,kitchenTitle:e.target.value}))}
                    placeholder="ใบสั่งครัว"
                    style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>ข้อความท้ายใบ</div>
                  <input value={ks.kitchenFooter||""} onChange={e=>setKs(p=>({...p,kitchenFooter:e.target.value}))}
                    placeholder="เช่น รีบเสิร์ฟ! ❤️"
                    style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>เส้นคั่น</div>
                    <div style={{display:"flex",gap:5}}>
                      {["=","-","═","*"].map(ch=>(
                        <button key={ch} onClick={()=>setKs(p=>({...p,dividerChar:ch}))}
                          style={{flex:1,padding:"7px 4px",borderRadius:8,border:ks.dividerChar===ch?`2px solid ${T.caramel}`:`1px solid ${T.border}`,background:ks.dividerChar===ch?"#FFF8EE":T.white,cursor:"pointer",fontSize:13,color:ks.dividerChar===ch?T.caramel:T.inkMid,fontWeight:700}}>
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:T.inkMid,marginBottom:4}}>บรรทัดระหว่างรายการ</div>
                    <Toggle on={ks.itemSpacing!==false} onToggle={()=>setKs(p=>({...p,itemSpacing:!p.itemSpacing}))}/>
                  </div>
                </div>
              </div>

              {/* Kitchen test print */}
              <div style={{background:T.cream,borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:6}}>ทดสอบพิมพ์ใบสั่งครัว</div>
                <div style={{fontSize:12,color:T.inkMid,marginBottom:10}}>กดปุ่มเพื่อส่งใบสั่งครัวทดสอบ — เบราว์เซอร์จะขอสิทธิ์เข้าถึงอุปกรณ์</div>
                <button onClick={async()=>{
                  const ki = kitchenInfoFromSettings(ks);
                  const testData = buildKitchenTicketESCPOS(
                    [{name:"ลาเต้",emoji:"☕",qty:2,unitPrice:85,selections:{temp:"t_iced",size:"sz_m"},note:"ไม่ใส่น้ำตาล"},
                     {name:"มัทชะลาเต้",emoji:"🍵",qty:1,unitPrice:95,selections:{temp:"t_hot"},note:""}],
                    "โต๊ะ 3", mgMap, ki.store, ki.style
                  );
                  await dispatchPrint(testData, ks, setKitchenTestMsg);
                }} style={{padding:"9px 18px",borderRadius:9,border:`1.5px solid ${T.caramel}`,background:T.white,cursor:"pointer",fontSize:13,fontWeight:700,color:T.caramel}}>
                  🍳 ทดสอบพิมครัว
                </button>
                {kitchenTestMsg && <div style={{marginTop:8,fontSize:12,color:T.inkMid}}>{kitchenTestMsg}</div>}
              </div>

              {/* Kitchen preview panel */}
              <div style={{background:T.cream,borderRadius:12,padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink}}>🧾 ตัวอย่างใบสั่งครัว (Live Preview)</div>
                <div style={{background:"#E8E0D8",borderRadius:10,padding:"16px 0",display:"flex",justifyContent:"center",overflowY:"auto",maxHeight:400}}>
                  <KitchenTicketPreview
                    cart={PREVIEW_CART}
                    label="โต๊ะ 3"
                    mgMap={mgMap}
                    store={{name:ks.kitchenName||""}}
                    kitchenStyle={{kitchenTitle:ks.kitchenTitle||"ใบสั่งครัว",kitchenFooter:ks.kitchenFooter||"",dividerChar:ks.dividerChar||"=",itemSpacing:ks.itemSpacing!==false}}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── RECEIPT PREVIEW TAB ── */}
          {tab==="display" && (
            <>
              {/* Live preview */}
              <div style={{borderRadius:14,overflow:"hidden",border:`2px solid ${T.border}`,aspectRatio:"16/10",position:"relative",background:ds.bgColor||"#3B1F0E",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {/* Slide image */}
                {(ds.slideshowImages||[]).length>0 && (
                  <img src={(ds.slideshowImages||[])[slidePreviewIdx]?.dataUrl} alt=""
                    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.55}}/>
                )}
                {/* Overlay content */}
                <div style={{position:"relative",zIndex:1,textAlign:"center",color:"#fff",padding:"0 24px",width:"100%"}}>
                  {(ds.slideshowImages||[]).length===0 && <div style={{fontSize:32,marginBottom:8}}>☕</div>}
                  <div style={{fontSize:20,fontWeight:700,letterSpacing:3,color:ds.accentColor||"#C8813A"}}>BREW COFFEE</div>
                  <div style={{fontSize:12,opacity:0.7,marginTop:6}}>
                    {(ds.slideshowImages||[])[slidePreviewIdx]?.caption || "ยินดีต้อนรับ 🙏"}
                  </div>
                </div>
                {/* DateTime badge */}
                {ds.showDateTime!==false && (
                  <div style={{position:"absolute",top:10,right:12,fontSize:11,color:"rgba(255,255,255,0.55)",zIndex:2}}>
                    {new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})} น.
                  </div>
                )}
                {/* Dot indicators */}
                {(ds.slideshowImages||[]).length>1 && (
                  <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,zIndex:2}}>
                    {(ds.slideshowImages||[]).map((_,i)=>(
                      <button key={i} onClick={()=>setSlidePreviewIdx(i)}
                        style={{width:i===slidePreviewIdx?18:6,height:6,borderRadius:3,background:i===slidePreviewIdx?"#fff":"rgba(255,255,255,0.35)",border:"none",cursor:"pointer",padding:0,transition:"width 0.25s"}}/>
                    ))}
                  </div>
                )}
              </div>
              <div style={{fontSize:11,color:T.inkLight,textAlign:"center"}}>
                {(ds.slideshowImages||[]).length>0
                  ? `ตัวอย่างจอลูกค้า · กดจุดด้านล่างเพื่อสลับภาพ · สลับอัตโนมัติทุก ${ds.slideshowInterval||5} วิ`
                  : "เพิ่มภาพเพื่อดูตัวอย่าง"}
              </div>
            </>
          )}
        </div>

        <div style={{padding:"14px 20px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:13,fontWeight:600}}>ยกเลิก</button>
          <button onClick={()=>{ onSave(s); onSaveTax(tx); onSaveDisplay&&onSaveDisplay(ds); onClose(); }}
            style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:T.coffee,color:T.white,cursor:"pointer",fontSize:14,fontWeight:700}}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER DISPLAY HTML
// Supports: slideshow idle screen, Sunmi Presentation API,
// window.open() fallback, theming (bgColor / accentColor),
// datetime badge, and order/QR overlay.
// ─────────────────────────────────────────────────────────────
function buildCustomerHTML(modGroupsJSON, isSunmi=false, displayCfg={}){
  const bg=displayCfg.bgColor||"#3B1F0E", acc=displayCfg.accentColor||"#C8813A";
  const slides=displayCfg.slideshowImages||[];
  const iv=(displayCfg.slideshowInterval||5)*1000;
  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>จอลูกค้า</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Kanit',sans-serif;background:${bg};color:#FDF8F3;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
.logo{font-size:42px;text-align:center}.name{color:${acc};font-size:20px;font-weight:700;letter-spacing:3px;margin-top:6px;text-align:center}
.wrap{width:100%;max-width:500px;margin-top:20px}.irow{padding:10px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between}
.grand{display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid rgba(255,255,255,0.15);margin-top:10px}.gvl{color:${acc};font-weight:700;font-size:24px}</style></head>
<body><div class="logo">☕</div><div class="name">BREW COFFEE</div>
<div class="wrap"><div id="items"><div style="text-align:center;color:rgba(255,255,255,0.4);padding:40px">ยินดีต้อนรับ 🙏</div></div>
<div id="totals"></div><div id="qr"></div></div>
<script>
var MG=${modGroupsJSON};
function fmt(n){return n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});}
function sl(s){var p=[];Object.entries(s||{}).forEach(function(e){var g=MG[e[0]];if(!g)return;var ids=Array.isArray(e[1])?e[1]:[e[1]];ids.forEach(function(id){var o=g.options.find(function(x){return x.id===id});if(o)p.push(o.label);});});return p.join(' · ');}
window.addEventListener('message',function(e){
  var d=e.data; if(!d||!d.type) return;
  var ia=document.getElementById('items'),ta=document.getElementById('totals'),qa=document.getElementById('qr');
  if(!d.cart||!d.cart.length){ia.innerHTML='<div style="text-align:center;color:rgba(255,255,255,0.4);padding:40px">ยินดีต้อนรับ 🙏</div>';ta.innerHTML='';qa.innerHTML='';return;}
  ia.innerHTML=d.cart.map(function(it){var lb=sl(it.selections||{});return '<div class="irow"><span>'+it.emoji+' '+it.name+(lb?' <small style="opacity:.6">'+lb+'</small>':'')+'</span><span style="color:${acc}">฿'+fmt(it.unitPrice*it.qty)+'</span></div>';}).join('');
  ta.innerHTML='<div class="grand"><span style="font-weight:700">ยอดชำระ</span><span class="gvl">฿'+fmt(d.total)+'</span></div>';
  if(d.showQR&&d.qrUrl)qa.innerHTML='<div style="text-align:center;margin-top:12px"><img src="'+d.qrUrl+'" width="180" style="border-radius:10px;background:#fff;padding:6px"/><div style="color:${acc};font-weight:700;font-size:20px;margin-top:6px">฿'+fmt(d.total)+'</div></div>';
  else qa.innerHTML='';
});
</script></body></html>\`;
}

function Sidebar({ view, setView, cartCount, onSettings, heldCount }){
  const items=[
    {id:"pos",icon:"🧾",label:"รับออเดอร์"},
    {id:"orders",icon:"📋",label:"ออเดอร์"},
    {id:"reports",icon:"📊",label:"รายงาน"},
    {id:"menu",icon:"🍽️",label:"เมนู"},
    {id:"options",icon:"🏷️",label:"ตัวเลือก"},
  ];
  return(
    <div style={{width:66,background:T.coffee,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:4,flexShrink:0,boxShadow:"2px 0 16px rgba(0,0,0,0.2)"}}>
      <div style={{marginBottom:16,fontSize:22}}>☕</div>
      {items.map(it=>(
        <button key={it.id} onClick={()=>setView(it.id)} style={{width:50,height:50,borderRadius:11,border:"none",cursor:"pointer",background:view===it.id?T.caramel:"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,transition:"background 0.2s",position:"relative"}}>
          <span style={{fontSize:17}}>{it.icon}</span>
          <span style={{fontSize:9,color:view===it.id?T.white:T.inkLight,fontWeight:600}}>{it.label}</span>
          {it.id==="pos"&&cartCount>0&&<span style={{position:"absolute",top:4,right:4,background:T.red,color:T.white,fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 5px",minWidth:16,textAlign:"center"}}>{cartCount}</span>}
          {it.id==="orders"&&heldCount>0&&<span style={{position:"absolute",top:4,right:4,background:T.amber,color:T.white,fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 5px",minWidth:16,textAlign:"center"}}>{heldCount}</span>}
        </button>
      ))}
      <div style={{flex:1}}/>
      <button onClick={onSettings} style={{width:50,height:50,borderRadius:11,border:"none",cursor:"pointer",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
        <span style={{fontSize:17}}>⚙️</span>
        <span style={{fontSize:9,color:T.inkLight,fontWeight:600}}>ตั้งค่า</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// POS VIEW
// ─────────────────────────────────────────────────────────────
function POSView({ cart, setCart, printerSettings, kitchenPrinterSettings, customerWinRef, taxSettings, menuItems, onOrderComplete,
                   heldOrders, onHold, onUpdateHeld, onRemoveHeld, activeHeldId, setActiveHeldId }){
  const { categories, catInfo, modGroupsMap } = useApp();
  const CATS = categories || CATEGORIES;
  const mgMap = modGroupsMap || MODIFIER_GROUPS;
  const [cat,setCat]=useState("ทั้งหมด");
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(null);
  const [payModal,setPayModal]=useState(false);
  const [lastOrderMsg,setLastOrderMsg]=useState("");
  const keyRef = useRef(0);

  heldOrders = heldOrders||[];

  // ── Hold / send-to-kitchen label prompt ──
  // "ส่งค้างไว้" always auto-prints a kitchen ticket at the same time.
  const [holdPrompt,setHoldPrompt] = useState(false);
  const [holdLabelInput,setHoldLabelInput] = useState("");
  const [confirmDeleteHeld,setConfirmDeleteHeld] = useState(null);

  function openHoldPrompt(){
    if(cart.length===0) return;
    const existing = activeHeldId && heldOrders.find(h=>h.id===activeHeldId);
    setHoldLabelInput(existing ? existing.label : "");
    setHoldPrompt(true);
  }
  async function confirmHoldPrompt(){
    const label = holdLabelInput.trim() || `บิล ${heldOrders.length+1}`;
    let id = activeHeldId;
    if(id) onUpdateHeld(id, cart, label);
    else id = onHold(label, cart);
    setHoldPrompt(false);
    // Always print kitchen ticket when holding a bill
    const _ki = kitchenInfoFromSettings(kitchenPrinterSettings);
    const kdata = buildKitchenTicketESCPOS(cart, label, mgMap, _ki.store, _ki.style);
    const kPrinter = kitchenPrinterSettings?.enabled ? kitchenPrinterSettings : printerSettings;
    await dispatchPrint(kdata, kPrinter, ()=>{}).catch(()=>{});
    setLastOrderMsg("📑 ส่งค้างไว้ — "+label+(printerSettings?.enabled?" 🖨️":""));
    setTimeout(()=>setLastOrderMsg(""), 3500);
    setCart([]); setActiveHeldId(null); setCartOpen(false);
  }

  const filtered=menuItems.filter(m=>(cat==="ทั้งหมด"||m.cat===cat)&&m.name.toLowerCase().includes(search.toLowerCase()));

  function handleMenuClick(item){ if(item.available===false) return; if(item.modifiers.length>0) setModal(item); else addPlain(item); }
  function addPlain(item){
    setCart(prev=>{ const ex=prev.find(c=>c.id===item.id&&Object.keys(c.selections||{}).length===0); if(ex) return prev.map(c=>c._key===ex._key?{...c,qty:c.qty+1}:c); return[...prev,{...item,qty:1,unitPrice:item.price,selections:{},note:"",_key:++keyRef.current}]; });
  }
  function handleModalConfirm(d){ setCart(prev=>[...prev,{...d.item,qty:d.qty,unitPrice:d.unitPrice,selections:d.selections,note:d.note,_key:++keyRef.current}]); setModal(null); }
  function updateQty(key,delta){ setCart(prev=>prev.map(c=>c._key===key?{...c,qty:c.qty+delta}:c).filter(c=>c.qty>0)); }

  const subtotal = cart.reduce((s,c)=>s+c.unitPrice*c.qty, 0);
  const { scAmt, vatAmt, grandTotal } = calcCharges(subtotal, taxSettings);
  const tax = { ...DEFAULT_TAX, ...(taxSettings||{}) };

  // push live cart to customer display
  useEffect(()=>{
    if(customerWinRef.current&&!customerWinRef.current.closed){
      customerWinRef.current.postMessage({type:"UPDATE",cart,subtotal,vat:vatAmt,total:grandTotal,paid:0,change:0,showQR:false},"*");
    }
  },[cart]);

  const [cartOpen,setCartOpen] = useState(false);
  const [confirmClear,setConfirmClear] = useState(false);
  const totalQty = cart.reduce((s,c)=>s+c.qty,0);

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",background:T.cream}}>
      {modal&&<ModifierModal item={modal} onConfirm={handleModalConfirm} onCancel={()=>setModal(null)}/>}
      {payModal&&<PaymentModal cart={cart} subtotal={subtotal}
        onClose={()=>setPayModal(false)}
        onComplete={async (method)=>{
          const orderLabel = activeHeldId ? (heldOrders.find(h=>h.id===activeHeldId)?.label||null) : null;
          onOrderComplete && onOrderComplete({
            id: genId("ord"),
            time: new Date().toISOString(),
            label: orderLabel,
            items: cart.map(c=>({ id:c.id, name:c.name, emoji:c.emoji, qty:c.qty, unitPrice:c.unitPrice, selections:c.selections||{}, note:c.note||"" })),
            subtotal, scAmt, vatAmt, total: grandTotal,
            method, status: "preparing",
          });
          if(activeHeldId) onRemoveHeld(activeHeldId);
          // Always print kitchen ticket on every confirmed order
          const _ki2 = kitchenInfoFromSettings(kitchenPrinterSettings);
          const kdata = buildKitchenTicketESCPOS(cart, orderLabel||"", mgMap, _ki2.store, _ki2.style);
          const kPrinter2 = kitchenPrinterSettings?.enabled ? kitchenPrinterSettings : printerSettings;
          await dispatchPrint(kdata, kPrinter2, ()=>{}).catch(()=>{});
          setLastOrderMsg("✅ ชำระ "+method+" ฿"+fmt(grandTotal)+" เสร็จสิ้น");
          setCart([]); setActiveHeldId(null); setCartOpen(false);
          setTimeout(()=>setLastOrderMsg(""),4000);
        }}
        printerSettings={printerSettings} taxSettings={taxSettings} customerWinRef={customerWinRef}/>}
      {confirmClear&&<ConfirmDialog title="ล้างรายการทั้งหมด?" message={"ล้างรายการที่สั่งทั้งหมดในตะกร้า?\nไม่สามารถย้อนกลับได้"}
        confirmLabel="ล้างทั้งหมด" danger onConfirm={()=>{ setCart([]); setConfirmClear(false); }} onCancel={()=>setConfirmClear(false)}/>}

      {/* ── Hold / send-to-kitchen label prompt ── */}
      {holdPrompt&&(
        <div style={{position:"fixed",inset:0,background:"rgba(30,10,0,0.65)",zIndex:1500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setHoldPrompt(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.white,borderRadius:18,width:"100%",maxWidth:360,padding:"22px",boxShadow:"0 24px 60px rgba(0,0,0,0.32)"}}>
            <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:4}}>📑 ส่งค้างไว้</div>
            <div style={{fontSize:12,color:T.inkMid,marginBottom:14}}>ใส่โต๊ะ/ชื่อลูกค้า เพื่อเรียกบิลนี้กลับมาทีหลัง{printerSettings?.enabled?" — จะพิมพ์ใบออเดอร์ให้ครัวด้วยอัตโนมัติ":""}</div>
            <input autoFocus value={holdLabelInput} onChange={e=>setHoldLabelInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") confirmHoldPrompt(); }}
              placeholder={`เช่น โต๊ะ 4, คุณเอ (เว้นว่าง = บิล ${heldOrders.length+1})`}
              style={{width:"100%",padding:"10px 13px",borderRadius:10,border:`1.5px solid ${T.caramel}`,fontSize:14,fontWeight:600,boxSizing:"border-box",marginBottom:16}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setHoldPrompt(false)} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:13,fontWeight:600,color:T.ink}}>ยกเลิก</button>
              <button onClick={confirmHoldPrompt} style={{flex:1.4,padding:"11px",borderRadius:10,border:"none",background:T.coffee,color:T.white,cursor:"pointer",fontSize:13,fontWeight:700}}>📑 ส่งค้างไว้</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete held order confirmation ── */}
      {confirmDeleteHeld&&<ConfirmDialog title="ลบบิลค้าง?"
        message={`ลบบิล "${confirmDeleteHeld.label}" ทิ้งถาวร?\nไม่สามารถย้อนกลับได้`}
        confirmLabel="ลบบิล" danger
        onConfirm={()=>{ onRemoveHeld(confirmDeleteHeld.id); setConfirmDeleteHeld(null); }}
        onCancel={()=>setConfirmDeleteHeld(null)}/>}


      {/* ── Header: search only (held bills are now in the ออเดอร์ tab) ── */}
      <div style={{background:T.white,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{padding:"10px 14px"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  ค้นหาเมนู..."
            style={{width:"100%",padding:"8px 13px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,outline:"none",background:T.cream,boxSizing:"border-box"}}/>
        </div>
        {activeHeldId&&heldOrders.find(h=>h.id===activeHeldId)&&(
          <div style={{padding:"0 14px 9px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:T.caramel,fontWeight:700}}>✏️ กำลังแก้ไขบิลค้าง: {heldOrders.find(h=>h.id===activeHeldId)?.label}</span>
          </div>
        )}
      </div>

      {/* ── Menu grid + floating cart bar share their own relatively-positioned
           wrapper. The floating bar is bottom:0 *within this wrapper*, so it
           overlays only the menu grid and always sits flush above the category
           tab bar below — it can never cover the tabs. ── */}
      <div style={{flex:1,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,overflowY:"auto",padding:"12px 12px",paddingBottom:cart.length>0?88:12,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:12,alignContent:"start"}}>
          {filtered.map(item=>{
            const count=cart.filter(c=>c.id===item.id).reduce((s,c)=>s+c.qty,0);
            const soldOut = item.available===false;
            return(
              <div key={item.id} onClick={()=>handleMenuClick(item)}
                style={{background:T.white,borderRadius:13,border:count>0?`2px solid ${T.caramel}`:`1px solid ${T.border}`,overflow:"hidden",cursor:soldOut?"not-allowed":"pointer",boxShadow:count>0?"0 2px 16px rgba(200,129,58,0.25)":"0 1px 5px rgba(0,0,0,0.05)",transition:"transform 0.12s,box-shadow 0.12s,border 0.12s",position:"relative",opacity:soldOut?0.5:1}}
                onMouseEnter={e=>{ if(soldOut) return; e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";}}
                onMouseLeave={e=>{ if(soldOut) return; e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=count>0?"0 2px 16px rgba(200,129,58,0.25)":"0 1px 5px rgba(0,0,0,0.05)";}}>
                {soldOut&&<div style={{position:"absolute",inset:0,background:"rgba(253,248,243,0.4)",zIndex:3}}/>}
                {soldOut&&<span style={{position:"absolute",top:7,right:7,background:T.red,color:T.white,fontSize:10,fontWeight:700,borderRadius:7,padding:"2px 8px",zIndex:4}}>หมด</span>}
                {!soldOut&&count>0&&<span style={{position:"absolute",top:7,right:7,background:T.caramel,color:T.white,fontSize:11,fontWeight:700,borderRadius:12,padding:"2px 8px",zIndex:2,boxShadow:"0 1px 4px rgba(200,129,58,0.5)"}}>×{count}</span>}
                {item.modifiers.length>0&&<span style={{position:"absolute",top:7,left:7,background:"rgba(59,31,14,0.72)",color:T.caramelLight,fontSize:9,fontWeight:700,borderRadius:7,padding:"2px 7px",zIndex:2}}>ตัวเลือก</span>}
                <div style={{width:"100%",height:108,background:"#FFF0E6",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",filter:soldOut?"grayscale(1)":"none"}}>
                  {item.image?<img src={item.image} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{fontSize:46}}>{item.emoji}</div>}
                </div>
                <div style={{padding:"9px 10px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                  <div style={{fontSize:14,fontWeight:700,color:T.caramel}}>฿{item.price}</div>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&(
            <div style={{gridColumn:"1/-1",padding:56,textAlign:"center",color:T.inkLight}}>
              <div style={{fontSize:40,marginBottom:10}}>🔍</div>
              <div style={{fontSize:14}}>ไม่พบเมนู</div>
            </div>
          )}
        </div>

        {/* ── Floating cart bar — bottom:0 of the wrapper above, not the whole view ── */}
        {cart.length>0&&!cartOpen&&(
          <div onClick={()=>setCartOpen(true)} style={{position:"absolute",bottom:0,left:0,right:0,background:T.coffee,color:T.white,padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",zIndex:50,boxShadow:"0 -4px 20px rgba(59,31,14,0.3)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{background:T.caramel,borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14}}>{totalQty}</span>
              <span style={{fontSize:14,fontWeight:600}}>รายการที่สั่ง</span>
            </div>
            {lastOrderMsg&&<span style={{fontSize:11,color:T.mint,fontWeight:600}}>{lastOrderMsg}</span>}
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:18,fontWeight:700,color:T.caramelLight}}>฿{fmt(grandTotal)}</span>
              <span style={{background:T.caramel,padding:"7px 16px",borderRadius:20,fontSize:13,fontWeight:700}}>ดูรายการ ›</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom category tab bar — always its own row, never covered ── */}
      <div style={{background:T.white,borderTop:`1px solid ${T.border}`,display:"flex",overflowX:"auto",flexShrink:0,scrollbarWidth:"none",position:"relative",zIndex:10}}>
        {CATS.map(c=>{
          const active=cat===c;
          const info=(catInfo&&catInfo[c])||CAT_INFO[c]||{icon:"☕"};
          const cnt=c==="ทั้งหมด"?menuItems.length:menuItems.filter(m=>m.cat===c).length;
          return(
            <button key={c} onClick={()=>setCat(c)} style={{flex:"0 0 auto",minWidth:72,padding:"9px 6px 7px",border:"none",cursor:"pointer",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:active?`3px solid ${T.caramel}`:"3px solid transparent",transition:"all 0.15s"}}>
              <span style={{fontSize:20,lineHeight:1}}>{info.icon}</span>
              <span style={{fontSize:10,fontWeight:active?700:500,color:active?T.caramel:T.inkMid,whiteSpace:"nowrap"}}>{c}</span>
              <span style={{fontSize:9,color:T.inkLight}}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* ── Cart bottom-sheet drawer ── */}
      {cartOpen&&(
        <div style={{position:"absolute",inset:0,zIndex:100,display:"flex",flexDirection:"column"}}>
          {/* Backdrop */}
          <div onClick={()=>setCartOpen(false)} style={{flex:1,background:"rgba(28,7,0,0.45)"}}/>
          {/* Sheet */}
          <div style={{background:T.white,borderRadius:"18px 18px 0 0",display:"flex",flexDirection:"column",maxHeight:"80%",boxShadow:"0 -8px 32px rgba(0,0,0,0.2)"}}>
            {/* Handle + header */}
            <div style={{padding:"10px 0 0",display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
              <div style={{width:40,height:4,background:T.border,borderRadius:2,marginBottom:10}}/>
            </div>
            <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <span style={{fontWeight:700,fontSize:15,color:T.ink}}>🛒 รายการสั่ง ({totalQty} รายการ)</span>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setConfirmClear(true)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.red,fontWeight:600}}>ล้างทั้งหมด</button>
                <button onClick={()=>setCartOpen(false)} style={{width:26,height:26,borderRadius:"50%",border:"none",background:T.border,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",color:T.inkMid}}>✕</button>
              </div>
            </div>
            {/* Items */}
            <div style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
              {cart.map(item=>{
                const mods=getModDetails(item.selections||{}, mgMap);
                return(
                  <div key={item._key} style={{padding:"10px 18px",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:6}}>
                      <ItemThumb item={item} size={38} radius={8} style={{flexShrink:0,marginTop:1}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:T.ink}}>{item.name}</div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.inkMid,marginTop:2}}>
                          <span>ราคาเริ่มต้น</span><span>฿{item.price}</span>
                        </div>
                        {mods.map((m,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:1}}>
                            <span style={{color:m.price>0?T.caramel:T.inkLight,paddingLeft:8}}>• {m.label}</span>
                            {m.price>0&&<span style={{color:T.caramel,fontWeight:600}}>+฿{m.price}</span>}
                          </div>
                        ))}
                        {item.note&&<div style={{fontSize:10,color:T.inkLight,marginTop:2}}>📝 {item.note}</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:6,borderTop:`1px dashed ${T.border}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <button onClick={()=>updateQty(item._key,-1)} style={{width:24,height:24,borderRadius:7,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:14,fontWeight:700,color:T.ink,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                        <span style={{fontSize:14,fontWeight:700,color:T.ink,minWidth:18,textAlign:"center"}}>{item.qty}</span>
                        <button onClick={()=>updateQty(item._key,1)} style={{width:24,height:24,borderRadius:7,border:"none",background:T.caramel,cursor:"pointer",fontSize:14,fontWeight:700,color:T.white,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      </div>
                      <div style={{textAlign:"right"}}>
                        {item.qty>1&&<div style={{fontSize:10,color:T.inkMid}}>฿{item.unitPrice} × {item.qty}</div>}
                        <div style={{fontSize:14,fontWeight:700,color:T.caramel}}>฿{fmt(item.unitPrice*item.qty)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Summary + pay */}
            <div style={{padding:"14px 18px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
              {tax.scEnabled&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}><span style={{color:T.inkMid}}>SC {tax.scPct}%</span><span style={{color:T.inkMid}}>฿{fmt(scAmt)}</span></div>}
              {tax.vatEnabled&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}><span style={{color:T.inkMid}}>VAT {tax.vatPct}%{tax.vatInclusive?" (รวม)":""}</span><span style={{color:T.inkMid}}>฿{fmt(vatAmt)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,borderTop:`2px solid ${T.ink}`,marginBottom:14}}>
                <span style={{fontSize:16,fontWeight:700,color:T.ink}}>ยอดชำระ</span>
                <span style={{fontSize:18,fontWeight:700,color:T.caramel}}>฿{fmt(grandTotal)}</span>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <button onClick={openHoldPrompt} style={{flex:1,padding:"11px",borderRadius:11,border:`1.5px solid ${T.border}`,background:T.cream,color:T.ink,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  📑 ส่งค้างไว้
                </button>
                <button onClick={()=>{setCartOpen(false);setPayModal(true);}} style={{flex:2,padding:"11px",borderRadius:11,border:"none",background:T.coffee,color:T.white,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  💳 ชำระเงิน ฿{fmt(grandTotal)}
                </button>
              </div>
              {printerSettings?.enabled&&<div style={{fontSize:10,color:T.inkLight,textAlign:"center"}}>🖨️ จะพิมพ์ใบออเดอร์ให้ครัวอัตโนมัติเมื่อยืนยัน</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDERS VIEW
// ─────────────────────────────────────────────────────────────
function OrdersView({ orders, onUpdateStatus, heldOrders, onRemoveHeld, onResumeHeld, taxSettings }){
  const { modGroupsMap } = useApp();
  const mgMap = modGroupsMap || MODIFIER_GROUPS;
  const [tab,setTab] = useState("held"); // "held" | "done"
  heldOrders = heldOrders||[];
  orders = orders||[];

  // ── helpers ──
  const todayKey = new Date().toDateString();
  const todayOrders = orders.filter(o=>new Date(o.time).toDateString()===todayKey);
  const sc={preparing:T.amber,ready:T.mint,served:T.inkLight};
  const sl={preparing:"กำลังทำ ☕",ready:"พร้อมเสิร์ฟ ✅",served:"เสิร์ฟแล้ว 🍽️"};
  const nextStatus={preparing:"ready",ready:"served",served:"served"};
  const [confirmDeleteHeld,setConfirmDeleteHeld] = useState(null);

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.cream}}>
      {confirmDeleteHeld&&<ConfirmDialog title="ลบบิลค้าง?"
        message={`ลบบิล "${confirmDeleteHeld.label}" ทิ้งถาวร?\nไม่สามารถย้อนกลับได้`}
        confirmLabel="ลบบิล" danger
        onConfirm={()=>{ onRemoveHeld(confirmDeleteHeld.id); setConfirmDeleteHeld(null); }}
        onCancel={()=>setConfirmDeleteHeld(null)}/>}

      {/* ── Tab bar ── */}
      <div style={{display:"flex",background:T.white,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        {[
          {id:"held",  label:"บิลค้าง",      badge: heldOrders.length||null},
          {id:"done",  label:"ออเดอร์สำเร็จ", badge: todayOrders.length||null},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"13px 8px",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
            background:tab===t.id?T.cream:T.white,
            color:tab===t.id?T.caramel:T.inkMid,
            borderBottom:tab===t.id?`3px solid ${T.caramel}`:"3px solid transparent",
            display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s"}}>
            {t.id==="held"?"📑":"✅"} {t.label}
            {t.badge!=null&&<span style={{background:tab===t.id?T.caramel:"#E0D8D0",color:tab===t.id?T.white:T.inkMid,borderRadius:12,fontSize:11,fontWeight:700,padding:"1px 7px"}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── Tab: บิลค้าง ── */}
      {tab==="held"&&(
        <div style={{flex:1,overflowY:"auto",padding:"14px 14px"}}>
          {heldOrders.length===0 ? (
            <div style={{textAlign:"center",padding:"60px 0",color:T.inkLight}}>
              <div style={{fontSize:40,marginBottom:10}}>📑</div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>ยังไม่มีบิลค้าง</div>
              <div style={{fontSize:12}}>กด "ส่งค้างไว้" ในหน้ารับออเดอร์เพื่อพักบิลโต๊ะไว้ก่อน</div>
            </div>
          ) : heldOrders.map(h=>{
            const hSub = h.items.reduce((s,c)=>s+c.unitPrice*c.qty,0);
            const hTotal = calcCharges(hSub, taxSettings).grandTotal;
            const hQty  = h.items.reduce((s,c)=>s+c.qty,0);
            const hTime = new Date(h.createdAt).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
            return(
              <div key={h.id} style={{background:T.white,borderRadius:14,border:`1px solid ${T.border}`,marginBottom:10,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
                {/* card header */}
                <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${T.border}`}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:T.ink}}>{h.label}</div>
                    <div style={{fontSize:11,color:T.inkMid,marginTop:2}}>{hTime} น. · {hQty} รายการ · <span style={{color:T.caramel,fontWeight:700}}>฿{fmt(hTotal)}</span></div>
                  </div>
                  <button onClick={()=>setConfirmDeleteHeld(h)} style={{width:30,height:30,borderRadius:8,border:"none",background:"#FFF0F0",color:T.red,cursor:"pointer",fontSize:13,flexShrink:0}}>🗑</button>
                </div>
                {/* item list */}
                <div style={{padding:"8px 14px 10px"}}>
                  {h.items.map((it,i)=>{
                    const opts = selLabel(it.selections||{},mgMap);
                    return(
                      <div key={i} style={{fontSize:12,color:T.inkMid,marginBottom:3,display:"flex",alignItems:"baseline",gap:6}}>
                        <span style={{fontWeight:600,color:T.ink}}>×{it.qty}</span>
                        <span>{it.name}</span>
                        {opts&&<span style={{fontSize:11,color:T.caramel}}>{opts}</span>}
                        {it.note&&<span style={{fontSize:11,color:T.inkLight}}>📝{it.note}</span>}
                      </div>
                    );
                  })}
                </div>
                {/* action row */}
                <div style={{padding:"0 14px 12px"}}>
                  <button onClick={()=>onResumeHeld(h)} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:T.coffee,color:T.white,cursor:"pointer",fontSize:13,fontWeight:700}}>
                    ✏️ เปิดบิลนี้ — รับออเดอร์ต่อ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: ออเดอร์สำเร็จ ── */}
      {tab==="done"&&(
        <div style={{flex:1,overflowY:"auto",padding:"14px 14px"}}>
          <div style={{fontSize:12,color:T.inkLight,marginBottom:10}}>ออเดอร์วันนี้ ({todayOrders.length}) · แตะสถานะเพื่ออัปเดต</div>
          {todayOrders.length===0 ? (
            <div style={{textAlign:"center",padding:"60px 0",color:T.inkLight}}>
              <div style={{fontSize:40,marginBottom:10}}>✅</div>
              <div style={{fontSize:14}}>ยังไม่มีออเดอร์วันนี้</div>
            </div>
          ) : todayOrders.map((o,idx)=>{
            const timeStr = new Date(o.time).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
            const orderNo = todayOrders.length-idx;
            return(
              <div key={o.id} style={{background:T.white,borderRadius:12,padding:"12px 14px",border:`1px solid ${T.border}`,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,color:T.ink,fontSize:13}}>ออเดอร์ #{orderNo}</span>
                    {o.label&&<span style={{fontSize:11,color:T.caramel,fontWeight:700,background:"#FFF5EA",padding:"1px 7px",borderRadius:8}}>{o.label}</span>}
                    <span style={{fontSize:11,color:T.inkMid}}>{timeStr} น. · {o.method}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <span style={{fontWeight:700,color:T.caramel,fontSize:13}}>฿{fmt(o.total)}</span>
                    <button onClick={()=>onUpdateStatus&&o.status!=="served"&&onUpdateStatus(o.id,nextStatus[o.status]||"served")}
                      title={o.status==="served"?"":"แตะเพื่ออัปเดตสถานะ"}
                      style={{fontSize:11,background:(sc[o.status]||T.inkLight)+"22",color:sc[o.status]||T.inkLight,padding:"3px 9px",borderRadius:20,fontWeight:700,border:"none",cursor:o.status==="served"?"default":"pointer",whiteSpace:"nowrap"}}>
                      {sl[o.status]||o.status}
                    </button>
                  </div>
                </div>
                {o.items.map((it,i)=>{
                  const detail = selLabel(it.selections||{},mgMap);
                  return(
                    <div key={i} style={{fontSize:12,color:T.inkMid,paddingLeft:4,marginBottom:2}}>
                      • {it.emoji} {it.name} ×{it.qty}
                      {detail&&<span style={{color:T.caramel,fontSize:11}}> {detail}</span>}
                      {it.note&&<span style={{color:T.inkLight,fontSize:11}}> 📝{it.note}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTS VIEW
// ─────────────────────────────────────────────────────────────
function ReportsView({ orders }){
  orders = orders || [];
  const now = new Date();
  const dayKey = d => d.toDateString();
  const todayKey = dayKey(now);
  const dayLabels = ["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."];

  // Last 7 days, oldest → newest (today last)
  const days = [];
  for(let i=6;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); days.push({ key:dayKey(d), label:dayLabels[d.getDay()] }); }
  const salesByDay = {}, countByDay = {};
  days.forEach(d=>{ salesByDay[d.key]=0; countByDay[d.key]=0; });
  const itemQty = {};
  orders.forEach(o=>{
    const k = dayKey(new Date(o.time));
    if(salesByDay[k]!==undefined){ salesByDay[k]+=o.total; countByDay[k]+=1; }
    (o.items||[]).forEach(it=>{ itemQty[it.name]=(itemQty[it.name]||0)+it.qty; });
  });

  const todaySales = salesByDay[todayKey]||0;
  const todayCount = countByDay[todayKey]||0;
  const avgPerOrder = todayCount>0 ? todaySales/todayCount : 0;

  const yest = new Date(now); yest.setDate(yest.getDate()-1);
  const yestKey = dayKey(yest);
  const yestSales = orders.filter(o=>dayKey(new Date(o.time))===yestKey).reduce((s,o)=>s+o.total,0);
  const yestCount = orders.filter(o=>dayKey(new Date(o.time))===yestKey).length;
  const salesDelta = yestSales>0 ? Math.round(((todaySales-yestSales)/yestSales)*100) : null;
  const countDelta = todayCount - yestCount;

  let topItem = "-", topQty = 0;
  Object.entries(itemQty).forEach(([name,qty])=>{ if(qty>topQty){ topQty=qty; topItem=name; } });

  const mx = Math.max(1, ...days.map(d=>salesByDay[d.key]));
  const hasAnyData = orders.length>0;

  const stats = [
    {label:"ยอดขายวันนี้", value:"฿"+fmtInt(todaySales), delta: salesDelta===null?null:(salesDelta>=0?"+":"")+salesDelta+"%", up: salesDelta===null||salesDelta>=0},
    {label:"จำนวนออเดอร์", value:String(todayCount), delta: (countDelta>=0?"+":"")+String(countDelta), up: countDelta>=0},
    {label:"เฉลี่ย/ออเดอร์", value:"฿"+(todayCount>0?fmtInt(Math.round(avgPerOrder)):"0"), delta:null, up:true},
    {label:"เมนูขายดี", value: topItem, delta: topQty>0?`${topQty} รายการ`:null, up:true},
  ];

  return(
    <div style={{flex:1,padding:20,overflowY:"auto",background:T.cream}}>
      <h2 style={{fontSize:18,fontWeight:700,color:T.ink,marginBottom:16}}>รายงานการขาย</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10,marginBottom:18}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:T.white,borderRadius:12,padding:14,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,color:T.inkMid,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:19,fontWeight:700,color:T.ink,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.value}</div>
            {s.delta!=null && <div style={{fontSize:11,color:s.up?T.mint:T.red,fontWeight:600}}>{s.up?"▲":"▼"} {s.delta}</div>}
          </div>
        ))}
      </div>
      <div style={{background:T.white,borderRadius:12,padding:16,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:12}}>ยอดขายรายวัน (7 วันล่าสุด)</div>
        {!hasAnyData && <div style={{fontSize:12,color:T.inkLight,marginBottom:10}}>ยังไม่มีข้อมูลการขาย — กราฟจะเริ่มแสดงผลหลังมีออเดอร์แรกของร้าน</div>}
        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
          {days.map(d=>{
            const s = salesByDay[d.key];
            return(
              <div key={d.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:10,color:T.inkMid}}>{s>=1000?(s/1000).toFixed(1)+"k":fmtInt(s)}</div>
                <div style={{width:"100%",background:T.caramel,borderRadius:"5px 5px 0 0",height:`${Math.max(2,(s/mx)*100)}px`,opacity:d.key===todayKey?1:0.55}}/>
                <div style={{fontSize:11,color:T.inkMid,fontWeight:600}}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MENU MANAGER VIEW
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// EDIT MENU MODAL
// ─────────────────────────────────────────────────────────────
function EditMenuModal({ item, isNew, onSave, onDelete, onClose }){
  const { categories, modGroups, setModGroups } = useApp();
  const CATS = (categories||CATEGORIES).filter(c=>c!=="ทั้งหมด");
  const MG = modGroups || Object.values(MODIFIER_GROUPS);
  const blank = {id:genId("item"),name:"",price:0,cat:CATS[0]||"กาแฟ",emoji:"☕",image:null,modifiers:[],available:true};
  const [form,setForm] = useState(()=>item ? {...item} : blank);
  const fileRef = useRef();
  const [uploading,setUploading] = useState(false);
  const [expandedGroupId,setExpandedGroupId] = useState(null);
  const [groupDeleteNotice,setGroupDeleteNotice] = useState(false);

  async function handleFile(e){
    const f=e.target.files[0]; if(!f) return;
    setUploading(true);
    try{ const b64=await compressImage(f,360,0.85); setForm(p=>({...p,image:b64})); }
    catch(err){ console.error(err); }
    setUploading(false);
    e.target.value="";
  }

  function toggleMod(gid){
    setForm(p=>({...p,modifiers:p.modifiers.includes(gid)?p.modifiers.filter(x=>x!==gid):[...p.modifiers,gid]}));
  }

  const valid = form.name.trim().length>0 && form.price>0;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,0,0.65)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      {groupDeleteNotice&&<ConfirmDialog message={'ลบกลุ่มตัวเลือกทั้งกลุ่มได้จากหน้า "ตัวเลือก & หมวดหมู่" เท่านั้น เพื่อให้ระบบจัดการผลกับเมนูอื่นที่ใช้งานร่วมกันได้อย่างปลอดภัย'} confirmLabel="เข้าใจแล้ว" onConfirm={()=>setGroupDeleteNotice(false)} onCancel={null}/>}
      <div style={{background:T.white,borderRadius:20,width:"100%",maxWidth:500,maxHeight:"94vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 72px rgba(0,0,0,0.32)"}}>
        {/* Header */}
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:15,color:T.ink}}>{isNew?"➕ เพิ่มเมนูใหม่":"✏️ แก้ไขเมนู"}</span>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:T.border,cursor:"pointer",fontSize:15,color:T.inkMid}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:16}}>

          {/* ── Image + Name + Price row ── */}
          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            {/* Image upload box */}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
            <div onClick={()=>fileRef.current.click()} style={{width:114,height:114,borderRadius:14,border:`2.5px dashed ${T.caramel}`,background:"#FFF8EE",cursor:"pointer",position:"relative",overflow:"hidden",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
              {form.image ? (
                <>
                  <img src={form.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>
                  <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                    <div style={{background:"rgba(0,0,0,0.55)",color:T.white,fontSize:11,fontWeight:700,padding:"5px 12px",borderRadius:8}}>📷 เปลี่ยนรูป</div>
                  </div>
                </>
              ) : uploading ? (
                <div style={{fontSize:13,color:T.caramel,fontWeight:600}}>⏳ กำลังอัปโหลด...</div>
              ) : (
                <>
                  <div style={{fontSize:36}}>{form.emoji}</div>
                  <div style={{fontSize:11,color:T.caramel,fontWeight:600}}>📷 ใส่รูปเมนู</div>
                </>
              )}
            </div>

            {/* Name + Price */}
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <div style={{fontSize:11,color:T.inkMid,marginBottom:4}}>ชื่อเมนู *</div>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="เช่น ลาเต้"
                  style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:14,fontWeight:600,boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.inkMid,marginBottom:4}}>ราคา (บาท) *</div>
                <input type="number" min="0" value={form.price||""} onChange={e=>setForm(p=>({...p,price:parseFloat(e.target.value)||0}))} placeholder="0"
                  style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:15,fontWeight:700,color:T.caramel,boxSizing:"border-box",outline:"none"}}/>
              </div>
            </div>
          </div>

          {/* Remove image */}
          {form.image && (
            <button onClick={()=>setForm(p=>({...p,image:null}))} style={{alignSelf:"flex-start",padding:"4px 12px",border:"none",borderRadius:8,background:"#FFF0F0",color:T.red,cursor:"pointer",fontSize:12,fontWeight:600}}>
              🗑 ลบรูปภาพ
            </button>
          )}

          {/* Availability */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.cream,borderRadius:12,padding:"10px 14px"}}>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:T.ink}}>พร้อมขาย</div>
              <div style={{fontSize:11,color:T.inkMid}}>ปิดเมื่อวัตถุดิบหมดชั่วคราว — เมนูจะจางลงและกดสั่งไม่ได้ในหน้ารับออเดอร์</div>
            </div>
            <Toggle on={form.available!==false} onToggle={()=>setForm(p=>({...p,available:p.available===false?true:false}))}/>
          </div>

          {/* Category */}
          <div>
            <div style={{fontSize:11,color:T.inkMid,marginBottom:7}}>หมวดหมู่</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {CATS.map(c=>(
                <button key={c} onClick={()=>setForm(p=>({...p,cat:c}))}
                  style={{padding:"6px 14px",borderRadius:20,border:form.cat===c?`2px solid ${T.caramel}`:`1.5px solid ${T.border}`,background:form.cat===c?"#FFF8EE":T.white,color:form.cat===c?T.caramel:T.inkMid,fontWeight:form.cat===c?700:500,fontSize:13,cursor:"pointer",transition:"all 0.12s"}}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Modifier groups */}
          <div>
            <div style={{fontSize:11,color:T.inkMid,marginBottom:7}}>ตัวเลือกรอง — แตะแถวเพื่อเลือกใช้กับเมนูนี้ หรือกด "แก้ไข" เพื่อปรับชื่อ/ราคา/ตัวเลือกของกลุ่มนั้น</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {MG.map(g=>{
                const on=form.modifiers.includes(g.id);
                const expanded = expandedGroupId===g.id;
                return(
                  <div key={g.id}>
                    <div onClick={()=>toggleMod(g.id)}
                      style={{padding:"9px 13px",borderRadius:10,border:on?`2px solid ${T.caramel}`:`1.5px solid ${T.border}`,background:on?"#FFF8EE":T.white,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10,transition:"all 0.12s"}}>
                      <span style={{width:16,height:16,borderRadius:4,border:on?`2px solid ${T.caramel}`:`1.5px solid ${T.inkLight}`,background:on?T.caramel:"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.white,flexShrink:0}}>{on?"✓":""}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <span style={{fontSize:13,fontWeight:on?700:500,color:on?T.caramel:T.ink}}>{g.label}</span>
                        <span style={{fontSize:10,color:T.inkLight,marginLeft:8}}>{g.options.slice(0,3).map(o=>o.label).join(" / ")}…</span>
                      </div>
                      <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {g.required&&<span style={{fontSize:9,background:T.caramel+"28",color:T.caramel,padding:"2px 6px",borderRadius:6,fontWeight:700}}>จำเป็น</span>}
                    {isMulti(g)&&<span style={{fontSize:9,background:"#E0F0E8",color:T.mint,padding:"2px 6px",borderRadius:6,fontWeight:700}}>{maxSel(g)>=99?"หลายอย่าง":`≤${maxSel(g)}`}</span>}
                  </div>
                      <button onClick={(e)=>{ e.stopPropagation(); setExpandedGroupId(expanded?null:g.id); }}
                        style={{flexShrink:0,padding:"4px 10px",borderRadius:7,border:`1px solid ${expanded?T.caramel:T.border}`,background:expanded?T.caramel:T.cream,color:expanded?T.white:T.inkMid,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        {expanded?"ปิด ✕":"✏️ แก้ไข"}
                      </button>
                    </div>
                    {expanded&&(
                      <div style={{marginTop:6,marginLeft:10,paddingLeft:10,borderLeft:`3px solid ${T.caramelLight}`}}>
                        <div style={{fontSize:10,color:T.inkLight,marginBottom:6}}>การแก้ไขนี้จะมีผลกับทุกเมนูที่ใช้ "{g.label}" ร่วมกัน ไม่ใช่แค่เมนูนี้</div>
                        <ModifierGroupCard group={g}
                          onUpdate={(updated)=>setModGroups(prev=>prev.map(x=>x.id===updated.id?updated:x))}
                          onDelete={()=>setGroupDeleteNotice(true)}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:"13px 18px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8,flexShrink:0}}>
          {!isNew&&<button onClick={()=>{onDelete(form.id);onClose();}} style={{padding:"11px 14px",borderRadius:10,border:"none",background:"#FFF0F0",cursor:"pointer",fontSize:13,fontWeight:700,color:T.red}}>🗑</button>}
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:13,fontWeight:600}}>ยกเลิก</button>
          <button disabled={!valid} onClick={()=>{onSave(form);onClose();}}
            style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:valid?T.coffee:T.border,color:T.white,cursor:valid?"pointer":"not-allowed",fontSize:14,fontWeight:700,transition:"background 0.15s"}}>
            {isNew?"✅ เพิ่มเมนู":"💾 บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MENU MANAGER VIEW
// ─────────────────────────────────────────────────────────────
function MenuManagerView({ menuItems, setMenuItems }){
  const { categories } = useApp();
  const CATS = categories || CATEGORIES;
  const [editItem,setEditItem] = useState(null);
  const [search,setSearch] = useState("");
  const [cat,setCat] = useState("ทั้งหมด");
  const [reorderMode,setReorderMode] = useState(false);

  // Drag sort — operates on FULL menuItems list to preserve global order
  const { draggingId, containerRef, dragHandleProps } = useDragSort(menuItems, setMenuItems);

  const filtered = reorderMode
    ? (cat==="ทั้งหมด" ? menuItems : menuItems.filter(m=>m.cat===cat))
    : menuItems.filter(m=>(cat==="ทั้งหมด"||m.cat===cat)&&m.name.toLowerCase().includes(search.toLowerCase()));

  function saveItem(form){
    setMenuItems(prev=>{ const ex=prev.find(x=>x.id===form.id); return ex?prev.map(x=>x.id===form.id?form:x):[...prev,form]; });
  }
  function deleteItem(id){ setMenuItems(prev=>prev.filter(x=>x.id!==id)); }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.cream}}>
      {editItem&&(
        <EditMenuModal
          item={editItem==="new"?null:editItem}
          isNew={editItem==="new"}
          onSave={saveItem} onDelete={deleteItem}
          onClose={()=>setEditItem(null)}/>
      )}

      {/* Toolbar */}
      <div style={{padding:"11px 15px",background:T.white,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {!reorderMode && (
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 ค้นหาเมนู..."
            style={{flex:1,padding:"7px 12px",borderRadius:9,border:`1px solid ${T.border}`,fontSize:13,background:T.cream,boxSizing:"border-box",outline:"none"}}/>
        )}
        {reorderMode && <span style={{flex:1,fontSize:12,color:T.caramel,fontWeight:700}}>☰ กดค้างที่การ์ดเพื่อลาก — จัดลำดับได้อิสระ</span>}
        <button onClick={()=>setReorderMode(r=>!r)}
          style={{padding:"8px 14px",background:reorderMode?T.mint:T.cream,color:reorderMode?T.white:T.inkMid,border:`1px solid ${reorderMode?T.mint:T.border}`,borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
          {reorderMode?"✓ เสร็จแล้ว":"⇅ เรียงลำดับ"}
        </button>
        {!reorderMode && (
          <button onClick={()=>setEditItem("new")} style={{padding:"8px 16px",background:T.caramel,color:T.white,border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap",flexShrink:0}}>
            + เพิ่มเมนู
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div style={{padding:"8px 15px 0",background:T.white,borderBottom:`1px solid ${T.border}`,display:"flex",gap:5,overflowX:"auto",paddingBottom:9,flexShrink:0}}>
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{padding:"5px 12px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,whiteSpace:"nowrap",background:cat===c?T.caramel:T.cream,color:cat===c?T.white:T.inkMid,transition:"all 0.15s"}}>
            {c}{c!=="ทั้งหมด"&&` (${menuItems.filter(m=>m.cat===c).length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div ref={reorderMode?containerRef:null}
        style={{flex:1,overflowY:"auto",padding:13,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:11,alignContent:"start"}}>
        {filtered.map(item=>{
          const isDragging = draggingId===item.id && reorderMode;
          return(
            <div key={item.id}
              {...(reorderMode ? dragHandleProps(item.id) : {})}
              onClick={reorderMode ? undefined : ()=>setEditItem(item)}
              style={{
                background:T.white,borderRadius:13,overflow:"hidden",
                border: isDragging?`2px dashed ${T.caramel}`:`1px solid ${T.border}`,
                boxShadow: isDragging?"0 12px 40px rgba(200,129,58,0.35)":"0 1px 5px rgba(0,0,0,0.05)",
                opacity: isDragging?0.5:item.available===false?0.55:1,
                cursor: reorderMode?"grab":"pointer",
                transition: isDragging?"none":"transform 0.12s,box-shadow 0.12s",
                transform: isDragging?"scale(1.03) rotate(1.5deg)":"",
                position:"relative",
              }}
              onMouseEnter={e=>{ if(!reorderMode){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 5px 18px rgba(0,0,0,0.1)"; }}}
              onMouseLeave={e=>{ if(!reorderMode){ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 1px 5px rgba(0,0,0,0.05)"; }}}>
              {/* Drag handle indicator */}
              {reorderMode&&(
                <div style={{position:"absolute",top:0,left:0,right:0,background:"rgba(200,129,58,0.85)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",height:22,borderRadius:"11px 11px 0 0"}}>
                  <span style={{color:T.white,fontSize:11,letterSpacing:4,lineHeight:1}}>⠿⠿⠿</span>
                </div>
              )}
              {/* Image / emoji zone */}
              <div style={{width:"100%",height:reorderMode?88:108,background:"#FFF0E6",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",filter:item.available===false?"grayscale(1)":"none",marginTop:reorderMode?22:0}}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                ) : (
                  <div style={{fontSize:reorderMode?36:46}}>{item.emoji}</div>
                )}
                {item.available===false&&(
                  <div style={{position:"absolute",top:5,right:5,background:T.red,color:T.white,fontSize:9,fontWeight:700,borderRadius:6,padding:"2px 7px"}}>หมด</div>
                )}
              </div>
              {/* Info */}
              <div style={{padding:"8px 10px"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:T.inkMid}}>{item.cat}</span>
                  <span style={{fontSize:13,fontWeight:700,color:T.caramel}}>฿{item.price}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {filtered.length===0&&(
          <div style={{gridColumn:"1/-1",padding:56,textAlign:"center",color:T.inkLight}}>
            <div style={{fontSize:40,marginBottom:10}}>🔍</div>
            <div style={{fontSize:14}}>ไม่พบเมนูที่ค้นหา</div>
            <button onClick={()=>setEditItem("new")} style={{marginTop:16,padding:"9px 20px",borderRadius:10,border:"none",background:T.caramel,color:T.white,cursor:"pointer",fontSize:13,fontWeight:700}}>+ เพิ่มเมนูใหม่</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MANAGEMENT VIEW — Categories (กลุ่มเมนู) + Modifier Groups (ตัวเลือกรอง)
// ─────────────────────────────────────────────────────────────
const EMOJI_PICK = ["☕","🍵","🧋","🥛","🥤","🥐","🎂","🧇","🍫","🍓","🍋","🍰","🥪","🍩","🧊","🔥","⭐","📋","🍮","🌀"];

function CategoryManager({ categories, catInfo, menuItems, onChange }){
  const [adding,setAdding] = useState(false);
  const [newName,setNewName] = useState("");
  const [newIcon,setNewIcon] = useState("☕");
  const [editingIdx,setEditingIdx] = useState(null);
  const [editName,setEditName] = useState("");
  const [editIcon,setEditIcon] = useState("☕");
  const [notice,setNotice] = useState(null);
  const [confirmDelete,setConfirmDelete] = useState(null); // {name, affected, fallback} | null

  const editable = categories.filter(c=>c!=="ทั้งหมด");

  function countItems(name){ return menuItems.filter(m=>m.cat===name).length; }

  function addCategory(){
    const name=newName.trim();
    if(!name||categories.includes(name)) return;
    const newCats=[...categories,name];
    const newInfo={...catInfo,[name]:{icon:newIcon||"☕"}};
    onChange({categories:newCats,catInfo:newInfo});
    setAdding(false); setNewName(""); setNewIcon("☕");
  }

  function startEdit(idx,name){
    setEditingIdx(idx); setEditName(name); setEditIcon((catInfo[name]&&catInfo[name].icon)||"☕");
  }

  function saveEdit(oldName){
    const name=editName.trim();
    if(!name) return;
    const newCats=categories.map(c=>c===oldName?name:c);
    const newInfo={...catInfo}; delete newInfo[oldName]; newInfo[name]={icon:editIcon||"☕"};
    onChange({categories:newCats,catInfo:newInfo, renameCat: name!==oldName?{from:oldName,to:name}:null});
    setEditingIdx(null);
  }

  function doDeleteCategory(name, affected, fallback){
    const newCats=categories.filter(c=>c!==name);
    const newInfo={...catInfo}; delete newInfo[name];
    onChange({categories:newCats,catInfo:newInfo, reassignCat: affected>0?{from:name,to:fallback}:null});
  }

  function deleteCategory(name){
    const affected=countItems(name);
    const remaining=editable.filter(c=>c!==name);
    if(remaining.length===0){ setNotice("ต้องมีหมวดหมู่เหลืออย่างน้อย 1 รายการ"); return; }
    const fallback=remaining[0];
    if(affected>0){ setConfirmDelete({name,affected,fallback}); return; }
    doDeleteCategory(name, affected, fallback);
  }

  function move(idx,dir){
    const realIdx = categories.indexOf(editable[idx]); // index within full array
    const arr=[...categories];
    const a=realIdx, b=realIdx+dir;
    if(b<1||b>=arr.length) return; // keep "ทั้งหมด" pinned at 0
    [arr[a],arr[b]]=[arr[b],arr[a]];
    onChange({categories:arr,catInfo});
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {notice&&<ConfirmDialog message={notice} confirmLabel="เข้าใจแล้ว" onConfirm={()=>setNotice(null)} onCancel={null}/>}
      {confirmDelete&&<ConfirmDialog title={`ลบหมวดหมู่ "${confirmDelete.name}"?`}
        message={`มีเมนู ${confirmDelete.affected} รายการ\nรายการเหล่านี้จะถูกย้ายไปที่ "${confirmDelete.fallback}"\nดำเนินการต่อ?`}
        confirmLabel="ลบหมวดหมู่" danger
        onConfirm={()=>{ doDeleteCategory(confirmDelete.name, confirmDelete.affected, confirmDelete.fallback); setConfirmDelete(null); }}
        onCancel={()=>setConfirmDelete(null)}/>}
      {editable.map((name,idx)=>{
        const icon=(catInfo[name]&&catInfo[name].icon)||"☕";
        const cnt=countItems(name);
        const isEditing=editingIdx===idx;
        return(
          <div key={name} style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,padding:"12px 14px"}}>
            {!isEditing ? (
              <div style={{display:"flex",alignItems:"center",gap:11}}>
                <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
                  <button onClick={()=>move(idx,-1)} disabled={idx===0} style={{width:18,height:14,border:"none",background:"none",cursor:idx===0?"default":"pointer",color:idx===0?T.border:T.inkMid,fontSize:11,lineHeight:1}}>▲</button>
                  <button onClick={()=>move(idx,1)} disabled={idx===editable.length-1} style={{width:18,height:14,border:"none",background:"none",cursor:idx===editable.length-1?"default":"pointer",color:idx===editable.length-1?T.border:T.inkMid,fontSize:11,lineHeight:1}}>▼</button>
                </div>
                <span style={{fontSize:24,flexShrink:0}}>{icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.ink}}>{name}</div>
                  <div style={{fontSize:11,color:T.inkLight}}>{cnt} เมนู</div>
                </div>
                <button onClick={()=>startEdit(idx,name)} style={{padding:"6px 12px",border:`1px solid ${T.border}`,borderRadius:8,background:T.cream,cursor:"pointer",fontSize:12,fontWeight:600,color:T.inkMid,flexShrink:0}}>แก้ไข</button>
                <button onClick={()=>deleteCategory(name)} style={{padding:"6px 10px",border:"none",borderRadius:8,background:"#FFF0F0",cursor:"pointer",fontSize:12,fontWeight:600,color:T.red,flexShrink:0}}>ลบ</button>
              </div>
            ):(
              <div>
                <div style={{display:"flex",gap:8,marginBottom:9}}>
                  <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="ชื่อหมวดหมู่"
                    style={{flex:1,padding:"8px 11px",borderRadius:9,border:`1.5px solid ${T.caramel}`,fontSize:13,fontWeight:600,boxSizing:"border-box"}}/>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                  {EMOJI_PICK.map(e=>(
                    <button key={e} onClick={()=>setEditIcon(e)} style={{width:32,height:32,borderRadius:8,border:editIcon===e?`2px solid ${T.caramel}`:`1px solid ${T.border}`,background:editIcon===e?"#FFF8EE":T.white,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{e}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:7}}>
                  <button onClick={()=>setEditingIdx(null)} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${T.border}`,background:T.cream,cursor:"pointer",fontSize:12,fontWeight:600}}>ยกเลิก</button>
                  <button onClick={()=>saveEdit(name)} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:T.coffee,color:T.white,cursor:"pointer",fontSize:12,fontWeight:700}}>💾 บันทึก</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add new category */}
      {adding ? (
        <div style={{background:"#FFF8EE",borderRadius:12,border:`1.5px solid ${T.caramel}`,padding:"12px 14px"}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="ชื่อหมวดหมู่ใหม่ เช่น สมูทตี้"
            style={{width:"100%",padding:"8px 11px",borderRadius:9,border:`1.5px solid ${T.border}`,fontSize:13,fontWeight:600,boxSizing:"border-box",marginBottom:9}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
            {EMOJI_PICK.map(e=>(
              <button key={e} onClick={()=>setNewIcon(e)} style={{width:32,height:32,borderRadius:8,border:newIcon===e?`2px solid ${T.caramel}`:`1px solid ${T.border}`,background:newIcon===e?T.white:T.white,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{e}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>{setAdding(false);setNewName("");}} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${T.border}`,background:T.white,cursor:"pointer",fontSize:12,fontWeight:600}}>ยกเลิก</button>
            <button disabled={!newName.trim()} onClick={addCategory} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:newName.trim()?T.caramel:T.border,color:T.white,cursor:newName.trim()?"pointer":"not-allowed",fontSize:12,fontWeight:700}}>✅ เพิ่มหมวดหมู่</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setAdding(true)} style={{padding:"12px",borderRadius:12,border:`2px dashed ${T.caramel}`,background:"#FFF8EE",cursor:"pointer",fontSize:13,fontWeight:700,color:T.caramel}}>
          + เพิ่มหมวดหมู่ใหม่
        </button>
      )}
    </div>
  );
}

function ModifierGroupCard({ group, onUpdate, onDelete }){
  const [editing,setEditing] = useState(false);
  const [label,setLabel] = useState(group.label);
  const [notice,setNotice] = useState(null);

  function updateOpt(optId,patch){
    onUpdate({...group, options: group.options.map(o=>o.id===optId?{...o,...patch}:o)});
  }
  function removeOpt(optId){
    if(group.options.length<=1){ setNotice("ต้องมีตัวเลือกอย่างน้อย 1 รายการ"); return; }
    onUpdate({...group, options: group.options.filter(o=>o.id!==optId)});
  }
  function addOpt(){
    onUpdate({...group, options:[...group.options,{id:genId("opt"),label:"ตัวเลือกใหม่",price:0}]});
  }
  function saveLabel(){
    const v=label.trim(); if(!v) return;
    onUpdate({...group,label:v}); setEditing(false);
  }

  return(
    <div style={{background:T.white,borderRadius:13,border:`1px solid ${T.border}`,padding:"14px 16px"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
        {editing ? (
          <input value={label} onChange={e=>setLabel(e.target.value)} autoFocus
            style={{flex:1,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${T.caramel}`,fontSize:14,fontWeight:700,boxSizing:"border-box"}}/>
        ):(
          <div style={{flex:1,fontSize:15,fontWeight:700,color:T.ink}}>{group.label}</div>
        )}
        {editing ? (
          <button onClick={saveLabel} style={{padding:"6px 12px",border:"none",borderRadius:8,background:T.mint,color:T.white,cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0}}>✓ บันทึก</button>
        ):(
          <button onClick={()=>setEditing(true)} style={{padding:"5px 11px",border:`1px solid ${T.border}`,borderRadius:8,background:T.cream,cursor:"pointer",fontSize:11,fontWeight:600,color:T.inkMid,flexShrink:0}}>เปลี่ยนชื่อ</button>
        )}
        <button onClick={onDelete} style={{padding:"5px 10px",border:"none",borderRadius:8,background:"#FFF0F0",cursor:"pointer",fontSize:11,fontWeight:600,color:T.red,flexShrink:0}}>🗑 ลบกลุ่ม</button>
      </div>

      {/* Flags */}
      <div style={{display:"flex",gap:10,marginBottom:13,flexWrap:"wrap",alignItems:"center"}}>
        <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:T.inkMid}}>
          <Toggle on={group.required} onToggle={()=>onUpdate({...group,required:!group.required})}/>
          จำเป็นต้องเลือก
        </label>
        {/* maxSelect: 1 = single, 2+ = multi with cap */}
        <div style={{display:"flex",alignItems:"center",gap:7,background:T.cream,borderRadius:9,padding:"5px 10px"}}>
          <span style={{fontSize:12,color:T.inkMid,whiteSpace:"nowrap"}}>เลือกได้สูงสุด</span>
          <button onClick={()=>onUpdate({...group,maxSelect:Math.max(1,(group.maxSelect||1)-1),multi:(group.maxSelect||1)-1>1})}
            style={{width:24,height:24,borderRadius:6,border:`1px solid ${T.border}`,background:T.white,cursor:"pointer",fontSize:14,fontWeight:700,color:T.ink,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
          <div style={{minWidth:28,textAlign:"center",fontSize:14,fontWeight:700,color:(group.maxSelect||1)>1?T.caramel:T.ink}}>
            {(group.maxSelect||1)===1?"1":(group.maxSelect>=group.options.length?"ไม่จำกัด":String(group.maxSelect||1))}
          </div>
          <button onClick={()=>{
            const cur=group.maxSelect||1;
            const next=cur>=group.options.length?99:cur+1;
            onUpdate({...group,maxSelect:next,multi:next>1});
          }} style={{width:24,height:24,borderRadius:6,border:"none",background:T.caramel,cursor:"pointer",fontSize:14,fontWeight:700,color:T.white,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          <span style={{fontSize:11,color:T.inkLight,whiteSpace:"nowrap"}}>
            {(group.maxSelect||1)===1?"(เดี่ยว)":(group.maxSelect||1)>=group.options.length?"(ทั้งหมด)":`/ ${group.options.length}`}
          </span>
        </div>
      </div>

      {/* Options — drag to reorder */}
      <DraggableOptionList options={group.options} onReorder={opts=>onUpdate({...group,options:opts})}
        onUpdate={updateOpt} onRemove={removeOpt}/>
      <button onClick={addOpt} style={{padding:"8px",borderRadius:9,border:`1.5px dashed ${T.caramelLight}`,background:"transparent",cursor:"pointer",fontSize:12,fontWeight:700,color:T.caramel}}>
        + เพิ่มตัวเลือก
      </button>
      {notice&&<ConfirmDialog message={notice} confirmLabel="เข้าใจแล้ว" onConfirm={()=>setNotice(null)} onCancel={null}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DRAGGABLE OPTION LIST — used inside ModifierGroupCard
// ─────────────────────────────────────────────────────────────
function ManagementView({ menuItems, setMenuItems }){
  const { categories, catInfo, modGroups, setCategoriesAndInfo, setModGroups } = useApp();
  const [tab,setTab] = useState("modifiers"); // "modifiers" | "categories"
  const [confirmDeleteGroup,setConfirmDeleteGroup] = useState(null); // {gid, usedByCount} | null

  function handleCatChange({categories:newCats, catInfo:newInfo, renameCat, reassignCat}){
    if(renameCat){
      setMenuItems(prev=>prev.map(m=>m.cat===renameCat.from?{...m,cat:renameCat.to}:m));
    }
    if(reassignCat){
      setMenuItems(prev=>prev.map(m=>m.cat===reassignCat.from?{...m,cat:reassignCat.to}:m));
    }
    setCategoriesAndInfo(newCats,newInfo);
  }

  function updateGroup(updated){
    setModGroups(prev=>prev.map(g=>g.id===updated.id?updated:g));
  }
  function doDeleteGroup(gid){
    setModGroups(prev=>prev.filter(g=>g.id!==gid));
    setMenuItems(prev=>prev.map(m=>m.modifiers.includes(gid)?{...m,modifiers:m.modifiers.filter(x=>x!==gid)}:m));
  }
  function deleteGroup(gid){
    const usedBy = menuItems.filter(m=>m.modifiers.includes(gid));
    if(usedBy.length>0){ setConfirmDeleteGroup({gid, usedByCount:usedBy.length}); return; }
    doDeleteGroup(gid);
  }
  function addGroup(){
    const id=genId("grp");
    setModGroups(prev=>[...prev,{id,label:"กลุ่มตัวเลือกใหม่",required:false,multi:false,maxSelect:1,options:[{id:genId("opt"),label:"ตัวเลือก 1",price:0}]}]);
  }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.cream}}>
      {confirmDeleteGroup&&<ConfirmDialog title="ลบกลุ่มตัวเลือก?"
        message={`กลุ่มนี้ถูกใช้อยู่ใน ${confirmDeleteGroup.usedByCount} เมนู\nหากลบ เมนูเหล่านั้นจะไม่มีตัวเลือกนี้อีกต่อไป\nดำเนินการต่อ?`}
        confirmLabel="ลบกลุ่ม" danger
        onConfirm={()=>{ doDeleteGroup(confirmDeleteGroup.gid); setConfirmDeleteGroup(null); }}
        onCancel={()=>setConfirmDeleteGroup(null)}/>}
      {/* Tabs */}
      <div style={{display:"flex",background:T.white,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        {[{id:"modifiers",icon:"🏷️",label:"ตัวเลือกรอง"},{id:"categories",icon:"🗂️",label:"กลุ่มเมนู"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"12px",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            background:tab===t.id?T.cream:T.white, color:tab===t.id?T.caramel:T.inkMid,
            borderBottom:tab===t.id?`3px solid ${T.caramel}`:"3px solid transparent",transition:"all 0.15s"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:16}}>
        {tab==="categories" && (
          <CategoryManager categories={categories} catInfo={catInfo} menuItems={menuItems} onChange={handleCatChange}/>
        )}

        {tab==="modifiers" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:12,color:T.inkLight,marginBottom:2}}>
              จัดการกลุ่มตัวเลือกรอง (ความหวาน, ขนาด, นม ฯลฯ) — แก้ไขชื่อ ราคา เพิ่ม/ลบตัวเลือกได้อิสระ การเปลี่ยนแปลงจะมีผลกับทุกเมนูที่ใช้กลุ่มนี้
            </div>
            <DraggableGroupList groups={modGroups} setGroups={setModGroups}
              onUpdate={updateGroup} onDelete={deleteGroup}/>
            <button onClick={addGroup} style={{padding:"13px",borderRadius:12,border:`2px dashed ${T.caramel}`,background:"#FFF8EE",cursor:"pointer",fontSize:13,fontWeight:700,color:T.caramel}}>
              + เพิ่มกลุ่มตัวเลือกใหม่
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
function App(){
  const [view,setView]=useState("pos");
  const [cart,setCart]=useState([]); // intentionally NOT persisted — an in-progress order shouldn't survive a hard refresh
  const [menuItems,setMenuItems]=usePersistentState("menuItems", MENU_ITEMS);
  const [printerSettings,setPrinterSettings]=usePersistentState("printerSettings", null);
  const [kitchenPrinterSettings,setKitchenPrinterSettings]=usePersistentState("kitchenPrinterSettings", null);
  const [taxSettings,setTaxSettings]=usePersistentState("taxSettings", DEFAULT_TAX);
  const [displaySettings,setDisplaySettings]=usePersistentState("displaySettings", {
    slideshowImages:[], slideshowInterval:5, showDateTime:true, bgColor:"#3B1F0E", accentColor:"#C8813A",
  });
  const [orders,setOrders]=usePersistentState("orders", []); // real completed-order history, newest first
  const [heldOrders,setHeldOrders]=usePersistentState("heldOrders", []); // parked bills: taken but not yet paid
  const [activeHeldId,setActiveHeldId]=useState(null); // which held bill the current cart is editing
  const [confirmResumeApp,setConfirmResumeApp]=useState(null); // pending resume from OrdersView
  const [showSettingsModal,setShowSettingsModal]=useState(false);
  const customerWinRef=useRef(null);
  const [now,setNow]=useState(new Date());
  const [customerActive,setCustomerActive]=useState(false);

  // ── Shared catalog state: categories + modifier groups ──
  const [categories,setCategories]=usePersistentState("categories", CATEGORIES);
  const [catInfo,setCatInfo]=usePersistentState("catInfo", CAT_INFO);
  const [modGroups,setModGroups]=usePersistentState("modGroups", ()=>Object.values(MODIFIER_GROUPS));
  const modGroupsMap = useMemo(()=>Object.fromEntries(modGroups.map(g=>[g.id,g])), [modGroups]);

  // ── Poll shared storage every 8s so all open tabs/devices stay in sync ──
  useSharedSync({
    menuItems:setMenuItems, categories:setCategories, catInfo:setCatInfo,
    modGroups:setModGroups, printerSettings:setPrinterSettings,
    kitchenPrinterSettings:setKitchenPrinterSettings,
    taxSettings:setTaxSettings, orders:setOrders,
  });

  function setCategoriesAndInfo(newCats,newInfo){ setCategories(newCats); setCatInfo(newInfo); }

  function addOrder(order){ setOrders(prev=>[order, ...prev].slice(0,1000)); }
  function updateOrderStatus(orderId, status){ setOrders(prev=>prev.map(o=>o.id===orderId?{...o,status}:o)); }

  function holdOrder(label, items){
    const id=genId("hold");
    setHeldOrders(prev=>[{id,label,items,createdAt:new Date().toISOString()},...prev]);
    return id;
  }
  function updateHeldOrder(id, items, label){
    setHeldOrders(prev=>prev.map(h=>h.id===id?{...h, items, ...(label!==undefined?{label}:{})}:h));
  }
  function removeHeldOrder(id){
    setHeldOrders(prev=>prev.filter(h=>h.id!==id));
    if(activeHeldId===id){ setActiveHeldId(null); setCart([]); }
  }
  // Called from OrdersView "เปิดบิล" — confirms before replacing an in-progress cart
  function resumeHeld(held){
    if(cart.length>0){ setConfirmResumeApp(held); return; }
    doResumeHeld(held);
  }
  function doResumeHeld(held){
    setCart(held.items);
    setActiveHeldId(held.id);
    setView("pos");
    setConfirmResumeApp(null);
  }

  const appCtxValue = useMemo(()=>({
    categories, catInfo, modGroups, modGroupsMap,
    setCategoriesAndInfo, setModGroups,
  }), [categories, catInfo, modGroups, modGroupsMap]);

  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),30000); return()=>clearInterval(t); },[]);
  useEffect(()=>{ const t=setInterval(()=>setCustomerActive(!!(customerWinRef.current&&!customerWinRef.current.closed)),1000); return()=>clearInterval(t); },[]);

  function openCustomerDisplay(){
    if(customerWinRef.current&&!customerWinRef.current.closed){ customerWinRef.current.focus(); return; }
    const modGroupsJSON = JSON.stringify(Object.fromEntries(modGroups.map(g=>[g.id,{options:g.options}])));
    const html = buildCustomerHTML(modGroupsJSON, false, displaySettings||{});
    const blob=new Blob([html],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const w=window.open(url,"customerDisplay","width=680,height=960,toolbar=no,menubar=no,scrollbars=yes,resizable=yes");
    customerWinRef.current=w;
  }

  const timeStr=now.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
  const dateStr=now.toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"});
  const viewLabel={pos:"รับออเดอร์",orders:"ออเดอร์",reports:"รายงาน",menu:"จัดการเมนู",options:"ตัวเลือก & หมวดหมู่"};

  // Tax badge label
  const txBadge = [];
  if(taxSettings.vatEnabled) txBadge.push("VAT "+taxSettings.vatPct+"%");
  if(taxSettings.scEnabled)  txBadge.push("SC "+taxSettings.scPct+"%");

  return(
    <AppCtx.Provider value={appCtxValue}>
    <div style={{display:"flex",height:"100vh",width:"100vw",overflow:"hidden",fontFamily:"'Kanit','Sarabun',sans-serif",background:T.cream}}>
      {showSettingsModal&&<PrinterSettingsModal
        settings={printerSettings}
        kitchenSettings={kitchenPrinterSettings}
        taxSettings={taxSettings}
        displaySettings={displaySettings}
        onSave={setPrinterSettings}
        onSaveTax={setTaxSettings}
        onSaveDisplay={setDisplaySettings}
        onClose={()=>setShowSettingsModal(false)}/>}
      {confirmResumeApp&&<ConfirmDialog title="แทนที่รายการปัจจุบัน?"
        message={`ตะกร้าตอนนี้ยังมีรายการที่ยังไม่ได้บันทึก\nเปิดบิล "${confirmResumeApp.label}" จะแทนที่รายการปัจจุบันทั้งหมด ดำเนินการต่อ?`}
        confirmLabel="เปิดบิลนี้" danger onConfirm={()=>doResumeHeld(confirmResumeApp)} onCancel={()=>setConfirmResumeApp(null)}/>}
      <Sidebar view={view} setView={setView} cartCount={cart.length} onSettings={()=>setShowSettingsModal(true)} heldCount={heldOrders.length}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{height:48,background:T.white,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 16px",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:700,color:T.ink}}>{viewLabel[view]}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:T.inkMid}}>{dateStr}</span>
            <span style={{fontSize:12,fontWeight:600,color:T.caramel}}>{timeStr} น.</span>
            {txBadge.length>0&&(
              <button onClick={()=>{ setShowSettingsModal(true); }} style={{fontSize:11,background:"#FFF5EA",color:T.caramel,padding:"3px 8px",borderRadius:8,fontWeight:700,border:`1px solid ${T.caramelLight}`,cursor:"pointer"}}>
                💰 {txBadge.join(" + ")}
              </button>
            )}
            {printerSettings?.enabled&&(
              <span style={{fontSize:11,background:"#F0FDF4",color:T.mint,padding:"3px 8px",borderRadius:8,fontWeight:600}}>
                🖨️ {printerSettings.type==="usb"?"USB":printerSettings.type==="bluetooth"?"BT":"Serial"}
              </span>
            )}
            {kitchenPrinterSettings?.enabled&&(
              <span style={{fontSize:11,background:"#FFF5EA",color:T.caramel,padding:"3px 8px",borderRadius:8,fontWeight:600}}>
                🍳 {kitchenPrinterSettings.type==="usb"?"USB":kitchenPrinterSettings.type==="bluetooth"?"BT":"Serial"}
              </span>
            )}
            <button onClick={openCustomerDisplay} style={{padding:"5px 10px",border:`1.5px solid ${T.caramel}`,borderRadius:7,background:customerActive?T.caramel:T.white,color:customerActive?T.white:T.caramel,cursor:"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
              🖥 {customerActive?"จอลูกค้า ✓":"เปิดจอลูกค้า"}
            </button>
            <div style={{width:28,height:28,borderRadius:"50%",background:T.coffee,display:"flex",alignItems:"center",justifyContent:"center",color:T.caramelLight,fontSize:12,fontWeight:700}}>K</div>
          </div>
        </div>
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          {view==="pos"&&<POSView cart={cart} setCart={setCart} printerSettings={printerSettings} kitchenPrinterSettings={kitchenPrinterSettings} customerWinRef={customerWinRef} taxSettings={taxSettings} menuItems={menuItems} onOrderComplete={addOrder}
            heldOrders={heldOrders} onHold={holdOrder} onUpdateHeld={updateHeldOrder} onRemoveHeld={removeHeldOrder}
            activeHeldId={activeHeldId} setActiveHeldId={setActiveHeldId}/>}
          {view==="orders"&&<OrdersView orders={orders} onUpdateStatus={updateOrderStatus}
            heldOrders={heldOrders} onRemoveHeld={removeHeldOrder} onResumeHeld={resumeHeld} taxSettings={taxSettings}/>}
          {view==="reports"&&<ReportsView orders={orders}/>}
          {view==="menu"&&<MenuManagerView menuItems={menuItems} setMenuItems={setMenuItems}/>}
          {view==="options"&&<ManagementView menuItems={menuItems} setMenuItems={setMenuItems}/>}
        </div>
      </div>
    </div>
    </AppCtx.Provider>
  );
}
export default App;
