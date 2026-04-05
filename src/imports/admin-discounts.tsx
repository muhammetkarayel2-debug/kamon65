import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import {
  ArrowLeft, ArrowRight, Info, CheckCircle, AlertTriangle, Award,
  Plus, Trash2, MapPin, GraduationCap, Building2, HardHat, XCircle,
  Upload, FileText, X, Mail, User as UserIcon, Loader2,
  CreditCard, Shield, Lock, Edit2, Save
} from "lucide-react";
import { useAuth } from "./auth-context";

/* ─── Types ─── */
interface ExperienceEntry {
  id: string;
  isDeneyimiTipi: "kat_karsiligi" | "taahhut";
  contractDate: string;
  occupancyDate: string;
  totalArea: string;
  buildingHeight: string;
  buildingClass: string;
  adaParsel: string;
  sozlesmeBedeli: string;
  iskanFile?: File | null;
}
interface Partner {
  id: string;
  name: string;
  sharePercent: string;
  tcKimlikNo: string;
}

function createExperienceEntry(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    isDeneyimiTipi: "kat_karsiligi",
    contractDate: "", occupancyDate: "", totalArea: "",
    buildingHeight: "", buildingClass: "", adaParsel: "",
    sozlesmeBedeli: "",
  };
}
function createPartner(): Partner {
  return { id: crypto.randomUUID(), name: "", sharePercent: "", tcKimlikNo: "" };
}

/* ─── Helpers ─── */
function formatNumeric(value: string): string {
  const raw = value.replace(/\D/g, "");
  if (raw === "") return "";
  return new Intl.NumberFormat("tr-TR").format(Number(raw));
}
function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "");
  if (d.length === 0) return "";
  if (d.length <= 1) return "0";
  if (d.length <= 4) return `0(${d.slice(1)}`;
  if (d.length <= 7) return `0(${d.slice(1, 4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `0(${d.slice(1, 4)}) ${d.slice(4, 7)} ${d.slice(7)}`;
  return `0(${d.slice(1, 4)}) ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
}
function isPhoneComplete(v: string) { return v.replace(/\D/g, "").length === 11; }
function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

const inputClass = "w-full px-3 py-2.5 rounded-lg bg-[#F0EDE8] border border-[#0B1D3A]/8 focus:border-[#C9952B] focus:ring-1 focus:ring-[#C9952B] outline-none transition-colors text-sm";
const inputErrorClass = "w-full px-3 py-2.5 rounded-lg bg-red-50 border border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-colors text-sm";

/* ─── Reusable UI ─── */
function RadioCard({ selected, hasError, onClick, children }: { selected: boolean; hasError: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`p-4 rounded-xl border text-left text-sm transition-all w-full ${selected ? "border-[#C9952B] bg-[#C9952B]/10" : hasError ? "border-red-300 bg-red-50" : "border-[#0B1D3A]/10 hover:border-[#C9952B]/50"}`}>
      <div className="flex items-start gap-2">
        <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "border-[#C9952B]" : "border-[#0B1D3A]/20"}`}>
          {selected && <div className="w-2 h-2 rounded-full bg-[#C9952B]" />}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </button>
  );
}

function CheckCard({ checked, hasError, onClick, children }: { checked: boolean; hasError?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`p-4 rounded-xl border text-left text-sm transition-all w-full ${checked ? "border-[#C9952B] bg-[#C9952B]/10" : hasError ? "border-red-300 bg-red-50" : "border-[#0B1D3A]/10 hover:border-[#C9952B]/50"}`}>
      <div className="flex items-start gap-2">
        <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${checked ? "border-[#C9952B] bg-[#C9952B]" : "border-[#0B1D3A]/20"}`}>
          {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </button>
  );
}

function SectionHeader({ num, title, required = true }: { num: number; title: string; required?: boolean }) {
  return (
    <h3 className="text-sm text-[#C9952B] mb-4 flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-[#C9952B]/10 flex items-center justify-center text-xs">{num}</span>
      {title} {required && <span className="text-red-400">*</span>}
    </h3>
  );
}

/* ─── Mali Yeterlilik Grubu ─── */
const FINANSAL_GEREKLI = ["F","F1","E","E1","D","D1","C","C1","B","B1","A"];

