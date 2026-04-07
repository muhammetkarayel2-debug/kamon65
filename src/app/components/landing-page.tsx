import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, CheckCircle, ArrowRight, Award, Calculator, Users, Building2, MapPin, FileText, Scale, ChevronDown, ChevronUp, Phone, BookOpen, Gavel, Star, Zap, Lock, RefreshCw, Clock, X, Loader2, Mail, Eye, EyeOff, User } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "./auth-context";

const heroImage = "https://images.unsplash.com/photo-1760385737118-50128d74a952?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBidWlsZGluZyUyMHNreWxpbmUlMjBtb2Rlcm58ZW58MXx8fHwxNzc0ODYyMjY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/* ── Referans Verileri ── */
const referanslar = [
  { firma: "Meş Gayrimenkul İnşaat Ltd. Şti.", ilce: "Kadıköy", il: "İstanbul" },
  { firma: "Doğu Yapı İnşaat Taahhüt A.Ş.", ilce: "Ümraniye", il: "İstanbul" },
  { firma: "Atlas Mühendislik İnşaat Ltd. Şti.", ilce: "Beşiktaş", il: "İstanbul" },
  { firma: "Kuzey İnşaat Taahhüt ve Tic. A.Ş.", ilce: "Çankaya", il: "Ankara" },
  { firma: "Güney Yapı Kooperatifi", ilce: "Konak", il: "İzmir" },
  { firma: "Akdeniz İnşaat ve Proje Ltd. Şti.", ilce: "Muratpaşa", il: "Antalya" },
  { firma: "Merkez Gayrimenkul Yatırım A.Ş.", ilce: "Nilüfer", il: "Bursa" },
  { firma: "Boğaziçi İnşaat Ltd. Şti.", ilce: "Sarıyer", il: "İstanbul" },
  { firma: "Yıldız Yapı Taahhüt A.Ş.", ilce: "Bağcılar", il: "İstanbul" },
  { firma: "Kartal İnşaat ve Tic. Ltd. Şti.", ilce: "Kartal", il: "İstanbul" },
  { firma: "Başkent Müteahhitlik A.Ş.", ilce: "Keçiören", il: "Ankara" },
  { firma: "Ege Yapı İnşaat Kooperatifi", ilce: "Bornova", il: "İzmir" },
  { firma: "Marmara İnşaat Taahhüt Ltd. Şti.", ilce: "Pendik", il: "İstanbul" },
  { firma: "Anadolu Gayrimenkul A.Ş.", ilce: "Kocasinan", il: "Kayseri" },
  { firma: "Trakya İnşaat ve Proje Ltd. Şti.", ilce: "Süleymanpaşa", il: "Tekirdağ" },
  { firma: "Karadeniz Yapı Taahhüt A.Ş.", ilce: "Ortahisar", il: "Trabzon" },
  { firma: "Çukurova İnşaat Ltd. Şti.", ilce: "Seyhan", il: "Adana" },
  { firma: "Olimpos Gayrimenkul A.Ş.", ilce: "Konyaaltı", il: "Antalya" },
  { firma: "Bayrak İnşaat Taahhüt Ltd. Şti.", ilce: "Sancaktepe", il: "İstanbul" },
  { firma: "Doruk Yapı ve Mühendislik A.Ş.", ilce: "Maltepe", il: "İstanbul" },
  { firma: "Pınar İnşaat Kooperatifi", ilce: "Osmangazi", il: "Bursa" },
  { firma: "Erdem Gayrimenkul Ltd. Şti.", ilce: "Mamak", il: "Ankara" },
  { firma: "Kale İnşaat Taahhüt A.Ş.", ilce: "Selçuklu", il: "Konya" },
  { firma: "Liman Yapı ve Proje Ltd. Şti.", ilce: "Alsancak", il: "İzmir" },
  { firma: "Vadi İnşaat Tic. A.Ş.", ilce: "Başakşehir", il: "İstanbul" },
  { firma: "Nehir Gayrimenkul Ltd. Şti.", ilce: "Yıldırım", il: "Bursa" },
  { firma: "Göl İnşaat Taahhüt A.Ş.", ilce: "Sakarya", il: "Sakarya" },
  { firma: "Çınar Yapı ve Tic. Ltd. Şti.", ilce: "Ataşehir", il: "İstanbul" },
  { firma: "Zirve Müteahhitlik A.Ş.", ilce: "Şahinbey", il: "Gaziantep" },
  { firma: "Sahil İnşaat Ltd. Şti.", ilce: "Merkezefendi", il: "Denizli" },
  { firma: "Dağ Yapı Taahhüt A.Ş.", ilce: "Melikgazi", il: "Kayseri" },
  { firma: "Köprü İnşaat ve Proje Ltd. Şti.", ilce: "Beylikdüzü", il: "İstanbul" },
  { firma: "Hilal Gayrimenkul A.Ş.", ilce: "Yenimahalle", il: "Ankara" },
  { firma: "Taş Yapı İnşaat Ltd. Şti.", ilce: "Tarsus", il: "Mersin" },
  { firma: "Yeşil İnşaat Taahhüt A.Ş.", ilce: "Menteşe", il: "Muğla" },
  { firma: "Altın Yapı Kooperatifi", ilce: "Çorlu", il: "Tekirdağ" },
  { firma: "Güneş İnşaat Ltd. Şti.", ilce: "Esenyurt", il: "İstanbul" },
  { firma: "Yüce Gayrimenkul Yatırım A.Ş.", ilce: "Etimesgut", il: "Ankara" },
  { firma: "Barış İnşaat Taahhüt Ltd. Şti.", ilce: "Meram", il: "Konya" },
  { firma: "Deniz Yapı ve Proje A.Ş.", ilce: "Büyükçekmece", il: "İstanbul" },
  { firma: "Orman İnşaat Tic. Ltd. Şti.", ilce: "Düzce Merkez", il: "Düzce" },
  { firma: "Bulut Gayrimenkul A.Ş.", ilce: "Adapazarı", il: "Sakarya" },
  { firma: "Kaya İnşaat Taahhüt Ltd. Şti.", ilce: "Çankırı Merkez", il: "Çankırı" },
  { firma: "Işık Yapı ve Mühendislik A.Ş.", ilce: "Gebze", il: "Kocaeli" },
  { firma: "Demir İnşaat Ltd. Şti.", ilce: "İzmit", il: "Kocaeli" },
  { firma: "Çelik Gayrimenkul Taahhüt A.Ş.", ilce: "Battalgazi", il: "Malatya" },
  { firma: "Temel Yapı İnşaat Ltd. Şti.", ilce: "Silivri", il: "İstanbul" },
  { firma: "Proje İnşaat ve Tic. A.Ş.", ilce: "Küçükçekmece", il: "İstanbul" },
  { firma: "Tuğla Gayrimenkul Ltd. Şti.", ilce: "Odunpazarı", il: "Eskişehir" },
  { firma: "Sütun İnşaat Taahhüt A.Ş.", ilce: "Efeler", il: "Aydın" },
  { firma: "Konak Yapı ve Proje Ltd. Şti.", ilce: "Esenler", il: "İstanbul" },
  { firma: "Beton İnşaat Kooperatifi", ilce: "Kepez", il: "Antalya" },
  { firma: "Mimari Gayrimenkul A.Ş.", ilce: "Çiğli", il: "İzmir" },
];

