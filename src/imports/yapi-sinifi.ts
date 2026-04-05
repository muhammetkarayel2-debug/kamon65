// ============================================================
// lib/yapi-sinifi.ts
// Yapı Sınıfı Tayin Motoru
// Kaynak: Resmi Gazete 31.01.2025 / Sayı 32799
//         Mimarlık ve Mühendislik Hizmet Bedelleri Tebliği (2025)
//         Müteahhitlik iş deneyimi hesabında kullanılan 9 sınıf:
//         III.B · III.C · IV.A · IV.B · IV.C · V.A · V.B · V.C · V.D
// ============================================================
// Dışarıda kalan tek istisna:
//   - İbadethaneler (≥1500 kişi → V.B) — tüm ibadethaneler hesap dışı
//   - III.A ve altı (I.x, II.x, III.A) — müteahhitlik hesabına dahil değil
// ============================================================

export type YapiSinifiKodu = "3B" | "3C" | "4A" | "4B" | "4C" | "5A" | "5B" | "5C" | "5D";

// Wizard'daki label formatı
export const YAPI_SINIFI_ETIKETLER: Record<YapiSinifiKodu, string> = {
  "3B": "III. Sınıf B Grubu",
  "3C": "III. Sınıf C Grubu",
  "4A": "IV. Sınıf A Grubu",
  "4B": "IV. Sınıf B Grubu",
  "4C": "IV. Sınıf C Grubu",
  "5A": "V. Sınıf A Grubu",
  "5B": "V. Sınıf B Grubu",
  "5C": "V. Sınıf C Grubu",
  "5D": "V. Sınıf D Grubu",
};

export const BIRIM_FIYAT_2026: Record<YapiSinifiKodu, number> = {
  "3B": 21_050,
  "3C": 23_400,
  "4A": 26_450,
  "4B": 33_900,
  "4C": 40_500,
  "5A": 42_350,
  "5B": 42_350, // 2026 tebliği henüz yok; 2025 değeri: 35.600 — güncelleme gelince revize et
  "5C": 42_350, // 2026 tebliği henüz yok; 2025 değeri: 39.500 — güncelleme gelince revize et
  "5D": 42_350, // 2026 tebliği henüz yok; 2025 değeri: 43.400 — güncelleme gelince revize et
};

// ─────────────────────────────────────────────
// YAPI TİPLERİ
// Müteahhitlerin gerçekte yaptığı yapı kategorileri
// ─────────────────────────────────────────────

export type YapiTipi =
  | "konut_apartman"          // Apartman tipi konut
  | "konut_mustakil"          // Müstakil / ikiz konut
  | "konut_ticari"            // Konut + ticari karma (zemin dükkan/ofis + üst konut)
  | "is_merkezi"              // Ofis / iş merkezi
  | "okul_ilkortaokul"        // İlkokul, ortaokul
  | "okul_lise"               // Lise ve dengi
  | "universite"              // Fakülte, yüksekokul, enstitü
  | "universite_kampus"       // Üniversite kampüsü (bütünü)
  | "hastane_kucuk"           // Hastane < 200 yatak         → IV.C
  | "hastane_orta"            // Hastane 200–399 yatak       → V.B ✓ (dahil)
  | "hastane_buyuk"           // Hastane ≥ 400 yatak         → V.C ✓ (dahil)
  | "hastane_egitim"          // Eğitim ve araştırma hastanesi → V.A
  | "sehir_hastanesi"         // Şehir hastanesi              → V.D ✓ (dahil)
  | "avm_kucuk"               // AVM < 25.000 m²
  | "avm_buyuk"               // AVM ≥ 25.000 m²
  | "otel_1_2"                // 1–2 yıldızlı otel           → IV.A
  | "otel_3"                  // 3 yıldızlı otel             → IV.C
  | "otel_4"                  // 4 yıldızlı otel             → V.B ✓ (dahil)
  | "otel_5"                  // 5 yıldızlı otel             → V.D ✓ (dahil)
  | "apart_otel"              // Apart otel                  → III.B
  | "ibadethane_kucuk"        // İbadethane < 500 kişi       → III.B ✗ (dahil değil)
  | "ibadethane_orta"         // İbadethane 500–1499 kişi    → IV.B ✗ (dahil değil)
  | "ibadethane_buyuk"        // İbadethane ≥ 1500 kişi      → V.B  ✗ (dahil değil)
  | "spor_salon_kucuk"        // Kapalı spor salonu < 1000 seyirci
  | "spor_salon_orta"         // Kapalı spor salonu 1000–4999 seyirci
  | "spor_salon_buyuk"        // Kapalı spor salonu ≥ 5000 seyirci
  | "stadyum"                 // Stadyum, hipodrom
  | "karma_yapi"              // AVM + ofis + konut karma
  | "kamu_ilce"               // İlçe tipi kamu binası
  | "kamu_il"                 // İl tipi kamu binası
  | "adalet_sarayi"           // Adalet sarayı
  | "ogrenci_yurdu"           // Öğrenci yurdu
  | "muzekongre"              // Müze, opera/tiyatro, kongre merkezi → V.C ✓
  | "havalimani"              // Havalimanı terminal binası           → V.D ✓
  | "metro"                   // Metro istasyonu                     → V.D ✓
  | "diger";                  // Diğer (manuel seçim)

// ─────────────────────────────────────────────
// YAPI TİPİ TANIMLARI
// Her tip için hangi ek parametrelerin sorulacağı
// ─────────────────────────────────────────────

export interface YapiTipiTanim {
  etiket: string;
  aciklama: string;
  // Tayin için ek parametre gerekiyor mu?
  parametreler: Array<"yukseklik_m" | "alan_m2" | "yatak_sayisi" | "kisi_sayisi" | "seyirci_sayisi" | "yildiz">;
}

