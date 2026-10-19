const UI = {
  toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg;
    document.getElementById("toast-wrap").appendChild(t); setTimeout(()=>t.remove(),3200); },
  esc(s){ return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); },
  badge(txt,cls=""){ return `<span class="badge ${cls}">${txt}</span>`; },
  empty(msg){ return `<div class="empty">${msg}</div>`; }
};
