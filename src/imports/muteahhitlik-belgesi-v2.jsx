import { useState, useEffect, useMemo, useCallback, createContext, useContext, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// MÜTEAHHİTLİK BELGESİ - TAM ÇALIŞAN UYGULAMA v2
// ═══════════════════════════════════════════════════════════════

// ─── STORAGE ─────────────────────────────────────────────────
const DB = {
  get(key, fb) { try { const r = localStorage.getItem("mb_" + key); return r ? JSON.parse(r) : fb; } catch { return fb; } },
  set(key, val) { try { localStorage.setItem("mb_" + key, JSON.stringify(val)); } catch {} },
  del(key) { try { localStorage.removeItem("mb_" + key); } catch {} },
};

// ─── AUTH CONTEXT ────────────────────────────────────────────
const AuthCtx = createContext(null);
function useAuth() { return useContext(AuthCtx); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => DB.get("current_user", null));
  const userRef = useRef(user);
  userRef.current = user;

  const getUsers = () => DB.get("users", []);
  const setUsers = (arr) => DB.set("users", arr);

  // Seed admin
  useEffect(() => {
    const users = getUsers();
    if (!users.find(u => u.role === "admin")) {
      setUsers([...users, {
        id: "admin-001", email: "admin@muteahhitlik.com",
        password: "Admin123!", fullName: "Admin",
        role: "admin", createdAt: new Date().toISOString()
      }]);
    }
  }, []);

  const signUp = (email, password, fullName) => {
    const users = getUsers();
    if (users.find(u => u.email === email.toLowerCase())) return { error: "Bu e-posta zaten kayıtlı." };
    const newUser = { id: crypto.randomUUID(), email: email.toLowerCase(), password, fullName: fullName || email.split("@")[0], role: "customer", createdAt: new Date().toISOString() };
    setUsers([...users, newUser]);
    const session = { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role };
    setUser(session); userRef.current = session; DB.set("current_user", session);
    return { user: session };
  };

  const signIn = (email, password) => {
    const users = getUsers();
    const found = users.find(u => u.email === email.toLowerCase() && u.password === password);
    if (!found) return { error: "E-posta veya şifre hatalı." };
    const session = { id: found.id, email: found.email, fullName: found.fullName, role: found.role };
    setUser(session); userRef.current = session; DB.set("current_user", session);
    return { user: session };
  };

  const signOut = () => { setUser(null); userRef.current = null; DB.del("current_user"); };

  const getCurrentUser = () => userRef.current;
  const getAllUsers = () => getUsers().map(u => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role, createdAt: u.createdAt }));

  return <AuthCtx.Provider value={{ user, signUp, signIn, signOut, getCurrentUser, getAllUsers }}>{children}</AuthCtx.Provider>;
}

// ─── HESAPLAMA MOTORU ────────────────────────────────────────
const UFE = {"2026":[4910.53,5029.76],"2025":[3861.33,3943.01,4017.30,4128.19,4230.69,4334.94,4409.73,4518.89,4632.89,4708.20,4747.63,4783.04],"2024":[3035.59,3149.03,3252.79,3369.98,3435.96,3483.25,3550.88,3610.51,3659.84,3707.10,3731.43,3746.52],"2023":[2105.17,2138.04,2147.44,2164.94,2179.02,2320.72,2511.75,2659.60,2749.98,2803.29,2882.04,2915.02],"2022":[1129.03,1210.60,1321.90,1423.27,1548.01,1652.75,1738.21,1780.05,1865.09,2011.13,2026.08,2021.19],"2021":[583.38,590.52,614.93,641.63,666.79,693.54,710.61,730.28,741.58,780.45,858.43,1022.25],"2020":[462.42,464.64,468.69,474.69,482.02,485.37,490.33,501.85,515.13,533.44,555.18,568.27],"2019":[424.86,425.26,431.98,444.85,456.74,457.16,452.63,449.96,450.55,451.31,450.97,454.08],"2018":[319.60,328.17,333.21,341.88,354.85,365.60,372.06,396.62,439.78,443.78,432.55,422.94],"2017":[284.99,288.59,291.58,293.79,295.31,295.52,297.65,300.18,300.90,306.04,312.21,316.48],"2016":[250.67,250.16,251.17,252.47,256.21,257.27,257.81,258.01,258.77,260.94,266.16,274.09],"2015":[236.61,239.46,241.97,245.42,248.15,248.78,247.99,250.43,254.25,253.74,250.13,249.31]};
const BM_2026 = {"III.B":21050,"III.C":23400,"IV.A":26450,"IV.B":33900,"IV.C":40500,"V.A":42350};
const BM_GECMIS = {"2025":{"III.B":18200,"III.C":19150,"IV.A":21500,"IV.B":27500},"2024":{"III.B":14400,"III.C":15100,"IV.A":15600,"IV.B":18200},"2023":{"III.B":7975,"III.C":7975,"IV.A":8475,"IV.B":9850},"2022":{"III.B":3967,"III.C":3967,"IV.A":4200,"IV.B":4800},"2021":{"III.B":1450,"IV.A":1550,"IV.B":1800},"2020":{"III.B":1130,"IV.A":1210,"IV.B":1400},"2019":{"III.B":980,"IV.A":1070,"IV.B":1230},"2018":{"III.B":800,"IV.A":860,"IV.B":980},"2017":{"III.B":838,"IV.A":880,"IV.B":1005},"2016":{"III.B":630,"IV.A":680,"IV.B":775},"2015":{"III.B":565,"IV.A":610,"IV.B":695}};
const GRUP_ESIKLER = [{grup:"A",min:2476500000},{grup:"B",min:1733550000},{grup:"B1",min:1485900000},{grup:"C",min:1238250000},{grup:"C1",min:990600000},{grup:"D",min:743325000},{grup:"D1",min:618750000},{grup:"E",min:495000000},{grup:"E1",min:371475000},{grup:"F",min:247650000},{grup:"F1",min:185737500},{grup:"G",min:123825000},{grup:"G1",min:61912500},{grup:"H",min:0}];

function grupBul(tl) { for (const g of GRUP_ESIKLER) { if (tl >= g.min) return g.grup; } return "H"; }
function birUstGrup(grup) { const idx = GRUP_ESIKLER.findIndex(g => g.grup === grup); return idx <= 0 ? null : GRUP_ESIKLER[idx - 1]; }
function ufeEndeksi(tarih) { const d = new Date(tarih), y = d.getFullYear(), m = d.getMonth(); const arr = UFE[String(y)]; if (arr?.[m] !== undefined) return arr[m]; if (arr) return arr[arr.length - 1]; return y > 2026 ? 5029.76 : 236.61; }
function donemBul(tarih) { const y = new Date(tarih).getFullYear(); if (y >= 2026) return "2026"; if (y >= 2015) return String(y); return "2015"; }
function birimFiyat(sinif, donem) { if (donem === "2026") return BM_2026[sinif] || 0; return BM_GECMIS[donem]?.[sinif] || BM_GECMIS[donem]?.["III.B"] || 0; }

function isHesapla(g) {
  const sozDon = donemBul(g.sozlesmeTarihi), bfSoz = birimFiyat(g.ruhsatSinifi, sozDon), bfBas = BM_2026[g.ruhsatSinifi] || 0;
  const ufeSoz = ufeEndeksi(g.sozlesmeTarihi), ufeBas = 5029.76;
  if (g.tip === "taahhut") { const bedel = g.taahhutBedeli || 0, ufeK = ufeBas / ufeSoz; return { belgeTutari: bedel, guncelTutar: Math.round(bedel * ufeK), ufeKatsayi: ufeK, kullanilanKatsayi: ufeK, bantDurumu: "ufe", bantAciklama: `Taahhüt ÜFE: ${ufeK.toFixed(4)}` }; }
  const belgeTutari = Math.round(g.alanM2 * bfSoz * 0.85), ufeK = ufeBas / ufeSoz, ymo = bfSoz > 0 ? bfBas / bfSoz : 1;
  const alt = ymo * 0.90, ust = ymo * 1.30;
  let kullanilanK = ufeK, bantDurumu = "ufe", bantAciklama = `ÜFE(${ufeK.toFixed(4)}) bant içinde`;
  if (ufeK < alt) { kullanilanK = alt; bantDurumu = "alt_sinir"; bantAciklama = `ÜFE < alt sınır → ${alt.toFixed(4)}`; }
  else if (ufeK > ust) { kullanilanK = ust; bantDurumu = "ust_sinir"; bantAciklama = `ÜFE > üst sınır → ${ust.toFixed(4)}`; }
  return { belgeTutari, guncelTutar: Math.round(belgeTutari * kullanilanK), ufeKatsayi: ufeK, kullanilanKatsayi: kullanilanK, bantDurumu, bantAciklama };
}

