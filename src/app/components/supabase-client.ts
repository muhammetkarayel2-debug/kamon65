// ================================================================
// supabase-client.ts
// Tek Supabase istemci + tüm sorgular
//
// .env dosyasına ekle:
//   VITE_SUPABASE_URL=https://lngsxebduxphfsyeewep.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
// ================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY .env dosyasına eklenmeli");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// ================================================================
// TİP TANIMLARI
// ================================================================
export type AppStatus =
  | "wizard_incomplete" | "pending_financial" | "pending_payment"
  | "payment_received"  | "report_locked"     | "report_published"
  | "docs_in_progress"  | "docs_complete"
  | "application_submitted" | "certificate_received";

export interface DbCompany {
  id: string;
  user_id: string;
  user_email: string | null;
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
  app_status: AppStatus;
  barcode_no: string | null;
  certificate_no: string | null;
  certificate_date: string | null;
  certificate_expiry: string | null;
  basvuru_teklifi_gosterildi: boolean;
  basvuru_teklifi_kabul: boolean | null;
  partners: Array<{ name: string; hisse: string; tc: string }>;
  olusturulma: string;
  guncelleme: string;
}

export interface DbExperience {
  id: string;
  company_id: string;
  is_deneyimi_tipi: "kat_karsiligi" | "taahhut";
  ada_parsel: string | null;
  sozlesme_tarihi: string | null;
  iskan_tarihi: string | null;
  insaat_alani_m2: number | null;
  yapi_yuksekligi_m: number | null;
  yapi_sinifi: string | null;
  yapi_tipi: string | null;
  muteahhit_arsa_ayni: boolean;
  taahhut_bedeli: number | null;
  iskan_dosya_adi: string | null;
  iskan_dosya_url: string | null;
  admin_onaylanan_sinif: string | null;
  olusturulma: string;
  guncelleme: string;
}

export interface DbDiploma {
  id: string;
  company_id: string;
  partner_name: string | null;
  department: string | null;
  grad_date: string | null;
  partnership_years: number | null;
  olusturulma: string;
}

export interface DbReport {
  id: string;
  company_id: string;
  company_name: string | null;
  hesaplanan_grup: string | null;
  tercih_yontem: string | null;
  toplam_guncel_tutar: number | null;
  y1: any;
  y2: any;
  diploma: any;
  is_detaylari: any;
  banka_ref_tutari: number | null;
  is_hacmi: any;
  admin_notu: string | null;
  durum: string;
  olusturulma: string;
}

export interface DbStatusTimeline {
  id: string;
  company_id: string;
  status: AppStatus;
  status_label: string | null;
  note: string | null;
  created_at: string;
}

export interface DbBilling {
  id: string;
  company_id: string;
  description: string;
  amount_num: number;
  status: "unpaid" | "paid" | "overdue";
  due_date: string | null;
  olusturulma: string;
  guncelleme: string;
}

export interface DbDocument {
  id: string;
  company_id: string;
  evrak_id: string;
  baslik: string;
  grubu: string | null;
  durum: "bekleniyor" | "bekliyor" | "onaylandi" | "reddedildi";
  dosya_adi: string | null;
  dosya_url: string | null;
  admin_notu: string | null;
  yuklayan: "customer" | "admin";
  belge_turu: string | null;
  belge_not: string | null;
  olusturulma: string;
  guncelleme: string;
}

// ================================================================
// AUTH
// ================================================================
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).single();
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("rol").eq("id", userId).single();
  return data?.rol === "admin";
}

