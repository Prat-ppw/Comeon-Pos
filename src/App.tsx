import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import MenuEditor from "./components/MenuEditor";
import ModifiersEditor from "./components/ModifiersEditor";
import ReportsView from "./components/ReportsView";

// ─────────────────────────────────────────────────────────────
// TOKENS / COLORS
// ─────────────────────────────────────────────────────────────
const T = {
  coffee:"#3B1F0E", coffeeMid:"#5C3317", caramel:"#C8813A",
  caramelLight:"#E8A857", cream:"#FDF8F3", white:"#FFFFFF",
  ink:"#1C1007", inkMid:"#6B5B4E", inkLight:"#B0A090",
  border:"#EDE4D8", mint:"#2ECC8F", red:"#E84545", amber:"#F59E0B",
};

// Detect iOS web (Safari iPhone/iPad) not native Capacitor
const IS_IOS_WEB = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent) && !(typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.isNative);

// Force full UI on web if needed
const FORCE_FULL = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('full') === '1' || !!window.localStorage?.getItem('brewpos_force_full'));
const showFullUI = !IS_IOS_WEB || FORCE_FULL;

// Defaults
const CATEGORIES_DEFAULT = ["ทั้งหมด","กาแฟ","มัทชะ","ชาไทย","นม","เครื่องดื่ม","เบเกอรี่"];
const CAT_INFO_DEFAULT = { "ทั้งหมด":{icon:"📋"}, "กาแฟ":{icon:"☕"} };

// Persistent helpers
const LS_PREFIX = "brewpos_v2_";
const SHARED_KEYS = new Set(["menuItems","categories","catInfo","modGroups","orders","githubSettings"]);
const HAS_SHARED_STORAGE = typeof window!=="undefined" && typeof (window as any).storage?.get === "function";
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
export function useApp(){ return useContext(AppCtx)||{}; }

