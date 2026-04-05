import { useState, useMemo } from "react";
import {
  Tag, Plus, X, Save, CheckCircle, Search, ChevronDown,
  Percent, DollarSign, Calendar, Eye, Trash2, AlertCircle
} from "lucide-react";
import { loadFromStorage, saveToStorage, MOCK_COMPANIES_KEY, Company } from "./admin-data";

const DISCOUNTS_KEY = "admin_discounts";

interface Discount {
  id: string;
  companyId: string;
  companyName: string;
  aciklama: string;
  indirimTipi: "sabit_tutar" | "yuzde";
  indirimDegeri: number;
  maxIndirimTl?: number;
  gecerliMi: boolean;
  gecerlilikBitis?: string;
  uygulandiMi: boolean;
  uygulananTutarTl?: number;
  adminNotu?: string;
  createdAt: string;
}

interface Props { refreshKey: number; onRefresh: () => void; }

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export function AdminDiscounts({ refreshKey, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [indirimTipi, setIndirimTipi] = useState<"sabit_tutar" | "yuzde">("sabit_tutar");
  const [indirimDegeri, setIndirimDegeri] = useState("");
  const [maxIndirimTl, setMaxIndirimTl] = useState("");
  const [gecerlilikBitis, setGecerlilikBitis] = useState("");
  const [adminNotu, setAdminNotu] = useState("");

  const companies = useMemo(() =>
    loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );

  const discounts = useMemo(() =>
    loadFromStorage<Discount[]>(DISCOUNTS_KEY, []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey, saveMsg]
  );

  const filtered = useMemo(() => {
    if (!search) return discounts;
    const q = search.toLowerCase();
    return discounts.filter(d =>
      d.companyName.toLowerCase().includes(q) || d.aciklama.toLowerCase().includes(q)
    );
  }, [discounts, search]);

  const resetForm = () => {
    setSelectedCompanyId(""); setAciklama(""); setIndirimTipi("sabit_tutar");
    setIndirimDegeri(""); setMaxIndirimTl(""); setGecerlilikBitis(""); setAdminNotu("");
    setEditingId(null);
  };

  const openNew = () => { resetForm(); setShowModal(true); };

  const openEdit = (d: Discount) => {
    setSelectedCompanyId(d.companyId);
    setAciklama(d.aciklama);
    setIndirimTipi(d.indirimTipi);
    setIndirimDegeri(String(d.indirimDegeri));
    setMaxIndirimTl(d.maxIndirimTl ? String(d.maxIndirimTl) : "");
    setGecerlilikBitis(d.gecerlilikBitis || "");
    setAdminNotu(d.adminNotu || "");
    setEditingId(d.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!selectedCompanyId || !aciklama || !indirimDegeri) return;
    const company = companies.find(c => c.id === selectedCompanyId);
    const all = loadFromStorage<Discount[]>(DISCOUNTS_KEY, []);

    const discountData: Discount = {
      id: editingId || crypto.randomUUID(),
      companyId: selectedCompanyId,
      companyName: company?.companyName || "",
      aciklama,
      indirimTipi,
      indirimDegeri: Number(indirimDegeri),
      maxIndirimTl: maxIndirimTl ? Number(maxIndirimTl) : undefined,
      gecerliMi: true,
      gecerlilikBitis: gecerlilikBitis || undefined,
      uygulandiMi: false,
      adminNotu: adminNotu || undefined,
      createdAt: editingId
        ? (all.find(d => d.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };

    const updated = editingId
      ? all.map(d => d.id === editingId ? discountData : d)
      : [...all, discountData];

    saveToStorage(DISCOUNTS_KEY, updated);
    setSaveMsg("Kaydedildi");
    setTimeout(() => { setSaveMsg(""); setShowModal(false); resetForm(); onRefresh(); }, 700);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bu indirimi silmek istiyor musunuz?")) return;
    const all = loadFromStorage<Discount[]>(DISCOUNTS_KEY, []);
    saveToStorage(DISCOUNTS_KEY, all.filter(d => d.id !== id));
    onRefresh();
  };

  const handleToggle = (id: string) => {
    const all = loadFromStorage<Discount[]>(DISCOUNTS_KEY, []);
    const updated = all.map(d => d.id === id ? { ...d, gecerliMi: !d.gecerliMi } : d);
    saveToStorage(DISCOUNTS_KEY, updated);
    onRefresh();
  };

  const inputCls = "w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">İndirim Yönetimi</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">
            {discounts.filter(d => d.gecerliMi && !d.uygulandiMi).length} aktif ·{" "}
            {discounts.filter(d => d.uygulandiMi).length} uygulandı
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Yeni İndirim
        </button>
      </div>

      {/* Arama */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Şirket adı veya açıklama..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F7F4] border-b border-[#E8E4DC]">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-[#5A6478] font-medium">Şirket</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Açıklama</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">İndirim</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden md:table-cell">Durum</th>
                <th className="text-right px-5 py-3 text-xs text-[#5A6478] font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#5A6478] text-sm">
                    {discounts.length === 0 ? "Henüz indirim tanımlanmamış." : "Sonuç bulunamadı."}
                  </td>
                </tr>
              ) : filtered.map(d => (
                <tr key={d.id} className={`hover:bg-[#F8F7F4] ${!d.gecerliMi ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3">
                    <p className="text-[#0B1D3A] font-medium text-sm">{d.companyName}</p>
                    {d.gecerlilikBitis && (
                      <p className="text-[#5A6478] text-xs">Son: {formatDate(d.gecerlilikBitis)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs">{d.aciklama}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {d.indirimTipi === "yuzde"
                        ? <span className="text-sm font-bold text-[#0B1D3A]">%{d.indirimDegeri}</span>
                        : <span className="text-sm font-bold text-[#0B1D3A]">{fmt(d.indirimDegeri)}</span>
                      }
                      {d.maxIndirimTl && (
                        <span className="text-xs text-[#5A6478]">max {fmt(d.maxIndirimTl)}</span>
                      )}
                    </div>
                    {d.uygulandiMi && d.uygulananTutarTl && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Uygulanan: {fmt(d.uygulananTutarTl)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {d.uygulandiMi ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Uygulandı
                      </span>
                    ) : d.gecerliMi ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#C9952B] bg-[#C9952B]/10 border border-[#C9952B]/30 px-2.5 py-1 rounded-full">
                        <Tag className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[#5A6478] bg-[#F0EDE8] border border-[#E8E4DC] px-2.5 py-1 rounded-full">
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!d.uygulandiMi && (
                        <>
                          <button onClick={() => openEdit(d)}
                            className="p-1.5 text-[#5A6478] hover:text-[#C9952B] hover:bg-[#C9952B]/10 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggle(d.id)}
                            className="p-1.5 text-[#5A6478] hover:text-[#0B1D3A] hover:bg-[#F0EDE8] rounded-lg transition-colors text-xs px-2">
                            {d.gecerliMi ? "Pasifleştir" : "Aktifleştir"}
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-[#5A6478] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4DC]">
              <h3 className="text-[#0B1D3A] font-bold">
                {editingId ? "İndirimi Düzenle" : "Yeni İndirim Tanımla"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#5A6478] hover:text-[#0B1D3A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Şirket seç */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">
                  Şirket <span className="text-red-400">*</span>
                </label>
                <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}
                  className={inputCls}>
                  <option value="">Şirket seçiniz...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} · {c.group}</option>
                  ))}
                </select>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">
                  Açıklama <span className="text-red-400">*</span>
                </label>
                <input value={aciklama} onChange={e => setAciklama(e.target.value)}
                  placeholder="Tanıdık indirimi, VIP müşteri..."
                  className={inputCls} />
                <p className="text-xs text-[#5A6478] mt-1">Müşteriye gösterilmez — yalnızca admin görür.</p>
              </div>

              {/* İndirim tipi */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-2">İndirim tipi <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "sabit_tutar", label: "Sabit tutar (₺)" },
                    { value: "yuzde",       label: "Yüzde (%)" },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setIndirimTipi(opt.value as any)}
                      className={`py-2.5 px-4 rounded-lg border text-sm text-center transition-colors ${
                        indirimTipi === opt.value
                          ? "border-[#C9952B] bg-[#C9952B]/10 text-[#0B1D3A] font-medium"
                          : "border-[#E8E4DC] text-[#5A6478] hover:border-[#C9952B]/50"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Değer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#5A6478] mb-1">
                    {indirimTipi === "yuzde" ? "Oran (%)" : "Tutar (₺)"} <span className="text-red-400">*</span>
                  </label>
                  <input value={indirimDegeri}
                    onChange={e => setIndirimDegeri(e.target.value.replace(/\D/g, ""))}
                    placeholder={indirimTipi === "yuzde" ? "20" : "500"}
                    className={inputCls} />
                </div>
                {indirimTipi === "yuzde" && (
                  <div>
                    <label className="block text-xs text-[#5A6478] mb-1">Maks. tutar (₺)</label>
                    <input value={maxIndirimTl}
                      onChange={e => setMaxIndirimTl(e.target.value.replace(/\D/g, ""))}
                      placeholder="1000"
                      className={inputCls} />
                  </div>
                )}
              </div>

              {/* Geçerlilik */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Geçerlilik bitiş tarihi</label>
                <input type="date" value={gecerlilikBitis} onChange={e => setGecerlilikBitis(e.target.value)}
                  className={inputCls} />
                <p className="text-xs text-[#5A6478] mt-1">Boş bırakılırsa süresiz geçerlidir.</p>
              </div>

              {/* Admin notu */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Admin notu (isteğe bağlı)</label>
                <textarea value={adminNotu} onChange={e => setAdminNotu(e.target.value)} rows={2}
                  placeholder="Dahili not — müşteri görmez..."
                  className={`${inputCls} resize-none`} />
              </div>

              {/* Önizleme */}
              {indirimDegeri && selectedCompanyId && (
                <div className="bg-[#F8F7F4] rounded-xl p-4">
                  <p className="text-xs font-medium text-[#5A6478] mb-2">Ödeme ekranında müşteri şunu görecek:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-[#0B1D3A]">
                      <span>Hizmet bedeli</span><span>X.XXX ₺</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>İndirim</span>
                      <span>
                        − {indirimTipi === "yuzde"
                          ? `%${indirimDegeri}${maxIndirimTl ? ` (max ${maxIndirimTl} ₺)` : ""}`
                          : `${Number(indirimDegeri).toLocaleString("tr-TR")} ₺`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-[#0B1D3A] border-t border-[#E8E4DC] pt-1">
                      <span>Ödenecek</span><span>X.XXX ₺</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#E8E4DC] flex items-center justify-between">
              {saveMsg && (
                <span className="text-green-600 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {saveMsg}
                </span>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">
                  İptal
                </button>
                <button onClick={handleSave}
                  disabled={!selectedCompanyId || !aciklama || !indirimDegeri}
                  className="px-4 py-2 text-sm bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-200 disabled:text-gray-400 text-[#0B1D3A] rounded-lg flex items-center gap-1.5 transition-colors">
                  <Save className="w-4 h-4" /> Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
