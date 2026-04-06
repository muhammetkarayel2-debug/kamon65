import { useState, useEffect, useCallback } from "react";
import {
  Building2, Search, Edit2, Eye, X, Save, ChevronDown,
  Users, CheckCircle, AlertTriangle
} from "lucide-react";
import {
  COMPANY_TYPE_LABELS, formatDate, ALL_GROUPS, STATUS_CONFIG
} from "./admin-data";

interface Props { refreshKey: number; onRefresh: () => void; }

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[#5A6478] text-xs block mb-0.5">{label}</span>
      <span className="text-[#0B1D3A] text-sm font-medium">{value}</span>
    </div>
  );
}

export function AdminCompanies({ refreshKey, onRefresh }: Props) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [groupFilter, setGroupFilter] = useState("Tümü");
  const [typeFilter, setTypeFilter]   = useState("Tümü");
  const [viewModal, setViewModal] = useState<any | null>(null);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [editForm, setEditForm]   = useState<any>({});
  const [saveMsg, setSaveMsg]     = useState("");
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    const { adminGetAllCompanies } = await import("./supabase-client");
    const data = await adminGetAllCompanies();
    setCompanies(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [refreshKey, load]);

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (c.company_name || "").toLowerCase().includes(q)
      || (c.tax_id || "").includes(q)
      || (c.user_email || "").toLowerCase().includes(q);
    const matchGroup = groupFilter === "Tümü" || c.hesaplanan_grup === groupFilter;
    const matchType  = typeFilter  === "Tümü" || c.company_type === typeFilter;
    return matchSearch && matchGroup && matchType;
  });

  const uniqueUsers = new Set(companies.map((c: any) => c.user_email).filter(Boolean)).size;

  const openEdit = (c: any) => {
    setEditForm({ ...c });
    setEditModal(c);
    setSaveMsg("");
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { supabase } = await import("./supabase-client");
      await supabase.from("companies").update({
        company_name:   editForm.company_name,
        tax_id:         editForm.tax_id,
        phone:          editForm.phone,
        email:          editForm.email,
        kep_address:    editForm.kep_address,
        hesaplanan_grup: editForm.hesaplanan_grup,
        guncelleme:     new Date().toISOString(),
      }).eq("id", editModal.id);
      setSaveMsg("Kaydedildi ✓");
      setTimeout(() => { setEditModal(null); onRefresh(); }, 800);
    } catch (e: any) {
      setSaveMsg("⚠ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("Bu şirketi silmek istediğinize emin misiniz?")) return;
    const { supabase } = await import("./supabase-client");
    await supabase.from("companies").delete().eq("id", id);
    onRefresh();
  };

  const inputCls = "w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">Şirket Yönetimi</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">{companies.length} şirket · {uniqueUsers} kullanıcı</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Şirket adı, VKN veya e-posta..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
        </div>
        <div className="relative">
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            <option value="Tümü">Tüm Gruplar</option>
            {ALL_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478] pointer-events-none" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            <option value="Tümü">Tüm Türler</option>
            <option value="sahis">Şahıs</option>
            <option value="limited_as">Limited / A.Ş.</option>
            <option value="kooperatif">Kooperatif</option>
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
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden sm:table-cell">Tür</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Grup</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden md:table-cell">Durum</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden lg:table-cell">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden lg:table-cell">Tarih</th>
                <th className="text-right px-5 py-3 text-xs text-[#5A6478] font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#5A6478] text-sm">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#5A6478] text-sm">Sonuç bulunamadı.</td></tr>
              ) : filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-[#F8F7F4]">
                  <td className="px-5 py-3">
                    <p className="text-[#0B1D3A] font-medium text-sm">{c.company_name || "—"}</p>
                    <p className="text-[#5A6478] text-xs">{c.tax_id}</p>
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden sm:table-cell">
                    {COMPANY_TYPE_LABELS[c.company_type] || c.company_type || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] text-xs font-bold">
                      {c.hesaplanan_grup || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {STATUS_CONFIG[c.app_status] ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[c.app_status].bg} ${STATUS_CONFIG[c.app_status].color} ${STATUS_CONFIG[c.app_status].border}`}>
                        {STATUS_CONFIG[c.app_status].label}
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF] text-xs">{c.app_status || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden lg:table-cell truncate max-w-[150px]">
                    {c.user_email || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden lg:table-cell">
                    {formatDate(c.olusturulma)}
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

      {/* Görüntüle Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-base">{viewModal.company_name}</h3>
                <p className="text-white/60 text-xs mt-0.5">
                  {COMPANY_TYPE_LABELS[viewModal.company_type] || viewModal.company_type}
                  {viewModal.hesaplanan_grup ? ` · Grup ${viewModal.hesaplanan_grup}` : ""}
                </p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-5">
              <InfoRow label="Vergi Kimlik No"    value={viewModal.tax_id} />
              <InfoRow label="Telefon"             value={viewModal.phone} />
              <InfoRow label="E-posta"             value={viewModal.email} />
              <InfoRow label="Konum"               value={viewModal.location === "istanbul" ? "İstanbul" : viewModal.city} />
              <InfoRow label="KEP Adresi"          value={viewModal.kep_address} />
              <InfoRow label="Hizmet"              value={viewModal.service_label} />
              <InfoRow label="Belge Durumu"        value={viewModal.is_first_time === "first" ? "İlk Başvuru" : viewModal.is_first_time === "renewal" ? "Yenileme" : viewModal.is_first_time} />
              <InfoRow label="Mevcut Grup"         value={viewModal.mevcut_grup} />
              <InfoRow label="Mevcut Yetki No"     value={viewModal.mevcut_yetki_no} />
              <InfoRow label="Kullanıcı E-posta"   value={viewModal.user_email} />
              <InfoRow label="Kayıt Tarihi"        value={formatDate(viewModal.olusturulma)} />
              {viewModal.app_status && STATUS_CONFIG[viewModal.app_status] && (
                <div>
                  <span className="text-[#5A6478] text-xs block mb-0.5">Başvuru Durumu</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border inline-block ${STATUS_CONFIG[viewModal.app_status].bg} ${STATUS_CONFIG[viewModal.app_status].color} ${STATUS_CONFIG[viewModal.app_status].border}`}>
                    {STATUS_CONFIG[viewModal.app_status].label}
                  </span>
                </div>
              )}
              {viewModal.hesaplanan_grup && (
                <div>
                  <span className="text-[#5A6478] text-xs block mb-0.5">Hesaplanan Grup</span>
                  <span className="text-[#C9952B] font-black text-xl">{viewModal.hesaplanan_grup}</span>
                </div>
              )}
            </div>
            {/* Ortaklar */}
            {viewModal.partners?.length > 0 && (
              <div className="px-6 pb-6">
                <p className="text-xs text-[#5A6478] mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Ortaklar</p>
                <div className="bg-[#F8F7F4] rounded-xl p-4 space-y-2">
                  {viewModal.partners.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[#0B1D3A] font-medium">{p.name}</span>
                      <span className="text-[#5A6478] text-xs">%{p.hisse} · TC: {p.tc || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Düzenle Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4DC]">
              <h3 className="text-[#0B1D3A] font-bold text-base">Şirket Düzenle</h3>
              <button onClick={() => setEditModal(null)} className="text-[#5A6478] hover:text-[#0B1D3A]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Şirket Adı",    field: "company_name" },
                { label: "Vergi No",      field: "tax_id" },
                { label: "Telefon",       field: "phone" },
                { label: "E-posta",       field: "email" },
                { label: "KEP Adresi",    field: "kep_address" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs text-[#5A6478] mb-1">{label}</label>
                  <input value={editForm[field] || ""}
                    onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))}
                    className={inputCls} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Hesaplanan Grup (Admin override)</label>
                <select value={editForm.hesaplanan_grup || ""}
                  onChange={e => setEditForm((p: any) => ({ ...p, hesaplanan_grup: e.target.value }))}
                  className={inputCls}>
                  <option value="">— Seçiniz —</option>
                  {ALL_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
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
                <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">İptal</button>
                <button onClick={saveEdit} disabled={saving}
                  className="px-4 py-2 text-sm bg-[#C9952B] hover:bg-[#B8862A] disabled:opacity-50 text-[#0B1D3A] rounded-lg flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
