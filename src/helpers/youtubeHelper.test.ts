import { describe, it, expect } from "vitest";
import { getYoutubeEmbedUrl } from "./youtubeHelper";

const EMBED = "https://www.youtube.com/embed/dQw4w9WgXcQ";

describe("getYoutubeEmbedUrl", () => {
  it("should return null for empty values", () => {
    expect(getYoutubeEmbedUrl(null)).toBeNull();
    expect(getYoutubeEmbedUrl(undefined)).toBeNull();
    expect(getYoutubeEmbedUrl("")).toBeNull();
  });

  it("should return null for malformed urls", () => {
    expect(getYoutubeEmbedUrl("bukan url")).toBeNull();
  });

  it("should convert watch urls", () => {
    expect(getYoutubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(EMBED);
    expect(getYoutubeEmbedUrl(" https://m.youtube.com/watch?v=dQw4w9WgXcQ ")).toBe(EMBED);
  });

  it("should return null for watch urls without video id", () => {
    expect(getYoutubeEmbedUrl("https://www.youtube.com/watch")).toBeNull();
  });

  it("should convert youtu.be urls", () => {
    expect(getYoutubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe(EMBED);
  });

  it("should convert embed, shorts, and live urls", () => {
    expect(getYoutubeEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(EMBED);
    expect(getYoutubeEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(EMBED);
    expect(getYoutubeEmbedUrl("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(EMBED);
  });

  it("should reject other paths, hosts, and invalid ids", () => {
    expect(getYoutubeEmbedUrl("https://www.youtube.com/playlist?list=abc")).toBeNull();
    expect(getYoutubeEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(getYoutubeEmbedUrl("https://youtu.be/pendek")).toBeNull();
    expect(getYoutubeEmbedUrl("https://youtu.be/")).toBeNull();
  });
});
