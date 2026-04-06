// ══════════════════════════════════════════════════════════════════
// hesaplama-motor.ts — Müteahhitlik İş Deneyimi Hesaplama Motoru
// Kaynak: 2026 Yılı Yapı Yaklaşık Birim Maliyetleri Tebliği (3 Şubat 2026)
// ══════════════════════════════════════════════════════════════════

// ─── Yİ-ÜFE Endeksleri ───────────────────────────────────────────
export const UFE: Record<string, number[]> = {
  "2026":[4910.53,5029.76],
  "2025":[3861.33,3943.01,4017.30,4128.19,4230.69,4334.94,4409.73,4518.89,4632.89,4708.20,4747.63,4783.04],
  "2024":[3035.59,3149.03,3252.79,3369.98,3435.96,3483.25,3550.88,3610.51,3659.84,3707.10,3731.43,3746.52],
  "2023":[2105.17,2138.04,2147.44,2164.94,2179.02,2320.72,2511.75,2659.60,2749.98,2803.29,2882.04,2915.02],
  "2022":[1129.03,1210.60,1321.90,1423.27,1548.01,1652.75,1738.21,1780.05,1865.09,2011.13,2026.08,2021.19],
  "2021":[583.38,590.52,614.93,641.63,666.79,693.54,710.61,730.28,741.58,780.45,858.43,1022.25],
  "2020":[462.42,464.64,468.69,474.69,482.02,485.37,490.33,501.85,515.13,533.44,555.18,568.27],
  "2019":[424.86,425.26,431.98,444.85,456.74,457.16,452.63,449.96,450.55,451.31,450.97,454.08],
  "2018":[319.60,328.17,333.21,341.88,354.85,365.60,372.06,396.62,439.78,443.78,432.55,422.94],
  "2017":[284.99,288.59,291.58,293.79,295.31,295.52,297.65,300.18,300.90,306.04,312.21,316.48],
  "2016":[250.67,250.16,251.17,252.47,256.21,257.27,257.81,258.01,258.77,260.94,266.16,274.09],
  "2015":[236.61,239.46,241.97,245.42,248.15,248.78,247.99,250.43,254.25,253.74,250.13,249.31],
  "2014":[229.10,232.27,233.98,234.18,232.96,233.09,234.79,235.78,237.79,239.97,237.65,235.84],
  "2013":[206.91,206.65,208.33,207.27,209.34,212.39,214.50,214.59,216.48,217.97,219.31,221.74],
  "2012":[203.10,202.91,203.64,203.81,204.89,201.83,201.20,201.71,203.79,204.15,207.54,207.29],
  "2011":[182.75,185.90,188.17,189.32,189.61,189.62,189.57,192.91,195.89,199.03,200.32,202.33],
  "2010":[164.94,167.68,170.94,174.96,172.95,172.08,171.81,173.79,174.67,176.78,176.23,178.54],
};

// ─── 2026 Tebliği Birim Maliyetleri (TL/m²) ──────────────────────
export const BM_2026: Record<string, number> = {
  "I.A":    2_600,
  "I.B":    3_900,
  "I.C":    4_200,
  "I.D":    4_800,
  "II.A":   8_100,
  "II.B":  12_500,
  "II.C":  15_100,
  "III.A": 19_800,
  "III.B": 21_050,
  "III.C": 23_400,
  "IV.A":  26_450,
  "IV.B":  33_900,
  "IV.C":  40_500,
  "V.A":   42_350,
  "V.B":   43_850,
  "V.C":   48_750,
  "V.D":   53_500,
  "V.E":  103_500,
};

