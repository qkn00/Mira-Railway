export type NodeGroup = "trigger" | "data" | "media" | "ai" | "output" | "logic";

export interface WorkflowNode {
  id: string;
  name: string;
  nodeType: string;
  group: NodeGroup;
  icon: string;
  role: string;
  /** Düğümün akıştaki kritikligi ve kırılma olasılığı. */
  risk: "yüksek" | "orta" | "düşük";
  /** Sorun cikarsa önce bakilacak genel kontrol listesi. */
  checklist: string[];
  x: number;
  y: number;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export const WORKFLOW_META = {
  name: "Bilgi Dozu - YouTube Shorts Otomasyonu (Temel)",
  instance: "youtusho.app.n8n.cloud",
  state: "Taslak (Publish edilmedi)",
  executions: "1/1000 Executions",
  trialDaysLeft: 13,
  description:
    "Telegram'dan gelen konu bilgisinden başlayıp; senaryo, seslendirme, görsel ve video uretimini otomatiklestirip YouTube Shorts'a yukleyen temel akış.",
};

export const WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: "telegram-trigger",
    name: "Telegram Trigger",
    nodeType: "n8n-nodes-base.telegramTrigger",
    group: "trigger",
    icon: "✈️",
    role: "Telegram mesajını dinler ve akışı başlatır.",
    risk: "yüksek",
    checklist: [
      "Workflow sağ tik > Active durumda mi?",
      "Aynı bot token'ini kullanan başka calisan bir workflow var mi?",
      "Production URL yerine Test URL kullaniyorsan test oturumu açık mi?",
      "Bot yetkisi: gruba ekli ve mesajları okuyabiliyor mu?",
    ],
    x: 40,
    y: 20,
  },
  {
    id: "manual-trigger",
    name: "Manuel Başlat",
    nodeType: "n8n-nodes-base.manualTrigger",
    group: "trigger",
    icon: "▶️",
    role: "Elle test calistirmasi için sabit örnek veri üretir.",
    risk: "düşük",
    checklist: [
      "Örnek veri (sample data) bagli mi?",
      "Testte 'Execute workflow' ile mi çalıştırılıyor?",
      "Uretimde tetikleyici olarak kullanılmamalı",
    ],
    x: 40,
    y: 170,
  },
  {
    id: "topic-select",
    name: "Konu Seç",
    nodeType: "n8n-nodes-base.set",
    group: "data",
    icon: "🏷️",
    role: "Mesaj metninden konuyu ayiklar ve varsayılan değer atar.",
    risk: "orta",
    checklist: [
      "Expression doğru alanı okuyor mu ({{$json.message.text}})?",
      "Fotoğraf/sticker mesajlarinda .text alanı boş gelebilir",
      "Boş konu geldiginde varsayılan değer tanımlı mi?",
    ],
    x: 250,
    y: 95,
  },
  {
    id: "script-parse",
    name: "Script Parse",
    nodeType: "n8n-nodes-base.code",
    group: "logic",
    icon: "📜",
    role: "Senaryo metnini parcalar; sahne, metin ve anahtar kelimeleri çıkarır.",
    risk: "yüksek",
    checklist: [
      "Kod her zaman {json:{...}} iceren bir dizi döndürüyor mu?",
      "LLM/AI ciktisindaki ```json ... ``` bloklari temizleniyor mu?",
      "return ifadesi tüm dallarda mi?",
    ],
    x: 460,
    y: 95,
  },
  {
    id: "pexels-search",
    name: "Pexels",
    nodeType: "n8n-nodes-base.httpRequest",
    group: "media",
    icon: "🖼️",
    role: "Konuyla ilgili stok video/görselleri arar.",
    risk: "orta",
    checklist: [
      "Authorization header'i doğru mu?",
      "Retry on Fail açık mi (429 için)?",
      "Sonuç boş gelirse yedek arama terimi var mi?",
    ],
    x: 670,
    y: 20,
  },
  {
    id: "elevenlabs-tts",
    name: "ElevenLabs Seslendirme",
    nodeType: "n8n-nodes-base.httpRequest",
    group: "ai",
    icon: "🔊",
    role: "Senaryo metnini Turkce ses dosyasina cevirir.",
    risk: "yüksek",
    checklist: [
      "xi-api-key geçerli mi?",
      "voice_id hesapta tanımlı mi?",
      "Aylik karakter kotası dolmamış mi?",
    ],
    x: 670,
    y: 220,
  },
  {
    id: "merge-1",
    name: "Merqe1",
    nodeType: "n8n-nodes-base.merge",
    group: "logic",
    icon: "🔀",
    role: "Görselleri ve ses dosyasını tek akışta birleştirir.",
    risk: "orta",
    checklist: [
      "Merge modu (Append / Combine) amaca uygun mu?",
      "Her iki dal da en az 1 item döndürüyor mu?",
      "Item eşleşmesi (by position / by key) doğru mu?",
    ],
    x: 880,
    y: 60,
  },
  {
    id: "cloudinary-audio",
    name: "Cloudinary ses yükle",
    nodeType: "n8n-nodes-base.httpRequest",
    group: "media",
    icon: "☁️",
    role: "Ses dosyasını creatomate kullanabilsin diye public URL'e yükler.",
    risk: "yüksek",
    checklist: [
      "Upload preset ve cloud_name doğru mu?",
      "resource_type video mu (ses dosyalari için)?",
      "Donen secure_url alanı sonraki adima geçiyor mu?",
    ],
    x: 880,
    y: 260,
  },
  {
    id: "ueretim-okuyucu",
    name: "Üretim Okuyucusu",
    nodeType: "n8n-nodes-base.wait",
    group: "logic",
    icon: "⏳",
    role: "Ses süresine göre bekleme yapip video süresini sabitler.",
    risk: "orta",
    checklist: [
      "Bekleme süresi 1 saati asmiyor mu?",
      "Workflow bekleme boyunca aktif kalıyor mu?",
      "Instance yeniden baslarsa kaldığı yerden devam edemez",
    ],
    x: 1090,
    y: 60,
  },
  {
    id: "images",
    name: "Görseller",
    nodeType: "n8n-nodes-base.httpRequest",
    group: "media",
    icon: "🎞️",
    role: "Sahne bazinda görsel URL'lerini toplar.",
    risk: "orta",
    checklist: [
      "Kaynak CDN doğrudan erisime izin veriyor mu (hotlink)?",
      "Cozunurluk ve oran (9:16) uygun mu?",
      "Görsel binary olarak mi indiriliyor?",
    ],
    x: 1090,
    y: 260,
  },
  {
    id: "merge-2",
    name: "Merge2",
    nodeType: "n8n-nodes-base.merge",
    group: "logic",
    icon: "🔀",
    role: "Ses ve görsel verilerini kod dügümüne hazirlar.",
    risk: "orta",
    checklist: [
      "Iki input'un item sayilari esit mi?",
      "Ses URL'i ve görsel dizisi aynı item içinde mi?",
      "Bekleme dügümünden gelen veri boş kalmis olabilir",
    ],
    x: 1300,
    y: 160,
  },
  {
    id: "code-js",
    name: "Code in JavaScript",
    nodeType: "n8n-nodes-base.code",
    group: "logic",
    icon: "💻",
    role: "Creatomate template'ine gidecek JSON'u insa eder.",
    risk: "yüksek",
    checklist: [
      "$input.all() ile tüm item'lar mi alınıyor?",
      "Optional chaining (?.) kullanılıyor mu?",
      "Üretilen JSON Creatomate semasina uyuyor mu?",
    ],
    x: 1510,
    y: 20,
  },
  {
    id: "creatomate-video",
    name: "Creatomate Video",
    nodeType: "n8n-nodes-base.httpRequest",
    group: "media",
    icon: "🎬",
    role: "Video render işini başlatır.",
    risk: "yüksek",
    checklist: [
      "template_id doğru mu?",
      "Element adları (modifications) template ile eşleşiyor mu?",
      "API key ve plan limiti aktif mi?",
    ],
    x: 1510,
    y: 220,
  },
  {
    id: "merge-3",
    name: "Merqe",
    nodeType: "n8n-nodes-base.merge",
    group: "logic",
    icon: "🔀",
    role: "Render bilgisini ve medya bağlantılarını birleştirir.",
    risk: "orta",
    checklist: [
      "Render id'si doğru alan adından mi okunuyor?",
      "Bekleme dügümünden sonra veri kaybolmuyor mu?",
    ],
    x: 1720,
    y: 120,
  },
  {
    id: "wait-render",
    name: "Renk bekke",
    nodeType: "n8n-nodes-base.wait",
    group: "logic",
    icon: "⏱️",
    role: "Render'in tamamlanması için bekler.",
    risk: "orta",
    checklist: [
      "Bekleme süresi render suresinden uzun mu?",
      "Uzun render'larda webhook/polling daha güvenli",
      "Wait sonrasi veri boş kalıyor olabilir",
    ],
    x: 1930,
    y: 120,
  },
  {
    id: "creatomate-render",
    name: "Creatomate Render",
    nodeType: "n8n-nodes-base.httpRequest",
    group: "media",
    icon: "🌐",
    role: "Render durumunu sorgular / çıktı URL'ini alir.",
    risk: "yüksek",
    checklist: [
      "GET /v1/renders/{id} yaniti 'succeeded' mi?",
      "Render id önceki adimdan doğru geçiyor mu?",
      "URL erişilebilir ve tam indirilebiliyor mu?",
    ],
    x: 2140,
    y: 120,
  },
  {
    id: "http-final",
    name: "HTTP Request",
    nodeType: "n8n-nodes-base.httpRequest",
    group: "media",
    icon: "🔗",
    role: "Render edilmis video dosyasını indirir.",
    risk: "yüksek",
    checklist: [
      "Response format: File (binary) mi?",
      "Binary property adı sonraki düğümle eşleşiyor mu?",
      "Zaman aşımı ve retry ayarlari yeterli mi?",
    ],
    x: 2350,
    y: 120,
  },
  {
    id: "telegram-send",
    name: "Telegram",
    nodeType: "n8n-nodes-base.telegram",
    group: "output",
    icon: "📨",
    role: "Üretilen videonun baglantisini sohbete gönderir.",
    risk: "düşük",
    checklist: [
      "chat_id doğru mu?",
      "Kullanıcı botu engellememis mi?",
      "Mesaj uzunluk limitini asmiyor mu?",
    ],
    x: 2560,
    y: 20,
  },
  {
    id: "youtube-upload",
    name: "Upload a video",
    nodeType: "n8n-nodes-base.youTube",
    group: "output",
    icon: "📺",
    role: "Videoyu YouTube Shorts'a yükler.",
    risk: "yüksek",
    checklist: [
      "OAuth credential yeniden yetkilendirildi mi?",
      "Günlük YouTube API kotası (10.000 birim) dolmamış mi?",
      "Video binary olarak geliyor ve 0 byte degil mi?",
    ],
    x: 2560,
    y: 220,
  },
];

