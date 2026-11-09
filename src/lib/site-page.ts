import home from "./site-pages/home.html?raw";
import contact from "./site-pages/contact.html?raw";
import projects from "./site-pages/projects.html?raw";
import world from "./site-pages/world.html?raw";
import notepin from "./site-pages/notepin.html?raw";
import story from "./site-pages/story.html?raw";
import about from "./site-pages/about.html?raw";
import assetMap from "./site-asset-map.json";
import worldAssets from "./reference-world-assets.json";

const pages = { home, contact, projects, world, notepin, story, about } as const;

const pageDetails = {
  home: ["Nagi Alnoor Khalifa | Medical Equipment Engineer & Web Developer", "ناجي النور خليفة – مهندس معدات طبية ومطور ويب. اكتشف ملفي المهني، خلفيتي الأكاديمية في هندسة المعدات الطبية، ومشاريعي في تطوير المواقع والأنظمة الرقمية وتصميم التجارب التفاعلية.", "Nagi Alnoor Khalifa — Engineering Meets Technology", "website"],
  projects: ["Projects | Nagi Alnoor Khalifa — Web Developer", "مشاريع ناجي النور خليفة في تطوير المواقع والأنظمة الرقمية وتصميم التجارب التفاعلية.", "Projects by Nagi Alnoor Khalifa — Web Development & Interactive Experiences", "website"],
  contact: ["Contact | Nagi Alnoor Khalifa", "تواصل مع ناجي النور خليفة، مهندس معدات طبية ومطور ويب، عبر واتساب أو البريد الإلكتروني.", "Contact Nagi Alnoor Khalifa", "website"],
  world: ["World | NAGI — Nagi Alnoor Khalifa", "تجربة تفاعلية ثلاثية الأبعاد من تصميم ناجي النور خليفة تجمع بين الهندسة والتقنية.", "The World of NAGI — Interactive 3D Experience", "website"],
  story: ["Story | Nagi Alnoor Khalifa", "قصة ناجي النور خليفة: من هندسة المعدات الطبية إلى تطوير الويب وبناء التجارب الرقمية.", "The Story of Nagi Alnoor Khalifa", "article"],
  about: ["About | Nagi Alnoor Khalifa — Medical Equipment Engineer", "الملف المهني لناجي النور خليفة: الخلفية الأكاديمية في هندسة المعدات الطبية، الخبرات، الشهادات، والسيرة الذاتية.", "About Nagi Alnoor Khalifa — Medical Equipment Engineer & Web Developer", "profile"],
  notepin: ["NotePin Experience | NAGI", "تجربة عرض تفاعلية لمنتج NotePin ضمن موقع NAGI.", "NotePin Experience | NAGI", "website"],
} as const;

export function siteHead(name: keyof typeof pages) {
  const [title, description, ogTitle, ogType] = pageDetails[name];
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { name: "twitter:card", content: "summary" },
    ],
  };
}

// Serves the exported site's original HTML at its original address, because the
// site's scripts choose the 3D scene from the current address.
export function sitePage(name: keyof typeof pages) {
  // Avoid a redirect for every bundled image, font, script and 3D asset.
  const sourceHtml = Object.entries(worldAssets).reduce(
    (document, [filename, url]) =>
      document
        .replaceAll(`/site/assets/${filename}`, url)
        .replaceAll(`\\/site\\/assets\\/${filename}`, url),
    pages[name],
  );
  const html = sourceHtml
    .replace(/\/wp-content\/[^\s"'<>?#)]+(?:\?[^\s"'<>)]*)?/g, (source) => {
      const path = source.split("?")[0];
      const filename = path?.split("/").pop() ?? "";
      const local = assetMap.files[filename as keyof typeof assetMap.files];
      if (!local) return source;
      const query = source.includes("?") ? source.slice(source.indexOf("?")) : "";
      return `/site/assets/${local}${query}`;
    })
    .replace(
      "</head>",
      `<script>window.__dmAssetFiles=${JSON.stringify(assetMap.files)}</script></head>`,
    );
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Stop other sites from framing the site, and harden basic browser behaviour.
      "content-security-policy":
        "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
    },
  });
}
