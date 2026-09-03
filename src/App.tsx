import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  coffee:"#3B1F0E", coffeeMid:"#5C3317", caramel:"#C8813A",
  caramelLight:"#E8A857", cream:"#FDF8F3", white:"#FFFFFF",
  ink:"#1C1007", inkMid:"#6B5B4E", inkLight:"#B0A090",
  border:"#EDE4D8", mint:"#2ECC8F", red:"#E84545", amber:"#F59E0B",
};

// Detect if we're running in iOS web (Safari on iPhone/iPad) and NOT a native Capacitor app
const IS_IOS_WEB = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent) && !(typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.isNative);

// Basic defaults (kept minimal here; original file contains full definitions)
const CATEGORIES = ["ทั้งหมด","กาแฟ","มัทชะ","ชาไทย","นม","เครื่องดื่ม","เบเกอรี่"];
const CAT_INFO = { "ทั้งหมด":{icon:"📋"}, "กาแฟ":{icon:"☕"} };

// Shared/local storage helpers (simplified mirrors original)
const LS_PREFIX = "brewpos_v2_";
const SHARED_KEYS = new Set(["menuItems","categories","catInfo","modGroups","orders","githubSettings"]);
const HAS_SHARED_STORAGE = typeof window!="undefined" && typeof (window as any).storage?.get === "function";
const sharedStore = {
  async get(key:any){ try{ const r=await (window as any).storage.get(key,true); return r?JSON.parse(r.value):null; }catch(_){return null;} },
  async set(key:any,val:any){ try{ await (window as any).storage.set(key,JSON.stringify(val),true); }catch(_){ } },
};
const localStore = {
  get(key:any){ try{ const r=window.localStorage?.getItem(LS_PREFIX+key); return r?JSON.parse(r):null; }catch(_){return null;} },
  set(key:any,val:any){ try{ window.localStorage?.setItem(LS_PREFIX+key,JSON.stringify(val)); }catch(_){ } },
};

function lsLoad(key:any, fallback:any){
  const val = localStore.get(key);
  return val !== null ? val : (typeof fallback === "function" ? fallback() : fallback);
}

function usePersistentState(key:any, initialValue:any){
  const isShared = HAS_SHARED_STORAGE && SHARED_KEYS.has(key);
  const [state, setState] = useState(()=>lsLoad(key, initialValue));
  const [synced, setSynced] = useState(!isShared);
  useEffect(()=>{
    if(!isShared){ setSynced(true); return; }
    let cancelled = false;
    sharedStore.get(key).then(val=>{ if(cancelled) return; if(val !== null) setState(val); setSynced(true); });
    return ()=>{ cancelled=true; };
  }, [key]);
  useEffect(()=>{ if(!synced) return; localStore.set(key, state); if(isShared) sharedStore.set(key, state); }, [key, state, synced]);
  return [state, setState];
}

const AppCtx = createContext<any>(null);
function useApp(){ return useContext(AppCtx)||{}; }