/* ── Trust Badges ── */
const trustItems = [
  { icon: Building2, text: "300+ Müteahhit Firma" },
  { icon: CheckCircle, text: "400+ Başarılı Başvuru" },
  { icon: Zap, text: "Hızlı Süreç Yönetimi" },
  { icon: RefreshCw, text: "2026 Güncel Mevzuat" },
];

/* ── Mevzuat Verileri ── */
const mevzuatItems = [
  {
    baslik: "Yapı Müteahhitlerinin Sınıflandırılması Hakkında Yönetmelik",
    ozet: "Müteahhitlerin yetki belgesi gruplarının (A-H) belirlenmesine ilişkin usul ve esaslar.",
    tarih: "02.03.2019",
    resmiGazete: "30702",
  },
  {
    baslik: "4708 Sayılı Yapı Denetimi Hakkında Kanun",
    ozet: "Yapı denetim kuruluşları ve müteahhitlerin sorumlulukları.",
    tarih: "29.06.2001",
    resmiGazete: "24449",
  },
  {
    baslik: "Yapı Müteahhitlerinin Yetki Belgesi Numarası Tebliği",
    ozet: "Yetki belgesi numarası başvuru süreci, gerekli belgeler ve harç bilgileri.",
    tarih: "16.12.2020",
    resmiGazete: "31336",
  },
  {
    baslik: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Harç Tarifesi (2026)",
    ozet: "Yetki belgesi başvuru harçlarının güncel tutarları ve ödeme koşulları.",
    tarih: "01.01.2026",
    resmiGazete: "—",
  },
  {
    baslik: "3194 Sayılı İmar Kanunu",
    ozet: "İmar planı, yapı ruhsatı ve müteahhitlik faaliyetlerinin yasal çerçevesi.",
    tarih: "09.05.1985",
    resmiGazete: "18749",
  },
  {
    baslik: "İş Deneyim Belgesi Güncelleme Katsayıları (ÜFE/TÜFE)",
    ozet: "İş deneyim belgesi tutarlarının güncel katsayılarla güncellenmesine ilişkin esaslar.",
    tarih: "Yıllık Güncelleme",
    resmiGazete: "—",
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth() as any;
  const [showAllRefs, setShowAllRefs] = useState(false);
  const [expandedMevzuat, setExpandedMevzuat] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!authEmail || !authPassword) {
      setAuthError("E-posta ve şifre zorunludur");
      return;
    }
    setAuthError("");
    setAuthSubmitting(true);
    try {
      const res = await signIn(authEmail, authPassword);
      if (res.error) { setAuthError(res.error); setAuthSubmitting(false); return; }
      setShowAuth(false);
      setAuthEmail(""); setAuthPassword(""); setAuthError("");
      navigate("/dashboard");
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const visibleRefs = showAllRefs ? referanslar : referanslar.slice(0, 12);

  return (
    <div className="min-h-screen bg-[#F8F7F4] font-[Inter]">
      {/* Navbar */}
      <nav className="bg-[#0B1D3A] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Award className="w-7 h-7 text-[#C9952B]" />
            <span className="text-lg tracking-tight">muteahhitlikbelgesi<span className="text-[#C9952B]">.com</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#nasil" className="hover:text-[#C9952B] transition-colors">Nasıl Çalışır?</a>
            <a href="#fiyat" className="hover:text-[#C9952B] transition-colors">Fiyatlandırma</a>
            <a href="#referanslar" className="hover:text-[#C9952B] transition-colors">Referanslar</a>
            <a href="#mevzuat" className="hover:text-[#C9952B] transition-colors">Mevzuat</a>
            <button onClick={() => navigate("/blog")} className="hover:text-[#C9952B] transition-colors">Blog</button>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="border border-white/20 hover:border-[#C9952B] text-white hover:text-[#C9952B] px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" /> Panelim
                </button>
                <button
                  onClick={() => { signOut(); navigate("/"); }}
                  className="border border-white/20 hover:border-red-400 text-white/60 hover:text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAuth(true)}
                  className="border border-white/20 hover:border-[#C9952B] text-white hover:text-[#C9952B] px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" /> Giriş Yap
                </button>
                <button
                  onClick={() => navigate("/wizard")}
                  className="bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  Hemen Başla
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1D3A] via-[#122A54] to-[#0B1D3A]" />
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback src={heroImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#C9952B]/15 border border-[#C9952B]/30 text-[#C9952B] px-4 py-1.5 rounded-full text-sm mb-6">
              <Shield className="w-4 h-4" />
              2026 Güncel Mevzuat Uyumluluğu
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">Müteahhitlik Belgesi Başvurunuzu<br /><span className="text-[#C9952B]">Profesyonel Ekiple</span> Tamamlayın</h1>
            <p className="text-white/70 text-lg mb-10 max-w-lg"><span className="font-bold">Bakanlık süreçleri ve evrak trafiğiyle boğuşmayın.</span> Uzman analizimle hatalı harç ödemelerini engelleyelim, başvurunuzu yasal mevzuata tam uyumlu şekilde sonuçlandıralım.</p>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/wizard")}
              className="bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-10 py-4 rounded-xl text-base flex items-center justify-center gap-2 transition-colors"
            >
              {user ? "Panelime Git" : "Analize Başla"} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges / Stats */}
      <section className="py-6 bg-white border-y border-[#0B1D3A]/8">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16">
          {trustItems.map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-[#0B1D3A]/70 text-sm">
              <b.icon className="w-5 h-5 text-[#C9952B]" />
              {b.text}
            </div>
          ))}
        </div>
      </section>

      {/* Value Props — Hız, Güvenlik, Güncellik */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl text-[#0B1D3A] mb-3">Neden Biz?</h2>
          <p className="text-[#5A6478] max-w-xl mx-auto">Müteahhitlik belgesi sürecinizi riske atmayın; profesyonel analiz ve eksiksiz dosya yönetimiyle işinizi şansa bırakmayın.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border border-[#0B1D3A]/8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-[#C9952B]/10 flex items-center justify-center mx-auto mb-5">
              <Zap className="w-7 h-7 text-[#C9952B]" />
            </div>
            <h3 className="text-lg text-[#0B1D3A] mb-2">Hızlı Süreç</h3>
            <p className="text-[#5A6478] text-sm">Başvuru süreciniz hızla başlatılır, her dosya uzman ekibimiz tarafından titizlikle kontrol edilir.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-[#0B1D3A]/8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-[#C9952B]/10 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-[#C9952B]" />
            </div>
            <h3 className="text-lg text-[#0B1D3A] mb-2">Güvenli Veri Yönetimi</h3>
            <p className="text-[#5A6478] text-sm">Şirket ve kişisel bilgileriniz güvenli altyapımızda korunur, üçüncü taraflarla paylaşılmaz.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-[#0B1D3A]/8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-[#C9952B]/10 flex items-center justify-center mx-auto mb-5">
              <RefreshCw className="w-7 h-7 text-[#C9952B]" />
            </div>
            <h3 className="text-lg text-[#0B1D3A] mb-2">Güncel Mevzuat</h3>
            <p className="text-[#5A6478] text-sm">Yönetmelik ve harç tarifeleri sürekli takip edilir. Başvurunuz her zaman güncel kurallara uygun olur.</p>
          </div>
        </div>
      </section>

      {/* How It Works — Timeline */}
      <section className="bg-[#F0EDE8] py-20" id="nasil">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl text-[#0B1D3A] mb-3">Nasıl Çalışır?</h2>
            <p className="text-[#5A6478]">4 adımda yetki belgenize kavuşun.</p>
          </div>
          <div className="max-w-3xl mx-auto relative">
            {/* vertical line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-[#C9952B]/20 hidden sm:block" />
            <div className="space-y-8">
              {[
                { num: "1", title: "Bilgilerinizi Girin", desc: "Şirket türü, ortaklık bilgileri ve iş deneyim verilerinizi kısa formla paylaşın.", icon: FileText },
                { num: "2", title: "Sınıf Tayini & Analiz", desc: "Yetki belgesi grubunuz ve gerekli belgeler belirlenir.", icon: Calculator },
                { num: "3", title: "Hizmet Seçimi", desc: "Size uygun hizmet paketini seçin, net fiyat bilgisini görün.", icon: Award },
                { num: "4", title: "Profesyonel Destek", desc: "Danışman ekibimiz başvuru sürecinizin her aşamasında yanınızda.", icon: Users },
              ].map((s) => (
                <div key={s.num} className="flex items-start gap-5 sm:gap-7">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#0B1D3A] flex items-center justify-center shrink-0 relative z-10">
                    <s.icon className="w-5 h-5 md:w-6 md:h-6 text-[#C9952B]" />
                  </div>
                  <div className="bg-white rounded-xl p-5 flex-1 border border-[#0B1D3A]/5">
                    <div className="text-xs text-[#C9952B] mb-1">Adım {s.num}</div>
                    <h4 className="text-[#0B1D3A] mb-1">{s.title}</h4>
                    <p className="text-[#5A6478] text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="fiyat">
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl text-[#0B1D3A] mb-3">Fiyatlandırma</h2>
          <p className="text-[#5A6478] max-w-xl mx-auto">Şahıs şirketleri, limited şirketler ve kooperatifler için tek seferlik hizmet bedeli.</p>
        </div>
        <p className="text-center text-xs text-[#5A6478] mb-12">Harçlar dahil değildir. Harç tutarları bakanlık tarifesine göre ayrıca tahsil edilir.</p>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border-2 border-[#C9952B]/30 p-8 text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9952B] text-[#0B1D3A] text-xs px-4 py-1 rounded-full">Tek Seferlik Ödeme</div>
            <div className="mt-2 mb-1">
              <span className="text-4xl text-[#0B1D3A]">7.000 ₺</span>
              <span className="text-[#5A6478] text-base">'den başlayan fiyatlarla</span>
            </div>
            <p className="text-[#5A6478] text-sm mb-8">Tüm fiyatlara KDV dahildir</p>
            <ul className="text-left text-sm space-y-3 mb-8">
              {[
                "Sınıf tayini",
                "Mali yeterlilik analizi",
                "Profesyonel danışmanlık",
                "İstanbul içi bakanlığa başvuru",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[#0B1D3A]">
                  <CheckCircle className="w-4 h-4 text-[#C9952B] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate("/wizard")} className="w-full bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] py-3 rounded-xl transition-colors">
              Analize Başla
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#5A6478] mt-6">Hizmet bedeli karşılığında fatura düzenlenecektir.</p>
      </section>

      {/* Referanslar */}
      <section className="bg-white py-20 border-t border-[#0B1D3A]/8" id="referanslar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl text-[#0B1D3A] mb-3">Referanslarımız</h2>
            <p className="text-[#5A6478] max-w-xl mx-auto">
              <span className="text-[#0B1D3A]">300'den fazla</span> müteahhit firmaya hizmet verdik, <span className="text-[#0B1D3A]">400'den fazla</span> başarılı başvuru tamamladık.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {visibleRefs.map((r, i) => {
              const colors = [
                "bg-[#0B1D3A]", "bg-[#1e3a8a]", "bg-[#7c3aed]", "bg-[#0891b2]",
                "bg-[#059669]", "bg-[#d97706]", "bg-[#dc2626]", "bg-[#6366f1]",
                "bg-[#0d9488]", "bg-[#9333ea]", "bg-[#2563eb]", "bg-[#c026d3]",
              ];
              const initials = r.firma
                .split(" ")
                .filter((w: string) => w.length > 2 && !["ltd.", "şti.", "a.ş.", "tic.", "ve", "san."].includes(w.toLowerCase()))
                .slice(0, 2)
                .map((w: string) => w[0].toUpperCase())
                .join("");
              const colorClass = colors[i % colors.length];
              return (
                <div
                  key={i}
                  className="bg-[#F8F7F4] rounded-xl px-4 py-3.5 border border-[#0B1D3A]/5 hover:border-[#C9952B]/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                      <span className="text-white text-xs">{initials || "M"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#0B1D3A] text-sm truncate">{r.firma}</p>
                      <p className="text-[#5A6478] text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" /> {r.ilce}/{r.il}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {referanslar.length > 12 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllRefs(!showAllRefs)}
                className="inline-flex items-center gap-2 text-[#C9952B] hover:text-[#B8862A] text-sm transition-colors"
              >
                {showAllRefs ? (
                  <>Daha Az Göster <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Tüm Referansları Göster ({referanslar.length}+) <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mevzuat */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="mevzuat">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl text-[#0B1D3A] mb-3">Mevzuat & Yasal Dayanak</h2>
          <p className="text-[#5A6478] max-w-xl mx-auto">Yetki belgesi başvuru sürecinde dayanak oluşturan güncel mevzuat bilgileri.</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {mevzuatItems.map((m, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#0B1D3A]/8 overflow-hidden transition-all hover:border-[#C9952B]/30"
            >
              <button
                onClick={() => setExpandedMevzuat(expandedMevzuat === i ? null : i)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0B1D3A]/5 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-[#C9952B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0B1D3A] text-sm">{m.baslik}</p>
                  <p className="text-[#5A6478] text-xs mt-0.5">Tarih: {m.tarih} {m.resmiGazete !== "—" && `| Resmi Gazete: ${m.resmiGazete}`}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#5A6478] shrink-0 transition-transform ${expandedMevzuat === i ? "rotate-180" : ""}`} />
              </button>
              {expandedMevzuat === i && (
                <div className="px-6 pb-4 pt-0">
                  <div className="border-t border-[#0B1D3A]/5 pt-3">
                    <p className="text-[#5A6478] text-sm">{m.ozet}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0B1D3A] via-[#122A54] to-[#0B1D3A] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl text-white mb-4">Yetki Belgenizi Almaya Hazır mısınız?</h2>
          <p className="text-white/60 mb-8">Sınıf tayini analizinizi başlatın, profesyonel ekibimizle başvurunuzu tamamlayın.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/wizard")}
              className="bg-[#C9952B] hover:bg-[#B8862A] text-[#0B1D3A] px-10 py-4 rounded-xl text-base inline-flex items-center gap-2 transition-colors"
            >
              Analize Başla <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/analiz-talebi")}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-4 rounded-xl text-base inline-flex items-center gap-2 transition-colors"
            >
              Ücretsiz Analiz Talebi
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1D3A] text-white/50 py-10 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C9952B]" />
            <span className="text-white/80">muteahhitlikbelgesi.com</span>
            <span className="text-white/30 ml-2">belgeiste.com iştirakidir</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#referanslar" className="hover:text-[#C9952B] transition-colors">Referanslar</a>
            <a href="#mevzuat" className="hover:text-[#C9952B] transition-colors">Mevzuat</a>
            <a href="#fiyat" className="hover:text-[#C9952B] transition-colors">Fiyatlandırma</a>
            <button onClick={() => navigate("/admin")} className="hover:text-[#C9952B] transition-colors text-white/20 hover:text-white/60">Admin</button>
          </div>
        </div>
      </footer>

      {/* Auth Modal — Sadece Giriş (Kayıt wizard üzerinden yapılır) */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setShowAuth(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#0B1D3A] to-[#122A54] p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-[#C9952B]" />
                  <h3 className="text-white text-lg">Giriş Yap</h3>
                </div>
                <button onClick={() => setShowAuth(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-white/60 text-sm">Mevcut hesabınızla giriş yapın ve panelinize erişin.</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Info box */}
              <div className="bg-[#F0EDE8] rounded-xl p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#C9952B] shrink-0 mt-0.5" />
                <p className="text-xs text-[#5A6478]">
                  Henüz hesabınız yok mu?{" "}
                  <button
                    onClick={() => { setShowAuth(false); navigate("/wizard"); }}
                    className="text-[#C9952B] hover:underline"
                  >
                    Önce analiz başlatın
                  </button>
                  , kayıt süreç sonunda otomatik oluşturulur.
                </p>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
                  <input
                    type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F7F4] border border-[#0B1D3A]/8 rounded-lg text-sm focus:border-[#C9952B] outline-none"
                    onKeyDown={e => e.key === "Enter" && handleAuth()}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#5A6478] mb-1">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
                  <input
                    type={showPassword ? "text" : "password"} value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8F7F4] border border-[#0B1D3A]/8 rounded-lg text-sm focus:border-[#C9952B] outline-none"
                    onKeyDown={e => e.key === "Enter" && handleAuth()}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6478]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{authError}</div>
              )}
              <button
                onClick={handleAuth}
                disabled={authSubmitting || !authEmail || !authPassword}
                className="w-full bg-[#C9952B] hover:bg-[#B8862A] disabled:bg-gray-300 text-[#0B1D3A] py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {authSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}