export const YAPI_TIPI_TANIMLARI: Record<YapiTipi, YapiTipiTanim> = {
  konut_apartman:    { etiket: "Apartman (çok katlı konut)",          aciklama: "Yapı yüksekliğine göre sınıf değişir",                         parametreler: ["yukseklik_m"] },
  konut_mustakil:    { etiket: "Müstakil / İkiz Konut",               aciklama: "Bağımsız bölüm brüt alanına göre sınıf değişir",                parametreler: ["alan_m2"] },
  konut_ticari:      { etiket: "Konut + Ticari Karma",                 aciklama: "Alan oranı ve yüksekliğe göre sınıf belirlenir",                parametreler: ["yukseklik_m", "alan_m2"] },
  is_merkezi:        { etiket: "İş Merkezi / Ofis Binası",            aciklama: "Yapı yüksekliğine göre sınıf değişir",                         parametreler: ["yukseklik_m"] },
  okul_ilkortaokul:  { etiket: "İlkokul / Ortaokul",                  aciklama: "Sabit: III.B",                                     parametreler: [] },
  okul_lise:         { etiket: "Lise ve Dengi Okul",                  aciklama: "Sabit: III.C",                                     parametreler: [] },
  universite:        { etiket: "Üniversite (Fakülte/Yüksekokul)",     aciklama: "Sabit: IV.A",                                      parametreler: [] },
  universite_kampus: { etiket: "Üniversite Kampüsü (bütünü)",         aciklama: "Sabit: V.A",                                       parametreler: [] },
  // Hastane: yatak_sayisi ile otomatik tayin
  hastane_kucuk:     { etiket: "Hastane (< 200 yatak)",               aciklama: "IV.C — dahil",                                     parametreler: ["yatak_sayisi"] },
  hastane_orta:      { etiket: "Hastane (200–399 yatak)",             aciklama: "V.B — dahil",                                      parametreler: ["yatak_sayisi"] },
  hastane_buyuk:     { etiket: "Hastane (≥ 400 yatak)",               aciklama: "V.C — dahil",                                      parametreler: ["yatak_sayisi"] },
  hastane_egitim:    { etiket: "Eğitim-Araştırma Hastanesi",          aciklama: "V.A — dahil",                                      parametreler: [] },
  sehir_hastanesi:   { etiket: "Şehir Hastanesi",                     aciklama: "V.D — dahil",                                      parametreler: [] },
  avm_kucuk:         { etiket: "AVM (< 25.000 m²)",                   aciklama: "Sabit: IV.A",                                      parametreler: [] },
  avm_buyuk:         { etiket: "AVM (≥ 25.000 m²)",                   aciklama: "Sabit: IV.C",                                      parametreler: [] },
  // Otel: yildiz ile otomatik tayin
  otel_1_2:          { etiket: "Otel (1–2 yıldız)",                   aciklama: "IV.A — dahil",                                     parametreler: ["yildiz"] },
  otel_3:            { etiket: "Otel (3 yıldız)",                     aciklama: "IV.C — dahil",                                     parametreler: ["yildiz"] },
  otel_4:            { etiket: "Otel (4 yıldız)",                     aciklama: "V.B — dahil",                                      parametreler: ["yildiz"] },
  otel_5:            { etiket: "Otel (5 yıldız)",                     aciklama: "V.D — dahil",                                      parametreler: ["yildiz"] },
  apart_otel:        { etiket: "Apart Otel",                          aciklama: "Sabit: III.B",                                     parametreler: [] },
  // İbadethaneler — tümü hesap DIŞI
  ibadethane_kucuk:  { etiket: "İbadethane (< 500 kişi)",             aciklama: "III.B — müteahhitlik hesabına DAHİL DEĞİL",        parametreler: [] },
  ibadethane_orta:   { etiket: "İbadethane (500–1499 kişi)",          aciklama: "IV.B — müteahhitlik hesabına DAHİL DEĞİL",         parametreler: [] },
  ibadethane_buyuk:  { etiket: "İbadethane (≥ 1500 kişi)",            aciklama: "V.B — müteahhitlik hesabına DAHİL DEĞİL",          parametreler: [] },
  spor_salon_kucuk:  { etiket: "Kapalı Spor Salonu (< 1000 seyirci)", aciklama: "Sabit: III.B",                                     parametreler: [] },
  spor_salon_orta:   { etiket: "Kapalı Spor Salonu (1000–4999 seyirci)", aciklama: "Sabit: IV.A",                                   parametreler: [] },
  spor_salon_buyuk:  { etiket: "Kapalı Spor Salonu (≥ 5000 seyirci)", aciklama: "Sabit: IV.B",                                     parametreler: [] },
  stadyum:           { etiket: "Stadyum / Hipodrom",                  aciklama: "Sabit: V.A",                                       parametreler: [] },
  karma_yapi:        { etiket: "Karma Yapı (AVM+Ofis+Konut)",         aciklama: "Sabit: V.A",                                       parametreler: [] },
  kamu_ilce:         { etiket: "İlçe Tipi Kamu Binası",               aciklama: "Sabit: IV.A",                                      parametreler: [] },
  kamu_il:           { etiket: "İl Tipi Kamu Binası",                 aciklama: "Sabit: IV.C",                                      parametreler: [] },
  adalet_sarayi:     { etiket: "Adalet Sarayı",                       aciklama: "Sabit: IV.C",                                      parametreler: [] },
  ogrenci_yurdu:     { etiket: "Öğrenci Yurdu",                       aciklama: "Sabit: III.C",                                     parametreler: [] },
  muzekongre:        { etiket: "Müze / Opera-Tiyatro / Kongre Merkezi", aciklama: "V.C — dahil",                                    parametreler: [] },
  havalimani:        { etiket: "Havalimanı Terminal Binası",           aciklama: "V.D — dahil",                                     parametreler: [] },
  metro:             { etiket: "Metro İstasyonu",                      aciklama: "V.D — dahil",                                     parametreler: [] },
  diger:             { etiket: "Diğer / Bilinmiyor",                  aciklama: "Manuel sınıf seçimi yapılır",                      parametreler: [] },
};

// ─────────────────────────────────────────────
// WIZARD ANA DAL SEÇİMİ
// Kullanıcıya 3 seçenek sunulur:
//   1. Konut          → kat sayısı / yükseklik
//   2. Konut + Ticari → kat sayısı + ticari oran → yükseklik filtresi yeterli
//   3. Diğer          → yapı tipi seçimi → tipe özel sorular
// ─────────────────────────────────────────────

export type WizardAnaSecim = "konut" | "konut_ticari" | "diger";

export interface WizardKonutSorulari {
  anaSecim: "konut" | "konut_ticari";
  katSayisi: number;          // kullanıcıdan alınan
  yukseklikM?: number;        // isteğe bağlı — biliyorsa girer
  // Sadece konut+ticari için:
  ticariAlanM2?: number;
  toplamAlanM2?: number;
}

