import { createFileRoute } from "@tanstack/react-router";
import { siteHead, sitePage } from "@/lib/site-page";

export const Route = createFileRoute("/")({
  head: () => siteHead("home"),
  server: { handlers: { GET: async () => sitePage("home") } },
});
