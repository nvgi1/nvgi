import { createFileRoute } from "@tanstack/react-router";
import { siteHead, sitePage } from "@/lib/site-page";

export const Route = createFileRoute("/projects")({
  head: () => siteHead("projects"),
  server: { handlers: { GET: async () => sitePage("projects") } },
});