export interface WizardDigerSorulari {
  anaSecim: "diger";
  yapiTipi: YapiTipi;
  // Tipe göre değişen:
  yukseklikM?: number;        // is_merkezi
  bagimsisBolumAlanM2?: number; // konut_mustakil
  yatakSayisi?: number;       // hastane
  yildiz?: 1|2|3|4|5;        // otel
}

/**
 * Wizard'ın konut/konut+ticari kolunda sınıf tayin eder.
 * Kullanıcı kat sayısı girer, yükseklik hesaplanır.
 * Sınır bölgede (eşiğe ±1m) uyarı verir.
 */
export function wizardKonutTayin(params: WizardKonutSorulari): YapiSinifiTayinSonucu & {
  hesaplananYukseklikM: number;
  sinirBolgesiUyari: boolean;
} {
  // Yükseklik: kullanıcı biliyorsa direkt, bilmiyorsa kat sayısından hesapla
  const hesaplananY = params.yukseklikM
    ?? katSayisindanYukseklik(params.katSayisi).yaklasikM;

  // Konut+ticari: oran hesapla
  if (params.anaSecim === "konut_ticari" && params.ticariAlanM2 && params.toplamAlanM2) {
    const sonuc = karmaYapiSinifiTayin({
      yukseklikM: hesaplananY,
      ticariAlanM2: params.ticariAlanM2,
      toplamAlanM2: params.toplamAlanM2,
    });
    return {
      ...sonuc,
      hesaplananYukseklikM: hesaplananY,
      sinirBolgesiUyari: _sinirBolgesindeMi(hesaplananY),
    };
  }

  // Saf konut
  const sonuc = yapiSinifiTayin({ yapiTipi: "konut_apartman", yukseklikM: hesaplananY });
  return {
    ...sonuc,
    hesaplananYukseklikM: hesaplananY,
    sinirBolgesiUyari: _sinirBolgesindeMi(hesaplananY),
  };
}

/** Yükseklik tebliğ eşiğine ±1.5m yakınsa true döner — kullanıcıdan kesin değer istenir */
function _sinirBolgesindeMi(yukseklikM: number): boolean {
  const ESIKLER = [21.50, 30.50, 51.50];
  return ESIKLER.some(e => Math.abs(yukseklikM - e) <= 1.5);
}

/**
 * Wizard'ın "Diğer" kolunda, seçilen yapı tipine göre
 * hangi soruların sorulacağını döndürür.
 */
export function wizardDigerSorulariGetir(yapiTipi: YapiTipi): WizardSoru[] {
  return WIZARD_SORULARI[yapiTipi] ?? [];
}

/**
 * Wizard "Diğer" kolunda, girilen parametrelerle sınıf tayin eder.
 */
export function wizardDigerTayin(params: WizardDigerSorulari): YapiSinifiTayinSonucu {
  const { yapiTipi, yukseklikM, bagimsisBolumAlanM2, yatakSayisi, yildiz } = params;

  // Hastane ve otel için helper fonksiyonlar
  if (["hastane_kucuk","hastane_orta","hastane_buyuk"].includes(yapiTipi) && yatakSayisi) {
    const r = hastaneTipiAl(yatakSayisi);
    return yapiSinifiTayin({ yapiTipi: r.tip });
  }
  if (["otel_1_2","otel_3","otel_4","otel_5"].includes(yapiTipi) && yildiz) {
    const r = otelTipiAl(yildiz);
    return yapiSinifiTayin({ yapiTipi: r.tip });
  }

  return yapiSinifiTayin({ yapiTipi, yukseklikM, bagimsisBolumAlanM2 });
}

// ─────────────────────────────────────────────
// "DİĞER" KOLUNDA GÖSTERİLECEK TİP LİSTESİ
// Wizard dropdown/grid için gruplandırılmış
// ─────────────────────────────────────────────

export interface YapiTipiGrup {
  baslik: string;
  tipler: Array<{ tip: YapiTipi; etiket: string; sinif?: string }>;
}

export const DIGER_YAPI_TIPLERI_GRUPLARI: YapiTipiGrup[] = [
  {
    baslik: "Eğitim",
    tipler: [
      { tip: "okul_ilkortaokul",  etiket: "İlkokul / Ortaokul",        sinif: "III.B" },
      { tip: "okul_lise",         etiket: "Lise",                      sinif: "III.C" },
      { tip: "universite",        etiket: "Üniversite (fakülte)",       sinif: "IV.A"  },
      { tip: "universite_kampus", etiket: "Üniversite kampüsü",         sinif: "V.A"   },
      { tip: "ogrenci_yurdu",     etiket: "Öğrenci yurdu",             sinif: "III.C" },
    ],
  },
  {
    baslik: "Sağlık",
    tipler: [
      { tip: "hastane_kucuk",   etiket: "Hastane (yatak sayısı sorulur)",  sinif: "IV.C / V.B / V.C" },
      { tip: "hastane_egitim",  etiket: "Eğitim-araştırma hastanesi",      sinif: "V.A"  },
      { tip: "sehir_hastanesi", etiket: "Şehir hastanesi",                 sinif: "V.D"  },
    ],
  },
  {
    baslik: "Konaklama",
    tipler: [
      { tip: "apart_otel", etiket: "Apart otel",               sinif: "III.B" },
      { tip: "otel_1_2",   etiket: "Otel (yıldız sayısı sorulur)", sinif: "IV.A – V.D" },
    ],
  },
  {
    baslik: "Ticaret",
    tipler: [
      { tip: "avm_kucuk",    etiket: "AVM (< 25.000 m²)",  sinif: "IV.A" },
      { tip: "avm_buyuk",    etiket: "AVM (≥ 25.000 m²)",  sinif: "IV.C" },
      { tip: "karma_yapi",   etiket: "Karma yapı (AVM+ofis+konut)", sinif: "V.A" },
    ],
  },
  {
    baslik: "Kamu",
    tipler: [
      { tip: "kamu_ilce",    etiket: "İlçe kamu binası",  sinif: "IV.A" },
      { tip: "kamu_il",      etiket: "İl kamu binası",    sinif: "IV.C" },
      { tip: "adalet_sarayi",etiket: "Adalet sarayı",     sinif: "IV.C" },
    ],
  },
  {
    baslik: "Spor & Kültür",
    tipler: [
      { tip: "spor_salon_kucuk", etiket: "Spor salonu (< 1000 seyirci)",    sinif: "III.B" },
      { tip: "spor_salon_orta",  etiket: "Spor salonu (1000–4999 seyirci)", sinif: "IV.A"  },
      { tip: "spor_salon_buyuk", etiket: "Spor salonu (≥ 5000 seyirci)",    sinif: "IV.B"  },
      { tip: "stadyum",          etiket: "Stadyum / hipodrom",              sinif: "V.A"   },
      { tip: "muzekongre",       etiket: "Müze / opera / kongre merkezi",   sinif: "V.C"   },
    ],
  },
  {
    baslik: "Ulaşım & Altyapı",
    tipler: [
      { tip: "havalimani", etiket: "Havalimanı terminali", sinif: "V.D" },
      { tip: "metro",      etiket: "Metro istasyonu",      sinif: "V.D" },
    ],
  },
  {
    baslik: "Diğer",
    tipler: [
      { tip: "diger", etiket: "Listede yok / bilinmiyor" },
    ],
  },
];

