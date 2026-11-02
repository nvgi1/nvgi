import { createFileRoute } from "@tanstack/react-router";
import { sitePage } from "@/lib/site-page";

export const Route = createFileRoute("/")({
  server: { handlers: { GET: async () => sitePage("home") } },
});
