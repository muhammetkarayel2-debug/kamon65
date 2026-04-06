import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, Save, X, Clock, CheckCircle,
  AlertTriangle, FileText
} from "lucide-react";
import { formatDate, formatDateTime } from "./admin-data";
import type { AppStatus } from "./supabase-client";

interface Props { refreshKey: number; onRefresh: () => void; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  wizard_incomplete:     { label: "Başvuru eksik",         color: "text-gray-600",   bg: "bg-gray-100",   border: "border-gray-200"  },
  pending_financial:     { label: "Mali bilgi bekleniyor", color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  pending_payment:       { label: "Ödeme bekleniyor",      color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  payment_received:      { label: "Ödeme alındı",          color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  report_locked:         { label: "Rapor hazırlanıyor",    color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  report_published:      { label: "Rapor yayınlandı",      color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  docs_in_progress:      { label: "Evrak toplanıyor",      color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  docs_complete:         { label: "Evraklar tamam",        color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  application_submitted: { label: "Başvuru yapıldı",       color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"  },
  certificate_received:  { label: "Belge alındı",          color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
};

/* report_published bu listede YOK — sadece hesaplama modülünden set edilir */
const STATUS_OPTIONS = [
  { value: "wizard_incomplete",     label: "Başvuru eksik"         },
  { value: "pending_financial",     label: "Mali bilgi bekleniyor" },
  { value: "pending_payment",       label: "Ödeme bekleniyor"      },
  { value: "payment_received",      label: "Ödeme alındı"          },
  { value: "report_locked",         label: "Rapor hazırlanıyor"    },
  { value: "docs_in_progress",      label: "Evrak toplanıyor"      },
  { value: "docs_complete",         label: "Evraklar tamam"        },
  { value: "application_submitted", label: "Başvuru yapıldı"       },
  { value: "certificate_received",  label: "Belge alındı"          },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.wizard_incomplete;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

export function AdminProcesses({ refreshKey, onRefresh }: Props) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [timelines, setTimelines] = useState<Record<string, any[]>>({});
  const [loading, setLoading]     = useState(true);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Tümü");
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [newStatus, setNewStatus]       = useState<string>("pending_payment");
  const [newNote, setNewNote]           = useState("");
  const [certNo, setCertNo]             = useState("");
  const [certDate, setCertDate]         = useState("");
  const [certExpiry, setCertExpiry]     = useState("");
  const [barcodeNo, setBarcodeNo]       = useState("");
  const [saveMsg, setSaveMsg]           = useState("");
  const [saving, setSaving]             = useState(false);

  const load = useCallback(async () => {
    const { adminGetAllCompanies } = await import("./supabase-client");
    const data = await adminGetAllCompanies();
    setCompanies(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [refreshKey, load]);

  const rows = companies.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (c.company_name || "").toLowerCase().includes(q)
      || (c.user_email || "").toLowerCase().includes(q)
      || (c.tax_id || "").includes(q);
    const matchStatus = statusFilter === "Tümü" || c.app_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = companies.reduce((acc: Record<string, number>, c) => {
    acc[c.app_status] = (acc[c.app_status] || 0) + 1;
    return acc;
  }, {});

  const selected = selectedId ? companies.find(c => c.id === selectedId) : null;
  const selectedTimeline = selectedId ? (timelines[selectedId] || []) : [];

  const openProcess = async (id: string) => {
    const c = companies.find(x => x.id === id);
    setSelectedId(id);
    setNewStatus(c?.app_status || "pending_payment");
    setNewNote("");
    setCertNo(c?.certificate_no || "");
    setCertDate(c?.certificate_date || "");
    setCertExpiry(c?.certificate_expiry || "");
    setBarcodeNo(c?.barcode_no || "");
    setSaveMsg("");

    /* Timeline yükle */
    if (!timelines[id]) {
      const { getStatusTimeline } = await import("./supabase-client");
      const tl = await getStatusTimeline(id);
      setTimelines(prev => ({ ...prev, [id]: tl }));
    }
  };

  const saveProcess = async () => {
    if (!selectedId) return;

    if (newStatus === "application_submitted" && !barcodeNo.trim()) {
      setSaveMsg("⚠ Başvuru yapıldı için barkod numarası zorunlu"); return;
    }
    if (newStatus === "certificate_received" && !certNo.trim()) {
      setSaveMsg("⚠ Belge alındı için belge numarası zorunlu"); return;
    }

    setSaving(true);
    try {
      const { adminUpdateStatus } = await import("./supabase-client");
      await adminUpdateStatus(
        selectedId,
        newStatus as AppStatus,
        STATUS_CONFIG[newStatus]?.label || newStatus,
        newNote.trim() || undefined,
        {
          barcode_no:        barcodeNo || undefined,
          certificate_no:    certNo    || undefined,
          certificate_date:  certDate  || undefined,
          certificate_expiry: certExpiry || undefined,
        }
      );
      setSaveMsg("Kaydedildi ✓");
      setTimeout(() => { setSaveMsg(""); setSelectedId(null); onRefresh(); }, 800);
    } catch (e: any) {
      setSaveMsg("⚠ " + (e.message || "Hata"));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[#0B1D3A] text-lg font-bold">Başvuru Takip</h2>
        <p className="text-[#5A6478] text-xs mt-0.5">Başvuru durumlarını yönetin.</p>
      </div>

      {/* Özet sayılar */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { key: "pending_payment",      label: "Ödeme Bekliyor",   color: "text-amber-700", bg: "bg-amber-50" },
          { key: "payment_received",     label: "Ödeme Alındı",     color: "text-blue-600",  bg: "bg-blue-50"  },
          { key: "docs_in_progress",     label: "Evrak Toplanıyor", color: "text-amber-700", bg: "bg-amber-50" },
          { key: "application_submitted",label: "Başvuru Yapıldı",  color: "text-blue-600",  bg: "bg-blue-50"  },
          { key: "certificate_received", label: "Belge Alındı",     color: "text-green-700", bg: "bg-green-50" },
        ].map(({ key, label, color, bg }) => (
          <div key={key} className={`${bg} rounded-xl p-3 text-center cursor-pointer border border-transparent hover:border-current/20`}
            onClick={() => setStatusFilter(statusFilter === key ? "Tümü" : key)}>
            <p className={`text-2xl font-bold ${color}`}>{counts[key] || 0}</p>
            <p className={`text-xs ${color} mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Arama + filtre */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Firma veya e-posta ara..."
            className="w-full pl-9 pr-4 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:outline-none focus:border-[#C9952B]" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2.5 border border-[#E8E4DC] rounded-xl text-sm focus:outline-none focus:border-[#C9952B] appearance-none bg-white">
            <option value="Tümü">Tüm durumlar</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478] pointer-events-none" />
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-[#5A6478] text-sm">Yükleniyor...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-[#5A6478] text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 text-[#E8E4DC]" />
            Kayıt bulunamadı.
          </div>
        ) : (
          <div className="divide-y divide-[#F0EDE8]">
            {rows.map(c => (
              <button key={c.id} onClick={() => openProcess(c.id)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#F8F7F4] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-[#0B1D3A] truncate">{c.company_name}</p>
                    {c.barcode_no && <span className="text-xs bg-[#F0EDE8] text-[#5A6478] px-1.5 py-0.5 rounded shrink-0">#{c.barcode_no}</span>}
                  </div>
                  <p className="text-xs text-[#5A6478]">{c.user_email} · {c.location === "istanbul" ? "İstanbul" : c.city}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={c.app_status} />
                  <span className="text-xs text-[#9CA3AF]">{formatDate(c.guncelleme)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detay modal */}
      {selectedId && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4DC]">
              <div>
                <h3 className="text-[#0B1D3A] font-bold text-base">{selected.company_name}</h3>
                <p className="text-xs text-[#5A6478] mt-0.5">{selected.user_email}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-[#5A6478] hover:text-[#0B1D3A]"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Zaman çizelgesi */}
              {selectedTimeline.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#5A6478] mb-2 uppercase tracking-wide">Geçmiş</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {[...selectedTimeline].map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C9952B] mt-1.5 shrink-0" />
                        <div>
                          <span className="text-[#0B1D3A] font-medium">{h.status_label || h.status}</span>
                          {h.note && <span className="text-[#5A6478]"> — {h.note}</span>}
                          <span className="text-[#9CA3AF] ml-2">{formatDateTime(h.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mevcut durum */}
              <div>
                <p className="text-xs font-medium text-[#5A6478] mb-2 uppercase tracking-wide">Mevcut Durum</p>
                <StatusBadge status={selected.app_status} />
              </div>

              {/* Yeni durum */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Durumu Güncelle</label>
                <div className="relative">
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className={inputCls + " appearance-none pr-8"}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Not (opsiyonel)</label>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2}
                  placeholder="Müşteriye veya ekibe not..."
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
              </div>

              {/* Barkod */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">
                  Barkod Numarası {newStatus === "application_submitted" && <span className="text-red-500">*</span>}
                </label>
                <input value={barcodeNo} onChange={e => setBarcodeNo(e.target.value)}
                  placeholder="e-Devlet başvuru barkod no" className={inputCls} />
              </div>

              {/* Belge bilgileri */}
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">
                  Belge Numarası {newStatus === "certificate_received" && <span className="text-red-500">*</span>}
                </label>
                <input value={certNo} onChange={e => setCertNo(e.target.value)}
                  placeholder="F-2026-00XXX" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#5A6478] mb-1">Belge tarihi</label>
                  <input type="date" value={certDate} onChange={e => setCertDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-[#5A6478] mb-1">Geçerlilik sonu</label>
                  <input type="date" value={certExpiry} onChange={e => setCertExpiry(e.target.value)} className={inputCls} />
                </div>
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
                <button onClick={() => setSelectedId(null)}
                  className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">
                  İptal
                </button>
                <button onClick={saveProcess} disabled={saving}
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