/**
 * Yatak sayısına göre hastane tipini ve sınıfını döndürür.
 * Wizard'da: "Hastane" seçilince kaç yataklı diye sor.
 *
 * Tüm hastane tipleri müteahhitlik iş deneyimine dahildir.
 * Eğitim-araştırma hastanesi ve şehir hastanesi ayrı seçenekler.
 */
export function hastaneTipiAl(yatakSayisi: number): {
  tip: YapiTipi;
  sinif: YapiSinifiKodu;
  dahilMi: true;
  not: string;
} {
  if (yatakSayisi < 200) return {
    tip: "hastane_kucuk",
    sinif: "4C",
    dahilMi: true,
    not: `${yatakSayisi} yatak < 200 → IV.C (40.500 TL/m²)`,
  };
  if (yatakSayisi < 400) return {
    tip: "hastane_orta",
    sinif: "5B",
    dahilMi: true,
    not: `${yatakSayisi} yatak: 200–399 → V.B (35.600 TL/m² — 2025 değeri)`,
  };
  return {
    tip: "hastane_buyuk",
    sinif: "5C",
    dahilMi: true,
    not: `${yatakSayisi} yatak ≥ 400 → V.C (39.500 TL/m² — 2025 değeri)`,
  };
}

/**
 * Yıldız sayısına göre otel tipini ve sınıfını döndürür.
 * Wizard'da: "Otel" seçilince kaç yıldızlı diye sor.
 *
 * Tüm otel tipleri müteahhitlik iş deneyimine dahildir.
 */
export function otelTipiAl(yildiz: 1 | 2 | 3 | 4 | 5): {
  tip: YapiTipi;
  sinif: YapiSinifiKodu;
  dahilMi: true;
  not: string;
} {
  switch (yildiz) {
    case 1:
    case 2: return {
      tip: "otel_1_2",
      sinif: "4A",
      dahilMi: true,
      not: `${yildiz} yıldızlı otel → IV.A (26.450 TL/m²)`,
    };
    case 3: return {
      tip: "otel_3",
      sinif: "4C",
      dahilMi: true,
      not: `3 yıldızlı otel → IV.C (40.500 TL/m²)`,
    };
    case 4: return {
      tip: "otel_4",
      sinif: "5B",
      dahilMi: true,
      not: `4 yıldızlı otel → V.B (35.600 TL/m² — 2025 değeri)`,
    };
    case 5: return {
      tip: "otel_5",
      sinif: "5D",
      dahilMi: true,
      not: `5 yıldızlı otel → V.D (43.400 TL/m² — 2025 değeri)`,
    };
  }
}

// ─────────────────────────────────────────────
// WIZARD SORU AKIŞI REHBERİ
// Her yapı tipi için wizard'da hangi soruların sorulacağı
// ─────────────────────────────────────────────

export interface WizardSoru {
  alan: string;           // form field adı
  etiket: string;         // kullanıcıya gösterilen soru
  tip: "sayi" | "secim";
  birim?: string;         // "m", "m²", "yatak" vb.
  secenekler?: Array<{ deger: string | number; etiket: string }>;
  aciklama?: string;      // tooltip/yardım notu
}

export const WIZARD_SORULARI: Partial<Record<YapiTipi, WizardSoru[]>> = {
  konut_apartman: [{
    alan: "yukseklikM",
    etiket: "Yapı yüksekliği",
    tip: "sayi",
    birim: "m",
    aciklama: "İskan belgesindeki toplam yapı yüksekliği (m). Kat sayısı × ortalama kat yüksekliği değil, binanın zemin kotundan en üst noktaya mesafesi.",
  }],
  konut_mustakil: [{
    alan: "bagimsisBolumAlanM2",
    etiket: "Bağımsız bölüm brüt inşaat alanı",
    tip: "sayi",
    birim: "m²",
    aciklama: "Tek bir bağımsız bölümün (konutun) brüt alanı — tüm yapının alanı değil.",
  }],
  konut_ticari: [
    {
      alan: "yukseklikM",
      etiket: "Yapı yüksekliği",
      tip: "sayi",
      birim: "m",
      aciklama: "Binanın zemin kotundan çatıya toplam yüksekliği.",
    },
    {
      alan: "ticariAlanM2",
      etiket: "Ticari alanların toplam m²'si",
      tip: "sayi",
      birim: "m²",
      aciklama: "Dükkan, ofis, büro gibi ticari kullanımlı bölümlerin toplam brüt alanı (ortak alanlar hariç).",
    },
    {
      alan: "toplamAlanM2",
      etiket: "Yapının toplam brüt inşaat alanı",
      tip: "sayi",
      birim: "m²",
      aciklama: "Bodrum, çatı arası dahil tüm katların brüt alanı toplamı.",
    },
  ],
  is_merkezi: [{
    alan: "yukseklikM",
    etiket: "Yapı yüksekliği",
    tip: "sayi",
    birim: "m",
    aciklama: "Binanın zemin kotundan en üst noktaya toplam yüksekliği.",
  }],
  // Hastane: önce eğitim/araştırma mı diye sor, değilse yatak sayısı sor
  hastane_kucuk: [{
    alan: "yatakSayisi",
    etiket: "Kaç yataklı?",
    tip: "sayi",
    birim: "yatak",
    aciklama: "Hastanedeki toplam yatak kapasitesi. Bu sayı sınıf tayinini doğrudan etkiler.",
  }],
  // Otel: yıldız sayısı sor
  otel_1_2: [{
    alan: "yildiz",
    etiket: "Kaç yıldızlı?",
    tip: "secim",
    secenekler: [
      { deger: 1, etiket: "1 yıldız" },
      { deger: 2, etiket: "2 yıldız" },
      { deger: 3, etiket: "3 yıldız" },
      { deger: 4, etiket: "4 yıldız" },
      { deger: 5, etiket: "5 yıldız" },
    ],
    aciklama: "Turizm Bakanlığı onaylı yıldız sınıfı. 4 ve 5 yıldızlı oteller müteahhitlik iş deneyimi hesabına dahil değildir.",
  }],
};

