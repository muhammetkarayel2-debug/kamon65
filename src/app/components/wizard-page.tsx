import { useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft, ArrowRight, AlertTriangle, Award, Plus, Trash2,
  Upload, FileText, X, Monitor, ChevronDown, ChevronUp,
  CheckCircle, Edit2, CreditCard, Building2, Info
} from "lucide-react";
import { useAuth } from "./auth-context";

/* ─── Yapı sınıfı kuralları ─── */
const YILDA_SINIFLAR: Record<number,string[]> = {
  2010:["III.B","IV.A","IV.B","V.A"],2011:["III.B","IV.A","IV.B","V.A"],
  2012:["III.B","IV.A","IV.B","V.A"],2013:["III.B","IV.A","IV.B","V.A"],
  2014:["III.B","IV.A","IV.B","V.A"],2015:["III.B","IV.A","IV.B","V.A"],
  2016:["III.B","IV.A","IV.B","V.A"],2017:["III.B","IV.A","IV.B","V.A"],
  2018:["III.B","IV.A","IV.B","V.A"],2019:["III.B","IV.A","IV.B","V.A"],
  2020:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2021:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2022:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2023:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2024:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2025:["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"],
  2026:["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"],
};
const SINIF_SIRA: Record<string,number> = {"III.B":1,"III.C":2,"IV.A":3,"IV.B":4,"IV.C":5,"V.A":6,"V.B":7,"V.C":8,"V.D":9};
const YUKSEKLIK_ESIKLER=[{max:6.49,sinif:"III.B"},{max:21.49,sinif:"III.C"},{max:51.49,sinif:"IV.A"},{max:91.49,sinif:"IV.B"},{max:9999,sinif:"IV.C"}];

// Tüm sınıflar gösterilir — müşteri özgürce seçer, filtreleme yok
const TUM_SINIFLAR = ["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"];
function gecerliSiniflar(_sozTarih?: string, _yukseklik?: number): string[] {
  return TUM_SINIFLAR;
}
function guncelSinif(yukseklik: number): string {
  return YUKSEKLIK_ESIKLER.find(e=>yukseklik<=e.max)?.sinif||"IV.C";
}
function sanitizeDate(v: string): string {
  const p=v.split("-"); if(p.length===3&&p[0].length>4){p[0]=p[0].slice(0,4);return p.join("-");} return v;
}

/* ─── Types ─── */
interface Exp {
  id:string; tip:"kat_karsiligi"|"taahhut";
  adaParsel:string; sozTarih:string; iskanTarih:string;
  alan:string; yukseklik:string; sinif:string; sinif2026:string;
  yapiTipi:string; muteahhitArsaAyni:boolean;
  bedel:string; // taahhüt
  iskanFile:File|null;
  acik:boolean; // accordion
}
interface Partner { id:string; name:string; hisse:string; tc:string; }
function mkExp(): Exp {
  return {id:crypto.randomUUID(),tip:"kat_karsiligi",adaParsel:"",sozTarih:"",iskanTarih:"",alan:"",yukseklik:"",sinif:"",sinif2026:"",yapiTipi:"",muteahhitArsaAyni:false,bedel:"",iskanFile:null,acik:true};
}
function mkPartner(): Partner { return {id:crypto.randomUUID(),name:"",hisse:"",tc:""}; }

