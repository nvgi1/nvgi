import { createFileRoute } from "@tanstack/react-router";
import { siteHead, sitePage } from "@/lib/site-page";

export const Route = createFileRoute("/about")({
  head: () => siteHead("about"),
  server: { handlers: { GET: async () => sitePage("about") } },
});
