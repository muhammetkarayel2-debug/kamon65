import { useState, useMemo } from "react";
import { Calculator, TrendingUp, CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";

// ─── ÜFE ve BM verilerini localStorage'dan veya varsayılandan al ───
function loadLS(key: string, fb: any): any { try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {} return fb; }

const VARSAYILAN_UFE: Record<string, number[]> = {
  "2026":[4910.53,5029.76],"2025":[3861.33,3943.01,4017.30,4128.19,4230.69,4334.94,4409.73,4518.89,4632.89,4708.20,4747.63,4783.04],
  "2024":[3035.59,3149.03,3252.79,3369.98,3435.96,3483.25,3550.88,3610.51,3659.84,3707.10,3731.43,3746.52],
  "2023":[2105.17,2138.04,2147.44,2164.94,2179.02,2320.72,2511.75,2659.60,2749.98,2803.29,2882.04,2915.02],
  "2022":[1129.03,1210.60,1321.90,1423.27,1548.01,1652.75,1738.21,1780.05,1865.09,2011.13,2026.08,2021.19],
  "2021":[583.38,590.52,614.93,641.63,666.79,693.54,710.61,730.28,741.58,780.45,858.43,1022.25],
  "2020":[462.42,464.64,468.69,474.69,482.02,485.37,490.33,501.85,515.13,533.44,555.18,568.27],
  "2019":[424.86,425.26,431.98,444.85,456.74,457.16,452.63,449.96,450.55,451.31,450.97,454.08],
  "2018":[319.60,328.17,333.21,341.88,354.85,365.60,372.06,396.62,439.78,443.78,432.55,422.94],
  "2017":[284.99,288.59,291.58,293.79,295.31,295.52,297.65,300.18,300.90,306.04,312.21,316.48],
};
const VARSAYILAN_BM: Record<string, Record<string, number>> = {
  "2026":{"III.B":21050,"III.C":23400,"IV.A":26450,"IV.B":33900,"IV.C":40500,"V.A":42350},
  "2025":{"III.B":18200,"III.C":19150,"IV.A":21500,"IV.B":27500,"IV.C":32600,"V.A":34500},
  "2024":{"III.B":14400,"III.C":15100,"IV.A":15600,"IV.B":18200,"IV.C":21500,"V.A":22750},
  "2023":{"III.B":9600,"IV.A":10100,"IV.B":11900,"V.A":15200},
  "2022":{"III.B":5250,"IV.A":3050,"IV.B":3450,"V.A":4500},
  "2021":{"III.B":1450,"IV.A":1550,"IV.B":1800,"V.A":2350},
  "2020":{"III.B":1130,"IV.A":1210,"IV.B":1400,"V.A":1850},
  "2019":{"III.B":980,"IV.A":1070,"IV.B":1230,"V.A":1630},
  "2018":{"III.B":800,"IV.A":860,"IV.B":980,"V.A":1300},
  "2017":{"III.B":838,"IV.A":880,"IV.B":1005,"V.A":1340},
};

const GRUP_ESIKLER = [
  {grup:"A",min:2_476_500_000},{grup:"B",min:1_733_550_000},{grup:"B1",min:1_238_250_000},
  {grup:"C",min:866_775_000},{grup:"C1",min:619_125_000},{grup:"D",min:433_387_500},
  {grup:"D1",min:309_562_500},{grup:"E",min:216_693_750},{grup:"E1",min:154_781_250},
  {grup:"F",min:99_060_000},{grup:"F1",min:70_757_143},{grup:"G",min:45_375_000},
  {grup:"G1",min:32_400_000},{grup:"H",min:0},
];

function donemBul(tarih: string): string {
  const d=new Date(tarih); const yil=d.getFullYear(); const ay=d.getMonth()+1;
  if(yil>=2026)return"2026"; if(yil===2025)return"2025"; if(yil===2024)return"2024";
  if(yil===2023)return ay>=7?"2023-2":"2023-1";
  if(yil===2022)return ay>=9?"2022-3":ay>=5?"2022-2":"2022-1";
  if(yil>=2010)return String(yil); return"2010";
}

function ufeEndeksi(tarih: string, ufeData: Record<string,number[]>): number {
  const d=new Date(tarih); let yil=d.getFullYear(); let ay=d.getMonth()-1;
  if(ay<0){ay=11;yil-=1;}
  const arr=ufeData[String(yil)]; if(!arr)return ufeData["2010"]?.[0]||100;
  return arr[ay]??arr[arr.length-1];
}

const tl = (n: number) => new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(n);

const SINIFLAR = ["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"];

interface Props { refreshKey: number; onRefresh: () => void; }

/* ══════ BAĞIMSIZ HESAPLAMA ══════ */
export function AdminBagimsizHesaplama({ refreshKey, onRefresh }: Props) {
  const ufeData = { ...VARSAYILAN_UFE, ...loadLS("admin_ufe_data",{}) };
  const bmData  = { ...VARSAYILAN_BM,  ...loadLS("admin_bm_data", {}) };

  const [isler, setIsler] = useState([{ id:"1", tarih:"", sinif:"", alan:"", yukseklik:"" }]);
  const [sonuc, setSonuc] = useState<any[]|null>(null);
  const [loading, setLoading] = useState(false);

  const addIs = () => setIsler(p=>[...p,{id:crypto.randomUUID(),tarih:"",sinif:"",alan:"",yukseklik:""}]);
  const updIs = (id:string,f:string,v:string) => setIsler(p=>p.map(x=>x.id===id?{...x,[f]:v}:x));

  const hesapla = () => {
    setLoading(true);
    setTimeout(()=>{
      const sonuclar = isler.map(is=>{
        if(!is.tarih||!is.sinif||!is.alan) return null;
        const alan=parseFloat(is.alan.replace(/\./g,"").replace(",","."))||0;
        const don=donemBul(is.tarih);
        const bmSoz=(bmData[don]||{})[is.sinif]||0;
        const bmBas=(bmData["2026"]||{})[is.sinif]||bmSoz;
        const ufeSoz=ufeEndeksi(is.tarih,ufeData);
        const ufeBas=5029.76;
        const belge=Math.round(alan*bmSoz*0.85);
        const ufeKat=ufeBas/ufeSoz;
        const ymo=bmBas>0&&bmSoz>0?bmBas/bmSoz:1;
        const alt=ymo*0.90; const ust=ymo*1.30;
        let kat:number; let bant:string;
        if(ufeKat<alt){kat=alt;bant=`Alt sınır (ÜFE=${ufeKat.toFixed(3)} < ${alt.toFixed(3)})`;}
        else if(ufeKat>ust){kat=ust;bant=`Üst sınır (ÜFE=${ufeKat.toFixed(3)} > ${ust.toFixed(3)})`;}
        else{kat=ufeKat;bant=`ÜFE katsayısı (${ufeKat.toFixed(3)})`;}
        return {is, belge, ufeKat, kat, bant, guncel:Math.round(belge*kat), ufeSoz, ufeBas, bmSoz, bmBas};
      }).filter(Boolean);
      setSonuc(sonuclar);
      setLoading(false);
    },600);
  };

  const toplamGuncel = sonuc ? sonuc.reduce((s,r:any)=>s+(r.guncel||0),0) : 0;
  const grup = GRUP_ESIKLER.find(g=>toplamGuncel>=g.min)?.grup||"H";

  const iCls = "w-full px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[#0B1D3A] text-lg font-bold">Bağımsız Hesaplama</h2>
        <p className="text-[#5A6478] text-xs mt-0.5">Herhangi bir başvuruya bağlı olmadan ÜFE hesabı yapın.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#0B1D3A]">İş girişleri</h3>
          <button onClick={addIs} className="text-xs bg-[#0B1D3A] text-white px-3 py-1.5 rounded-lg hover:bg-[#122A54] transition-colors">+ İş Ekle</button>
        </div>
        <div className="space-y-3">
          {isler.map((is,i)=>(
            <div key={is.id} className="grid grid-cols-4 gap-3 p-3 bg-[#F8F7F4] rounded-xl">
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Sözleşme Tarihi</label>
                <input type="date" value={is.tarih} onChange={e=>updIs(is.id,"tarih",e.target.value)} min="2010-01-01" max="2026-12-31" className={iCls} />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Yapı Sınıfı</label>
                <select value={is.sinif} onChange={e=>updIs(is.id,"sinif",e.target.value)} className={iCls}>
                  <option value="">Seçiniz</option>{SINIFLAR.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Alan (m²)</label>
                <input value={is.alan} onChange={e=>updIs(is.id,"alan",e.target.value)} placeholder="5000" className={iCls} />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Yükseklik (m)</label>
                <input value={is.yukseklik} onChange={e=>updIs(is.id,"yukseklik",e.target.value)} placeholder="21.5" className={iCls} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={hesapla} disabled={loading} className="mt-4 w-full bg-[#0B1D3A] hover:bg-[#122A54] text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:bg-gray-200">
          {loading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Hesaplanıyor...</>:<><Calculator className="w-4 h-4"/>Hesapla</>}
        </button>
      </div>

      {sonuc&&(
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-white/60 text-xs mb-1">Toplam Güncel Tutar</p><p className="text-white text-2xl font-bold">{tl(toplamGuncel)}</p></div>
              <div className="text-right"><p className="text-white/60 text-xs mb-1">Grup</p><p className="text-[#C9952B] text-3xl font-black">{grup}</p></div>
            </div>
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {sonuc.map((r:any,i:number)=>(
              <div key={i} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#0B1D3A]">İş {i+1} — {r.is.sinif} · {r.is.tarih}</span>
                  <span className="text-[#C9952B] font-bold">{tl(r.guncel)}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#F8F7F4] rounded-lg p-3"><p className="text-[#5A6478] mb-0.5">Belge Tutarı</p><p className="font-medium text-[#0B1D3A]">{tl(r.belge)}</p></div>
                  <div className="bg-[#F8F7F4] rounded-lg p-3"><p className="text-[#5A6478] mb-0.5">Katsayı</p><p className="font-medium text-[#C9952B]">{r.kat.toFixed(4)}</p></div>
                  <div className="bg-[#F8F7F4] rounded-lg p-3"><p className="text-[#5A6478] mb-0.5">Bant</p><p className="font-medium text-[#0B1D3A]" style={{fontSize:10}}>{r.bant}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ BAĞIMSIZ MALİ YETERLİLİK ══════ */
export function AdminBagimsizMali({ refreshKey, onRefresh }: Props) {
  const [form, setForm] = useState({ donenVarlik:"", kvBorc:"", ozkaynak:"", toplamAktif:"", kvBankaBorc:"", yyMaliyet:"0", yyHakedis:"0", grup:"F1" });
  const p = (v:string) => parseFloat(v.replace(/\./g,"").replace(",","."))||0;
  const fmt = (v:string) => { const r=v.replace(/\D/g,""); return r?parseInt(r).toLocaleString("tr-TR"):""; };

  const cariOran = useMemo(()=>{ const pay=p(form.kvBorc)-p(form.yyHakedis); return pay>0?(p(form.donenVarlik)-p(form.yyMaliyet))/pay:null; },[form]);
  const ozOran   = useMemo(()=>{ const pay=p(form.toplamAktif)-p(form.yyMaliyet); return pay>0?p(form.ozkaynak)/pay:null; },[form]);
  const borcOran = useMemo(()=> p(form.ozkaynak)>0?p(form.kvBankaBorc)/p(form.ozkaynak):null,[form]);

  const ESIKLER = { cariOran:0.75, ozOran:0.15, borcOran:0.75 };
  const sonuclar = { cariOran:{val:cariOran,ok:cariOran!==null&&cariOran>=ESIKLER.cariOran,esik:`≥${ESIKLER.cariOran}`,buyuk:true}, ozOran:{val:ozOran,ok:ozOran!==null&&ozOran>=ESIKLER.ozOran,esik:`≥${ESIKLER.ozOran}`,buyuk:true}, borcOran:{val:borcOran,ok:borcOran!==null&&borcOran<=ESIKLER.borcOran,esik:`≤${ESIKLER.borcOran}`,buyuk:false} };
  const gecti = Object.values(sonuclar).every(s=>s.ok);

  const GRUP_CIRO: Record<string,{genel:number;yapim:number}> = {
    "A":{genel:371_475_000,yapim:297_180_000},"B":{genel:260_032_500,yapim:208_026_000},
    "B1":{genel:185_737_500,yapim:148_590_000},"C":{genel:130_016_250,yapim:104_013_000},
    "C1":{genel:92_868_750,yapim:74_295_000},"D":{genel:65_008_125,yapim:52_006_500},
    "D1":{genel:46_434_375,yapim:37_147_500},"E":{genel:32_504_063,yapim:26_003_250},
    "E1":{genel:23_217_188,yapim:18_573_750},"F":{genel:14_863_800,yapim:11_891_040},
    "F1":{genel:10_616_571,yapim:8_493_257},"G":{genel:0,yapim:0},"G1":{genel:0,yapim:0},"H":{genel:0,yapim:0},
  };
  const ciroSart = GRUP_CIRO[form.grup];

  const iCls = "w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] text-right";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[#0B1D3A] text-lg font-bold">Bağımsız Mali Yeterlilik</h2>
        <p className="text-[#5A6478] text-xs mt-0.5">Herhangi bir başvuruya bağlı olmadan mali yeterlilik analizi yapın.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
        <div className="flex items-center gap-4 mb-5">
          <div>
            <label className="block text-xs text-[#5A6478] mb-1">Başvurulacak Grup</label>
            <select value={form.grup} onChange={e=>setForm(f=>({...f,grup:e.target.value}))} className="px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]">
              {["A","B","B1","C","C1","D","D1","E","E1","F","F1","G","G1","H"].map(g=><option key={g} value={g}>Grup {g}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ["Dönen varlıklar","donenVarlik"],["Kısa vadeli borçlar","kvBorc"],
            ["Özkaynaklar","ozkaynak"],["Toplam aktif","toplamAktif"],
            ["KV banka borçları","kvBankaBorc"],["YY inşaat maliyetleri","yyMaliyet"],
            ["YY hakediş gelirleri","yyHakedis"],
          ].map(([lbl,field])=>(
            <div key={field}>
              <label className="block text-xs text-[#5A6478] mb-1">{lbl}</label>
              <input value={(form as any)[field]} onChange={e=>setForm(f=>({...f,[field]:fmt(e.target.value)}))} placeholder="0" className={iCls} />
            </div>
          ))}
        </div>
      </div>

      {/* Sonuçlar */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className={`p-4 border-b border-[#E8E4DC] flex items-center gap-3 ${gecti?"bg-green-50":"bg-[#F8F7F4]"}`}>
          {gecti?<CheckCircle className="w-5 h-5 text-green-600 shrink-0"/>:<AlertTriangle className="w-5 h-5 text-amber-500 shrink-0"/>}
          <p className={`text-sm font-semibold ${gecti?"text-green-800":"text-[#0B1D3A]"}`}>{gecti?"Mali yeterlilik şartları sağlanıyor":"Hesaplama sonuçları"}</p>
        </div>
        <div className="p-5 space-y-3">
          {[
            {label:"Cari oran",key:"cariOran"},{label:"Özkaynak oranı",key:"ozOran"},{label:"KV banka borç oranı",key:"borcOran"}
          ].map(({label,key})=>{
            const s=(sonuclar as any)[key]; if(!s)return null;
            return(
              <div key={key} className="flex items-center justify-between py-2 border-b border-[#F0EDE8] last:border-0">
                <span className="text-sm text-[#0B1D3A]">{label} <span className="text-xs text-[#5A6478]">({s.esik})</span></span>
                <div className="flex items-center gap-2">
                  {s.val!==null?<span className={`text-sm font-semibold ${s.ok?"text-green-600":"text-red-500"}`}>{s.val.toFixed(3)}</span>:<span className="text-sm text-[#9CA3AF]">—</span>}
                  {s.val!==null&&<span className={`text-xs px-2 py-0.5 rounded-full ${s.ok?"bg-green-50 text-green-700":"bg-red-50 text-red-600"}`}>{s.ok?"✓":"✗"}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ciro şartları */}
      {ciroSart&&(ciroSart.genel>0||ciroSart.yapim>0)&&(
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <h3 className="text-sm font-semibold text-[#0B1D3A] mb-3">Ciro şartları — Grup {form.grup}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8F7F4] rounded-xl p-3"><p className="text-xs text-[#5A6478] mb-1">Genel ciro (min)</p><p className="text-sm font-bold text-[#0B1D3A]">{tl(ciroSart.genel)}</p></div>
            <div className="bg-[#F8F7F4] rounded-xl p-3"><p className="text-xs text-[#5A6478] mb-1">Yapım işi ciro (min)</p><p className="text-sm font-bold text-[#0B1D3A]">{tl(ciroSart.yapim)}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