// ─── Geçmiş yıl birim maliyetleri ────────────────────────────────
export const BM_GECMIS: Record<string, Record<string, number>> = {
  "2025":{"III.B":18200,"III.C":19150,"IV.A":21500,"IV.B":27500,"IV.C":32600,"V.A":34500,"V.B":35600,"V.C":39500,"V.D":43400},
  "2024":{"III.B":14400,"III.C":15100,"IV.A":15600,"IV.B":18200,"IV.C":21500,"V.A":22750},
  "2023-2":{"III.B":9600,"III.C":9600,"IV.A":10100,"IV.B":11900,"V.A":15200},
  "2023-1":{"III.B":6350,"III.C":6350,"IV.A":6850,"IV.B":7800,"V.A":10400},
  "2022-3":{"III.B":5250,"III.C":5250},
  "2022-2":{"III.B":3850,"III.C":3850},
  "2022-1":{"III.B":2800,"III.C":2800,"IV.A":3050,"IV.B":3450,"V.A":4500},
  "2021":{"III.B":1450,"III.C":1450,"IV.A":1550,"IV.B":1800,"V.A":2350},
  "2020":{"III.B":1130,"III.C":1130,"IV.A":1210,"IV.B":1400,"V.A":1850},
  "2019":{"III.B":980,"IV.A":1070,"IV.B":1230,"V.A":1630},
  "2018":{"III.B":800,"IV.A":860,"IV.B":980,"V.A":1300},
  "2017":{"III.B":838,"IV.A":880,"IV.B":1005,"V.A":1340},
  "2016":{"III.B":630,"IV.A":680,"IV.B":775,"V.A":1030},
  "2015":{"III.B":565,"IV.A":610,"IV.B":695,"V.A":925},
  "2014":{"III.B":650,"IV.A":700,"IV.B":800,"V.A":1150},
  "2013":{"III.B":460,"IV.A":500,"IV.B":570,"V.A":755},
  "2012":{"III.B":435,"IV.A":470,"IV.B":535,"V.A":710},
  "2011":{"III.B":400,"IV.A":435,"IV.B":495,"V.A":655},
  "2010":{"III.B":360,"IV.A":400,"IV.B":450,"V.A":600},
};

// ─── 2026 Tebliğine göre yapı sınıfı ─────────────────────────────
// Kullanım tipi + yükseklik + detay bilgi (otel yıldızı, hastane yatak vb.)
// yapiTipi: "konut" | "konut_ticari" | "ticari" | "sanayi" | "otel" | "hastane" | "avm" | "diger"

export interface SinifGirdisi {
  yukseklikM: number;
  yapiTipi: string;
  // Özel yapı detayları
  otelYildiz?: 1|2|3|4|5;           // otel için
  hastaneYatak?: number;             // hastane için
  sanayiDosemeYuku?: number;         // sanayi için (kg/m²)
  avmAlanM2?: number;                // AVM için
}

export interface SinifOneri {
  sinif: string;
  sebep: string;
}