function tamHesapla(isGirisleri, diploma) {
  const bugun = new Date(), be5 = new Date(bugun), be15 = new Date(bugun);
  be5.setFullYear(be5.getFullYear() - 5); be15.setFullYear(be15.getFullYear() - 15);
  const isler = isGirisleri.map(g => ({ ...g, sonuc: isHesapla(g), iskanDate: g.iskanTarihi ? new Date(g.iskanTarihi) : null }));
  const son5 = isler.filter(x => x.iskanDate && x.iskanDate >= be5);
  const eski = isler.filter(x => x.iskanDate && x.iskanDate < be5 && x.iskanDate >= be15);
  const toplamBrut = son5.reduce((s, x) => s + x.sonuc.guncelTutar, 0);
  const enBuyuk5 = son5.length > 0 ? Math.max(...son5.map(x => x.sonuc.guncelTutar)) : 0;
  const ucKat = enBuyuk5 * 3, kilidiAcildi = eski.length > 0;
  const toplamNet = kilidiAcildi ? toplamBrut : Math.min(toplamBrut, ucKat || toplamBrut);
  const son15 = isler.filter(x => x.iskanDate && x.iskanDate >= be15);
  const enBuyuk15 = son15.length > 0 ? son15.reduce((m, x) => x.sonuc.guncelTutar > m.sonuc.guncelTutar ? x : m, son15[0]) : null;
  const y2Toplam = enBuyuk15 ? enBuyuk15.sonuc.guncelTutar * 2 : 0;
  let dipSonuc = null;
  if (diploma?.mezuniyetTarihi) {
    const yil = Math.floor((Date.now() - new Date(diploma.mezuniyetTarihi).getTime()) / (365.25 * 24 * 3600 * 1000));
    const esikler = [{maxYil:4,grup:"H"},{maxYil:7,grup:"G1"},{maxYil:10,grup:"G"},{maxYil:14,grup:"F1"},{maxYil:999,grup:"F"}];
    const e = esikler.find(d => yil <= d.maxYil) || esikler[4];
    dipSonuc = { grup: e.grup, yil, aciklama: `${yil} yıl ${diploma.bolum === "insaat_muhendisligi" ? "İnş.Müh." : "Mimarlık"} → ${e.grup}` };
  }
  const tercih = y2Toplam > toplamNet ? "son15" : "son5";
  const tercihToplam = tercih === "son5" ? toplamNet : y2Toplam;
  const tercihGrup = grupBul(tercihToplam);
  const ust = birUstGrup(tercihGrup);
  return { isler, y1: { toplamBrut, enBuyukIs: enBuyuk5, ucKatSiniri: ucKat, kilidiAcildi, toplamNet, grup: grupBul(toplamNet) }, y2: { enBuyukTutar: enBuyuk15?.sonuc.guncelTutar || 0, toplam: y2Toplam, grup: grupBul(y2Toplam) }, diploma: dipSonuc, tercihEdilenYontem: tercih, tercihEdilenToplam: tercihToplam, tercihEdilenGrup: tercihGrup, birUstGrup: ust, eksikTutar: ust ? Math.max(0, ust.min - tercihToplam) : 0 };
}

// ─── UTILS ───────────────────────────────────────────────────
const tlFormat = (n) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(n || 0)) + " ₺";
const fmtNum = (v) => { const r = String(v).replace(/\D/g, ""); return r ? new Intl.NumberFormat("tr-TR").format(Number(r)) : ""; };
const parseNum = (v) => Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;
const fmtPhone = (v) => { const d = v.replace(/\D/g, "").slice(0, 11); if (!d) return ""; if (d.length <= 4) return `0(${d.slice(1)}`; if (d.length <= 7) return `0(${d.slice(1, 4)}) ${d.slice(4)}`; return `0(${d.slice(1, 4)}) ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`; };
const phoneOk = (v) => v.replace(/\D/g, "").length >= 10;
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const SINIFLAR = ["III.B", "III.C", "IV.A", "IV.B", "IV.C", "V.A"];
const PAKETLER = { bilgi_alma: { label: "Bilgi Alma Danışmanlığı", fiyat: 7000, aciklama: "Telefon/e-posta danışmanlığı" }, sadece_hesaplama: { label: "İş Deneyim Hesaplama", fiyat: 11000, aciklama: "Hesaplama + mali yeterlilik analizi" }, hesaplama_basvuru: { label: "Hesaplama + Başvuru", fiyat: 20000, aciklama: "Hesaplama + başvuru (biz yaparız)" } };
const STATUS_MAP = { pending_payment: "Ödeme Bekleniyor", payment_received: "Ödeme Alındı", report_published: "Rapor Yayınlandı", docs_in_progress: "Evrak Toplanıyor", certificate_received: "Belge Alındı" };

// ═══════════════════════════════════════════════════════════════
// ANA UYGULAMA
// ═══════════════════════════════════════════════════════════════
export default function App() {
  return <AuthProvider><Router /></AuthProvider>;
}