// ================================================================
// WİZARD — Şirket kaydet / güncelle
// ================================================================
export async function upsertCompany(
  userId: string,
  data: Omit<DbCompany, "id" | "user_id" | "olusturulma" | "guncelleme">,
  existingId?: string
): Promise<DbCompany> {
  const payload = { ...data, user_id: userId };

  if (existingId) {
    const { data: updated, error } = await supabase
      .from("companies")
      .update({ ...payload, guncelleme: new Date().toISOString() })
      .eq("id", existingId)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  const { data: created, error } = await supabase
    .from("companies")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function upsertExperiences(
  companyId: string,
  experiences: Omit<DbExperience, "id" | "company_id" | "olusturulma" | "guncelleme">[]
) {
  // Önce eskilerini sil
  await supabase.from("experiences").delete().eq("company_id", companyId);
  if (experiences.length === 0) return [];
  const { data, error } = await supabase
    .from("experiences")
    .insert(experiences.map(e => ({ ...e, company_id: companyId })))
    .select();
  if (error) throw error;
  return data;
}

export async function upsertDiploma(
  companyId: string,
  diploma: Omit<DbDiploma, "id" | "company_id" | "olusturulma"> | null
) {
  await supabase.from("diplomas").delete().eq("company_id", companyId);
  if (!diploma) return null;
  const { data, error } = await supabase
    .from("diplomas")
    .insert({ ...diploma, company_id: companyId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ================================================================
// WİZARD — İskan yükle (Supabase Storage)
// ================================================================
export async function uploadIskan(
  companyId: string,
  experienceIndex: number,
  file: File
): Promise<string> {
  const ext  = file.name.split(".").pop() || "pdf";
  const path = `${companyId}/iskan_${experienceIndex}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("iskan-belgeleri")
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("iskan-belgeleri").getPublicUrl(path);
  return data.publicUrl;
}

// ================================================================
// DASHBOARD — Müşteri verilerini oku
// ================================================================
export async function getMyCompany(userId: string): Promise<DbCompany | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .order("olusturulma", { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function getCompanyExperiences(companyId: string): Promise<DbExperience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .eq("company_id", companyId)
    .order("olusturulma");
  if (error) throw error;
  return data || [];
}

export async function getCompanyDiploma(companyId: string): Promise<DbDiploma | null> {
  const { data } = await supabase
    .from("diplomas")
    .select("*")
    .eq("company_id", companyId)
    .single();
  return data || null;
}

export async function getLatestReport(companyId: string): Promise<DbReport | null> {
  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("company_id", companyId)
    .order("olusturulma", { ascending: false })
    .limit(1)
    .single();
  return data || null;
}

export async function getStatusTimeline(companyId: string): Promise<DbStatusTimeline[]> {
  const { data, error } = await supabase
    .from("status_timeline")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getBilling(companyId: string): Promise<DbBilling[]> {
  const { data, error } = await supabase
    .from("billing")
    .select("*")
    .eq("company_id", companyId)
    .order("olusturulma", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getDocuments(companyId: string): Promise<DbDocument[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", companyId)
    .order("olusturulma");
  if (error) throw error;
  return data || [];
}

// ================================================================
// DASHBOARD — Evrak yükle
// ================================================================
export async function uploadEvrak(
  companyId: string,
  evrakId: string,
  baslik: string,
  grubu: string,
  file: File
): Promise<DbDocument> {
  const ext  = file.name.split(".").pop() || "pdf";
  const path = `${companyId}/${evrakId}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("evraklar")
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("evraklar").getPublicUrl(path);

  // Önce varsa güncelle, yoksa ekle
  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("evrak_id", evrakId)
    .eq("yuklayan", "customer")
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("documents")
      .update({ dosya_adi: file.name, dosya_url: urlData.publicUrl, durum: "bekliyor", guncelleme: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      company_id: companyId,
      evrak_id: evrakId,
      baslik,
      grubu,
      dosya_adi: file.name,
      dosya_url: urlData.publicUrl,
      durum: "bekliyor",
      yuklayan: "customer",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ================================================================
// DASHBOARD — Realtime status takibi
// ================================================================
export function subscribeToCompanyStatus(
  companyId: string,
  onUpdate: (status: AppStatus) => void
) {
  return supabase
    .channel(`company_status_${companyId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "companies", filter: `id=eq.${companyId}` },
      (payload) => {
        if (payload.new?.app_status) {
          onUpdate(payload.new.app_status as AppStatus);
        }
      }
    )
    .subscribe();
}

export function subscribeToStatusTimeline(
  companyId: string,
  onInsert: (row: DbStatusTimeline) => void
) {
  return supabase
    .channel(`timeline_${companyId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "status_timeline", filter: `company_id=eq.${companyId}` },
      (payload) => onInsert(payload.new as DbStatusTimeline)
    )
    .subscribe();
}

// ================================================================
// ADMIN — Tüm şirketleri oku
// ================================================================
export async function adminGetAllCompanies(): Promise<DbCompany[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("guncelleme", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adminGetCompanyFull(companyId: string) {
  const [company, experiences, diploma, reports, timeline, billing, documents] =
    await Promise.all([
      supabase.from("companies").select("*").eq("id", companyId).single(),
      supabase.from("experiences").select("*").eq("company_id", companyId).order("olusturulma"),
      supabase.from("diplomas").select("*").eq("company_id", companyId).single(),
      supabase.from("reports").select("*").eq("company_id", companyId).order("olusturulma", { ascending: false }),
      supabase.from("status_timeline").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      supabase.from("billing").select("*").eq("company_id", companyId).order("olusturulma", { ascending: false }),
      supabase.from("documents").select("*").eq("company_id", companyId).order("olusturulma"),
    ]);

  return {
    company: company.data,
    experiences: experiences.data || [],
    diploma: diploma.data || null,
    reports: reports.data || [],
    timeline: timeline.data || [],
    billing: billing.data || [],
    documents: documents.data || [],
  };
}

// ================================================================
// ADMIN — Status güncelle + timeline kaydı
// ================================================================
export async function adminUpdateStatus(
  companyId: string,
  newStatus: AppStatus,
  statusLabel: string,
  note?: string,
  extra?: Partial<Pick<DbCompany, "barcode_no" | "certificate_no" | "certificate_date" | "certificate_expiry" | "hesaplanan_grup">>
) {
  const updates: any = { app_status: newStatus, guncelleme: new Date().toISOString(), ...extra };
  const { error: updateError } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", companyId);
  if (updateError) throw updateError;

  const { error: timelineError } = await supabase
    .from("status_timeline")
    .insert({ company_id: companyId, status: newStatus, status_label: statusLabel, note: note || null });
  if (timelineError) throw timelineError;
}

// ================================================================
// ADMIN — Rapor gönder
// ================================================================
export async function adminSendReport(report: Omit<DbReport, "id" | "olusturulma">) {
  const { error: reportError } = await supabase.from("reports").insert(report);
  if (reportError) throw reportError;

  await adminUpdateStatus(
    report.company_id,
    "report_published",
    "Rapor yayınlandı",
    undefined,
    { hesaplanan_grup: report.hesaplanan_grup || undefined }
  );
}

// ================================================================
// ADMIN — Fatura işlemleri
// ================================================================
export async function adminGetAllBilling(): Promise<(DbBilling & { company_name: string })[]> {
  const { data, error } = await supabase
    .from("billing")
    .select("*, companies(company_name)")
    .order("olusturulma", { ascending: false });
  if (error) throw error;
  return (data || []).map((b: any) => ({
    ...b,
    company_name: b.companies?.company_name || "—",
  }));
}

export async function adminAddBilling(
  companyId: string,
  description: string,
  amountNum: number,
  dueDate?: string
): Promise<DbBilling> {
  const { data, error } = await supabase
    .from("billing")
    .insert({ company_id: companyId, description, amount_num: amountNum, due_date: dueDate || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminMarkPaid(billingId: string) {
  const { error } = await supabase
    .from("billing")
    .update({ status: "paid", guncelleme: new Date().toISOString() })
    .eq("id", billingId);
  if (error) throw error;
}

// ================================================================
// ADMIN — Evrak onay / red
// ================================================================
export async function adminUpdateDocumentStatus(
  documentId: string,
  durum: "onaylandi" | "reddedildi",
  adminNotu?: string
) {
  const { error } = await supabase
    .from("documents")
    .update({ durum, admin_notu: adminNotu || null, guncelleme: new Date().toISOString() })
    .eq("id", documentId);
  if (error) throw error;
}

// ================================================================
// ADMIN — Müşteriye belge gönder (Supabase Storage)
// ================================================================
export async function adminSendDocument(
  companyId: string,
  baslik: string,
  belgeTuru: string,
  belgeNot: string | undefined,
  file?: File
): Promise<DbDocument> {
  let dosyaUrl: string | null = null;
  let dosyaAdi: string | null = null;

  if (file) {
    const ext  = file.name.split(".").pop() || "pdf";
    const path = `${companyId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("admin-evraklar")
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("admin-evraklar").getPublicUrl(path);
    dosyaUrl = data.publicUrl;
    dosyaAdi = file.name;
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      company_id: companyId,
      evrak_id: `admin_${Date.now()}`,
      baslik,
      yuklayan: "admin",
      belge_turu: belgeTuru,
      belge_not: belgeNot || null,
      dosya_adi: dosyaAdi,
      dosya_url: dosyaUrl,
      durum: "onaylandi",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ================================================================
// ADMIN — Tüm evrakları getir
// ================================================================
export async function adminGetAllDocuments(): Promise<(DbDocument & { company_name: string })[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*, companies(company_name)")
    .order("olusturulma", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({
    ...d,
    company_name: d.companies?.company_name || "—",
  }));
}

// ================================================================
// MEVZUAT VERİLERİ
// ================================================================
export async function getMevzuatVerisi(id: string) {
  const { data, error } = await supabase
    .from("mevzuat_verileri")
    .select("deger")
    .eq("id", id)
    .single();
  if (error) return null;
  return data?.deger;
}
