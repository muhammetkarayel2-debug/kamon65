import { useState, useMemo } from "react";
import {
  Building2, Search, Filter, Edit2, Eye, X, Save, ChevronDown,
  MapPin, Phone, Mail, Hash, Calendar, Award, Users, CheckCircle
} from "lucide-react";
import {
  Company, loadFromStorage, saveToStorage,
  MOCK_COMPANIES_KEY, COMPANY_TYPE_LABELS, formatDate, ALL_GROUPS,
  AppStatus, STATUS_CONFIG
} from "./admin-data";

interface Props { refreshKey: number; onRefresh: () => void; }

const GROUP_OPTIONS = ["Tümü", ...ALL_GROUPS, "Analiz", "Kooperatif"];

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[#5A6478] text-xs block mb-0.5">{label}</span>
      <span className="text-[#0B1D3A] text-sm font-medium">{value}</span>
    </div>
  );
}

export function AdminCompanies({ refreshKey, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("Tümü");
  const [typeFilter, setTypeFilter] = useState("Tümü");
  const [editModal, setEditModal] = useState<Company | null>(null);
  const [viewModal, setViewModal] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState<Partial<Company>>({});
  const [saveMsg, setSaveMsg] = useState("");

  const companies = useMemo(() => {
    return loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.companyName?.toLowerCase().includes(q) || c.taxId?.includes(q) || (c.userEmail || "").toLowerCase().includes(q);
      const matchGroup = groupFilter === "Tümü" || c.group === groupFilter;
      const matchType = typeFilter === "Tümü" || c.companyType === typeFilter;
      return matchSearch && matchGroup && matchType;
    });
  }, [companies, search, groupFilter, typeFilter]);

  const uniqueUsers = useMemo(() => {
    const set = new Set(companies.map(c => c.userEmail || c.email));
    return set.size;
  }, [companies]);

  const openEdit = (c: Company) => {
    setEditForm({ ...c });
    setEditModal(c);
    setSaveMsg("");
  };

  const saveEdit = () => {
    const all = loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []);
    const updated = all.map(c => c.id === editModal?.id ? { ...c, ...editForm, updatedAt: new Date().toISOString() } : c);
    saveToStorage(MOCK_COMPANIES_KEY, updated);
    setSaveMsg("Kaydedildi ✓");
    setTimeout(() => { setEditModal(null); onRefresh(); }, 800);
  };

  const deleteCompany = (id: string) => {
    if (!confirm("Bu şirketi silmek istediğinize emin misiniz?")) return;
    const all = loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []);
    saveToStorage(MOCK_COMPANIES_KEY, all.filter(c => c.id !== id));
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">Şirket Yönetimi</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">{companies.length} şirket · {uniqueUsers} kullanıcı</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Şirket adı, VKN veya e-posta..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]"
          />
        </div>
        <div className="relative">
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            {GROUP_OPTIONS.map(g => <option key={g}>{g}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478] pointer-events-none" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            <option value="Tümü">Tümü</option>
            <option value="sahis">Şahıs</option>
            <option value="limited_as">Limited / A.Ş.</option>
            <option value="kooperatif">Kooperatif</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F7F4] border-b border-[#E8E4DC]">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-[#5A6478] font-medium">Şirket</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden sm:table-cell">Tür</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Grup</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden md:table-cell">Durum / Konum</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden lg:table-cell">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden lg:table-cell">Eklenme</th>
                <th className="text-right px-5 py-3 text-xs text-[#5A6478] font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#5A6478] text-sm">Sonuç bulunamadı.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-[#F8F7F4]">
                  <td className="px-5 py-3">
                    <p className="text-[#0B1D3A] font-medium text-sm">{c.companyName || "—"}</p>
                    <p className="text-[#5A6478] text-xs">{c.taxId}</p>
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden sm:table-cell">
                    {COMPANY_TYPE_LABELS[c.companyType] || c.companyType}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] text-xs font-bold">
                      {c.group || "?"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {c.appStatus && STATUS_CONFIG[c.appStatus] ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[c.appStatus].bg} ${STATUS_CONFIG[c.appStatus].color} ${STATUS_CONFIG[c.appStatus].border}`}>
                        {STATUS_CONFIG[c.appStatus].label}
                      </span>
                    ) : (
                      <span className="text-[#5A6478] text-xs">{c.location === "istanbul" ? "İstanbul" : c.city || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden lg:table-cell truncate max-w-[150px]">
                    {c.userEmail || c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden lg:table-cell">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewModal(c)}
                        className="p-1.5 text-[#5A6478] hover:text-[#0B1D3A] hover:bg-[#F0EDE8] rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 text-[#5A6478] hover:text-[#C9952B] hover:bg-[#C9952B]/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCompany(c.id)}
                        className="p-1.5 text-[#5A6478] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-base">{viewModal.companyName}</h3>
                <p className="text-white/60 text-xs mt-0.5">{COMPANY_TYPE_LABELS[viewModal.companyType]} · {viewModal.group} Grubu</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-white/60 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-5">
              <InfoRow label="Vergi Kimlik No" value={viewModal.taxId} />
              <InfoRow label="Telefon" value={viewModal.phone} />
              <InfoRow label="E-posta" value={viewModal.email} />
              <InfoRow label="Konum" value={viewModal.location === "istanbul" ? "İstanbul" : viewModal.city || "—"} />
              <InfoRow label="Kuruluş Yılı" value={viewModal.foundingYear} />
              <InfoRow label="KEP Adresi" value={viewModal.kepAddress} />
              <InfoRow label="Hizmet" value={viewModal.serviceLabel} />
              <InfoRow label="Belge Durumu" value={viewModal.isFirstTime === "first" ? "İlk Başvuru" : viewModal.isFirstTime === "renewal" ? "Yenileme" : viewModal.isFirstTime} />
              <InfoRow label="Kullanıcı E-posta" value={viewModal.userEmail} />
              <InfoRow label="Kayıt Tarihi" value={formatDate(viewModal.createdAt)} />
              {viewModal.appStatus && STATUS_CONFIG[viewModal.appStatus] && (
                <div>
                  <span className="text-[#5A6478] text-xs block mb-0.5">Başvuru Durumu</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border inline-block ${STATUS_CONFIG[viewModal.appStatus].bg} ${STATUS_CONFIG[viewModal.appStatus].color} ${STATUS_CONFIG[viewModal.appStatus].border}`}>
                    {STATUS_CONFIG[viewModal.appStatus].label}
                  </span>
                </div>
              )}
              {viewModal.hesaplananGrup && (
                <div>
                  <span className="text-[#5A6478] text-xs block mb-0.5">Hesaplanan Grup</span>
                  <span className="text-[#C9952B] font-black text-xl">{viewModal.hesaplananGrup}</span>
                </div>
              )}
            </div>
            {viewModal.partners && viewModal.partners.length > 0 && (
              <div className="px-6 pb-6">
                <p className="text-xs text-[#5A6478] mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Ortaklar / Yetkililer</p>
                <div className="bg-[#F8F7F4] rounded-xl p-4 space-y-2.5">
                  {viewModal.partners.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-[#0B1D3A] font-medium">{p.name}</span>
                        <span className="text-[#5A6478] text-xs ml-2">%{p.sharePercent}</span>
                      </div>
                      {p.tcNo ? (
                        <span className="bg-[#0B1D3A]/8 text-[#0B1D3A] font-mono text-xs px-2.5 py-1 rounded-lg border border-[#E8E4DC]">
                          TC: {p.tcNo}
                        </span>
                      ) : (
                        <span className="text-[#5A6478] text-xs italic">TC girilmemiş</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4DC]">
              <h3 className="text-[#0B1D3A] font-bold text-base">Şirket Düzenle</h3>
              <button onClick={() => setEditModal(null)} className="text-[#5A6478] hover:text-[#0B1D3A]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Şirket Adı", field: "companyName" },
                { label: "Vergi Kimlik No", field: "taxId" },
                { label: "Telefon", field: "phone" },
                { label: "E-posta", field: "email" },
                { label: "Kuruluş Yılı", field: "foundingYear" },
                { label: "KEP Adresi", field: "kepAddress" },
                { label: "Kullanıcı E-posta", field: "userEmail" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs text-[#5A6478] mb-1">{label}</label>
                  <input
                    value={(editForm as Record<string, string>)[field] || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Grup</label>
                <select
                  value={editForm.group || ""}
                  onChange={e => setEditForm(prev => ({ ...prev, group: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]"
                >
                  {[...ALL_GROUPS, "Kooperatif", "Analiz"].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-[#E8E4DC] flex items-center justify-between">
              {saveMsg && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />{saveMsg}</span>}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">İptal</button>
                <button onClick={saveEdit} className="px-4 py-2 text-sm bg-[#C9952B] hover:bg-[#B8862A] text-white rounded-lg flex items-center gap-1.5">
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