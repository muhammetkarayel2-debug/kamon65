// ══════════════════════════════════════════════════════
// Yapı sınıfı kuralları — yıl ve yüksekliğe göre filtreleme
// ══════════════════════════════════════════════════════

// Yapı sınıfları sözleşme yılına göre hangileri geçerli?
// Kaynak: Bakanlık tebliğleri — III.C 2020'de eklendi
export const GECERLI_SINIFLAR_YILA_GORE: Record<number, string[]> = {
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

// Yapı yüksekliğine göre minimum sınıf
// Yüksekliği girilen yapı bu sınıfın altında olamaz
export const YUKSEKLIK_SINIF_KURALI: { minM: number; maxM: number; minSinif: string }[] = [
  { minM:  0,  maxM:  6.49, minSinif: "III.B" },
  { minM:  6.5, maxM: 21.49, minSinif: "III.C" },
  { minM: 21.5, maxM: 51.49, minSinif: "IV.A"  },
  { minM: 51.5, maxM: 91.49, minSinif: "IV.B"  },
  { minM: 91.5, maxM: 999,   minSinif: "IV.C"  },
];

const SINIF_SIRA: Record<string, number> = {
  "III.B": 1, "III.C": 2, "IV.A": 3, "IV.B": 4, "IV.C": 5,
  "V.A": 6, "V.B": 7, "V.C": 8, "V.D": 9,
};

// Yüksekliğe göre min sınıf bul
export function yuksekliktenMinSinif(m: number): string | null {
  for (const kural of YUKSEKLIK_SINIF_KURALI) {
    if (m >= kural.minM && m <= kural.maxM) return kural.minSinif;
  }
  return null;
}

// Sözleşme tarihi + yükseklik'e göre seçilebilir sınıflar
export function gecerliSiniflar(sozlesmeTarihi: string, yukseklikM?: number): string[] {
  if (!sozlesmeTarihi) return Object.keys(SINIF_SIRA);
  const yil = new Date(sozlesmeTarihi).getFullYear();
  let siniflar = GECERLI_SINIFLAR_YILA_GORE[yil] || GECERLI_SINIFLAR_YILA_GORE[2010];

  if (yukseklikM && yukseklikM > 0) {
    const minSinif = yuksekliktenMinSinif(yukseklikM);
    if (minSinif) {
      const minSira = SINIF_SIRA[minSinif] || 1;
      siniflar = siniflar.filter(s => (SINIF_SIRA[s] || 0) >= minSira);
    }
  }
  return siniflar;
}

// Yükseklik ve sınıf uyumu kontrolü
export function sinifYukseklikUyumlu(sinif: string, yukseklikM: number): { uyumlu: boolean; mesaj?: string } {
  if (!yukseklikM || yukseklikM <= 0) return { uyumlu: true };
  const minSinif = yuksekliktenMinSinif(yukseklikM);
  if (!minSinif) return { uyumlu: true };
  const minSira = SINIF_SIRA[minSinif] || 1;
  const secSira = SINIF_SIRA[sinif] || 0;
  if (secSira < minSira) {
    return { uyumlu: false, mesaj: `${yukseklikM}m yükseklik için en az ${minSinif} sınıfı gereklidir.` };
  }
  return { uyumlu: true };
}
