import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";
import { mockGoto } from "../../../setupTests";

const profile = { id: 1, name: "Abdullah", email: "abdul@del.org" };

const fullCourse = (over: Record<string, any> = {}): any => ({
  id: 5,
  user_id: 2,
  title: "Kursus SvelteKit",
  description: "Deskripsi **tebal**",
  cover: "https://example.com/cover.jpg",
  updated_at: "2024-02-26T02:44:47.000000Z",
  author: { name: "Budi" },
  students: [],
  avg_ratings: 4,
  my_percentage_finished: 50,
  contents: [
    { id: 21, course_id: 5, title: "Bab 1", youtube: "https://youtu.be/dQw4w9WgXcQ", my_status_finished: 1 },
    { id: 22, course_id: 5, title: "Bab 2", youtube: "https://youtu.be/dQw4w9WgXcQ", my_status_finished: 0 },
  ],
  ratings: [{ name: "Ani", ratings: 5, comment: "Mantap" }],
  ...over,
});

const OWNER = { user_id: 1 };
const STUDENT = { students: [1] };

const q = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const flush = () => new Promise((r) => setTimeout(r, 0));

let loadSpy: ReturnType<typeof vi.spyOn>;

function mockLoad(course: any) {
  loadSpy.mockImplementation((async () => {
    coursesStore.setCourse(course);
    coursesStore.setIsCourse(true);
  }) as any);
}

async function setup(course: any, props: Record<string, any> = { courseId: 5 }) {
  mockLoad(course);
  const result = renderWithProviders(DetailPage, { props, preloadedState: { profile } });
  await flush();
  return result;
}

