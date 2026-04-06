import { useMemo } from "react";
import {
  Users, Building2, FileText, CreditCard, TrendingUp, AlertTriangle,
  CheckCircle, Clock, ArrowRight, Activity, BarChart3, Zap
} from "lucide-react";
import {
  Company, Invoice, ProcessData, AdminReport, AdminMessage,
  loadFromStorage, MOCK_COMPANIES_KEY, MOCK_BILLING_KEY,
  MOCK_PROCESS_KEY, ADMIN_REPORTS_KEY, ADMIN_MESSAGES_KEY,
  formatDateTime, getStatusInfo
} from "./admin-data";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
}
function StatCard({ icon: Icon, label, value, sub, color, bg }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-[#5A6478] text-xs mb-0.5">{label}</p>
        <p className="text-[#0B1D3A] text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-[#5A6478] text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface Props {
  onNavigate: (tab: string) => void;
  refreshKey: number;
}

export function AdminDashboard({ onNavigate, refreshKey }: Props) {
  const data = useMemo(() => {
    const companies = loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []);
    const allBilling = loadFromStorage<Record<string, Invoice[]>>(MOCK_BILLING_KEY, {});
    const allProcesses = loadFromStorage<Record<string, ProcessData>>(MOCK_PROCESS_KEY, {});
    const reports = loadFromStorage<AdminReport[]>(ADMIN_REPORTS_KEY, []);
    const messages = loadFromStorage<AdminMessage[]>(ADMIN_MESSAGES_KEY, []);

    const uniqueUsers = new Set(companies.map(c => c.userEmail || c.email).filter(Boolean));
    const allInvoices: Invoice[] = Object.values(allBilling).flat();
    const totalRevenue = allInvoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + (parseFloat(i.amount.replace(/[^\d,]/g, "").replace(",", ".")) || 0), 0);
    const unpaidCount = allInvoices.filter(i => i.status === "unpaid" || i.status === "overdue").length;
    const unpaidAmount = allInvoices
      .filter(i => i.status === "unpaid" || i.status === "overdue")
      .reduce((sum, i) => sum + (parseFloat(i.amount.replace(/[^\d,]/g, "").replace(",", ".")) || 0), 0);

    // 10-durum sistemi — appStatus field'dan sayar
    const statusCounts: Record<string, number> = {};
    companies.forEach(c => {
      const s = c.appStatus || "wizard_incomplete";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // Backward-compat: processData.status da sayılır
    const processEntries = Object.values(allProcesses);
    const legacyActive = processEntries.filter(p => p.status === "incelemede" || p.status === "bekliyor").length;
    const legacyMissing = processEntries.filter(p => p.status === "eksik_evrak").length;
    const legacyDone = processEntries.filter(p => p.status === "tamamlandi").length;

    const activeCount = (statusCounts["payment_received"] || 0) + (statusCounts["report_locked"] || 0) + legacyActive;
    const missingDocCount = (statusCounts["docs_in_progress"] || 0) + legacyMissing;
    const doneCount = (statusCounts["certificate_received"] || 0) + legacyDone;
    const pendingPayment = (statusCounts["pending_payment"] || 0);
    const docsComplete = (statusCounts["docs_complete"] || 0) + (statusCounts["application_submitted"] || 0);

    // Recent activity: last 8 companies + process updates
    const recent = companies
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);

    const unreadMessages = messages.filter(m => !m.isRead).length;
    const unreadReports = reports.filter(r => !r.isRead).length;

    return {
      totalUsers: uniqueUsers.size,
      totalCompanies: companies.length,
      totalRevenue,
      unpaidCount,
      unpaidAmount,
      activeCount,
      missingDocCount,
      doneCount,
      pendingPayment,
      docsComplete,
      statusCounts,
      recent,
      reportsCount: reports.length,
      unreadMessages,
      unreadReports,
      companies,
      processEntries,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleSeed = () => {
    
    window.location.reload();
  };

  const groupCounts = useMemo(() => {
    const groups: Record<string, number> = {};
    data.companies.forEach(c => {
      const g = c.group || "?";
      groups[g] = (groups[g] || 0) + 1;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [data.companies]);

  const maxGroupCount = groupCounts.reduce((m, [, v]) => Math.max(m, v), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0B1D3A] text-xl font-bold">Admin Paneli</h1>
          <p className="text-[#5A6478] text-sm mt-0.5">muteahhitlikbelgesi.com yönetim merkezi</p>
        </div>
        {data.totalCompanies === 0 && (
          <button
            onClick={handleSeed}
            className="flex items-center gap-2 bg-[#C9952B]/10 border border-[#C9952B]/30 text-[#C9952B] px-4 py-2 rounded-lg text-sm hover:bg-[#C9952B]/20 transition-colors"
          >
            <Zap className="w-4 h-4" /> Demo Veri Yükle
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Toplam Kullanıcı" value={data.totalUsers} sub="Benzersiz e-posta" color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Building2} label="Kayıtlı Şirket" value={data.totalCompanies} sub="Tüm başvurular" color="text-[#C9952B]" bg="bg-[#C9952B]/10" />
        <StatCard icon={TrendingUp} label="Toplam Gelir" value={`${data.totalRevenue.toLocaleString("tr-TR")} ₺`} sub="Tahsil edildi" color="text-green-600" bg="bg-green-50" />
        <StatCard icon={CreditCard} label="Bekleyen Tahsilat" value={`${data.unpaidAmount.toLocaleString("tr-TR")} ₺`} sub={`${data.unpaidCount} fatura`} color="text-red-500" bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Hesaplama / Rapor" value={data.activeCount} sub="Ödeme alındı & rapor hazır" color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={AlertTriangle} label="Evrak Eksik" value={data.missingDocCount} sub="Müdahale gerekiyor" color="text-orange-500" bg="bg-orange-50" />
        <StatCard icon={CheckCircle} label="Belge Alındı" value={data.doneCount} sub="Tamamlanan" color="text-green-600" bg="bg-green-50" />
        <StatCard icon={Clock} label="Ödeme Bekliyor" value={data.pendingPayment} sub="Ödeme bekleniyor" color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Middle Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Grup Dağılımı */}
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#C9952B]" />
            <h3 className="text-[#0B1D3A] font-semibold text-sm">Grup Dağılımı</h3>
          </div>
          {groupCounts.length === 0 ? (
            <p className="text-[#5A6478] text-xs text-center py-6">Henüz şirket yok</p>
          ) : (
            <div className="space-y-2.5">
              {groupCounts.map(([group, count]) => (
                <div key={group} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-bold text-[#0B1D3A] shrink-0">{group}</span>
                  <div className="flex-1 bg-[#F0EDE8] rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#C9952B]"
                      style={{ width: `${(count / maxGroupCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#5A6478] w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Başvuru Durumu */}
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#C9952B]" />
            <h3 className="text-[#0B1D3A] font-semibold text-sm">Başvuru Durumları</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Beklemede", key: "bekliyor", color: "bg-yellow-400" },
              { label: "İncelemede", key: "incelemede", color: "bg-blue-400" },
              { label: "Eksik Evrak", key: "eksik_evrak", color: "bg-orange-400" },
              { label: "Tamamlandı", key: "tamamlandi", color: "bg-green-400" },
              { label: "Reddedildi", key: "reddedildi", color: "bg-red-400" },
            ].map(({ label, key, color }) => {
              const cnt = data.processEntries.filter(p => p.status === key).length;
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-[#5A6478] text-xs">{label}</span>
                  </div>
                  <span className="text-[#0B1D3A] font-semibold text-xs">{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hızlı Eylemler */}
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#C9952B]" />
            <h3 className="text-[#0B1D3A] font-semibold text-sm">Hızlı Eylemler</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Fatura Oluştur", tab: "faturalar", badge: data.unpaidCount > 0 ? data.unpaidCount : null },
              { label: "Rapor Gönder", tab: "raporlar", badge: null },
              { label: "Mesaj Yaz", tab: "mesajlar", badge: data.unreadMessages > 0 ? data.unreadMessages : null },
              { label: "Şirket Yönet", tab: "sirketler", badge: null },
              { label: "Başvuru Güncelle", tab: "basvurular", badge: data.missingDocCount > 0 ? data.missingDocCount : null },
            ].map(({ label, tab, badge }) => (
              <button
                key={tab}
                onClick={() => onNavigate(tab)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#F8F7F4] hover:bg-[#F0EDE8] text-sm text-[#0B1D3A] transition-colors group"
              >
                <span>{label}</span>
                <div className="flex items-center gap-2">
                  {badge !== null && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {badge}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-[#5A6478] group-hover:text-[#C9952B] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Companies */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E4DC] flex items-center justify-between">
          <h3 className="text-[#0B1D3A] font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C9952B]" /> Son Aktivite
          </h3>
          <button onClick={() => onNavigate("sirketler")} className="text-xs text-[#C9952B] hover:underline flex items-center gap-1">
            Tümü <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {data.recent.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#5A6478] text-sm">Henüz veri yok.</p>
            <button onClick={handleSeed} className="mt-3 text-[#C9952B] text-sm hover:underline flex items-center gap-1 mx-auto">
              <Zap className="w-3.5 h-3.5" /> Demo veri yükle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7F4]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs text-[#5A6478] font-medium">Şirket</th>
                  <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden sm:table-cell">Grup</th>
                  <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden md:table-cell">Kullanıcı</th>
                  <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden lg:table-cell">Güncellendi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {data.recent.map(c => (
                  <tr key={c.id} className="hover:bg-[#F8F7F4]">
                    <td className="px-5 py-3 text-[#0B1D3A] font-medium">{c.companyName || "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] text-xs font-bold">
                        {c.group || "?"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5A6478] text-xs hidden md:table-cell">{c.userEmail || c.email || "—"}</td>
                    <td className="px-4 py-3 text-[#5A6478] text-xs hidden lg:table-cell">{formatDateTime(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