// ---------- Toast ----------
function Toasts({ toasts }: { toasts: Array<any> }){
  return (
    <div style={{position:'fixed',top:12,left:0,right:0,display:'flex',justifyContent:'center',pointerEvents:'none',zIndex:9999}}>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {toasts.map(t=> (
          <div key={t.id} style={{pointerEvents:'auto',minWidth:240,background:t.type==='error'?'#fee2e2': t.type==='success'?'#ecfdf5':'#f0f4f8',color:'#111',padding:'10px 14px',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.12)',border: t.type==='error'?'1px solid #fca5a5':'1px solid rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:13, fontWeight:600}}>{t.title || (t.type==='error'?'ข้อผิดพลาด': t.type==='success'?'สำเร็จ':'สถานะ')}</div>
            <div style={{fontSize:13,marginTop:4}}>{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- GitHub helpers ----------
async function fetchAndApplyPatch(settings:any, setMenuItems:any, setOrders:any, setModGroups:any, setCategories:any, setCatInfo:any){
  if(!settings?.token) throw new Error('กรุณาตั้งค่า GitHub Token ในหน้า Apps');
  const auth = "Bearer " + settings.token;
  const baseUrl = "https://api.github.com/repos/" + settings.owner + "/" + settings.repo + "/contents/";

  const resMenu = await fetch(baseUrl + "menu-patch.json", { headers: { "Authorization": auth } });
  if(!resMenu.ok) throw new Error('menu-patch.json -> ' + resMenu.status + ' ' + resMenu.statusText);
  const menuData = await resMenu.json();
  const menuContent = JSON.parse(decodeURIComponent(escape(atob(menuData.content))));
  if(menuContent.products) setMenuItems(menuContent.products);
  if(menuContent.modGroups) setModGroups(menuContent.modGroups);
  if(menuContent.categories) setCategories(menuContent.categories);
  if(menuContent.catInfo) setCatInfo(menuContent.catInfo);

  // optional sales-report
  try{
    const resSales = await fetch(baseUrl + "sales-report.json", { headers: { "Authorization": auth } });
    if(resSales.ok){ const salesData = await resSales.json(); const salesContent = JSON.parse(decodeURIComponent(escape(atob(salesData.content)))); if(salesContent.orders) setOrders(salesContent.orders); }
  }catch(_){ /* ignore */ }
}

async function pushToGithub(filename:any, payload:any, settings:any){
  if(!settings?.token || !settings?.owner || !settings?.repo) throw new Error('GitHub settings incomplete');
  const auth = "Bearer " + settings.token;
  const baseUrl = "https://api.github.com/repos/" + settings.owner + "/" + settings.repo + "/contents/";
  const url = baseUrl + filename;
  const contentStr = JSON.stringify(payload, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(contentStr)));

  // try get sha
  let sha: string | undefined = undefined;
  try{
    const g = await fetch(url, { headers: { "Authorization": auth } });
    if(g.ok){ const data = await g.json(); sha = data.sha; }
  }catch(_){}

  const body:any = { message: `Update ${filename} via webapp`, content: contentBase64 };
  if(sha) body.sha = sha;

  const putRes = await fetch(url, { method: 'PUT', headers: { "Authorization": auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if(!putRes.ok){ const txt = await putRes.text(); throw new Error(`GitHub PUT failed: ${putRes.status} ${putRes.statusText} ${txt}`); }
  const resJson = await putRes.json();
  return resJson;
}

// upload image file to repo -> returns raw.githubusercontent.com URL (stored under images/menu/)
async function uploadImageFile(file:File, settings:any){
  if(!settings?.token || !settings?.owner || !settings?.repo) throw new Error('GitHub settings incomplete (required to upload images)');
  // read file as base64 (data URL)
  const readBase64 = (f:File) => new Promise<string>((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=> { const s = String(r.result || ''); const comma = s.indexOf(','); resolve(comma>=0? s.slice(comma+1) : s); };
    r.onerror = reject;
    r.readAsDataURL(f);
  });
  const base64 = await readBase64(file);
  const filenameSafe = file.name.replace(/[^a-zA-Z0-9.\-_]/g,'_');
  const path = `images/menu/${Date.now()}_${filenameSafe}`; // <-- images/menu path
  const auth = "Bearer " + settings.token;
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${path}`;
  // try get sha (not necessary for new file)
  let sha: string | undefined = undefined;
  try{
    const g = await fetch(url, { headers: { "Authorization": auth } });
    if(g.ok){ const data = await g.json(); sha = data.sha; }
  }catch(_){}
  const body:any = { message: `Upload image ${path} via webapp`, content: base64 };
  if(sha) body.sha = sha;
  const res = await fetch(url, { method:'PUT', headers: { "Authorization": auth, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if(!res.ok){ const txt = await res.text(); throw new Error(`Image upload failed: ${res.status} ${res.statusText} ${txt}`); }
  // Return raw URL (main branch)
  const rawUrl = `https://raw.githubusercontent.com/${settings.owner}/${settings.repo}/main/${path}`;
  return rawUrl;
}

// ---------- Simple App components (Sidebar) ----------
function Sidebar({ view, setView, onLogoClick }:{view:string,setView:(v:string)=>void,onLogoClick?:()=>void}){
  const items = [
    {id:'pos',icon:'🧾',label:'รับออเดอร์'},
    {id:'orders',icon:'📋',label:'ออเดอร์'},
    {id:'reports',icon:'📊',label:'รายงาน'},
    {id:'menu',icon:'🍽️',label:'เมนู'},
    {id:'options',icon:'🏷️',label:'ตัวเลือก'},
    {id:'apps',icon:'🧩',label:'Apps'},
  ];
  return(
    <div style={{width:66,background:T.coffee,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:6,flexShrink:0,boxShadow:"2px 0 16px rgba(0,0,0,0.2)"}}>
      <button onClick={()=>{ if(onLogoClick) onLogoClick(); }} style={{marginBottom:8,fontSize:22,border:'none',background:'transparent',color:T.caramel,cursor:'pointer'}}>☕</button>
      {items.map(it=>(
        <button key={it.id} onClick={()=>setView(it.id)} style={{width:50,height:50,borderRadius:11,border:'none',cursor:'pointer',background:view===it.id?T.caramel:'transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:18}}>{it.icon}</span>
          <span style={{fontSize:9,color:view===it.id?T.white:T.inkLight,fontWeight:600}}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- App Root ----------
function App(){
  const initialView = showFullUI ? 'pos' : 'menu';
  const [view, setView] = useState<string>(initialView);

  const [menuItems, setMenuItems] = usePersistentState('menuItems', []);
  const [modGroups, setModGroups] = usePersistentState('modGroups', {});
  const [categories, setCategories] = usePersistentState('categories', CATEGORIES_DEFAULT);
  const [catInfo, setCatInfo] = usePersistentState('catInfo', CAT_INFO_DEFAULT);
  const [orders, setOrders] = usePersistentState('orders', []);
  const [githubSettings, setGithubSettings] = usePersistentState('githubSettings', { token: '', owner: 'Prat-ppw', repo: 'Comeon-Pos', autoSync: true });

  // toasts
  const [toasts, setToasts] = useState<any[]>([]);
  function showToast(message:string, type:'info'|'success'|'error'='info', title?:string, timeout=3000){
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    setToasts(t=>[...t, { id, message, type, title }]);
    setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==id)), timeout);
  }

  async function syncFromGithub(){
    try{
      showToast('กำลังซิงค์จาก GitHub...','info');
      await fetchAndApplyPatch(githubSettings, (v:any)=>setMenuItems(v), (v:any)=>setOrders(v), (v:any)=>setModGroups(v), (v:any)=>setCategories(v), (v:any)=>setCatInfo(v));
      showToast('✅ Sync complete','success');
    }catch(e:any){
      showToast('❌ ซิงค์ล้มเหลว: ' + (e.message||e),'error');
      throw e;
    }
  }

  async function onPush(filename:any, payload:any){
    try{
      showToast('กำลังบันทึกไปยัง GitHub...','info');
      const res = await pushToGithub(filename, payload, githubSettings);
      showToast('✅ บันทึกสำเร็จ','success');
      return res;
    }catch(e:any){
      showToast('❌ บันทึกล้มเหลว: ' + (e.message||e),'error');
      throw e;
    }
  }

  async function uploadImageFileWrapper(file:File){
    try{
      if(!githubSettings?.token){ throw new Error('Token not set in Apps'); }
      const url = await uploadImageFile(file, githubSettings);
      return url;
    }catch(e:any){ throw e; }
  }

  const appCtxValue = useMemo(()=>({
    menuItems, setMenuItems, modGroups, setModGroups, categories, setCategories, catInfo, setCatInfo,
    orders, setOrders, githubSettings, setGithubSettings, syncFromGithub, onPush, showToast, uploadImageFile: uploadImageFileWrapper
  }), [menuItems, modGroups, categories, catInfo, orders, githubSettings]);

  return (
    <AppCtx.Provider value={appCtxValue}>
      <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',fontFamily:"'Kanit','Sarabun',sans-serif",background:T.cream}}>
        <Sidebar view={view} setView={setView} onLogoClick={syncFromGithub} />
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{height:52,background:T.white,borderBottom:'1px solid ' + T.border,display:'flex',alignItems:'center',padding:'0 16px',justifyContent:'space-between'}}>
            <div style={{fontSize:15,fontWeight:700,color:T.ink}}>{ view==='menu' ? 'จัดการเมนู' : (view==='apps' ? 'Apps' : (view==='reports' ? 'สรุปยอดขาย' : 'BREW POS')) }</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {showFullUI && <button onClick={()=>{ showToast('ฟีเจอร์จอลูกค้า (ไม่รองรับบนเว็บ iOS)','info'); }} style={{padding:'5px 10px',border:('1.5px solid ' + T.caramel),borderRadius:7}}>🖥 เปิดจอลูกค้า</button>}
            </div>
          </div>

          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            {view==='pos' && showFullUI && (<div style={{flex:1,padding:20}}>POS (APK-only flows)</div>)}
            {view==='orders' && showFullUI && (<div style={{flex:1,padding:20}}>Orders (list)</div>)}
            {view==='reports' && (<ReportsView />)}
            {view==='menu' && (<MenuEditor />)}
            {view==='options' && showFullUI && (<div style={{flex:1,padding:20}}>Options / Management</div>)}
            {view==='apps' && (<div style={{flex:1}}><div style={{padding:20}}><h3>Apps / GitHub Sync</h3><p>ตั้งค่า Owner / Repo และ Personal Access Token (scope repo) เพื่อให้เว็บสามารถ push/pull ไฟล์ได้</p></div></div>)}
          </div>
        </div>
        <Toasts toasts={toasts} />
      </div>
    </AppCtx.Provider>
  );
}

export default App;