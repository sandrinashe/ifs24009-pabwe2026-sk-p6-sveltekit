import apiHelper from "../../../helpers/apiHelper";

declare const DELCOM_BASEURL: string;

export type Id = number | string;

export interface CourseAuthor {
  name: string;
  photo?: string | null;
}

export interface CourseContent {
  id: Id;
  course_id: Id;
  title: string;
  youtube: string;
  created_at?: string;
  updated_at?: string;
  my_status_finished?: boolean | number;
}

export interface CourseRating {
  name: string;
  ratings: number;
  comment: string;
}

export interface Course {
  id: Id;
  user_id: Id;
  title: string;
  description: string;
  cover?: string | null;
  created_at?: string;
  updated_at?: string;
  author?: CourseAuthor;
  students?: Id[];
  total_contents?: number;
  avg_ratings?: number;
  contents?: CourseContent[];
  ratings?: CourseRating[];
  my_percentage_finished?: number;
}

const courseApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/courses`;

  function _url(path: string): string {
    return BASE_URL + path;
  }

  async function _request(
    path: string,
    options: RequestInit,
    fallbackMessage: string
  ): Promise<any> {
    const response = await apiHelper.fetchData(_url(path), options);
    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  function _json(method: string, body?: unknown): RequestInit {
    return {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }

  async function postCourse(title: string, description: string): Promise<string> {
    const result = await _request("", _json("POST", { title, description }), "Gagal menambahkan kursus");
    return result.message;
  }

  async function postCourseCover(courseId: Id, cover: File): Promise<string> {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const result = await _request(
      `/${courseId}/cover`,
      { method: "POST", body: formData },
      "Gagal mengubah sampul kursus"
    );
    return result.message;
  }

  async function putCourse(courseId: Id, title: string, description: string): Promise<string> {
    const result = await _request(
      `/${courseId}`,
      _json("PUT", { title, description }),
      "Gagal mengubah kursus"
    );
    return result.message;
  }

  async function getCourses(isMe: boolean = false): Promise<Course[]> {
    const result = await _request(isMe ? "?is_me=1" : "", { method: "GET" }, "Gagal mengambil data kursus");
    return result.data?.courses || [];
  }

  async function getCourseById(courseId: Id): Promise<Course> {
    const result = await _request(`/${courseId}`, { method: "GET" }, "Gagal mengambil detail kursus");
    return result.data?.course;
  }

  async function deleteCourse(courseId: Id): Promise<string> {
    const result = await _request(`/${courseId}`, { method: "DELETE" }, "Gagal menghapus kursus");
    return result.message;
  }

  async function deleteAllCourses(): Promise<string> {
    const result = await _request("", { method: "DELETE" }, "Gagal menghapus semua kursus");
    return result.message;
  }

  async function postJoinCourse(courseId: Id): Promise<string> {
    const result = await _request(`/${courseId}/students`, { method: "POST" }, "Gagal bergabung ke kursus");
    return result.message;
  }

  async function deleteLeaveCourse(courseId: Id): Promise<string> {
    const result = await _request(`/${courseId}/students`, { method: "DELETE" }, "Gagal keluar dari kursus");
    return result.message;
  }

  async function putRating(courseId: Id, ratings: number, comment: string): Promise<string> {
    const result = await _request(
      `/${courseId}/students/ratings`,
      _json("PUT", { ratings, comment }),
      "Gagal mengirim rating"
    );
    return result.message;
  }

  async function postContent(courseId: Id, title: string, youtube: string): Promise<string> {
    const result = await _request(
      `/${courseId}/contents`,
      _json("POST", { title, youtube }),
      "Gagal menambahkan konten"
    );
    return result.message;
  }

  async function putContent(contentId: Id, title: string, youtube: string): Promise<string> {
    const result = await _request(
      `/-/contents/${contentId}`,
      _json("PUT", { title, youtube }),
      "Gagal mengubah konten"
    );
    return result.message;
  }

  async function getContentById(contentId: Id): Promise<CourseContent> {
    const result = await _request(`/-/contents/${contentId}`, { method: "GET" }, "Gagal mengambil detail konten");
    return result.data?.course_content;
  }

  async function deleteContent(contentId: Id): Promise<string> {
    const result = await _request(`/-/contents/${contentId}`, { method: "DELETE" }, "Gagal menghapus konten");
    return result.message;
  }

  async function postLearn(contentId: Id, status: 0 | 1): Promise<string> {
    const result = await _request(
      `/-/contents/${contentId}/learns`,
      _json("POST", { status }),
      "Gagal memperbarui status belajar"
    );
    return result.message;
  }

  return {
    postCourse,
    postCourseCover,
    putCourse,
    getCourses,
    getCourseById,
    deleteCourse,
    deleteAllCourses,
    postJoinCourse,
    deleteLeaveCourse,
    putRating,
    postContent,
    putContent,
    getContentById,
    deleteContent,
    postLearn,
  };
})();

export default courseApi;
