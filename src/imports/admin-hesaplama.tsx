import { useState, useMemo } from "react";
import {
  Calculator, ChevronDown, CheckCircle, AlertTriangle, X,
  Send, FileText, Clock, TrendingUp, Building2, Info, Save
} from "lucide-react";

// ─── Storage ───
function loadLS(key: string, fallback: any): any {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {}
  return fallback;
}
function saveLS(key: string, v: any) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

const COMPANIES_KEY   = "mock_panel_companies";
const REPORTS_KEY     = "mock_panel_reports";
const MOCK_PROCESS_KEY = "mock_panel_process";

// ─── Hesaplama Motoru (inline — hesaplama.ts bağımsız) ───
const UFE: Record<string, number[]> = {
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
  "2014": [229.10,232.27,233.98,234.18,232.96,233.09,234.79,235.78,237.79,239.97,237.65,235.84],
  "2013": [206.91,206.65,208.33,207.27,209.34,212.39,214.50,214.59,216.48,217.97,219.31,221.74],
  "2012": [203.10,202.91,203.64,203.81,204.89,201.83,201.20,201.71,203.79,204.15,207.54,207.29],
  "2011": [182.75,185.90,188.17,189.32,189.61,189.62,189.57,192.91,195.89,199.03,200.32,202.33],
  "2010": [164.94,167.68,170.94,174.96,172.95,172.08,171.81,173.79,174.67,176.78,176.23,178.54],
};

const BM: Record<string, Record<string, number>> = {
  "2026":   { "III.B":21050,"III.C":23400,"IV.A":26450,"IV.B":33900,"IV.C":40500,"V.A":42350 },
  "2025":   { "III.B":18200,"III.C":19150,"IV.A":21500,"IV.B":27500,"IV.C":32600,"V.A":34500 },
  "2024":   { "III.B":14400,"III.C":15100,"IV.A":15600,"IV.B":18200,"IV.C":21500,"V.A":22750 },
  "2023-2": { "III.B":9600,"IV.A":10100,"IV.B":11900,"V.A":15200 },
  "2023-1": { "III.B":6350,"IV.A":6850,"IV.B":7800,"V.A":10400 },
  "2022-3": { "III.B":5250 },
  "2022-2": { "III.B":3850 },
  "2022-1": { "III.B":2800,"IV.A":3050,"IV.B":3450,"V.A":4500 },
  "2021":   { "III.B":1450,"IV.A":1550,"IV.B":1800,"V.A":2350 },
  "2020":   { "III.B":1130,"IV.A":1210,"IV.B":1400,"V.A":1850 },
  "2019":   { "III.B":980,"IV.A":1070,"IV.B":1230,"V.A":1630 },
  "2018":   { "III.B":800,"IV.A":860,"IV.B":980,"V.A":1300 },
  "2017":   { "III.B":838,"IV.A":880,"IV.B":1005,"V.A":1340 },
  "2016":   { "III.B":630,"IV.A":680,"IV.B":775,"V.A":1030 },
  "2015":   { "III.B":565,"IV.A":610,"IV.B":695,"V.A":925 },
  "2014":   { "III.B":650,"IV.A":700,"IV.B":800,"V.A":1150 },
  "2013":   { "III.B":460,"IV.A":500,"IV.B":570,"V.A":755 },
  "2012":   { "III.B":435,"IV.A":470,"IV.B":535,"V.A":710 },
  "2011":   { "III.B":400,"IV.A":435,"IV.B":495,"V.A":655 },
  "2010":   { "III.B":360,"IV.A":400,"IV.B":450,"V.A":600 },
};

// Grup eşikleri (2026)
const GRUP_ESIKLER = [
  { grup: "A",  min: 2_476_500_000 },
  { grup: "B",  min: 1_733_550_000 },
  { grup: "B1", min: 1_238_250_000 },
  { grup: "C",  min:   866_775_000 },
  { grup: "C1", min:   619_125_000 },
  { grup: "D",  min:   433_387_500 },
  { grup: "D1", min:   309_562_500 },
  { grup: "E",  min:   216_693_750 },
  { grup: "E1", min:   154_781_250 },
  { grup: "F",  min:    99_060_000 },
  { grup: "F1", min:    70_757_143 },
  { grup: "G",  min:    45_375_000 },
  { grup: "G1", min:    32_400_000 },
  { grup: "H",  min:             0 },
];

