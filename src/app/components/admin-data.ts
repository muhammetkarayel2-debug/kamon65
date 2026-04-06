// ================================================================
// admin-data.ts
// Admin panel paylaşılan tipler + Supabase helpers
// localStorage referansları kaldırıldı — her şey Supabase üzerinden
// ================================================================

export const ADMIN_SESSION_KEY = "admin_auth_session"; // sadece login session için

// ── Supabase'den gelen Company tipi (UI için normalize edilmiş) ──
export interface Company {
  id: string;
  // Supabase alan adları
  company_name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  company_type: "sahis" | "limited_as" | "kooperatif" | null;
  location: string | null;
  city: string | null;
  kep_address: string | null;
  is_first_time: string | null;
  mevcut_grup: string | null;
  mevcut_yetki_no: string | null;
  hesaplanan_grup: string | null;
  selected_service: string | null;
  service_label: string | null;
  hizmet_modeli: "biz_yapiyoruz" | "musteri_yapiyor" | null;
  app_status: string;
  barcode_no: string | null;
  certificate_no: string | null;
  certificate_date: string | null;
  certificate_expiry: string | null;
  basvuru_teklifi_gosterildi: boolean;
  basvuru_teklifi_kabul: boolean | null;
  partners: Array<{ name: string; hisse: string; tc: string }>;
  user_email: string | null;
  olusturulma: string;
  guncelleme: string;
  // İlişkili veriler (adminGetCompanyFull'dan)
  experiences?: any[];
  diploma?: any | null;
  reports?: any[];
}

export interface ProcessData {
  status: string;
  statusLabel: string;
  statusHistory: { date: string; label: string; note?: string }[];
  barcodeNo?: string;
  certificateNo?: string;
  certificateDate?: string;
  certificateExpiry?: string;
  companyId: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  description: string;
  amount_num: number;
  status: "paid" | "unpaid" | "overdue";
  due_date: string | null;
  olusturulma: string;
  guncelleme: string;
  // UI için ek alan
  company_name?: string;
}

// ── Eski localStorage helpers — artık Supabase kullanıyoruz ──
// Admin bileşenleri doğrudan supabase-client.ts fonksiyonlarını çağırır

// Eski key sabitleri (geçiş döneminde kullanılabilir)
export const MOCK_COMPANIES_KEY = "mock_panel_companies";
export const MOCK_DOCS_KEY      = "mock_panel_docs";
export const MOCK_PROCESS_KEY   = "mock_panel_process";
export const MOCK_BILLING_KEY   = "mock_panel_billing";

// Geriye dönük uyumluluk için (admin-page.tsx resetStorage çağırıyor)
export function loadFromStorage<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw) as T; } catch {}
  return fallback;
}
export function saveToStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Labels ──
export const COMPANY_TYPE_LABELS: Record<string, string> = {
  sahis: "Şahıs Şirketi",
  limited_as: "Limited / A.Ş.",
  kooperatif: "Kooperatif",
};

export const ALL_GROUPS = ["H","G1","G","F1","F","E1","E","D1","D","C1","C","B1","B","A"];
export const FINANCIAL_REQUIRED_GROUPS = ["F","F1","E","E1","D","D1","C","C1","B","B1","A"];

export function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}
export function formatDateTime(iso: string) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}
