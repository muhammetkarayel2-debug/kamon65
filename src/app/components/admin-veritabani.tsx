import { useState, useMemo } from "react";
import { Plus, Save, Edit2, Trash2, CheckCircle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

const UFE_KEY  = "admin_ufe_data";
const BM_KEY   = "admin_bm_data";

function loadLS(key: string, fb: any): any { try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {} return fb; }
function saveLS(key: string, v: any) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

const VARSAYILAN_UFE: Record<string, number[]> = {
  "2026": [4910.53, 5029.76],
  "2025": [3861.33,3943.01,4017.30,4128.19,4230.69,4334.94,4409.73,4518.89,4632.89,4708.20,4747.63,4783.04],
  "2024": [3035.59,3149.03,3252.79,3369.98,3435.96,3483.25,3550.88,3610.51,3659.84,3707.10,3731.43,3746.52],
  "2023": [2105.17,2138.04,2147.44,2164.94,2179.02,2320.72,2511.75,2659.60,2749.98,2803.29,2882.04,2915.02],
  "2022": [1129.03,1210.60,1321.90,1423.27,1548.01,1652.75,1738.21,1780.05,1865.09,2011.13,2026.08,2021.19],
  "2021": [583.38,590.52,614.93,641.63,666.79,693.54,710.61,730.28,741.58,780.45,858.43,1022.25],
  "2020": [462.42,464.64,468.69,474.69,482.02,485.37,490.33,501.85,515.13,533.44,555.18,568.27],
  "2019": [424.86,425.26,431.98,444.85,456.74,457.16,452.63,449.96,450.55,451.31,450.97,454.08],
  "2018": [319.60,328.17,333.21,341.88,354.85,365.60,372.06,396.62,439.78,443.78,432.55,422.94],
  "2017": [284.99,288.59,291.58,293.79,295.31,295.52,297.65,300.18,300.90,306.04,312.21,316.48],
  "2016": [250.67,250.16,251.17,252.47,256.21,257.27,257.81,258.01,258.77,260.94,266.16,274.09],
  "2015": [236.61,239.46,241.97,245.42,248.15,248.78,247.99,250.43,254.25,253.74,250.13,249.31],
};

const VARSAYILAN_BM: Record<string, Record<string, number>> = {
  "2026": {"III.B":21050,"III.C":23400,"IV.A":26450,"IV.B":33900,"IV.C":40500,"V.A":42350},
  "2025": {"III.B":18200,"III.C":19150,"IV.A":21500,"IV.B":27500,"IV.C":32600,"V.A":34500},
  "2024": {"III.B":14400,"III.C":15100,"IV.A":15600,"IV.B":18200,"IV.C":21500,"V.A":22750},
  "2023": {"III.B":9600,"IV.A":10100,"IV.B":11900,"V.A":15200},
  "2022": {"III.B":5250,"IV.A":3050,"IV.B":3450,"V.A":4500},
  "2021": {"III.B":1450,"IV.A":1550,"IV.B":1800,"V.A":2350},
  "2020": {"III.B":1130,"IV.A":1210,"IV.B":1400,"V.A":1850},
  "2019": {"III.B":980,"IV.A":1070,"IV.B":1230,"V.A":1630},
  "2018": {"III.B":800,"IV.A":860,"IV.B":980,"V.A":1300},
  "2017": {"III.B":838,"IV.A":880,"IV.B":1005,"V.A":1340},
};

const AYLAR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const SINIFLAR = ["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"];

interface Props { refreshKey: number; onRefresh: () => void; }

export function AdminVeritabani({ refreshKey, onRefresh }: Props) {
  const [aktifTab, setAktifTab] = useState<"ufe"|"bm">("ufe");
  const [ufeData, setUfeData] = useState<Record<string, number[]>>(() => ({ ...VARSAYILAN_UFE, ...loadLS(UFE_KEY, {}) }));
  const [bmData, setBmData]   = useState<Record<string, Record<string, number>>>(() => ({ ...VARSAYILAN_BM, ...loadLS(BM_KEY, {}) }));
  const [editYil, setEditYil] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<string[]>([]);
  const [bmEditYil, setBmEditYil] = useState<string | null>(null);
  const [bmEditBuf, setBmEditBuf] = useState<Record<string, string>>({});
  const [yeniYil, setYeniYil] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const iCls = "px-2 py-1.5 border border-[#E8E4DC] rounded text-sm focus:outline-none focus:border-[#C9952B] text-right w-full";

  /* ── ÜFE Kaydet ── */
  const ufeKaydet = (yil: string) => {
    const vals = editBuf.map(v => parseFloat(v) || 0);
    const yeni = { ...ufeData, [yil]: vals };
    setUfeData(yeni); saveLS(UFE_KEY, yeni); setEditYil(null);
    setSaveMsg("Kaydedildi"); setTimeout(() => setSaveMsg(""), 2000); onRefresh();
  };

  /* ── BM Kaydet ── */
  const bmKaydet = (yil: string) => {
    const vals: Record<string, number> = {};
    Object.entries(bmEditBuf).forEach(([s, v]) => { if (v) vals[s] = parseFloat(v) || 0; });
    const yeni = { ...bmData, [yil]: vals };
    setBmData(yeni); saveLS(BM_KEY, yeni); setBmEditYil(null);
    setSaveMsg("Kaydedildi"); setTimeout(() => setSaveMsg(""), 2000); onRefresh();
  };

  /* ── Yeni yıl ekle ── */
  const yilEkle = () => {
    if (!yeniYil || ufeData[yeniYil]) return;
    if (aktifTab === "ufe") {
      const yeni = { ...ufeData, [yeniYil]: Array(12).fill(0) };
      setUfeData(yeni); setEditYil(yeniYil); setEditBuf(Array(12).fill("0"));
    } else {
      const yeni = { ...bmData, [yeniYil]: {} };
      setBmData(yeni); setBmEditYil(yeniYil); setBmEditBuf({});
    }
    setYeniYil("");
  };

  const ufeYillar = Object.keys(ufeData).sort((a,b) => Number(b) - Number(a));
  const bmYillar  = Object.keys(bmData).sort((a,b) => Number(b) - Number(a));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">Veri Tabanı Yönetimi</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">Yİ-ÜFE endeksleri ve yapı birim maliyetlerini görüntüle ve düzenle.</p>
        </div>
        {saveMsg && <span className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />{saveMsg}</span>}
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2">
        {[{key:"ufe",label:"Yİ-ÜFE Endeksleri"},{key:"bm",label:"Yapı Birim Maliyetleri"}].map(({key,label})=>(
          <button key={key} onClick={()=>setAktifTab(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktifTab===key?"bg-[#0B1D3A] text-white":"bg-white border border-[#E8E4DC] text-[#5A6478] hover:text-[#0B1D3A]"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Yeni yıl ekle */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E8E4DC] p-4">
        <input value={yeniYil} onChange={e => setYeniYil(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Yeni yıl (örn: 2027)"
          className="px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] w-40" />
        <button onClick={yilEkle} disabled={!yeniYil||yeniYil.length!==4}
          className="flex items-center gap-1.5 bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-200 text-[#0B1D3A] px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus className="w-4 h-4" /> Yıl Ekle
        </button>
      </div>

      {/* ÜFE Tablosu */}
      {aktifTab === "ufe" && (
        <div className="space-y-3">
          {ufeYillar.map(yil => {
            const vals = ufeData[yil] || [];
            const isEdit = editYil === yil;
            return (
              <div key={yil} className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC]">
                  <span className="text-sm font-semibold text-[#0B1D3A]">{yil} Yİ-ÜFE Endeksleri</span>
                  <div className="flex gap-2">
                    {isEdit ? (
                      <>
                        <button onClick={() => setEditYil(null)} className="text-xs text-[#5A6478] border border-[#E8E4DC] px-3 py-1.5 rounded-lg hover:bg-[#F0EDE8]">İptal</button>
                        <button onClick={() => ufeKaydet(yil)} className="text-xs bg-[#C9952B] text-[#0B1D3A] px-3 py-1.5 rounded-lg flex items-center gap-1"><Save className="w-3 h-3"/>Kaydet</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditYil(yil); setEditBuf(vals.map(v => String(v))); }} className="text-xs text-[#C9952B] border border-[#C9952B]/30 px-3 py-1.5 rounded-lg hover:bg-[#C9952B]/5 flex items-center gap-1">
                        <Edit2 className="w-3 h-3"/> Düzenle
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                    {AYLAR.map((ay, i) => (
                      <div key={ay}>
                        <div className="text-[10px] text-[#5A6478] text-center mb-1">{ay}</div>
                        {isEdit ? (
                          <input value={editBuf[i] ?? ""} onChange={e => { const b=[...editBuf]; b[i]=e.target.value; setEditBuf(b); }}
                            className={iCls} style={{width:"100%"}} />
                        ) : (
                          <div className={`text-xs text-center py-1.5 rounded ${vals[i]?'text-[#0B1D3A]':'text-[#B0ACA4]'}`}>
                            {vals[i] ? vals[i].toFixed(2) : "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Birim Maliyet Tablosu */}
      {aktifTab === "bm" && (
        <div className="space-y-3">
          {bmYillar.map(yil => {
            const vals = bmData[yil] || {};
            const isEdit = bmEditYil === yil;
            return (
              <div key={yil} className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 bg-[#F8F7F4] border-b border-[#E8E4DC]">
                  <span className="text-sm font-semibold text-[#0B1D3A]">{yil} Birim Maliyetler (₺/m²)</span>
                  <div className="flex gap-2">
                    {isEdit ? (
                      <>
                        <button onClick={() => setBmEditYil(null)} className="text-xs text-[#5A6478] border border-[#E8E4DC] px-3 py-1.5 rounded-lg hover:bg-[#F0EDE8]">İptal</button>
                        <button onClick={() => bmKaydet(yil)} className="text-xs bg-[#C9952B] text-[#0B1D3A] px-3 py-1.5 rounded-lg flex items-center gap-1"><Save className="w-3 h-3"/>Kaydet</button>
                      </>
                    ) : (
                      <button onClick={() => { setBmEditYil(yil); setBmEditBuf(Object.fromEntries(Object.entries(vals).map(([k,v])=>[k,String(v)]))); }} className="text-xs text-[#C9952B] border border-[#C9952B]/30 px-3 py-1.5 rounded-lg hover:bg-[#C9952B]/5 flex items-center gap-1">
                        <Edit2 className="w-3 h-3"/> Düzenle
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {SINIFLAR.map(sinif => (
                      <div key={sinif} className="text-center">
                        <div className="text-xs font-medium text-[#5A6478] mb-1.5">{sinif}</div>
                        {isEdit ? (
                          <input value={bmEditBuf[sinif] ?? ""} onChange={e => setBmEditBuf(b => ({...b,[sinif]:e.target.value}))} placeholder="0"
                            className={iCls} />
                        ) : (
                          <div className={`text-sm py-2 rounded-lg ${vals[sinif]?'text-[#0B1D3A] font-medium bg-[#F8F7F4]':'text-[#B0ACA4] bg-[#F0EDE8]/30'}`}>
                            {vals[sinif] ? vals[sinif].toLocaleString("tr-TR") : "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