// ---------- GitHub helper functions ----------
async function fetchFileFromGithub(filename:any, settings:any){
  if(!settings?.token || !settings?.owner || !settings?.repo) throw new Error('GitHub settings incomplete');
  const auth = "Bearer " + settings.token;
  const baseUrl = "https://api.github.com/repos/" + settings.owner + "/" + settings.repo + "/contents/";
  const res = await fetch(baseUrl + filename, { headers: { "Authorization": auth } });
  if(!res.ok) throw new Error(`${filename} fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
  return content;
}

async function fetchAndApplyPatch(settings:any, setMenuItems:any, setOrders:any){
  if(!settings?.token) throw new Error('กรุณาตั้งค่า GitHub Token ในหน้า Apps');
  const auth = "Bearer " + settings.token;
  const baseUrl = "https://api.github.com/repos/" + settings.owner + "/" + settings.repo + "/contents/";

  // menu
  const resMenu = await fetch(baseUrl + "menu-patch.json", { headers: { "Authorization": auth } });
  if(!resMenu.ok) throw new Error('menu-patch.json -> ' + resMenu.status + ' ' + resMenu.statusText);
  const menuData = await resMenu.json();
  const menuContent = JSON.parse(decodeURIComponent(escape(atob(menuData.content))));
  if(menuContent.products) setMenuItems(menuContent.products);

  // sales (optional)
  try{
    const resSales = await fetch(baseUrl + "sales-report.json", { headers: { "Authorization": auth } });
    if(resSales.ok){ const salesData = await resSales.json(); const salesContent = JSON.parse(decodeURIComponent(escape(atob(salesData.content)))); if(salesContent.orders) setOrders(salesContent.orders); }
  }catch(_){ /* ignore */ }
}

// ---------- Apps View component ----------
function AppsView(){
  const { githubSettings, setGithubSettings, syncFromGithub } = useApp();
  const [local, setLocal] = useState<any>(githubSettings || { token:'', owner:'Prat-ppw', repo:'Comeon-Pos' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(()=>{ setLocal({...githubSettings}); }, [githubSettings]);

  async function handleSaveAndSync(){
    setGithubSettings(local);
    if(syncFromGithub){ setLoading(true); setMsg('กำลังอัปเดต...'); try{ await syncFromGithub(); setMsg('✅ อัปเดตสำเร็จ'); }catch(e:any){ setMsg('❌ ' + e.message); } setLoading(false); }
  }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:16}}>
      <h3>Apps / GitHub Sync</h3>
      <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:560}}>
        <div>
          <div style={{fontSize:12,color:'#555'}}>GitHub Personal Access Token (PAT)</div>
          <input type="password" value={local.token||''} onChange={e=>setLocal({...local,token:e.target.value})}
            placeholder="ghp_xxx" style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #ddd'}}/>
          <div style={{fontSize:10,color:'#C8813A',marginTop:4}}>{'* สร้างได้จาก GitHub Settings > Developer settings > Tokens (classic)'}</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <input value={local.owner||''} onChange={e=>setLocal({...local,owner:e.target.value})} placeholder="Owner"
            style={{flex:1,padding:8,borderRadius:8,border:'1px solid #ddd'}}/>
          <input value={local.repo||''} onChange={e=>setLocal({...local,repo:e.target.value})} placeholder="Repo"
            style={{flex:1,padding:8,borderRadius:8,border:'1px solid #ddd'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setLocal({token:'',owner:local.owner,repo:local.repo})} style={{padding:10,borderRadius:8,border:'1px solid #ddd',background:'#fff'}}>ล้าง token</button>
          <button onClick={handleSaveAndSync} disabled={loading} style={{padding:10,borderRadius:8,border:'none',background:'#3B1F0E',color:'#fff'}}>{loading? 'กำลังอัปเดต...':'อัปเดต/ดาวน์โหลด patch'}</button>
        </div>
        {msg && <div style={{marginTop:8,fontSize:13}}>{msg}</div>}
      </div>
    </div>
  );
}

// ---------- Sidebar (platform-aware) ----------
function Sidebar({ view, setView, cartCount, onSettings, heldCount, onLogoClick }:{view:string,setView:(v:string)=>void,cartCount:number,onSettings:()=>void,heldCount:number,onLogoClick?:()=>void}){
  const items = IS_IOS_WEB ?
    [{id:'menu',icon:'🍽️',label:'เมนู'},{id:'apps',icon:'🧩',label:'Apps'}]
    :[
      {id:'pos',icon:'🧾',label:'รับออเดอร์'},
      {id:'orders',icon:'📋',label:'ออเดอร์'},
      {id:'reports',icon:'📊',label:'รายงาน'},
      {id:'menu',icon:'🍽️',label:'เมนู'},
      {id:'options',icon:'🏷️',label:'ตัวเลือก'},
      {id:'apps',icon:'🧩',label:'Apps'},
    ];

  return(
    <div style={{width:66,background:T.coffee,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:4,flexShrink:0,boxShadow:"2px 0 16px rgba(0,0,0,0.2)"}}>
      <button onClick={()=>{ if(onLogoClick) onLogoClick(); }} style={{marginBottom:16,fontSize:22,border:'none',background:'transparent',color:T.caramel,cursor:'pointer'}}>☕</button>
      {items.map(it=>(
        <button key={it.id} onClick={()=>setView(it.id)} style={{width:50,height:50,borderRadius:11,border:'none',cursor:'pointer',background:view===it.id?T.caramel:'transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative'}}>
          <span style={{fontSize:17}}>{it.icon}</span>
          <span style={{fontSize:9,color:view===it.id?T.white:T.inkLight,fontWeight:600}}>{it.label}</span>
        </button>
      ))}
      <div style={{flex:1}}/>
      <button onClick={onSettings} style={{width:50,height:50,borderRadius:11,border:'none',cursor:'pointer',background:'transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:17}}>⚙️</span>
        <span style={{fontSize:9,color:T.inkLight,fontWeight:600}}>ตั้งค่า</span>
      </button>
    </div>
  );
}

// ---------- Simplified placeholders for complex components ----------
function MenuManagerView({ menuItems, setMenuItems }:{menuItems:any,setMenuItems:any}){
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:12}}>
      <h2>เมนู & การจัดเรียง (Menu Manager)</h2>
      <p>หน้าจอนี้ยังคงให้แก้ไขตำแหน่งการวางเมนูได้ (drag-to-reorder) — ฟังก์ชันจัดการเมนูครบถ้วนอยู่ในไฟล์เดิม</p>
    </div>
  );
}

// ---------- APP ROOT ----------
function App(){
  const initialView = IS_IOS_WEB ? 'menu' : 'pos';
  const [view,setView] = useState<string>(initialView);
  const [cart,setCart] = useState<any[]>([]);
  const [menuItems,setMenuItems] = usePersistentState('menuItems', []);
  const [printerSettings,setPrinterSettings] = usePersistentState('printerSettings', null);
  const [kitchenPrinterSettings,setKitchenPrinterSettings] = usePersistentState('kitchenPrinterSettings', null);
  const [taxSettings,setTaxSettings] = usePersistentState('taxSettings', null);
  const [displaySettings,setDisplaySettings] = usePersistentState('displaySettings', { slideshowImages:[], slideshowInterval:5, showDateTime:true, bgColor:'#3B1F0E', accentColor:'#C8813A' });
  const [githubSettings,setGithubSettings] = usePersistentState('githubSettings', { token: '', owner: 'Prat-ppw', repo: 'Comeon-Pos', autoSync: true });
  const [orders,setOrders] = usePersistentState('orders', []);
  const [heldOrders,setHeldOrders] = usePersistentState('heldOrders', []);

  // expose sync function
  async function syncFromGithub(){
    try{
      await fetchAndApplyPatch(githubSettings, (v:any)=>setMenuItems(v), (v:any)=>setOrders(v));
      alert('✅ ซิงค์จาก GitHub สำเร็จ');
    }catch(e:any){
      alert('❌ ซิงค์ล้มเหลว: ' + (e.message||e));
      console.error(e);
      throw e;
    }
  }

  const appCtxValue = useMemo(()=>({
    categories:CATEGORIES, catInfo:CAT_INFO, modGroups:[], modGroupsMap:{}, githubSettings,
    setCategoriesAndInfo: (c:any,ci:any)=>{/* omitted */}, setModGroups:()=>{}, setMenuItems, setOrders, setGithubSettings, syncFromGithub
  }), [githubSettings, setMenuItems, setOrders]);

  function openCustomerDisplay(){
    if(IS_IOS_WEB){ alert('ฟีเจอร์จอลูกค้าไม่พร้อมใช้งานบน iPhone web'); return; }
    // original logic preserved for non-iOS-web (omitted here)
  }

  return (
    <AppCtx.Provider value={appCtxValue}>
      <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',fontFamily:"'Kanit','Sarabun',sans-serif",background:T.cream}}>
        <Sidebar view={view} setView={setView} cartCount={cart.length} onSettings={()=>{/* open settings */}} heldCount={heldOrders.length} onLogoClick={syncFromGithub} />
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{height:48,background:T.white,borderBottom:'1px solid ' + T.border,display:'flex',alignItems:'center',padding:'0 16px',justifyContent:'space-between',flexShrink:0}}>
            <div style={{fontSize:14,fontWeight:700,color:T.ink}}>{ view==='menu' ? 'จัดการเมนู' : (view==='apps' ? 'Apps' : 'BREW POS') }</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {!IS_IOS_WEB && (
                <button onClick={openCustomerDisplay} style={{padding:'5px 10px',border:('1.5px solid ' + T.caramel),borderRadius:7}}>🖥 เปิดจอลูกค้า</button>
              )}
            </div>
          </div>

          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            {view==='pos' && !IS_IOS_WEB && (<div style={{flex:1}}><div style={{padding:20}}>POS UI (visible on Android APK)</div></div>)}
            {view==='orders' && !IS_IOS_WEB && (<div style={{flex:1}}><div style={{padding:20}}>Orders (desktop/android)</div></div>)}
            {view==='reports' && !IS_IOS_WEB && (<div style={{flex:1}}><div style={{padding:20}}>Reports (desktop/android)</div></div>)}
            {view==='menu' && (<MenuManagerView menuItems={menuItems} setMenuItems={setMenuItems} />)}
            {view==='options' && !IS_IOS_WEB && (<div style={{flex:1}}><div style={{padding:20}}>Options / Management</div></div>)}
            {view==='apps' && (<AppsView />)}
          </div>
        </div>
      </div>
    </AppCtx.Provider>
  );
}

export default App;
