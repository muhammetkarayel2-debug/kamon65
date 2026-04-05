# muteahhitlikbelgesi.com — Figma Make Uygulama Talimatları

## Tasarım Dili (DEĞİŞTİRME)
- Renkler: `#0B1D3A` (lacivert) · `#C9952B` (altın) · `#F8F7F4` (arka plan) · `#5A6478` (gri metin) · `#E8E4DC` (border)
- Font: Inter
- Kartlar: `rounded-2xl border border-[#E8E4DC]`
- Butonlar: `rounded-xl`

---

## ADIM 1 — SİLİNECEK DOSYALAR
`src/app/components/` klasöründen şunları sil:

- `paywall-page.tsx`
- `report-page.tsx`
- `user-panel.tsx`
- `analysis-request-page.tsx`
- `admin-analysis-requests.tsx`
- `admin-financial-adequacy.tsx`
- `admin-reports.tsx`
- `admin-blog-tab.tsx`

---

## ADIM 2 — DEĞİŞTİRİLECEK DOSYALAR
`frontend/src/app/components/` klasöründeki dosyaları Figma Make'te aynı isimli dosyalarla değiştir:

| Dosya | Açıklama |
|-------|----------|
| `wizard-page.tsx` | TC kimlik, iş tipi seçimi (kat/taahhüt), inline ödeme, mali yeterlilik |
| `dashboard-page.tsx` | 8 sekme sistemi (Analiz/Firma/Mali/Ödeme/Rapor/Evraklar/Başvuru/Belge) |
| `admin-page.tsx` | 7 sekme admin paneli (gereksizler silindi) |
| `admin-processes.tsx` | 8 durum sistemi, rapor onaylama butonu |
| `admin-billing.tsx` | Faturalar + indirim gösterimi |
| `admin-documents.tsx` | Evrak onay/red sistemi |
| `admin-discounts.tsx` | Müşteri bazlı indirim yönetimi (YENİ — ekle) |
| `admin-data.ts` | Paylaşılan tipler ve helper'lar |

`frontend/src/app/` klasöründeki:

| Dosya | Açıklama |
|-------|----------|
| `routes.ts` | Temizlenmiş routing — paywall/report/panel/analiz kaldırıldı |

---

## ADIM 3 — DOKUNULMAYACAKLAR
Bu dosyalara kesinlikle dokunma:

- `ui/` klasörü (Figma UI bileşenleri)
- `figma/` klasörü
- `landing-page.tsx`
- `blog-page.tsx` · `blog-detail-page.tsx` · `blog-data.ts`
- `auth-context.tsx`
- `root-layout.tsx`
- `supabase-client.ts`
- `admin-dashboard.tsx`
- `admin-companies.tsx`
- `admin-users.tsx`

---

## ADIM 4 — ÖNEMLI KOD NOTU
`dashboard-page.tsx` içinde satır 18'deki:
```
function loadLS(key, fallback) {
```
Bu satır doğru — generic tip `<T>` kaldırıldı çünkü Figma Make'e yapıştırırken `<` karakteri bozuluyor.

---

## ADIM 5 — ROUTES.TS FORMATI
Figma Make `createBrowserRouter` kullanıyor. `routes.ts` bu formatta:
```ts
import { createBrowserRouter } from "react-router";
export const router = createBrowserRouter([{ path: "/", Component: RootLayout, children: [...] }]);
```
`@react-router/dev/routes` import'u KULLANMA — Figma Make bunu tanımıyor.

---

## HESAPLAMA MOTORLARI (ileride Supabase Edge Function olacak)
`hesaplama/` klasöründeki dosyalar backend hesaplama motorlarıdır:

- `hesaplama.ts` — İş deneyimi güncelleme, ÜFE endeksi, diploma hesaplama
- `muteahhitlik-data.ts` — 14 grup (A-H), eşik değerleri, banka referans tutarları (EK-3)
- `mali-yeterlilik.ts` — Bilanço oranları (Kural 4,5,7), ciro şartları (Kural 9)
- `evraklar.ts` — Grup + firma tipi + hizmet modeline göre evrak listesi üretimi
- `yapi-sinifi.ts` — 9 sınıf yapı sınıfı tayin motoru

---

## SUPABASE MIGRATION SIRASI
Supabase Dashboard > SQL Editor'da sırayla çalıştır:
1. `001_initial_schema.sql`
2. `002_company_partners_and_dashboard.sql`
3. `003_edit_lock_and_discounts.sql`

---

## EKSİK KALANLAR (sonraki aşama)
- `admin-companies.tsx` — TC kimlik gösterimi ve indirim butonu eklenecek
- `admin-dashboard.tsx` — 8 durum sistemi metrikleri güncellenecek
- `auth-context.tsx` — Supabase Auth entegrasyonu (şu an mock)
- Yükseltme akışı — mevcut müşteri yeni iş ekleme kodu
