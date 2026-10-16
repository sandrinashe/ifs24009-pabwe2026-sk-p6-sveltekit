import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";
import { mockGoto } from "../../../setupTests";

const profile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
const courses: any[] = [
  {
    id: 10,
    user_id: 1,
    title: "Kursus Milik Saya",
    description: "Belajar Svelte",
    cover: "https://example.com/cover.jpg",
    author: { name: "Abdullah" },
    total_contents: 3,
    students: [2, 3],
    avg_ratings: 4.5,
  },
  {
    id: 11,
    user_id: 2,
    title: "Kursus Diikuti",
    description: "Belajar Kit",
    cover: null,
    author: { name: "Budi" },
    total_contents: 1,
    students: [1],
    avg_ratings: 3,
  },
  {
    id: 12,
    user_id: 3,
    title: "Kursus Lain",
    description: "Tentang TypeScript",
  },
  {
    id: 13,
    user_id: 1,
    title: "Kursus Pemilik Sekaligus Peserta",
    description: "Dua peran",
    students: [1],
  },
];

const q = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("HomePage", () => {
  let loadSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    loadSpy = vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue(undefined);
  });

  it("should render nothing without a profile", () => {
    renderWithProviders(HomePage, { preloadedState: { profile: null } });
    expect(q("add-course-btn")).toBeNull();
  });

  it("should load all courses on mount and show the empty state", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses: [] } });
    await flush();
    expect(loadSpy).toHaveBeenCalledWith(false);
    expect(wrapper.text()).toContain("Semua Kursus");
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
  });

  it("should show a loading indicator while the list is loading", async () => {
    loadSpy.mockReturnValue(new Promise(() => {}));
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses: [] } });
    await tick();
    expect(wrapper.text()).toContain("Memuat daftar kursus...");
  });

  it("should render course cards with roles, owner first", async () => {
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();

    const owner = q("course-card-10")!;
    expect(owner.textContent).toContain("Milik Saya");
    expect(owner.textContent).toContain("3 materi");
    expect(owner.textContent).toContain("4.5");
    expect(owner.querySelector("img")!.getAttribute("src")).toBe("https://example.com/cover.jpg");
    expect(q("delete-course-10")).not.toBeNull();

    const student = q("course-card-11")!;
    expect(student.textContent).toContain("Terdaftar");
    expect(student.querySelector("img")).toBeNull();
    expect(q("delete-course-11")).toBeNull();

    const other = q("course-card-12")!;
    expect(other.textContent).not.toContain("Milik Saya");
    expect(other.textContent).not.toContain("Terdaftar");
    expect(q("course-author-12")!.textContent).toBe("-");
    expect(other.textContent).toContain("0 materi");

    const both = q("course-card-13")!;
    expect(both.textContent).toContain("Milik Saya");
    expect(both.textContent).not.toContain("Terdaftar");
  });

  it("should search by title or description", async () => {
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();

    const input = q("search-course-input") as HTMLInputElement;
    input.value = "typescript";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(q("course-card-12")).not.toBeNull();
    expect(q("course-card-10")).toBeNull();

    input.value = "diikuti";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(q("course-card-11")).not.toBeNull();
    expect(q("course-card-12")).toBeNull();

    input.value = "   ";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(q("course-card-12")).not.toBeNull();
  });

  it("should switch between all courses and my courses", async () => {
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();

    q("filter-mine-btn")!.click();
    await flush();
    expect(loadSpy).toHaveBeenLastCalledWith(true);
    expect(q("filter-mine-btn")!.className).toContain("text-indigo-700");

    q("filter-all-btn")!.click();
    await flush();
    expect(loadSpy).toHaveBeenLastCalledWith(false);
    expect(q("filter-all-btn")!.className).toContain("text-slate-900");
  });

  it("should open the add modal and close it again", async () => {
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();

    q("add-course-btn")!.click();
    await tick();
    expect(q("add-course-modal")).not.toBeNull();

    q("close-add-modal-btn")!.click();
    await tick();
    expect(q("add-course-modal")).toBeNull();
  });

  it("should navigate to the course detail", async () => {
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();
    q("view-course-11")!.click();
    expect(mockGoto).toHaveBeenCalledWith("/courses/11");
  });

  it("should delete a course after confirmation and reload the list", async () => {
    const confirmSpy = vi
      .spyOn(toolsHelper, "showConfirmDialog")
      .mockResolvedValue({ isConfirmed: true } as any);
    const del = vi.spyOn(coursesStore, "asyncDeleteCourse").mockResolvedValue(true);
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();
    loadSpy.mockClear();

    q("delete-course-10")!.click();
    await flush();

    expect(confirmSpy).toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith(10);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("should not reload when deletion fails", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true } as any);
    vi.spyOn(coursesStore, "asyncDeleteCourse").mockResolvedValue(false);
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();
    loadSpy.mockClear();

    q("delete-course-10")!.click();
    await flush();
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it("should not delete when confirmation is declined", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false } as any);
    const del = vi.spyOn(coursesStore, "asyncDeleteCourse");
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();

    q("delete-course-10")!.click();
    await flush();
    expect(del).not.toHaveBeenCalled();
  });

  it("should reload the list when a course was added or changed", async () => {
    const { coursesStore: store } = renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await flush();
    loadSpy.mockClear();

    store.setIsCourseChanged(true);
    await flush();

    expect(store.isCourseChanged).toBe(false);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("should render a course without statistics using default values", async () => {
    renderWithProviders(HomePage, {
      preloadedState: { profile, courses: [{ id: 99, user_id: 3, title: "Polos", description: "D" }] },
    });
    await flush();
    expect(q("course-author-99")?.textContent).toBe("-");
    expect(document.body.textContent).toContain("0 materi");
  });
});
