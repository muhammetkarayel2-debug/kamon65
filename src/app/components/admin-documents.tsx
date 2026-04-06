import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen, Search, ChevronDown, CheckCircle, X, AlertTriangle,
  Clock, Upload, Send, FileText, Download
} from "lucide-react";
import { formatDate } from "./admin-data";

interface Props { refreshKey: number; onRefresh: () => void; }

function DurumBadge({ durum }: { durum: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    bekleniyor: { cls: "bg-[#F0EDE8] text-[#5A6478] border-[#E8E4DC]", label: "Bekleniyor"  },
    bekliyor:   { cls: "bg-amber-50 text-amber-700 border-amber-200",   label: "İnceleniyor" },
    onaylandi:  { cls: "bg-green-50 text-green-700 border-green-200",   label: "Onaylandı"   },
    reddedildi: { cls: "bg-red-50 text-red-600 border-red-200",         label: "Reddedildi"  },
  };
  const s = map[durum] || map.bekleniyor;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>;
}

export function AdminDocuments({ refreshKey, onRefresh }: Props) {
  const [documents, setDocuments]       = useState<any[]>([]);
  const [companies, setCompanies]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [durumFilter, setDurumFilter]   = useState<string>("Tümü");
  const [yukleyenFilter, setYukleyenFilter] = useState<"Tümü" | "customer" | "admin">("Tümü");
  const [modalEvrak, setModalEvrak]     = useState<any | null>(null);
  const [adminNotu, setAdminNotu]       = useState("");
  const [musteriNotu, setMusteriNotu]   = useState("");
  const [saveMsg, setSaveMsg]           = useState("");
  const [saving, setSaving]             = useState(false);

  /* Admin belge gönderme */
  const [showGonderModal, setShowGonderModal] = useState(false);
  const [gonderCompanyId, setGonderCompanyId] = useState("");
  const [gonderBaslik, setGonderBaslik]       = useState("");
  const [gonderNot, setGonderNot]             = useState("");
  const [gonderTip, setGonderTip]             = useState<"fatura"|"barkod"|"dekont"|"diger">("fatura");
  const [gonderFile, setGonderFile]           = useState<File | null>(null);
  const [gonderMsg, setGonderMsg]             = useState("");
  const [gonderSaving, setGonderSaving]       = useState(false);

  const load = useCallback(async () => {
    const { adminGetAllDocuments, adminGetAllCompanies } = await import("./supabase-client");
    const [docs, comps] = await Promise.all([adminGetAllDocuments(), adminGetAllCompanies()]);
    setDocuments(docs);
    setCompanies(comps);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [refreshKey, load]);

  const counts = {
    bekleniyor:  documents.filter(d => d.durum === "bekleniyor").length,
    bekliyor:    documents.filter(d => d.durum === "bekliyor").length,
    onaylandi:   documents.filter(d => d.durum === "onaylandi").length,
    reddedildi:  documents.filter(d => d.durum === "reddedildi").length,
  };
  const inceleniyor = counts.bekliyor;

  const filtered = documents.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (d.company_name || "").toLowerCase().includes(q)
      || (d.baslik || "").toLowerCase().includes(q);
    const matchDurum = durumFilter === "Tümü" || d.durum === durumFilter
      || (durumFilter === "bekliyor" && d.durum === "bekliyor");
    const matchYukleyen = yukleyenFilter === "Tümü" || d.yuklayan === yukleyenFilter;
    return matchSearch && matchDurum && matchYukleyen;
  });

  const handleOnayla = async () => {
    if (!modalEvrak) return;
    setSaving(true);
    try {
      const { adminUpdateDocumentStatus } = await import("./supabase-client");
      await adminUpdateDocumentStatus(modalEvrak.id, "onaylandi", adminNotu || undefined);
      setSaveMsg("Onaylandı ✓");
      setTimeout(() => { setSaveMsg(""); setModalEvrak(null); onRefresh(); }, 800);
    } catch (e: any) { setSaveMsg("⚠ " + e.message); }
    finally { setSaving(false); }
  };

  const handleReddet = async () => {
    if (!modalEvrak || !musteriNotu.trim()) return;
    setSaving(true);
    try {
      const { adminUpdateDocumentStatus } = await import("./supabase-client");
      await adminUpdateDocumentStatus(modalEvrak.id, "reddedildi", musteriNotu);
      setSaveMsg("Reddedildi");
      setTimeout(() => { setSaveMsg(""); setModalEvrak(null); onRefresh(); }, 800);
    } catch (e: any) { setSaveMsg("⚠ " + e.message); }
    finally { setSaving(false); }
  };

  const handleGonder = async () => {
    if (!gonderCompanyId || !gonderBaslik) return;
    setGonderSaving(true);
    try {
      const { adminSendDocument } = await import("./supabase-client");
      await adminSendDocument(gonderCompanyId, gonderBaslik, gonderTip, gonderNot || undefined, gonderFile || undefined);
      setGonderMsg("Gönderildi ✓");
      setTimeout(() => {
        setGonderMsg(""); setShowGonderModal(false);
        setGonderCompanyId(""); setGonderBaslik("");
        setGonderNot(""); setGonderTip("fatura"); setGonderFile(null);
        onRefresh();
      }, 800);
    } catch (e: any) { setGonderMsg("⚠ " + e.message); }
    finally { setGonderSaving(false); }
  };

  const inputCls = "w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">Evrak Yönetimi</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">{documents.length} evrak</p>
        </div>
        <button onClick={() => setShowGonderModal(true)}
          className="flex items-center gap-2 bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Send className="w-4 h-4" /> Müşteriye Belge Gönder
        </button>
      </div>

      {/* Sayaçlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "bekliyor",   label: "İnceleme Bekliyor", val: inceleniyor,         color: "text-amber-600",  bg: "bg-amber-50"  },
          { key: "reddedildi", label: "Hatalı",            val: counts.reddedildi,   color: "text-red-600",    bg: "bg-red-50"    },
          { key: "onaylandi",  label: "Onaylanan",         val: counts.onaylandi,    color: "text-green-600",  bg: "bg-green-50"  },
          { key: "bekleniyor", label: "Bekleniyor",        val: counts.bekleniyor,   color: "text-[#5A6478]",  bg: "bg-[#F0EDE8]" },
        ].map(s => (
          <div key={s.key} className={`${s.bg} rounded-xl p-3 text-center cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={() => setDurumFilter(durumFilter === s.key ? "Tümü" : s.key)}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className={`text-xs ${s.color} mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Şirket veya evrak adı..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
        </div>
        <div className="relative">
          <select value={durumFilter} onChange={e => setDurumFilter(e.target.value)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            <option value="Tümü">Tüm durumlar</option>
            <option value="bekliyor">İnceleme Bekliyor</option>
            <option value="bekleniyor">Bekleniyor</option>
            <option value="onaylandi">Onaylanan</option>
            <option value="reddedildi">Reddedilen</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478] pointer-events-none" />
        </div>
        <div className="relative">
          <select value={yukleyenFilter} onChange={e => setYukleyenFilter(e.target.value as any)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            <option value="Tümü">Tüm yükleyenler</option>
            <option value="customer">Müşteri yüklemeleri</option>
            <option value="admin">Admin gönderimleri</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478] pointer-events-none" />
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F7F4] border-b border-[#E8E4DC]">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-[#5A6478] font-medium">Şirket</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Evrak</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden sm:table-cell">Dosya</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Durum</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden md:table-cell">Kaynak</th>
                <th className="text-right px-5 py-3 text-xs text-[#5A6478] font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-[#5A6478] text-sm">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[#5A6478] text-sm">Evrak bulunamadı.</td></tr>
              ) : filtered.map((d) => (
                <tr key={d.id} className="hover:bg-[#F8F7F4]">
                  <td className="px-5 py-3">
                    <p className="text-[#0B1D3A] font-medium text-sm">{d.company_name}</p>
                    <p className="text-[#9CA3AF] text-xs">{d.grubu}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#0B1D3A]">{d.baslik}</p>
                    {d.belge_turu && (
                      <span className="text-[10px] bg-[#F0EDE8] text-[#5A6478] px-1.5 py-0.5 rounded">
                        {d.belge_turu}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {d.dosya_adi ? (
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-[#0B1D3A] truncate max-w-[150px]">{d.dosya_adi}</p>
                        {d.dosya_url && (
                          <a href={d.dosya_url} target="_blank" rel="noreferrer"
                            className="text-[#C9952B] hover:text-[#B8862A] shrink-0">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ) : <span className="text-[#9CA3AF] text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3"><DurumBadge durum={d.durum} /></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.yuklayan === "admin" ? "bg-blue-50 text-blue-700" : "bg-[#F0EDE8] text-[#5A6478]"}`}>
                      {d.yuklayan === "admin" ? "Admin" : "Müşteri"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {d.yuklayan === "customer" && (d.durum === "bekliyor" || d.durum === "bekleniyor") ? (
                      <button onClick={() => { setModalEvrak(d); setAdminNotu(""); setMusteriNotu(""); setSaveMsg(""); }}
                        className="text-xs bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-3 py-1.5 rounded-lg transition-colors font-medium">
                        İncele
                      </button>
                    ) : d.yuklayan === "customer" ? (
                      <button onClick={() => { setModalEvrak(d); setAdminNotu(""); setMusteriNotu(""); setSaveMsg(""); }}
                        className="text-xs bg-[#F0EDE8] hover:bg-[#E8E4DC] text-[#5A6478] px-3 py-1.5 rounded-lg transition-colors">
                        Detay
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── İnceleme Modal ── */}
      {modalEvrak && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalEvrak(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">{modalEvrak.baslik}</h3>
                <p className="text-white/60 text-xs mt-0.5">{modalEvrak.company_name} · {modalEvrak.grubu}</p>
              </div>
              <button onClick={() => setModalEvrak(null)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                <span className="text-xs text-[#5A6478]">Durum:</span>
                <DurumBadge durum={modalEvrak.durum} />
              </div>

              {/* Dosya */}
              {modalEvrak.dosya_adi ? (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-700 truncate">{modalEvrak.dosya_adi}</p>
                    {modalEvrak.olusturulma && (
                      <p className="text-xs text-blue-600">{formatDate(modalEvrak.olusturulma)}</p>
                    )}
                  </div>
                  {modalEvrak.dosya_url && (
                    <a href={modalEvrak.dosya_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0">
                      <Download className="w-3.5 h-3.5" /> İndir
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-[#F8F7F4] border border-[#E8E4DC] rounded-xl">
                  <Upload className="w-5 h-5 text-[#5A6478] shrink-0" />
                  <p className="text-sm text-[#5A6478]">Henüz dosya yüklenmedi.</p>
                </div>
              )}

              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Admin Notu <span className="text-[10px]">(müşteri görmez)</span></label>
                <textarea value={adminNotu} onChange={e => setAdminNotu(e.target.value)} rows={2}
                  placeholder="İç not..."
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">
                  Red Sebebi <span className="text-[10px] text-red-400">(reddetmek için zorunlu — müşteriye gösterilir)</span>
                </label>
                <textarea value={musteriNotu} onChange={e => setMusteriNotu(e.target.value)} rows={2}
                  placeholder="Belgeyi reddetme sebebini açıklayın..."
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
              </div>
            </div>

            <div className="p-5 border-t border-[#E8E4DC] flex items-center justify-between">
              {saveMsg && (
                <span className={`text-sm flex items-center gap-1 ${saveMsg.startsWith("⚠") ? "text-amber-600" : "text-green-600"}`}>
                  {saveMsg.startsWith("⚠") ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  {saveMsg}
                </span>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={handleReddet} disabled={saving || !musteriNotu.trim()}
                  className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-600 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Reddet
                </button>
                <button onClick={handleOnayla} disabled={saving}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Belge Gönderme Modal ── */}
      {showGonderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGonderModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4DC]">
              <div>
                <h3 className="text-[#0B1D3A] font-bold">Müşteriye Belge Gönder</h3>
                <p className="text-xs text-[#5A6478] mt-0.5">Fatura PDF, barkod görseli, dekont vb.</p>
              </div>
              <button onClick={() => setShowGonderModal(false)} className="text-[#5A6478] hover:text-[#0B1D3A]"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Şirket <span className="text-red-400">*</span></label>
                <select value={gonderCompanyId} onChange={e => setGonderCompanyId(e.target.value)} className={inputCls}>
                  <option value="">Şirket seçiniz</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Belge türü</label>
                <div className="grid grid-cols-4 gap-2">
                  {[["fatura","Fatura"],["barkod","Barkod"],["dekont","Dekont"],["diger","Diğer"]].map(([v, l]) => (
                    <button key={v} onClick={() => setGonderTip(v as any)}
                      className={`py-2 rounded-lg text-xs border transition-all ${gonderTip === v ? "bg-[#0B1D3A] text-white border-[#0B1D3A]" : "border-[#E8E4DC] text-[#5A6478] hover:border-[#C9952B]"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Başlık <span className="text-red-400">*</span></label>
                <input value={gonderBaslik} onChange={e => setGonderBaslik(e.target.value)}
                  placeholder="Örn: Fatura — Nisan 2026" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Not (opsiyonel)</label>
                <input value={gonderNot} onChange={e => setGonderNot(e.target.value)}
                  placeholder="Müşteriye kısa not..." className={inputCls} />
              </div>
              {/* Dosya yükleme — Supabase Storage üzerinden */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Dosya (opsiyonel)</label>
                <label className="flex items-center gap-3 border border-dashed border-[#0B1D3A]/15 hover:border-[#C9952B]/50 rounded-xl px-4 py-3 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#5A6478] shrink-0" />
                  <span className="text-sm text-[#5A6478]">
                    {gonderFile ? gonderFile.name : "PDF, JPG veya PNG yükle"}
                  </span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={ev => setGonderFile(ev.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-[#E8E4DC] flex items-center justify-between">
              {gonderMsg && (
                <span className={`text-sm flex items-center gap-1 ${gonderMsg.startsWith("⚠") ? "text-amber-600" : "text-green-600"}`}>
                  {gonderMsg.startsWith("⚠") ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  {gonderMsg}
                </span>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setShowGonderModal(false)}
                  className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">İptal</button>
                <button onClick={handleGonder} disabled={gonderSaving || !gonderCompanyId || !gonderBaslik}
                  className="px-4 py-2 text-sm bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-200 text-[#0B1D3A] rounded-lg flex items-center gap-1.5 transition-colors">
                  <Send className="w-4 h-4" /> {gonderSaving ? "Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
