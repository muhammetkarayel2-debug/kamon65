import { useState, useEffect } from "react";
import {
  Building2, Clock, CheckCircle, AlertTriangle, Send, ChevronDown,
  ChevronUp, Info, Calculator, FileText, Download
} from "lucide-react";
import {
  tamHesapla, guncelSinif2026,
  grupIcinBankaRef, grupIcinIsHacmi,
  tlSade, tlFormat
} from "./hesaplama-motor";

interface Props { refreshKey: number; onRefresh: () => void; }

/* ─── Hızlı Hesaplama modunda geçici iş girişi ─── */
interface HizliIs {
  id: string;
  isDeneyimiTipi: "kat_karsiligi" | "taahhut";
  adaParsel: string;
  sozlesmeTarihi: string;
  iskanTarihi: string;
  insaatAlaniM2: string;
  yapiYuksekligiM: string;
  yapiSinifi: string;
  yapiTipi: string;
  otelYildiz: number;
  hastaneYatak: string;
  sanayiDosemeYuku: string;
  avmAlanM2: string;
  adminSinif: string; // admin override
  taahhutBedeli: string;
}
function mkHizliIs(): HizliIs {
  return {
    id: crypto.randomUUID(), isDeneyimiTipi: "kat_karsiligi",
    adaParsel: "", sozlesmeTarihi: "", iskanTarihi: "",
    insaatAlaniM2: "", yapiYuksekligiM: "", yapiSinifi: "", yapiTipi: "konut",
    otelYildiz: 3, hastaneYatak: "", sanayiDosemeYuku: "", avmAlanM2: "",
    adminSinif: "", taahhutBedeli: "",
  };
}

function fmtNum(v:string){const r=v.replace(/\D/g,"");return r?new Intl.NumberFormat("tr-TR").format(Number(r)):"";}

/* ─── Sınıf önerisi hesapla ─── */
function sinifOneriHesapla(is: HizliIs | any): { oneri: string; sebep: string } | null {
  const h = parseFloat(is.yapiYuksekligiM || is.buildingHeight || "0") || 0;
  const tip = is.yapiTipi || "konut";
  if (!tip || tip === "diger") return null;
  const girdi: any = { yukseklikM: h, yapiTipi: tip };
  if (tip === "otel") girdi.otelYildiz = is.otelYildiz || 3;
  if (tip === "hastane") girdi.hastaneYatak = parseInt(is.hastaneYatak || "0") || 0;
  if (tip === "sanayi") girdi.sanayiDosemeYuku = parseInt(is.sanayiDosemeYuku || "0") || 0;
  if (tip === "avm") girdi.avmAlanM2 = parseFloat(String(is.insaatAlaniM2 || is.totalArea || "0").replace(/\./g,"")) || 0;
  const sonuc = guncelSinif2026(girdi);
  return sonuc.sinif === "diger" ? null : { oneri: sonuc.sinif, sebep: sonuc.sebep };
}

