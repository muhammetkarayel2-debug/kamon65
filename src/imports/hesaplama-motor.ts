// ══════════════════════════════════════════════════════════════════
// hesaplama-motor.ts  —  Müteahhitlik İş Deneyimi Hesaplama Motoru
// 3 yöntem: Son5Yıl Toplam · Son15Yıl En Büyük × 2 · Diploma
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

// ─── Yapı Birim Maliyetleri ───────────────────────────────────────
// Roman format: "III.B", "III.C", "IV.A", ...
export const BM: Record<string, Record<string, number>> = {
  "2026":  {"III.B":21050,"III.C":23400,"IV.A":26450,"IV.B":33900,"IV.C":40500,"V.A":42350},
  "2025":  {"III.B":18200,"III.C":19150,"IV.A":21500,"IV.B":27500,"IV.C":32600,"V.A":34500},
  "2024":  {"III.B":14400,"III.C":15100,"IV.A":15600,"IV.B":18200,"IV.C":21500,"V.A":22750},
  "2023-2":{"III.B":9600,"IV.A":10100,"IV.B":11900,"V.A":15200},
  "2023-1":{"III.B":6350,"IV.A":6850,"IV.B":7800,"V.A":10400},
  "2022-3":{"III.B":5250},
  "2022-2":{"III.B":3850},
  "2022-1":{"III.B":2800,"IV.A":3050,"IV.B":3450,"V.A":4500},
  "2021":  {"III.B":1450,"IV.A":1550,"IV.B":1800,"V.A":2350},
  "2020":  {"III.B":1130,"IV.A":1210,"IV.B":1400,"V.A":1850},
  "2019":  {"III.B":980,"IV.A":1070,"IV.B":1230,"V.A":1630},
  "2018":  {"III.B":800,"IV.A":860,"IV.B":980,"V.A":1300},
  "2017":  {"III.B":838,"IV.A":880,"IV.B":1005,"V.A":1340},
  "2016":  {"III.B":630,"IV.A":680,"IV.B":775,"V.A":1030},
  "2015":  {"III.B":565,"IV.A":610,"IV.B":695,"V.A":925},
  "2014":  {"III.B":650,"IV.A":700,"IV.B":800,"V.A":1150},
  "2013":  {"III.B":460,"IV.A":500,"IV.B":570,"V.A":755},
  "2012":  {"III.B":435,"IV.A":470,"IV.B":535,"V.A":710},
  "2011":  {"III.B":400,"IV.A":435,"IV.B":495,"V.A":655},
  "2010":  {"III.B":360,"IV.A":400,"IV.B":450,"V.A":600},
};

// ─── Sınıf sıra tablosu ───────────────────────────────────────────
export const SINIF_SIRA: Record<string,number> = {
  "III.B":1,"III.C":2,"IV.A":3,"IV.B":4,"IV.C":5,"V.A":6,"V.B":7,"V.C":8,"V.D":9
};

// ─── Grup eşikleri (2026) ─────────────────────────────────────────
export const GRUP_ESIKLER: Array<{grup:string; min:number}> = [
  {grup:"A",  min:2_476_500_000},
  {grup:"B",  min:1_733_550_000},
  {grup:"B1", min:1_485_900_000},
  {grup:"C",  min:1_238_250_000},
  {grup:"C1", min:  990_600_000},
  {grup:"D",  min:  743_325_000},
  {grup:"D1", min:  618_750_000},
  {grup:"E",  min:  495_000_000},
  {grup:"E1", min:  371_475_000},
  {grup:"F",  min:  247_650_000},
  {grup:"F1", min:  185_737_500},
  {grup:"G",  min:  123_825_000},
  {grup:"G1", min:   61_912_500},
  {grup:"H",  min:            0},
];

