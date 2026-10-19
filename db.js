// لایه داده آفلاین — IndexedDB + بذرگذاری اولیه از data/seed.json
const DB = (() => {
  const NAME="hamyar-db", VER=1; let _db=null;
  const STORES=["meta","users","classes","students","teachers","schedule","sessions","attendance","events","audit"];
  function open(){ return new Promise((res,rej)=>{
    const r=indexedDB.open(NAME,VER);
    r.onupgradeneeded=e=>{
      const db=e.target.result;
      STORES.forEach(s=>{ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:"id"}); });
    };
    r.onsuccess=e=>{_db=e.target.result;res(_db);}; r.onerror=()=>rej(r.error);
  });}
  async function tx(store,mode,fn){
    if(!_db) await open();
    return new Promise((res,rej)=>{
      const t=_db.transaction(store,mode), s=t.objectStore(store), out=fn(s);
      t.oncomplete=()=>res(out&&out._result!==undefined?out._result:out);
      t.onerror=()=>rej(t.error);
    });
  }
  const api={
    open,
    async getAll(store){ if(!_db) await open(); return new Promise(res=>{
      const r=_db.transaction(store).objectStore(store).getAll(); r.onsuccess=()=>res(r.result); });},
    async get(store,id){ if(!_db) await open(); return new Promise(res=>{
      const r=_db.transaction(store).objectStore(store).get(id); r.onsuccess=()=>res(r.result); });},
    async put(store,obj){ if(!_db) await open(); return new Promise((res,rej)=>{
      const t=_db.transaction(store,"readwrite"); t.objectStore(store).put(obj);
      t.oncomplete=res; t.onerror=()=>rej(t.error); });},
    async bulkPut(store,arr){ if(!_db) await open(); return new Promise((res,rej)=>{
      const t=_db.transaction(store,"readwrite"); const s=t.objectStore(store);
      arr.forEach(o=>s.put(o)); t.oncomplete=res; t.onerror=()=>rej(t.error); });},
    async del(store,id){ if(!_db) await open(); return new Promise((res,rej)=>{
      const t=_db.transaction(store,"readwrite"); t.objectStore(store).delete(id);
      t.oncomplete=res; t.onerror=()=>rej(t.error); });},
    async clear(store){ if(!_db) await open(); return new Promise((res,rej)=>{
      const t=_db.transaction(store,"readwrite"); t.objectStore(store).clear();
      t.oncomplete=res; t.onerror=()=>rej(t.error); });},
    async seed(force=false){
      const v=await api.get("meta","seedVersion");
      if(v && !force) return false;
      const res=await fetch("data/seed.json"); const d=await res.json();
      for(const s of ["users","classes","students","teachers","schedule"]) await api.clear(s);
      const enc=new TextEncoder();
      for(const u of d.users){ u.passwordHash=await Auth.hash(u.password); delete u.password; }
      await api.bulkPut("users",d.users);
      await api.bulkPut("classes",d.classes);
      await api.bulkPut("students",d.students);
      await api.bulkPut("teachers",d.teachers);
      await api.bulkPut("schedule",d.schedule.map((s,i)=>({id:"SC"+i,...s})));
      await api.put("meta",{id:"info",school:d.meta.school,year:d.meta.year,app:d.meta.app,version:d.meta.version});
      await api.put("meta",{id:"seedVersion",value:d.meta.version,at:Date.now()});
      await api.put("meta",{id:"dataReview",items:d.dataReview||[]});
      return true;
    },
    async audit(action,detail){
      const u=Auth.current();
      await api.put("audit",{id:"A"+Date.now()+Math.random().toString(36).slice(2,6),
        user:u?u.name:"سیستم",role:u?u.role:"-",action,detail,at:new Date().toISOString(),synced:false});
    }
  };
  return api;
})();
