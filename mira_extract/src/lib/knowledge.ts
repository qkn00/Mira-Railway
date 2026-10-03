import type { KnowledgeEntry } from "@/db/schema";

export type KnowledgeSeed = Omit<
  KnowledgeEntry,
  "id" | "createdAt" | "nodeName" | "docsUrl"
> & {
  nodeName: string;
  docsUrl?: string | null;
};

/**
 * Bilgi bankasi tohum verisi. Her kayıt bir hata kalıbını (patterns), nedenini
 * ve uygulanabilir çözüm adımlarını icerir. nodeId "any" ise tüm akış için
 * geçerli genel hatalardir.
 */
export const KNOWLEDGE_SEED: KnowledgeSeed[] = [
  // ---------------- Telegram Trigger ----------------
  {
    nodeId: "telegram-trigger",
    nodeName: "Telegram Trigger",
    category: "Bağlantı",
    title: "Telegram webhook / getUpdates cakismasi (409 Conflict)",
    patterns: ["409", "conflict", "terminated by other getUpdates", "webhook"],
    severity: "critical",
    cause:
      "Aynı bot token'ini kullanan başka bir istemci (ikinci bir n8n workflow'u, lokal script veya bot sunucusu) getUpdates ile polling yapiyor. Telegram aynı anda yalnizca tek bir update tuketicisine izin verir.",
    symptoms: [
      "Workflow hiç tetiklenmiyor",
      "Executions listesi boş kalıyor",
      "Bot elle test edildiginde yanıt veriyor ama akış çalışmıyor",
    ],
    fixSteps: [
      "Aynı bot token'ini kullanan tüm workflow'lari ve script'leri durdur",
      "https://api.telegram.org/bot<TOKEN>/deleteWebhook adresini bir kez çağır",
      "n8n'de workflow'u Deactivate edip tekrar Activate et",
      "Test yapiyorsan 'Listen for test event' oturumunu bastan başlat",
    ],
    docsUrl:
      "https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.telegram-trigger/",
  },
  {
    nodeId: "telegram-trigger",
    nodeName: "Telegram Trigger",
    category: "Bağlantı",
    title: "Webhook kaydı başarısız (EAI_AGAIN / ENOTFOUND)",
    patterns: ["eai_again", "enotfound", "getaddrinfo", "could not be started"],
    severity: "high",
    cause:
      "n8n orneginin disaridan erişilebilir public URL'si yok, WEBHOOK_URL degiskeni yanlış ya da reverse proxy (nginx / Cloudflare) istekleri engelliyor.",
    symptoms: [
      "Workflow aktif edildiginde hata veriyor",
      "Test URL acilmiyor",
      "Telegram tarafinda 'webhook was not set' donuyor",
    ],
    fixSteps: [
      "Ortam degiskeni WEBHOOK_URL degerinin instance adresini gosterdigini doğrula",
      "Proxy'de /webhook/ yolu ve HTTPS yonlendirmesinin açık olduğundan emin ol",
      "Cloudflare kullaniyorsa 'Under Attack' modunu kapat",
      "Workflow'u deactivate/activate ile yeniden kaydet",
    ],
    docsUrl: "https://docs.n8n.io/hosting/configuration/configuration-examples/webhook-url/",
  },
  {
    nodeId: "telegram-trigger",
    nodeName: "Telegram Trigger",
    category: "Kimlik",
    title: "Credential tanımlı degil veya yetkisiz",
    patterns: ["credential", "not set", "unauthorized", "401"],
    severity: "high",
    cause:
      "Telegram credential'i silinmiş, başka bir ortama taşınmış ya da bot token'i revoke edilmis.",
    symptoms: ["Düğüm üzerinde kırmızı uyarı", "401 Unauthorized donuyor"],
    fixSteps: [
      "Credentials sayfasinda Telegram kaydini aç",
      "Bot token'ini BotFather'dan doğrula (/mybots > API Token)",
      "Gerekirse yeni credential olusturup düğüme bagla",
    ],
  },

  // ---------------- Manuel Başlat ----------------
  {
    nodeId: "manual-trigger",
    nodeName: "Manuel Başlat",
    category: "Veri",
    title: "Test çalışması örnek veri uretmiyor",
    patterns: ["no data", "empty", "manual"],
    severity: "low",
    cause:
      "Manuel Başlat düğümü yalnizca sabit örnek veri dondurur; gercek Telegram mesajı gelmediği için Konu Seç boş kalıyor.",
    symptoms: ["Akış çalışıyor ama konu boş", "Konsolda 1 item görünüyor ama icerik yok"],
    fixSteps: [
      "Set düğümünde varsayılan konu değeri tanımla",
      "Gercek tetikleyiciyi kullanarak test et",
      "Execute workflow yerine 'Execute previous node' ile adım adım ilerle",
    ],
  },

  // ---------------- Konu Seç ----------------
  {
    nodeId: "topic-select",
    nodeName: "Konu Seç",
    category: "Veri",
    title: "Konu boş geliyor / expression hatası",
    patterns: ["undefined", "cannot read", "message.text", "empty"],
    severity: "medium",
    cause:
      "Gelen mesaj fotoğraf, sticker veya komut ise text alanı yoktur; expression hata verir ya da boş string dondurur.",
    symptoms: ["Konu alanı boş", "Code düğümünde undefined hatası", "Akış rastgele duruyor"],
    fixSteps: [
      "Expression'i optional chaining ile yaz: {{$json.message?.text ?? 'Genel'}}",
      "Mesaj tipini filtrelemek IF düğümü ekle",
      "Set düğümünde fallback (varsayılan) değer tanımla",
    ],
  },

  // ---------------- Script Parse ----------------
  {
    nodeId: "script-parse",
    nodeName: "Script Parse",
    category: "Veri",
    title: "Code düğümü item dondurmuyor",
    patterns: ["doesn't return", "no items", "return", "no output"],
    severity: "high",
    cause:
      "Code düğümü {json:{...}} yapisinda bir dizi dondurmuyor; n8n ciktiyi item olarak gördüğü için 'No items' uretiyor.",
    symptoms: ["Sonraki düğüme veri gitmiyor", "Executions 'success' ama boş"],
    fixSteps: [
      "return [{json:{...}}] formatini kullan",
      "Tüm dallari kapsayan en az bir return olduğundan emin ol",
      "console.log ile ciktiyi debug et (n8n loglarinda gorunur)",
    ],
    docsUrl: "https://docs.n8n.io/code/builtin/jmespath/",
  },
  {
    nodeId: "script-parse",
    nodeName: "Script Parse",
    category: "Veri",
    title: "JSON parse hatası (Unexpected token)",
    patterns: ["unexpected token", "json.parse", "syntaxerror", "not valid json"],
    severity: "high",
    cause:
      "AI/LLM ciktisindaki markdown kod bloglari veya ek metin, JSON.parse'i bozuyor.",
    symptoms: ["Senaryo bolunmuyor", "Kırmızı hata: Unexpected token <"],
    fixSteps: [
      "Metinden ilk { ile son } arasini regex ile çıkar",
      "```json ve ``` etiketlerini temizle",
      "try/catch ile bozuk çıktıya karşılık yedek senaryo uret",
    ],
  },
  {
    nodeId: "script-parse",
    nodeName: "Script Parse",
    category: "Zaman aşımı",
    title: "Kod zaman asimina ugruyor / bellek hatası",
    patterns: ["timed out", "timeout", "heap", "out of memory"],
    severity: "high",
    cause:
      "Çok büyük metinlerde agir regex/dongu kullanımı ya da varsayılan execution zaman asiminin kısa olması.",
    symptoms: ["Executions 'crashed' oluyor", "Işlem 1-2 dakikada düşüyor"],
    fixSteps: [
      "Workflow Settings > Error Workflow ve Execution Timeout değerlerini artır",
      "Büyük dizileri parcala (batch)",
      "Gereksiz ic ice donguleri kaldir",
    ],
  },

  // ---------------- Pexels ----------------
  {
    nodeId: "pexels-search",
    nodeName: "Pexels",
    category: "Oran",
    title: "Pexels 429 Too Many Requests",
    patterns: ["429", "rate limit", "too many requests"],
    severity: "high",
    cause:
      "Saatlik istek limiti aşıldı (varsayılan 200 istek/saat, günlük 20.000).",
    symptoms: ["HTTP 429 donuyor", "Arka arkaya çalıştırmalarda başarısız oluyor"],
    fixSteps: [
      "HTTP Request > Options > Retry on Fail (3-5 deneme, 1000 ms bekleme)",
      "Çalıştırmalar arasina Wait düğümü koy",
      "Arama sonuclarini cache'le (n8n cache veya Redis)",
    ],
    docsUrl: "https://www.pexels.com/api/documentation/",
  },
  {
    nodeId: "pexels-search",
    nodeName: "Pexels",
    category: "Kimlik",
    title: "Pexels 401 - geçersiz API anahtarı",
    patterns: ["401", "unauthorized", "api key", "authorization"],
    severity: "critical",
    cause:
      "Authorization header'i eksik, anahtar yanlış ya da query param'a yazilmis.",
    symptoms: ["401 Unauthorized", "Boş sonuç donuyor"],
    fixSteps: [
      "Header alanina Authorization: <API_KEY> ekle (query param degil)",
      "Anahtarı Pexels panelinden yenile",
      "Credential yerine header kullaniyorsan secret olarak sakla",
    ],
  },
  {
    nodeId: "pexels-search",
    nodeName: "Pexels",
    category: "Veri",
    title: "Arama boş sonuç döndürüyor",
    patterns: ["no results", "videos", "total_results"],
    severity: "medium",
    cause:
      "Konu çok dar veya Türkçe karakter iceriyor; Pexels Ingilizce anahtar kelimelerle daha iyi sonuç verir.",
    symptoms: ["Görsel üretilemiyor", "Template'te boş alanlar kalıyor"],
    fixSteps: [
      "Konuyu Ingilizce anahtar kelimelere ceviren bir Code düğümü ekle",
      "Yedek arama terimi listesi tanımla (fallback)",
      "per_page ve orientation=portrait parametrelerini kullan",
    ],
  },

  // ---------------- ElevenLabs ----------------
  {
    nodeId: "elevenlabs-tts",
    nodeName: "ElevenLabs Seslendirme",
    category: "Kimlik",
    title: "ElevenLabs 401 - xi-api-key geçersiz",
    patterns: ["401", "xi-api-key", "unauthorized", "invalid api key"],
    severity: "critical",
    cause:
      "API anahtarı hatalı, header adı yanlış (xi-api-key olmalı) ya da hesap askıya alinmis.",
    symptoms: ["Ses dosyası üretilmiyor", "401 donuyor"],
    fixSteps: [
      "Header adinin xi-api-key olduğundan emin ol",
      "Anahtarı ElevenLabs profil sayfasindan kopyala (boşluk bırakma)",
      "Hesap durumunu kontrol et",
    ],
    docsUrl: "https://elevenlabs.io/docs/api-reference/text-to-speech/convert",
  },
  {
    nodeId: "elevenlabs-tts",
    nodeName: "ElevenLabs Seslendirme",
    category: "Kota",
    title: "ElevenLabs karakter kotası / kredi bitti",
    patterns: ["quota", "character limit", "insufficient", "credits", "402"],
    severity: "critical",
    cause:
      "Ucretli planda aylik karakter limiti veya önceki donem kredileri tüketildi.",
    symptoms: ["Ses üretimi duruyor", "Hata mesajinda 'quota' geçiyor"],
    fixSteps: [
      "ElevenLabs panelinden kalan karakter/kredi miktarini gor",
      "Senaryoyu kisalt veya özetle",
      "Plan yükselt ya da yedek TTS sağlayıcı (Google/ Azure) ekle",
    ],
  },
  {
    nodeId: "elevenlabs-tts",
    nodeName: "ElevenLabs Seslendirme",
    category: "Veri",
    title: "422 - geçersiz voice_id veya model",
    patterns: ["422", "voice", "model", "unprocessable"],
    severity: "high",
    cause:
      "voice_id hesapta yok, silinmiş ya da seçilen model bu sesi desteklemiyor.",
    symptoms: ["422 Unprocessable Entity", "Varsayılan sesle çalışıyor"],
    fixSteps: [
      "voice_id'nin hesapta var olduğunu doğrula (GET /v1/voices)",
      "Türkçe için eleven_multilingual_v2 modelini seç",
      "Voice library'den yeni bir ses ekle",
    ],
  },

  // ---------------- Cloudinary ----------------
  {
    nodeId: "cloudinary-audio",
    nodeName: "Cloudinary ses yükle",
    category: "Kimlik",
    title: "Cloudinary imza / upload preset hatası",
    patterns: ["signature", "invalid", "upload preset", "cloud_name"],
    severity: "high",
    cause:
      "Upload preset 'signed' modda ama api secret gonderilmiyor; cloud_name yanlış.",
    symptoms: ["Yükleme başarısız", "Donen secure_url boş"],
    fixSteps: [
      "Upload preset'i 'Unsigned' yap ve unsigned upload kullan",
      "cloud_name değerini panelden doğrula",
      "Signed yükleme gerekiyorsa api_secret'i imzalama adimina ekle",
    ],
    docsUrl: "https://cloudinary.com/documentation/upload_images",
  },
  {
    nodeId: "cloudinary-audio",
    nodeName: "Cloudinary ses yükle",
    category: "Kota",
    title: "Ses dosyası çok büyük / 413",
    patterns: ["too large", "file size", "413", "payload"],
    severity: "medium",
    cause:
      "Free plan video/ses için dosya boyutu sınırı uygular; ElevenLabs çıktısı yüksek bitrate'te olabilir.",
    symptoms: ["413 Payload Too Large", "Yükleme yarida kalıyor"],
    fixSteps: [
      "Ses dosyasını 64 kbps mp3'e donustur (ffmpeg adimi)",
      "Cloudinary plan limitlerini kontrol et",
      "Binary property'yi doğru alandan gönder",
    ],
  },

  // ---------------- Merge ----------------
  {
    nodeId: "merge-1",
    nodeName: "Merqe1",
    category: "Veri",
    title: "Merge beklenen veriyi birlestirmiyor",
    patterns: ["merge", "missing", "combine", "input"],
    severity: "medium",
    cause:
      "Merge modu (Append / Combine / Choose branch) seçilen dallar için yanlış; iki input farklı item sayısı döndürüyor.",
    symptoms: ["Tek dal verisi geçiyor", "Ses veya görseller eksik kalıyor"],
    fixSteps: [
      "Mode'u Combine > Merge By Position yap (veya amaca göre Append)",
      "Her iki dalin da en az 1 item dondurdugunden emin ol",
      "Karmaşık eşleşmelerde Merge yerine Code düğümüyle birleştir",
    ],
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge/",
  },
  {
    nodeId: "merge-2",
    nodeName: "Merge2",
    category: "Veri",
    title: "Merge2 cikisinda item sayilari esit degil",
    patterns: ["merge", "position", "pair", "count"],
    severity: "medium",
    cause:
      "Ses tek item, görseller çok item döndürdüğü için konum eşleşmesi bozuluyor.",
    symptoms: ["Yalnizca ilk görsel kullanılıyor", "Ses tekrar ediyor"],
    fixSteps: [
      "Code düğümünde sesi görsel sayısınca çoğalt",
      "Combine by position yerine Combine by SQL/mode dene",
      "Debug için Merge cikisini incele",
    ],
  },

  // ---------------- Üretim Okuyucusu / Wait ----------------
  {
    nodeId: "ueretim-okuyucu",
    nodeName: "Üretim Okuyucusu",
    category: "Zaman aşımı",
    title: "Wait düğümünde akış takili kalıyor",
    patterns: ["wait", "resume", "stuck", "timeout"],
    severity: "high",
    cause:
      "Wait düğümü çalışmayı askıya alir; workflow aktif degilse ya da instance yeniden baslarsa kaldığı yerden devam etmez.",
    symptoms: ["Executions 'Waiting' durumunda kalıyor", "Kaldığı yerden devam etmiyor"],
    fixSteps: [
      "Bekleme süresini makul tut (maksimum 1 saat)",
      "Instance'in kalıcı (persistent) calistigindan emin ol",
      "Uzun beklemelerde Creatomate webhook'u + Resume Webhook kullan",
    ],
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/",
  },
  {
    nodeId: "wait-render",
    nodeName: "Renk bekke",
    category: "Zaman aşımı",
    title: "Render süresi bekleme süresini aşıyor",
    patterns: ["wait", "timeout", "render"],
    severity: "medium",
    cause:
      "Creatomate render kuyrugu yogunsa bekleme süresi yetersiz kalıyor; sonraki adım boş veri goruyor.",
    symptoms: ["Render durumu hala 'rendering'", "Çıktı boş geliyor"],
    fixSteps: [
      "Bekleme süresini render süresine göre artır",
      "Render durumunu sorgulayan bir IF döngüsü kur (polling)",
      "Creatomate webhook bildirimi ekle",
    ],
  },

  // ---------------- Görseller ----------------
  {
    nodeId: "images",
    nodeName: "Görseller",
    category: "Medya",
    title: "Görseller cekilemiyor (403 / hotlink)",
    patterns: ["403", "hotlink", "referer", "forbidden"],
    severity: "medium",
    cause:
      "Kaynak CDN doğrudan erisimi (hotlink) engelliyor veya User-Agent header'i eksik.",
    symptoms: ["Görsel indirilemiyor", "Template'te gri alanlar kalıyor"],
    fixSteps: [
      "Görselleri kendi depolama alanina (Cloudinary/S3) indir",
      "HTTP Request'a User-Agent header'i ekle",
      "Retry on Fail aç",
    ],
  },

  // ---------------- Code in JavaScript ----------------
  {
    nodeId: "code-js",
    nodeName: "Code in JavaScript",
    category: "Veri",
    title: "Cannot read properties of undefined",
    patterns: ["cannot read", "undefined", "null", "reference", "is not a function"],
    severity: "high",
    cause:
      "Önceki düğümün çıktı yapisi beklenenden farklı; alan adları (secure_url, url) degismis.",
    symptoms: ["Kod düğümü kırmızı hata veriyor", "JSON üretilmiyor"],
    fixSteps: [
      "$input.all() ile tüm item'lari al ve yapisini console.log ile incele",
      "Optional chaining kullan: item.json?.secure_url",
      "Alan adlarını önceki düğümün cikisina göre güncelle",
    ],
  },
  {
    nodeId: "code-js",
    nodeName: "Code in JavaScript",
    category: "Zaman aşımı",
    title: "Execution timeout - kod uzun suruyor",
    patterns: ["timed out", "timeout", "exceeded"],
    severity: "high",
    cause:
      "Agir donguler, beklenmeyen çok sayida item ya da varsayılan 60 sn execution limiti.",
    symptoms: ["Executions 'timed out' oluyor", "Yarım kalmiss JSON"],
    fixSteps: [
      "Workflow Settings > Execution Timeout değerini artır",
      "Işlemi batch'lere böl",
      "Gereksiz await/donguleri kaldir",
    ],
  },

  // ---------------- Creatomate ----------------
  {
    nodeId: "creatomate-video",
    nodeName: "Creatomate Video",
    category: "Render",
    title: "Creatomate render hatası - element bulunamadi",
    patterns: ["render", "element", "template", "source", "invalid"],
    severity: "high",
    cause:
      "Template'teki element adları (modifications) gonderilen JSON anahtarlariyla eşleşmiyor.",
    symptoms: ["Render 'failed' donuyor", "Videoda boş/eksik alanlar var"],
    fixSteps: [
      "Creatomate panelinde element adlarını ve modifications anahtarlarini karşılaştır",
      "template_id değerini doğrula",
      "Küçük bir test render alarak JSON'u iterate et",
    ],
    docsUrl: "https://creatomate.com/docs/api/rest-api/render",
  },
  {
    nodeId: "creatomate-video",
    nodeName: "Creatomate Video",
    category: "Kimlik",
    title: "Creatomate 401/403 - API key veya plan limiti",
    patterns: ["401", "403", "forbidden", "api key", "plan"],
    severity: "critical",
    cause:
      "API anahtarı geçersiz ya da planin aylik render dakikasi tüketilmiş.",
    symptoms: ["Render baslamiyor", "403 Forbidden donuyor"],
    fixSteps: [
      "API key'i Creatomate panelinden yenile",
      "Plan kullanımını (dakika/saniye) kontrol et",
      "Gerekirse plan yükselt veya render sikligini azalt",
    ],
  },
  {
    nodeId: "creatomate-video",
    nodeName: "Creatomate Video",
    category: "Zaman aşımı",
    title: "Render zaman aşımı (504 / ETIMEDOUT / ECONNRESET)",
    patterns: ["timed out", "timeout", "etimedout", "econnreset", "504", "socket hang up"],
    severity: "critical",
    cause:
      "Render işlemi uzun suruyor; HTTP istegi zaman asimina ugruyor veya bağlantı kopuyor.",
    symptoms: ["Executions 'crashed' / timeout", "Render başlamış ama sonuç alinamiyor"],
    fixSteps: [
      "Bekleme (Wait) süresini artır ve polling ile devam et",
      "Creatomate webhook bildirimi kullan (daha dayanıklı)",
      "HTTP Request timeout değerini 120 sn'ye çıkar",
    ],
  },
  {
    nodeId: "creatomate-render",
    nodeName: "Creatomate Render",
    category: "Render",
    title: "Render durumu 'succeeded' olmuyor",
    patterns: ["rendering", "succeeded", "status", "pending"],
    severity: "high",
    cause:
      "Render kuyrukta bekliyor; kaynak medya (ses/görsel) erişilebilir degil.",
    symptoms: ["Durum surekli 'rendering'", "Çıktı URL'i boş"],
    fixSteps: [
      "GET /v1/renders/{id} ile durumu sorgula",
      "Kaynak URL'lerin (Cloudinary, Pexels) herkese açık olduğundan emin ol",
      "Hatalı render'i iptal edip yeniden başlat",
    ],
  },
  {
    nodeId: "creatomate-render",
    nodeName: "Creatomate Render",
    category: "Veri",
    title: "Render ID bulunamadi (404)",
    patterns: ["404", "not found", "render id"],
    severity: "high",
    cause:
      "Önceki adimdan gelen alan adı yanlış (id yerine render_id vb.) veya render silinmiş.",
    symptoms: ["404 Not Found", "Sonraki adım çalışmıyor"],
    fixSteps: [
      "Önceki HTTP dugumunun çıkışındaki alan adını kontrol et",
      "Expression'i {{$json.id}} yerine doğru alana bagla",
      "Render'in Creatomate panelinde hala var olduğunu doğrula",
    ],
  },

  // ---------------- HTTP Request (final) ----------------
  {
    nodeId: "http-final",
    nodeName: "HTTP Request",
    category: "Bağlantı",
    title: "SSL / sertifika doğrulanamıyor",
    patterns: ["ssl", "self signed", "self-signed", "certificate", "unable to verify"],
    severity: "high",
    cause:
      "Hedef sunucu geçersiz/self-signed sertifika kullaniyor ya da proxy sertifikayi yeniliyor.",
    symptoms: ["SSL hatası", "Indirme başarısız"],
    fixSteps: [
      "Hedef sunucunun sertifikasini yenile",
      "Test ortaminda 'Ignore SSL Issues' secenegini gecici aç",
      "Proxy (nginx) zincir sertifikasini tamamla",
    ],
  },
  {
    nodeId: "http-final",
    nodeName: "HTTP Request",
    category: "Zaman aşımı",
    title: "Bağlantı zaman aşımı (ETIMEDOUT / ECONNREFUSED)",
    patterns: ["timed out", "timeout", "etimedout", "econnrefused", "esockettimedout"],
    severity: "high",
    cause:
      "Hedef sunucu yavaş, güvenlik duvarı engelliyor veya varsayılan zaman aşımı çok kısa.",
    symptoms: ["Indirme düşüyor", "Executions 'crashed'"],
    fixSteps: [
      "HTTP Request > Timeout değerini 30-60 sn yap",
      "Hedefin erişilebilirliklerini curl ile test et",
      "Retry on Fail (3 deneme) aç",
    ],
  },
  {
    nodeId: "http-final",
    nodeName: "HTTP Request",
    category: "Medya",
    title: "Video binary olarak inmiyor (boş dosya)",
    patterns: ["binary", "empty", "0 byte", "response format", "file"],
    severity: "high",
    cause:
      "Response Format 'JSON' birakilmis; dosya binary olarak alınmıyor ya da property adı eşleşmiyor.",
    symptoms: ["YouTube yüklemesi 0 byte dosya goruyor", "Indirilen veri boş"],
    fixSteps: [
      "Response Format = File seç ve Property Name'i data yap",
      "Sonraki düğümde binary property adını aynı yap",
      "Cozunen URL'in gercekten bir dosya dondurdugunu doğrula",
    ],
  },
  {
    nodeId: "http-final",
    nodeName: "HTTP Request",
    category: "Bağlantı",
    title: "Yönlendirme (301/302) takip edilmiyor",
    patterns: ["301", "302", "redirect", "moved"],
    severity: "low",
    cause:
      "Creatomate/Cloudinary çıktı URL'i yönlendiriyor; 'Follow redirect' kapali.",
    symptoms: ["Yanıt HTML donuyor", "Dosya indirilemiyor"],
    fixSteps: [
      "HTTP Request > Options > Follow Redirect aç",
      "Final URL'i doğrudan kullan",
    ],
  },

  // ---------------- Telegram send ----------------
  {
    nodeId: "telegram-send",
    nodeName: "Telegram",
    category: "Veri",
    title: "400 chat not found / bot engellendi",
    patterns: ["400", "chat not found", "blocked", "forbidden"],
    severity: "medium",
    cause:
      "chat_id yanlış, kullanıcı botu engellemis ya da gruptan çıkarılmış.",
    symptoms: ["Bildirim gitmiyor", "400 Bad Request donuyor"],
    fixSteps: [
      "chat_id değerini getUpdates ciktisindan doğrula",
      "Kullanıcının botu engellemediginden emin ol",
      "Grup kullaniyorsan botu admin yap",
    ],
  },
  {
    nodeId: "telegram-send",
    nodeName: "Telegram",
    category: "Veri",
    title: "Mesaj çok uzun (400/414)",
    patterns: ["too long", "414", "message is too long"],
    severity: "low",
    cause:
      "Senaryo tam metni bildirime eklenmiş ve Telegram'in 4096 karakter limitini asmis.",
    symptoms: ["Bildirim gönderilemiyor", "Hata 'message is too long'"],
    fixSteps: [
      "Bildirimi kisalt, yalnizca özet ve link gönder",
      "Uzun metni böl (sendMessage + devam mesajı)",
      "sendMediaGroup ile medya gönder",
    ],
  },

  // ---------------- YouTube ----------------
  {
    nodeId: "youtube-upload",
    nodeName: "Upload a video",
    category: "Kota",
    title: "YouTube kotası aşıldı (403 quotaExceeded)",
    patterns: ["quota", "uploadlimitexceeded", "dailylimit", "ratelimitexceeded", "403"],
    severity: "critical",
    cause:
      "YouTube Data API günlük 10.000 birim kotasini aşıyor; her video yüklemesi yaklasik 1.600 birim harcar. Kota Pasifik saati 00:00'da sıfırlanır.",
    symptoms: ["Yükleme reddediliyor", "403 quotaExceeded donuyor"],
    fixSteps: [
      "Google Cloud Console > APIs & Services > YouTube Data API v3 > Quota kullanımını kontrol et",
      "Günlük yükleme sayısını 3-5 video ile sınırla",
      "Kota artırımı talebi (quota extension) oluştür",
      "Acil durumda videoyi 'unlisted' yükleyip sonra public yap",
    ],
    docsUrl: "https://developers.google.com/youtube/v3/determine_quota_cost",
  },
  {
    nodeId: "youtube-upload",
    nodeName: "Upload a video",
    category: "Kimlik",
    title: "401 / invalid_grant - OAuth token süresi doldu",
    patterns: ["401", "invalid_grant", "token", "unauthorized", "refresh"],
    severity: "critical",
    cause:
      "Refresh token'i iptal edilmis, OAuth consent screen 'Testing' modunda (7 günlük token) ya da sifre degismis.",
    symptoms: ["Yetkilendirme hatası", "Credential kırmızı uyarı veriyor"],
    fixSteps: [
      "n8n credential'i kapat ve yeniden yetkilendir (Reconnect)",
      "Google Cloud > OAuth consent screen > Publishing status = Production yap",
      "Gerekli scope'ları ekle (youtube.upload)",
    ],
    docsUrl: "https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/",
  },
  {
    nodeId: "youtube-upload",
    nodeName: "Upload a video",
    category: "Medya",
    title: "400 - geçersiz video / isleme reddedildi",
    patterns: ["400", "invalid", "failed", "processing", "rejected"],
    severity: "high",
    cause:
      "Video codec/format uygun degil (mp4/H.264 onerilir) veya dosya tam inmamis.",
    symptoms: ["YouTube 'invalid video' donuyor", "Yükleme yarida kalıyor"],
    fixSteps: [
      "Creatomate ciktisinin mp4/H.264 olduğundan emin ol",
      "Önceki HTTP dugumunun dosyayı tam indirdiğini doğrula (0 byte degil)",
      "Başlık/açıklama karakter limitlerini kontrol et",
    ],
  },

  // ---------------- Genel ----------------
  {
    nodeId: "any",
    nodeName: "Tüm akış",
    category: "Bağlantı",
    title: "Workflow aktif degil",
    patterns: ["not active", "inactive", "deactivated"],
    severity: "critical",
    cause:
      "Workflow kaydedilmemis ya da Activate edilmemis; tetikleyiciler dinlemiyor.",
    symptoms: ["Telegram mesajlarına yanıt yok", "Executions üretilmiyor"],
    fixSteps: [
      "Sağ üstteki Publish / Activate dugmesine bas",
      "Workflow'un kaydedildigini doğrula (kaydetme cizgisi kalmamis)",
      "Aynı botu kullanan diger workflow'lari durdur",
    ],
  },
  {
    nodeId: "any",
    nodeName: "Tüm akış",
    category: "Zaman aşımı",
    title: "Self-hosted instance bellek / proses sorunu",
    patterns: ["heap", "memory", "killed", "eaddrinuse", "restart"],
    severity: "high",
    cause:
      "Video/binary veri bellek tüketiyor; Node.js heap limiti aşılıyor ya da container yeniden başlıyor.",
    symptoms: ["Çalışma ani kesiliyor", "Loglarda 'JavaScript heap out of memory'"],
    fixSteps: [
      "NODE_OPTIONS=--max-old-space-size değerini artır",
      "Büyük binary verileri dis depolamaya (S3/Cloudinary) tasi",
      "n8n'yi queue mode + worker ile calistir",
    ],
    docsUrl: "https://docs.n8n.io/hosting/scaling/overview/",
  },
  {
    nodeId: "any",
    nodeName: "Tüm akış",
    category: "Veri",
    title: "Import sonrasi düğüm sürümü uyuşmazlığı",
    patterns: ["node type", "unknown", "version", "could not find"],
    severity: "medium",
    cause:
      "JSON olarak ice aktarılan workflow, bu n8n sürümünde bilinmeyen düğüm tipi/versiyonu iceriyor.",
    symptoms: ["Düğümler '?' işaretiyle görünüyor", "Çalıştırmada 'node type not found'"],
    fixSteps: [
      "n8n'i son sürüme güncelle",
      "Eksik community dugumlerini kur (npm install)",
      "Workflow'u yeni surumde acip tekrar kaydet",
    ],
  },
];

/** Duzenleme sirasinda eklenen tek alanli kayıtları normalize et. */
export const KNOWLEDGE_SEED_NORMALIZED: KnowledgeSeed[] =
  KNOWLEDGE_SEED.map((entry) => ({
    ...entry,
    nodeName: entry.nodeName ?? entry.nodeId,
  }));
