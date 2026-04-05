// ============================================================
// lib/hesaplama.ts
// İş Deneyimi Güncelleme Motoru
// Kaynak: https://yfk.csb.gov.tr/tebligler-iscilikler-i-329
//         Resmi Örnek-1: 07.07.2017, III.B, 2000m²
// ============================================================
//
// DOĞRU FORMÜL (resmi prosedür — 6 adım):
//
//  1. Belge tutarı   = m² × birimFiyat(sözleşme dönemi) × 0.85
//  2. ÜFE katsayısı  = ÜFE(başvuru tarihi) / ÜFE(sözleşme tarihi)
//  3. YMO            = birimFiyat(başvuru dönemi) / birimFiyat(sözleşme dönemi)
//  4. Alt sınır      = YMO × 0.90  |  Üst sınır = YMO × 1.30
//  5. Katsayı seçimi:
//       ÜFE < alt  → alt sınır kullanılır
//       ÜFE > üst  → üst sınır kullanılır
//       aksi hâlde → ÜFE katsayısı kullanılır
//  6. Güncel tutar   = belge tutarı × seçilen katsayı
//
// ============================================================

export type YapiSinifiKodu = "3B" | "3C" | "4A" | "4B" | "4C" | "5A" | "5B" | "5C" | "5D";

// ─────────────────────────────────────────────
// Yİ-ÜFE ENDEKSLERİ (2010–2026)
// ─────────────────────────────────────────────
export const UFE_ENDEKSLERI: Record<string, number[]> = {
  "2026": [4910.53, 5029.76],
  "2025": [3861.33, 3943.01, 4017.30, 4128.19, 4230.69, 4334.94, 4409.73, 4518.89, 4632.89, 4708.20, 4747.63, 4783.04],
  "2024": [3035.59, 3149.03, 3252.79, 3369.98, 3435.96, 3483.25, 3550.88, 3610.51, 3659.84, 3707.10, 3731.43, 3746.52],
  "2023": [2105.17, 2138.04, 2147.44, 2164.94, 2179.02, 2320.72, 2511.75, 2659.60, 2749.98, 2803.29, 2882.04, 2915.02],
  "2022": [1129.03, 1210.60, 1321.90, 1423.27, 1548.01, 1652.75, 1738.21, 1780.05, 1865.09, 2011.13, 2026.08, 2021.19],
  "2021": [ 583.38,  590.52,  614.93,  641.63,  666.79,  693.54,  710.61,  730.28,  741.58,  780.45,  858.43, 1022.25],
  "2020": [ 462.42,  464.64,  468.69,  474.69,  482.02,  485.37,  490.33,  501.85,  515.13,  533.44,  555.18,  568.27],
  "2019": [ 424.86,  425.26,  431.98,  444.85,  456.74,  457.16,  452.63,  449.96,  450.55,  451.31,  450.97,  454.08],
  "2018": [ 319.60,  328.17,  333.21,  341.88,  354.85,  365.60,  372.06,  396.62,  439.78,  443.78,  432.55,  422.94],
  "2017": [ 284.99,  288.59,  291.58,  293.79,  295.31,  295.52,  297.65,  300.18,  300.90,  306.04,  312.21,  316.48],
  "2016": [ 250.67,  250.16,  251.17,  252.47,  256.21,  257.27,  257.81,  258.01,  258.77,  260.94,  266.16,  274.09],
  "2015": [ 236.61,  239.46,  241.97,  245.42,  248.15,  248.78,  247.99,  250.43,  254.25,  253.74,  250.13,  249.31],
  "2014": [ 229.10,  232.27,  233.98,  234.18,  232.96,  233.09,  234.79,  235.78,  237.79,  239.97,  237.65,  235.84],
  "2013": [ 206.91,  206.65,  208.33,  207.27,  209.34,  212.39,  214.50,  214.59,  216.48,  217.97,  219.31,  221.74],
  "2012": [ 203.10,  202.91,  203.64,  203.81,  204.89,  201.83,  201.20,  201.71,  203.79,  204.15,  207.54,  207.29],
  "2011": [ 182.75,  185.90,  188.17,  189.32,  189.61,  189.62,  189.57,  192.91,  195.89,  199.03,  200.32,  202.33],
  "2010": [ 164.94,  167.68,  170.94,  174.96,  172.95,  172.08,  171.81,  173.79,  174.67,  176.78,  176.23,  178.54],
};

// ─────────────────────────────────────────────
// YAPI BİRİM MALİYETLERİ (tebliğ yılına göre)
// 2017: III.B = 838 — resmi Örnek-1'den teyitli
// ─────────────────────────────────────────────
export const BIRIM_MALIYETLER: Record<string, Partial<Record<YapiSinifiKodu, number>>> = {
  "2026":   { "3B": 21050, "3C": 23400, "4A": 26450, "4B": 33900, "4C": 40500, "5A": 42350 },
  "2025":   { "3B": 18200, "3C": 19150, "4A": 21500, "4B": 27500, "4C": 32600, "5A": 34500 },
  "2024":   { "3B": 14400, "3C": 15100, "4A": 15600, "4B": 18200, "4C": 21500, "5A": 22750 },
  "2023-2": { "3B":  9600,              "4A": 10100, "4B": 11900,               "5A": 15200 },
  "2023-1": { "3B":  6350,              "4A":  6850, "4B":  7800,               "5A": 10400 },
  "2022-3": { "3B":  5250 },
  "2022-2": { "3B":  3850 },
  "2022-1": { "3B":  2800,              "4A":  3050, "4B":  3450,               "5A":  4500 },
  "2021":   { "3B":  1450,              "4A":  1550, "4B":  1800,               "5A":  2350 },
  "2020":   { "3B":  1130,              "4A":  1210, "4B":  1400,               "5A":  1850 },
  "2019":   { "3B":   980,              "4A":  1070, "4B":  1230,               "5A":  1630 },
  "2018":   { "3B":   800,              "4A":   860, "4B":   980,               "5A":  1300 },
  "2017":   { "3B":   838,              "4A":   880, "4B":  1005,               "5A":  1340 },
  "2016":   { "3B":   630,              "4A":   680, "4B":   775,               "5A":  1030 },
  "2015":   { "3B":   565,              "4A":   610, "4B":   695,               "5A":   925 },
  "2014":   { "3B":   650,              "4A":   700, "4B":   800,               "5A":  1150 },
  "2013":   { "3B":   460,              "4A":   500, "4B":   570,               "5A":   755 },
  "2012":   { "3B":   435,              "4A":   470, "4B":   535,               "5A":   710 },
  "2011":   { "3B":   400,              "4A":   435, "4B":   495,               "5A":   655 },
  "2010":   { "3B":   360,              "4A":   400, "4B":   450,               "5A":   600 },
};

