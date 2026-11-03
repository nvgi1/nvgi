import { createFileRoute } from "@tanstack/react-router";
import { siteHead, sitePage } from "@/lib/site-page";

export const Route = createFileRoute("/contact")({
  head: () => siteHead("contact"),
  server: { handlers: { GET: async () => sitePage("contact") } },
});