export function AdminHesaplama({ refreshKey, onRefresh }: Props) {
  /* Mod: "sirket" | "hizli" */
  const [mod, setMod] = useState<"sirket" | "hizli">("sirket");

  /* Şirkete bağlı hesaplama */
  const [companies, setCompanies]     = useState<any[]>([]);
  const [companyFull, setCompanyFull] = useState<any | null>(null);  // iş deneyimleri dahil
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [sonuclar, setSonuclar]       = useState<any | null>(null);
  const [sinifOnaylar, setSinifOnaylar] = useState<Record<string, string>>({});
  const [showDetay, setShowDetay]     = useState<Record<string, boolean>>({});
  const [adminNot, setAdminNot]       = useState("");
  const [rapordaGrup, setRapordaGrup] = useState("");
  const [sendMsg, setSendMsg]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [raporSaving, setRaporSaving] = useState(false);

  /* Hızlı hesaplama */
  const [hizliIsler, setHizliIsler]   = useState<HizliIs[]>([mkHizliIs()]);
  const [hizliReferans, setHizliReferans] = useState("");
  const [hizliSonuclar, setHizliSonuclar] = useState<any | null>(null);
  const [hizliMezuniyet, setHizliMezuniyet] = useState("");

  /* Şirket listesini yükle — ödeme alınmış olanlar */
  useEffect(() => {
    import("./supabase-client").then(({ adminGetAllCompanies }) => {
      adminGetAllCompanies().then(all => {
        const filtered = all.filter((c: any) =>
          ["payment_received","report_locked","report_published","docs_in_progress",
           "docs_complete","application_submitted","certificate_received"].includes(c.app_status)
        );
        setCompanies(filtered);
        setLoadingList(false);
      });
    });
  }, [refreshKey]);

  const selectedCompany = companies.find(c => c.id === selectedId);

  /* Şirket seçilince iş deneyimlerini yükle */
  const handleSelectCompany = async (id: string) => {
    setSelectedId(id);
    setSonuclar(null);
    setAdminNot("");
    setSinifOnaylar({});
    setShowDetay({});
    const { adminGetCompanyFull } = await import("./supabase-client");
    const full = await adminGetCompanyFull(id);
    setCompanyFull(full);
  };

  /* ─── Şirkete bağlı hesapla ─── */
  const handleHesapla = () => {
    if (!companyFull) return;
    setLoading(true);
    setTimeout(() => {
      const exps = (companyFull.experiences || []).map((e: any) => ({
        id:              e.id,
        sozlesmeTarihi:  e.sozlesme_tarihi || "",
        iskanTarihi:     e.iskan_tarihi || "",
        insaatAlaniM2:   e.insaat_alani_m2 || 0,
        isDeneyimiTipi:  (e.is_deneyimi_tipi || "kat_karsiligi") as "kat_karsiligi" | "taahhut",
        taahhutBedeli:   e.taahhut_bedeli || 0,
        yapiSinifi:      e.yapi_sinifi || "III.B",
        ruhsatSinifi:    e.yapi_sinifi || "III.B",
        ymoSinifi:       sinifOnaylar[e.id] || e.admin_onaylanan_sinif || undefined,
        yapiTipi:        e.yapi_tipi || "konut",
        yapiYuksekligiM: String(e.yapi_yuksekligi_m || "0"),
        adaParsel:       e.ada_parsel || "",
      }));
      const dip = companyFull.diploma;
      const result = tamHesapla(exps, dip?.grad_date || null);
      setSonuclar(result);
      setRapordaGrup(result.tercihEdilenGrup);
      setLoading(false);
    }, 400);
  };

  /* ─── Raporu gönder — Supabase ─── */
  const handleRaporGonder = async () => {
    if (!selectedCompany || !sonuclar) return;
    setRaporSaving(true);
    try {
      const { adminSendReport } = await import("./supabase-client");
      await adminSendReport({
        company_id:          selectedCompany.id,
        company_name:        selectedCompany.company_name,
        hesaplanan_grup:     rapordaGrup,
        tercih_yontem:       sonuclar.tercihEdilenYontem,
        toplam_guncel_tutar: sonuclar.tercihEdilenToplam,
        y1:                  sonuclar.y1,
        y2:                  sonuclar.y2,
        diploma:             sonuclar.diploma,
        is_detaylari:        sonuclar.isler,
        admin_notu:          adminNot || null,
        banka_ref_tutari:    grupIcinBankaRef(rapordaGrup) || null,
        is_hacmi:            grupIcinIsHacmi(rapordaGrup) || null,
        durum:               "yayinda",
      });
      setSendMsg("Rapor müşteriye gönderildi!");
      onRefresh();
      setTimeout(() => setSendMsg(""), 3000);
    } catch (e: any) {
      setSendMsg("⚠ " + (e.message || "Hata"));
    } finally {
      setRaporSaving(false);
    }
  };

  /* ─── Hızlı hesapla ─── */
  const handleHizliHesapla = () => {
    const exps = hizliIsler
      .filter(e => e.sozlesmeTarihi && (e.isDeneyimiTipi === "taahhut" ? e.taahhutBedeli : e.insaatAlaniM2))
      .map(e => ({
        id: e.id,
        sozlesmeTarihi: e.sozlesmeTarihi,
        iskanTarihi:    e.iskanTarihi,
        insaatAlaniM2:  parseFloat(e.insaatAlaniM2.replace(/\./g,"")) || 0,
        isDeneyimiTipi: e.isDeneyimiTipi,
        taahhutBedeli:  parseFloat(e.taahhutBedeli.replace(/\./g,"")) || 0,
        ruhsatSinifi:   e.yapiSinifi || "III.B",
        ymoSinifi:      e.adminSinif || undefined,
        yapiTipi:       e.yapiTipi,
        yapiYuksekligiM: e.yapiYuksekligiM,
        adaParsel:      e.adaParsel,
      }));
    const result = tamHesapla(exps, hizliMezuniyet || null);
    setHizliSonuclar(result);
  };

  const updHizli = (id: string, f: keyof HizliIs, v: any) =>
    setHizliIsler(p => p.map(x => x.id === id ? { ...x, [f]: v } : x));

  const iCls = "px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";
  const YAPI_TIPLERI = [
    { v: "konut", l: "Konut" }, { v: "konut_ticari", l: "Konut+Ticari" },
    { v: "ticari", l: "Ticari" }, { v: "sanayi", l: "Sanayi" },
    { v: "otel", l: "Otel" }, { v: "hastane", l: "Hastane" },
    { v: "avm", l: "AVM" }, { v: "diger", l: "Diğer" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">İş Deneyimi Hesaplama</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">Sınıf önerisi, ÜFE güncellemesi ve rapor gönderimi.</p>
        </div>
        {/* Mod seçimi */}
        <div className="flex bg-[#F0EDE8] rounded-xl p-1 gap-1">
          {[{ k: "sirket", l: "Şirkete Bağlı" }, { k: "hizli", l: "Hızlı Hesaplama" }].map(({ k, l }) => (
            <button key={k} onClick={() => setMod(k as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${mod === k ? "bg-white text-[#0B1D3A] shadow-sm" : "text-[#5A6478]"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════ ŞİRKETE BAĞLI MOD ══════════════ */}
      {mod === "sirket" && (
        <>
          {/* Şirket seçimi */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
            <h3 className="text-sm font-semibold text-[#0B1D3A] mb-4">1. Şirket Seçin</h3>
            {loadingList ? (
              <div className="text-center py-8 text-[#5A6478] text-sm">Yükleniyor...</div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-[#5A6478] text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 text-[#E8E4DC]" />
                Hesaplama bekleyen başvuru yok.
              </div>
            ) : (
              <div className="space-y-2">
                {companies.map((c: any) => {
                  const hasRapor = (companyFull?.reports || []).length > 0 && selectedId === c.id;
                  return (
                    <button key={c.id} onClick={() => handleSelectCompany(c.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${selectedId === c.id ? "border-[#C9952B] bg-[#C9952B]/5" : "border-[#E8E4DC] hover:border-[#C9952B]/40"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#0B1D3A]">{c.company_name}</p>
                          <p className="text-xs text-[#5A6478] mt-0.5">{c.tax_id} · {c.location === "istanbul" ? "İstanbul" : c.city}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasRapor && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Rapor var</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${c.app_status === "payment_received" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-[#F0EDE8] text-[#5A6478] border-[#E8E4DC]"}`}>
                            {c.app_status === "payment_received" ? "Ödeme alındı" : c.app_status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Şirket bilgi kartı */}
          {selectedCompany && (
            <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
              <h3 className="text-sm font-semibold text-[#0B1D3A] mb-3">Firma Bilgileri</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { l: "Unvan", v: selectedCompany.company_name },
                  { l: "Firma tipi", v: selectedCompany.company_type === "limited_as" ? "Limited / A.Ş." : selectedCompany.company_type === "sahis" ? "Şahıs" : selectedCompany.company_type },
                  { l: "Vergi no", v: selectedCompany.tax_id },
                  { l: "Telefon", v: selectedCompany.phone },
                  { l: "E-posta", v: selectedCompany.email },
                  { l: "Konum", v: selectedCompany.location === "istanbul" ? "İstanbul" : selectedCompany.city },
                  { l: "Paket", v: selectedCompany.service_label || selectedCompany.selected_service || "—" },
                  { l: "Hizmet modeli", v: selectedCompany.hizmet_modeli === "biz_yapiyoruz" ? "Biz yapıyoruz" : "Müşteri yapıyor" },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p className="text-[10px] text-[#5A6478] uppercase tracking-wide">{l}</p>
                    <p className="text-xs font-medium text-[#0B1D3A] mt-0.5">{v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seçili şirket */}
          {selectedCompany && (() => {
            /* companyFull'dan iş deneyimlerini oku — Supabase alan adları */
            const exps = (companyFull?.experiences || []).map((e: any) => ({
              ...e,
              // UI uyumu için alan adı alias'ları
              yapiSinifi:     e.yapi_sinifi,
              yapiYuksekligiM: String(e.yapi_yuksekligi_m || ""),
              yapiTipi:       e.yapi_tipi,
              adaParsel:      e.ada_parsel,
              sozlesmeTarihi: e.sozlesme_tarihi,
              iskanTarihi:    e.iskan_tarihi,
              insaatAlaniM2:  e.insaat_alani_m2,
              taahhutBedeli:  e.taahhut_bedeli,
              isDeneyimiTipi: e.is_deneyimi_tipi,
              iskanDosyaUrl:  e.iskan_dosya_url,
            }));
            const dip = companyFull?.diploma;
            const expsWithOneri = exps.map((e: any) => {
              const oneriSonuc = sinifOneriHesapla(e);
              const ruhsat = e.yapiSinifi || e.yapi_sinifi || "";
              const uyari = oneriSonuc && oneriSonuc.oneri !== ruhsat
                ? `Ruhsatta ${ruhsat}, 2026 tebliğine göre öneri: ${oneriSonuc.oneri} — ${oneriSonuc.sebep}`
                : null;
              return { ...e, _oneri: oneriSonuc, _uyari: uyari };
            });
            const uyariliIsler = expsWithOneri.filter((e: any) => e._uyari && !sinifOnaylar[e.id || e.ada_parsel]);

            return (
              <div className="space-y-4">
                {/* Şirket bilgileri */}
                <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-[#C9952B]" />
                    <h3 className="text-sm font-semibold text-[#0B1D3A]">2. Müşteri Bilgileri</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                    {[
                      ["Firma", selectedCompany.company_name],
                      ["Vergi No", selectedCompany.tax_id],
                      ["Tür", selectedCompany.company_type],
                      ["Hizmet", selectedCompany.service_label || selectedCompany.selected_service],
                      ["Mevcut Grup", selectedCompany.mevcut_grup || "—"],
                      ["Mevcut Yetki No", selectedCompany.mevcut_yetki_no || "—"],
                    ].map(([l, v]) => (
                      <div key={l}><p className="text-[#5A6478]">{l}</p><p className="font-medium text-[#0B1D3A]">{v || "—"}</p></div>
                    ))}
                  </div>

                  {/* İş deneyimleri */}
                  {exps.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[#0B1D3A] mb-3">İş Deneyimleri ({exps.length})</p>
                      {uyariliIsler.length > 0 && (
                        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">{uyariliIsler.length} iş için sınıf uyarısı var. Aşağıda her iş için onaylayın veya farklı sınıf seçin.</p>
                        </div>
                      )}
                      <div className="space-y-3">
                        {expsWithOneri.map((e: any, i: number) => {
                          const onayKey = e.id || e.adaParsel || String(i);
                          const sinifOnay = sinifOnaylar[onayKey];
                          const acik = showDetay[onayKey];
              const ruhsat = e.yapiSinifi || e.yapi_sinifi || "—";
                          return (
                            <div key={onayKey} className={`rounded-xl border overflow-hidden ${e._uyari && !sinifOnay ? "border-amber-200" : "border-[#E8E4DC]"}`}>
                              <button onClick={() => setShowDetay(s => ({ ...s, [onayKey]: !acik }))}
                                className="w-full p-4 text-left flex items-center justify-between hover:bg-[#F8F7F4] transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-[#0B1D3A] text-white text-xs font-medium flex items-center justify-center shrink-0">{i + 1}</div>
                                  <div>
                                    <p className="text-sm font-medium text-[#0B1D3A]">
                                      {(e.isDeneyimiTipi || e.is_deneyimi_tipi) === "kat_karsiligi" ? "Kat karşılığı" : "Taahhüt"} · {e.adaParsel || e.ada_parsel || "Ada/Parsel belirtilmemiş"}
                                    </p>
                                    <p className="text-xs text-[#5A6478] mt-0.5">
                                      Sözleşme: {e.sozlesmeTarihi || "—"} · İskan: {e.iskanTarihi || "—"} · Sınıf: {ruhsat}
                                      {sinifOnay && sinifOnay !== ruhsat && <span className="text-amber-600"> → Admin: {sinifOnay}</span>}
                                      {e.insaatAlaniM2 ? ` · ${e.insaatAlaniM2} m²` : ""}
                                      {e.yapiYuksekligiM && e.yapiYuksekligiM !== "0" ? ` · ${e.yapiYuksekligiM}m` : ""}
                                      {e.yapiTipi ? ` · ${e.yapiTipi}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {e._uyari && !sinifOnay && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                  {sinifOnay && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  {acik ? <ChevronUp className="w-4 h-4 text-[#5A6478]" /> : <ChevronDown className="w-4 h-4 text-[#5A6478]" />}
                                </div>
                              </button>

                              {acik && (
                                <div className="px-4 pb-4 pt-2 bg-[#FAFAF9] border-t border-[#F0EDE8] space-y-3">
                                  {/* Detay grid */}
                                  <div className="grid grid-cols-3 gap-3 text-xs">
                                    {[
                                      ["Alan", e.insaatAlaniM2 || e.totalArea ? `${e.insaatAlaniM2 || e.totalArea} m²` : "—"],
                                      ["Yükseklik", e.yapiYuksekligiM ? `${e.yapiYuksekligiM} m` : "—"],
                                      ["Kullanım", e.yapiTipi || "—"],
                                      ["İskan", e.iskanTarihi || "—"],
                                      ["Sözleşme", e.sozlesmeTarihi || "—"],
                                      ["Taahhüt Bedeli", e.taahhutBedeli ? `${Number(e.taahhutBedeli).toLocaleString("tr-TR")} ₺` : "—"],
                                    ].map(([l, v]) => (
                                      <div key={l}><p className="text-[#9CA3AF]">{l}</p><p className="text-[#0B1D3A] font-medium">{v}</p></div>
                                    ))}
                                  </div>

                                  {/* Sınıf önerisi */}
                                  {e._oneri && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <p className="text-xs font-medium text-blue-800 mb-1">Motor Sınıf Önerisi</p>
                                      <p className="text-xs text-blue-700">{e._oneri.sebep}</p>
                                      {e._uyari && (
                                        <p className="text-xs text-amber-700 mt-1 font-medium">⚠ Ruhsattaki sınıf ({ruhsat}) farklı</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Sınıf onay / override */}
                                  <div>
                                    <label className="block text-xs text-[#5A6478] mb-1.5">Hesaplamada kullanılacak 2026 sınıfı</label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {e._oneri && e._oneri.oneri !== ruhsat && (
                                        <button onClick={() => setSinifOnaylar(s => ({ ...s, [onayKey]: e._oneri.oneri }))}
                                          className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${sinifOnay === e._oneri.oneri ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}>
                                          Motor önerisi: {e._oneri.oneri}
                                        </button>
                                      )}
                                      <button onClick={() => setSinifOnaylar(s => ({ ...s, [onayKey]: ruhsat }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${sinifOnay === ruhsat || (!sinifOnay && ruhsat) ? "bg-[#0B1D3A] text-white border-[#0B1D3A]" : "bg-[#F0EDE8] text-[#5A6478] border-[#E8E4DC] hover:bg-[#E8E4DC]"}`}>
                                        Ruhsat sınıfını koru ({ruhsat})
                                      </button>
                                      <select value={sinifOnay || ruhsat} onChange={e2 => setSinifOnaylar(s => ({ ...s, [onayKey]: e2.target.value }))}
                                        className="px-3 py-1.5 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]">
                                        {["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"].map(s => (
                                          <option key={s} value={s}>{s}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Diploma */}
                  {dip && (
                    <div className="mt-4 bg-[#F8F7F4] rounded-xl p-3 text-xs">
                      <p className="font-medium text-[#0B1D3A] mb-1">Diploma</p>
                      <p className="text-[#5A6478]">{dip.partner_name} · {dip.department === "insaat_muhendisligi" ? "İnşaat Mühendisliği" : "Mimarlık"} · Mezuniyet: {dip.grad_date}</p>
                    </div>
                  )}

                  <button onClick={handleHesapla} disabled={loading || uyariliIsler.length > 0}
                    className="mt-4 w-full bg-[#0B1D3A] hover:bg-[#122A54] disabled:bg-gray-200 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                    <Calculator className="w-4 h-4" />
                    {loading ? "Hesaplanıyor..." : uyariliIsler.length > 0 ? `${uyariliIsler.length} sınıf uyarısı onaylanmalı` : "Hesapla"}
                  </button>
                </div>

                {/* Sonuçlar */}
                {sonuclar && (
                  <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-[#0B1D3A]">3. Hesaplama Sonuçları</h3>

                    {/* Y1/Y2 özeti */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Yöntem 1 — Son 5 Yıl", toplam: sonuclar.y1.toplamNet, grup: sonuclar.y1.grup, secildi: sonuclar.tercihEdilenYontem === "son5" },
                        { label: "Yöntem 2 — En Büyük × 2", toplam: sonuclar.y2.toplam, grup: sonuclar.y2.grup, secildi: sonuclar.tercihEdilenYontem === "son15" },
                      ].map(({ label, toplam, grup, secildi }) => (
                        <div key={label} className={`rounded-xl p-4 border ${secildi ? "border-[#C9952B] bg-[#C9952B]/5" : "border-[#E8E4DC] bg-[#F8F7F4]"}`}>
                          <p className="text-xs text-[#5A6478] mb-1">{label}</p>
                          <p className="text-lg font-bold text-[#0B1D3A]">{tlSade(toplam)}</p>
                          <p className={`text-xs font-medium mt-0.5 ${secildi ? "text-[#C9952B]" : "text-[#5A6478]"}`}>Grup {grup} {secildi ? "✓ Seçildi" : ""}</p>
                        </div>
                      ))}
                    </div>

                    {/* İş detayları */}
                    {sonuclar.isler.length > 0 && (
                      <div className="border border-[#E8E4DC] rounded-xl overflow-hidden">
                        <div className="bg-[#F8F7F4] px-4 py-2.5 text-xs font-medium text-[#0B1D3A]">İş Detayları</div>
                        {sonuclar.isler.map((is: any, i: number) => {
                          const s = is.sonuc || {};
                          const tipi = is.isDeneyimiTipi === "taahhut" ? "Taahhüt" : "Kat karşılığı";
                          const artisYuzde = s.kullanilanKatsayi ? `${((s.kullanilanKatsayi - 1) * 100).toFixed(0)}%` : "";
                          const bantMap: Record<string, string> = { ufe: "ÜFE", alt_sinir: "Alt sınır", ust_sinir: "Üst sınır" };
                          return (
                            <div key={is.id || i} className="px-4 py-3 border-t border-[#F0EDE8] text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-[#0B1D3A]">{is.adaParsel || `İş ${i + 1}`}</p>
                                  <span className="text-[10px] bg-[#F0EDE8] text-[#5A6478] px-1.5 py-0.5 rounded">{tipi}</span>
                                </div>
                                <p className="font-bold text-[#C9952B]">{tlSade(s.guncelTutar || 0)}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-2 mt-1.5 mb-1">
                                <div><p className="text-[#9CA3AF]">Eski tutar</p><p className="text-[#0B1D3A]">{tlSade(s.belgeTutari || 0)}</p></div>
                                <div><p className="text-[#9CA3AF]">Güncel tutar</p><p className="text-[#C9952B] font-medium">{tlSade(s.guncelTutar || 0)}</p></div>
                                <div><p className="text-[#9CA3AF]">Artış</p><p className="text-[#0B1D3A]">{s.kullanilanKatsayi?.toFixed(2)}× ({artisYuzde})</p></div>
                                <div><p className="text-[#9CA3AF]">Yöntem</p><p className="text-[#0B1D3A]">{bantMap[s.bantDurumu] || "—"}</p></div>
                              </div>
                              <p className="text-[#5A6478]">{s.sozlesmedenBugune}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Diploma */}
                    {sonuclar.diploma?.grup && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
                        <p className="font-medium text-blue-800">Diploma: {sonuclar.diploma.aciklama}</p>
                      </div>
                    )}

                    {/* Toplam ve eksik */}
                    <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div><p className="text-white/60 text-xs mb-1">Toplam Güncel İş Deneyimi</p><p className="text-white text-2xl font-bold">{tlFormat(sonuclar.tercihEdilenToplam)}</p></div>
                        <div className="text-right"><p className="text-white/60 text-xs mb-1">Hesaplanan Grup</p><p className="text-[#C9952B] text-3xl font-black">{sonuclar.tercihEdilenGrup}</p></div>
                      </div>
                      {sonuclar.eksikTutar > 0 && sonuclar.birUstGrup && (
                        <div className="bg-white/10 rounded-lg px-3 py-2 text-xs text-white/70">
                          {sonuclar.birUstGrup.grup} Grubu için <strong className="text-white">{tlSade(sonuclar.eksikTutar)}</strong> daha gerekiyor
                        </div>
                      )}
                    </div>

                    {/* Banka ref ve iş hacmi */}
                    {(sonuclar.bankaRefTutari || sonuclar.isHacmi?.genelCiro) && (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {sonuclar.bankaRefTutari && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <p className="text-amber-700 font-medium mb-1">EK-3 Banka Referans Mektubu</p>
                            <p className="text-amber-900 font-bold">{tlSade(sonuclar.bankaRefTutari)}</p>
                          </div>
                        )}
                        {sonuclar.isHacmi?.genelCiro && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                            <p className="text-blue-700 font-medium mb-1">EK-2 İş Hacmi (Genel Ciro)</p>
                            <p className="text-blue-900 font-bold">{tlSade(sonuclar.isHacmi.genelCiro)}</p>
                            <p className="text-blue-600 mt-0.5">Yapım: {tlSade(sonuclar.isHacmi.yapimCirosu)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Grup override */}
                    <div>
                      <label className="block text-xs text-[#5A6478] mb-1">Rapora Yazılacak Grup</label>
                      <div className="flex items-center gap-3">
                        <select value={rapordaGrup} onChange={e => setRapordaGrup(e.target.value)} className={iCls}>
                          {["A","B","B1","C","C1","D","D1","E","E1","F","F1","G","G1","H"].map(g => <option key={g} value={g}>Grup {g}</option>)}
                        </select>
                        {rapordaGrup !== sonuclar.tercihEdilenGrup && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Hesaplanan: {sonuclar.tercihEdilenGrup}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin notu */}
                    <div>
                      <label className="block text-xs text-[#5A6478] mb-1">Admin Notu (müşteri görür)</label>
                      <textarea value={adminNot} onChange={e => setAdminNot(e.target.value)} rows={3}
                        placeholder="Hesaplama açıklaması, öneriler..."
                        className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
                    </div>

                    <div className="flex items-center justify-between">
                      {sendMsg && <span className={`text-sm flex items-center gap-1.5 ${sendMsg.startsWith("⚠") ? "text-amber-600" : "text-green-600"}`}><CheckCircle className="w-4 h-4" />{sendMsg}</span>}
                      <button onClick={handleRaporGonder} disabled={raporSaving}
                        className="ml-auto bg-[#C9952B] hover:bg-[#B8862A] disabled:opacity-50 text-[#0B1D3A] font-medium px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-colors">
                        <Send className="w-4 h-4" /> {raporSaving ? "Gönderiliyor..." : "Raporu Müşteriye Gönder"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* ══════════════ HIZLI HESAPLAMA MODU ══════════════ */}
      {mod === "hizli" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Hızlı hesaplama şirkete bağlı değildir. Telefon görüşmesinde veya ön değerlendirme için kullanın.</p>
          </div>

          {/* Referans ismi */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
            <label className="block text-xs text-[#5A6478] mb-1.5">Referans / Müşteri Adı (opsiyonel)</label>
            <input value={hizliReferans} onChange={e => setHizliReferans(e.target.value.slice(0, 60))}
              placeholder="Müşteri adı veya not..."
              className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
          </div>

          {/* İş girişleri */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0B1D3A]">İş Deneyimleri</h3>
              <button onClick={() => setHizliIsler(p => [...p, mkHizliIs()])}
                className="text-xs bg-[#0B1D3A] text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                + İş ekle
              </button>
            </div>

            {hizliIsler.map((e, i) => {
              const oneriSonuc = sinifOneriHesapla(e);
              return (
                <div key={e.id} className="border border-[#E8E4DC] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#0B1D3A]">İş {i + 1}</span>
                    {hizliIsler.length > 1 && (
                      <button onClick={() => setHizliIsler(p => p.filter(x => x.id !== e.id))}
                        className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
                    )}
                  </div>

                  {/* İş türü */}
                  <div className="flex gap-2">
                    {[["kat_karsiligi", "Kat karşılığı"], ["taahhut", "Taahhüt"]].map(([v, l]) => (
                      <button key={v} onClick={() => updHizli(e.id, "isDeneyimiTipi", v)}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${e.isDeneyimiTipi === v ? "bg-[#0B1D3A] text-white border-[#0B1D3A]" : "border-[#E8E4DC] text-[#5A6478]"}`}>
                        {l}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-[#5A6478] mb-1">Sözleşme tarihi</label>
                      <input type="date" value={e.sozlesmeTarihi} onChange={ev => updHizli(e.id, "sozlesmeTarihi", ev.target.value)}
                        className="w-full px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#5A6478] mb-1">İskan tarihi</label>
                      <input type="date" value={e.iskanTarihi} onChange={ev => updHizli(e.id, "iskanTarihi", ev.target.value)}
                        className="w-full px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]" />
                    </div>
                    {e.isDeneyimiTipi === "kat_karsiligi" ? (
                      <div>
                        <label className="block text-xs text-[#5A6478] mb-1">İnşaat alanı (m²)</label>
                        <input value={e.insaatAlaniM2} onChange={ev => updHizli(e.id, "insaatAlaniM2", fmtNum(ev.target.value))}
                          placeholder="5.000"
                          className="w-full px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-[#5A6478] mb-1">Sözleşme bedeli (₺)</label>
                        <input value={e.taahhutBedeli} onChange={ev => updHizli(e.id, "taahhutBedeli", fmtNum(ev.target.value))}
                          placeholder="1.000.000"
                          className="w-full px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]" />
                      </div>
                    )}
                  </div>

                  {e.isDeneyimiTipi === "kat_karsiligi" && (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-[#5A6478] mb-1">Yükseklik (m)</label>
                          <input value={e.yapiYuksekligiM} onChange={ev => updHizli(e.id, "yapiYuksekligiM", ev.target.value)}
                            placeholder="21.50"
                            className="w-full px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#5A6478] mb-1">Kullanım amacı</label>
                          <select value={e.yapiTipi} onChange={ev => updHizli(e.id, "yapiTipi", ev.target.value)}
                            className="w-full px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]">
                            {YAPI_TIPLERI.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[#5A6478] mb-1">Ruhsat sınıfı</label>
                          <select value={e.yapiSinifi} onChange={ev => updHizli(e.id, "yapiSinifi", ev.target.value)}
                            className="w-full px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]">
                            <option value="">Seçiniz</option>
                            {["III.B","III.C","IV.A","IV.B","IV.C","V.A","V.B","V.C","V.D"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Detay sorular — yapiTipine göre */}
                      {e.yapiTipi === "otel" && (
                        <div>
                          <label className="block text-xs text-[#5A6478] mb-1">Otel yıldız sayısı</label>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map(y => (
                              <button key={y} onClick={() => updHizli(e.id, "otelYildiz", y)}
                                className={`w-8 h-8 rounded-lg text-xs border font-medium ${e.otelYildiz === y ? "bg-[#C9952B] text-white border-[#C9952B]" : "border-[#E8E4DC] text-[#5A6478]"}`}>
                                {y}★
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {e.yapiTipi === "hastane" && (
                        <div>
                          <label className="block text-xs text-[#5A6478] mb-1">Yatak sayısı</label>
                          <input type="number" value={e.hastaneYatak} onChange={ev => updHizli(e.id, "hastaneYatak", ev.target.value)}
                            placeholder="200" className="w-32 px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]" />
                        </div>
                      )}
                      {e.yapiTipi === "sanayi" && (
                        <div>
                          <label className="block text-xs text-[#5A6478] mb-1">Döşeme yükü (kg/m²)</label>
                          <input type="number" value={e.sanayiDosemeYuku} onChange={ev => updHizli(e.id, "sanayiDosemeYuku", ev.target.value)}
                            placeholder="500" className="w-32 px-2.5 py-2 border border-[#E8E4DC] rounded-lg text-xs focus:outline-none focus:border-[#C9952B]" />
                        </div>
                      )}

                      {/* Motor önerisi */}
                      {oneriSonuc && e.yapiSinifi && oneriSonuc.oneri !== e.yapiSinifi && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
                          ⚠ Motor önerisi: <strong>{oneriSonuc.oneri}</strong> — {oneriSonuc.sebep}
                          <div className="flex gap-2 mt-1.5">
                            <button onClick={() => updHizli(e.id, "adminSinif", oneriSonuc.oneri)}
                              className={`px-2 py-1 rounded text-xs ${e.adminSinif === oneriSonuc.oneri ? "bg-amber-600 text-white" : "bg-white border border-amber-300"}`}>
                              {oneriSonuc.oneri} kullan
                            </button>
                            <button onClick={() => updHizli(e.id, "adminSinif", e.yapiSinifi)}
                              className={`px-2 py-1 rounded text-xs ${e.adminSinif === e.yapiSinifi || !e.adminSinif ? "bg-amber-600 text-white" : "bg-white border border-amber-300"}`}>
                              {e.yapiSinifi} koru
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Diploma */}
            <div>
              <label className="block text-xs text-[#5A6478] mb-1.5">Mezuniyet tarihi (varsa)</label>
              <input type="date" value={hizliMezuniyet} onChange={e => setHizliMezuniyet(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
            </div>

            <button onClick={handleHizliHesapla}
              className="w-full bg-[#0B1D3A] hover:bg-[#122A54] text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
              <Calculator className="w-4 h-4" /> Hesapla
            </button>
          </div>

          {/* Hızlı sonuçlar */}
          {hizliSonuclar && (
            <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 space-y-4">
              {hizliReferans && <p className="text-xs text-[#5A6478]">Referans: <strong className="text-[#0B1D3A]">{hizliReferans}</strong></p>}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Son 5 Yıl", toplam: hizliSonuclar.y1.toplamNet, grup: hizliSonuclar.y1.grup, secildi: hizliSonuclar.tercihEdilenYontem === "son5" },
                  { label: "En Büyük × 2", toplam: hizliSonuclar.y2.toplam, grup: hizliSonuclar.y2.grup, secildi: hizliSonuclar.tercihEdilenYontem === "son15" },
                ].map(({ label, toplam, grup, secildi }) => (
                  <div key={label} className={`rounded-xl p-4 border ${secildi ? "border-[#C9952B] bg-[#C9952B]/5" : "border-[#E8E4DC] bg-[#F8F7F4]"}`}>
                    <p className="text-xs text-[#5A6478] mb-1">{label}</p>
                    <p className="text-lg font-bold text-[#0B1D3A]">{tlSade(toplam)}</p>
                    <p className={`text-xs font-medium mt-0.5 ${secildi ? "text-[#C9952B]" : "text-[#5A6478]"}`}>Grup {grup} {secildi ? "✓" : ""}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-white/60 text-xs mb-1">Toplam</p><p className="text-white text-xl font-bold">{tlFormat(hizliSonuclar.tercihEdilenToplam)}</p></div>
                  <div className="text-right"><p className="text-white/60 text-xs mb-1">Grup</p><p className="text-[#C9952B] text-3xl font-black">{hizliSonuclar.tercihEdilenGrup}</p></div>
                </div>
              </div>

              {(hizliSonuclar.bankaRefTutari || hizliSonuclar.isHacmi?.genelCiro) && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {hizliSonuclar.bankaRefTutari && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-amber-700 font-medium mb-1">Banka Referans Mektubu</p>
                      <p className="text-amber-900 font-bold">{tlSade(hizliSonuclar.bankaRefTutari)}</p>
                    </div>
                  )}
                  {hizliSonuclar.isHacmi?.genelCiro && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-blue-700 font-medium mb-1">Genel Ciro (en az)</p>
                      <p className="text-blue-900 font-bold">{tlSade(hizliSonuclar.isHacmi.genelCiro)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => {
                  const lines = [
                    `Hızlı Hesaplama Raporu`,
                    hizliReferans ? `Referans: ${hizliReferans}` : "",
                    `Tarih: ${new Date().toLocaleDateString("tr-TR")}`,
                    ``,
                    `Yöntem 1 (Son 5 Yıl): ${tlSade(hizliSonuclar.y1.toplamNet)} → Grup ${hizliSonuclar.y1.grup}`,
                    `Yöntem 2 (En Büyük × 2): ${tlSade(hizliSonuclar.y2.toplam)} → Grup ${hizliSonuclar.y2.grup}`,
                    `Seçilen: ${tlSade(hizliSonuclar.tercihEdilenToplam)} → Grup ${hizliSonuclar.tercihEdilenGrup}`,
                    hizliSonuclar.bankaRefTutari ? `Banka Ref Mektubu: ${tlSade(hizliSonuclar.bankaRefTutari)}` : "",
                  ].filter(Boolean).join("\n");
                  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url;
                  a.download = `hizli-hesaplama-${new Date().toISOString().slice(0,10)}.txt`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                  className="flex items-center gap-2 text-xs bg-[#F0EDE8] hover:bg-[#E8E4DC] text-[#0B1D3A] px-4 py-2 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" /> Raporu İndir
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
