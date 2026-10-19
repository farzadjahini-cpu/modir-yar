// احراز هویت و کنترل دسترسی مبتنی بر نقش (RBAC)
const Auth = (() => {
  let _user=null;
  const SESSION_KEY="hamyar_session";
  const ROLES={manager:"مدیر",deputy_technical:"معاون فنی",deputy_education:"معاون آموزشی",supervisor:"سرپرست کارگاه"};
  async function hash(str){
    const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("hamyar::"+str));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  return {
    ROLES,
    async login(username,password){
      const users=await DB.getAll("users");
      const u=users.find(x=>x.username===username.trim());
      if(!u) return {ok:false,msg:"نام کاربری یافت نشد"};
      if(!u.active) return {ok:false,msg:"این حساب غیرفعال است؛ با مدیر تماس بگیرید"};
      const h=await hash(password);
      if(h!==u.passwordHash) return {ok:false,msg:"رمز عبور اشتباه است"};
      _user=u; sessionStorage.setItem(SESSION_KEY,JSON.stringify({uid:u.id}));
      await DB.audit("ورود به سیستم",""); return {ok:true,user:u};
    },
    async restore(){
      const s=sessionStorage.getItem(SESSION_KEY); if(!s) return null;
      const {uid}=JSON.parse(s); _user=await DB.get("users",uid);
      return _user;
    },
    async logout(){ if(_user) await DB.audit("خروج از سیستم",""); _user=null; sessionStorage.removeItem(SESSION_KEY); },
    current(){ return _user; },
    can(scope){ // scope: 'all' | 'workshop' | 'general' | major-name
      if(!_user) return false;
      if(_user.role==="manager") return true;
      if(scope==="all") return ["deputy_technical","deputy_education"].includes(_user.role);
      if(scope==="workshop") return ["deputy_technical","supervisor"].includes(_user.role);
      if(scope==="general") return ["deputy_education"].includes(_user.role);
      if(_user.role==="supervisor") return _user.scope===scope;
      return false;
    },
    visibleClasses(classes){
      const u=_user; if(!u) return [];
      if(u.role==="manager"||u.role.startsWith("deputy")) return classes;
      return classes.filter(c=>c.major===u.scope);
    }
  };
})();
