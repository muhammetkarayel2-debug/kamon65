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
// ─────────────────────────────────────────────

export type YapiTipi =
  | "konut_apartman"
  | "konut_mustakil"
  | "konut_ticari"
  | "is_merkezi"
  | "okul_ilkortaokul"
  | "okul_lise"
  | "universite"
  | "universite_kampus"
  | "hastane_kucuk"
  | "hastane_orta"
  | "hastane_buyuk"
  | "hastane_egitim"
  | "sehir_hastanesi"
  | "avm_kucuk"
  | "avm_buyuk"
  | "otel_1_2"
  | "otel_3"
  | "otel_4"
  | "otel_5"
  | "apart_otel"
  | "ibadethane_kucuk"
  | "ibadethane_orta"
  | "ibadethane_buyuk"
  | "spor_salon_kucuk"
  | "spor_salon_orta"
  | "spor_salon_buyuk"
  | "stadyum"
  | "karma_yapi"
  | "kamu_ilce"
  | "kamu_il"
  | "adalet_sarayi"
  | "ogrenci_yurdu"
  | "muzekongre"
  | "havalimani"
  | "metro"
  | "diger";

export interface YapiTipiTanim {
  etiket: string;
  aciklama: string;
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
  hastane_kucuk:     { etiket: "Hastane (< 200 yatak)",               aciklama: "IV.C — dahil",                                     parametreler: ["yatak_sayisi"] },
  hastane_orta:      { etiket: "Hastane (200–399 yatak)",             aciklama: "V.B — dahil",                                      parametreler: ["yatak_sayisi"] },
  hastane_buyuk:     { etiket: "Hastane (≥ 400 yatak)",               aciklama: "V.C — dahil",                                      parametreler: ["yatak_sayisi"] },
  hastane_egitim:    { etiket: "Eğitim-Araştırma Hastanesi",          aciklama: "V.A — dahil",                                      parametreler: [] },
  sehir_hastanesi:   { etiket: "Şehir Hastanesi",                     aciklama: "V.D — dahil",                                      parametreler: [] },
  avm_kucuk:         { etiket: "AVM (< 25.000 m²)",                   aciklama: "Sabit: IV.A",                                      parametreler: [] },
  avm_buyuk:         { etiket: "AVM (≥ 25.000 m²)",                   aciklama: "Sabit: IV.C",                                      parametreler: [] },
  otel_1_2:          { etiket: "Otel (1–2 yıldız)",                   aciklama: "IV.A — dahil",                                     parametreler: ["yildiz"] },
  otel_3:            { etiket: "Otel (3 yıldız)",                     aciklama: "IV.C — dahil",                                     parametreler: ["yildiz"] },
  otel_4:            { etiket: "Otel (4 yıldız)",                     aciklama: "V.B — dahil",                                      parametreler: ["yildiz"] },
  otel_5:            { etiket: "Otel (5 yıldız)",                     aciklama: "V.D — dahil",                                      parametreler: ["yildiz"] },
  apart_otel:        { etiket: "Apart Otel",                          aciklama: "Sabit: III.B",                                     parametreler: [] },
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

export type WizardAnaSecim = "konut" | "konut_ticari" | "diger";

export interface WizardKonutSorulari {
  anaSecim: "konut" | "konut_ticari";
  katSayisi: number;
  yukseklikM?: number;
  ticariAlanM2?: number;
  toplamAlanM2?: number;
}

export interface WizardDigerSorulari {
  anaSecim: "diger";
  yapiTipi: YapiTipi;
  yukseklikM?: number;
  bagimsisBolumAlanM2?: number;
  yatakSayisi?: number;
  yildiz?: 1|2|3|4|5;
}

export function wizardKonutTayin(params: WizardKonutSorulari): YapiSinifiTayinSonucu & {
  hesaplananYukseklikM: number;
  sinirBolgesiUyari: boolean;
} {
  const hesaplananY = params.yukseklikM
    ?? katSayisindanYukseklik(params.katSayisi).yaklasikM;

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

  const sonuc = yapiSinifiTayin({ yapiTipi: "konut_apartman", yukseklikM: hesaplananY });
  return {
    ...sonuc,
    hesaplananYukseklikM: hesaplananY,
    sinirBolgesiUyari: _sinirBolgesindeMi(hesaplananY),
  };
}

function _sinirBolgesindeMi(yukseklikM: number): boolean {
  const ESIKLER = [21.50, 30.50, 51.50];
  return ESIKLER.some(e => Math.abs(yukseklikM - e) <= 1.5);
}

export function wizardDigerSorulariGetir(yapiTipi: YapiTipi): WizardSoru[] {
  return WIZARD_SORULARI[yapiTipi] ?? [];
}

export function wizardDigerTayin(params: WizardDigerSorulari): YapiSinifiTayinSonucu {
  const { yapiTipi, yukseklikM, bagimsisBolumAlanM2, yatakSayisi, yildiz } = params;

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

export interface WizardSoru {
  alan: string;
  etiket: string;
  tip: "sayi" | "secim";
  birim?: string;
  secenekler?: Array<{ deger: string | number; etiket: string }>;
  aciklama?: string;
}

export const WIZARD_SORULARI: Partial<Record<YapiTipi, WizardSoru[]>> = {
  konut_apartman: [{
    alan: "yukseklikM",
    etiket: "Yapı yüksekliği",
    tip: "sayi",
    birim: "m",
    aciklama: "İskan belgesindeki toplam yapı yüksekliği (m).",
  }],
  konut_mustakil: [{
    alan: "bagimsisBolumAlanM2",
    etiket: "Bağımsız bölüm brüt inşaat alanı",
    tip: "sayi",
    birim: "m²",
    aciklama: "Tek bir bağımsız bölümün (konutun) brüt alanı — tüm yapının alanı değil.",
  }],
  konut_ticari: [
    { alan: "yukseklikM", etiket: "Yapı yüksekliği", tip: "sayi", birim: "m" },
    { alan: "ticariAlanM2", etiket: "Ticari alanların toplam m²'si", tip: "sayi", birim: "m²" },
    { alan: "toplamAlanM2", etiket: "Yapının toplam brüt inşaat alanı", tip: "sayi", birim: "m²" },
  ],
  is_merkezi: [{
    alan: "yukseklikM",
    etiket: "Yapı yüksekliği",
    tip: "sayi",
    birim: "m",
  }],
  hastane_kucuk: [{
    alan: "yatakSayisi",
    etiket: "Kaç yataklı?",
    tip: "sayi",
    birim: "yatak",
  }],
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
  }],
};

