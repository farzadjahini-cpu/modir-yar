// تبدیل ساده تاریخ میلادی <-> شمسی (الگوریتم استاندارد)
const J = (() => {
  const div = (a,b)=>~~(a/b);
  function g2j(gy,gm,gd){
    const gdm=[0,31,59,90,120,151,181,212,243,273,304,334];
    let gy2=(gm>2)?(gy+1):gy;
    let days=355666+(365*gy)+div(gy2+3,4)-div(gy2+99,100)+div(gy2+399,400)+gd+gdm[gm-1];
    let jy=-1595+(33*div(days,12053)); days%=12053;
    jy+=4*div(days,1461); days%=1461;
    if(days>365){jy+=div(days-1,365); days=(days-1)%365;}
    const jm=(days<186)?1+div(days,31):7+div(days-186,30);
    const jd=1+((days<186)?(days%31):((days-186)%30));
    return [jy,jm,jd];
  }
  function j2g(jy,jm,jd){
    jy+=1595;
    const days=-355668+(365*jy)+div(jy,33)*8+div(((jy%33)+3),4)+jd+((jm<7)?((jm-1)*31):(((jm-7)*30)+186));
    let gy=400*div(days,146097); days%=146097;
    if(days>36524){gy+=100*div(--days,36524); days%=36524; if(days>=365)days++;}
    gy+=4*div(days,1461); days%=1461;
    if(days>365){gy+=div(days-1,365); days=(days-1)%365;}
    const gdm=[0,31,((gy%4===0&&gy%100!==0)||gy%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
    let gm=1; while(gm<=12&&days>gdm[gm]){days-=gdm[gm];gm++;}
    return [gy,gm,days];
  }
  const DAYS_FA=["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
  const MONTHS_FA=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
  return {
    today(){ const d=new Date(); return g2j(d.getFullYear(),d.getMonth()+1,d.getDate()); },
    fmt(jd){ return `${jd[2]} ${MONTHS_FA[jd[1]-1]} ${jd[0]}`; },
    todayFa(){ return this.fmt(this.today()); },
    dayName(d=new Date()){ return DAYS_FA[d.getDay()]; },
    weekdayIndex(d=new Date()){ return (d.getDay()+1)%7; }, // 0=شنبه
    toStr(jd){ return `${jd[0]}/${String(jd[1]).padStart(2,"0")}/${String(jd[2]).padStart(2,"0")}`; },
    parse(s){ const p=s.split("/").map(Number); return (p.length===3&&p[0]>1200)?p:null; },
    addDays(jd,n){ const g=j2g(...jd); const d=new Date(g[0],g[1]-1,g[2]+n); return g2j(d.getFullYear(),d.getMonth()+1,d.getDate()); }
  };
})();
