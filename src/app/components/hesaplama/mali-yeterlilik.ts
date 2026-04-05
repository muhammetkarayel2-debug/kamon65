// ============================================================
// lib/mali-yeterlilik.ts
// EK-2 Ekonomik ve Mali Yeterlik Bildirim Formu
// ============================================================

export type GrupKodu = "A"|"B"|"B1"|"C"|"C1"|"D"|"D1"|"E"|"E1"|"F"|"F1"|"G"|"G1"|"H";

// ─────────────────────────────────────────────
// GRUP BAŞINA MALİ YETERLİLİK EŞİKLERİ
// ─────────────────────────────────────────────

export interface MaliYeterlilikEsik {
  cariOranMin:    number | null;
  ozKaynakMin:    number | null;
  borcOranMax:    number | null;
  genelCiroMin:   number | null;
  yapimCiroMin:   number | null;
}

export const MALI_YETERLILIK_ESIKLERI: Record<GrupKodu, MaliYeterlilikEsik> = {
  A:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:371_475_000,  yapimCiroMin:297_180_000  },
  B:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:260_032_500,  yapimCiroMin:208_026_000  },
  B1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:222_885_000,  yapimCiroMin:178_308_000  },
  C:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:185_737_500,  yapimCiroMin:148_590_000  },
  C1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:154_781_250,  yapimCiroMin:123_825_000  },
  D:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:123_825_000,  yapimCiroMin:99_060_000   },
  D1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:92_868_750,   yapimCiroMin:74_295_000   },
  E:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:41_275_000,   yapimCiroMin:33_020_000   },
  E1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:24_765_000,   yapimCiroMin:19_812_000   },
  F:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:null,          yapimCiroMin:null         },
  F1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:null,          yapimCiroMin:null         },
  G:  { cariOranMin:null, ozKaynakMin:null,  borcOranMax:null, genelCiroMin:null,          yapimCiroMin:null         },
  G1: { cariOranMin:null, ozKaynakMin:null,  borcOranMax:null, genelCiroMin:null,          yapimCiroMin:null         },
  H:  { cariOranMin:null, ozKaynakMin:null,  borcOranMax:null, genelCiroMin:null,          yapimCiroMin:null         },
};

// ─────────────────────────────────────────────
// CİRO EŞİĞİ HESAPLAMA
// ─────────────────────────────────────────────

const ASGARI_IS_DENEYIM: Record<GrupKodu, number> = {
  A:  2_476_500_000, B:  1_733_550_000, B1: 1_485_900_000,
  C:  1_238_250_000, C1: 1_031_875_000, D:    825_500_000,
  D1:   619_125_000, E:    412_750_000, E1:   247_650_000,
  F:    123_825_000, F1:   105_251_250,
  G:             0,  G1:            0,  H:              0,
};

export function ciroEsikHesapla(grup: GrupKodu): {
  oran:         number;
  genelCiroMin: number | null;
  yapimCiroMin: number | null;
} {
  const esik = MALI_YETERLILIK_ESIKLERI[grup];
  if (!esik.cariOranMin) return { oran: 0, genelCiroMin: null, yapimCiroMin: null };
  if (!esik.genelCiroMin) return { oran: 0, genelCiroMin: null, yapimCiroMin: null };

  const asgari = ASGARI_IS_DENEYIM[grup];
  const oran   = ["E", "E1"].includes(grup) ? 0.10 : 0.15;
  const genel  = asgari * oran;
  const yapim  = genel * 0.80;

  return { oran, genelCiroMin: Math.round(genel), yapimCiroMin: Math.round(yapim) };
}

export function maliYeterlilikGerekliMi(grup: GrupKodu): boolean {
  const e = MALI_YETERLILIK_ESIKLERI[grup];
  return e.cariOranMin !== null || e.genelCiroMin !== null;
}

export function ciroSartiVarMi(grup: GrupKodu): boolean {
  return MALI_YETERLILIK_ESIKLERI[grup].genelCiroMin !== null;
}

// ─────────────────────────────────────────────
// BİLANÇO ORANI HESAPLAMA
// ─────────────────────────────────────────────

export interface BilancoGirdisi {
  donenVarliklar:           number;
  kisaVadeliBorclar:        number;
  toplamAktif:              number;
  ozkaynaklar:              number;
  kisaVadeliBankaBorclari:  number;
  yillaraYayginMaliyet?:    number;
  yillaraYayginHakEdis?:    number;
}

export interface BilancoOranSonucu {
  cariOran:    number;
  ozKaynakOrani: number;
  borcOrani:   number;
  ham: {
    cariOran:      number;
    ozKaynakOrani: number;
    borcOrani:     number;
  };
}

