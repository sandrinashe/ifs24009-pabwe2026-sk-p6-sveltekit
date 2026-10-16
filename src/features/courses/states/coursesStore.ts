import { writable } from "svelte/store";
import courseApi, { type Course, type CourseContent, type Id } from "../api/courseApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface CoursesState {
  courses: Course[];
  course: Course | null;
  content: CourseContent | null;
  isCourse: boolean;
  isContent: boolean;
  isCourseChanged: boolean;
  isCoverChanged: boolean;
  isStudentChanged: boolean;
  isRatingChanged: boolean;
  isContentChanged: boolean;
}

type FlagKey =
  | "isCourseChanged"
  | "isCoverChanged"
  | "isStudentChanged"
  | "isRatingChanged"
  | "isContentChanged";

export function isCourseOwner(
  course: Course | null | undefined,
  profile: { id: Id } | null | undefined
): boolean {
  if (!course || !profile) return false;
  return String(course.user_id) === String(profile.id);
}

export function isCourseStudent(
  course: Course | null | undefined,
  profile: { id: Id } | null | undefined
): boolean {
  if (!course || !profile) return false;
  return (course.students || []).some((id) => String(id) === String(profile.id));
}

function createCoursesStore() {
  const initial: CoursesState = {
    courses: [],
    course: null,
    content: null,
    isCourse: false,
    isContent: false,
    isCourseChanged: false,
    isCoverChanged: false,
    isStudentChanged: false,
    isRatingChanged: false,
    isContentChanged: false,
  };

  let currentState: CoursesState = { ...initial };
  const innerStore = writable<CoursesState>(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  function patch(partial: Partial<CoursesState>) {
    innerStore.update((s) => ({ ...s, ...partial }));
  }

  async function mutate(
    action: () => Promise<string>,
    fallbackMessage: string,
    flag?: FlagKey,
    notify: boolean = true
  ): Promise<boolean> {
    try {
      const message = await action();
      if (notify) showSuccessDialog(message || fallbackMessage);
      if (flag) patch({ [flag]: true });
      return true;
    } catch (error: any) {
      showErrorDialog(error.message);
      return false;
    }
  }

  return {
    subscribe: innerStore.subscribe,
    get courses() {
      return currentState.courses;
    },
    get course() {
      return currentState.course;
    },
    get content() {
      return currentState.content;
    },
    get isCourse() {
      return currentState.isCourse;
    },
    get isContent() {
      return currentState.isContent;
    },
    get isCourseChanged() {
      return currentState.isCourseChanged;
    },
    get isCoverChanged() {
      return currentState.isCoverChanged;
    },
    get isStudentChanged() {
      return currentState.isStudentChanged;
    },
    get isRatingChanged() {
      return currentState.isRatingChanged;
    },
    get isContentChanged() {
      return currentState.isContentChanged;
    },
    get $state() {
      return currentState;
    },
    reset(state: Partial<CoursesState> = initial) {
      innerStore.set({ ...initial, ...state });
    },
    setCourses(courses: Course[]) {
      patch({ courses });
    },
    setCourse(course: Course | null) {
      patch({ course });
    },
    setContent(content: CourseContent | null) {
      patch({ content });
    },
    setIsCourse(status: boolean) {
      patch({ isCourse: status });
    },
    setIsContent(status: boolean) {
      patch({ isContent: status });
    },
    setIsCourseChanged(status: boolean) {
      patch({ isCourseChanged: status });
    },
    setIsCoverChanged(status: boolean) {
      patch({ isCoverChanged: status });
    },
    setIsStudentChanged(status: boolean) {
      patch({ isStudentChanged: status });
    },
    setIsRatingChanged(status: boolean) {
      patch({ isRatingChanged: status });
    },
    setIsContentChanged(status: boolean) {
      patch({ isContentChanged: status });
    },
    async asyncSetCourses(isMe: boolean = false) {
      try {
        patch({ courses: await courseApi.getCourses(isMe) });
      } catch {
        patch({ courses: [] });
      }
    },
    async asyncSetCourse(courseId: Id) {
      try {
        patch({ course: await courseApi.getCourseById(courseId) });
      } catch {
        patch({ course: null });
      } finally {
        patch({ isCourse: true });
      }
    },
    async asyncSetContent(contentId: Id) {
      try {
        patch({ content: await courseApi.getContentById(contentId) });
      } catch {
        patch({ content: null });
      } finally {
        patch({ isContent: true });
      }
    },
    asyncAddCourse(title: string, description: string) {
      return mutate(
        () => courseApi.postCourse(title, description),
        "Kursus berhasil ditambahkan!",
        "isCourseChanged"
      );
    },
    asyncChangeCourse(courseId: Id, title: string, description: string) {
      return mutate(
        () => courseApi.putCourse(courseId, title, description),
        "Kursus berhasil diubah!",
        "isCourseChanged"
      );
    },
    asyncChangeCover(courseId: Id, cover: File) {
      return mutate(
        () => courseApi.postCourseCover(courseId, cover),
        "Sampul kursus berhasil diubah!",
        "isCoverChanged"
      );
    },
    asyncDeleteCourse(courseId: Id) {
      return mutate(() => courseApi.deleteCourse(courseId), "Kursus berhasil dihapus!");
    },
    asyncJoinCourse(courseId: Id) {
      return mutate(
        () => courseApi.postJoinCourse(courseId),
        "Berhasil bergabung ke kursus!",
        "isStudentChanged"
      );
    },
    asyncLeaveCourse(courseId: Id) {
      return mutate(
        () => courseApi.deleteLeaveCourse(courseId),
        "Berhasil keluar dari kursus!",
        "isStudentChanged"
      );
    },
    asyncRateCourse(courseId: Id, ratings: number, comment: string) {
      return mutate(
        () => courseApi.putRating(courseId, ratings, comment),
        "Rating berhasil disimpan!",
        "isRatingChanged"
      );
    },
    asyncAddContent(courseId: Id, title: string, youtube: string) {
      return mutate(
        () => courseApi.postContent(courseId, title, youtube),
        "Konten berhasil ditambahkan!",
        "isContentChanged"
      );
    },
    asyncChangeContent(contentId: Id, title: string, youtube: string) {
      return mutate(
        () => courseApi.putContent(contentId, title, youtube),
        "Konten berhasil diubah!",
        "isContentChanged"
      );
    },
    asyncDeleteContent(contentId: Id) {
      return mutate(
        () => courseApi.deleteContent(contentId),
        "Konten berhasil dihapus!",
        "isContentChanged"
      );
    },
    asyncLearnContent(contentId: Id, status: 0 | 1) {
      return mutate(
        () => courseApi.postLearn(contentId, status),
        "Status belajar diperbarui!",
        "isContentChanged",
        false
      );
    },
  };
}

export const coursesStore = createCoursesStore();
export const useCoursesStore = () => coursesStore;
export default coursesStore;