export const REFERANS_UFE_SUBAT_2026 = 5029.76;

// ─────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────
export function donemBul(tarih: string): string {
  const d   = new Date(tarih);
  const yil = d.getFullYear();
  const ay  = d.getMonth() + 1;
  if (yil >= 2026) return "2026";
  if (yil === 2025) return "2025";
  if (yil === 2024) return "2024";
  if (yil === 2023) return ay >= 7 ? "2023-2" : "2023-1";
  if (yil === 2022) return ay >= 9 ? "2022-3" : ay >= 5 ? "2022-2" : "2022-1";
  if (yil >= 2010)  return String(yil);
  return "2010";
}

/** 
 * Verilen sözleşme/ihale tarihi için Yİ-ÜFE temel endeksini döndürür.
 *
 * KURAL: Sözleşme ayının bir önceki ayının endeksi kullanılır.
 * Kaynak: İki resmi örnekle doğrulandı:
 *   07.07.2017 → Haziran 2017 → 295.52 (kat karşılığı örneği)
 *   07.06.2019 → Mayıs 2019  → 456.74 (bedel karşılığı örneği)
 */
export function ufeEndeksiBul(tarih: string): number {
  const d   = new Date(tarih);
  // Bir önceki ay: ay 0 ise önceki yılın Aralık'ı
  let yil = d.getFullYear();
  let ay  = d.getMonth() - 1; // 0-based, bir önceki ay
  if (ay < 0) { ay = 11; yil -= 1; }

  const arr = UFE_ENDEKSLERI[String(yil)];
  if (!arr) return UFE_ENDEKSLERI["2010"][0];
  return arr[ay] ?? arr[arr.length - 1];
}

// ─────────────────────────────────────────────
// ANA HESAPLAMA
// ─────────────────────────────────────────────
export interface IsDeneyimGirdi {
  sozlesmeTarihi:  string;
  /** Ruhsattaki yapı sınıfı — müşterinin seçtiği, belge tutarı hesabında kullanılır */
  yapiSinifi:      YapiSinifiKodu;
  /**
   * Yapı tipi + yükseklik motorundan gelen 2026 güncel sınıf.
   * YMO (yapım maliyeti oranı) hesabında bfBas için kullanılır.
   * Verilmezse yapiSinifi kullanılır (eski davranış korunur).
   */
  guncelYapiSinifi?: YapiSinifiKodu;
  alanM2:          number;
  basvuruTarihi?:  string;
}

export interface IsDeneyimSonuc {
  // Adım 1
  belgeTutari:           number;
  birimFiyatSozlesme:    number;
  sozlesmeDonemi:        string;
  // Adım 2
  ufeEndeksSozlesme:     number;
  ufeEndeksBasvuru:      number;
  ufeKatsayi:            number;
  // Adım 3-5
  birimFiyatBasvuru:     number;
  basvuruDonemi:         string;
  /** YMO'da kullanılan sınıf (guncelYapiSinifi verilmişse o, yoksa yapiSinifi) */
  ymoSinifi:             YapiSinifiKodu;
  ymo:                   number;
  altSinir:              number;
  ustSinir:              number;
  kullanilanKatsayi:     number;
  bantDurumu:            "ufe" | "alt_sinir" | "ust_sinir";
  bantAciklama:          string;
  // Adım 6
  guncelTutar:           number;
  // Sınıf karşılaştırma — admin paneli için
  sinifDegisti:          boolean;
  /** Ruhsat sınıfı ile güncel sınıf farklıysa açıklama */
  sinifDegisimAciklama?: string;
}

export function isDeneyimHesapla(g: IsDeneyimGirdi): IsDeneyimSonuc {
  const sozDon = donemBul(g.sozlesmeTarihi);
  const basDon = g.basvuruTarihi ? donemBul(g.basvuruTarihi) : "2026";

  // Belge tutarı → DAIMA ruhsat sınıfı (sözleşmedeki sınıf)
  const bfSoz = BIRIM_MALIYETLER[sozDon]?.[g.yapiSinifi] ?? 0;

  // YMO paydası → güncel sınıf varsa onu kullan (yapı tipi + yükseklik motorundan)
  // Yoksa ruhsat sınıfını kullan (eski davranış)
  const ymoSinifi: YapiSinifiKodu = g.guncelYapiSinifi ?? g.yapiSinifi;
  const bfBas = BIRIM_MALIYETLER[basDon]?.[ymoSinifi]
    ?? BIRIM_MALIYETLER["2026"]?.[ymoSinifi]
    ?? BIRIM_MALIYETLER[basDon]?.[g.yapiSinifi]  // fallback: ruhsat sınıfı
    ?? BIRIM_MALIYETLER["2026"]?.[g.yapiSinifi]
    ?? 0;

  const ufeSoz = ufeEndeksiBul(g.sozlesmeTarihi);
  const ufeBas = g.basvuruTarihi ? ufeEndeksiBul(g.basvuruTarihi) : REFERANS_UFE_SUBAT_2026;

  // Adım 1 — Belge tutarı: ruhsat sınıfının sözleşme dönemindeki birim fiyatıyla
  const belge = g.alanM2 * bfSoz * 0.85;

  // Adım 2 — ÜFE katsayısı
  const ufeKat = ufeBas / ufeSoz;

  // Adım 3-4 — YMO: güncel sınıfın bugünkü birim fiyatı / ruhsat sınıfının sözleşme birim fiyatı
  const ymo = bfBas / bfSoz;
  const alt = ymo * 0.90;
  const ust = ymo * 1.30;

  // Adım 5 — katsayı seçimi
  let kat: number;
  let dur: IsDeneyimSonuc["bantDurumu"];
  let aciklama: string;

  if (ufeKat < alt) {
    kat      = alt;
    dur      = "alt_sinir";
    aciklama = `ÜFE (${ufeKat.toFixed(3)}) < alt sınır (${alt.toFixed(3)}) → alt sınır kullanıldı`;
  } else if (ufeKat > ust) {
    kat      = ust;
    dur      = "ust_sinir";
    aciklama = `ÜFE (${ufeKat.toFixed(3)}) > üst sınır (${ust.toFixed(3)}) → üst sınır kullanıldı`;
  } else {
    kat      = ufeKat;
    dur      = "ufe";
    aciklama = `ÜFE (${ufeKat.toFixed(3)}) bant içinde → ÜFE katsayısı kullanıldı`;
  }

  // Sınıf değişim tespiti
  const sinifDegisti = !!g.guncelYapiSinifi && g.guncelYapiSinifi !== g.yapiSinifi;
  const sinifDegisimAciklama = sinifDegisti
    ? `Ruhsattaki sınıf: ${g.yapiSinifi} · Yapı tipi+yükseklik analizi: ${g.guncelYapiSinifi}. Belge tutarı ${g.yapiSinifi} üzerinden, YMO ${g.guncelYapiSinifi} üzerinden hesaplandı.`
    : undefined;

  return {
    belgeTutari:        Math.round(belge),
    birimFiyatSozlesme: bfSoz,
    sozlesmeDonemi:     sozDon,
    ufeEndeksSozlesme:  ufeSoz,
    ufeEndeksBasvuru:   ufeBas,
    ufeKatsayi:         ufeKat,
    birimFiyatBasvuru:  bfBas,
    basvuruDonemi:      basDon,
    ymoSinifi,
    ymo,
    altSinir:           alt,
    ustSinir:           ust,
    kullanilanKatsayi:  kat,
    bantDurumu:         dur,
    bantAciklama:       aciklama,
    guncelTutar:        Math.round(belge * kat),
    sinifDegisti,
    sinifDegisimAciklama,
  };
}

