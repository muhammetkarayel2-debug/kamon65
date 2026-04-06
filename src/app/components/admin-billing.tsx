import { useState, useEffect, useCallback } from "react";
import {
  Search, CheckCircle, Clock, AlertTriangle,
  Plus, X, Save, ChevronDown
} from "lucide-react";
import { formatDate } from "./admin-data";

interface Props { refreshKey: number; onRefresh: () => void; }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    paid:    { cls: "bg-green-50 text-green-700 border-green-200",  label: "Ödendi",       icon: <CheckCircle className="w-3 h-3" /> },
    unpaid:  { cls: "bg-amber-50 text-amber-700 border-amber-200",  label: "Bekliyor",     icon: <Clock className="w-3 h-3" /> },
    overdue: { cls: "bg-red-50 text-red-600 border-red-200",        label: "Vadesi Geçti", icon: <AlertTriangle className="w-3 h-3" /> },
  };
  const s = map[status] || map.unpaid;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>{s.icon}{s.label}</span>;
}

export function AdminBilling({ refreshKey, onRefresh }: Props) {
  const [invoices, setInvoices]     = useState<any[]>([]);
  const [companies, setCompanies]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tümü" | "unpaid" | "paid" | "overdue">("Tümü");
  const [showModal, setShowModal]   = useState(false);
  const [nCompanyId, setNCompanyId] = useState("");
  const [nDesc, setNDesc]           = useState("");
  const [nAmount, setNAmount]       = useState("");
  const [nDue, setNDue]             = useState("");
  const [saveMsg, setSaveMsg]       = useState("");
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    const { adminGetAllBilling, adminGetAllCompanies } = await import("./supabase-client");
    const [bills, comps] = await Promise.all([adminGetAllBilling(), adminGetAllCompanies()]);
    setInvoices(bills);
    setCompanies(comps);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [refreshKey, load]);

  const tl = (n: number) => n.toLocaleString("tr-TR") + " ₺";

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (inv.company_name || "").toLowerCase().includes(q)
      || (inv.description || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "Tümü" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = {
    total:   invoices.reduce((s, i) => s + (i.amount_num || 0), 0),
    paid:    invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount_num || 0), 0),
    pending: invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.amount_num || 0), 0),
  };

  const markPaid = async (inv: any) => {
    const { adminMarkPaid } = await import("./supabase-client");
    await adminMarkPaid(inv.id);
    onRefresh();
  };

  const addInvoice = async () => {
    if (!nCompanyId || !nDesc || !nAmount) return;
    setSaving(true);
    try {
      const { adminAddBilling } = await import("./supabase-client");
      const amountNum = parseInt(nAmount.replace(/\D/g, "")) || 0;
      await adminAddBilling(nCompanyId, nDesc, amountNum, nDue || undefined);
      setSaveMsg("Kaydedildi");
      setTimeout(() => {
        setSaveMsg(""); setShowModal(false);
        setNCompanyId(""); setNDesc(""); setNAmount(""); setNDue("");
        onRefresh();
      }, 700);
    } catch (e: any) {
      setSaveMsg("⚠ " + (e.message || "Hata"));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">Faturalar</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">{invoices.length} fatura</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Fatura Ekle
        </button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Toplam",   val: totals.total,   color: "text-[#0B1D3A]" },
          { label: "Tahsil",   val: totals.paid,    color: "text-green-600" },
          { label: "Bekleyen", val: totals.pending, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E8E4DC] p-4">
            <p className="text-xs text-[#5A6478] mb-1">{s.label}</p>
            <p className={`text-base font-bold ${s.color}`}>{tl(s.val)}</p>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Şirket veya açıklama..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            <option value="Tümü">Tüm durumlar</option>
            <option value="unpaid">Bekliyor</option>
            <option value="paid">Ödendi</option>
            <option value="overdue">Vadesi Geçti</option>
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
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden sm:table-cell">Açıklama</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Tutar</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Durum</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden md:table-cell">Vade</th>
                <th className="text-right px-5 py-3 text-xs text-[#5A6478] font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-[#5A6478] text-sm">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[#5A6478] text-sm">Fatura bulunamadı.</td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-[#F8F7F4]">
                  <td className="px-5 py-3">
                    <p className="text-[#0B1D3A] font-medium text-sm">{inv.company_name}</p>
                    <p className="text-[#5A6478] text-xs">{formatDate(inv.olusturulma)}</p>
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden sm:table-cell max-w-[180px] truncate">
                    {inv.description}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-[#0B1D3A]">{tl(inv.amount_num || 0)}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden md:table-cell">
                    {inv.due_date ? formatDate(inv.due_date) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {inv.status !== "paid" && (
                      <button onClick={() => markPaid(inv)}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg transition-colors">
                        Ödendi İşaretle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Fatura Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4DC]">
              <h3 className="text-[#0B1D3A] font-bold">Yeni Fatura</h3>
              <button onClick={() => setShowModal(false)} className="text-[#5A6478] hover:text-[#0B1D3A]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Şirket <span className="text-red-400">*</span></label>
                <select value={nCompanyId} onChange={e => setNCompanyId(e.target.value)} className={inputCls}>
                  <option value="">Şirket seçiniz</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Açıklama <span className="text-red-400">*</span></label>
                <input value={nDesc} onChange={e => setNDesc(e.target.value)} placeholder="Hizmet açıklaması" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Tutar (₺) <span className="text-red-400">*</span></label>
                <input value={nAmount} onChange={e => setNAmount(e.target.value.replace(/\D/g, ""))} placeholder="10000" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Vade Tarihi</label>
                <input type="date" value={nDue} onChange={e => setNDue(e.target.value)} className={inputCls} />
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
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">İptal</button>
                <button onClick={addInvoice} disabled={saving || !nCompanyId || !nDesc || !nAmount}
                  className="px-4 py-2 text-sm bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-200 text-[#0B1D3A] rounded-lg flex items-center gap-1.5">
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
