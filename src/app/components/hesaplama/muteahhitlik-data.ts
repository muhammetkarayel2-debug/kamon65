// ============================================================
// muteahhitlik-data.ts
// Kaynak: 2026 Yapı Müteahhitliği Yeterlilik Şartları PDF
// ============================================================

// ─────────────────────────────────────────────
// GRUP TANIM TİPLERİ
// ─────────────────────────────────────────────

export type GrupKodu = "A" | "B" | "B1" | "C" | "C1" | "D" | "D1" | "E" | "E1" | "F" | "F1" | "G" | "G1" | "H";

export interface GrupTanimi {
  kod: GrupKodu;
  siraNo: number;

  // İş Deneyim Şartı
  minIsDeneyimTL: number | null;          // null = gerekmez (H grubu)

  // Bilanço Oranları
  bilanco: {
    genelCiro: number | null;             // minimum TL (null = gerekmez)
    yapimCiro: number | null;             // minimum TL (null = gerekmez)
    cariOran: number | null;              // minimum oran (null = gerekmez)
    ozKaynakOrani: number | null;         // minimum oran
    borcOrani: number | null;             // maximum oran
  };

  // Teknik/İdari Kadro
  kadro: {
    usta: number;
    teknikPersonel: number;
  };

  // Üstlenebileceği İş
  maxIsTutariTL: number;                  // EK-4 grubun üstlenebileceği iş tutarı
  maxM2: number | "SINIRSIZ";            // en büyük yapı sınıfına göre değişir, burada max değer

  // Ödemeler
  odemeler: {
    grupKayitUcreti: number;              // TL
    yetkiBelgeNumarasiUcreti: number;     // TL
    grupTayinItiraziYenilemeAktivasyonUcreti: number; // TL
  };

  // İş Ortaklığı Şartları (ADİ/İŞ ORTAKLIĞI)
  isOrtakligi: {
    pilotOrtakMinimumGrup: GrupKodu | null;
    ozelOrtakMinimumGrup: GrupKodu | null;
  };

  // Banka Referans Mektubu
  bankaReferansMektubuTL: number | null;  // null = gerekmez

  // Geçiş/Yükseltme Yapılabilecek Gruplar
  gecisGruplari: GrupKodu[];
}

// ─────────────────────────────────────────────
// 2026 GRUP VERİLERİ (PDF'den aynen alınmıştır)
// ─────────────────────────────────────────────

