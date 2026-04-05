// ============================================================
// lib/evraklar.ts
// Evrak Listesi Üretim Motoru
// Başvurulan gruba, firma tipine, iş deneyimi tipine ve
// hizmet modeline göre dinamik evrak listesi üretir.
// ============================================================

export type GrupKodu = "A"|"B"|"B1"|"C"|"C1"|"D"|"D1"|"E"|"E1"|"F"|"F1"|"G"|"G1"|"H";
export type FirmaTipi = "sahis" | "limited" | "as";
export type IsDeneyimiTipi = "taahhut" | "kat_karsiligi" | "ruhsat_iskan" | "diploma";
export type HizmetModeli = "biz_yapiyoruz" | "musteri_yapiyor";

// ─────────────────────────────────────────────
// BANKA REFERANS MEKTUBU TUTARLARI (EK-3)
// Kaynak: EK-3 Banka Referans Mektubu resmi tablosu
// Minimum tutarlar — oran hesabı değil, tablodaki sabit değerler.
// G1 ve G: diploma başvurularında zorunlu
// F1 ve üzeri: tüm başvurularda zorunlu
// H: gerekmez
// ─────────────────────────────────────────────
export const BANKA_REFERANS_TUTARLARI: Partial<Record<GrupKodu, number>> = {
  "A":  123_825_000.00,
  "B":   86_677_500.00,
  "B1":  74_295_000.00,
  "C":   61_912_500.00,
  "C1":  51_393_750.00,
  "D":   41_275_000.00,
  "D1":  30_956_250.00,
  "E":   20_637_500.00,
  "E1":  12_382_500.00,
  "F":    6_191_250.00,
  "F1":   5_262_562.50,
  "G":    4_333_875.00,
  "G1":   3_095_625.00,
  // H: gerekmez
};

// ─────────────────────────────────────────────
// EVRAK TİPLERİ
// ─────────────────────────────────────────────

export type EvrakId =
  // Kimlik & Firma
  | "mukellefiyet"
  | "imza_beyan_sirkusu"
  | "nufus_cuzdani"
  | "vergi_levhasi"
  | "dilekce"
  | "ticaret_odasi_kaydi"
  // Tüzel kişi
  | "ortaklik_yapisi"
  // Taahhüt / ihale
  | "sozlesme_taahhut"
  | "gecici_kesin_kabul"
  | "son_hakkEdis"
  | "kesif_artis_oluru"
  | "ekap_is_deneyim_taahhut"
  // Kat karşılığı
  | "ruhsat"
  | "iskan"
  | "kat_karsiligi_sozlesme"
  | "ekap_is_deneyim_kat"
  // Diploma
  | "mezuniyet_belgesi"
  // Mali yeterlilik
  | "bilanco_gelir_tablosu"
  | "ek2_formu"
  | "banka_referans_mektubu";

export interface EvrakTanim {
  id:            EvrakId;
  baslik:        string;
  aciklama:      string;
  /** Biz yazıyor/hazırlıyor muyuz? */
  bizHazirlariz: boolean;
  /** Müşteriden ne istiyoruz */
  musteridenNe:  string;
  /** Opsiyonel — koşula bağlı */
  opsiyonel?:    string;
}