export const WORKFLOW_EDGES: WorkflowEdge[] = [
  { from: "telegram-trigger", to: "topic-select" },
  { from: "manual-trigger", to: "topic-select" },
  { from: "topic-select", to: "script-parse" },
  { from: "script-parse", to: "pexels-search" },
  { from: "script-parse", to: "elevenlabs-tts" },
  { from: "elevenlabs-tts", to: "cloudinary-audio" },
  { from: "cloudinary-audio", to: "merge-1" },
  { from: "pexels-search", to: "merge-1" },
  { from: "merge-1", to: "ueretim-okuyucu" },
  { from: "ueretim-okuyucu", to: "images" },
  { from: "ueretim-okuyucu", to: "merge-2" },
  { from: "images", to: "merge-2" },
  { from: "merge-2", to: "code-js" },
  { from: "code-js", to: "merge-3" },
  { from: "images", to: "merge-3" },
  { from: "merge-3", to: "creatomate-video" },
  { from: "creatomate-video", to: "wait-render" },
  { from: "wait-render", to: "creatomate-render" },
  { from: "creatomate-render", to: "http-final" },
  { from: "http-final", to: "telegram-send" },
  { from: "http-final", to: "youtube-upload" },
];

export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 62;
export const CANVAS_WIDTH = 2560 + NODE_WIDTH + 60;
export const CANVAS_HEIGHT = 260 + NODE_HEIGHT + 40;

