import { createFileRoute } from "@tanstack/react-router";
import { sitePage } from "@/lib/site-page";

export const Route = createFileRoute("/contact")({
  server: { handlers: { GET: async () => sitePage("contact") } },
});
