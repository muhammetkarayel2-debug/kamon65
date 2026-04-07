import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft, ArrowRight, AlertTriangle, Award, Plus, Trash2,
  Upload, FileText, X, ChevronDown, ChevronUp,
  CheckCircle, Edit2, Building2, Info
} from "lucide-react";
import { useAuth } from "./auth-context";

/* ─── Tüm sınıflar — müşteri özgürce seçer ─── */
const TUM_SINIFLAR = ["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"];

function sanitizeDate(v: string): string {
  const p = v.split("-");
  if (p.length === 3 && p[0].length > 4) { p[0] = p[0].slice(0, 4); return p.join("-"); }
  return v;
}

/* ─── Types ─── */
interface Exp {
  id: string;
  isDeneyimiTipi: "kat_karsiligi" | "taahhut";
  adaParsel: string;
  sozlesmeTarihi: string;
  iskanTarihi: string;
  insaatAlaniM2: string;
  yapiYuksekligiM: string;
  yapiSinifi: string;
  yapiTipi: string;
  muteahhitArsaAyni: boolean;
  taahhutBedeli: string;
  iskanFile: File | null;
  acik: boolean;
}
interface Partner { id: string; name: string; hisse: string; tc: string; }

function mkExp(): Exp {
  return {
    id: crypto.randomUUID(), isDeneyimiTipi: "kat_karsiligi",
    adaParsel: "", sozlesmeTarihi: "", iskanTarihi: "",
    insaatAlaniM2: "", yapiYuksekligiM: "", yapiSinifi: "", yapiTipi: "",
    muteahhitArsaAyni: false, taahhutBedeli: "", iskanFile: null, acik: true,
  };
}
function mkPartner(): Partner { return { id: crypto.randomUUID(), name: "", hisse: "", tc: "" }; }

import {
  supabase, upsertCompany, upsertExperiences, upsertDiploma,
  uploadIskan, adminAddBilling
} from "./supabase-client";