export const GRUPLAR: Record<GrupKodu, GrupTanimi> = {
  A: {
    kod: "A", siraNo: 1,
    minIsDeneyimTL: 2_476_500_000,
    bilanco: {
      genelCiro: 371_475_000, yapimCiro: 297_180_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 50, teknikPersonel: 8 },
    maxIsTutariTL: null, // SINIRSIZ
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 43_500,
      grupTayinItiraziYenilemeAktivasyonUcreti: 172_500,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "B1", ozelOrtakMinimumGrup: "E1" },
    bankaReferansMektubuTL: 123_825_000,
    gecisGruplari: [],
  },

  B: {
    kod: "B", siraNo: 2,
    minIsDeneyimTL: 1_733_550_000,
    bilanco: {
      genelCiro: 260_032_500, yapimCiro: 208_026_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 24, teknikPersonel: 6 },
    maxIsTutariTL: 1_733_550_000,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 33_300,
      grupTayinItiraziYenilemeAktivasyonUcreti: 130_000,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "C", ozelOrtakMinimumGrup: "E1" },
    bankaReferansMektubuTL: 86_677_500,
    gecisGruplari: ["A"],
  },

  B1: {
    kod: "B1", siraNo: 3,
    minIsDeneyimTL: 1_485_900_000,
    bilanco: {
      genelCiro: 222_885_000, yapimCiro: 178_308_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 18, teknikPersonel: 4 },
    maxIsTutariTL: 1_485_900_000,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 25_500,
      grupTayinItiraziYenilemeAktivasyonUcreti: 98_000,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "C1", ozelOrtakMinimumGrup: "E1" },
    bankaReferansMektubuTL: 74_295_000,
    gecisGruplari: ["B"],
  },

  C: {
    kod: "C", siraNo: 4,
    minIsDeneyimTL: 1_238_250_000,
    bilanco: {
      genelCiro: 185_737_500, yapimCiro: 148_590_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 12, teknikPersonel: 3 },
    maxIsTutariTL: 1_238_250_000,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 115_900,
      grupTayinItiraziYenilemeAktivasyonUcreti: 115_900,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "D", ozelOrtakMinimumGrup: "F" },
    bankaReferansMektubuTL: 61_912_500,
    gecisGruplari: ["B1", "B"],
  },

  C1: {
    kod: "C1", siraNo: 5,
    minIsDeneyimTL: 1_031_875_000,
    bilanco: {
      genelCiro: 154_781_250, yapimCiro: 123_825_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 10, teknikPersonel: 3 },
    maxIsTutariTL: 1_031_875_000,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 86_500,
      grupTayinItiraziYenilemeAktivasyonUcreti: 86_500,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "D1", ozelOrtakMinimumGrup: "F1" },
    bankaReferansMektubuTL: 51_393_750,
    gecisGruplari: ["C", "B1"],
  },

  D: {
    kod: "D", siraNo: 6,
    minIsDeneyimTL: 825_500_000,
    bilanco: {
      genelCiro: 123_825_000, yapimCiro: 99_060_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 9, teknikPersonel: 2 },
    maxIsTutariTL: 825_500_000,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 20_100,
      grupTayinItiraziYenilemeAktivasyonUcreti: 73_300,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "D1", ozelOrtakMinimumGrup: "G" },
    bankaReferansMektubuTL: 41_275_000,
    gecisGruplari: ["C1", "C"],
  },

  D1: {
    kod: "D1", siraNo: 7,
    minIsDeneyimTL: 619_125_000,
    bilanco: {
      genelCiro: 92_868_750, yapimCiro: 74_295_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 8, teknikPersonel: 2 },
    maxIsTutariTL: 619_125_000,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 15_700,
      grupTayinItiraziYenilemeAktivasyonUcreti: 62_000,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "E", ozelOrtakMinimumGrup: "G1" },
    bankaReferansMektubuTL: 30_956_250,
    gecisGruplari: ["D", "C1"],
  },

  E: {
    kod: "E", siraNo: 8,
    minIsDeneyimTL: 412_750_000,
    bilanco: {
      genelCiro: 41_275_000, yapimCiro: 33_020_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 6, teknikPersonel: 2 },
    maxIsTutariTL: 474_662_500,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 12_700,
      grupTayinItiraziYenilemeAktivasyonUcreti: 48_500,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "E1", ozelOrtakMinimumGrup: "G1" },
    bankaReferansMektubuTL: 20_637_500,
    gecisGruplari: ["D1", "D"],
  },

  E1: {
    kod: "E1", siraNo: 9,
    minIsDeneyimTL: 247_650_000,
    bilanco: {
      genelCiro: 24_765_000, yapimCiro: 19_812_000,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 5, teknikPersonel: 2 },
    maxIsTutariTL: 330_200_000,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 10_700,
      grupTayinItiraziYenilemeAktivasyonUcreti: 41_200,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "E1", ozelOrtakMinimumGrup: "H" },
    bankaReferansMektubuTL: 12_382_500,
    gecisGruplari: ["E", "D1"],
  },

  F: {
    kod: "F", siraNo: 10,
    minIsDeneyimTL: 123_825_000,
    bilanco: {
      genelCiro: null, yapimCiro: null,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 3, teknikPersonel: 1 },
    maxIsTutariTL: 247_650_000,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 8_500,
      grupTayinItiraziYenilemeAktivasyonUcreti: 33_300,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "G", ozelOrtakMinimumGrup: "H" },
    bankaReferansMektubuTL: 6_191_250,
    gecisGruplari: ["E1", "E"],
  },

  F1: {
    kod: "F1", siraNo: 11,
    minIsDeneyimTL: 105_251_250,
    bilanco: {
      genelCiro: null, yapimCiro: null,
      cariOran: 0.75, ozKaynakOrani: 0.15, borcOrani: 0.75,
    },
    kadro: { usta: 3, teknikPersonel: 1 },
    maxIsTutariTL: 184_189_687.50,
    maxM2: "SINIRSIZ",
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 6_800,
      grupTayinItiraziYenilemeAktivasyonUcreti: 27_750,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "G", ozelOrtakMinimumGrup: "H" },
    bankaReferansMektubuTL: 5_262_562.50,
    gecisGruplari: ["F", "E1"],
  },

  G: {
    kod: "G", siraNo: 12,
    minIsDeneyimTL: 86_677_500,
    bilanco: {
      genelCiro: null, yapimCiro: null,
      cariOran: null, ozKaynakOrani: null, borcOrani: null,
    },
    kadro: { usta: 1, teknikPersonel: 1 },
    maxIsTutariTL: 130_016_250,
    maxM2: 82_354,
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 5_650,
      grupTayinItiraziYenilemeAktivasyonUcreti: 21_750,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "G1", ozelOrtakMinimumGrup: "H" },
    bankaReferansMektubuTL: 4_333_875,
    gecisGruplari: ["G1", "F1"],
  },

  G1: {
    kod: "G1", siraNo: 13,
    minIsDeneyimTL: 61_912_500,
    bilanco: {
      genelCiro: null, yapimCiro: null,
      cariOran: null, ozKaynakOrani: null, borcOrani: null,
    },
    kadro: { usta: 1, teknikPersonel: 1 },
    maxIsTutariTL: 92_868_750,
    maxM2: 70_589,
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 3_900,
      grupTayinItiraziYenilemeAktivasyonUcreti: 14_700,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "G1", ozelOrtakMinimumGrup: "H" },
    bankaReferansMektubuTL: 3_095_625,
    gecisGruplari: ["G"],
  },

  H: {
    kod: "H", siraNo: 14,
    minIsDeneyimTL: null,
    bilanco: {
      genelCiro: null, yapimCiro: null,
      cariOran: null, ozKaynakOrani: null, borcOrani: null,
    },
    kadro: { usta: 1, teknikPersonel: 1 },
    maxIsTutariTL: 44_223_214.29,
    maxM2: 58_824,
    odemeler: {
      grupKayitUcreti: 17_000,
      yetkiBelgeNumarasiUcreti: 2_150,
      grupTayinItiraziYenilemeAktivasyonUcreti: 7_700,
    },
    isOrtakligi: { pilotOrtakMinimumGrup: "H", ozelOrtakMinimumGrup: "H" },
    bankaReferansMektubuTL: null,
    gecisGruplari: ["G1"],
  },
};