// ─── Yıla göre mevcut sınıflar ────────────────────────────────────
const YILDA_SINIFLAR: Record<number, string[]> = {
  2010:["III.B","IV.A","IV.B","V.A"],
  2011:["III.B","IV.A","IV.B","V.A"],
  2012:["III.B","IV.A","IV.B","V.A"],
  2013:["III.B","IV.A","IV.B","V.A"],
  2014:["III.B","IV.A","IV.B","V.A"],
  2015:["III.B","IV.A","IV.B","V.A"],
  2016:["III.B","IV.A","IV.B","V.A"],
  2017:["III.B","IV.A","IV.B","V.A"],
  2018:["III.B","IV.A","IV.B","V.A"],
  2019:["III.B","IV.A","IV.B","V.A"],
  2020:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2021:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2022:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2023:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2024:["III.B","III.C","IV.A","IV.B","IV.C","V.A"],
  2025:["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"],
  2026:["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"],
};

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────
export function donemBul(tarih: string): string {
  const d=new Date(tarih); const y=d.getFullYear(); const m=d.getMonth()+1;
  if(y>=2026) return "2026"; if(y===2025) return "2025"; if(y===2024) return "2024";
  if(y===2023) return m>=7?"2023-2":"2023-1";
  if(y===2022) return m>=9?"2022-3":m>=5?"2022-2":"2022-1";
  if(y>=2010) return String(y); return "2010";
}

export function ufeEndeksi(tarih: string): number {
  const d=new Date(tarih); let y=d.getFullYear(); let m=d.getMonth()-1;
  if(m<0){m=11;y--;}
  const arr=UFE[String(y)]; if(!arr) return UFE["2010"][0];
  return arr[m]??arr[arr.length-1];
}

export function grupBul(tl: number): string {
  for(const g of GRUP_ESIKLER){ if(tl>=g.min) return g.grup; }
  return "H";
}

export function birUstGrup(grup: string): {grup:string; min:number}|null {
  const idx=GRUP_ESIKLER.findIndex(g=>g.grup===grup);
  if(idx<=0) return null;
  return GRUP_ESIKLER[idx-1];
}

/** Bugün itibarıyla yükseklik + kullanım tipine göre 2026 sınıfı */
export function guncelSinifHesapla(yukseklikM: number, yapiTipi: string): string {
  const esikler=[{max:6.49,sinif:"III.B"},{max:21.49,sinif:"III.C"},{max:51.49,sinif:"IV.A"},{max:91.49,sinif:"IV.B"},{max:9999,sinif:"IV.C"}];
  const temel=esikler.find(e=>yukseklikM<=e.max)?.sinif||"IV.C";
  // Konut+ticari: ticari ağırlıklıysa bir üst
  // (detaylı ayrım admin ekranında; burada temel eşik yeterli)
  return temel;
}

/** Sınıf güncelleme tespiti — ruhsat sınıfı vs güncel sınıf */
export interface SinifFarki {
  ruhsatSinifi: string;
  guncelSinif: string;
  farkVar: boolean;
  aciklama: string;
  hesaplamaSinifi: string; // YMO için kullanılacak
}
export function sinifFarkiHesapla(ruhsatSinifi: string, sozlesmeTarihi: string, yukseklikM: number, yapiTipi: string): SinifFarki {
  const guncel=guncelSinifHesapla(yukseklikM, yapiTipi);
  const farkVar=guncel!==ruhsatSinifi;
  return {
    ruhsatSinifi, guncelSinif:guncel, farkVar,
    aciklama: farkVar
      ? `Ruhsatta ${ruhsatSinifi} görünüyor, ancak bugün (2026) bu yapı ${guncel} sınıfına karşılık geliyor. Belge tutarı ${ruhsatSinifi} üzerinden, YMO ${guncel} üzerinden hesaplanacak.`
      : `Ruhsat sınıfı (${ruhsatSinifi}) güncel sınıfla örtüşüyor.`,
    hesaplamaSinifi: guncel,
  };
}

