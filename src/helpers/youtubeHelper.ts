const VIDEO_ID = /^[\w-]{11}$/;

export function getYoutubeEmbedUrl(link: string | null | undefined): string | null {
  if (!link) return null;

  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | undefined;

  if (host === "youtu.be") {
    id = parts[0];
  } else if (host === "youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v") ?? undefined;
    } else if (["embed", "shorts", "live"].includes(parts[0])) {
      id = parts[1];
    }
  }

  return id && VIDEO_ID.test(id) ? `https://www.youtube.com/embed/${id}` : null;
}
