// ═══════════════════════════════════════════════════════════════
// hesaplama-baglantisi.ts
// Yapı tipi + yükseklik → 2026 sınıf → sözleşme yılı geri map
// ═══════════════════════════════════════════════════════════════
//
// PROBLEM: Müşteri sözleşmesinde yapısını "IV.A" olarak tescil ettirmiş
//   ama aynı yapı bugün (2026) III.C'ye karşılık geliyor olabilir.
//   Ya da tam tersi — geriye dönük hesaplamada hangi birim fiyatı kullanacağız?
//
// DOĞRU YAKLAŞIM:
//   1. Yapı tipi + yükseklik + alan → yapiSinifiTayin() → 2026 cinsinden sınıf bul
//   2. Bu sınıfı sözleşme yılına map et:
//      - O yılda bu sınıf var mı?
//      - Yoksa en yakın DÜŞÜK sınıfı kullan (azalma yönünde)
//      - Ve kullanıcıya uyarı göster
//   3. Map edilmiş sınıfla hesapla
//
// NOT: Birim maliyet tablosunda III.C 2020 öncesinde yok.
//   Eğer yapı bugün III.C ama sözleşme 2018'deyse → III.B kullanılır.
// ═══════════════════════════════════════════════════════════════

// Yıla göre mevcut sınıflar (roman numeral format)
const YILDA_MEVCUT_SINIFLAR: Record<number, string[]> = {
  2010: ["III.B", "IV.A", "IV.B", "V.A"],
  2011: ["III.B", "IV.A", "IV.B", "V.A"],
  2012: ["III.B", "IV.A", "IV.B", "V.A"],
  2013: ["III.B", "IV.A", "IV.B", "V.A"],
  2014: ["III.B", "IV.A", "IV.B", "V.A"],
  2015: ["III.B", "IV.A", "IV.B", "V.A"],
  2016: ["III.B", "IV.A", "IV.B", "V.A"],
  2017: ["III.B", "IV.A", "IV.B", "V.A"],
  2018: ["III.B", "IV.A", "IV.B", "V.A"],
  2019: ["III.B", "IV.A", "IV.B", "V.A"],
  2020: ["III.B", "III.C", "IV.A", "IV.B", "IV.C", "V.A"],
  2021: ["III.B", "III.C", "IV.A", "IV.B", "IV.C", "V.A"],
  2022: ["III.B", "III.C", "IV.A", "IV.B", "IV.C", "V.A"],
  2023: ["III.B", "III.C", "IV.A", "IV.B", "IV.C", "V.A"],
  2024: ["III.B", "III.C", "IV.A", "IV.B", "IV.C", "V.A"],
  2025: ["III.B", "III.C", "IV.A", "IV.B", "IV.C", "V.A", "V.B", "V.C", "V.D"],
  2026: ["III.B", "III.C", "IV.A", "IV.B", "IV.C", "V.A", "V.B", "V.C", "V.D"],
};

// Sınıf hiyerarşisi — küçükten büyüğe sıra numarası
const SINIF_SIRA: Record<string, number> = {
  "III.B": 1, "III.C": 2, "IV.A": 3, "IV.B": 4, "IV.C": 5,
  "V.A": 6, "V.B": 7, "V.C": 8, "V.D": 9,
};

// YapiSinifiKodu → roman format dönüşüm
const KOD_TO_ROMAN: Record<string, string> = {
  "3B": "III.B", "3C": "III.C", "4A": "IV.A", "4B": "IV.B",
  "4C": "IV.C", "5A": "V.A", "5B": "V.B", "5C": "V.C", "5D": "V.D",
};
const ROMAN_TO_KOD: Record<string, string> = Object.fromEntries(
  Object.entries(KOD_TO_ROMAN).map(([k, v]) => [v, k])
);

export interface SinifMapSonucu {
  // 2026 cinsinden tayin edilen sınıf (roman format)
  sinif2026: string;
  // Sözleşme yılına map edilmiş sınıf (roman format)
  sozlesmeSinifi: string;
  // İki sınıf aynı mı?
  sinifDustu: boolean;
  // Farklıysa açıklama
  aciklama: string;
  // Hesaplamada kullanılacak nihai sınıf (KOD format: "3B", "4A" vb.)
  hesaplamaSinifiKod: string;
}

/**
 * Yapı tipi + parametrelerden 2026 sınıfını bul,
 * ardından sözleşme yılına map et.
 *
 * @param sinif2026Roman  yapiSinifiTayin() sonucunu roman formatta ver (örn "III.C")
 * @param sozlesmeTarihi  "YYYY-MM-DD" formatında
 */