// ─────────────────────────────────────────────
// FİYATLANDIRMA PAKETLERİ
// ─────────────────────────────────────────────

export type HizmetPaketiKodu =
  | "TAM_HIZMET"        // İstanbul içi: analiz + evrak + başvuru
  | "SADECE_HESAPLAMA"  // İstanbul içi/dışı: yalnızca iş deneyim hesabı
  | "UZAKTAN_DESTEK";   // İstanbul dışı: hesaplama + soru/cevap

export interface HizmetPaketi {
  kod: HizmetPaketiKodu;
  ad: string;
  aciklama: string;
  fiyatTL: number;
  konumKisiti: "istanbul" | "istanbul_disi" | "hepsi";
  icerik: string[];
  dahilDegil: string[];
}

export const HIZMET_PAKETLERI: Record<HizmetPaketiKodu, HizmetPaketi> = {
  TAM_HIZMET: {
    kod: "TAM_HIZMET",
    ad: "Tam Hizmet Paketi",
    aciklama: "Analiz, evrak hazırlığı ve başvuru sürecini baştan sona yönetiyoruz.",
    fiyatTL: 18_000,
    konumKisiti: "istanbul",
    icerik: [
      "İş deneyim tutarı hesaplaması",
      "Sınıf tayini analizi (hangi gruba girebileceğiniz)",
      "Tüm evrakların hazırlanması",
      "Bakanlık başvurusunun yürütülmesi",
      "Süreç boyunca WhatsApp/e-posta takibi",
    ],
    dahilDegil: [
      "Bakanlık harç ve ücretleri (ayrıca ödenir)",
      "Noterlik/imza giderleri",
    ],
  },

  SADECE_HESAPLAMA: {
    kod: "SADECE_HESAPLAMA",
    ad: "İş Deneyim Hesaplama",
    aciklama: "Mevcut işleriniz değerlendirilerek hangi gruba başvurabileceğiniz hesaplanır.",
    fiyatTL: 10_000,
    konumKisiti: "hepsi",
    icerik: [
      "İş deneyim tutarı hesaplaması (tüm yapılar)",
      "Hangi gruba denk geldiğinin tespiti",
      "Detaylı analiz raporu (PDF)",
      "1 soru/cevap seansı (telefon veya video)",
    ],
    dahilDegil: [
      "Evrak hazırlığı",
      "Başvuru yürütme",
    ],
  },

  UZAKTAN_DESTEK: {
    kod: "UZAKTAN_DESTEK",
    ad: "Uzaktan Danışmanlık",
    aciklama: "İstanbul dışındaki firmalar için hesaplama ve online destek paketi.",
    fiyatTL: 7_000,
    konumKisiti: "istanbul_disi",
    icerik: [
      "İş deneyim hesaplaması (belgesiz, ilk kez başvuranlar için)",
      "H grubu yeterlilik analizi",
      "Sorularınıza yazılı/video cevap",
    ],
    dahilDegil: [
      "Evrak hazırlığı",
      "Başvuru yürütme",
      "Fiziksel randevu",
    ],
  },
};