export function bilancoOranlariHesapla(b: BilancoGirdisi): BilancoOranSonucu {
  const yyM = b.yillaraYayginMaliyet  ?? 0;
  const yyH = b.yillaraYayginHakEdis  ?? 0;

  const hamCari    = b.donenVarliklar  / b.kisaVadeliBorclar;
  const hamOz      = b.ozkaynaklar     / b.toplamAktif;
  const hamBorc    = b.kisaVadeliBankaBorclari / b.ozkaynaklar;

  const duzCari    = (b.donenVarliklar - yyM) / (b.kisaVadeliBorclar - yyH);
  const duzOz      = b.ozkaynaklar / (b.toplamAktif - yyM);
  const duzBorc    = b.kisaVadeliBankaBorclari / b.ozkaynaklar;

  return {
    cariOran:      duzCari,
    ozKaynakOrani: duzOz,
    borcOrani:     duzBorc,
    ham: { cariOran: hamCari, ozKaynakOrani: hamOz, borcOrani: hamBorc },
  };
}

// ─────────────────────────────────────────────
// HANGİ YILIN BİLANÇOSU SUNULACAK?
// ─────────────────────────────────────────────

export interface BilancoYilKurali {
  oncelikliYillar:  number[];
  ortalamaSecenekleri: number[][];
  aciklama: string;
}

export function bilancoYilKuraliGetir(basvuruTarihi: string): BilancoYilKurali {
  const bas  = new Date(basvuruTarihi);
  const yil  = bas.getFullYear();
  const ay   = bas.getMonth() + 1;
  const ilkDortAy = ay <= 4;

  if (ilkDortAy) {
    return {
      oncelikliYillar: [yil - 1, yil - 2],
      ortalamaSecenekleri: [
        [yil - 1, yil - 2, yil - 3],
        [yil - 2, yil - 3],
        [yil - 2, yil - 3, yil - 4],
      ],
      aciklama: `Başvuru ${ay}. ayda (ilk 4 ay). Önce ${yil-1}, yetmezse ${yil-2} yılı, yetmezse son 3 yıl ortalaması.`,
    };
  }

  return {
    oncelikliYillar: [yil - 1],
    ortalamaSecenekleri: [
      [yil - 1, yil - 2, yil - 3],
    ],
    aciklama: `Önce ${yil-1} yılı bilançosu. Yetmezse ${yil-1}/${yil-2}/${yil-3} yılları ortalaması.`,
  };
}

// ─────────────────────────────────────────────
// İŞ HACMİ (CİRO) YILI KURALI
// ─────────────────────────────────────────────

export function ciroYilKuraliGetir(basvuruTarihi: string): {
  oncelikliYil:    number;
  ortalamaYillar:  number[];
  alternatifKural: string;
} {
  const yil = new Date(basvuruTarihi).getFullYear();
  return {
    oncelikliYil: yil - 1,
    ortalamaYillar: [yil-1, yil-2, yil-3, yil-4, yil-5, yil-6],
    alternatifKural: `YMM/SMMM onaylı yapım ciro tablosu ile son 3 yıldan herhangi birinde ciro şartını sağlamak yeterlidir (Kural 9).`,
  };
}

// ─────────────────────────────────────────────
// MALİ YETERLİLİK KONTROL MOTORU
// ─────────────────────────────────────────────

export interface MaliKontrolSonucu {
  grupKodu:     GrupKodu;
  uygun:        boolean;
  detaylar: {
    cariOran?:    { deger: number; esik: number; gecti: boolean };
    ozKaynak?:    { deger: number; esik: number; gecti: boolean };
    borcOrani?:   { deger: number; esik: number; gecti: boolean };
    genelCiro?:   { deger: number; esik: number; gecti: boolean };
    yapimCiro?:   { deger: number; esik: number; gecti: boolean };
  };
  gecemedenler: string[];
  notlar:       string[];
}