describe("DetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    loadSpy = vi.spyOn(coursesStore, "asyncSetCourse");
  });

  it("should show a spinner while the course is loading", async () => {
    loadSpy.mockReturnValue(new Promise(() => {}));
    const { wrapper } = renderWithProviders(DetailPage, {
      props: { courseId: 5 },
      preloadedState: { profile },
    });
    await tick();
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("should return to the home page when the course does not exist", async () => {
    loadSpy.mockImplementation((async () => {
      coursesStore.setCourse(null);
      coursesStore.setIsCourse(true);
    }) as any);
    renderWithProviders(DetailPage, { props: { courseId: 5 }, preloadedState: { profile } });
    await flush();
    expect(mockGoto).toHaveBeenCalledWith("/");
  });

  it("should not redirect when the course is found", async () => {
    await setup(fullCourse());
    expect(loadSpy).toHaveBeenCalledWith(5);
    expect(mockGoto).not.toHaveBeenCalled();
  });

  it("should reload when the course id changes", async () => {
    const { rerender } = await setup(fullCourse());
    await rerender({ courseId: 6 });
    await flush();
    expect(loadSpy).toHaveBeenLastCalledWith(6);
  });

  it("should render course information with a cover", async () => {
    await setup(fullCourse());
    expect(document.body.textContent).toContain("Kursus SvelteKit");
    expect(q("course-detail-author")!.textContent).toContain("Budi");
    expect(q("course-detail-students")!.textContent).toContain("0 peserta");
    expect(document.querySelector("img")!.getAttribute("src")).toBe("https://example.com/cover.jpg");
    expect(q("course-detail-description")!.textContent).toContain("Deskripsi **tebal**");
    expect(q("back-to-courses-link")).not.toBeNull();
  });

  it("should render a minimal course with every optional field missing", async () => {
    await setup({ id: 5, user_id: 2, title: "Minimal", description: "D", students: [1] });
    expect(document.querySelector("img")).toBeNull();
    expect(q("course-detail-author")!.textContent).toContain("-");
    expect(q("course-progress")!.textContent).toContain("0%");
    expect(q("no-contents")).not.toBeNull();
    expect(q("no-ratings")).not.toBeNull();
  });

  it("should render a course without students list", async () => {
    await setup({ id: 5, user_id: 2, title: "Minimal", description: "D" });
    expect(q("course-detail-students")!.textContent).toContain("0 peserta");
    expect(q("join-course-btn")).not.toBeNull();
  });

  describe("as owner", () => {
    it("should show owner controls only", async () => {
      await setup(fullCourse(OWNER));
      expect(q("edit-cover-btn")).not.toBeNull();
      expect(q("edit-course-btn")).not.toBeNull();
      expect(q("delete-course-btn")).not.toBeNull();
      expect(q("add-content-btn")).not.toBeNull();
      expect(q("edit-content-21")).not.toBeNull();
      expect(q("join-course-btn")).toBeNull();
      expect(q("leave-course-btn")).toBeNull();
      expect(q("submit-rating-btn")).toBeNull();
      expect(q("course-progress")).toBeNull();
    });

    it("should prefer the owner interface when the owner is also a student", async () => {
      await setup(fullCourse({ user_id: 1, students: [1] }));
      expect(q("edit-course-btn")).not.toBeNull();
      expect(q("leave-course-btn")).toBeNull();
      expect(q("submit-rating-btn")).toBeNull();
      expect(q("course-progress")).toBeNull();
      expect(q("open-content-21")).not.toBeNull();
    });

    it("should open and close the cover, edit, and add-content modals", async () => {
      await setup(fullCourse(OWNER));

      q("edit-cover-btn")!.click();
      await tick();
      expect(q("change-cover-modal")).not.toBeNull();
      q("close-cover-modal-btn")!.click();
      await tick();
      expect(q("change-cover-modal")).toBeNull();

      q("edit-course-btn")!.click();
      await tick();
      expect(q("change-course-modal")).not.toBeNull();
      q("close-change-modal-btn")!.click();
      await tick();
      expect(q("change-course-modal")).toBeNull();

      q("add-content-btn")!.click();
      await tick();
      expect(q("content-modal")).not.toBeNull();
      expect((q("content-title-input") as HTMLInputElement).value).toBe("");
      q("close-content-modal-btn")!.click();
      await tick();
      expect(q("content-modal")).toBeNull();
    });

    it("should open the content modal prefilled when editing a content", async () => {
      await setup(fullCourse(OWNER));
      q("edit-content-22")!.click();
      await tick();
      expect((q("content-title-input") as HTMLInputElement).value).toBe("Bab 2");

      q("close-content-modal-btn")!.click();
      await tick();
      q("add-content-btn")!.click();
      await tick();
      expect((q("content-title-input") as HTMLInputElement).value).toBe("");
    });

    it("should delete the course after confirmation and go home", async () => {
      vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true } as any);
      const del = vi.spyOn(coursesStore, "asyncDeleteCourse").mockResolvedValue(true);
      await setup(fullCourse(OWNER));

      q("delete-course-btn")!.click();
      await flush();
      expect(del).toHaveBeenCalledWith(5);
      expect(mockGoto).toHaveBeenCalledWith("/");
    });

    it("should stay when deletion fails or is declined", async () => {
      const confirm = vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true } as any);
      const del = vi.spyOn(coursesStore, "asyncDeleteCourse").mockResolvedValue(false);
      await setup(fullCourse(OWNER));

      q("delete-course-btn")!.click();
      await flush();
      expect(mockGoto).not.toHaveBeenCalled();

      confirm.mockResolvedValue({ isConfirmed: false } as any);
      del.mockClear();
      q("delete-course-btn")!.click();
      await flush();
      expect(del).not.toHaveBeenCalled();
    });

    it("should delete a content after confirmation only", async () => {
      const confirm = vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true } as any);
      const del = vi.spyOn(coursesStore, "asyncDeleteContent").mockResolvedValue(true);
      await setup(fullCourse(OWNER));

      q("delete-content-21")!.click();
      await flush();
      expect(del).toHaveBeenCalledWith(21);

      del.mockClear();
      confirm.mockResolvedValue({ isConfirmed: false } as any);
      q("delete-content-21")!.click();
      await flush();
      expect(del).not.toHaveBeenCalled();
    });
  });

  describe("as student", () => {
    it("should show student controls and progress", async () => {
      await setup(fullCourse(STUDENT));
      expect(q("leave-course-btn")).not.toBeNull();
      expect(q("submit-rating-btn")).not.toBeNull();
      expect(q("course-progress")!.textContent).toContain("50%");
      expect(q("edit-course-btn")).toBeNull();
      expect(q("add-content-btn")).toBeNull();
      expect(q("edit-content-21")).toBeNull();
      expect(q("join-course-btn")).toBeNull();
      expect(document.body.textContent).not.toContain("Gabung kursus untuk membuka materi.");
    });

    it("should open a content", async () => {
      await setup(fullCourse(STUDENT));
      const link = q("open-content-22") as HTMLAnchorElement;
      expect(link.getAttribute("href")).toBe("/courses/5/contents/22");
      link.click();
      expect(mockGoto).toHaveBeenCalledWith("/courses/5/contents/22");
    });

    it("should leave the course only after confirmation", async () => {
      const confirm = vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true } as any);
      const leave = vi.spyOn(coursesStore, "asyncLeaveCourse").mockResolvedValue(true);
      await setup(fullCourse(STUDENT));

      q("leave-course-btn")!.click();
      await flush();
      expect(leave).toHaveBeenCalledWith(5);

      leave.mockClear();
      confirm.mockResolvedValue({ isConfirmed: false } as any);
      q("leave-course-btn")!.click();
      await flush();
      expect(leave).not.toHaveBeenCalled();
    });

    it("should require a comment before rating", async () => {
      const err = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation((() => {}) as any);
      const rate = vi.spyOn(coursesStore, "asyncRateCourse").mockResolvedValue(true);
      await setup(fullCourse(STUDENT));

      q("submit-rating-btn")!.click();
      await flush();
      expect(err).toHaveBeenCalledWith("Komentar tidak boleh kosong");
      expect(rate).not.toHaveBeenCalled();
    });

    it("should submit a rating with comment", async () => {
      const rate = vi.spyOn(coursesStore, "asyncRateCourse").mockResolvedValue(true);
      await setup(fullCourse(STUDENT));

      const select = q("rating-select") as HTMLSelectElement;
      select.value = "3";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      const comment = q("rating-comment-input") as HTMLTextAreaElement;
      comment.value = "  Cukup bagus ";
      comment.dispatchEvent(new Event("input", { bubbles: true }));
      await tick();

      q("submit-rating-btn")!.click();
      await flush();
      expect(rate).toHaveBeenCalledWith(5, 3, "Cukup bagus");
    });

    it("should list the existing ratings", async () => {
      await setup(fullCourse(STUDENT));
      const items = document.querySelectorAll('[data-testid="rating-item"]');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain("Ani");
      expect(items[0].textContent).toContain("Mantap");
    });
  });

  describe("as guest", () => {
    it("should offer joining and lock the contents", async () => {
      const join = vi.spyOn(coursesStore, "asyncJoinCourse").mockResolvedValue(true);
      await setup(fullCourse());

      expect(q("leave-course-btn")).toBeNull();
      expect(q("submit-rating-btn")).toBeNull();
      expect(q("open-content-21")).toBeNull();
      expect(document.body.textContent).toContain("Gabung kursus untuk membuka materi.");
      expect(document.body.textContent).toContain("Bab 1");

      q("join-course-btn")!.click();
      await flush();
      expect(join).toHaveBeenCalledWith(5);
    });
  });

  describe("refresh after changes", () => {
    it.each([
      ["setIsCourseChanged", "isCourseChanged"],
      ["setIsCoverChanged", "isCoverChanged"],
      ["setIsStudentChanged", "isStudentChanged"],
      ["setIsRatingChanged", "isRatingChanged"],
      ["setIsContentChanged", "isContentChanged"],
    ])("should reload the course after %s", async (setter, flag) => {
      const { coursesStore: store } = await setup(fullCourse());
      loadSpy.mockClear();

      (store as any)[setter](true);
      await flush();

      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledWith(5);
      expect((store as any)[flag]).toBe(false);
    });
  });

  describe("missing optional fields", () => {
    it("should fall back to defaults for a course without statistics", async () => {
      await setup({ id: 5, user_id: 2, title: "Minimal", description: "D" });
      expect(q("course-detail-students")?.textContent).toContain("0 peserta");
      expect(q("no-ratings")).not.toBeNull();
      expect(document.body.textContent).toContain("0");
    });

    it("should fall back to defaults for a student without progress data", async () => {
      await setup({ id: 5, user_id: 2, title: "Minimal", description: "D", students: [1] });
      expect(q("course-progress")?.textContent).toContain("Kemajuan belajar: 0%");
    });

    it("should render a rating that has no name or score", async () => {
      await setup(fullCourse({ ratings: [{}] }));
      expect(document.querySelectorAll('[data-testid="rating-item"]').length).toBe(1);
    });
  });
});