// ─────────────────────────────────────────────
// BEDEL KARŞILIĞI (TAAHHÜT) HESAPLAMA
// Anahtar Teslim Götürü Bedel / Teklif Birim Fiyat / Karma
//
// Kat karşılığından FARKLAR:
//   ✗ 0.85 katsayısı yok — sözleşme bedeli direkt belge tutarıdır
//   ✗ YMO bant kontrolü yok — m² ve birim fiyat olmadığından hesaplanamaz
//   ✓ Güncelleme: sadece ÜFE(başvuru) / ÜFE(sözleşme)
//
// Kaynak: https://yfk.csb.gov.tr — İş Deneyim Belgesi Güncelleme modülü
// Doğrulama: Belge 152.202.022 ₺, sözleşme 07.06.2019
//   → Temel endeks 456.74, güncel 5029.76
//   → Katsayı 11.012304593423
//   → Güncel tutar 1.676.095.026 ₺ ✓
// ─────────────────────────────────────────────

export interface BedelKarsiligıGirdi {
  /** Sözleşmedeki tutar (TL) — m² ile ilgisi yok */
  sozlesmeBedeliTL:  number;
  /** Sözleşme tarihi (YYYY-MM-DD) */
  sozlesmeTarihi:    string;
  /** Başvuru tarihi — girilmezse Şubat 2026 kullanılır */
  basvuruTarihi?:    string;
  /** İskan tarihi — 5/15 yıl stratejisi için zorunlu */
  iskanTarihi?:      string;
  /** Ada/parsel referansı */
  ad?:               string;
}

export interface BedelKarsiligıSonuc {
  belgeTutari:        number;   // = sozlesmeBedeliTL (0.85 yok)
  temelEndeks:        number;   // sözleşme tarihi ÜFE
  guncelEndeks:       number;   // başvuru tarihi ÜFE
  katsayi:            number;   // guncelEndeks / temelEndeks
  guncelTutar:        number;   // belgeTutari × katsayi
  // YMO bant kontrolü YOKTUR — bu alanlar hesaplanamaz
  ymo:                null;
  bantDurumu:         "ufe";    // her zaman ÜFE katsayısı kullanılır
}

/**
 * Bedel karşılığı (taahhüt) iş deneyimi güncellemesi.
 *
 * Formül:
 *   belgeTutarı = sözleşme bedeli  (0.85 yok)
 *   katsayı     = ÜFE(başvuru) / ÜFE(sözleşme)
 *   güncel tutar = belgeTutarı × katsayı
 *
 * YMO ve bant kontrolü yapılmaz — m² ve birim fiyat gerekmez.
 */
export function bedelKarsiligıHesapla(g: BedelKarsiligıGirdi): BedelKarsiligıSonuc {
  const ufeSoz = ufeEndeksiBul(g.sozlesmeTarihi);
  const ufeBas = g.basvuruTarihi
    ? ufeEndeksiBul(g.basvuruTarihi)
    : REFERANS_UFE_SUBAT_2026;

  const katsayi     = ufeBas / ufeSoz;
  const guncelTutar = g.sozlesmeBedeliTL * katsayi;

  return {
    belgeTutari:  g.sozlesmeBedeliTL,
    temelEndeks:  ufeSoz,
    guncelEndeks: ufeBas,
    katsayi,
    guncelTutar:  Math.round(guncelTutar),
    ymo:          null,
    bantDurumu:   "ufe",
  };
}

// ─────────────────────────────────────────────
// STRATEJİ HESAPLAMA — BEDEL KARŞILIĞI
// Aynı 5/15 yıl kuralı geçerli
// ─────────────────────────────────────────────

export interface BedelYapiStrateji extends BedelKarsiligıGirdi {
  iskanTarihi: string;  // zorunlu
  guncelTutar: number;  // bedelKarsiligıHesapla() sonucu
}

/**
 * Bedel karşılığı işler için strateji hesabı.
 * stratejiHesapla() ile aynı mantık — sadece güncel tutar hesabı farklı.
 */
export function bedelStratejiHesapla(
  isler: BedelKarsiligıGirdi[],
  basvuruTarihi?: string,
  bugun: string = new Date().toISOString().slice(0, 10),
): StratejiSonuc {
  const yapilar: YapiStrateji[] = isler
    .filter(i => i.iskanTarihi)
    .map(i => {
      const sonuc = bedelKarsiligıHesapla({
        ...i,
        basvuruTarihi: i.basvuruTarihi ?? basvuruTarihi,
      });
      return {
        sozlesmeTarihi: i.sozlesmeTarihi,
        yapiSinifi:     "3B" as YapiSinifiKodu, // placeholder — bedelde kullanılmaz
        alanM2:         0,
        iskanTarihi:    i.iskanTarihi!,
        guncelTutar:    sonuc.guncelTutar,
        ad:             i.ad,
      };
    });

  return stratejiHesapla(yapilar, bugun);
}

// ─────────────────────────────────────────────
// KARIŞIK: KAT KARŞILIĞI + BEDEL KARŞILIĞI
// Müteahhidin iki tip işi bir arada olabilir
// ─────────────────────────────────────────────

export type IslemTipi = "kat_karsiligi" | "bedel_karsiligi";