// ─────────────────────────────────────────────
// KULLANICIYA GÖSTERİLECEK UYARI METİNLERİ
// ─────────────────────────────────────────────

export const DAHIL_DEGIL_UYARISI = {
  ibadethane_kucuk:  "İbadethaneler müteahhitlik yetki belgesi iş deneyimi hesabına dahil değildir (tüm sınıflar).",
  ibadethane_orta:   "İbadethaneler müteahhitlik yetki belgesi iş deneyimi hesabına dahil değildir (tüm sınıflar).",
  ibadethane_buyuk:  "İbadethaneler müteahhitlik yetki belgesi iş deneyimi hesabına dahil değildir (tüm sınıflar).",
} as const;

// ─────────────────────────────────────────────
// ANA TAYİN FONKSİYONU
// ─────────────────────────────────────────────

export interface YapiSinifiTayinGirdisi {
  yapiTipi: YapiTipi;
  // Yükseklik gerektiren tipler için (konut_apartman, is_merkezi)
  yukseklikM?: number;
  // Alan gerektiren tipler için (konut_mustakil)
  bagimsisBolumAlanM2?: number;
}

export interface YapiSinifiTayinSonucu {
  sinif: YapiSinifiKodu | null;  // null = müteahhitlik hesabına dahil değil
  etiket: string;
  birimFiyat2026: number | null;
  dahilMi: boolean;              // müteahhitlik iş deneyimi hesabına giriyor mu?
  aciklama: string;
  uyari?: string;                // belirsizlik veya dikkat notu
}

/**
 * Yapı tipine ve parametrelerine göre müteahhitlik iş deneyimi sınıfını tayin eder.
 *
 * Kritik kural — Konut apartman yükseklik eşikleri (tebliğden):
 *   ≤ 21.50 m  → III.B  (tipik 6–7 kat)
 *   > 21.50 m, ≤ 30.50 m → III.C  (tipik 8–10 kat)
 *   > 30.50 m, ≤ 51.50 m → IV.A   (tipik 10–17 kat)
 *   > 51.50 m             → IV.B   (17+ kat, gökdelen)
 *
 * Kritik kural — Müstakil konut brüt alan eşikleri:
 *   < 200 m²  → III.B
 *   200–499 m² → III.C  (200 dahil)
 *   ≥ 500 m²  → IV.B
 *
 * Kritik kural — İş merkezi yükseklik eşikleri:
 *   ≤ 3 kat (yaklaşık ≤ 10.50 m) → III.B
 *   > 3 kat, ≤ 21.50 m           → III.B  (aynı grup)
 *   > 21.50 m, ≤ 30.50 m         → III.C
 *   > 30.50 m, ≤ 51.50 m         → IV.B
 *   > 51.50 m                    → V.A
 */
