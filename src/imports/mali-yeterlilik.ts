// ============================================================
// lib/mali-yeterlilik.ts
// EK-2 Ekonomik ve Mali Yeterlik Bildirim Formu
// Kaynak: Yapı Müteahhitlerinin Sınıflandırılması Yönetmeliği Madde 12
// ============================================================
//
// KAPSAM:
//   F1 ve üzeri gruplar bilanço oranı gerektirir.
//   E1 ve üzeri gruplar ek olarak ciro şartı gerektirir.
//   G, G1, H: mali yeterlilik şartı YOK.
//
// WIZARD'DA MI, İKİNCİ AŞAMADA MI?
//   → Bkz. dosya sonu: WIZARD_KARAR_NOTU
// ============================================================

export type GrupKodu = "A"|"B"|"B1"|"C"|"C1"|"D"|"D1"|"E"|"E1"|"F"|"F1"|"G"|"G1"|"H";

// ─────────────────────────────────────────────
// GRUP BAŞINA MALİ YETERLİLİK EŞİKLERİ
// Kaynak: muteahhitlik-data.ts bilanço verileri
// ─────────────────────────────────────────────

export interface MaliYeterlilikEsik {
  /** Minimum cari oran (Dönen Varlıklar / Kısa Vadeli Borçlar) */
  cariOranMin:    number | null;
  /** Minimum özkaynak oranı (Özkaynaklar / Toplam Aktif) */
  ozKaynakMin:    number | null;
  /** Maksimum borç oranı (Kısa Vadeli Banka Borçları / Özkaynaklar) */
  borcOranMax:    number | null;
  /** Minimum genel ciro (TL) */
  genelCiroMin:   number | null;
  /** Minimum yapım cirosu (TL) */
  yapimCiroMin:   number | null;
}

export const MALI_YETERLILIK_ESIKLERI: Record<GrupKodu, MaliYeterlilikEsik> = {
  // D1 ve üzeri: asgari iş deneyim tutarının %15'i
  A:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:371_475_000,  yapimCiroMin:297_180_000  },
  B:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:260_032_500,  yapimCiroMin:208_026_000  },
  B1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:222_885_000,  yapimCiroMin:178_308_000  },
  C:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:185_737_500,  yapimCiroMin:148_590_000  },
  C1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:154_781_250,  yapimCiroMin:123_825_000  },
  D:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:123_825_000,  yapimCiroMin:99_060_000   },
  D1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:92_868_750,   yapimCiroMin:74_295_000   },
  // E ve E1: asgari iş deneyim tutarının %10'u
  E:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:41_275_000,   yapimCiroMin:33_020_000   },
  E1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:24_765_000,   yapimCiroMin:19_812_000   },
  // F ve F1: bilanço oranı şartı var, ciro şartı YOK
  F:  { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:null,          yapimCiroMin:null         },
  F1: { cariOranMin:0.75, ozKaynakMin:0.15, borcOranMax:0.75, genelCiroMin:null,          yapimCiroMin:null         },
  // G, G1, H: mali yeterlilik şartı YOK
  G:  { cariOranMin:null, ozKaynakMin:null,  borcOranMax:null, genelCiroMin:null,          yapimCiroMin:null         },
  G1: { cariOranMin:null, ozKaynakMin:null,  borcOranMax:null, genelCiroMin:null,          yapimCiroMin:null         },
  H:  { cariOranMin:null, ozKaynakMin:null,  borcOranMax:null, genelCiroMin:null,          yapimCiroMin:null         },
};

// ─────────────────────────────────────────────
// CİRO EŞİĞİ HESAPLAMA
// Mevzuat: E ve E1 → %10, diğerleri → %15
// Yapım cirosu alternatifi: son 3 yılda herhangi birinde %80'i sağlamak yeterli
// ─────────────────────────────────────────────

const ASGARI_IS_DENEYIM: Record<GrupKodu, number> = {
  A:  2_476_500_000, B:  1_733_550_000, B1: 1_485_900_000,
  C:  1_238_250_000, C1: 1_031_875_000, D:    825_500_000,
  D1:   619_125_000, E:    412_750_000, E1:   247_650_000,
  F:    123_825_000, F1:   105_251_250,
  G:             0,  G1:            0,  H:              0,
};

/**
 * Grup için ciro eşiklerini döndürür.
 * E ve E1: %10, diğerleri (D1+): %15
 * Yapım cirosu: genel ciro eşiğinin %80'i (Kural 9)
 */
