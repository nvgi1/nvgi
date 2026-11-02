import { createFileRoute } from "@tanstack/react-router";
import { sitePage } from "@/lib/site-page";

export const Route = createFileRoute("/projects")({
  server: { handlers: { GET: async () => sitePage("projects") } },
});