/* ─── Yardımcı fonksiyonlar ─── */
function fmtNum(v: string) { const r = v.replace(/\D/g, ""); return r ? new Intl.NumberFormat("tr-TR").format(Number(r)) : ""; }
function fmtPhone(v: string) { const d = v.replace(/\D/g, "").slice(0, 11); if (!d) return ""; if (d.length <= 1) return "0"; if (d.length <= 4) return `0(${d.slice(1)}`; if (d.length <= 7) return `0(${d.slice(1, 4)}) ${d.slice(4)}`; if (d.length <= 9) return `0(${d.slice(1, 4)}) ${d.slice(4, 7)} ${d.slice(7)}`; return `0(${d.slice(1, 4)}) ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`; }
function phoneOk(v: string) { return v.replace(/\D/g, "").length === 11; }
function emailOk(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

/* ─── Ücret tablosu ─── */
const PAKETLER = {
  bilgi_alma:        { label: "Bilgi Alma Danışmanlığı",           fiyat: "7.000 ₺",  aciklama: "Süreç hakkında bilgi alın, ne yapmanız gerektiğini öğrenin", hesaplama: false, basvuru: false },
  sadece_hesaplama:  { label: "İş Deneyim Hesaplama",              fiyat: "11.000 ₺", aciklama: "İş deneyiminiz hesaplanır, size rapor gönderilir",            hesaplama: true,  basvuru: false },
  hesaplama_basvuru: { label: "Tam Hizmet — Hesaplama & Başvuru",  fiyat: "20.000 ₺", aciklama: "Hesaplama + bakanlığa başvuru, süreci biz yönetiriz",         hesaplama: true,  basvuru: true  },
  h_grubu:           { label: "H Grubu Başvuru",                   fiyat: "12.000 ₺", aciklama: "H grubu yetki belgesi başvurusu",                             hesaplama: false, basvuru: true  },
};

/* ─── Referans şeridi verisi ─── */
const REFERANSLAR = [
  { firma: "Meş Gayrimenkul İnşaat Ltd. Şti.", il: "İstanbul" },
  { firma: "Doğu Yapı İnşaat Taahhüt A.Ş.", il: "İstanbul" },
  { firma: "Atlas Mühendislik İnşaat Ltd. Şti.", il: "İstanbul" },
  { firma: "Kuzey İnşaat Taahhüt ve Tic. A.Ş.", il: "Ankara" },
  { firma: "Güney Yapı Kooperatifi", il: "İzmir" },
  { firma: "Akdeniz İnşaat ve Proje Ltd. Şti.", il: "Antalya" },
  { firma: "Merkez Gayrimenkul Yatırım A.Ş.", il: "Bursa" },
  { firma: "Boğaziçi İnşaat Ltd. Şti.", il: "İstanbul" },
  { firma: "Yıldız Yapı Taahhüt A.Ş.", il: "İstanbul" },
  { firma: "Kartal İnşaat ve Tic. Ltd. Şti.", il: "İstanbul" },
  { firma: "Başkent Müteahhitlik A.Ş.", il: "Ankara" },
  { firma: "Ege Yapı İnşaat Kooperatifi", il: "İzmir" },
  { firma: "Marmara İnşaat Taahhüt Ltd. Şti.", il: "İstanbul" },
  { firma: "Anadolu Gayrimenkul A.Ş.", il: "Kayseri" },
  { firma: "Trakya İnşaat ve Proje Ltd. Şti.", il: "Tekirdağ" },
  { firma: "Karadeniz Yapı Taahhüt A.Ş.", il: "Trabzon" },
  { firma: "Çukurova İnşaat Ltd. Şti.", il: "Adana" },
  { firma: "Olimpos Gayrimenkul A.Ş.", il: "Antalya" },
  { firma: "Bayrak İnşaat Taahhüt Ltd. Şti.", il: "İstanbul" },
  { firma: "Doruk Yapı ve Mühendislik A.Ş.", il: "İstanbul" },
];

/* ─── Referans Şeridi Bileşeni ─── */
function ReferansSeridi() {
  const doubled = [...REFERANSLAR, ...REFERANSLAR];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(11,29,58,0.08)", background: "white", padding: "12px 0" }}>
      <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Başarıyla hizmet verdiğimiz firmalar
      </div>
      <div style={{ display: "flex", gap: 10, animation: "scroll-left 40s linear infinite", width: "max-content" }}>
        {doubled.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8F7F4", border: "1px solid rgba(11,29,58,0.07)", borderRadius: 8, padding: "6px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9952B", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#0B1D3A", fontWeight: 500 }}>{r.firma}</span>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{r.il}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ══════════════════ WIZARD ══════════════════ */
export function WizardPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { user, signUp } = useAuth() as any;
  const isUpgrade = (loc.state as any)?.isUpgrade === true;
  const upgradeId = (loc.state as any)?.companyId as string | undefined;

  /* H grubu akışı: firma → evrak → konum → ozet */
  /* Normal akış: firma → deneyim → konum → ozet */
  const [isHGrubu, setIsHGrubu] = useState(false);

  const STEPS_NORMAL = ["firma", "deneyim", "konum", "ozet"] as const;
  const STEPS_H = ["firma", "deneyim", "konum", "ozet"] as const;
  type StepNormal = typeof STEPS_NORMAL[number];
  type StepH = typeof STEPS_H[number];
  type Step = StepNormal | StepH;

  const STEPS: readonly Step[] = isHGrubu ? STEPS_H : STEPS_NORMAL;

  const [step, setStep] = useState<Step>("firma");
  const [errors, setErrors] = useState<string[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authPass2, setAuthPass2] = useState("");
  const [authName, setAuthName] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  /* Firma */
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyType, setCompanyType] = useState<"" | "sahis" | "limited_as" | "kooperatif">("");
  const [partners, setPartners] = useState<Partner[]>([mkPartner()]);
  const [hasKep, setHasKep] = useState<"" | "yes" | "no">("");
  const [kepAddress, setKepAddress] = useState("");
  const [isFirstTime, setIsFirstTime] = useState<"" | "first" | "renewal">("");
  const [mevcutGrup, setMevcutGrup] = useState("");
  const [mevcutYetkiNo, setMevcutYetkiNo] = useState("");

  /* Deneyim */
  const [hasYapiIsi, setHasYapiIsi] = useState(false);
  const [hasDiploma, setHasDiploma] = useState(false);
  const [hasNone, setHasNone] = useState(false);
  const [exps, setExps] = useState<Exp[]>([mkExp()]);
  const [dipName, setDipName] = useState("");
  const [dipBolum, setDipBolum] = useState<"" | "insaat_muhendisligi" | "mimarlik">("");
  const [dipTarih, setDipTarih] = useState("");
  const [dipYil, setDipYil] = useState("");

  /* Konum */
  const [location, setLocation] = useState<"" | "istanbul" | "istanbul_disi">("");
  const [city, setCity] = useState("");
  const [paket, setPaket] = useState("");

  const isLtd = companyType === "limited_as";
  const isKoop = companyType === "kooperatif";
  const atLeastOne = hasYapiIsi || hasDiploma || hasNone;

  /* Giriş yapmış kullanıcı zaten şirketi varsa dashboard'a yönlendir */
  useMemo(() => {
    if (user && !isUpgrade) {
      supabase.from("companies").select("id").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data?.id) navigate("/dashboard", { replace: true });
      });
    }
  }, [user?.id]);

  /* Prefill yükseltme — Supabase'den oku */
  useMemo(() => {
    if (upgradeId) {
      supabase.from("companies").select("*").eq("id", upgradeId).single().then(({ data: c }) => {
        if (c) {
          setCompanyName(c.company_name || "");
          setTaxId(c.tax_id || "");
          setPhone(c.phone || "");
          setEmail(c.email || "");
          setCompanyType((c.company_type as any) || "");
          setLocation((c.location as any) || "");
          setCity(c.city || "");
          setMevcutGrup(c.mevcut_grup || "");
          setMevcutYetkiNo(c.mevcut_yetki_no || "");
        }
      });
    }
  }, [upgradeId]);

  /* H grubu seçilince adım ayarla */
  const handleHGrubuToggle = (val: boolean) => {
    setIsHGrubu(val);
    if (val) {
      setHasNone(true); setHasYapiIsi(false); setHasDiploma(false);
      setPaket("h_grubu");
    } else {
      setHasNone(false);
      setPaket("");
      // Konum seçimini sıfırla — H grubundan çıkınca kullanıcı yeniden seçsin
      setLocation("");
      setCity("");
    }
    // Deneyim adımındayken kalabilir — seçimi değiştirebilsin
    if (step !== "deneyim") setStep("firma");
  };


  /* Validation */
  function validateStep(s: Step): string[] {
    const errs: string[] = [];
    if (s === "firma") {
      if (companyName.trim().length < 3) errs.push("Şirket adı");
      if (taxId.length < 10) errs.push("Vergi no");
      if (!phoneOk(phone)) errs.push("Telefon");
      if (!emailOk(email)) errs.push("E-posta");
      if (!companyType) errs.push("Şirket türü");
      if (isLtd) partners.forEach((p, i) => { if (!p.name.trim()) errs.push(`${i + 1}. ortak adı`); if (p.tc.length !== 11) errs.push(`${i + 1}. ortak TC`); });
      if (!hasKep) errs.push("KEP durumu");
      if (hasKep === "yes" && !kepAddress.trim()) errs.push("KEP adresi");
      if (!isKoop && !isFirstTime) errs.push("Belge durumu (ilk/yenileme)");
      if (isFirstTime === "renewal" && !mevcutGrup) errs.push("Mevcut belge grubu");
      if (isFirstTime === "renewal" && !mevcutYetkiNo.trim()) errs.push("Mevcut yetki belgesi no");
    }
    if (s === "deneyim") {
      if (!atLeastOne) errs.push("En az bir başvuru türü seçiniz");
      if (hasYapiIsi) exps.forEach((e, i) => {
        if (!e.sozlesmeTarihi) errs.push(`İş ${i + 1}: Sözleşme tarihi`);
        if (e.iskanTarihi && e.sozlesmeTarihi && new Date(e.sozlesmeTarihi) > new Date(e.iskanTarihi)) errs.push(`İş ${i + 1}: Sözleşme tarihi iskan tarihinden büyük olamaz`);
        if (!e.iskanFile) errs.push(`İş ${i + 1}: İskan belgesi`);
        if (e.isDeneyimiTipi === "kat_karsiligi") {
          if (!e.insaatAlaniM2) errs.push(`İş ${i + 1}: İnşaat alanı`);
          if (!e.yapiSinifi) errs.push(`İş ${i + 1}: Yapı sınıfı`);
        }
        if (e.isDeneyimiTipi === "taahhut" && !e.taahhutBedeli) errs.push(`İş ${i + 1}: Sözleşme bedeli`);
      });
      if (hasDiploma) {
        if (!dipName.trim()) errs.push("Diploma: Ad soyad");
        if (!dipBolum) errs.push("Diploma: Bölüm");
        if (!dipTarih) errs.push("Diploma: Mezuniyet tarihi");
      }
    }
    if (s === "konum") {
      if (!location) errs.push("Şirket faaliyet adresi");
      if (location === "istanbul_disi" && !city.trim()) errs.push("İl");
      if (!paket) errs.push("Hizmet paketi");
    }
    return errs;
  }

  function handleNext() {
    const errs = validateStep(step);
    if (errs.length > 0) { setErrors(errs); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setErrors([]);
    if (step === "ozet") { handleFinish(); return; }
    const idx = STEPS.indexOf(step as any);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function handleBack() {
    setErrors([]);
    const idx = STEPS.indexOf(step as any);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function saveCompany(userId: string) {
    const secilenPaket = PAKETLER[paket as keyof typeof PAKETLER];
    const hizmetModeli = (
      paket === "hesaplama_basvuru" || paket === "h_grubu"
    ) ? "biz_yapiyoruz" : "musteri_yapiyor";

    /* 1. Şirket kaydet / güncelle */
    const company = await upsertCompany(userId, {
      user_email: email,
      company_name: companyName,
      tax_id: taxId,
      phone,
      email,
      company_type: companyType as any,
      location,
      city,
      kep_address: hasKep === "yes" ? kepAddress : null,
      is_first_time: isFirstTime,
      mevcut_grup: mevcutGrup || null,
      mevcut_yetki_no: mevcutYetkiNo || null,
      hesaplanan_grup: null,
      selected_service: paket,
      service_label: secilenPaket?.label || "",
      hizmet_modeli: hizmetModeli as any,
      app_status: "pending_payment",
      barcode_no: null,
      certificate_no: null,
      certificate_date: null,
      certificate_expiry: null,
      basvuru_teklifi_gosterildi: false,
      basvuru_teklifi_kabul: null,
      partners: isLtd ? partners : [],
    }, upgradeId);

    /* 2. İş deneyimlerini kaydet + iskan yükle */
    if (hasYapiIsi && exps.length > 0) {
      const expPayloads = await Promise.all(
        exps.map(async (e, i) => {
          let iskanUrl: string | null = null;
          let iskanAdi: string | null = e.iskanFile?.name || null;
          if (e.iskanFile) {
            try { iskanUrl = await uploadIskan(company.id, i, e.iskanFile); } catch {}
          }
          return {
            is_deneyimi_tipi: e.isDeneyimiTipi as any,
            ada_parsel: e.adaParsel || null,
            sozlesme_tarihi: e.sozlesmeTarihi || null,
            iskan_tarihi: e.iskanTarihi || null,
            insaat_alani_m2: e.insaatAlaniM2 ? parseFloat(e.insaatAlaniM2.replace(/\./g, "")) : null,
            yapi_yuksekligi_m: e.yapiYuksekligiM ? parseFloat(e.yapiYuksekligiM) : null,
            yapi_sinifi: e.yapiSinifi || null,
            yapi_tipi: e.yapiTipi || null,
            muteahhit_arsa_ayni: e.muteahhitArsaAyni,
            taahhut_bedeli: e.taahhutBedeli ? parseFloat(e.taahhutBedeli.replace(/\./g, "")) : null,
            iskan_dosya_adi: iskanAdi,
            iskan_dosya_url: iskanUrl,
            admin_onaylanan_sinif: null,
          };
        })
      );
      await upsertExperiences(company.id, expPayloads);
    }

    /* 3. Diploma kaydet */
    if (hasDiploma && dipName && dipBolum && dipTarih) {
      await upsertDiploma(company.id, {
        partner_name: dipName,
        department: dipBolum,
        grad_date: dipTarih,
        partnership_years: dipYil ? parseInt(dipYil) : null,
      });
    } else {
      await upsertDiploma(company.id, null);
    }

    /* 4. Fatura oluştur */
    const fiyatlar: Record<string, number> = {
      bilgi_alma: 7000, sadece_hesaplama: 11000, hesaplama_basvuru: 20000, h_grubu: 12000
    };
    const tutar = fiyatlar[paket] || 0;
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

    await adminAddBilling(company.id, secilenPaket?.label || paket, tutar, dueDate);
  }

  function handleFinish() {
    if (user) {
      setAuthLoading(true);
      saveCompany(user.id)
        .then(() => navigate("/dashboard", { state: { defaultTab: "odeme" } }))
        .catch(e => { setErrors([e.message || "Kayıt sırasında hata oluştu"]); })
        .finally(() => setAuthLoading(false));
      return;
    }
    setAuthEmail(email);
    setShowAuth(true);
  }

  async function handleAuth() {
    if (!authEmail || !authPass || authPass.length < 6 || authPass !== authPass2) {
      setAuthErr("Bilgileri kontrol edin."); return;
    }
    setAuthErr(""); setAuthLoading(true);
    try {
      /* E-posta ile kayıt */
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPass,
        options: { data: { full_name: authName || authEmail.split("@")[0] } },
      });
      if (error || !data.user) { setAuthErr(error?.message || "Kayıt hatası"); setAuthLoading(false); return; }
      await saveCompany(data.user.id);
      setShowAuth(false);
      navigate("/dashboard", { state: { defaultTab: "odeme" } });
    } catch (e: any) {
      setAuthErr(e.message || "Hata oluştu");
    } finally {
      setAuthLoading(false);
    }
  }

  /* Exp helpers */
  const updExp = (id: string, f: keyof Exp, v: any) => setExps(p => p.map(x => x.id === id ? { ...x, [f]: v } : x));
  const toggleAcik = (id: string) => setExps(p => p.map(x => x.id === id ? { ...x, acik: !x.acik } : x));

  /* ─── RENDER ─── */
  const STEP_LABELS: { [k in Step]?: { label: string; sub: string } } = {
    firma:   { label: "Şirket bilgileri", sub: "Firma tipi, iletişim" },
    deneyim: { label: "İş deneyimi",      sub: "Yapım işleri, diploma" },
    evrak:   { label: "Evrak bilgisi",    sub: "Gerekli belgeler" },
    konum:   { label: "Konum & hizmet",   sub: "Paket seçimi" },
    ozet:    { label: "Özet",             sub: "Bilgileri gözden geçir" },
  };
  const stepIdx = STEPS.indexOf(step as any);
  const S = { fontFamily: "Inter,-apple-system,sans-serif" };
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [showMobileModal, setShowMobileModal] = useState(isMobile);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", maxWidth: "100vw", overflowX: "hidden", ...S }}>
      {/* Mobil uyarı popup */}
      {showMobileModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowMobileModal(false)}>
          <div style={{ background: "white", borderRadius: 16, maxWidth: 380, width: "100%", padding: "28px 24px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(201,149,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Info size={22} color="#C9952B" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0B1D3A", margin: "0 0 8px" }}>Bilgisayar Önerisi</h3>
            <p style={{ fontSize: 13, color: "#5A6478", lineHeight: 1.6, margin: "0 0 20px" }}>Formu bilgisayarınızdan doldurmanızı öneririz. Mobilde de devam edebilirsiniz.</p>
            <button onClick={() => setShowMobileModal(false)} style={{ width: "100%", padding: "11px 20px", borderRadius: 10, border: "none", background: "#0B1D3A", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Tamam, devam et
            </button>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div style={{ background: "#0B1D3A", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.55)", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} color="rgba(255,255,255,0.55)" /> Ana sayfa
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={18} color="#C9952B" />
          <span style={{ color: "white", fontSize: 14, fontWeight: 500 }}>muteahhitlikbelgesi<span style={{ color: "#C9952B" }}>.com</span></span>
        </div>
        <div style={{ width: 120 }} />
      </div>

      {/* İki kolon */}
      <div style={{ display: "flex", height: "calc(100vh - 52px)" }}>
        {/* Sidebar */}
        <div style={{ width: 260, background: "white", borderRight: "1px solid rgba(11,29,58,0.08)", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#5A6478", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14, padding: "0 8px" }}>Başvuru adımları</div>
          {STEPS.map((s, i) => {
            const done = i < stepIdx; const active = i === stepIdx;
            const { label, sub } = STEP_LABELS[s] || { label: s, sub: "" };
            return (
              <div key={s}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px", borderRadius: 10, background: active ? "rgba(201,149,43,0.08)" : "transparent" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0, background: done ? "#C9952B" : active ? "#0B1D3A" : "rgba(11,29,58,0.06)", color: done || active ? "white" : "#5A6478" }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: i > stepIdx ? "#5A6478" : "#0B1D3A" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#5A6478", marginTop: 1 }}>{sub}</div>
                  </div>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 1, height: 14, background: "rgba(11,29,58,0.08)", margin: "2px 0 2px 22px" }} />}
              </div>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "12px", background: "rgba(11,29,58,0.04)", borderRadius: 10, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#0B1D3A", marginBottom: 4 }}>Yardım mı lazım?</div>
            <div style={{ fontSize: 11, color: "#5A6478", lineHeight: 1.5 }}>Formu doldurmakta zorlanıyorsanız bizi arayın.</div>
          </div>
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* Kaydırılabilir içerik alanı */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <div style={{ padding: "36px 48px", maxWidth: 820 }}>

            {/* Hata banner */}
            {errors.length > 0 && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, color: "#B91C1C", fontWeight: 500, margin: "0 0 6px" }}>Lütfen aşağıdaki alanları doldurunuz</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>{errors.map((e, i) => <li key={i} style={{ fontSize: 12, color: "#B91C1C" }}>{e}</li>)}</ul>
                </div>
              </div>
            )}

            {/* ─── ADIM: FİRMA ─── */}
            {step === "firma" && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 500, color: "#0B1D3A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Şirket bilgileri</h2>
                <p style={{ fontSize: 13, color: "#5A6478", margin: "0 0 28px" }}>Firma bilgilerinizi eksiksiz doldurunuz.</p>

                {/* Şirket türü */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>Şirket türü<div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {(["sahis", "limited_as", "kooperatif"] as const).map(v => {
                      const lbls = { sahis: "Şahıs firması", limited_as: "Limited / A.Ş.", kooperatif: "Kooperatif" };
                      return (
                        <button key={v} onClick={() => setCompanyType(v)} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${companyType === v ? "#C9952B" : "rgba(11,29,58,0.1)"}`, background: companyType === v ? "rgba(201,149,43,0.08)" : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${companyType === v ? "#C9952B" : "rgba(11,29,58,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {companyType === v && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9952B" }} />}
                          </div>
                          <span style={{ fontSize: 13, color: "#0B1D3A" }}>{lbls[v]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Temel bilgiler */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>Temel bilgiler<div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>Şirket / firma adı *</label>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value.slice(0, 100))} placeholder="ABC İnşaat Taahhüt A.Ş." style={{ width: "100%", padding: "9px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>Vergi no *</label>
                      <input value={taxId} onChange={e => setTaxId(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="1234567890" style={{ width: "100%", padding: "9px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "3px 0 0" }}>Kayıtlı bilgilerinizle aynı olmalıdır.</p>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>Telefon *</label>
                      <input value={phone} onChange={e => { const d = e.target.value.replace(/\D/g, "").slice(0, 11); setPhone(fmtPhone(d.startsWith("0") ? d : "0" + d)); }} placeholder="0(5XX) XXX XX XX" style={{ width: "100%", padding: "9px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>E-posta *</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value.slice(0, 100))} placeholder="info@firma.com" style={{ width: "100%", padding: "9px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                </div>

                {/* Ortaklar — Ltd/AŞ */}
                {isLtd && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      Ortaklar
                      <div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} />
                      <button onClick={() => setPartners(p => [...p, mkPartner()])} style={{ fontSize: 12, color: "#C9952B", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
                        <Plus size={12} /> Ortak ekle
                      </button>
                    </div>
                    {partners.map((p, i) => (
                      <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 32px", gap: 10, marginBottom: 10, background: "rgba(240,237,232,0.4)", padding: "12px", borderRadius: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Ad Soyad *</label>
                          <input value={p.name} onChange={e => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, name: e.target.value.slice(0, 60) } : x))} placeholder="Ad Soyad" style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>TC Kimlik No *</label>
                          <input value={p.tc} onChange={e => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, tc: e.target.value.replace(/\D/g, "").slice(0, 11) } : x))} placeholder="12345678901" style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Hisse %</label>
                          <input value={p.hisse} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 3); if (Number(v) <= 100) setPartners(ps => ps.map(x => x.id === p.id ? { ...x, hisse: v } : x)); }} placeholder="51" style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <button onClick={() => { if (partners.length > 1) setPartners(ps => ps.filter(x => x.id !== p.id)); }} style={{ height: 36, alignSelf: "flex-end", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "#EF4444" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Başvuru bilgileri */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>Başvuru bilgileri<div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* KEP */}
                    <div>
                      <p style={{ fontSize: 13, color: "#5A6478", margin: "0 0 8px" }}>KEP adresiniz var mı? *</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[["yes", "Evet, var"], ["no", "Hayır, yok"]].map(([v, l]) => (
                          <button key={v} onClick={() => { setHasKep(v as any); if (v === "no") setKepAddress(""); }} style={{ padding: "11px 14px", borderRadius: 9, border: `1px solid ${hasKep === v ? "#C9952B" : "rgba(11,29,58,0.1)"}`, background: hasKep === v ? "rgba(201,149,43,0.08)" : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                            <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${hasKep === v ? "#C9952B" : "rgba(11,29,58,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{hasKep === v && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9952B" }} />}</div>
                            <span style={{ fontSize: 13, color: "#0B1D3A" }}>{l}</span>
                          </button>
                        ))}
                      </div>
                      {hasKep === "yes" && (
                        <div style={{ marginTop: 10 }}>
                          <label style={{ display: "block", fontSize: 12, color: "#5A6478", marginBottom: 4 }}>KEP adresi *</label>
                          <input value={kepAddress} onChange={e => setKepAddress(e.target.value.slice(0, 100))} placeholder="firma@hs01.kep.tr" style={{ width: "100%", padding: "8px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      )}
                    </div>

                    {/* İlk mi yenileme mi */}
                    {!isKoop && (
                      <div>
                        <p style={{ fontSize: 13, color: "#5A6478", margin: "0 0 8px" }}>Müteahhitlik belgesi daha önce alındı mı? *</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {[["renewal", "Yenileme / yükseltme"], ["first", "İlk kez alınacak"]].map(([v, l]) => (
                            <button key={v} onClick={() => setIsFirstTime(v as any)} style={{ padding: "11px 14px", borderRadius: 9, border: `1px solid ${isFirstTime === v ? "#C9952B" : "rgba(11,29,58,0.1)"}`, background: isFirstTime === v ? "rgba(201,149,43,0.08)" : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                              <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${isFirstTime === v ? "#C9952B" : "rgba(11,29,58,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{isFirstTime === v && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9952B" }} />}</div>
                              <span style={{ fontSize: 13, color: "#0B1D3A" }}>{l}</span>
                            </button>
                          ))}
                        </div>

                        {/* Mevcut belge bilgileri — yenileme ise */}
                        {isFirstTime === "renewal" && (
                          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(201,149,43,0.04)", border: "1px solid rgba(201,149,43,0.15)", borderRadius: 10, padding: 14 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Mevcut belge grubu *</label>
                              <select value={mevcutGrup} onChange={e => setMevcutGrup(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none" }}>
                                <option value="">Seçiniz</option>
                                {["A","B","B1","C","C1","D","D1","E","E1","F","F1","G","G1","H"].map(g => <option key={g} value={g}>Grup {g}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Mevcut yetki belgesi no *</label>
                              <input value={mevcutYetkiNo} onChange={e => setMevcutYetkiNo(e.target.value.replace(/[^0-9]/g, "").slice(0, 16))} placeholder="0034223287615047" style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── ADIM: DENEYİM ─── */}
            {step === "deneyim" && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 500, color: "#0B1D3A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>İş deneyimi & yeterlilik</h2>
                <p style={{ fontSize: 13, color: "#5A6478", margin: "0 0 20px" }}>Sahip olduğunuz yeterlilikleri seçin.</p>

                {/* İskan bilgi notu */}
                <div style={{ background: "rgba(201,149,43,0.07)", border: "1px solid rgba(201,149,43,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
                  <Info size={15} color="#C9952B" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#7A6030", margin: 0, lineHeight: 1.6 }}><strong>İskan belgelerinizi hazır bulundurun.</strong> Her yapım işi için iskan belgesi yüklemeniz gerekmektedir.</p>
                </div>

                {/* Başvuru türü */}
                {!isUpgrade && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>Başvuru türü<div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { k: "yapiIsi", checked: hasYapiIsi, set: () => { setHasYapiIsi(!hasYapiIsi); if (!hasYapiIsi) setHasNone(false); }, l: "Yapım işim var", s: "Tamamlanan inşaat projelerim var" },
                        { k: "diploma", checked: hasDiploma, set: () => { setHasDiploma(!hasDiploma); if (!hasDiploma) { setHasNone(false); if (companyType === "sahis") setDipName(companyName); } }, l: "Diploma başvurusu", s: "Ortağın/sahibin diplomasıyla başvuru" },
                        { k: "none", checked: hasNone, set: () => { const n = !hasNone; setHasNone(n); if (n) { setHasYapiIsi(false); setHasDiploma(false); handleHGrubuToggle(true); } else { handleHGrubuToggle(false); } }, l: "Belge / iş deneyimim yok", s: "H grubu yetki belgesi başvurusu yapacağım" },
                      ].map(({ k, checked, set, l, s }) => (
                        <button key={k} onClick={set} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${checked ? "#C9952B" : "rgba(11,29,58,0.1)"}`, background: checked ? "rgba(201,149,43,0.08)" : "white", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${checked ? "#C9952B" : "rgba(11,29,58,0.2)"}`, background: checked ? "#C9952B" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                            {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div><p style={{ fontSize: 13, color: "#0B1D3A", margin: "0 0 2px", fontWeight: 500 }}>{l}</p><p style={{ fontSize: 11, color: "#5A6478", margin: 0 }}>{s}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* İş girişleri — 3 bölümlü tasarım */}
                {(hasYapiIsi || isUpgrade) && (() => {
                  const katExps = exps.filter(e => e.isDeneyimiTipi !== "taahhut");
                  const taahhutExps = exps.filter(e => e.isDeneyimiTipi === "taahhut");

                  const isExpComplete = (e: typeof exps[0]) => {
                    if (e.isDeneyimiTipi === "taahhut") return !!(e.sozlesmeTarihi && e.taahhutBedeli && e.iskanFile);
                    return !!(e.sozlesmeTarihi && e.insaatAlaniM2 && e.yapiSinifi && e.iskanFile);
                  };
                  const canAddNew = (list: typeof exps) => list.length === 0 || list.every(isExpComplete);

                  const addKat = () => {
                    if (!canAddNew(katExps)) { alert("Lütfen mevcut kat karşılığı işini tamamlayın."); return; }
                    const n = mkExp(); n.isDeneyimiTipi = "kat_karsiligi"; setExps(p => [...p.map(x => ({ ...x, acik: false })), n]);
                  };
                  const addTaahhut = () => {
                    if (!canAddNew(taahhutExps)) { alert("Lütfen mevcut taahhüt işini tamamlayın."); return; }
                    const n = mkExp(); n.isDeneyimiTipi = "taahhut"; setExps(p => [...p.map(x => ({ ...x, acik: false })), n]);
                  };

                  const SectionHeader = ({ icon, color, title, count, onAdd }: { icon: string; color: string; title: string; count: number; onAdd: () => void }) => (
                    <div style={{ padding: "12px 16px", background: "#F8F7F4", borderBottom: "1px solid rgba(11,29,58,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{icon}</div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0B1D3A" }}>{title}</span>
                        {count > 0 && <span style={{ fontSize: 10, background: "rgba(201,149,43,0.1)", color: "#C9952B", padding: "2px 6px", borderRadius: 20, fontWeight: 700 }}>{count}</span>}
                      </div>
                      <button onClick={onAdd} style={{ fontSize: 12, color: "#C9952B", border: "1px solid rgba(201,149,43,0.2)", background: "none", padding: "4px 10px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <Plus size={12} /> Ekle
                      </button>
                    </div>
                  );

                  const ExpRow = ({ e, i }: { e: typeof exps[0]; i: number }) => {
                    const tarihHata = e.sozlesmeTarihi && e.iskanTarihi && new Date(e.sozlesmeTarihi) > new Date(e.iskanTarihi);
                    return (
                      <div key={e.id} style={{ border: `1px solid ${e.acik ? "#C9952B" : "rgba(11,29,58,0.09)"}`, borderRadius: 11, overflow: "hidden", background: "white" }}>
                        {/* Satır özeti */}
                        <div onClick={() => toggleAcik(e.id)} style={{ display: "flex", alignItems: "center", padding: "12px 14px", cursor: "pointer", background: e.acik ? "rgba(201,149,43,0.03)" : "white", gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: e.isDeneyimiTipi === "taahhut" ? "#C9952B" : "#0B1D3A", color: "white", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: "#0B1D3A" }}>{e.adaParsel || `${e.isDeneyimiTipi === "taahhut" ? "Taahhüt" : "Kat karşılığı"} ${i + 1}`}</span>
                              {e.yapiSinifi && e.isDeneyimiTipi === "kat_karsiligi" && <span style={{ fontSize: 10, background: "rgba(201,149,43,0.1)", color: "#C9952B", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{e.yapiSinifi}</span>}
                              {e.iskanFile && <span style={{ fontSize: 10, background: "#F0FDF4", color: "#15803d", padding: "1px 6px", borderRadius: 4 }}>İskan ✓</span>}
                            </div>
                            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#5A6478", marginTop: 3 }}>
                              {e.sozlesmeTarihi && <span>Sözleşme: {e.sozlesmeTarihi}</span>}
                              {e.iskanTarihi && <span>İskan: {e.iskanTarihi}</span>}
                              {e.insaatAlaniM2 && <span>{e.insaatAlaniM2} m²</span>}
                              {e.taahhutBedeli && <span>{e.taahhutBedeli} ₺</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            {e.acik ? <ChevronUp size={14} color="#5A6478" /> : <ChevronDown size={14} color="#5A6478" />}
                            {exps.length > 1 && <button onClick={ev => { ev.stopPropagation(); setExps(p => p.filter(x => x.id !== e.id)); }} style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", color: "#EF4444" }}><Trash2 size={13} /></button>}
                          </div>
                        </div>

                            {/* Açık form */}
                            {e.acik && (
                              <div style={{ padding: "18px 20px", borderTop: "1px solid rgba(11,29,58,0.07)", background: "#FAFAF9" }}>
                                {/* İş türü */}
                                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                  {[["kat_karsiligi", "Kat karşılığı"], ["taahhut", "Taahhüt / ihale"]].map(([v, l]) => (
                                    <button key={v} onClick={() => updExp(e.id, "isDeneyimiTipi", v)} style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${e.isDeneyimiTipi === v ? "#C9952B" : "rgba(11,29,58,0.1)"}`, background: e.isDeneyimiTipi === v ? "rgba(201,149,43,0.08)" : "white", cursor: "pointer", fontSize: 13, fontWeight: e.isDeneyimiTipi === v ? 500 : 400, color: "#0B1D3A" }}>{l}</button>
                                  ))}
                                </div>

                                {/* Temel bilgiler */}
                                <div style={{ fontSize: 10, fontWeight: 500, color: "#C9952B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>Temel bilgiler</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                                  <div><label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Ada / parsel</label><input value={e.adaParsel} onChange={ev => updExp(e.id, "adaParsel", ev.target.value.slice(0, 15))} placeholder="120/5" maxLength={15} style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                                  <div>
                                    <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Sözleşme tarihi *</label>
                                    <input type="date" value={e.sozlesmeTarihi} onChange={ev => { const v = sanitizeDate(ev.target.value); updExp(e.id, "sozlesmeTarihi", v); }} min="2010-01-01" max="2026-12-31" style={{ width: "100%", padding: "8px 10px", background: tarihHata ? "#FEF2F2" : "#F3F0EB", border: `1px solid ${tarihHata ? "#EF4444" : "transparent"}`, borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                                    {tarihHata && <p style={{ fontSize: 11, color: "#EF4444", margin: "3px 0 0" }}>Sözleşme tarihi iskan tarihinden büyük olamaz</p>}
                                  </div>
                                  <div><label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>İskan tarihi</label><input type="date" value={e.iskanTarihi} onChange={ev => updExp(e.id, "iskanTarihi", sanitizeDate(ev.target.value))} min="2010-01-01" max="2026-12-31" style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                                </div>

                                {/* Taahhüt bedeli */}
                                {e.isDeneyimiTipi === "taahhut" && (
                                  <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Sözleşme bedeli (₺) *</label>
                                    <input value={e.taahhutBedeli} onChange={ev => { const r = ev.target.value.replace(/\D/g, ""); updExp(e.id, "taahhutBedeli", r ? parseInt(r).toLocaleString("tr-TR") : ""); }} placeholder="1.000.000" style={{ width: 260, padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none" }} />
                                  </div>
                                )}

                                {/* Kat karşılığı — yapı bilgileri */}
                                {e.isDeneyimiTipi === "kat_karsiligi" && (
                                  <>
                                    <div style={{ fontSize: 10, fontWeight: 500, color: "#C9952B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10, paddingTop: 14, borderTop: "1px solid rgba(11,29,58,0.06)" }}>Yapı bilgileri</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                                      <div><label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>İnşaat alanı (m²) *</label><input value={e.insaatAlaniM2} onChange={ev => { const f = fmtNum(ev.target.value); if (ev.target.value.replace(/\D/g, "").length <= 9) updExp(e.id, "insaatAlaniM2", f); }} placeholder="5.000" style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                                      <div>
                                        <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Yapı yüksekliği (m)</label>
                                        <input value={e.yapiYuksekligiM} onChange={ev => { const v = ev.target.value.replace(/[^0-9.]/g, "").slice(0, 6); updExp(e.id, "yapiYuksekligiM", v); }} placeholder="21.50" style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                                      </div>
                                      <div>
                                        <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Yapı sınıfı *</label>
                                        <select value={e.yapiSinifi} onChange={ev => updExp(e.id, "yapiSinifi", ev.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                                          <option value="">Seçiniz</option>
                                          {TUM_SINIFLAR.map(s => <option key={s} value={s}>{s} Sınıfı</option>)}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Kullanım amacı */}
                                    <div style={{ fontSize: 10, fontWeight: 500, color: "#C9952B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10, paddingTop: 14, borderTop: "1px solid rgba(11,29,58,0.06)" }}>Yapı kullanım amacı</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                                      {[{ v: "konut", l: "Konut", ico: "🏠" }, { v: "konut_ticari", l: "Konut + Ticari", ico: "🏢" }, { v: "ticari", l: "Ticari / Ofis", ico: "🏗" }, { v: "diger", l: "Diğer", ico: "📋" }].map(({ v, l, ico }) => (
                                        <button key={v} onClick={() => updExp(e.id, "yapiTipi", v)} style={{ padding: "10px 8px", borderRadius: 8, border: `1px solid ${e.yapiTipi === v ? "#C9952B" : "rgba(11,29,58,0.1)"}`, background: e.yapiTipi === v ? "rgba(201,149,43,0.08)" : "white", cursor: "pointer", textAlign: "center", fontSize: 12, color: "#0B1D3A", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                          <span style={{ fontSize: 17, lineHeight: 1 }}>{ico}</span>
                                          <span style={{ fontWeight: e.yapiTipi === v ? 500 : 400 }}>{l}</span>
                                        </button>
                                      ))}
                                    </div>

                                    {/* Müteahhit/arsa sahibi */}
                                    <div onClick={() => updExp(e.id, "muteahhitArsaAyni", !e.muteahhitArsaAyni)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 13px", background: "#F3F0EB", borderRadius: 8, cursor: "pointer", marginBottom: 16 }}>
                                      <div style={{ width: 32, height: 18, borderRadius: 9, background: e.muteahhitArsaAyni ? "#C9952B" : "#E8E4DC", flexShrink: 0, position: "relative" }}>
                                        <div style={{ width: 14, height: 14, borderRadius: 7, background: "white", position: "absolute", top: 2, left: e.muteahhitArsaAyni ? 16 : 2, transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
                                      </div>
                                      <span style={{ fontSize: 12, color: "#5A6478", userSelect: "none" }}>Müteahhit ve arsa sahibi aynı kişi / firma</span>
                                    </div>
                                  </>
                                )}

                                {/* İskan belgesi — her iki tip için */}
                                <div style={{ fontSize: 10, fontWeight: 500, color: "#C9952B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10, paddingTop: 14, borderTop: "1px solid rgba(11,29,58,0.06)" }}>
                                  İskan belgesi <span style={{ fontSize: 10, background: "#EF4444", color: "white", padding: "1px 7px", borderRadius: 4, fontWeight: 400, textTransform: "none", letterSpacing: 0, verticalAlign: "middle", marginLeft: 6 }}>Zorunlu</span>
                                </div>
                                {e.iskanFile ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px" }}>
                                    <FileText size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: "#15803d", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.iskanFile.name}</span>
                                    <button onClick={() => updExp(e.id, "iskanFile", null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#16a34a", display: "flex" }}><X size={14} /></button>
                                  </div>
                                ) : (
                                  <label style={{ display: "flex", alignItems: "center", gap: 12, border: "1.5px dashed rgba(11,29,58,0.14)", borderRadius: 9, padding: "13px 16px", cursor: "pointer", background: "white" }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F0EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Upload size={14} color="#5A6478" />
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13, color: "#5A6478", fontWeight: 500 }}>Taranmış belgeyi yükleyin</div>
                                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>PDF, JPG veya PNG · Okunaklı, tüm sayfa görünür olmalı</div>
                                    </div>
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={ev => { const f = ev.target.files?.[0]; if (f) updExp(e.id, "iskanFile", f); }} />
                                  </label>
                                )}

                                <button onClick={() => toggleAcik(e.id)} style={{ marginTop: 16, background: "#0B1D3A", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                  <CheckCircle size={13} /> Kaydet
                                </button>
                              </div>
                            )}
                          </div>
                        );
                  };

                  return (
                    <div style={{ marginBottom: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* Kat Karşılığı İşleri */}
                      <div style={{ border: "1px solid rgba(11,29,58,0.09)", borderRadius: 14, overflow: "hidden" }}>
                        <SectionHeader icon="🏗" color="#0B1D3A" title="Kat Karşılığı İşleri" count={katExps.length} onAdd={addKat} />
                        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                          {katExps.length > 0 ? katExps.map((e, i) => ExpRow({ e, i })) : (
                            <p style={{ fontSize: 12, color: "#5A6478", textAlign: "center", padding: "16px 0" }}>Henüz kat karşılığı iş eklenmemiş.</p>
                          )}
                        </div>
                      </div>

                      {/* Taahhüt İşleri */}
                      <div style={{ border: "1px solid rgba(11,29,58,0.09)", borderRadius: 14, overflow: "hidden" }}>
                        <SectionHeader icon="📄" color="#C9952B" title="Taahhüt İşleri" count={taahhutExps.length} onAdd={addTaahhut} />
                        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                          {taahhutExps.length > 0 ? taahhutExps.map((e, i) => ExpRow({ e, i })) : (
                            <p style={{ fontSize: 12, color: "#5A6478", textAlign: "center", padding: "16px 0" }}>Henüz taahhüt işi eklenmemiş.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Diploma */}
                {hasDiploma && !isUpgrade && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>Diploma bilgileri<div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "white", border: "1px solid rgba(11,29,58,0.09)", borderRadius: 10, padding: 16 }}>
                      {companyType !== "sahis" && (
                        <div style={{ gridColumn: "1/-1" }}>
                          <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>Diploma sahibi ortağın adı *</label>
                          {isLtd && partners.length > 0 ? (
                            <select value={dipName} onChange={e => { setDipName(e.target.value); const p = partners.find(x => x.name === e.target.value); if (p) setDipYil(p.hisse ? "" : ""); }} style={{ width: "100%", padding: "8px 11px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none" }}>
                              <option value="">Seçiniz</option>
                              {partners.filter(p => p.name.trim()).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                          ) : (
                            <input value={dipName} onChange={e => setDipName(e.target.value.slice(0, 60))} placeholder="Ad Soyad" style={{ width: "100%", padding: "8px 11px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          )}
                        </div>
                      )}
                      {companyType === "sahis" && (
                        <div style={{ gridColumn: "1/-1" }}>
                          <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>Diploma sahibi</label>
                          <div style={{ padding: "8px 11px", background: "#F3F0EB", borderRadius: 7, fontSize: 13, color: "#0B1D3A" }}>{companyName || "—"}</div>
                        </div>
                      )}
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>Bölüm *</label>
                        <select value={dipBolum} onChange={e => setDipBolum(e.target.value as any)} style={{ width: "100%", padding: "8px 11px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none" }}>
                          <option value="">Seçiniz</option><option value="insaat_muhendisligi">İnşaat Mühendisliği</option><option value="mimarlik">Mimarlık</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>Mezuniyet tarihi *</label>
                        <input type="date" value={dipTarih} onChange={e => setDipTarih(sanitizeDate(e.target.value))} min="1970-01-01" max="2026-12-31" style={{ width: "100%", padding: "8px 11px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      {isLtd && (
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 5 }}>Ortaklık süresi (yıl)</label>
                          <input value={dipYil} onChange={e => setDipYil(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="5" style={{ width: 100, padding: "8px 11px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 7, fontSize: 13, outline: "none" }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── ADIM: EVRAK (H Grubu) ─── */}
            {step === "evrak" && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 500, color: "#0B1D3A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Gerekli evraklar</h2>
                <p style={{ fontSize: 13, color: "#5A6478", margin: "0 0 20px" }}>H grubu başvurusu için hazırlamanız gereken belgeler.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { baslik: "Mükellefiyet belgesi", aciklama: "Dijital vergi dairesinden alınır." },
                    { baslik: isLtd ? "İmza sirküleri" : "İmza beyannamesi", aciklama: "Noterde onaylı, güncel tarihli." },
                  ].map(({ baslik, aciklama }) => (
                    <div key={baslik} style={{ background: "white", border: "1px solid rgba(11,29,58,0.09)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(201,149,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileText size={15} color="#C9952B" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#0B1D3A", margin: "0 0 2px" }}>{baslik}</p>
                        <p style={{ fontSize: 12, color: "#5A6478", margin: 0 }}>{aciklama}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, background: "rgba(201,149,43,0.06)", border: "1px solid rgba(201,149,43,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10 }}>
                  <Info size={14} color="#C9952B" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#7A6030", margin: 0 }}>Bu belgeleri sonraki adımda sistem üzerinden yükleyebilirsiniz. Şimdi hazırlamaya başlayabilirsiniz.</p>
                </div>
              </div>
            )}

            {/* ─── ADIM: KONUM ─── */}
            {step === "konum" && (() => {
              const istPaketler = isHGrubu
                ? (location === "istanbul"
                  ? [{ key: "h_grubu", label: "H Grubu Başvuru", fiyat: "12.000 ₺", aciklama: "H grubu yetki belgesi başvurusu", tags: ["Başvuru"], popular: false }]
                  : [{ key: "bilgi_alma", label: "Bilgi Alma Danışmanlığı", fiyat: "7.000 ₺", aciklama: "Süreç hakkında bilgi alın, ne yapmanız gerektiğini öğrenin", tags: ["Danışmanlık"], popular: false }])
                : [
                  { key: "bilgi_alma", label: "Bilgi Alma Danışmanlığı", fiyat: "7.000 ₺", aciklama: "Süreç hakkında bilgi alın, ne yapmanız gerektiğini öğrenin", tags: ["Danışmanlık"], popular: false },
                  { key: "sadece_hesaplama", label: "İş Deneyim Hesaplama", fiyat: "11.000 ₺", aciklama: "İş deneyiminiz hesaplanır, size rapor gönderilir", tags: ["Hesaplama"], popular: false },
                  { key: "hesaplama_basvuru", label: "Tam Hizmet — Hesaplama & Başvuru", fiyat: "20.000 ₺", aciklama: "Hesaplama + bakanlığa başvuru, süreci biz yönetiriz", tags: ["Hesaplama", "Başvuru"], popular: true },
                ];

              /* bilgi_alma sadece istanbul_disi veya hasNone'da gösterilir */
              const filtreliPaketler = istPaketler.filter(pk => {
                if (pk.key === "bilgi_alma" && location === "istanbul" && !hasNone) return false;
                return true;
              });

              return (
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 500, color: "#0B1D3A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Konum & hizmet seçimi</h2>
                  <p style={{ fontSize: 13, color: "#5A6478", margin: "0 0 24px" }}>Şirket faaliyet adresinize göre paket seçin.</p>
                  <div style={{ background: "rgba(201,149,43,0.07)", border: "1px solid rgba(201,149,43,0.18)", borderRadius: 10, padding: "10px 14px", marginBottom: 22, display: "flex", gap: 8 }}>
                    <Info size={14} color="#C9952B" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: "#7A6030", margin: 0 }}>Tüm ücretlere KDV dahildir.</p>
                  </div>

                  {/* Konum seçimi */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>Şirket faaliyet adresi<div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <button onClick={() => { setLocation("istanbul"); if (isHGrubu) setPaket("h_grubu"); else setPaket(""); }} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${location === "istanbul" ? "#C9952B" : "rgba(11,29,58,0.1)"}`, background: location === "istanbul" ? "rgba(201,149,43,0.08)" : "white", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Building2 size={15} color={location === "istanbul" ? "#C9952B" : "#5A6478"} /><div><p style={{ fontSize: 13, color: "#0B1D3A", margin: "0 0 1px", fontWeight: 500 }}>İstanbul</p><p style={{ fontSize: 11, color: "#5A6478", margin: 0 }}>Yüz yüze hizmet dahil</p></div></div>
                      </button>
                      <button onClick={() => { setLocation("istanbul_disi"); if (isHGrubu) setPaket("bilgi_alma"); else setPaket("sadece_hesaplama"); }} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${location === "istanbul_disi" ? "#C9952B" : "rgba(11,29,58,0.1)"}`, background: location === "istanbul_disi" ? "rgba(201,149,43,0.08)" : "white", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Building2 size={15} color="#5A6478" /><div><p style={{ fontSize: 13, color: "#0B1D3A", margin: "0 0 1px", fontWeight: 500 }}>İstanbul Dışı</p><p style={{ fontSize: 11, color: "#5A6478", margin: 0 }}>Uzaktan hizmet</p></div></div>
                      </button>
                    </div>
                    {location === "istanbul_disi" && (
                      <div style={{ marginTop: 10 }}>
                        <label style={{ display: "block", fontSize: 12, color: "#5A6478", marginBottom: 4 }}>İl *</label>
                        <input value={city} onChange={e => setCity(e.target.value.slice(0, 40))} placeholder="Ankara" style={{ width: 200, padding: "8px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                    )}
                  </div>

                  {/* Paket seçimi */}
                  {location && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>Hizmet paketi<div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} /></div>

                      {/* İstanbul dışı — sadece hesaplama */}
                      {location === "istanbul_disi" && !isHGrubu && (
                        <div style={{ padding: "16px 18px", borderRadius: 12, border: "2px solid #C9952B", background: "rgba(201,149,43,0.06)", cursor: "pointer" }} onClick={() => setPaket("sadece_hesaplama")}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 14, color: "#0B1D3A", fontWeight: 500 }}>İş Deneyim Hesaplama</span>
                            <span style={{ fontSize: 15, color: "#C9952B", fontWeight: 700 }}>11.000 ₺</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#5A6478", margin: "0 0 6px" }}>İş deneyiminiz hesaplanır, size rapor gönderilir</p>
                        </div>
                      )}

                      {/* İstanbul paketleri */}
                      {(location === "istanbul" || isHGrubu) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {filtreliPaketler.map(pk => (
                            <button key={pk.key} onClick={() => { setPaket(pk.key); }} style={{ padding: "16px 18px", borderRadius: 12, border: `${paket === pk.key ? "2px solid #C9952B" : "1px solid rgba(11,29,58,0.1)"}`, background: paket === pk.key ? "rgba(201,149,43,0.06)" : "white", cursor: "pointer", textAlign: "left", position: "relative" }}>
                              {pk.popular && <span style={{ position: "absolute", top: -10, left: 14, background: "#C9952B", color: "#0B1D3A", fontSize: 11, fontWeight: 500, padding: "2px 10px", borderRadius: 20 }}>Popüler</span>}
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{ width: 17, height: 17, borderRadius: "50%", border: `2px solid ${paket === pk.key ? "#C9952B" : "rgba(11,29,58,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                                  {paket === pk.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C9952B" }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                                    <span style={{ fontSize: 14, color: "#0B1D3A", fontWeight: 500 }}>{pk.label}</span>
                                    <span style={{ fontSize: 15, color: "#C9952B", fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>{pk.fiyat}</span>
                                  </div>
                                  <p style={{ fontSize: 12, color: "#5A6478", margin: "0 0 6px" }}>{pk.aciklama}</p>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{pk.tags.map(t => <span key={t} style={{ fontSize: 11, background: "#F0FDF4", color: "#15803d", padding: "2px 8px", borderRadius: 20 }}>{t}</span>)}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })()}

            {/* ─── ADIM: ÖZET ─── */}
            {step === "ozet" && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 500, color: "#0B1D3A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Başvuru özeti</h2>
                <p style={{ fontSize: 13, color: "#5A6478", margin: "0 0 24px" }}>Bilgilerinizi gözden geçirin. Düzeltmek istediğiniz varsa düzenleyebilirsiniz.</p>

                {/* Şirket bilgileri */}
                <div style={{ background: "white", border: "1px solid rgba(11,29,58,0.09)", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F8F7F4", borderBottom: "1px solid rgba(11,29,58,0.07)" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#0B1D3A" }}>Şirket bilgileri</span>
                    <button onClick={() => { setErrors([]); setStep("firma"); }} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#C9952B", background: "none", border: "1px solid rgba(201,149,43,0.3)", padding: "3px 10px", borderRadius: 6, cursor: "pointer" }}>
                      <Edit2 size={11} /> Düzenle
                    </button>
                  </div>
                  <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                    {[[companyName, "Firma"], [taxId, "Vergi No"], [phone, "Telefon"], [email, "E-posta"], [{ sahis: "Şahıs", limited_as: "Ltd/A.Ş.", kooperatif: "Kooperatif" }[companyType] || companyType, "Tür"]].map(([v, l]) => (
                      <div key={l as string}><span style={{ fontSize: 11, color: "#9CA3AF" }}>{l as string}</span><p style={{ fontSize: 13, color: "#0B1D3A", margin: "1px 0 0" }}>{v as string}</p></div>
                    ))}
                  </div>
                </div>

                {/* İş deneyimleri */}
                {hasYapiIsi && exps.length > 0 && (
                  <div style={{ background: "white", border: "1px solid rgba(11,29,58,0.09)", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F8F7F4", borderBottom: "1px solid rgba(11,29,58,0.07)" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#0B1D3A" }}>İş deneyimleri ({exps.length})</span>
                      <button onClick={() => { setErrors([]); setStep("deneyim"); }} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#C9952B", background: "none", border: "1px solid rgba(201,149,43,0.3)", padding: "3px 10px", borderRadius: 6, cursor: "pointer" }}>
                        <Edit2 size={11} /> Düzenle
                      </button>
                    </div>
                    {exps.map((e, i) => (
                      <div key={e.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(11,29,58,0.05)", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                        <div><span style={{ fontSize: 10, color: "#9CA3AF" }}>İş {i + 1}</span><p style={{ fontSize: 12, color: "#0B1D3A", margin: "1px 0 0", fontWeight: 500 }}>{e.isDeneyimiTipi === "kat_karsiligi" ? "Kat Karş." : "Taahhüt"}</p></div>
                        <div><span style={{ fontSize: 10, color: "#9CA3AF" }}>Sözleşme</span><p style={{ fontSize: 12, color: "#0B1D3A", margin: "1px 0 0" }}>{e.sozlesmeTarihi || "—"}</p></div>
                        <div><span style={{ fontSize: 10, color: "#9CA3AF" }}>Alan</span><p style={{ fontSize: 12, color: "#0B1D3A", margin: "1px 0 0" }}>{e.insaatAlaniM2 ? `${e.insaatAlaniM2} m²` : "—"}</p></div>
                        <div><span style={{ fontSize: 10, color: "#9CA3AF" }}>Sınıf</span><p style={{ fontSize: 12, color: "#0B1D3A", margin: "1px 0 0" }}>{e.yapiSinifi || "—"}</p></div>
                        <div><span style={{ fontSize: 10, color: "#9CA3AF" }}>İskan</span>
                          {e.iskanFile
                            ? <p style={{ fontSize: 12, color: "#16a34a", margin: "1px 0 0", display: "flex", alignItems: "center", gap: 3 }}><CheckCircle size={11} /> Yüklendi</p>
                            : <p style={{ fontSize: 12, color: "#F59E0B", margin: "1px 0 0", display: "flex", alignItems: "center", gap: 3 }}>⚠ Eksik</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Diploma */}
                {hasDiploma && (
                  <div style={{ background: "white", border: "1px solid rgba(11,29,58,0.09)", borderRadius: 12, marginBottom: 16, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#0B1D3A" }}>Diploma</span>
                      <button onClick={() => { setErrors([]); setStep("deneyim"); }} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#C9952B", background: "none", border: "1px solid rgba(201,149,43,0.3)", padding: "3px 10px", borderRadius: 6, cursor: "pointer" }}><Edit2 size={11} /> Düzenle</button>
                    </div>
                    <p style={{ fontSize: 13, color: "#0B1D3A", margin: 0 }}>{dipName} — {dipBolum === "insaat_muhendisligi" ? "İnşaat Mühendisliği" : "Mimarlık"} · {dipTarih}</p>
                  </div>
                )}

                {/* Paket özeti */}
                <div style={{ background: "#0B1D3A", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 3px" }}>Seçilen paket</p><p style={{ color: "white", fontSize: 14, fontWeight: 500, margin: 0 }}>{PAKETLER[paket as keyof typeof PAKETLER]?.label || paket}</p></div>
                    <div style={{ textAlign: "right" }}><p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 3px" }}>Toplam</p><p style={{ color: "#C9952B", fontSize: 18, fontWeight: 700, margin: 0 }}>{PAKETLER[paket as keyof typeof PAKETLER]?.fiyat || "—"}</p></div>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "8px 0 0" }}>KDV dahildir</p>
                </div>

                {/* Hesap oluşturma — wizard akışının devamı */}
                {showAuth && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#C9952B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>Hesap bilgileri<div style={{ flex: 1, height: 1, background: "rgba(201,149,43,0.2)" }} /></div>
                    <p style={{ fontSize: 12, color: "#5A6478", margin: "0 0 14px" }}>Başvurunuzu takip edebilmeniz için bir hesap oluşturun.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>E-posta *</label>
                        <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="ornek@email.com"
                          style={{ width: "100%", padding: "9px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Şifre *</label>
                        <input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder="En az 6 karakter"
                          style={{ width: "100%", padding: "9px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "#5A6478", marginBottom: 4 }}>Şifre tekrar *</label>
                        <input type="password" value={authPass2} onChange={e => setAuthPass2(e.target.value)} placeholder="Şifreyi tekrar girin"
                          style={{ width: "100%", padding: "9px 12px", background: "#F3F0EB", border: "1px solid transparent", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    {authErr && (
                      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#B91C1C", marginTop: 10 }}>{authErr}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          </div>{/* ← kaydırılabilir içerik sonu */}

          {/* Footer — her zaman altta sabit */}
          <div style={{ borderTop: "1px solid rgba(11,29,58,0.08)", padding: "14px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ height: 6, borderRadius: 3, background: i < stepIdx ? "#C9952B" : i === stepIdx ? "#0B1D3A" : "rgba(11,29,58,0.15)", width: i === stepIdx ? 20 : 6, transition: "all 0.2s" }} />
              ))}
              <span style={{ fontSize: 11, color: "#5A6478", marginLeft: 6 }}>Adım {stepIdx + 1}/{STEPS.length}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {stepIdx > 0 && <button onClick={handleBack} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(11,29,58,0.15)", background: "white", color: "#0B1D3A", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><ArrowLeft size={13} /> Geri</button>}
              <button onClick={step === "ozet" && showAuth ? handleAuth : handleNext} disabled={step === "ozet" && showAuth && (!authEmail || !authPass || !authPass2 || authLoading)} style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: step === "ozet" && showAuth ? "#C9952B" : "#0B1D3A", color: step === "ozet" && showAuth ? "#0B1D3A" : "white", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: step === "ozet" && showAuth && (!authEmail || !authPass || !authPass2) ? 0.5 : 1 }}>
                {step === "ozet" ? (showAuth ? (authLoading ? "Oluşturuluyor..." : "Kaydol & Devam Et") : "Başvuruyu Tamamla") : "Devam et"} <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Referans şeridi — her zaman altta sabit */}
          <div style={{ flexShrink: 0 }}>
            <ReferansSeridi />
          </div>
        </div>
      </div>

      {/* Auth Inline — showAuth true olduğunda özet içeriğinin yerine göster */}
    </div>
  );
}
