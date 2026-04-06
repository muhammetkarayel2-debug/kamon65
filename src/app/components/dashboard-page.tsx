import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Award, BarChart3, Building2, FileText, CreditCard, FolderOpen,
  Send, CheckCircle, Lock, Clock, AlertTriangle, ChevronRight,
  LogOut, Plus, Upload, Eye, Download, X, Info, Users,
  ArrowRight, RefreshCw, Trash2, Edit2, Save, Check, ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";
import { useAuth } from "./auth-context";

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
  basvuruTeklifiGosterildi?: boolean;
  basvuruTeklifiKabul?: boolean;
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
function buildDocList(company: Company, hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor"): DocItem[] {
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
  if (qual?.hasYapiIsi && qual?.experiences?.length > 0) {
    qual.experiences.forEach((e: any, i: number) => {
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
function TabAnaliz({ company, status }: { company: Company; status: AppStatus }) {
  const locked = ["report_published","docs_in_progress","docs_complete","application_submitted","certificate_received"].includes(status);
  const qual = company.qualifications;

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

        {status === "report_published" || status === "docs_in_progress" || status === "docs_complete" || status === "application_submitted" || status === "certificate_received" ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Hesaplama tamamlandı</p>
              <p className="text-xs text-green-600 mt-0.5">Detayları Rapor sekmesinden inceleyebilirsiniz.</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* İş deneyimi özeti */}
      {qual && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">İş deneyimi girişleri</h3>
            {!locked && (
              <button className="text-xs text-[#C9952B] hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Yeni ekle
              </button>
            )}
          </div>

          {qual.hasKatKarsiligi && qual.experiences?.length > 0 ? (
            <div className="divide-y divide-[#F0EDE8]">
              {qual.experiences.map((exp: any, i: number) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0B1D3A]">
                      Kat karşılığı işi {i + 1}
                      {exp.buildingClass && <span className="ml-2 text-xs text-[#C9952B] font-bold">{exp.buildingClass}</span>}
                    </p>
                    <p className="text-xs text-[#5A6478] mt-0.5">
                      {exp.contractDate && `Sözleşme: ${exp.contractDate}`}
                      {exp.totalArea && ` · ${exp.totalArea} m²`}
                    </p>
                  </div>
                  {!locked && (
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-[#5A6478] hover:text-[#C9952B] rounded-lg hover:bg-[#C9952B]/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-[#5A6478] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {locked && <span className="text-xs text-[#5A6478]"><Lock className="w-3 h-3 inline mr-1" />Kilitli</span>}
                </div>
              ))}
            </div>
          ) : qual.hasDiploma ? (
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C9952B]/10 flex items-center justify-center">
                  <Award className="w-4 h-4 text-[#C9952B]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0B1D3A]">Diploma başvurusu</p>
                  <p className="text-xs text-[#5A6478]">
                    {qual.diploma?.department === "insaat_muhendisligi" ? "İnşaat Mühendisliği" : "Mimarlık"}
                    {qual.diploma?.gradDate && ` · Mezuniyet: ${qual.diploma.gradDate}`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-[#5A6478]">İş deneyimi girilmemiş.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── FİRMA ── */
function TabFirma({ company }: { company: Company }) {
  const tuzel = company.companyType === "limited_as" || company.companyType === "as";
  const typeLabel: Record<string, string> = {
    sahis: "Şahıs şirketi",
    limited_as: "Limited / A.Ş.",
    kooperatif: "Kooperatif",
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
        <h3 className="text-sm font-semibold text-[#0B1D3A] mb-5">Firma bilgileri</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <InfoCard label="Unvan"            value={company.companyName} />
          <InfoCard label="Firma tipi"       value={typeLabel[company.companyType] || company.companyType} />
          <InfoCard label="Vergi kimlik no"  value={company.taxId} />
          <InfoCard label="Telefon"          value={company.phone} />
          <InfoCard label="E-posta"          value={company.email} />
          <InfoCard label="Şehir"            value={company.location === "istanbul" ? "İstanbul" : company.city} />
          <InfoCard label="İlk başvuru mu?"  value={company.isFirstTime === "first" ? "Evet, ilk başvuru" : "Yenileme / Yükseltme"} />
          <InfoCard label="Seçilen hizmet"   value={company.serviceLabel || "—"} />
        </div>
      </div>

      {/* Şahıs — ticaret odası uyarısı */}
      {!tuzel && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-700">Ticaret odası kaydı zorunludur</p>
            <p className="text-xs text-blue-600 mt-1">
              Şahıs şirketleri için ticaret odası kaydı zorunludur. Faaliyet kodu{" "}
              <strong>41.00.01 İkamet amaçlı binaların inşaatı</strong> olmalıdır.
              Bu belgeyi evrak aşamasında sistem otomatik kontrol eder.
            </p>
          </div>
        </div>
      )}

      {/* Ortaklar (tüzel) */}
      {tuzel && company.partners && company.partners.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0B1D3A] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C9952B]" /> Ortak bilgileri
            </h3>
            <button className="text-xs text-[#C9952B] hover:underline">Düzenle</button>
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {company.partners.map((p, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0B1D3A]">{p.name || "—"}</p>
                  {p.tcNo && <p className="text-xs text-[#5A6478]">TC: {p.tcNo}</p>}
                </div>
                <span className="text-sm font-bold text-[#C9952B]">%{p.sharePercent}</span>
              </div>
            ))}
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
        <div className="bg-[#0B1D3A] rounded-2xl p-5 text-white">
          <h3 className="text-sm font-semibold mb-3">Ödeme Bilgileri</h3>
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
      )}
    </div>
  );
}

/* ── EVRAKLAR SEKMESİ ── */
function TabEvraklar({ company, hizmetModeli, status, dbDocs }: { company: Company; hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor"; status: AppStatus; dbDocs: any[] }) {
  const raporYayinlandi = ["report_published","docs_in_progress","docs_complete","application_submitted","certificate_received"].includes(status);

  const evrakListe = buildDocList(company, hizmetModeli);

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
          <p className="text-xs text-amber-800">Ticaret odası kaydınızın faaliyet kodu <strong>41.00.01</strong> olması gerekmektedir.</p>
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
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3">
                            <p className="text-xs text-green-700 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Başvuru sırasında yüklendi: <strong>{evrak.dosyaAdi}</strong>
                            </p>
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
                              onChange={ev => { const f = ev.target.files?.[0]; if (f) handleYukle(evrak.id, f); }} />
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
                    <a href={b.dosya_url} target="_blank" rel="noreferrer"
                      className="text-xs text-[#C9952B] hover:underline shrink-0 flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> İndir
                    </a>
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

  return (
    <div className="space-y-5">
      {/* Özet kart */}
      <div className="bg-gradient-to-br from-[#0B1D3A] to-[#122A54] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 mb-1">Toplam Güncel İş Deneyimi</p>
            <p className="text-2xl font-bold text-[#C9952B]">
              {toplamTutar ? tlFmt(toplamTutar) : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 mb-1">Tespit Edilen Grup</p>
            <span className="inline-block px-4 py-2 rounded-full bg-[#C9952B]/20 text-[#C9952B] text-xl font-bold">
              {hesGrup}
            </span>
          </div>
        </div>
        <p className="text-xs text-white/30">Rapor tarihi: {raporTarihi || "—"}</p>
      </div>

      {/* Y1 / Y2 karşılaştırma */}
      {(y1 || y2) && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">Hesaplama Yöntemleri</h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#F0EDE8]">
            {[
              { label: "Son 5 Yıl Toplamı", toplam: y1?.toplamNet || y1?.toplam, grup: y1?.grup, secildi: tercih === "son5" },
              { label: "En Büyük İş × 2", toplam: y2?.toplam, grup: y2?.grup, secildi: tercih === "son15" },
            ].map(({ label, toplam, grup, secildi }) => (
              <div key={label} className={`p-4 ${secildi ? "bg-[#C9952B]/5" : ""}`}>
                <p className="text-xs text-[#5A6478] mb-1">{label}</p>
                <p className="text-base font-bold text-[#0B1D3A]">{toplam ? tlFmt(toplam) : "—"}</p>
                <p className={`text-xs font-medium mt-0.5 ${secildi ? "text-[#C9952B]" : "text-[#5A6478]"}`}>
                  Grup {grup || "—"} {secildi ? "✓ Kullanıldı" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* İş detayları */}
      {isDetaylari.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">İş Deneyimi Detayları</h3>
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {isDetaylari.map((is: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-[#0B1D3A]">
                    {is.adaParsel || is.ada_parsel ? `Ada/Parsel: ${is.adaParsel || is.ada_parsel}` : `İş ${i + 1}`}
                  </p>
                  <p className="text-sm font-bold text-[#C9952B]">
                    {(is.sonuc?.guncelTutar || is._sonuc?.guncelTutar)
                      ? tlFmt(is.sonuc?.guncelTutar || is._sonuc?.guncelTutar) : "—"}
                  </p>
                </div>
                {(is.sonuc?.sozlesmedenBugune || is._sonuc?.sozlesmedenBugune) && (
                  <p className="text-xs text-[#5A6478]">{is.sonuc?.sozlesmedenBugune || is._sonuc?.sozlesmedenBugune}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diploma */}
      {sonRapor.diploma?.grup && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">Diploma</p>
          <p className="text-sm text-blue-800">{sonRapor.diploma.aciklama}</p>
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
function TabBelge({ company, navigate }: { company: Company; navigate: any }) {
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
        basvuruTeklifiGosterildi: dbCompany.basvuru_teklifi_gosterildi,
        basvuruTeklifiKabul: dbCompany.basvuru_teklifi_kabul as any,
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

  // Başvuru teklifi (istanbul + rapor yayınlandı)
  const [showTeklif, setShowTeklif] = useState(false);
  useEffect(() => {
    if (status === "report_published" && company?.location === "istanbul" && !company?.basvuruTeklifiGosterildi) {
      setTimeout(() => setShowTeklif(true), 800);
    }
  }, [status, company]);

  const handleTeklif = async (kabul: boolean) => {
    if (!company?.id) return;
    const { supabase: sb } = await import("./supabase-client");
    await sb.from("companies").update({
      basvuru_teklifi_gosterildi: true,
      basvuru_teklifi_kabul: kabul,
      hizmet_modeli: kabul ? "biz_yapiyoruz" : "musteri_yapiyor",
    }).eq("id", company.id);
    setShowTeklif(false);
    if (kabul) navigate("/paywall");
    else refresh();
  };

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
          {activeTab === "analiz"   && company && <TabAnaliz   company={company} status={status} />}
          {activeTab === "firma"    && company && <TabFirma    company={company} />}
          {activeTab === "mali"     && company && <TabMali     company={company} onStatusChange={refresh} />}
          {activeTab === "odeme"    && company && <TabOdeme    company={company} invoices={invoices} />}
          {activeTab === "rapor"    && company && <TabRapor    status={status} company={company} sonRapor={sonRapor} />}
          {activeTab === "evraklar" && company && <TabEvraklar company={company} hizmetModeli={hizmetModeli} status={status} dbDocs={dbDocuments} />}
          {activeTab === "basvuru"  && company && <TabBasvuru  company={company} hizmetModeli={hizmetModeli} process={process} />}
          {activeTab === "belge"    && company && <TabBelge    company={company} navigate={navigate} />}
        </div>
      </div>

      {/* İstanbul başvuru teklifi modal */}
      {showTeklif && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTeklif(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-7"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-bold text-[#0B1D3A]">Başvuruyu biz yapalım mı?</h3>
              <button onClick={() => setShowTeklif(false)} className="text-[#5A6478] hover:text-[#0B1D3A]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#5A6478] mb-6">
              İstanbul İl Müdürlüğü'ne başvuruyu sizin adınıza yapabiliriz.
              Evrak hazırlama ve teslim dahil tam hizmet için fark ücret ödeyerek devam edebilirsiniz.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleTeklif(false)}
                className="flex-1 border border-[#E8E4DC] text-[#5A6478] py-2.5 rounded-xl text-sm hover:bg-[#F8F7F4] transition-colors">
                Hayır, kendim yapacağım
              </button>
              <button onClick={() => handleTeklif(true)}
                className="flex-1 bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium py-2.5 rounded-xl text-sm transition-colors">
                Evet, siz yapın
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