// ─── Tekil iş deneyimi hesaplama ─────────────────────────────────
export interface IsGirdisi {
  sozlesmeTarihi: string;
  iskanTarihi: string;
  ruhsatSinifi: string;   // müşterinin seçtiği — belge tutarı için
  guncelSinifi?: string;  // yapı tipi motorundan — YMO için
  alanM2: number;
  tip: "kat_karsiligi" | "taahhut";
  taahhutBedeli?: number; // taahhüt için
}

export interface IsSonucu {
  belgeTutari: number;
  guncelTutar: number;
  sozlesmeDonemi: string;
  ufeSoz: number; ufeBas: number; ufeKatsayi: number;
  bfSoz: number; bfBas: number; ymo: number;
  kullanilanKatsayi: number;
  bantDurumu: "ufe"|"alt_sinir"|"ust_sinir";
  bantAciklama: string;
  sinifFarki?: SinifFarki;
}

export function isHesapla(g: IsGirdisi): IsSonucu {
  const sozDon=donemBul(g.sozlesmeTarihi);
  const basDon="2026";
  const ruhsat=g.ruhsatSinifi;
  const guncel=g.guncelSinifi||ruhsat;

  // Taahhüt: belge tutarı = sözleşme bedeli (0.85 yok)
  const bfSoz=g.tip==="taahhut"?1:(BM[sozDon]?.[ruhsat]??0);
  const belge=g.tip==="taahhut"?(g.taahhutBedeli??0):Math.round(g.alanM2*bfSoz*0.85);

  // YMO: güncel sınıfın bugünkü birim fiyatı / ruhsat sınıfının sözleşme birim fiyatı
  const bfBas=g.tip==="taahhut"?1:(BM[basDon]?.[guncel]??BM[basDon]?.[ruhsat]??0);
  const ufeSoz=ufeEndeksi(g.sozlesmeTarihi);
  const ufeBas=5029.76;
  const ufeKat=ufeBas/ufeSoz;

  let kat=ufeKat; let bant:"ufe"|"alt_sinir"|"ust_sinir"="ufe"; let bantAciklama="";
  if(g.tip==="kat_karsiligi"&&bfSoz>0&&bfBas>0){
    const ymo=bfBas/bfSoz;
    const alt=ymo*0.90; const ust=ymo*1.30;
    if(ufeKat<alt){kat=alt;bant="alt_sinir";bantAciklama=`ÜFE(${ufeKat.toFixed(3)}) < alt sınır(${alt.toFixed(3)}) → alt sınır`;}
    else if(ufeKat>ust){kat=ust;bant="ust_sinir";bantAciklama=`ÜFE(${ufeKat.toFixed(3)}) > üst sınır(${ust.toFixed(3)}) → üst sınır`;}
    else{bant="ufe";bantAciklama=`ÜFE(${ufeKat.toFixed(3)}) bant içinde`;}
  } else {
    bantAciklama=`Taahhüt — ÜFE katsayısı: ${ufeKat.toFixed(3)}`;
  }

  const ymo=bfSoz>0?bfBas/bfSoz:1;
  return {belgeTutari:belge,guncelTutar:Math.round(belge*kat),sozlesmeDonemi:sozDon,ufeSoz,ufeBas,ufeKatsayi:ufeKat,bfSoz,bfBas,ymo,kullanilanKatsayi:kat,bantDurumu:bant,bantAciklama};
}

// ─── 3 HESAPLAMA YÖNTEMİ ─────────────────────────────────────────

export interface HesaplananIs {
  id: string;
  sozlesmeTarihi: string;
  iskanTarihi: string;
  ruhsatSinifi: string;
  guncelSinifi: string;
  alanM2: number;
  tip: "kat_karsiligi"|"taahhut";
  taahhutBedeli?: number;
  adaParsel?: string;
  sonuc: IsSonucu;
  sinifFarki: SinifFarki|null;
  // Hesaplama dönemleri için
  iskanDate: Date;
  bugun: Date;
}