/* ─── Helpers ─── */
function fmtNum(v:string){const r=v.replace(/\D/g,"");return r?new Intl.NumberFormat("tr-TR").format(Number(r)):"";}
function fmtPhone(v:string){const d=v.replace(/\D/g,"").slice(0,11);if(!d)return"";if(d.length<=1)return"0";if(d.length<=4)return`0(${d.slice(1)}`;if(d.length<=7)return`0(${d.slice(1,4)}) ${d.slice(4)}`;if(d.length<=9)return`0(${d.slice(1,4)}) ${d.slice(4,7)} ${d.slice(7)}`;return`0(${d.slice(1,4)}) ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9,11)}`;}
function phoneOk(v:string){return v.replace(/\D/g,"").length===11;}
function emailOk(v:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function loadLS(k:string,fb:any):any{try{const r=localStorage.getItem(k);if(r)return JSON.parse(r);}catch{}return fb;}
function saveLS(k:string,v:any){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

const COMPANIES_KEY="mock_panel_companies";
const BILLING_KEY="mock_panel_billing";

/* ─── Ücret tablosu ─── */
const PAKETLER = {
  bilgi_alma:           {label:"Bilgi Alma Danışmanlığı",       fiyat:"7.000 ₺",  aciklama:"Telefon/e-posta danışmanlığı",          hesaplama:false, basvuru:false},
  sadece_hesaplama:     {label:"İş Deneyim Hesaplama",          fiyat:"11.000 ₺", aciklama:"Hesaplama + mali yeterlilik analizi",    hesaplama:true,  basvuru:false},
  hesaplama_basvuru:    {label:"Hesaplama + Başvuru (Biz Yaparız)",fiyat:"20.000 ₺",aciklama:"Hesaplama + mali yeterlilik + başvuru",hesaplama:true,  basvuru:true},
};

/* ══════════════════ WIZARD ══════════════════ */
export function WizardPage() {
  const navigate=useNavigate();
  const loc=useLocation();
  const {user,signIn,signUp,signInWithGoogle}=useAuth() as any;
  const isUpgrade=(loc.state as any)?.isUpgrade===true;
  const upgradeId=(loc.state as any)?.companyId as string|undefined;

  const STEPS=["firma","deneyim","konum","ozet"] as const;
  type Step=typeof STEPS[number];
  const [step,setStep]=useState<Step>("firma");
  const [errors,setErrors]=useState<string[]>([]);
  const [showAuth,setShowAuth]=useState(false);
  const [authEmail,setAuthEmail]=useState(""); const [authPass,setAuthPass]=useState(""); const [authPass2,setAuthPass2]=useState(""); const [authName,setAuthName]=useState(""); const [authErr,setAuthErr]=useState(""); const [authLoading,setAuthLoading]=useState(false);

  /* Firma */
  const [companyName,setCompanyName]=useState("");
  const [taxId,setTaxId]=useState("");
  const [phone,setPhone]=useState("");
  const [email,setEmail]=useState("");
  const [companyType,setCompanyType]=useState<""|"sahis"|"limited_as"|"kooperatif">("");
  const [partners,setPartners]=useState<Partner[]>([mkPartner()]);
  const [hasKep,setHasKep]=useState<""|"yes"|"no">("");
  const [kepAddress,setKepAddress]=useState("");
  const [isFirstTime,setIsFirstTime]=useState<""|"first"|"renewal">("");

  /* Deneyim */
  const [hasYapiIsi,setHasYapiIsi]=useState(false);
  const [hasDiploma,setHasDiploma]=useState(false);
  const [hasNone,setHasNone]=useState(false);
  const [exps,setExps]=useState<Exp[]>([mkExp()]);
  const [dipName,setDipName]=useState(""); const [dipBolum,setDipBolum]=useState<""|"insaat_muhendisligi"|"mimarlik">(""); const [dipTarih,setDipTarih]=useState(""); const [dipHisse,setDipHisse]=useState(""); const [dipYil,setDipYil]=useState("");

  /* Konum */
  const [location,setLocation]=useState<""|"istanbul"|"istanbul_disi">("");
  const [city,setCity]=useState("");
  const [paket,setPaket]=useState("");
  const [upsellKabul,setUpsellKabul]=useState<boolean|null>(null);

  /* Ödeme */
  const [odemeYol,setOdemeYol]=useState<"kart"|"havale">("kart");
  const [kart,setKart]=useState({no:"",ad:"",son:"",cvv:""});

  const isLtd=companyType==="limited_as";
  const isKoop=companyType==="kooperatif";
  const atLeastOne=hasYapiIsi||hasDiploma||hasNone;

  /* Prefill yükseltme */
  useMemo(()=>{
    if(upgradeId){
      const all=loadLS(COMPANIES_KEY,[]);
      const c=all.find((x:any)=>x.id===upgradeId);
      if(c){setCompanyName(c.companyName||"");setTaxId(c.taxId||"");setPhone(c.phone||"");setEmail(c.email||"");setCompanyType(c.companyType||"");setLocation(c.location||"");setCity(c.city||"");}
    }
  },[upgradeId]);

  /* Validation ── her adım için eksik alanları döndür */
  function validateStep(s: Step): string[] {
    const errs: string[]=[];
    if(s==="firma"){
      if(companyName.trim().length<3) errs.push("Şirket adı");
      if(taxId.length<10) errs.push("Vergi no");
      if(!phoneOk(phone)) errs.push("Telefon");
      if(!emailOk(email)) errs.push("E-posta");
      if(!companyType) errs.push("Şirket türü");
      if(isLtd) partners.forEach((p,i)=>{ if(!p.name.trim()) errs.push(`${i+1}. ortak adı`); if(p.tc.length!==11) errs.push(`${i+1}. ortak TC`); });
      if(!hasKep) errs.push("KEP durumu");
      if(hasKep==="yes"&&!kepAddress.trim()) errs.push("KEP adresi");
      if(!isKoop&&!isFirstTime) errs.push("Belge durumu (ilk/yenileme)");
    }
    if(s==="deneyim"){
      if(!atLeastOne) errs.push("En az bir yeterlilik seçiniz");
      if(hasYapiIsi) exps.forEach((e,i)=>{
        if(!e.sozTarih) errs.push(`İş ${i+1}: Sözleşme tarihi`);
        if(e.iskanTarih&&e.sozTarih&&new Date(e.sozTarih)>new Date(e.iskanTarih)) errs.push(`İş ${i+1}: Sözleşme tarihi iskan tarihinden büyük olamaz`);
        if(e.tip==="kat_karsiligi"){
          if(!e.alan) errs.push(`İş ${i+1}: İnşaat alanı`);
          if(!e.sinif) errs.push(`İş ${i+1}: Yapı sınıfı`);
          if(!e.iskanFile) errs.push(`İş ${i+1}: İskan belgesi`);
        }
        if(e.tip==="taahhut"&&!e.bedel) errs.push(`İş ${i+1}: Sözleşme bedeli`);
      });
      if(hasDiploma){ if(!dipName.trim()) errs.push("Diploma: Ad soyad"); if(!dipBolum) errs.push("Diploma: Bölüm"); if(!dipTarih) errs.push("Diploma: Mezuniyet tarihi"); }
    }
    if(s==="konum"){
      if(!location) errs.push("Şirket faaliyet adresi");
      if(location==="istanbul_disi"&&!city.trim()) errs.push("İl");
      if(!paket) errs.push("Hizmet paketi");
    }
    return errs;
  }

  function handleNext(){
    const errs=validateStep(step);
    if(errs.length>0){setErrors(errs);window.scrollTo({top:0,behavior:"smooth"});return;}
    setErrors([]);
    const idx=STEPS.indexOf(step);
    if(step==="ozet"){handleFinish();return;}
    if(idx<STEPS.length-1) setStep(STEPS[idx+1]);
  }
  function handleBack(){setErrors([]);const idx=STEPS.indexOf(step);if(idx>0)setStep(STEPS[idx-1]);}

  function saveCompany(overrideEmail?:string){
    const all=loadLS(COMPANIES_KEY,[]);
    const existId=upgradeId;
    const byId=existId?all.find((c:any)=>c.id===existId):null;
    const resolvedId=byId?.id||crypto.randomUUID();
    let curEmail=overrideEmail||"";
    if(!curEmail)try{const s=localStorage.getItem("mock_auth_user");if(s)curEmail=JSON.parse(s).user?.email||"";}catch{}

    const secilenPaket=PAKETLER[paket as keyof typeof PAKETLER];
    const hizmetModeli=(paket==="hesaplama_basvuru"||(paket==="sadece_hesaplama"&&upsellKabul===true))?"biz_yapiyoruz":"musteri_yapiyor";

    const data:any={
      id:resolvedId, companyName, taxId, phone, email, companyType,
      location, city, partners:isLtd?partners:[],
      kepAddress:hasKep==="yes"?kepAddress:"",
      isFirstTime, selectedService:paket,
      serviceLabel:secilenPaket?.label||"",
      hizmetModeli, userEmail:curEmail||email,
      appStatus:"pending_payment",
      qualifications:!isKoop?{
        hasYapiIsi, hasDiploma, hasNone,
        experiences:exps.map(e=>({
          isDeneyimiTipi:e.tip, sozlesmeTarihi:e.sozTarih, occupancyDate:e.iskanTarih,
          totalArea:e.alan, buildingHeight:e.yukseklik, buildingClass:e.sinif,
          yapiSinifi2026:e.sinif2026, adaParsel:e.adaParsel, sozlesmeBedeli:e.bedel,
          muteahhitArsaSahibiAyni:e.muteahhitArsaAyni, yapiTipi:e.yapiTipi,
        })),
        diploma:hasDiploma?{partnerName:dipName,department:dipBolum,gradDate:dipTarih,sharePercent:dipHisse,partnershipYears:dipYil}:null,
      }:undefined,
      createdAt:byId?.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    };
    saveLS(COMPANIES_KEY,byId?all.map((c:any)=>c.id===resolvedId?data:c):[...all,data]);

    // Fatura oluştur
    const fiyatlar:Record<string,number>={bilgi_alma:7000,sadece_hesaplama:11000,hesaplama_basvuru:20000};
    let tutar=fiyatlar[paket]||0;
    if(upsellKabul===true&&paket==="sadece_hesaplama") tutar+=9000;
    const billing=loadLS(BILLING_KEY,{});
    const cb=billing[resolvedId]||[];
    cb.push({id:crypto.randomUUID(),companyId:resolvedId,date:new Date().toISOString(),dueDate:new Date(Date.now()+14*86400000).toISOString(),description:secilenPaket?.label||(paket),amount:`${tutar.toLocaleString("tr-TR")} ₺`,amountNum:tutar,status:"unpaid"});
    if(upsellKabul===true&&paket==="sadece_hesaplama") cb.push({id:crypto.randomUUID(),companyId:resolvedId,date:new Date().toISOString(),dueDate:new Date(Date.now()+14*86400000).toISOString(),description:"Başvuru Hizmet Bedeli Farkı",amount:"9.000 ₺",amountNum:9000,status:"unpaid"});
    billing[resolvedId]=cb; saveLS(BILLING_KEY,billing);
  }

  function handleFinish(){
    try{const s=localStorage.getItem("mock_auth_user");if(s&&JSON.parse(s).user?.email){saveCompany();navigate("/dashboard",{state:{defaultTab:"odeme"}});return;}}catch{}
    if(user){saveCompany();navigate("/dashboard",{state:{defaultTab:"odeme"}});return;}
    setAuthEmail(email);setShowAuth(true);
  }
  async function handleAuth(){
    if(!authEmail||!authPass||authPass.length<6||authPass!==authPass2){setAuthErr("Bilgileri kontrol edin.");return;}
    setAuthErr("");setAuthLoading(true);
    try{const r=await signUp(authEmail,authPass,authName||authEmail.split("@")[0]);if(r.error){setAuthErr(r.error);setAuthLoading(false);return;}setShowAuth(false);saveCompany(authEmail);navigate("/dashboard",{state:{defaultTab:"odeme"}});}
    catch(e:any){setAuthErr(e.message||"Hata");}finally{setAuthLoading(false);}
  }

  /* Exp helpers */
  const updExp=(id:string,f:keyof Exp,v:any)=>setExps(p=>p.map(x=>x.id===id?{...x,[f]:v}:x));
  const toggleAcik=(id:string)=>setExps(p=>p.map(x=>x.id===id?{...x,acik:!x.acik}:x));

  /* Upsell gösterilmeli mi */
  // Upsell sadece "sadece hesaplama" seçiliyse göster — hesaplama+başvuru seçilmişse asla
  const showUpsell=location==="istanbul"&&paket==="sadece_hesaplama";

  /* ─── RENDER ─── */
  const STEP_LABELS:{[k in Step]:{label:string;sub:string}}={
    firma:{label:"Şirket bilgileri",sub:"Firma tipi, iletişim"},
    deneyim:{label:"İş deneyimi",sub:"Yapım işleri, diploma"},
    konum:{label:"Konum & hizmet",sub:"Paket seçimi"},
    ozet:{label:"Özet",sub:"Bilgileri gözden geçir"},

  };
  const stepIdx=STEPS.indexOf(step);

  const S={fontFamily:"Inter,-apple-system,sans-serif"};
  const iCls="w-full px-3 py-2.5 bg-[#F3F0EB] border border-transparent rounded-lg text-sm focus:outline-none focus:border-[#C9952B] focus:ring-1 focus:ring-[#C9952B]";
  const iErr="w-full px-3 py-2.5 bg-red-50 border border-red-300 rounded-lg text-sm focus:outline-none";

  return (
    <div style={{minHeight:"100vh",background:"#F8F7F4",...S}}>
      {/* Topbar */}
      <div style={{background:"#0B1D3A",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px"}}>
        <button onClick={()=>navigate("/")} style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,0.55)",fontSize:13,background:"none",border:"none",cursor:"pointer"}}>
          <ArrowLeft size={14} color="rgba(255,255,255,0.55)"/> Ana sayfa
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Award size={18} color="#C9952B"/>
          <span style={{color:"white",fontSize:14,fontWeight:500}}>muteahhitlikbelgesi<span style={{color:"#C9952B"}}>.com</span></span>
        </div>
        <div style={{width:120}}/>
      </div>

      {/* Masaüstü banner */}
      <div style={{background:"rgba(201,149,43,0.08)",borderBottom:"1px solid rgba(201,149,43,0.2)",padding:"8px 32px",display:"flex",alignItems:"center",gap:8}}>
        <Monitor size={14} color="#C9952B"/>
        <span style={{fontSize:12,color:"#7A6030"}}>Bu formu masaüstü bilgisayardan doldurmanız önerilir.</span>
      </div>

      {/* İki kolon */}
      <div style={{display:"flex",minHeight:"calc(100vh - 80px)"}}>
        {/* Sidebar */}
        <div style={{width:260,background:"white",borderRight:"1px solid rgba(11,29,58,0.08)",padding:"28px 20px",display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:500,color:"#5A6478",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14,padding:"0 8px"}}>Başvuru adımları</div>
          {STEPS.map((s,i)=>{
            const done=i<stepIdx; const active=i===stepIdx;
            const {label,sub}=STEP_LABELS[s];
            return (
              <div key={s}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px",borderRadius:10,background:active?"rgba(201,149,43,0.08)":"transparent"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,flexShrink:0,background:done?"#C9952B":active?"#0B1D3A":"rgba(11,29,58,0.06)",color:done||active?"white":"#5A6478"}}>
                    {done?"✓":i+1}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:i>stepIdx?"#5A6478":"#0B1D3A"}}>{label}</div>
                    <div style={{fontSize:11,color:"#5A6478",marginTop:1}}>{sub}</div>
                  </div>
                </div>
                {i<STEPS.length-1&&<div style={{width:1,height:14,background:"rgba(11,29,58,0.08)",margin:"2px 0 2px 22px"}}/>}
              </div>
            );
          })}
          <div style={{flex:1}}/>
          <div style={{padding:"12px",background:"rgba(11,29,58,0.04)",borderRadius:10,marginTop:16}}>
            <div style={{fontSize:12,fontWeight:500,color:"#0B1D3A",marginBottom:4}}>Yardım mı lazım?</div>
            <div style={{fontSize:11,color:"#5A6478",lineHeight:1.5}}>Formu doldurmakta zorlanıyorsanız bizi arayın.</div>
          </div>
        </div>

        {/* İçerik */}
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{flex:1,padding:"36px 48px",maxWidth:820}}>

            {/* Hata banner */}
            {errors.length>0&&(
              <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"14px 16px",marginBottom:24,display:"flex",gap:10,alignItems:"flex-start"}}>
                <AlertTriangle size={16} color="#DC2626" style={{flexShrink:0,marginTop:2}}/>
                <div>
                  <p style={{fontSize:13,color:"#B91C1C",fontWeight:500,margin:"0 0 6px"}}>Lütfen aşağıdaki alanları doldurunuz</p>
                  <ul style={{margin:0,paddingLeft:16}}>{errors.map((e,i)=><li key={i} style={{fontSize:12,color:"#B91C1C"}}>{e}</li>)}</ul>
                </div>
              </div>
            )}

            {/* ─── ADIM: FİRMA ─── */}
            {step==="firma"&&(
              <div>
                <h2 style={{fontSize:22,fontWeight:500,color:"#0B1D3A",margin:"0 0 6px",letterSpacing:"-0.02em"}}>Şirket bilgileri</h2>
                <p style={{fontSize:13,color:"#5A6478",margin:"0 0 28px"}}>Firma bilgilerinizi eksiksiz doldurunuz.</p>

                <div style={{background:"rgba(201,149,43,0.07)",border:"1px solid rgba(201,149,43,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:24,display:"flex",gap:10}}>
                  <Info size={14} color="#C9952B" style={{flexShrink:0,marginTop:1}}/>
                  <p style={{fontSize:12,color:"#7A6030",margin:0}}>Girdiğiniz tüm bilgilerin doğru olduğundan emin olun. Yanlış bilgi başvurunuzun reddedilmesine yol açabilir.</p>
                </div>

                {/* Şirket türü */}
                <div style={{marginBottom:22}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>Şirket türü<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {(["sahis","limited_as","kooperatif"] as const).map((v,_i)=>{
                      const lbls={sahis:"Şahıs firması",limited_as:"Limited / A.Ş.",kooperatif:"Kooperatif"};
                      return (
                        <button key={v} onClick={()=>setCompanyType(v)} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${companyType===v?"#C9952B":"rgba(11,29,58,0.1)"}`,background:companyType===v?"rgba(201,149,43,0.08)":"white",cursor:"pointer",display:"flex",alignItems:"center",gap:8,textAlign:"left"}}>
                          <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${companyType===v?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            {companyType===v&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C9952B"}}/>}
                          </div>
                          <span style={{fontSize:13,color:"#0B1D3A"}}>{lbls[v]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Temel bilgiler */}
                <div style={{marginBottom:22}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>Temel bilgiler<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Şirket / firma adı *</label>
                      <input value={companyName} onChange={e=>setCompanyName(e.target.value.slice(0,100))} placeholder="ABC İnşaat Taahhüt A.Ş." className={iCls} style={{width:"100%",padding:"9px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Vergi no *</label>
                      <input value={taxId} onChange={e=>setTaxId(e.target.value.replace(/\D/g,"").slice(0,11))} placeholder="1234567890" style={{width:"100%",padding:"9px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Telefon *</label>
                      <input value={phone} onChange={e=>{const d=e.target.value.replace(/\D/g,"").slice(0,11);setPhone(fmtPhone(d.startsWith("0")?d:"0"+d));}} placeholder="0(5XX) XXX XX XX" style={{width:"100%",padding:"9px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>E-posta *</label>
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value.slice(0,100))} placeholder="info@firma.com" style={{width:"100%",padding:"9px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                    </div>
                  </div>
                </div>

                {/* Ortaklar — Ltd/AŞ */}
                {isLtd&&(
                  <div style={{marginBottom:22}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                      Ortaklar
                      <div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                      <button onClick={()=>setPartners(p=>[...p,mkPartner()])} style={{fontSize:12,color:"#C9952B",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>
                        <Plus size={12}/> Ortak ekle
                      </button>
                    </div>
                    {partners.map((p,i)=>(
                      <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 32px",gap:10,marginBottom:10,background:"rgba(240,237,232,0.4)",padding:"12px",borderRadius:8}}>
                        <div>
                          <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Ad Soyad *</label>
                          <input value={p.name} onChange={e=>setPartners(ps=>ps.map(x=>x.id===p.id?{...x,name:e.target.value.slice(0,60)}:x))} placeholder="Ad Soyad" style={{width:"100%",padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        </div>
                        <div>
                          <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>TC Kimlik No *</label>
                          <input value={p.tc} onChange={e=>setPartners(ps=>ps.map(x=>x.id===p.id?{...x,tc:e.target.value.replace(/\D/g,"").slice(0,11)}:x))} placeholder="12345678901" style={{width:"100%",padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        </div>
                        <div>
                          <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Hisse %</label>
                          <input value={p.hisse} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,3);if(Number(v)<=100)setPartners(ps=>ps.map(x=>x.id===p.id?{...x,hisse:v}:x));}} placeholder="51" style={{width:"100%",padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        </div>
                        <button onClick={()=>{if(partners.length>1)setPartners(ps=>ps.filter(x=>x.id!==p.id));}} style={{height:36,alignSelf:"flex-end",display:"flex",alignItems:"center",justifyContent:"center",border:"none",background:"none",cursor:"pointer",color:"#EF4444"}}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ek bilgiler */}
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>Ek bilgiler<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/></div>
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    {/* KEP */}
                    <div>
                      <p style={{fontSize:13,color:"#5A6478",margin:"0 0 8px"}}>KEP adresiniz var mı? *</p>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        {[["yes","Evet, var"],["no","Hayır / Bilmiyorum"]].map(([v,l])=>(
                          <button key={v} onClick={()=>{setHasKep(v as any);if(v==="no")setKepAddress("");}} style={{padding:"11px 14px",borderRadius:9,border:`1px solid ${hasKep===v?"#C9952B":"rgba(11,29,58,0.1)"}`,background:hasKep===v?"rgba(201,149,43,0.08)":"white",cursor:"pointer",display:"flex",alignItems:"center",gap:8,textAlign:"left"}}>
                            <div style={{width:13,height:13,borderRadius:"50%",border:`2px solid ${hasKep===v?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{hasKep===v&&<div style={{width:5,height:5,borderRadius:"50%",background:"#C9952B"}}/>}</div>
                            <span style={{fontSize:13,color:"#0B1D3A"}}>{l}</span>
                          </button>
                        ))}
                      </div>
                      {hasKep==="yes"&&(
                        <div style={{marginTop:10}}>
                          <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:4}}>KEP adresi *</label>
                          <input value={kepAddress} onChange={e=>setKepAddress(e.target.value.slice(0,100))} placeholder="firma@hs01.kep.tr" style={{width:"100%",padding:"8px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        </div>
                      )}
                    </div>
                    {/* İlk mi yenileme mi */}
                    {!isKoop&&(
                      <div>
                        <p style={{fontSize:13,color:"#5A6478",margin:"0 0 8px"}}>Müteahhitlik belgesi daha önce alındı mı? *</p>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                          {[["first","İlk kez alınacak"],["renewal","Yenileme / yükseltme"]].map(([v,l])=>(
                            <button key={v} onClick={()=>setIsFirstTime(v as any)} style={{padding:"11px 14px",borderRadius:9,border:`1px solid ${isFirstTime===v?"#C9952B":"rgba(11,29,58,0.1)"}`,background:isFirstTime===v?"rgba(201,149,43,0.08)":"white",cursor:"pointer",display:"flex",alignItems:"center",gap:8,textAlign:"left"}}>
                              <div style={{width:13,height:13,borderRadius:"50%",border:`2px solid ${isFirstTime===v?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{isFirstTime===v&&<div style={{width:5,height:5,borderRadius:"50%",background:"#C9952B"}}/>}</div>
                              <span style={{fontSize:13,color:"#0B1D3A"}}>{l}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── ADIM: DENEYİM ─── */}
            {step==="deneyim"&&(
              <div>
                <h2 style={{fontSize:22,fontWeight:500,color:"#0B1D3A",margin:"0 0 6px",letterSpacing:"-0.02em"}}>İş deneyimi & yeterlilik</h2>
                <p style={{fontSize:13,color:"#5A6478",margin:"0 0 20px"}}>Sahip olduğunuz yeterlilikleri seçin.</p>

                {/* İskan uyarısı */}
                <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",gap:10}}>
                  <AlertTriangle size={15} color="#DC2626" style={{flexShrink:0,marginTop:1}}/>
                  <p style={{fontSize:12,color:"#991B1B",margin:0,lineHeight:1.6}}><strong>İskan belgelerinizi hazır bulundurun.</strong> Her yapım işi için taranmış iskan/kabul belgesi PDF olarak zorunludur.</p>
                </div>

                {/* Yeterlilik seçimi */}
                {!isUpgrade&&(
                  <div style={{marginBottom:22}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>Yeterlilik türü<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/></div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {[{k:"yapiIsi",checked:hasYapiIsi,set:()=>{setHasYapiIsi(!hasYapiIsi);if(!hasYapiIsi)setHasNone(false);},l:"Yapım işim var",s:"Kat karşılığı veya taahhüt/ihale"},
                        {k:"diploma",checked:hasDiploma,set:()=>{setHasDiploma(!hasDiploma);if(!hasDiploma)setHasNone(false);},l:"Diploma başvurusu",s:"İnşaat mühendisliği veya mimarlık"},
                        {k:"none",checked:hasNone,set:()=>{const n=!hasNone;setHasNone(n);if(n){setHasYapiIsi(false);setHasDiploma(false);}},l:"Belge / iş deneyimim yok",s:"Şu an kullanılabilecek belge bulunmuyor"},
                      ].map(({k,checked,set,l,s})=>(
                        <button key={k} onClick={set} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${checked?"#C9952B":"rgba(11,29,58,0.1)"}`,background:checked?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"flex-start",gap:10}}>
                          <div style={{width:15,height:15,borderRadius:3,border:`2px solid ${checked?"#C9952B":"rgba(11,29,58,0.2)"}`,background:checked?"#C9952B":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                            {checked&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <div><p style={{fontSize:13,color:"#0B1D3A",margin:"0 0 2px",fontWeight:500}}>{l}</p><p style={{fontSize:11,color:"#5A6478",margin:0}}>{s}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* İş girişleri — Accordion */}
                {(hasYapiIsi||isUpgrade)&&(
                  <div style={{marginBottom:22}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase"}}>İş deneyim girişleri</div>
                      <button onClick={()=>{const n=mkExp();setExps(p=>[...p.map(x=>({...x,acik:false})),n]);}} style={{display:"flex",alignItems:"center",gap:5,background:"#0B1D3A",color:"white",border:"none",padding:"7px 14px",borderRadius:8,fontSize:12,cursor:"pointer"}}>
                        <Plus size={13}/> İş ekle
                      </button>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {exps.map((e,i)=>{
                        const yukseklik=parseFloat(e.yukseklik)||0;
                        const siniflar=gecerliSiniflar(e.sozTarih,yukseklik);
                        const sozYil=e.sozTarih?new Date(e.sozTarih).getFullYear():0;
                        const tarihHata=e.sozTarih&&e.iskanTarih&&new Date(e.sozTarih)>new Date(e.iskanTarih);

                        return (
                          <div key={e.id} style={{border:`1px solid ${e.acik?"#C9952B":"rgba(11,29,58,0.09)"}`,borderRadius:11,overflow:"hidden",background:"white"}}>
                            {/* Satır özeti */}
                            <div onClick={()=>toggleAcik(e.id)} style={{display:"flex",alignItems:"center",height:46,cursor:"pointer",background:e.acik?"rgba(201,149,43,0.03)":"white"}}>
                              <div style={{width:44,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                <div style={{width:21,height:21,borderRadius:"50%",background:e.acik?"#C9952B":"#0B1D3A",color:"white",fontSize:11,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>
                              </div>
                              <span style={{fontSize:12,fontWeight:500,color:e.acik?"#C9952B":"#0B1D3A",whiteSpace:"nowrap",paddingRight:4}}>{e.tip==="kat_karsiligi"?"Kat karşılığı":"Taahhüt / ihale"}</span>
                              <div style={{width:1,height:20,background:"rgba(11,29,58,0.08)",margin:"0 12px",flexShrink:0}}/>
                              <div style={{display:"flex",flex:1,overflow:"hidden"}}>
                                {[
                                  {l:"Ada/Parsel",v:e.adaParsel||"—"},
                                  {l:"Sözleşme",v:e.sozTarih||"—"},
                                  {l:"Alan",v:e.alan?`${e.alan} m²`:"—"},
                                  {l:"Yükseklik",v:e.yukseklik?`${e.yukseklik} m`:"—"},
                                  {l:"Sınıf",v:e.sinif||"—"},
                                  {l:"İskan",v:e.iskanFile?"✓ Yüklendi":"Yüklenmedi",color:e.iskanFile?"#16a34a":"#EF4444"},
                                ].map(({l,v,color})=>(
                                  <div key={l} style={{display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 11px",borderRight:"1px solid rgba(11,29,58,0.06)"}}>
                                    <div style={{fontSize:10,color:"#9CA3AF",marginBottom:1,whiteSpace:"nowrap"}}>{l}</div>
                                    <div style={{fontSize:12,color:color||"#0B1D3A",fontWeight:500,whiteSpace:"nowrap"}}>{v}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",flexShrink:0}}>
                                {e.acik?<ChevronUp size={14} color="#5A6478"/>:<ChevronDown size={14} color="#5A6478"/>}
                                {exps.length>1&&<button onClick={ev=>{ev.stopPropagation();setExps(p=>p.filter(x=>x.id!==e.id));}} style={{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",border:"none",background:"none",cursor:"pointer",color:"#EF4444"}}><Trash2 size={13}/></button>}
                              </div>
                            </div>

                            {/* Açık form */}
                            {e.acik&&(
                              <div style={{padding:"18px 20px",borderTop:"1px solid rgba(11,29,58,0.07)",background:"#FAFAF9"}}>
                                {/* İş türü */}
                                <div style={{display:"flex",gap:8,marginBottom:16}}>
                                  {[["kat_karsiligi","Kat karşılığı"],["taahhut","Taahhüt / ihale"]].map(([v,l])=>(
                                    <button key={v} onClick={()=>updExp(e.id,"tip",v)} style={{padding:"7px 18px",borderRadius:8,border:`1px solid ${e.tip===v?"#C9952B":"rgba(11,29,58,0.1)"}`,background:e.tip===v?"rgba(201,149,43,0.08)":"white",cursor:"pointer",fontSize:13,fontWeight:e.tip===v?500:400,color:"#0B1D3A"}}>{l}</button>
                                  ))}
                                </div>

                                {/* Temel bilgiler */}
                                <div style={{fontSize:10,fontWeight:500,color:"#C9952B",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10}}>Temel bilgiler</div>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                                  <div><label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Ada / parsel</label><input value={e.adaParsel} onChange={ev=>updExp(e.id,"adaParsel",ev.target.value.slice(0,15))} placeholder="120/5" maxLength={15} style={{width:"100%",padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}} /></div>
                                  <div>
                                    <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Sözleşme tarihi *</label>
                                    <input type="date" value={e.sozTarih} onChange={ev=>{const v=sanitizeDate(ev.target.value);updExp(e.id,"sozTarih",v);}} min="2010-01-01" max="2026-12-31" style={{width:"100%",padding:"8px 10px",background:tarihHata?"#FEF2F2":"#F3F0EB",border:`1px solid ${tarihHata?"#EF4444":"transparent"}`,borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                                    {tarihHata&&<p style={{fontSize:11,color:"#EF4444",margin:"3px 0 0"}}>Sözleşme tarihi iskan tarihinden büyük olamaz</p>}
                                  </div>
                                  <div><label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>İskan / kabul tarihi</label><input type="date" value={e.iskanTarih} onChange={ev=>updExp(e.id,"iskanTarih",sanitizeDate(ev.target.value))} min="2010-01-01" max="2026-12-31" style={{width:"100%",padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}} /></div>
                                </div>

                                {/* Taahhüt */}
                                {e.tip==="taahhut"&&(
                                  <div style={{marginBottom:16}}>
                                    <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Sözleşme bedeli (₺) *</label>
                                    <input value={e.bedel} onChange={ev=>{const r=ev.target.value.replace(/\D/g,"");updExp(e.id,"bedel",r?parseInt(r).toLocaleString("tr-TR"):"");}} placeholder="1.000.000" style={{width:260,padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none"}} />
                                  </div>
                                )}

                                {/* Kat karşılığı */}
                                {e.tip==="kat_karsiligi"&&(
                                  <>
                                    {/* Yapı bilgileri */}
                                    <div style={{fontSize:10,fontWeight:500,color:"#C9952B",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10,paddingTop:14,borderTop:"1px solid rgba(11,29,58,0.06)"}}>Yapı bilgileri</div>
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                                      <div><label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>İnşaat alanı (m²) *</label><input value={e.alan} onChange={ev=>{const f=fmtNum(ev.target.value);if(ev.target.value.replace(/\D/g,"").length<=9)updExp(e.id,"alan",f);}} placeholder="5.000" style={{width:"100%",padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}} /></div>
                                      <div>
                                        <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Yapı yüksekliği (m)</label>
                                        <input value={e.yukseklik} onChange={ev=>{const v=ev.target.value.replace(/[^0-9.]/g,"").slice(0,6);const m=parseFloat(v)||0;const s26=m>0?guncelSinif(m):"";setExps(p=>p.map(x=>x.id===e.id?{...x,yukseklik:v,sinif2026:s26}:x));}} placeholder="21.50" style={{width:"100%",padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                                      </div>
                                      <div>
                                        <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Yapı sınıfı *</label>
                                        <select value={e.sinif} onChange={ev=>updExp(e.id,"sinif",ev.target.value)} style={{width:"100%",padding:"8px 10px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}}>
                                          <option value="">Seçiniz</option>
                                          {siniflar.map(s=><option key={s} value={s}>{s} Sınıfı</option>)}
                                        </select>

                                      </div>
                                    </div>

                                    {/* Yapı kullanım amacı */}
                                    <div style={{fontSize:10,fontWeight:500,color:"#C9952B",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10,paddingTop:14,borderTop:"1px solid rgba(11,29,58,0.06)"}}>Yapı kullanım amacı</div>
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
                                      {[{v:"konut",l:"Konut",ico:"🏠"},{v:"konut_ticari",l:"Konut + Ticari",ico:"🏢"},{v:"ticari",l:"Ticari / Ofis",ico:"🏗"},{v:"diger",l:"Diğer",ico:"📋"}].map(({v,l,ico})=>(
                                        <button key={v} onClick={()=>updExp(e.id,"yapiTipi",v)} style={{padding:"10px 8px",borderRadius:8,border:`1px solid ${e.yapiTipi===v?"#C9952B":"rgba(11,29,58,0.1)"}`,background:e.yapiTipi===v?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"center",fontSize:12,color:"#0B1D3A",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                                          <span style={{fontSize:17,lineHeight:1}}>{ico}</span>
                                          <span style={{fontWeight:e.yapiTipi===v?500:400}}>{l}</span>
                                        </button>
                                      ))}
                                    </div>

                                    {/* Arsa ve müteahhitlik */}
                                    <div style={{fontSize:10,fontWeight:500,color:"#C9952B",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10,paddingTop:14,borderTop:"1px solid rgba(11,29,58,0.06)"}}>Arsa ve müteahhitlik</div>
                                    <div onClick={()=>updExp(e.id,"muteahhitArsaAyni",!e.muteahhitArsaAyni)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 13px",background:"#F3F0EB",borderRadius:8,cursor:"pointer",marginBottom:16}}>
                                      <div style={{width:32,height:18,borderRadius:9,background:e.muteahhitArsaAyni?"#C9952B":"#E8E4DC",flexShrink:0,position:"relative"}}>
                                        <div style={{width:14,height:14,borderRadius:7,background:"white",position:"absolute",top:2,left:e.muteahhitArsaAyni?16:2,transition:"left 0.15s",boxShadow:"0 1px 2px rgba(0,0,0,0.15)"}}/>
                                      </div>
                                      <span style={{fontSize:12,color:"#5A6478",userSelect:"none"}}>Müteahhit ve arsa sahibi aynı kişi / firma</span>
                                    </div>

                                    {/* İskan belgesi */}
                                    <div style={{fontSize:10,fontWeight:500,color:"#C9952B",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10,paddingTop:14,borderTop:"1px solid rgba(11,29,58,0.06)"}}>
                                      İskan / kabul belgesi <span style={{fontSize:10,background:"#EF4444",color:"white",padding:"1px 7px",borderRadius:4,fontWeight:400,textTransform:"none",letterSpacing:0,verticalAlign:"middle",marginLeft:6}}>Zorunlu</span>
                                    </div>
                                    {e.iskanFile?(
                                      <div style={{display:"flex",alignItems:"center",gap:10,background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"10px 14px"}}>
                                        <FileText size={15} color="#16a34a" style={{flexShrink:0}}/>
                                        <span style={{fontSize:13,color:"#15803d",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.iskanFile.name}</span>
                                        <button onClick={()=>updExp(e.id,"iskanFile",null)} style={{background:"none",border:"none",cursor:"pointer",color:"#16a34a",display:"flex"}}><X size={14}/></button>
                                      </div>
                                    ):(
                                      <label style={{display:"flex",alignItems:"center",gap:12,border:"1.5px dashed rgba(11,29,58,0.14)",borderRadius:9,padding:"13px 16px",cursor:"pointer",background:"white"}}>
                                        <div style={{width:32,height:32,borderRadius:8,background:"#F3F0EB",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                          <Upload size={14} color="#5A6478"/>
                                        </div>
                                        <div>
                                          <div style={{fontSize:13,color:"#5A6478",fontWeight:500}}>Taranmış belgeyi yükleyin</div>
                                          <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>PDF, JPG veya PNG · Yazılar okunaklı, tüm sayfa görünür olmalı</div>
                                        </div>
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={ev=>{const f=ev.target.files?.[0];if(f)updExp(e.id,"iskanFile",f);}}/>
                                      </label>
                                    )}
                                  </>
                                )}

                                <button onClick={()=>toggleAcik(e.id)} style={{marginTop:16,background:"#0B1D3A",color:"white",border:"none",padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                                  <CheckCircle size={13}/> Kaydet
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Ekle butonu alt */}
                    <div onClick={()=>{const n=mkExp();setExps(p=>[...p.map(x=>({...x,acik:false})),n]);}} style={{border:"1.5px dashed rgba(11,29,58,0.12)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:9,cursor:"pointer",marginTop:6}}>
                      <Plus size={14} color="#5A6478"/>
                      <span style={{fontSize:13,color:"#5A6478"}}>Yeni iş ekle</span>
                    </div>
                  </div>
                )}

                {/* Diploma */}
                {hasDiploma&&!isUpgrade&&(
                  <div style={{marginBottom:22}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>Diploma bilgileri<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,background:"white",border:"1px solid rgba(11,29,58,0.09)",borderRadius:10,padding:16}}>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>{companyType==="sahis"?"Ad Soyad":"Diploma sahibi ortağın adı"} *</label>
                        {isLtd&&partners.length>0?(
                          <select value={dipName} onChange={e=>setDipName(e.target.value)} style={{width:"100%",padding:"8px 11px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none"}}>
                            <option value="">Seçiniz</option>{partners.filter(p=>p.name.trim()).map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        ):(
                          <input value={dipName} onChange={e=>setDipName(e.target.value.slice(0,60))} placeholder="Ad Soyad" style={{width:"100%",padding:"8px 11px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        )}
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Bölüm *</label>
                        <select value={dipBolum} onChange={e=>setDipBolum(e.target.value as any)} style={{width:"100%",padding:"8px 11px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none"}}>
                          <option value="">Seçiniz</option><option value="insaat_muhendisligi">İnşaat Mühendisliği</option><option value="mimarlik">Mimarlık</option>
                        </select>
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Mezuniyet tarihi *</label>
                        <input type="date" value={dipTarih} onChange={e=>setDipTarih(sanitizeDate(e.target.value))} min="1970-01-01" max="2026-12-31" style={{width:"100%",padding:"8px 11px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                      </div>
                      {isLtd&&<>
                        <div><label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Hisse oranı (%)</label><input value={dipHisse} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,3);if(Number(v)<=100)setDipHisse(v);}} placeholder="51" style={{width:100,padding:"8px 11px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none"}} /></div>
                        <div><label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Ortaklık süresi (yıl)</label><input value={dipYil} onChange={e=>setDipYil(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="5" style={{width:100,padding:"8px 11px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:7,fontSize:13,outline:"none"}} /></div>
                      </>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── ADIM: KONUM ─── */}
            {step==="konum"&&(()=>{
              const istPaketler=[
                {key:"bilgi_alma",label:"Bilgi Alma Danışmanlığı",fiyat:"7.000 ₺",aciklama:"Telefon/e-posta süreç danışmanlığı",tags:["Danışmanlık"]},
                {key:"sadece_hesaplama",label:"İş Deneyim Hesaplama",fiyat:"11.000 ₺",aciklama:"Hesaplama + mali yeterlilik analizi",tags:["Hesaplama","Mali Yeterlilik"],popular:false},
                {key:"hesaplama_basvuru",label:"Hesaplama + Başvuru",fiyat:"20.000 ₺",aciklama:"Hesaplama + mali yeterlilik + bakanlık başvurusu",tags:["Hesaplama","Mali Yeterlilik","Başvuru"],popular:true},
              ];
              const disPaket={key:"disari",label:"İş Deneyim Hesaplama (Uzaktan)",fiyat:"11.000 ₺",aciklama:"Hesaplama + mali yeterlilik analizi",tags:["Hesaplama","Uzaktan"]};
              return (
                <div>
                  <h2 style={{fontSize:22,fontWeight:500,color:"#0B1D3A",margin:"0 0 6px",letterSpacing:"-0.02em"}}>Konum & hizmet seçimi</h2>
                  <p style={{fontSize:13,color:"#5A6478",margin:"0 0 24px"}}>Şirket faaliyet adresinize göre paket seçin.</p>
                  <div style={{background:"rgba(201,149,43,0.07)",border:"1px solid rgba(201,149,43,0.18)",borderRadius:10,padding:"10px 14px",marginBottom:22,display:"flex",gap:8}}>
                    <Info size={14} color="#C9952B" style={{flexShrink:0,marginTop:1}}/>
                    <p style={{fontSize:12,color:"#7A6030",margin:0}}>Tüm ücretlere KDV dahildir.</p>
                  </div>

                  {/* Konum */}
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>Şirket faaliyet adresi<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <button onClick={()=>{setLocation("istanbul");setPaket(""); setUpsellKabul(null);}} style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${location==="istanbul"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:location==="istanbul"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><Building2 size={15} color={location==="istanbul"?"#C9952B":"#5A6478"}/><div><p style={{fontSize:13,color:"#0B1D3A",margin:"0 0 1px",fontWeight:500}}>İstanbul</p><p style={{fontSize:11,color:"#5A6478",margin:0}}>Yüz yüze hizmet dahil</p></div></div>
                      </button>
                      <button onClick={()=>{setLocation("istanbul_disi");setPaket("disari");}} style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${location==="istanbul_disi"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:location==="istanbul_disi"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><Building2 size={15} color="#5A6478"/><div><p style={{fontSize:13,color:"#0B1D3A",margin:"0 0 1px",fontWeight:500}}>İstanbul Dışı</p><p style={{fontSize:11,color:"#5A6478",margin:0}}>Uzaktan hizmet</p></div></div>
                      </button>
                    </div>
                    {location==="istanbul_disi"&&(
                      <div style={{marginTop:10}}>
                        <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:4}}>İl *</label>
                        <input value={city} onChange={e=>setCity(e.target.value.slice(0,40))} placeholder="Ankara" style={{width:200,padding:"8px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none"}} />
                      </div>
                    )}
                  </div>

                  {/* Paket — İstanbul */}
                  {location==="istanbul"&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>Hizmet paketi<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/></div>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {istPaketler.map(pk=>(
                          <button key={pk.key} onClick={()=>{setPaket(pk.key);setUpsellKabul(null);}} style={{padding:"16px 18px",borderRadius:12,border:`${paket===pk.key?"2px solid #C9952B":"1px solid rgba(11,29,58,0.1)"}`,background:paket===pk.key?"rgba(201,149,43,0.06)":"white",cursor:"pointer",textAlign:"left",position:"relative"}}>
                            {pk.popular&&<span style={{position:"absolute",top:-10,left:14,background:"#C9952B",color:"#0B1D3A",fontSize:11,fontWeight:500,padding:"2px 10px",borderRadius:20}}>Popüler</span>}
                            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                              <div style={{width:17,height:17,borderRadius:"50%",border:`2px solid ${paket===pk.key?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                                {paket===pk.key&&<div style={{width:8,height:8,borderRadius:"50%",background:"#C9952B"}}/>}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                                  <span style={{fontSize:14,color:"#0B1D3A",fontWeight:500}}>{pk.label}</span>
                                  <span style={{fontSize:15,color:"#C9952B",fontWeight:700,flexShrink:0,marginLeft:12}}>{pk.fiyat}</span>
                                </div>
                                <p style={{fontSize:12,color:"#5A6478",margin:"0 0 6px"}}>{pk.aciklama}</p>
                                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{pk.tags.map(t=><span key={t} style={{fontSize:11,background:"#F0FDF4",color:"#15803d",padding:"2px 8px",borderRadius:20}}>{t}</span>)}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Upsell — sadece hesaplama seçildiyse */}
                      {showUpsell&&(
                        <div style={{marginTop:14,background:"rgba(11,29,58,0.03)",border:"1px solid rgba(11,29,58,0.1)",borderRadius:12,padding:"16px 18px"}}>
                          <p style={{fontSize:13,fontWeight:500,color:"#0B1D3A",margin:"0 0 4px"}}>Başvuruyu biz yapalım mı?</p>
                          <p style={{fontSize:12,color:"#5A6478",margin:"0 0 12px"}}>+9.000 ₺ ek ücretle bakanlık başvurusunu sizin adınıza tamamlarız.</p>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>setUpsellKabul(true)} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${upsellKabul===true?"#C9952B":"rgba(11,29,58,0.1)"}`,background:upsellKabul===true?"rgba(201,149,43,0.08)":"white",cursor:"pointer",fontSize:13,color:"#0B1D3A",fontWeight:upsellKabul===true?500:400}}>Evet, 9.000 ₺ ek ücretle kabul ediyorum</button>
                            <button onClick={()=>setUpsellKabul(false)} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${upsellKabul===false?"#0B1D3A":"rgba(11,29,58,0.1)"}`,background:upsellKabul===false?"rgba(11,29,58,0.06)":"white",cursor:"pointer",fontSize:13,color:"#0B1D3A"}}>Hayır, kendim yapacağım</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paket — İstanbul dışı */}
                  {location==="istanbul_disi"&&(
                    <div style={{padding:"16px 18px",borderRadius:12,border:"2px solid #C9952B",background:"rgba(201,149,43,0.06)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:14,color:"#0B1D3A",fontWeight:500}}>{disPaket.label}</span>
                        <span style={{fontSize:15,color:"#C9952B",fontWeight:700}}>{disPaket.fiyat}</span>
                      </div>
                      <p style={{fontSize:12,color:"#5A6478",margin:"0 0 6px"}}>{disPaket.aciklama}</p>
                      <div style={{display:"flex",gap:5}}>{disPaket.tags.map(t=><span key={t} style={{fontSize:11,background:"#F0FDF4",color:"#15803d",padding:"2px 8px",borderRadius:20}}>{t}</span>)}</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ─── ADIM: ÖZET ─── */}
            {step==="ozet"&&(
              <div>
                <h2 style={{fontSize:22,fontWeight:500,color:"#0B1D3A",margin:"0 0 6px",letterSpacing:"-0.02em"}}>Başvuru özeti</h2>
                <p style={{fontSize:13,color:"#5A6478",margin:"0 0 24px"}}>Bilgilerinizi gözden geçirin. Düzeltmek istediğiniz varsa düzenleyebilirsiniz.</p>

                {/* Şirket bilgileri — düzenlenebilir */}
                <div style={{background:"white",border:"1px solid rgba(11,29,58,0.09)",borderRadius:12,marginBottom:16,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#F8F7F4",borderBottom:"1px solid rgba(11,29,58,0.07)"}}>
                    <span style={{fontSize:12,fontWeight:500,color:"#0B1D3A"}}>Şirket bilgileri</span>
                    <button onClick={()=>{setErrors([]);setStep("firma");}} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#C9952B",background:"none",border:"1px solid rgba(201,149,43,0.3)",padding:"3px 10px",borderRadius:6,cursor:"pointer"}}>
                      <Edit2 size={11}/> Düzenle
                    </button>
                  </div>
                  <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 24px"}}>
                    {[[companyName,"Firma"],[taxId,"Vergi No"],[phone,"Telefon"],[email,"E-posta"],[{sahis:"Şahıs",limited_as:"Ltd/A.Ş.",kooperatif:"Kooperatif"}[companyType]||companyType,"Tür"]].map(([v,l])=>(
                      <div key={l as string}><span style={{fontSize:11,color:"#9CA3AF"}}>{l as string}</span><p style={{fontSize:13,color:"#0B1D3A",margin:"1px 0 0"}}>{v as string}</p></div>
                    ))}
                  </div>
                </div>

                {/* İş deneyimleri özeti */}
                {hasYapiIsi&&exps.length>0&&(
                  <div style={{background:"white",border:"1px solid rgba(11,29,58,0.09)",borderRadius:12,marginBottom:16,overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#F8F7F4",borderBottom:"1px solid rgba(11,29,58,0.07)"}}>
                      <span style={{fontSize:12,fontWeight:500,color:"#0B1D3A"}}>İş deneyimleri ({exps.length})</span>
                      <button onClick={()=>{setErrors([]);setStep("deneyim");}} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#C9952B",background:"none",border:"1px solid rgba(201,149,43,0.3)",padding:"3px 10px",borderRadius:6,cursor:"pointer"}}>
                        <Edit2 size={11}/> Düzenle
                      </button>
                    </div>
                    {exps.map((e,i)=>(
                      <div key={e.id} style={{padding:"10px 16px",borderBottom:"1px solid rgba(11,29,58,0.05)",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                        <div><span style={{fontSize:10,color:"#9CA3AF"}}>İş {i+1}</span><p style={{fontSize:12,color:"#0B1D3A",margin:"1px 0 0",fontWeight:500}}>{e.tip==="kat_karsiligi"?"Kat Karş.":"Taahhüt"}</p></div>
                        <div><span style={{fontSize:10,color:"#9CA3AF"}}>Sözleşme</span><p style={{fontSize:12,color:"#0B1D3A",margin:"1px 0 0"}}>{e.sozTarih||"—"}</p></div>
                        <div><span style={{fontSize:10,color:"#9CA3AF"}}>Alan</span><p style={{fontSize:12,color:"#0B1D3A",margin:"1px 0 0"}}>{e.alan?`${e.alan} m²`:"—"}</p></div>
                        <div><span style={{fontSize:10,color:"#9CA3AF"}}>Sınıf</span><p style={{fontSize:12,color:"#0B1D3A",margin:"1px 0 0"}}>{e.sinif||"—"}</p></div>
                        <div><span style={{fontSize:10,color:"#9CA3AF"}}>İskan</span><p style={{fontSize:12,color:e.iskanFile?"#16a34a":"#EF4444",margin:"1px 0 0"}}>{e.iskanFile?"✓":"Eksik"}</p></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Diploma özeti */}
                {hasDiploma&&(
                  <div style={{background:"white",border:"1px solid rgba(11,29,58,0.09)",borderRadius:12,marginBottom:16,padding:"12px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:12,fontWeight:500,color:"#0B1D3A"}}>Diploma</span>
                      <button onClick={()=>{setErrors([]);setStep("deneyim");}} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#C9952B",background:"none",border:"1px solid rgba(201,149,43,0.3)",padding:"3px 10px",borderRadius:6,cursor:"pointer"}}><Edit2 size={11}/> Düzenle</button>
                    </div>
                    <p style={{fontSize:13,color:"#0B1D3A",margin:0}}>{dipName} — {dipBolum==="insaat_muhendisligi"?"İnşaat Mühendisliği":"Mimarlık"} · {dipTarih}</p>
                  </div>
                )}

                {/* Paket özeti */}
                <div style={{background:"#0B1D3A",borderRadius:12,padding:"16px 18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:11,margin:"0 0 3px"}}>Seçilen paket</p><p style={{color:"white",fontSize:14,fontWeight:500,margin:0}}>{PAKETLER[paket as keyof typeof PAKETLER]?.label||paket}</p></div>
                    <div style={{textAlign:"right"}}><p style={{color:"rgba(255,255,255,0.5)",fontSize:11,margin:"0 0 3px"}}>Toplam</p><p style={{color:"#C9952B",fontSize:18,fontWeight:700,margin:0}}>{PAKETLER[paket as keyof typeof PAKETLER]?.fiyat||"—"}{upsellKabul===true?" + 9.000 ₺":""}</p></div>
                  </div>
                  <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,margin:"8px 0 0"}}>KDV dahildir</p>
                </div>
              </div>
            )}

            {/* Ödeme adımı dashboard'a taşındı */}
            {step==="__odeme_kaldirildi__"&&(
              <div>
                <p>Ödeme dashboard üzerinden yapılmaktadır.</p>

                {/* Yöntem seçimi */}
                <div style={{display:"flex",gap:8,marginBottom:20}}>
                  <button onClick={()=>setOdemeYol("kart")} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:9,border:`1px solid ${odemeYol==="kart"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:odemeYol==="kart"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",fontSize:13,fontWeight:odemeYol==="kart"?500:400,color:"#0B1D3A"}}>
                    <CreditCard size={15}/> Kredi / Banka Kartı
                  </button>
                  <button onClick={()=>setOdemeYol("havale")} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:9,border:`1px solid ${odemeYol==="havale"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:odemeYol==="havale"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",fontSize:13,fontWeight:odemeYol==="havale"?500:400,color:"#0B1D3A"}}>
                    <Building2 size={15}/> EFT / Havale
                  </button>
                </div>

                {/* Kart formu */}
                {odemeYol==="kart"&&(
                  <div style={{background:"white",border:"1px solid rgba(11,29,58,0.09)",borderRadius:12,padding:20}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr",gap:14}}>
                      <div>
                        <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Kart numarası</label>
                        <input value={kart.no} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,16);setKart(k=>({...k,no:v.replace(/(.{4})/g,"$1 ").trim()}));}} placeholder="0000 0000 0000 0000" style={{width:"100%",padding:"10px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:14,letterSpacing:2,outline:"none",boxSizing:"border-box"}} />
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Kart üzerindeki ad</label>
                        <input value={kart.ad} onChange={e=>setKart(k=>({...k,ad:e.target.value.toUpperCase().slice(0,40)}))} placeholder="AD SOYAD" style={{width:"100%",padding:"10px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                        <div>
                          <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>Son kullanma tarihi</label>
                          <input value={kart.son} onChange={e=>{let v=e.target.value.replace(/\D/g,"").slice(0,4);if(v.length>=3)v=v.slice(0,2)+"/"+v.slice(2);setKart(k=>({...k,son:v}));}} placeholder="AA/YY" style={{width:"100%",padding:"10px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        </div>
                        <div>
                          <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:5}}>CVV</label>
                          <input value={kart.cvv} onChange={e=>setKart(k=>({...k,cvv:e.target.value.replace(/\D/g,"").slice(0,3)}))} placeholder="000" style={{width:"100%",padding:"10px 12px",background:"#F3F0EB",border:"1px solid transparent",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        </div>
                      </div>
                    </div>
                    <div style={{marginTop:16,padding:"10px 12px",background:"#F8F7F4",borderRadius:8,display:"flex",gap:8}}>
                      <Info size={13} color="#5A6478" style={{flexShrink:0,marginTop:1}}/>
                      <p style={{fontSize:11,color:"#5A6478",margin:0}}>Sanal POS bağlantısı aktif değil — ödeme kaydı oluşturulacak, ekibimiz sizinle iletişime geçecektir.</p>
                    </div>
                  </div>
                )}

                {/* EFT/Havale künye */}
                {odemeYol==="havale"&&(
                  <div style={{background:"white",border:"1px solid rgba(11,29,58,0.09)",borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",background:"#F8F7F4",borderBottom:"1px solid rgba(11,29,58,0.07)"}}>
                      <p style={{fontSize:12,fontWeight:500,color:"#0B1D3A",margin:0}}>Banka havalesi bilgileri</p>
                    </div>
                    <div style={{padding:"16px"}}>
                      {[
                        ["Banka","Garanti Bankası"],
                        ["Hesap Sahibi","Müteahhitlik Danışmanlık Ltd. Şti."],
                        ["IBAN","TR00 0000 0000 0000 0000 0000 00"],
                        ["Şube","İstanbul / Merkez"],
                        ["Açıklama",`${companyName||"Firma Adı"} – ${PAKETLER[paket as keyof typeof PAKETLER]?.label||paket}`],
                      ].map(([l,v])=>(
                        <div key={l} style={{display:"flex",padding:"9px 0",borderBottom:"1px solid rgba(11,29,58,0.05)"}}>
                          <span style={{fontSize:12,color:"#9CA3AF",width:120,flexShrink:0}}>{l}</span>
                          <span style={{fontSize:13,color:"#0B1D3A",fontWeight:l==="IBAN"||l==="Açıklama"?500:400,fontFamily:l==="IBAN"?"monospace":undefined}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{padding:"12px 16px",background:"rgba(201,149,43,0.05)",borderTop:"1px solid rgba(201,149,43,0.15)",display:"flex",gap:8}}>
                      <AlertTriangle size={13} color="#C9952B" style={{flexShrink:0,marginTop:1}}/>
                      <p style={{fontSize:11,color:"#7A6030",margin:0}}>Açıklama kısmına firma adınızı yazmayı unutmayın. Havale sonrası ekibimiz sizi arayacaktır.</p>
                    </div>
                  </div>
                )}

                {/* Özet */}
                <div style={{marginTop:16,background:"#0B1D3A",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>{PAKETLER[paket as keyof typeof PAKETLER]?.label||paket}</span>
                  <span style={{color:"#C9952B",fontSize:16,fontWeight:700}}>{PAKETLER[paket as keyof typeof PAKETLER]?.fiyat||"—"}{upsellKabul===true?" + 9.000 ₺":""}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{borderTop:"1px solid rgba(11,29,58,0.08)",padding:"14px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"white"}}>
            <div style={{display:"flex",gap:5}}>
              {STEPS.map((_,i)=>(
                <div key={i} style={{height:6,borderRadius:3,background:i<stepIdx?"#C9952B":i===stepIdx?"#0B1D3A":"rgba(11,29,58,0.15)",width:i===stepIdx?20:6,transition:"all 0.2s"}}/>
              ))}
              <span style={{fontSize:11,color:"#5A6478",marginLeft:6}}>Adım {stepIdx+1}/{STEPS.length}</span>
            </div>
            <div style={{display:"flex",gap:10}}>
              {stepIdx>0&&<button onClick={handleBack} style={{padding:"9px 20px",borderRadius:10,border:"1px solid rgba(11,29,58,0.15)",background:"white",color:"#0B1D3A",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><ArrowLeft size={13}/> Geri</button>}
              <button onClick={handleNext} style={{padding:"9px 24px",borderRadius:10,border:"none",background:"#0B1D3A",color:"white",fontSize:13,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                {step==="ozet"?"Gönder & Kaydet":"Devam et"} <ArrowRight size={13}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowAuth(false)}>
          <div style={{background:"white",borderRadius:16,maxWidth:420,width:"100%",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            {/* Başlık */}
            <div style={{background:"#0B1D3A",padding:"20px 24px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Award size={20} color="#C9952B"/>
                  <h3 style={{color:"white",fontSize:17,fontWeight:500,margin:0}}>Hesap oluşturun</h3>
                </div>
                <button onClick={()=>setShowAuth(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",display:"flex"}}><X size={18}/></button>
              </div>
              <p style={{color:"rgba(255,255,255,0.55)",fontSize:12,margin:"6px 0 0"}}>Başvurunuzu takip edebilmek için hesap oluşturun.</p>
            </div>

            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
              {/* Google ile Kayıt */}
              <button onClick={async()=>{
                setAuthLoading(true);
                saveCompany(authEmail);
                if(signInWithGoogle) await signInWithGoogle();
                setAuthLoading(false);
              }} style={{width:"100%",background:"white",color:"#0B1D3A",padding:"11px",borderRadius:10,border:"1.5px solid rgba(11,29,58,0.15)",fontSize:13,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                {/* Google ikonu */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile Devam Et
              </button>

              {/* Ayraç */}
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,height:1,background:"rgba(11,29,58,0.08)"}}/>
                <span style={{fontSize:11,color:"#9CA3AF"}}>veya e-posta ile</span>
                <div style={{flex:1,height:1,background:"rgba(11,29,58,0.08)"}}/>
              </div>

              {/* E-posta formu */}
              {[
                ["Ad Soyad (isteğe bağlı)",authName,(v:string)=>setAuthName(v),"text","Adınız"],
                ["E-posta *",authEmail,(v:string)=>setAuthEmail(v),"email","ornek@email.com"],
                ["Şifre *",authPass,(v:string)=>setAuthPass(v),"password","En az 6 karakter"],
                ["Şifre tekrar *",authPass2,(v:string)=>setAuthPass2(v),"password","Şifreyi tekrar girin"],
              ].map(([l,v,s,t,ph])=>(
                <div key={l as string}>
                  <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>{l as string}</label>
                  <input type={t as string} value={v as string} onChange={e=>(s as Function)(e.target.value)} placeholder={ph as string}
                    style={{width:"100%",padding:"9px 12px",background:"#F8F7F4",border:"1px solid rgba(11,29,58,0.08)",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                </div>
              ))}

              {authErr&&(
                <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#B91C1C"}}>{authErr}</div>
              )}

              <button onClick={handleAuth} disabled={authLoading||!authEmail||!authPass||!authPass2}
                style={{width:"100%",background:"#C9952B",color:"#0B1D3A",padding:"11px",borderRadius:10,border:"none",fontSize:13,fontWeight:500,cursor:"pointer",opacity:authLoading||!authEmail||!authPass||!authPass2?0.5:1}}>
                {authLoading?"Oluşturuluyor...":"Üye Ol & Gönder →"}
              </button>

              <p style={{fontSize:11,color:"#9CA3AF",textAlign:"center",margin:0}}>
                Kayıt olarak <span style={{textDecoration:"underline",cursor:"pointer"}}>Kullanım Koşullarını</span> kabul etmiş olursunuz.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