export function yapiSinifiTayin(girdi: YapiSinifiTayinGirdisi): YapiSinifiTayinSonucu {
  const { yapiTipi, yukseklikM, bagimsisBolumAlanM2 } = girdi;

  const dahil = (sinif: YapiSinifiKodu, aciklama: string, uyari?: string): YapiSinifiTayinSonucu => ({
    sinif,
    etiket: YAPI_SINIFI_ETIKETLER[sinif],
    birimFiyat2026: BIRIM_FIYAT_2026[sinif],
    dahilMi: true,
    aciklama,
    uyari,
  });

  const dahilDegil = (aciklama: string): YapiSinifiTayinSonucu => ({
    sinif: null,
    etiket: "Müteahhitlik hesabına dahil değil",
    birimFiyat2026: null,
    dahilMi: false,
    aciklama,
  });

  switch (yapiTipi) {

    // ── KONUT: APARTMAN ──────────────────────────────
    case "konut_apartman": {
      if (!yukseklikM) return dahil("3B", "Yükseklik bilinmiyor, en düşük sınıf (III.B) alındı.", "Yapı yüksekliğini girerek doğru sınıf tayini yapın.");
      if (yukseklikM <= 21.50) return dahil("3B", `Yapı yüksekliği ${yukseklikM}m ≤ 21.50m → III.B`);
      if (yukseklikM <= 30.50) return dahil("3C", `Yapı yüksekliği ${yukseklikM}m: 21.50m < h ≤ 30.50m → III.C`);
      if (yukseklikM <= 51.50) return dahil("4A", `Yapı yüksekliği ${yukseklikM}m: 30.50m < h ≤ 51.50m → IV.A`);
      return dahil("4B", `Yapı yüksekliği ${yukseklikM}m > 51.50m → IV.B`);
    }

    // ── KONUT: MÜSTAKİL ─────────────────────────────
    case "konut_mustakil": {
      if (!bagimsisBolumAlanM2) return dahil("3B", "Alan bilinmiyor, en düşük sınıf (III.B) alındı.", "Bağımsız bölüm brüt alanını girerek doğru sınıf tayini yapın.");
      if (bagimsisBolumAlanM2 < 200)  return dahil("3B", `Brüt alan ${bagimsisBolumAlanM2}m² < 200m² → III.B`);
      if (bagimsisBolumAlanM2 < 500)  return dahil("3C", `Brüt alan ${bagimsisBolumAlanM2}m²: 200m² ≤ alan < 500m² → III.C`);
      return dahil("4B", `Brüt alan ${bagimsisBolumAlanM2}m² ≥ 500m² → IV.B`);
    }

    // ── KONUT + TİCARİ KARMA ─────────────────────────
    // Alan oranı kuralı:
    //   Ticari alan / toplam alan < %50  → konut sınıfı (yüksekliğe göre)
    //   Ticari alan / toplam alan ≥ %50  → iş merkezi sınıfı (yüksekliğe göre)
    //   Ticari = AVM niteliğinde (büyük, bağımsız giriş)  → V.A karma yapı
    // Kaynak: Tebliğ Madde 2/3 — ağırlıklı kullanım belirleyicidir.
    case "konut_ticari": {
      const alan = bagimsisBolumAlanM2 ?? 0; // burada: ticariAlanM2 / toplamAlanM2 oranı (0–1)
      const yuk  = yukseklikM ?? 0;

      // alan parametresi bu case'de ticari oran olarak kullanılır (0.0 – 1.0)
      // Wizard'dan: ticariAlanOrani = ticariM2 / toplamM2
      const ticariOran = alan; // 0–1 arası

      if (ticariOran >= 1) {
        // Tamamen ticari → iş merkezi
        return yapiSinifiTayin({ yapiTipi: "is_merkezi", yukseklikM: yuk });
      }

      if (ticariOran >= 0.50) {
        // Ticari ağırlıklı → iş merkezi sınıfı, yüksekliğe göre
        const isSonuc = yapiSinifiTayin({ yapiTipi: "is_merkezi", yukseklikM: yuk });
        return {
          ...isSonuc,
          aciklama: `Ticari alan oranı ${Math.round(ticariOran * 100)}% ≥ 50% → iş merkezi kuralı uygulandı. ${isSonuc.aciklama}`,
          uyari: "Ticari alan ≥ %50 olduğundan yapı yüksekliğine göre iş merkezi sınıfı esas alındı.",
        };
      }

      if (ticariOran >= 0.30) {
        // Karma — konut ağırlıklı ama ticari payı kayda değer
        // Yine konut sınıfı uygulanır; uyarı eklenir
        const konutSonuc = yapiSinifiTayin({ yapiTipi: "konut_apartman", yukseklikM: yuk });
        return {
          ...konutSonuc,
          aciklama: `Ticari alan oranı ${Math.round(ticariOran * 100)}% (< 50%) → konut sınıfı esas alındı. ${konutSonuc.aciklama}`,
          uyari: "Ticari oran %30–50 arasında. Kesin tayin için uzman değerlendirmesi önerilir.",
        };
      }

      // Ticari oran < %30 → saf konut gibi değerlendir, yüksekliğe göre
      const konutSonuc = yapiSinifiTayin({ yapiTipi: "konut_apartman", yukseklikM: yuk });
      return {
        ...konutSonuc,
        aciklama: `Ticari alan oranı ${Math.round(ticariOran * 100)}% < 30% → konut sınıfı esas alındı. ${konutSonuc.aciklama}`,
      };
    }
    case "is_merkezi": {
      if (!yukseklikM) return dahil("3B", "Yükseklik bilinmiyor, en düşük sınıf (III.B) alındı.", "Yapı yüksekliğini girerek doğru sınıf tayini yapın.");
      // Tebliğ: "üç kata kadar (dahil)" = III.B; "üç kat üzeri ≤21.50m" = III.B (aynı grup)
      if (yukseklikM <= 21.50) return dahil("3B", `İş merkezi yüksekliği ${yukseklikM}m ≤ 21.50m → III.B`);
      if (yukseklikM <= 30.50) return dahil("3C", `İş merkezi yüksekliği ${yukseklikM}m: 21.50m < h ≤ 30.50m → III.C`);
      if (yukseklikM <= 51.50) return dahil("4B", `İş merkezi yüksekliği ${yukseklikM}m: 30.50m < h ≤ 51.50m → IV.B`);
      return dahil("5A", `İş merkezi yüksekliği ${yukseklikM}m > 51.50m → V.A`);
    }

    // ── SABİT SINIF: III.B ───────────────────────────
    case "okul_ilkortaokul":  return dahil("3B", "İlkokul/Ortaokul → sabit III.B");
    case "apart_otel":         return dahil("3B", "Apart otel → sabit III.B");
    case "ibadethane_kucuk":   return dahil("3B", "İbadethane (< 500 kişi) → sabit III.B");
    case "spor_salon_kucuk":   return dahil("3B", "Kapalı spor salonu (< 1000 seyirci) → sabit III.B");

    // ── SABİT SINIF: III.C ───────────────────────────
    case "okul_lise":          return dahil("3C", "Lise ve dengi okul → sabit III.C");
    case "ogrenci_yurdu":      return dahil("3C", "Öğrenci yurdu → sabit III.C");

    // ── SABİT SINIF: IV.A ────────────────────────────
    case "universite":         return dahil("4A", "Üniversite fakülte/yüksekokul → sabit IV.A");
    case "avm_kucuk":          return dahil("4A", "AVM (< 25.000 m²) → sabit IV.A");
    case "otel_1_2":           return dahil("4A", "Otel (1–2 yıldız) → sabit IV.A");
    case "spor_salon_orta":    return dahil("4A", "Kapalı spor salonu (1000–4999 seyirci) → sabit IV.A");
    case "kamu_ilce":          return dahil("4A", "İlçe tipi kamu binası → sabit IV.A");

    // ── SABİT SINIF: IV.B ────────────────────────────
    case "ibadethane_orta":    return dahil("4B", "İbadethane (500–1499 kişi) → sabit IV.B");
    case "spor_salon_buyuk":   return dahil("4B", "Kapalı spor salonu (≥ 5000 seyirci) → sabit IV.B");

    // ── SABİT SINIF: IV.C ────────────────────────────
    case "hastane_kucuk":      return dahil("4C", "Hastane (< 200 yatak) → sabit IV.C");
    case "avm_buyuk":          return dahil("4C", "AVM (≥ 25.000 m²) → sabit IV.C");
    case "otel_3":             return dahil("4C", "Otel (3 yıldız) → sabit IV.C");
    case "kamu_il":            return dahil("4C", "İl tipi kamu binası → sabit IV.C");
    case "adalet_sarayi":      return dahil("4C", "Adalet sarayı → sabit IV.C");

    // ── SABİT SINIF: V.A ─────────────────────────────
    case "universite_kampus":  return dahil("5A", "Üniversite kampüsü → sabit V.A");
    case "hastane_egitim":     return dahil("5A", "Eğitim-araştırma hastanesi → sabit V.A");
    case "stadyum":            return dahil("5A", "Stadyum/hipodrom → sabit V.A");
    case "karma_yapi":         return dahil("5A", "Karma yapı (AVM+ofis+konut) → sabit V.A");

    // ── SABİT SINIF: V.B ─────────────────────────────
    case "hastane_orta":       return dahil("5B", "Hastane (200–399 yatak) → sabit V.B");
    case "otel_4":             return dahil("5B", "Otel (4 yıldız) → sabit V.B");

    // ── SABİT SINIF: V.C ─────────────────────────────
    case "hastane_buyuk":      return dahil("5C", "Hastane (≥ 400 yatak) → sabit V.C");
    case "muzekongre":         return dahil("5C", "Müze / Opera-Tiyatro / Kongre Merkezi → sabit V.C");

    // ── SABİT SINIF: V.D ─────────────────────────────
    case "otel_5":             return dahil("5D", "Otel (5 yıldız) → sabit V.D");
    case "sehir_hastanesi":    return dahil("5D", "Şehir hastanesi → sabit V.D");
    case "havalimani":         return dahil("5D", "Havalimanı terminal binası → sabit V.D");
    case "metro":              return dahil("5D", "Metro istasyonu → sabit V.D");

    // ── İBADETHANELER — TÜMÜ HESAP DIŞI ────────────
    case "ibadethane_kucuk":
      return dahilDegil("İbadethaneler (< 500 kişi, III.B sınıfı) müteahhitlik iş deneyimi hesabına dahil değildir.");
    case "ibadethane_orta":
      return dahilDegil("İbadethaneler (500–1499 kişi, IV.B sınıfı) müteahhitlik iş deneyimi hesabına dahil değildir.");
    case "ibadethane_buyuk":
      return dahilDegil("İbadethaneler (≥ 1500 kişi, V.B sınıfı) müteahhitlik iş deneyimi hesabına dahil değildir.");

    // ── DİĞER: manuel seçim ──────────────────────────
    case "diger":
    default:
      return {
        sinif: null,
        etiket: "Manuel seçim gerekiyor",
        birimFiyat2026: null,
        dahilMi: false,
        aciklama: "Yapı tipi belirlenemedi. Lütfen sınıfı manuel seçin.",
        uyari: "Uzman değerlendirmesi önerilir.",
      };
  }
}

