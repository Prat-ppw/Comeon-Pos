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

// Allow forcing the full UI on web (useful for hosted web like Vercel)
const FORCE_FULL = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('full') === '1' || !!window.localStorage?.getItem('brewpos_force_full'));
const showFullUI = !IS_IOS_WEB || FORCE_FULL;

// Basic defaults
const CATEGORIES_DEFAULT = ["ทั้งหมด","กาแฟ","มัทชะ","ชาไทย","นม","เครื่องดื่ม","เบเกอรี่"];
const CAT_INFO_DEFAULT = { "ทั้งหมด":{icon:"📋"}, "กาแฟ":{icon:"☕"} };

// Shared/local storage helpers
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
function useApp(){ return useContext(AppCtx)||{}; }

// ---------- Toast / Status UI ----------
function Toasts({ toasts, remove }: { toasts: Array<any>, remove: (id:string)=>void }){
  return (
    <div style={{position:'fixed',top:12,left:0,right:0,display:'flex',justifyContent:'center',pointerEvents:'none',zIndex:9999}}>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {toasts.map(t=> (
          <div key={t.id} style={{pointerEvents:'auto',minWidth:220,background:t.type==='error'?'#fee2e2': t.type==='success'?'#ecfdf5':'#f0f4f8',color:'#111',padding:'10px 14px',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.12)',border: t.type==='error'?'1px solid #fca5a5':'1px solid rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:13, fontWeight:600}}>{t.title || (t.type==='error'?'ข้อผิดพลาด': t.type==='success'?'สำเร็จ':'สถานะ')}</div>
            <div style={{fontSize:13,marginTop:4}}>{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- GitHub helper functions ----------
async function fetchFileFromGithub(filename:any, settings:any){
  if(!settings?.token || !settings?.owner || !settings?.repo) throw new Error('GitHub settings incomplete');
  const auth = "Bearer " + settings.token;
  const baseUrl = "https://api.github.com/repos/" + settings.owner + "/" + settings.repo + "/contents/";
  const res = await fetch(baseUrl + filename, { headers: { "Authorization": auth } });
  if(!res.ok) throw new Error(`${filename} fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
  return { content, sha: data.sha };
}

async function fetchAndApplyPatch(settings:any, setMenuItems:any, setOrders:any, setModGroups:any, setCategories:any, setCatInfo:any){
  if(!settings?.token) throw new Error('กรุณาตั้งค่า GitHub Token ในหน้า Apps');
  const auth = "Bearer " + settings.token;
  const baseUrl = "https://api.github.com/repos/" + settings.owner + "/" + settings.repo + "/contents/";

  // menu
  const resMenu = await fetch(baseUrl + "menu-patch.json", { headers: { "Authorization": auth } });
  if(!resMenu.ok) throw new Error('menu-patch.json -> ' + resMenu.status + ' ' + resMenu.statusText);
  const menuData = await resMenu.json();
  const menuContent = JSON.parse(decodeURIComponent(escape(atob(menuData.content))));
  if(menuContent.products) setMenuItems(menuContent.products);
  if(menuContent.modGroups) setModGroups(menuContent.modGroups);
  if(menuContent.categories) setCategories(menuContent.categories);
  if(menuContent.catInfo) setCatInfo(menuContent.catInfo);

  // sales (optional)
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
  // prepare content
  const contentStr = JSON.stringify(payload, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(contentStr)));

  // try get existing file to obtain sha
  let sha: string | undefined = undefined;
  try{
    const g = await fetch(url, { headers: { "Authorization": auth } });
    if(g.ok){ const data = await g.json(); sha = data.sha; }
  }catch(_){ /* ignore */ }

  const body:any = { message: `Update ${filename} via webapp`, content: contentBase64 };
  if(sha) body.sha = sha;

  const putRes = await fetch(url, { method: 'PUT', headers: { "Authorization": auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if(!putRes.ok){ const txt = await putRes.text(); throw new Error(`GitHub PUT failed: ${putRes.status} ${putRes.statusText} ${txt}`); }
  const resJson = await putRes.json();
  return resJson;
}

// ---------- Apps View component ----------
function AppsView(){
  const { githubSettings, setGithubSettings, syncFromGithub, showToast } = useApp();
  const [local, setLocal] = useState<any>(githubSettings || { token:'', owner:'Prat-ppw', repo:'Comeon-Pos' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [forceFullLocal, setForceFullLocal] = useState<boolean>(!!(typeof window !== 'undefined' && window.localStorage?.getItem('brewpos_force_full')) || FORCE_FULL);
  useEffect(()=>{ setLocal({...githubSettings}); }, [githubSettings]);

  async function handleSaveAndSync(){
    setGithubSettings(local);
    if(syncFromGithub){ setLoading(true); setMsg('กำลังอัปเดต...'); try{ await syncFromGithub(); setMsg('✅ อัปเดตสำเร็จ'); }catch(e:any){ setMsg('❌ ' + e.message); } setLoading(false); }
  }

  function toggleForceFull(v:boolean){
    setForceFullLocal(v);
    try{ if(v) window.localStorage.setItem('brewpos_force_full','1'); else window.localStorage.removeItem('brewpos_force_full'); }catch(_){ }
    setTimeout(()=>{ window.location.reload(); }, 200);
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

        <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8}}>
          <input id="forceFull" type="checkbox" checked={forceFullLocal} onChange={e=>toggleForceFull(e.target.checked)} />
          <label htmlFor="forceFull" style={{fontSize:13}}>เปิดโหมดเต็มสำหรับเว็บ (แสดงแท็บเหมือน APK)</label>
        </div>

        {msg && <div style={{marginTop:8,fontSize:13}}>{msg}</div>}
      </div>
    </div>
  );
}

// ---------- Sidebar (platform-aware) ----------
function Sidebar({ view, setView, cartCount, onSettings, heldCount, onLogoClick }:{view:string,setView:(v:string)=>void,cartCount:number,onSettings:()=>void,heldCount:number,onLogoClick?:()=>void}){
  const items = showFullUI ?
    [
      {id:'pos',icon:'🧾',label:'รับออเดอร์'},
      {id:'orders',icon:'📋',label:'ออเดอร์'},
      {id:'reports',icon:'📊',label:'รายงาน'},
      {id:'menu',icon:'🍽️',label:'เมนู'},
      {id:'options',icon:'🏷️',label:'ตัวเลือก'},
      {id:'apps',icon:'🧩',label:'Apps'},
    ]
    :[
      {id:'menu',icon:'🍽️',label:'เมนู'},{id:'apps',icon:'🧩',label:'Apps'}
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

// ---------- Menu Manager (with reorder, save/cancel) ----------
function MenuManagerView({ menuItems, setMenuItems, modGroups, categories, catInfo, githubSettings, onPush }:any){
  const { showToast } = useApp();
  const [reorderMode, setReorderMode] = useState(false);
  const [tempItems, setTempItems] = useState<any[]>([]);
  const [backupItems, setBackupItems] = useState<any[] | null>(null);

  useEffect(()=>{ setTempItems(menuItems || []); }, [menuItems]);

  function onDragStart(e:any, idx:number){
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e:any){ e.preventDefault(); }
  function onDrop(e:any, idx:number){
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    if(isNaN(from)) return;
    const arr = [...tempItems];
    const [moved] = arr.splice(from,1);
    arr.splice(idx,0,moved);
    setTempItems(arr);
  }

  function startReorder(){ setBackupItems(menuItems ? [...menuItems] : []); setReorderMode(true); }
  async function cancelReorder(){ setTempItems(backupItems || []); setBackupItems(null); setReorderMode(false); showToast('ยกเลิกการแก้ไขตำแหน่งเมนู','info'); }
  async function saveReorder(){
    // apply tempItems to state and push
    setMenuItems(tempItems);
    setBackupItems(null);
    setReorderMode(false);
    // prepare payload
    const payload = { version: Date.now(), products: tempItems, modGroups: modGroups || {}, categories: categories || CATEGORIES_DEFAULT, catInfo: catInfo || CAT_INFO_DEFAULT };
    try{
      showToast('กำลังบันทึกการเปลี่ยนตำแหน่งเมนู...','info');
      await onPush('menu-patch.json', payload);
      showToast('✅ บันทึกการเปลี่ยนตำแหน่งเมนูสำเร็จ','success');
    }catch(e:any){ showToast('❌ บันทึกเมนูล้มเหลว: ' + e.message,'error'); }
  }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:12}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <h2 style={{margin:0}}>เมนู & การจัดเรียง (Menu Manager)</h2>
        <div style={{display:'flex',gap:8}}>
          {!reorderMode && <button onClick={startReorder} style={{padding:8,borderRadius:8}}>เรียงลำดับเมนู</button>}
          {reorderMode && <><button onClick={saveReorder} style={{padding:8,borderRadius:8,background:'#18A558',color:'#fff'}}>บันทึก</button><button onClick={cancelReorder} style={{padding:8,borderRadius:8}}>ยกเลิก</button></>}
        </div>
      </div>

      <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,alignContent:'start'}}>
        {(reorderMode ? tempItems : menuItems || []).map((m:any, idx:number)=> (
          <div key={m.id || idx} draggable={reorderMode} onDragStart={(e)=>onDragStart(e,idx)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,idx)} style={{padding:12,borderRadius:10,background:'#fff',boxShadow:'0 6px 14px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
              <div style={{fontWeight:700}}>{m.title || m.name || 'ไม่มีชื่อ'}</div>
              {reorderMode && <div style={{fontSize:12,color:'#666'}}>ลากเพื่อย้าย</div>}
            </div>
            <div style={{fontSize:13,color:'#666',marginTop:8}}>{m.description || ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- APP ROOT ----------
function App(){
  const initialView = showFullUI ? 'pos' : 'menu';
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
  const [modGroups,setModGroups] = usePersistentState('modGroups', {});
  const [categories,setCategories] = usePersistentState('categories', CATEGORIES_DEFAULT);
  const [catInfo,setCatInfo] = usePersistentState('catInfo', CAT_INFO_DEFAULT);

  // toast state
  const [toasts, setToasts] = useState<Array<any>>([]);
  function showToast(message:string, type:'info'|'success'|'error'='info', title?:string, timeout=3000){
    const id = String(Date.now()) + Math.random().toString(36).slice(2,6);
    setToasts(t=>[...t, { id, message, type, title }]);
    setTimeout(()=>{ setToasts(t=>t.filter(x=>x.id!==id)); }, timeout);
  }

  // expose sync/push
  async function syncFromGithub(){
    try{
      showToast('กำลังซิงค์จาก GitHub...','info');
      await fetchAndApplyPatch(githubSettings, (v:any)=>setMenuItems(v), (v:any)=>setOrders(v), (v:any)=>setModGroups(v), (v:any)=>setCategories(v), (v:any)=>setCatInfo(v));
      showToast('✅ Sync complete','success');
    }catch(e:any){
      showToast('❌ ซิงค์ล้มเหลว: ' + (e.message||e),'error');
      console.error(e);
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

  const appCtxValue = useMemo(()=>({
    categories, catInfo, modGroups, modGroupsMap:{}, githubSettings,
    setCategoriesAndInfo: (c:any,ci:any)=>{ setCategories(c); setCatInfo(ci); }, setModGroups, setMenuItems, setOrders, setGithubSettings, syncFromGithub, showToast
  }), [categories, catInfo, modGroups, githubSettings]);

  function openCustomerDisplay(){
    if(!showFullUI){ showToast('ฟีเจอร์จอลูกค้าไม่พร้อมใช้งานบนเว็บนี้','info'); return; }
    // original logic preserved for non-web (omitted)
    showToast('เปิดจอลูกค้า (desktop/android)','','info');
  }

  return (
    <AppCtx.Provider value={appCtxValue}>
      <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',fontFamily:"'Kanit','Sarabun',sans-serif",background:T.cream}}>
        <Sidebar view={view} setView={setView} cartCount={cart.length} onSettings={()=>{/* open settings */}} heldCount={heldOrders.length} onLogoClick={syncFromGithub} />
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{height:48,background:T.white,borderBottom:'1px solid ' + T.border,display:'flex',alignItems:'center',padding:'0 16px',justifyContent:'space-between',flexShrink:0}}>
            <div style={{fontSize:14,fontWeight:700,color:T.ink}}>{ view==='menu' ? 'จัดการเมนู' : (view==='apps' ? 'Apps' : 'BREW POS') }</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {showFullUI && (
                <button onClick={openCustomerDisplay} style={{padding:'5px 10px',border:('1.5px solid ' + T.caramel),borderRadius:7}}>🖥 เปิดจอลูกค้า</button>
              )}
            </div>
          </div>

          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            {view==='pos' && showFullUI && (<div style={{flex:1}}><div style={{padding:20}}>POS UI (visible on Android APK)</div></div>)}
            {view==='orders' && showFullUI && (<div style={{flex:1}}><div style={{padding:20}}>Orders (desktop/android)</div></div>)}
            {view==='reports' && showFullUI && (<div style={{flex:1}}><div style={{padding:20}}>Reports (desktop/android)</div></div>)}
            {view==='menu' && (<MenuManagerView menuItems={menuItems} setMenuItems={setMenuItems} modGroups={modGroups} categories={categories} catInfo={catInfo} githubSettings={githubSettings} onPush={onPush} />)}
            {view==='options' && showFullUI && (<div style={{flex:1}}><div style={{padding:20}}>Options / Management</div></div>)}
            {view==='apps' && (<AppsView />)}
          </div>
        </div>
        <Toasts toasts={toasts} remove={(id:string)=>setToasts(t=>t.filter(x=>x.id!==id))} />
      </div>
    </AppCtx.Provider>
  );
}

export default App;