export function ciroEsikHesapla(grup: GrupKodu): {
  oran:         number;        // 0.10 veya 0.15
  genelCiroMin: number | null;
  yapimCiroMin: number | null; // genel × 0.80 (Kural 9)
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

/** Grup için mali yeterlilik şartı var mı? */
export function maliYeterlilikGerekliMi(grup: GrupKodu): boolean {
  const e = MALI_YETERLILIK_ESIKLERI[grup];
  return e.cariOranMin !== null || e.genelCiroMin !== null;
}

/** Grup için sadece bilanço oranı mı, yoksa ciro da gerekiyor mu? */
export function ciroSartiVarMi(grup: GrupKodu): boolean {
  return MALI_YETERLILIK_ESIKLERI[grup].genelCiroMin !== null;
}

// ─────────────────────────────────────────────
// BİLANÇO ORANI HESAPLAMA
// Kural 4 & 5: Yıllara yaygın düzeltmeler zorunlu
// ─────────────────────────────────────────────

export interface BilancoGirdisi {
  donenVarliklar:           number;
  kisaVadeliBorclar:        number;
  toplamAktif:              number;
  ozkaynaklar:              number;
  kisaVadeliBankaBorclari:  number;
  // Kural 4 & 5: Yıllara yaygın inşaat kalemleri
  yillaraYayginMaliyet?:    number;  // dönen varlıklardan düşülür, aktiften de düşülür
  yillaraYayginHakEdis?:    number;  // kısa vadeli borçlardan düşülür
}

export interface BilancoOranSonucu {
  cariOran:    number;
  ozKaynakOrani: number;
  borcOrani:   number;
  // Ham değerler (düzeltme öncesi)
  ham: {
    cariOran:      number;
    ozKaynakOrani: number;
    borcOrani:     number;
  };
}

/**
 * Bilanço oranlarını hesaplar.
 * Kural 4: Cari oran = (Dönen Varlıklar - YY Maliyet) / (KV Borçlar - YY HakEdiş)
 * Kural 5: Özkaynak = Özkaynaklar / (Toplam Aktif - YY Maliyet)
 * Kural 7: Yuvarlama YAPILMAZ.
 */
export function bilancoOranlariHesapla(b: BilancoGirdisi): BilancoOranSonucu {
  const yyM = b.yillaraYayginMaliyet  ?? 0;
  const yyH = b.yillaraYayginHakEdis  ?? 0;

  // Ham oranlar (düzeltme olmadan)
  const hamCari    = b.donenVarliklar  / b.kisaVadeliBorclar;
  const hamOz      = b.ozkaynaklar     / b.toplamAktif;
  const hamBorc    = b.kisaVadeliBankaBorclari / b.ozkaynaklar;

  // Düzeltilmiş oranlar (Kural 4 & 5)
  const duzCari    = (b.donenVarliklar - yyM) / (b.kisaVadeliBorclar - yyH);
  const duzOz      = b.ozkaynaklar / (b.toplamAktif - yyM);
  const duzBorc    = b.kisaVadeliBankaBorclari / b.ozkaynaklar; // borç oranında düzeltme yok

  return {
    cariOran:      duzCari,    // Kural 7: yuvarlama yok
    ozKaynakOrani: duzOz,
    borcOrani:     duzBorc,
    ham: { cariOran: hamCari, ozKaynakOrani: hamOz, borcOrani: hamBorc },
  };
}

// ─────────────────────────────────────────────
// HANGİ YILIN BİLANÇOSU SUNULACAK?
// Kural 1, 2, 3 ve başvuru ayı istisnası
// ─────────────────────────────────────────────

export interface BilancoYilKurali {
  /** Öncelikli sunulması gereken yıllar (sırayla dene) */
  oncelikliYillar:  number[];
  /** Ortalama alınabilecek yıl grupları */
  ortalamaSecenekleri: number[][];
  /** Açıklama */
  aciklama: string;
}

/**
 * Başvuru tarihine göre hangi yılın/yılların bilançosunun
 * sunulabileceğini döndürür.
 *
 * Kural 1: Önceki yıl
 * Kural 2: Önceki yıl yetmezse son 3 yıl ortalaması
 * Kural 3: Başvuru Ocak-Nisan arasındaysa 2 önceki yıl da sunulabilir
 */
export function bilancoYilKuraliGetir(basvuruTarihi: string): BilancoYilKurali {
  const bas  = new Date(basvuruTarihi);
  const yil  = bas.getFullYear();
  const ay   = bas.getMonth() + 1; // 1-12
  const ilkDortAy = ay <= 4;

  if (ilkDortAy) {
    // Kural 3: Ocak-Nisan başvurusu
    // Önce: 2 önceki yıl (yil-2)
    // Yetmezse: yil-2, yil-3 ortalaması
    // Yetmezse: yil-2, yil-3, yil-4 ortalaması
    return {
      oncelikliYillar: [yil - 1, yil - 2],
      ortalamaSecenekleri: [
        [yil - 1, yil - 2, yil - 3],       // Kural 2: son 3 yıl
        [yil - 2, yil - 3],                // Kural 3: 2 önceki + 3 önceki
        [yil - 2, yil - 3, yil - 4],       // Kural 3: 2-3-4 önceki ortalama
      ],
      aciklama: `Başvuru ${ay}. ayda (ilk 4 ay). Önce ${yil-1}, yetmezse ${yil-2} yılı, `
        + `yetmezse son 3 yıl ortalaması, yetmezse ${yil-2}/${yil-3}/${yil-4} ortalaması.`,
    };
  }

  // Kural 1 & 2: Normal başvuru
  return {
    oncelikliYillar: [yil - 1],
    ortalamaSecenekleri: [
      [yil - 1, yil - 2, yil - 3],  // Kural 2: son 3 yıl ortalaması
    ],
    aciklama: `Önce ${yil-1} yılı bilançosu. Yetmezse ${yil-1}/${yil-2}/${yil-3} yılları ortalaması.`,
  };
}

// ─────────────────────────────────────────────
// İŞ HACMİ (CİRO) YILI KURALI
// Kural 8 & 9
// ─────────────────────────────────────────────

export function ciroYilKuraliGetir(basvuruTarihi: string): {
  oncelikliYil:    number;
  ortalamaYillar:  number[];  // son 6 yıla kadar ortalama alınabilir
  alternatifKural: string;    // Kural 9 açıklaması
} {
  const yil = new Date(basvuruTarihi).getFullYear();
  return {
    oncelikliYil: yil - 1,
    ortalamaYillar: [yil-1, yil-2, yil-3, yil-4, yil-5, yil-6],
    alternatifKural: `YMM/SMMM onaylı yapım ciro tablosu ile son 3 yıldan herhangi birinde `
      + `ciro şartını sağlamak yeterlidir (Kural 9).`,
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
  gecemedenler: string[];  // Hangi kriterler karşılanmadı
  notlar:       string[];  // Alternatif yol önerileri
}

/**
 * Verilen bilanço ve ciro değerleri için grup şartlarını kontrol eder.
 *
 * BİLANÇO KURALLARI (üçü birlikte sağlanmalı):
 *   1. Cari oran ≥ 0.75  (YY maliyet/hakediş düzeltmeli)
 *   2. Özkaynak oranı ≥ 0.15  (YY maliyet düzeltmeli)
 *   3. KV banka borçları / özkaynaklar ≤ 0.75
 *   Kural 7: Yuvarlama YAPILMAZ
 *
 * CİRO KURALLARI (E1+):
 *   Ana yol: Önceki yıl genel ciro ≥ asgari iş deneyimi × %10 veya %15
 *   Alternatif A: Son 6 yılın genel ciro ortalaması eşiği sağlıyorsa geçer (Kural 8)
 *   Alternatif B: Son 3 yılda herhangi birinde yapım cirosu ≥ genel ciro eşiği × %80 (Kural 9)
 *
 * @param grup          Başvurulan grup kodu
 * @param oranlar       Hesaplanmış bilanço oranları
 * @param genelCiro     Önceki yıl genel ciro (veya ortalama)
 * @param yapimCiroMax  Son 3 yılın en yüksek yapım cirosu (Kural 9 için)
 */
export function maliYeterlilikKontrol(
  grup: GrupKodu,
  oranlar: BilancoOranSonucu,
  genelCiro?: number,
  yapimCiroMax?: number,  // son 3 yılın en yüksek yapım cirosu (Kural 9)
): MaliKontrolSonucu {
  const esik = MALI_YETERLILIK_ESIKLERI[grup];
  const ciroEsik = ciroEsikHesapla(grup);
  const gecemedenler: string[] = [];
  const notlar: string[] = [];
  const detaylar: MaliKontrolSonucu["detaylar"] = {};

  // ── BİLANÇO ORANLARI (Kural 7: yuvarlama yok) ──
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

  // ── CİRO ŞARTLARI (E1 ve üzeri) ──
  if (ciroEsik.genelCiroMin !== null) {

    // Genel ciro kontrolü
    if (genelCiro !== undefined) {
      const gecti = genelCiro >= ciroEsik.genelCiroMin;
      detaylar.genelCiro = { deger: genelCiro, esik: ciroEsik.genelCiroMin, gecti };
      if (!gecti) {
        gecemedenler.push(
          `Genel ciro: ${genelCiro.toLocaleString("tr-TR")} ₺ < ${ciroEsik.genelCiroMin.toLocaleString("tr-TR")} ₺ (${grup} için %${ciroEsik.oran * 100})`
        );
        notlar.push("Son 6 yılın genel ciro ortalaması ile yeniden değerlendirilebilir (Kural 8).");
      }
    }

    // Yapım cirosu alternatifi — Kural 9
    // Son 3 yılda herhangi birinde genel ciro eşiğinin %80'ini sağlamak yeterli
    if (yapimCiroMax !== undefined && ciroEsik.yapimCiroMin !== null) {
      const gecti = yapimCiroMax >= ciroEsik.yapimCiroMin;
      detaylar.yapimCiro = { deger: yapimCiroMax, esik: ciroEsik.yapimCiroMin, gecti };
      if (gecti && detaylar.genelCiro && !detaylar.genelCiro.gecti) {
        // Genel ciro tutmasa da yapım cirosu Kural 9 ile kurtarıyor
        notlar.push(
          `Yapım cirosu Kural 9 ile şartı karşılıyor ` +
          `(${yapimCiroMax.toLocaleString("tr-TR")} ₺ ≥ ${ciroEsik.yapimCiroMin.toLocaleString("tr-TR")} ₺).`
        );
        // Ciro geçemedi listesinden çıkar — Kural 9 karşıladı
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
// Bilanço tutmuyorsa müşteriye alternatif göster
// ─────────────────────────────────────────────

/**
 * İş deneyimi grubundan başlayarak aşağı inerek
 * mali yeterliliği sağlayabileceği en yüksek grubu bulur.
 *
 * Dashboard'da: "Alabileceğiniz en yüksek grup X'tir" mesajı için.
 */
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
    if (!maliYeterlilikGerekliMi(g)) return g; // G/G1/H — direkt geçer
    const kontrol = maliYeterlilikKontrol(g, oranlar, genelCiro, yapimCiroMax);
    if (kontrol.uygun) return g;
  }

  return "H"; // en kötü durum
}

// ─────────────────────────────────────────────
// WIZARD KARAR NOTU
// Mali yeterlilik wizard'da mı, ikinci aşamada mı?
// ─────────────────────────────────────────────

/**
 * KARAR: Mali yeterlilik wizard'da DEĞİL, ikinci aşamada incelenmeli.
 *
 * GEREKÇE:
 *
 * 1. Wizard'ın amacı "hangi gruba başvurabilirsiniz?" sorusunu yanıtlamak.
 *    Mali yeterlilik ise "bu gruba başvururken hangi belgeleri hazırlamalısınız?"
 *    sorusuna ait — farklı bir aşama.
 *
 * 2. Karmaşıklık: Bilanço oranları 3 farklı hesap dönemi kuralına,
 *    YY maliyeti/hakediş düzeltmelerine, ciro için 6 yıllık ortalama
 *    seçeneklerine sahip. Bunu wizard'a sokmak kullanıcıyı bunaltır.
 *
 * 3. Bilgi hazırlığı: Kullanıcı wizardı doldururken bilanço rakamlarını
 *    genellikle yanında taşımaz. Mali yeterlilik için muhasebecisiyle
 *    görüşmesi gerekir.
 *
 * 4. Bakanlık teyidi: Kural 10'a göre bilanço ve ciro bilgileri
 *    Bakanlıkça elektronik ortamda teyid edilecek — bu zaten ikinci aşama.
 *
 * ÖNERİLEN AKIŞ:
 *   Wizard → Grup tespiti (iş deneyimi/diploma)
 *   ↓
 *   Ödeme & Hizmet seçimi
 *   ↓
 *   İkinci aşama: Admin + Müşteri birlikte
 *     → Hangi yılın bilançosu sunulacak? (Kural 1/2/3)
 *     → Bilanço rakamlarını gir → Oranlar otomatik hesaplanır
 *     → Ciro şartı varsa gir → Kural 8/9 alternatifleri önerilir
 *     → Eksik varsa hangi alternatif yola gidileceği belirlenir
 *
 * WIZARD'DA YAPILACAK TEK ŞEY:
 *   Hedef grup belirlendikten sonra şu bilgi notu gösterilir:
 *   "[F1/E/E1/...] grubu için mali yeterlilik belgesi gereklidir.
 *    Bilanço oranları ve ciro şartının sağlanıp sağlanmadığı
 *    sonraki aşamada uzmanlarımız tarafından incelenecektir."
 */
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