function donemBul(tarih: string): string {
  const d = new Date(tarih); const yil = d.getFullYear(); const ay = d.getMonth() + 1;
  if (yil >= 2026) return "2026"; if (yil === 2025) return "2025"; if (yil === 2024) return "2024";
  if (yil === 2023) return ay >= 7 ? "2023-2" : "2023-1";
  if (yil === 2022) return ay >= 9 ? "2022-3" : ay >= 5 ? "2022-2" : "2022-1";
  if (yil >= 2010) return String(yil); return "2010";
}

function ufeEndeksi(tarih: string): number {
  const d = new Date(tarih); let yil = d.getFullYear(); let ay = d.getMonth() - 1;
  if (ay < 0) { ay = 11; yil -= 1; }
  const arr = UFE[String(yil)]; if (!arr) return UFE["2010"][0];
  return arr[ay] ?? arr[arr.length - 1];
}

function hesaplaIsDeneyimi(sozlesmeTarihi: string, yapiSinifi: string, alanM2: number) {
  const sozDon = donemBul(sozlesmeTarihi);
  const basDon = "2026";
  const bfSoz = BM[sozDon]?.[yapiSinifi] ?? 0;
  const bfBas = BM[basDon]?.[yapiSinifi] ?? BM["2026"]?.["III.B"] ?? 0;
  const ufeSoz = ufeEndeksi(sozlesmeTarihi);
  const ufeBas = 5029.76; // Şubat 2026 referans
  const belge = Math.round(alanM2 * bfSoz * 0.85);
  const ufeKat = ufeBas / ufeSoz;
  const ymo = bfBas / bfSoz;
  const alt = ymo * 0.90; const ust = ymo * 1.30;
  let kat: number; let bantDurumu: string; let bantAciklama: string;
  if (ufeKat < alt) { kat = alt; bantDurumu = "alt_sinir"; bantAciklama = `ÜFE (${ufeKat.toFixed(3)}) < alt sınır (${alt.toFixed(3)}) → alt sınır`; }
  else if (ufeKat > ust) { kat = ust; bantDurumu = "ust_sinir"; bantAciklama = `ÜFE (${ufeKat.toFixed(3)}) > üst sınır (${ust.toFixed(3)}) → üst sınır`; }
  else { kat = ufeKat; bantDurumu = "ufe"; bantAciklama = `ÜFE (${ufeKat.toFixed(3)}) bant içinde`; }
  return { belge, bfSoz, sozDon, ufeSoz, ufeBas, ufeKat, bfBas, basDon, ymo, alt, ust, kat, bantDurumu, bantAciklama, guncelTutar: Math.round(belge * kat) };
}

function grupBul(toplamTL: number): string {
  for (const g of GRUP_ESIKLER) { if (toplamTL >= g.min) return g.grup; }
  return "H";
}

const tl = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

interface Props { refreshKey: number; onRefresh: () => void; }

