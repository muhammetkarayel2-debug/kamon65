import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import {
  ArrowLeft, ArrowRight, Info, CheckCircle, AlertTriangle, Award,
  Plus, Trash2, MapPin, GraduationCap, Building2, HardHat, XCircle,
  Upload, FileText, X, Mail, User as UserIcon, Monitor
} from "lucide-react";
import { useAuth } from "./auth-context";

/* ─── Yapı Sınıfı Kuralları ─── */
const GECERLI_SINIFLAR_YILA: Record<number, string[]> = {
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
const YUKSEKLIK_KURALLARI = [
  {minM:0,maxM:6.49,minSinif:"III.B"},{minM:6.5,maxM:21.49,minSinif:"III.C"},
  {minM:21.5,maxM:51.49,minSinif:"IV.A"},{minM:51.5,maxM:91.49,minSinif:"IV.B"},
  {minM:91.5,maxM:9999,minSinif:"IV.C"},
];

function gecerliSiniflar(sozlesmeTarihi: string, yukseklikM?: number): string[] {
  if (!sozlesmeTarihi) return Object.keys(SINIF_SIRA);
  const yil = new Date(sozlesmeTarihi).getFullYear();
  if (yil < 2010 || yil > 2030) return Object.keys(SINIF_SIRA);
  let liste = GECERLI_SINIFLAR_YILA[yil] || ["III.B","IV.A","IV.B","V.A"];
  if (yukseklikM && yukseklikM > 0) {
    const kural = YUKSEKLIK_KURALLARI.find(k => yukseklikM >= k.minM && yukseklikM <= k.maxM);
    if (kural) { const minS = SINIF_SIRA[kural.minSinif]; liste = liste.filter(s => (SINIF_SIRA[s]||0) >= minS); }
  }
  return liste;
}
function sinifUyumKontrolu(sinif: string, yukseklikM: number): string | null {
  if (!yukseklikM || !sinif) return null;
  const kural = YUKSEKLIK_KURALLARI.find(k => yukseklikM >= k.minM && yukseklikM <= k.maxM);
  if (!kural) return null;
  if ((SINIF_SIRA[sinif]||0) < (SINIF_SIRA[kural.minSinif]||0))
    return `${yukseklikM}m yükseklik için en az ${kural.minSinif} sınıfı gereklidir.`;
  return null;
}

/* ─── Types ─── */
interface ExperienceEntry {
  id: string; isDeneyimiTipi: "kat_karsiligi" | "taahhut";
  contractDate: string; occupancyDate: string; totalArea: string;
  buildingHeight: string; buildingClass: string; adaParsel: string;
  sozlesmeBedeli: string; muteahhitArsaSahibiAyni: boolean;
  iskanFile?: File | null;
}
interface Partner { id: string; name: string; sharePercent: string; tcKimlikNo: string; }

function createExp(): ExperienceEntry {
  return { id:crypto.randomUUID(), isDeneyimiTipi:"kat_karsiligi", contractDate:"", occupancyDate:"", totalArea:"", buildingHeight:"", buildingClass:"", adaParsel:"", sozlesmeBedeli:"", muteahhitArsaSahibiAyni:false };
}
function createPartner(): Partner { return { id:crypto.randomUUID(), name:"", sharePercent:"", tcKimlikNo:"" }; }

/* ─── Helpers ─── */
function fmtNum(v: string) { const r=v.replace(/\D/g,""); return r?new Intl.NumberFormat("tr-TR").format(Number(r)):""; }
function fmtPhone(v: string) {
  const d=v.replace(/\D/g,"");
  if(!d.length)return""; if(d.length<=1)return"0"; if(d.length<=4)return`0(${d.slice(1)}`;
  if(d.length<=7)return`0(${d.slice(1,4)}) ${d.slice(4)}`; if(d.length<=9)return`0(${d.slice(1,4)}) ${d.slice(4,7)} ${d.slice(7)}`;
  return`0(${d.slice(1,4)}) ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9,11)}`;
}
function isPhoneOk(v: string) { return v.replace(/\D/g,"").length===11; }
function isEmailOk(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function sanitizeDateInput(v: string): string {
  // Tarih girişini sanitize et — yıl kısmı max 4 hane
  const parts = v.split("-");
  if (parts.length === 3 && parts[0].length > 4) {
    parts[0] = parts[0].slice(0, 4);
    return parts.join("-");
  }
  return v;
}

const iCls = "w-full px-3 py-2.5 rounded-lg bg-[#F0EDE8] border border-transparent focus:border-[#C9952B] focus:ring-1 focus:ring-[#C9952B] outline-none transition-colors text-sm";
const iErr = "w-full px-3 py-2.5 rounded-lg bg-red-50 border border-red-300 focus:border-red-400 outline-none transition-colors text-sm";

function RadioCard({ selected, hasError, onClick, children }: { selected:boolean; hasError:boolean; onClick:()=>void; children:React.ReactNode }) {
  return (
    <button onClick={onClick} className={`p-4 rounded-xl border text-left text-sm transition-all w-full ${selected?"border-[#C9952B] bg-[#C9952B]/10":hasError?"border-red-300 bg-red-50":"border-[#0B1D3A]/10 hover:border-[#C9952B]/50"}`}>
      <div className="flex items-start gap-2">
        <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected?"border-[#C9952B]":"border-[#0B1D3A]/20"}`}>{selected&&<div className="w-2 h-2 rounded-full bg-[#C9952B]"/>}</div>
        <div className="flex-1">{children}</div>
      </div>
    </button>
  );
}
function CheckCard({ checked, hasError, onClick, children }: { checked:boolean; hasError?:boolean; onClick:()=>void; children:React.ReactNode }) {
  return (
    <button onClick={onClick} className={`p-4 rounded-xl border text-left text-sm transition-all w-full ${checked?"border-[#C9952B] bg-[#C9952B]/10":hasError?"border-red-300 bg-red-50":"border-[#0B1D3A]/10 hover:border-[#C9952B]/50"}`}>
      <div className="flex items-start gap-2">
        <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${checked?"border-[#C9952B] bg-[#C9952B]":"border-[#0B1D3A]/20"}`}>{checked&&<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}</div>
        <div className="flex-1">{children}</div>
      </div>
    </button>
  );
}

/* ─── Storage ─── */
const COMPANIES_KEY = "mock_panel_companies";
const BILLING_KEY   = "mock_panel_billing";
function loadLS(key: string, fb: any): any { try { const r=localStorage.getItem(key); if(r) return JSON.parse(r); } catch{} return fb; }
function saveLS(key: string, v: any) { try { localStorage.setItem(key,JSON.stringify(v)); } catch{} }

/* ─── Service Info ─── */
const SERVICE_INFO: Record<string,{label:string;price:string;harc?:string}> = {
  koop_istanbul:           {label:"Kooperatif Dosya Hazırlığı + Başvuru + Danışmanlık",price:"20.000 ₺",harc:"13.500 ₺"},
  koop_disari:             {label:"Bilgi Alma Danışmanlığı (Telefon/E-posta)",price:"7.000 ₺"},
  h_grubu_istanbul:        {label:"H Grubu Dosya Hazırlığı + Bakanlığa Başvuru",price:"12.000 ₺"},
  bilgi_alma:              {label:"Bilgi Alma Danışmanlığı (Telefon/E-posta)",price:"7.000 ₺"},
  sadece_hesaplama:        {label:"İş Deneyim Hesaplama + Sınıf Tayini",price:"9.000 ₺"},
  basvuru_ve_hesaplama:    {label:"Başvuru + İş Deneyim Hesaplama + Dosya Hazırlığı",price:"20.000 ₺"},
  sadece_hesaplama_disari: {label:"İş Deneyim Hesaplama + Sınıf Tayini (Uzaktan)",price:"9.000 ₺"},
};