export function maliYeterlilikKontrol(
  grup: GrupKodu,
  oranlar: BilancoOranSonucu,
  genelCiro?: number,
  yapimCiroMax?: number,
): MaliKontrolSonucu {
  const esik = MALI_YETERLILIK_ESIKLERI[grup];
  const ciroEsik = ciroEsikHesapla(grup);
  const gecemedenler: string[] = [];
  const notlar: string[] = [];
  const detaylar: MaliKontrolSonucu["detaylar"] = {};

  if (esik.cariOranMin !== null) {
    const gecti = oranlar.cariOran >= esik.cariOranMin;
    detaylar.cariOran = { deger: oranlar.cariOran, esik: esik.cariOranMin, gecti };
    if (!gecti) {
      gecemedenler.push(`Cari oran: ${oranlar.cariOran.toFixed(4)} < ${esik.cariOranMin}`);
      notlar.push("Son 3 yılın ortalamasıyla yeniden değerlendirilebilir (Kural 2).");
    }
  }

  if (esik.ozKaynakMin !== null) {
    const gecti = oranlar.ozKaynakOrani >= esik.ozKaynakMin;
    detaylar.ozKaynak = { deger: oranlar.ozKaynakOrani, esik: esik.ozKaynakMin, gecti };
    if (!gecti) {
      gecemedenler.push(`Özkaynak oranı: ${oranlar.ozKaynakOrani.toFixed(4)} < ${esik.ozKaynakMin}`);
    }
  }

  if (esik.borcOranMax !== null) {
    const gecti = oranlar.borcOrani <= esik.borcOranMax;
    detaylar.borcOrani = { deger: oranlar.borcOrani, esik: esik.borcOranMax, gecti };
    if (!gecti) {
      gecemedenler.push(`KV banka borç oranı: ${oranlar.borcOrani.toFixed(4)} > ${esik.borcOranMax}`);
    }
  }

  if (ciroEsik.genelCiroMin !== null) {
    if (genelCiro !== undefined) {
      const gecti = genelCiro >= ciroEsik.genelCiroMin;
      detaylar.genelCiro = { deger: genelCiro, esik: ciroEsik.genelCiroMin, gecti };
      if (!gecti) {
        gecemedenler.push(
          `Genel ciro: ${genelCiro.toLocaleString("tr-TR")} ₺ < ${ciroEsik.genelCiroMin.toLocaleString("tr-TR")} ₺`
        );
        notlar.push("Son 6 yılın genel ciro ortalaması ile yeniden değerlendirilebilir (Kural 8).");
      }
    }

    if (yapimCiroMax !== undefined && ciroEsik.yapimCiroMin !== null) {
      const gecti = yapimCiroMax >= ciroEsik.yapimCiroMin;
      detaylar.yapimCiro = { deger: yapimCiroMax, esik: ciroEsik.yapimCiroMin, gecti };
      if (gecti && detaylar.genelCiro && !detaylar.genelCiro.gecti) {
        notlar.push(
          `Yapım cirosu Kural 9 ile şartı karşılıyor ` +
          `(${yapimCiroMax.toLocaleString("tr-TR")} ₺ ≥ ${ciroEsik.yapimCiroMin.toLocaleString("tr-TR")} ₺).`
        );
        const idx = gecemedenler.findIndex(g => g.startsWith("Genel ciro"));
        if (idx > -1) gecemedenler.splice(idx, 1);
      } else if (!gecti && detaylar.genelCiro && !detaylar.genelCiro.gecti) {
        gecemedenler.push(
          `Yapım cirosu (Kural 9): ${yapimCiroMax.toLocaleString("tr-TR")} ₺ < ${ciroEsik.yapimCiroMin.toLocaleString("tr-TR")} ₺`
        );
      }
    }
  }

  return {
    grupKodu:      grup,
    uygun:         gecemedenler.length === 0,
    detaylar,
    gecemedenler,
    notlar,
  };
}

// ─────────────────────────────────────────────
// EN YÜKSEK UYGUN GRUBU BUL
// ─────────────────────────────────────────────

export function enYuksekUygunGrupBul(
  isDeneyimiGrubu: GrupKodu,
  oranlar: BilancoOranSonucu,
  genelCiro?: number,
  yapimCiroMax?: number,
): GrupKodu {
  const GRUP_SIRASI: GrupKodu[] = [
    "A","B","B1","C","C1","D","D1","E","E1","F","F1","G","G1","H"
  ];

  const baslangicIdx = GRUP_SIRASI.indexOf(isDeneyimiGrubu);

  for (let i = baslangicIdx; i < GRUP_SIRASI.length; i++) {
    const g = GRUP_SIRASI[i];
    if (!maliYeterlilikGerekliMi(g)) return g;
    const kontrol = maliYeterlilikKontrol(g, oranlar, genelCiro, yapimCiroMax);
    if (kontrol.uygun) return g;
  }

  return "H";
}

// ─────────────────────────────────────────────
// WIZARD MALI YETERLİLİK NOTU
// ─────────────────────────────────────────────

export const WIZARD_MALI_YETERLILIK_NOTU = (grup: GrupKodu): string | null => {
  if (!maliYeterlilikGerekliMi(grup)) return null;

  const ciroVar = ciroSartiVarMi(grup);
  const esik = MALI_YETERLILIK_ESIKLERI[grup];

  const satirlar = [
    `${grup} grubu için mali yeterlilik belgesi (EK-2) gereklidir.`,
    `Cari oran en az ${esik.cariOranMin}, özkaynak oranı en az ${esik.ozKaynakMin} olmalıdır.`,
  ];

  if (ciroVar) {
    satirlar.push(
      `Ayrıca genel ciro en az ${esik.genelCiroMin?.toLocaleString("tr-TR")} ₺, `
      + `yapım cirosu en az ${esik.yapimCiroMin?.toLocaleString("tr-TR")} ₺ olmalıdır.`
    );
  }

  satirlar.push("Bu belgeler sonraki aşamada uzmanlarımız tarafından incelenecektir.");
  return satirlar.join(" ");
};
