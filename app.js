const App = {
  _att:null,_marks:{},_sf:"",
  routes:{
    dashboard:{title:"داشبورد",icon:"📊",fn:()=>Views.dashboard()},
    attendance:{title:"حضور و غیاب",icon:"✅",fn:()=>Views.attendance()},
    students:{title:"هنرجویان",icon:"🧑‍🎓",fn:(q)=>Views.students(q)},
    schedule:{title:"برنامه هفتگی",icon:"🗓️",fn:()=>Views.schedule()},
    events:{title:"وقایع و پیگیری",icon:"📝",fn:()=>Views.events()},
    users:{title:"کاربران",icon:"👥",fn:()=>Views.users(),roles:["manager"]},
    review:{title:"بازبینی داده",icon:"⚠️",fn:()=>Views.review(),roles:["manager"]}
  },
  async boot(){
    await DB.seed();
    const info=await DB.get("meta","info");
    document.getElementById("login-school").textContent=info.school;
    document.getElementById("login-year").textContent=info.year;
    document.getElementById("side-year").textContent=info.year;
    const u=await Auth.restore();
    if(u) this.enter(); else document.getElementById("login-screen").classList.remove("hidden");
    if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
    document.getElementById("login-btn").onclick=async()=>{
      const r=await Auth.login(document.getElementById("login-username").value,
                               document.getElementById("login-password").value);
      if(r.ok){this.enter();} else document.getElementById("login-error").textContent=r.msg; };
  },
  enter(){
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-shell").classList.remove("hidden");
    const u=Auth.current();
    document.getElementById("user-chip").innerHTML=`<b>${UI.esc(u.name)}</b>${u.roleTitle}${u.scope?" — "+u.scope:""}`;
    this.buildMenu(); this.go("dashboard");
    document.getElementById("logout-btn").onclick=async()=>{await Auth.logout();location.reload();};
  },
  buildMenu(){
    const u=Auth.current();
    const items=Object.entries(this.routes).filter(([k,v])=>!v.roles||v.roles.includes(u.role));
    document.getElementById("menu").innerHTML=items.map(([k,v])=>`<a href="#" data-r="${k}" onclick="App.go('${k}');return false">${v.icon} ${v.title}</a>`).join("");
  },
  async go(route,arg){
    const r=this.routes[route]; if(!r) return;
    document.querySelectorAll("#menu a").forEach(a=>a.classList.toggle("active",a.dataset.r===route));
    document.getElementById("page-title").textContent=r.title;
    document.getElementById("content").innerHTML=await r.fn(arg);
    this.toggleSidebar(false);
  },
  rerender(q){ const a=document.querySelector("#menu a.active"); this.go(a?a.dataset.r:"dashboard",q); },
  toggleSidebar(force){ const s=document.getElementById("sidebar");
    const open=force!==undefined?force:!s.classList.contains("open");
    s.classList.toggle("open",open); document.getElementById("overlay").classList.toggle("show",open); },
  toggleTheme(){ const d=document.documentElement.dataset.theme==="dark"?"":"dark";
    document.documentElement.dataset.theme=d; localStorage.setItem("hamyar_theme",d); },
  mark(sid,type,on){ this._marks[sid]=this._marks[sid]||{};
    this._marks[sid][type]=on;
    document.getElementById("r-"+sid).classList.toggle("absent-row",!!this._marks[sid].absent); },
  async saveAttendance(){
    const c=this._att; if(!c||!c.classId){UI.toast("کلاسی انتخاب نشده");return;}
    const absent=Object.keys(this._marks).filter(k=>this._marks[k].absent);
    const late=Object.keys(this._marks).filter(k=>this._marks[k].late&&!this._marks[k].absent);
    await DB.put("sessions",{id:"SE"+Date.now(),...c,absent,late,by:Auth.current().name,synced:false,at:new Date().toISOString()});
    await DB.audit("ثبت حضور و غیاب",`کلاس ${c.classId} بازه ${c.period}`);
    this._marks={}; UI.toast("✅ جلسه ذخیره شد"); this.go("attendance"); },
  async saveEvent(){
    const desc=document.getElementById("ev-desc").value.trim(); if(!desc){UI.toast("شرح را بنویسید");return;}
    await DB.put("events",{id:"E"+Date.now(),cat:document.getElementById("ev-cat").value,desc,
      date:J.todayFa(),by:Auth.current().name,status:"باز",synced:false,at:new Date().toISOString()});
    await DB.audit("ثبت واقعه",desc); UI.toast("ثبت شد"); this.go("events"); },
  async closeEvent(id){ const e=await DB.get("events",id); e.status="بسته"; await DB.put("events",e); this.go("events"); },
  async toggleUser(id){ const u=await DB.get("users",id); u.active=!u.active; await DB.put("users",u);
    await DB.audit((u.active?"فعال‌سازی":"غیرفعال‌سازی")+" کاربر",u.name); this.go("users"); },
  async resetPass(id){ const u=await DB.get("users",id);
    u.passwordHash=await Auth.hash("123456"); await DB.put("users",u);
    await DB.audit("بازنشانی رمز کاربر",u.name); UI.toast("رمز به 123456 بازنشانی شد"); }
};
document.documentElement.dataset.theme=localStorage.getItem("hamyar_theme")||"";
App.boot();
