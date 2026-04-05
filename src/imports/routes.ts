import { useState, useMemo } from "react";
import {
  Activity, Search, ChevronDown, Save, X, Clock, CheckCircle,
  AlertTriangle, Plus, FileText, Award, Send, Lock,
  Eye, FolderOpen, Info
} from "lucide-react";
import {
  Company, ProcessData, loadFromStorage, saveToStorage,
  MOCK_COMPANIES_KEY, MOCK_PROCESS_KEY, formatDate, formatDateTime
} from "./admin-data";

interface Props { refreshKey: number; onRefresh: () => void; }

/* ─────────────────────────────────────────────────────────────
   8 DURUM SİSTEMİ
───────────────────────────────────────────────────────────── */
type AppStatus =
  | "wizard_incomplete"
  | "pending_financial"
  | "pending_payment"
  | "payment_received"
  | "report_locked"
  | "report_published"
  | "docs_in_progress"
  | "docs_complete"
  | "application_submitted"
  | "certificate_received";

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; border: string }> = {
  wizard_incomplete:     { label: "Wizard eksik",            color: "text-gray-600",   bg: "bg-gray-100",   border: "border-gray-200"  },
  pending_financial:     { label: "Mali bilgi bekleniyor",   color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  pending_payment:       { label: "Ödeme bekleniyor",        color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  payment_received:      { label: "Ödeme alındı",            color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  report_locked:         { label: "Rapor hazırlanıyor",      color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  report_published:      { label: "Rapor yayınlandı",        color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  docs_in_progress:      { label: "Evrak toplanıyor",        color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  docs_complete:         { label: "Evraklar tamam",          color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  application_submitted: { label: "Başvuru yapıldı",         color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  certificate_received:  { label: "Belge alındı",            color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
};

const STATUS_OPTIONS: { value: AppStatus; label: string }[] = [
  { value: "wizard_incomplete",     label: "Wizard eksik"            },
  { value: "pending_financial",     label: "Mali bilgi bekleniyor"   },
  { value: "pending_payment",       label: "Ödeme bekleniyor"        },
  { value: "payment_received",      label: "Ödeme alındı"            },
  { value: "report_locked",         label: "Rapor hazırlanıyor"      },
  { value: "report_published",      label: "Rapor yayınlandı"        },
  { value: "docs_in_progress",      label: "Evrak toplanıyor"        },
  { value: "docs_complete",         label: "Evraklar tamam"          },
  { value: "application_submitted", label: "Başvuru yapıldı"         },
  { value: "certificate_received",  label: "Belge alındı"            },
];

function StatusBadge({ status }: { status: AppStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.wizard_incomplete;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN PROCESSES
───────────────────────────────────────────────────────────── */
export function AdminProcesses({ refreshKey, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tümü" | AppStatus>("Tümü");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<AppStatus>("pending_payment");
  const [newNote, setNewNote] = useState("");
  const [certNo, setCertNo] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certExpiry, setCertExpiry] = useState("");
  const [barcodeNo, setBarcodeNo] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [raporOnayMsg, setRaporOnayMsg] = useState("");

  const { companies } = useMemo(() => {
    const companies = loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []);
    return { companies };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Şirketlerin appStatus'unu oku
  const rows = useMemo(() => {
    return companies.map(c => ({
      company: c,
      status: (c as any).appStatus as AppStatus || "wizard_incomplete",
    })).filter(row => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || row.company.companyName?.toLowerCase().includes(q)
        || (row.company.userEmail || "").toLowerCase().includes(q)
        || row.company.taxId?.includes(q);
      const matchStatus = statusFilter === "Tümü" || row.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [companies, search, statusFilter, refreshKey]);

  const selected = selectedId ? rows.find(r => r.company.id === selectedId) : null;

  const openProcess = (id: string) => {
    const row = rows.find(r => r.company.id === id);
    setSelectedId(id);
    setNewStatus(row?.status || "pending_payment");
    setNewNote("");
    const proc = loadFromStorage<Record<string, ProcessData>>(MOCK_PROCESS_KEY, {})[id];
    setCertNo(proc?.certificateNo || "");
    setCertDate(proc?.certificateDate || "");
    setCertExpiry(proc?.certificateExpiry || "");
    setBarcodeNo(proc?.barcodeNo || "");
    setSaveMsg("");
    setRaporOnayMsg("");
  };

  const saveProcess = () => {
    if (!selectedId) return;

    // Şirketin appStatus'unu güncelle
    const allCompanies = loadFromStorage<any[]>(MOCK_COMPANIES_KEY, []);
    const updatedCompanies = allCompanies.map(c =>
      c.id === selectedId ? { ...c, appStatus: newStatus } : c
    );
    saveToStorage(MOCK_COMPANIES_KEY, updatedCompanies);

    // ProcessData'yı güncelle
    const allProc = loadFromStorage<Record<string, ProcessData>>(MOCK_PROCESS_KEY, {});
    const existing = allProc[selectedId] || {
      companyId: selectedId, status: newStatus, statusLabel: STATUS_CONFIG[newStatus]?.label || "",
      statusHistory: [],
    };
    const newHistory = newNote.trim()
      ? [...existing.statusHistory, { date: new Date().toISOString(), label: STATUS_CONFIG[newStatus]?.label || newStatus, note: newNote.trim() }]
      : existing.status !== newStatus
        ? [...existing.statusHistory, { date: new Date().toISOString(), label: STATUS_CONFIG[newStatus]?.label || newStatus }]
        : existing.statusHistory;

    allProc[selectedId] = {
      ...existing,
      status: newStatus,
      statusLabel: STATUS_CONFIG[newStatus]?.label || newStatus,
      statusHistory: newHistory,
      barcodeNo: barcodeNo || existing.barcodeNo,
      certificateNo: certNo || existing.certificateNo,
      certificateDate: certDate || existing.certificateDate,
      certificateExpiry: certExpiry || existing.certificateExpiry,
    };
    saveToStorage(MOCK_PROCESS_KEY, allProc);
    setSaveMsg("Kaydedildi ✓");
    setTimeout(() => { setSaveMsg(""); setSelectedId(null); onRefresh(); }, 800);
  };

  // Raporu yayınla — status'ı report_published yap, evrak listesi tetiklenmiş sayılır
  const handleRaporYayinla = () => {
    if (!selectedId) return;
    const allCompanies = loadFromStorage<any[]>(MOCK_COMPANIES_KEY, []);
    const updatedCompanies = allCompanies.map(c =>
      c.id === selectedId
        ? { ...c, appStatus: "report_published", raporOnayTarihi: new Date().toISOString() }
        : c
    );
    saveToStorage(MOCK_COMPANIES_KEY, updatedCompanies);
    setNewStatus("report_published");
    setRaporOnayMsg("Rapor yayınlandı. Müşteri artık raporu ve evraklar sekmesini görebilir.");
    onRefresh();
  };

  // İstanbul başvuru teklifi gönder
  const handleBasvuruTeklifi = () => {
    if (!selectedId) return;
    const allCompanies = loadFromStorage<any[]>(MOCK_COMPANIES_KEY, []);
    const updatedCompanies = allCompanies.map(c =>
      c.id === selectedId
        ? { ...c, basvuruTeklifiGosterildi: false } // sıfırla ki dashboard'da gösterilsin
        : c
    );
    saveToStorage(MOCK_COMPANIES_KEY, updatedCompanies);
    setSaveMsg("Başvuru teklifi sıfırlandı — müşteri dashboardında gösterilecek.");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  // Sayaçlar
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [rows]);

  const inputCls = "w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">Başvuru & Süreç Yönetimi</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">{rows.length} başvuru · {companies.length} şirket</p>
        </div>
      </div>

      {/* Durum özeti */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: "pending_payment",       label: "Ödeme bekleniyor",  color: "text-amber-600",  bg: "bg-amber-50"  },
          { key: "report_locked",         label: "Rapor bekliyor",    color: "text-blue-600",   bg: "bg-blue-50"   },
          { key: "docs_in_progress",      label: "Evrak eksik",       color: "text-orange-600", bg: "bg-orange-50" },
          { key: "application_submitted", label: "Başvuru yapıldı",   color: "text-blue-600",   bg: "bg-blue-50"   },
          { key: "certificate_received",  label: "Tamamlandı",        color: "text-green-600",  bg: "bg-green-50"  },
        ].map(s => (
          <div key={s.key} className={`${s.bg} rounded-xl p-3 text-center cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={() => setStatusFilter(statusFilter === s.key as AppStatus ? "Tümü" : s.key as AppStatus)}>
            <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key] || 0}</p>
            <p className={`text-xs ${s.color} mt-0.5`}>{s.label}</p>
          </div>
        ))}
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
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
            className="appearance-none bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-[#C9952B]">
            <option value="Tümü">Tüm durumlar</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden sm:table-cell">Grup</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Durum</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden md:table-cell">Konum</th>
                <th className="text-right px-5 py-3 text-xs text-[#5A6478] font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-[#5A6478] text-sm">Sonuç bulunamadı.</td></tr>
              ) : rows.map(({ company, status }) => (
                <tr key={company.id} className="hover:bg-[#F8F7F4]">
                  <td className="px-5 py-3">
                    <p className="text-[#0B1D3A] font-medium text-sm">{company.companyName}</p>
                    <p className="text-[#5A6478] text-xs">{company.userEmail || company.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] text-xs font-bold">
                      {company.group || "?"}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={status} /></td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden md:table-cell">
                    {company.location === "istanbul" ? "İstanbul" : company.city || "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openProcess(company.id)}
                      className="text-xs bg-[#0B1D3A] hover:bg-[#122A54] text-white px-3 py-1.5 rounded-lg transition-colors">
                      Yönet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Süreç Güncelleme Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Modal başlık */}
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">{selected.company.companyName}</h3>
                <p className="text-white/60 text-xs mt-0.5">
                  {selected.company.group} Grubu ·{" "}
                  {selected.company.location === "istanbul" ? "İstanbul" : selected.company.city}
                </p>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Mevcut durum */}
              <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                <span className="text-xs text-[#5A6478]">Mevcut durum:</span>
                <StatusBadge status={selected.status} />
              </div>

              {/* Rapor onaylama — payment_received veya report_locked durumunda göster */}
              {(selected.status === "payment_received" || selected.status === "report_locked") && (
                <div className="border border-[#C9952B]/30 bg-[#C9952B]/5 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-[#0B1D3A] mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C9952B]" /> Rapor Onaylama
                  </h4>
                  <p className="text-xs text-[#5A6478] mb-3">
                    Raporu onayladığınızda müşteri raporu ve evraklar sekmesini görebilecek.
                    İstanbul müşterileri için başvuru teklifi de dashboard'da belirecek.
                  </p>
                  {raporOnayMsg ? (
                    <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                      <CheckCircle className="w-4 h-4" /> {raporOnayMsg}
                    </div>
                  ) : (
                    <button onClick={handleRaporYayinla}
                      className="w-full bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                      <Send className="w-4 h-4" /> Raporu Yayınla
                    </button>
                  )}
                </div>
              )}

              {/* İstanbul — başvuru teklifi sıfırla */}
              {selected.status === "report_published" && selected.company.location === "istanbul" && (
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" /> İstanbul — Başvuru Teklifi
                  </h4>
                  <p className="text-xs text-blue-600 mb-3">
                    Müşteriye "Başvuruyu biz yapalım mı?" teklifini göstermek için sıfırlayın.
                    (Teklif rapor açılışında otomatik çıkar, bir kez görüntülendiyse sıfırlayabilirsiniz.)
                  </p>
                  <button onClick={handleBasvuruTeklifi}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Teklifi Yeniden Göster
                  </button>
                </div>
              )}

              {/* Durum güncelleme */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#5A6478] mb-1">Yeni durum</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value as AppStatus)}
                    className={inputCls}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#5A6478] mb-1">Barkod / Başvuru no</label>
                  <input value={barcodeNo} onChange={e => setBarcodeNo(e.target.value)}
                    placeholder="YKB-2026-XXXXX"
                    className={`${inputCls} font-mono`} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Zaman çizelgesine not ekle</label>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2}
                  placeholder="Müşterinin göreceği açıklama (isteğe bağlı)..."
                  className={`${inputCls} resize-none`} />
              </div>

              {/* Belge bilgileri */}
              <div>
                <p className="text-xs text-[#5A6478] mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Yetki Belgesi Bilgileri
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#5A6478] mb-1">Belge no</label>
                    <input value={certNo} onChange={e => setCertNo(e.target.value)} placeholder="F-2026-00XXX"
                      className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#5A6478] mb-1">Düzenleme tarihi</label>
                    <input type="date" value={certDate} onChange={e => setCertDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#5A6478] mb-1">Geçerlilik sonu</label>
                    <input type="date" value={certExpiry} onChange={e => setCertExpiry(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#E8E4DC] flex items-center justify-between">
              {saveMsg && (
                <span className="text-green-600 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {saveMsg}
                </span>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setSelectedId(null)}
                  className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">
                  İptal
                </button>
                <button onClick={saveProcess}
                  className="px-4 py-2 text-sm bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] rounded-lg flex items-center gap-1.5">
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
