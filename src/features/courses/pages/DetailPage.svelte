<script lang="ts">
  import { untrack } from "svelte";
  import { goto } from "$app/navigation";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ContentModal from "../modals/ContentModal.svelte";
  import MarkdownViewer from "../components/MarkdownViewer.svelte";
  import { coursesStore, isCourseOwner, isCourseStudent } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog, showErrorDialog } from "../../../helpers/toolsHelper";
  import type { CourseContent, Id } from "../api/courseApi";
  import {
    ArrowLeft,
    ImagePlus,
    PenLine,
    Trash2,
    Calendar,
    Plus,
    Video,
    CircleCheck,
    Lock,
    Star,
    UserPlus,
    LogOut,
  } from "lucide-svelte";

  let { courseId }: { courseId: Id } = $props();

  let profile = $derived($usersStore.profile);
  let course = $derived($coursesStore.course);
  let isOwner = $derived(isCourseOwner(course, profile));
  let isStudent = $derived(isCourseStudent(course, profile));

  let showCoverModal = $state(false);
  let showEditModal = $state(false);
  let showContentModal = $state(false);
  let editingContent: CourseContent | null = $state(null);
  let ratingValue = $state(5);
  let ratingComment = $state("");

  // Muat kursus setiap kali id berubah.
  $effect(() => {
    const id = courseId;
    untrack(() => {
      coursesStore.setCourse(null);
      coursesStore.asyncSetCourse(id);
    });
  });

  // Kursus tidak ditemukan: kembali ke beranda.
  $effect(() => {
    if ($coursesStore.isCourse) {
      coursesStore.setIsCourse(false);
      if (!$coursesStore.course) goto("/");
    }
  });

  // Muat ulang setelah ada perubahan pada kursus, sampul, peserta, rating, atau konten.
  $effect(() => {
    const s = $coursesStore;
    if (
      s.isCourseChanged ||
      s.isCoverChanged ||
      s.isStudentChanged ||
      s.isRatingChanged ||
      s.isContentChanged
    ) {
      coursesStore.setIsCourseChanged(false);
      coursesStore.setIsCoverChanged(false);
      coursesStore.setIsStudentChanged(false);
      coursesStore.setIsRatingChanged(false);
      coursesStore.setIsContentChanged(false);
      untrack(() => coursesStore.asyncSetCourse(courseId));
    }
  });

  async function handleDelete() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed && (await coursesStore.asyncDeleteCourse(courseId))) {
      goto("/");
    }
  }

  async function handleLeave() {
    const result = await showConfirmDialog("Keluar dari kursus ini?");
    if (result.isConfirmed) coursesStore.asyncLeaveCourse(courseId);
  }

  async function handleDeleteContent(content: CourseContent) {
    const result = await showConfirmDialog(`Hapus konten "${content.title}"?`);
    if (result.isConfirmed) coursesStore.asyncDeleteContent(content.id);
  }

  function openAddContent() {
    editingContent = null;
    showContentModal = true;
  }

  function openEditContent(content: CourseContent) {
    editingContent = content;
    showContentModal = true;
  }

  function handleRate(event: SubmitEvent) {
    event.preventDefault();
    if (!ratingComment.trim()) {
      showErrorDialog("Komentar tidak boleh kosong");
      return;
    }
    coursesStore.asyncRateCourse(courseId, ratingValue, ratingComment.trim());
  }
</script>