function MaliYeterlilikFormu({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    yil: new Date().getFullYear() - 1 + "",
    donenVarlik: "", kvBorc: "", ozkaynak: "", toplamAktif: "",
    kvBankaBorc: "", yyMaliyet: "0", yyHakedis: "0",
  });
  const [saved, setSaved] = useState(false);

  const fmt = (v: string) => {
    const raw = v.replace(/\D/g, "");
    return raw ? parseInt(raw).toLocaleString("tr-TR") : "";
  };
  const parse = (v: string) => parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;

  const cariOran = useMemo(() => {
    const dv = parse(form.donenVarlik), kv = parse(form.kvBorc);
    const yyM = parse(form.yyMaliyet), yyH = parse(form.yyHakedis);
    const pay = kv - yyH;
    return pay > 0 ? (dv - yyM) / pay : null;
  }, [form]);

  const ozOran = useMemo(() => {
    const oz = parse(form.ozkaynak), ta = parse(form.toplamAktif), yyM = parse(form.yyMaliyet);
    const pay = ta - yyM;
    return pay > 0 ? oz / pay : null;
  }, [form]);

  const borcOran = useMemo(() => {
    const kb = parse(form.kvBankaBorc), oz = parse(form.ozkaynak);
    return oz > 0 ? kb / oz : null;
  }, [form]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onSave(); }, 800);
  };

  const OranSatiri = ({ label, val, esik, buyukIyi }: { label: string; val: number | null; esik: number; buyukIyi: boolean }) => {
    if (val === null) return (
      <div className="flex justify-between py-2 border-b border-[#F0EDE8] text-sm text-[#5A6478]">
        <span>{label} <span className="text-xs">({buyukIyi ? `≥${esik}` : `≤${esik}`})</span></span>
        <span>—</span>
      </div>
    );
    const gecti = buyukIyi ? val >= esik : val <= esik;
    return (
      <div className="flex justify-between items-center py-2 border-b border-[#F0EDE8] last:border-0">
        <span className="text-sm text-[#0B1D3A]">{label} <span className="text-xs text-[#5A6478]">({buyukIyi ? `≥${esik}` : `≤${esik}`})</span></span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${gecti ? "text-green-600" : "text-red-500"}`}>{val.toFixed(3)}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${gecti ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{gecti ? "✓" : "✗"}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#0B1D3A]/8 p-6 sm:p-8 mt-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#C9952B]/10 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-[#C9952B]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#0B1D3A]">Mali Yeterlilik Bilgileri</h3>
          <p className="text-xs text-[#5A6478] mt-0.5">Seçtiğiniz grup için bilanço bilgilerinizi giriniz (KDV hariç, TL)</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        {[
          { label: "Dönen varlıklar", field: "donenVarlik" },
          { label: "Kısa vadeli borçlar", field: "kvBorc" },
          { label: "Özkaynaklar", field: "ozkaynak" },
          { label: "Toplam aktif", field: "toplamAktif" },
          { label: "KV banka borçları", field: "kvBankaBorc" },
          { label: "YY inşaat maliyetleri (yoksa 0)", field: "yyMaliyet" },
          { label: "YY hakediş gelirleri (yoksa 0)", field: "yyHakedis" },
        ].map(({ label, field }) => (
          <div key={field}>
            <label className="block text-xs text-[#5A6478] mb-1">{label}</label>
            <input
              value={(form as any)[field]}
              onChange={e => setForm(p => ({ ...p, [field]: fmt(e.target.value) }))}
              placeholder="0"
              className={`${inputClass} text-right`}
            />
          </div>
        ))}
      </div>

      <div className="bg-[#F8F7F4] rounded-xl p-4 mb-4">
        <p className="text-xs font-medium text-[#5A6478] mb-3">Otomatik hesaplanan oranlar</p>
        <OranSatiri label="Cari oran"           val={cariOran} esik={0.75} buyukIyi={true}  />
        <OranSatiri label="Özkaynak oranı"      val={ozOran}   esik={0.15} buyukIyi={true}  />
        <OranSatiri label="KV banka borç oranı" val={borcOran} esik={0.75} buyukIyi={false} />
      </div>

      <button onClick={handleSave}
        className="w-full bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
        {saved ? <><CheckCircle className="w-4 h-4" /> Kaydedildi</> : <><Save className="w-4 h-4" /> Kaydet ve devam et</>}
      </button>
    </div>
  );
}

/* ─── Ödeme Formu (inline) ─── */
function OdemeFormu({ fiyat, onSuccess }: { fiyat: string; onSuccess: () => void }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const raw = v.replace(/\D/g, "").slice(0, 4);
    return raw.length >= 3 ? raw.slice(0, 2) + "/" + raw.slice(2) : raw;
  };

  const handlePay = () => {
    if (!cardNumber || !expiry || !cvv || !name) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[#0B1D3A] to-[#122A54] rounded-xl p-5 text-white">
        <p className="text-xs text-white/50 mb-1">Ödenecek tutar</p>
        <p className="text-2xl font-bold text-[#C9952B]">{fiyat}</p>
        <p className="text-xs text-white/40 mt-1">KDV dahil</p>
      </div>

      <div>
        <label className="block text-xs text-[#5A6478] mb-1">Kart Üzerindeki İsim</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad" className={inputClass} />
      </div>
      <div>
        <label className="block text-xs text-[#5A6478] mb-1">Kart Numarası</label>
        <div className="relative">
          <input value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))} placeholder="0000 0000 0000 0000" className={`${inputClass} pr-10`} />
          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#5A6478] mb-1">Son Kullanma</label>
          <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="AA/YY" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-[#5A6478] mb-1">CVV</label>
          <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="000" className={inputClass} />
        </div>
      </div>

      <button onClick={handlePay} disabled={loading || !cardNumber || !expiry || !cvv || !name}
        className="w-full bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-200 disabled:text-gray-400 text-[#0B1D3A] font-medium py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        {loading ? "Ödeme işleniyor..." : "Ödemeyi Tamamla"}
      </button>
      <p className="text-xs text-[#5A6478] text-center flex items-center justify-center gap-1">
        <Shield className="w-3 h-3 text-green-500" /> İyzico/Param güvenli ödeme altyapısı
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
const WIZARD_STORAGE_KEY = "wizard_form_state";
const MOCK_COMPANIES_KEY = "mock_panel_companies";
const MOCK_BILLING_KEY   = "mock_panel_billing";

function loadLS<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r) as T; } catch {}
  return fallback;
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function WizardPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const isHGroup = searchParams.get("group") === "H";
  const returnToKonum = (routerLocation.state as any)?.returnToKonum === true;
  const startFromStep2 = (routerLocation.state as any)?.startFromStep2 === true;
  const { user, signIn, signUp, loading: authLoading } = useAuth();

  const [step, setStep] = useState(startFromStep2 ? 2 : 1);
  const [showErrors, setShowErrors] = useState(false);

  /* Auth Modal */
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  /* Özet ekranı düzenleme modu */
  const [editMode, setEditMode] = useState<"firma" | "deneyim" | null>(null);

  /* Ödeme ekranı */
  const [odemeTamamlandi, setOdemeTamamlandi] = useState(false);

  /* Mali yeterlilik */
  const [maliDolduruldu, setMaliDolduruldu] = useState(false);
  const [showMaliForm, setShowMaliForm] = useState(false);

  /* Step 1 */
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyType, setCompanyType] = useState<"" | "sahis" | "limited_as" | "kooperatif">("");
  const [foundingYear, setFoundingYear] = useState("");
  const [partners, setPartners] = useState<Partner[]>([createPartner()]);
  const [hasSpecificArea, setHasSpecificArea] = useState<"" | "yes" | "no">("");
  const [minAreaRequirement, setMinAreaRequirement] = useState("");
  const [hasKep, setHasKep] = useState<"" | "yes" | "no">("");
  const [kepAddress, setKepAddress] = useState("");
  const [isFirstTime, setIsFirstTime] = useState<"" | "first" | "renewal">("");

  /* Step 2 */
  const [hasYapiIsi, setHasYapiIsi] = useState(false);
  const [hasDiploma, setHasDiploma] = useState(false);
  const [hasNone, setHasNone] = useState(false);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([createExperienceEntry()]);
  const [diplomaPartnerName, setDiplomaPartnerName] = useState("");
  const [diplomaDepartment, setDiplomaDepartment] = useState<"" | "insaat_muhendisligi" | "mimarlik">("");
  const [diplomaGradDate, setDiplomaGradDate] = useState("");
  const [diplomaPartnershipYears, setDiplomaPartnershipYears] = useState("");
  const [diplomaSharePercent, setDiplomaSharePercent] = useState("");

  /* Step 3 */
  const [location, setLocation] = useState<"" | "istanbul" | "istanbul_disi">("");
  const [city, setCity] = useState("");
  const [selectedService, setSelectedService] = useState("");

  /* Storage */
  const saveToStorage = useCallback(() => {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({
      companyName, taxId, phone, email, companyType, foundingYear, partners,
      hasSpecificArea, minAreaRequirement, hasKep, kepAddress, isFirstTime,
      hasYapiIsi, hasDiploma, hasNone, experiences,
      diplomaPartnerName, diplomaDepartment, diplomaGradDate, diplomaPartnershipYears, diplomaSharePercent,
      location, city, selectedService, step,
    }));
  }, [companyName, taxId, phone, email, companyType, foundingYear, partners,
    hasSpecificArea, minAreaRequirement, hasKep, kepAddress, isFirstTime,
    hasYapiIsi, hasDiploma, hasNone, experiences,
    diplomaPartnerName, diplomaDepartment, diplomaGradDate, diplomaPartnershipYears, diplomaSharePercent,
    location, city, selectedService, step]);

  /* Restore */
  useEffect(() => {
    if (!returnToKonum) return;
    try {
      const d = JSON.parse(sessionStorage.getItem(WIZARD_STORAGE_KEY) || "{}");
      if (d.companyName) setCompanyName(d.companyName);
      if (d.taxId) setTaxId(d.taxId);
      if (d.phone) setPhone(d.phone);
      if (d.email) setEmail(d.email);
      if (d.companyType) setCompanyType(d.companyType);
      if (d.foundingYear) setFoundingYear(d.foundingYear);
      if (d.partners?.length) setPartners(d.partners);
      if (d.hasSpecificArea) setHasSpecificArea(d.hasSpecificArea);
      if (d.minAreaRequirement) setMinAreaRequirement(d.minAreaRequirement);
      if (d.hasKep) setHasKep(d.hasKep);
      if (d.kepAddress) setKepAddress(d.kepAddress);
      if (d.isFirstTime) setIsFirstTime(d.isFirstTime);
      setHasYapiIsi(!!d.hasYapiIsi);
      setHasDiploma(!!d.hasDiploma);
      setHasNone(!!d.hasNone);
      if (d.experiences?.length) setExperiences(d.experiences);
      if (d.diplomaPartnerName) setDiplomaPartnerName(d.diplomaPartnerName);
      if (d.diplomaDepartment) setDiplomaDepartment(d.diplomaDepartment);
      if (d.diplomaGradDate) setDiplomaGradDate(d.diplomaGradDate);
      if (d.diplomaPartnershipYears) setDiplomaPartnershipYears(d.diplomaPartnershipYears);
      if (d.diplomaSharePercent) setDiplomaSharePercent(d.diplomaSharePercent);
      if (d.location) setLocation(d.location);
      if (d.city) setCity(d.city);
      if (d.selectedService) setSelectedService(d.selectedService);
      setStep(d.companyType === "kooperatif" || isHGroup ? 2 : 3);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Derived */
  const isLimitedAS = companyType === "limited_as";
  const isKooperatif = companyType === "kooperatif";
  const skipExperience = isKooperatif || isHGroup;
  const totalSteps = skipExperience ? 3 : 4;
  const konumStepNum = skipExperience ? 2 : 3;
  const summaryStepNum = skipExperience ? 3 : 4;

  const totalSharePercent = useMemo(() => partners.reduce((s, p) => s + (Number(p.sharePercent) || 0), 0), [partners]);
  const diplomaShareNum = Number(diplomaSharePercent) || 0;
  const diplomaYearsNum = Number(diplomaPartnershipYears) || 0;
  const diplomaShareOk = !isLimitedAS || diplomaShareNum >= 51;
  const diplomaYearsOk = !isLimitedAS || diplomaYearsNum >= 5;
  const atLeastOneSelected = hasYapiIsi || hasDiploma || hasNone;

  /* Tahmini grup */
  const tahminiGrup = useMemo(() => {
    if (companyType === "kooperatif") return "Kooperatif";
    if (!hasYapiIsi && !hasDiploma) return "H";
    return "Analiz"; // gerçek hesaplama admin tarafında
  }, [companyType, hasYapiIsi, hasDiploma]);

  const maliGerekli = FINANSAL_GEREKLI.includes(tahminiGrup);

  /* Validation */
  const step1CompanyValid = companyName.trim().length >= 3 && taxId.length >= 10 && isPhoneComplete(phone) && isValidEmail(email) && companyType !== "";
  const step1LtdValid = !isLimitedAS || (foundingYear.length === 4 && partners.every(p => p.name.trim().length >= 2 && p.sharePercent !== "" && Number(p.sharePercent) > 0 && p.tcKimlikNo.length === 11));
  const step1KepValid = hasKep !== "" && (hasKep === "no" || kepAddress.trim().length >= 5);
  const step1EkValid = isKooperatif ? step1KepValid : (hasSpecificArea !== "" && (hasSpecificArea === "no" || minAreaRequirement !== "") && step1KepValid && isFirstTime !== "");
  const step1Valid = step1CompanyValid && step1LtdValid && step1EkValid;

  const step2ExpValid = !hasYapiIsi || experiences.every(e =>
    e.contractDate !== "" && e.totalArea !== "" && e.buildingClass !== ""
  );
  const step2DiplomaValid = !hasDiploma || (diplomaPartnerName.trim().length >= 2 && diplomaDepartment !== "" && diplomaGradDate !== "" && (companyType === "sahis" || (diplomaSharePercent !== "" && diplomaPartnershipYears !== "")));
  const step2Valid = atLeastOneSelected && step2ExpValid && step2DiplomaValid;
  const step3Valid = location !== "" && selectedService !== "" && (location === "istanbul" || city.trim().length >= 2);

  const canAdvance = () => {
    if (step === 1) return step1Valid;
    if (step === 2 && !skipExperience) return step2Valid;
    if (step === konumStepNum) return step3Valid;
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) { setShowErrors(true); return; }
    setShowErrors(false);
    setStep(step + 1);
  };

  const fieldClass = (ok: boolean) => showErrors && !ok ? inputErrorClass : inputClass;

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    const normalized = digits.startsWith("0") ? digits : "0" + digits;
    setPhone(formatPhone(normalized.slice(0, 11)));
  };

  /* Helpers */
  const updatePartner = (id: string, field: keyof Partner, value: string) =>
    setPartners(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  const addPartner = () => setPartners(prev => [...prev, createPartner()]);
  const removePartner = (id: string) => { if (partners.length > 1) setPartners(prev => prev.filter(p => p.id !== id)); };

  const updateExperience = (id: string, field: keyof ExperienceEntry, value: any) =>
    setExperiences(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  const addExperience = () => setExperiences(prev => [...prev, createExperienceEntry()]);
  const removeExperience = (id: string) => { if (experiences.length > 1) setExperiences(prev => prev.filter(e => e.id !== id)); };

  /* Service pricing */
  const SERVICE_INFO: Record<string, { label: string; price: string; harc?: string }> = {
    koop_istanbul:               { label: "Kooperatif Dosya Hazırlığı + Başvuru + Danışmanlık",          price: "20.000 ₺", harc: "13.500 ₺" },
    koop_disari:                 { label: "Telefon / E-posta Danışmanlık Desteği",                       price: "7.000 ₺" },
    h_grubu_istanbul:            { label: "H Grubu Dosya Hazırlığı + Bakanlığa Başvuru",                 price: "12.000 ₺" },
    danismanlik_disari:          { label: "Telefon / E-posta Danışmanlık Desteği (Soru-Cevap)",          price: "7.000 ₺" },
    is_deneyim_hesaplama:        { label: "İş Deneyim Hesaplama + Sınıf Tayini",                         price: "10.000 ₺" },
    tam_hizmet:                  { label: "İş Deneyim Güncelleme + Mali Yeterlilik + Dosya + Başvuru",   price: "18.000 ₺" },
    is_deneyim_hesaplama_disari: { label: "İş Deneyim Hesaplama + Sınıf Tayini (Uzaktan)",              price: "10.000 ₺" },
  };
  const selectedServiceInfo = SERVICE_INFO[selectedService];
  const serviceLabel = selectedServiceInfo?.label ?? "";

  /* Save */
  const saveCompanyToPanel = (overrideUserEmail?: string) => {
    const state = routerLocation.state as any;
    const existingId = state?.companyId;
    const existingCompanies = loadLS<any[]>(MOCK_COMPANIES_KEY, []);
    const matchById = existingId ? existingCompanies.find((c: any) => c.id === existingId) : null;
    const matchByTax = !matchById && taxId ? existingCompanies.find((c: any) => c.taxId === taxId) : null;
    const resolvedId = matchById?.id || matchByTax?.id || crypto.randomUUID();

    let group = "H";
    if (companyType === "kooperatif") group = "Kooperatif";
    else if (isHGroup || (!hasYapiIsi && !hasDiploma)) group = "H";
    else group = "Analiz";

    let currentUserEmail = overrideUserEmail || "";
    if (!currentUserEmail) {
      try { const s = localStorage.getItem("mock_auth_user"); if (s) currentUserEmail = JSON.parse(s).user?.email || ""; } catch {}
    }

    const companyData: any = {
      id: resolvedId,
      companyName, taxId, phone, email, companyType, foundingYear, location, city, group,
      partners: companyType === "limited_as" ? partners : [],
      kepAddress: hasKep === "yes" ? kepAddress : "",
      hasSpecificArea, minAreaRequirement, isFirstTime, selectedService, serviceLabel,
      userEmail: currentUserEmail || email,
      qualifications: !skipExperience ? {
        hasYapiIsi, hasDiploma, hasNone,
        experiences: experiences.map(e => ({
          isDeneyimiTipi: e.isDeneyimiTipi,
          contractDate: e.contractDate, occupancyDate: e.occupancyDate,
          totalArea: e.totalArea, buildingHeight: e.buildingHeight,
          buildingClass: e.buildingClass, adaParsel: e.adaParsel,
          sozlesmeBedeli: e.sozlesmeBedeli,
        })),
        diploma: hasDiploma ? { partnerName: diplomaPartnerName, department: diplomaDepartment, gradDate: diplomaGradDate, partnershipYears: diplomaPartnershipYears, sharePercent: diplomaSharePercent } : null,
      } : undefined,
      createdAt: (matchById || matchByTax)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = (matchById || matchByTax)
      ? existingCompanies.map((c: any) => c.id === resolvedId ? companyData : c)
      : [...existingCompanies, companyData];
    saveLS(MOCK_COMPANIES_KEY, updated);

    if (selectedService && selectedServiceInfo) {
      const allBilling = loadLS<Record<string, any[]>>(MOCK_BILLING_KEY, {});
      const companyBilling = allBilling[resolvedId] || [];
      if (!companyBilling.some((inv: any) => inv.description?.includes(serviceLabel) && inv.status !== "paid")) {
        const today = new Date(), due = new Date(today);
        due.setDate(due.getDate() + 14);
        companyBilling.push({ id: crypto.randomUUID(), companyId: resolvedId, date: today.toISOString(), dueDate: due.toISOString(), description: serviceLabel, amount: selectedServiceInfo.price, status: "unpaid" });
        allBilling[resolvedId] = companyBilling;
        saveLS(MOCK_BILLING_KEY, allBilling);
      }
    }
    return resolvedId;
  };

  /* Auth */
  const handleAuthAndSave = async () => {
    if (!authEmail.trim()) { setAuthError("E-posta giriniz."); return; }
    if (!authPassword || authPassword.length < 6) { setAuthError("Şifre en az 6 karakter olmalıdır."); return; }
    if (authPassword !== authPasswordConfirm) { setAuthError("Şifreler eşleşmiyor."); return; }
    setAuthError(""); setAuthSubmitting(true);
    try {
      const res = await signUp(authEmail.trim(), authPassword, authName.trim() || authEmail.split("@")[0]);
      if (res.error) { setAuthError(res.error); setAuthSubmitting(false); return; }
      setShowAuthModal(false);
      saveToStorage();
      saveCompanyToPanel(authEmail.trim());
      navigate("/dashboard", { state: { defaultTab: "odeme" } });
    } catch (e: any) {
      setAuthError(e.message || "Hata oluştu");
    } finally { setAuthSubmitting(false); }
  };

  const handleViewReport = async () => {
    if (!authLoading && user) {
      saveToStorage(); saveCompanyToPanel();
      navigate("/dashboard", { state: { defaultTab: "odeme" } });
      return;
    }
    try {
      const stored = localStorage.getItem("mock_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user?.email) {
          await signIn(parsed.user.email, "");
          saveToStorage(); saveCompanyToPanel();
          navigate("/dashboard", { state: { defaultTab: "odeme" } });
          return;
        }
      }
    } catch {}
    setAuthEmail(email); setAuthError(""); setAuthName(""); setAuthPassword(""); setAuthPasswordConfirm("");
    setShowAuthModal(true);
  };

  /* Ödeme tamamlandı */
  const handleOdemeTamamlandi = () => {
    saveCompanyToPanel();
    setOdemeTamamlandi(true);
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  /* ════════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F8F7F4] font-[Inter]">
      {/* Top bar */}
      <div className="bg-[#0B1D3A] text-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <button onClick={() => (routerLocation.state as any)?.companyId ? navigate("/dashboard") : navigate("/")}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {(routerLocation.state as any)?.companyId ? "Panele Dön" : "Ana Sayfa"}
          </button>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C9952B]" />
            <span className="text-sm">muteahhitlikbelgesi<span className="text-[#C9952B]">.com</span></span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#0B1D3A]/8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#5A6478]">Adım {step} / {totalSteps}</span>
            <span className="text-sm text-[#C9952B]">Başvuru Süreci</span>
          </div>
          <div className="h-2 bg-[#E8E6E1] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#C9952B] to-[#E8B84D] rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ════ STEP 1 ════ */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-[#0B1D3A]/8 p-6 sm:p-10">
              <h2 className="text-xl text-[#0B1D3A] mb-1">Şirket Bilgileri</h2>
              <p className="text-[#5A6478] text-sm mb-8">Firma bilgilerinizi eksiksiz doldurunuz.</p>

              {/* Şirket Türü */}
              <div className="mb-8">
                <SectionHeader num={1} title="Şirket Türü" />
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { val: "sahis" as const, label: "Şahıs Firması", icon: <HardHat className="w-4 h-4" /> },
                    { val: "limited_as" as const, label: "Limited / A.Ş.", icon: <Building2 className="w-4 h-4" /> },
                    { val: "kooperatif" as const, label: "Kooperatif", icon: <Building2 className="w-4 h-4" /> },
                  ]).map(opt => (
                    <RadioCard key={opt.val} selected={companyType === opt.val} hasError={showErrors && companyType === ""}
                      onClick={() => { setCompanyType(opt.val); if (opt.val !== "limited_as") { setFoundingYear(""); setPartners([createPartner()]); } }}>
                      <div className="flex items-center gap-1.5">{opt.icon}<span>{opt.label}</span></div>
                    </RadioCard>
                  ))}
                </div>
                {showErrors && companyType === "" && <p className="text-xs text-red-500 mt-2">Lütfen şirket türünü seçiniz.</p>}
              </div>

              {/* Temel Bilgiler */}
              <div className="mb-8">
                <SectionHeader num={2} title="Temel Bilgiler" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-[#0B1D3A] mb-2">Şirket / Firma Adı <span className="text-red-400">*</span></label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value.slice(0, 100))} placeholder="Örn: ABC İnşaat Taahhüt A.Ş." className={fieldClass(companyName.trim().length >= 3)} />
                    {showErrors && companyName.trim().length < 3 && <p className="text-xs text-red-500 mt-1">En az 3 karakter giriniz.</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-[#0B1D3A] mb-2">Vergi Kimlik No <span className="text-red-400">*</span></label>
                    <input type="text" value={taxId} onChange={e => setTaxId(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="1234567890" className={fieldClass(taxId.length >= 10)} />
                    {showErrors && taxId.length < 10 && <p className="text-xs text-red-500 mt-1">10 veya 11 haneli olmalıdır.</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-[#0B1D3A] mb-2">Cep Telefonu <span className="text-red-400">*</span></label>
                    <input type="tel" value={phone} onChange={handlePhoneInput} placeholder="0(5XX) XXX XX XX" className={fieldClass(isPhoneComplete(phone))} />
                    {showErrors && !isPhoneComplete(phone) && <p className="text-xs text-red-500 mt-1">Geçerli telefon giriniz.</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-[#0B1D3A] mb-2">E-posta <span className="text-red-400">*</span></label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value.slice(0, 100))} placeholder="info@firma.com" className={fieldClass(isValidEmail(email))} />
                    {showErrors && !isValidEmail(email) && <p className="text-xs text-red-500 mt-1">Geçerli e-posta giriniz.</p>}
                  </div>
                </div>
              </div>

              {/* Kuruluş & Ortaklar (Ltd/AŞ) */}
              {isLimitedAS && (
                <div className="mb-8">
                  <SectionHeader num={3} title="Kuruluş ve Ortaklık Bilgileri" />
                  <div className="mb-5">
                    <label className="block text-sm text-[#0B1D3A] mb-2">Kuruluş Yılı <span className="text-red-400">*</span></label>
                    <input type="text" value={foundingYear} onChange={e => setFoundingYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2015" className={`${fieldClass(foundingYear.length === 4)} max-w-[160px]`} />
                    {showErrors && foundingYear.length !== 4 && <p className="text-xs text-red-500 mt-1">4 haneli yıl giriniz.</p>}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-[#0B1D3A]">Ortaklar <span className="text-red-400">*</span></label>
                    <button onClick={addPartner} className="text-[#C9952B] text-xs flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Ortak Ekle</button>
                  </div>
                  <div className="space-y-3">
                    {partners.map((p, idx) => (
                      <div key={p.id} className="flex items-start gap-3 bg-[#F0EDE8]/50 p-3 rounded-lg border border-[#0B1D3A]/5">
                        <span className="w-5 h-5 rounded-full bg-[#0B1D3A] text-white flex items-center justify-center text-xs mt-2 shrink-0">{idx + 1}</span>
                        <div className="flex-1 grid sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-1">
                            <label className="block text-xs text-[#5A6478] mb-1">Ad Soyad <span className="text-red-400">*</span></label>
                            <input type="text" value={p.name} onChange={e => updatePartner(p.id, "name", e.target.value.slice(0, 60))} placeholder="Ortak adı" className={fieldClass(p.name.trim().length >= 2)} />
                          </div>
                          <div>
                            <label className="block text-xs text-[#5A6478] mb-1">TC Kimlik No <span className="text-red-400">*</span></label>
                            <input type="text" value={p.tcKimlikNo} onChange={e => updatePartner(p.id, "tcKimlikNo", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="12345678901" className={fieldClass(p.tcKimlikNo.length === 11)} />
                          </div>
                          <div>
                            <label className="block text-xs text-[#5A6478] mb-1">Hisse (%) <span className="text-red-400">*</span></label>
                            <input type="text" value={p.sharePercent} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 3); if (Number(v) <= 100) updatePartner(p.id, "sharePercent", v); }} placeholder="51" className={fieldClass(p.sharePercent !== "" && Number(p.sharePercent) > 0)} />
                          </div>
                        </div>
                        {partners.length > 1 && <button onClick={() => removePartner(p.id)} className="text-red-400 p-1.5 mt-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    ))}
                  </div>
                  {totalSharePercent > 0 && (
                    <div className={`mt-3 text-xs flex items-center gap-1 ${totalSharePercent === 100 ? "text-green-600" : "text-orange-500"}`}>
                      {totalSharePercent === 100 ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      Toplam hisse: %{totalSharePercent} {totalSharePercent !== 100 && "(toplamın %100 olması gerekir)"}
                    </div>
                  )}
                </div>
              )}

              {/* Ek Bilgiler */}
              <div className="space-y-8">
                <SectionHeader num={isLimitedAS ? 4 : 3} title="Ek Bilgiler" required={false} />

                {!isKooperatif && (
                  <div>
                    <p className="text-sm text-[#5A6478] mb-3">Belirli bir m² inşaat alanı için projeniz var mı? <span className="text-red-400">*</span></p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <RadioCard selected={hasSpecificArea === "yes"} hasError={showErrors && hasSpecificArea === ""} onClick={() => setHasSpecificArea("yes")}>
                        <div className="mb-1">Evet, planlanan projem var</div>
                        <p className="text-xs text-[#5A6478]">m² bilgisini belirteceğim</p>
                      </RadioCard>
                      <RadioCard selected={hasSpecificArea === "no"} hasError={showErrors && hasSpecificArea === ""} onClick={() => { setHasSpecificArea("no"); setMinAreaRequirement(""); }}>
                        <div className="mb-1">Hayır, belirli bir projem yok</div>
                        <p className="text-xs text-[#5A6478]">En yüksek grubu almak istiyoruz</p>
                      </RadioCard>
                    </div>
                    {showErrors && hasSpecificArea === "" && <p className="text-xs text-red-500 mt-2">Lütfen seçiniz.</p>}
                    {hasSpecificArea === "yes" && (
                      <div className="mt-4">
                        <label className="block text-sm text-[#0B1D3A] mb-2">Projenin İnşaat Alanı (m²) <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2">
                          <input type="text" value={minAreaRequirement} onChange={e => { const f = formatNumeric(e.target.value); if (e.target.value.replace(/\D/g, "").length <= 9) setMinAreaRequirement(f); }} placeholder="10.000" className={`${fieldClass(minAreaRequirement !== "")} max-w-xs`} />
                          <span className="text-sm text-[#5A6478]">m² ve üzeri</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm text-[#5A6478] mb-3">KEP (Kayıtlı Elektronik Posta) adresiniz var mı? <span className="text-red-400">*</span></p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <RadioCard selected={hasKep === "yes"} hasError={showErrors && hasKep === ""} onClick={() => setHasKep("yes")}>Evet, KEP adresim var</RadioCard>
                    <RadioCard selected={hasKep === "no"} hasError={showErrors && hasKep === ""} onClick={() => { setHasKep("no"); setKepAddress(""); }}>Bilmiyorum / Yok</RadioCard>
                  </div>
                  {showErrors && hasKep === "" && <p className="text-xs text-red-500 mt-2">Lütfen seçiniz.</p>}
                  {hasKep === "yes" && (
                    <div className="mt-4">
                      <label className="block text-sm text-[#0B1D3A] mb-2">KEP Adresi <span className="text-red-400">*</span></label>
                      <input type="email" value={kepAddress} onChange={e => setKepAddress(e.target.value.slice(0, 100))} placeholder="firma@hs01.kep.tr" className={fieldClass(kepAddress.trim().length >= 5)} />
                    </div>
                  )}
                </div>

                {!isKooperatif && (
                  <div>
                    <p className="text-sm text-[#5A6478] mb-3">Müteahhitlik belgesi daha önce alındı mı? <span className="text-red-400">*</span></p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <RadioCard selected={isFirstTime === "first"} hasError={showErrors && isFirstTime === ""} onClick={() => setIsFirstTime("first")}>
                        <div className="mb-1">İlk kez alınacak</div>
                        <p className="text-xs text-[#5A6478]">Daha önce belge alınmadı</p>
                      </RadioCard>
                      <RadioCard selected={isFirstTime === "renewal"} hasError={showErrors && isFirstTime === ""} onClick={() => setIsFirstTime("renewal")}>
                        <div className="mb-1">Daha önce alındı</div>
                        <p className="text-xs text-[#5A6478]">Yenileme / grup yükseltme</p>
                      </RadioCard>
                    </div>
                    {showErrors && isFirstTime === "" && <p className="text-xs text-red-500 mt-2">Lütfen seçiniz.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP 2 — İş Deneyim ════ */}
        {step === 2 && !skipExperience && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-[#0B1D3A]/8 p-6 sm:p-10">
              <h2 className="text-xl text-[#0B1D3A] mb-1">İş Deneyim & Yeterlilik</h2>
              <p className="text-[#5A6478] text-sm mb-8">Sahip olduğunuz yeterlilikleri işaretleyiniz.</p>

              <SectionHeader num={1} title="Yeterlilik Türleri" />
              <div className="space-y-3 mb-8">
                <CheckCard checked={hasYapiIsi} hasError={showErrors && !atLeastOneSelected}
                  onClick={() => { setHasYapiIsi(!hasYapiIsi); if (!hasYapiIsi) setHasNone(false); }}>
                  <div className="flex items-center gap-2 mb-1"><HardHat className="w-4 h-4 text-[#C9952B]" /><span>Yapım işim var</span></div>
                  <p className="text-xs text-[#5A6478]">Kat karşılığı veya taahhüt/ihale inşaat işleri</p>
                </CheckCard>

                <CheckCard checked={hasDiploma} hasError={showErrors && !atLeastOneSelected}
                  onClick={() => { setHasDiploma(!hasDiploma); if (!hasDiploma) setHasNone(false); }}>
                  <div className="flex items-center gap-2 mb-1"><GraduationCap className="w-4 h-4 text-[#C9952B]" />
                    <span>{companyType === "sahis" ? "İnşaat Mühendisliği / Mimarlık diplomam var" : "Ortaktan birinin diploma başvurusu"}</span>
                  </div>
                  <p className="text-xs text-[#5A6478]">Diploma ile yeterlilik başvurusu</p>
                </CheckCard>

                <CheckCard checked={hasNone} hasError={showErrors && !atLeastOneSelected}
                  onClick={() => { const next = !hasNone; setHasNone(next); if (next) { setHasYapiIsi(false); setHasDiploma(false); } }}>
                  <div className="flex items-center gap-2 mb-1"><XCircle className="w-4 h-4 text-[#5A6478]" /><span>Mevcut belge / iş deneyim yok</span></div>
                  <p className="text-xs text-[#5A6478]">Kullanılabilecek belge bulunmuyor</p>
                </CheckCard>
              </div>
              {showErrors && !atLeastOneSelected && <p className="text-xs text-red-500 -mt-6 mb-6">En az bir seçenek işaretleyiniz.</p>}

              {/* ── Yapım İşleri ── */}
              {hasYapiIsi && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <SectionHeader num={2} title="İş Deneyim Girişleri" />
                    <button onClick={addExperience} className="bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors">
                      <Plus className="w-4 h-4" /> İş Ekle
                    </button>
                  </div>
                  <div className="space-y-4">
                    {experiences.map((entry, index) => (
                      <div key={entry.id} className="border border-[#0B1D3A]/8 rounded-xl overflow-hidden">
                        <div className="bg-[#F0EDE8] px-4 py-3 flex items-center justify-between">
                          <span className="text-sm text-[#0B1D3A] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#0B1D3A] text-white flex items-center justify-center text-xs">{index + 1}</span>
                            Yapım İşi
                          </span>
                          {experiences.length > 1 && (
                            <button onClick={() => removeExperience(entry.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                        <div className="p-4">
                          {/* İş tipi — sadece kat karşılığı veya taahhüt */}
                          <div className="mb-4">
                            <label className="block text-xs text-[#5A6478] mb-2">İş türü <span className="text-red-400">*</span></label>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => updateExperience(entry.id, "isDeneyimiTipi", "kat_karsiligi")}
                                className={`py-2.5 px-4 rounded-lg border text-sm text-center transition-colors ${entry.isDeneyimiTipi === "kat_karsiligi" ? "border-[#C9952B] bg-[#C9952B]/10 text-[#0B1D3A] font-medium" : "border-[#0B1D3A]/10 text-[#5A6478] hover:border-[#C9952B]/50"}`}>
                                Kat karşılığı
                              </button>
                              <button type="button" onClick={() => updateExperience(entry.id, "isDeneyimiTipi", "taahhut")}
                                className={`py-2.5 px-4 rounded-lg border text-sm text-center transition-colors ${entry.isDeneyimiTipi === "taahhut" ? "border-[#C9952B] bg-[#C9952B]/10 text-[#0B1D3A] font-medium" : "border-[#0B1D3A]/10 text-[#5A6478] hover:border-[#C9952B]/50"}`}>
                                Taahhüt / ihale
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-[#5A6478] mb-1">Ada / Parsel</label>
                              <input type="text" value={entry.adaParsel} onChange={e => updateExperience(entry.id, "adaParsel", e.target.value.slice(0, 30))} placeholder="120/5" className={inputClass} />
                            </div>
                            <div>
                              <label className="block text-xs text-[#5A6478] mb-1">Sözleşme Tarihi <span className="text-red-400">*</span></label>
                              <input type="date" value={entry.contractDate} onChange={e => updateExperience(entry.id, "contractDate", e.target.value)} className={fieldClass(entry.contractDate !== "")} />
                            </div>
                            <div>
                              <label className="block text-xs text-[#5A6478] mb-1">İskan / Kabul Tarihi</label>
                              <input type="date" value={entry.occupancyDate} onChange={e => updateExperience(entry.id, "occupancyDate", e.target.value)} className={inputClass} />
                            </div>

                            {/* Taahhüt — sözleşme bedeli */}
                            {entry.isDeneyimiTipi === "taahhut" && (
                              <div className="sm:col-span-2">
                                <label className="block text-xs text-[#5A6478] mb-1">Sözleşme bedeli (₺) <span className="text-red-400">*</span></label>
                                <input type="text" value={entry.sozlesmeBedeli}
                                  onChange={e => { const raw = e.target.value.replace(/\D/g, ""); updateExperience(entry.id, "sozlesmeBedeli", raw ? parseInt(raw).toLocaleString("tr-TR") : ""); }}
                                  placeholder="1.000.000" className={fieldClass(entry.sozlesmeBedeli !== "")} />
                              </div>
                            )}

                            {/* Kat karşılığı — alan ve sınıf */}
                            {entry.isDeneyimiTipi === "kat_karsiligi" && (
                              <>
                                <div>
                                  <label className="block text-xs text-[#5A6478] mb-1">İnşaat Alanı (m²) <span className="text-red-400">*</span></label>
                                  <input type="text" value={entry.totalArea}
                                    onChange={e => { const f = formatNumeric(e.target.value); if (e.target.value.replace(/\D/g, "").length <= 9) updateExperience(entry.id, "totalArea", f); }}
                                    placeholder="5.000" className={fieldClass(entry.totalArea !== "")} />
                                </div>
                                <div>
                                  <label className="block text-xs text-[#5A6478] mb-1">Yapı Yüksekliği (m)</label>
                                  <input type="text" value={entry.buildingHeight}
                                    onChange={e => updateExperience(entry.id, "buildingHeight", e.target.value.replace(/[^0-9.,]/g, "").slice(0, 6))}
                                    placeholder="21.50" className={inputClass} />
                                </div>
                                <div>
                                  <label className="block text-xs text-[#5A6478] mb-1">Yapı Sınıfı <span className="text-red-400">*</span></label>
                                  <select value={entry.buildingClass} onChange={e => updateExperience(entry.id, "buildingClass", e.target.value)} className={fieldClass(entry.buildingClass !== "")}>
                                    <option value="">Seçiniz</option>
                                    {["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"].map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                              </>
                            )}
                          </div>

                          {/* İskan yükleme */}
                          <div className="mt-4 pt-4 border-t border-[#0B1D3A]/8">
                            <div className="flex items-center gap-2 mb-2">
                              <label className="text-xs text-[#5A6478]">İskan / Kabul Belgesi</label>
                              <span className="text-[10px] bg-[#0B1D3A]/5 text-[#5A6478] px-2 py-0.5 rounded-full">Opsiyonel</span>
                            </div>
                            {entry.iskanFile ? (
                              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                                <FileText className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="text-sm text-green-800 truncate flex-1">{entry.iskanFile.name}</span>
                                <button type="button" onClick={() => updateExperience(entry.id, "iskanFile", null)} className="text-green-600 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-3 border border-dashed border-[#0B1D3A]/15 hover:border-[#C9952B]/50 rounded-lg px-4 py-3 cursor-pointer transition-colors group">
                                <Upload className="w-4 h-4 text-[#5A6478] group-hover:text-[#C9952B]" />
                                <span className="text-sm text-[#5A6478]">PDF, JPG veya PNG yükleyin</span>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                  onChange={e => { const f = e.target.files?.[0] || null; if (f) setExperiences(prev => prev.map(ex => ex.id === entry.id ? { ...ex, iskanFile: f } : ex)); }} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Diploma ── */}
              {hasDiploma && (
                <div className="mb-8">
                  <SectionHeader num={hasYapiIsi ? 3 : 2} title="Diploma Bilgileri" />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-[#0B1D3A] mb-2">{companyType === "sahis" ? "Ad Soyad" : "Diploma Sahibi Ortağın Adı Soyadı"} <span className="text-red-400">*</span></label>
                      {isLimitedAS && partners.length > 0 ? (
                        <select value={diplomaPartnerName} onChange={e => { setDiplomaPartnerName(e.target.value); const f = partners.find(p => p.name === e.target.value); setDiplomaSharePercent(f ? f.sharePercent : ""); }} className={fieldClass(diplomaPartnerName.trim().length >= 2)}>
                          <option value="">Ortak seçiniz</option>
                          {partners.filter(p => p.name.trim().length >= 2).map(p => <option key={p.id} value={p.name}>{p.name} (%{p.sharePercent || "?"})</option>)}
                        </select>
                      ) : (
                        <input type="text" value={diplomaPartnerName} onChange={e => setDiplomaPartnerName(e.target.value.slice(0, 60))} placeholder="Ad Soyad" className={fieldClass(diplomaPartnerName.trim().length >= 2)} />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-[#0B1D3A] mb-2">Bölüm <span className="text-red-400">*</span></label>
                      <select value={diplomaDepartment} onChange={e => setDiplomaDepartment(e.target.value as any)} className={fieldClass(diplomaDepartment !== "")}>
                        <option value="">Seçiniz</option>
                        <option value="insaat_muhendisligi">İnşaat Mühendisliği</option>
                        <option value="mimarlik">Mimarlık</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#0B1D3A] mb-2">Mezuniyet Tarihi <span className="text-red-400">*</span></label>
                      <input type="date" value={diplomaGradDate} onChange={e => setDiplomaGradDate(e.target.value)} className={fieldClass(diplomaGradDate !== "")} />
                    </div>
                    {isLimitedAS && (
                      <>
                        <div>
                          <label className="block text-sm text-[#0B1D3A] mb-2">Hisse Oranı (%) <span className="text-red-400">*</span></label>
                          <input type="text" value={diplomaSharePercent} readOnly={partners.some(p => p.name === diplomaPartnerName)}
                            onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 3); if (Number(v) <= 100) setDiplomaSharePercent(v); }}
                            placeholder="%51" className={`${fieldClass(diplomaSharePercent !== "" && diplomaShareOk)} max-w-[160px] ${partners.some(p => p.name === diplomaPartnerName) ? "bg-[#E8E6E1] cursor-not-allowed" : ""}`} />
                          {diplomaSharePercent !== "" && !diplomaShareOk && <p className="text-xs text-red-500 mt-1">En az %51 hisse gereklidir.</p>}
                        </div>
                        <div>
                          <label className="block text-sm text-[#0B1D3A] mb-2">Ortaklık Süresi (Yıl) <span className="text-red-400">*</span></label>
                          <input type="text" value={diplomaPartnershipYears} onChange={e => setDiplomaPartnershipYears(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="5" className={`${fieldClass(diplomaPartnershipYears !== "" && diplomaYearsOk)} max-w-[160px]`} />
                          {diplomaPartnershipYears !== "" && !diplomaYearsOk && <p className="text-xs text-red-500 mt-1">En az 5 yıl ortaklık gereklidir.</p>}
                        </div>
                      </>
                    )}
                  </div>
                  {isLimitedAS && diplomaSharePercent !== "" && diplomaPartnershipYears !== "" && (
                    <div className={`mt-4 rounded-xl p-4 border flex items-start gap-3 ${diplomaShareOk && diplomaYearsOk ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                      {diplomaShareOk && diplomaYearsOk ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
                      <p className="text-sm">{diplomaShareOk && diplomaYearsOk ? `Şartlar sağlanıyor: %${diplomaShareNum} hisse, ${diplomaYearsNum} yıl ortaklık.` : "Şartlar sağlanamıyor — hisse veya ortaklık süresi yetersiz."}</p>
                    </div>
                  )}
                </div>
              )}

              {hasNone && !hasYapiIsi && !hasDiploma && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                  <div className="text-sm text-orange-800">
                    <p>Şirkete ait belge bulunmadığını belirttiniz.</p>
                    <p className="text-xs text-orange-600 mt-1">En uygun çözümü birlikte değerlendireceğiz.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ KONUM & HİZMET ════ */}
        {step === konumStepNum && (() => {
          const hasExp = hasYapiIsi || hasDiploma;

          const istanbulOptions: { key: string; label: string; desc: string; price: string; harc?: string; tags: string[]; popular?: boolean }[] = [];
          if (isKooperatif) {
            istanbulOptions.push({ key: "koop_istanbul", label: "Kooperatif Dosya Hazırlığı + Başvuru + Danışmanlık", desc: "Kooperatif müteahhitlik belgesi için tam hizmet.", price: "20.000 ₺", harc: "13.500 ₺", tags: ["Dosya Hazırlığı", "Başvuru", "Danışmanlık"] });
          } else if (!hasExp) {
            istanbulOptions.push({ key: "h_grubu_istanbul", label: "H Grubu Dosya Hazırlığı + Bakanlığa Başvuru", desc: "H grubu yetki belgesi başvurusu.", price: "12.000 ₺", tags: ["Dosya Hazırlığı", "Bakanlık Başvurusu"] });
          } else {
            istanbulOptions.push({ key: "tam_hizmet", label: "İş Deneyim Güncelleme + Mali Yeterlilik + Dosya + Başvuru", desc: "Tam kapsamlı hizmet.", price: "18.000 ₺", tags: ["İş Deneyim", "Mali Yeterlilik", "Dosya", "Başvuru"], popular: true });
            istanbulOptions.push({ key: "is_deneyim_hesaplama", label: "Sadece İş Deneyim Hesaplama + Sınıf Tayini", desc: "Hesaplama ve sınıf tayini.", price: "10.000 ₺", tags: ["İş Deneyim Hesaplama", "Sınıf Tayini"] });
          }

          let disariKey = "danismanlik_disari", disariLabel = "Telefon / E-posta Danışmanlık", disariDesc = "Tüm sorularınız yanıtlanır.", disariPrice = "7.000 ₺", disariTags = ["Telefon", "E-posta"];
          if (!isKooperatif && hasExp) { disariKey = "is_deneyim_hesaplama_disari"; disariLabel = "İş Deneyim Hesaplama (Uzaktan)"; disariDesc = "Uzaktan hesaplama ve sınıf tayini."; disariPrice = "10.000 ₺"; disariTags = ["Hesaplama", "Sınıf Tayini", "Uzaktan"]; }

          return (
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#0B1D3A]/8 p-6 sm:p-10">
              <h2 className="text-xl text-[#0B1D3A] mb-1">Konum ve Hizmet Seçimi</h2>
              <p className="text-[#5A6478] text-sm mb-8">Konumunuza göre hizmet seçeneklerini belirleyelim.</p>

              <div className="bg-[#0B1D3A]/5 border border-[#0B1D3A]/8 rounded-xl p-4 mb-8 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#0B1D3A]/50 shrink-0 mt-0.5" />
                <p className="text-xs text-[#5A6478]">Ücretlerimize harçlar dahil değildir. KDV dahildir.</p>
              </div>

              <div className="space-y-8">
                <div>
                  <SectionHeader num={1} title="Konum" />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <RadioCard selected={location === "istanbul"} hasError={showErrors && location === ""} onClick={() => { setLocation("istanbul"); setSelectedService(""); setCity(""); }}>
                      <div className="flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4 text-[#C9952B]" /> İstanbul</div>
                      <p className="text-xs text-[#5A6478]">Yüz yüze hizmet dahil</p>
                    </RadioCard>
                    <RadioCard selected={location === "istanbul_disi"} hasError={showErrors && location === ""} onClick={() => { setLocation("istanbul_disi"); setSelectedService(disariKey); }}>
                      <div className="flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4 text-[#5A6478]" /> İstanbul Dışı</div>
                      <p className="text-xs text-[#5A6478]">Uzaktan hizmet</p>
                    </RadioCard>
                  </div>
                  {showErrors && location === "" && <p className="text-xs text-red-500 mt-2">Konum seçiniz.</p>}
                  {location === "istanbul_disi" && (
                    <div className="mt-4">
                      <label className="block text-sm text-[#0B1D3A] mb-2">İl <span className="text-red-400">*</span></label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value.slice(0, 40))} placeholder="Ankara" className={`${fieldClass(city.trim().length >= 2)} max-w-xs`} />
                    </div>
                  )}
                </div>

                {location === "istanbul" && (
                  <div>
                    <SectionHeader num={2} title="Hizmet Paketi" />
                    <div className="space-y-3">
                      {istanbulOptions.map(opt => (
                        <button key={opt.key} onClick={() => setSelectedService(opt.key)}
                          className={`w-full p-5 rounded-xl border text-left transition-all relative ${opt.popular ? "ring-1 ring-[#C9952B]/40" : ""} ${selectedService === opt.key ? "border-[#C9952B] bg-[#C9952B]/10" : showErrors && selectedService === "" ? "border-red-300 bg-red-50" : opt.popular ? "border-[#C9952B]/30 bg-[#C9952B]/[0.03]" : "border-[#0B1D3A]/10 hover:border-[#C9952B]/50"}`}>
                          {opt.popular && <span className="absolute -top-2.5 left-5 bg-[#C9952B] text-[#0B1D3A] text-[10px] px-3 py-0.5 rounded-full">Popüler</span>}
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${selectedService === opt.key ? "border-[#C9952B]" : "border-[#0B1D3A]/20"}`}>
                              {selectedService === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-[#C9952B]" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <span className="text-sm text-[#0B1D3A]">{opt.label}</span>
                                <div className="text-right shrink-0">
                                  <span className="text-[#C9952B] text-sm">{opt.price}</span>
                                  <div className="text-[10px] text-[#5A6478]">KDV dahil</div>
                                </div>
                              </div>
                              <p className="text-xs text-[#5A6478]">{opt.desc}</p>
                              {opt.harc && <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Ayrıca {opt.harc} harç</p>}
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {opt.tags.map(t => <span key={t} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />{t}</span>)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {showErrors && selectedService === "" && <p className="text-xs text-red-500 mt-2">Hizmet paketi seçiniz.</p>}
                  </div>
                )}

                {location === "istanbul_disi" && (
                  <div>
                    <SectionHeader num={2} title="Hizmet" required={false} />
                    <div className="p-5 rounded-xl border border-[#C9952B] bg-[#C9952B]/10">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-[#C9952B] flex items-center justify-center mt-0.5 shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-[#C9952B]" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between gap-3 mb-1">
                            <span className="text-sm text-[#0B1D3A]">{disariLabel}</span>
                            <div className="text-right shrink-0"><span className="text-[#C9952B] text-sm">{disariPrice}</span><div className="text-[10px] text-[#5A6478]">KDV dahil</div></div>
                          </div>
                          <p className="text-xs text-[#5A6478]">{disariDesc}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {disariTags.map(t => <span key={t} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />{t}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800"><strong>Harçlar dahil değildir.</strong> Bakanlık tarifesine göre ayrıca tahsil edilir.</p>
              </div>
            </div>
          );
        })()}

        {/* ════ ÖZET + ÖDEME ════ */}
        {step === summaryStepNum && (
          <div className="max-w-3xl mx-auto space-y-5">

            {/* Firma Bilgileri Özeti */}
            <div className="bg-white rounded-2xl border border-[#0B1D3A]/8 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE8]">
                <h3 className="text-sm font-semibold text-[#0B1D3A]">Firma Bilgileri</h3>
                {!odemeTamamlandi && (
                  <button onClick={() => setEditMode(editMode === "firma" ? null : "firma")}
                    className="text-xs text-[#C9952B] flex items-center gap-1 hover:underline">
                    <Edit2 className="w-3.5 h-3.5" /> {editMode === "firma" ? "Kapat" : "Düzenle"}
                  </button>
                )}
              </div>
              {editMode === "firma" ? (
                <div className="p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-[#5A6478] mb-1">Şirket Adı</label>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value.slice(0, 100))} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-[#5A6478] mb-1">Vergi No</label>
                      <input value={taxId} onChange={e => setTaxId(e.target.value.replace(/\D/g, "").slice(0, 11))} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-[#5A6478] mb-1">Telefon</label>
                      <input value={phone} onChange={handlePhoneInput} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-[#5A6478] mb-1">E-posta</label>
                      <input value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <button onClick={() => setEditMode(null)} className="w-full bg-[#0B1D3A] hover:bg-[#122A54] text-white py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Kaydet
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 grid sm:grid-cols-2 gap-3">
                  {[
                    { label: "Firma", value: companyName },
                    { label: "Vergi No", value: taxId },
                    { label: "Telefon", value: phone },
                    { label: "E-posta", value: email },
                    { label: "Konum", value: location === "istanbul" ? "İstanbul" : city },
                    { label: "Belge Durumu", value: isFirstTime === "first" ? "İlk başvuru" : "Yenileme" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-[#5A6478]">{label}</p>
                      <p className="text-sm text-[#0B1D3A] font-medium">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* İş Deneyimleri Özeti */}
            {!skipExperience && (
              <div className="bg-white rounded-2xl border border-[#0B1D3A]/8 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE8]">
                  <h3 className="text-sm font-semibold text-[#0B1D3A]">İş Deneyimleri</h3>
                  {!odemeTamamlandi && (
                    <button onClick={() => setEditMode(editMode === "deneyim" ? null : "deneyim")}
                      className="text-xs text-[#C9952B] flex items-center gap-1 hover:underline">
                      <Edit2 className="w-3.5 h-3.5" /> {editMode === "deneyim" ? "Kapat" : "Düzenle"}
                    </button>
                  )}
                </div>
                {editMode === "deneyim" ? (
                  <div className="p-6 space-y-3">
                    {experiences.map((e, i) => (
                      <div key={e.id} className="p-4 bg-[#F8F7F4] rounded-xl">
                        <p className="text-xs font-medium text-[#0B1D3A] mb-3">İş {i + 1} — {e.isDeneyimiTipi === "kat_karsiligi" ? "Kat Karşılığı" : "Taahhüt"}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[#5A6478] mb-1">Sözleşme Tarihi</label>
                            <input type="date" value={e.contractDate} onChange={ev => updateExperience(e.id, "contractDate", ev.target.value)} className={inputClass} />
                          </div>
                          {e.isDeneyimiTipi === "kat_karsiligi" && (
                            <div>
                              <label className="block text-xs text-[#5A6478] mb-1">Alan (m²)</label>
                              <input value={e.totalArea} onChange={ev => { const f = formatNumeric(ev.target.value); updateExperience(e.id, "totalArea", f); }} className={inputClass} />
                            </div>
                          )}
                          {e.isDeneyimiTipi === "taahhut" && (
                            <div>
                              <label className="block text-xs text-[#5A6478] mb-1">Sözleşme Bedeli</label>
                              <input value={e.sozlesmeBedeli} onChange={ev => { const raw = ev.target.value.replace(/\D/g, ""); updateExperience(e.id, "sozlesmeBedeli", raw ? parseInt(raw).toLocaleString("tr-TR") : ""); }} className={inputClass} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setEditMode(null)} className="w-full bg-[#0B1D3A] hover:bg-[#122A54] text-white py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Kaydet
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0EDE8]">
                    {hasYapiIsi && experiences.map((e, i) => (
                      <div key={e.id} className="px-6 py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-[#0B1D3A]">İş {i + 1} — {e.isDeneyimiTipi === "kat_karsiligi" ? "Kat Karşılığı" : "Taahhüt"}</p>
                          {e.contractDate && <p className="text-xs text-[#5A6478]">Sözleşme: {e.contractDate}</p>}
                        </div>
                        <div className="text-right">
                          {e.totalArea && <p className="text-xs text-[#5A6478]">{e.totalArea} m²</p>}
                          {e.sozlesmeBedeli && <p className="text-xs text-[#5A6478]">{e.sozlesmeBedeli} ₺</p>}
                        </div>
                      </div>
                    ))}
                    {hasDiploma && <div className="px-6 py-3"><p className="text-sm text-[#0B1D3A]">Diploma — {diplomaDepartment === "insaat_muhendisligi" ? "İnşaat Mühendisliği" : "Mimarlık"}</p><p className="text-xs text-[#5A6478]">{diplomaPartnerName}</p></div>}
                    {hasNone && <div className="px-6 py-3"><p className="text-sm text-[#5A6478]">Belge yok</p></div>}
                  </div>
                )}
              </div>
            )}

            {/* Mali Yeterlilik (F1+) */}
            {maliGerekli && !skipExperience && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">Mali Yeterlilik Formu Gerekiyor</p>
                    <p className="text-xs text-amber-700 mt-1">Seçtiğiniz grup için bilanço bilgilerini doldurmanız gerekmektedir.</p>
                    {!maliDolduruldu && (
                      <button onClick={() => setShowMaliForm(!showMaliForm)}
                        className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs transition-colors">
                        {showMaliForm ? "Formu Kapat" : "Formu Doldur"}
                      </button>
                    )}
                    {maliDolduruldu && <p className="text-xs text-green-700 mt-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Kaydedildi</p>}
                  </div>
                </div>
                {showMaliForm && !maliDolduruldu && (
                  <MaliYeterlilikFormu onSave={() => { setMaliDolduruldu(true); setShowMaliForm(false); }} />
                )}
              </div>
            )}

            {/* Ödeme */}
            {(!maliGerekli || maliDolduruldu || skipExperience) && (
              <div className="bg-white rounded-2xl border border-[#0B1D3A]/8 p-6 sm:p-8">
                {odemeTamamlandi ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-base font-semibold text-[#0B1D3A] mb-1">Ödeme Başarılı!</h3>
                    <p className="text-sm text-[#5A6478]">Panele yönlendiriliyorsunuz...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-[#0B1D3A] mb-5">Ödeme</h3>
                    {selectedServiceInfo && (
                      <OdemeFormu fiyat={selectedServiceInfo.price} onSuccess={handleOdemeTamamlandi} />
                    )}
                    <div className="mt-4 text-center">
                      <button onClick={handleViewReport} className="text-sm text-[#5A6478] hover:text-[#0B1D3A] underline">
                        Şimdi ödemek istemiyorum, panele git
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {showErrors && !canAdvance() && (
          <div className="max-w-3xl mx-auto mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">Lütfen tüm zorunlu alanları doldurunuz.</p>
          </div>
        )}
        <div className="flex justify-between mt-4 max-w-3xl mx-auto">
          <button onClick={() => { const min = startFromStep2 ? 2 : 1; if (step > min) { setShowErrors(false); setStep(step - 1); } }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-colors ${step <= (startFromStep2 ? 2 : 1) ? "text-[#5A6478]/40 cursor-not-allowed" : "text-[#0B1D3A] hover:bg-[#E8E6E1]"}`}
            disabled={step <= (startFromStep2 ? 2 : 1)}>
            <ArrowLeft className="w-4 h-4" /> Geri
          </button>
          {step < totalSteps && (
            <button onClick={handleNext} className="bg-[#0B1D3A] hover:bg-[#122A54] text-white px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors">
              İleri <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3"><Award className="w-6 h-6 text-[#C9952B]" /><h3 className="text-white text-lg">Üye Ol</h3></div>
                <button onClick={() => setShowAuthModal(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-white/60 text-sm">Analizinizi görüntülemek için hesap oluşturun.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#F0EDE8] rounded-xl p-4 space-y-2">
                {["Şirket bilgileriniz otomatik kaydedilir", "Süreç takibi yapabilirsiniz", "Raporlarınıza istediğiniz zaman erişin"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#0B1D3A]"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> {t}</div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Ad Soyad <span className="text-[#5A6478]/60">(isteğe bağlı)</span></label>
                <div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
                  <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Adınız Soyadınız" className="w-full pl-10 pr-4 py-2.5 bg-[#F8F7F4] border border-[#0B1D3A]/8 rounded-lg text-sm focus:border-[#C9952B] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">E-posta <span className="text-red-400">*</span></label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
                  <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="ornek@email.com"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:border-[#C9952B] outline-none ${authEmail === email ? "bg-[#F0EDE8] border-[#C9952B]/40" : "bg-[#F8F7F4] border-[#0B1D3A]/8"}`} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Şifre <span className="text-red-400">*</span></label>
                <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="En az 6 karakter" className="w-full px-4 py-2.5 bg-[#F8F7F4] border border-[#0B1D3A]/8 rounded-lg text-sm focus:border-[#C9952B] outline-none" />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Şifre Tekrar <span className="text-red-400">*</span></label>
                <input type="password" value={authPasswordConfirm} onChange={e => setAuthPasswordConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuthAndSave()}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:border-[#C9952B] outline-none ${authPasswordConfirm && authPassword !== authPasswordConfirm ? "bg-red-50 border-red-300" : "bg-[#F8F7F4] border-[#0B1D3A]/8"}`} />
                {authPasswordConfirm && authPassword !== authPasswordConfirm && <p className="text-[10px] text-red-500 mt-1">Şifreler eşleşmiyor.</p>}
              </div>
              {authError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {authError}</div>}
              <button onClick={handleAuthAndSave} disabled={authSubmitting || !authEmail.trim() || !authPassword || !authPasswordConfirm}
                className="w-full bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-300 text-[#0B1D3A] py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {authSubmitting ? "Hesap oluşturuluyor..." : "Üye Ol & Devam Et →"}
              </button>
              <p className="text-center text-[10px] text-[#5A6478]">Zaten hesabınız var mı? <button onClick={() => navigate("/dashboard")} className="text-[#C9952B] hover:underline">Giriş yapın</button></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
