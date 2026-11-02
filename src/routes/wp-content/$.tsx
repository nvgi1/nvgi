import { createFileRoute } from "@tanstack/react-router";
import siteMap from "@/lib/site-asset-map.json";

const map = siteMap as { files: Record<string, string>; external: Record<string, string> };

// The exported site's scripts request files by their original WordPress paths
// (/wp-content/...). Redirect each one to the downloaded copy in /site/assets.
export const Route = createFileRoute("/wp-content/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const splat = params._splat ?? "";
        const name = decodeURIComponent(splat.split("/").pop() ?? "");
        const local = map.files[name];
        const url = new URL(request.url);
        let target: string;
        if (local) target = `/site/assets/${local}${url.search}`;
        else if (map.external[name]) target = map.external[name];
        else target = `https://unseen.co/wp-content/${splat}${url.search}`;
        return new Response(null, {
          status: 302,
          headers: { location: target, "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
