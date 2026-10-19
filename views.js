const Views = {
  async dashboard(){
    const [students,classes,sessions,events]=await Promise.all(
      [DB.getAll("students"),DB.getAll("classes"),DB.getAll("sessions"),DB.getAll("events")]);
    const vis=Auth.visibleClasses(classes);
    const vStudents=students.filter(s=>vis.some(c=>c.id===s.classId));
    const today=J.dayName();
    const sched=(await DB.getAll("schedule")).filter(s=>s.day===today);
    const openEv=events.filter(e=>e.status!=="بسته").length;
    return `<div class="cards">
      <div class="card"><h3>هنرجویان (محدوده شما)</h3><div class="num">${vStudents.length}</div></div>
      <div class="card"><h3>کلاس‌ها</h3><div class="num">${vis.length}</div></div>
      <div class="card"><h3>جلسات امروز (${today})</h3><div class="num">${sched.length}</div></div>
      <div class="card"><h3>وقایع باز</h3><div class="num">${openEv}</div></div>
    </div>
    <div class="panel"><h3>جلسات امروز — ${today} ${J.todayFa()}</h3>
    ${sched.length?`<table><tr><th>بازه</th><th>کلاس</th><th>درس</th><th>معلم</th></tr>${sched.map(s=>{const c=classes.find(x=>x.grade===s.grade&&x.major===s.major);const ok=vis.some(x=>x.grade===s.grade&&x.major===s.major);return ok?`<tr><td>${s.period}</td><td>${c?c.title:s.grade+" "+s.major}</td><td>${UI.esc(s.lesson)}</td><td>${UI.esc(s.teacher)}</td></tr>`:"";}).join("")}</table>`:UI.empty("امروز جلسه‌ای در برنامه نیست")}</div>`;
  },
  async students(q=""){
    const [students,classes]=await Promise.all([DB.getAll("students"),DB.getAll("classes")]);
    const vis=Auth.visibleClasses(classes);
    let rows=students.filter(s=>vis.some(c=>c.id===s.classId));
    if(q) rows=rows.filter(s=>(s.firstName+" "+s.lastName).includes(q));
    const byClass={}; rows.forEach(s=>{(byClass[s.classId]=byClass[s.classId]||[]).push(s)});
    return `<div class="panel"><input id="stu-q" placeholder="🔎 جستجوی نام هنرجو..." value="${UI.esc(q)}" oninput="App.rerender(this.value)"></div>
    ${Object.keys(byClass).sort().map(cid=>{const c=classes.find(x=>x.id===cid);return `
      <div class="panel"><h3>${c.title} <span class="muted small">(${byClass[cid].length} نفر)</span></h3>
      <table><tr><th>ردیف</th><th>نام</th><th>نام خانوادگی</th></tr>
      ${byClass[cid].map((s,i)=>`<tr><td>${i+1}</td><td>${UI.esc(s.firstName)}</td><td>${UI.esc(s.lastName)}</td></tr>`).join("")}
      </table></div>`}).join("")||UI.empty("هنرجویی یافت نشد")}`;
  },
  async schedule(){
    const sched=await DB.getAll("schedule");
    const classes=await DB.getAll("classes");
    const days=["شنبه","یکشنبه","دوشنبه","سه شنبه","چهارشنبه"];
    return `<div class="panel"><h3>برنامه هفتگی</h3>
    <label>فیلتر کلاس</label><select onchange="App._sf=this.value;App.go('schedule')"><option value="">همه</option>
    ${classes.map(c=>`<option ${App._sf===c.title?"selected":""} value="${c.title}">${c.title}</option>`).join("")}</select></div>
    ${days.map(d=>{let rows=sched.filter(s=>s.day===d);
      if(App._sf)rows=rows.filter(s=>{const c=classes.find(x=>x.grade===s.grade&&x.major===s.major);return c&&c.title===App._sf});
      return rows.length?`<div class="panel"><h3>${d}</h3><table><tr><th>بازه</th><th>کلاس</th><th>درس</th><th>معلم</th></tr>
      ${rows.map(s=>{const c=classes.find(x=>x.grade===s.grade&&x.major===s.major);
        return `<tr><td>${s.period}</td><td>${c?c.title:s.grade+" "+s.major}</td><td>${UI.esc(s.lesson)}</td><td>${UI.esc(s.teacher)}</td></tr>`}).join("")}</table></div>`:""}).join("")}`;
  },
  async attendance(){
    const classes=Auth.visibleClasses(await DB.getAll("classes"));
    if(!App._att||!classes.some(c=>c.id===App._att.classId)) App._att={classId:classes[0]?.id,period:"1و2",date:J.toStr(J.today())};
    const sel=App._att;
    const students=(await DB.getAll("students")).filter(s=>s.classId===sel.classId);
    const sessions=await DB.getAll("sessions");
    return `<div class="panel"><h3>ثبت حضور و غیاب</h3><div class="row">
      <div><label>کلاس</label><select onchange="App._att.classId=this.value;App.rerender()">
        ${classes.map(c=>`<option value="${c.id}" ${sel.classId===c.id?"selected":""}>${c.title}</option>`).join("")}</select></div>
      <div><label>بازه</label><select onchange="App._att.period=this.value">
        ${["1و2","3و4","5و6","7و8"].map(p=>`<option ${sel.period===p?"selected":""}>${p}</option>`).join("")}</select></div>
      <div><label>تاریخ (شمسی)</label><input value="${sel.date}" placeholder="1405/07/25" onchange="App._att.date=this.value"></div>
      <div><button class="btn primary" onclick="App.saveAttendance()">💾 ذخیره</button></div>
      </div><p class="muted small">پیش‌فرض: همه حاضر — فقط غایب/متأخرها را تیک بزنید</p>
      <table><tr><th>نام</th><th>نام خانوادگی</th><th>غایب</th><th>متأخر</th></tr>
      ${students.map(s=>`<tr id="r-${s.id}"><td>${UI.esc(s.firstName)}</td><td>${UI.esc(s.lastName)}</td>
        <td><input type="checkbox" onchange="App.mark('${s.id}','absent',this.checked)"></td>
        <td><input type="checkbox" onchange="App.mark('${s.id}','late',this.checked)"></td></tr>`).join("")}
      </table></div>
      <div class="panel"><h3>جلسات ثبت‌شده</h3><table><tr><th>تاریخ</th><th>کلاس</th><th>بازه</th><th>غایب</th><th>متأخر</th><th>ثبت‌کننده</th></tr>
      ${sessions.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,25).map(s=>{const c=classes.find(x=>x.id===s.classId);return `<tr><td>${s.date}</td><td>${c?c.title:"-"}</td><td>${s.period}</td><td>${s.absent.length}</td><td>${s.late.length}</td><td>${UI.esc(s.by||"-")}</td></tr>`}).join("")||UI.empty("هنوز جلسه‌ای ثبت نشده")}</table></div>`;
  },
  async events(){
    const evs=(await DB.getAll("events")).sort((a,b)=>b.at.localeCompare(a.at));
    return `<div class="panel"><h3>ثبت واقعه / تخلف / پیگیری</h3><div class="row">
      <div><label>دسته</label><select id="ev-cat">${["انضباطی","آموزشی","کارگاهی","اداری"].map(c=>`<option>${c}</option>`).join("")}</select></div>
      <div style="flex:3"><label>شرح</label><input id="ev-desc" placeholder="مثلاً: غیبت مکرر بدون مجوز..."></div>
      <div><button class="btn primary" onclick="App.saveEvent()">➕ ثبت</button></div></div></div>
      <div class="panel"><h3>وقایع ثبت‌شده</h3><table><tr><th>تاریخ</th><th>ثبت‌کننده</th><th>دسته</th><th>شرح</th><th>وضعیت</th><th></th></tr>
      ${evs.map(e=>`<tr><td>${e.date}</td><td>${UI.esc(e.by)}</td><td>${e.cat}</td><td>${UI.esc(e.desc)}</td>
        <td>${UI.badge(e.status,e.status==="باز"?"warn":"ok")}</td>
        <td>${e.status==="باز"?`<button class="btn small" onclick="App.closeEvent('${e.id}')">بستن</button>`:""}</td></tr>`).join("")||UI.empty("وقایعی ثبت نشده")}</table></div>`;
  },
  async users(){
    if(Auth.current().role!=="manager") return UI.empty("دسترسی ندارید");
    const users=await DB.getAll("users");
    return `<div class="panel"><h3>مدیریت کاربران</h3><table>
      <tr><th>نام</th><th>نقش</th><th>نام کاربری</th><th>محدوده</th><th>وضعیت</th><th></th></tr>
      ${users.map(u=>`<tr><td>${UI.esc(u.name)}</td><td>${u.roleTitle}</td><td>${u.username}</td><td>${u.scope||"—"}</td>
        <td>${UI.badge(u.active?"فعال":"غیرفعال",u.active?"ok":"bad")}</td>
        <td><button class="btn small" onclick="App.toggleUser('${u.id}')">${u.active?"غیرفعال":"فعال"}</button>
        <button class="btn small" onclick="App.resetPass('${u.id}')">بازنشانی رمز</button></td></tr>`).join("")}
      </table><p class="muted small">افزودن/ویرایش نام کامل کاربران در نسخه ۱.۱ تکمیل می‌شود</p></div>`;
  },
  async review(){
    if(Auth.current().role!=="manager") return UI.empty("دسترسی ندارید");
    const r=(await DB.get("meta","dataReview"))?.items||[];
    return `<div class="panel"><h3>⚠️ ابهامات داده‌ای (${r.length} مورد) — حدس زده نشده، در انتظار تصمیم مدیر</h3>
    <table><tr><th>نوع</th><th>جزئیات</th></tr>${r.map(x=>`<tr><td>${UI.badge(x.issue,"warn")}</td><td>${UI.esc(x.detail)}</td></tr>`).join("")||UI.empty("موردی نیست")}</table>
    <p class="muted small">پس از اصلاح فایل اکسل منبع، داده‌ها دوباره وارد می‌شوند</p></div>`;
  }
};
