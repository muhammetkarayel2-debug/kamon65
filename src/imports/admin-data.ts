import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Award, BarChart3, Building2, FileText, CreditCard, FolderOpen,
  Send, CheckCircle, Lock, Clock, AlertTriangle, ChevronRight,
  LogOut, Plus, Upload, Eye, Download, X, Info, Users,
  ArrowRight, RefreshCw, Trash2, Edit2, Save, Check
} from "lucide-react";
import { useAuth } from "./auth-context";

/* ─────────────────────────────────────────────────────────────
   STORAGE HELPERS  (localStorage — Supabase'e taşınacak)
───────────────────────────────────────────────────────────── */
const MOCK_COMPANIES_KEY = "mock_panel_companies";
const MOCK_BILLING_KEY   = "mock_panel_billing";
const MOCK_PROCESS_KEY   = "mock_panel_process";

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
  A:123825000,B:86677500,B1:74295000,C:61912500,C1:51393750,
  D:41275000,D1:30956250,E:20637500,E1:12382500,F:6191250,
  F1:5262562.5,G:4333875,G1:3095625
};

function getStatusFromCompany(c: Company): AppStatus {
  if (c.appStatus) return c.appStatus;
  if (!c.qualifications) return "wizard_incomplete";
  const needsFinancial = FINANCIAL_REQUIRED.includes(c.group);
  const allBilling = loadLS<Record<string, Invoice[]>>(MOCK_BILLING_KEY, {});
  const invoices = allBilling[c.id] || [];
  const paid = invoices.some(i => i.status === "paid");
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
   EVRAK LİSTESİ ÜRETİCİ (basitleştirilmiş)
───────────────────────────────────────────────────────────── */
function buildDocList(company: Company, hizmetModeli: "biz_yapiyoruz" | "musteri_yapiyor"): DocItem[] {
  const biz = hizmetModeli === "biz_yapiyoruz";
  const tuzel = company.companyType === "limited_as" || company.companyType === "as";
  const qual = company.qualifications;
  const docs: DocItem[] = [];

  const doc = (id: string, baslik: string, grubu: string, not?: string, bankaTutari?: number): DocItem => ({
    id, baslik, grubu, zorunlu: true, not, bankaTutari,
    durum: "bekleniyor",
  });

  // Kimlik & Firma
  docs.push(doc("mukellefiyet", "Mükellefiyet belgesi", "Kimlik ve firma", "e-Devlet'ten e-imzalı PDF. PDF okunaklı olmalıdır."));
  docs.push(doc("imza", "İmza " + (tuzel ? "sirküleri" : "beyannamesi"), "Kimlik ve firma", "e-imzalı PDF. PDF okunaklı olmalıdır."));

  if (!biz) {
    docs.push({ ...doc("nufus", "Nüfus cüzdanı fotokopisi", "Kimlik ve firma", "İl müdürlüğüne göre gerekebilir."), zorunlu: false });
    docs.push({ ...doc("vergi", "Vergi levhası", "Kimlik ve firma", "İl müdürlüğüne göre gerekebilir."), zorunlu: false });
    docs.push(doc("dilekce", "Dilekçe", "Kimlik ve firma", "Bakanlık formatında hazırlanıp imzalanarak PDF olarak gönderilmeli."));
  }

  if (!tuzel && company.location !== "istanbul") {
    docs.push(doc("ticaret_odasi", "Ticaret odası kayıt belgesi", "Kimlik ve firma",
      "Faaliyet kodu 41.00.01 (İkamet amaçlı binaların inşaatı) belgede görünmeli. PDF okunaklı olmalıdır."));
  }

  // İş deneyimi
  if (qual?.hasKatKarsiligi) {
    docs.push(doc("ruhsat", "Yapı ruhsatı", "İş deneyimi", "PDF olarak gönderilmeli. PDF okunaklı olmalıdır."));
    docs.push(doc("iskan", "İskan belgesi", "İş deneyimi", "PDF olarak gönderilmeli. PDF okunaklı olmalıdır."));
    docs.push(doc("kat_soz", "Kat karşılığı inşaat sözleşmesi", "İş deneyimi", "PDF olarak gönderilmeli. PDF okunaklı olmalıdır."));
    docs.push(doc("ekap_kat", "EKAP iş deneyim belgesi", "İş deneyimi", "EKAP'tan e-imzalı PDF olarak gönderilmeli."));
  }

  if (qual?.hasDiploma) {
    docs.push(doc("mezuniyet", "Mezuniyet belgesi / Diploma", "Diploma ve mezuniyet",
      "e-Devlet'ten e-imzalı PDF (tercih) — yoksa diploma aslının noter onaylı nüshası fiziksel olarak teslim edilmeli."));
  }

  // Mali yeterlilik
  const grp = company.group;
  const maliSart = FINANCIAL_REQUIRED.includes(grp);
  const bankaTutari = BANKA_REFERANS[grp];

  if (maliSart) {
    docs.push(doc("bilanco", "Bilanço ve gelir tablosu", "Mali yeterlilik",
      "ivd.gib.gov.tr'den e-imzalı PDF olarak indirilip gönderilmeli."));
    if (!biz) {
      docs.push(doc("ek2", "EK-2 Mali Yeterlik Bildirim Formu", "Mali yeterlilik",
        "YMM/SMMM ile birlikte doldurulup imzalanmalı."));
    }
  }

  if (bankaTutari) {
    docs.push(doc("banka_ref", "Banka referans mektubu", "Mali yeterlilik",
      `${grp} grubu için asgari tutar: ${tl(bankaTutari)} — banka tarafından Takasbank sistemine yüklenmesi zorunludur.`,
      bankaTutari));
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
  const locked = status !== "pending_payment" && status !== "pending_financial" && status !== "wizard_incomplete";
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
              <p className="text-sm font-medium text-orange-700">Wizard tamamlanmadı</p>
              <p className="text-xs text-orange-600 mt-0.5">Analizin başlatılması için wizard'ı tamamlayınız.</p>
            </div>
          </div>
        )}

        {status === "report_published" || status === "docs_in_progress" || status === "docs_complete" || status === "application_submitted" || status === "certificate_received" ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Analiz tamamlandı</p>
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
function TabMali({ company, onStatusChange }: { company: Company; onStatusChange: () => void }) {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    yil1: new Date().getFullYear() - 1 + "",
    donenVarlik: "", kvBorc: "", ozkaynak: "", toplamAktif: "",
    kvBankaBorc: "", yyMaliyet: "", yyHakedis: "",
  });

  const fmt = (v: string) => {
    const raw = v.replace(/\D/g, "");
    if (!raw) return "";
    return parseInt(raw).toLocaleString("tr-TR");
  };
  const parse = (v: string) => parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;

  const cariOran = useMemo(() => {
    const dv = parse(form.donenVarlik), kv = parse(form.kvBorc),
          yyM = parse(form.yyMaliyet), yyH = parse(form.yyHakedis);
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
    const companies = loadLS<any[]>(MOCK_COMPANIES_KEY, []);
    const updated = companies.map(c =>
      c.id === company.id
        ? { ...c, appStatus: "pending_payment", financialData: { ...form, cariOran, ozOran, borcOran } }
        : c
    );
    saveLS(MOCK_COMPANIES_KEY, updated);
    setSaved(true);
    setTimeout(() => { setSaved(false); onStatusChange(); }, 1000);
  };

  const OranSatiri = ({ label, val, esik, buyukIyi }: { label: string; val: number | null; esik: number; buyukIyi: boolean }) => {
    if (val === null) return (
      <div className="flex items-center justify-between py-2.5 border-b border-[#F0EDE8]">
        <span className="text-sm text-[#5A6478]">{label}</span>
        <span className="text-sm text-[#5A6478]">—</span>
      </div>
    );
    const gecti = buyukIyi ? val >= esik : val <= esik;
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-[#F0EDE8] last:border-0">
        <div>
          <span className="text-sm text-[#0B1D3A]">{label}</span>
          <span className="text-xs text-[#5A6478] ml-2">{buyukIyi ? `≥ ${esik}` : `≤ ${esik}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${gecti ? "text-green-600" : "text-red-500"}`}>
            {val.toFixed(4)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${gecti ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {gecti ? "Karşılandı" : "Karşılanmadı"}
          </span>
        </div>
      </div>
    );
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-[#F0EDE8] border border-[#0B1D3A]/8 focus:border-[#C9952B] focus:ring-1 focus:ring-[#C9952B] outline-none text-sm text-right";

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Başvurunuzu tamamlayabilmemiz için mali durum bilgilerinizi girmeniz gerekmektedir.
          Tüm rakamları Türk Lirası cinsinden giriniz.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
        <h3 className="text-sm font-semibold text-[#0B1D3A] mb-5">Bilanço bilgileri</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Dönen varlıklar", field: "donenVarlik" },
            { label: "Kısa vadeli borçlar", field: "kvBorc" },
            { label: "Özkaynaklar", field: "ozkaynak" },
            { label: "Toplam aktif", field: "toplamAktif" },
            { label: "KV banka borçları", field: "kvBankaBorc" },
            { label: "YY inşaat maliyetleri (varsa)", field: "yyMaliyet" },
            { label: "YY inşaat hakediş gelirleri (varsa)", field: "yyHakedis" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="block text-xs text-[#5A6478] mb-1">{label}</label>
              <input
                value={(form as any)[field]}
                onChange={e => setForm(p => ({ ...p, [field]: fmt(e.target.value) }))}
                placeholder="0"
                className={inputCls}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-[#E8E4DC]">
          <h4 className="text-sm font-semibold text-[#0B1D3A] mb-3">Otomatik hesaplanan oranlar</h4>
          <p className="text-xs text-[#5A6478] mb-3">Yıllara yaygın inşaat kalemleri ilgili kalemlerden düşüldükten sonra hesaplanır. Yuvarlama yapılmaz.</p>
          <OranSatiri label="Cari oran"          val={cariOran} esik={0.75} buyukIyi={true}  />
          <OranSatiri label="Özkaynak oranı"     val={ozOran}   esik={0.15} buyukIyi={true}  />
          <OranSatiri label="KV banka borç oranı"val={borcOran} esik={0.75} buyukIyi={false} />
        </div>

        <button onClick={handleSave}
          className="mt-5 w-full bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
          {saved ? <><Check className="w-4 h-4" /> Kaydedildi</> : <><Save className="w-4 h-4" /> Kaydet ve devam et</>}
        </button>
      </div>
    </div>
  );
}

/* ── ÖDEME ── */
function TabOdeme({ company, invoices }: { company: Company; invoices: Invoice[] }) {
  const paid = invoices.filter(i => i.status === "paid");
  const unpaid = invoices.filter(i => i.status !== "paid");

  return (
    <div className="space-y-5">
      {unpaid.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">Bekleyen ödemeler</h3>
          </div>
          {unpaid.map(inv => (
            <div key={inv.id} className="px-5 py-4 flex items-center justify-between border-b border-[#F0EDE8] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#0B1D3A]">{inv.description}</p>
                <p className="text-xs text-[#5A6478] mt-0.5">Son ödeme: {formatDate(inv.dueDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-[#0B1D3A]">{inv.amount}</p>
                <button onClick={() => window.location.href = "/paywall"}
                  className="mt-1 text-xs bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-3 py-1 rounded-lg transition-colors">
                  Öde
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {paid.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E4DC]">
            <h3 className="text-sm font-semibold text-[#0B1D3A]">Ödeme geçmişi</h3>
          </div>
          {paid.map(inv => (
            <div key={inv.id} className="px-5 py-4 flex items-center justify-between border-b border-[#F0EDE8] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#0B1D3A]">{inv.description}</p>
                <p className="text-xs text-[#5A6478] mt-0.5">{formatDate(inv.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">{inv.amount}</p>
                <span className="text-xs text-green-600 flex items-center gap-1 justify-end mt-0.5">
                  <CheckCircle className="w-3 h-3" /> Ödendi
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {invoices.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-10 text-center">
          <CreditCard className="w-8 h-8 text-[#5A6478] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[#5A6478]">Henüz fatura oluşturulmamış.</p>
        </div>
      )}
    </div>
  );
}

/* ── RAPOR ── */
function TabRapor({ status, company }: { status: AppStatus; company: Company }) {
  if (status === "report_locked" || status === "payment_received") {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F0EDE8] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-[#5A6478]" />
        </div>
        <h3 className="text-base font-semibold text-[#0B1D3A] mb-2">Raporunuz hazırlanıyor</h3>
        <p className="text-sm text-[#5A6478]">En kısa sürede bildirim alacaksınız.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[#0B1D3A] to-[#122A54] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/60 mb-1">Yetki Belgesi Yeterlilik Raporu</p>
            <h3 className="text-lg font-bold">{company.companyName}</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#C9952B]/20 text-[#C9952B] text-sm font-bold">
            {company.group} Grubu
          </span>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="flex-1 bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            <Eye className="w-4 h-4" /> Raporu Görüntüle
          </button>
          <button className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── EVRAKLAR ── */
function TabEvraklar({ docs }: { docs: DocItem[] }) {
  const gruplar = [...new Set(docs.map(d => d.grubu))];
  const zorunlu = docs.filter(d => d.zorunlu).length;
  const onaylandi = docs.filter(d => d.durum === "onaylandi").length;
  const eksik = docs.filter(d => d.durum === "reddedildi").length;

  return (
    <div className="space-y-5">
      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tamamlanan", val: onaylandi, color: "text-green-600" },
          { label: "Hatalı",     val: eksik,     color: "text-red-500"   },
          { label: "Toplam",     val: zorunlu,   color: "text-[#0B1D3A]" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E8E4DC] p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[#5A6478] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {eksik > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{eksik} evrak hatalı veya eksik — tamamlanması gerekmektedir.</p>
        </div>
      )}

      {gruplar.map(grup => {
        const grpDocs = docs.filter(d => d.grubu === grup);
        const tamam = grpDocs.filter(d => d.durum === "onaylandi").length;
        const ilerleme = Math.round(tamam / grpDocs.length * 100);

        return (
          <div key={grup} className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
            <div className="px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0B1D3A]">{grup}</span>
              <div className="flex items-center gap-3">
                <div className="w-20 h-1.5 bg-[#E8E4DC] rounded-full">
                  <div className="h-full bg-[#C9952B] rounded-full transition-all" style={{ width: `${ilerleme}%` }} />
                </div>
                <span className="text-xs text-[#5A6478]">{tamam}/{grpDocs.length}</span>
              </div>
            </div>

            {grpDocs.map(d => (
              <div key={d.id} className="px-5 py-4 border-b border-[#F0EDE8] last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#0B1D3A]">{d.baslik}</span>
                      {!d.zorunlu && <span className="text-xs text-[#5A6478]">(opsiyonel)</span>}
                    </div>
                    {d.not && <p className="text-xs text-[#5A6478] mt-1">{d.not}</p>}
                    {d.adminNotu && (
                      <div className="mt-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-red-600">{d.adminNotu}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DocDurumBadge durum={d.durum} />
                    <button className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      d.durum === "reddedildi"
                        ? "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                        : "border border-[#E8E4DC] text-[#5A6478] hover:bg-[#F0EDE8]"
                    }`}>
                      {d.durum === "bekleniyor" ? "Yükle" : d.durum === "reddedildi" ? "Yeniden Yükle" : "Görüntüle"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ── BAŞVURU ── */
function TabBasvuru({ status, company }: { status: AppStatus; company: Company }) {
  const [basvuruNo, setBasvuruNo] = useState("");

  return (
    <div className="space-y-5">
      {status === "docs_complete" && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">Tüm evraklar tamam</p>
            <p className="text-xs text-green-600 mt-1">
              {company.location === "istanbul"
                ? "Başvurunuz ekibimiz tarafından yapılacaktır. Bilgilendirme alacaksınız."
                : "Evraklarınız hazır. İl Müdürlüğü'ne başvuruyu yapabilirsiniz."}
            </p>
          </div>
        </div>
      )}

      {status === "application_submitted" && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Başvuru yapıldı, sonuç bekleniyor
          </h3>
          <p className="text-xs text-blue-600">Bakanlık sonucu bildirimlerde görünecektir.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
        <h3 className="text-sm font-semibold text-[#0B1D3A] mb-4">Başvuru takip numarası</h3>
        <div className="flex gap-3">
          <input
            value={basvuruNo}
            onChange={e => setBasvuruNo(e.target.value)}
            placeholder="YKB-2026-XXXXX"
            className="flex-1 px-3 py-2.5 rounded-lg bg-[#F0EDE8] border border-[#0B1D3A]/8 focus:border-[#C9952B] outline-none text-sm font-mono"
          />
          <button className="px-4 py-2.5 bg-[#0B1D3A] hover:bg-[#122A54] text-white text-sm rounded-lg transition-colors">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── BELGE ── */
function TabBelge({ process, company }: { process: ProcessData | null; company: Company }) {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[#0B1D3A] to-[#122A54] rounded-2xl p-8 text-white text-center">
        <Award className="w-12 h-12 text-[#C9952B] mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Yetki Belgesi Alındı</h3>
        <p className="text-white/60 text-sm mb-1">{company.companyName}</p>
        <span className="inline-block mt-2 px-4 py-1.5 rounded-full bg-[#C9952B]/20 text-[#C9952B] text-sm font-bold">
          {company.group} Grubu
        </span>
      </div>

      {process && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
          <h3 className="text-sm font-semibold text-[#0B1D3A] mb-4">Belge bilgileri</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard label="Belge numarası"   value={process.certificateNo || "—"} />
            <InfoCard label="Barkod no"         value={process.barcodeNo || "—"} />
            <InfoCard label="Düzenleme tarihi"  value={process.certificateDate ? formatDate(process.certificateDate) : "—"} />
            <InfoCard label="Geçerlilik sonu"   value={process.certificateExpiry ? formatDate(process.certificateExpiry) : "—"} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0B1D3A]">Yeni iş deneyimi eklemek ister misiniz?</p>
          <p className="text-xs text-[#5A6478] mt-0.5">Yükseltme için analiz sekmesinden iş ekleyebilirsiniz.</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs bg-[#C9952B]/10 hover:bg-[#C9952B]/20 text-[#C9952B] border border-[#C9952B]/30 px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Yeni İş Ekle
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANA BILEŞEN
───────────────────────────────────────────────────────────── */
export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>("analiz");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  // Wizard'dan gelen defaultTab
  useEffect(() => {
    const state = location.state as any;
    if (state?.defaultTab) setActiveTab(state.defaultTab as DashboardTab);
  }, [location.state]);

  /* Müşterinin şirketini bul */
  const company = useMemo<Company | null>(() => {
    const all = loadLS<Company[]>(MOCK_COMPANIES_KEY, []);
    const email = user?.email || (() => {
      try { const s = localStorage.getItem("mock_auth_user"); return s ? JSON.parse(s).user?.email : null; } catch { return null; }
    })();
    if (!email) return all[all.length - 1] || null; // dev fallback
    return all.filter(c => c.userEmail === email || c.email === email).slice(-1)[0] || null;
  }, [user, refreshKey]);

  const status = useMemo<AppStatus>(() => {
    if (!company) return "wizard_incomplete";
    return getStatusFromCompany(company);
  }, [company, refreshKey]);

  const visibleTabs = useMemo(() => getTabsVisible(status, company?.group || "H"), [status, company?.group]);

  const invoices = useMemo<Invoice[]>(() => {
    if (!company) return [];
    const all = loadLS<Record<string, Invoice[]>>(MOCK_BILLING_KEY, {});
    return all[company.id] || [];
  }, [company, refreshKey]);

  const process = useMemo<ProcessData | null>(() => {
    if (!company) return null;
    const all = loadLS<Record<string, ProcessData>>(MOCK_PROCESS_KEY, {});
    return all[company.id] || null;
  }, [company, refreshKey]);

  const docs = useMemo<DocItem[]>(() => {
    if (!company || !visibleTabs.has("evraklar")) return [];
    return buildDocList(company, company.hizmetModeli || "musteri_yapiyor");
  }, [company, visibleTabs]);

  // İstanbul başvuru teklifi (rapor yayınlandıktan sonra bir kez)
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
    const all = loadLS<Company[]>(MOCK_COMPANIES_KEY, []);
    const updated = all.map(c => c.id === company.id
      ? { ...c, basvuruTeklifiGosterildi: true, basvuruTeklifiKabul: kabul,
          hizmetModeli: kabul ? "biz_yapiyoruz" : "musteri_yapiyor" }
      : c
    );
    saveLS(MOCK_COMPANIES_KEY, updated);
    setShowTeklif(false);
    if (kabul) navigate("/paywall");
    else refresh();
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  /* ── Wizard'a yönlendir (şirket yoksa) ── */
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
          {activeTab === "rapor"    && company && <TabRapor    status={status} company={company} />}
          {activeTab === "evraklar" && company && <TabEvraklar docs={docs} />}
          {activeTab === "basvuru"  && company && <TabBasvuru  status={status} company={company} />}
          {activeTab === "belge"    && company && <TabBelge    process={process} company={company} />}
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