export interface Yontem1Sonuc {
  yontem: "son5yil";
  isler: HesaplananIs[];
  son5YilIsler: HesaplananIs[];
  eskiIsler: HesaplananIs[]; // 3 kat kilidini açan
  toplamBrut: number;
  enBuyukIs: number;
  ucKatSiniri: number;
  kilidiAcanIsMi: boolean; // 5 yıldan eski iş var mı
  toplamNet: number; // 3 kat sınırı uygulanmış
  grup: string;
  gecerli: boolean;
}

export interface Yontem2Sonuc {
  yontem: "son15yil";
  isler: HesaplananIs[];
  son15YilIsler: HesaplananIs[];
  enBuyukIs: HesaplananIs|null;
  enBuyukTutar: number;
  toplam: number; // enBuyuk × 2
  grup: string;
  gecerli: boolean;
}

export interface DiplomaYontemSonuc {
  yontem: "diploma";
  mezuniyetTarihi: string;
  kacYillik: number;
  grup: string|null; // diploma yılına göre denk geldiği grup
  gecerli: boolean;
  aciklama: string;
}

export interface TamHesaplama {
  isler: HesaplananIs[];
  yontem1: Yontem1Sonuc;
  yontem2: Yontem2Sonuc;
  diploma: DiplomaYontemSonuc|null;
  tercihEdilenYontem: "son5yil"|"son15yil"|"diploma";
  tercihEdilenToplam: number;
  tercihEdilenGrup: string;
  birUstGrupIcin: number; // eksik tutar
  birUstGrup: string|null;
}

// ─── Diploma eşikleri (2026) ─────────────────────────────────────
const DIPLOMA_GRUPLAR: {maxYil:number; grup:string}[] = [
  {maxYil:4,  grup:"H"},
  {maxYil:7,  grup:"G1"},
  {maxYil:10, grup:"G"},
  {maxYil:14, grup:"F1"},
  {maxYil:Infinity, grup:"F"},
];
function diplomaGrubu(mezuniyetTarihi: string): {grup:string; kacYillik:number} {
  const mezDate=new Date(mezuniyetTarihi);
  const bugun=new Date();
  const yil=Math.floor((bugun.getTime()-mezDate.getTime())/(365.25*24*3600*1000));
  const g=DIPLOMA_GRUPLAR.find(d=>yil<=d.maxYil)||DIPLOMA_GRUPLAR[DIPLOMA_GRUPLAR.length-1];
  return {grup:g.grup, kacYillik:yil};
}

