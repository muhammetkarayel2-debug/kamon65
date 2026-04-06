import { useState, useEffect } from "react";
import {
  Users, Building2, CreditCard, TrendingUp, AlertTriangle,
  CheckCircle, Clock, ArrowRight, Activity, BarChart3
} from "lucide-react";
import { formatDate } from "./admin-data";

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
  const [data, setData] = useState<any>({
    totalCompanies: 0,
    totalUsers: 0,
    totalRevenue: 0,
    unpaidAmount: 0,
    unpaidCount: 0,
    pendingPayment: 0,
    activeCount: 0,
    doneCount: 0,
    recentCompanies: [],
    statusCounts: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [refreshKey]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const { adminGetAllCompanies, adminGetAllBilling } = await import("./supabase-client");
      const [companies, billing] = await Promise.all([
        adminGetAllCompanies(),
        adminGetAllBilling(),
      ]);

      const uniqueUsers = new Set(companies.map((c: any) => c.user_email).filter(Boolean));
      const totalRevenue = billing
        .filter((b: any) => b.status === "paid")
        .reduce((s: number, b: any) => s + (b.amount_num || 0), 0);
      const unpaidAmount = billing
        .filter((b: any) => b.status !== "paid")
        .reduce((s: number, b: any) => s + (b.amount_num || 0), 0);
      const unpaidCount = billing.filter((b: any) => b.status !== "paid").length;

      const statusCounts: Record<string, number> = {};
      companies.forEach((c: any) => {
        const s = c.app_status || "wizard_incomplete";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      const pendingPayment = statusCounts["pending_payment"] || 0;
      const activeCount = (statusCounts["payment_received"] || 0) + (statusCounts["report_locked"] || 0);
      const doneCount = statusCounts["certificate_received"] || 0;

      const recentCompanies = [...companies]
        .sort((a: any, b: any) => new Date(b.guncelleme).getTime() - new Date(a.guncelleme).getTime())
        .slice(0, 6);

      setData({
        totalCompanies: companies.length,
        totalUsers: uniqueUsers.size,
        totalRevenue,
        unpaidAmount,
        unpaidCount,
        pendingPayment,
        activeCount,
        doneCount,
        recentCompanies,
        statusCounts,
      });
    } catch (e) {
      console.error("Dashboard yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  }

  const tl = (n: number) => n.toLocaleString("tr-TR") + " ₺";

  const STATUS_LABEL: Record<string, string> = {
    wizard_incomplete:     "Başvuru eksik",
    pending_payment:       "Ödeme bekliyor",
    payment_received:      "Ödeme alındı",
    report_locked:         "Rapor hazırlanıyor",
    report_published:      "Rapor yayınlandı",
    docs_in_progress:      "Evrak toplanıyor",
    docs_complete:         "Evraklar tamam",
    application_submitted: "Başvuru yapıldı",
    certificate_received:  "Belge alındı",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#0B1D3A] text-xl font-bold">Admin Paneli</h1>
        <p className="text-[#5A6478] text-sm mt-0.5">muteahhitlikbelgesi.com yönetim merkezi</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#E8E4DC] p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat kartlar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Building2}   label="Toplam Başvuru"    value={data.totalCompanies} color="text-blue-600"   bg="bg-blue-50" />
            <StatCard icon={Users}       label="Kayıtlı Kullanıcı" value={data.totalUsers}     color="text-purple-600" bg="bg-purple-50" />
            <StatCard icon={CreditCard}  label="Tahsil Edilen"     value={tl(data.totalRevenue)} color="text-green-600" bg="bg-green-50" />
            <StatCard icon={TrendingUp}  label="Bekleyen Ödeme"    value={tl(data.unpaidAmount)} sub={`${data.unpaidCount} fatura`} color="text-amber-600" bg="bg-amber-50" />
          </div>

          {/* Durum özeti */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center cursor-pointer hover:opacity-80" onClick={() => onNavigate("basvurular")}>
              <p className="text-3xl font-bold text-amber-700">{data.pendingPayment}</p>
              <p className="text-xs text-amber-600 mt-1">Ödeme Bekliyor</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center cursor-pointer hover:opacity-80" onClick={() => onNavigate("hesaplama")}>
              <p className="text-3xl font-bold text-blue-700">{data.activeCount}</p>
              <p className="text-xs text-blue-600 mt-1">Hesaplama / Rapor</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center cursor-pointer hover:opacity-80" onClick={() => onNavigate("basvurular")}>
              <p className="text-3xl font-bold text-green-700">{data.doneCount}</p>
              <p className="text-xs text-green-600 mt-1">Belge Alındı</p>
            </div>
          </div>

          {/* Son başvurular */}
          {data.recentCompanies.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DC]">
                <h2 className="text-sm font-semibold text-[#0B1D3A]">Son Başvurular</h2>
                <button onClick={() => onNavigate("basvurular")}
                  className="text-xs text-[#C9952B] hover:underline flex items-center gap-1">
                  Tümü <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-[#F0EDE8]">
                {data.recentCompanies.map((c: any) => (
                  <div key={c.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0B1D3A] truncate">{c.company_name}</p>
                      <p className="text-xs text-[#5A6478]">{c.user_email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] bg-[#F0EDE8] text-[#5A6478] px-2 py-0.5 rounded-full">
                        {STATUS_LABEL[c.app_status] || c.app_status}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">{formatDate(c.guncelleme)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Durum dağılımı */}
          {Object.keys(data.statusCounts).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8E4DC]">
                <h2 className="text-sm font-semibold text-[#0B1D3A]">Durum Dağılımı</h2>
              </div>
              <div className="p-5 space-y-3">
                {Object.entries(data.statusCounts)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .map(([status, count]: any) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-xs text-[#5A6478] w-44 shrink-0">
                        {STATUS_LABEL[status] || status}
                      </span>
                      <div className="flex-1 bg-[#F0EDE8] rounded-full h-2">
                        <div
                          className="bg-[#C9952B] h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (count / data.totalCompanies) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#0B1D3A] w-6 text-right">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {data.totalCompanies === 0 && (
            <div className="bg-white rounded-2xl border border-[#E8E4DC] p-12 text-center">
              <Activity className="w-12 h-12 text-[#E8E4DC] mx-auto mb-4" />
              <h3 className="text-base font-semibold text-[#0B1D3A] mb-2">Henüz başvuru yok</h3>
              <p className="text-sm text-[#5A6478]">İlk müşteri başvurusunu bekliyorsunuz.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