export function guncelSinif2026(girdi: SinifGirdisi): SinifOneri {
  const { yukseklikM: h, yapiTipi } = girdi;

  // ── Konut ──────────────────────────────────────────────────────
  // Tebliğ III.B-12, III.C-8, IV.A-12, IV.B-9
  if (yapiTipi === "konut" || yapiTipi === "konut_ticari") {
    // Konut+Ticari: nota göre her zaman konut eşiği kullanılır
    if (h <= 21.50) return { sinif: "III.B", sebep: `Konut, ${h}m ≤ 21.50m → III.B` };
    if (h <= 30.50) return { sinif: "III.C", sebep: `Konut, ${h}m → 21.50–30.50m arası → III.C` };
    if (h <= 51.50) return { sinif: "IV.A",  sebep: `Konut, ${h}m → 30.50–51.50m arası → IV.A` };
    return { sinif: "IV.B", sebep: `Konut, ${h}m > 51.50m → IV.B` };
  }

  // ── Ticari / İş merkezi ────────────────────────────────────────
  // Tebliğ III.B-9, III.C-6, IV.A-9, IV.B-7, V.A-3
  if (yapiTipi === "ticari") {
    if (h <= 9.50)  return { sinif: "III.B", sebep: `Ticari, ${h}m ≤ 9.50m (3 kat) → III.B` };
    if (h <= 21.50) return { sinif: "III.C", sebep: `Ticari, ${h}m → 9.50–21.50m arası → III.C` };
    if (h <= 30.50) return { sinif: "IV.A",  sebep: `Ticari, ${h}m → 21.50–30.50m arası → IV.A` };
    if (h <= 51.50) return { sinif: "IV.B",  sebep: `Ticari, ${h}m → 30.50–51.50m arası → IV.B` };
    return { sinif: "V.A", sebep: `Ticari, ${h}m > 51.50m → V.A` };
  }

  // ── Sanayi ─────────────────────────────────────────────────────
  // Tebliğ II.C-5 (0-500), III.B-16 (501-3000), IV.A-17 (3001+)
  if (yapiTipi === "sanayi") {
    const yuk = girdi.sanayiDosemeYuku || 0;
    if (yuk <= 500)  return { sinif: "II.C",  sebep: `Sanayi, döşeme yükü ${yuk} kg/m² ≤ 500 → II.C` };
    if (yuk <= 3000) return { sinif: "III.B", sebep: `Sanayi, döşeme yükü ${yuk} kg/m² → 501–3000 → III.B` };
    return { sinif: "IV.A", sebep: `Sanayi, döşeme yükü ${yuk} kg/m² > 3000 → IV.A` };
  }

  // ── Otel ───────────────────────────────────────────────────────
  // Tebliğ IV.A-14 (1-2*), IV.C-12 (3*), V.B-5 (4*), V.D-3 (5*)
  if (yapiTipi === "otel") {
    const yildiz = girdi.otelYildiz || 1;
    if (yildiz <= 2) return { sinif: "IV.A", sebep: `Otel, ${yildiz} yıldız → IV.A` };
    if (yildiz === 3) return { sinif: "IV.C", sebep: `Otel, 3 yıldız → IV.C` };
    if (yildiz === 4) return { sinif: "V.B",  sebep: `Otel, 4 yıldız → V.B` };
    return { sinif: "V.D", sebep: `Otel, 5 yıldız → V.D` };
  }

  // ── Hastane ────────────────────────────────────────────────────
  // Tebliğ IV.C-6 (<200), V.B-2 (200-400), V.C-2 (400+)
  if (yapiTipi === "hastane") {
    const yatak = girdi.hastaneYatak || 0;
    if (yatak < 200)  return { sinif: "IV.C", sebep: `Hastane, ${yatak} yatak < 200 → IV.C` };
    if (yatak <= 400) return { sinif: "V.B",  sebep: `Hastane, ${yatak} yatak → 200–400 arası → V.B` };
    return { sinif: "V.C", sebep: `Hastane, ${yatak} yatak > 400 → V.C` };
  }

  // ── Alışveriş Merkezi ──────────────────────────────────────────
  // Tebliğ IV.A-3 (<25000 m²), IV.C-2 (≥25000 m²)
  if (yapiTipi === "avm") {
    const alan = girdi.avmAlanM2 || 0;
    if (alan < 25000) return { sinif: "IV.A", sebep: `AVM, ${alan.toLocaleString("tr-TR")} m² < 25.000 m² → IV.A` };
    return { sinif: "IV.C", sebep: `AVM, ${alan.toLocaleString("tr-TR")} m² ≥ 25.000 m² → IV.C` };
  }

  // ── Diğer ──────────────────────────────────────────────────────
  return { sinif: "diger", sebep: "Özel yapı — admin manuel sınıf belirlemeli" };
}

// Geriye dönük uyumluluk için basit string döndüren versiyon
export function guncelSinifStr(yukseklikM: number, yapiTipi: string): string {
  return guncelSinif2026({ yukseklikM, yapiTipi }).sinif;
}

// ─── Sınıf farkı tespiti (admin için) ────────────────────────────
export interface SinifUyari {
  ruhsatSinifi: string;
  guncel2026: string;
  farkVar: boolean;
  aciklama: string;
  oneri: SinifOneri;
}

