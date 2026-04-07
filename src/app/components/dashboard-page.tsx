import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Award, BarChart3, Building2, FileText, CreditCard, FolderOpen,
  Send, CheckCircle, Lock, Clock, AlertTriangle, ChevronRight,
  LogOut, Plus, Upload, Eye, Download, X, Info, Users,
  ArrowRight, RefreshCw, Trash2, Edit2, Save, Check, ExternalLink, ChevronDown, ChevronUp, Phone
} from "lucide-react";
import { useAuth } from "./auth-context";
import { PdfViewer } from "./pdf-viewer";

/* ─────────────────────────────────────────────────────────────
   STORAGE HELPERS  (Supabase'e geçildi — sadece local state için localStorage)
───────────────────────────────────────────────────────────── */
function loadLS<T = any>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r) as T; } catch {}
  return fb;
}
function saveLS(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}
const MOCK_COMPANIES_KEY = ""; // artık kullanılmıyor
const MOCK_BILLING_KEY   = ""; // artık kullanılmıyor
const MOCK_PROCESS_KEY   = ""; // artık kullanılmıyor

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type DashboardTab = "analiz" | "firma" | "mali" | "odeme" | "rapor" | "evraklar" | "basvuru" | "belge";

type AppStatus =
  | "wizard_incomplete"
  | "pending_financial"
  | "pending_payment"
  | "payment_received"
  | "report_locked"
  | "report_published"
  | "docs_in_progress"
  | "docs_complete"
  | "application_submitted"
  | "certificate_received";

interface Company {
  id: string;
  companyName: string;
  taxId: string;
  phone: string;
  email: string;
  companyType: string;
  location: string;
  city: string;
  group: string;
  partners?: { name: string; sharePercent: string; tcNo?: string }[];
  qualifications?: any;
  selectedService?: string;
  serviceLabel?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  // Dashboard durumu
  appStatus?: AppStatus;
  hizmetModeli?: "biz_yapiyoruz" | "musteri_yapiyor";
  kepAddress?: string;
  isFirstTime?: string;
  [key: string]: any;
}

interface Invoice {
  id: string;
  description: string;
  amount: string;
  status: "paid" | "unpaid" | "overdue";
  date: string;
  dueDate: string;
}

interface ProcessData {
  status: string;
  statusLabel: string;
  statusHistory: { date: string; label: string; note?: string }[];
  certificateNo?: string;
  certificateDate?: string;
  certificateExpiry?: string;
  barcodeNo?: string;
}

interface DocItem {
  id: string;
  baslik: string;
  grubu: string;
  zorunlu: boolean;
  not?: string;
  bankaTutari?: number;
  durum: "bekleniyor" | "yuklendi" | "onaylandi" | "reddedildi";
  dosyaAdi?: string;
  adminNotu?: string;
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const FINANCIAL_REQUIRED = ["F","F1","E","E1","D","D1","C","C1","B","B1","A"];
const BANKA_REFERANS: Record<string, number> = {
  A:123825000,B:86677500,B1:74295000,C:61912500,C1:51593750,
  D:41275000,D1:30956250,E:20637500,E1:12382500,F:6191250,
  F1:5262563,G:4333875,G1:3095625
};

function getStatusFromCompany(c: Company): AppStatus {
  /* Supabase'den app_status direkt geliyor */
  if (c.appStatus) return c.appStatus as AppStatus;
  /* Fallback: şirket var ama status henüz set edilmemiş */
  return "pending_payment";
}

function getTabsVisible(status: AppStatus, group: string): Set<DashboardTab> {
  const tabs = new Set<DashboardTab>(["analiz", "firma"]);
  const needsFinancial = FINANCIAL_REQUIRED.includes(group);

  if (["pending_financial","pending_payment","payment_received","report_locked",
       "report_published","docs_in_progress","docs_complete",
       "application_submitted","certificate_received"].includes(status)) {
    tabs.add("odeme");
    if (needsFinancial) tabs.add("mali");
  }
  if (["payment_received","report_locked","report_published","docs_in_progress",
       "docs_complete","application_submitted","certificate_received"].includes(status)) {
    tabs.add("rapor"); // payment_received ve report_locked'da görünür ama kilitli
  }
  if (["report_published","docs_in_progress","docs_complete",
       "application_submitted","certificate_received"].includes(status)) {
    tabs.add("evraklar");
    tabs.add("basvuru");
  }
  if (status === "certificate_received") {
    tabs.add("belge");
  }
  return tabs;
}

function isTabLocked(tab: DashboardTab, status: AppStatus): boolean {
  if (tab === "rapor" && status === "report_locked") return true;
  if (tab === "mali" && status === "pending_financial") return false; // giriş zorunlu ama kilitli değil
  return false;
}

function tl(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day:"numeric", month:"long", year:"numeric" }); }
  catch { return iso; }
}

/* ─────────────────────────────────────────────────────────────
   TAB LABELS & ICONS
───────────────────────────────────────────────────────────── */
const TAB_CONFIG: Record<DashboardTab, { label: string; icon: React.ElementType }> = {
  analiz:    { label: "Analiz",      icon: BarChart3   },
  firma:     { label: "Firma",       icon: Building2   },
  mali:      { label: "Mali Durum",  icon: CreditCard  },
  odeme:     { label: "Ödeme",       icon: CreditCard  },
  rapor:     { label: "Rapor",       icon: FileText    },
  evraklar:  { label: "Evraklar",    icon: FolderOpen  },
  basvuru:   { label: "Başvuru",     icon: Send        },
  belge:     { label: "Belge",       icon: Award       },
};

const TAB_ORDER: DashboardTab[] = ["analiz","firma","mali","odeme","rapor","evraklar","basvuru","belge"];

/* ─────────────────────────────────────────────────────────────
   STATUS BAR
───────────────────────────────────────────────────────────── */
const STATUS_INFO: Record<AppStatus, { label: string; color: string; bg: string }> = {
  wizard_incomplete:     { label: "Bilgiler eksik",          color: "text-orange-600", bg: "bg-orange-50" },
  pending_financial:     { label: "Mali bilgiler bekleniyor",color: "text-blue-600",   bg: "bg-blue-50"   },
  pending_payment:       { label: "Ödeme bekleniyor",        color: "text-orange-600", bg: "bg-orange-50" },
  payment_received:      { label: "Ödeme alındı",            color: "text-blue-600",   bg: "bg-blue-50"   },
  report_locked:         { label: "Rapor hazırlanıyor",      color: "text-blue-600",   bg: "bg-blue-50"   },
  report_published:      { label: "Rapor yayınlandı",        color: "text-green-600",  bg: "bg-green-50"  },
  docs_in_progress:      { label: "Evraklar toplanıyor",     color: "text-orange-600", bg: "bg-orange-50" },
  docs_complete:         { label: "Evraklar tamam",          color: "text-green-600",  bg: "bg-green-50"  },
  application_submitted: { label: "Başvuru yapıldı",         color: "text-blue-600",   bg: "bg-blue-50"   },
  certificate_received:  { label: "Belge alındı",            color: "text-green-600",  bg: "bg-green-50"  },
};

/* ─────────────────────────────────────────────────────────────
   EVRAK LİSTESİ ÜRETİCİ — güncel evrak açıklamaları
───────────────────────────────────────────────────────────── */
function buildDocList(company: Company, hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor", sonRapor?: any): DocItem[] {
  const biz = hizmetModeli === "biz_yapiyoruz";
  const sahis = company.companyType === "sahis";
  const tuzel = company.companyType === "limited_as" || company.companyType === "kooperatif";
  const qual = (company as any).qualifications;
  const grp = (company as any).hesaplananGrup || company.group;
  const docs: DocItem[] = [];

  const doc = (id: string, baslik: string, grubu: string, not?: string, bankaTutari?: number): DocItem => ({
    id, baslik, grubu, zorunlu: true, not, bankaTutari, durum: "bekleniyor",
  });

  /* ── GRUP 1: Şirket evrakları ── */
  docs.push(doc("mukellefiyet", "Mükellefiyet belgesi", "Şirket evrakları",
    "Dijital vergi dairesinden (dijital.gib.gov.tr) alınır."));
  docs.push(doc("imza", tuzel ? "İmza sirküleri" : "İmza beyannamesi", "Şirket evrakları",
    "Noterde onaylı, güncel tarihli."));

  // Ticaret odası — müşteri başvuruyorsa tüm şirket tipleri
  if (!biz) {
    docs.push(doc("ticaret_odasi", "Ticaret odası kayıt belgesi", "Şirket evrakları",
      "Faaliyet kodu 41.00.01 görünmeli."));
  }
  // Şahıs şirketi bilgi notu — biz yapıyorsak da göster (evrak değil, not)
  // Bakanlık formu — müşteri başvuruyorsa
  if (!biz) {
    docs.push(doc("dilekce", "Bakanlık başvuru formu", "Şirket evrakları",
      "Tarafınıza iletilen şablonu doldurun ve imzalayın."));
    docs.push(doc("ek2", "EK-2 Mali Yeterlilik Formu", "Şirket evrakları",
      "Mali müşavirinizce doldurulmuş ve imzalanmış."));
  }

  /* ── GRUP 2: İş deneyim evrakları — her iş için ayrı ── */
  /* Rapor varsa sadece kullanılan işlerin evraklarını iste */
  const usedExpIds = new Set<string>();
  if (sonRapor) {
    const tercihR = sonRapor.tercih_yontem || sonRapor.tercihYontem || sonRapor.tercihEdilenYontem;
    if (tercihR === "son5") {
      ((sonRapor.y1?.son5YilIsler || sonRapor.is_detaylari || [])).forEach((x: any) => { if (x.id) usedExpIds.add(x.id); });
    } else if (tercihR === "son15") {
      const eb = sonRapor.y2?.enBuyukIs;
      if (eb?.id) usedExpIds.add(eb.id);
    }
  }
  const hasRaporFilter = sonRapor && usedExpIds.size > 0;

  if (qual?.hasYapiIsi && qual?.experiences?.length > 0) {
    qual.experiences.filter((e: any) => !hasRaporFilter || usedExpIds.has(e.id)).forEach((e: any, i: number) => {
      const isNo = i + 1;
      const isLabel = e.adaParsel ? `Ada/Parsel: ${e.adaParsel}` : `İş ${isNo}`;
      const isGrp = `İş deneyimi — ${isLabel}`;

      docs.push(doc(`ruhsat_${i}`, "Yapı ruhsatı", isGrp,
        "Belediyeden alınan projeye ait ruhsat — tadilat ruhsatı varsa onu da ekleyin."));

      // İskan: wizard'dan yüklendiyse bilgi olarak göster, yoksa iste
      const iskanDosya = e.iskanDosyaAdi || null;
      docs.push({
        id: `iskan_${i}`,
        baslik: "İskan belgesi",
        grubu: isGrp,
        zorunlu: true,
        not: iskanDosya
          ? `Wizard'da yüklendi: ${iskanDosya}`
          : "Belediyeden alınan yapı kullanma izin belgesi.",
        durum: iskanDosya ? "yuklendi" : "bekleniyor",
        dosyaAdi: iskanDosya || undefined,
      });

      if ((e.isDeneyimiTipi || e.tip) === "kat_karsiligi") {
        docs.push(doc(`kat_soz_${i}`, "Kat karşılığı sözleşmesi", isGrp,
          "Noterde onaylı inşaat sözleşmesi."));
      }

      docs.push(doc(`ekap_${i}`, "EKAP iş deneyim belgesi", isGrp,
        "Belediyeden alınmış, EKAP'a kayıtlı iş deneyim belgesi."));
    });
  }

  // Diploma
  if (qual?.hasDiploma) {
    docs.push(doc("mezuniyet", "Diploma", "İş deneyimi — Diploma",
      "e-Devlet'ten alınmış mezuniyet belgesi veya noter onaylı diploma nüshası."));
  }

  /* ── GRUP 3: Banka ve mali evraklar ── */
  const maliSart = FINANCIAL_REQUIRED.includes(grp);
  const bankaRef = BANKA_REFERANS[grp];

  if (maliSart) {
    docs.push(doc("bilanco", "Bilanço ve gelir tablosu", "Banka ve mali evraklar",
      "Bir önceki yıla ait (2025 yılı) — dijital vergi dairesinden e-imzalı alınmış."));
  }

  if (bankaRef && grp !== "H") {
    const bankaNum = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(bankaRef);
    docs.push(doc("banka_ref", "Banka referans mektubu", "Banka ve mali evraklar",
      `Asgari tutar: ${bankaNum} ₺ — bankanız tarafından Takasbank sistemine yüklenecektir.`,
      bankaRef));
  }

  return docs;
}