export function AdminHesaplama({ refreshKey, onRefresh }: Props) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [basvuruTarihi, setBasvuruTarihi] = useState(new Date().toISOString().slice(0, 10));
  const [sonuclar, setSonuclar] = useState<any | null>(null);
  const [adminNot, setAdminNot] = useState("");
  const [rapordaGorunecekGrup, setRapordaGorunecekGrup] = useState("");
  const [sendMsg, setSendMsg] = useState("");
  const [certificateClass, setCertificateClass] = useState("");
  const [certificateNo, setCertificateNo] = useState("");
  const [barcodeNo, setBarcodeNo] = useState("");
  const [basvuruDurumu, setBasvuruDurumu] = useState<"hazirlanıyor"|"yapildi"|"eksik_evrak"|"tamamlandi">("hazirlanıyor");
  const [hesaplaLoading, setHesaplaLoading] = useState(false);

  const companies = useMemo(() => {
    const all = loadLS(COMPANIES_KEY, []) as any[];
    // Sadece ödeme alınmış ve hesaplama bekleyenler
    return all.filter(c =>
      c.qualifications && (c.qualifications.hasYapiIsi || c.qualifications.hasDiploma)
    );
  // eslint-disable-next-line
  }, [refreshKey]);

  const selectedCompany = companies.find((c: any) => c.id === selectedCompanyId);

  const handleHesapla = () => {
    if (!selectedCompany) return;
    setHesaplaLoading(true);

    setTimeout(() => {
      const q = selectedCompany.qualifications;
      const isler: any[] = [];
      let toplamGuncel = 0;

      if (q?.hasYapiIsi && q?.experiences?.length) {
        q.experiences.forEach((e: any, i: number) => {
          if (e.isDeneyimiTipi === "kat_karsiligi" && e.contractDate && e.totalArea && e.buildingClass) {
            const alan = parseFloat(String(e.totalArea).replace(/\./g, "").replace(",", ".")) || 0;
            const sonuc = hesaplaIsDeneyimi(e.contractDate, e.buildingClass, alan);
            isler.push({ ...e, index: i + 1, sonuc, tip: "kat_karsiligi" });
            toplamGuncel += sonuc.guncelTutar;
          } else if (e.isDeneyimiTipi === "taahhut" && e.contractDate && e.sozlesmeBedeli) {
            const bedel = parseFloat(String(e.sozlesmeBedeli).replace(/\./g, "").replace(",", ".")) || 0;
            // Taahhüt: ÜFE ile güncelleme — belge tutarı = sözleşme bedeli
            const ufeSoz = ufeEndeksi(e.contractDate);
            const ufeBas = 5029.76;
            const ufeKat = ufeBas / ufeSoz;
            const guncelTutar = Math.round(bedel * ufeKat);
            isler.push({ ...e, index: i + 1, sonuc: { belge: bedel, ufeKat, guncelTutar, bantAciklama: `Taahhüt — ÜFE katsayısı: ${ufeKat.toFixed(3)}`, ufeSoz, ufeBas }, tip: "taahhut" });
            toplamGuncel += guncelTutar;
          }
        });
      }

      const hesaplananGrup = grupBul(toplamGuncel);
      setRapordaGorunecekGrup(hesaplananGrup);

      setSonuclar({ isler, toplamGuncel, hesaplananGrup, basvuruTarihi, hasDiploma: q?.hasDiploma, diploma: q?.diploma });
      setHesaplaLoading(false);
    }, 800);
  };

  const handleRaporGonder = () => {
    if (!selectedCompany || !sonuclar) return;

    const rapor = {
      id: crypto.randomUUID(),
      companyId: selectedCompany.id,
      companyName: selectedCompany.companyName,
      olusturmaTarihi: new Date().toISOString(),
      basvuruTarihi,
      hesaplananGrup: rapordaGorunecekGrup,
      certificateGroup: rapordaGorunecekGrup,
      certificateClass: certificateClass || "—",
      certificateNo: certificateNo || "",
      barcodeNo: barcodeNo || "",
      basvuruDurumu,
      toplamGuncelTutar: sonuclar.toplamGuncel,
      isDetaylari: sonuclar.isler,
      hasDiploma: sonuclar.hasDiploma,
      diploma: sonuclar.diploma,
      adminNotu: adminNot,
      durum: "yayinda",
    };

    // Raporu kaydet
    const raporlar = loadLS(REPORTS_KEY, {});
    if (!raporlar[selectedCompany.id]) raporlar[selectedCompany.id] = [];
    raporlar[selectedCompany.id].push(rapor);
    saveLS(REPORTS_KEY, raporlar);

    // Şirket durumunu güncelle
    const all = loadLS(COMPANIES_KEY, []);
    saveLS(COMPANIES_KEY, all.map((c: any) =>
      c.id === selectedCompany.id
        ? { ...c, appStatus: "report_published", hesaplananGrup: rapordaGorunecekGrup, updatedAt: new Date().toISOString() }
        : c
    ));

    setSendMsg("Rapor müşteriye gönderildi!");
    onRefresh();
    setTimeout(() => setSendMsg(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#0B1D3A] text-lg font-bold">İş Deneyimi Hesaplama</h2>
        <p className="text-[#5A6478] text-xs mt-0.5">Müşteri verilerini okuyun, ÜFE hesaplamasını yapın ve raporu gönderin.</p>
      </div>

      {/* Şirket Seçimi */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
        <h3 className="text-sm font-semibold text-[#0B1D3A] mb-4">1. Şirket Seçin</h3>
        {companies.length === 0 ? (
          <div className="text-center py-8 text-[#5A6478] text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 text-[#E8E4DC]" />
            Hesaplama bekleyen başvuru yok.
          </div>
        ) : (
          <div className="space-y-2">
            {companies.map((c: any) => {
              const hasRapor = loadLS(REPORTS_KEY, {})[c.id]?.length > 0;
              return (
                <button key={c.id} onClick={() => { setSelectedCompanyId(c.id); setSonuclar(null); setAdminNot(""); }}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${selectedCompanyId === c.id ? "border-[#C9952B] bg-[#C9952B]/5" : "border-[#E8E4DC] hover:border-[#C9952B]/40"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0B1D3A]">{c.companyName}</p>
                      <p className="text-xs text-[#5A6478] mt-0.5">{c.taxId} · {c.location === "istanbul" ? "İstanbul" : c.city}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasRapor && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Rapor var</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${c.appStatus === "payment_received" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-[#F0EDE8] text-[#5A6478] border-[#E8E4DC]"}`}>
                        {c.appStatus === "payment_received" ? "Ödeme alındı" : c.appStatus || "Bekliyor"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Seçili şirket detayı */}
      {selectedCompany && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <h3 className="text-sm font-semibold text-[#0B1D3A] mb-4">2. İş Deneyimi Verileri</h3>
          <div className="space-y-3">
            {selectedCompany.qualifications?.experiences?.map((e: any, i: number) => (
              <div key={i} className="bg-[#F8F7F4] rounded-xl p-4 border border-[#E8E4DC]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B1D3A] text-white flex items-center justify-center text-xs">{i + 1}</span>
                  <span className="text-sm font-medium text-[#0B1D3A]">{e.isDeneyimiTipi === "kat_karsiligi" ? "Kat Karşılığı" : "Taahhüt / İhale"}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-[#5A6478]">Ada/Parsel</p><p className="font-medium text-[#0B1D3A]">{e.adaParsel || "—"}</p></div>
                  <div><p className="text-[#5A6478]">Sözleşme Tarihi</p><p className="font-medium text-[#0B1D3A]">{e.contractDate || "—"}</p></div>
                  {e.isDeneyimiTipi === "kat_karsiligi" && <>
                    <div><p className="text-[#5A6478]">Alan (m²)</p><p className="font-medium text-[#0B1D3A]">{e.totalArea || "—"}</p></div>
                    <div><p className="text-[#5A6478]">Yapı Sınıfı</p><p className="font-medium text-[#0B1D3A]">{e.buildingClass || "—"}</p></div>
                  </>}
                  {e.isDeneyimiTipi === "taahhut" && <>
                    <div><p className="text-[#5A6478]">Sözleşme Bedeli</p><p className="font-medium text-[#0B1D3A]">{e.sozlesmeBedeli || "—"} ₺</p></div>
                    <div><p className="text-[#5A6478]">İskan/Kabul</p><p className="font-medium text-[#0B1D3A]">{e.occupancyDate || "—"}</p></div>
                  </>}
                </div>
              </div>
            ))}
            {selectedCompany.qualifications?.hasDiploma && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-1">Diploma</p>
                <p className="text-xs text-blue-700">{selectedCompany.qualifications.diploma?.partnerName} — {selectedCompany.qualifications.diploma?.department === "insaat_muhendisligi" ? "İnşaat Mühendisliği" : "Mimarlık"}</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-xs text-[#5A6478] mb-1">Başvuru / Referans Tarihi</label>
            <input type="date" value={basvuruTarihi} onChange={e => setBasvuruTarihi(e.target.value)} className="px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
          </div>

          <button onClick={handleHesapla} disabled={hesaplaLoading}
            className="mt-4 w-full bg-[#0B1D3A] hover:bg-[#122A54] disabled:bg-gray-200 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            {hesaplaLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Hesaplanıyor...</> : <><Calculator className="w-4 h-4" /> Hesapla</>}
          </button>
        </div>
      )}

      {/* Hesaplama Sonuçları */}
      {sonuclar && (
        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-5">
            <h3 className="text-white font-bold mb-1">3. Hesaplama Sonuçları</h3>
            <p className="text-white/60 text-xs">{selectedCompany?.companyName} · {basvuruTarihi}</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Her iş için detay */}
            {sonuclar.isler.map((is: any, i: number) => (
              <div key={i} className="border border-[#E8E4DC] rounded-xl overflow-hidden">
                <div className="bg-[#F8F7F4] px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0B1D3A]">İş {is.index} — {is.isDeneyimiTipi === "kat_karsiligi" ? "Kat Karşılığı" : "Taahhüt"}</span>
                  <span className="text-sm font-bold text-[#C9952B]">{tl(is.sonuc.guncelTutar)}</span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div><p className="text-[#5A6478]">Belge Tutarı</p><p className="font-medium">{tl(is.sonuc.belge)}</p></div>
                  <div><p className="text-[#5A6478]">ÜFE Sözleşme</p><p className="font-medium">{is.sonuc.ufeSoz?.toFixed(2)}</p></div>
                  <div><p className="text-[#5A6478]">ÜFE Başvuru</p><p className="font-medium">{is.sonuc.ufeBas?.toFixed(2)}</p></div>
                  <div className="sm:col-span-2"><p className="text-[#5A6478]">Bant Durumu</p><p className={`font-medium ${is.sonuc.bantDurumu === "ufe" ? "text-green-600" : "text-amber-600"}`}>{is.sonuc.bantAciklama}</p></div>
                  <div><p className="text-[#5A6478]">Kullanılan Katsayı</p><p className="font-medium text-[#C9952B]">{is.sonuc.kat?.toFixed(4)}</p></div>
                </div>
              </div>
            ))}

            {/* Toplam & Grup */}
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/60 text-xs">Toplam Güncel İş Deneyimi</p>
                  <p className="text-white text-2xl font-bold">{tl(sonuclar.toplamGuncel)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs">Hesaplanan Grup</p>
                  <p className="text-[#C9952B] text-3xl font-black">{sonuclar.hesaplananGrup}</p>
                </div>
              </div>
              {sonuclar.hasDiploma && (
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg px-3 py-2 text-xs text-blue-200">
                  Diploma başvurusu mevcut — grup tayinine dahil edilmedi, manuel değerlendirin.
                </div>
              )}
            </div>

            {/* Admin grubu düzenleme */}
            <div>
              <label className="block text-xs text-[#5A6478] mb-1">Rapora Yazılacak Grup (düzenleyebilirsiniz)</label>
              <div className="flex items-center gap-3">
                <select value={rapordaGorunecekGrup} onChange={e => setRapordaGorunecekGrup(e.target.value)}
                  className="px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]">
                  {["A","B","B1","C","C1","D","D1","E","E1","F","F1","G","G1","H"].map(g => <option key={g} value={g}>Grup {g}</option>)}
                </select>
                {rapordaGorunecekGrup !== sonuclar.hesaplananGrup && (
                  <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Hesaplanan: {sonuclar.hesaplananGrup}</span>
                )}
              </div>
            </div>

            {/* Yapı sınıfı */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Yapı sınıfı (opsiyonel)</label>
                <input value={certificateClass} onChange={e => setCertificateClass(e.target.value)} placeholder="Örn: III.B, IV.A"
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Başvuru aşaması</label>
                <select value={basvuruDurumu} onChange={e => setBasvuruDurumu(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]">
                  <option value="hazirlanıyor">Evraklar inceleniyor</option>
                  <option value="yapildi">Başvuru yapıldı</option>
                  <option value="eksik_evrak">Eksik evrak bildirimi</option>
                  <option value="tamamlandi">Başvuru tamamlandı</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Barkod no (başvuru yapıldıysa)</label>
                <input value={barcodeNo} onChange={e => setBarcodeNo(e.target.value)} placeholder="YKB-2026-XXXXX"
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] font-mono" />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Belge no (alındıysa)</label>
                <input value={certificateNo} onChange={e => setCertificateNo(e.target.value)} placeholder="MYB-2026-XXXXX"
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] font-mono" />
              </div>
            </div>

            {/* Admin notu */}
            <div>
              <label className="block text-xs text-[#5A6478] mb-1">Rapora Eklenecek Not (müşteri görür)</label>
              <textarea value={adminNot} onChange={e => setAdminNot(e.target.value)} rows={3} placeholder="Hesaplama açıklaması, öneriler, dikkat edilecek hususlar..."
                className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
            </div>

            {/* Rapor Gönder */}
            <div className="flex items-center justify-between">
              {sendMsg && <span className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />{sendMsg}</span>}
              <button onClick={handleRaporGonder}
                className="ml-auto bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-colors">
                <Send className="w-4 h-4" /> Raporu Müşteriye Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