// ─────────────────────────────────────────────
// YÜKSEKLIK YARDIMCISI
// Kat sayısından yaklaşık yapı yüksekliği
// ─────────────────────────────────────────────

/**
 * Kat sayısından yaklaşık yapı yüksekliği hesaplar.
 * Ortalama kat yüksekliği 3.00 m (zemin: 3.50 m) varsayımı.
 * Bu değer kesin değildir — iskan belgesi üzerindeki resmi yükseklik kullanılmalıdır.
 */
export function katSayisindanYukseklik(katSayisi: number): {
  yaklasikM: number;
  uyari: string;
} {
  // Zemin kat 3.50m, üst katlar 3.00m
  const yaklasik = 3.50 + Math.max(0, katSayisi - 1) * 3.00;
  return {
    yaklasikM: Math.round(yaklasik * 100) / 100,
    uyari: "Yaklaşık değerdir. Kesin sınıf tayini için iskan belgesindeki yapı yüksekliğini kullanın.",
  };
}

/**
 * Yapı yüksekliğinden hangi konut sınıfına denk geldiğini açıklar.
 * Wizard'da kullanıcıya bilgi notu olarak gösterilebilir.
 */
export function yukseklikAciklamasi(yukseklikM: number): string {
  if (yukseklikM <= 21.50) return `${yukseklikM}m → III.B (≤21.50m, tipik 6–7 katlı apartman)`;
  if (yukseklikM <= 30.50) return `${yukseklikM}m → III.C (21.50m–30.50m arası, tipik 8–10 katlı)`;
  if (yukseklikM <= 51.50) return `${yukseklikM}m → IV.A (30.50m–51.50m arası, tipik 10–17 katlı)`;
  return `${yukseklikM}m → IV.B (51.50m üzeri, 17+ katlı gökdelen)`;
}

// ─────────────────────────────────────────────
// SINIF KARŞILAŞTIRMA TABLOSU
// UI'da bilgi kartı olarak gösterilebilir
// ─────────────────────────────────────────────