export interface KarisikIs {
  tip:             IslemTipi;
  iskanTarihi:     string;
  sozlesmeTarihi:  string;
  ad?:             string;
  basvuruTarihi?:  string;
  // Kat karşılığı için:
  yapiSinifi?:     YapiSinifiKodu;
  alanM2?:         number;
  // Bedel karşılığı için:
  sozlesmeBedeliTL?: number;
}

/**
 * Karma hesaplama — her iş kendi tipine göre güncellenir,
 * sonra ortak strateji (5/15 yıl) uygulanır.
 */
export function karisikStratejiHesapla(
  isler: KarisikIs[],
  basvuruTarihi?: string,
  bugun: string = new Date().toISOString().slice(0, 10),
): StratejiSonuc {
  const yapilar: YapiStrateji[] = isler
    .filter(i => i.iskanTarihi)
    .map(i => {
      let guncelTutar = 0;

      if (i.tip === "kat_karsiligi" && i.yapiSinifi && i.alanM2) {
        const s = isDeneyimHesapla({
          sozlesmeTarihi: i.sozlesmeTarihi,
          yapiSinifi:     i.yapiSinifi,
          alanM2:         i.alanM2,
          basvuruTarihi:  i.basvuruTarihi ?? basvuruTarihi,
        });
        guncelTutar = s.guncelTutar;
      } else if (i.tip === "bedel_karsiligi" && i.sozlesmeBedeliTL) {
        const s = bedelKarsiligıHesapla({
          sozlesmeBedeliTL: i.sozlesmeBedeliTL,
          sozlesmeTarihi:   i.sozlesmeTarihi,
          basvuruTarihi:    i.basvuruTarihi ?? basvuruTarihi,
        });
        guncelTutar = s.guncelTutar;
      }

      return {
        sozlesmeTarihi: i.sozlesmeTarihi,
        yapiSinifi:     i.yapiSinifi ?? "3B" as YapiSinifiKodu,
        alanM2:         i.alanM2 ?? 0,
        iskanTarihi:    i.iskanTarihi,
        guncelTutar,
        ad:             i.ad,
      };
    });

  return stratejiHesapla(yapilar, bugun);
}

// ─────────────────────────────────────────────
// STRATEJİ HESAPLAMA
// İki yöntemi karşılaştırır, büyük olanı seçer
// ─────────────────────────────────────────────

export interface YapiStrateji extends IsDeneyimGirdi {
  /** İskan tarihi — 5/15 yıl filtresinde kullanılır */
  iskanTarihi: string;
  /** Yapıya ait hesaplanmış güncel tutar */
  guncelTutar: number;
  /** Yapının adı / referansı (ada-parsel vb.) */
  ad?: string;
}

export interface StratejiYontem1 {
  son5Yapilar:    YapiStrateji[];   // son 5 yılda iskanı olan yapılar
  toplam5:        number;           // brüt toplam
  enBuyuk5:       number;           // en büyük tek yapı
  sinir3x:        number;           // enBuyuk5 × 3
  siniraGirdi:    boolean;          // toplam > sinir3x mı?
  tutar:          number;           // min(toplam5, sinir3x)
}

export interface StratejiYontem2 {
  son15Yapilar:   YapiStrateji[];   // son 15 yılda iskanı olan yapılar
  enBuyuk15:      number;
  enBuyuk15Yapi?: string;           // en büyük yapının adı/referansı
  tutar:          number;           // enBuyuk15 × 2
}

export interface StratejiSonuc {
  yontem1:              StratejiYontem1;
  yontem2:              StratejiYontem2;
  tercihEdilenYontem:   1 | 2;
  sonucTutar:           number;
  grup:                 ReturnType<typeof grupHesapla>;
}

/**
 * İki stratejiyi birlikte hesaplar, büyük olanı seçer.
 *
 * Yöntem 1: Son 5 yıl toplamı, en büyük işin 3 katını geçemez
 * Yöntem 2: Son 15 yılın en büyük işi × 2
 *
 * Her iki yöntem de gösterilir; büyük olan tercih edilir.
 * 5 yıl dışındaki yapılar sadece Yöntem 2'de (en büyük tespiti için) kullanılır.
 *
 * @param yapilar  İşlenmemiş yapı listesi — her birinde iskanTarihi ve guncelTutar olmalı
 * @param bugun    Referans tarih (varsayılan: bugün)
 */
