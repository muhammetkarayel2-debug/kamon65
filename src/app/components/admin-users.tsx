import { useState, useMemo } from "react";
import { Users, Building2, Mail, Search, Eye, MessageSquare, FileText, X, Send, CheckCircle } from "lucide-react";
import {
  Company, Invoice, AdminMessage,
  loadFromStorage, saveToStorage,
  MOCK_COMPANIES_KEY, MOCK_BILLING_KEY,
  ADMIN_MESSAGES_KEY, COMPANY_TYPE_LABELS, formatDate, formatDateTime
} from "./admin-data";

interface UserRecord {
  email: string;
  companies: Company[];
  totalInvoiced: number;
  totalPaid: number;
  lastActivity: string;
}

interface Props { refreshKey: number; onRefresh: () => void; }

export function AdminUsers({ refreshKey, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [viewUser, setViewUser] = useState<UserRecord | null>(null);
  const [msgModal, setMsgModal] = useState<string | null>(null); // email
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  const users = useMemo(() => {
    const companies = loadFromStorage<Company[]>(MOCK_COMPANIES_KEY, []);
    const allBilling = loadFromStorage<Record<string, Invoice[]>>(MOCK_BILLING_KEY, {});

    const userMap: Record<string, UserRecord> = {};
    companies.forEach(c => {
      const email = c.userEmail || c.email || "bilinmiyor";
      if (!userMap[email]) {
        userMap[email] = { email, companies: [], totalInvoiced: 0, totalPaid: 0, lastActivity: c.createdAt };
      }
      userMap[email].companies.push(c);
      if (new Date(c.updatedAt) > new Date(userMap[email].lastActivity)) {
        userMap[email].lastActivity = c.updatedAt;
      }
      const invs = allBilling[c.id] || [];
      invs.forEach(inv => {
        const amt = parseFloat(inv.amount.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        userMap[email].totalInvoiced += amt;
        if (inv.status === "paid") userMap[email].totalPaid += amt;
      });
    });

    return Object.values(userMap).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const messages = useMemo(() => loadFromStorage<AdminMessage[]>(ADMIN_MESSAGES_KEY, []), [refreshKey]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.email.toLowerCase().includes(q) || u.companies.some(c => c.companyName?.toLowerCase().includes(q)));
  }, [users, search]);

  const sendMessage = () => {
    if (!msgModal || !msgSubject.trim() || !msgBody.trim()) return;
    const msg: AdminMessage = {
      id: crypto.randomUUID(),
      userEmail: msgModal,
      subject: msgSubject.trim(),
      body: msgBody.trim(),
      sentAt: new Date().toISOString(),
      isRead: false,
    };
    const existing = loadFromStorage<AdminMessage[]>(ADMIN_MESSAGES_KEY, []);
    saveToStorage(ADMIN_MESSAGES_KEY, [msg, ...existing]);
    setMsgSent(true);
    setTimeout(() => { setMsgModal(null); setMsgSubject(""); setMsgBody(""); setMsgSent(false); onRefresh(); }, 1000);
  };

  const userMessages = (email: string) => messages.filter(m => m.userEmail === email);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0B1D3A] text-lg font-bold">Kullanıcı Yönetimi</h2>
          <p className="text-[#5A6478] text-xs mt-0.5">{users.length} aktif kullanıcı</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="E-posta veya şirket adı..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F7F4] border-b border-[#E8E4DC]">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-[#5A6478] font-medium">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium">Şirket</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden md:table-cell">Ödeme</th>
                <th className="text-left px-4 py-3 text-xs text-[#5A6478] font-medium hidden lg:table-cell">Son Aktivite</th>
                <th className="text-right px-5 py-3 text-xs text-[#5A6478] font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-[#5A6478] text-sm">Kullanıcı bulunamadı.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.email} className="hover:bg-[#F8F7F4]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0B1D3A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.email[0]?.toUpperCase()}
                      </div>
                      <span className="text-[#0B1D3A] text-sm truncate max-w-[160px]">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[#5A6478] text-xs">
                      <Building2 className="w-3.5 h-3.5" /> {u.companies.length} şirket
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div>
                      <p className="text-[#0B1D3A] text-xs font-semibold">{u.totalPaid.toLocaleString("tr-TR")} ₺</p>
                      <p className="text-[#5A6478] text-xs">/ {u.totalInvoiced.toLocaleString("tr-TR")} ₺ toplam</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#5A6478] text-xs hidden lg:table-cell">{formatDate(u.lastActivity)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewUser(u)}
                        className="p-1.5 text-[#5A6478] hover:text-[#0B1D3A] hover:bg-[#F0EDE8] rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setMsgModal(u.email)}
                        className="p-1.5 text-[#5A6478] hover:text-[#C9952B] hover:bg-[#C9952B]/10 rounded-lg transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold">
                  {viewUser.email[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">{viewUser.email}</p>
                  <p className="text-white/60 text-xs">{viewUser.companies.length} şirket · Son: {formatDate(viewUser.lastActivity)}</p>
                </div>
              </div>
              <button onClick={() => setViewUser(null)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Finance summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-green-600 text-xs mb-1">Ödenen</p>
                  <p className="text-green-800 font-bold">{viewUser.totalPaid.toLocaleString("tr-TR")} ₺</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-red-500 text-xs mb-1">Kalan Bakiye</p>
                  <p className="text-red-700 font-bold">{(viewUser.totalInvoiced - viewUser.totalPaid).toLocaleString("tr-TR")} ₺</p>
                </div>
              </div>
              {/* Companies */}
              <div>
                <p className="text-xs text-[#5A6478] mb-2 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Şirketler</p>
                <div className="space-y-2">
                  {viewUser.companies.map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-[#F8F7F4] rounded-xl px-4 py-3">
                      <div>
                        <p className="text-[#0B1D3A] text-sm font-medium">{c.companyName}</p>
                        <p className="text-[#5A6478] text-xs">{COMPANY_TYPE_LABELS[c.companyType]}</p>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#C9952B]/10 text-[#C9952B] text-xs font-bold">{c.group}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Messages */}
              {userMessages(viewUser.email).length > 0 && (
                <div>
                  <p className="text-xs text-[#5A6478] mb-2 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Gönderilen Mesajlar</p>
                  <div className="space-y-2">
                    {userMessages(viewUser.email).slice(0, 3).map(m => (
                      <div key={m.id} className="bg-[#F8F7F4] rounded-xl px-4 py-3">
                        <p className="text-[#0B1D3A] text-sm font-medium">{m.subject}</p>
                        <p className="text-[#5A6478] text-xs mt-0.5">{formatDateTime(m.sentAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => { setViewUser(null); setMsgModal(viewUser.email); }}
                className="w-full bg-[#0B1D3A] hover:bg-[#122A54] text-white py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                <MessageSquare className="w-4 h-4" /> Mesaj Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {msgModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMsgModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4DC]">
              <h3 className="text-[#0B1D3A] font-bold text-base">Mesaj Gönder</h3>
              <button onClick={() => setMsgModal(null)} className="text-[#5A6478] hover:text-[#0B1D3A]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Alıcı</label>
                <input value={msgModal} readOnly className="w-full px-3 py-2.5 bg-[#F8F7F4] border border-[#E8E4DC] rounded-lg text-sm text-[#5A6478]" />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Konu <span className="text-red-400">*</span></label>
                <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="Konu girin..."
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Mesaj <span className="text-red-400">*</span></label>
                <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={5} placeholder="Mesajınızı yazın..."
                  className="w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B] resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-[#E8E4DC] flex items-center justify-between">
              {msgSent && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Gönderildi</span>}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setMsgModal(null)} className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">İptal</button>
                <button onClick={sendMessage} disabled={!msgSubject.trim() || !msgBody.trim()}
                  className="px-4 py-2 text-sm bg-[#0B1D3A] hover:bg-[#122A54] disabled:bg-gray-300 text-white rounded-lg flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