export function sinifUyariHesapla(
  ruhsatSinifi: string,
  girdi: SinifGirdisi
): SinifUyari {
  const oneri = guncelSinif2026(girdi);
  const farkVar = oneri.sinif !== "diger" && oneri.sinif !== ruhsatSinifi;
  return {
    ruhsatSinifi,
    guncel2026: oneri.sinif,
    farkVar,
    aciklama: farkVar
      ? `Ruhsatta ${ruhsatSinifi} görünüyor. ${oneri.sebep}. Belge tutarı ${ruhsatSinifi} sınıfından, YMO hesabı ${oneri.sinif} sınıfından yapılacak.`
      : oneri.sinif === "diger"
        ? "Özel yapı tipi — admin sınıfı manuel belirlemeli."
        : `Ruhsat sınıfı (${ruhsatSinifi}) 2026 tebliğiyle örtüşüyor. ${oneri.sebep}`,
    oneri,
  };
}

// ─── Grup eşikleri (EK-4, 2026) ──────────────────────────────────
export const GRUP_ESIKLER: Array<{ grup: string; min: number }> = [
  { grup: "A",  min: 2_476_500_000 },
  { grup: "B",  min: 1_733_550_000 },
  { grup: "B1", min: 1_485_900_000 },
  { grup: "C",  min: 1_238_250_000 },
  { grup: "C1", min: 1_031_875_000 },
  { grup: "D",  min:   825_500_000 },
  { grup: "D1", min:   619_125_000 },
  { grup: "E",  min:   412_750_000 },
  { grup: "E1", min:   247_650_000 },
  { grup: "F",  min:   123_825_000 },
  { grup: "F1", min:   105_251_250 },
  { grup: "G",  min:    86_677_500 },
  { grup: "G1", min:    61_912_500 },
  { grup: "H",  min:             0 },
];

export function grupBul(tl: number): string {
  for (const g of GRUP_ESIKLER) {
    if (tl >= g.min) return g.grup;
  }
  return "H";
}

export function birUstGrup(grup: string): { grup: string; min: number } | null {
  const idx = GRUP_ESIKLER.findIndex(g => g.grup === grup);
  if (idx <= 0) return null;
  return GRUP_ESIKLER[idx - 1];
}

// ─── EK-3: Banka Referans Mektubu Asgari Tutarları (2026) ────────
export const BANKA_REF_TUTARLARI: Record<string, number | null> = {
  "A":  123_825_000,
  "B":   86_677_500,
  "B1":  74_295_000,
  "C":   61_912_500,
  "C1":  51_593_750,
  "D":   41_275_000,
  "D1":  30_956_250,
  "E":   20_637_500,
  "E1":  12_382_500,
  "F":    6_191_250,
  "F1":   5_262_563,
  "G":    4_333_875,
  "G1":   3_095_625,
  "H":   null,        // Gerekmez
};

export function grupIcinBankaRef(grup: string): number | null {
  return BANKA_REF_TUTARLARI[grup] ?? null;
}

// ─── EK-2: İş Hacmi — Genel Ciro ve Yapım Cirosu (2026) ─────────
export interface IsHacmi {
  genelCiro: number | null;   // null = gerekmez
  yapimCirosu: number | null;
}

export const IS_HACMI: Record<string, IsHacmi> = {
  "A":  { genelCiro: 371_475_000, yapimCirosu: 297_180_000 },
  "B":  { genelCiro: 260_032_500, yapimCirosu: 208_026_000 },
  "B1": { genelCiro: 222_885_000, yapimCirosu: 178_308_000 },
  "C":  { genelCiro: 185_737_500, yapimCirosu: 148_590_000 },
  "C1": { genelCiro: 154_781_250, yapimCirosu: 123_825_000 },
  "D":  { genelCiro: 123_825_000, yapimCirosu:  99_060_000 },
  "D1": { genelCiro:  92_868_750, yapimCirosu:  74_295_000 },
  "E":  { genelCiro:  41_275_000, yapimCirosu:  33_020_000 },
  "E1": { genelCiro:  24_765_000, yapimCirosu:  19_812_000 },
  "F":  { genelCiro: null,        yapimCirosu: null },
  "F1": { genelCiro: null,        yapimCirosu: null },
  "G":  { genelCiro: null,        yapimCirosu: null },
  "G1": { genelCiro: null,        yapimCirosu: null },
  "H":  { genelCiro: null,        yapimCirosu: null },
};