export const GROUP_LABELS: Record<NodeGroup, string> = {
  trigger: "Tetikleyici",
  data: "Veri hazirlik",
  logic: "Mantik / Kod",
  media: "Medya",
  ai: "Yapay zeka",
  output: "Çıktı",
};

export const GROUP_STYLES: Record<NodeGroup, string> = {
  trigger: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  data: "border-violet-400/40 bg-violet-400/10 text-violet-200",
  logic: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  media: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  ai: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-200",
  output: "border-rose-400/40 bg-rose-400/10 text-rose-200",
};

export const SYMPTOM_OPTIONS = [
  {
    value: "çalışmıyor",
    label: "Çalışmıyor / tetiklenmiyor",
    categories: ["Bağlantı", "Kimlik", "Veri"],
  },
  {
    value: "yetki",
    label: "Kimlik doğrulama / yetki hatası",
    categories: ["Kimlik"],
  },
  {
    value: "zaman-aşımı",
    label: "Zaman aşımı / takiliyor",
    categories: ["Zaman aşımı"],
  },
  {
    value: "hatalı-çıktı",
    label: "Hatalı veya eksik çıktı",
    categories: ["Veri", "Render", "Medya"],
  },
  {
    value: "limit",
    label: "Limit / kota sorunu",
    categories: ["Kota", "Oran"],
  },
  {
    value: "diger",
    label: "Diger",
    categories: [],
  },
];

export function getNode(id: string): WorkflowNode | undefined {
  return WORKFLOW_NODES.find((node) => node.id === id);
}

export function getNodeName(id: string): string {
  return getNode(id)?.name ?? id;
}

export function edgePath(from: WorkflowNode, to: WorkflowNode): string {
  const startX = from.x + NODE_WIDTH;
  const startY = from.y + NODE_HEIGHT / 2;
  const endX = to.x;
  const endY = to.y + NODE_HEIGHT / 2;
  const delta = Math.max(60, Math.abs(endX - startX) / 2);
  return `M ${startX} ${startY} C ${startX + delta} ${startY}, ${endX - delta} ${endY}, ${endX} ${endY}`;
}