/* ══════════════════════════════════════ WIZARD ══════════════════════════════════════ */
export function WizardPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [searchParams] = useSearchParams();
  const isHGroup = searchParams.get("group")==="H";
  const isUpgrade = (loc.state as any)?.isUpgrade===true;
  const isUpsell  = (loc.state as any)?.isUpsell===true;
  const upgradeCompanyId = (loc.state as any)?.companyId as string|undefined;
  const { user, signIn, signUp, loading: authLoading } = useAuth();

  const STEPS = isUpgrade ? ["deneyim"] : isHGroup ? ["firma","konum"] : ["firma","deneyim","konum","ozet"];
  const [stepIdx, setStepIdx] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState(""); const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState(""); const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [authError, setAuthError] = useState(""); const [authSubmitting, setAuthSubmitting] = useState(false);

  /* Step 1 — Firma */
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyType, setCompanyType] = useState<""|"sahis"|"limited_as"|"kooperatif">("");
  const [partners, setPartners] = useState<Partner[]>([createPartner()]);
  const [hasSpecificArea, setHasSpecificArea] = useState<""|"yes"|"no">("");
  const [minAreaRequirement, setMinAreaRequirement] = useState("");
  const [hasKep, setHasKep] = useState<""|"yes"|"no">("");
  const [kepAddress, setKepAddress] = useState("");
  const [isFirstTime, setIsFirstTime] = useState<""|"first"|"renewal">("");

  /* Step 2 — Deneyim */
  const [hasYapiIsi, setHasYapiIsi] = useState(isUpgrade);
  const [hasDiploma, setHasDiploma] = useState(false);
  const [hasNone, setHasNone] = useState(false);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([createExp()]);
  const [diplomaPartnerName, setDiplomaPartnerName] = useState("");
  const [diplomaDepartment, setDiplomaDepartment] = useState<""|"insaat_muhendisligi"|"mimarlik">("");
  const [diplomaGradDate, setDiplomaGradDate] = useState("");
  const [diplomaPartnershipYears, setDiplomaPartnershipYears] = useState("");
  const [diplomaSharePercent, setDiplomaSharePercent] = useState("");

  /* Step 3 — Konum */
  const [location, setLocation] = useState<""|"istanbul"|"istanbul_disi">("");
  const [city, setCity] = useState("");
  const [selectedService, setSelectedService] = useState("");

  /* Prefill yükseltme */
  const [prefillDone, setPrefillDone] = useState(false);
  if (!prefillDone && (isUpgrade || isUpsell) && upgradeCompanyId) {
    const companies = loadLS(COMPANIES_KEY, []);
    const c = companies.find((co: any) => co.id === upgradeCompanyId);
    if (c) {
      if (c.companyName) setCompanyName(c.companyName);
      if (c.taxId) setTaxId(c.taxId);
      if (c.phone) setPhone(c.phone);
      if (c.email) setEmail(c.email);
      if (c.companyType) setCompanyType(c.companyType);
      if (c.partners?.length) setPartners(c.partners.map((p: any) => ({...p, id: p.id||crypto.randomUUID(), tcKimlikNo: p.tcKimlikNo||""})));
      if (c.location) setLocation(c.location);
      if (c.city) setCity(c.city);
    }
    setPrefillDone(true);
  }

  /* Derived */
  const isLimitedAS = companyType==="limited_as";
  const isKooperatif = companyType==="kooperatif";
  const skipExp = isKooperatif||isHGroup;
  const atLeastOne = hasYapiIsi||hasDiploma||hasNone;
  const dipShareNum = Number(diplomaSharePercent)||0;
  const dipYearsNum = Number(diplomaPartnershipYears)||0;
  const dipShareOk = !isLimitedAS||dipShareNum>=51;
  const dipYearsOk = !isLimitedAS||dipYearsNum>=5;
  const totalShare = useMemo(()=>partners.reduce((s,p)=>s+(Number(p.sharePercent)||0),0),[partners]);

  /* Validation per step */
  const v_firma = companyName.trim().length>=3 && taxId.length>=10 && isPhoneOk(phone) && isEmailOk(email) && companyType!=="" &&
    (!isLimitedAS||(partners.every(p=>p.name.trim().length>=2&&Number(p.sharePercent)>0&&p.tcKimlikNo.length===11))) &&
    (hasKep!=="")&&(hasKep==="no"||kepAddress.trim().length>=5) &&
    (isKooperatif||(hasSpecificArea!==""&&(hasSpecificArea==="no"||minAreaRequirement!=="")&&isFirstTime!==""));

  const v_deneyim_exp = !hasYapiIsi || experiences.every(e => {
    if (e.isDeneyimiTipi==="taahhut") return e.contractDate!==""&&e.sozlesmeBedeli!=="";
    return e.contractDate!==""&&e.totalArea!==""&&e.buildingClass!==""&&!!e.iskanFile;
  });
  const v_deneyim_dip = !hasDiploma||(diplomaPartnerName.trim().length>=2&&diplomaDepartment!==""&&diplomaGradDate!==""&&(companyType==="sahis"||(diplomaSharePercent!==""&&diplomaPartnershipYears!=="")));
  const v_deneyim = atLeastOne&&v_deneyim_exp&&v_deneyim_dip;
  const v_konum = location!==""&&selectedService!==""&&(location==="istanbul"||city.trim().length>=2);

  const stepValid = () => {
    const s = STEPS[stepIdx];
    if (s==="firma") return v_firma;
    if (s==="deneyim") return isUpgrade ? experiences.every(e=>e.contractDate!=="") : v_deneyim;
    if (s==="konum") return v_konum;
    return true;
  };

  const handleNext = () => {
    if (!stepValid()) { setShowErrors(true); return; }
    setShowErrors(false);
    if (stepIdx < STEPS.length-1) setStepIdx(i=>i+1);
    else handleFinish();
  };
  const handleBack = () => { setShowErrors(false); setStepIdx(i=>i-1); };

  const fCls = (ok: boolean) => showErrors && !ok ? iErr : iCls;
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d=e.target.value.replace(/\D/g,"").slice(0,11);
    setPhone(fmtPhone((d.startsWith("0")?d:"0"+d).slice(0,11)));
  };

  /* Partner helpers */
  const updPartner = (id:string,f:keyof Partner,v:string)=>setPartners(p=>p.map(x=>x.id===id?{...x,[f]:v}:x));

  /* Experience helpers */
  const updExp = (id:string,f:keyof ExperienceEntry,v:any)=>setExperiences(p=>p.map(x=>x.id===id?{...x,[f]:v}:x));

  /* handleFinish — wizard tamamlandı, dashboard'a düş, ödeme yok */
  const handleFinish = async () => {
    if (!authLoading && user) { saveCompany(); navigate("/dashboard", {state:{defaultTab:"odeme"}}); return; }
    try {
      const stored = localStorage.getItem("mock_auth_user");
      if (stored) { const p=JSON.parse(stored); if(p.user?.email){await signIn(p.user.email,""); saveCompany(); navigate("/dashboard",{state:{defaultTab:"odeme"}}); return;} }
    } catch {}
    setAuthEmail(email); setAuthError(""); setAuthName(""); setAuthPassword(""); setAuthPasswordConfirm("");
    setShowAuthModal(true);
  };

  const saveCompany = (overrideEmail?: string) => {
    const existId = upgradeCompanyId;
    const all = loadLS(COMPANIES_KEY,[]);
    const byId = existId ? all.find((c:any)=>c.id===existId) : null;
    const byTax = !byId&&taxId ? all.find((c:any)=>c.taxId===taxId) : null;
    const resolvedId = byId?.id||byTax?.id||crypto.randomUUID();
    let curEmail=overrideEmail||"";
    if(!curEmail){try{const s=localStorage.getItem("mock_auth_user");if(s)curEmail=JSON.parse(s).user?.email||"";}catch{}}
    const selInfo = SERVICE_INFO[selectedService];
    const data:any={
      id:resolvedId, companyName, taxId, phone, email, companyType, location, city,
      partners:isLimitedAS?partners:[],
      kepAddress:hasKep==="yes"?kepAddress:"",
      hasSpecificArea, minAreaRequirement, isFirstTime,
      selectedService, serviceLabel:selInfo?.label||"",
      userEmail:curEmail||email,
      appStatus:"pending_payment",
      qualifications:!skipExp?{
        hasYapiIsi, hasDiploma, hasNone,
        experiences:experiences.map(e=>({isDeneyimiTipi:e.isDeneyimiTipi,contractDate:e.contractDate,occupancyDate:e.occupancyDate,totalArea:e.totalArea,buildingHeight:e.buildingHeight,buildingClass:e.buildingClass,adaParsel:e.adaParsel,sozlesmeBedeli:e.sozlesmeBedeli,muteahhitArsaSahibiAyni:e.muteahhitArsaSahibiAyni})),
        diploma:hasDiploma?{partnerName:diplomaPartnerName,department:diplomaDepartment,gradDate:diplomaGradDate,partnershipYears:diplomaPartnershipYears,sharePercent:diplomaSharePercent}:null,
      }:undefined,
      createdAt:(byId||byTax)?.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    };
    saveLS(COMPANIES_KEY,(byId||byTax)?all.map((c:any)=>c.id===resolvedId?data:c):[...all,data]);
    if(selectedService&&selInfo){
      const billing=loadLS(BILLING_KEY,{});
      const cb=billing[resolvedId]||[];
      if(!cb.some((i:any)=>i.description?.includes(selInfo.label)&&i.status!=="paid")){
        const today=new Date(),due=new Date(today); due.setDate(due.getDate()+14);
        cb.push({id:crypto.randomUUID(),companyId:resolvedId,date:today.toISOString(),dueDate:due.toISOString(),description:selInfo.label,amount:selInfo.price,status:"unpaid"});
        billing[resolvedId]=cb; saveLS(BILLING_KEY,billing);
      }
    }
  };

  const handleAuthAndSave = async () => {
    if(!authEmail.trim()||!authPassword||authPassword.length<6||authPassword!==authPasswordConfirm){setAuthError("Bilgileri kontrol edin.");return;}
    setAuthError(""); setAuthSubmitting(true);
    try {
      const res=await signUp(authEmail.trim(),authPassword,authName.trim()||authEmail.split("@")[0]);
      if(res.error){setAuthError(res.error);setAuthSubmitting(false);return;}
      setShowAuthModal(false); saveCompany(authEmail.trim());
      navigate("/dashboard",{state:{defaultTab:"odeme"}});
    }catch(e:any){setAuthError(e.message||"Hata");}finally{setAuthSubmitting(false);}
  };

  /* ─── Konum seçenekleri ─── */
  const getIstanbulOptions = () => {
    const hasExp=hasYapiIsi||hasDiploma;
    if(isKooperatif)return[{key:"koop_istanbul",label:"Kooperatif Dosya Hazırlığı + Başvuru + Danışmanlık",desc:"Kooperatif müteahhitlik belgesi için tam hizmet.",price:"20.000 ₺",harc:"13.500 ₺",tags:["Dosya Hazırlığı","Başvuru","Danışmanlık"]}];
    if(!hasExp)return[{key:"h_grubu_istanbul",label:"H Grubu Dosya Hazırlığı + Bakanlığa Başvuru",desc:"H grubu yetki belgesi başvurusu.",price:"12.000 ₺",tags:["Dosya Hazırlığı","Bakanlık Başvurusu"]}];
    return[
      {key:"basvuru_ve_hesaplama",label:"Başvuru + İş Deneyim Hesaplama + Dosya Hazırlığı",desc:"Hesaplama, dosya ve bakanlık başvurusu tam hizmet.",price:"20.000 ₺",tags:["Hesaplama","Dosya","Başvuru"],popular:true},
      {key:"sadece_hesaplama",label:"Sadece İş Deneyim Hesaplama + Sınıf Tayini",desc:"ÜFE güncel tutar hesaplaması ve sınıf tayini.",price:"9.000 ₺",tags:["Hesaplama","Sınıf Tayini"]},
      {key:"bilgi_alma",label:"Bilgi Alma Danışmanlığı",desc:"Süreçle ilgili sorularınız yanıtlanır.",price:"7.000 ₺",tags:["Danışmanlık"]},
    ];
  };
  const getDisariOption=()=>{
    const hasExp=hasYapiIsi||hasDiploma;
    if(isKooperatif||!hasExp)return{key:"koop_disari",label:"Bilgi Alma Danışmanlığı",desc:"Telefon/e-posta süreç desteği.",price:"7.000 ₺",tags:["Danışmanlık"]};
    return{key:"sadece_hesaplama_disari",label:"İş Deneyim Hesaplama (Uzaktan)",desc:"Uzaktan hesaplama ve sınıf tayini.",price:"9.000 ₺",tags:["Hesaplama","Uzaktan"]};
  };

  const currentStep = STEPS[stepIdx];
  const totalSteps = STEPS.length;

  /* ─── SIDEBAR ─── */
  const STEP_LABELS: Record<string,{label:string;sub:string}> = {
    firma:   {label:"Şirket bilgileri",sub:"Firma tipi, iletişim, KEP"},
    deneyim: {label:"İş deneyimi",    sub:"Yapım işleri, diploma"},
    konum:   {label:"Konum & hizmet", sub:"Paket seçimi"},
    ozet:    {label:"Özet",           sub:"Onay ve gönder"},
  };

  return (
    <div style={{minHeight:"100vh",background:"#F8F7F4",fontFamily:"Inter,-apple-system,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* Topbar */}
      <div style={{background:"#0B1D3A",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",flexShrink:0}}>
        <button onClick={()=>(loc.state as any)?.companyId?navigate("/dashboard"):navigate("/")}
          style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,0.55)",fontSize:13,background:"none",border:"none",cursor:"pointer"}}>
          <ArrowLeft size={14} color="rgba(255,255,255,0.55)"/> {(loc.state as any)?.companyId?"Panele Dön":"Ana Sayfa"}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Award size={18} color="#C9952B"/>
          <span style={{color:"white",fontSize:14,fontWeight:500}}>muteahhitlikbelgesi<span style={{color:"#C9952B"}}>.com</span></span>
        </div>
        <div style={{width:120}}/>
      </div>

      {/* Masaüstü uyarısı */}
      <div style={{background:"rgba(201,149,43,0.08)",borderBottom:"1px solid rgba(201,149,43,0.2)",padding:"8px 32px",display:"flex",alignItems:"center",gap:8}}>
        <Monitor size={14} color="#C9952B"/>
        <span style={{fontSize:12,color:"#7A6030"}}>Bu formu masaüstü bilgisayardan doldurmanız önerilir. Dosya yükleme ve tarih girişi daha kolay olacaktır.</span>
      </div>

      {/* Ana içerik — iki kolon */}
      <div style={{display:"flex",flex:1}}>

        {/* Sidebar */}
        <div style={{width:260,background:"white",borderRight:"1px solid rgba(11,29,58,0.08)",padding:"28px 20px",display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:500,color:"#5A6478",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:16,padding:"0 8px"}}>Başvuru adımları</div>
          {STEPS.map((s,i)=>{
            const done=i<stepIdx; const active=i===stepIdx; const pending=i>stepIdx;
            const {label,sub}=STEP_LABELS[s]||{label:s,sub:""};
            return (
              <div key={s}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 10px",borderRadius:10,background:active?"rgba(201,149,43,0.08)":"transparent"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,flexShrink:0,background:done?"#C9952B":active?"#0B1D3A":"rgba(11,29,58,0.06)",color:done||active?"white":"#5A6478"}}>
                    {done?"✓":i+1}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:pending?"#5A6478":"#0B1D3A"}}>{label}</div>
                    <div style={{fontSize:11,color:"#5A6478",marginTop:1}}>{sub}</div>
                  </div>
                </div>
                {i<STEPS.length-1&&<div style={{width:1,height:16,background:"rgba(11,29,58,0.08)",margin:"2px 0 2px 22px"}}/>}
              </div>
            );
          })}
          <div style={{flex:1}}/>
          <div style={{padding:"14px",background:"rgba(11,29,58,0.04)",borderRadius:10,marginTop:16}}>
            <div style={{fontSize:12,fontWeight:500,color:"#0B1D3A",marginBottom:4}}>Yardım mı lazım?</div>
            <div style={{fontSize:11,color:"#5A6478",lineHeight:1.5}}>Formu doldurmakta zorluk çekiyorsanız bizi arayabilirsiniz.</div>
          </div>
        </div>

        {/* Form alanı */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>
          <div style={{flex:1,padding:"36px 48px",maxWidth:800}}>

            {/* ─── STEP: FİRMA ─── */}
            {currentStep==="firma"&&(
              <div>
                <div style={{marginBottom:28}}>
                  <h2 style={{fontSize:22,fontWeight:500,color:"#0B1D3A",margin:"0 0 6px",letterSpacing:"-0.02em"}}>Şirket bilgileri</h2>
                  <p style={{fontSize:13,color:"#5A6478",margin:0}}>Firma bilgilerinizi eksiksiz doldurunuz.</p>
                </div>

                {/* Uyarı */}
                <div style={{background:"rgba(201,149,43,0.07)",border:"1px solid rgba(201,149,43,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:28,display:"flex",gap:10}}>
                  <Info size={16} color="#C9952B" style={{flexShrink:0,marginTop:1}}/>
                  <p style={{fontSize:12,color:"#7A6030",lineHeight:1.6,margin:0}}>Girdiğiniz tüm bilgilerin doğru olduğundan emin olun. Yanlış bilgi başvurunuzun reddedilmesine yol açabilir.</p>
                </div>

                {/* Şirket türü */}
                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                    Şirket türü<span style={{color:"#EF4444"}}>*</span>
                    <div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {([["sahis","Şahıs Firması"],["limited_as","Limited / A.Ş."],["kooperatif","Kooperatif"]] as const).map(([val,lbl])=>(
                      <button key={val} onClick={()=>setCompanyType(val)}
                        style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${companyType===val?"#C9952B":"rgba(11,29,58,0.1)"}`,background:companyType===val?"rgba(201,149,43,0.08)":"white",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                        <div style={{width:15,height:15,borderRadius:"50%",border:`2px solid ${companyType===val?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {companyType===val&&<div style={{width:7,height:7,borderRadius:"50%",background:"#C9952B"}}/>}
                        </div>
                        <span style={{fontSize:13,color:"#0B1D3A"}}>{lbl}</span>
                      </button>
                    ))}
                  </div>
                  {showErrors&&companyType===""&&<p style={{fontSize:12,color:"#EF4444",marginTop:6}}>Şirket türü seçiniz.</p>}
                </div>

                {/* Temel bilgiler */}
                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                    Temel bilgiler<span style={{color:"#EF4444"}}>*</span><div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>Şirket / firma adı <span style={{color:"#EF4444"}}>*</span></label>
                      <input value={companyName} onChange={e=>setCompanyName(e.target.value.slice(0,100))} placeholder="Örn: ABC İnşaat Taahhüt A.Ş."
                        style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:`1px solid ${showErrors&&companyName.trim().length<3?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>Vergi no <span style={{color:"#EF4444"}}>*</span></label>
                      <input value={taxId} onChange={e=>setTaxId(e.target.value.replace(/\D/g,"").slice(0,11))} placeholder="1234567890"
                        style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:`1px solid ${showErrors&&taxId.length<10?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>Telefon <span style={{color:"#EF4444"}}>*</span></label>
                      <input value={phone} onChange={handlePhoneInput} placeholder="0(5XX) XXX XX XX"
                        style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:`1px solid ${showErrors&&!isPhoneOk(phone)?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>E-posta <span style={{color:"#EF4444"}}>*</span></label>
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value.slice(0,100))} placeholder="info@firma.com"
                        style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:`1px solid ${showErrors&&!isEmailOk(email)?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                    </div>
                  </div>
                </div>

                {/* Ortaklar — sadece Ltd/AŞ */}
                {isLimitedAS&&(
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                      Ortaklar<span style={{color:"#EF4444"}}>*</span><div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                      <button onClick={()=>setPartners(p=>[...p,createPartner()])} style={{fontSize:12,color:"#C9952B",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                        <Plus size={14}/> Ortak Ekle
                      </button>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {partners.map((p,i)=>(
                        <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 100px 36px",gap:10,alignItems:"end",background:"rgba(240,237,232,0.4)",padding:"12px",borderRadius:8}}>
                          <div>
                            <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Ad Soyad <span style={{color:"#EF4444"}}>*</span></label>
                            <input value={p.name} onChange={e=>updPartner(p.id,"name",e.target.value.slice(0,60))} placeholder="Ortak adı"
                              style={{width:"100%",padding:"8px 10px",borderRadius:6,background:"#F3F0EB",border:`1px solid ${showErrors&&p.name.trim().length<2?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                          </div>
                          <div>
                            <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>TC Kimlik No <span style={{color:"#EF4444"}}>*</span></label>
                            <input value={p.tcKimlikNo} onChange={e=>updPartner(p.id,"tcKimlikNo",e.target.value.replace(/\D/g,"").slice(0,11))} placeholder="12345678901"
                              style={{width:"100%",padding:"8px 10px",borderRadius:6,background:"#F3F0EB",border:`1px solid ${showErrors&&p.tcKimlikNo.length!==11?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                          </div>
                          <div>
                            <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Hisse %</label>
                            <input value={p.sharePercent} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,3);if(Number(v)<=100)updPartner(p.id,"sharePercent",v);}} placeholder="51"
                              style={{width:"100%",padding:"8px 10px",borderRadius:6,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none",boxSizing:"border-box"}} />
                          </div>
                          <button onClick={()=>{if(partners.length>1)setPartners(p=>p.filter(x=>x.id!==p.id));}} style={{height:36,display:"flex",alignItems:"center",justifyContent:"center",border:"none",background:"none",cursor:"pointer",color:"#EF4444"}}>
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      ))}
                    </div>
                    {totalShare>0&&<p style={{fontSize:12,marginTop:6,color:totalShare===100?"#16a34a":"#f59e0b"}}>Toplam hisse: %{totalShare}{totalShare!==100?" (toplamın %100 olması gerekir)":""}</p>}
                  </div>
                )}

                {/* Ek bilgiler */}
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                    Ek bilgiler<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:18}}>
                    {!isKooperatif&&(
                      <div>
                        <p style={{fontSize:13,color:"#5A6478",marginBottom:10}}>Yapımını planladığınız belirli bir projeniz var mı? <span style={{color:"#EF4444"}}>*</span></p>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                          <button onClick={()=>setHasSpecificArea("yes")} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${hasSpecificArea==="yes"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:hasSpecificArea==="yes"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${hasSpecificArea==="yes"?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{hasSpecificArea==="yes"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C9952B"}}/>}</div><span style={{fontSize:13,color:"#0B1D3A"}}>Evet, belirli bir projem var</span></div>
                          </button>
                          <button onClick={()=>{setHasSpecificArea("no");setMinAreaRequirement("");}} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${hasSpecificArea==="no"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:hasSpecificArea==="no"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${hasSpecificArea==="no"?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{hasSpecificArea==="no"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C9952B"}}/>}</div><span style={{fontSize:13,color:"#0B1D3A"}}>Hayır, en yüksek grubu istiyoruz</span></div>
                          </button>
                        </div>
                        {hasSpecificArea==="yes"&&(
                          <div style={{marginTop:12}}>
                            <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:4}}>Projenin inşaat alanı (m²) <span style={{color:"#EF4444"}}>*</span></label>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <input value={minAreaRequirement} onChange={e=>{const f=fmtNum(e.target.value);if(e.target.value.replace(/\D/g,"").length<=9)setMinAreaRequirement(f);}} placeholder="10.000"
                                style={{width:200,padding:"8px 12px",borderRadius:8,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none"}} />
                              <span style={{fontSize:13,color:"#5A6478"}}>m² ve üzeri</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <p style={{fontSize:13,color:"#5A6478",marginBottom:10}}>KEP (Kayıtlı Elektronik Posta) adresiniz var mı? <span style={{color:"#EF4444"}}>*</span></p>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <button onClick={()=>setHasKep("yes")} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${hasKep==="yes"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:hasKep==="yes"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${hasKep==="yes"?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{hasKep==="yes"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C9952B"}}/>}</div><span style={{fontSize:13,color:"#0B1D3A"}}>Evet, KEP adresim var</span></div>
                        </button>
                        <button onClick={()=>{setHasKep("no");setKepAddress("");}} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${hasKep==="no"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:hasKep==="no"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${hasKep==="no"?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{hasKep==="no"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C9952B"}}/>}</div><span style={{fontSize:13,color:"#0B1D3A"}}>Bilmiyorum / Yok</span></div>
                        </button>
                      </div>
                      {hasKep==="yes"&&(
                        <div style={{marginTop:12}}>
                          <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:4}}>KEP adresi <span style={{color:"#EF4444"}}>*</span></label>
                          <input value={kepAddress} onChange={e=>setKepAddress(e.target.value.slice(0,100))} placeholder="firma@hs01.kep.tr"
                            style={{width:"100%",padding:"8px 12px",borderRadius:8,background:"#F3F0EB",border:`1px solid ${showErrors&&kepAddress.trim().length<5?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        </div>
                      )}
                    </div>
                    {!isKooperatif&&(
                      <div>
                        <p style={{fontSize:13,color:"#5A6478",marginBottom:10}}>Müteahhitlik belgesi daha önce alındı mı? <span style={{color:"#EF4444"}}>*</span></p>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                          <button onClick={()=>setIsFirstTime("first")} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${isFirstTime==="first"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:isFirstTime==="first"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${isFirstTime==="first"?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{isFirstTime==="first"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C9952B"}}/>}</div><div><p style={{fontSize:13,color:"#0B1D3A",margin:"0 0 2px"}}>İlk kez alınacak</p><p style={{fontSize:11,color:"#5A6478",margin:0}}>Daha önce belge alınmadı</p></div></div>
                          </button>
                          <button onClick={()=>setIsFirstTime("renewal")} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${isFirstTime==="renewal"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:isFirstTime==="renewal"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${isFirstTime==="renewal"?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{isFirstTime==="renewal"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#C9952B"}}/>}</div><div><p style={{fontSize:13,color:"#0B1D3A",margin:"0 0 2px"}}>Yenileme / grup yükseltme</p><p style={{fontSize:11,color:"#5A6478",margin:0}}>Mevcut belge var</p></div></div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP: DENEYİM ─── */}
            {currentStep==="deneyim"&&(
              <div>
                <div style={{marginBottom:28}}>
                  <h2 style={{fontSize:22,fontWeight:500,color:"#0B1D3A",margin:"0 0 6px",letterSpacing:"-0.02em"}}>{isUpgrade?"Yeni İş Deneyimi Ekle":"İş Deneyim & Yeterlilik"}</h2>
                  <p style={{fontSize:13,color:"#5A6478",margin:0}}>{isUpgrade?"Tamamladığınız yeni işleri ekleyin.":"Sahip olduğunuz yeterlilikleri işaretleyiniz."}</p>
                </div>

                {/* İskan uyarısı */}
                <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:24,display:"flex",gap:10}}>
                  <AlertTriangle size={16} color="#DC2626" style={{flexShrink:0,marginTop:1}}/>
                  <div style={{fontSize:12,color:"#991B1B",lineHeight:1.6}}>
                    <strong>İskan belgelerinizi hazır bulundurun.</strong> Her yapım işi için iskan/kabul belgesi PDF olarak zorunludur.
                    Belgelerin <strong>okunaklı</strong> olduğundan emin olun — eksik veya okunamaz belgeler başvurunuzun gecikmesine neden olur.
                  </div>
                </div>

                {!isUpgrade&&(
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                      Yeterlilik türleri<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {[
                        {key:"yapiIsi",checked:hasYapiIsi,onChange:()=>{setHasYapiIsi(!hasYapiIsi);if(!hasYapiIsi)setHasNone(false);},label:"Yapım işim var",sub:"Kat karşılığı veya taahhüt/ihale inşaat işleri"},
                        {key:"diploma",checked:hasDiploma,onChange:()=>{setHasDiploma(!hasDiploma);if(!hasDiploma)setHasNone(false);},label:companyType==="sahis"?"Diploma sahibiyim":"Ortaktan diploma başvurusu",sub:"İnşaat Mühendisliği veya Mimarlık"},
                        {key:"none",checked:hasNone,onChange:()=>{const n=!hasNone;setHasNone(n);if(n){setHasYapiIsi(false);setHasDiploma(false);}},label:"Mevcut belge / iş deneyim yok",sub:"Şu an kullanılabilecek belge bulunmuyor"},
                      ].map(({key,checked,onChange,label,sub})=>(
                        <button key={key} onClick={onChange} style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${checked?"#C9952B":"rgba(11,29,58,0.1)"}`,background:checked?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"flex-start",gap:10}}>
                          <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${checked?"#C9952B":"rgba(11,29,58,0.2)"}`,background:checked?"#C9952B":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                            {checked&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <div><p style={{fontSize:13,color:"#0B1D3A",margin:"0 0 2px",fontWeight:500}}>{label}</p><p style={{fontSize:11,color:"#5A6478",margin:0}}>{sub}</p></div>
                        </button>
                      ))}
                    </div>
                    {showErrors&&!atLeastOne&&<p style={{fontSize:12,color:"#EF4444",marginTop:6}}>En az bir seçenek işaretleyiniz.</p>}
                  </div>
                )}

                {/* Yapım işleri girişi */}
                {(hasYapiIsi||isUpgrade)&&(
                  <div style={{marginBottom:24}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase"}}>İş deneyim girişleri</div>
                      <button onClick={()=>setExperiences(p=>[...p,createExp()])}
                        style={{display:"flex",alignItems:"center",gap:6,background:"#0B1D3A",color:"white",border:"none",padding:"7px 14px",borderRadius:8,fontSize:12,cursor:"pointer"}}>
                        <Plus size={14}/> İş Ekle
                      </button>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:16}}>
                      {experiences.map((e,i)=>{
                        const siniflar = gecerliSiniflar(e.contractDate, parseFloat(e.buildingHeight)||0);
                        const sinifUyum = e.buildingClass && e.buildingHeight ? sinifUyumKontrolu(e.buildingClass, parseFloat(e.buildingHeight)||0) : null;
                        const sozYil = e.contractDate ? new Date(e.contractDate).getFullYear() : 0;
                        return (
                          <div key={e.id} style={{border:"1px solid rgba(11,29,58,0.1)",borderRadius:12,overflow:"hidden"}}>
                            <div style={{background:"#F0EDE8",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:20,height:20,borderRadius:"50%",background:"#0B1D3A",color:"white",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>
                                <span style={{fontSize:13,color:"#0B1D3A",fontWeight:500}}>Yapım İşi</span>
                              </div>
                              {experiences.length>1&&<button onClick={()=>setExperiences(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",display:"flex"}}><Trash2 size={15}/></button>}
                            </div>
                            <div style={{padding:16}}>
                              {/* İş türü */}
                              <div style={{marginBottom:14}}>
                                <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:8,fontWeight:500}}>İş türü <span style={{color:"#EF4444"}}>*</span></label>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                                  {[["kat_karsiligi","Kat karşılığı"],["taahhut","Taahhüt / ihale"]].map(([val,lbl])=>(
                                    <button key={val} type="button" onClick={()=>updExp(e.id,"isDeneyimiTipi",val as any)}
                                      style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${e.isDeneyimiTipi===val?"#C9952B":"rgba(11,29,58,0.1)"}`,background:e.isDeneyimiTipi===val?"rgba(201,149,43,0.08)":"white",cursor:"pointer",fontSize:13,textAlign:"center",fontWeight:e.isDeneyimiTipi===val?500:400,color:"#0B1D3A"}}>
                                      {lbl}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Müteahhit = arsa sahibi toggle */}
                              {e.isDeneyimiTipi==="kat_karsiligi"&&(
                                <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>updExp(e.id,"muteahhitArsaSahibiAyni",!e.muteahhitArsaSahibiAyni)}>
                                  <div style={{width:36,height:20,borderRadius:10,background:e.muteahhitArsaSahibiAyni?"#C9952B":"#E8E4DC",flexShrink:0,display:"flex",alignItems:"center",padding:"0 2px",transition:"background 0.2s"}}>
                                    <div style={{width:16,height:16,borderRadius:8,background:"white",transform:e.muteahhitArsaSahibiAyni?"translateX(16px)":"translateX(0)",transition:"transform 0.2s",boxShadow:"0 1px 2px rgba(0,0,0,0.2)"}}/>
                                  </div>
                                  <span style={{fontSize:12,color:"#5A6478",userSelect:"none"}}>Yapı sahibi ve müteahhit aynı kişi / firma</span>
                                </div>
                              )}

                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                                <div>
                                  <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Ada / Parsel <span style={{fontSize:10}}>(max 15 karakter)</span></label>
                                  <input value={e.adaParsel} onChange={ev=>updExp(e.id,"adaParsel",ev.target.value.slice(0,15))} placeholder="120/5" maxLength={15}
                                    style={{width:"100%",padding:"8px 10px",borderRadius:6,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none",boxSizing:"border-box"}} />
                                </div>
                                <div>
                                  <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Sözleşme Tarihi <span style={{color:"#EF4444"}}>*</span></label>
                                  <input type="date" value={e.contractDate}
                                    onChange={ev=>{const v=sanitizeDateInput(ev.target.value);updExp(e.id,"contractDate",v);if(e.buildingClass&&!gecerliSiniflar(v,parseFloat(e.buildingHeight)||0).includes(e.buildingClass))updExp(e.id,"buildingClass","");}}
                                    min="2010-01-01" max="2026-12-31"
                                    style={{width:"100%",padding:"8px 10px",borderRadius:6,background:showErrors&&!e.contractDate?"#FEF2F2":"#F3F0EB",border:`1px solid ${showErrors&&!e.contractDate?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                                  {sozYil>0&&sozYil<2010&&<p style={{fontSize:11,color:"#EF4444",margin:"3px 0 0"}}>2010 öncesi işler desteklenmiyor.</p>}
                                </div>
                                <div>
                                  <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>İskan / Kabul Tarihi</label>
                                  <input type="date" value={e.occupancyDate} onChange={ev=>updExp(e.id,"occupancyDate",sanitizeDateInput(ev.target.value))} min="2010-01-01" max="2026-12-31"
                                    style={{width:"100%",padding:"8px 10px",borderRadius:6,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none",boxSizing:"border-box"}} />
                                </div>

                                {e.isDeneyimiTipi==="taahhut"&&(
                                  <div style={{gridColumn:"1/-1"}}>
                                    <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Sözleşme bedeli (₺) <span style={{color:"#EF4444"}}>*</span></label>
                                    <input value={e.sozlesmeBedeli} onChange={ev=>{const r=ev.target.value.replace(/\D/g,"");updExp(e.id,"sozlesmeBedeli",r?parseInt(r).toLocaleString("tr-TR"):"");}} placeholder="1.000.000"
                                      style={{width:"100%",padding:"8px 10px",borderRadius:6,background:showErrors&&!e.sozlesmeBedeli?"#FEF2F2":"#F3F0EB",border:`1px solid ${showErrors&&!e.sozlesmeBedeli?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                                  </div>
                                )}

                                {e.isDeneyimiTipi==="kat_karsiligi"&&(<>
                                  <div>
                                    <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>İnşaat alanı (m²) <span style={{color:"#EF4444"}}>*</span></label>
                                    <input value={e.totalArea} onChange={ev=>{const f=fmtNum(ev.target.value);if(ev.target.value.replace(/\D/g,"").length<=9)updExp(e.id,"totalArea",f);}} placeholder="5.000"
                                      style={{width:"100%",padding:"8px 10px",borderRadius:6,background:showErrors&&!e.totalArea?"#FEF2F2":"#F3F0EB",border:`1px solid ${showErrors&&!e.totalArea?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                                  </div>
                                  <div>
                                    <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Yapı yüksekliği (m)</label>
                                    <input value={e.buildingHeight} onChange={ev=>{const v=ev.target.value.replace(/[^0-9.]/g,"").slice(0,6);updExp(e.id,"buildingHeight",v);const m=parseFloat(v)||0;if(m>0&&e.buildingClass&&!gecerliSiniflar(e.contractDate,m).includes(e.buildingClass))updExp(e.id,"buildingClass","");}} placeholder="21.50"
                                      style={{width:"100%",padding:"8px 10px",borderRadius:6,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none",boxSizing:"border-box"}} />
                                    {sinifUyum&&<p style={{fontSize:11,color:"#EF4444",margin:"3px 0 0"}}>{sinifUyum}</p>}
                                  </div>
                                  <div>
                                    <label style={{display:"block",fontSize:11,color:"#5A6478",marginBottom:4}}>Yapı sınıfı <span style={{color:"#EF4444"}}>*</span></label>
                                    <select value={e.buildingClass} onChange={ev=>updExp(e.id,"buildingClass",ev.target.value)}
                                      style={{width:"100%",padding:"8px 10px",borderRadius:6,background:showErrors&&!e.buildingClass?"#FEF2F2":"#F3F0EB",border:`1px solid ${showErrors&&!e.buildingClass?"#EF4444":"transparent"}`,fontSize:13,outline:"none",boxSizing:"border-box"}}>
                                      <option value="">Seçiniz</option>
                                      {siniflar.map(s=><option key={s} value={s}>{s} Sınıfı</option>)}
                                    </select>
                                    {e.contractDate&&siniflar.length<4&&<p style={{fontSize:11,color:"#5A6478",margin:"3px 0 0"}}>{new Date(e.contractDate).getFullYear()} yılında geçerli sınıflar listeleniyor.</p>}
                                  </div>
                                </>)}
                              </div>

                              {/* İskan yükleme — zorunlu */}
                              {e.isDeneyimiTipi==="kat_karsiligi"&&(
                                <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(11,29,58,0.08)"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                                    <label style={{fontSize:11,color:"#5A6478"}}>İskan / Kabul Belgesi (PDF)</label>
                                    <span style={{fontSize:10,background:"#EF4444",color:"white",padding:"1px 6px",borderRadius:4}}>Zorunlu</span>
                                  </div>
                                  {e.iskanFile?(
                                    <div style={{display:"flex",alignItems:"center",gap:10,background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"10px 14px"}}>
                                      <FileText size={16} color="#16a34a" style={{flexShrink:0}}/>
                                      <span style={{fontSize:13,color:"#15803d",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.iskanFile.name}</span>
                                      <button type="button" onClick={()=>updExp(e.id,"iskanFile",null)} style={{background:"none",border:"none",cursor:"pointer",color:"#16a34a",display:"flex"}}><X size={15}/></button>
                                    </div>
                                  ):(
                                    <label style={{display:"flex",alignItems:"center",gap:10,border:`2px dashed ${showErrors&&!e.iskanFile?"#EF4444":"rgba(11,29,58,0.15)"}`,borderRadius:10,padding:"12px 16px",cursor:"pointer",background:showErrors&&!e.iskanFile?"#FEF2F2":"white"}}>
                                      <Upload size={16} color={showErrors&&!e.iskanFile?"#EF4444":"#5A6478"} style={{flexShrink:0}}/>
                                      <div>
                                        <p style={{fontSize:13,color:showErrors&&!e.iskanFile?"#EF4444":"#5A6478",margin:"0 0 2px"}}>{showErrors&&!e.iskanFile?"İskan belgesi zorunludur":"PDF, JPG veya PNG yükleyin"}</p>
                                        <p style={{fontSize:11,color:"#9CA3AF",margin:0}}>Belgenin okunaklı olduğundan emin olun</p>
                                      </div>
                                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={ev=>{const f=ev.target.files?.[0];if(f)setExperiences(p=>p.map(x=>x.id===e.id?{...x,iskanFile:f}:x));}} />
                                    </label>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Diploma */}
                {hasDiploma&&!isUpgrade&&(
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                      Diploma bilgileri<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>{companyType==="sahis"?"Ad Soyad":"Diploma Sahibi Ortağın Adı"} <span style={{color:"#EF4444"}}>*</span></label>
                        {isLimitedAS&&partners.length>0?(
                          <select value={diplomaPartnerName} onChange={e=>{setDiplomaPartnerName(e.target.value);const f=partners.find(p=>p.name===e.target.value);setDiplomaSharePercent(f?f.sharePercent:"");}}
                            style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none",boxSizing:"border-box"}}>
                            <option value="">Ortak seçiniz</option>{partners.filter(p=>p.name.trim().length>=2).map(p=><option key={p.id} value={p.name}>{p.name} (%{p.sharePercent||"?"})</option>)}
                          </select>
                        ):(
                          <input value={diplomaPartnerName} onChange={e=>setDiplomaPartnerName(e.target.value.slice(0,60))} placeholder="Ad Soyad"
                            style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none",boxSizing:"border-box"}} />
                        )}
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>Bölüm <span style={{color:"#EF4444"}}>*</span></label>
                        <select value={diplomaDepartment} onChange={e=>setDiplomaDepartment(e.target.value as any)}
                          style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none",boxSizing:"border-box"}}>
                          <option value="">Seçiniz</option><option value="insaat_muhendisligi">İnşaat Mühendisliği</option><option value="mimarlik">Mimarlık</option>
                        </select>
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>Mezuniyet Tarihi <span style={{color:"#EF4444"}}>*</span></label>
                        <input type="date" value={diplomaGradDate} onChange={e=>setDiplomaGradDate(sanitizeDateInput(e.target.value))} min="1970-01-01" max="2026-12-31"
                          style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none",boxSizing:"border-box"}} />
                      </div>
                      {isLimitedAS&&(<>
                        <div>
                          <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>Hisse oranı (%) <span style={{color:"#EF4444"}}>*</span></label>
                          <input value={diplomaSharePercent} readOnly={partners.some(p=>p.name===diplomaPartnerName)} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,3);if(Number(v)<=100)setDiplomaSharePercent(v);}} placeholder="%51"
                            style={{width:120,padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none"}} />
                          {diplomaSharePercent&&!dipShareOk&&<p style={{fontSize:11,color:"#EF4444",marginTop:3}}>En az %51 hisse gereklidir.</p>}
                        </div>
                        <div>
                          <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:6}}>Ortaklık süresi (yıl) <span style={{color:"#EF4444"}}>*</span></label>
                          <input value={diplomaPartnershipYears} onChange={e=>setDiplomaPartnershipYears(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="5"
                            style={{width:120,padding:"9px 12px",borderRadius:8,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none"}} />
                          {diplomaPartnershipYears&&!dipYearsOk&&<p style={{fontSize:11,color:"#EF4444",marginTop:3}}>En az 5 yıl ortaklık gereklidir.</p>}
                        </div>
                      </>)}
                    </div>
                  </div>
                )}

                {hasNone&&!hasYapiIsi&&!hasDiploma&&(
                  <div style={{background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:10,padding:"14px 16px",display:"flex",gap:10}}>
                    <AlertTriangle size={16} color="#D97706" style={{flexShrink:0,marginTop:1}}/>
                    <div style={{fontSize:13,color:"#92400E"}}>
                      <p style={{margin:"0 0 4px"}}>Belge/iş deneyimi bulunmadığını belirttiniz.</p>
                      <p style={{margin:0,fontSize:11,color:"#B45309"}}>En uygun çözümü birlikte değerlendireceğiz.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP: KONUM ─── */}
            {currentStep==="konum"&&(()=>{
              const opts=getIstanbulOptions(); const disari=getDisariOption();
              return(
                <div>
                  <div style={{marginBottom:28}}>
                    <h2 style={{fontSize:22,fontWeight:500,color:"#0B1D3A",margin:"0 0 6px",letterSpacing:"-0.02em"}}>Konum ve hizmet seçimi</h2>
                    <p style={{fontSize:13,color:"#5A6478",margin:0}}>Konumunuza göre hizmet seçeneklerini belirleyelim.</p>
                  </div>
                  <div style={{background:"rgba(201,149,43,0.07)",border:"1px solid rgba(201,149,43,0.18)",borderRadius:10,padding:"12px 16px",marginBottom:24,display:"flex",gap:10}}>
                    <Info size={14} color="#C9952B" style={{flexShrink:0,marginTop:1}}/>
                    <p style={{fontSize:12,color:"#7A6030",margin:0}}>Ücretlerimize harçlar dahil değildir. KDV dahildir.</p>
                  </div>

                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                      Konum<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <button onClick={()=>{setLocation("istanbul");setSelectedService("");setCity("");}} style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${location==="istanbul"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:location==="istanbul"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><MapPin size={16} color={location==="istanbul"?"#C9952B":"#5A6478"}/><div><p style={{fontSize:13,color:"#0B1D3A",margin:"0 0 2px",fontWeight:500}}>İstanbul</p><p style={{fontSize:11,color:"#5A6478",margin:0}}>Yüz yüze hizmet dahil</p></div></div>
                      </button>
                      <button onClick={()=>{setLocation("istanbul_disi");setSelectedService(disari.key);}} style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${location==="istanbul_disi"?"#C9952B":"rgba(11,29,58,0.1)"}`,background:location==="istanbul_disi"?"rgba(201,149,43,0.08)":"white",cursor:"pointer",textAlign:"left"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><MapPin size={16} color="#5A6478"/><div><p style={{fontSize:13,color:"#0B1D3A",margin:"0 0 2px",fontWeight:500}}>İstanbul Dışı</p><p style={{fontSize:11,color:"#5A6478",margin:0}}>Uzaktan hizmet</p></div></div>
                      </button>
                    </div>
                    {location==="istanbul_disi"&&(
                      <div style={{marginTop:12}}>
                        <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:4}}>İl <span style={{color:"#EF4444"}}>*</span></label>
                        <input value={city} onChange={e=>setCity(e.target.value.slice(0,40))} placeholder="Ankara"
                          style={{width:200,padding:"8px 12px",borderRadius:8,background:"#F3F0EB",border:"1px solid transparent",fontSize:13,outline:"none"}} />
                      </div>
                    )}
                  </div>

                  {location==="istanbul"&&(
                    <div>
                      <div style={{fontSize:11,fontWeight:500,color:"#C9952B",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                        Hizmet paketi<div style={{flex:1,height:1,background:"rgba(201,149,43,0.2)"}}/>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {opts.map((opt:any)=>(
                          <button key={opt.key} onClick={()=>setSelectedService(opt.key)} style={{padding:"18px 20px",borderRadius:12,border:`${selectedService===opt.key?"2px solid #C9952B":"1px solid rgba(11,29,58,0.1)"}`,background:selectedService===opt.key?"rgba(201,149,43,0.06)":opt.popular?"rgba(201,149,43,0.02)":"white",cursor:"pointer",textAlign:"left",position:"relative"}}>
                            {opt.popular&&<span style={{position:"absolute",top:-10,left:16,background:"#C9952B",color:"#0B1D3A",fontSize:11,fontWeight:500,padding:"2px 10px",borderRadius:20}}>Popüler</span>}
                            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                              <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${selectedService===opt.key?"#C9952B":"rgba(11,29,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                                {selectedService===opt.key&&<div style={{width:9,height:9,borderRadius:"50%",background:"#C9952B"}}/>}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                                  <span style={{fontSize:14,color:"#0B1D3A",fontWeight:500}}>{opt.label}</span>
                                  <div style={{textAlign:"right",flexShrink:0,marginLeft:16}}>
                                    <span style={{fontSize:15,color:"#C9952B",fontWeight:700}}>{opt.price}</span>
                                    <div style={{fontSize:11,color:"#9CA3AF"}}>KDV dahil</div>
                                  </div>
                                </div>
                                <p style={{fontSize:12,color:"#5A6478",margin:"0 0 6px"}}>{opt.desc}</p>
                                {opt.harc&&<p style={{fontSize:11,color:"#D97706",margin:"0 0 6px",display:"flex",alignItems:"center",gap:4}}><AlertTriangle size={12}/> Ayrıca {opt.harc} harç</p>}
                                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{opt.tags.map((t:string)=><span key={t} style={{fontSize:11,background:"#F0FDF4",color:"#15803d",padding:"2px 8px",borderRadius:20,display:"flex",alignItems:"center",gap:3}}><CheckCircle size={10}/>{t}</span>)}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {location==="istanbul_disi"&&(
                    <div style={{padding:"18px 20px",borderRadius:12,border:"2px solid #C9952B",background:"rgba(201,149,43,0.06)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:14,color:"#0B1D3A",fontWeight:500}}>{disari.label}</span>
                        <span style={{fontSize:15,color:"#C9952B",fontWeight:700}}>{disari.price}</span>
                      </div>
                      <p style={{fontSize:12,color:"#5A6478",margin:"0 0 6px"}}>{disari.desc}</p>
                      <div style={{display:"flex",gap:6}}>{disari.tags.map((t:string)=><span key={t} style={{fontSize:11,background:"#F0FDF4",color:"#15803d",padding:"2px 8px",borderRadius:20}}>{t}</span>)}</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ─── STEP: ÖZET ─── */}
            {currentStep==="ozet"&&(
              <div>
                <div style={{marginBottom:28}}>
                  <h2 style={{fontSize:22,fontWeight:500,color:"#0B1D3A",margin:"0 0 6px",letterSpacing:"-0.02em"}}>Başvuru özeti</h2>
                  <p style={{fontSize:13,color:"#5A6478",margin:0}}>Bilgilerinizi kontrol edin ve gönderin.</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[
                    {label:"Firma",value:companyName},{label:"Vergi No",value:taxId},{label:"Şirket Türü",value:companyType==="sahis"?"Şahıs":companyType==="limited_as"?"Limited/A.Ş.":"Kooperatif"},
                    {label:"Konum",value:location==="istanbul"?"İstanbul":`${city} (Dışı)`},
                    {label:"Seçilen Hizmet",value:SERVICE_INFO[selectedService]?.label||"—"},
                    {label:"Fiyat",value:SERVICE_INFO[selectedService]?.price||"—"},
                  ].map(({label,value})=>(
                    <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid rgba(11,29,58,0.06)"}}>
                      <span style={{fontSize:13,color:"#5A6478"}}>{label}</span>
                      <span style={{fontSize:13,color:"#0B1D3A",fontWeight:500}}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:20,background:"rgba(11,29,58,0.04)",borderRadius:10,padding:"14px 16px",display:"flex",gap:10}}>
                  <Info size={14} color="#5A6478" style={{flexShrink:0,marginTop:1}}/>
                  <p style={{fontSize:12,color:"#5A6478",margin:0,lineHeight:1.6}}>Gönder'e bastıktan sonra panele yönlendirileceksiniz. Ödeme ve süreç takibini panelinizden yapabilirsiniz.</p>
                </div>
              </div>
            )}

            {/* Error banner */}
            {showErrors&&!stepValid()&&(
              <div style={{marginTop:20,background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",display:"flex",gap:8}}>
                <AlertTriangle size={16} color="#DC2626" style={{flexShrink:0}}/>
                <p style={{fontSize:13,color:"#B91C1C",margin:0}}>Lütfen tüm zorunlu alanları eksiksiz doldurunuz.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{borderTop:"1px solid rgba(11,29,58,0.08)",padding:"16px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"white"}}>
            <div style={{display:"flex",gap:6}}>
              {STEPS.map((_,i)=>(
                <div key={i} style={{height:6,borderRadius:3,background:i<stepIdx?"#C9952B":i===stepIdx?"#0B1D3A":"rgba(11,29,58,0.15)",width:i===stepIdx?20:6,transition:"all 0.2s"}}/>
              ))}
              <span style={{fontSize:11,color:"#5A6478",marginLeft:6}}>Adım {stepIdx+1}/{totalSteps}</span>
            </div>
            <div style={{display:"flex",gap:12}}>
              {stepIdx>0&&(
                <button onClick={handleBack} style={{padding:"9px 20px",borderRadius:10,border:"1px solid rgba(11,29,58,0.15)",background:"white",color:"#0B1D3A",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                  <ArrowLeft size={14}/> Geri
                </button>
              )}
              <button onClick={handleNext} style={{padding:"9px 24px",borderRadius:10,border:"none",background:"#0B1D3A",color:"white",fontSize:13,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                {stepIdx<STEPS.length-1?"Devam et":"Gönder"} <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowAuthModal(false)}>
          <div style={{background:"white",borderRadius:16,maxWidth:440,width:"100%",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"#0B1D3A",padding:24}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><Award size={22} color="#C9952B"/><h3 style={{color:"white",fontSize:18,fontWeight:500,margin:0}}>Üye Ol</h3></div>
                <button onClick={()=>setShowAuthModal(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",display:"flex"}}><X size={20}/></button>
              </div>
              <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,margin:0}}>Başvurunuzu görüntülemek ve takip etmek için hesap oluşturun.</p>
            </div>
            <div style={{padding:24,display:"flex",flexDirection:"column",gap:14}}>
              {[["Ad Soyad (isteğe bağlı)",authName,setAuthName,"text","Adınız Soyadınız"],["E-posta *",authEmail,setAuthEmail,"email","ornek@email.com"],["Şifre *",authPassword,setAuthPassword,"password","En az 6 karakter"],["Şifre Tekrar *",authPasswordConfirm,setAuthPasswordConfirm,"password","Şifrenizi tekrar girin"]].map(([lbl,val,setter,type,ph])=>(
                <div key={lbl as string}>
                  <label style={{display:"block",fontSize:12,color:"#5A6478",marginBottom:4}}>{lbl as string}</label>
                  <input type={type as string} value={val as string} onChange={e=>(setter as any)(e.target.value)} placeholder={ph as string}
                    style={{width:"100%",padding:"9px 12px",background:"#F8F7F4",border:"1px solid rgba(11,29,58,0.08)",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} />
                </div>
              ))}
              {authError&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#B91C1C"}}>{authError}</div>}
              <button onClick={handleAuthAndSave} disabled={authSubmitting||!authEmail.trim()||!authPassword||!authPasswordConfirm}
                style={{width:"100%",background:authSubmitting||!authEmail.trim()||!authPassword||!authPasswordConfirm?"#E5E7EB":"#C9952B",color:"#0B1D3A",padding:"12px",borderRadius:10,border:"none",fontSize:13,fontWeight:500,cursor:"pointer"}}>
                {authSubmitting?"Hesap oluşturuluyor...":"Üye Ol & Devam Et →"}
              </button>
              <p style={{textAlign:"center",fontSize:12,color:"#5A6478",margin:0}}>Zaten hesabınız var mı? <button onClick={()=>navigate("/dashboard")} style={{background:"none",border:"none",color:"#C9952B",cursor:"pointer",fontSize:12,textDecoration:"underline"}}>Giriş yapın</button></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