// ─── ANA HESAPLAMA FONKSİYONU ─────────────────────────────────────
export function tamHesapla(
  isGirisleri: Array<{
    id:string; sozlesmeTarihi:string; iskanTarihi:string;
    ruhsatSinifi:string; guncelSinifi?:string; alanM2:number;
    tip:"kat_karsiligi"|"taahhut"; taahhutBedeli?:number; adaParsel?:string;
    yukseklikM?:number; yapiTipi?:string;
  }>,
  diploma?: {mezuniyetTarihi:string; bolum:string} | null
): TamHesaplama {

  const bugun=new Date();

  // Her iş için hesapla
  const isler: HesaplananIs[] = isGirisleri.map(g=>{
    const sinFark=g.yukseklikM&&g.yukseklikM>0&&g.yapiTipi
      ? sinifFarkiHesapla(g.ruhsatSinifi,g.sozlesmeTarihi,g.yukseklikM,g.yapiTipi)
      : null;
    const gundel=sinFark?.guncelSinif||g.guncelSinifi||g.ruhsatSinifi;
    const sonuc=isHesapla({
      sozlesmeTarihi:g.sozlesmeTarihi, iskanTarihi:g.iskanTarihi,
      ruhsatSinifi:g.ruhsatSinifi, guncelSinifi:gundel,
      alanM2:g.alanM2, tip:g.tip, taahhutBedeli:g.taahhutBedeli,
    });
    return {...g,sonuc,sinifFarki:sinFark,guncelSinifi:gundel,iskanDate:new Date(g.iskanTarihi),bugun};
  });

  // ── Yöntem 1: Son 5 yıl toplamı ──────────────────────────────
  const be5=new Date(bugun); be5.setFullYear(be5.getFullYear()-5);
  const be15=new Date(bugun); be15.setFullYear(be15.getFullYear()-15);

  const son5=isler.filter(x=>x.iskanDate>=be5);
  const eski=isler.filter(x=>x.iskanDate<be5&&x.iskanDate>=be15);

  const toplamBrut=son5.reduce((s,x)=>s+x.sonuc.guncelTutar,0);
  const enBuyukSon5=son5.length>0?Math.max(...son5.map(x=>x.sonuc.guncelTutar)):0;
  const kilidiAcan=eski.length>0; // 5 yıldan eski iş varsa 3 kat kilidi açılır
  const ucKat=enBuyukSon5*3;
  const toplamNet=kilidiAcan?Math.min(toplamBrut,ucKat):toplamBrut; // kilid açıksa üst sınır 3 kat

  const y1Grup=grupBul(toplamNet);
  const y1: Yontem1Sonuc = {
    yontem:"son5yil", isler, son5YilIsler:son5, eskiIsler:eski,
    toplamBrut, enBuyukIs:enBuyukSon5, ucKatSiniri:ucKat,
    kilidiAcanIsMi:kilidiAcan, toplamNet, grup:y1Grup,
    gecerli:son5.length>0,
  };

  // ── Yöntem 2: Son 15 yılda en büyük × 2 ──────────────────────
  const son15=isler.filter(x=>x.iskanDate>=be15);
  const enBuyuk15=son15.length>0?son15.reduce((m,x)=>x.sonuc.guncelTutar>m.sonuc.guncelTutar?x:m,son15[0]):null;
  const y2Toplam=enBuyuk15?(enBuyuk15.sonuc.guncelTutar*2):0;
  const y2Grup=grupBul(y2Toplam);
  const y2: Yontem2Sonuc = {
    yontem:"son15yil", isler, son15YilIsler:son15,
    enBuyukIs:enBuyuk15, enBuyukTutar:enBuyuk15?.sonuc.guncelTutar??0,
    toplam:y2Toplam, grup:y2Grup, gecerli:son15.length>0,
  };

  // ── Yöntem 3: Diploma ─────────────────────────────────────────
  let dip: DiplomaYontemSonuc|null=null;
  if(diploma){
    const {grup,kacYillik}=diplomaGrubu(diploma.mezuniyetTarihi);
    dip={
      yontem:"diploma", mezuniyetTarihi:diploma.mezuniyetTarihi,
      kacYillik, grup, gecerli:true,
      aciklama:`${kacYillik} yıllık ${diploma.bolum==="insaat_muhendisligi"?"İnşaat Mühendisliği":"Mimarlık"} diploması → ${grup} Grubu`,
    };
  }

  // ── En yüksek yöntemi seç ────────────────────────────────────
  const karsilastir=[
    {yontem:"son5yil" as const, toplam:y1.toplamNet, grup:y1.grup, gecerli:y1.gecerli},
    {yontem:"son15yil" as const, toplam:y2.toplam, grup:y2.grup, gecerli:y2.gecerli},
  ];
  const enIyi=karsilastir.filter(x=>x.gecerli).reduce((m,x)=>x.toplam>m.toplam?x:m, karsilastir[0]);

  const tercih=enIyi.yontem;
  const tercihToplam=enIyi.toplam;
  const tercihGrup=enIyi.grup;

  const ustGrup=birUstGrup(tercihGrup);
  const eksik=ustGrup?Math.max(0,ustGrup.min-tercihToplam):0;

  return {
    isler, yontem1:y1, yontem2:y2, diploma:dip,
    tercihEdilenYontem:tercih, tercihEdilenToplam:tercihToplam,
    tercihEdilenGrup:tercihGrup,
    birUstGrupIcin:eksik, birUstGrup:ustGrup?.grup??null,
  };
}

// ─── Para formatı yardımcısı ─────────────────────────────────────
export const tl=(n:number)=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(n);
export const tlSade=(n:number)=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(n)+" ₺";