function Router() {
  const [page, setPage] = useState("landing");
  const [pageState, setPageState] = useState(null);
  const nav = useCallback((p, state) => { setPage(p); setPageState(state || null); window.scrollTo(0, 0); }, []);
  return (
    <div style={{ fontFamily: "'Segoe UI',-apple-system,sans-serif", minHeight: "100vh", background: "#F8F7F4" }}>
      {page === "landing" && <LandingPage nav={nav} />}
      {page === "wizard" && <WizardPage nav={nav} pageState={pageState} />}
      {page === "dashboard" && <DashboardPage nav={nav} pageState={pageState} />}
      {page === "admin" && <AdminPage nav={nav} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════
function LandingPage({ nav }) {
  const { user, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  return (
    <div>
      <div style={{ background: "#0B1D3A", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#C9952B" }}>⬡</span>
          <span style={{ color: "white", fontWeight: 600, fontSize: 15 }}>muteahhitlikbelgesi<span style={{ color: "#C9952B" }}>.com</span></span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user ? (
            <>
              <button onClick={() => nav(user.role === "admin" ? "admin" : "dashboard")} style={{ ...btn, background: "#C9952B", color: "white" }}>{user.role === "admin" ? "Admin Panel" : "Panelim"}</button>
              <button onClick={() => { signOut(); }} style={{ ...btn, background: "transparent", color: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.2)" }}>Çıkış</button>
            </>
          ) : (
            <>
              <button onClick={() => setShowLogin(true)} style={{ ...btn, background: "transparent", color: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.2)" }}>Giriş Yap</button>
              <button onClick={() => nav("wizard")} style={{ ...btn, background: "#C9952B", color: "white" }}>Başvuru Yap</button>
            </>
          )}
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,#0B1D3A,#1a3a5c)", padding: "80px 32px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 36, fontWeight: 700, margin: 0 }}>Yapı Müteahhitliği Yetki Belgesi</h1>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: 18, marginTop: 16 }}>İş deneyim hesaplama, belge başvurusu ve grup tayini işlemlerinizi hızlıca tamamlayın.</p>
        <button onClick={() => nav("wizard")} style={{ ...btn, background: "#C9952B", color: "white", fontSize: 16, padding: "14px 32px", marginTop: 32 }}>Ücretsiz Analiz Başlat →</button>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24 }}>
        {[{ t: "İş Deneyim Hesaplama", d: "ÜFE endeksli güncel hesaplama. 2026 birim maliyetleri.", i: "📊" }, { t: "Grup Tayini", d: "H'den A'ya 14 grup. Otomatik en avantajlı yöntem.", i: "🏗️" }, { t: "Belge Başvurusu", d: "Evrak listesi, ödeme takibi ve süreç yönetimi.", i: "📋" }].map((f, i) => (
          <div key={i} style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.i}</div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0B1D3A" }}>{f.t}</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#5A6478", lineHeight: 1.5 }}>{f.d}</p>
          </div>
        ))}
      </div>
      {showLogin && <AuthModal onClose={() => setShowLogin(false)} onSuccess={(role) => { setShowLogin(false); nav(role === "admin" ? "admin" : "dashboard"); }} />}
    </div>
  );
}

// ─── AUTH MODAL ──────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [pass2, setPass2] = useState(""); const [name, setName] = useState("");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  const submit = () => {
    setErr(""); setLoading(true);
    setTimeout(() => {
      if (mode === "login") {
        const r = signIn(email, pass);
        if (r.error) { setErr(r.error); setLoading(false); return; }
        setLoading(false); onSuccess(r.user.role);
      } else {
        if (pass.length < 6) { setErr("Şifre en az 6 karakter"); setLoading(false); return; }
        if (pass !== pass2) { setErr("Şifreler eşleşmiyor"); setLoading(false); return; }
        const r = signUp(email, pass, name);
        if (r.error) { setErr(r.error); setLoading(false); return; }
        setLoading(false); onSuccess(r.user.role);
      }
    }, 300);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: 400, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#0B1D3A" }}>{mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>✕</button>
        </div>
        {err && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{err}</div>}
        {mode === "register" && <input value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad" style={inp} />}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" type="email" style={inp} />
        <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Şifre" type="password" style={inp} onKeyDown={e => e.key === "Enter" && submit()} />
        {mode === "register" && <input value={pass2} onChange={e => setPass2(e.target.value)} placeholder="Şifre Tekrar" type="password" style={inp} />}
        <button onClick={submit} disabled={loading} style={{ ...btn, width: "100%", background: "#C9952B", color: "white", padding: 12, marginTop: 8 }}>{loading ? "..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</button>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#5A6478" }}>
          {mode === "login" ? <>Hesabınız yok mu? <button onClick={() => { setMode("register"); setErr(""); }} style={{ background: "none", border: "none", color: "#C9952B", cursor: "pointer", fontWeight: 600 }}>Kayıt Ol</button></> : <>Hesabınız var mı? <button onClick={() => { setMode("login"); setErr(""); }} style={{ background: "none", border: "none", color: "#C9952B", cursor: "pointer", fontWeight: 600 }}>Giriş Yap</button></>}
        </div>
        <div style={{ marginTop: 14, padding: 10, background: "#F0F9FF", borderRadius: 8, fontSize: 11, color: "#0369A1", textAlign: "center" }}>Admin: admin@muteahhitlik.com / Admin123!</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WIZARD
// ═══════════════════════════════════════════════════════════════
function WizardPage({ nav, pageState }) {
  const { user, signUp, signIn, getCurrentUser } = useAuth();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [authEmail, setAuthEmail] = useState(""); const [authPass, setAuthPass] = useState(""); const [authPass2, setAuthPass2] = useState(""); const [authName, setAuthName] = useState(""); const [authErr, setAuthErr] = useState("");

  const [companyName, setCN] = useState(""); const [taxId, setTI] = useState(""); const [phone, setPh] = useState(""); const [email, setEm] = useState("");
  const [companyType, setCT] = useState(""); const [hasKep, setHK] = useState(""); const [kepAddr, setKA] = useState(""); const [isFirst, setIF] = useState("");
  const [partners, setPT] = useState([{ id: "1", name: "", hisse: "", tc: "" }]);
  const [hasYapi, setHY] = useState(false); const [hasDiploma, setHD] = useState(false); const [hasNone, setHN] = useState(false);
  const [exps, setExps] = useState([{ id: "1", tip: "kat_karsiligi", sozTarih: "", iskanTarih: "", alan: "", yukseklik: "", sinif: "III.B", bedel: "" }]);
  const [dipName, setDN] = useState(""); const [dipBolum, setDB2] = useState(""); const [dipTarih, setDT] = useState("");
  const [location, setLoc] = useState(""); const [city, setCity] = useState(""); const [paket, setPK] = useState("");

  const validate = () => {
    const e = [];
    if (step === 0) { if (!companyName.trim()) e.push("Şirket adı"); if (taxId.length < 10) e.push("Vergi no"); if (!phoneOk(phone)) e.push("Telefon"); if (!emailOk(email)) e.push("E-posta"); if (!companyType) e.push("Şirket türü"); if (!hasKep) e.push("KEP"); if (!isFirst) e.push("İlk/Yenileme"); }
    if (step === 1) { if (!hasYapi && !hasDiploma && !hasNone) e.push("Yeterlilik seçin"); if (hasYapi) exps.forEach((x, i) => { if (!x.sozTarih) e.push(`İş ${i + 1}: Sözleşme tarihi`); if (x.tip === "kat_karsiligi" && !x.alan) e.push(`İş ${i + 1}: Alan`); if (x.tip === "taahhut" && !x.bedel) e.push(`İş ${i + 1}: Bedel`); }); if (hasDiploma && (!dipName || !dipBolum || !dipTarih)) e.push("Diploma bilgileri"); }
    if (step === 2) { if (!location) e.push("Konum"); if (!paket) e.push("Paket"); }
    return e;
  };

  const handleNext = () => { const e = validate(); if (e.length) { setErrors(e); return; } setErrors([]); if (step < 3) setStep(step + 1); else handleFinish(); };

  // ── BU FONKSİYON userId'yi parametre olarak alır — race condition yok ──
  const saveAndGo = (userId) => {
    const companies = DB.get("companies", []);
    const id = crypto.randomUUID();
    const secilenPaket = PAKETLER[paket];

    let hesaplama = null, grup = "H";
    if (hasYapi || hasDiploma) {
      try {
        const isG = hasYapi ? exps.filter(x => x.sozTarih).map(x => ({ id: x.id, sozlesmeTarihi: x.sozTarih, iskanTarihi: x.iskanTarih || x.sozTarih, ruhsatSinifi: x.sinif, alanM2: parseNum(x.alan), tip: x.tip, taahhutBedeli: x.tip === "taahhut" ? parseNum(x.bedel) : undefined })) : [];
        const dip = hasDiploma && dipTarih ? { mezuniyetTarihi: dipTarih, bolum: dipBolum } : null;
        if (isG.length > 0 || dip) { hesaplama = tamHesapla(isG, dip); grup = hesaplama.tercihEdilenGrup; }
      } catch (err) { console.error("Hesaplama hatası:", err); }
    }

    const data = {
      id, userId, companyName, taxId, phone, email, companyType, location, city,
      partners: companyType === "limited_as" ? partners : [],
      kepAddress: hasKep === "yes" ? kepAddr : "", isFirstTime: isFirst,
      selectedService: paket, serviceLabel: secilenPaket?.label,
      hizmetModeli: paket === "hesaplama_basvuru" ? "biz_yapiyoruz" : "musteri_yapiyor",
      appStatus: "pending_payment", grup, hesaplama,
      qualifications: { hasYapiIsi: hasYapi, hasDiploma, hasNone, experiences: exps, diploma: hasDiploma ? { partnerName: dipName, bolum: dipBolum, mezuniyetTarihi: dipTarih } : null },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    companies.push(data); DB.set("companies", companies);

    const invoices = DB.get("invoices", []);
    invoices.push({ id: crypto.randomUUID(), companyId: id, userId, description: secilenPaket?.label, amount: secilenPaket?.fiyat || 0, status: "unpaid", date: new Date().toISOString(), dueDate: new Date(Date.now() + 14 * 86400000).toISOString() });
    DB.set("invoices", invoices);

    nav("dashboard", { defaultTab: "odeme" });
  };

  const handleFinish = () => {
    // Kullanıcı zaten giriş yaptıysa → direkt kaydet
    const cur = getCurrentUser();
    if (cur) { saveAndGo(cur.id); return; }
    // Yoksa auth modal aç
    setAuthEmail(email); setShowAuth(true);
  };

  const handleAuthSubmit = () => {
    setAuthErr("");
    let result;
    if (authMode === "register") {
      if (authPass.length < 6) { setAuthErr("Şifre min 6 karakter"); return; }
      if (authPass !== authPass2) { setAuthErr("Şifreler eşleşmiyor"); return; }
      result = signUp(authEmail, authPass, authName || authEmail.split("@")[0]);
    } else {
      result = signIn(authEmail, authPass);
    }
    if (result.error) { setAuthErr(result.error); return; }
    // Auth başarılı → artık getCurrentUser() doğru dönecek
    setShowAuth(false);
    saveAndGo(result.user.id);
  };

  const updExp = (id, f, v) => setExps(p => p.map(x => x.id === id ? { ...x, [f]: v } : x));

  const hesaplamaOnizleme = useMemo(() => {
    if (!hasYapi && !hasDiploma) return null;
    try {
      const isG = hasYapi ? exps.filter(x => x.sozTarih && (x.tip === "taahhut" ? x.bedel : x.alan)).map(x => ({ id: x.id, sozlesmeTarihi: x.sozTarih, iskanTarihi: x.iskanTarih || x.sozTarih, ruhsatSinifi: x.sinif, alanM2: parseNum(x.alan), tip: x.tip, taahhutBedeli: x.tip === "taahhut" ? parseNum(x.bedel) : undefined })) : [];
      const dip = hasDiploma && dipTarih ? { mezuniyetTarihi: dipTarih, bolum: dipBolum } : null;
      if (!isG.length && !dip) return null;
      return tamHesapla(isG, dip);
    } catch { return null; }
  }, [hasYapi, hasDiploma, exps, dipTarih, dipBolum]);

  const LABELS = ["Şirket Bilgileri", "İş Deneyimi", "Konum & Hizmet", "Özet & Onay"];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4" }}>
      <div style={{ background: "#0B1D3A", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <button onClick={() => nav("landing")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", fontSize: 13 }}>← Ana sayfa</button>
        <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>muteahhitlikbelgesi<span style={{ color: "#C9952B" }}>.com</span></span>
        <div style={{ width: 80 }} />
      </div>
      <div style={{ display: "flex", minHeight: "calc(100vh - 52px)" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "white", borderRight: "1px solid #eee", padding: "24px 12px", flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5A6478", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 16, padding: "0 8px" }}>Başvuru Adımları</div>
          {LABELS.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 8, background: i === step ? "rgba(201,149,43,.08)" : "transparent", marginBottom: 4, cursor: i < step ? "pointer" : "default" }} onClick={() => i < step && setStep(i)}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: i < step ? "#C9952B" : i === step ? "#0B1D3A" : "#E5E7EB", color: i <= step ? "white" : "#9CA3AF" }}>{i < step ? "✓" : i + 1}</div>
              <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 400, color: i <= step ? "#0B1D3A" : "#9CA3AF" }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "32px 40px", maxWidth: 700 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0B1D3A", margin: "0 0 6px" }}>{LABELS[step]}</h2>
          <p style={{ color: "#5A6478", fontSize: 14, margin: "0 0 20px" }}>{["Firma bilgilerinizi girin.", "Yapım işi veya diploma bilgileri.", "Konum ve hizmet paketi.", "Bilgileri kontrol edin."][step]}</p>

          {errors.length > 0 && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 14, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#DC2626", marginBottom: 4 }}>⚠ Eksik alanlar:</div>{errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: "#DC2626" }}>• {e}</div>)}</div>}

          {/* STEP 0 */}
          {step === 0 && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <F l="Şirket Adı"><input value={companyName} onChange={e => setCN(e.target.value)} style={inp} placeholder="ABC İnşaat Ltd." /></F>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F l="Vergi No"><input value={taxId} onChange={e => setTI(e.target.value.replace(/\D/g, "").slice(0, 11))} style={inp} placeholder="10-11 hane" /></F>
              <F l="Telefon"><input value={phone} onChange={e => setPh(fmtPhone(e.target.value))} style={inp} /></F>
            </div>
            <F l="E-posta"><input value={email} onChange={e => setEm(e.target.value)} style={inp} type="email" /></F>
            <F l="Şirket Türü"><div style={{ display: "flex", gap: 8 }}>{[["sahis", "Şahıs"], ["limited_as", "Ltd./A.Ş."], ["kooperatif", "Kooperatif"]].map(([v, l]) => <button key={v} onClick={() => setCT(v)} style={{ ...chip, background: companyType === v ? "#0B1D3A" : "#F3F0EB", color: companyType === v ? "white" : "#0B1D3A" }}>{l}</button>)}</div></F>
            {companyType === "limited_as" && <div style={{ background: "#FAFAF8", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ortaklar</div>
              {partners.map((p, i) => <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr auto", gap: 6, marginBottom: 6 }}>
                <input value={p.name} onChange={e => { const u = [...partners]; u[i] = { ...u[i], name: e.target.value }; setPT(u); }} style={inp} placeholder="Ad Soyad" />
                <input value={p.hisse} onChange={e => { const u = [...partners]; u[i] = { ...u[i], hisse: e.target.value }; setPT(u); }} style={inp} placeholder="%" />
                <input value={p.tc} onChange={e => { const u = [...partners]; u[i] = { ...u[i], tc: e.target.value.replace(/\D/g, "").slice(0, 11) }; setPT(u); }} style={inp} placeholder="TC" />
                {partners.length > 1 && <button onClick={() => setPT(p2 => p2.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer" }}>✕</button>}
              </div>)}
              <button onClick={() => setPT(p => [...p, { id: crypto.randomUUID(), name: "", hisse: "", tc: "" }])} style={{ ...btn, fontSize: 12, color: "#C9952B", background: "none", padding: "4px 0" }}>+ Ortak Ekle</button>
            </div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F l="KEP Adresi?"><div style={{ display: "flex", gap: 8 }}>{[["yes", "Evet"], ["no", "Hayır"]].map(([v, l]) => <button key={v} onClick={() => setHK(v)} style={{ ...chip, background: hasKep === v ? "#0B1D3A" : "#F3F0EB", color: hasKep === v ? "white" : "#0B1D3A" }}>{l}</button>)}</div></F>
              <F l="Belge Durumu"><div style={{ display: "flex", gap: 8 }}>{[["first", "İlk Başvuru"], ["renewal", "Yenileme"]].map(([v, l]) => <button key={v} onClick={() => setIF(v)} style={{ ...chip, background: isFirst === v ? "#0B1D3A" : "#F3F0EB", color: isFirst === v ? "white" : "#0B1D3A" }}>{l}</button>)}</div></F>
            </div>
            {hasKep === "yes" && <F l="KEP Adresi"><input value={kepAddr} onChange={e => setKA(e.target.value)} style={inp} /></F>}
          </div>}

          {/* STEP 1 */}
          {step === 1 && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[["yapi", hasYapi, v => { setHY(v); if (v) setHN(false); },"🏗️ Yapım İşi"],["diploma", hasDiploma, v => { setHD(v); if (v) setHN(false); },"🎓 Diploma"],["none", hasNone, v => { setHN(v); if (v) { setHY(false); setHD(false); } },"Yok (H)"]].map(([k, checked, fn, l]) =>
                <label key={k} style={{ ...chip, background: checked ? "#0B1D3A" : "#F3F0EB", color: checked ? "white" : "#0B1D3A", cursor: "pointer" }}><input type="checkbox" checked={checked} onChange={e => fn(e.target.checked)} style={{ display: "none" }} />{l}</label>
              )}
            </div>
            {hasYapi && exps.map((exp, i) => <div key={exp.id} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 14, fontWeight: 600 }}>İş #{i + 1}</span>{exps.length > 1 && <button onClick={() => setExps(p => p.filter(x => x.id !== exp.id))} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 12 }}>Sil</button>}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>{[["kat_karsiligi", "Kat Karşılığı"], ["taahhut", "Taahhüt"]].map(([v, l]) => <button key={v} onClick={() => updExp(exp.id, "tip", v)} style={{ ...chip, fontSize: 12, background: exp.tip === v ? "#C9952B" : "#F3F0EB", color: exp.tip === v ? "white" : "#0B1D3A" }}>{l}</button>)}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <F l="Sözleşme Tarihi"><input type="date" value={exp.sozTarih} onChange={e => updExp(exp.id, "sozTarih", e.target.value)} style={inp} /></F>
                <F l="İskan/Kabul Tarihi"><input type="date" value={exp.iskanTarih} onChange={e => updExp(exp.id, "iskanTarih", e.target.value)} style={inp} /></F>
              </div>
              {exp.tip === "kat_karsiligi" ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                <F l="Alan (m²)"><input value={exp.alan} onChange={e => updExp(exp.id, "alan", fmtNum(e.target.value))} style={inp} placeholder="5.000" /></F>
                <F l="Yükseklik (m)"><input value={exp.yukseklik} onChange={e => updExp(exp.id, "yukseklik", e.target.value)} style={inp} /></F>
                <F l="Yapı Sınıfı"><select value={exp.sinif} onChange={e => updExp(exp.id, "sinif", e.target.value)} style={inp}>{SINIFLAR.map(s => <option key={s}>{s}</option>)}</select></F>
              </div> : <div style={{ marginTop: 8 }}><F l="Sözleşme Bedeli (TL)"><input value={exp.bedel} onChange={e => updExp(exp.id, "bedel", fmtNum(e.target.value))} style={inp} placeholder="1.000.000" /></F></div>}
            </div>)}
            {hasYapi && <button onClick={() => setExps(p => [...p, { id: crypto.randomUUID(), tip: "kat_karsiligi", sozTarih: "", iskanTarih: "", alan: "", yukseklik: "", sinif: "III.B", bedel: "" }])} style={{ ...btn, background: "rgba(201,149,43,.1)", color: "#C9952B" }}>+ Yeni İş Ekle</button>}
            {hasDiploma && <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>🎓 Diploma</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <F l="Ad Soyad"><input value={dipName} onChange={e => setDN(e.target.value)} style={inp} /></F>
                <F l="Bölüm"><select value={dipBolum} onChange={e => setDB2(e.target.value)} style={inp}><option value="">Seçin</option><option value="insaat_muhendisligi">İnş. Müh.</option><option value="mimarlik">Mimarlık</option></select></F>
              </div>
              <div style={{ marginTop: 8 }}><F l="Mezuniyet Tarihi"><input type="date" value={dipTarih} onChange={e => setDT(e.target.value)} style={inp} /></F></div>
            </div>}
          </div>}

          {/* STEP 2 */}
          {step === 2 && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <F l="Faaliyet Adresi"><div style={{ display: "flex", gap: 10 }}>{[["istanbul", "İstanbul"], ["istanbul_disi", "İstanbul Dışı"]].map(([v, l]) => <button key={v} onClick={() => setLoc(v)} style={{ ...chip, flex: 1, background: location === v ? "#0B1D3A" : "#F3F0EB", color: location === v ? "white" : "#0B1D3A" }}>{l}</button>)}</div></F>
            {location === "istanbul_disi" && <F l="İl"><input value={city} onChange={e => setCity(e.target.value)} style={inp} /></F>}
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0B1D3A", marginTop: 4 }}>Hizmet Paketi</div>
            {Object.entries(PAKETLER).map(([k, p]) => <div key={k} onClick={() => setPK(k)} style={{ background: paket === k ? "rgba(201,149,43,.08)" : "white", border: paket === k ? "2px solid #C9952B" : "1px solid #E5E7EB", borderRadius: 12, padding: 14, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "#0B1D3A" }}>{p.label}</div><div style={{ fontSize: 12, color: "#5A6478", marginTop: 2 }}>{p.aciklama}</div></div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#C9952B" }}>{tlFormat(p.fiyat)}</div>
              </div>
            </div>)}
          </div>}

          {/* STEP 3 */}
          {step === 3 && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SC title="Firma" items={[["Şirket", companyName], ["Vergi No", taxId], ["Telefon", phone], ["Tür", companyType === "sahis" ? "Şahıs" : companyType === "limited_as" ? "Ltd/AŞ" : "Koop."]]} />
            {(hasYapi || hasDiploma) && <SC title="Yeterlilik" items={[hasYapi && ["Yapım İşi", `${exps.length} iş`], hasDiploma && ["Diploma", `${dipName} (${dipBolum === "insaat_muhendisligi" ? "İnş.Müh." : "Mimarlık"})`]].filter(Boolean)} />}
            {hesaplamaOnizleme && <div style={{ background: "rgba(201,149,43,.08)", border: "1px solid rgba(201,149,43,.3)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0B1D3A", marginBottom: 8 }}>📊 Hesaplama Sonucu</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#5A6478" }}>Toplam</span><span style={{ fontSize: 14, fontWeight: 700, textAlign: "right" }}>{tlFormat(hesaplamaOnizleme.tercihEdilenToplam)}</span>
                <span style={{ fontSize: 12, color: "#5A6478" }}>Grup</span><span style={{ fontSize: 24, fontWeight: 800, color: "#C9952B", textAlign: "right" }}>{hesaplamaOnizleme.tercihEdilenGrup}</span>
                <span style={{ fontSize: 12, color: "#5A6478" }}>Yöntem</span><span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{hesaplamaOnizleme.tercihEdilenYontem === "son5" ? "Son 5 Yıl" : "Son 15 Yıl (×2)"}</span>
                {hesaplamaOnizleme.birUstGrup && <><span style={{ fontSize: 12, color: "#5A6478" }}>Üst gruba ({hesaplamaOnizleme.birUstGrup.grup}) eksik</span><span style={{ fontSize: 13, fontWeight: 600, color: "#DC2626", textAlign: "right" }}>{tlFormat(hesaplamaOnizleme.eksikTutar)}</span></>}
              </div>
            </div>}
            <SC title="Hizmet" items={[["Konum", location === "istanbul" ? "İstanbul" : city || "İst. Dışı"], ["Paket", PAKETLER[paket]?.label], ["Tutar", tlFormat(PAKETLER[paket]?.fiyat || 0)]]} />
          </div>}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 16, borderTop: "1px solid #E5E7EB" }}>
            <button onClick={() => step > 0 ? setStep(step - 1) : nav("landing")} style={{ ...btn, background: "transparent", color: "#5A6478", border: "1px solid #E5E7EB" }}>{step > 0 ? "← Geri" : "← Ana Sayfa"}</button>
            <button onClick={handleNext} style={{ ...btn, background: "#C9952B", color: "white", padding: "10px 28px" }}>{step < 3 ? "Devam →" : "Başvuruyu Tamamla ✓"}</button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
        <div style={{ background: "white", borderRadius: 16, padding: 28, width: 380, maxWidth: "90vw" }}>
          <h3 style={{ margin: "0 0 14px", color: "#0B1D3A" }}>{authMode === "register" ? "Hesap Oluştur" : "Giriş Yap"}</h3>
          {authErr && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 8, borderRadius: 8, fontSize: 13, marginBottom: 10 }}>{authErr}</div>}
          {authMode === "register" && <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Ad Soyad" style={inp} />}
          <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="E-posta" style={inp} />
          <input value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder="Şifre" type="password" style={inp} />
          {authMode === "register" && <input value={authPass2} onChange={e => setAuthPass2(e.target.value)} placeholder="Şifre Tekrar" type="password" style={inp} />}
          <button onClick={handleAuthSubmit} style={{ ...btn, width: "100%", background: "#C9952B", color: "white", padding: 12, marginTop: 6 }}>{authMode === "register" ? "Kayıt Ol & Devam" : "Giriş & Devam"}</button>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 13 }}>
            {authMode === "register" ? <>Hesabınız var? <button onClick={() => setAuthMode("login")} style={{ background: "none", border: "none", color: "#C9952B", cursor: "pointer" }}>Giriş Yap</button></> : <>Hesap yok mu? <button onClick={() => setAuthMode("register")} style={{ background: "none", border: "none", color: "#C9952B", cursor: "pointer" }}>Kayıt Ol</button></>}
          </div>
        </div>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function DashboardPage({ nav, pageState }) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState(pageState?.defaultTab || "analiz");
  const [, forceUpdate] = useState(0);

  useEffect(() => { if (!user) nav("landing"); }, [user]);
  if (!user) return null;

  // ─── Her render'da DB'den oku — KULLANICIYA AİT OLANLARI FİLTRELE ───
  const allCompanies = DB.get("companies", []);
  const companies = allCompanies.filter(c => c.userId === user.id);
  const allInvoices = DB.get("invoices", []);
  const [selIdx, setSelIdx] = useState(0);

  if (companies.length === 0) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>📋</div>
      <h2 style={{ color: "#0B1D3A", margin: 0 }}>Henüz başvurunuz yok</h2>
      <p style={{ color: "#5A6478", margin: 0 }}>Giriş: <strong>{user.email}</strong> (ID: {user.id?.slice(0, 8)})</p>
      <button onClick={() => nav("wizard")} style={{ ...btn, background: "#C9952B", color: "white", padding: "12px 24px" }}>Yeni Başvuru Yap</button>
      <button onClick={() => { signOut(); nav("landing"); }} style={{ ...btn, background: "transparent", color: "#5A6478" }}>Çıkış Yap</button>
    </div>
  );

  const company = companies[Math.min(selIdx, companies.length - 1)];
  const compInv = allInvoices.filter(i => i.companyId === company.id);
  const hesaplama = company.hesaplama;
  const isPaid = compInv.some(i => i.status === "paid");

  const handlePayment = (invId) => {
    const all = DB.get("invoices", []);
    DB.set("invoices", all.map(i => i.id === invId ? { ...i, status: "paid", paidAt: new Date().toISOString() } : i));
    const allC = DB.get("companies", []);
    DB.set("companies", allC.map(c => c.id === company.id ? { ...c, appStatus: "payment_received" } : c));
    forceUpdate(n => n + 1);
  };

  const TABS = [{ k: "analiz", l: "📊 Analiz" }, { k: "firma", l: "🏢 Firma" }, { k: "odeme", l: "💳 Ödeme" }, { k: "rapor", l: "📄 Rapor" }, { k: "evraklar", l: "📁 Evraklar" }];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4" }}>
      <div style={{ background: "#0B1D3A", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>muteahhitlikbelgesi<span style={{ color: "#C9952B" }}>.com</span></span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,.6)", fontSize: 13 }}>{user.fullName}</span>
          {user.role === "admin" && <button onClick={() => nav("admin")} style={{ ...btn, fontSize: 11, background: "#1a3a5c", color: "white", padding: "4px 10px" }}>Admin</button>}
          <button onClick={() => { signOut(); nav("landing"); }} style={{ ...btn, fontSize: 11, background: "transparent", color: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.2)", padding: "4px 10px" }}>Çıkış</button>
        </div>
      </div>
      <div style={{ display: "flex", minHeight: "calc(100vh - 52px)" }}>
        <div style={{ width: 200, background: "white", borderRight: "1px solid #eee", padding: "20px 10px", flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0B1D3A", padding: "0 8px", marginBottom: 4 }}>{company.companyName}</div>
          <div style={{ fontSize: 11, color: "#5A6478", padding: "0 8px", marginBottom: 14 }}>Grup: <span style={{ fontWeight: 700, color: "#C9952B", fontSize: 16 }}>{company.grup || "H"}</span></div>
          {TABS.map(t => <button key={t.k} onClick={() => setTab(t.k)} style={{ display: "block", width: "100%", padding: "9px 12px", border: "none", borderRadius: 8, background: tab === t.k ? "rgba(201,149,43,.1)" : "transparent", cursor: "pointer", fontSize: 13, fontWeight: tab === t.k ? 600 : 400, color: tab === t.k ? "#0B1D3A" : "#5A6478", textAlign: "left", marginBottom: 2 }}>{t.l}{t.k === "odeme" && compInv.some(i => i.status === "unpaid") && <span style={{ marginLeft: 6, background: "#DC2626", color: "white", fontSize: 10, padding: "1px 5px", borderRadius: 8 }}>!</span>}</button>)}
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "12px 0" }} />
          <button onClick={() => nav("wizard")} style={{ ...btn, width: "100%", background: "rgba(201,149,43,.1)", color: "#C9952B", fontSize: 12 }}>+ Yeni Başvuru</button>
        </div>

        <div style={{ flex: 1, padding: "24px 32px", maxWidth: 900 }}>
          {/* ANALIZ */}
          {tab === "analiz" && hesaplama && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Hesaplama Raporu</h2>
            <div style={{ background: "linear-gradient(135deg,#0B1D3A,#1a3a5c)", borderRadius: 16, padding: 24, marginBottom: 16, color: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 12, opacity: .6 }}>Belirlenen Grup</div><div style={{ fontSize: 48, fontWeight: 800, color: "#C9952B" }}>{hesaplama.tercihEdilenGrup}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, opacity: .6 }}>Toplam İş Deneyimi</div><div style={{ fontSize: 22, fontWeight: 700 }}>{tlFormat(hesaplama.tercihEdilenToplam)}</div><div style={{ fontSize: 12, opacity: .6, marginTop: 4 }}>Yöntem: {hesaplama.tercihEdilenYontem === "son5" ? "Son 5 Yıl" : "Son 15 Yıl (×2)"}</div></div>
              </div>
              {hesaplama.birUstGrup && <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,255,255,.1)", borderRadius: 8, fontSize: 13 }}>Üst grup ({hesaplama.birUstGrup.grup}) için eksik: <strong style={{ color: "#C9952B" }}>{tlFormat(hesaplama.eksikTutar)}</strong></div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[["Son 5 Yıl", hesaplama.y1.toplamNet, hesaplama.y1.grup, "son5"], ["Son 15 Yıl (×2)", hesaplama.y2.toplam, hesaplama.y2.grup, "son15"]].map(([t, v, g, k]) =>
                <div key={k} style={{ background: "white", borderRadius: 12, padding: 14, border: hesaplama.tercihEdilenYontem === k ? "2px solid #C9952B" : "1px solid #E5E7EB" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#5A6478" }}>{t}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{tlFormat(v)}</div>
                  <div style={{ fontSize: 12, color: "#5A6478" }}>Grup: {g}</div>
                </div>
              )}
            </div>
            {hesaplama.isler?.length > 0 && <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>İşler</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr style={{ borderBottom: "2px solid #E5E7EB" }}><th style={th}>Sınıf</th><th style={th}>Alan</th><th style={th}>Belge</th><th style={th}>Güncel</th><th style={th}>Bant</th></tr></thead><tbody>
                {hesaplama.isler.map((x, i) => <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}><td style={td}>{x.ruhsatSinifi}</td><td style={td}>{x.alanM2?.toLocaleString("tr-TR")} m²</td><td style={td}>{tlFormat(x.sonuc.belgeTutari)}</td><td style={{ ...td, fontWeight: 700 }}>{tlFormat(x.sonuc.guncelTutar)}</td><td style={td}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: x.sonuc.bantDurumu === "ufe" ? "#DCFCE7" : "#FEF3C7" }}>{x.sonuc.bantAciklama}</span></td></tr>)}
              </tbody></table>
            </div>}
            {hesaplama.diploma && <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB", marginTop: 12 }}><div style={{ fontSize: 14, fontWeight: 600 }}>🎓 Diploma</div><div style={{ fontSize: 13, color: "#5A6478", marginTop: 4 }}>{hesaplama.diploma.aciklama}</div><div style={{ fontSize: 16, fontWeight: 700, color: "#C9952B", marginTop: 4 }}>Diploma: {hesaplama.diploma.grup}</div></div>}
          </div>}
          {tab === "analiz" && !hesaplama && <div style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 48 }}>📊</div><h3 style={{ color: "#0B1D3A" }}>H Grubu</h3><p style={{ color: "#5A6478" }}>İş deneyimi girilmedi.</p></div>}

          {/* FİRMA */}
          {tab === "firma" && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Firma Bilgileri</h2>
            <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #E5E7EB" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[["Firma", company.companyName], ["Vergi No", company.taxId], ["Telefon", company.phone], ["E-posta", company.email], ["Tür", company.companyType], ["Konum", company.location === "istanbul" ? "İstanbul" : company.city], ["Hizmet", company.serviceLabel], ["Durum", STATUS_MAP[company.appStatus] || company.appStatus]].map(([l, v], i) => <div key={i}><div style={{ fontSize: 11, color: "#5A6478", fontWeight: 600 }}>{l}</div><div style={{ fontSize: 14, color: "#0B1D3A", marginTop: 2 }}>{v || "—"}</div></div>)}
              </div>
            </div>
          </div>}

          {/* ÖDEME */}
          {tab === "odeme" && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Ödemeler</h2>
            {compInv.length === 0 ? <p style={{ color: "#5A6478" }}>Fatura yok.</p> : compInv.map(inv => <div key={inv.id} style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 14, fontWeight: 600 }}>{inv.description}</div><div style={{ fontSize: 12, color: "#5A6478" }}>{new Date(inv.date).toLocaleDateString("tr-TR")}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 700 }}>{tlFormat(inv.amount)}</div><span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: inv.status === "paid" ? "#DCFCE7" : "#FEF3C7", color: inv.status === "paid" ? "#16A34A" : "#D97706", fontWeight: 600 }}>{inv.status === "paid" ? "✓ Ödendi" : "Bekliyor"}</span></div>
              </div>
              {inv.status !== "paid" && <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}><PayForm onPay={() => handlePayment(inv.id)} amount={inv.amount} /></div>}
            </div>)}
          </div>}

          {/* RAPOR */}
          {tab === "rapor" && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Rapor</h2>
            {isPaid ? <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #E5E7EB" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
                <div><div style={{ color: "#5A6478", fontSize: 11 }}>Firma</div><div style={{ fontWeight: 600 }}>{company.companyName}</div></div>
                <div><div style={{ color: "#5A6478", fontSize: 11 }}>Grup</div><div style={{ fontWeight: 700, color: "#C9952B", fontSize: 24 }}>{company.grup}</div></div>
                <div><div style={{ color: "#5A6478", fontSize: 11 }}>Tarih</div><div>{new Date().toLocaleDateString("tr-TR")}</div></div>
              </div>
              {hesaplama && <div style={{ marginTop: 14, padding: 12, background: "#F8F7F4", borderRadius: 8, fontSize: 12, color: "#374151" }}>
                <div>İş Deneyim: <strong>{tlFormat(hesaplama.tercihEdilenToplam)}</strong></div>
                <div>Yöntem: <strong>{hesaplama.tercihEdilenYontem === "son5" ? "Son 5 Yıl" : "Son 15 Yıl ×2"}</strong></div>
                {hesaplama.isler?.map((x, i) => <div key={i} style={{ marginTop: 4 }}>İş {i + 1}: {x.ruhsatSinifi} — {x.alanM2?.toLocaleString("tr-TR")}m² — {tlFormat(x.sonuc.guncelTutar)}</div>)}
              </div>}
            </div> : <div style={{ textAlign: "center", padding: 40, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 40 }}>🔒</div><p style={{ color: "#5A6478" }}>Ödeme sonrası açılır.</p>
              <button onClick={() => setTab("odeme")} style={{ ...btn, background: "#C9952B", color: "white" }}>Ödeme Yap</button>
            </div>}
          </div>}

          {/* EVRAKLAR */}
          {tab === "evraklar" && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Evraklar</h2>
            {isPaid ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Mükellefiyet Belgesi", "İmza Beyannamesi/Sirküleri", "Nüfus Cüzdanı", "Vergi Levhası", "Yapı Ruhsatı", "İskan Belgesi", "Ticaret Odası Kaydı"].map((e, i) => <div key={i} style={{ background: "white", borderRadius: 10, padding: 12, border: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{e}</span>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#FEF3C7", color: "#D97706" }}>Bekleniyor</span>
              </div>)}
            </div> : <div style={{ textAlign: "center", padding: 40, background: "white", borderRadius: 12, border: "1px solid #E5E7EB" }}><div style={{ fontSize: 40 }}>🔒</div><p style={{ color: "#5A6478" }}>Ödeme sonrası açılır.</p></div>}
          </div>}
        </div>
      </div>
    </div>
  );
}

