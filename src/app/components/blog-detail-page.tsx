import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Clock, Tag, ArrowLeft, ArrowRight, User, Calendar } from "lucide-react";
import { getAllBlogPosts, type BlogPost } from "./blog-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  useEffect(() => { setAllPosts(getAllBlogPosts()); }, []);

  const post = allPosts.find((p) => p.slug === slug);

  // Related posts (same tag, different id)
  const related = post
    ? allPosts.filter(
        (p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t))
      ).slice(0, 2)
    : [];

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Müteahhitlik Belgesi Blog`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", post.excerpt);

      // OG tags
      const setMeta = (prop: string, content: string) => {
        let el = document.querySelector(`meta[property="${prop}"]`);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute("property", prop);
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };
      setMeta("og:title", post.title);
      setMeta("og:description", post.excerpt);
      setMeta("og:image", post.coverImage);
      setMeta("og:type", "article");
    }
    return () => {
      document.title = "Müteahhitlik Belgesi – Dijital Analiz ve Başvuru Platformu";
    };
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center font-[Inter]">
        <div className="text-center">
          <p className="text-[#0B1D3A] text-lg font-semibold mb-2">Makale bulunamadı.</p>
          <button
            onClick={() => navigate("/blog")}
            className="text-[#C9952B] text-sm hover:underline"
          >
            Blog'a dön
          </button>
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => navigate("/wizard")}
            className="bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Analizi Başlat
          </button>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 text-xs text-[#5A6478]">
          <Link to="/" className="hover:text-[#C9952B] transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-[#C9952B] transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-[#0B1D3A] line-clamp-1">{post.title}</span>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              to={`/blog?tag=${encodeURIComponent(tag)}`}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-[#F0EDE8] text-[#5A6478] hover:bg-[#C9952B]/10 hover:text-[#C9952B] transition-colors"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-[#0B1D3A] text-2xl sm:text-3xl font-bold leading-tight mb-5">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A6478] mb-7 pb-7 border-b border-[#E8E4DC]">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>
              <strong className="text-[#0B1D3A]">{post.author}</strong> — {post.authorTitle}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.publishedAt)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTime} dk okuma
          </div>
        </div>

        {/* Cover Image */}
        <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>

        {/* Content */}
        <div
          className="prose prose-sm sm:prose max-w-none
            prose-headings:text-[#0B1D3A] prose-headings:font-bold
            prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
            prose-p:text-[#3D4A5C] prose-p:leading-relaxed prose-p:mb-4
            prose-ul:text-[#3D4A5C] prose-ul:space-y-1.5 prose-ul:pl-5
            prose-li:marker:text-[#C9952B]
            prose-strong:text-[#0B1D3A]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-[#E8E4DC]">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#5A6478] hover:text-[#C9952B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Blog'a Dön
          </Link>
        </div>
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <h3 className="text-[#0B1D3A] font-bold text-base mb-5">İlgili Yazılar</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {related.map((rel) => (
              <Link
                key={rel.id}
                to={`/blog/${rel.slug}`}
                className="group bg-white rounded-xl overflow-hidden border border-[#E8E4DC] hover:border-[#C9952B] hover:shadow-md transition-all duration-200 flex gap-4 p-4"
              >
                <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={rel.coverImage}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0B1D3A] text-sm font-semibold line-clamp-2 group-hover:text-[#C9952B] transition-colors leading-snug mb-1">
                    {rel.title}
                  </p>
                  <div className="flex items-center gap-1 text-[#5A6478] text-xs">
                    <Clock className="w-3 h-3" />
                    {rel.readingTime} dk
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-[#0B1D3A] py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-white text-xl font-bold mb-3">
            Müteahhitlik belgesi almak mı istiyorsunuz?
          </h3>
          <p className="text-white/60 text-sm mb-6">
            3 adımlık sihirbazımızla şirketinizin hangi sınıfa uygun olduğunu hemen öğrenin.
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