export function grupIcinIsHacmi(grup: string): IsHacmi {
  return IS_HACMI[grup] || { genelCiro: null, yapimCirosu: null };
}

export function grupMaliYeterlilikGerektirir(grup: string): boolean {
  // E ve üzeri gruplar için mali yeterlilik gerekiyor
  const idx = GRUP_ESIKLER.findIndex(g => g.grup === grup);
  const eIdx = GRUP_ESIKLER.findIndex(g => g.grup === "E");
  return idx !== -1 && idx <= eIdx;
}

// ─── Diploma hesaplama — yıl+ay bazlı tutar ──────────────────────
// İnşaat Mühendisliği / Mimarlık diploması için
// Yıllık değer: 6.879.166,67 ₺ / Aylık: 573.263,89 ₺
const DIPLOMA_YILLIK = 6_879_166.67;
const DIPLOMA_AYLIK  =   573_263.89;

export interface DiplomaHesap {
  grup: string;
  yil: number;
  ay: number;
  toplamAy: number;
  tutar: number;
  aciklama: string;
}

export function diplomaGrubu(mezuniyetTarihi: string): DiplomaHesap {
  const mez = new Date(mezuniyetTarihi);
  const bugun = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));

  let yil = bugun.getFullYear() - mez.getFullYear();
  let ay  = bugun.getMonth()    - mez.getMonth();

  if (bugun.getDate() < mez.getDate()) ay--;
  if (ay < 0) { yil--; ay += 12; }

  const toplamAy = yil * 12 + ay;
  const tutar = Math.floor(yil * DIPLOMA_YILLIK + ay * DIPLOMA_AYLIK);
  const grup = grupBul(tutar);

  return {
    grup,
    yil,
    ay,
    toplamAy,
    tutar,
    aciklama: `${yil} yıl ${ay} ay diploması → ${tutar.toLocaleString("tr-TR")} ₺ → Grup ${grup}. İş deneyimiyle toplanamaz.`,
  };
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────
export function donemBul(tarih: string): string {
  const d = new Date(tarih);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (y >= 2026) return "2026";
  if (y === 2025) return "2025";
  if (y === 2024) return "2024";
  if (y === 2023) return m >= 7 ? "2023-2" : "2023-1";
  if (y === 2022) return m >= 9 ? "2022-3" : m >= 5 ? "2022-2" : "2022-1";
  if (y >= 2010) return String(y);
  return "2010";
}

export function ufeEndeksi(tarih: string): number {
  const d = new Date(tarih);
  let y = d.getFullYear();
  let m = d.getMonth() - 1;
  if (m < 0) { m = 11; y--; }
  const arr = UFE[String(y)];
  if (!arr) return UFE["2010"][0];
  return arr[m] ?? arr[arr.length - 1];
}

export function birimFiyat(sinif: string, donem: string): number {
  if (donem === "2026") return BM_2026[sinif] || 0;
  return BM_GECMIS[donem]?.[sinif] || BM_2026[sinif] || 0;
}

// ─── Tekil iş hesapla ─────────────────────────────────────────────
export interface IsGirdisi {
  sozlesmeTarihi: string;
  ruhsatSinifi: string;
  ymoSinifi?: string;       // admin onaylıysa güncel sınıf
  insaatAlaniM2: number;
  isDeneyimiTipi: "kat_karsiligi" | "taahhut";
  taahhutBedeli?: number;
}

export interface IsSonucu {
  belgeTutari: number;
  guncelTutar: number;
  sozlesmeDonemi: string;
  bfSoz: number;
  bfBas: number;
  ufeSoz: number;
  ufeBas: number;
  ufeKatsayi: number;
  ymo: number;
  kullanilanKatsayi: number;
  bantDurumu: "ufe" | "alt_sinir" | "ust_sinir";
  sozlesmedenBugune: string;   // sade açıklama: "Sözleşme tarihindeki tutar: X → bugünkü değeri: Y"
}