// ─────────────────────────────────────────────
// SINIF TAYİNİ HESAPLAMA MOTORU
// ─────────────────────────────────────────────

/**
 * Bir müteahhidin iş deneyim tutarına göre alabileceği en yüksek grubu döndürür.
 */
export function grupHesapla(isDeneyimTL: number): {
  onerilenGrup: GrupKodu;
  maksimumGrup: GrupKodu;
  aciklama: string;
  sonrakiEsik: { grup: GrupKodu; gerekliTL: number } | null;
} {
  const sirali: Array<{ kod: GrupKodu; esik: number }> = [
    { kod: "A",  esik: 2_476_500_000 },
    { kod: "B",  esik: 1_733_550_000 },
    { kod: "B1", esik: 1_485_900_000 },
    { kod: "C",  esik: 1_238_250_000 },
    { kod: "C1", esik: 1_031_875_000 },
    { kod: "D",  esik:   825_500_000 },
    { kod: "D1", esik:   619_125_000 },
    { kod: "E",  esik:   412_750_000 },
    { kod: "E1", esik:   247_650_000 },
    { kod: "F",  esik:   123_825_000 },
    { kod: "F1", esik:   105_251_250 },
    { kod: "G",  esik:    86_677_500 },
    { kod: "G1", esik:    61_912_500 },
  ];

  if (isDeneyimTL === 0) {
    return {
      onerilenGrup: "H",
      maksimumGrup: "H",
      aciklama: "İş deneyimi bulunmadığından H grubu (başlangıç) önerilmektedir.",
      sonrakiEsik: { grup: "G1", gerekliTL: 30_956_250 },
    };
  }

  const uygunGrup = sirali.find(g => isDeneyimTL >= g.esik);

  if (uygunGrup) {
    const grupIndex = sirali.findIndex(g => g.kod === uygunGrup.kod);
    const sonrakiIndex = grupIndex - 1;
    return {
      onerilenGrup: uygunGrup.kod,
      maksimumGrup: uygunGrup.kod,
      aciklama: `${isTL(isDeneyimTL)} iş deneyimiyle ${uygunGrup.kod} grubuna başvurabilirsiniz.`,
      sonrakiEsik: sonrakiIndex >= 0
        ? { grup: sirali[sonrakiIndex].kod, gerekliTL: sirali[sonrakiIndex].esik }
        : null,
    };
  }

  if (isDeneyimTL >= 30_956_250) {
    return {
      onerilenGrup: "G1",
      maksimumGrup: "G1",
      aciklama: `${isTL(isDeneyimTL)} iş deneyimiyle G1 grubuna başvurabilirsiniz.`,
      sonrakiEsik: { grup: "F1", gerekliTL: 61_912_500 },
    };
  }

  return {
    onerilenGrup: "H",
    maksimumGrup: "H",
    aciklama: "Mevcut iş deneyimi henüz G1 eşiğine ulaşmamıştır. H grubu önerilmektedir.",
    sonrakiEsik: { grup: "G1", gerekliTL: 61_912_500 },
  };
}

// ─────────────────────────────────────────────
// YAPI SINIF BİRİM FİYATLARI (2026)
// ─────────────────────────────────────────────

export interface YapiSinifi {
  sinif: string;
  birimFiyatTLm2: number;
}

export const YAPI_SINIFLARI: YapiSinifi[] = [
  { sinif: "III.B",  birimFiyatTLm2: 21_050 },
  { sinif: "III.C",  birimFiyatTLm2: 23_400 },
  { sinif: "IV.A",   birimFiyatTLm2: 26_450 },
  { sinif: "IV.B",   birimFiyatTLm2: 33_900 },
  { sinif: "IV.C",   birimFiyatTLm2: 40_500 },
  { sinif: "V.A",    birimFiyatTLm2: 42_350 },
];

export function isDeneyimHesapla(yapiSinifi: string, m2: number): number {
  const sinif = YAPI_SINIFLARI.find(s => s.sinif === yapiSinifi);
  if (!sinif) throw new Error(`Bilinmeyen yapı sınıfı: ${yapiSinifi}`);
  return sinif.birimFiyatTLm2 * m2;
}

