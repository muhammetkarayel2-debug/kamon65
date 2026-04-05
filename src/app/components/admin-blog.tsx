import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, X, Save, CheckCircle, Search, Calendar } from "lucide-react";

const BLOG_KEY = "admin_blog_posts";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  readTime: string;
  publishedAt: string;
  published: boolean;
}

const CATEGORIES = ["Mevzuat","Hesaplama","Başvuru Süreci","Dikkat Edilmesi Gerekenler","Duyuru"];

function loadLS(key: string, fallback: any): any {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {}
  return fallback;
}
function saveLS(key: string, v: any) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function slugify(t: string) {
  return t.toLowerCase().replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

interface Props { refreshKey: number; onRefresh: () => void; }

export function AdminBlog({ refreshKey, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [saveMsg, setSaveMsg] = useState("");

  const emptyForm = (): Omit<BlogPost,"id"> => ({ title: "", slug: "", summary: "", content: "", category: CATEGORIES[0], readTime: "5 dk", publishedAt: new Date().toISOString().slice(0,10), published: false });
  const [form, setForm] = useState(emptyForm());

  const posts = useMemo(() => {
    const all = loadLS(BLOG_KEY, []) as BlogPost[];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  // eslint-disable-next-line
  }, [refreshKey, search]);

  const openNew = () => { setEditPost(null); setForm(emptyForm()); setSaveMsg(""); setShowModal(true); };
  const openEdit = (p: BlogPost) => { setEditPost(p); setForm({ title: p.title, slug: p.slug, summary: p.summary, content: p.content, category: p.category, readTime: p.readTime, publishedAt: p.publishedAt, published: p.published }); setSaveMsg(""); setShowModal(true); };

  const handleSave = () => {
    if (!form.title.trim() || !form.summary.trim()) return;
    const all = loadLS(BLOG_KEY, []) as BlogPost[];
    const slug = form.slug || slugify(form.title);
    if (editPost) {
      saveLS(BLOG_KEY, all.map(p => p.id === editPost.id ? { ...p, ...form, slug } : p));
    } else {
      saveLS(BLOG_KEY, [...all, { ...form, slug, id: crypto.randomUUID() }]);
    }
    setSaveMsg("Kaydedildi"); onRefresh();
    setTimeout(() => { setSaveMsg(""); setShowModal(false); }, 700);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bu yazıyı silmek istediğinizden emin misiniz?")) return;
    const all = loadLS(BLOG_KEY, []) as BlogPost[];
    saveLS(BLOG_KEY, all.filter(p => p.id !== id));
    onRefresh();
  };

  const togglePublish = (id: string) => {
    const all = loadLS(BLOG_KEY, []) as BlogPost[];
    saveLS(BLOG_KEY, all.map(p => p.id === id ? { ...p, published: !p.published } : p));
    onRefresh();
  };

  const iCls = "w-full px-3 py-2.5 border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[#0B1D3A] text-lg font-bold">Blog Yönetimi</h2><p className="text-[#5A6478] text-xs mt-0.5">{posts.length} yazı</p></div>
        <button onClick={openNew} className="flex items-center gap-2 bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Yeni Yazı
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Başlık veya kategori..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E4DC] rounded-lg text-sm focus:outline-none focus:border-[#C9952B]" />
      </div>

      <div className="space-y-3">
        {posts.length === 0 && <div className="bg-white rounded-2xl border border-[#E8E4DC] p-12 text-center text-[#5A6478] text-sm">Henüz blog yazısı yok.</div>}
        {posts.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-[#E8E4DC] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${p.published ? "bg-green-50 text-green-700 border-green-200" : "bg-[#F0EDE8] text-[#5A6478] border-[#E8E4DC]"}`}>
                    {p.published ? "Yayında" : "Taslak"}
                  </span>
                  <span className="text-xs text-[#5A6478] bg-[#F0EDE8] px-2 py-0.5 rounded-full">{p.category}</span>
                </div>
                <h3 className="text-sm font-semibold text-[#0B1D3A] mb-1 truncate">{p.title}</h3>
                <p className="text-xs text-[#5A6478] line-clamp-2">{p.summary}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#5A6478]">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.publishedAt}</span>
                  <span>{p.readTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => togglePublish(p.id)} title={p.published ? "Taslağa Al" : "Yayınla"}
                  className={`p-2 rounded-lg border text-xs transition-colors ${p.published ? "bg-[#F0EDE8] border-[#E8E4DC] text-[#5A6478] hover:bg-red-50 hover:text-red-500" : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"}`}>
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg border border-[#E8E4DC] text-[#5A6478] hover:text-[#0B1D3A] hover:bg-[#F0EDE8] transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg border border-[#E8E4DC] text-[#5A6478] hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E4DC] sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-[#0B1D3A] font-bold">{editPost ? "Yazıyı Düzenle" : "Yeni Blog Yazısı"}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#5A6478] hover:text-[#0B1D3A]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Başlık <span className="text-red-400">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))} placeholder="Blog yazısı başlığı" className={iCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#5A6478] mb-1">Kategori</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={iCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#5A6478] mb-1">Okuma Süresi</label>
                  <input value={form.readTime} onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))} placeholder="5 dk" className={iCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Yayın Tarihi</label>
                <input type="date" value={form.publishedAt} onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))} className={iCls} />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Özet <span className="text-red-400">*</span></label>
                <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2} placeholder="Kısa özet (liste görünümünde görünür)" className={`${iCls} resize-none`} />
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">İçerik</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} placeholder="Blog içeriği..." className={`${iCls} resize-none`} />
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${form.published ? "bg-[#C9952B]" : "bg-[#E8E4DC]"}`} onClick={() => setForm(f => ({ ...f, published: !f.published }))}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-0.5 mx-0.5 transition-transform shadow-sm ${form.published ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-[#5A6478]">{form.published ? "Yayında" : "Taslak"}</span>
              </div>
            </div>
            <div className="p-5 border-t border-[#E8E4DC] flex items-center justify-between">
              {saveMsg && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />{saveMsg}</span>}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#5A6478] border border-[#E8E4DC] rounded-lg hover:bg-[#F8F7F4]">İptal</button>
                <button onClick={handleSave} disabled={!form.title.trim() || !form.summary.trim()}
                  className="px-4 py-2 text-sm bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-200 text-[#0B1D3A] rounded-lg flex items-center gap-1.5">
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