function PayForm({ onPay, amount }) {
  const [method, setMethod] = useState("card");
  const [cn, setCn] = useState(""); const [cname, setCname] = useState(""); const [cexp, setCexp] = useState(""); const [cvv, setCvv] = useState("");
  const [proc, setProc] = useState(false);
  const pay = () => { if (method === "card" && (cn.replace(/\s/g, "").length < 16 || !cname || cexp.length < 5 || cvv.length < 3)) return alert("Kart bilgilerini doldurun."); setProc(true); setTimeout(() => { setProc(false); onPay(); }, 1200); };
  return <div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>{[["card", "💳 Kredi Kartı"], ["transfer", "🏦 Havale"]].map(([v, l]) => <button key={v} onClick={() => setMethod(v)} style={{ ...chip, fontSize: 12, background: method === v ? "#0B1D3A" : "#F3F0EB", color: method === v ? "white" : "#0B1D3A" }}>{l}</button>)}</div>
    {method === "card" ? <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <input value={cn} onChange={e => setCn(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19))} placeholder="Kart No" style={inp} />
      <input value={cname} onChange={e => setCname(e.target.value)} placeholder="Kart İsim" style={inp} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <input value={cexp} onChange={e => { let v = e.target.value.replace(/\D/g, ""); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2, 4); setCexp(v); }} placeholder="AA/YY" style={inp} maxLength={5} />
        <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="CVV" type="password" style={inp} maxLength={4} />
      </div>
    </div> : <div style={{ background: "#F0F9FF", borderRadius: 8, padding: 12, fontSize: 12, color: "#0369A1" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Havale Bilgileri</div>
      <div>IBAN: TR12 0001 0000 1234 5678 9012 34</div>
      <div>Açıklama: Firma adınızı yazın</div>
    </div>}
    <button onClick={pay} disabled={proc} style={{ ...btn, width: "100%", background: proc ? "#9CA3AF" : "#16A34A", color: "white", padding: 12, marginTop: 10, fontSize: 14 }}>{proc ? "İşleniyor..." : method === "card" ? `${tlFormat(amount)} Öde` : "Havale Yaptım"}</button>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════════
function AdminPage({ nav }) {
  const { user, signIn, signOut, getAllUsers } = useAuth();
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [, forceUpdate] = useState(0);

  // Admin zaten giriş yapmışsa direkt aç
  useEffect(() => { if (user?.role === "admin") setLoggedIn(true); }, [user]);

  // Admin login formu
  if (!loggedIn) {
    return <AdminLoginForm onLogin={() => setLoggedIn(true)} nav={nav} signIn={signIn} />;
  }

  const companies = DB.get("companies", []);
  const invoices = DB.get("invoices", []);
  const paid = invoices.filter(i => i.status === "paid");
  const unpaid = invoices.filter(i => i.status !== "paid");
  const revenue = paid.reduce((s, i) => s + (i.amount || 0), 0);
  const users = getAllUsers();

  const TABS = [{ k: "dashboard", l: "📊 Dashboard" }, { k: "companies", l: "🏢 Şirketler" }, { k: "users", l: "👥 Kullanıcılar" }, { k: "invoices", l: "💳 Faturalar" }, { k: "hesaplama", l: "🧮 Hesaplama" }];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4" }}>
      <div style={{ background: "#0B1D3A", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#C9952B", fontWeight: 700, fontSize: 18 }}>⬡</span><span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>Admin Panel</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => nav("landing")} style={{ ...btn, fontSize: 11, background: "transparent", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.2)", padding: "4px 10px" }}>Siteye Dön</button>
          <button onClick={() => { signOut(); nav("landing"); }} style={{ ...btn, fontSize: 11, background: "#DC2626", color: "white", padding: "4px 10px" }}>Çıkış</button>
        </div>
      </div>
      <div style={{ display: "flex", minHeight: "calc(100vh - 52px)" }}>
        <div style={{ width: 190, background: "white", borderRight: "1px solid #eee", padding: "20px 10px" }}>
          {TABS.map(t => <button key={t.k} onClick={() => setTab(t.k)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "9px 10px", border: "none", borderRadius: 8, background: tab === t.k ? "rgba(201,149,43,.1)" : "transparent", cursor: "pointer", fontSize: 13, fontWeight: tab === t.k ? 600 : 400, color: tab === t.k ? "#0B1D3A" : "#5A6478", textAlign: "left", marginBottom: 2 }}>{t.l}{t.k === "invoices" && unpaid.length > 0 && <span style={{ marginLeft: "auto", background: "#DC2626", color: "white", fontSize: 10, padding: "1px 5px", borderRadius: 10 }}>{unpaid.length}</span>}</button>)}
        </div>
        <div style={{ flex: 1, padding: "24px 28px", maxWidth: 1000 }}>
          {tab === "dashboard" && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Dashboard</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
              {[{ l: "Şirket", v: companies.length, c: "#3B82F6", i: "🏢" }, { l: "Kullanıcı", v: users.length, c: "#8B5CF6", i: "👥" }, { l: "Gelir", v: tlFormat(revenue), c: "#16A34A", i: "💰" }, { l: "Bekleyen", v: unpaid.length, c: "#D97706", i: "⏳" }].map((s, i) =>
                <div key={i} style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 11, color: "#5A6478", fontWeight: 600 }}>{s.l}</span><span style={{ fontSize: 18 }}>{s.i}</span></div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.c, marginTop: 6 }}>{s.v}</div>
                </div>)}
            </div>
            <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Grup Dağılımı</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {GRUP_ESIKLER.map(g => { const cnt = companies.filter(c => c.grup === g.grup).length; return <div key={g.grup} style={{ textAlign: "center", padding: "6px 10px", borderRadius: 8, background: cnt ? "rgba(201,149,43,.1)" : "#F3F4F6", minWidth: 44 }}><div style={{ fontSize: 14, fontWeight: 700, color: cnt ? "#C9952B" : "#9CA3AF" }}>{g.grup}</div><div style={{ fontSize: 10, color: "#5A6478" }}>{cnt}</div></div>; })}
              </div>
            </div>
            <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Son Başvurular</div>
              {companies.slice(-5).reverse().map(c => <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}><div><strong>{c.companyName}</strong> <span style={{ color: "#5A6478", fontSize: 11 }}>{new Date(c.createdAt).toLocaleDateString("tr-TR")}</span></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontWeight: 700, color: "#C9952B" }}>{c.grup}</span><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: c.appStatus === "payment_received" ? "#DCFCE7" : "#FEF3C7" }}>{STATUS_MAP[c.appStatus] || c.appStatus}</span></div></div>)}
            </div>
          </div>}

          {tab === "companies" && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Şirketler ({companies.length})</h2>
            <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, background: "white", borderRadius: 12 }}><thead><tr style={{ background: "#F8F7F4" }}><th style={th}>Firma</th><th style={th}>Vergi No</th><th style={th}>Tür</th><th style={th}>Grup</th><th style={th}>Hizmet</th><th style={th}>Durum</th><th style={th}>Tarih</th></tr></thead><tbody>
              {companies.map(c => <tr key={c.id} style={{ borderBottom: "1px solid #F3F4F6" }}><td style={td}><strong>{c.companyName}</strong></td><td style={td}>{c.taxId}</td><td style={td}>{c.companyType}</td><td style={{ ...td, fontWeight: 700, color: "#C9952B", fontSize: 16 }}>{c.grup}</td><td style={td}>{c.serviceLabel}</td><td style={td}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: c.appStatus === "payment_received" ? "#DCFCE7" : "#FEF3C7" }}>{STATUS_MAP[c.appStatus] || c.appStatus}</span></td><td style={td}>{new Date(c.createdAt).toLocaleDateString("tr-TR")}</td></tr>)}
            </tbody></table></div>
          </div>}

          {tab === "users" && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Kullanıcılar ({users.length})</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, background: "white" }}><thead><tr style={{ background: "#F8F7F4" }}><th style={th}>Ad</th><th style={th}>E-posta</th><th style={th}>Rol</th><th style={th}>Tarih</th></tr></thead><tbody>
              {users.map(u => <tr key={u.id} style={{ borderBottom: "1px solid #F3F4F6" }}><td style={td}>{u.fullName}</td><td style={td}>{u.email}</td><td style={td}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: u.role === "admin" ? "#EDE9FE" : "#DCFCE7", color: u.role === "admin" ? "#7C3AED" : "#16A34A" }}>{u.role}</span></td><td style={td}>{new Date(u.createdAt).toLocaleDateString("tr-TR")}</td></tr>)}
            </tbody></table>
          </div>}

          {tab === "invoices" && <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Faturalar ({invoices.length})</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[["Gelir", tlFormat(revenue), "#16A34A"], ["Bekleyen", tlFormat(unpaid.reduce((s, i) => s + (i.amount || 0), 0)), "#D97706"], ["Ödenen/Toplam", `${paid.length}/${invoices.length}`, "#0B1D3A"]].map(([l, v, c], i) =>
                <div key={i} style={{ background: "white", borderRadius: 10, padding: 12, border: "1px solid #E5E7EB" }}><div style={{ fontSize: 11, color: "#5A6478" }}>{l}</div><div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div></div>)}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, background: "white" }}><thead><tr style={{ background: "#F8F7F4" }}><th style={th}>Firma</th><th style={th}>Açıklama</th><th style={th}>Tutar</th><th style={th}>Durum</th><th style={th}>İşlem</th></tr></thead><tbody>
              {invoices.map(inv => { const c = companies.find(x => x.id === inv.companyId); return <tr key={inv.id} style={{ borderBottom: "1px solid #F3F4F6" }}><td style={td}>{c?.companyName || "—"}</td><td style={td}>{inv.description}</td><td style={{ ...td, fontWeight: 700 }}>{tlFormat(inv.amount)}</td><td style={td}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: inv.status === "paid" ? "#DCFCE7" : "#FEF3C7", color: inv.status === "paid" ? "#16A34A" : "#D97706" }}>{inv.status === "paid" ? "Ödendi" : "Bekliyor"}</span></td><td style={td}>
                {inv.status !== "paid" && <button onClick={() => { const all = DB.get("invoices", []); DB.set("invoices", all.map(i => i.id === inv.id ? { ...i, status: "paid" } : i)); const allC = DB.get("companies", []); DB.set("companies", allC.map(x => x.id === inv.companyId ? { ...x, appStatus: "payment_received" } : x)); forceUpdate(n => n + 1); }} style={{ ...btn, fontSize: 10, background: "#16A34A", color: "white", padding: "3px 8px" }}>Onayla</button>}
              </td></tr>; })}
            </tbody></table>
          </div>}

          {tab === "hesaplama" && <AdminCalc />}
        </div>
      </div>
    </div>
  );
}

