import { describe, it, expect, vi, beforeEach } from "vitest";
import coursesStore, {
  coursesStore as namedStore,
  useCoursesStore,
  isCourseOwner,
  isCourseStudent,
} from "./coursesStore";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("coursesStore", () => {
  let successSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    coursesStore.reset();
    vi.restoreAllMocks();
    successSpy = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation((() => {}) as any);
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation((() => {}) as any);
  });

  it("should expose the same store through every export", () => {
    expect(useCoursesStore()).toBe(coursesStore);
    expect(namedStore).toBe(coursesStore);
  });

  it("should have correct default state", () => {
    const s = useCoursesStore();
    expect(s.courses).toEqual([]);
    expect(s.course).toBeNull();
    expect(s.content).toBeNull();
    expect(s.isCourse).toBe(false);
    expect(s.isContent).toBe(false);
    expect(s.isCourseChanged).toBe(false);
    expect(s.isCoverChanged).toBe(false);
    expect(s.isStudentChanged).toBe(false);
    expect(s.isRatingChanged).toBe(false);
    expect(s.isContentChanged).toBe(false);
    expect(s.$state.courses).toEqual([]);
  });

  it("should update state with setters", () => {
    const s = useCoursesStore();
    s.setCourses([{ id: 1 } as any]);
    expect(s.courses).toEqual([{ id: 1 }]);
    s.setCourse({ id: 2 } as any);
    expect(s.course).toEqual({ id: 2 });
    s.setContent({ id: 3 } as any);
    expect(s.content).toEqual({ id: 3 });
    s.setIsCourse(true);
    expect(s.isCourse).toBe(true);
    s.setIsContent(true);
    expect(s.isContent).toBe(true);
    s.setIsCourseChanged(true);
    expect(s.isCourseChanged).toBe(true);
    s.setIsCoverChanged(true);
    expect(s.isCoverChanged).toBe(true);
    s.setIsStudentChanged(true);
    expect(s.isStudentChanged).toBe(true);
    s.setIsRatingChanged(true);
    expect(s.isRatingChanged).toBe(true);
    s.setIsContentChanged(true);
    expect(s.isContentChanged).toBe(true);
  });

  it("should reset to the initial state or a partial override", () => {
    coursesStore.setCourses([{ id: 1 } as any]);
    coursesStore.reset();
    expect(coursesStore.courses).toEqual([]);
    coursesStore.reset({ isCourse: true });
    expect(coursesStore.isCourse).toBe(true);
  });

  it("asyncSetCourses should load courses, passing the is_me flag", async () => {
    const spy = vi.spyOn(courseApi, "getCourses").mockResolvedValue([{ id: 1 } as any]);
    await coursesStore.asyncSetCourses();
    expect(spy).toHaveBeenCalledWith(false);
    expect(coursesStore.courses).toEqual([{ id: 1 }]);
    await coursesStore.asyncSetCourses(true);
    expect(spy).toHaveBeenLastCalledWith(true);
  });

  it("asyncSetCourses should clear courses on error", async () => {
    coursesStore.setCourses([{ id: 1 } as any]);
    vi.spyOn(courseApi, "getCourses").mockRejectedValue(new Error("x"));
    await coursesStore.asyncSetCourses();
    expect(coursesStore.courses).toEqual([]);
  });

  it("asyncSetCourse should load detail and always raise isCourse", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 5 } as any);
    await coursesStore.asyncSetCourse(5);
    expect(coursesStore.course).toEqual({ id: 5 });
    expect(coursesStore.isCourse).toBe(true);

    coursesStore.reset();
    vi.spyOn(courseApi, "getCourseById").mockRejectedValue(new Error("x"));
    await coursesStore.asyncSetCourse(5);
    expect(coursesStore.course).toBeNull();
    expect(coursesStore.isCourse).toBe(true);
  });

  it("asyncSetContent should load content and always raise isContent", async () => {
    vi.spyOn(courseApi, "getContentById").mockResolvedValue({ id: 8 } as any);
    await coursesStore.asyncSetContent(8);
    expect(coursesStore.content).toEqual({ id: 8 });
    expect(coursesStore.isContent).toBe(true);

    coursesStore.reset();
    vi.spyOn(courseApi, "getContentById").mockRejectedValue(new Error("x"));
    await coursesStore.asyncSetContent(8);
    expect(coursesStore.content).toBeNull();
    expect(coursesStore.isContent).toBe(true);
  });

  const mutations: Array<{
    name: string;
    api: keyof typeof courseApi;
    run: () => Promise<boolean>;
    flag: string | null;
    fallback: string;
  }> = [
    {
      name: "asyncAddCourse",
      api: "postCourse",
      run: () => coursesStore.asyncAddCourse("T", "D"),
      flag: "isCourseChanged",
      fallback: "Kursus berhasil ditambahkan!",
    },
    {
      name: "asyncChangeCourse",
      api: "putCourse",
      run: () => coursesStore.asyncChangeCourse(1, "T", "D"),
      flag: "isCourseChanged",
      fallback: "Kursus berhasil diubah!",
    },
    {
      name: "asyncChangeCover",
      api: "postCourseCover",
      run: () => coursesStore.asyncChangeCover(1, new File(["x"], "a.png")),
      flag: "isCoverChanged",
      fallback: "Sampul kursus berhasil diubah!",
    },
    {
      name: "asyncDeleteCourse",
      api: "deleteCourse",
      run: () => coursesStore.asyncDeleteCourse(1),
      flag: null,
      fallback: "Kursus berhasil dihapus!",
    },
    {
      name: "asyncJoinCourse",
      api: "postJoinCourse",
      run: () => coursesStore.asyncJoinCourse(1),
      flag: "isStudentChanged",
      fallback: "Berhasil bergabung ke kursus!",
    },
    {
      name: "asyncLeaveCourse",
      api: "deleteLeaveCourse",
      run: () => coursesStore.asyncLeaveCourse(1),
      flag: "isStudentChanged",
      fallback: "Berhasil keluar dari kursus!",
    },
    {
      name: "asyncRateCourse",
      api: "putRating",
      run: () => coursesStore.asyncRateCourse(1, 5, "Mantap"),
      flag: "isRatingChanged",
      fallback: "Rating berhasil disimpan!",
    },
    {
      name: "asyncAddContent",
      api: "postContent",
      run: () => coursesStore.asyncAddContent(1, "T", "https://youtu.be/x"),
      flag: "isContentChanged",
      fallback: "Konten berhasil ditambahkan!",
    },
    {
      name: "asyncChangeContent",
      api: "putContent",
      run: () => coursesStore.asyncChangeContent(1, "T", "https://youtu.be/x"),
      flag: "isContentChanged",
      fallback: "Konten berhasil diubah!",
    },
    {
      name: "asyncDeleteContent",
      api: "deleteContent",
      run: () => coursesStore.asyncDeleteContent(1),
      flag: "isContentChanged",
      fallback: "Konten berhasil dihapus!",
    },
  ];

  it.each(mutations)("$name should show server message, raise flag, and return true", async (m) => {
    vi.spyOn(courseApi, m.api as any).mockResolvedValue("Pesan server" as never);
    await expect(m.run()).resolves.toBe(true);
    expect(successSpy).toHaveBeenCalledWith("Pesan server");
    if (m.flag) expect((coursesStore.$state as any)[m.flag]).toBe(true);
  });

  it.each(mutations)("$name should use fallback message when server gives none", async (m) => {
    vi.spyOn(courseApi, m.api as any).mockResolvedValue("" as never);
    await expect(m.run()).resolves.toBe(true);
    expect(successSpy).toHaveBeenCalledWith(m.fallback);
  });

  it.each(mutations)("$name should show error, keep flags down, and return false", async (m) => {
    vi.spyOn(courseApi, m.api as any).mockRejectedValue(new Error("Gagal total") as never);
    await expect(m.run()).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledWith("Gagal total");
    expect(successSpy).not.toHaveBeenCalled();
    if (m.flag) expect((coursesStore.$state as any)[m.flag]).toBe(false);
  });

  it("asyncLearnContent should update silently and raise isContentChanged", async () => {
    const spy = vi.spyOn(courseApi, "postLearn").mockResolvedValue("ok");
    await expect(coursesStore.asyncLearnContent(4, 1)).resolves.toBe(true);
    expect(spy).toHaveBeenCalledWith(4, 1);
    expect(successSpy).not.toHaveBeenCalled();
    expect(coursesStore.isContentChanged).toBe(true);
  });

  it("asyncLearnContent should report errors", async () => {
    vi.spyOn(courseApi, "postLearn").mockRejectedValue(new Error("Gagal belajar"));
    await expect(coursesStore.asyncLearnContent(4, 0)).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledWith("Gagal belajar");
  });
});

describe("course role helpers", () => {
  const course: any = { id: 1, user_id: 7, students: [3, "9"] };

  it("isCourseOwner should compare user_id to profile id", () => {
    expect(isCourseOwner(course, { id: 7 })).toBe(true);
    expect(isCourseOwner(course, { id: "7" })).toBe(true);
    expect(isCourseOwner(course, { id: 8 })).toBe(false);
    expect(isCourseOwner(null, { id: 7 })).toBe(false);
    expect(isCourseOwner(course, null)).toBe(false);
  });

  it("isCourseStudent should look the profile id up in students", () => {
    expect(isCourseStudent(course, { id: 3 })).toBe(true);
    expect(isCourseStudent(course, { id: 9 })).toBe(true);
    expect(isCourseStudent(course, { id: 4 })).toBe(false);
    expect(isCourseStudent({ id: 1, user_id: 7 } as any, { id: 3 })).toBe(false);
    expect(isCourseStudent(undefined, { id: 3 })).toBe(false);
    expect(isCourseStudent(course, undefined)).toBe(false);
  });
});
