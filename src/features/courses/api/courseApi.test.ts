import { describe, it, expect, vi, beforeEach } from "vitest";
import courseApi from "./courseApi";
import apiHelper from "../../../helpers/apiHelper";

declare const DELCOM_BASEURL: string;
const BASE = `${DELCOM_BASEURL}/courses`;

function mockResponse(body: any) {
  return { json: () => Promise.resolve(body) } as Response;
}

describe("courseApi", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(apiHelper, "fetchData");
  });

  function ok(extra: Record<string, any> = {}) {
    fetchSpy.mockResolvedValue(mockResponse({ status: "success", message: "OK", ...extra }));
  }

  function fail(message?: string) {
    fetchSpy.mockResolvedValue(mockResponse({ status: "fail", message }));
  }

  const calls: Array<{
    name: string;
    run: () => Promise<any>;
    url: string;
    method: string;
    body?: any;
    fallback: string;
  }> = [
    {
      name: "postCourse",
      run: () => courseApi.postCourse("T", "D"),
      url: BASE,
      method: "POST",
      body: { title: "T", description: "D" },
      fallback: "Gagal menambahkan kursus",
    },
    {
      name: "putCourse",
      run: () => courseApi.putCourse(3, "T", "D"),
      url: `${BASE}/3`,
      method: "PUT",
      body: { title: "T", description: "D" },
      fallback: "Gagal mengubah kursus",
    },
    {
      name: "deleteCourse",
      run: () => courseApi.deleteCourse(3),
      url: `${BASE}/3`,
      method: "DELETE",
      fallback: "Gagal menghapus kursus",
    },
    {
      name: "deleteAllCourses",
      run: () => courseApi.deleteAllCourses(),
      url: BASE,
      method: "DELETE",
      fallback: "Gagal menghapus semua kursus",
    },
    {
      name: "postJoinCourse",
      run: () => courseApi.postJoinCourse(3),
      url: `${BASE}/3/students`,
      method: "POST",
      fallback: "Gagal bergabung ke kursus",
    },
    {
      name: "deleteLeaveCourse",
      run: () => courseApi.deleteLeaveCourse(3),
      url: `${BASE}/3/students`,
      method: "DELETE",
      fallback: "Gagal keluar dari kursus",
    },
    {
      name: "putRating",
      run: () => courseApi.putRating(3, 4, "Bagus"),
      url: `${BASE}/3/students/ratings`,
      method: "PUT",
      body: { ratings: 4, comment: "Bagus" },
      fallback: "Gagal mengirim rating",
    },
    {
      name: "postContent",
      run: () => courseApi.postContent(3, "Bab 1", "https://youtu.be/x"),
      url: `${BASE}/3/contents`,
      method: "POST",
      body: { title: "Bab 1", youtube: "https://youtu.be/x" },
      fallback: "Gagal menambahkan konten",
    },
    {
      name: "putContent",
      run: () => courseApi.putContent(9, "Bab 1", "https://youtu.be/x"),
      url: `${BASE}/-/contents/9`,
      method: "PUT",
      body: { title: "Bab 1", youtube: "https://youtu.be/x" },
      fallback: "Gagal mengubah konten",
    },
    {
      name: "deleteContent",
      run: () => courseApi.deleteContent(9),
      url: `${BASE}/-/contents/9`,
      method: "DELETE",
      fallback: "Gagal menghapus konten",
    },
    {
      name: "postLearn",
      run: () => courseApi.postLearn(9, 1),
      url: `${BASE}/-/contents/9/learns`,
      method: "POST",
      body: { status: 1 },
      fallback: "Gagal memperbarui status belajar",
    },
  ];

  it.each(calls)("$name should call the endpoint and return the message", async (c) => {
    ok();
    await expect(c.run()).resolves.toBe("OK");
    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(c.url);
    expect(options.method).toBe(c.method);
    if (c.body) {
      expect(JSON.parse(options.body as string)).toEqual(c.body);
      expect(options.headers).toEqual({ "Content-Type": "application/json" });
    }
  });

  it.each(calls)("$name should throw server message or fallback on failure", async (c) => {
    fail("Pesan server");
    await expect(c.run()).rejects.toThrow("Pesan server");
    fail();
    await expect(c.run()).rejects.toThrow(c.fallback);
  });

  it("postCourseCover should upload the cover as multipart", async () => {
    ok();
    const file = new File(["x"], "foto.png", { type: "image/png" });
    await expect(courseApi.postCourseCover(3, file)).resolves.toBe("OK");
    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/3/cover`);
    expect(options.method).toBe("POST");
    expect((options.body as FormData).get("cover")).toBeInstanceOf(File);
    expect(((options.body as FormData).get("cover") as File).name).toBe("foto.png");
  });

  it("postCourseCover should use default file name and handle failure", async () => {
    ok();
    const file = new File(["x"], "", { type: "image/png" });
    await courseApi.postCourseCover(3, file);
    const options = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(((options.body as FormData).get("cover") as File).name).toBe("cover.jpg");

    fail("Gagal server");
    await expect(courseApi.postCourseCover(3, file)).rejects.toThrow("Gagal server");
    fail();
    await expect(courseApi.postCourseCover(3, file)).rejects.toThrow("Gagal mengubah sampul kursus");
  });

  it("getCourses should fetch all courses or only mine", async () => {
    ok({ data: { courses: [{ id: 1 }] } });
    await expect(courseApi.getCourses()).resolves.toEqual([{ id: 1 }]);
    expect(fetchSpy.mock.calls[0][0]).toBe(BASE);
    await courseApi.getCourses(true);
    expect(fetchSpy.mock.calls[1][0]).toBe(`${BASE}?is_me=1`);
  });

  it("getCourses should default to empty list and throw on failure", async () => {
    ok({ data: {} });
    await expect(courseApi.getCourses()).resolves.toEqual([]);
    fail("Server error");
    await expect(courseApi.getCourses()).rejects.toThrow("Server error");
    fail();
    await expect(courseApi.getCourses()).rejects.toThrow("Gagal mengambil data kursus");
  });

  it("getCourseById should return data.course", async () => {
    ok({ data: { course: { id: 5 } } });
    await expect(courseApi.getCourseById(5)).resolves.toEqual({ id: 5 });
    expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/5`);
    fail("Tidak ada");
    await expect(courseApi.getCourseById(5)).rejects.toThrow("Tidak ada");
    fail();
    await expect(courseApi.getCourseById(5)).rejects.toThrow("Gagal mengambil detail kursus");
  });

  it("getContentById should return data.course_content", async () => {
    ok({ data: { course_content: { id: 7 } } });
    await expect(courseApi.getContentById(7)).resolves.toEqual({ id: 7 });
    expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/-/contents/7`);
    fail("Tidak ada");
    await expect(courseApi.getContentById(7)).rejects.toThrow("Tidak ada");
    fail();
    await expect(courseApi.getContentById(7)).rejects.toThrow("Gagal mengambil detail konten");
  });

  it("should accept responses flagged with success=true", async () => {
    fetchSpy.mockResolvedValue(mockResponse({ success: true, message: "Yes" }));
    await expect(courseApi.deleteCourse(1)).resolves.toBe("Yes");
  });
});