export function toplamIsDeneyimHesapla(yapilar: Array<{ yapiSinifi: string; m2: number }>): number {
  return yapilar.reduce((toplam, yapi) => toplam + isDeneyimHesapla(yapi.yapiSinifi, yapi.m2), 0);
}

// ─────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────

export function isTL(tutar: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(tutar);
}

export function uygunPaketleriGetir(istanbul: boolean, isDeneyimiVar: boolean): HizmetPaketi[] {
  return Object.values(HIZMET_PAKETLERI).filter(paket => {
    if (paket.konumKisiti === "istanbul" && !istanbul) return false;
    if (paket.konumKisiti === "istanbul_disi" && istanbul) return false;
    if (!istanbul && isDeneyimiVar && paket.kod === "UZAKTAN_DESTEK") return false;
    return true;
  });
}

// ─────────────────────────────────────────────
// BAŞVURU SÜRECİ DURUM MAKİNESİ
// ─────────────────────────────────────────────

export type BasvuruDurumu =
  | "analiz_bekleniyor"
  | "analiz_tamamlandi"
  | "hizmet_secildi"
  | "odeme_alindi"
  | "evrak_toplaniyor"
  | "evrak_tamamlandi"
  | "basvuru_yapildi"
  | "basvuru_onaylandi"
  | "basvuru_reddedildi"
  | "yukseltme_bekliyor";

export interface BasvuruDurumuBilgisi {
  kod: BasvuruDurumu;
  etiket: string;
  renk: "gray" | "blue" | "amber" | "green" | "red";
  aciklama: string;
}

export const BASVURU_DURUMLARI: Record<BasvuruDurumu, BasvuruDurumuBilgisi> = {
  analiz_bekleniyor:   { kod: "analiz_bekleniyor",   etiket: "Analiz Bekleniyor",    renk: "gray",  aciklama: "Sınıf tayini analizi henüz yapılmadı." },
  analiz_tamamlandi:   { kod: "analiz_tamamlandi",   etiket: "Analiz Tamamlandı",    renk: "blue",  aciklama: "Grup belirlendi, hizmet seçimi bekleniyor." },
  hizmet_secildi:      { kod: "hizmet_secildi",       etiket: "Ödeme Bekleniyor",     renk: "amber", aciklama: "Hizmet paketi seçildi, ödeme onayı bekleniyor." },
  odeme_alindi:        { kod: "odeme_alindi",         etiket: "Ödeme Alındı",         renk: "blue",  aciklama: "Ödeme onaylandı, evrak süreci başlıyor." },
  evrak_toplaniyor:    { kod: "evrak_toplaniyor",     etiket: "Evrak Toplanıyor",     renk: "amber", aciklama: "Gerekli belgeler bekleniyor." },
  evrak_tamamlandi:    { kod: "evrak_tamamlandi",     etiket: "Evraklar Tamam",       renk: "blue",  aciklama: "Tüm belgeler alındı, başvuru hazırlanıyor." },
  basvuru_yapildi:     { kod: "basvuru_yapildi",      etiket: "Başvuru Yapıldı",      renk: "blue",  aciklama: "Bakanlığa başvuru iletildi, sonuç bekleniyor." },
  basvuru_onaylandi:   { kod: "basvuru_onaylandi",    etiket: "Belge Alındı ✓",       renk: "green", aciklama: "Yetki belgesi başarıyla alındı." },
  basvuru_reddedildi:  { kod: "basvuru_reddedildi",   etiket: "Eksik / Red",          renk: "red",   aciklama: "Başvuruda eksiklik veya red. İtiraz süreci başlatılabilir." },
  yukseltme_bekliyor:  { kod: "yukseltme_bekliyor",   etiket: "Yükseltme Süreci",     renk: "amber", aciklama: "Mevcut belge güncel, yükseltme analizi yapılıyor." },
};

// ─────────────────────────────────────────────
// ADİ / İŞ ORTAKLIĞI HESAPLAMA
// ─────────────────────────────────────────────