export function stratejiHesapla(
  yapilar: YapiStrateji[],
  bugun: string = new Date().toISOString().slice(0, 10),
): StratejiSonuc {
  const ref = new Date(bugun);

  function yilFark(tarih: string): number {
    return (ref.getTime() - new Date(tarih).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }

  const son5  = yapilar.filter(y => yilFark(y.iskanTarihi) <= 5);
  const son15 = yapilar.filter(y => yilFark(y.iskanTarihi) <= 15);

  // Yöntem 1
  const toplam5   = son5.reduce((s, y) => s + y.guncelTutar, 0);
  const enBuyuk5  = son5.length > 0 ? Math.max(...son5.map(y => y.guncelTutar)) : 0;
  const sinir3x   = enBuyuk5 * 3;
  const y1Tutar   = Math.min(toplam5, sinir3x);

  // Yöntem 2
  const enBuyuk15 = son15.length > 0 ? Math.max(...son15.map(y => y.guncelTutar)) : 0;
  const enBuyuk15Yapi = son15.find(y => y.guncelTutar === enBuyuk15);
  const y2Tutar   = enBuyuk15 * 2;

  const tercih: 1 | 2 = y2Tutar >= y1Tutar ? 2 : 1;
  const sonuc = Math.max(y1Tutar, y2Tutar);

  return {
    yontem1: {
      son5Yapilar:  son5,
      toplam5,
      enBuyuk5,
      sinir3x,
      siniraGirdi: toplam5 > sinir3x,
      tutar: y1Tutar,
    },
    yontem2: {
      son15Yapilar:    son15,
      enBuyuk15,
      enBuyuk15Yapi:   enBuyuk15Yapi?.ad,
      tutar: y2Tutar,
    },
    tercihEdilenYontem: tercih,
    sonucTutar: sonuc,
    grup: grupHesapla(sonuc),
  };
}

/**
 * Wizard'dan gelen experiences[] dizisini önce isDeneyimHesapla() ile günceller,
 * sonra stratejiHesapla() ile iki yöntemi karşılaştırır.
 *
 * Kullanım:
 *   const sonuc = wizardStratejisiHesapla(experiences, basvuruTarihi);
 *   // sonuc.tercihEdilenYontem → 1 veya 2
 *   // sonuc.sonucTutar         → grup tespitinde kullanılan tutar
 *   // sonuc.grup.grup          → "G1", "F", "E1" ...
 */
export function wizardStratejisiHesapla(
  experiences: Array<{
    contractDate:  string;
    occupancyDate: string;
    totalArea:     string;
    buildingClass: string;
    adaParsel?:    string;
  }>,
  basvuruTarihi?: string,
  bugun?: string,
): StratejiSonuc {
  const yapilar: YapiStrateji[] = experiences
    .filter(e => e.contractDate && e.totalArea && e.buildingClass && e.occupancyDate)
    .map(e => {
      const sonuc = isDeneyimHesapla({
        sozlesmeTarihi: e.contractDate,
        yapiSinifi:     sinifCevir(e.buildingClass),
        alanM2:         m2Parse(e.totalArea),
        basvuruTarihi,
      });
      return {
        sozlesmeTarihi: e.contractDate,
        iskanTarihi:    e.occupancyDate,
        yapiSinifi:     sinifCevir(e.buildingClass),
        alanM2:         m2Parse(e.totalArea),
        guncelTutar:    sonuc.guncelTutar,
        ad:             e.adaParsel || `${e.buildingClass} / ${e.totalArea}m²`,
      };
    });

  return stratejiHesapla(yapilar, bugun);
}
export function toplamIsDeneyimHesapla(
  girdiler: IsDeneyimGirdi[],
  basvuruTarihi?: string,
) {
  const yapilar = girdiler.map(g => ({
    ...g,
    sonuc: isDeneyimHesapla({ ...g, basvuruTarihi: g.basvuruTarihi ?? basvuruTarihi }),
  }));
  return {
    yapilar,
    toplamBelgeTutari: yapilar.reduce((s, y) => s + y.sonuc.belgeTutari,  0),
    toplamGuncelTutar: yapilar.reduce((s, y) => s + y.sonuc.guncelTutar, 0),
  };
}

export type GrupKodu = "A"|"B"|"B1"|"C"|"C1"|"D"|"D1"|"E"|"E1"|"F"|"F1"|"G"|"G1"|"H";

const ESIKLER: Array<{ kod: GrupKodu; minTL: number }> = [
  { kod: "A",  minTL: 2_476_500_000 }, { kod: "B",  minTL: 1_733_550_000 },
  { kod: "B1", minTL: 1_485_900_000 }, { kod: "C",  minTL: 1_238_250_000 },
  { kod: "C1", minTL: 1_031_875_000 }, { kod: "D",  minTL:   825_500_000 },
  { kod: "D1", minTL:   619_125_000 }, { kod: "E",  minTL:   412_750_000 },
  { kod: "E1", minTL:   247_650_000 }, { kod: "F",  minTL:   123_825_000 },
  { kod: "F1", minTL:   105_251_250 }, { kod: "G",  minTL:    86_677_500 },
  { kod: "G1", minTL:    61_912_500 }, { kod: "H",  minTL:            0 },
];

export function grupHesapla(toplamGuncel: number) {
  const uygun = ESIKLER.find(g => toplamGuncel >= g.minTL) ?? ESIKLER[ESIKLER.length - 1];
  const idx   = ESIKLER.findIndex(g => g.kod === uygun.kod);
  const ust   = idx > 0 ? ESIKLER[idx - 1] : null;
  return {
    grup:            uygun.kod,
    ustGrup:         ust?.kod ?? null,
    ustGrupIcinEkTL: ust ? Math.max(0, ust.minTL - toplamGuncel) : null,
  };
}

// ─────────────────────────────────────────────
// WIZARD ENTEGRASYONU
// ─────────────────────────────────────────────
export function sinifCevir(s: string): YapiSinifiKodu {
  return s.replace("III.", "3").replace("IV.", "4").replace("V.", "5").replace(".", "") as YapiSinifiKodu;
}

export function m2Parse(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

export function wizardDeneyimHesapla(
  experiences: Array<{ contractDate: string; totalArea: string; buildingClass: string }>,
  basvuruTarihi?: string,
) {
  const girdiler: IsDeneyimGirdi[] = experiences
    .filter(e => e.contractDate && e.totalArea && e.buildingClass)
    .map(e => ({
      sozlesmeTarihi: e.contractDate,
      yapiSinifi:     sinifCevir(e.buildingClass),
      alanM2:         m2Parse(e.totalArea),
      basvuruTarihi,
    }));
  const toplam = toplamIsDeneyimHesapla(girdiler, basvuruTarihi);
  const grup   = grupHesapla(toplam.toplamGuncelTutar);
  return { toplam, grup };
}

export function tl(n: number): string {
  return Math.round(n).toLocaleString("tr-TR") + " ₺";
}

// ─────────────────────────────────────────────
// DİPLOMA HESAPLAMA
// İnşaat Mühendisliği veya Mimarlık diploması
//
// FORMÜL:
//   Süre = Başvuru tarihi − Mezuniyet tarihi (yıl+ay bazında)
//   Tutar = Toplam ay × (yıllık değer / 12)
//
// GRUP EŞİKLERİ:
//   G1 → en az 9 tam yıl (108 ay)
//   G  → en az 13 tam yıl (156 ay)
//   G ve G1 için şahsa ait ek iş deneyimi ZORUNLU DEĞİL
//   G'den yukarısı diploma yoluyla alınamaz
//
// ÖNEMLİ KURALLAR:
//   - Diploma + kat karşılığı veya diploma + taahhüt TOPLANAMAZ — biri seçilir
//   - Farklı iş deneyimleri toplanamaz
//   - Yıllık değer her yıl resmi olarak güncellenir
//
// 2026 yıllık değeri: 6.879.166,67 ₺
// Doğrulama: 9 yıl × 6.879.166,67 = 61.912.500 ₺ = G1 eşiği ✓
//            13 yıl × 6.879.166,67 = 89.429.167 ₺ > G eşiği (86.677.500) ✓
// ─────────────────────────────────────────────

/** Yıllık diploma değeri — her yıl güncellenir */
export const DIPLOMA_YILLIK_DEGER: Record<string, number> = {
  "2026": 6_879_166.67,
  // Önceki yıllar eklenecek
};

/** Güncel yıllık diploma değerini döndürür */
export function diplomaYillikDegerAl(yil?: number): number {
  const y = String(yil ?? new Date().getFullYear());
  return DIPLOMA_YILLIK_DEGER[y] ?? DIPLOMA_YILLIK_DEGER["2026"];
}

// ─────────────────────────────────────────────
// DİPLOMA KULLANIM KISITLARI
// Wizard'da kullanıcıya gösterilecek uyarı metinleri
// ─────────────────────────────────────────────

export type DiplomaKullanimTipi =
  | "sahis"          // Şahıs adına başvuru — kısıt yok
  | "limited_as"     // Ltd/AŞ bünyesinde — %51 + 5 yıl şartı
  | "is_deneyimi";   // Şahsa ait taahhüt/kat karşılığı sunulacaksa — %51 + 1 yıl şartı

export interface DiplomaKisitSonucu {
  uygun: boolean;
  uyari: string;       // Kullanıcıya gösterilecek sade metin
  teknikNot: string;   // Admin için teknik açıklama
}

/**
 * Diploma kullanım kısıtlarını kontrol eder ve
 * kullanıcıya gösterilecek sade uyarı metnini döndürür.
 */
export function diplomaKisitKontrol(
  kullanimTipi: DiplomaKullanimTipi,
  params?: {
    /** Şirketteki hisse oranı (0–100) */
    hisseOrani?: number;
    /** %51'in geçerli olduğu başlangıç tarihi */
    hisseBaslangicTarihi?: string;
    /** Başvuru tarihi */
    basvuruTarihi?: string;
  },
): DiplomaKisitSonucu {

  // Şahıs: hiçbir kısıt yok
  if (kullanimTipi === "sahis") {
    return {
      uygun: true,
      uyari: "",
      teknikNot: "Şahıs başvurusunda diploma kullanımında kısıt yoktur.",
    };
  }

  // Şahsa ait iş deneyimi (taahhüt/kat karşılığı): %51 + 1 yıl
  if (kullanimTipi === "is_deneyimi") {
    return {
      uygun: false, // her zaman uyarı göster, kullanıcı onaylamalı
      uyari: [
        "Şahsınıza ait iş deneyimini (taahhüt veya kat karşılığı) sunabilmeniz için,",
        "ilgili şirkette %51 veya üzeri hissedarı olmanız ve",
        "bu ortaklığın kesintisiz en az 1 yıl sürmesi gerekmektedir.",
      ].join(" "),
      teknikNot: "%51 hisse + kesintisiz 1 yıl şartı (iş deneyimi kullanımı için).",
    };
  }

  // Ltd / AŞ bünyesinde diploma kullanımı: %51 + 5 yıl
  if (kullanimTipi === "limited_as") {
    // Hisse ve süre kontrolü
    const hisse = params?.hisseOrani ?? 0;
    const bas   = params?.hisseBaslangicTarihi;
    const bvr   = params?.basvuruTarihi ?? new Date().toISOString().slice(0, 10);

    if (hisse < 51) {
      return {
        uygun: false,
        uyari: [
          "Diplomanızı bu şirkette kullanabilmeniz için",
          "şirkette %51 veya üzeri hissedar olmanız gerekmektedir.",
          `Mevcut hisseniz: %${hisse}.`,
        ].join(" "),
        teknikNot: `Hisse oranı yetersiz: %${hisse} < %51.`,
      };
    }

    if (!bas) {
      return {
        uygun: false,
        uyari: [
          "Diplomanızı bu şirkette kullanabilmeniz için",
          "%51 veya üzeri hissedarlığınızın başladığı tarihi belirtmeniz gerekmektedir.",
        ].join(" "),
        teknikNot: "Hisse başlangıç tarihi girilmedi.",
      };
    }

    // 5 yıl kontrolü — yıl ve ay bazında
    const basD = new Date(bas);
    const bvrD = new Date(bvr);
    let yilFark = bvrD.getFullYear() - basD.getFullYear();
    let ayFark  = bvrD.getMonth()    - basD.getMonth();
    if (ayFark < 0) { yilFark -= 1; ayFark += 12; }
    const toplamAy = yilFark * 12 + ayFark;
    const gerekliAy = 5 * 12; // 60 ay

    if (toplamAy < gerekliAy) {
      const eksikAy = gerekliAy - toplamAy;
      const eksikYil = Math.floor(eksikAy / 12);
      const eksikAyKalan = eksikAy % 12;
      const eksikStr = eksikYil > 0
        ? `${eksikYil} yıl ${eksikAyKalan > 0 ? eksikAyKalan + " ay" : ""}`
        : `${eksikAyKalan} ay`;
      return {
        uygun: false,
        uyari: [
          "Diplomanızı bu şirkette kullanabilmeniz için",
          "%51 veya üzeri hissedarlığınızın kesintisiz en az 5 yıl sürmesi gerekmektedir.",
          `Tek ortak olsanız da bu süre şartı geçerlidir.`,
          `Mevcut süreniz: ${yilFark} yıl ${ayFark} ay — ${eksikStr} daha gerekmektedir.`,
        ].join(" "),
        teknikNot: `${toplamAy} ay geçmiş, ${gerekliAy} ay gerekli. Eksik: ${eksikAy} ay.`,
      };
    }

    return {
      uygun: true,
      uyari: "",
      teknikNot: `%${hisse} hisse, ${yilFark} yıl ${ayFark} ay — şart karşılanıyor.`,
    };
  }

  return { uygun: false, uyari: "Bilinmeyen kullanım tipi.", teknikNot: "" };
}

export interface DiplomaGirdi {
  /** Diploma türü */
  bolum: "insaat_muhendisligi" | "mimarlik";
  /** Mezuniyet tarihi (YYYY-MM-DD) */
  mezuniyetTarihi: string;
  /** Başvuru tarihi (YYYY-MM-DD) — girilmezse bugün */
  basvuruTarihi?: string;
  /**
   * G ve üstü için şahsa ait iş deneyimi var mı?
   * (ruhsat, iskan veya şantiye şefliği — tutar önemsiz)
   * G1 için bu alan zorunlu değil.
   */
  sahsaAitIsDeneyimiVar?: boolean;
}

export interface DiplomaGrupSonucu {
  grup: "G" | "G1" | null;
  aciklama: string;
  sahsaAitIsDeneyimiGerekli: boolean;
}

export interface DiplomaSonuc {
  // Süre — mevzuat: yıl, AY, GÜN hesabı
  yilFark:           number;
  ayFark:            number;
  gunFark:           number;   // gün hassasiyeti
  toplamAy:          number;   // tam ay sayısı (gün kesirleri sayılmaz)

  // 15 yıl kuralı
  onbesYilAsimi:     boolean;  // 15 yılı aşıyor mu?
  sayilanAy:         number;   // iş deneyimi yoksa max 180 ay

  // Tutar
  yillikDeger:       number;
  aylikDeger:        number;
  tutar:             number;

  // Grup
  grupSonucu:        DiplomaGrupSonucu;
  secimNotu:         string;
}

/**
 * Diploma iş deneyimi hesaplar.
 * Mevzuat: Mezuniyet tarihinden başvuru tarihine kadar yıl, AY, GÜN hesabı yapılır.
 *
 * 15 YIL KURALI (Madde 1-b-ii):
 *   15 yıldan fazlasının değerlendirilebilmesi için şahsa ait iş deneyim belgesi zorunlu.
 *   G grubu eşiği 13 yıl olduğundan G için bu kural pratikte devreye girmez.
 *   Ancak 15+ yıl mezun birinin ekstra süresi iş deneyimi olmadan sayılmaz.
 *
 * @param girdi                   Diploma bilgileri
 * @param sahsaAitIsDeneyimiVar   Şahsa ait iş deneyim belgesi var mı?
 */
export function diplomaHesapla(
  girdi: DiplomaGirdi,
  sahsaAitIsDeneyimiVar: boolean = false,
): DiplomaSonuc {
  const mez = new Date(girdi.mezuniyetTarihi);
  const bas = girdi.basvuruTarihi ? new Date(girdi.basvuruTarihi) : new Date();

  // Yıl, ay, gün farkı
  let yilFark = bas.getFullYear() - mez.getFullYear();
  let ayFark  = bas.getMonth()    - mez.getMonth();
  let gunFark = bas.getDate()     - mez.getDate();

  if (gunFark < 0) {
    ayFark--;
    const oncekiAySonGun = new Date(bas.getFullYear(), bas.getMonth(), 0).getDate();
    gunFark += oncekiAySonGun;
  }
  if (ayFark < 0) { yilFark--; ayFark += 12; }

  const toplamAy = yilFark * 12 + ayFark; // tam aylar (günler sayılmaz)

  // 15 yıl aşımı — iş deneyimi yoksa 180 ay ile sınırla
  const onbesYilAsimi = toplamAy > 180;
  const sayilanAy = onbesYilAsimi && !sahsaAitIsDeneyimiVar ? 180 : toplamAy;

  const yillikDeger = diplomaYillikDegerAl(bas.getFullYear());
  const aylikDeger  = yillikDeger / 12;
  const tutar       = sayilanAy * aylikDeger;

  let grupSonucu: DiplomaGrupSonucu;
  if (sayilanAy >= 13 * 12) {
    grupSonucu = {
      grup: "G",
      aciklama: `${yilFark} yıl ${ayFark} ay ${gunFark} gün ≥ 13 yıl → G grubu`,
      sahsaAitIsDeneyimiGerekli: false,
    };
  } else if (sayilanAy >= 9 * 12) {
    grupSonucu = {
      grup: "G1",
      aciklama: `${yilFark} yıl ${ayFark} ay ${gunFark} gün ≥ 9 yıl → G1 grubu`,
      sahsaAitIsDeneyimiGerekli: false,
    };
  } else {
    const eksik = 9 * 12 - sayilanAy;
    grupSonucu = {
      grup: null,
      aciklama: `${yilFark} yıl ${ayFark} ay ${gunFark} gün — G1 için ${eksik} ay eksik`,
      sahsaAitIsDeneyimiGerekli: false,
    };
  }

  const notlar = [
    "Diploma iş deneyimi tek başına kullanılır — kat karşılığı veya taahhüt işleriyle toplanamaz.",
    "Farklı iş deneyimleri toplanamaz — biri seçilir.",
  ];
  if (onbesYilAsimi && !sahsaAitIsDeneyimiVar) {
    notlar.push(
      `Mezuniyetten bu yana ${yilFark} yıl ${ayFark} ay geçmiş. ` +
      `15 yılı aşan süre değerlendirmeye alınabilmesi için şahsa ait iş deneyim belgesi zorunludur. ` +
      `Hesap 15 yıl (180 ay) üzerinden yapıldı.`
    );
  }

  return {
    yilFark, ayFark, gunFark,
    toplamAy, onbesYilAsimi, sayilanAy,
    yillikDeger, aylikDeger,
    tutar: Math.round(tutar * 100) / 100,
    grupSonucu,
    secimNotu: notlar.join(" "),
  };
}

/**
 * Diploma ile hangi grup alınabileceğini özetler.
 * Dashboard'da ve wizard'da anlık gösterim için.
 *
 * Kalan süre bilgisi:
 *   - Henüz hiç grup yoksa: G1 için kaç gün/ay kaldı
 *   - G1'deyse: G için kaç gün/ay kaldı
 *   - G'deyse: diploma yoluyla daha yüksek grup alınamaz
 */
export function diplomaOzet(
  girdi: DiplomaGirdi,
  sahsaAitIsDeneyimiVar: boolean = false,
): {
  uygun:       boolean;
  grup:        "G" | "G1" | null;
  tutar:       number;
  mesaj:       string;
  kalanSure:   { yil: number; ay: number; gun: number; hedefGrup: "G1" | "G" } | null;
  kalanMesaj:  string;
  ekBilgi?:    string;
} {
  const sonuc = diplomaHesapla(girdi, sahsaAitIsDeneyimiVar);
  const { grupSonucu, tutar, yilFark, ayFark, gunFark, sayilanAy } = sonuc;

  // Hedef ay eşikleri
  const G1_ESIK = 108; // 9 yıl
  const G_ESIK  = 156; // 13 yıl

  /**
   * Mezuniyet tarihinden hedef aya ulaşmak için gereken tarihi hesapla.
   * Hedef ay sayısını mezuniyet tarihine ekle → hedef tarih.
   * Hedef tarih - bugün = kalan gün/ay/yıl.
   */
  function kalanSureHesapla(hedefAy: number): { yil: number; ay: number; gun: number } | null {
    const mez = new Date(girdi.mezuniyetTarihi);
    // Hedef tarihi mezuniyete hedefAy ekleyerek bul
    const hedefTarih = new Date(mez);
    hedefTarih.setMonth(hedefTarih.getMonth() + hedefAy);

    const bugun = girdi.basvuruTarihi ? new Date(girdi.basvuruTarihi) : new Date();
    if (hedefTarih <= bugun) return null; // zaten geçti

    let yil = hedefTarih.getFullYear() - bugun.getFullYear();
    let ay  = hedefTarih.getMonth()    - bugun.getMonth();
    let gun = hedefTarih.getDate()     - bugun.getDate();

    if (gun < 0) {
      ay--;
      const oncekiAySonGun = new Date(bugun.getFullYear(), bugun.getMonth(), 0).getDate();
      gun += oncekiAySonGun;
    }
    if (ay < 0) { yil--; ay += 12; }

    return { yil, ay, gun };
  }

  function sureMesaji(k: { yil: number; ay: number; gun: number }): string {
    const parcalar = [];
    if (k.yil > 0) parcalar.push(`${k.yil} yıl`);
    if (k.ay  > 0) parcalar.push(`${k.ay} ay`);
    if (k.gun > 0) parcalar.push(`${k.gun} gün`);
    return parcalar.join(" ");
  }

  // Henüz hiç grup yok → G1'e ne kadar kaldı
  if (!grupSonucu.grup) {
    const kalan = kalanSureHesapla(G1_ESIK);
    const kalanSure = kalan ? { ...kalan, hedefGrup: "G1" as const } : null;
    const kalanMesaj = kalan
      ? `${sureMesaji(kalan)} sonra G1 grubunu alabilirsiniz.`
      : "G1 için gerekli süre dolmuş — başvurabilirsiniz.";

    const eksikAy = G1_ESIK - sayilanAy;
    const eksikYil = Math.floor(eksikAy / 12);
    const eksikAyKalan = eksikAy % 12;

    return {
      uygun: false,
      grup: null,
      tutar,
      mesaj: `G1 için ${eksikYil > 0 ? eksikYil + " yıl " : ""}${eksikAyKalan} ay ${gunFark} gün daha gerekiyor.`,
      kalanSure,
      kalanMesaj,
    };
  }

  // G1'deyse → G'ye ne kadar kaldı
  if (grupSonucu.grup === "G1") {
    const kalan = kalanSureHesapla(G_ESIK);
    const kalanSure = kalan ? { ...kalan, hedefGrup: "G" as const } : null;
    const kalanMesaj = kalan
      ? `${sureMesaji(kalan)} sonra G grubuna yükselebilirsiniz.`
      : "G grubu için gerekli süre dolmuş — başvurabilirsiniz.";

    return {
      uygun: true,
      grup: "G1",
      tutar,
      mesaj: `${yilFark} yıl ${ayFark} ay ${gunFark} gün → G1 grubu — ${tl(tutar)}`,
      kalanSure,
      kalanMesaj,
    };
  }

  // G'deyse → diploma yoluyla daha yüksek grup yok
  return {
    uygun: true,
    grup: "G",
    tutar,
    mesaj: `${yilFark} yıl ${ayFark} ay ${gunFark} gün → G grubu — ${tl(tutar)}`,
    kalanSure: null,
    kalanMesaj: "",
    ekBilgi: "G grubundan daha yüksek bir gruba yalnızca diploma ile başvurulamaz. Üst gruplar için iş deneyim belgesi sunulması gerekmektedir.",
  };
}

// ─────────────────────────────────────────────
// MEVZUAT NOTLARI — BAŞVURUDA DİKKAT EDİLECEK HUSUSLAR
// Kaynak: Yönetmelik Madde 1 — Başvuruda dikkat edilecek hususlar
// ─────────────────────────────────────────────

/**
 * BENZER İŞ GRUBU KISITI (Madde 1-a):
 * Sadece Yapım İşlerinde Benzer İş Grupları Listesinin
 * "(B) Üst Yapı (Bina) İşleri" kapsamındaki işler iş deneyimi olarak kabul edilir.
 *
 * Wizard'da ayrıca sorulmaz — yapı tipi seçimi (konut, işyeri, hastane vb.)
 * zaten bu kapsamı otomatik karşılar. Wizard'daki tüm yapı tipleri (B) grubundandır;
 * altyapı/yol/köprü seçenek olarak zaten yer almaz.
 */
export const BENZER_IS_GRUBU = "(B) Üst Yapı (Bina) İşleri";

/**
 * YAPI SAHİBİ = MÜTEAHHİT DURUMU (Madde 1-c):
 * Yapı sahibinin aynı zamanda yapı müteahhitliğini üstlendiği durumlarda,
 * noter onaylı yapı ruhsatı VE yapı kullanma izin belgesi iş deneyimi olarak kabul edilir.
 * Wizard'da iş deneyimi türü sorusuna bu seçenek eklenmeli:
 *   "İş deneyim belgesi mi / Yapı ruhsatı + iskan belgesi mi?"
 */
export const YAPI_SAHIBI_MUTEAHHIT_NOTU =
  "Yapı sahibi = müteahhit durumunda noter onaylı ruhsat + iskan belgesi iş deneyimi sayılır.";

/**
 * İŞ DENEYİM BELGESİ KULLANDIRMA YASAĞI:
 * - Belge, kullanıldığı yetki belge numarasının belge grubu geçerlik süresi
 *   sonuna kadar başka bir gerçek veya tüzel kişiye kullandırılamaz.
 * - Tüzel kişi tarafından sunulan iş deneyim belgesi, tüzel kişiliğin
 *   yarısından fazla hissesine sahip ortağına aitse:
 *   belge grubu geçerlik süresi boyunca %51+ hisse oranı korunmalıdır.
 * Admin panelinde uyarı olarak gösterilmeli.
 */
export const BELGE_KULLANILAMAZ_UYARISI = [
  "İş deneyim belgesi, yetki belgesi geçerlik süresi boyunca başka kişi/şirkete kullandırılamaz.",
  "Tüzel kişi adına sunulan belgede %51+ ortağa ait belge varsa: geçerlik süresi boyunca bu oran korunmalıdır.",
];

/**
 * BAŞVURUDA GEREKLİ KONTROL LİSTESİ
 * Admin ve müşteri için başvuru öncesi checklist
 */
export const BASVURU_KONTROL_LISTESI = [
  { id: "guncelleme",      metin: "İş deneyim tutarları başvuru tarihine göre güncellendi mi?", zorunlu: true  },
  { id: "bes_on_bes",      metin: "5 yıl / 15 yıl strateji hesabı yapıldı mı?",                zorunlu: true  },
  { id: "diploma_15",      metin: "Diploma 15+ yılsa şahsa ait iş deneyimi var mı?",            zorunlu: false },
  { id: "tuzel_51",        metin: "Tüzel kişide %51+ hisse belgesi hazır mı?",                  zorunlu: false },
  { id: "mali_yeterlilik", metin: "F1+ hedef grup için bilanço şartı karşılandı mı?",           zorunlu: false },
  { id: "kullanilamaz",    metin: "Başkasında kullanılan belge var mı kontrol edildi mi?",       zorunlu: true  },
];
