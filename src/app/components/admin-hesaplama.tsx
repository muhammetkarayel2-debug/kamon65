import { useState, useMemo } from "react";
import {
  Calculator, CheckCircle, AlertTriangle, Send,
  FileText, Clock, ChevronDown, ChevronUp, Info,
  Save, Eye, EyeOff, User, Building2
} from "lucide-react";

// ─── Helpers ───
function loadLS(key: string, fb: any): any { try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {} return fb; }
function saveLS(key: string, v: any) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
const tl = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

// ─── Hesaplama Motoru ───
const UFE: Record<string, number[]> = {
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

const BM: Record<string, Record<string, number>> = {
  "2026":{"III.B":21050,"III.C":23400,"IV.A":26450,"IV.B":33900,"IV.C":40500,"V.A":42350,"V.B":42350,"V.C":42350,"V.D":42350},
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

// 2026 yılında yükseklik → sınıf eşleşmesi
const YUKSEKLIK_SINIF_2026 = [
  {maxM:6.49,sinif:"III.B"},{maxM:21.49,sinif:"III.C"},
  {maxM:51.49,sinif:"IV.A"},{maxM:91.49,sinif:"IV.B"},{maxM:9999,sinif:"IV.C"},
];
const SINIF_SIRA: Record<string,number> = {"III.B":1,"III.C":2,"IV.A":3,"IV.B":4,"IV.C":5,"V.A":6,"V.B":7,"V.C":8,"V.D":9};

function guncelSinif2026(yukseklikM: number): string {
  return YUKSEKLIK_SINIF_2026.find(e => yukseklikM <= e.maxM)?.sinif || "IV.C";
}

const GRUP_ESIKLER = [
  {grup:"A",min:2_476_500_000},{grup:"B",min:1_733_550_000},{grup:"B1",min:1_485_900_000},
  {grup:"C",min:1_238_250_000},{grup:"C1",min:990_600_000},{grup:"D",min:743_325_000},
  {grup:"D1",min:618_750_000},{grup:"E",min:495_000_000},{grup:"E1",min:371_475_000},
  {grup:"F",min:247_650_000},{grup:"F1",min:185_737_500},{grup:"G",min:123_825_000},
  {grup:"G1",min:61_912_500},{grup:"H",min:0},
];

// ─── Mali Yeterlilik Muafiyeti ───
// H, G, G1 grupları için mali yeterlilik belgesi gerekmez
const MALI_MUAF_GRUBU = ["H", "G", "G1"];

function isMaliMuaf(grup: string): boolean {
  return MALI_MUAF_GRUBU.includes(grup);
}

function getMaliMuafiyetAciklama(grup: string): string | null {
  if (!isMaliMuaf(grup)) return null;
  return `${grup} grubu için mali yeterlilik belgesi gerekmez. Bu grup için banka referans mektubu veya bilanço sunma zorunluluğu yoktur.`;
}

function donemBul(tarih: string): string {
  const d=new Date(tarih); const y=d.getFullYear(); const m=d.getMonth()+1;
  if(y>=2026)return"2026";if(y===2025)return"2025";if(y===2024)return"2024";
  if(y===2023)return m>=7?"2023-2":"2023-1";
  if(y===2022)return m>=9?"2022-3":m>=5?"2022-2":"2022-1";
  if(y>=2010)return String(y);return"2010";
}
function ufeEndeksi(tarih: string): number {
  const d=new Date(tarih); let y=d.getFullYear(); let m=d.getMonth()-1;
  if(m<0){m=11;y--;}
  const arr=UFE[String(y)];if(!arr)return UFE["2010"][0];
  return arr[m]??arr[arr.length-1];
}
function grupBul(tl: number): string {
  for(const g of GRUP_ESIKLER){if(tl>=g.min)return g.grup;}return"H";
}
function birUstGrup(grup: string): {grup:string;min:number}|null {
  const idx=GRUP_ESIKLER.findIndex(g=>g.grup===grup);
  if(idx<=0)return null;return GRUP_ESIKLER[idx-1];
}

// Diploma eşikleri
const DIPLOMA_ESIKLER=[{maxYil:4,grup:"H"},{maxYil:7,grup:"G1"},{maxYil:10,grup:"G"},{maxYil:14,grup:"F1"},{maxYil:999,grup:"F"}];
function diplomaGrubu(mezuniyetTarihi: string):{grup:string;yil:number}{
  const yil=Math.floor((Date.now()-new Date(mezuniyetTarihi).getTime())/(365.25*24*3600*1000));
  const g=DIPLOMA_ESIKLER.find(d=>yil<=d.maxYil)||DIPLOMA_ESIKLER[DIPLOMA_ESIKLER.length-1];
  return{grup:g.grup,yil};
}

// Tekil iş hesapla
function isHesapla(sozTarih:string, ruhsatSinif:string, guncelSinifOverride:string|null, alanM2:number, tip:"kat_karsiligi"|"taahhut", taahhutBedeli?:number){
  const sozDon=donemBul(sozTarih);
  const baseDon="2026";
  const bfSoz=BM[sozDon]?.[ruhsatSinif]||0;
  const ymoSinif=guncelSinifOverride||ruhsatSinif;
  const bfBas=BM[baseDon]?.[ymoSinif]||BM[baseDon]?.[ruhsatSinif]||0;
  const ufeSoz=ufeEndeksi(sozTarih);
  const ufeBas=5029.76;

  if(tip==="taahhut"){
    const bedel=taahhutBedeli||0;
    const ufeKat=ufeBas/ufeSoz;
    return{belgeTutari:bedel,guncelTutar:Math.round(bedel*ufeKat),ufeSoz,ufeBas,ufeKat,kullanilanKatsayi:ufeKat,bantDurumu:"ufe",bantAciklama:`Taahhüt — ÜFE katsayısı: ${ufeKat.toFixed(3)}`,bfSoz:1,bfBas:1,ymo:1};
  }

  const belge=Math.round(alanM2*bfSoz*0.85);
  const ufeKat=ufeBas/ufeSoz;
  const ymo=bfSoz>0?bfBas/bfSoz:1;
  const alt=ymo*0.90;const ust=ymo*1.30;
  let kat=ufeKat;let bant="ufe";let bantAcik="";
  if(ufeKat<alt){kat=alt;bant="alt_sinir";bantAcik=`ÜFE(${ufeKat.toFixed(3)}) < alt(${alt.toFixed(3)}) → alt sınır`;}
  else if(ufeKat>ust){kat=ust;bant="ust_sinir";bantAcik=`ÜFE(${ufeKat.toFixed(3)}) > üst(${ust.toFixed(3)}) → üst sınır`;}
  else{bantAcik=`ÜFE(${ufeKat.toFixed(3)}) bant içinde`;}
  return{belgeTutari:belge,guncelTutar:Math.round(belge*kat),ufeSoz,ufeBas,ufeKat,kullanilanKatsayi:kat,bantDurumu:bant,bantAciklama:bantAcik,bfSoz,bfBas,ymo};
}

// 3 yöntem hesapla
function tamHesapla(isler: any[], diploma: any|null){
  const bugun=new Date();
  const be5=new Date(bugun);be5.setFullYear(be5.getFullYear()-5);
  const be15=new Date(bugun);be15.setFullYear(be15.getFullYear()-15);

  const islerHesap=isler.map(e=>{
    const alan=parseFloat(String(e.totalArea||e.alan||"0").replace(/\./g,"").replace(",","."))||0;
    const bedel=parseFloat(String(e.sozlesmeBedeli||e.bedel||"0").replace(/\./g,""))||0;
    const iskanDate=e.occupancyDate||e.iskanTarih?new Date(e.occupancyDate||e.iskanTarih):null;
    const sozDate=new Date(e.sozlesmeTarihi||e.sozTarih||"2020-01-01");
    const ruhsatSinif=e.buildingClass||e.sinif||"III.B";
    const guncelSinifOverride=e.adminOnaylananSinif||null;
    const sonuc=isHesapla(e.sozlesmeTarihi||e.sozTarih, ruhsatSinif, guncelSinifOverride, alan, e.isDeneyimiTipi||e.tip||"kat_karsiligi", bedel);
    return{...e,_sonuc:sonuc,_iskanDate:iskanDate,_sozDate:sozDate,_ruhsatSinif:ruhsatSinif,_guncelSinif:guncelSinifOverride||ruhsatSinif,_alan:alan};
  });

  // Yöntem 1: Son 5 yıl
  const son5=islerHesap.filter(x=>x._iskanDate&&x._iskanDate>=be5);
  const eski=islerHesap.filter(x=>x._iskanDate&&x._iskanDate<be5&&x._iskanDate>=be15);
  const toplamBrut=son5.reduce((s,x)=>s+x._sonuc.guncelTutar,0);
  const enBuyukSon5=son5.length>0?Math.max(...son5.map(x=>x._sonuc.guncelTutar)):0;
  const kilidiAcan=eski.length>0;
  const ucKat=enBuyukSon5*3;
  const toplamNet=kilidiAcan?Math.min(toplamBrut,ucKat):Math.min(toplamBrut,ucKat);
  const y1Toplam=toplamNet;
  const y1Grup=grupBul(y1Toplam);

  // Yöntem 2: Son 15 yılda en büyük × 2
  const son15=islerHesap.filter(x=>x._iskanDate&&x._iskanDate>=be15);
  const enBuyuk15=son15.length>0?son15.reduce((m,x)=>x._sonuc.guncelTutar>m._sonuc.guncelTutar?x:m,son15[0]):null;
  const y2Toplam=enBuyuk15?(enBuyuk15._sonuc.guncelTutar*2):0;
  const y2Grup=grupBul(y2Toplam);

  // Yöntem 3: Diploma
  let dipGrup:string|null=null;let dipYil=0;
  if(diploma?.gradDate||diploma?.mezuniyetTarihi){
    const r=diplomaGrubu(diploma.gradDate||diploma.mezuniyetTarihi);
    dipGrup=r.grup;dipYil=r.yil;
  }

  // En iyi seç
  const y1=y1Toplam;const y2=y2Toplam;
  let tercih:"son5"|"son15"="son5";
  if(y2>y1)tercih="son15";

  const tercihToplam=tercih==="son5"?y1:y2;
  const tercihGrup=tercih==="son5"?y1Grup:y2Grup;
  const ustGrup=birUstGrup(tercihGrup);
  const eksik=ustGrup?Math.max(0,ustGrup.min-tercihToplam):0;

  return{
    islerHesap,
    y1:{toplam:y1Toplam,grup:y1Grup,son5IslerSayisi:son5.length,eskiIslerSayisi:eski.length,enBuyukSon5,ucKat,kilidiAcan},
    y2:{toplam:y2Toplam,grup:y2Grup,enBuyukIs:enBuyuk15,son15IslerSayisi:son15.length},
    diploma:{grup:dipGrup,yil:dipYil,aciklama:dipGrup?`${dipYil} yıllık diploma → ${dipGrup} Grubu`:null},
    tercih,tercihToplam,tercihGrup,
    birUstGrup:ustGrup,eksik,
  };
}

const COMPANIES_KEY="mock_panel_companies";
const REPORTS_KEY="mock_panel_reports";

interface Props{refreshKey:number;onRefresh:()=>void;}

export function AdminHesaplama({refreshKey,onRefresh}:Props){
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [sonuclar,setSonuclar]=useState<any|null>(null);
  const [adminNot,setAdminNot]=useState("");
  const [rapordaGrup,setRapordaGrup]=useState("");
  const [sendMsg,setSendMsg]=useState("");
  const [loading,setLoading]=useState(false);
  const [sinifOnaylar,setSinifOnaylar]=useState<Record<string,string>>({});
  const [showDetay,setShowDetay]=useState<Record<string,boolean>>({});

  const companies=useMemo(()=>{
    const all=loadLS(COMPANIES_KEY,[]) as any[];
    return all.filter(c=>c.qualifications&&(c.qualifications.hasYapiIsi||c.qualifications.hasDiploma||c.qualifications.experiences?.length));
  },[refreshKey]);

  const selectedCompany=companies.find((c:any)=>c.id===selectedId);

  function sinifUyarilar(experiences: any[]){
    return experiences.map(e=>{
      const ruhsat=e.buildingClass||e.sinif||"";
      const yukseklik=parseFloat(e.buildingHeight||e.yukseklik||"0")||0;
      if(!ruhsat||yukseklik<=0)return{...e,_uyari:null,_guncel2026:null};
      const guncel=guncelSinif2026(yukseklik);
      const farkVar=guncel!==ruhsat;
      return{
        ...e,
        _uyari:farkVar?`Ruhsatta ${ruhsat} seçilmiş, ancak ${yukseklik}m yükseklikteki bu yapı 2026'da ${guncel} sınıfına denk geliyor.`:null,
        _guncel2026:guncel,
        adminOnaylananSinif:sinifOnaylar[e.id||e.adaParsel]||null,
      };
    });
  }

  const handleHesapla=()=>{
    if(!selectedCompany)return;
    setLoading(true);
    setTimeout(()=>{
      const q=selectedCompany.qualifications;
      const exps=(q?.experiences||[]).map((e:any)=>({
        ...e,
        adminOnaylananSinif:sinifOnaylar[e.id||e.adaParsel]||null,
      }));
      const result=tamHesapla(exps,q?.diploma);
      setSonuclar(result);
      setRapordaGrup(result.tercihGrup);
      setLoading(false);
    },600);
  };

  const handleRaporGonder=()=>{
    if(!selectedCompany||!sonuclar)return;
    const rapor={
      id:crypto.randomUUID(),
      companyId:selectedCompany.id,
      companyName:selectedCompany.companyName,
      olusturmaTarihi:new Date().toISOString(),
      hesaplananGrup:rapordaGrup,
      tercihYontem:sonuclar.tercih,
      toplamGuncelTutar:sonuclar.tercihToplam,
      y1:sonuclar.y1,y2:sonuclar.y2,
      diploma:sonuclar.diploma,
      isDetaylari:sonuclar.islerHesap,
      adminNotu:adminNot,
      durum:"yayinda",
    };
    const raporlar=loadLS(REPORTS_KEY,{});
    if(!raporlar[selectedCompany.id])raporlar[selectedCompany.id]=[];
    raporlar[selectedCompany.id].push(rapor);
    saveLS(REPORTS_KEY,raporlar);
    const all=loadLS(COMPANIES_KEY,[]);
    saveLS(COMPANIES_KEY,all.map((c:any)=>c.id===selectedCompany.id?{...c,appStatus:"report_published",hesaplananGrup:rapordaGrup,updatedAt:new Date().toISOString()}:c));
    setSendMsg("Rapor müşteriye gönderildi!");onRefresh();
    setTimeout(()=>setSendMsg(""),3000);
  };

  const iCls="px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return(
    <div className="space-y-5">
      <div><h2 className="text-[#0B1D3A] text-lg font-bold">İş Deneyimi Hesaplama</h2><p className="text-[#5A6478] text-xs mt-0.5">Müşteri verilerini okuyun, sınıf uyarılarını onaylayın ve raporu gönderin.</p></div>

      {/* Şirket seçimi */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
        <h3 className="text-sm font-semibold text-[#0B1D3A] mb-4">1. Şirket Seçin</h3>
        {companies.length===0?(
          <div className="text-center py-8 text-[#5A6478] text-sm"><Clock className="w-8 h-8 mx-auto mb-2 text-[#E8E4DC]"/>Hesaplama bekleyen başvuru yok.</div>
        ):(
          <div className="space-y-2">
            {companies.map((c:any)=>{
              const hasRapor=loadLS(REPORTS_KEY,{})[c.id]?.length>0;
              return(
                <button key={c.id} onClick={()=>{setSelectedId(c.id);setSonuclar(null);setAdminNot("");setSinifOnaylar({});}}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${selectedId===c.id?"border-[#C9952B] bg-[#C9952B]/5":"border-[#E8E4DC] hover:border-[#C9952B]/40"}`}>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-[#0B1D3A]">{c.companyName}</p><p className="text-xs text-[#5A6478] mt-0.5">{c.taxId} · {c.location==="istanbul"?"İstanbul":c.city}</p></div>
                    <div className="flex items-center gap-2">
                      {hasRapor&&<span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Rapor var</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${c.appStatus==="payment_received"?"bg-amber-50 text-amber-700 border-amber-200":"bg-[#F0EDE8] text-[#5A6478] border-[#E8E4DC]"}`}>
                        {c.appStatus==="payment_received"?"Ödeme alındı":c.appStatus||"Bekliyor"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Seçili şirket */}
      {selectedCompany&&(()=>{
        const q=selectedCompany.qualifications;
        const exps=q?.experiences||[];
        const uyarilar=sinifUyarilar(exps);
        const uyariliIsler=uyarilar.filter((e:any)=>e._uyari&&!sinifOnaylar[e.id||e.adaParsel]);
        return(
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
              <div className="flex items-center gap-2 mb-4"><Building2 className="w-4 h-4 text-[#C9952B]"/><h3 className="text-sm font-semibold text-[#0B1D3A]">2. Müşteri Bilgileri</h3></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                {[["Firma",selectedCompany.companyName],["Vergi No",selectedCompany.taxId],["Tür",selectedCompany.companyType],["Hizmet",selectedCompany.serviceLabel||selectedCompany.selectedService]].map(([l,v])=>(
                  <div key={l}><p className="text-[#5A6478]">{l}</p><p className="font-medium text-[#0B1D3A]">{v||"—"}</p></div>
                ))}
              </div>

              {exps.length>0&&(
                <div>
                  <p className="text-xs font-medium text-[#0B1D3A] mb-3">İş Deneyimleri ({exps.length})</p>
                  <div className="space-y-3">
                    {uyarilar.map((e:any,i:number)=>{
                      const onayKey=e.id||e.adaParsel||String(i);
                      const sinifOnay=sinifOnaylar[onayKey];
                      const acik=showDetay[onayKey];
                      return(
                        <div key={i} className={`rounded-xl border overflow-hidden ${e._uyari&&!sinifOnay?"border-amber-200":"border-[#E8E4DC]"}`}>
                          <button onClick={()=>setShowDetay(d=>({...d,[onayKey]:!d[onayKey]}))} className="w-full p-3 bg-[#F8F7F4] flex items-center justify-between text-left">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#0B1D3A] text-white flex items-center justify-center text-xs">{i+1}</span>
                              <span className="text-sm font-medium text-[#0B1D3A]">{e.isDeneyimiTipi==="taahhut"?"Taahhüt":"Kat Karşılığı"}</span>
                              {e._uyari&&!sinifOnay&&<span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5"/>Sınıf uyarısı</span>}
                              {sinifOnay&&<span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">→ {sinifOnay} onaylandı</span>}
                            </div>
                            {acik?<ChevronUp className="w-4 h-4 text-[#5A6478]"/>:<ChevronDown className="w-4 h-4 text-[#5A6478]"/>}
                          </button>

                          <div className="p-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                              <div><p className="text-[#5A6478]">Ada/Parsel</p><p className="font-medium">{e.adaParsel||"—"}</p></div>
                              <div><p className="text-[#5A6478]">Sözleşme</p><p className="font-medium">{e.sozlesmeTarihi||e.sozTarih||"—"}</p></div>
                              <div><p className="text-[#5A6478]">İskan</p><p className="font-medium">{e.occupancyDate||e.iskanTarih||"—"}</p></div>
                              <div><p className="text-[#5A6478]">Yapı Sınıfı (Ruhsat)</p><p className="font-medium text-[#C9952B]">{e.buildingClass||e.sinif||"—"}</p></div>
                              {e.isDeneyimiTipi!=="taahhut"&&<>
                                <div><p className="text-[#5A6478]">Alan (m²)</p><p className="font-medium">{e.totalArea||e.alan||"—"}</p></div>
                                <div><p className="text-[#5A6478]">Yükseklik</p><p className="font-medium">{e.buildingHeight||e.yukseklik||"—"} m</p></div>
                                <div><p className="text-[#5A6478]">Kullanım</p><p className="font-medium">{e.yapiTipi||"—"}</p></div>
                              </>}
                              {e.isDeneyimiTipi==="taahhut"&&<div><p className="text-[#5A6478]">Sözleşme Bedeli</p><p className="font-medium">{e.sozlesmeBedeli||e.bedel||"—"} ₺</p></div>}
                            </div>

                            {e._uyari&&(
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                <div className="flex items-start gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
                                  <div>
                                    <p className="text-xs font-semibold text-amber-800 mb-1">Sınıf Farkı Tespit Edildi</p>
                                    <p className="text-xs text-amber-700">{e._uyari}</p>
                                    <p className="text-xs text-amber-600 mt-1">Belge tutarı: <strong>{e.buildingClass||e.sinif}</strong> üzerinden hesaplanacak. YMO için hangi sınıf kullanılsın?</p>
                                  </div>
                                </div>
                                {!sinifOnay&&(
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={()=>setSinifOnaylar(s=>({...s,[onayKey]:e._guncel2026}))}
                                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">
                                      2026 sınıfını kullan ({e._guncel2026})
                                    </button>
                                    <button onClick={()=>setSinifOnaylar(s=>({...s,[onayKey]:e.buildingClass||e.sinif}))}
                                      className="text-xs bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg">
                                      Ruhsat sınıfını koru ({e.buildingClass||e.sinif})
                                    </button>
                                  </div>
                                )}
                                {sinifOnay&&(
                                  <div className="flex items-center gap-2 mt-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-blue-600"/>
                                    <span className="text-xs text-blue-700">YMO için <strong>{sinifOnay}</strong> kullanılacak</span>
                                    <button onClick={()=>setSinifOnaylar(s=>{const n={...s};delete n[onayKey];return n;})} className="text-xs text-[#5A6478] underline ml-2">değiştir</button>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs">
                              <FileText className="w-3.5 h-3.5 text-[#5A6478]"/>
                              <span className="text-[#5A6478]">İskan belgesi:</span>
                              <span className={e.iskanFile||e.iskanYuklendi?"text-green-600":"text-[#9CA3AF]"}>
                                {e.iskanFile||e.iskanYuklendi?"✓ Yüklendi":"Yüklenmedi"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {q?.diploma&&(
                <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-medium text-blue-800 mb-2">Diploma Başvurusu</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><p className="text-blue-600">Ad Soyad</p><p className="font-medium text-blue-800">{q.diploma.partnerName||"—"}</p></div>
                    <div><p className="text-blue-600">Bölüm</p><p className="font-medium text-blue-800">{q.diploma.department==="insaat_muhendisligi"?"İnş. Müh.":"Mimarlık"}</p></div>
                    <div><p className="text-blue-600">Mezuniyet</p><p className="font-medium text-blue-800">{q.diploma.gradDate||"—"}</p></div>
                  </div>
                </div>
              )}

              {uyariliIsler.length>0&&(
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0"/>
                  <p className="text-xs text-amber-700">{uyariliIsler.length} iş için sınıf uyarısı onay bekliyor. Lütfen yukarıdan onaylayın.</p>
                </div>
              )}

              <button onClick={handleHesapla} disabled={loading||uyariliIsler.length>0}
                className="mt-4 w-full bg-[#0B1D3A] hover:bg-[#122A54] disabled:bg-gray-200 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {loading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Hesaplanıyor...</>:<><Calculator className="w-4 h-4"/>Hesapla</>}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Hesaplama sonuçları */}
      {sonuclar&&(
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-5">
            <h3 className="text-white font-bold mb-1">3. Hesaplama Sonuçları</h3>
            <p className="text-white/60 text-xs">{selectedCompany?.companyName}</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                {yontem:"Son 5 yıl toplamı",toplam:sonuclar.y1.toplam,grup:sonuclar.y1.grup,seçili:sonuclar.tercih==="son5",bilgi:`${sonuclar.y1.son5IslerSayisi} iş${sonuclar.y1.kilidiAcan?", 3× kilit açık":""}`},
                {yontem:"Son 15 yıl en büyük ×2",toplam:sonuclar.y2.toplam,grup:sonuclar.y2.grup,seçili:sonuclar.tercih==="son15",bilgi:sonuclar.y2.enBuyukIs?`En büyük: ${tl(sonuclar.y2.enBuyukIs._sonuc.guncelTutar)}`:"—"},
                {yontem:"Diploma",toplam:null,grup:sonuclar.diploma.grup||"—",seçili:false,bilgi:sonuclar.diploma.aciklama||"Diploma yok"},
              ].map(({yontem,toplam,grup,seçili,bilgi})=>(
                <div key={yontem} className={`rounded-xl p-4 border ${seçili?"border-[#C9952B] bg-[#C9952B]/5":"border-[#E8E4DC] bg-[#F8F7F4]"}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {seçili&&<CheckCircle className="w-3.5 h-3.5 text-[#C9952B]"/>}
                    <p className="text-xs font-medium text-[#0B1D3A]">{yontem}</p>
                  </div>
                  {toplam!==null&&<p className="text-sm font-bold text-[#0B1D3A] mb-1">{tl(toplam)}</p>}
                  <p className="text-lg font-black text-[#C9952B]">Grup {grup}</p>
                  <p className="text-[10px] text-[#5A6478] mt-1">{bilgi}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-[#0B1D3A] mb-2">İş Bazlı Detay</p>
              <div className="space-y-2">
                {sonuclar.islerHesap.map((e:any,i:number)=>(
                  <div key={i} className="border border-[#E8E4DC] rounded-xl overflow-hidden">
                    <div className="bg-[#F8F7F4] px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#0B1D3A]">İş {i+1} — {e.isDeneyimiTipi==="taahhut"?"Taahhüt":"Kat Karşılığı"}</span>
                        {e._ruhsatSinif!==e._guncelSinif&&(
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                            {e._ruhsatSinif} → {e._guncelSinif}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[#C9952B]">{tl(e._sonuc.guncelTutar)}</span>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-[#5A6478]">Belge tutarı</p><p className="font-medium">{tl(e._sonuc.belgeTutari)}</p></div>
                      <div><p className="text-[#5A6478]">Katsayı</p><p className="font-medium">{e._sonuc.kullanilanKatsayi.toFixed(3)}</p></div>
                      <div><p className="text-[#5A6478]">Bant</p><p className={`font-medium ${e._sonuc.bantDurumu==="ufe"?"text-green-600":"text-amber-600"}`}>{e._sonuc.bantDurumu}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {sonuclar.birUstGrup&&(
              <div className="bg-[#0B1D3A]/5 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-[#0B1D3A]/60 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-xs font-semibold text-[#0B1D3A]">Bir üst grup için eksik: {tl(sonuclar.eksik)}</p>
                  <p className="text-xs text-[#5A6478] mt-0.5">{sonuclar.birUstGrup.grup} grubuna ulaşmak için gereken tutar</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Rapora yazılacak grup</label>
                <select value={rapordaGrup} onChange={e=>setRapordaGrup(e.target.value)} className={iCls}>
                  {["H","G1","G","F1","F","E1","E","D1","D","C1","C","B1","B","A"].map(g=><option key={g} value={g}>Grup {g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Admin notu (müşteriye gösterilir)</label>
                <textarea value={adminNot} onChange={e=>setAdminNot(e.target.value)} rows={3} placeholder="Hesaplama notları, öneriler..."
                  className={`${iCls} resize-none w-full`}/>
              </div>
              {sendMsg?(
                <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4"/> {sendMsg}
                </div>
              ):(
                <button onClick={handleRaporGonder}
                  className="w-full bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  <Send className="w-4 h-4"/> Raporu Müşteriye Gönder
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
