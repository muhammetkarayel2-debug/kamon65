// ============================================================
// lib/hesaplama.ts
// İş Deneyimi Güncelleme Motoru
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

export function ufeEndeksiBul(tarih: string): number {
  const d   = new Date(tarih);
  let yil = d.getFullYear();
  let ay  = d.getMonth() - 1;
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
  yapiSinifi:      YapiSinifiKodu;
  guncelYapiSinifi?: YapiSinifiKodu;
  alanM2:          number;
  basvuruTarihi?:  string;
}

export interface IsDeneyimSonuc {
  belgeTutari:           number;
  birimFiyatSozlesme:    number;
  sozlesmeDonemi:        string;
  ufeEndeksSozlesme:     number;
  ufeEndeksBasvuru:      number;
  ufeKatsayi:            number;
  birimFiyatBasvuru:     number;
  basvuruDonemi:         string;
  ymoSinifi:             YapiSinifiKodu;
  ymo:                   number;
  altSinir:              number;
  ustSinir:              number;
  kullanilanKatsayi:     number;
  bantDurumu:            "ufe" | "alt_sinir" | "ust_sinir";
  bantAciklama:          string;
  guncelTutar:           number;
  sinifDegisti:          boolean;
  sinifDegisimAciklama?: string;
}

export function isDeneyimHesapla(g: IsDeneyimGirdi): IsDeneyimSonuc {
  const sozDon = donemBul(g.sozlesmeTarihi);
  const basDon = g.basvuruTarihi ? donemBul(g.basvuruTarihi) : "2026";

  const bfSoz = BIRIM_MALIYETLER[sozDon]?.[g.yapiSinifi] ?? 0;

  const ymoSinifi: YapiSinifiKodu = g.guncelYapiSinifi ?? g.yapiSinifi;
  const bfBas = BIRIM_MALIYETLER[basDon]?.[ymoSinifi]
    ?? BIRIM_MALIYETLER["2026"]?.[ymoSinifi]
    ?? BIRIM_MALIYETLER[basDon]?.[g.yapiSinifi]
    ?? BIRIM_MALIYETLER["2026"]?.[g.yapiSinifi]
    ?? 0;

  const ufeSoz = ufeEndeksiBul(g.sozlesmeTarihi);
  const ufeBas = g.basvuruTarihi ? ufeEndeksiBul(g.basvuruTarihi) : REFERANS_UFE_SUBAT_2026;

  const belge = g.alanM2 * bfSoz * 0.85;
  const ufeKat = ufeBas / ufeSoz;
  const ymo = bfBas / bfSoz;
  const alt = ymo * 0.90;
  const ust = ymo * 1.30;

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
// ─────────────────────────────────────────────

export interface BedelKarsiligıGirdi {
  sozlesmeBedeliTL:  number;
  sozlesmeTarihi:    string;
  basvuruTarihi?:    string;
  iskanTarihi?:      string;
  ad?:               string;
}

export interface BedelKarsiligıSonuc {
  belgeTutari:        number;
  temelEndeks:        number;
  guncelEndeks:       number;
  katsayi:            number;
  guncelTutar:        number;
  ymo:                null;
  bantDurumu:         "ufe";
}

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
// STRATEJİ HESAPLAMA
// ─────────────────────────────────────────────

export interface YapiStrateji extends IsDeneyimGirdi {
  iskanTarihi: string;
  guncelTutar: number;
  ad?: string;
}

export interface StratejiYontem1 {
  son5Yapilar:    YapiStrateji[];
  toplam5:        number;
  enBuyuk5:       number;
  sinir3x:        number;
  siniraGirdi:    boolean;
  tutar:          number;
}

export interface StratejiYontem2 {
  son15Yapilar:   YapiStrateji[];
  enBuyuk15:      number;
  enBuyuk15Yapi?: string;
  tutar:          number;
}

export interface StratejiSonuc {
  yontem1:              StratejiYontem1;
  yontem2:              StratejiYontem2;
  tercihEdilenYontem:   1 | 2;
  sonucTutar:           number;
  grup:                 ReturnType<typeof grupHesapla>;
}

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

  const toplam5   = son5.reduce((s, y) => s + y.guncelTutar, 0);
  const enBuyuk5  = son5.length > 0 ? Math.max(...son5.map(y => y.guncelTutar)) : 0;
  const sinir3x   = enBuyuk5 * 3;
  const y1Tutar   = Math.min(toplam5, sinir3x);

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
// ─────────────────────────────────────────────

export const DIPLOMA_YILLIK_DEGER: Record<string, number> = {
  "2026": 6_879_166.67,
};

export function diplomaYillikDegerAl(yil?: number): number {
  const y = String(yil ?? new Date().getFullYear());
  return DIPLOMA_YILLIK_DEGER[y] ?? DIPLOMA_YILLIK_DEGER["2026"];
}

export type DiplomaKullanimTipi =
  | "sahis"
  | "limited_as"
  | "is_deneyimi";

export interface DiplomaKisitSonucu {
  uygun: boolean;
  uyari: string;
  teknikNot: string;
}

export function diplomaKisitKontrol(
  kullanimTipi: DiplomaKullanimTipi,
  params?: {
    hisseOrani?: number;
    hisseBaslangicTarihi?: string;
    basvuruTarihi?: string;
  },
): DiplomaKisitSonucu {

  if (kullanimTipi === "sahis") {
    return {
      uygun: true,
      uyari: "",
      teknikNot: "Şahıs başvurusunda diploma kullanımında kısıt yoktur.",
    };
  }

  if (kullanimTipi === "is_deneyimi") {
    return {
      uygun: false,
      uyari: [
        "Şahsınıza ait iş deneyimini (taahhüt veya kat karşılığı) sunabilmeniz için,",
        "ilgili şirkette %51 veya üzeri hissedarı olmanız ve",
        "bu ortaklığın kesintisiz en az 1 yıl sürmesi gerekmektedir.",
      ].join(" "),
      teknikNot: "%51 hisse + kesintisiz 1 yıl şartı (iş deneyimi kullanımı için).",
    };
  }

  if (kullanimTipi === "limited_as") {
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

    if (bas) {
      const basTarih = new Date(bas);
      const bvrTarih = new Date(bvr);
      const yilFark = (bvrTarih.getTime() - basTarih.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (yilFark < 5) {
        return {
          uygun: false,
          uyari: [
            `Diplomanızı bu şirkette kullanabilmeniz için %51 hissedarlığınızın`,
            `en az 5 yıl sürmesi gerekmektedir.`,
            `Mevcut süre: ${yilFark.toFixed(1)} yıl.`,
          ].join(" "),
          teknikNot: `5 yıl şartı karşılanmadı: ${yilFark.toFixed(2)} yıl < 5 yıl.`,
        };
      }
    }

    return {
      uygun: true,
      uyari: "",
      teknikNot: `%${hisse} hisse, 5+ yıl — diploma kullanımı uygun.`,
    };
  }

  return { uygun: true, uyari: "", teknikNot: "" };
}

// ─────────────────────────────────────────────
// BEDEL STRATEJİ HESAPLAMA
// ─────────────────────────────────────────────

export function bedelStratejiHesapla(
  isler: BedelKarsiligıGirdi[],
  basvuruTarihi?: string,
  bugun: string = new Date().toISOString().slice(0, 10),
): StratejiSonuc {
  const yapilar: YapiStrateji[] = isler
    .filter(i => i.iskanTarihi)
    .map(i => {
      const sonuc = bedelKarsiligıHesapla({ ...i, basvuruTarihi: i.basvuruTarihi ?? basvuruTarihi });
      return {
        sozlesmeTarihi: i.sozlesmeTarihi,
        iskanTarihi:    i.iskanTarihi!,
        yapiSinifi:     "3B" as YapiSinifiKodu,
        alanM2:         0,
        guncelTutar:    sonuc.guncelTutar,
        ad:             i.ad,
      };
    });

  return stratejiHesapla(yapilar, bugun);
}