function AdminLoginForm({ onLogin, nav, signIn }) {
  const [email, setEmail] = useState("admin@muteahhitlik.com");
  const [pass, setPass] = useState(""); const [err, setErr] = useState("");
  const submit = () => { const r = signIn(email, pass); if (r.error) setErr(r.error); else onLogin(); };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F7F4" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: 380, boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}><span style={{ fontSize: 32, color: "#C9952B" }}>⬡</span><h2 style={{ margin: "8px 0 0", color: "#0B1D3A" }}>Admin Girişi</h2></div>
        {err && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 8, borderRadius: 8, fontSize: 13, marginBottom: 10 }}>{err}</div>}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" style={inp} />
        <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Şifre" type="password" style={inp} onKeyDown={e => e.key === "Enter" && submit()} />
        <button onClick={submit} style={{ ...btn, width: "100%", background: "#0B1D3A", color: "white", padding: 12, marginTop: 6 }}>Giriş</button>
        <button onClick={() => nav("landing")} style={{ ...btn, width: "100%", background: "transparent", color: "#5A6478", marginTop: 8, fontSize: 12 }}>← Ana Sayfa</button>
        <div style={{ marginTop: 10, fontSize: 11, color: "#5A6478", textAlign: "center" }}>Şifre: Admin123!</div>
      </div>
    </div>
  );
}

