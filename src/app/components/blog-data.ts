export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML string
  coverImage: string;
  author: string;
  authorTitle: string;
  publishedAt: string; // ISO date
  readingTime: number; // dakika
  tags: string[];
  isCustom?: boolean; // admin tarafından eklendi
  published?: boolean;
}

export const ALL_TAGS = [
  "Müteahhitlik Belgesi",
  "YKB",
  "Başvuru Rehberi",
  "Mevzuat",
  "Mali Müşavir",
  "Sözleşme",
  "Pratik İpuçları",
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "muteahhitlik-belgesi-nedir-nasil-alinir",
    title: "Müteahhitlik Belgesi Nedir ve Nasıl Alınır?",
    excerpt:
      "Yapı müteahhitliği yetki belgesi, inşaat sektöründe faaliyet göstermek isteyen gerçek ve tüzel kişilerin alması zorunlu resmi bir belgedir. Bu rehberde başvuru sürecini adım adım açıklıyoruz.",
    coverImage:
      "https://images.unsplash.com/photo-1754780960162-839cda44d736?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBidWlsZGluZyUyMHBlcm1pdCUyMGRvY3VtZW50fGVufDF8fHx8MTc3NDg4NDQxOXww&ixlib=rb-4.1.0&q=80&w=1080",
    author: "Av. Selin Kaya",
    authorTitle: "İnşaat Hukuku Uzmanı",
    publishedAt: "2026-03-15",
    readingTime: 6,
    tags: ["Müteahhitlik Belgesi", "Başvuru Rehberi", "Mevzuat"],
    content: `
<p>Yapı müteahhitliği yetki belgesi; konut, ticari bina veya altyapı inşaatı gerçekleştirmek isteyen her gerçek ya da tüzel kişinin Çevre, Şehircilik ve İklim Değişikliği Bakanlığı'ndan alması zorunlu olan resmi bir belgedir. 2010 yılında yürürlüğe giren 595 sayılı Yönetmelik ile zorunlu hale gelen bu belge, A1'den G grubuna kadar yedi farklı sınıfta verilmektedir.</p>

<h2>Kimler Başvurabilir?</h2>
<p>Başvuru hakkına sahip olmak için aşağıdaki koşullardan birini taşımanız gerekir:</p>
<ul>
  <li>Mühendislik veya mimarlık lisans diplomasına sahip gerçek kişiler</li>
  <li>Bünyesinde en az bir mühendis ya da mimar istihdam eden tüzel kişiler</li>
  <li>Yapı kooperatifleri ve bunların üst birlikleri</li>
</ul>

<h2>Gerekli Belgeler</h2>
<p>Başvuru dosyasında şu belgeler yer almalıdır:</p>
<ul>
  <li>Noterden onaylı imza sirküleri</li>
  <li>Ticaret Sicili Gazetesi sureti</li>
  <li>Vergi levhası ve mükellefiyet belgesi</li>
  <li>İş deneyim belgesi (varsa)</li>
  <li>Banka referans mektubu</li>
  <li>İnteraktif Vergi Dairesi'nden alınan e-imzalı bilanço</li>
  <li>Ruhsat ve iskan belgesi örnekleri (tamamlanmış projeler için)</li>
</ul>

<h2>Başvuru Süreci</h2>
<p>Başvurular e-Devlet üzerinden dijital ortamda yapılmaktadır. Sistem, belgelerinizi otomatik olarak değerlendirerek hangi sınıfa uygun olduğunuzu hesaplar. Eksik belge veya tutarsızlık durumunda 15 iş günü içinde ek belge talep edilir.</p>

<h2>Sonuç</h2>
<p>Müteahhitlik belgesi alım süreci karmaşık görünse de doğru dosyalanmış belgeler ve uzman desteğiyle oldukça hızlı ilerleyebilir. Platformumuzun otomatik analiz aracını kullanarak hangi belgelere ihtiyacınız olduğunu dakikalar içinde öğrenebilirsiniz.</p>
    `,
  },
  {
    id: "2",
    slug: "ykb-sinif-tayini-a1den-gye-kapsamli-rehber",
    title: "YKB Sınıf Tayini: A1'den G'ye Kapsamlı Rehber",
    excerpt:
      "Yapı Müteahhitliği Yetki Belgesi (YKB) sınıfı, şirketinizin üstlenebileceği inşaat projelerinin büyüklüğünü doğrudan belirler. Doğru sınıfı belirlemenin yolları ve sınıf yükseltme kriterleri.",
    coverImage:
      "https://images.unsplash.com/photo-1622611935038-1c4caa0db5d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBjb250cmFjdG9yJTIwdGVhbSUyMG1lZXRpbmd8ZW58MXx8fHwxNzc0ODg0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    author: "Müh. Tarık Demir",
    authorTitle: "Yapı Denetim Danışmanı",
    publishedAt: "2026-03-10",
    readingTime: 8,
    tags: ["YKB", "Müteahhitlik Belgesi", "Pratik İpuçları"],
    content: `
<p>Yetki Belgesi sınıfı; firmanızın mali kapasitesini, teknik personelini ve iş deneyimini yansıtan bir puanlama sistemiyle belirlenir. Sınıfınız ne kadar yüksekse, o kadar büyük ölçekli ve değerli projelere teklif verebilirsiniz.</p>

<h2>Sınıf Tablosu</h2>
<p>Mevcut sistemde yedi sınıf bulunmaktadır:</p>
<ul>
  <li><strong>G Sınıfı:</strong> Başlangıç seviyesi, küçük konut projeleri</li>
  <li><strong>F Sınıfı:</strong> Orta ölçekli konut ve ticari binalar</li>
  <li><strong>E Sınıfı:</strong> Büyük ölçekli konut projeleri</li>
  <li><strong>D Sınıfı:</strong> Alışveriş merkezi, otel gibi büyük ticari yapılar</li>
  <li><strong>C Sınıfı:</strong> Endüstriyel tesisler, büyük altyapı</li>
  <li><strong>B Sınıfı:</strong> Mega projeler</li>
  <li><strong>A1 Sınıfı:</strong> En üst sınıf, kamu büyük altyapı projeleri</li>
</ul>

<h2>Puanlama Kriterleri</h2>
<p>Sınıf tayininde üç ana kriter değerlendirilir:</p>
<ul>
  <li><strong>Sermaye ve Mali Durum:</strong> Son üç yılın bilançosu, özkaynak miktarı</li>
  <li><strong>İş Deneyimi:</strong> Tamamlanan projelerin toplam bedeli ve niteliği</li>
  <li><strong>Teknik Personel:</strong> İstihdam edilen mühendis, mimar ve tekniker sayısı</li>
</ul>

<h2>Sınıf Yükseltme Koşulları</h2>
<p>Sınıf yükseltme başvurusu için en az iki yıl önceki sınıfta faaliyet göstermiş olmanız ve yeni sınıfın gerektirdiği tüm kriterleri karşılamanız gerekir. Yılda bir kez yapılan periyodik değerlendirmelerde otomatik yükseltme de mümkündür.</p>

<h2>Hangi Sınıfı Hedeflemeliyim?</h2>
<p>Hedef sınıfınızı belirlerken sadece bugünkü değil, 3-5 yıl sonraki portföyünüzü düşünün. Çok düşük bir sınıfta kalmak büyük projelere giremeyi engellerken, hazır olmadan yüksek sınıfa geçmek de yükümlülüklerle boğulmanıza yol açabilir.</p>
    `,
  },
  {
    id: "3",
    slug: "is-deneyim-belgesi-hazirlama-rehberi",
    title: "İş Deneyim Belgesi Hazırlarken Dikkat Edilmesi Gerekenler",
    excerpt:
      "Müteahhitlik belgesi başvurusunun en kritik bileşenlerinden biri iş deneyim belgesidir. Hangi projelerin sayılacağı, belgeleme standartları ve sık yapılan hatalar hakkında bilmeniz gereken her şey.",
    coverImage:
      "https://images.unsplash.com/photo-1763729805496-b5dbf7f00c79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGRvY3VtZW50cyUyMGxlZ2FsJTIwcGFwZXJzJTIwc2lnbmluZ3xlbnwxfHx8fDE3NzQ4ODQ0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    author: "Av. Selin Kaya",
    authorTitle: "İnşaat Hukuku Uzmanı",
    publishedAt: "2026-03-05",
    readingTime: 5,
    tags: ["Başvuru Rehberi", "Pratik İpuçları", "Mevzuat"],
    content: `
<p>İş deneyim belgesi; firmanızın daha önce tamamladığı inşaat projelerini resmi olarak belgeleyen ve sınıf tayininde doğrudan puan kazandıran en önemli evraktır. Ancak her proje otomatik olarak iş deneyimi kapsamında sayılmaz.</p>

<h2>Hangi Projeler Sayılır?</h2>
<p>İş deneyimi olarak kabul edilen projeler şunlardır:</p>
<ul>
  <li>Yapı ruhsatı ve iskan belgesi olan tamamlanmış konut ve ticari binalar</li>
  <li>Kamu ihaleleriyle üstlenilen projeler (hakediş belgeleri ile)</li>
  <li>Kat karşılığı sözleşmeler kapsamında tamamlanan projeler</li>
  <li>Endüstriyel tesis yapımları (tesis ruhsatı ile)</li>
</ul>

<h2>Belgeleme Standartları</h2>
<p>Her proje için aşağıdaki belgeler dosyaya eklenmelidir:</p>
<ul>
  <li>Yapı ruhsatı fotokopisi (her sayfa onaylı)</li>
  <li>Yapı kullanma izin belgesi (iskan)</li>
  <li>Sözleşme (kat karşılığı veya nakit)</li>
  <li>Yapı denetim kuruluşundan alınan proje tamamlama yazısı</li>
</ul>

<h2>Sık Yapılan Hatalar</h2>
<p>En yaygın hataların başında iskan belgesi olmayan projeler için başvuru yapılması gelir. İskansız bir bina hukuki açıdan "tamamlanmış" sayılmaz. Öte yandan sözleşme bedeli ile gerçek piyasa değeri arasındaki büyük farklar da sistem tarafından soru işareti yaratabilir.</p>

<h2>Profesyonel Destek Alın</h2>
<p>İş deneyim dosyasının doğru hazırlanması, başvurunuzun onay süresini ciddi ölçüde kısaltır. Platformumuzda dosyanızı yükleyerek eksik evrakları anında tespit edebilirsiniz.</p>
    `,
  },
  {
    id: "4",
    slug: "kat-karsiligi-insaat-sozlesmesi-bilinmesi-gerekenler",
    title: "Kat Karşılığı İnşaat Sözleşmelerinde Bilinmesi Gerekenler",
    excerpt:
      "Kat karşılığı inşaat sözleşmeleri hem arsa sahipleri hem müteahhitler için karmaşık hukuki düzenlemeler içerir. Müteahhitlik belgesi açısından bu sözleşmelerin nasıl değerlendirildiğini açıklıyoruz.",
    coverImage:
      "https://images.unsplash.com/photo-1763621550224-6ff277b8c754?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwcHJvcGVydHklMjBpbnZlc3RtZW50JTIwZmluYW5jZXxlbnwxfHx8fDE3NzQ4ODQ0MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    author: "Müh. Tarık Demir",
    authorTitle: "Yapı Denetim Danışmanı",
    publishedAt: "2026-02-28",
    readingTime: 7,
    tags: ["Sözleşme", "Mevzuat", "Müteahhitlik Belgesi"],
    content: `
<p>Kat karşılığı inşaat sözleşmesi; arsa sahibinin arsasını müteahhide devretmesi, müteahhidin de karşılığında inşaat yaparak belirlenen daireleri arsa sahibine teslim etmesi esasına dayanan bir iş modelidir. Bu model Türkiye'de yaygın olmakla birlikte, müteahhitlik belgesi başvurusunda özel muamele gerektirmektedir.</p>

<h2>Sözleşme Türleri</h2>
<ul>
  <li><strong>Düz Kat Karşılığı:</strong> Belirli kat veya daireler müteahhide bırakılır</li>
  <li><strong>Arsa Payı Karşılığı:</strong> Tapu payı devri esasına dayanır</li>
  <li><strong>Hasılat Paylaşımlı:</strong> Satış gelirinin paylaşılması öngörülür</li>
</ul>

<h2>Müteahhitlik Belgesi Açısından Değerlendirme</h2>
<p>Kat karşılığı projelerde iş bedeli, sözleşmedeki rayiç değer üzerinden hesaplanır. Sözleşme noterde düzenlenmeli ve tapu kaydındaki işlemlerle uyumlu olmalıdır. Yalnızca adi yazılı sözleşmeler, değerlendirme dışında kalabilir.</p>

<h2>Dikkat Edilmesi Gerekenler</h2>
<ul>
  <li>Sözleşme noter tasdikli olmalı</li>
  <li>Projenin değeri ekspertiz raporu ile desteklenmeli</li>
  <li>Arsa devrinin tapu sicilinde kayıtlı olması gerekir</li>
  <li>Tamamlanan projenin iskanı alınmış olmalı</li>
</ul>

<h2>Sonuç</h2>
<p>Kat karşılığı projeleri doğru belgelediğinizde iş deneyim puanınız anlamlı ölçüde artabilir. Bu nedenle her proje için eksiksiz dosya tutmayı alışkanlık haline getirmenizi öneririz.</p>
    `,
  },
  {
    id: "5",
    slug: "mali-musavirlerin-muteahhitlik-basvurularindaki-rolu",
    title: "Mali Müşavirlerin Müteahhitlik Başvurularındaki Rolü",
    excerpt:
      "Müteahhitlik belgesi başvurularında mali müşavirlerin kritik bir işlevi vardır. Bilanço hazırlama, vergi uyumu ve finansal yeterlilik belgelerinin nasıl düzenleneceğini uzmanlardan öğrenin.",
    coverImage:
      "https://images.unsplash.com/photo-1560922604-d08a31f8f7d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3NDg4NDQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
    author: "SMMM Berna Arslan",
    authorTitle: "Serbest Mali Müşavir",
    publishedAt: "2026-02-20",
    readingTime: 6,
    tags: ["Mali Müşavir", "Başvuru Rehberi", "Pratik İpuçları"],
    content: `
<p>Müteahhitlik belgesi başvurularında mali müşavirlere düşen görev, yalnızca vergi beyannamesi imzalamaktan çok daha kapsamlıdır. Başvuru dosyasının mali boyutunu eksiksiz ve doğru biçimde hazırlamak, başarılı sonuç için kritik öneme sahiptir.</p>

<h2>Mali Müşavirin Sorumluluk Alanları</h2>
<ul>
  <li>Son üç yılın onaylı bilançolarının hazırlanması</li>
  <li>İnteraktif Vergi Dairesi üzerinden e-imzalı bilanço çıktısı alınması</li>
  <li>Özkaynak ve aktif büyüklük hesaplarının doğrulanması</li>
  <li>Mükellefiyet belgesinin güncel tutulması</li>
  <li>Vergi borcu olmadığına dair yazının alınması</li>
</ul>

<h2>E-İmzalı Bilanço Neden Önemli?</h2>
<p>Bakanlık sistemi, e-imzalı bilançoyu otomatik olarak TÜRMOB veritabanıyla karşılaştırır. Uyumsuzluk tespit edildiğinde başvuru reddedilir. Bu nedenle e-imzanın geçerlilik süresi de kontrol edilmelidir.</p>

<h2>Mali Yeterlilik Eşikleri</h2>
<p>Her sınıf için minimum özkaynak ve iş hacmi şartı bulunur. Örneğin F sınıfı için özkaynak eşiği yıldan yıla yeniden değerleme oranıyla güncellenir. Mali müşavirinizin bu tabloları takip etmesi zorunludur.</p>

<h2>Platformumuzla Entegrasyon</h2>
<p>Müşavirler, platforma müşterileri adına giriş yaparak belge kontrol listesini doldurabilir ve eksik evrakları sistem üzerinden takip edebilir. Bu sayede her iki taraf da süreçten anlık haberdar olur.</p>
    `,
  },
  {
    id: "6",
    slug: "banka-referans-mektubu-nasil-alinir",
    title: "Banka Referans Mektubu Nasıl Alınır?",
    excerpt:
      "Müteahhitlik belgesi dosyasında yer alan banka referans mektubu, bankanızın firmanızı tanıdığını ve belirli bir finansal kapasiteye sahip olduğunu onayladığı resmi bir belgedir. Adım adım rehber.",
    coverImage:
      "https://images.unsplash.com/photo-1622611935038-1c4caa0db5d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBjb250cmFjdG9yJTIwdGVhbSUyMG1lZXRpbmd8ZW58MXx8fHwxNzc0ODg0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    author: "SMMM Berna Arslan",
    authorTitle: "Serbest Mali Müşavir",
    publishedAt: "2026-02-12",
    readingTime: 4,
    tags: ["Başvuru Rehberi", "Mali Müşavir", "Pratik İpuçları"],
    content: `
<p>Banka referans mektubu, finans kuruluşunun firmanızı tanıdığını, hesap hareketlerinizin sağlıklı olduğunu ve belirlenen bir finansal kapasiteye sahip olduğunuzu yazılı olarak teyit ettiği resmi bir belgedir.</p>

<h2>Hangi Bankadan Alınmalı?</h2>
<p>Türkiye'de faaliyet gösteren ve BDDK lisanslı herhangi bir mevduat bankasından alınabilir. Uygulamada en az altı aydır aktif hesabınızın bulunduğu bankadan alınması tavsiye edilir.</p>

<h2>Başvuru Süreci</h2>
<ul>
  <li>Kurumsal bankacılık yetkilinizle randevu alın</li>
  <li>Mektubun hangi amaçla kullanılacağını (Müteahhitlik YKB Başvurusu) açıklayın</li>
  <li>İstenen finansal limiti belirtin (sınıfınıza göre değişir)</li>
  <li>Banka, genellikle 3–5 iş günü içinde mektubu hazırlar</li>
</ul>

<h2>Mektupta Bulunması Gerekenler</h2>
<ul>
  <li>Firmanızın unvanı ve vergi numarası</li>
  <li>Hesap açılış tarihi</li>
  <li>"Müşterimizi tanırız" ibaresi</li>
  <li>Banka kaşesi ve yetkili imzası</li>
  <li>Mektup tarihi (son 3 ay içinde olmalı)</li>
</ul>

<h2>Önemli Notlar</h2>
<p>Mektup, başvuru tarihinden en fazla 90 gün önce düzenlenmiş olmalıdır. Daha eski tarihli mektuplar sistem tarafından reddedilir. Mektubu aldıktan hemen sonra başvuru sürecinizi tamamlamaya özen gösterin.</p>
    `,
  },
];

// ── Custom post loader (localStorage'daki admin postları) ──
export function getCustomBlogPosts(): BlogPost[] {
  try {
    const raw = localStorage.getItem("admin_custom_blog_posts");
    if (!raw) return [];
    const posts = JSON.parse(raw) as Array<BlogPost & { published: boolean }>;
    return posts.filter(p => p.published !== false).map(p => ({ ...p, isCustom: true }));
  } catch { return []; }
}

export function getAllBlogPosts(): BlogPost[] {
  const custom = getCustomBlogPosts();
  const combined = [...custom, ...BLOG_POSTS];
  return combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}