export function sinifiSozlesmeYilinaMaple(
  sinif2026Roman: string,
  sozlesmeTarihi: string
): SinifMapSonucu {
  const yil = new Date(sozlesmeTarihi).getFullYear();
  const gecerliSiniflar = YILDA_MEVCUT_SINIFLAR[yil] || YILDA_MEVCUT_SINIFLAR[2010];

  // Sınıf o yılda mevcut mu?
  if (gecerliSiniflar.includes(sinif2026Roman)) {
    return {
      sinif2026: sinif2026Roman,
      sozlesmeSinifi: sinif2026Roman,
      sinifDustu: false,
      aciklama: `${sinif2026Roman} sınıfı ${yil} yılında geçerliydi. Hesaplama bu sınıf üzerinden yapılır.`,
      hesaplamaSinifiKod: ROMAN_TO_KOD[sinif2026Roman] || "3B",
    };
  }

  // Sınıf o yılda yok — bir aşağısına in
  const hedefSira = SINIF_SIRA[sinif2026Roman] || 1;
  let fallbackSinif = "III.B";

  // Hedef sıranın altındaki en yüksek geçerli sınıfı bul
  for (let s = hedefSira - 1; s >= 1; s--) {
    const adaylar = Object.entries(SINIF_SIRA)
      .filter(([, sira]) => sira === s)
      .map(([sinif]) => sinif);

    const gecerliAday = adaylar.find(a => gecerliSiniflar.includes(a));
    if (gecerliAday) { fallbackSinif = gecerliAday; break; }
  }

  return {
    sinif2026: sinif2026Roman,
    sozlesmeSinifi: fallbackSinif,
    sinifDustu: true,
    aciklama: `${sinif2026Roman} sınıfı ${yil} yılında henüz tanımlanmamıştı. Bu yapı ${yil}'de ${fallbackSinif} sınıfına karşılık geliyordu. Hesaplama ${fallbackSinif} birim fiyatı üzerinden yapılacaktır.`,
    hesaplamaSinifiKod: ROMAN_TO_KOD[fallbackSinif] || "3B",
  };
}

/**
 * Admin paneli hesaplama sekmesinde kullanılacak tam akış:
 * Yapı tipi + parametreler → 2026 sınıfı → sözleşme yılı map → ÜFE hesabı
 *
 * Bu fonksiyon wizard'dan gelen veriyi alıp hesaplama için hazır hale getirir.
 */
export interface HazirHesaplamaGirdisi {
  sozlesmeTarihi: string;
  // Wizard'dan gelen 2026-cinsinden sınıf (roman format)
  sinif2026: string;
  // Gerçek hesaplamada kullanılacak sınıf (sözleşme yılına map edilmiş)
  sozlesmeSinifiKod: string;
  // Bilgi amaçlı
  sinifDustu: boolean;
  sinifDusmaAciklama?: string;
}

export function wizardVerisiniHazirla(exp: {
  contractDate: string;
  buildingClass: string; // wizard'da seçilen (sözleşme yılına göre filtrelenmiş)
  yapiSinifi2026?: string; // yapı tipi motorundan gelen 2026 karşılığı (varsa)
}): HazirHesaplamaGirdisi {
  // Eğer motor 2026 sınıfını hesapladıysa map et
  if (exp.yapiSinifi2026) {
    const mapSonuc = sinifiSozlesmeYilinaMaple(exp.yapiSinifi2026, exp.contractDate);
    return {
      sozlesmeTarihi: exp.contractDate,
      sinif2026: exp.yapiSinifi2026,
      sozlesmeSinifiKod: mapSonuc.hesaplamaSinifiKod,
      sinifDustu: mapSonuc.sinifDustu,
      sinifDusmaAciklama: mapSonuc.sinifDustu ? mapSonuc.aciklama : undefined,
    };
  }

  // Wizard'da manuel sınıf seçildiyse (zaten filtrelenmiş) direkt kullan
  const roman = KOD_TO_ROMAN[exp.buildingClass] || exp.buildingClass;
  return {
    sozlesmeTarihi: exp.contractDate,
    sinif2026: roman,
    sozlesmeSinifiKod: ROMAN_TO_KOD[roman] || exp.buildingClass,
    sinifDustu: false,
  };
}

// ─── Wizard'da kullanılacak özet tablo ───────────────────────────
// Hangi yapı tipinin hangi 2026 sınıfına denk geldiğini müşteriye göster
export const YAPI_TIPI_2026_SINIFI: Record<string, { sinif: string; aciklama: string }> = {
  konut_apartman:  { sinif: "Yüksekliğe göre",  aciklama: "≤6.5m: III.B · 6.5–21.5m: III.C · 21.5–51.5m: IV.A · 51.5–91.5m: IV.B · >91.5m: IV.C" },
  konut_mustakil:  { sinif: "Alana göre",        aciklama: "<500m²: III.B · ≥500m²: III.C" },
  konut_ticari:    { sinif: "Yükseklik+Orana göre", aciklama: "Karma yapı — ticari oran >%20 ise bir üst sınıf" },
  is_merkezi:      { sinif: "Yüksekliğe göre",   aciklama: "Konut apartmanı ile aynı yükseklik eşikleri" },
  okul_ilkortaokul:{ sinif: "III.B",             aciklama: "İlk ve ortaokullar sabit III.B sınıfı" },
  okul_lise:       { sinif: "III.C",             aciklama: "Liseler sabit III.C sınıfı" },
  universite:      { sinif: "IV.A",              aciklama: "Üniversite binaları sabit IV.A" },
  avm_kucuk:       { sinif: "IV.A",              aciklama: "<25.000m² AVM" },
  avm_buyuk:       { sinif: "IV.C",              aciklama: "≥25.000m² AVM" },
  otel_1_2:        { sinif: "IV.A",              aciklama: "1-2 yıldızlı oteller" },
  otel_3:          { sinif: "IV.C",              aciklama: "3 yıldızlı oteller" },
  otel_4:          { sinif: "V.B",               aciklama: "4 yıldızlı oteller" },
  otel_5:          { sinif: "V.D",               aciklama: "5 yıldızlı oteller" },
};