export const SINIF_KARSILASTIRMA: Array<{
  sinif: YapiSinifiKodu;
  birim: number;
  konutKarsiligi: string;
  tipikYapilar: string[];
  dikkatNotu?: string;
}> = [
  {
    sinif: "3B",
    birim: 21_050,
    konutKarsiligi: "Apartman (yükseklik ≤21.50m, ~6–7 kat)",
    tipikYapilar: [
      "Apartman — yükseklik ≤21.50m",
      "Müstakil konut — brüt alan <200m²",
      "İlkokul / ortaokul",
      "Apart otel",
      "İş merkezi — yükseklik ≤21.50m",
      "Küçük ibadethane (<500 kişi)",
      "Küçük spor salonu (<1000 seyirci)",
    ],
    dikkatNotu: "En yaygın sınıf. Müteahhitlerin büyük çoğunluğu bu sınıfta iş deneyimi biriktirir.",
  },
  {
    sinif: "3C",
    birim: 23_400,
    konutKarsiligi: "Apartman (yükseklik 21.50m–30.50m, ~8–10 kat)",
    tipikYapilar: [
      "Apartman — yükseklik >21.50m, ≤30.50m",
      "Müstakil konut — brüt alan 200–499m²",
      "Lise",
      "Öğrenci yurdu",
      "İş merkezi — yükseklik >21.50m, ≤30.50m",
    ],
  },
  {
    sinif: "4A",
    birim: 26_450,
    konutKarsiligi: "Apartman (yükseklik 30.50m–51.50m, ~10–17 kat)",
    tipikYapilar: [
      "Apartman — yükseklik >30.50m, ≤51.50m",
      "Üniversite fakülte / yüksekokul",
      "AVM — brüt alan <25.000m²",
      "1–2 yıldızlı otel",
      "İlçe kamu binası",
      "Kapalı spor salonu (1000–4999 seyirci)",
    ],
  },
  {
    sinif: "4B",
    birim: 33_900,
    konutKarsiligi: "Apartman (yükseklik >51.50m, 17+ kat / gökdelen)",
    tipikYapilar: [
      "Apartman — yükseklik >51.50m",
      "Müstakil konut — brüt alan ≥500m²",
      "İş merkezi — yükseklik >30.50m, ≤51.50m",
      "Banka/borsa binası",
      "Büyük spor salonu (≥5000 seyirci)",
      "Orta ibadethane (500–1499 kişi)",
    ],
    dikkatNotu: "Müstakil villalarda alan eşiğine dikkat: 500m² ve üzeri bu sınıfa girer.",
  },
  {
    sinif: "4C",
    birim: 40_500,
    konutKarsiligi: "—",
    tipikYapilar: [
      "Hastane (< 200 yatak)",
      "AVM — brüt alan ≥25.000m²",
      "3 yıldızlı otel",
      "Adalet sarayı",
      "İl tipi kamu binası",
      "Olimpik spor tesisi",
      "Kapalı cezaevi",
    ],
    dikkatNotu: "Konut bu sınıfta YOK. Genellikle kamu ve sağlık yapıları.",
  },
  {
    sinif: "5A",
    birim: 42_350,
    konutKarsiligi: "—",
    tipikYapilar: [
      "Eğitim-araştırma hastanesi",
      "İş merkezi — yükseklik >51.50m (gökdelen)",
      "Karma yapı (AVM + ofis + konut)",
      "Stadyum / hipodrom",
      "Üniversite kampüsü",
      "Büyükelçilik",
    ],
    dikkatNotu: "En yüksek birim fiyat. Nadiren yapılır, yüksek iş deneyimi değeri sağlar.",
  },
  {
    sinif: "5B",
    birim: 35_600, // 2025 değeri — 2026 tebliği çıkınca güncelle
    konutKarsiligi: "—",
    tipikYapilar: [
      "Hastane (200–399 yatak)",
      "4 yıldızlı otel",
      "Büyük ibadethane (≥1500 kişi) — hesap DIŞI",
    ],
    dikkatNotu: "2026 birim fiyatı henüz açıklanmadı; hesaplamada 2025 değeri (35.600 TL/m²) kullanılıyor.",
  },
  {
    sinif: "5C",
    birim: 39_500, // 2025 değeri — 2026 tebliği çıkınca güncelle
    konutKarsiligi: "—",
    tipikYapilar: [
      "Hastane (≥ 400 yatak)",
      "Müze",
      "Opera / tiyatro",
      "Kongre ve kültür merkezi",
    ],
    dikkatNotu: "2026 birim fiyatı henüz açıklanmadı; hesaplamada 2025 değeri (39.500 TL/m²) kullanılıyor.",
  },
  {
    sinif: "5D",
    birim: 43_400, // 2025 değeri — 2026 tebliği çıkınca güncelle
    konutKarsiligi: "—",
    tipikYapilar: [
      "5 yıldızlı otel",
      "Şehir hastanesi",
      "Havalimanı terminal binası",
      "Metro istasyonu",
    ],
    dikkatNotu: "2026 birim fiyatı henüz açıklanmadı; hesaplamada 2025 değeri (43.400 TL/m²) kullanılıyor.",
  },
];

// ─────────────────────────────────────────────
// KONUT + TİCARİ KARMA YAPI YARDIMCI FONKSİYONU
// Wizard'dan gelen ham m² değerlerini alır,
// oran hesaplar, sınıf tayin eder.
// ─────────────────────────────────────────────

/**
 * Konut+ticari karma yapı sınıfı tayin fonksiyonu.
 *
 * Kural (Tebliğ Madde 2/3 pratiği):
 *   Ticari oran < %30   → Konut sınıfı (yüksekliğe göre) — zemin dükkan tipi
 *   Ticari oran %30–%49 → Konut sınıfı (yüksekliğe göre) + uzman uyarısı
 *   Ticari oran ≥ %50   → İş merkezi sınıfı (yüksekliğe göre)
 *   Ticari = AVM        → V.A karma yapı (ayrı seçenek olarak girilmeli)
 *
 * Wizard'da gösterim:
 *   1. Yapı yüksekliği (m)
 *   2. Ticari alanların toplam m² → hesaplanır
 *   3. Yapının toplam brüt m²     → hesaplanır
 *   → Oran ve sınıf anlık gösterilir
 */
export function karmaYapiSinifiTayin(params: {
  yukseklikM: number;
  ticariAlanM2: number;
  toplamAlanM2: number;
}): YapiSinifiTayinSonucu & {
  ticariOran: number;
  ticariOranYuzde: string;
  uygulanenKural: "konut" | "is_merkezi" | "karma_uyari";
} {
  const { yukseklikM, ticariAlanM2, toplamAlanM2 } = params;

  if (toplamAlanM2 <= 0) throw new Error("Toplam alan 0'dan büyük olmalıdır.");
  const oran = Math.min(ticariAlanM2 / toplamAlanM2, 1);
  const yuzde = `%${Math.round(oran * 100)}`;

  // Yüksekliğe göre temel sınıfları hesapla
  const konutSonuc = yapiSinifiTayin({ yapiTipi: "konut_apartman", yukseklikM });
  const isSonuc    = yapiSinifiTayin({ yapiTipi: "is_merkezi",     yukseklikM });

  if (oran < 0.30) {
    return {
      ...konutSonuc,
      aciklama: `Ticari oran ${yuzde} < %30 → konut sınıfı. ${konutSonuc.aciklama}`,
      ticariOran: oran,
      ticariOranYuzde: yuzde,
      uygulanenKural: "konut",
    };
  }

  if (oran < 0.50) {
    return {
      ...konutSonuc,
      aciklama: `Ticari oran ${yuzde} (%30–%49) → konut sınıfı esas alındı. ${konutSonuc.aciklama}`,
      uyari: `Ticari oran ${yuzde} ile %50 sınırına yakın. Kesin tayin için uzman değerlendirmesi önerilir.`,
      ticariOran: oran,
      ticariOranYuzde: yuzde,
      uygulanenKural: "karma_uyari",
    };
  }

  // oran >= 0.50 → iş merkezi kuralı
  return {
    ...isSonuc,
    aciklama: `Ticari oran ${yuzde} ≥ %50 → iş merkezi sınıfı. ${isSonuc.aciklama}`,
    uyari: `Ticari alan yapının yarısından fazla. İş merkezi sınıfı uygulandı.`,
    ticariOran: oran,
    ticariOranYuzde: yuzde,
    uygulanenKural: "is_merkezi",
  };
}