/* ─────────────────────────────────────────────────────────────
   ALT BILEŞENLER
───────────────────────────────────────────────────────────── */

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-[#5A6478] mb-0.5">{label}</p>
      <p className="text-sm text-[#0B1D3A] font-medium">{value || "—"}</p>
      {sub && <p className="text-xs text-[#5A6478] mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: AppStatus }) {
  const info = STATUS_INFO[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${info.bg} ${info.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
}

function DocDurumBadge({ durum }: { durum: DocItem["durum"] }) {
  const cfg = {
    bekleniyor: { cls: "bg-[#F0EDE8] text-[#5A6478]",       label: "Bekleniyor"   },
    yuklendi:   { cls: "bg-amber-50 text-amber-700",          label: "İnceleniyor"  },
    onaylandi:  { cls: "bg-green-50 text-green-700",          label: "Onaylandı"    },
    reddedildi: { cls: "bg-red-50 text-red-600",             label: "Hatalı"       },
  }[durum];
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

/* ─────────────────────────────────────────────────────────────
   TAB İÇERİKLERİ
───────────────────────────────────────────────────────────── */

/* ── ANALİZ ── */
function TabAnaliz({ company, status, setActiveTab }: { company: Company; status: AppStatus; setActiveTab?: (t: DashboardTab) => void }) {
  const qual = company.qualifications;
  const expCount = (qual?.experiences || []).length;
  const hasDip = qual?.hasDiploma && qual?.diploma;

  return (
    <div className="space-y-5">
      {/* Durum kartı */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-[#5A6478] mb-1">Başvuru durumu</p>
            <StatusBadge status={status} />
          </div>
          <div className="text-right">
            <p className="text-xs text-[#5A6478] mb-1">Hedef grup</p>
            <span className="inline-block px-3 py-1 rounded-full bg-[#C9952B]/10 text-[#C9952B] text-sm font-bold">
              {company.group || "Analiz bekleniyor"}
            </span>
          </div>
        </div>

        {status === "wizard_incomplete" && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-700">Başvuru formu eksik</p>
              <p className="text-xs text-orange-600 mt-0.5">Hesaplama başlatılması için başvuru formunu tamamlayınız.</p>
            </div>
          </div>
        )}

        {["report_published","docs_in_progress","docs_complete","application_submitted","certificate_received"].includes(status) && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Hesaplama tamamlandı</p>
              <p className="text-xs text-green-600 mt-0.5">Detayları Rapor sekmesinden inceleyebilirsiniz.</p>
            </div>
          </div>
        )}
      </div>

      {/* İş deneyimi özeti — Firma sekmesine yönlendirme */}
      {(() => {
        return (
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0B1D3A]">İş Deneyimi & Diploma</h3>
              <div className="flex items-center gap-3 text-xs text-[#5A6478]">
                <span>{expCount} iş deneyimi</span>
                {hasDip && <span>· Diploma mevcut</span>}
              </div>
            </div>
            <p className="text-xs text-[#5A6478] mb-3">İş deneyimi ve diploma bilgilerinizi Firma sekmesinden yönetebilirsiniz.</p>
            {setActiveTab && (
              <button onClick={() => setActiveTab("firma")} className="text-xs text-[#C9952B] hover:underline font-medium flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5" /> Firma sekmesine git
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}

/* ── FİRMA ── */
function TabFirma({ company, onRefresh, status, setActiveTab }: { company: Company; onRefresh?: () => void; status?: AppStatus; setActiveTab?: (t: DashboardTab) => void }) {
  const tuzel = company.companyType === "limited_as" || company.companyType === "as";
  const isSahis = company.companyType === "sahis";
  const typeLabel: Record<string, string> = { sahis: "Şahıs şirketi", limited_as: "Limited / A.Ş.", kooperatif: "Kooperatif" };

  /* ── Firma bilgileri düzenleme ── */
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ companyName: company.companyName, phone: company.phone, email: company.email, kepAddress: company.kepAddress || "", city: company.city || "" });
  const [saving, setSaving] = useState(false);

  // company prop değişince formu güncelle (yenileme sonrası)
  useEffect(() => {
    setForm({ companyName: company.companyName, phone: company.phone, email: company.email, kepAddress: company.kepAddress || "", city: company.city || "" });
  }, [company]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { supabase: sb } = await import("./supabase-client");
      await sb.from("companies").update({
        company_name: form.companyName,
        phone: form.phone,
        email: form.email,
        kep_address: form.kepAddress || null,
        city: form.city || null,
        guncelleme: new Date().toISOString()
      }).eq("id", company.id);
      setEditing(false); onRefresh?.();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  /* ── İş deneyimi CRUD ── */
  const qual = company.qualifications;
  const locked = ["payment_received", "report_locked"].includes(status || "");
  const [expModal, setExpModal] = useState<any | null>(null);
  const [expForm, setExpForm] = useState({ isDeneyimiTipi: "kat_karsiligi" as string, adaParsel: "", sozlesmeTarihi: "", iskanTarihi: "", insaatAlaniM2: "", yapiYuksekligiM: "", yapiSinifi: "III.B", yapiTipi: "konut", taahhutBedeli: "", muteahhitArsaAyni: false });
  const [expSaving, setExpSaving] = useState(false);

  const openNewExp = (tipi: string) => { setExpForm({ isDeneyimiTipi: tipi, adaParsel: "", sozlesmeTarihi: "", iskanTarihi: "", insaatAlaniM2: "", yapiYuksekligiM: "", yapiSinifi: "III.B", yapiTipi: "konut", taahhutBedeli: "", muteahhitArsaAyni: false }); setExpModal({}); };
  const openEditExp = (exp: any) => { setExpForm({ isDeneyimiTipi: exp.isDeneyimiTipi || "kat_karsiligi", adaParsel: exp.adaParsel || "", sozlesmeTarihi: exp.sozlesmeTarihi || "", iskanTarihi: exp.iskanTarihi || "", insaatAlaniM2: exp.insaatAlaniM2 || "", yapiYuksekligiM: exp.yapiYuksekligiM || "", yapiSinifi: exp.yapiSinifi || "III.B", yapiTipi: exp.yapiTipi || "konut", taahhutBedeli: exp.taahhutBedeli || "", muteahhitArsaAyni: exp.muteahhitArsaAyni || false }); setExpModal(exp); };
  const handleExpSave = async () => {
    setExpSaving(true);
    try {
      const { supabase: sb } = await import("./supabase-client");
      const payload = { company_id: company.id, is_deneyimi_tipi: expForm.isDeneyimiTipi, ada_parsel: expForm.adaParsel || null, sozlesme_tarihi: expForm.sozlesmeTarihi || null, iskan_tarihi: expForm.iskanTarihi || null, insaat_alani_m2: expForm.insaatAlaniM2 ? parseFloat(expForm.insaatAlaniM2) : null, yapi_yuksekligi_m: expForm.yapiYuksekligiM ? parseFloat(expForm.yapiYuksekligiM) : null, yapi_sinifi: expForm.yapiSinifi || null, yapi_tipi: expForm.yapiTipi || null, taahhut_bedeli: expForm.taahhutBedeli ? parseFloat(expForm.taahhutBedeli.replace(/\./g, "")) : null, muteahhit_arsa_ayni: expForm.muteahhitArsaAyni, guncelleme: new Date().toISOString() };
      if (expModal?.id) await sb.from("experiences").update(payload).eq("id", expModal.id);
      else await sb.from("experiences").insert(payload);
      setExpModal(null); onRefresh?.();
    } catch (e) { console.error(e); }
    setExpSaving(false);
  };
  const handleExpDelete = async (id: string) => {
    if (!confirm("Bu iş deneyimini silmek istediğinize emin misiniz?")) return;
    try { const { supabase: sb } = await import("./supabase-client"); await sb.from("experiences").delete().eq("id", id); onRefresh?.(); } catch (e) { console.error(e); }
  };

  /* ── Diploma CRUD ── */
  const [dipModal, setDipModal] = useState(false);
  const diploma = qual?.diploma;
  const [dipForm, setDipForm] = useState({ partnerName: diploma?.partnerName || (isSahis ? company.companyName : ""), department: diploma?.department || "", gradDate: diploma?.gradDate || "" });
  const [dipSaving, setDipSaving] = useState(false);
  const handleDipSave = async () => {
    setDipSaving(true);
    try {
      const { supabase: sb } = await import("./supabase-client");
      await sb.from("diplomas").delete().eq("company_id", company.id);
      await sb.from("diplomas").insert({ company_id: company.id, partner_name: isSahis ? company.companyName : dipForm.partnerName, department: dipForm.department, grad_date: dipForm.gradDate });
      setDipModal(false); onRefresh?.();
    } catch (e) { console.error(e); }
    setDipSaving(false);
  };
  const handleDipDelete = async () => {
    if (!confirm("Diploma bilgisini silmek istediğinize emin misiniz?")) return;
    try { const { supabase: sb } = await import("./supabase-client"); await sb.from("diplomas").delete().eq("company_id", company.id); onRefresh?.(); } catch (e) { console.error(e); }
  };

  /* ── Ortak düzenleme ── */
  const [editingPartners, setEditingPartners] = useState(false);
  const [partnerDraft, setPartnerDraft] = useState<{ id: string; name: string; sharePercent: string; tcNo: string }[]>([]);
  const [partnerSaving, setPartnerSaving] = useState(false);
  const handlePartnerSave = async () => {
    setPartnerSaving(true);
    try {
      const { supabase: sb } = await import("./supabase-client");
      const payload = partnerDraft.filter(p => p.name.trim()).map(p => ({ name: p.name, sharePercent: p.sharePercent, tcNo: p.tcNo }));
      await sb.from("companies").update({ partners: payload, guncelleme: new Date().toISOString() }).eq("id", company.id);
      setEditingPartners(false); onRefresh?.();
    } catch (e) { console.error(e); }
    setPartnerSaving(false);
  };

  /* ── Hesaplama Yaptır ── */
  const [hesapLoading, setHesapLoading] = useState(false);
  const canRequestCalc = !locked && ["wizard_incomplete", "pending_payment", "report_published", "docs_complete", "application_submitted", "certificate_received"].includes(status || "");
  const expCount = (qual?.experiences || []).length;
  const hasChanges = expCount > 0 || !!diploma;

  const handleHesaplamaYaptir = async () => {
    setHesapLoading(true);
    try {
      const { supabase: sb, adminAddBilling, adminUpdateStatus } = await import("./supabase-client");
      const fiyatlar: Record<string, number> = { bilgi_alma: 7000, sadece_hesaplama: 11000, hesaplama_basvuru: 20000, h_grubu: 12000 };
      const mevcutPaket = company.selectedService || "h_grubu";
      const yeniPaket = expCount > 0 ? (company.hizmetModeli === "biz_yapiyoruz" ? "hesaplama_basvuru" : "sadece_hesaplama") : "h_grubu";
      const labels: Record<string, string> = { bilgi_alma: "Bilgi Alma Danışmanlığı", sadece_hesaplama: "İş Deneyim Hesaplama", hesaplama_basvuru: "Tam Hizmet — Hesaplama & Başvuru", h_grubu: "H Grubu Başvuru" };
      const fark = Math.max(0, (fiyatlar[yeniPaket] || 0) - (fiyatlar[mevcutPaket] || 0));
      if (fark > 0) {
        const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        await adminAddBilling(company.id, `Paket yükseltme: ${labels[yeniPaket]}`, fark, dueDate);
      }
      await sb.from("companies").update({ selected_service: yeniPaket, service_label: labels[yeniPaket], guncelleme: new Date().toISOString() }).eq("id", company.id);
      await adminUpdateStatus(company.id, "pending_payment", "Hesaplama talebi oluşturuldu", fark > 0 ? `Fark faturası: ${fark.toLocaleString("tr-TR")} ₺` : "Ek ücret yok");
      onRefresh?.();
    } catch (e) { console.error(e); }
    setHesapLoading(false);
  };

  /* ── İş deneyimi verileri ── */
  const allExps = qual?.experiences || [];
  const katExps = allExps.filter((e: any) => (e.isDeneyimiTipi || e.is_deneyimi_tipi) !== "taahhut");
  const taahhutExps = allExps.filter((e: any) => (e.isDeneyimiTipi || e.is_deneyimi_tipi) === "taahhut");

  const ExpCard = ({ exp, idx, typeLabel: tl }: { exp: any; idx: number; typeLabel: string }) => (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E4DC] bg-white hover:border-[#C9952B]/30 transition-colors group">
      <div className={`w-9 h-9 rounded-xl ${(exp.isDeneyimiTipi || exp.is_deneyimi_tipi) === "taahhut" ? "bg-[#C9952B]" : "bg-[#0B1D3A]"} text-white text-xs font-bold flex items-center justify-center shrink-0`}>{idx + 1}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[#0B1D3A] truncate">{exp.adaParsel || exp.ada_parsel || `${tl} ${idx + 1}`}</span>
          {(exp.buildingClass || exp.yapiSinifi) && <span className="text-[10px] bg-[#C9952B]/10 text-[#C9952B] px-1.5 py-0.5 rounded font-bold">{exp.buildingClass || exp.yapiSinifi}</span>}
        </div>
        <div className="flex flex-wrap gap-x-3 text-[11px] text-[#5A6478] mt-0.5">
          {(exp.contractDate || exp.sozlesmeTarihi) && <span>Sözleşme: {exp.contractDate || exp.sozlesmeTarihi}</span>}
          {(exp.totalArea || exp.insaatAlaniM2) && <span>{exp.totalArea || exp.insaatAlaniM2} m²</span>}
          {exp.taahhutBedeli && <span>{Number(exp.taahhutBedeli).toLocaleString("tr-TR")} ₺</span>}
        </div>
      </div>
      {!locked && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => openEditExp(exp)} className="p-1.5 text-[#5A6478] hover:text-[#C9952B] rounded-lg hover:bg-[#C9952B]/10"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleExpDelete(exp.id)} className="p-1.5 text-[#5A6478] hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {locked && <Lock className="w-3.5 h-3.5 text-[#5A6478]/40 shrink-0" />}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ═══ 1. Firma bilgileri ═══ */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[#0B1D3A]">Firma bilgileri</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-xs text-[#C9952B] hover:underline flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Düzenle</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-xs text-[#5A6478] hover:underline">İptal</button>
              <button onClick={handleSave} disabled={saving} className="text-xs bg-[#C9952B] text-white px-3 py-1 rounded-lg hover:bg-[#B8862A] flex items-center gap-1"><Save className="w-3 h-3" /> {saving ? "..." : "Kaydet"}</button>
            </div>
          )}
        </div>
        {editing ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="text-xs text-[#5A6478] block mb-1">Unvan</label><input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="w-full px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" /></div>
            <div className="flex flex-col justify-center">
              <p className="text-xs text-[#5A6478] mb-0.5">Firma tipi</p>
              <p className="text-sm text-[#0B1D3A] font-medium bg-[#F8F7F4] px-3 py-2 rounded-lg">{typeLabel[company.companyType] || company.companyType || "—"}</p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs text-[#5A6478] mb-0.5">Vergi kimlik no</p>
              <p className="text-sm text-[#0B1D3A] font-medium bg-[#F8F7F4] px-3 py-2 rounded-lg">{company.taxId || "—"}</p>
            </div>
            <div><label className="text-xs text-[#5A6478] block mb-1">Telefon</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" /></div>
            <div><label className="text-xs text-[#5A6478] block mb-1">E-posta</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" /></div>
            {company.location === "istanbul_disi" && (
              <div><label className="text-xs text-[#5A6478] block mb-1">Şehir</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ankara" className="w-full px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" /></div>
            )}
            <div><label className="text-xs text-[#5A6478] block mb-1">KEP adresi</label><input value={form.kepAddress} onChange={e => setForm(f => ({ ...f, kepAddress: e.target.value }))} placeholder="firma@hs01.kep.tr" className="w-full px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" /></div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            <InfoCard label="Unvan" value={company.companyName} />
            <InfoCard label="Firma tipi" value={typeLabel[company.companyType] || company.companyType} />
            <InfoCard label="Vergi kimlik no" value={company.taxId} />
            <InfoCard label="Telefon" value={company.phone} />
            <InfoCard label="E-posta" value={company.email} />
            <InfoCard label="Şehir" value={company.location === "istanbul" ? "İstanbul" : (company.city || "—")} />
            <InfoCard label="KEP adresi" value={company.kepAddress || "—"} />
            <InfoCard label="Seçilen hizmet" value={company.serviceLabel || "—"} />
          </div>
        )}
      </div>

      {/* Ortaklar */}
      {tuzel && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0B1D3A] flex items-center gap-2"><Users className="w-4 h-4 text-[#C9952B]" /> Ortak bilgileri</h3>
            {!editingPartners ? (
              <button onClick={() => { setPartnerDraft((company.partners || []).map((p, i) => ({ id: String(i), name: p.name || "", sharePercent: p.sharePercent || "", tcNo: p.tcNo || "" }))); setEditingPartners(true); }} className="text-xs text-[#C9952B] hover:underline flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Düzenle</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingPartners(false)} className="text-xs text-[#5A6478] hover:underline">İptal</button>
                <button onClick={handlePartnerSave} disabled={partnerSaving} className="text-xs bg-[#C9952B] text-white px-3 py-1 rounded-lg hover:bg-[#B8862A] flex items-center gap-1"><Save className="w-3 h-3" /> {partnerSaving ? "..." : "Kaydet"}</button>
              </div>
            )}
          </div>
          {!editingPartners ? (
            <div className="divide-y divide-[#F0EDE8]">
              {(company.partners || []).length > 0 ? company.partners!.map((p, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                  <div><p className="text-sm font-medium text-[#0B1D3A]">{p.name || "—"}</p>{p.tcNo && <p className="text-xs text-[#5A6478]">TC: {p.tcNo}</p>}</div>
                  <span className="text-sm font-bold text-[#C9952B]">%{p.sharePercent}</span>
                </div>
              )) : (
                <p className="px-5 py-4 text-xs text-[#5A6478]">Ortak bilgisi girilmemiş.</p>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {partnerDraft.map((p, i) => (
                <div key={p.id} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 bg-[#F8F7F4] p-3 rounded-xl">
                  <div><label className="text-[10px] text-[#5A6478] block mb-1">Ad Soyad</label><input value={p.name} onChange={e => setPartnerDraft(d => d.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="w-full px-2 py-1.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" /></div>
                  <div><label className="text-[10px] text-[#5A6478] block mb-1">TC Kimlik</label><input value={p.tcNo} onChange={e => setPartnerDraft(d => d.map((x, j) => j === i ? { ...x, tcNo: e.target.value.replace(/\D/g,"").slice(0,11) } : x))} placeholder="11 hane" className="w-full px-2 py-1.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" /></div>
                  <div><label className="text-[10px] text-[#5A6478] block mb-1">Hisse %</label><input value={p.sharePercent} onChange={e => setPartnerDraft(d => d.map((x, j) => j === i ? { ...x, sharePercent: e.target.value.replace(/\D/g,"").slice(0,3) } : x))} placeholder="50" className="w-full px-2 py-1.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" /></div>
                  <button onClick={() => { if (partnerDraft.length > 1) setPartnerDraft(d => d.filter((_, j) => j !== i)); }} className="self-end mb-1 p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={() => setPartnerDraft(d => [...d, { id: String(Date.now()), name: "", sharePercent: "", tcNo: "" }])} className="text-xs text-[#C9952B] flex items-center gap-1 hover:underline"><Plus className="w-3.5 h-3.5" /> Ortak ekle</button>
            </div>
          )}
        </div>
      )}

      {/* Kilitleme uyarısı */}
      {locked && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-700">Raporunuz hazırlanıyor</p>
            <p className="text-xs text-blue-600 mt-0.5">İş deneyimi değişikliği rapor yayınlandıktan sonra yapılabilir.</p>
          </div>
        </div>
      )}

      {/* ═══ 2. İş deneyimleri ═══ */}
      <div className="space-y-4">
        {/* Kat Karşılığı */}
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0B1D3A] flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-white" /></div>
              <h3 className="text-sm font-semibold text-[#0B1D3A]">Kat Karşılığı İşleri</h3>
              {katExps.length > 0 && <span className="text-[10px] bg-[#C9952B]/10 text-[#C9952B] px-1.5 py-0.5 rounded-full font-bold">{katExps.length}</span>}
            </div>
            {!locked && <button onClick={() => openNewExp("kat_karsiligi")} className="text-xs text-[#C9952B] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#C9952B]/20 hover:bg-[#C9952B]/5"><Plus className="w-3.5 h-3.5" /> Ekle</button>}
          </div>
          <div className="p-4 space-y-2">
            {katExps.length > 0 ? katExps.map((exp: any, i: number) => <ExpCard key={exp.id || i} exp={exp} idx={i} typeLabel="Kat karşılığı" />) : (
              <p className="text-xs text-[#5A6478] text-center py-4">Henüz kat karşılığı iş eklenmemiş.</p>
            )}
          </div>
        </div>

        {/* Taahhüt */}
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#C9952B] flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-white" /></div>
              <h3 className="text-sm font-semibold text-[#0B1D3A]">Taahhüt İşleri</h3>
              {taahhutExps.length > 0 && <span className="text-[10px] bg-[#C9952B]/10 text-[#C9952B] px-1.5 py-0.5 rounded-full font-bold">{taahhutExps.length}</span>}
            </div>
            {!locked && <button onClick={() => openNewExp("taahhut")} className="text-xs text-[#C9952B] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#C9952B]/20 hover:bg-[#C9952B]/5"><Plus className="w-3.5 h-3.5" /> Ekle</button>}
          </div>
          <div className="p-4 space-y-2">
            {taahhutExps.length > 0 ? taahhutExps.map((exp: any, i: number) => <ExpCard key={exp.id || i} exp={exp} idx={i} typeLabel="Taahhüt" />) : (
              <p className="text-xs text-[#5A6478] text-center py-4">Henüz taahhüt işi eklenmemiş.</p>
            )}
          </div>
        </div>

        {/* Diploma */}
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center"><Award className="w-3.5 h-3.5 text-white" /></div>
              <h3 className="text-sm font-semibold text-[#0B1D3A]">Diploma</h3>
              {diploma && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Mevcut</span>}
            </div>
            {!locked && !diploma && <button onClick={() => { setDipForm({ partnerName: isSahis ? company.companyName : "", department: "", gradDate: "" }); setDipModal(true); }} className="text-xs text-[#C9952B] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#C9952B]/20 hover:bg-[#C9952B]/5"><Plus className="w-3.5 h-3.5" /> Ekle</button>}
          </div>
          <div className="p-4">
            {diploma ? (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 group">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><Award className="w-4 h-4 text-blue-600" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0B1D3A]">{diploma.partnerName || "—"}</p>
                  <p className="text-xs text-[#5A6478] mt-0.5">
                    {diploma.department === "insaat_muhendisligi" ? "İnşaat Mühendisliği" : "Mimarlık"}
                    {diploma.gradDate && ` · Mezuniyet: ${diploma.gradDate}`}
                  </p>
                </div>
                {!locked && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setDipForm({ partnerName: diploma.partnerName || "", department: diploma.department || "", gradDate: diploma.gradDate || "" }); setDipModal(true); }} className="p-1.5 text-[#5A6478] hover:text-[#C9952B] rounded-lg hover:bg-[#C9952B]/10"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={handleDipDelete} className="p-1.5 text-[#5A6478] hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#5A6478] text-center py-4">Diploma bilgisi girilmemiş.</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ 3. Hesaplama Yaptır butonu ═══ */}
      {canRequestCalc && hasChanges && (
        <button onClick={handleHesaplamaYaptir} disabled={hesapLoading}
          className="w-full bg-gradient-to-r from-[#0B1D3A] to-[#122A54] text-white py-3.5 rounded-2xl text-sm font-medium hover:from-[#122A54] hover:to-[#1A3A6E] transition-all flex items-center justify-center gap-2 shadow-lg">
          {hesapLoading ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> İşleniyor...</> : <><BarChart3 className="w-4 h-4" /> Hesaplama Yaptır</>}
        </button>
      )}

      {/* ═══ İş deneyimi modal ═══ */}
      {expModal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setExpModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">{expModal?.id ? "İş Deneyimi Düzenle" : "Yeni İş Deneyimi Ekle"}</h3>
                <p className="text-white/40 text-xs mt-0.5">{expForm.isDeneyimiTipi === "taahhut" ? "Taahhüt işi" : "Kat karşılığı işi"}</p>
              </div>
              <button onClick={() => setExpModal(null)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-[#5A6478] block mb-1.5 font-medium">İş türü</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: "kat_karsiligi", l: "Kat karşılığı", desc: "Arsa sahibiyle anlaşma" }, { v: "taahhut", l: "Taahhüt", desc: "İhale veya özel sözleşme" }].map(t => (
                    <button key={t.v} onClick={() => setExpForm(f => ({ ...f, isDeneyimiTipi: t.v }))}
                      className={`p-3 rounded-xl text-left border-2 transition-all ${expForm.isDeneyimiTipi === t.v ? "border-[#C9952B] bg-[#C9952B]/5" : "border-[#E8E4DC]"}`}>
                      <p className={`text-sm font-medium ${expForm.isDeneyimiTipi === t.v ? "text-[#0B1D3A]" : "text-[#5A6478]"}`}>{t.l}</p>
                      <p className="text-[10px] text-[#5A6478] mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Ada / Parsel *</label><input value={expForm.adaParsel} onChange={e => setExpForm(f => ({ ...f, adaParsel: e.target.value }))} placeholder="123/4" className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Sözleşme tarihi *</label><input type="date" value={expForm.sozlesmeTarihi} onChange={e => setExpForm(f => ({ ...f, sozlesmeTarihi: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none" /></div>
                <div><label className="text-xs text-[#5A6478] block mb-1.5 font-medium">İskan tarihi</label><input type="date" value={expForm.iskanTarihi} onChange={e => setExpForm(f => ({ ...f, iskanTarihi: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none" /></div>
              </div>
              {expForm.isDeneyimiTipi === "kat_karsiligi" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-[#5A6478] block mb-1.5 font-medium">İnşaat alanı (m²) *</label><input value={expForm.insaatAlaniM2} onChange={e => setExpForm(f => ({ ...f, insaatAlaniM2: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none" /></div>
                    <div><label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Yapı yüksekliği (m)</label><input value={expForm.yapiYuksekligiM} onChange={e => setExpForm(f => ({ ...f, yapiYuksekligiM: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Yapı sınıfı *</label><select value={expForm.yapiSinifi} onChange={e => setExpForm(f => ({ ...f, yapiSinifi: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none bg-white">{["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D","V.E"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Yapı tipi</label><select value={expForm.yapiTipi} onChange={e => setExpForm(f => ({ ...f, yapiTipi: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none bg-white">{[["konut","Konut"],["konut_ticari","Konut+Ticari"],["ticari","Ticari"],["sanayi","Sanayi"],["otel","Otel"],["hastane","Hastane"],["avm","AVM"],["diger","Diğer"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                  </div>
                  {/* Arsa sahibi / müteahhit aynı */}
                  <div onClick={() => setExpForm(f => ({ ...f, muteahhitArsaAyni: !f.muteahhitArsaAyni }))} className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl cursor-pointer mt-1">
                    <div className={`w-8 h-[18px] rounded-full relative transition-colors ${expForm.muteahhitArsaAyni ? "bg-[#C9952B]" : "bg-[#E8E4DC]"}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all shadow-sm ${expForm.muteahhitArsaAyni ? "left-4" : "left-[2px]"}`} />
                    </div>
                    <span className="text-xs text-[#5A6478]">Müteahhit ve arsa sahibi aynı kişi / firma</span>
                  </div>
                </>
              )}
              {expForm.isDeneyimiTipi === "taahhut" && (
                <div><label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Taahhüt bedeli (₺) *</label><input value={expForm.taahhutBedeli} onChange={e => setExpForm(f => ({ ...f, taahhutBedeli: e.target.value }))} placeholder="5.000.000" className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none" /></div>
              )}
              {/* İskan belgesi uyarısı */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">İskan belgesi zorunludur. Belgeyi evraklar sekmesinden yükleyebilirsiniz.</p>
              </div>
              <button onClick={handleExpSave} disabled={expSaving} className="w-full bg-[#0B1D3A] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#122A54] transition-colors flex items-center justify-center gap-2">
                {expSaving ? "Kaydediliyor..." : expModal?.id ? "Güncelle" : "Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Diploma modal ═══ */}
      {dipModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDipModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-5 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-white font-bold">{diploma ? "Diploma Düzenle" : "Diploma Ekle"}</h3>
              <button onClick={() => setDipModal(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!isSahis && (
                <div>
                  <label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Diploma sahibi ortağın adı *</label>
                  {tuzel && company.partners && company.partners.length > 0 ? (
                    <select value={dipForm.partnerName} onChange={e => setDipForm(f => ({ ...f, partnerName: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none bg-white">
                      <option value="">Seçiniz</option>
                      {company.partners.filter(p => p.name.trim()).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  ) : (
                    <input value={dipForm.partnerName} onChange={e => setDipForm(f => ({ ...f, partnerName: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none" />
                  )}
                </div>
              )}
              {isSahis && (
                <div>
                  <label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Diploma sahibi</label>
                  <div className="px-3 py-2.5 bg-[#F8F7F4] rounded-xl text-sm text-[#0B1D3A]">{company.companyName}</div>
                </div>
              )}
              <div>
                <label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Bölüm *</label>
                <select value={dipForm.department} onChange={e => setDipForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none bg-white">
                  <option value="">Seçiniz</option><option value="insaat_muhendisligi">İnşaat Mühendisliği</option><option value="mimarlik">Mimarlık</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#5A6478] block mb-1.5 font-medium">Mezuniyet tarihi *</label>
                <input type="date" value={dipForm.gradDate} onChange={e => setDipForm(f => ({ ...f, gradDate: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:border-[#C9952B] focus:outline-none" />
              </div>
              <button onClick={handleDipSave} disabled={dipSaving} className="w-full bg-[#0B1D3A] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#122A54] transition-colors">
                {dipSaving ? "Kaydediliyor..." : diploma ? "Güncelle" : "Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MALİ DURUM ── */

/* ── MALİ YETERLİLİK — müşteriden e-bilanço PDF iste ── */
function TabMali({ company, onStatusChange }: { company: Company; onStatusChange: () => void }) {
  const MALI_DOCS_KEY = "musteri_mali_docs";
  const [yukluler, setYukluler] = useState<{bilancoFile?:string; gelirFile?:string; banka?:string}>(
    () => loadLS(`${MALI_DOCS_KEY}_${company.id}`, {})
  );
  const [saved, setSaved] = useState(false);

  const handleYukle = (field: string, file: File) => {
    const yeni = { ...yukluler, [field]: file.name };
    setYukluler(yeni);
    saveLS(`${MALI_DOCS_KEY}_${company.id}`, yeni);
  };

  const MALI_BELGELER = [
    { key: "bilancoFile", baslik: "Bilanço ve Gelir Tablosu", aciklama: "Bir önceki yıla ait (2025 yılı) — dijital vergi dairesinden e-imzalı alınmış.", nasil: "dijital.gib.gov.tr > e-Arşiv > Bilanço bölümünden indirin. Mali müşavir onaylı da kabul edilir.", zorunlu: true },
    { key: "gelirFile",   baslik: "Vergi Beyannamesi (varsa)", aciklama: "Son yıla ait kurumlar veya gelir vergisi beyannamesi.", nasil: "e-Devlet üzerinden veya muhasebecinizdEn temin edebilirsiniz.", zorunlu: false },
    { key: "banka",       baslik: "Banka Referans Mektubu", aciklama: "Grubu F1 ve üzeri başvurular için zorunludur. Takasbank'a da yüklenecektir.", nasil: "Bankanızın kurumsal şubesine müracaat ederek talep edin. Orijinal veya noter onaylı.", zorunlu: true },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 mb-1">Mali Yeterlilik Belgeleri</p>
          <p className="text-xs text-amber-700">
            Aşağıdaki belgeleri ekibimize iletiniz. Mali yeterlilik analizi ekibimiz tarafından yapılacaktır. 
            Bir önceki yıla ait (2025 yılı) bilanço ve gelir tablosu dijital vergi dairesinden e-imzalı alınmalıdır.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {MALI_BELGELER.map(({ key, baslik, aciklama, nasil, zorunlu }) => {
          const yuklendi = (yukluler as any)[key];
          return (
            <div key={key} className={`bg-white rounded-xl border overflow-hidden ${yuklendi ? "border-green-200" : "border-[#E8E4DC]"}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#0B1D3A]">{baslik}</span>
                      {!zorunlu && <span className="text-[10px] bg-[#F0EDE8] text-[#5A6478] px-2 py-0.5 rounded-full">Opsiyonel</span>}
                      {zorunlu && !yuklendi && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Gerekli</span>}
                    </div>
                    <p className="text-xs text-[#5A6478]">{aciklama}</p>
                  </div>
                  {yuklendi && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700">Yüklendi</span>
                    </div>
                  )}
                </div>

                {yuklendi ? (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
                    <FileText className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-sm text-green-800 flex-1 truncate">{yuklendi}</span>
                    <button onClick={() => { const y={...yukluler}; delete (y as any)[key]; setYukluler(y); saveLS(`${MALI_DOCS_KEY}_${company.id}`,y); }}
                      className="text-green-600 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-[#F8F7F4] rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-[#0B1D3A] mb-1">Nereden alınır?</p>
                      <p className="text-xs text-[#5A6478]">{nasil}</p>
                    </div>
                    <label className="flex items-center gap-3 border-2 border-dashed border-[#0B1D3A]/15 hover:border-[#C9952B]/50 rounded-xl px-4 py-3 cursor-pointer transition-colors group">
                      <Upload className="w-4 h-4 text-[#5A6478] group-hover:text-[#C9952B] shrink-0" />
                      <div>
                        <p className="text-sm text-[#5A6478] group-hover:text-[#0B1D3A]">PDF olarak yükleyin</p>
                        <p className="text-xs text-[#5A6478]/60">Maks 10 MB</p>
                      </div>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleYukle(key, f); }} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#0B1D3A]/5 border border-[#0B1D3A]/10 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#0B1D3A]/50 shrink-0 mt-0.5" />
        <p className="text-xs text-[#5A6478] leading-relaxed">
          Belgeleriniz ekibimize iletildikten sonra mali yeterlilik analizi yapılacak ve sonuç rapor sekmesinde görüntülenecektir.
          Sorularınız için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}

/* ── ÖDEME SEKMESİ ── */
function TabOdeme({ company, invoices }: { company: Company; invoices: Invoice[] }) {
  const tlFmt = (n: number) => n.toLocaleString("tr-TR") + " ₺";
  const totalPaid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amountNum || 0), 0);
  const totalPending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.amountNum || 0), 0);

  const statusMap: Record<string, { label: string; cls: string }> = {
    paid:    { label: "Ödendi",       cls: "bg-green-50 text-green-700 border-green-200" },
    unpaid:  { label: "Bekliyor",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
    overdue: { label: "Vadesi Geçti", cls: "bg-red-50 text-red-600 border-red-200" },
  };

  return (
    <div className="space-y-5">
      {/* Özet */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-green-600 text-xs mb-1">Ödenen</p>
          <p className="text-green-800 text-xl font-bold">{tlFmt(totalPaid)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-amber-600 text-xs mb-1">Bekleyen</p>
          <p className="text-amber-800 text-xl font-bold">{tlFmt(totalPending)}</p>
        </div>
      </div>

      {/* Fatura listesi */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 text-center">
          <CreditCard className="w-10 h-10 text-[#E8E4DC] mx-auto mb-3" />
          <p className="text-sm text-[#5A6478]">Henüz fatura bulunmuyor.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC] bg-[#F8F7F4]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">Faturalar</h3>
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {invoices.map(inv => (
              <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0B1D3A]">{inv.description}</p>
                  <p className="text-xs text-[#5A6478] mt-0.5">
                    {inv.date ? new Date(inv.date).toLocaleDateString("tr-TR") : ""}
                    {inv.dueDate ? ` · Vade: ${new Date(inv.dueDate).toLocaleDateString("tr-TR")}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#0B1D3A]">{tlFmt(inv.amountNum || 0)}</p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusMap[inv.status]?.cls || statusMap.unpaid.cls}`}>
                    {statusMap[inv.status]?.label || "Bekliyor"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ödeme bilgileri */}
      {totalPending > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IBAN ile ödeme */}
          <div className="bg-[#0B1D3A] rounded-2xl p-5 text-white">
            <h3 className="text-sm font-semibold mb-3">Havale / EFT</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Banka</span>
                <span>Ziraat Bankası</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Alıcı</span>
                <span>Müteahhitlik Belgesi Danışmanlık</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">IBAN</span>
                <span className="font-mono text-xs">TR00 0000 0000 0000 0000 0000 00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Açıklama</span>
                <span className="text-[#C9952B] font-medium">{company.companyName}</span>
              </div>
            </div>
          </div>

          {/* Kartla ödeme */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
            <h3 className="text-sm font-semibold text-[#0B1D3A] mb-3">Kartla Öde</h3>
            <p className="text-xs text-[#5A6478] mb-4">Kredi veya banka kartı ile ödeme yapmak için bizimle iletişime geçin.</p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700 font-medium">Bekleyen tutar: <span className="text-amber-900 font-bold">{tlFmt(totalPending)}</span></p>
            </div>
            <a href="https://wa.me/905000000000?text=Merhaba%2C%20kart%20ile%20%C3%B6deme%20yapmak%20istiyorum." target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium py-2.5 rounded-xl text-sm transition-colors">
              <Phone className="w-4 h-4" /> WhatsApp ile İletişim
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── EVRAKLAR SEKMESİ ── */
function TabEvraklar({ company, hizmetModeli, status, dbDocs, onViewPdf, sonRapor }: { company: Company; hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor"; status: AppStatus; dbDocs: any[]; onViewPdf?: (url: string, name: string) => void; sonRapor?: any }) {
  const raporYayinlandi = ["report_published","docs_in_progress","docs_complete","application_submitted","certificate_received"].includes(status);

  const evrakListe = buildDocList(company, hizmetModeli, sonRapor);

  /* Supabase'den gelen evrakları yukluler map'e dönüştür */
  const [yukluler, setYukluler] = useState<Record<string, { dosyaAdi: string; dosyaUrl?: string; yuklemeTarihi: string; durum: string; adminNotu?: string }>>(() =>
    Object.fromEntries(
      dbDocs.filter((d: any) => d.yuklayan === "customer").map((d: any) => [
        d.evrak_id,
        { dosyaAdi: d.dosya_adi || "", dosyaUrl: d.dosya_url, yuklemeTarihi: d.olusturulma, durum: d.durum, adminNotu: d.admin_notu }
      ])
    )
  );
  const [acik, setAcik] = useState<string | null>(null);

  const handleYukle = async (evrakId: string, baslik: string, grubu: string, file: File) => {
    try {
      const { uploadEvrak } = await import("./supabase-client");
      await uploadEvrak(company.id, evrakId, baslik, grubu, file);
      // Güncel listeyi yenile
      const { getDocuments } = await import("./supabase-client");
      const fresh = await getDocuments(company.id);
      setYukluler(
        Object.fromEntries(fresh.filter((d: any) => d.yuklayan === "customer").map((d: any) => [
          d.evrak_id,
          { dosyaAdi: d.dosya_adi, dosyaUrl: d.dosya_url, yuklemeTarihi: d.olusturulma, durum: d.durum, adminNotu: d.admin_notu }
        ]))
      );
    } catch (e: any) { console.error("Evrak yükleme hatası:", e); }
  };

  const onaylandi = evrakListe.filter(e => yukluler[e.id]?.durum === "onaylandi" || e.durum === "yuklendi").length;
  const reddedilen = evrakListe.filter(e => yukluler[e.id]?.durum === "reddedildi").length;
  const yuklenmemis = evrakListe.filter(e => e.zorunlu && !yukluler[e.id] && e.durum !== "yuklendi").length;

  // Gruplara ayır
  const gruplari = Array.from(new Set(evrakListe.map(e => e.grubu)));

  return (
    <div className="space-y-5">
      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Onaylanan", val: onaylandi, color: "text-green-600", bg: "bg-green-50" },
          { label: "Yükleme bekliyor", val: yuklenmemis, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Reddedilen", val: reddedilen, color: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className={`text-xs ${s.color} mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Genel not */}
      <div className="bg-[#0B1D3A]/5 border border-[#0B1D3A]/10 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#0B1D3A]/50 shrink-0 mt-0.5" />
        <p className="text-xs text-[#5A6478]">
          Tüm belgeler okunaklı PDF olarak yüklenmelidir.
          {!raporYayinlandi && " Raporunuz hazırlandıktan sonra yükleme aktif olacaktır."}
          {hizmetModeli === "biz_yapiyoruz" ? " Ekibimiz kontrol edip süreci yönetir." : " Evrakları hazırlayıp il müdürlüğüne kendiniz başvuracaksınız."}
        </p>
      </div>

      {/* Şahıs şirketi bilgi notu */}
      {company.companyType === "sahis" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">Şahıs şirketleri için ticaret odası kaydı zorunludur. Faaliyet kodu inşaat ile ilgili olmalıdır, örn. <strong>41.00.01 İkamet amaçlı binaların inşaatı</strong>.</p>
        </div>
      )}

      {/* Gruplar */}
      {gruplari.map(grup => {
        const grupEvraklar = evrakListe.filter(e => e.grubu === grup);
        return (
          <div key={grup} className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
            <div className="px-5 py-3 bg-[#F8F7F4] border-b border-[#E8E4DC]">
              <h3 className="text-xs font-semibold text-[#0B1D3A] uppercase tracking-wide">{grup}</h3>
            </div>
            <div className="divide-y divide-[#F0EDE8]">
              {grupEvraklar.map(evrak => {
                const yukleme = yukluler[evrak.id];
                const iskanYuklendi = evrak.dosyaAdi; // wizard'dan yüklendi
                const isAcik = acik === evrak.id;
                const durumBg = yukleme?.durum === "onaylandi" ? "border-l-4 border-l-green-500"
                  : yukleme?.durum === "reddedildi" ? "border-l-4 border-l-red-500"
                  : iskanYuklendi ? "border-l-4 border-l-green-400" : "";

                return (
                  <div key={evrak.id} className={durumBg}>
                    <button onClick={() => setAcik(isAcik ? null : evrak.id)}
                      className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-[#F8F7F4] transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        yukleme?.durum === "onaylandi" || iskanYuklendi ? "bg-green-100"
                        : yukleme?.durum === "reddedildi" ? "bg-red-100"
                        : yukleme ? "bg-amber-100" : "bg-[#F0EDE8]"}`}>
                        {yukleme?.durum === "onaylandi" || (iskanYuklendi && !yukleme)
                          ? <CheckCircle className="w-4 h-4 text-green-600" />
                          : yukleme?.durum === "reddedildi" ? <X className="w-4 h-4 text-red-500" />
                          : yukleme ? <Clock className="w-4 h-4 text-amber-600" />
                          : <Clock className="w-4 h-4 text-[#5A6478]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[#0B1D3A]">{evrak.baslik}</span>
                          {!evrak.zorunlu && <span className="text-[10px] bg-[#F0EDE8] text-[#5A6478] px-2 py-0.5 rounded-full">Opsiyonel</span>}
                          {evrak.zorunlu && !yukleme && !iskanYuklendi && raporYayinlandi && (
                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Gerekli</span>
                          )}
                          {iskanYuklendi && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Wizard'da yüklendi</span>}
                        </div>
                        {evrak.not && <p className="text-xs text-[#5A6478] mt-0.5">{evrak.not}</p>}
                        {yukleme && <p className="text-xs text-[#5A6478]">{yukleme.dosyaAdi} · {new Date(yukleme.yuklemeTarihi).toLocaleDateString("tr-TR")}</p>}
                      </div>
                      {isAcik ? <ChevronUp className="w-4 h-4 text-[#5A6478] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#5A6478] shrink-0" />}
                    </button>

                    {isAcik && (
                      <div className="px-5 pb-5 border-t border-[#F0EDE8] bg-[#FAFAF9]">
                        {evrak.not && <p className="text-xs text-[#5A6478] mt-3 mb-3">{evrak.not}</p>}

                        {/* Reddedildi notu */}
                        {yukleme?.durum === "reddedildi" && yukleme.adminNotu && (
                          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                            <p className="text-xs font-medium text-red-700 mb-1">Red sebebi</p>
                            <p className="text-xs text-red-600">{yukleme.adminNotu}</p>
                          </div>
                        )}

                        {/* Wizard'dan yüklendi */}
                        {iskanYuklendi && (
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3 flex items-center justify-between">
                            <p className="text-xs text-green-700 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Başvuru sırasında yüklendi: <strong>{evrak.dosyaAdi}</strong>
                            </p>
                            {evrak.dosyaUrl && onViewPdf && (
                              <button onClick={() => onViewPdf(evrak.dosyaUrl, evrak.dosyaAdi || "Belge")} className="text-xs text-[#C9952B] hover:underline flex items-center gap-1 shrink-0 ml-2">
                                <Eye className="w-3.5 h-3.5" /> Görüntüle
                              </button>
                            )}
                          </div>
                        )}

                        {/* Yüklendi — görüntüle butonu */}
                        {yukleme?.dosyaUrl && (
                          <div className="flex gap-2 mb-3">
                            {onViewPdf && (
                              <button onClick={() => onViewPdf(yukleme.dosyaUrl, yukleme.dosyaAdi || "Belge")} className="text-xs text-[#C9952B] hover:underline flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> Görüntüle
                              </button>
                            )}
                            <a href={yukleme.dosyaUrl} target="_blank" rel="noreferrer" className="text-xs text-[#5A6478] hover:underline flex items-center gap-1">
                              <Download className="w-3.5 h-3.5" /> İndir
                            </a>
                          </div>
                        )}

                        {/* Onaylandı */}
                        {yukleme?.durum === "onaylandi" && (
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                            <p className="text-xs text-green-700 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Evrak onaylandı.</p>
                          </div>
                        )}

                        {/* Yükleme alanı - report_published sonrası ve wizard'dan gelmemişse */}
                        {raporYayinlandi && !iskanYuklendi && yukleme?.durum !== "onaylandi" && (
                          <label className="flex items-center gap-3 border-2 border-dashed border-[#0B1D3A]/15 hover:border-[#C9952B]/50 rounded-xl px-4 py-3.5 cursor-pointer transition-colors group">
                            <Upload className="w-4 h-4 text-[#5A6478] group-hover:text-[#C9952B] shrink-0" />
                            <div>
                              <p className="text-sm text-[#5A6478] font-medium group-hover:text-[#C9952B]">
                                {yukleme ? "Yeniden yükle" : "Dosya seç veya sürükle"}
                              </p>
                              <p className="text-xs text-[#9CA3AF]">PDF, JPG veya PNG</p>
                            </div>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                              onChange={ev => { const f = ev.target.files?.[0]; if (f) handleYukle(evrak.id, evrak.baslik, evrak.grubu || "Genel", f); }} />
                          </label>
                        )}

                        {/* Rapor öncesi kilitli */}
                        {!raporYayinlandi && !iskanYuklendi && (
                          <div className="flex items-center gap-2 text-xs text-[#5A6478] bg-[#F0EDE8] rounded-lg p-3">
                            <Lock className="w-3.5 h-3.5" />
                            Raporunuz hazırlandıktan sonra yükleme aktif olacaktır.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Ekibimizden Gelen Belgeler */}
      {(() => {
        const adminBelgeler = dbDocs.filter((d: any) => d.yuklayan === "admin");
        if (adminBelgeler.length === 0) return null;
        return (
          <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
            <div className="px-5 py-3 bg-[#0B1D3A]/5 border-b border-[#E8E4DC]">
              <h3 className="text-xs font-semibold text-[#0B1D3A] uppercase tracking-wide">Ekibimizden Gelen Belgeler</h3>
            </div>
            <div className="divide-y divide-[#F0EDE8]">
              {adminBelgeler.map((b: any) => (
                <div key={b.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#C9952B]/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#C9952B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1D3A]">{b.baslik}</p>
                    <p className="text-xs text-[#5A6478] mt-0.5">{formatDate(b.olusturulma)}{b.belge_not ? ` · ${b.belge_not}` : ""}</p>
                  </div>
                  {b.dosya_url ? (
                    <div className="flex items-center gap-2 shrink-0">
                      {onViewPdf && (
                        <button onClick={() => onViewPdf(b.dosya_url, b.baslik || "Belge")} className="text-xs text-[#C9952B] hover:underline flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Görüntüle
                        </button>
                      )}
                      <a href={b.dosya_url} target="_blank" rel="noreferrer"
                        className="text-xs text-[#5A6478] hover:underline shrink-0 flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> İndir
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-[#9CA3AF] shrink-0">Hazırlanıyor</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}



/* ── BAŞVURU SEKMESİ ── */
function TabBasvuru({ company, hizmetModeli, process }: { company: Company; hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor"; process: ProcessData | null }) {
  const BASVURU_CHECKLIST = [
    { id: "evraklar_hazir",  label: "Tüm zorunlu evraklar yüklendi ve onaylandı",    aciklama: "Evraklar sekmesindeki belgeler onay bekliyor." },
    { id: "banka_takasbank", label: "Banka referans mektubu Takasbank'a yüklendi",    aciklama: "Bankanız tarafından Takasbank'a yüklenmiş olmalı." },
    { id: "harc_odendi",     label: "Bakanlık harcı ödendi",                          aciklama: "İl müdürlüğüne göre değişen harç tutarı ödenmiş olmalı." },
    { id: "edevlet_basvuru", label: "e-Devlet üzerinden başvuru tamamlandı",          aciklama: "edevlet.gov.tr > Çevre, Şehircilik Bakanlığı > Yapı Müteahhitliği" },
    { id: "fiziki_teslim",   label: "Evraklar il müdürlüğüne teslim edildi",          aciklama: "Bazı il müdürlükleri fiziki evrak da talep ediyor." },
  ];

  const [checks, setChecks] = useState<Record<string, boolean>>(() => loadLS(`basvuru_checks_${company.id}`, {}));
  const toggle = (id: string) => {
    const yeni = { ...checks, [id]: !checks[id] };
    setChecks(yeni); saveLS(`basvuru_checks_${company.id}`, yeni);
  };

  const tamamlanan = BASVURU_CHECKLIST.filter(c => checks[c.id]).length;
  const tamam = tamamlanan === BASVURU_CHECKLIST.length;
  const statusHistory = process?.statusHistory || [];

  return (
    <div className="space-y-5">
      {/* Barkod numarası — varsa göster */}
      {process?.barcodeNo && (
        <div className="bg-[#0B1D3A] rounded-2xl p-5 text-white">
          <p className="text-xs text-white/50 mb-1">Başvuru Barkod No</p>
          <p className="text-xl font-mono font-bold tracking-wider">{process.barcodeNo}</p>
          <p className="text-xs text-white/40 mt-1">e-Devlet başvuru barkod numarası</p>
        </div>
      )}

      {/* Zaman çizelgesi — her modelde göster */}
      {statusHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">Süreç Takibi</h3>
          </div>
          <div className="p-5 space-y-3">
            {[...statusHistory].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#C9952B] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0B1D3A]">{h.label}</p>
                  {h.note && <p className="text-xs text-[#5A6478] mt-0.5">{h.note}</p>}
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{formatDate(h.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biz yapıyorsak sadece bilgi */}
      {hizmetModeli === "biz_yapiyoruz" ? (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-base font-semibold text-[#0B1D3A] mb-2">Başvuruyu ekibimiz yapıyor</h3>
          <p className="text-sm text-[#5A6478] max-w-md mx-auto leading-relaxed">
            Evraklar onaylandıktan sonra ekibimiz bakanlık başvurusunu sizin adınıza tamamlayacaktır.
          </p>
        </div>
      ) : (
        <>
          {/* Müşteri yapıyorsa checklist */}
          <div className={`rounded-xl p-5 border ${tamam ? "bg-green-50 border-green-200" : "bg-[#F8F7F4] border-[#E8E4DC]"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tamam ? "bg-green-100" : "bg-[#0B1D3A]/6"}`}>
                {tamam ? <CheckCircle className="w-6 h-6 text-green-600" /> : <Send className="w-6 h-6 text-[#0B1D3A]/40" />}
              </div>
              <div>
                <p className={`font-semibold text-sm ${tamam ? "text-green-800" : "text-[#0B1D3A]"}`}>{tamam ? "Tüm adımlar tamamlandı!" : "Başvuru süreciniz"}</p>
                <p className={`text-xs mt-0.5 ${tamam ? "text-green-700" : "text-[#5A6478]"}`}>{tamamlanan} / {BASVURU_CHECKLIST.length} adım tamamlandı</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
              <div className="h-full bg-[#C9952B] rounded-full transition-all duration-500" style={{ width: `${(tamamlanan / BASVURU_CHECKLIST.length) * 100}%` }} />
            </div>
          </div>

          <a href="https://edevlet.gov.tr" target="_blank" rel="noreferrer"
            className="flex items-center gap-3 bg-[#0B1D3A] rounded-xl p-4 text-white hover:bg-[#122A54] transition-colors">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">e-Devlet Başvuru Sayfası</p>
              <p className="text-xs text-white/60">Yapı Müteahhitliği Yeterlilik Belgesi başvurusu</p>
            </div>
          </a>

          <div className="space-y-2">
            {BASVURU_CHECKLIST.map(({ id, label, aciklama }) => (
              <div key={id} onClick={() => toggle(id)}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${checks[id] ? "bg-green-50 border-green-200" : "bg-white border-[#E8E4DC] hover:border-[#C9952B]/40"}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${checks[id] ? "bg-green-600 border-green-600" : "border-[#D1D5DB]"}`}>
                  {checks[id] && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${checks[id] ? "text-green-800 line-through" : "text-[#0B1D3A]"}`}>{label}</p>
                  <p className="text-xs text-[#5A6478] mt-0.5">{aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── RAPOR SEKMESİ ── */
function TabRapor({ status, company, sonRapor }: { status: AppStatus; company: Company; sonRapor: any | null }) {
  const tlFmt = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

  // payment_received veya report_locked: görünür ama kilitli
  if (["payment_received", "report_locked"].includes(status) || (!sonRapor && !["report_published","docs_in_progress","docs_complete","application_submitted","certificate_received"].includes(status))) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-base font-semibold text-[#0B1D3A] mb-2">Rapor Hazırlanıyor</h3>
        <p className="text-sm text-[#5A6478] max-w-sm mx-auto">
          Ödemeniz alındı. Ekibimiz hesaplamayı yaparak raporunuzu hazırlıyor. Tamamlandığında bildirim alacaksınız.
        </p>
      </div>
    );
  }

  if (!sonRapor) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 text-center">
        <FileText className="w-10 h-10 text-[#5A6478] mx-auto mb-3 opacity-40" />
        <p className="text-sm text-[#5A6478]">Rapor henüz hazırlanmadı.</p>
      </div>
    );
  }

  /* Supabase alan adlarını normalize et */
  const y1 = sonRapor.y1;
  const y2 = sonRapor.y2;
  const tercih = sonRapor.tercih_yontem || sonRapor.tercihYontem || sonRapor.tercihEdilenYontem;
  const toplamTutar = sonRapor.toplam_guncel_tutar || sonRapor.toplamGuncelTutar;
  const hesGrup = sonRapor.hesaplanan_grup || sonRapor.hesaplananGrup || company.group;
  const raporTarihi = (sonRapor.olusturulma || sonRapor.olusturmaTarihi || "").slice(0, 10);
  const isDetaylari = sonRapor.is_detaylari || sonRapor.isDetaylari || sonRapor.isler || [];
  const adminNotuRapor = sonRapor.admin_notu || sonRapor.adminNotu;

  /* Kullanılan iş ID'lerini belirle */
  const y1Ids = new Set((y1?.son5YilIsler || []).map((x: any) => x.id));
  const y2EnBuyukId = y2?.enBuyukIs?.id;
  const isUsed = (is: any) => tercih === "son5" ? y1Ids.has(is.id) : is.id === y2EnBuyukId;

  /* Bir üst gruba kalan tutar — raporda varsa kullan, yoksa client-side hesapla */
  const birUstFromRapor = sonRapor.birUstGrup || sonRapor.bir_ust_grup;
  const eksikTutarFromRapor = sonRapor.eksikTutar || sonRapor.eksik_tutar;

  const GRUP_SIRALAMA = ["H","G1","G","F1","F","E1","E","D1","D","C1","C","B1","B","A"];
  const GRUP_MIN: Record<string, number> = {
    A: 123825000, B: 86677500, B1: 74295000, C: 61912500, C1: 51593750,
    D: 41275000, D1: 30956250, E: 20637500, E1: 12382500, F: 6191250,
    F1: 5262563, G: 4333875, G1: 3095625, H: 0,
  };
  const hesGrupIdx = GRUP_SIRALAMA.indexOf(hesGrup);
  const birUst = birUstFromRapor ?? (hesGrupIdx > 0 ? { grup: GRUP_SIRALAMA[hesGrupIdx - 1], min: GRUP_MIN[GRUP_SIRALAMA[hesGrupIdx - 1]] } : null);
  const eksikTutar = eksikTutarFromRapor ?? (birUst && toplamTutar ? Math.max(0, (birUst as any).min - toplamTutar) : 0);

  const bankaRef = sonRapor.bankaRefTutari || sonRapor.banka_ref_tutari;
  const bantLabel: Record<string, string> = { ufe: "ÜFE endeksi", alt_sinir: "Alt sınır (YMO×0.90)", ust_sinir: "Üst sınır (YMO×1.30)" };

  return (
    <div className="space-y-5">
      {/* Özet kart */}
      <div className="bg-gradient-to-br from-[#0B1D3A] to-[#122A54] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 mb-1">Toplam Güncel İş Deneyimi</p>
            <p className="text-2xl font-bold text-[#C9952B]">{toplamTutar ? tlFmt(toplamTutar) : "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 mb-1">Tespit Edilen Grup</p>
            <span className="inline-block px-4 py-2 rounded-full bg-[#C9952B]/20 text-[#C9952B] text-xl font-bold">{hesGrup}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">Rapor tarihi: {raporTarihi || "—"}</p>
          <p className="text-xs text-white/40">Tercih: {tercih === "son5" ? "Son 5 Yıl Toplamı" : "En Büyük İş × 2"}</p>
        </div>
      </div>

      {/* Bir üst gruba kalan */}
      {birUst && eksikTutar > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Bir üst gruba ({birUst.grup}) <span className="text-amber-900 font-bold">{tlFmt(eksikTutar)}</span> kaldı</p>
            <p className="text-xs text-amber-600 mt-0.5">Eşik: {tlFmt(birUst.min)}</p>
          </div>
        </div>
      )}

      {/* Y1 / Y2 karşılaştırma */}
      {(y1 || y2) && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">Hesaplama Yöntemleri</h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#F0EDE8]">
            {[
              { label: "Yöntem 1 — Son 5 Yıl", toplam: y1?.toplamNet, brut: y1?.toplamBrut, ucKat: y1?.ucKatSiniri, grup: y1?.grup, secildi: tercih === "son5", isCount: (y1?.son5YilIsler || []).length },
              { label: "Yöntem 2 — En Büyük × 2", toplam: y2?.toplam, brut: y2?.enBuyukTutar, grup: y2?.grup, secildi: tercih === "son15", isCount: 1 },
            ].map(({ label, toplam, brut, ucKat, grup, secildi, isCount }) => (
              <div key={label} className={`p-4 ${secildi ? "bg-[#C9952B]/5 border-l-2 border-l-[#C9952B]" : ""}`}>
                <p className="text-xs text-[#5A6478] mb-1">{label}</p>
                <p className="text-lg font-bold text-[#0B1D3A]">{toplam ? tlFmt(toplam) : "—"}</p>
                <p className={`text-xs font-medium mt-1 ${secildi ? "text-[#C9952B]" : "text-[#5A6478]"}`}>
                  Grup {grup || "—"} {secildi ? " — Tercih edildi" : ""}
                </p>
                {ucKat && brut && brut !== toplam && (
                  <p className="text-[10px] text-[#5A6478] mt-1">Brüt: {tlFmt(brut)} · 3× sınır: {tlFmt(ucKat)}</p>
                )}
                <p className="text-[10px] text-[#5A6478] mt-0.5">{isCount} iş kullanıldı</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* İş detayları — zenginleştirilmiş */}
      {isDetaylari.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">İş Deneyimi Detayları ({isDetaylari.length} iş)</h3>
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {isDetaylari.map((is: any, i: number) => {
              const s = is.sonuc || is._sonuc || {};
              const used = isUsed(is);
              const tipi = (is.isDeneyimiTipi || is.is_deneyimi_tipi) === "taahhut" ? "Taahhüt" : "Kat karşılığı";
              const artisOrani = s.kullanilanKatsayi ? `${((s.kullanilanKatsayi - 1) * 100).toFixed(0)}%` : "";
              return (
                <div key={i} className={`px-5 py-4 ${!used ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#0B1D3A]">
                        {is.adaParsel || is.ada_parsel ? `${is.adaParsel || is.ada_parsel}` : `İş ${i + 1}`}
                      </p>
                      <span className="text-[10px] bg-[#F0EDE8] text-[#5A6478] px-2 py-0.5 rounded-full">{tipi}</span>
                      {used && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Kullanıldı</span>}
                      {!used && <span className="text-[10px] bg-[#F0EDE8] text-[#9CA3AF] px-2 py-0.5 rounded-full">Kullanılmadı</span>}
                    </div>
                    <p className="text-sm font-bold text-[#C9952B]">{s.guncelTutar ? tlFmt(s.guncelTutar) : "—"}</p>
                  </div>

                  {/* Eski → Yeni değer + artış */}
                  {s.belgeTutari && (
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div className="bg-[#F8F7F4] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#5A6478]">Eski tutar</p>
                        <p className="text-xs font-medium text-[#0B1D3A]">{tlFmt(s.belgeTutari)}</p>
                      </div>
                      <div className="bg-[#C9952B]/5 rounded-lg p-2.5">
                        <p className="text-[10px] text-[#5A6478]">Güncel tutar</p>
                        <p className="text-xs font-bold text-[#C9952B]">{tlFmt(s.guncelTutar)}</p>
                      </div>
                      <div className="bg-[#F8F7F4] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#5A6478]">Artış</p>
                        <p className="text-xs font-medium text-[#0B1D3A]">{s.kullanilanKatsayi?.toFixed(2)}× ({artisOrani})</p>
                      </div>
                    </div>
                  )}

                  {/* Detay satırı */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#5A6478]">
                    {(is.ruhsatSinifi || is.yapiSinifi || is.yapi_sinifi) && <span>Sınıf: {is.ymoSinifi || is.ruhsatSinifi || is.yapiSinifi || is.yapi_sinifi}</span>}
                    {(is.insaatAlaniM2 || is.insaat_alani_m2) && <span>Alan: {is.insaatAlaniM2 || is.insaat_alani_m2} m²</span>}
                    {(is.sozlesmeTarihi || is.sozlesme_tarihi) && <span>Sözleşme: {is.sozlesmeTarihi || is.sozlesme_tarihi}</span>}
                    {(is.iskanTarihi || is.iskan_tarihi) && <span>İskan: {is.iskanTarihi || is.iskan_tarihi}</span>}
                    {s.bantDurumu && <span>Yöntem: {bantLabel[s.bantDurumu] || s.bantDurumu}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banka referans tutarı */}
      {bankaRef && (
        <div className="bg-[#0B1D3A]/5 border border-[#0B1D3A]/10 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#0B1D3A]/50 shrink-0 mt-0.5" />
          <p className="text-xs text-[#5A6478]">Bu grup için banka referans mektubu asgari tutarı: <strong className="text-[#0B1D3A]">{tlFmt(bankaRef)}</strong></p>
        </div>
      )}

      {/* Diploma */}
      {sonRapor.diploma?.grup && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">Diploma Yöntemi</p>
          <p className="text-sm text-blue-800">{sonRapor.diploma.aciklama}</p>
          <p className="text-xs text-blue-600 mt-1">Grup: {sonRapor.diploma.grup} · Tutar: {tlFmt(sonRapor.diploma.tutar)}</p>
        </div>
      )}

      {/* Uzman notu */}
      {adminNotuRapor && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <h3 className="text-xs font-semibold text-[#5A6478] mb-2">Uzman Notu</h3>
          <p className="text-sm text-[#0B1D3A] leading-relaxed">{adminNotuRapor}</p>
        </div>
      )}
    </div>
  );
}

/* ── BELGE SEKMESİ ── */
function TabBelge({ company, navigate, sonRapor }: { company: Company; navigate: any; sonRapor?: any }) {
  const BELGE_KEY = "musteri_belge"; // Belge bilgileri şimdilik localStorage — ileride companies tablosuna taşınacak
  const hesaplananGrup = (company as any).hesaplananGrup || company.group || "";

  const GRUP_SINIF: Record<string,string> = {
    "A":"V.D — Tüm yapı sınıfları","B":"V.D — Tüm yapı sınıfları","B1":"V.C","C":"V.B","C1":"V.A",
    "D":"IV.C","D1":"IV.B","E":"IV.A","E1":"III.C","F":"III.B","F1":"III.B","G":"III.B","G1":"III.B","H":"—",
  };

  /* Belge bilgileri: önce company'den (Supabase), yoksa localStorage'dan */
  const certFromDb = (company as any).certificateNo ? {
    belgeNo:          (company as any).certificateNo || "",
    grup:             hesaplananGrup,
    sinif:            GRUP_SINIF[hesaplananGrup] || "",
    gecerlilikTarihi: (company as any).certificateExpiry || "",
    notlar:           "",
  } : null;

  const [belge, setBelge] = useState<{ belgeNo: string; grup: string; sinif: string; gecerlilikTarihi: string; notlar: string } | null>(
    certFromDb || loadLS(`${BELGE_KEY}_${company.id}`, null)
  );
  const [form, setForm] = useState(belge || { belgeNo: "", grup: hesaplananGrup, sinif: GRUP_SINIF[hesaplananGrup] || "", gecerlilikTarihi: "", notlar: "" });
  const [editMode, setEditMode] = useState(!belge);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!form.belgeNo) return;
    setBelge(form); saveLS(`${BELGE_KEY}_${company.id}`, form);
    setEditMode(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const iCls = "w-full px-3 py-2.5 bg-[#F0EDE8] border border-transparent rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      {/* Mevcut belge kartı */}
      {belge && !editMode && (
        <div className="bg-[#0B1D3A] rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-white/50 mb-1">Yetki Belgesi</p>
              <h3 className="text-lg font-bold">{company.companyName}</h3>
              <p className="text-sm text-white/60 mt-0.5">{company.taxId}</p>
            </div>
            <Award className="w-10 h-10 text-[#C9952B]" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            {belge.grup && <span className="bg-[#C9952B] text-[#0B1D3A] text-sm font-bold px-3 py-1 rounded-lg">Grup {belge.grup}</span>}
            {belge.sinif && <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-lg">{belge.sinif}</span>}
          </div>
          <div className="bg-white/8 rounded-xl p-4">
            <p className="text-xs text-white/50 mb-1">Belge Numarası</p>
            <p className="text-xl font-mono font-bold text-white tracking-wider">{belge.belgeNo}</p>
          </div>
          {(belge.gecerlilikTarihi || belge.notlar) && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {belge.gecerlilikTarihi && <div className="bg-white/8 rounded-xl p-3"><p className="text-xs text-white/50 mb-0.5">Geçerlilik</p><p className="text-sm text-white">{new Date(belge.gecerlilikTarihi).toLocaleDateString("tr-TR")}</p></div>}
              {belge.notlar && <div className="bg-white/8 rounded-xl p-3"><p className="text-xs text-white/50 mb-0.5">Not</p><p className="text-sm text-white">{belge.notlar}</p></div>}
            </div>
          )}
          <button onClick={() => setEditMode(true)} className="mt-4 text-xs text-white/50 hover:text-white/80 underline">Bilgileri düzenle</button>
        </div>
      )}

      {/* Belge giriş formu */}
      {(!belge || editMode) && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#C9952B]/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-[#C9952B]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0B1D3A]">Belge Bilgilerini Girin</h3>
              <p className="text-xs text-[#5A6478] mt-0.5">Belgeniz geldiğinde bilgilerini buraya girin.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#5A6478] mb-1">Yeterlilik Belgesi Numarası <span className="text-red-400">*</span></label>
              <input value={form.belgeNo} onChange={e => setForm(f => ({ ...f, belgeNo: e.target.value }))} placeholder="Örn: 2026/İST/12345" className={iCls} />
            </div>
            <div>
              <label className="block text-xs text-[#5A6478] mb-1">Grup</label>
              <select value={form.grup} onChange={e => setForm(f => ({ ...f, grup: e.target.value, sinif: GRUP_SINIF[e.target.value] || "" }))} className={iCls}>
                <option value="">Seçiniz</option>
                {["A","B","B1","C","C1","D","D1","E","E1","F","F1","G","G1","H"].map(g => <option key={g} value={g}>Grup {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#5A6478] mb-1">Yapı Sınıfı</label>
              <input value={form.sinif} onChange={e => setForm(f => ({ ...f, sinif: e.target.value }))} placeholder="Otomatik doldurulur" className={iCls} />
            </div>
            <div>
              <label className="block text-xs text-[#5A6478] mb-1">Geçerlilik Tarihi</label>
              <input type="date" value={form.gecerlilikTarihi} onChange={e => setForm(f => ({ ...f, gecerlilikTarihi: e.target.value }))} className={iCls} />
            </div>
            <div>
              <label className="block text-xs text-[#5A6478] mb-1">Not</label>
              <input value={form.notlar} onChange={e => setForm(f => ({ ...f, notlar: e.target.value }))} placeholder="Varsa not ekleyin" className={iCls} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            {belge && <button onClick={() => setEditMode(false)} className="px-4 py-2.5 text-sm border border-[#E8E4DC] rounded-xl text-[#5A6478] hover:bg-[#F8F7F4]">İptal</button>}
            <button onClick={handleSave} disabled={!form.belgeNo}
              className="flex-1 bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-200 text-[#0B1D3A] py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              {saved ? <><CheckCircle className="w-4 h-4" /> Kaydedildi</> : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {/* Hesaplama özeti */}
      {sonRapor && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">Hesaplama özeti</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#5A6478]">Toplam güncel iş deneyimi</span>
              <span className="font-semibold text-[#0B1D3A]">{new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(sonRapor.toplamGuncelTutar || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#5A6478]">Hesaplanan grup</span>
              <span className="font-bold text-[#C9952B]">Grup {sonRapor.hesaplananGrup}</span>
            </div>
            {sonRapor.adminNotu && (
              <div className="mt-3 pt-3 border-t border-[#F0EDE8]">
                <p className="text-xs text-[#5A6478] mb-1">Uzman notu</p>
                <p className="text-sm text-[#0B1D3A]">{sonRapor.adminNotu}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yükseltme */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0B1D3A]">Yeni iş deneyimi eklemek ister misiniz?</p>
          <p className="text-xs text-[#5A6478] mt-0.5">Yeni tamamlanan işlerinizi ekleyerek belgenizi yenileyebilirsiniz.</p>
        </div>
        <button onClick={() => navigate("/wizard", { state: { isUpgrade: true, companyId: company.id } })}
          className="flex items-center gap-1.5 text-xs bg-[#C9952B]/10 hover:bg-[#C9952B]/20 text-[#C9952B] border border-[#C9952B]/30 px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Yeni İş Ekle
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Belge geçerlilik tarihini takip etmeyi unutmayın. Yenileme başvurusu zamanında yapılmalıdır.</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANA BİLEŞEN
───────────────────────────────────────────────────────────── */
export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab]   = useState<DashboardTab>("analiz");
  const [loading, setLoading]       = useState(true);
  const [company, setCompany]       = useState<Company | null>(null);
  const [invoices, setInvoices]     = useState<Invoice[]>([]);
  const [process, setProcess]       = useState<ProcessData | null>(null);
  const [dbDocuments, setDbDocuments] = useState<any[]>([]);
  const [sonRapor, setSonRapor]     = useState<any | null>(null);
  const [pdfViewer, setPdfViewer]   = useState<{ url: string; name: string } | null>(null);

  // Wizard'dan gelen defaultTab
  useEffect(() => {
    const state = location.state as any;
    if (state?.defaultTab) setActiveTab(state.defaultTab as DashboardTab);
  }, [location.state]);

  // Supabase'den veri yükle
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadAll();
  }, [user]);

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    try {
      const { supabase: sb, getMyCompany, getBilling, getStatusTimeline, getDocuments, getLatestReport } = await import("./supabase-client");

      const dbCompany = await getMyCompany(user.id);
      if (!dbCompany) { setLoading(false); return; }

      /* Supabase Company → local Company tip dönüşümü */
      const mapped: Company = {
        id: dbCompany.id,
        companyName: dbCompany.company_name,
        taxId:       dbCompany.tax_id || "",
        phone:       dbCompany.phone || "",
        email:       dbCompany.email || "",
        companyType: dbCompany.company_type || "",
        location:    dbCompany.location || "",
        city:        dbCompany.city || "",
        group:       dbCompany.hesaplanan_grup || "",
        userEmail:   dbCompany.user_email || user.email || "",
        appStatus:   dbCompany.app_status,
        hizmetModeli: dbCompany.hizmet_modeli as any,
        kepAddress:  dbCompany.kep_address || "",
        isFirstTime: dbCompany.is_first_time || "",
        selectedService: dbCompany.selected_service || "",
        serviceLabel: dbCompany.service_label || "",
        partners:    dbCompany.partners as any,
        createdAt:   dbCompany.olusturulma,
        updatedAt:   dbCompany.guncelleme,
        qualifications: {
          hasYapiIsi: false, hasDiploma: false, hasNone: false,
          experiences: [],
        } as any,
        // Belge bilgileri
        certificateNo:     dbCompany.certificate_no || undefined,
        certificateDate:   dbCompany.certificate_date || undefined,
        certificateExpiry: dbCompany.certificate_expiry || undefined,
        barcodeNo:         dbCompany.barcode_no || undefined,
      } as any;

      /* İş deneyimlerini ve diplomayı da yükle */
      const [expsRes, diploRes, billRes, timelineRes, docsRes, raporRes] = await Promise.all([
        sb.from("experiences").select("*").eq("company_id", dbCompany.id).order("olusturulma"),
        sb.from("diplomas").select("*").eq("company_id", dbCompany.id).single(),
        getBilling(dbCompany.id),
        getStatusTimeline(dbCompany.id),
        getDocuments(dbCompany.id),
        getLatestReport(dbCompany.id),
      ]);

      /* qualifications mapla */
      const exps = expsRes.data || [];
      const dip  = diploRes.data;
      (mapped as any).qualifications = {
        hasYapiIsi:  exps.length > 0,
        hasDiploma:  !!dip,
        hasNone:     exps.length === 0 && !dip,
        experiences: exps.map((e: any) => ({
          id:                 e.id,
          isDeneyimiTipi:     e.is_deneyimi_tipi,
          adaParsel:          e.ada_parsel,
          sozlesmeTarihi:     e.sozlesme_tarihi,
          iskanTarihi:        e.iskan_tarihi,
          insaatAlaniM2:      e.insaat_alani_m2?.toString() || "",
          yapiYuksekligiM:    e.yapi_yuksekligi_m?.toString() || "",
          yapiSinifi:         e.yapi_sinifi,
          yapiTipi:           e.yapi_tipi,
          muteahhitArsaAyni:  e.muteahhit_arsa_ayni,
          taahhutBedeli:      e.taahhut_bedeli?.toString() || "",
          iskanDosyaAdi:      e.iskan_dosya_adi,
          iskanDosyaUrl:      e.iskan_dosya_url,
          // Alias fields for buildDocList & TabAnaliz
          buildingClass:  e.yapi_sinifi,
          buildingHeight: e.yapi_yuksekligi_m?.toString() || "",
          contractDate:   e.sozlesme_tarihi,
          occupancyDate:  e.iskan_tarihi,
          totalArea:      e.insaat_alani_m2?.toString() || "",
        })),
        diploma: dip ? {
          partnerName: dip.partner_name,
          department:  dip.department,
          gradDate:    dip.grad_date,
          partnershipYears: dip.partnership_years,
        } : null,
      };

      setCompany(mapped);

      /* Faturalar */
      setInvoices(billRes.map((b: any) => ({
        id: b.id, description: b.description,
        amount: b.amount_num.toLocaleString("tr-TR") + " ₺",
        amountNum: b.amount_num,
        status: b.status,
        date: b.olusturulma,
        dueDate: b.due_date || "",
      })));

      /* Süreç geçmişi */
      const history = (timelineRes || []).map((t: any) => ({
        date: t.created_at, label: t.status_label || t.status, note: t.note,
      }));
      setProcess(history.length > 0 ? {
        status: dbCompany.app_status,
        statusLabel: dbCompany.app_status,
        statusHistory: history,
        barcodeNo: dbCompany.barcode_no || undefined,
        certificateNo: dbCompany.certificate_no || undefined,
        certificateDate: dbCompany.certificate_date || undefined,
        certificateExpiry: dbCompany.certificate_expiry || undefined,
      } : null);

      /* Evraklar */
      setDbDocuments(docsRes || []);

      /* En son rapor */
      setSonRapor(raporRes || null);

    } catch (e) {
      console.error("Dashboard veri yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  }

  const refresh = () => loadAll();

  const status = useMemo<AppStatus>(() => {
    if (!company) return "wizard_incomplete";
    return getStatusFromCompany(company);
  }, [company]);

  const visibleTabs = useMemo(() => getTabsVisible(status, company?.group || "H"), [status, company?.group]);

  const hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor" =
    (company as any)?.hizmetModeli === "biz_yapiyoruz"
      ? "biz_yapiyoruz"
      : "musteri_yapiyor";

  // Realtime status takibi
  useEffect(() => {
    if (!company?.id) return;
    import("./supabase-client").then(({ subscribeToCompanyStatus }) => {
      const channel = subscribeToCompanyStatus(company.id, (newStatus) => {
        setCompany(prev => prev ? { ...prev, appStatus: newStatus } : prev);
      });
      return () => { channel.unsubscribe(); };
    });
  }, [company?.id]);

  // Upsell teklif kaldırıldı

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  /* Yükleniyor */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <Award className="w-10 h-10 text-[#C9952B] mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-[#5A6478]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  /* ── Başvuru formuna yönlendir (şirket yoksa) ── */
  if (!company && status === "wizard_incomplete") {
    return (
      <div className="min-h-screen bg-[#F8F7F4] font-[Inter] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 max-w-sm w-full text-center">
          <Award className="w-12 h-12 text-[#C9952B] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0B1D3A] mb-2">Başvurunuzu oluşturun</h2>
          <p className="text-sm text-[#5A6478] mb-6">Müteahhitlik belgesi grubunuzu öğrenmek için başvuru formunu doldurun.</p>
          <button onClick={() => navigate("/wizard")}
            className="w-full bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
            <ArrowRight className="w-4 h-4" /> Başvuru Formunu Doldurun
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] font-[Inter]">
      {/* Top bar */}
      <div className="bg-[#0B1D3A] text-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-[#C9952B]" />
            <span className="text-sm">muteahhitlikbelgesi<span className="text-[#C9952B]">.com</span></span>
          </div>
          <div className="flex items-center gap-4">
            {company && <StatusBadge status={status} />}
            <button onClick={handleSignOut}
              className="text-white/50 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Firma başlık */}
        {company && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#0B1D3A]">{company.companyName}</h1>
            <p className="text-sm text-[#5A6478] mt-0.5">
              {company.serviceLabel || "Müteahhitlik belgesi başvurusu"}
              {company.location === "istanbul" && " · İstanbul"}
            </p>
          </div>
        )}

        {/* Sekmeler */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TAB_ORDER.filter(t => visibleTabs.has(t)).map(tab => {
            const cfg = TAB_CONFIG[tab];
            const Icon = cfg.icon;
            const locked = isTabLocked(tab, status);
            const active = activeTab === tab;

            return (
              <button key={tab}
                onClick={() => !locked && setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  locked
                    ? "text-[#5A6478]/50 cursor-not-allowed bg-[#F0EDE8]/50"
                    : active
                      ? "bg-[#0B1D3A] text-white"
                      : "bg-white border border-[#E8E4DC] text-[#5A6478] hover:border-[#C9952B] hover:text-[#C9952B]"
                }`}>
                {locked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Tab içeriği */}
        <div>
          {activeTab === "analiz"   && company && <TabAnaliz   company={company} status={status} setActiveTab={setActiveTab} />}
          {activeTab === "firma"    && company && <TabFirma    company={company} onRefresh={refresh} status={status} setActiveTab={setActiveTab} />}
          {activeTab === "mali"     && company && <TabMali     company={company} onStatusChange={refresh} />}
          {activeTab === "odeme"    && company && <TabOdeme    company={company} invoices={invoices} />}
          {activeTab === "rapor"    && company && <TabRapor    status={status} company={company} sonRapor={sonRapor} />}
          {activeTab === "evraklar" && company && <TabEvraklar company={company} hizmetModeli={hizmetModeli} status={status} dbDocs={dbDocuments} onViewPdf={(url, name) => setPdfViewer({ url, name })} sonRapor={sonRapor} />}
          {activeTab === "basvuru"  && company && <TabBasvuru  company={company} hizmetModeli={hizmetModeli} process={process} />}
          {activeTab === "belge"    && company && <TabBelge    company={company} navigate={navigate} sonRapor={sonRapor} />}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewer && <PdfViewer url={pdfViewer.url} fileName={pdfViewer.name} onClose={() => setPdfViewer(null)} />}
    </div>
  );
}