export function isHesapla(g: IsGirdisi): IsSonucu {
  const sozDon = donemBul(g.sozlesmeTarihi);
  const bfSoz  = birimFiyat(g.ruhsatSinifi, sozDon);
  const ymoSinif = g.ymoSinifi || g.ruhsatSinifi;
  const bfBas  = BM_2026[ymoSinif] || BM_2026[g.ruhsatSinifi] || 0;
  const ufeSoz = ufeEndeksi(g.sozlesmeTarihi);
  const ufeBas = 5029.76; // 2026 Şubat endeksi

  if (g.isDeneyimiTipi === "taahhut") {
    const bedel = g.taahhutBedeli || 0;
    const ufeK  = ufeBas / ufeSoz;
    const guncel = Math.round(bedel * ufeK);
    return {
      belgeTutari: bedel,
      guncelTutar: guncel,
      sozlesmeDonemi: sozDon,
      bfSoz: 0, bfBas: 0,
      ufeSoz, ufeBas, ufeKatsayi: ufeK, ymo: 1,
      kullanilanKatsayi: ufeK,
      bantDurumu: "ufe",
      sozlesmedenBugune: `Sözleşme bedeli: ${bedel.toLocaleString("tr-TR")} ₺ → bugünkü değeri: ${guncel.toLocaleString("tr-TR")} ₺ (${ufeK.toFixed(2)}× artış)`,
    };
  }

  // Kat karşılığı
  const belgeTutari = Math.round(g.insaatAlaniM2 * bfSoz * 0.85);
  const ufeK = ufeBas / ufeSoz;
  const ymo  = bfSoz > 0 ? bfBas / bfSoz : 1;
  const alt  = ymo * 0.90;
  const ust  = ymo * 1.30;

  let kullanilanK = ufeK;
  let bantDurumu: "ufe" | "alt_sinir" | "ust_sinir" = "ufe";

  if      (ufeK < alt) { kullanilanK = alt; bantDurumu = "alt_sinir"; }
  else if (ufeK > ust) { kullanilanK = ust; bantDurumu = "ust_sinir"; }

  const guncel = Math.round(belgeTutari * kullanilanK);

  return {
    belgeTutari,
    guncelTutar: guncel,
    sozlesmeDonemi: sozDon,
    bfSoz, bfBas,
    ufeSoz, ufeBas, ufeKatsayi: ufeK,
    ymo, kullanilanKatsayi: kullanilanK,
    bantDurumu,
    sozlesmedenBugune: `Sözleşme tarihindeki tutar: ${belgeTutari.toLocaleString("tr-TR")} ₺ → bugünkü değeri: ${guncel.toLocaleString("tr-TR")} ₺ (${kullanilanK.toFixed(2)}× artış)`,
  };
}

// ─── 3 Yöntemi Hesapla ───────────────────────────────────────────
export interface TamHesaplaGirdisi {
  id: string;
  sozlesmeTarihi: string;
  iskanTarihi?: string;
  ruhsatSinifi: string;
  ymoSinifi?: string;
  insaatAlaniM2: number;
  isDeneyimiTipi: "kat_karsiligi" | "taahhut";
  taahhutBedeli?: number;
  adaParsel?: string;
  yapiTipi?: string;
  yapiYuksekligiM?: number;
}

export interface HesaplananIs extends TamHesaplaGirdisi {
  sonuc: IsSonucu;
  iskanDate: Date | null;
}

