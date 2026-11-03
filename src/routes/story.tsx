import { createFileRoute } from "@tanstack/react-router";
import { siteHead, sitePage } from "@/lib/site-page";

export const Route = createFileRoute("/story")({
  head: () => siteHead("story"),
  server: { handlers: { GET: async () => sitePage("story") } },
});