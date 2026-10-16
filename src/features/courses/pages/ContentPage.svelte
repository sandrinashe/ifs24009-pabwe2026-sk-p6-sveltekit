<script lang="ts">
  import { untrack } from "svelte";
  import { goto } from "$app/navigation";
  import { coursesStore, isCourseOwner, isCourseStudent } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { getYoutubeEmbedUrl } from "../../../helpers/youtubeHelper";
  import type { Id } from "../api/courseApi";
  import { ArrowLeft, Video, CircleCheck, Circle } from "lucide-svelte";

  let { courseId, contentId }: { courseId: Id; contentId: Id } = $props();

  let profile = $derived($usersStore.profile);
  let content = $derived($coursesStore.content);
  let course = $derived(
    String($coursesStore.course?.id) === String(courseId) ? $coursesStore.course : null
  );
  let playlist = $derived(course?.contents ?? []);
  let canLearn = $derived(isCourseStudent(course, profile) && !isCourseOwner(course, profile));
  let embedUrl = $derived(getYoutubeEmbedUrl(content?.youtube));
  let isFinished = $derived(!!content?.my_status_finished);

  // Muat materi dan kursusnya (untuk daftar putar) setiap parameter berubah.
  $effect(() => {
    const cId = courseId;
    const id = contentId;
    untrack(() => {
      coursesStore.setContent(null);
      coursesStore.asyncSetContent(id);
      coursesStore.asyncSetCourse(cId);
    });
  });

  // Materi tidak ditemukan: kembali ke detail kursus.
  $effect(() => {
    if ($coursesStore.isContent) {
      coursesStore.setIsContent(false);
      if (!$coursesStore.content) goto(`/courses/${courseId}`);
    }
  });

  // Status belajar berubah: muat ulang materi.
  $effect(() => {
    if ($coursesStore.isContentChanged) {
      coursesStore.setIsContentChanged(false);
      untrack(() => coursesStore.asyncSetContent(contentId));
    }
  });

  function toggleLearn() {
    coursesStore.asyncLearnContent(contentId, isFinished ? 0 : 1);
  }
</script>

{#if !profile || !content}
  <div class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto animate-in fade-in duration-300">
    <div class="lg:col-span-2 space-y-4">
      <a
        href={`/courses/${courseId}`}
        data-testid="back-to-course-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Kursus
      </a>

      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {#if embedUrl}
          <div class="aspect-video bg-black">
            <iframe
              data-testid="content-player"
              src={embedUrl}
              title={content.title}
              class="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        {:else}
          <p data-testid="invalid-video" class="p-8 text-sm text-red-600">Tautan video tidak valid.</p>
        {/if}

        <div class="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 class="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Video size={22} class="text-rose-700" />
            {content.title}
          </h1>
          {#if canLearn}
            <button
              type="button"
              data-testid="toggle-learn-btn"
              onclick={toggleLearn}
              class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-colors {isFinished ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'}"
            >
              {#if isFinished}
                <CircleCheck size={16} /> Selesai (batalkan)
              {:else}
                <Circle size={16} /> Tandai Selesai
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </div>

    {#if course}
      <aside class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 h-fit space-y-3">
        <h2 class="font-bold text-slate-800 line-clamp-2">{course.title}</h2>
        <ul class="space-y-1">
          {#each playlist as item (item.id)}
            <li>
              <a
                href={`/courses/${course.id}/contents/${item.id}`}
                data-testid={`playlist-item-${item.id}`}
                onclick={(e) => {
                  e.preventDefault();
                  goto(`/courses/${course.id}/contents/${item.id}`);
                }}
                class={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${String(item.id) === String(contentId) ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {#if item.my_status_finished}
                  <CircleCheck size={16} class="text-emerald-700 shrink-0" />
                {:else}
                  <Circle size={16} class="text-slate-300 shrink-0" />
                {/if}
                <span class="truncate">{item.title}</span>
              </a>
            </li>
          {/each}
        </ul>
      </aside>
    {/if}
  </div>
{/if}
