import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Users, Building2, Activity, FolderOpen,
  CreditCard, Tag, Menu, X, LogOut, ChevronRight, Award,
  Eye, EyeOff, Shield, AlertCircle
} from "lucide-react";
import { loadFromStorage, saveToStorage, ADMIN_SESSION_KEY, MOCK_BILLING_KEY, MOCK_PROCESS_KEY } from "./admin-data";
import { AdminDashboard } from "./admin-dashboard";
import { AdminCompanies } from "./admin-companies";
import { AdminUsers } from "./admin-users";
import { AdminProcesses } from "./admin-processes";
import { AdminDocuments } from "./admin-documents";
import { AdminBilling } from "./admin-billing";
import { AdminDiscounts } from "./admin-discounts";

const ADMIN_EMAIL    = "admin@muteahhitlikbelgesi.com";
const ADMIN_PASSWORD = "Admin123!";

type AdminTab = "dashboard" | "sirketler" | "kullanicilar" | "basvurular" | "evraklar" | "faturalar" | "indirimler";

const NAV_ITEMS: { key: AdminTab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { key: "sirketler",    label: "Şirketler",      icon: Building2       },
  { key: "kullanicilar", label: "Kullanıcılar",   icon: Users           },
  { key: "basvurular",  label: "Başvurular",      icon: Activity        },
  { key: "evraklar",    label: "Evraklar",        icon: FolderOpen      },
  { key: "faturalar",   label: "Faturalar",       icon: CreditCard      },
  { key: "indirimler",  label: "İndirimler",      icon: Tag             },
];

function getBadge(tab: AdminTab): number {
  try {
    if (tab === "faturalar") {
      const b = loadFromStorage<Record<string, { status: string }[]>>(MOCK_BILLING_KEY, {});
      return Object.values(b).flat().filter(i => i.status === "unpaid").length;
    }
    if (tab === "basvurular") {
      const p = loadFromStorage<Record<string, { appStatus?: string }[]>>(MOCK_PROCESS_KEY, {});
      return Object.values(p).filter((v: any) => v?.appStatus === "payment_received" || v?.appStatus === "report_locked").length;
    }
  } catch {}
  return 0;
}

/* ── Login ── */
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      saveToStorage(ADMIN_SESSION_KEY, { email, loggedInAt: new Date().toISOString() });
      onLogin();
    } else {
      setError("Hatalı e-posta veya şifre.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] font-[Inter] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Award className="w-8 h-8 text-[#C9952B]" />
            <span className="text-xl font-bold text-[#0B1D3A]">muteahhitlik<span className="text-[#C9952B]">belgesi</span>.com</span>
          </div>
          <h1 className="text-lg font-bold text-[#0B1D3A]">Admin Girişi</h1>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8">
          <div className="flex items-center gap-3 bg-[#0B1D3A]/5 border border-[#0B1D3A]/10 rounded-xl px-4 py-3 mb-6">
            <Shield className="w-5 h-5 text-[#C9952B] shrink-0" />
            <p className="text-xs text-[#5A6478]">Güvenli admin erişimi</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#5A6478] mb-1.5">E-posta</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"
                className="w-full px-4 py-3 rounded-xl bg-[#F0EDE8] border border-[#0B1D3A]/8 focus:border-[#C9952B] outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[#5A6478] mb-1.5">Şifre</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-[#F0EDE8] border border-[#0B1D3A]/8 focus:border-[#C9952B] outline-none text-sm" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6478] p-1">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-200 text-[#0B1D3A] font-medium py-3 rounded-xl text-sm transition-colors">
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Ayarlar ── */
function AdminSettings({ onLogout }: { onLogout: () => void }) {
  const [cleared, setCleared] = useState(false);
  const clear = () => {
    ["mock_panel_companies","mock_panel_docs","mock_panel_process","mock_panel_billing","admin_discounts"].forEach(k => localStorage.removeItem(k));
    setCleared(true); setTimeout(() => setCleared(false), 2000);
  };
  return (
    <div className="space-y-5 max-w-xl">
      <div><h2 className="text-[#0B1D3A] text-lg font-bold">Ayarlar</h2></div>
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6">
        <h3 className="text-sm font-semibold text-[#0B1D3A] mb-3">Demo Veri Temizle</h3>
        <button onClick={clear} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm transition-colors">
          {cleared ? "Temizlendi ✓" : "Tüm Verileri Temizle"}
        </button>
      </div>
      <div className="bg-[#0B1D3A]/5 rounded-2xl border border-[#0B1D3A]/10 p-5 text-xs text-[#5A6478] space-y-1">
        <p>Platform: muteahhitlikbelgesi.com</p>
        <p>Veri: localStorage (Supabase entegrasyonu beklemede)</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5">
        <button onClick={onLogout} className="flex items-center gap-2 border border-[#E8E4DC] text-[#5A6478] hover:text-red-500 hover:border-red-200 px-4 py-2 rounded-lg text-sm transition-colors">
          <LogOut className="w-4 h-4" /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}

/* ── Ana Bileşen ── */
export function AdminPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const s = loadFromStorage<{ email: string } | null>(ADMIN_SESSION_KEY, null);
    if (s?.email === ADMIN_EMAIL) setIsLoggedIn(true);
  }, []);

  const handleLogout = () => { localStorage.removeItem(ADMIN_SESSION_KEY); setIsLoggedIn(false); };
  const handleNavigate = useCallback((tab: string) => { setActiveTab(tab as AdminTab); setSidebarOpen(false); }, []);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  if (!isLoggedIn) return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;

  const props = { refreshKey, onRefresh: refresh };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":    return <AdminDashboard onNavigate={handleNavigate} refreshKey={refreshKey} />;
      case "sirketler":   return <AdminCompanies {...props} />;
      case "kullanicilar":return <AdminUsers {...props} />;
      case "basvurular":  return <AdminProcesses {...props} />;
      case "evraklar":    return <AdminDocuments {...props} />;
      case "faturalar":   return <AdminBilling {...props} />;
      case "indirimler":  return <AdminDiscounts {...props} />;
      default:            return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] font-[Inter] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B1D3A] flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:z-auto`}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[#C9952B]" />
            <div>
              <p className="text-white text-xs font-bold">muteahhitlikbelgesi</p>
              <p className="text-white/40 text-[10px]">Admin Paneli</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white lg:hidden"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const badge = getBadge(key);
            const active = activeTab === key;
            return (
              <button key={key} onClick={() => handleNavigate(key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                <div className="flex items-center gap-2.5"><Icon className="w-4 h-4" /><span>{label}</span></div>
                {badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 text-white/40 hover:text-white/70 text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" /> Siteye Dön
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-white/40 hover:text-red-400 text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="text-[#5A6478] hover:text-[#0B1D3A] lg:hidden p-1"><Menu className="w-5 h-5" /></button>
              <div className="hidden sm:flex items-center gap-1 text-xs text-[#5A6478]">
                <span>Admin</span><ChevronRight className="w-3 h-3" />
                <span className="text-[#0B1D3A] font-medium">{NAV_ITEMS.find(n => n.key === activeTab)?.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5A6478] hidden sm:inline">{ADMIN_EMAIL}</span>
              <div className="w-8 h-8 rounded-full bg-[#0B1D3A] flex items-center justify-center text-white text-xs font-bold">A</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{renderContent()}</main>
      </div>
    </div>
  );
}
