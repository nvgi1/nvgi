import { createFileRoute } from "@tanstack/react-router";
import { sitePage } from "@/lib/site-page";

// Same water scene as Projects, showing only the NotePin tiles; reached by rising up from Home.
export const Route = createFileRoute("/notepin")({
  server: { handlers: { GET: async () => sitePage("notepin") } },
});
