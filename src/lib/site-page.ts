import home from "./site-pages/home.html?raw";
import contact from "./site-pages/contact.html?raw";
import projects from "./site-pages/projects.html?raw";
import world from "./site-pages/world.html?raw";
import notepin from "./site-pages/notepin.html?raw";
import story from "./site-pages/story.html?raw";
import assetMap from "./site-asset-map.json";
import worldAssets from "./reference-world-assets.json";

const pages = { home, contact, projects, world, notepin, story } as const;

const pageDetails = {
  home: ["Abdelrahman Studio — Websites, Systems & 3D Experiences", "A brand and digital studio in Riyadh, Dubai and Cairo. Crafting brands that command attention."],
  projects: ["Projects — Abdelrahman Studio", "Explore Abdelrahman Studio's websites, systems, brand work and immersive experiences."],
  contact: ["Contact — Abdelrahman Studio", "Start your next website, system or brand project with Abdelrahman Studio."],
  world: ["World — Inside Abdelrahman Studio", "Step inside Abdelrahman Studio's immersive world of brand and digital craft."],
  story: ["The Story — Abdelrahman Studio", "Discover the story behind Abdelrahman Studio, from the first idea to Riyadh, Dubai and Cairo."],
  notepin: ["NotePin — Studio Product Experience", "Explore the NotePin product in an immersive studio experience."],
} as const;

export function siteHead(name: keyof typeof pages) {
  const [title, description] = pageDetails[name];
  return { meta: [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] };
}

// Serves the exported site's original HTML at its original address, because the
// site's scripts choose the 3D scene from the current address.
export function sitePage(name: keyof typeof pages) {
  // Avoid a redirect for every bundled image, font, script and 3D asset.
  const sourceHtml = Object.entries(worldAssets).reduce(
    (document, [filename, url]) => document
      .replaceAll(`/site/assets/${filename}`, url)
      .replaceAll(`\\/site\\/assets\\/${filename}`, url),
    pages[name],
  );
  const html = sourceHtml
    .replace('href="/favicon.png"', 'href="/site/assets/favicon-32x32-1d5ggzi.png"')
    .replace(/\/wp-content\/[^\s"'<>?#)]+(?:\?[^\s"'<>)]*)?/g, (source) => {
      const path = source.split("?")[0];
      const filename = path?.split("/").pop() ?? "";
      const local = assetMap.files[filename as keyof typeof assetMap.files];
      if (!local) return source;
      const query = source.includes("?") ? source.slice(source.indexOf("?")) : "";
      return `/site/assets/${local}${query}`;
    })
    .replace("</head>", `<script>window.__dmAssetFiles=${JSON.stringify(assetMap.files)}</script></head>`);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Stop other sites from framing the site, and harden basic browser behaviour.
      "content-security-policy": "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
    },
  });
}
