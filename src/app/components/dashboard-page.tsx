import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Award, BarChart3, Building2, FileText, CreditCard, FolderOpen,
  Send, CheckCircle, Lock, Clock, AlertTriangle, ChevronRight,
  LogOut, Plus, Upload, Eye, Download, X, Info, Users,
  ArrowRight, RefreshCw, Trash2, Edit2, Save, Check, ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";
import { useAuth } from "./auth-context";
import { PayForm } from "./pay-form";

/* ─────────────────────────────────────────────────────────────
   STORAGE HELPERS
───────────────────────────────────────────────────────────── */
const MOCK_COMPANIES_KEY = "mock_panel_companies";
const MOCK_BILLING_KEY   = "mock_panel_billing";
const MOCK_PROCESS_KEY   = "mock_panel_process";
const REPORTS_KEY        = "mock_panel_reports";

function loadLS(key, fallback) {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {}
  return fallback;
}
function saveLS(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

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
  aciklama?: string;
  musteridenNe?: string;
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
  A:123825000,B:86677500,B1:74295000,C:61912500,C1:51393750,
  D:41275000,D1:30956250,E:20637500,E1:12382500,F:6191250,
  F1:5262562.5,G:4333875,G1:3095625
};

function getStatusFromCompany(c: Company): AppStatus {
  if (c.appStatus) return c.appStatus;
  if (!c.qualifications) return "wizard_incomplete";
  const needsFinancial = FINANCIAL_REQUIRED.includes(c.group);
  const allBilling = loadLS(MOCK_BILLING_KEY, {});
  const invoices = allBilling[c.id] || [];
  const paid = invoices.some((i: any) => i.status === "paid");
  if (!paid && needsFinancial) return "pending_financial";
  if (!paid) return "pending_payment";
  return "report_locked";
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
    tabs.add("rapor");
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
   EVRAK ÜRETİCİ
───────────────────────────────────────────────────────────── */
function evraklariUret(
  grup: string,
  firmaTipi: string,
  isDeneyimiTipleri: string[],
  hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor",
  muteahhitArsaSahibiAyni: boolean
): DocItem[] {
  const biz = hizmetModeli === "biz_yapiyoruz";
  const tuzel = firmaTipi === "limited_as" || firmaTipi === "as";
  const docs: DocItem[] = [];

  const doc = (id: string, baslik: string, grubu: string, aciklama: string, musteridenNe: string, zorunlu = true, not?: string): DocItem => ({
    id, baslik, grubu, zorunlu, aciklama, musteridenNe, not,
    durum: "bekleniyor",
  });

  // Kimlik & Firma
  docs.push(doc("mukellefiyet", "Mükellefiyet belgesi", "Kimlik ve firma",
    "Vergi dairesinden alınan mükellefiyet kaydını gösterir.",
    "e-Devlet'ten e-imzalı PDF olarak indirip yükleyin. PDF okunaklı olmalıdır."));
  docs.push(doc("imza", "İmza " + (tuzel ? "sirküleri" : "beyannamesi"), "Kimlik ve firma",
    "Şirketin yetkili imza sahiplerini gösteren belge.",
    "e-imzalı PDF olarak yükleyin. PDF okunaklı olmalıdır."));

  if (!biz) {
    docs.push({ ...doc("nufus", "Nüfus cüzdanı fotokopisi", "Kimlik ve firma",
      "Kimlik teyidi için gereklidir.",
      "Kimlik kartının her iki yüzünün net fotoğrafını yükleyin."), zorunlu: false });
    docs.push(doc("dilekce", "Dilekçe", "Kimlik ve firma",
      "İl müdürlüğüne yazılacak resmi dilekçe.",
      "Bakanlık formatında hazırlanıp imzalanarak PDF olarak yükleyin."));
  }

  if (!tuzel) {
    docs.push(doc("ticaret_odasi", "Ticaret odası kayıt belgesi", "Kimlik ve firma",
      "Faaliyet kodu 41.00.01 (İkamet amaçlı binaların inşaatı) belgede görünmelidir.",
      "Ticaret/esnaf odanızdan alarak PDF olarak yükleyin. PDF okunaklı olmalıdır."));
  }

  // İş deneyimi
  if (isDeneyimiTipleri.includes("kat_karsiligi") || isDeneyimiTipleri.includes("taahhut")) {
    docs.push(doc("ruhsat", "Yapı ruhsatı", "İş deneyimi",
      "Yapının inşaatına izin veren resmî belge.",
      "Belediyeden/ilgili kurumdan alarak PDF olarak yükleyin. Okunaklı olmalıdır."));
    docs.push(doc("iskan", "İskan belgesi / Yapı kullanma izni", "İş deneyimi",
      "Yapının tamamlandığını ve kullanıma uygun olduğunu belgeler.",
      "Belediyeden alarak PDF olarak yükleyin. Okunaklı olmalıdır."));
    if (isDeneyimiTipleri.includes("kat_karsiligi")) {
      docs.push(doc("kat_soz", "Kat karşılığı inşaat sözleşmesi", "İş deneyimi",
        "Arsa sahibi ile müteahhit arasındaki inşaat sözleşmesi.",
        "PDF olarak tarayıp yükleyin. Tüm sayfalar ve imzalar görünmeli."));
      if (!muteahhitArsaSahibiAyni) {
        docs.push(doc("ekap_kat", "EKAP iş deneyim belgesi", "İş deneyimi",
          "EKAP sisteminden alınan iş deneyim belgesi.",
          "EKAP'tan (ekap.kik.gov.tr) e-imzalı PDF olarak indirip yükleyin."));
      }
    }
    if (isDeneyimiTipleri.includes("taahhut")) {
      docs.push(doc("sozlesme_taahhut", "İnşaat taahhüt sözleşmesi", "İş deneyimi",
        "İşveren ile müteahhit arasındaki sözleşme.",
        "PDF olarak tarayıp yükleyin."));
    }
  }

  // Diploma
  if (isDeneyimiTipleri.includes("diploma")) {
    docs.push(doc("mezuniyet", "Mezuniyet belgesi / Diploma", "Diploma ve mezuniyet",
      "İnşaat Mühendisliği veya Mimarlık bölümü mezuniyetini gösteren belge.",
      "e-Devlet'ten e-imzalı PDF (tercih). Yoksa diploma aslının noter onaylı nüshası."));
  }

  // Mali yeterlilik
  const maliSart = FINANCIAL_REQUIRED.includes(grup);
  const bankaTutari = BANKA_REFERANS[grup];

  if (maliSart) {
    docs.push(doc("bilanco", "Bilanço ve gelir tablosu", "Mali yeterlilik",
      "Son yıla ait vergi dairesine onaylı bilanço ve gelir tablosu.",
      "ivd.gib.gov.tr'den e-imzalı PDF olarak indirip yükleyin. YMM/SMMM onaylı da kabul edilir."));
    if (!biz) {
      docs.push(doc("ek2", "EK-2 Mali Yeterlik Bildirim Formu", "Mali yeterlilik",
        "Bakanlık EK-2 formu — bilanço oranlarını ve ciro bilgilerini içerir.",
        "YMM/SMMM ile birlikte doldurulup imzalanarak PDF olarak yükleyin."));
    }
  }

  if (bankaTutari) {
    docs.push({
      ...doc("banka_ref", "Banka referans mektubu", "Mali yeterlilik",
        `${grup} grubu için asgari tutar: ${tl(bankaTutari)} — Takasbank'a da yüklenmesi zorunludur.`,
        "Bankanızın kurumsal şubesine başvurun. Orijinal veya noter onaylı. Takasbank'a yüklenmesi gerekebilir."),
      bankaTutari,
    });
  }

  return docs;
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
   STATUS
───────────────────────────────────────────────────────────── */
const STATUS_INFO: Record<AppStatus, { label: string; color: string; bg: string }> = {
  wizard_incomplete:     { label: "Bilgiler eksik",           color: "text-orange-600", bg: "bg-orange-50" },
  pending_financial:     { label: "Mali bilgiler bekleniyor", color: "text-blue-600",   bg: "bg-blue-50"   },
  pending_payment:       { label: "Ödeme bekleniyor",         color: "text-orange-600", bg: "bg-orange-50" },
  payment_received:      { label: "Ödeme alındı",             color: "text-blue-600",   bg: "bg-blue-50"   },
  report_locked:         { label: "Rapor hazırlanıyor",       color: "text-blue-600",   bg: "bg-blue-50"   },
  report_published:      { label: "Rapor yayınlandı",         color: "text-green-600",  bg: "bg-green-50"  },
  docs_in_progress:      { label: "Evraklar toplanıyor",      color: "text-orange-600", bg: "bg-orange-50" },
  docs_complete:         { label: "Evraklar tamam",           color: "text-green-600",  bg: "bg-green-50"  },
  application_submitted: { label: "Başvuru yapıldı",          color: "text-blue-600",   bg: "bg-blue-50"   },
  certificate_received:  { label: "Belge alındı",             color: "text-green-600",  bg: "bg-green-50"  },
};

/* ─────────────────────────────────────────────────────────────
   ALT BİLEŞENLER
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

/* ── ANALİZ ── */
function TabAnaliz({ company, status }: { company: Company; status: AppStatus }) {
  const qual = company.qualifications;
  const locked = !["wizard_incomplete","pending_payment","pending_financial"].includes(status);

  return (
    <div className="space-y-5">
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
              <p className="text-sm font-medium text-orange-700">Wizard tamamlanmadı</p>
              <p className="text-xs text-orange-600 mt-0.5">Analizin başlatılması için wizard'ı tamamlayınız.</p>
            </div>
          </div>
        )}

        {["report_published","docs_in_progress","docs_complete","application_submitted","certificate_received"].includes(status) && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Analiz tamamlandı</p>
              <p className="text-xs text-green-600 mt-0.5">Detayları Rapor sekmesinden inceleyebilirsiniz.</p>
            </div>
          </div>
        )}
      </div>

      {qual && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">İş deneyimi girişleri</h3>
          </div>

          {qual.hasKatKarsiligi && qual.experiences?.length > 0 ? (
            <div className="divide-y divide-[#F0EDE8]">
              {qual.experiences.map((exp: any, i: number) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0B1D3A]">
                      İş Deneyimi {i + 1}
                      {exp.buildingClass && <span className="ml-2 text-xs text-[#C9952B] font-bold">{exp.buildingClass}</span>}
                    </p>
                    <p className="text-xs text-[#5A6478] mt-0.5">
                      {exp.contractDate && `Sözleşme: ${exp.contractDate}`}
                      {exp.totalArea && ` · ${exp.totalArea} m²`}
                    </p>
                  </div>
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

      {!tuzel && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-700">Ticaret odası kaydı zorunludur</p>
            <p className="text-xs text-blue-600 mt-1">
              Şahıs şirketleri için ticaret odası kaydı zorunludur. Faaliyet kodu{" "}
              <strong>41.00.01 İkamet amaçlı binaların inşaatı</strong> olmalıdır.
            </p>
          </div>
        </div>
      )}

      {tuzel && company.partners && company.partners.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C9952B]" /> Ortak bilgileri
            </h3>
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

/* ── ÖDEME ── */
function TabOdeme({ company, invoices }: { company: Company; invoices: Invoice[] }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePayment = (invId: string) => {
    // Faturayı ödendi olarak işaretle
    const allBilling = loadLS(MOCK_BILLING_KEY, {});
    const compInvoices = allBilling[company.id] || [];
    const updatedInvoices = compInvoices.map((inv: any) =>
      inv.id === invId
        ? { ...inv, status: "paid", paidAt: new Date().toISOString() }
        : inv
    );
    allBilling[company.id] = updatedInvoices;
    saveLS(MOCK_BILLING_KEY, allBilling);

    // Şirketi payment_received durumuna getir
    const companies = loadLS(MOCK_COMPANIES_KEY, []);
    const updatedCompanies = companies.map((c: any) =>
      c.id === company.id ? { ...c, appStatus: "payment_received" } : c
    );
    saveLS(MOCK_COMPANIES_KEY, updatedCompanies);

    // Refresh için
    setRefreshKey(prev => prev + 1);
    window.location.reload(); // Tüm sayfayı yenile ki durum güncellensin
  };

  const tlFormat = (n: number | string) => {
    const num = typeof n === 'string' ? parseFloat(n) : n;
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0
    }).format(Math.round(num));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E4DC]">
          <h3 className="text-sm font-semibold text-[#0B1D3A]">Faturalar</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="px-5 py-8 text-center text-[#5A6478] text-sm">
            Henüz fatura oluşturulmadı.
          </div>
        ) : (
          <div className="divide-y divide-[#F0EDE8]">
            {invoices.map(inv => {
              const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount;
              return (
                <div key={inv.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-[#0B1D3A]">{inv.description}</p>
                      <p className="text-xs text-[#5A6478] mt-0.5">
                        Kesim: {inv.date?.slice(0,10)} · Son ödeme: {inv.dueDate?.slice(0,10)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-[#0B1D3A]">{tlFormat(amount)}</p>
                      <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === "paid" ? "bg-green-50 text-green-700" :
                        inv.status === "overdue" ? "bg-red-50 text-red-600" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {inv.status === "paid" ? "✓ Ödendi" : inv.status === "overdue" ? "Gecikmiş" : "Ödeme Bekleniyor"}
                      </span>
                    </div>
                  </div>

                  {/* Ödeme formu - sadece ödenmemiş faturalar için */}
                  {inv.status !== "paid" && (
                    <div className="mt-3 pt-3 border-t border-[#F0EDE8]">
                      <PayForm
                        onPay={() => handlePayment(inv.id)}
                        amount={amount}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-[#0B1D3A]/5 border border-[#0B1D3A]/10 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#0B1D3A]/50 shrink-0 mt-0.5" />
        <p className="text-xs text-[#5A6478] leading-relaxed">
          Kredi kartı ile anında ödeme yapabilir veya havale ile ödeme yapabilirsiniz.
          Ödeme onaylandıktan sonra hesaplama raporu hazırlanmaya başlanacaktır.
        </p>
      </div>
    </div>
  );
}

/* ── RAPOR ── */
function TabRapor({ status, company }: { status: AppStatus; company: Company }) {
  const raporlar = loadLS(REPORTS_KEY, {});
  const sonRapor = (raporlar[company.id] || []).slice(-1)[0];

  if (status === "report_locked" || (!sonRapor && status !== "report_published")) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-base font-semibold text-[#0B1D3A] mb-2">Rapor Hazırlanıyor</h3>
        <p className="text-sm text-[#5A6478] max-w-sm mx-auto">
          Ödemeniz alındı. Ekibimiz ÜFE hesaplamasını yaparak raporunuzu hazırlıyor.
          İşlem tamamlandığında bildirim alacaksınız.
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

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[#0B1D3A] to-[#122A54] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 mb-1">Hesaplanan İş Deneyim Tutarı</p>
            <p className="text-2xl font-bold text-[#C9952B]">
              {sonRapor.toplamGuncelTutar
                ? new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(sonRapor.toplamGuncelTutar)
                : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 mb-1">Tespit Edilen Grup</p>
            <span className="inline-block px-4 py-2 rounded-full bg-[#C9952B]/20 text-[#C9952B] text-xl font-bold">
              {sonRapor.hesaplananGrup || company.group}
            </span>
          </div>
        </div>
        <p className="text-xs text-white/30">Rapor tarihi: {sonRapor.olusturmaTarihi?.slice(0,10) || "—"}</p>
      </div>

      {sonRapor.isDetaylari?.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">İş Deneyimi Detayları</h3>
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {sonRapor.isDetaylari.map((is: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-[#0B1D3A]">İş {is.index || i+1}</p>
                  <p className="text-sm font-bold text-[#C9952B]">
                    {is.sonuc?.guncelTutar
                      ? new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(is.sonuc.guncelTutar)
                      : "—"}
                  </p>
                </div>
                {is.sonuc?.bantAciklama && (
                  <p className="text-xs text-[#5A6478]">{is.sonuc.bantAciklama}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sonRapor.adminNotu && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <h3 className="text-xs font-semibold text-[#5A6478] mb-2">Uzman Notu</h3>
          <p className="text-sm text-[#0B1D3A] leading-relaxed">{sonRapor.adminNotu}</p>
        </div>
      )}
    </div>
  );
}

/* ── MALİ DURUM ── */
function TabMali({ company, onStatusChange }: { company: Company; onStatusChange: () => void }) {
  const MALI_DOCS_KEY = "musteri_mali_docs";
  const [yukluler, setYukluler] = useState<{bilancoFile?:string; gelirFile?:string; banka?:string}>(
    () => loadLS(`${MALI_DOCS_KEY}_${company.id}`, {})
  );

  const handleYukle = (field: string, file: File) => {
    const yeni = { ...yukluler, [field]: file.name };
    setYukluler(yeni);
    saveLS(`${MALI_DOCS_KEY}_${company.id}`, yeni);
  };

  const MALI_BELGELER = [
    { key: "bilancoFile", baslik: "Bilanço ve Gelir Tablosu", aciklama: "ivd.gib.gov.tr adresinden e-imzalı olarak indirilen bilanço ve gelir tablosu.", nasil: "ivd.gib.gov.tr > GİB uygulamaları > e-Arşiv > Bilanço bölümünden indirin. YMM/SMMM onaylı da kabul edilir.", zorunlu: true },
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
    </div>
  );
}

/* ── EVRAKLAR ── */
function TabEvraklar({ company, hizmetModeli }: { company: Company; hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor" }) {
  const grup = (company as any).hesaplananGrup || company.group || "H";
  const firmaTipi = company.companyType || "sahis";
  const isDeneyimiTipleri: string[] = [];
  if ((company as any).qualifications?.hasKatKarsiligi || (company as any).qualifications?.hasYapiIsi) {
    ((company as any).qualifications?.experiences || []).forEach((e: any) => {
      if (e.isDeneyimiTipi && !isDeneyimiTipleri.includes(e.isDeneyimiTipi)) isDeneyimiTipleri.push(e.isDeneyimiTipi);
    });
    if (!isDeneyimiTipleri.length) isDeneyimiTipleri.push("kat_karsiligi");
  }
  if ((company as any).qualifications?.hasDiploma) isDeneyimiTipleri.push("diploma");
  const muteahhitArsaSahibiAyni = ((company as any).qualifications?.experiences || []).some((e: any) => e.muteahhitArsaSahibiAyni);

  const evrakListe = evraklariUret(grup, firmaTipi, isDeneyimiTipleri, hizmetModeli, muteahhitArsaSahibiAyni);
  const DOCS_KEY = "musteri_evraklar";

  const [yukluler, setYukluler] = useState<Record<string, { dosyaAdi: string; yuklemeTarihi: string; durum: "bekliyor"|"onaylandi"|"reddedildi"; adminNotu?: string }>>(() =>
    loadLS(`${DOCS_KEY}_${company.id}`, {})
  );
  const [acik, setAcik] = useState<string | null>(null);

  const handleYukle = (id: string, file: File) => {
    const yeni = { ...yukluler, [id]: { dosyaAdi: file.name, yuklemeTarihi: new Date().toISOString(), durum: "bekliyor" as const } };
    setYukluler(yeni);
    saveLS(`${DOCS_KEY}_${company.id}`, yeni);
  };

  const onaylandi = evrakListe.filter(e => yukluler[e.id]?.durum === "onaylandi").length;
  const reddedilen = evrakListe.filter(e => yukluler[e.id]?.durum === "reddedildi").length;
  const yuklenmemis = evrakListe.filter(e => e.zorunlu && !yukluler[e.id]).length;

  return (
    <div className="space-y-5">
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

      <div className="bg-[#0B1D3A]/5 border border-[#0B1D3A]/10 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#0B1D3A]/50 shrink-0 mt-0.5" />
        <p className="text-xs text-[#5A6478]">
          Aşağıdaki liste <strong className="text-[#0B1D3A]">Grup {grup}</strong> için otomatik oluşturulmuştur.
          {hizmetModeli === "biz_yapiyoruz" ? " Evrakları yüklediğinizde ekibimiz kontrol edip süreci yönetir." : " Evrakları hazırlayıp il müdürlüğüne kendiniz başvuracaksınız."}
        </p>
      </div>

      <div className="space-y-2">
        {evrakListe.map(({ id, baslik, aciklama, musteridenNe, zorunlu, not }) => {
          const yukleme = yukluler[id];
          const isAcik = acik === id;
          const durumBg = yukleme?.durum === "onaylandi" ? "border-green-200" : yukleme?.durum === "reddedildi" ? "border-red-200" : "border-[#E8E4DC]";

          return (
            <div key={id} className={`bg-white rounded-xl border overflow-hidden ${durumBg}`}>
              <button onClick={() => setAcik(isAcik ? null : id)} className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-[#F8F7F4] transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${yukleme?.durum === "onaylandi" ? "bg-green-100" : yukleme?.durum === "reddedildi" ? "bg-red-100" : yukleme ? "bg-amber-100" : "bg-[#F0EDE8]"}`}>
                  {yukleme?.durum === "onaylandi" ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                   yukleme?.durum === "reddedildi" ? <X className="w-4 h-4 text-red-500" /> :
                   yukleme ? <Clock className="w-4 h-4 text-amber-600" /> :
                   <Clock className="w-4 h-4 text-[#5A6478]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#0B1D3A]">{baslik}</span>
                    {!zorunlu && <span className="text-[10px] bg-[#F0EDE8] text-[#5A6478] px-2 py-0.5 rounded-full">Opsiyonel</span>}
                    {zorunlu && !yukleme && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Gerekli</span>}
                  </div>
                  {not && <p className="text-xs text-[#5A6478] mt-0.5">{not}</p>}
                  {yukleme && <p className="text-xs text-[#5A6478]">{yukleme.dosyaAdi} · {new Date(yukleme.yuklemeTarihi).toLocaleDateString("tr-TR")}</p>}
                </div>
                {isAcik ? <ChevronUp className="w-4 h-4 text-[#5A6478] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#5A6478] shrink-0" />}
              </button>

              {isAcik && (
                <div className="px-5 pb-5 border-t border-[#F0EDE8]">
                  <p className="text-xs text-[#5A6478] mt-3 mb-2">{aciklama}</p>
                  {musteridenNe && (
                    <div className="bg-[#F8F7F4] rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-[#0B1D3A] mb-1">Nasıl yüklemeli?</p>
                      <p className="text-xs text-[#5A6478]">{musteridenNe}</p>
                    </div>
                  )}
                  {yukleme?.durum === "reddedildi" && yukleme.adminNotu && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-red-700 mb-1">Red sebebi</p>
                      <p className="text-xs text-red-600">{yukleme.adminNotu}</p>
                    </div>
                  )}
                  {yukleme?.durum === "onaylandi" ? (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                      <p className="text-xs text-green-700 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Evrak onaylandı.</p>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 border-2 border-dashed border-[#0B1D3A]/15 hover:border-[#C9952B]/50 rounded-xl px-4 py-3.5 cursor-pointer transition-colors group">
                      <Upload className="w-4 h-4 text-[#5A6478] group-hover:text-[#C9952B] shrink-0" />
                      <div>
                        <p className="text-sm text-[#5A6478] group-hover:text-[#0B1D3A]">{yukleme ? "Yeniden yükle" : "Dosya seç veya sürükle"}</p>
                        <p className="text-xs text-[#5A6478]/60">PDF, JPG veya PNG · Maks 10 MB</p>
                      </div>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) { handleYukle(id, f); setAcik(null); } }} />
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── BAŞVURU ── */
function TabBasvuru({ company, hizmetModeli }: { company: Company; hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor" }) {
  const BASVURU_CHECKLIST = [
    { id: "evraklar_hazir",  label: "Tüm zorunlu evraklar yüklendi ve onaylandı",    aciklama: "Evraklar sekmesindeki belgeler onay bekliyor." },
    { id: "mali_girildi",    label: "Bilanço bilgileri bakanlık sistemine girildi",    aciklama: "YBM sistemine bilanço ve gelir tablosu girilmeli." },
    { id: "banka_takasbank", label: "Banka referans mektubu Takasbank'a yüklendi",    aciklama: "Banka üzerinden Takasbank'a yüklenmiş olmalı." },
    { id: "harc_odendi",     label: "Bakanlık harcı ödendi",                          aciklama: "İl müdürlüğüne göre değişen harç tutarı ödenmiş olmalı." },
    { id: "edevlet_basvuru", label: "e-Devlet üzerinden başvuru tamamlandı",          aciklama: "edevlet.gov.tr > Çevre, Şehircilik Bakanlığı > Yapı Müteahhitliği" },
    { id: "fiziki_teslim",   label: "Evraklar il müdürlüğüne teslim edildi",          aciklama: "Bazı il müdürlükleri fiziki evrak da talep ediyor." },
  ];

  const [checks, setChecks] = useState<Record<string,boolean>>(() => loadLS(`basvuru_checks_${company.id}`, {}));
  const [not, setNot] = useState(() => loadLS(`basvuru_not_${company.id}`, ""));
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => {
    const yeni = { ...checks, [id]: !checks[id] };
    setChecks(yeni); saveLS(`basvuru_checks_${company.id}`, yeni);
  };

  const tamamlanan = BASVURU_CHECKLIST.filter(c => checks[c.id]).length;
  const tamam = tamamlanan === BASVURU_CHECKLIST.length;

  if (hizmetModeli === "biz_yapiyoruz") {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-base font-semibold text-[#0B1D3A] mb-2">Başvuruyu biz yapıyoruz</h3>
        <p className="text-sm text-[#5A6478] max-w-md mx-auto leading-relaxed">Evraklar onaylandıktan sonra ekibimiz bakanlık başvurusunu sizin adınıza tamamlayacaktır.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
        {BASVURU_CHECKLIST.map(item => (
          <button key={item.id} onClick={() => toggle(item.id)}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${checks[item.id] ? "border-green-200 bg-green-50" : "border-[#E8E4DC] bg-white hover:border-[#C9952B]/40"}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checks[item.id] ? "bg-[#C9952B] border-[#C9952B]" : "border-[#0B1D3A]/20"}`}>
              {checks[item.id] && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${checks[item.id] ? "text-green-800" : "text-[#0B1D3A]"}`}>{item.label}</p>
              {!checks[item.id] && <p className="text-xs text-[#5A6478] mt-0.5">{item.aciklama}</p>}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DC] p-5">
        <label className="block text-xs font-medium text-[#5A6478] mb-2">Başvuru notlarınız</label>
        <textarea value={not} onChange={e => setNot(e.target.value)} rows={3} placeholder="Başvuru tarihi, barkod no veya başka notlarınızı ekleyin..."
          className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
        <button onClick={() => { saveLS(`basvuru_not_${company.id}`, not); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="mt-3 flex items-center gap-1.5 text-xs bg-[#0B1D3A] hover:bg-[#122A54] text-white px-4 py-2 rounded-lg transition-colors">
          {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Kaydedildi</> : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

/* ── BELGE ── */
function TabBelge({ company, navigate }: { company: Company; navigate: any }) {
  const raporlar = loadLS(REPORTS_KEY, {});
  const sonRapor = (raporlar[company.id] || []).slice(-1)[0];
  const hesaplananGrup = sonRapor?.hesaplananGrup || (company as any).hesaplananGrup || company.group;

  const GRUP_SINIF: Record<string,string> = {
    "A":"V.D — Tüm yapı sınıfları","B":"V.D — Tüm yapı sınıfları","B1":"V.C","C":"V.B","C1":"V.A",
    "D":"IV.C","D1":"IV.B","E":"IV.A","E1":"III.C","F":"III.B","F1":"III.B","G":"III.B","G1":"III.B","H":"—",
  };

  const BELGE_KEY = "musteri_belge";
  const [belge, setBelge] = useState<{ belgeNo: string; grup: string; sinif: string; gecerlilikTarihi: string; notlar: string } | null>(() =>
    loadLS(`${BELGE_KEY}_${company.id}`, null)
  );
  const [form, setForm] = useState(belge || { belgeNo: "", grup: hesaplananGrup || "", sinif: GRUP_SINIF[hesaplananGrup] || "", gecerlilikTarihi: "", notlar: "" });
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

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0B1D3A]">Yeni iş deneyimi eklemek ister misiniz?</p>
          <p className="text-xs text-[#5A6478] mt-0.5">Tamamlanan yeni bir iş için güncelleme analizi yapabilirsiniz.</p>
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
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  const [activeTab, setActiveTab] = useState<DashboardTab>("analiz");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    const state = location.state as any;
    if (state?.defaultTab) setActiveTab(state.defaultTab as DashboardTab);
  }, [location.state]);

  const company = useMemo<Company | null>(() => {
    const all = loadLS(MOCK_COMPANIES_KEY, []);
    const email = user?.email || (() => {
      try { const s = localStorage.getItem("mock_auth_user"); return s ? JSON.parse(s).user?.email : null; } catch { return null; }
    })();
    if (!email) return all[all.length - 1] || null;
    return all.filter((c: any) => c.userEmail === email || c.email === email).slice(-1)[0] || null;
  }, [user, refreshKey]);

  const status = useMemo<AppStatus>(() => {
    if (!company) return "wizard_incomplete";
    return getStatusFromCompany(company);
  }, [company, refreshKey]);

  const visibleTabs = useMemo(() => getTabsVisible(status, company?.group || "H"), [status, company?.group]);

  const invoices = useMemo<Invoice[]>(() => {
    if (!company) return [];
    const all = loadLS(MOCK_BILLING_KEY, {});
    return all[company.id] || [];
  }, [company, refreshKey]);

  const hizmetModeli = company?.hizmetModeli || "musteri_yapiyor";

  const [showTeklif, setShowTeklif] = useState(false);
  useEffect(() => {
    if (
      status === "report_published" &&
      company?.location === "istanbul" &&
      !company?.basvuruTeklifiGosterildi
    ) {
      setTimeout(() => setShowTeklif(true), 800);
    }
  }, [status, company]);

  const handleTeklif = (kabul: boolean) => {
    if (!company) return;
    const all = loadLS(MOCK_COMPANIES_KEY, []);
    const updated = all.map((c: any) => c.id === company.id
      ? { ...c, basvuruTeklifiGosterildi: true, basvuruTeklifiKabul: kabul,
          hizmetModeli: kabul ? "biz_yapiyoruz" : "musteri_yapiyor" }
      : c
    );
    saveLS(MOCK_COMPANIES_KEY, updated);
    setShowTeklif(false);
    refresh();
  };

  const handleSignOut = async () => {
    await signOut();
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  };

  if (!company && status === "wizard_incomplete") {
    return (
      <div className="min-h-screen bg-[#F8F7F4] font-[Inter] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 max-w-sm w-full text-center">
          <Award className="w-12 h-12 text-[#C9952B] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0B1D3A] mb-2">Analizinizi başlatın</h2>
          <p className="text-sm text-[#5A6478] mb-6">Müteahhitlik belgesi grubunuzu öğrenmek için wizard'ı tamamlayın.</p>
          <button onClick={() => navigate("/wizard")}
            className="w-full bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
            <ArrowRight className="w-4 h-4" /> Wizard'ı Başlat
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
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
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
          {activeTab === "rapor"    && company && <TabRapor    status={status} company={company} />}
          {activeTab === "evraklar" && company && <TabEvraklar company={company} hizmetModeli={hizmetModeli} />}
          {activeTab === "basvuru"  && company && <TabBasvuru  company={company} hizmetModeli={hizmetModeli} />}
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