export function adiOrtaklikSartlari(talepEdilenGrup: GrupKodu): {
  pilotOrtakMinGrup: GrupKodu;
  ozelOrtakMinGrup: GrupKodu;
  aciklama: string;
} {
  const grup = GRUPLAR[talepEdilenGrup];
  const pilot = grup.isOrtakligi.pilotOrtakMinimumGrup as GrupKodu;
  const ozel  = grup.isOrtakligi.ozelOrtakMinimumGrup as GrupKodu;

  const aciklama = `${talepEdilenGrup} grubu almak için pilot ortağın en az ${pilot} grubunda, `
    + `özel ortağın en az ${ozel} grubunda olması gerekir.`;

  return { pilotOrtakMinGrup: pilot, ozelOrtakMinGrup: ozel, aciklama };
}

export function ortaklikGrubuHesapla(
  firma1Grup: GrupKodu,
  firma2Grup: GrupKodu,
): {
  maksimumGrup: GrupKodu;
  uygunGruplar: GrupKodu[];
  pilotFirma: GrupKodu;
  ozelFirma: GrupKodu;
  bankaReferansiGerekli: false;
  bilancoCiroSartiGerekli: false;
  aciklama: string;
} {
  const GROUP_ORDER: GrupKodu[] = ["A","B","B1","C","C1","D","D1","E","E1","F","F1","G","G1","H"];

  const idx1 = GROUP_ORDER.indexOf(firma1Grup);
  const idx2 = GROUP_ORDER.indexOf(firma2Grup);
  const pilotFirma = idx1 <= idx2 ? firma1Grup : firma2Grup;
  const ozelFirma  = idx1 <= idx2 ? firma2Grup : firma1Grup;

  const uygunGruplar: GrupKodu[] = [];
  for (const hedefGrup of GROUP_ORDER) {
    const sart = GRUPLAR[hedefGrup].isOrtakligi;
    const pilotSartIdx = GROUP_ORDER.indexOf(sart.pilotOrtakMinimumGrup as GrupKodu);
    const ozelSartIdx  = GROUP_ORDER.indexOf(sart.ozelOrtakMinimumGrup as GrupKodu);
    const pilotOk = GROUP_ORDER.indexOf(pilotFirma) <= pilotSartIdx;
    const ozelOk  = GROUP_ORDER.indexOf(ozelFirma)  <= ozelSartIdx;
    if (pilotOk && ozelOk) {
      uygunGruplar.push(hedefGrup);
    }
  }

  const maksimumGrup = uygunGruplar[0] ?? "H";

  const grupListesi = uygunGruplar.join(", ");
  const aciklama = uygunGruplar.length > 1
    ? `${firma1Grup} + ${firma2Grup} ortaklığında (pilot: ${pilotFirma}, özel: ${ozelFirma}) `
      + `${grupListesi} gruplarından biri seçilebilir. Banka referans mektubu ve EK-2 ciro/bilanço şartları aranmaz.`
    : `${firma1Grup} + ${firma2Grup} ortaklığında (pilot: ${pilotFirma}, özel: ${ozelFirma}) `
      + `yalnızca ${maksimumGrup} grubu alınabilir. Banka referans mektubu ve EK-2 ciro/bilanço şartları aranmaz.`;

  return {
    maksimumGrup,
    uygunGruplar,
    pilotFirma,
    ozelFirma,
    bankaReferansiGerekli: false,
    bilancoCiroSartiGerekli: false,
    aciklama,
  };
}

// ─────────────────────────────────────────────
// GRUBA GÖRE M2 HAKKI HESAPLAMA
// ─────────────────────────────────────────────

export const YAPI_SINIFI_BIRIM_FIYATLARI_2026: Record<string, number> = {
  "III.B": 21_050,
  "III.C": 23_400,
  "IV.A":  26_450,
  "IV.B":  33_900,
  "IV.C":  40_500,
  "V.A":   42_350,
};

export function grupM2Hakki(grupKodu: GrupKodu, yapiSinifi: string): number | "SINIRSIZ" {
  const grup = GRUPLAR[grupKodu];
  if (!grup.maxIsTutariTL) return "SINIRSIZ";
  const birimFiyat = YAPI_SINIFI_BIRIM_FIYATLARI_2026[yapiSinifi];
  if (!birimFiyat) throw new Error(`Bilinmeyen yapı sınıfı: ${yapiSinifi}`);
  return Math.round(grup.maxIsTutariTL / birimFiyat);
}

export function grupTumM2Haklari(grupKodu: GrupKodu): Record<string, number | "SINIRSIZ"> {
  return Object.fromEntries(
    Object.entries(YAPI_SINIFI_BIRIM_FIYATLARI_2026).map(([sinif]) => [
      sinif,
      grupM2Hakki(grupKodu, sinif),
    ])
  );
}
