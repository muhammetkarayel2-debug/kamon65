import { useState, useMemo } from "react";
import {
  FolderOpen, Search, ChevronDown, CheckCircle, X, AlertTriangle,
  Clock, Eye, Upload, MessageSquare
} from "lucide-react";
import { Company, loadFromStorage, saveToStorage, MOCK_COMPANIES_KEY, formatDate } from "./admin-data";

interface Props { refreshKey: number; onRefresh: () => void; }

const DOC_ITEMS_KEY = "admin_document_items";

interface DocItem {
  id: string;
  companyId: string;
  companyName: string;
  evrakBaslik: string;
  evrakGrubu: string;
  zorunlu: boolean;
  durum: "bekleniyor" | "yuklendi" | "onaylandi" | "reddedildi";
  dosyaAdi?: string;
  adminNotu?: string;
  musteriNotu?: string;
  yuklenmeTarihi?: string;
}

type DurumFilter = "Tümü" | DocItem["durum"];

function DurumBadge({ durum }: { durum: DocItem["durum"] }) {
  const map = {
    bekleniyor:  { cls: "bg-[#F0EDE8] text-[#5A6478] border-[#E8E4DC]",    label: "Bekleniyor",   icon: <Clock className="w-3 h-3" /> },
    yuklendi:    { cls: "bg-amber-50 text-amber-700 border-amber-200",        label: "İnceleniyor",  icon: <Eye className="w-3 h-3" /> },
    onaylandi:   { cls: "bg-green-50 text-green-700 border-green-200",        label: "Onaylandı",    icon: <CheckCircle className="w-3 h-3" /> },
    reddedildi:  { cls: "bg-red-50 text-red-600 border-red-200",             label: "Reddedildi",   icon: <X className="w-3 h-3" /> },
  };
  const s = map[durum];
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>{s.icon}{s.label}</span>;
}