export const DAHIL_DEGIL_UYARISI = {
  ibadethane_kucuk:  "İbadethaneler müteahhitlik yetki belgesi iş deneyimi hesabına dahil değildir (tüm sınıflar).",
  ibadethane_orta:   "İbadethaneler müteahhitlik yetki belgesi iş deneyimi hesabına dahil değildir (tüm sınıflar).",
  ibadethane_buyuk:  "İbadethaneler müteahhitlik yetki belgesi iş deneyimi hesabına dahil değildir (tüm sınıflar).",
} as const;

export interface YapiSinifiTayinGirdisi {
  yapiTipi: YapiTipi;
  yukseklikM?: number;
  bagimsisBolumAlanM2?: number;
}

export interface YapiSinifiTayinSonucu {
  sinif: YapiSinifiKodu | null;
  etiket: string;
  birimFiyat2026: number | null;
  dahilMi: boolean;
  aciklama: string;
  uyari?: string;
}

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

    case "konut_apartman": {
      if (!yukseklikM) return dahil("3B", "Yükseklik bilinmiyor, en düşük sınıf (III.B) alındı.", "Yapı yüksekliğini girerek doğru sınıf tayini yapın.");
      if (yukseklikM <= 21.50) return dahil("3B", `Yapı yüksekliği ${yukseklikM}m ≤ 21.50m → III.B`);
      if (yukseklikM <= 30.50) return dahil("3C", `Yapı yüksekliği ${yukseklikM}m: 21.50m < h ≤ 30.50m → III.C`);
      if (yukseklikM <= 51.50) return dahil("4A", `Yapı yüksekliği ${yukseklikM}m: 30.50m < h ≤ 51.50m → IV.A`);
      return dahil("4B", `Yapı yüksekliği ${yukseklikM}m > 51.50m → IV.B`);
    }

    case "konut_mustakil": {
      if (!bagimsisBolumAlanM2) return dahil("3B", "Alan bilinmiyor, en düşük sınıf (III.B) alındı.", "Bağımsız bölüm brüt alanını girerek doğru sınıf tayini yapın.");
      if (bagimsisBolumAlanM2 < 200)  return dahil("3B", `Brüt alan ${bagimsisBolumAlanM2}m² < 200m² → III.B`);
      if (bagimsisBolumAlanM2 < 500)  return dahil("3C", `Brüt alan ${bagimsisBolumAlanM2}m²: 200m² ≤ alan < 500m² → III.C`);
      return dahil("4B", `Brüt alan ${bagimsisBolumAlanM2}m² ≥ 500m² → IV.B`);
    }

    case "konut_ticari": {
      const alan = bagimsisBolumAlanM2 ?? 0;
      const yuk  = yukseklikM ?? 0;
      const ticariOran = alan;

      if (ticariOran >= 1) return yapiSinifiTayin({ yapiTipi: "is_merkezi", yukseklikM: yuk });

      if (ticariOran >= 0.50) {
        const isSonuc = yapiSinifiTayin({ yapiTipi: "is_merkezi", yukseklikM: yuk });
        return {
          ...isSonuc,
          aciklama: `Ticari alan oranı ${Math.round(ticariOran * 100)}% ≥ 50% → iş merkezi kuralı uygulandı. ${isSonuc.aciklama}`,
          uyari: "Ticari alan ≥ %50 olduğundan yapı yüksekliğine göre iş merkezi sınıfı esas alındı.",
        };
      }

      if (ticariOran >= 0.30) {
        const konutSonuc = yapiSinifiTayin({ yapiTipi: "konut_apartman", yukseklikM: yuk });
        return {
          ...konutSonuc,
          aciklama: `Ticari alan oranı ${Math.round(ticariOran * 100)}% (< 50%) → konut sınıfı esas alındı. ${konutSonuc.aciklama}`,
          uyari: "Ticari oran %30–50 arasında. Kesin tayin için uzman değerlendirmesi önerilir.",
        };
      }

      const konutSonuc = yapiSinifiTayin({ yapiTipi: "konut_apartman", yukseklikM: yuk });
      return {
        ...konutSonuc,
        aciklama: `Ticari alan oranı ${Math.round(ticariOran * 100)}% < 30% → konut sınıfı esas alındı. ${konutSonuc.aciklama}`,
      };
    }

    case "is_merkezi": {
      if (!yukseklikM) return dahil("3B", "Yükseklik bilinmiyor, en düşük sınıf (III.B) alındı.", "Yapı yüksekliğini girerek doğru sınıf tayini yapın.");
      if (yukseklikM <= 21.50) return dahil("3B", `İş merkezi yüksekliği ${yukseklikM}m ≤ 21.50m → III.B`);
      if (yukseklikM <= 30.50) return dahil("3C", `İş merkezi yüksekliği ${yukseklikM}m: 21.50m < h ≤ 30.50m → III.C`);
      if (yukseklikM <= 51.50) return dahil("4B", `İş merkezi yüksekliği ${yukseklikM}m: 30.50m < h ≤ 51.50m → IV.B`);
      return dahil("5A", `İş merkezi yüksekliği ${yukseklikM}m > 51.50m → V.A`);
    }

    case "okul_ilkortaokul": return dahil("3B", "İlkokul/ortaokul → sabit III.B");
    case "okul_lise":         return dahil("3C", "Lise → sabit III.C");
    case "universite":        return dahil("4A", "Üniversite (fakülte/yüksekokul) → sabit IV.A");
    case "universite_kampus": return dahil("5A", "Üniversite kampüsü → sabit V.A");
    case "hastane_kucuk":     return dahil("4C", "Hastane < 200 yatak → IV.C");
    case "hastane_orta":      return dahil("5B", "Hastane 200–399 yatak → V.B");
    case "hastane_buyuk":     return dahil("5C", "Hastane ≥ 400 yatak → V.C");
    case "hastane_egitim":    return dahil("5A", "Eğitim-araştırma hastanesi → V.A");
    case "sehir_hastanesi":   return dahil("5D", "Şehir hastanesi → V.D");
    case "avm_kucuk":         return dahil("4A", "AVM < 25.000 m² → IV.A");
    case "avm_buyuk":         return dahil("4C", "AVM ≥ 25.000 m² → IV.C");
    case "otel_1_2":          return dahil("4A", "1–2 yıldızlı otel → IV.A");
    case "otel_3":            return dahil("4C", "3 yıldızlı otel → IV.C");
    case "otel_4":            return dahil("5B", "4 yıldızlı otel → V.B");
    case "otel_5":            return dahil("5D", "5 yıldızlı otel → V.D");
    case "apart_otel":        return dahil("3B", "Apart otel → III.B");
    case "ibadethane_kucuk":  return dahilDegil("İbadethane (< 500 kişi) — müteahhitlik hesabına dahil değildir.");
    case "ibadethane_orta":   return dahilDegil("İbadethane (500–1499 kişi) — müteahhitlik hesabına dahil değildir.");
    case "ibadethane_buyuk":  return dahilDegil("İbadethane (≥ 1500 kişi) — müteahhitlik hesabına dahil değildir.");
    case "spor_salon_kucuk":  return dahil("3B", "Kapalı spor salonu < 1000 seyirci → III.B");
    case "spor_salon_orta":   return dahil("4A", "Kapalı spor salonu 1000–4999 seyirci → IV.A");
    case "spor_salon_buyuk":  return dahil("4B", "Kapalı spor salonu ≥ 5000 seyirci → IV.B");
    case "stadyum":           return dahil("5A", "Stadyum / hipodrom → V.A");
    case "karma_yapi":        return dahil("5A", "Karma yapı (AVM+ofis+konut) → V.A");
    case "kamu_ilce":         return dahil("4A", "İlçe tipi kamu binası → IV.A");
    case "kamu_il":           return dahil("4C", "İl tipi kamu binası → IV.C");
    case "adalet_sarayi":     return dahil("4C", "Adalet sarayı → IV.C");
    case "ogrenci_yurdu":     return dahil("3C", "Öğrenci yurdu → III.C");
    case "muzekongre":        return dahil("5C", "Müze / opera / kongre merkezi → V.C");
    case "havalimani":        return dahil("5D", "Havalimanı terminal binası → V.D");
    case "metro":             return dahil("5D", "Metro istasyonu → V.D");
    case "diger":             return dahil("3B", "Diğer — manuel sınıf seçimi yapılır", "Manuel sınıf seçiminde lütfen ruhsattaki sınıfı belirtin.");

    default: return dahil("3B", "Bilinmeyen yapı tipi — III.B alındı.");
  }
}

// ─── Karma yapı yardımcı fonksiyon ───────────────────────────
function karmaYapiSinifiTayin(params: {
  yukseklikM: number;
  ticariAlanM2: number;
  toplamAlanM2: number;
}): YapiSinifiTayinSonucu {
  const oran = params.toplamAlanM2 > 0 ? params.ticariAlanM2 / params.toplamAlanM2 : 0;
  return yapiSinifiTayin({
    yapiTipi: "konut_ticari",
    yukseklikM: params.yukseklikM,
    bagimsisBolumAlanM2: oran,
  });
}

// ─── Kat sayısından yükseklik tahmini ─────────────────────────
export function katSayisindanYukseklik(katSayisi: number): {
  yaklasikM: number;
  aciklama: string;
} {
  // Türkiye ortalaması: zemin kat 4.5m, üst katlar 3m
  const yaklasik = katSayisi <= 1 ? 4.5 : 4.5 + (katSayisi - 1) * 3.0;
  return {
    yaklasikM: yaklasik,
    aciklama: `${katSayisi} katlı yapı → yaklaşık ${yaklasik}m (zemin 4.5m + üst katlar 3m/kat)`,
  };
}