function AdminCalc() {
  const [sinif, setSinif] = useState("III.B"); const [alan, setAlan] = useState(""); const [sozTarih, setST] = useState(""); const [iskanTarih, setIT] = useState("");
  const [tip, setTip] = useState("kat_karsiligi"); const [bedel, setBedel] = useState(""); const [sonuc, setSonuc] = useState(null);
  const hesapla = () => { const g = { id: "t", sozlesmeTarihi: sozTarih, iskanTarihi: iskanTarih || sozTarih, ruhsatSinifi: sinif, alanM2: parseNum(alan), tip, taahhutBedeli: tip === "taahhut" ? parseNum(bedel) : undefined }; setSonuc(tamHesapla([g], null)); };
  return <div>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0B1D3A", margin: "0 0 16px" }}>Bağımsız Hesaplama</h2>
    <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #E5E7EB", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>{[["kat_karsiligi", "Kat Karşılığı"], ["taahhut", "Taahhüt"]].map(([v, l]) => <button key={v} onClick={() => setTip(v)} style={{ ...chip, background: tip === v ? "#C9952B" : "#F3F0EB", color: tip === v ? "white" : "#0B1D3A" }}>{l}</button>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <F l="Söz. Tarihi"><input type="date" value={sozTarih} onChange={e => setST(e.target.value)} style={inp} /></F>
        <F l="İskan Tarihi"><input type="date" value={iskanTarih} onChange={e => setIT(e.target.value)} style={inp} /></F>
        {tip === "kat_karsiligi" && <F l="Sınıf"><select value={sinif} onChange={e => setSinif(e.target.value)} style={inp}>{SINIFLAR.map(s => <option key={s}>{s}</option>)}</select></F>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        {tip === "kat_karsiligi" ? <F l="Alan (m²)"><input value={alan} onChange={e => setAlan(fmtNum(e.target.value))} style={inp} placeholder="5.000" /></F> : <F l="Bedel (TL)"><input value={bedel} onChange={e => setBedel(fmtNum(e.target.value))} style={inp} /></F>}
        <div style={{ display: "flex", alignItems: "flex-end" }}><button onClick={hesapla} style={{ ...btn, background: "#C9952B", color: "white", padding: "10px 20px", width: "100%" }}>Hesapla</button></div>
      </div>
    </div>
    {sonuc && <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #E5E7EB" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div><div style={{ fontSize: 11, color: "#5A6478" }}>Belge Tutarı</div><div style={{ fontSize: 18, fontWeight: 700 }}>{tlFormat(sonuc.isler[0]?.sonuc.belgeTutari)}</div></div>
        <div><div style={{ fontSize: 11, color: "#5A6478" }}>Güncel (ÜFE)</div><div style={{ fontSize: 18, fontWeight: 700, color: "#16A34A" }}>{tlFormat(sonuc.tercihEdilenToplam)}</div></div>
        <div><div style={{ fontSize: 11, color: "#5A6478" }}>Grup</div><div style={{ fontSize: 32, fontWeight: 800, color: "#C9952B" }}>{sonuc.tercihEdilenGrup}</div></div>
      </div>
      <div style={{ marginTop: 10, padding: "6px 10px", background: "#F8F7F4", borderRadius: 8, fontSize: 12, color: "#5A6478" }}>{sonuc.isler[0]?.sonuc.bantAciklama}</div>
      {sonuc.birUstGrup && <div style={{ marginTop: 6, fontSize: 12, color: "#D97706" }}>Üst ({sonuc.birUstGrup.grup}) eksik: <strong>{tlFormat(sonuc.eksikTutar)}</strong></div>}
    </div>}
  </div>;
}

// ─── SHARED ──────────────────────────────────────────────────
function F({ l, children }) { return <div style={{ marginBottom: 2 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>{l}</label>{children}</div>; }
function SC({ title, items }) { return <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#0B1D3A", marginBottom: 8, borderBottom: "1px solid #F3F4F6", paddingBottom: 6 }}>{title}</div>{items.map(([l, v], i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13 }}><span style={{ color: "#5A6478" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>)}</div>; }
const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 4, background: "#FAFAF8" };
const btn = { padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const chip = { padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 };
const th = { padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 11 };
const td = { padding: "10px 12px", color: "#374151" };
