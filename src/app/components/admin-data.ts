// ── Shared types & storage helpers for admin panel ──

// ─── Hizmet Paketleri ─────────────────────────────────────────────
export const PAKETLER = {
  bilgi_alma: {
    label: "Bilgi Alma Danışmanlığı",
    fiyat: 7000,
    aciklama: "Telefon/e-posta danışmanlığı"
  },
  sadece_hesaplama: {
    label: "İş Deneyim Hesaplama",
    fiyat: 11000,
    aciklama: "Hesaplama + mali yeterlilik analizi"
  },
  hesaplama_basvuru: {
    label: "Hesaplama + Başvuru",
    fiyat: 20000,
    aciklama: "Hesaplama + başvuru (biz yaparız)"
  }
} as const;

// ─── Durum Haritası ───────────────────────────────────────────────
export const STATUS_MAP = {
  pending_payment: "Ödeme Bekleniyor",
  payment_received: "Ödeme Alındı",
  report_published: "Rapor Yayınlandı",
  docs_in_progress: "Evrak Toplanıyor",
  certificate_received: "Belge Alındı"
} as const;

export interface Company {
  id: string;
  companyName: string;
  taxId: string;
  phone: string;
  email: string;
  companyType: string;
  foundingYear?: string;
  location: string;
  city: string;
  group: string;
  partners?: { name: string; sharePercent: string; tcNo?: string }[];
  kepAddress?: string;
  hasSpecificArea?: string;
  minAreaRequirement?: string;
  isFirstTime?: string;
  selectedService?: string;
  serviceLabel?: string;
  userEmail?: string;
  // Ödeme ve durum takibi
  appStatus?: "pending_payment" | "payment_received" | "report_published" | "docs_in_progress" | "certificate_received";
  paket?: "bilgi_alma" | "sadece_hesaplama" | "hesaplama_basvuru";
  paketLabel?: string;
  paketFiyat?: number;
  // Hesaplama sonucu
  hesaplama?: any;
  qualifications?: {
    hasKatKarsiligi: boolean;
    hasYapiIsi?: boolean;
    hasDiploma: boolean;
    hasNone: boolean;
    experiences: {
      contractDate?: string;
      occupancyDate?: string;
      totalArea?: string;
      buildingHeight?: string;
      buildingClass?: string;
      isDeneyimiTipi?: string;
      adaParsel?: string;
      sozlesmeTarihi?: string;
      sozTarih?: string;
      iskanTarih?: string;
      alan?: string;
      yukseklik?: string;
      sinif?: string;
      sinif2026?: string;
      yapiTipi?: string;
      sozlesmeBedeli?: string;
      bedel?: string;
      muteahhitArsaSahibiAyni?: boolean;
      muteahhitArsaAyni?: boolean;
    }[];
    diploma?: {
      partnerName: string;
      department: string;
      gradDate: string;
      partnershipYears: string;
      sharePercent: string;
      mezuniyetTarihi?: string;
    } | null;
  };
  // Mevcut müteahhitlik belgesi bilgileri
  existingCertNo?: string;
  existingCertGroup?: string;
  existingCertExpiry?: string;
  // Analiz sonucu (admin tarafından)
  analysisStatus?: "bekliyor" | "sonuclandi" | null;
  analysisResult?: {
    recommendedGroup: string;
    note: string;
    repliedAt: string;
  };
  // Mali yeterlilik
  financialAdequacy?: {
    status: "bekliyor" | "inceleniyor" | "onaylandi" | "reddedildi";
    note?: string;
    requestedAt?: string;
    reviewedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProcessData {
  status: string;
  statusLabel: string;
  statusHistory: { date: string; label: string; note?: string }[];
  barcodeNo?: string;
  certificateNo?: string;
  feePayments?: { date: string; description: string; amount: string }[];
  certificateDate?: string;
  certificateExpiry?: string;
  companyId: string;
}

export interface DocMeta {
  path: string;
  docType: string;
  fileName: string;
  size: number;
  uploadedAt: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  userId?: string;
  date: string;
  dueDate: string;
  description: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  paidAt?: string;
  paymentMethod?: "card" | "transfer";
}

export interface AdminReport {
  id: string;
  companyId: string;
  userEmail: string;
  companyName: string;
  title: string;
  content: string;
  reportType: string;
  sentAt: string;
  isRead: boolean;
}

export interface AdminMessage {
  id: string;
  userEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  isRead: boolean;
}

export interface AdminBlogOverride {
  id: string;
  title?: string;
  excerpt?: string;
  tags?: string[];
  published?: boolean;
}

// ── NEW: Analysis Request ──
export interface AnalysisRequest {
  id: string;
  fullName: string;
  companyName: string;
  taxId: string;
  phone: string;
  email: string;
  companyType: string;
  location: string;
  city?: string;
  isFirstTime: string;
  group?: string;
  note?: string;
  status: "bekliyor" | "incelendi" | "tamamlandi" | "reddedildi";
  createdAt: string;
  adminReply?: string;
  repliedAt?: string;
  linkedCompanyId?: string;
  recommendedGroup?: string;
}

// ── NEW: Document Request ──
export interface DocRequest {
  id: string;
  companyId: string;
  companyName: string;
  userEmail: string;
  docTypes: string[];
  message: string;
  deadline?: string;
  status: "bekliyor" | "tamamlandi" | "iptal";
  createdAt: string;
  completedAt?: string;
}

// ── NEW: Custom Blog Post ──
export interface CustomBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  authorTitle: string;
  publishedAt: string;
  readingTime: number;
  tags: string[];
  published: boolean;
  createdAt: string;
}

// ── Storage Keys ──
export const MOCK_COMPANIES_KEY = "mock_panel_companies";
export const MOCK_DOCS_KEY = "mock_panel_docs";
export const MOCK_PROCESS_KEY = "mock_panel_process";
export const MOCK_BILLING_KEY = "mock_panel_billing";
export const ADMIN_REPORTS_KEY = "admin_reports";
export const ADMIN_MESSAGES_KEY = "admin_messages";
export const ADMIN_SESSION_KEY = "admin_auth_session";
export const ADMIN_BLOG_KEY = "admin_blog_overrides";
export const ANALYSIS_REQUESTS_KEY = "admin_analysis_requests";
export const DOC_REQUESTS_KEY = "admin_doc_requests";
export const CUSTOM_BLOG_POSTS_KEY = "admin_custom_blog_posts";
export const FINANCIAL_ADEQUACY_KEY = "admin_financial_adequacy";

// ── AppStatus tipi ve config (10 durum) ──
export type AppStatus =
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

export const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; border: string }> = {
  wizard_incomplete:     { label: "Wizard eksik",            color: "text-gray-600",   bg: "bg-gray-100",   border: "border-gray-200"  },
  pending_financial:     { label: "Mali bilgi bekleniyor",   color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  pending_payment:       { label: "Ödeme bekleniyor",        color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  payment_received:      { label: "Ödeme alındı",            color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  report_locked:         { label: "Rapor hazırlanıyor",      color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  report_published:      { label: "Rapor yayınlandı",        color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  docs_in_progress:      { label: "Evrak toplanıyor",        color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  docs_complete:         { label: "Evraklar tamam",          color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  application_submitted: { label: "Başvuru yapıldı",         color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  certificate_received:  { label: "Belge alındı",            color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
};

// ── Helpers ──
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}
export function saveToStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Labels ──
export const COMPANY_TYPE_LABELS: Record<string, string> = {
  sahis: "Şahıs Şirketi",
  limited_as: "Limited / A.Ş.",
  kooperatif: "Kooperatif",
};

export const ALL_GROUPS = ["H", "G", "G1", "F", "F1", "E", "E1", "D", "D1", "C", "C1", "B", "B1", "A"];

// Groups requiring financial adequacy (H, G, G1 exempt)
export const FINANCIAL_REQUIRED_GROUPS = ["F", "F1", "E", "E1", "D", "D1", "C", "C1", "B", "B1", "A"];

export const DOC_TYPE_LABELS: Record<string, string> = {
  imza_sirkuleri: "İmza Sirküleri",
  mukellefiyet: "Mükellefiyet Belgesi",
  ruhsat: "Yapı Ruhsatı",
  iskan: "İskan Belgesi",
  is_deneyim: "İş Deneyim Belgesi",
  kat_karsiligi: "Kat Karşılığı Sözleşme",
  banka_referans: "Banka Referans Mektubu",
  bilanco_eimzali: "E-İmzalı Bilanço",
  diger: "Diğer",
};

export const PROCESS_STATUSES = [
  { value: "bekliyor", label: "Beklemede", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "incelemede", label: "İncelemede", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "eksik_evrak", label: "Eksik Evrak", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "tamamlandi", label: "Tamamlandı", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "reddedildi", label: "Reddedildi", color: "bg-red-100 text-red-700 border-red-200" },
];

export const REPORT_TYPES = [
  { value: "analiz_raporu", label: "Analiz Raporu" },
  { value: "grup_tespiti", label: "Grup Tespit Raporu" },
  { value: "evrak_eksiklik", label: "Evrak Eksiklik Bildirimi" },
  { value: "basvuru_sonucu", label: "Başvuru Sonuç Raporu" },
  { value: "bilgilendirme", label: "Genel Bilgilendirme" },
];

export function getStatusInfo(status: string) {
  return PROCESS_STATUSES.find(s => s.value === status) || PROCESS_STATUSES[0];
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

export function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

// ── Seed demo data ──
export function seedDemoData() {
  const existing = loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []);
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const companies: Company[] = [
    {
      id: "demo-001",
      companyName: "Doruk Yapı İnşaat A.Ş.",
      taxId: "1234567890",
      phone: "0212 555 1234",
      email: "info@dorukyapi.com",
      companyType: "limited_as",
      foundingYear: "2015",
      location: "istanbul",
      city: "İstanbul",
      group: "E",
      userEmail: "ali.yilmaz@dorukyapi.com",
      kepAddress: "dorukyapi@hs01.kep.tr",
      isFirstTime: "renewal",
      serviceLabel: "Grup Yükseltme",
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: now,
    },
    {
      id: "demo-002",
      companyName: "Kuzey İnşaat Taahhüt Ltd. Şti.",
      taxId: "9876543210",
      phone: "0312 444 5678",
      email: "info@kuzeyin.com",
      companyType: "limited_as",
      foundingYear: "2019",
      location: "ankara",
      city: "Ankara",
      group: "G",
      userEmail: "mehmet.demir@kuzeyin.com",
      isFirstTime: "first",
      serviceLabel: "İlk Başvuru",
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      updatedAt: now,
    },
    {
      id: "demo-003",
      companyName: "Ege Yapı Kooperatifi",
      taxId: "5551234567",
      phone: "0232 333 9090",
      email: "info@egeyapikooperatif.com",
      companyType: "kooperatif",
      foundingYear: "2010",
      location: "izmir",
      city: "İzmir",
      group: "F",
      userEmail: "ayse.kaya@egeyapi.com",
      isFirstTime: "renewal",
      serviceLabel: "Yenileme",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: now,
    },
  ];
  saveToStorage(MOCK_COMPANIES_KEY, companies);

  const processes: Record<string, ProcessData> = {
    "demo-001": {
      companyId: "demo-001",
      status: "incelemede",
      statusLabel: "İncelemede",
      barcodeNo: "YKB-2026-001234",
      statusHistory: [
        { date: new Date(Date.now() - 86400000 * 28).toISOString(), label: "Başvuru Alındı", note: "Dosya sisteme yüklendi." },
        { date: new Date(Date.now() - 86400000 * 25).toISOString(), label: "Ön İnceleme Başladı" },
        { date: new Date(Date.now() - 86400000 * 10).toISOString(), label: "İncelemede", note: "Uzman değerlendirmesi devam ediyor." },
      ],
    },
    "demo-002": {
      companyId: "demo-002",
      status: "eksik_evrak",
      statusLabel: "Eksik Evrak",
      statusHistory: [
        { date: new Date(Date.now() - 86400000 * 13).toISOString(), label: "Başvuru Alındı" },
        { date: new Date(Date.now() - 86400000 * 5).toISOString(), label: "Eksik Evrak", note: "İmza sirküleri güncel değil. Lütfen yenileyiniz." },
      ],
    },
    "demo-003": {
      companyId: "demo-003",
      status: "tamamlandi",
      statusLabel: "Tamamlandı",
      barcodeNo: "YKB-2026-000789",
      certificateNo: "F-2026-00412",
      certificateDate: "2026-01-15",
      certificateExpiry: "2030-01-15",
      statusHistory: [
        { date: new Date(Date.now() - 86400000 * 60).toISOString(), label: "Başvuru Alındı" },
        { date: new Date(Date.now() - 86400000 * 55).toISOString(), label: "İncelemede" },
        { date: new Date(Date.now() - 86400000 * 45).toISOString(), label: "Onaylandı" },
        { date: new Date(Date.now() - 86400000 * 40).toISOString(), label: "Tamamlandı", note: "Belge teslim edildi." },
      ],
    },
  };
  saveToStorage(MOCK_PROCESS_KEY, processes);

  const billing: Record<string, Invoice[]> = {
    "demo-001": [
      { id: "inv-001", companyId: "demo-001", date: "2026-03-01", dueDate: "2026-03-31", description: "E Grubu YKB Analiz Ücreti", amount: "4.500 ₺", status: "paid" },
      { id: "inv-002", companyId: "demo-001", date: "2026-03-15", dueDate: "2026-04-15", description: "Başvuru Dosyası Hazırlama", amount: "7.200 ₺", status: "unpaid" },
    ],
    "demo-002": [
      { id: "inv-003", companyId: "demo-002", date: "2026-03-10", dueDate: "2026-04-10", description: "G Grubu İlk Başvuru Ücreti", amount: "3.000 ₺", status: "unpaid" },
    ],
    "demo-003": [
      { id: "inv-004", companyId: "demo-003", date: "2026-01-05", dueDate: "2026-01-20", description: "F Grubu Yenileme Ücreti", amount: "5.000 ₺", status: "paid" },
      { id: "inv-005", companyId: "demo-003", date: "2026-01-05", dueDate: "2026-01-20", description: "Danışmanlık Hizmeti", amount: "2.500 ₺", status: "paid" },
    ],
  };
  saveToStorage(MOCK_BILLING_KEY, billing);

  // Seed demo analysis requests
  const requests: AnalysisRequest[] = [
    {
      id: "req-001",
      fullName: "Kemal Şahin",
      companyName: "Şahin İnşaat Ltd. Şti.",
      taxId: "3334445556",
      phone: "0532 111 2233",
      email: "kemal@sahinin.com",
      companyType: "limited_as",
      location: "istanbul",
      city: "",
      isFirstTime: "first",
      note: "D grubuna başvurmayı düşünüyoruz. İş deneyim belgelerimiz var.",
      status: "bekliyor",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "req-002",
      fullName: "Zeynep Arslan",
      companyName: "Arslan Yapı Taahhüt",
      taxId: "7778889990",
      phone: "0505 444 5566",
      email: "zeynep@arslanin.com",
      companyType: "sahis",
      location: "ankara",
      city: "",
      isFirstTime: "renewal",
      note: "Mevcut H grubumuzdan yükseltme yapmak istiyoruz.",
      status: "incelendi",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      adminReply: "Başvurunuz alındı. Dosyanızı inceliyoruz, 2 iş günü içinde dönüş yapacağız.",
      repliedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ];
  saveToStorage(ANALYSIS_REQUESTS_KEY, requests);
}