export interface TamHesaplama {
  isler: HesaplananIs[];
  y1: {
    son5YilIsler: HesaplananIs[];
    eskiIsler: HesaplananIs[];
    toplamBrut: number;
    enBuyukIs: number;
    ucKatSiniri: number;
    kilidiAcildi: boolean;
    toplamNet: number;
    grup: string;
  };
  y2: {
    son15YilIsler: HesaplananIs[];
    enBuyukIs: HesaplananIs | null;
    enBuyukTutar: number;
    toplam: number;
    grup: string;
  };
  diploma: DiplomaHesap | null;
  tercihEdilenYontem: "son5" | "son15";
  tercihEdilenToplam: number;
  tercihEdilenGrup: string;
  birUstGrup: { grup: string; min: number } | null;
  eksikTutar: number;
  bankaRefTutari: number | null;
  isHacmi: IsHacmi;
  maliYeterlilikGerekli: boolean;
}

export function tamHesapla(
  isGirisleri: TamHesaplaGirdisi[],
  mezuniyetTarihi?: string | null
): TamHesaplama {
  const bugun = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const be5  = new Date(bugun); be5.setFullYear(be5.getFullYear() - 5);
  const be15 = new Date(bugun); be15.setFullYear(be15.getFullYear() - 15);

  const isler: HesaplananIs[] = isGirisleri.map(g => ({
    ...g,
    sonuc: isHesapla(g),
    iskanDate: g.iskanTarihi ? new Date(g.iskanTarihi) : null,
  }));

  // Yöntem 1: Son 5 yıl toplamı
  const son5  = isler.filter(x => x.iskanDate && x.iskanDate >= be5);
  const eski  = isler.filter(x => x.iskanDate && x.iskanDate < be5 && x.iskanDate >= be15);
  const toplamBrut = son5.reduce((s, x) => s + x.sonuc.guncelTutar, 0);
  const enBuyuk5   = son5.length > 0 ? Math.max(...son5.map(x => x.sonuc.guncelTutar)) : 0;
  const ucKat      = enBuyuk5 * 3;
  const kilidiAcildi = eski.length > 0;
  const toplamNet  = Math.min(toplamBrut, ucKat);

  // Yöntem 2: Son 15 yılda en büyük × 2
  const son15 = isler.filter(x => x.iskanDate && x.iskanDate >= be15);
  const enBuyuk15 = son15.length > 0
    ? son15.reduce((m, x) => x.sonuc.guncelTutar > m.sonuc.guncelTutar ? x : m, son15[0])
    : null;
  const y2Toplam = enBuyuk15 ? enBuyuk15.sonuc.guncelTutar * 2 : 0;

  // Yöntem 3: Diploma
  const dipSonuc = mezuniyetTarihi ? diplomaGrubu(mezuniyetTarihi) : null;

  // En avantajlı yöntemi seç
  const tercih = y2Toplam > toplamNet ? "son15" : "son5";
  const tercihToplam = tercih === "son5" ? toplamNet : y2Toplam;
  const tercihGrup   = grupBul(tercihToplam);
  const ust          = birUstGrup(tercihGrup);
  const eksik        = ust ? Math.max(0, ust.min - tercihToplam) : 0;

  return {
    isler,
    y1: {
      son5YilIsler: son5,
      eskiIsler: eski,
      toplamBrut,
      enBuyukIs: enBuyuk5,
      ucKatSiniri: ucKat,
      kilidiAcildi,
      toplamNet,
      grup: grupBul(toplamNet),
    },
    y2: {
      son15YilIsler: son15,
      enBuyukIs: enBuyuk15,
      enBuyukTutar: enBuyuk15?.sonuc.guncelTutar || 0,
      toplam: y2Toplam,
      grup: grupBul(y2Toplam),
    },
    diploma: dipSonuc,
    tercihEdilenYontem: tercih,
    tercihEdilenToplam: tercihToplam,
    tercihEdilenGrup: tercihGrup,
    birUstGrup: ust,
    eksikTutar: eksik,
    bankaRefTutari: grupIcinBankaRef(tercihGrup),
    isHacmi: grupIcinIsHacmi(tercihGrup),
    maliYeterlilikGerekli: grupMaliYeterlilikGerektirir(tercihGrup),
  };
}

// ─── Para formatı ─────────────────────────────────────────────────
export const tlFormat = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Math.round(n));

export const tlSade = (n: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₺";
