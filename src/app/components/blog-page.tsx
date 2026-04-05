import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Clock, Tag, ArrowRight, BookOpen, Search, X } from "lucide-react";
import { getAllBlogPosts, ALL_TAGS, type BlogPost } from "./blog-data";
import { useAuth } from "./auth-context";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-[#E8E4DC] hover:border-[#C9952B] hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      <div className="overflow-hidden h-48">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-5 flex flex-col flex-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F0EDE8] text-[#5A6478]"
            >
              {tag}
            </span>
          ))}
        </div>
        {/* Title */}
        <h2 className="text-[#0B1D3A] font-semibold text-base leading-snug mb-2 group-hover:text-[#C9952B] transition-colors">
          {post.title}
        </h2>
        {/* Excerpt */}
        <p className="text-[#5A6478] text-sm leading-relaxed line-clamp-3 flex-1">
          {post.excerpt}
        </p>
        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F0EDE8]">
          <div className="flex items-center gap-1.5 text-[#5A6478] text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{post.readingTime} dk okuma</span>
          </div>
          <span className="text-xs text-[#5A6478]">{formatDate(post.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function BlogPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    setAllPosts(getAllBlogPosts());
  }, []);

  // SEO: update document title
  useEffect(() => {
    document.title = "Blog | Müteahhitlik Belgesi – Rehber ve Güncel Bilgiler";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Müteahhitlik yetki belgesi, YKB sınıf tayini, başvuru rehberleri ve inşaat sektörüne dair uzman makaleler."
      );
    }
    return () => {
      document.title = "Müteahhitlik Belgesi – Dijital Analiz ve Başvuru Platformu";
    };
  }, []);

  const filtered = allPosts.filter((post) => {
    const matchesTag = selectedTag ? post.tags.includes(selectedTag) : true;
    const q = searchQuery.toLowerCase();
    const matchesSearch = q
      ? post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      : true;
    return matchesTag && matchesSearch;
  });

  const featured = allPosts[0];

  return (
    <div className="min-h-screen bg-[#F8F7F4] font-[Inter]">
      {/* Navbar */}
      <nav className="bg-[#0B1D3A] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-bold text-base tracking-tight"
          >
            <span className="text-[#C9952B]">●</span>
            muteahhitlikbelgesi.com
          </button>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="border border-white/20 hover:border-[#C9952B] text-white hover:text-[#C9952B] px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Paneliм
              </button>
            ) : null}
            <button
              onClick={() => navigate("/wizard")}
              className="bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Analizi Başlat
            </button>
          </div>
        </div>
      </nav>

      {/* Hero / Header */}
      <div className="bg-[#0B1D3A] pt-14 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#C9952B]/10 border border-[#C9952B]/30 rounded-full px-4 py-1.5 mb-5">
            <BookOpen className="w-4 h-4 text-[#C9952B]" />
            <span className="text-[#C9952B] text-xs font-medium">Uzman Rehberleri</span>
          </div>
          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            Müteahhitlik Dünyasından<br className="hidden sm:block" /> Güncel Bilgiler
          </h1>
          <p className="text-white/60 text-base max-w-2xl mx-auto">
            YKB başvurusu, sınıf tayini, evrak hazırlama ve sektörel gelişmeler hakkında
            uzman yazarlarımızdan pratik rehberler.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Makale ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#C9952B] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedTag(null)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedTag
                ? "bg-[#0B1D3A] text-white"
                : "bg-white text-[#5A6478] border border-[#E8E4DC] hover:border-[#0B1D3A]"
            }`}
          >
            Tümü
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-[#C9952B] text-white"
                  : "bg-white text-[#5A6478] border border-[#E8E4DC] hover:border-[#C9952B]"
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>

        {/* Featured Post (only when no filter active) */}
        {!selectedTag && !searchQuery && featured && (
          <Link
            to={`/blog/${featured.slug}`}
            className="group block bg-white rounded-2xl overflow-hidden border border-[#E8E4DC] hover:border-[#C9952B] hover:shadow-lg transition-all duration-200 mb-10"
          >
            <div className="grid md:grid-cols-2">
              <div className="overflow-hidden h-64 md:h-auto">
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-7 flex flex-col justify-center">
                <span className="text-xs font-semibold text-[#C9952B] uppercase tracking-widest mb-3">
                  Öne Çıkan Yazı
                </span>
                <h2 className="text-[#0B1D3A] text-xl font-bold leading-snug mb-3 group-hover:text-[#C9952B] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[#5A6478] text-sm leading-relaxed mb-5 line-clamp-3">
                  {featured.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#F0EDE8] text-[#5A6478]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-[#5A6478]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {featured.readingTime} dk okuma
                  </div>
                  <span className="flex items-center gap-1 text-[#C9952B] font-medium group-hover:gap-2 transition-all">
                    Devamını Oku <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered
              .filter((p) => (!selectedTag && !searchQuery && featured ? p.id !== featured.id : true))
              .map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#5A6478]">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-base font-medium">Sonuç bulunamadı.</p>
            <p className="text-sm mt-1">Farklı bir arama veya etiket deneyin.</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-[#0B1D3A] mt-8 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-white text-xl font-bold mb-3">
            Müteahhitlik belgesi sürecinizi kolaylaştıralım
          </h3>
          <p className="text-white/60 text-sm mb-6">
            Platformumuzdaki otomatik analiz aracıyla dakikalar içinde ne tür belgeye ihtiyacınız
            olduğunu öğrenin.
          </p>
          <button
            onClick={() => navigate("/wizard")}
            className="bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-8 py-3 rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
          >
            Ücretsiz Analiz Başlat <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}