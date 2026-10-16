import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import ContentPage from "./ContentPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import { coursesStore } from "../states/coursesStore";
import { mockGoto } from "../../../setupTests";

const profile = { id: 1, name: "Abdullah", email: "abdul@del.org" };

const content = (over: Record<string, any> = {}): any => ({
  id: 21,
  course_id: 5,
  title: "Bab 1",
  youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  my_status_finished: 0,
  ...over,
});

const course = (over: Record<string, any> = {}): any => ({
  id: 5,
  user_id: 2,
  title: "Kursus SvelteKit",
  description: "D",
  students: [1],
  contents: [
    { id: 21, course_id: 5, title: "Bab 1", youtube: "x", my_status_finished: 1 },
    { id: 22, course_id: 5, title: "Bab 2", youtube: "x", my_status_finished: 0 },
  ],
  ...over,
});

const q = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const flush = () => new Promise((r) => setTimeout(r, 0));

let contentSpy: ReturnType<typeof vi.spyOn>;
let courseSpy: ReturnType<typeof vi.spyOn>;

async function setup(c: any, crs: any = course(), props = { courseId: 5, contentId: 21 }) {
  contentSpy.mockImplementation((async () => {
    coursesStore.setContent(c);
    coursesStore.setIsContent(true);
  }) as any);
  courseSpy.mockImplementation((async () => {
    coursesStore.setCourse(crs);
  }) as any);
  const result = renderWithProviders(ContentPage, { props, preloadedState: { profile } });
  await flush();
  return result;
}

describe("ContentPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    contentSpy = vi.spyOn(coursesStore, "asyncSetContent");
    courseSpy = vi.spyOn(coursesStore, "asyncSetCourse");
  });

  it("should show a spinner while loading", async () => {
    contentSpy.mockReturnValue(new Promise(() => {}));
    courseSpy.mockReturnValue(new Promise(() => {}));
    const { wrapper } = renderWithProviders(ContentPage, {
      props: { courseId: 5, contentId: 21 },
      preloadedState: { profile },
    });
    await tick();
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("should go back to the course when the content is missing", async () => {
    contentSpy.mockImplementation((async () => {
      coursesStore.setContent(null);
      coursesStore.setIsContent(true);
    }) as any);
    courseSpy.mockResolvedValue(undefined);
    renderWithProviders(ContentPage, { props: { courseId: 5, contentId: 21 }, preloadedState: { profile } });
    await flush();
    expect(mockGoto).toHaveBeenCalledWith("/courses/5");
  });

  it("should load the content and course, then play the video", async () => {
    await setup(content());
    expect(contentSpy).toHaveBeenCalledWith(21);
    expect(courseSpy).toHaveBeenCalledWith(5);
    const player = q("content-player") as HTMLIFrameElement;
    expect(player.getAttribute("src")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(player.getAttribute("title")).toBe("Bab 1");
    expect(q("back-to-course-link")!.getAttribute("href")).toBe("/courses/5");
    expect(mockGoto).not.toHaveBeenCalled();
  });

  it("should warn about an invalid video link", async () => {
    await setup(content({ youtube: "https://example.com/x" }));
    expect(q("content-player")).toBeNull();
    expect(q("invalid-video")).not.toBeNull();
  });

  it("should render the playlist and navigate between contents", async () => {
    await setup(content());
    expect(q("playlist-item-21")!.className).toContain("text-indigo-700");
    expect(q("playlist-item-22")!.className).not.toContain("text-indigo-700");
    q("playlist-item-22")!.click();
    expect(mockGoto).toHaveBeenCalledWith("/courses/5/contents/22");
  });

  it("should handle a playlist-less course and ignore a stale course", async () => {
    await setup(content(), { id: 5, user_id: 2, title: "Tanpa Konten", description: "D", students: [1] });
    expect(document.querySelector("aside")!.querySelectorAll("li").length).toBe(0);
  });

  it("should hide the playlist when the loaded course is a different one", async () => {
    await setup(content(), course({ id: 99 }));
    expect(document.querySelector("aside")).toBeNull();
  });

  it("should mark a content as finished and unfinished for a student", async () => {
    const learn = vi.spyOn(coursesStore, "asyncLearnContent").mockResolvedValue(true);
    await setup(content());
    expect(q("toggle-learn-btn")!.textContent).toContain("Tandai Selesai");
    q("toggle-learn-btn")!.click();
    expect(learn).toHaveBeenCalledWith(21, 1);

    await setup(content({ my_status_finished: 1 }));
    expect(q("toggle-learn-btn")!.textContent).toContain("Selesai (batalkan)");
    q("toggle-learn-btn")!.click();
    expect(learn).toHaveBeenLastCalledWith(21, 0);
  });

  it("should not offer learning status to non-students or owners", async () => {
    await setup(content(), course({ students: [] }));
    expect(q("toggle-learn-btn")).toBeNull();
  });

  it("should not offer learning status to the owner", async () => {
    await setup(content(), course({ user_id: 1, students: [1] }));
    expect(q("toggle-learn-btn")).toBeNull();
  });

  it("should reload the content after the learning status changed", async () => {
    const { coursesStore: store } = await setup(content());
    contentSpy.mockClear();
    store.setIsContentChanged(true);
    await flush();
    expect(store.isContentChanged).toBe(false);
    expect(contentSpy).toHaveBeenCalledWith(21);
  });

  it("should reload when route params change", async () => {
    const { rerender } = await setup(content());
    await rerender({ courseId: 5, contentId: 22 });
    await flush();
    expect(contentSpy).toHaveBeenLastCalledWith(22);
  });

  it("should render a content without title and a course without playlist", async () => {
    await setup(content({ title: undefined }), course({ contents: undefined }));
    expect(q("playlist-item-21")).toBeNull();
  });

  it("should render a playlist item without title", async () => {
    await setup(content(), course({ contents: [{ id: 21, course_id: 5, youtube: "x" }] }));
    expect(q("playlist-item-21")).not.toBeNull();
  });
});