{#if !profile || !course}
  <div class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  {@const canOpen = isOwner || isStudent}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <a
        href="/"
        data-testid="back-to-courses-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Kursus
      </a>

      <div class="flex flex-wrap items-center gap-2">
        {#if isOwner}
          <button
            type="button"
            data-testid="edit-cover-btn"
            onclick={() => (showCoverModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            <ImagePlus size={16} />
            Ubah Sampul
          </button>
          <button
            type="button"
            data-testid="edit-course-btn"
            onclick={() => (showEditModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <PenLine size={16} />
            Ubah Data
          </button>
          <button
            type="button"
            data-testid="delete-course-btn"
            onclick={handleDelete}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        {:else if isStudent}
          <button
            type="button"
            data-testid="leave-course-btn"
            onclick={handleLeave}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <LogOut size={16} />
            Keluar Kursus
          </button>
        {:else}
          <button
            type="button"
            data-testid="join-course-btn"
            onclick={() => coursesStore.asyncJoinCourse(courseId)}
            class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-colors"
          >
            <UserPlus size={16} />
            Gabung Kursus
          </button>
        {/if}
      </div>
    </div>

    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {#if course.cover}
        <div class="relative w-full h-64 sm:h-80 bg-slate-900 overflow-hidden">
          <img src={course.cover} alt={course.title} class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        </div>
      {/if}

      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{course.title}</h1>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span data-testid="course-detail-author">Pengajar: <strong>{course.author?.name ?? "-"}</strong></span>
            <span data-testid="course-detail-students">{`${(course.students ?? []).length} peserta`}</span>
            <span class="flex items-center gap-1"><Star size={14} /> {`${course.avg_ratings ?? 0}`}</span>
            <span class="flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              Diperbarui: <strong class="text-slate-500">{formatDate(course.updated_at)}</strong>
            </span>
          </div>
          {#if isStudent && !isOwner}
            <p data-testid="course-progress" class="text-sm font-semibold text-emerald-700">
              {`Kemajuan belajar: ${course.my_percentage_finished ?? 0}%`}
            </p>
          {/if}
        </div>

        <div
          data-testid="course-detail-description"
          class="prose max-w-none text-slate-600 bg-slate-50/60 p-6 rounded-2xl border border-slate-100 leading-relaxed"
        >
          <MarkdownViewer content={course.description} />
        </div>
      </div>
    </div>

    <section class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-800">Daftar Konten</h2>
        {#if isOwner}
          <button
            type="button"
            data-testid="add-content-btn"
            onclick={openAddContent}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Tambah Konten
          </button>
        {/if}
      </div>

      {#if !canOpen}
        <p class="text-xs text-slate-500 flex items-center gap-1.5">
          <Lock size={14} /> Gabung kursus untuk membuka materi.
        </p>
      {/if}

      {#if (course.contents ?? []).length === 0}
        <p data-testid="no-contents" class="text-sm italic text-slate-500">Belum ada konten.</p>
      {:else}
        <ul class="divide-y divide-slate-100">
          {#each course.contents as content (content.id)}
            <li class="flex items-center justify-between gap-3 py-3" data-testid={`content-item-${content.id}`}>
              <div class="flex items-center gap-3 min-w-0">
                <Video size={18} class="text-rose-700 shrink-0" />
                {#if canOpen}
                  <a
                    href={`/courses/${course.id}/contents/${content.id}`}
                    data-testid={`open-content-${content.id}`}
                    onclick={(e) => {
                      e.preventDefault();
                      goto(`/courses/${course.id}/contents/${content.id}`);
                    }}
                    class="text-sm font-medium text-slate-700 hover:text-indigo-600 truncate"
                  >
                    {content.title}
                  </a>
                {:else}
                  <span class="text-sm font-medium text-slate-500 truncate">{content.title}</span>
                {/if}
                {#if content.my_status_finished}
                  <CircleCheck size={16} class="text-emerald-700 shrink-0" />
                {/if}
              </div>
              {#if isOwner}
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-testid={`edit-content-${content.id}`}
                    onclick={() => openEditContent(content)}
                    class="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Ubah Konten"
                  >
                    <PenLine size={16} />
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-content-${content.id}`}
                    onclick={() => handleDeleteContent(content)}
                    class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Konten"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
      <h2 class="text-lg font-bold text-slate-800">Rating &amp; Ulasan</h2>

      {#if isStudent && !isOwner}
        <form onsubmit={handleRate} class="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="flex items-center gap-3">
            <label for="rating-select" class="text-sm font-semibold text-slate-700">Rating</label>
            <select
              id="rating-select"
              data-testid="rating-select"
              bind:value={ratingValue}
              class="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <textarea
            data-testid="rating-comment-input"
            bind:value={ratingComment}
            placeholder="Tulis ulasan Anda..."
            rows="3"
            class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          ></textarea>
          <button
            type="submit"
            data-testid="submit-rating-btn"
            class="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Kirim Rating
          </button>
        </form>
      {/if}

      {#if (course.ratings ?? []).length === 0}
        <p data-testid="no-ratings" class="text-sm italic text-slate-500">Belum ada rating.</p>
      {:else}
        <ul class="space-y-3">
          {#each course.ratings as rating, i (i)}
            <li class="p-4 rounded-2xl border border-slate-100" data-testid="rating-item">
              <p class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                {rating.name}
                <span class="inline-flex items-center gap-1 text-amber-700 text-xs"><Star size={14} /> {rating.ratings}</span>
              </p>
              <p class="text-sm text-slate-600 mt-1">{rating.comment}</p>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <ChangeCoverModal show={showCoverModal} {course} onClose={() => (showCoverModal = false)} />
    <ChangeModal show={showEditModal} {course} onClose={() => (showEditModal = false)} />
    <ContentModal
      show={showContentModal}
      courseId={course.id}
      content={editingContent}
      onClose={() => (showContentModal = false)}
    />
  </div>
{/if}