export const EVRAK_TANIMLARI: Record<EvrakId, EvrakTanim> = {
  // ── KİMLİK & FİRMA ───────────────────────────────────────
  mukellefiyet: {
    id:            "mukellefiyet",
    baslik:        "Mükellefiyet belgesi",
    aciklama:      "e-Devlet veya vergi dairesinden alınan güncel mükellefiyet belgesi.",
    bizHazirlariz: false,
    musteridenNe:  "e-Devlet'ten e-imzalı PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },
  imza_beyan_sirkusu: {
    id:            "imza_beyan_sirkusu",
    baslik:        "İmza beyannamesi / İmza sirküleri",
    aciklama:      "Şahıslar için imza beyannamesi. Şirketler için imza sirküleri.",
    bizHazirlariz: false,
    musteridenNe:  "e-imzalı PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },
  nufus_cuzdani: {
    id:            "nufus_cuzdani",
    baslik:        "Nüfus cüzdanı fotokopisi",
    aciklama:      "Bazı il müdürlükleri talep eder.",
    bizHazirlariz: false,
    musteridenNe:  "PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
    opsiyonel:     "İl müdürlüğüne göre değişir.",
  },
  vergi_levhasi: {
    id:            "vergi_levhasi",
    baslik:        "Vergi levhası",
    aciklama:      "Bazı il müdürlükleri talep eder.",
    bizHazirlariz: false,
    musteridenNe:  "e-Devlet'ten e-imzalı PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
    opsiyonel:     "İl müdürlüğüne göre değişir.",
  },
  dilekce: {
    id:            "dilekce",
    baslik:        "Dilekçe",
    aciklama:      "Bakanlık formatında başvuru dilekçesi.",
    bizHazirlariz: false,
    musteridenNe:  "Bakanlık formatında hazırlanıp imzalanarak PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },

  // ── TÜZEL KİŞİ ───────────────────────────────────────────
  // Ortaklık yapısı evrak olarak istenmez.
  // Wizard veya dashboard'da form olarak girilir (ad, soyad, TC, pay oranı).
  ortaklik_yapisi: {
    id:            "ortaklik_yapisi",
    baslik:        "Ortaklık bilgileri",
    aciklama:      "Sistem üzerinden form olarak alınır — evrak istenmez.",
    bizHazirlariz: false,
    musteridenNe:  "Wizard veya dashboard'dan girilir.",
  },

  // ── TİCARET ODASI KAYDI ───────────────────────────────────
  // Şahıs şirketleri için zorunlu.
  // Faaliyet konusu inşaat olmalı: 41.00.01 İkamet amaçlı binaların inşaatı
  ticaret_odasi_kaydi: {
    id:            "ticaret_odasi_kaydi",
    baslik:        "Ticaret odası kayıt belgesi",
    aciklama:      "Şahıs şirketleri için ticaret odası kaydı zorunludur. "
      + "Faaliyet konusu inşaat olmalıdır: 41.00.01 İkamet amaçlı binaların inşaatı.",
    bizHazirlariz: false,
    musteridenNe:  "Ticaret odasından güncel kayıt belgesi PDF olarak gönderilmeli. "
      + "Belgede faaliyet kodu 41.00.01 görünmelidir. PDF okunaklı olmalıdır.",
  },

  // ── TAAHHÜT / İHALE İŞLERİ ───────────────────────────────
  sozlesme_taahhut: {
    id:            "sozlesme_taahhut",
    baslik:        "Sözleşme",
    aciklama:      "İhale veya taahhüt işine ait sözleşme.",
    bizHazirlariz: false,
    musteridenNe:  "PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },
  gecici_kesin_kabul: {
    id:            "gecici_kesin_kabul",
    baslik:        "Geçici ve kesin kabul tutanağı",
    aciklama:      "İşin tamamlandığını gösteren tutanaklar.",
    bizHazirlariz: false,
    musteridenNe:  "PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },
  son_hakkEdis: {
    id:            "son_hakkEdis",
    baslik:        "Son hakediş belgesi",
    aciklama:      "İşe ait son hakediş belgesi.",
    bizHazirlariz: false,
    musteridenNe:  "PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },
  kesif_artis_oluru: {
    id:            "kesif_artis_oluru",
    baslik:        "Keşif artış olurları",
    aciklama:      "Varsa keşif artışına ilişkin tüm olurlar.",
    bizHazirlariz: false,
    musteridenNe:  "PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
    opsiyonel:     "Keşif artışı yoksa gerekmez.",
  },
  ekap_is_deneyim_taahhut: {
    id:            "ekap_is_deneyim_taahhut",
    baslik:        "EKAP iş deneyim belgesi",
    aciklama:      "EKAP sistemi üzerinden düzenlenmiş iş deneyim belgesi.",
    bizHazirlariz: false,
    musteridenNe:  "EKAP'tan e-imzalı PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },

  // ── KAT KARŞILIĞI İŞLER ──────────────────────────────────
  ruhsat: {
    id:            "ruhsat",
    baslik:        "Yapı ruhsatı",
    aciklama:      "Belediyeden alınan yapı ruhsatı.",
    bizHazirlariz: false,
    musteridenNe:  "PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },
  iskan: {
    id:            "iskan",
    baslik:        "Yapı kullanma izin belgesi (iskan)",
    aciklama:      "Belediyeden alınan yapı kullanma izin belgesi.",
    bizHazirlariz: false,
    musteridenNe:  "PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
  },
  kat_karsiligi_sozlesme: {
    id:            "kat_karsiligi_sozlesme",
    baslik:        "Kat karşılığı inşaat sözleşmesi",
    aciklama:      "Müteahhit ile arsa sahibi arasındaki kat karşılığı sözleşmesi.",
    bizHazirlariz: false,
    musteridenNe:  "PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
    opsiyonel:     "Müteahhit ve arsa sahibi aynı kişi ise gerekmez.",
  },
  ekap_is_deneyim_kat: {
    id:            "ekap_is_deneyim_kat",
    baslik:        "EKAP iş deneyim belgesi",
    aciklama:      "Kat karşılığı işe ait EKAP iş deneyim belgesi.",
    bizHazirlariz: false,
    musteridenNe:  "EKAP'tan e-imzalı PDF olarak gönderilmeli. PDF okunaklı olmalıdır.",
    opsiyonel:     "Müteahhit ve arsa sahibi aynı kişi ise gerekmez.",
  },

  // ── DİPLOMA ──────────────────────────────────────────────
  mezuniyet_belgesi: {
    id:            "mezuniyet_belgesi",
    baslik:        "Mezuniyet belgesi / Diploma",
    aciklama:      "e-Devlet'ten e-imzalı mezuniyet belgesi (tercih edilir) "
      + "veya diploma aslının noter onaylı nüshası.",
    bizHazirlariz: false,
    musteridenNe:  "e-Devlet'ten e-imzalı PDF (tercih) — "
      + "yoksa diploma aslının noter onaylı nüshası fiziksel olarak teslim edilmeli.",
  },

  // ── MALİ YETERLİLİK ──────────────────────────────────────
  bilanco_gelir_tablosu: {
    id:            "bilanco_gelir_tablosu",
    baslik:        "Bilanço ve gelir tablosu",
    aciklama:      "İnteraktif Vergi Dairesi'nden (ivd.gib.gov.tr) alınan e-imzalı bilanço ve gelir tablosu.",
    bizHazirlariz: false,
    musteridenNe:  "ivd.gib.gov.tr'den e-imzalı PDF olarak indirilip gönderilmeli.",
  },
  ek2_formu: {
    id:            "ek2_formu",
    baslik:        "EK-2 Ekonomik ve Mali Yeterlik Bildirim Formu",
    aciklama:      "Bakanlık EK-2 formu.",
    bizHazirlariz: true,
    musteridenNe:  "Formu biz doldururuz, müşteri imzalar ve YMM/SMMM onayı alır.",
  },
  banka_referans_mektubu: {
    id:            "banka_referans_mektubu",
    baslik:        "Banka referans mektubu",
    aciklama:      "Başvurulan grubun gerektirdiği asgari tutarda banka referans mektubu. "
      + "Banka tarafından Takasbank sistemine yüklenmesi zorunludur.",
    bizHazirlariz: false,
    musteridenNe:  "Bankadan grup için gereken tutarda referans mektubu alınmalı. "
      + "Banka Takasbank'a yüklediğine dair belge de getirilmeli.",
  },
};

// ─────────────────────────────────────────────
// EVRAK LİSTESİ ÜRETİCİ
// ─────────────────────────────────────────────

export interface EvrakListesiGirdisi {
  grup:              GrupKodu;
  firmaTipi:         FirmaTipi;
  isDeneyimiTipleri: IsDeneyimiTipi[];  // birden fazla iş olabilir
  hizmetModeli:      HizmetModeli;
  /** Müteahhit = arsa sahibi mi? (kat karşılığı bazı evrakları düşürür) */
  muteahhitArsaSahibiAyni?: boolean;
  /** Diploma ile tüzel kişide %51 hisse koşulunu karşılıyor mu? */
  tuzelKisiDiplomaVeyaSahsaAitIs?: boolean;
}

export interface EvrakListesiSatiri {
  evrak:       EvrakTanim;
  zorunlu:     boolean;
  bizYapariz:  boolean;
  not?:        string;
  /** Banka referansı için grup tutarı */
  tutar?:      number;
}

export interface EvrakListesiSonucu {
  grup:    string;
  gruplar: {
    baslik:    string;
    evraklar:  EvrakListesiSatiri[];
  }[];
  toplamZorunlu: number;
  toplamOpsiyonel: number;
  bizYaptiklarimizdanOnce: string[];  // müşteriye söylememiz gerekenler
}

/**
 * Verilen parametrelere göre tam evrak listesi üretir.
 * Rapor onaylandıktan sonra çağrılır.
 */
export function evrakListesiUret(girdi: EvrakListesiGirdisi): EvrakListesiSonucu {
  const {
    grup, firmaTipi, isDeneyimiTipleri,
    hizmetModeli, muteahhitArsaSahibiAyni,
    tuzelKisiDiplomaVeyaSahsaAitIs,
  } = girdi;

  const bizYapiyoruz = hizmetModeli === "biz_yapiyoruz";
  const tuzel        = firmaTipi === "limited" || firmaTipi === "as";
  const f1Uzeri      = !["G", "G1", "H"].includes(grup) &&
                       !["F", "F1"].includes(grup) === false
                       ? ["F","F1","E1","E","D1","D","C1","C","B1","B","A"].includes(grup)
                       : false;
  const maliSart     = !["G","G1","H"].includes(grup);

  // ── 1. KİMLİK & FİRMA (hep) ──────────────────────────────
  const kimlikEvraklar: EvrakListesiSatiri[] = [];

  kimlikEvraklar.push({
    evrak: EVRAK_TANIMLARI.mukellefiyet,
    zorunlu: true,
    bizYapariz: false,
  });

  kimlikEvraklar.push({
    evrak: EVRAK_TANIMLARI.imza_beyan_sirkusu,
    zorunlu: true,
    bizYapariz: false,
    not: tuzel ? "Şirket imza sirküleri (e-imzalı PDF)" : "Şahıs imza beyannamesi (e-imzalı PDF)",
  });

  // Ticaret odası kaydı: şahıs şirketleri için zorunlu
  // Faaliyet kodu 41.00.01 İkamet amaçlı binaların inşaatı görünmeli
  // Biz başvuru yapıyorsak evrak olarak istenmez — sadece bilgi notu gösterilir
  if (!tuzel) {
    kimlikEvraklar.push({
      evrak: EVRAK_TANIMLARI.ticaret_odasi_kaydi,
      zorunlu: !bizYapiyoruz,   // biz yapıyorsak zorunlu değil (evrak istenmez)
      bizYapariz: bizYapiyoruz, // biz yapıyorsak biz kontrol ediyoruz
      not: bizYapiyoruz
        ? "Ticaret odası kaydı zorunludur — faaliyet kodu 41.00.01 (İkamet amaçlı binaların inşaatı) olmalıdır. Biz kontrol ediyoruz."
        : "Ticaret odasından güncel kayıt belgesi — faaliyet kodu 41.00.01 (İkamet amaçlı binaların inşaatı) belgede görünmeli. PDF okunaklı olmalıdır.",
    });
  }

  if (bizYapiyoruz) {
    // Nüfus cüzdanı, vergi levhası, dilekçe: biz başvuru yapıyorsak
    // zaten bizde mevcut veya biz hazırlıyoruz — müşteriden istenmez, listede gösterilmez.
  } else {
    // Müşteri başvuru yapıyorsa bu belgeler gerekebilir
    kimlikEvraklar.push({
      evrak: EVRAK_TANIMLARI.nufus_cuzdani,
      zorunlu: false,
      bizYapariz: false,
      not: "İl müdürlüğüne göre gerekebilir",
    });
    kimlikEvraklar.push({
      evrak: EVRAK_TANIMLARI.vergi_levhasi,
      zorunlu: false,
      bizYapariz: false,
      not: "İl müdürlüğüne göre gerekebilir",
    });
    kimlikEvraklar.push({
      evrak: EVRAK_TANIMLARI.dilekce,
      zorunlu: true,
      bizYapariz: false,
      not: "Bakanlık formatında dilekçe hazırlanmalı",
    });
  }

  // ── 2. TÜZEL KİŞİ BİLGİLERİ ─────────────────────────────────
  // Ortaklık yapısı (TC, hisse oranı, müdür/temsilci) evrak olarak istenmez.
  // Wizard veya dashboard'da form aracılığıyla elle girilir.
  // Bu bilgiler sistem tarafından tutulur, gerekirse dilekçe/başvuru formuna yansıtılır.
  // → SirketBilgisi interface'i ve sirketBilgisiGerekliMi() fonksiyonu bunu yönetir.
  const tuzelEvraklar: EvrakListesiSatiri[] = [];

  // ── 3. İŞ DENEYİMİ BELGELERİ ────────────────────────────
  const isEvraklar: EvrakListesiSatiri[] = [];

  if (isDeneyimiTipleri.includes("taahhut")) {
    isEvraklar.push(
      { evrak: EVRAK_TANIMLARI.sozlesme_taahhut,       zorunlu: true,  bizYapariz: false },
      { evrak: EVRAK_TANIMLARI.gecici_kesin_kabul,      zorunlu: true,  bizYapariz: false },
      { evrak: EVRAK_TANIMLARI.son_hakkEdis,            zorunlu: true,  bizYapariz: false },
      { evrak: EVRAK_TANIMLARI.kesif_artis_oluru,       zorunlu: false, bizYapariz: false, not: "Varsa getirilmeli" },
      { evrak: EVRAK_TANIMLARI.ekap_is_deneyim_taahhut, zorunlu: true,  bizYapariz: false },
    );
  }

  if (isDeneyimiTipleri.includes("kat_karsiligi")) {
    isEvraklar.push(
      { evrak: EVRAK_TANIMLARI.ruhsat, zorunlu: true, bizYapariz: false },
      { evrak: EVRAK_TANIMLARI.iskan,  zorunlu: true, bizYapariz: false },
    );
    if (!muteahhitArsaSahibiAyni) {
      isEvraklar.push(
        { evrak: EVRAK_TANIMLARI.kat_karsiligi_sozlesme, zorunlu: true, bizYapariz: false },
        { evrak: EVRAK_TANIMLARI.ekap_is_deneyim_kat,    zorunlu: true, bizYapariz: false },
      );
    } else {
      isEvraklar.push(
        {
          evrak:      EVRAK_TANIMLARI.kat_karsiligi_sozlesme,
          zorunlu:    false,
          bizYapariz: false,
          not:        "Müteahhit = arsa sahibi olduğundan gerekmez",
        },
        {
          evrak:      EVRAK_TANIMLARI.ekap_is_deneyim_kat,
          zorunlu:    false,
          bizYapariz: false,
          not:        "Müteahhit = arsa sahibi olduğundan gerekmez",
        },
      );
    }
  }

  if (isDeneyimiTipleri.includes("ruhsat_iskan")) {
    isEvraklar.push(
      { evrak: EVRAK_TANIMLARI.ruhsat, zorunlu: true, bizYapariz: false },
      { evrak: EVRAK_TANIMLARI.iskan,  zorunlu: true, bizYapariz: false },
    );
  }

  // ── 4. DİPLOMA ───────────────────────────────────────────
  const diplomaEvraklar: EvrakListesiSatiri[] = [];

  if (isDeneyimiTipleri.includes("diploma")) {
    diplomaEvraklar.push({
      evrak:      EVRAK_TANIMLARI.mezuniyet_belgesi,
      zorunlu:    true,
      bizYapariz: false,
      not:        "e-Devlet e-imzalı (tercih edilir) veya diploma aslının noter onaylı nüshası",
    });
  }

  // ── 5. MALİ YETERLİLİK ───────────────────────────────────
  // Kural (diploma dahil tüm başvurularda aynı):
  //   G1, G (diploma ile): sadece banka referans mektubu
  //   F1 ve üzeri (her başvuru türü): bilanço + EK-2 + banka referans mektubu
  //   H: hiçbiri gerekmez
  const maliEvraklar: EvrakListesiSatiri[] = [];
  const bankaTutari = BANKA_REFERANS_TUTARLARI[grup as keyof typeof BANKA_REFERANS_TUTARLARI];

  // Bilanço + EK-2: sadece F1 ve üzeri gruplar (G, G1, H hariç)
  if (maliSart) {
    maliEvraklar.push({
      evrak:      EVRAK_TANIMLARI.bilanco_gelir_tablosu,
      zorunlu:    true,
      bizYapariz: false,
      not:        "ivd.gib.gov.tr'den e-imzalı indirilmeli — YMM/SMMM onaylı da kabul edilir",
    });

    // EK-2: biz yapıyorsak biz yazarız, listede gösterilmez
    if (!bizYapiyoruz) {
      maliEvraklar.push({
        evrak:      EVRAK_TANIMLARI.ek2_formu,
        zorunlu:    true,
        bizYapariz: false,
        not:        "YMM/SMMM ile birlikte doldurulup imzalanmalı",
      });
    }
  }

  // Banka referans mektubu:
  //   G1, G diploma başvurularında zorunlu
  //   F1 ve üzeri tüm başvurularda zorunlu
  //   H grubunda gerekmez
  if (bankaTutari) {
    maliEvraklar.push({
      evrak:      EVRAK_TANIMLARI.banka_referans_mektubu,
      zorunlu:    true,
      bizYapariz: false,
      tutar:      bankaTutari,
      not:        `${grup} grubu için asgari tutar: ${bankaTutari.toLocaleString("tr-TR")} ₺ — `
        + `banka tarafından Takasbank sistemine yüklenmesi zorunludur.`,
    });
  }

  // ── SONUÇ ─────────────────────────────────────────────────
  const tumEvraklar = [
    ...kimlikEvraklar,
    ...tuzelEvraklar,
    ...isEvraklar,
    ...diplomaEvraklar,
    ...maliEvraklar,
  ];

  const gruplar = [
    { baslik: "Kimlik ve firma belgeleri",         evraklar: kimlikEvraklar  },
    tuzel && tuzelEvraklar.length > 0
      ? { baslik: "Tüzel kişi belgeleri",          evraklar: tuzelEvraklar   }
      : null,
    isEvraklar.length > 0
      ? { baslik: "İş deneyimi belgeleri",         evraklar: isEvraklar      }
      : null,
    diplomaEvraklar.length > 0
      ? { baslik: "Diploma ve mezuniyet",           evraklar: diplomaEvraklar }
      : null,
    maliEvraklar.length > 0
      ? { baslik: "Mali yeterlilik (EK-2)",         evraklar: maliEvraklar    }
      : null,
  ].filter(Boolean) as { baslik: string; evraklar: EvrakListesiSatiri[] }[];

  const bizlerden: string[] = [];
  if (bizYapiyoruz) {
    bizlerden.push("Dilekçeyi biz yazarız.");
    if (maliSart) bizlerden.push("EK-2 formunu biz doldururuz.");
  }

  return {
    grup,
    gruplar,
    toplamZorunlu:    tumEvraklar.filter(e => e.zorunlu).length,
    toplamOpsiyonel:  tumEvraklar.filter(e => !e.zorunlu).length,
    bizYaptiklarimdanOnce: bizlerden,
  };
}

// ─────────────────────────────────────────────
// ŞİRKET BİLGİLERİ — WIZARD / DASHBOARD SORUSU
// Diploma veya şahsa ait iş deneyimi kullanan
// tüzel kişilerde zorunlu
// ─────────────────────────────────────────────

export interface OrtagBilgisi {
  adSoyad:     string;
  tcKimlikNo:  string;
  hisseOrani:  number;  // 0-100
}

export interface SirketBilgisi {
  unvan:           string;
  vergiNo:         string;
  ortaklar:        OrtagBilgisi[];
  mudurTemsilci:   string;  // şirket müdürü veya yetkili temsilcisi adı
  mudurTcNo:       string;
}

/**
 * Ortaklık yapısı ve şirket müdürü bilgilerinin
 * wizard veya dashboard'da ne zaman sorulacağını belirler.
 *
 * Kural: Diploma veya şahsa ait iş deneyimi kullanan
 * tüzel kişilerde zorunlu. Aksi hâlde opsiyonel.
 */
export function sirketBilgisiGerekliMi(
  firmaTipi:    FirmaTipi,
  isDeneyimiTipleri: IsDeneyimiTipi[],
): { zorunlu: boolean; neden: string } {
  if (firmaTipi === "sahis") {
    return { zorunlu: false, neden: "Şahıs firmasında ortaklık bilgisi gerekmez." };
  }

  const diplomaVar     = isDeneyimiTipleri.includes("diploma");
  const sahsaAitIsVar  = isDeneyimiTipleri.some(t =>
    ["taahhut", "kat_karsiligi", "ruhsat_iskan"].includes(t)
  );

  if (diplomaVar || sahsaAitIsVar) {
    return {
      zorunlu: true,
      neden:   diplomaVar
        ? "Diploma ile başvuruda tüzel kişinin ortaklık yapısı zorunludur."
        : "Şahsa ait iş deneyimi kullanan tüzel kişide ortaklık yapısı zorunludur.",
    };
  }

  return {
    zorunlu: false,
    neden:   "Bu başvuru tipinde ortaklık yapısı opsiyoneldir.",
  };
}
