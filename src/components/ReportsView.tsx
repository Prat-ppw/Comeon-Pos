import React, { useState, useEffect } from "react";
import { useApp } from "../App";

function formatDateYMD(d:Date){
  return d.toISOString().slice(0,10);
}

export default function ReportsView(){
  const { orders, setOrders, githubSettings, showToast } = useApp();
  const [localOrders, setLocalOrders] = useState<any[]>(orders || []);
  const [fromDate, setFromDate] = useState<string>(formatDateYMD(new Date()));
  const [toDate, setToDate] = useState<string>(formatDateYMD(new Date()));
  const [summary, setSummary] = useState<any>({ total:0, count:0, items: [] });

  useEffect(()=> setLocalOrders(orders || []), [orders]);

  async function refreshSalesFromRepo(){
    if(!githubSettings?.token){ showToast('กรุณาใส่ GitHub token ในหน้า Apps เพื่อดึงข้อมูลยอดขาย','info'); return; }
    try{
      showToast('กำลังดึง sales-report.json...','info');
      const auth = "Bearer " + githubSettings.token;
      const url = `https://api.github.com/repos/${githubSettings.owner}/${githubSettings.repo}/contents/sales-report.json`;
      const res = await fetch(url, { headers: { Authorization: auth } });
      if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const data = await res.json();
      const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
      if(content.orders){ setLocalOrders(content.orders); setOrders(content.orders); showToast('โหลดยอดขายสำเร็จ','success'); }
      else showToast('ไฟล์ sales-report.json ไม่มีข้อมูล orders','error');
    }catch(e:any){ showToast('❌ ดึงยอดขายล้มเหลว: ' + e.message,'error'); }
  }

  function filterAndSummarize(){
    const f = new Date(fromDate + 'T00:00:00+07:00');
    const t = new Date(toDate + 'T23:59:59+07:00');
    const filtered = localOrders.filter((o:any)=>{
      const od = new Date(o.createdAt || o.date || o.time || o.ts || 0);
      return od >= f && od <= t;
    });
    const total = filtered.reduce((s:any,o:any)=> s + (o.total||o.amount||0), 0);
    setSummary({ total, count: filtered.length, items: filtered });
  }

  useEffect(()=> filterAndSummarize(), [localOrders, fromDate, toDate]);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>สรุปยอดขาย</h2>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label>จาก</label>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
          <label>ถึง</label>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
          <button onClick={filterAndSummarize} style={{padding:8}}>รีเฟรช</button>
          <button onClick={refreshSalesFromRepo} style={{padding:8}}>ดึงจาก repo</button>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <div>จำนวนบิล: {summary.count}</div>
        <div>ยอดรวม: {summary.total} ฿</div>
      </div>

      <div style={{marginTop:12,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{textAlign:'left'}}><th>วันที่</th><th>บิล</th><th>จำนวน</th><th>รวม(฿)</th></tr></thead>
          <tbody>
            {(summary.items||[]).map((o:any, i:number)=>(
              <tr key={i} style={{borderTop:'1px solid #eee'}}>
                <td>{new Date(o.createdAt || o.date || o.time || o.ts || 0).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})}</td>
                <td>{o.id||o.invoice||o.ref||'-'}</td>
                <td>{o.items? o.items.length : (o.count||'-')}</td>
                <td>{o.total || o.amount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