export function AdminDocuments({ refreshKey, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [durumFilter, setDurumFilter] = useState<DurumFilter>("Tümü");
  const [selectedItem, setSelectedItem] = useState<DocItem | null>(null);
  const [adminNotu, setAdminNotu] = useState("");
  const [musteriNotu, setMusteriNotu] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const { items, counts } = useMemo(() => {
    const companies = loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []);
    const stored = loadFromStorage<DocItem[]>(DOC_ITEMS_KEY, []);

    const items: DocItem[] = stored.length > 0 ? stored :
      companies.flatMap(c => [
        { id: crypto.randomUUID(), companyId: c.id, companyName: c.companyName || "—", evrakBaslik: "Mükellefiyet Belgesi", evrakGrubu: "Kimlik", zorunlu: true, durum: "bekleniyor" as const },
        { id: crypto.randomUUID(), companyId: c.id, companyName: c.companyName || "—", evrakBaslik: "İmza Sirküleri / Beyannamesi", evrakGrubu: "Kimlik", zorunlu: true, durum: "bekleniyor" as const },
        { id: crypto.randomUUID(), companyId: c.id, companyName: c.companyName || "—", evrakBaslik: "Yapı Ruhsatı", evrakGrubu: "İş Deneyimi", zorunlu: true, durum: "bekleniyor" as const },
        { id: crypto.randomUUID(), companyId: c.id, companyName: c.companyName || "—", evrakBaslik: "İskan Belgesi", evrakGrubu: "İş Deneyimi", zorunlu: true, durum: "bekleniyor" as const },
      ]);

    const counts = {
      bekleniyor: items.filter(i => i.durum === "bekleniyor").length,
      yuklendi:   items.filter(i => i.durum === "yuklendi").length,
      onaylandi:  items.filter(i => i.durum === "onaylandi").length,
      reddedildi: items.filter(i => i.durum === "reddedildi").length,
    };

    return { items, counts };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.companyName.toLowerCase().includes(q) || item.evrakBaslik.toLowerCase().includes(q);
      const matchDurum = durumFilter === "Tümü" || item.durum === durumFilter;
      return matchSearch && matchDurum;
    });
  }, [items, search, durumFilter]);

  const updateItem = (id: string, updates: Partial<DocItem>) => {
    const all = loadFromStorage<DocItem[]>(DOC_ITEMS_KEY, items);
    const updated = all.map(i => i.id === id ? { ...i, ...updates } : i);
    saveToStorage(DOC_ITEMS_KEY, updated);
    onRefresh();
  };

  const openItem = (item: DocItem) => {
    setSelectedItem(item);
    setAdminNotu(item.adminNotu || "");
    setMusteriNotu(item.musteriNotu || "");
    setSaveMsg("");
  };

  const handleOnayla = () => {
    if (!selectedItem) return;
    updateItem(selectedItem.id, { durum: "onaylandi", adminNotu, musteriNotu });
    setSaveMsg("Onaylandı");
    setTimeout(() => { setSaveMsg(""); setSelectedItem(null); }, 800);
  };

  const handleReddet = () => {
    if (!selectedItem || !musteriNotu.trim()) return;
    updateItem(selectedItem.id, { durum: "reddedildi", adminNotu, musteriNotu });
    setSaveMsg("Reddedildi");
    setTimeout(() => { setSaveMsg(""); setSelectedItem(null); }, 800);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[#0B1D3A] text-lg font-bold">Evrak Yönetimi</h2>
        <p className="text-[#5A6478] text-xs mt-0.5">{items.length} evrak</p>
      </div>

      {/* Sayaçlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "yuklendi",   label: "İnceleme Bekliyor", color: "text-amber-600",  bg: "bg-amber-50"  },
          { key: "reddedildi", label: "Hatalı",            color: "text-red-600",    bg: "bg-red-50"    },
          { key: "onaylandi",  label: "Onaylanan",         color: "text-green-600",  bg: "bg-green-50"  },
          { key: "bekleniyor", label: "Bekleniyor",        color: "text-[#5A6478]",  bg: "bg-[#F0EDE8]" },
        ].map(s => (
          <div key={s.key} className={`${s.bg} rounded-xl p-3 text-center cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={() => setDurumFilter(durumFilter === s.key as DurumFilter ? "Tümü" : s.key as DurumFilter)}>
            <p className={`text-2xl font-bold ${s.color}`}>{(counts as any)[s.key]}</p>
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
          <select value={durumFilter} onChange={e => setDurumFilter(e.target.value as DurumFilter)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            <option value="Tümü">Tüm durumlar</option>
            <option value="bekleniyor">Bekleniyor</option>
            <option value="yuklendi">İncelenecek</option>
            <option value="onaylandi">Onaylanan</option>
            <option value="reddedildi">Reddedilen</option>
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
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden sm:table-cell">Grup</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Durum</th>
                <th className="text-right px-5 py-3 text-xs text-[#5A6478] font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-[#5A6478] text-sm">Evrak bulunamadı.</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-[#F8F7F4]">
                  <td className="px-5 py-3">
                    <p className="text-[#0B1D3A] font-medium text-sm">{item.companyName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#0B1D3A]">{item.evrakBaslik}</p>
                    {item.dosyaAdi && <p className="text-xs text-[#5A6478]">{item.dosyaAdi}</p>}
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden sm:table-cell">{item.evrakGrubu}</td>
                  <td className="px-4 py-3"><DurumBadge durum={item.durum} /></td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openItem(item)}
                      className="text-xs bg-[#0B1D3A] hover:bg-[#122A54] text-white px-3 py-1.5 rounded-lg transition-colors">
                      {item.durum === "yuklendi" ? "İncele" : "Detay"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* İnceleme Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">{selectedItem.evrakBaslik}</h3>
                <p className="text-white/60 text-xs mt-0.5">{selectedItem.companyName} · {selectedItem.evrakGrubu}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                <span className="text-xs text-[#5A6478]">Durum:</span>
                <DurumBadge durum={selectedItem.durum} />
              </div>

              {selectedItem.dosyaAdi && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <FolderOpen className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">{selectedItem.dosyaAdi}</p>
                    <p className="text-xs text-blue-600">Müşteri yükledi</p>
                  </div>
                  <button className="ml-auto text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Görüntüle
                  </button>
                </div>
              )}

              {!selectedItem.dosyaAdi && (
                <div className="flex items-center gap-3 p-4 bg-[#F8F7F4] border border-[#E8E4DC] rounded-xl">
                  <Upload className="w-5 h-5 text-[#5A6478] shrink-0" />
                  <p className="text-sm text-[#5A6478]">Henüz dosya yüklenmedi.</p>
                </div>
              )}

              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Admin Notu <span className="text-[10px]">(müşteri görmez)</span></label>
                <textarea value={adminNotu} onChange={e => setAdminNotu(e.target.value)} rows={2} placeholder="İç not..."
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
              </div>

              <div>
                <label className="block text-xs text-[#5A6478] mb-1">
                  Müşteri Notu <span className="text-[10px]">(red sebebi — müşteriye gösterilir)</span>
                </label>
                <textarea value={musteriNotu} onChange={e => setMusteriNotu(e.target.value)} rows={2} placeholder="Red sebebi veya düzeltme talebi..."
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
              </div>
            </div>

            <div className="p-5 border-t border-[#E8E4DC] flex items-center justify-between">
              {saveMsg && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />{saveMsg}</span>}
              <div className="flex gap-3 ml-auto">
                <button onClick={handleReddet} disabled={!musteriNotu.trim()}
                  className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-600 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Reddet
                </button>
                <button onClick={handleOnayla}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
