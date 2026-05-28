"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const SUPABASE_URL = "https://xqtmonbreiaqiolhlweb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdG1vbmJyZWlhcWlvbGhsd2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTE1MTIsImV4cCI6MjA5NTU2NzUxMn0.tSHCqdui5OAVG0wrZtp57grVL-NOjNUwwDFSkpiJPzI";

const db = {
  async get(table) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?order=created_at.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return r.ok ? r.json() : [];
  },
  async insert(table, row) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(row)
    });
    return r.ok;
  },
  async delete(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return r.ok;
  }
};

const TRADES = [
  "HVAC","Roofing","Plumbing","Electrical","Landscaping",
  "Carpentry","Painting","Flooring","Masonry","Welding",
  "Drywall","Insulation","Solar","General Contractor","Other"
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

const TRADE_ICONS = {
  "HVAC":"♨","Roofing":"⌂","Plumbing":"⌁","Electrical":"⚡","Landscaping":"⚘",
  "Carpentry":"⌧","Painting":"◈","Flooring":"▦","Masonry":"▩","Welding":"◉",
  "Drywall":"▣","Insulation":"▤","Solar":"☀","General Contractor":"⌂","Other":"◎"
};

const SEED_CONTRACTORS = [
  { id:"c1", name:"Arctic Air HVAC", trade:"HVAC", city:"Austin", state:"TX", bio:"15 years residential & commercial HVAC. AC installs, furnace replace, maintenance contracts. Same-day service available.", phone:"(512) 555-0191", email:"arctic@example.com", licensed:true, insured:true, rating:4.9, reviews:34, featured:true, joined:"2024-01" },
  { id:"c2", name:"Summit Roofing Co.", trade:"Roofing", city:"Denver", state:"CO", bio:"Shingle, metal, flat roof specialists. Insurance claims welcome. Free estimates on all jobs over $2,000.", phone:"(720) 555-0142", email:"summit@example.com", licensed:true, insured:true, rating:4.8, reviews:61, featured:true, joined:"2023-11" },
  { id:"c3", name:"FlowRight Plumbing", trade:"Plumbing", city:"Phoenix", state:"AZ", bio:"Emergency plumbing 24/7. Water heaters, drain clearing, remodel rough-in. Family owned since 2008.", phone:"(602) 555-0177", email:"flow@example.com", licensed:true, insured:true, rating:4.7, reviews:28, featured:false, joined:"2024-03" },
  { id:"c4", name:"Bright Spark Electric", trade:"Electrical", city:"Portland", state:"OR", bio:"Panel upgrades, EV charger install, residential wiring. Licensed master electrician with 20 years experience.", phone:"(503) 555-0133", email:"spark@example.com", licensed:true, insured:true, rating:5.0, reviews:19, featured:false, joined:"2024-05" },
  { id:"c5", name:"GreenThumb Landscapes", trade:"Landscaping", city:"Nashville", state:"TN", bio:"Full-service landscaping, hardscape, irrigation design and install. Residential and commercial properties.", phone:"(615) 555-0155", email:"green@example.com", licensed:false, insured:true, rating:4.6, reviews:42, featured:false, joined:"2023-09" },
];

const SEED_JOBS = [
  { id:"j1", title:"AC Unit Replacement — 3 Bedroom Home", trade:"HVAC", city:"Austin", state:"TX", budget:"$3,000–$5,000", description:"Current unit is 15 years old and failing. 1,800sqft home. Need full replacement including labour. Available weekdays.", contact:"homeowner1@example.com", posted:"2024-06-01", urgent:true },
  { id:"j2", title:"Full Roof Replacement — Storm Damage", trade:"Roofing", city:"Dallas", state:"TX", budget:"$8,000–$12,000", description:"Insurance claim approved for storm damage. Need licensed contractor for full shingle replacement. 2,200sqft.", contact:"homeowner2@example.com", posted:"2024-06-02", urgent:true },
  { id:"j3", title:"Bathroom Plumbing Remodel", trade:"Plumbing", city:"Seattle", state:"WA", budget:"$1,500–$2,500", description:"Full bathroom rough-in for remodel. Moving shower, toilet and sink. Permits handled by homeowner.", contact:"homeowner3@example.com", posted:"2024-06-03", urgent:false },
];

const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const blankContractor = () => ({ id:"c"+Date.now(), name:"", trade:"HVAC", city:"", state:"TX", bio:"", phone:"", email:"", licensed:false, insured:false, rating:0, reviews:0, featured:false, joined:new Date().toISOString().slice(0,7), delete_code:genCode() });
const blankJob = () => ({ id:"j"+Date.now(), title:"", trade:"HVAC", city:"", state:"TX", budget:"", description:"", contact:"", posted:new Date().toISOString().slice(0,10), urgent:false, delete_code:genCode() });

export default function ProBoard() {
  const [contractors, setContractors] = useState([]);
  const [jobs, setJobs]               = useState([]);
  const [loaded, setLoaded]           = useState(false);
  const [syncing, setSyncing]         = useState(false);
  const [tab, setTab]                 = useState("find");
  const [subTab, setSubTab]           = useState("contractors");
  const [search, setSearch]           = useState("");
  const [filterTrade, setFilterTrade] = useState("All");
  const [filterState, setFilterState] = useState("All");
  const [selected, setSelected]       = useState(null);
  const [formType, setFormType]       = useState("contractor");
  const [form, setForm]               = useState(blankContractor());
  const [submitted, setSubmitted]     = useState(false);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // {id, type}
  const [deleteCodeInput, setDeleteCodeInput] = useState("");
  const [deleteError, setDeleteError] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [adminInput, setAdminInput]   = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const ADMIN_PASSWORD = "proboard2024";

  const loadData = async () => {
    setSyncing(true);
    try {
      const [dbContractors, dbJobs] = await Promise.all([db.get("contractors"), db.get("jobs")]);
      const allContractors = [...SEED_CONTRACTORS];
      if (Array.isArray(dbContractors)) {
        dbContractors.forEach(c => { if (!allContractors.find(x => x.id === c.id)) allContractors.push(c); });
      }
      const allJobs = [...SEED_JOBS];
      if (Array.isArray(dbJobs)) {
        dbJobs.forEach(j => { if (!allJobs.find(x => x.id === j.id)) allJobs.push(j); });
      }
      setContractors(allContractors);
      setJobs(allJobs);
    } catch (e) {
      setContractors(SEED_CONTRACTORS);
      setJobs(SEED_JOBS);
    }
    setSyncing(false);
    setLoaded(true);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const tryAdminLogin = () => {
    if (adminInput === ADMIN_PASSWORD) { setIsAdmin(true); setShowAdminLogin(false); setAdminInput(""); }
    else { alert("Incorrect password."); }
  };

  const handleSelfDelete = async () => {
    const item = deleteModal.type === "contractor"
      ? contractors.find(c => c.id === deleteModal.id)
      : jobs.find(j => j.id === deleteModal.id);
    if (!item) return;
    if (deleteCodeInput !== item.delete_code) { setDeleteError(true); return; }
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${deleteModal.type === "contractor" ? "contractors" : "jobs"}?id=eq.${deleteModal.id}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        }
      });
      if (deleteModal.type === "contractor") {
        setContractors(prev => prev.filter(c => c.id !== deleteModal.id));
      } else {
        setJobs(prev => prev.filter(j => j.id !== deleteModal.id));
      }
      setDeleteSuccess(true);
      setTimeout(() => {
        setDeleteModal(null); setDeleteCodeInput(""); setDeleteError(false); setDeleteSuccess(false);
        loadData();
      }, 2000);
    } catch(e) {
      alert("Delete failed. Please try again.");
    }
  };

  const deleteContractor = async (id) => {
    if (!window.confirm("Remove this listing?")) return;
    const isSeed = ["c1","c2","c3","c4","c5"].includes(id);
    setContractors(prev => prev.filter(c => c.id !== id));
    if (!isSeed) {
      await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=representation" }
      });
      setTimeout(loadData, 500);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Remove this job?")) return;
    const isSeed = ["j1","j2","j3"].includes(id);
    setJobs(prev => prev.filter(j => j.id !== id));
    if (!isSeed) {
      await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=representation" }
      });
      setTimeout(loadData, 500);
    }
  };

  const filteredContractors = useMemo(() => contractors.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.name?.toLowerCase().includes(q) || c.trade?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || c.bio?.toLowerCase().includes(q))
      && (filterTrade==="All" || c.trade===filterTrade)
      && (filterState==="All" || c.state===filterState);
  }), [contractors, search, filterTrade, filterState]);

  const filteredJobs = useMemo(() => jobs.filter(j => {
    const q = search.toLowerCase();
    return (!q || j.title?.toLowerCase().includes(q) || j.trade?.toLowerCase().includes(q) || j.city?.toLowerCase().includes(q))
      && (filterTrade==="All" || j.trade===filterTrade)
      && (filterState==="All" || j.state===filterState);
  }), [jobs, search, filterTrade, filterState]);

  const submitForm = async () => {
    if (formType==="contractor") {
      if (!form.name||!form.city) { alert("Add your name and city."); return; }
      await db.insert("contractors", form);
      setContractors([form, ...contractors]);
    } else {
      if (!form.title||!form.city) { alert("Add a job title and city."); return; }
      await db.insert("jobs", form);
      setJobs([form, ...jobs]);
    }
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setTab("find"); setForm(blankContractor()); loadData(); }, 2500);
  };

  const goPost = (type) => { setFormType(type); setForm(type==="contractor"?blankContractor():blankJob()); setTab("form"); setSelected(null); };

  if (!loaded) return (
    <div style={{background:"#F7F3EC",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Epilogue',sans-serif",color:"#888",fontSize:14,flexDirection:"column",gap:12}}>
      <div style={{width:32,height:32,border:"2px solid #DDD8CE",borderTop:"2px solid #2E6B3E",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading ProBoard…
    </div>
  );

  return (
    <div style={{fontFamily:"'Epilogue',system-ui,sans-serif",background:"#F7F3EC",minHeight:"100vh",color:"#1C1C1A",maxWidth:560,margin:"0 auto"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Epilogue:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        input,textarea,select,button{font-family:inherit;}
        input:focus,textarea:focus,select:focus{outline:2px solid #2E6B3E;border-color:#2E6B3E;}
        .hov:hover{background:#EDE8DF!important;}
        .hov-card:hover{box-shadow:0 2px 12px rgba(0,0,0,0.08);}
        .btn-hov:hover{opacity:0.9;}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:"#1C1C1A",padding:"0 18px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:5,height:28,background:"#2E6B3E"}}/>
          <div>
            <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:800,fontSize:17,color:"#F7F3EC",letterSpacing:"-0.02em",lineHeight:1}}>ProBoard</div>
            <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:9,color:"#666",letterSpacing:"0.14em",marginTop:1,textTransform:"uppercase"}}>Trade Network</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:10,color:syncing?"#2E6B3E":"#555",letterSpacing:"0.06em"}}>
            {syncing ? "syncing…" : `${contractors.length} pros · ${jobs.length} jobs`}
          </span>
          <button onClick={loadData} disabled={syncing}
            style={{background:"none",border:`1px solid ${syncing?"#2E6B3E":"#333"}`,color:syncing?"#2E6B3E":"#555",fontFamily:"'Epilogue',sans-serif",fontSize:9,padding:"4px 8px",cursor:"pointer",letterSpacing:"0.06em"}}>
            {syncing ? "..." : "↻"}
          </button>
          <button onClick={()=>setShowAdminLogin(s=>!s)}
            style={{background:isAdmin?"#2E6B3E":"none",border:`1px solid ${isAdmin?"#2E6B3E":"#333"}`,color:isAdmin?"#fff":"#555",fontFamily:"'Epilogue',sans-serif",fontSize:9,padding:"4px 8px",cursor:"pointer",letterSpacing:"0.06em"}}>
            {isAdmin?"ADMIN ✓":"ADMIN"}
          </button>
        </div>
      </div>

      {/* ADMIN LOGIN */}
      {showAdminLogin && !isAdmin && (
        <div style={{background:"#1C1C1A",padding:"12px 16px",display:"flex",gap:8,alignItems:"center",borderBottom:"1px solid #333"}}>
          <input value={adminInput} onChange={e=>setAdminInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryAdminLogin()}
            placeholder="Admin password" type="password"
            style={{flex:1,background:"#2A2A28",border:"1px solid #444",color:"#F7F3EC",padding:"8px 10px",fontSize:13}}/>
          <button onClick={tryAdminLogin} style={{background:"#2E6B3E",border:"none",color:"#fff",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:12,padding:"8px 14px",cursor:"pointer"}}>Login</button>
          <button onClick={()=>setShowAdminLogin(false)} style={{background:"none",border:"1px solid #444",color:"#888",fontSize:12,padding:"8px 10px",cursor:"pointer"}}>✕</button>
        </div>
      )}
      {isAdmin && (
        <div style={{background:"#0D1F12",borderBottom:"1px solid #2E6B3E",padding:"8px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:11,color:"#2E6B3E",fontWeight:700,letterSpacing:"0.08em"}}>ADMIN MODE — tap any listing to delete it</span>
          <button onClick={()=>setIsAdmin(false)} style={{background:"none",border:"none",color:"#2E6B3E",fontSize:12,cursor:"pointer"}}>Exit</button>
        </div>
      )}

      {/* NAV */}
      <div style={{background:"#F7F3EC",borderBottom:"1px solid #DDD8CE",display:"flex",overflowX:"auto"}}>
        {[["find","Browse"],["form-c","List My Business"],["form-j","Post a Job"],["about","How It Works"]].map(([key,label])=>(
          <button key={key} onClick={()=>{
            if(key==="form-c") goPost("contractor");
            else if(key==="form-j") goPost("job");
            else { setTab(key); setSelected(null); }
          }}
          style={{background:"none",border:"none",borderBottom:(tab===key||(tab==="form"&&((key==="form-c"&&formType==="contractor")||(key==="form-j"&&formType==="job"))))?"2px solid #2E6B3E":"2px solid transparent",
            color:(tab===key||(tab==="form"&&((key==="form-c"&&formType==="contractor")||(key==="form-j"&&formType==="job"))))?"#2E6B3E":"#666",
            fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:12,letterSpacing:"0.02em",padding:"12px 16px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            {label}
          </button>
        ))}
      </div>

      {/* FIND */}
      {tab==="find" && !selected && (
        <div>
          <div style={{background:"#2E6B3E",padding:"24px 18px 20px"}}>
            <div style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:11,color:"rgba(255,255,255,0.6)",letterSpacing:"0.08em",marginBottom:8}}>Find trusted tradespeople near you</div>
            <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:800,fontSize:"clamp(26px,6vw,36px)",color:"#fff",lineHeight:1.05,letterSpacing:"-0.02em",marginBottom:16}}>Every trade.<br/>One place.</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by trade, name or city…"
              style={{width:"100%",background:"#fff",border:"none",padding:"12px 14px",fontSize:15,fontFamily:"'Epilogue',sans-serif",color:"#1C1C1A"}}/>
          </div>
          <div style={{background:"#EDE8DF",borderBottom:"1px solid #DDD8CE",padding:"10px 18px",display:"flex",gap:10}}>
            <select value={filterTrade} onChange={e=>setFilterTrade(e.target.value)}
              style={{flex:1,background:"#fff",border:"1px solid #DDD8CE",color:"#444",padding:"8px 10px",fontSize:12}}>
              <option value="All">All trades</option>
              {TRADES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterState} onChange={e=>setFilterState(e.target.value)}
              style={{width:80,background:"#fff",border:"1px solid #DDD8CE",color:"#444",padding:"8px 10px",fontSize:12}}>
              <option value="All">All states</option>
              {STATES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{display:"flex",borderBottom:"1px solid #DDD8CE",background:"#F7F3EC"}}>
            {[["contractors",`Contractors (${filteredContractors.length})`],["jobs",`Jobs (${filteredJobs.length})`]].map(([key,label])=>(
              <button key={key} onClick={()=>setSubTab(key)}
                style={{flex:1,background:"none",border:"none",borderBottom:subTab===key?"2px solid #1C1C1A":"2px solid transparent",color:subTab===key?"#1C1C1A":"#888",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:13,padding:"11px 0",cursor:"pointer"}}>
                {label}
              </button>
            ))}
          </div>

          {subTab==="contractors" && (
            <div style={{padding:"12px 14px 80px"}}>
              {filteredContractors.length===0 && <div style={{textAlign:"center",padding:"40px 20px",fontSize:13,color:"#999"}}>No contractors found.</div>}
              {filteredContractors.map(c=>(
                <div key={c.id} className="hov-card" onClick={()=>isAdmin?deleteContractor(c.id):setSelected(c)}
                  style={{background:isAdmin?"#FFF5F5":"#fff",border:`1px solid ${isAdmin?"#FCA5A5":c.featured?"#2E6B3E":"#E5E0D6"}`,marginBottom:8,padding:"14px 16px",cursor:"pointer",transition:"box-shadow 0.15s",position:"relative"}}>
                  {c.featured && !isAdmin && <div style={{position:"absolute",top:0,right:0,background:"#2E6B3E",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:9,color:"#fff",padding:"3px 8px",letterSpacing:"0.08em"}}>FEATURED</div>}
                  {["c1","c2","c3","c4","c5"].includes(c.id) && !isAdmin && <div style={{position:"absolute",top:0,left:0,background:"#DDD8CE",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:9,color:"#888",padding:"3px 8px",letterSpacing:"0.08em"}}>EXAMPLE</div>}
                  {isAdmin && <div style={{position:"absolute",top:8,right:12,fontFamily:"'Epilogue',sans-serif",fontSize:10,color:"#EF4444",fontWeight:700}}>TAP TO DELETE</div>}
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:42,height:42,background:"#F0EBE0",border:"1px solid #DDD8CE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18,color:"#2E6B3E"}}>
                      {TRADE_ICONS[c.trade]||"◎"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:15,color:"#1C1C1A",marginBottom:3}}>{c.name}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:6}}>
                        <span style={{background:"#EEF6F0",color:"#2E6B3E",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:10,padding:"2px 8px"}}>{c.trade}</span>
                        <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:11,color:"#888"}}>{c.city}, {c.state}</span>
                        {c.licensed && <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:10,color:"#2E6B3E"}}>✓ Licensed</span>}
                        {c.insured && <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:10,color:"#2E6B3E"}}>✓ Insured</span>}
                      </div>
                      <div style={{fontFamily:"'Lora',serif",fontSize:13,color:"#555",lineHeight:1.5,marginBottom:c.rating>0?6:0}}>{c.bio?.slice(0,85)}{c.bio?.length>85?"…":""}</div>
                      {c.rating>0 && <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:11,color:"#888"}}>{"★".repeat(Math.round(c.rating))} {c.rating} · {c.reviews} reviews</div>}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{textAlign:"center",paddingTop:16}}>
                <button className="btn-hov" onClick={()=>goPost("contractor")}
                  style={{background:"#1C1C1A",border:"none",color:"#F7F3EC",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:13,padding:"12px 28px",cursor:"pointer"}}>
                  + List your business free
                </button>
              </div>
            </div>
          )}

          {subTab==="jobs" && (
            <div style={{padding:"12px 14px 80px"}}>
              {filteredJobs.length===0 && <div style={{textAlign:"center",padding:"40px 20px",fontSize:13,color:"#999"}}>No jobs found.</div>}
              {filteredJobs.map(j=>(
                <div key={j.id} className="hov-card" onClick={()=>isAdmin?deleteJob(j.id):setSelected(j)}
                  style={{background:isAdmin?"#FFF5F5":"#fff",border:`1px solid ${isAdmin?"#FCA5A5":j.urgent?"#C45C1A":"#E5E0D6"}`,marginBottom:8,padding:"14px 16px",cursor:"pointer",transition:"box-shadow 0.15s",position:"relative"}}>
                  {isAdmin && <div style={{position:"absolute",top:8,right:12,fontFamily:"'Epilogue',sans-serif",fontSize:10,color:"#EF4444",fontWeight:700}}>TAP TO DELETE</div>}
                  {["j1","j2","j3"].includes(j.id) && !isAdmin && <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:9,fontWeight:700,color:"#888",background:"#EDE8DF",display:"inline-block",padding:"2px 7px",marginBottom:6,letterSpacing:"0.08em"}}>EXAMPLE</div>}
                  {j.urgent && !isAdmin && <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:10,fontWeight:700,color:"#C45C1A",letterSpacing:"0.06em",marginBottom:6}}>URGENT</div>}
                  <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:15,color:"#1C1C1A",marginBottom:6}}>{j.title}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                    <span style={{background:"#EEF6F0",color:"#2E6B3E",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:10,padding:"2px 8px"}}>{j.trade}</span>
                    <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:11,color:"#888"}}>{j.city}, {j.state}</span>
                    {j.budget && <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:11,color:"#555",fontWeight:600}}>{j.budget}</span>}
                  </div>
                  <div style={{fontFamily:"'Lora',serif",fontSize:13,color:"#555",lineHeight:1.5}}>{j.description?.slice(0,100)}{j.description?.length>100?"…":""}</div>
                  <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:10,color:"#aaa",marginTop:8}}>Posted {j.posted}</div>
                </div>
              ))}
              <div style={{textAlign:"center",paddingTop:16}}>
                <button className="btn-hov" onClick={()=>goPost("job")}
                  style={{background:"#1C1C1A",border:"none",color:"#F7F3EC",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:13,padding:"12px 28px",cursor:"pointer"}}>
                  + Post a job free
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL */}
      {tab==="find" && selected && (
        <div style={{padding:18,paddingBottom:60}}>
          <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"#888",fontFamily:"'Epilogue',sans-serif",fontSize:12,cursor:"pointer",padding:0,marginBottom:20}}>← Back to results</button>
          {selected.title ? (
            <>
              {selected.urgent && <div style={{background:"#FFF4ED",border:"1px solid #F5C49A",color:"#C45C1A",fontFamily:"'Epilogue',sans-serif",fontSize:11,fontWeight:700,padding:"6px 12px",marginBottom:14,display:"inline-block"}}>URGENT</div>}
              <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:800,fontSize:22,color:"#1C1C1A",lineHeight:1.2,marginBottom:12}}>{selected.title}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
                <span style={{background:"#EEF6F0",color:"#2E6B3E",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:11,padding:"3px 10px"}}>{selected.trade}</span>
                <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:12,color:"#888"}}>{selected.city}, {selected.state}</span>
                {selected.budget && <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:12,color:"#1C1C1A",fontWeight:600}}>{selected.budget}</span>}
              </div>
              <div style={{borderTop:"1px solid #E5E0D6",borderBottom:"1px solid #E5E0D6",padding:"16px 0",marginBottom:18}}>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:11,color:"#888",letterSpacing:"0.08em",marginBottom:8,textTransform:"uppercase"}}>Job Details</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"#333",lineHeight:1.7}}>{selected.description}</div>
              </div>
              <div style={{marginBottom:24}}>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:11,color:"#888",letterSpacing:"0.08em",marginBottom:8,textTransform:"uppercase"}}>Contact</div>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:13,color:"#555"}}>{selected.contact}</div>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:11,color:"#aaa",marginTop:4}}>Posted {selected.posted}</div>
              </div>
              <a href={`mailto:${selected.contact}?subject=Re: ${selected.title}`}
                style={{display:"block",textAlign:"center",background:"#1C1C1A",color:"#F7F3EC",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:15,padding:"14px",textDecoration:"none",marginBottom:10}}>
                Apply for this job
              </a>
              {!["j1","j2","j3"].includes(selected.id) && (
                <button onClick={()=>{setDeleteModal({id:selected.id,type:"job"});setSelected(null);}}
                  style={{width:"100%",background:"none",border:"1px solid #FCA5A5",color:"#EF4444",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:13,padding:"11px",cursor:"pointer"}}>
                  Remove this job posting
                </button>
              )}
            </>
          ) : (
            <>
              <div style={{display:"flex",gap:14,marginBottom:20,alignItems:"flex-start"}}>
                <div style={{width:56,height:56,background:"#EEF6F0",border:"1px solid #C8DFC8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:24,color:"#2E6B3E"}}>
                  {TRADE_ICONS[selected.trade]||"◎"}
                </div>
                <div>
                  <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:800,fontSize:22,color:"#1C1C1A",lineHeight:1.1,marginBottom:4}}>{selected.name}</div>
                  <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:12,color:"#888"}}>{selected.trade} · {selected.city}, {selected.state}</div>
                  {selected.rating>0 && <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:12,color:"#888",marginTop:4}}>{"★".repeat(Math.round(selected.rating))} {selected.rating} ({selected.reviews} reviews)</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
                {selected.licensed && <span style={{background:"#EEF6F0",border:"1px solid #C8DFC8",color:"#2E6B3E",fontFamily:"'Epilogue',sans-serif",fontSize:11,fontWeight:600,padding:"4px 10px"}}>✓ Licensed</span>}
                {selected.insured && <span style={{background:"#EEF6F0",border:"1px solid #C8DFC8",color:"#2E6B3E",fontFamily:"'Epilogue',sans-serif",fontSize:11,fontWeight:600,padding:"4px 10px"}}>✓ Insured</span>}
                {selected.featured && <span style={{background:"#2E6B3E",color:"#fff",fontFamily:"'Epilogue',sans-serif",fontSize:11,fontWeight:600,padding:"4px 10px"}}>Featured Pro</span>}
              </div>
              <div style={{borderTop:"1px solid #E5E0D6",borderBottom:"1px solid #E5E0D6",padding:"16px 0",marginBottom:18}}>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:11,color:"#888",letterSpacing:"0.08em",marginBottom:8,textTransform:"uppercase"}}>About</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"#333",lineHeight:1.7}}>{selected.bio}</div>
              </div>
              <div style={{marginBottom:24}}>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:11,color:"#888",letterSpacing:"0.08em",marginBottom:10,textTransform:"uppercase"}}>Contact</div>
                {selected.phone && <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:16,fontWeight:600,color:"#1C1C1A",marginBottom:4}}>{selected.phone}</div>}
                {selected.email && <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:13,color:"#666"}}>{selected.email}</div>}
              </div>
              <a href={`tel:${selected.phone}`} style={{display:"block",textAlign:"center",background:"#1C1C1A",color:"#F7F3EC",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:15,padding:"14px",textDecoration:"none",marginBottom:10}}>Call now</a>
              <a href={`mailto:${selected.email}`} style={{display:"block",textAlign:"center",background:"#fff",border:"1px solid #DDD8CE",color:"#444",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:15,padding:"13px",textDecoration:"none",marginBottom:10}}>Send email</a>
              {!["c1","c2","c3","c4","c5"].includes(selected.id) && (
                <button onClick={()=>{setDeleteModal({id:selected.id,type:"contractor"});setSelected(null);}}
                  style={{width:"100%",background:"none",border:"1px solid #FCA5A5",color:"#EF4444",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:13,padding:"11px",cursor:"pointer"}}>
                  Remove my listing
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* FORM */}
      {tab==="form" && (
        <div style={{padding:18,paddingBottom:80}}>
          {submitted ? (
            <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:28,color:"#2E6B3E",marginBottom:12}}>Done.</div>
              <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:14,color:"#555",marginBottom:20}}>
                {formType==="contractor" ? "Your listing is now live and synced." : "Your job is now posted and visible to all contractors."}
              </div>
              <div style={{background:"#EDE8DF",border:"1px solid #DDD8CE",padding:"16px",textAlign:"center"}}>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:11,color:"#888",letterSpacing:"0.1em",marginBottom:6,textTransform:"uppercase"}}>Your delete code — save this</div>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:900,fontSize:32,color:"#1C1C1A",letterSpacing:"0.2em"}}>{form.delete_code}</div>
                <div style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:12,color:"#888",marginTop:6}}>You'll need this to remove your listing later</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{marginBottom:24}}>
                <div style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:11,color:"#888",letterSpacing:"0.06em",marginBottom:6}}>
                  {formType==="contractor" ? "For tradespeople" : "For homeowners & businesses"}
                </div>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:800,fontSize:24,color:"#1C1C1A",letterSpacing:"-0.02em",lineHeight:1.1}}>
                  {formType==="contractor" ? "List your business" : "Post a job"}
                </div>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:12,color:"#888",marginTop:4}}>
                  {formType==="contractor" ? "Free · Synced live for everyone to see" : "Free · Reaches all local contractors instantly"}
                </div>
              </div>
              <div style={{borderTop:"1px solid #DDD8CE",paddingTop:20}}>
                {formType==="contractor" ? (
                  <>
                    <FF label="Business name"><FI value={form.name} placeholder="e.g. Arctic Air HVAC" onChange={v=>setForm({...form,name:v})}/></FF>
                    <FF label="Trade"><select value={form.trade} onChange={e=>setForm({...form,trade:e.target.value})} style={ss}>{TRADES.map(t=><option key={t}>{t}</option>)}</select></FF>
                    <div style={{display:"flex",gap:10}}>
                      <FF label="City" style={{flex:2}}><FI value={form.city} placeholder="Your city" onChange={v=>setForm({...form,city:v})}/></FF>
                      <FF label="State" style={{flex:1}}><select value={form.state} onChange={e=>setForm({...form,state:e.target.value})} style={ss}>{STATES.map(s=><option key={s}>{s}</option>)}</select></FF>
                    </div>
                    <FF label="Phone"><FI value={form.phone} placeholder="(555) 123-4567" onChange={v=>setForm({...form,phone:v})}/></FF>
                    <FF label="Email"><FI value={form.email} placeholder="you@business.com" onChange={v=>setForm({...form,email:v})}/></FF>
                    <FF label="About your business">
                      <textarea value={form.bio} placeholder="What do you specialize in? Years of experience? Service area?" rows={3}
                        onChange={e=>setForm({...form,bio:e.target.value})} style={{...is,resize:"vertical"}}/>
                    </FF>
                    <div style={{display:"flex",gap:20,marginBottom:20}}>
                      {[["licensed","Licensed"],["insured","Insured"]].map(([k,l])=>(
                        <label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                          <input type="checkbox" checked={form[k]} onChange={e=>setForm({...form,[k]:e.target.checked})} style={{accentColor:"#2E6B3E",width:16,height:16}}/>
                          <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:13,color:"#444"}}>{l}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <FF label="Job title"><FI value={form.title} placeholder="e.g. AC Unit Replacement — 3BR Home" onChange={v=>setForm({...form,title:v})}/></FF>
                    <FF label="Trade needed"><select value={form.trade} onChange={e=>setForm({...form,trade:e.target.value})} style={ss}>{TRADES.map(t=><option key={t}>{t}</option>)}</select></FF>
                    <div style={{display:"flex",gap:10}}>
                      <FF label="City" style={{flex:2}}><FI value={form.city} placeholder="Job location" onChange={v=>setForm({...form,city:v})}/></FF>
                      <FF label="State" style={{flex:1}}><select value={form.state} onChange={e=>setForm({...form,state:e.target.value})} style={ss}>{STATES.map(s=><option key={s}>{s}</option>)}</select></FF>
                    </div>
                    <FF label="Budget"><FI value={form.budget} placeholder="e.g. $3,000–$5,000" onChange={v=>setForm({...form,budget:v})}/></FF>
                    <FF label="Job description">
                      <textarea value={form.description} placeholder="Describe the work needed, property details, timeline…" rows={4}
                        onChange={e=>setForm({...form,description:e.target.value})} style={{...is,resize:"vertical"}}/>
                    </FF>
                    <FF label="Your contact email"><FI value={form.contact} placeholder="you@email.com" onChange={v=>setForm({...form,contact:v})}/></FF>
                    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:20}}>
                      <input type="checkbox" checked={form.urgent} onChange={e=>setForm({...form,urgent:e.target.checked})} style={{accentColor:"#C45C1A",width:16,height:16}}/>
                      <span style={{fontFamily:"'Epilogue',sans-serif",fontSize:13,color:"#C45C1A",fontWeight:600}}>Mark as urgent</span>
                    </label>
                  </>
                )}
                <button className="btn-hov" onClick={submitForm}
                  style={{width:"100%",background:"#1C1C1A",border:"none",color:"#F7F3EC",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:15,padding:"14px",cursor:"pointer",marginBottom:10}}>
                  {formType==="contractor" ? "Submit free listing" : "Post job free"}
                </button>
                <div style={{textAlign:"center",fontFamily:"'Epilogue',sans-serif",fontSize:11,color:"#aaa"}}>
                  Free · No credit card · Live for everyone immediately
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}}>
          <div style={{background:"#F7F3EC",width:"100%",maxWidth:560,padding:"24px 20px 36px",borderTop:"3px solid #1C1C1A"}}>
            {deleteSuccess ? (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:22,color:"#2E6B3E",marginBottom:8}}>Removed.</div>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:13,color:"#888"}}>Your listing has been deleted.</div>
              </div>
            ) : (
              <>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:800,fontSize:18,color:"#1C1C1A",marginBottom:6}}>Delete your listing</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:13,color:"#666",marginBottom:16,lineHeight:1.6}}>Enter the 6-digit delete code you received when you submitted this listing.</div>
                <input value={deleteCodeInput} onChange={e=>{setDeleteCodeInput(e.target.value);setDeleteError(false);}}
                  placeholder="Enter delete code" maxLength={6} inputMode="numeric"
                  style={{width:"100%",background:"#fff",border:`1px solid ${deleteError?"#EF4444":"#DDD8CE"}`,color:"#1C1C1A",padding:"12px 14px",fontSize:18,fontFamily:"'Epilogue',sans-serif",textAlign:"center",letterSpacing:"0.2em",marginBottom:6}}/>
                {deleteError && <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:12,color:"#EF4444",marginBottom:10}}>Incorrect code. Check the email you received when you listed.</div>}
                <div style={{display:"flex",gap:10,marginTop:12}}>
                  <button onClick={()=>{setDeleteModal(null);setDeleteCodeInput("");setDeleteError(false);}}
                    style={{flex:1,background:"none",border:"1px solid #DDD8CE",color:"#888",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:14,padding:"12px",cursor:"pointer"}}>
                    Cancel
                  </button>
                  <button onClick={handleSelfDelete}
                    style={{flex:1,background:"#EF4444",border:"none",color:"#fff",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:14,padding:"12px",cursor:"pointer"}}>
                    Delete listing
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ABOUT */}
      {tab==="about" && (
        <div style={{padding:18,paddingBottom:80}}>
          <div style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:12,color:"#888",letterSpacing:"0.06em",marginBottom:6}}>About ProBoard</div>
          <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:800,fontSize:26,color:"#1C1C1A",letterSpacing:"-0.02em",lineHeight:1.1,marginBottom:20}}>The trade network that works for everyone</div>
          {[
            {title:"For contractors",body:"List your business free. Your listing syncs live — everyone who visits sees it immediately. Get found by homeowners in your area, direct contact, no commissions."},
            {title:"For homeowners",body:"Post your job free. It goes live instantly and is visible to all contractors. Browse profiles, check reviews, contact directly."},
            {title:"All trades covered",body:"HVAC, roofing, plumbing, electrical, landscaping, carpentry, painting, flooring, masonry, welding, drywall, insulation, solar and more."},
            {title:"Real-time sync",body:"All listings and jobs are stored in a shared database. When someone lists their business or posts a job, everyone sees it immediately — no refresh needed."},
          ].map((s,i)=>(
            <div key={i} style={{borderTop:"1px solid #E5E0D6",paddingTop:18,marginBottom:18}}>
              <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:15,color:"#1C1C1A",marginBottom:8}}>{s.title}</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:14,color:"#555",lineHeight:1.7}}>{s.body}</div>
            </div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,background:"#DDD8CE",border:"1px solid #DDD8CE",marginTop:8,marginBottom:24}}>
            {[[contractors.length,"Contractors"],[jobs.length,"Jobs posted"],[TRADES.length,"Trades"]].map(([v,l])=>(
              <div key={l} style={{background:"#F7F3EC",padding:"16px 12px",textAlign:"center"}}>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontWeight:800,fontSize:26,color:"#1C1C1A",lineHeight:1}}>{v}</div>
                <div style={{fontFamily:"'Epilogue',sans-serif",fontSize:10,color:"#888",marginTop:4,letterSpacing:"0.04em"}}>{l}</div>
              </div>
            ))}
          </div>
          <button className="btn-hov" onClick={()=>goPost("contractor")} style={{width:"100%",background:"#1C1C1A",border:"none",color:"#F7F3EC",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:14,padding:"13px",cursor:"pointer",marginBottom:10}}>List my business free</button>
          <button className="btn-hov" onClick={()=>goPost("job")} style={{width:"100%",background:"none",border:"1px solid #1C1C1A",color:"#1C1C1A",fontFamily:"'Epilogue',sans-serif",fontWeight:700,fontSize:14,padding:"12px",cursor:"pointer"}}>Post a job free</button>
        </div>
      )}
    </div>
  );
}

const FF = ({label,children,style}) => (
  <div style={{marginBottom:16,...style}}>
    <label style={{display:"block",fontFamily:"'Epilogue',sans-serif",fontWeight:600,fontSize:11,color:"#666",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>{label}</label>
    {children}
  </div>
);
const FI = ({value,placeholder,onChange}) => <input value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} style={is}/>;
const is = {width:"100%",background:"#fff",border:"1px solid #DDD8CE",color:"#1C1C1A",padding:"10px 12px",fontSize:14,fontFamily:"'Epilogue',sans-serif"};
const ss = {width:"100%",background:"#fff",border:"1px solid #DDD8CE",color:"#1C1C1A",padding:"10px 12px",fontSize:13,fontFamily:"'Epilogue',sans-serif",cursor:"pointer"};
