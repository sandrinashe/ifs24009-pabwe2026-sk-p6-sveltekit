<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import AddModal from "../modals/AddModal.svelte";
  import { coursesStore, isCourseOwner, isCourseStudent } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { showConfirmDialog } from "../../../helpers/toolsHelper";
  import type { Course } from "../api/courseApi";
  import {
    Plus,
    GraduationCap,
    Eye,
    Trash2,
    Search,
    LoaderCircle,
    Star,
    Video,
    Users,
    User,
  } from "lucide-svelte";

  let loading = $state(false);
  let onlyMine = $state(false);
  let searchQuery = $state("");
  let showAddModal = $state(false);

  let profile = $derived($usersStore.profile);
  let courses = $derived($coursesStore.courses);
  let filteredCourses = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (course: Course) =>
        course.title.toLowerCase().includes(q) || course.description.toLowerCase().includes(q)
    );
  });

  async function loadCourses() {
    loading = true;
    await coursesStore.asyncSetCourses(onlyMine);
    loading = false;
  }

  onMount(loadCourses);

  // Muat ulang daftar setelah kursus ditambah atau diubah.
  $effect(() => {
    if ($coursesStore.isCourseChanged) {
      coursesStore.setIsCourseChanged(false);
      loadCourses();
    }
  });

  function toggleMine(value: boolean) {
    onlyMine = value;
    loadCourses();
  }

  async function handleDelete(course: Course) {
    const result = await showConfirmDialog(`Hapus kursus "${course.title}"?`);
    if (result.isConfirmed && (await coursesStore.asyncDeleteCourse(course.id))) {
      loadCourses();
    }
  }
</script>

{#if profile}
  <div class="space-y-8 animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Semua Kursus</h1>
        <p class="text-sm text-slate-500 mt-1">
          Jelajahi kursus, bergabung, dan ikuti materi video pembelajarannya.
        </p>
      </div>
      <button
        type="button"
        data-testid="add-course-btn"
        onclick={() => (showAddModal = true)}
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Tambah Kursus</span>
      </button>
    </div>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          data-testid="search-course-input"
          bind:value={searchQuery}
          placeholder="Cari judul atau deskripsi kursus..."
          class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        />
      </div>

      <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
        <button
          type="button"
          data-testid="filter-all-btn"
          onclick={() => toggleMine(false)}
          class="px-3 py-1.5 rounded-lg transition-all {!onlyMine ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}"
        >
          Semua
        </button>
        <button
          type="button"
          data-testid="filter-mine-btn"
          onclick={() => toggleMine(true)}
          class="px-3 py-1.5 rounded-lg transition-all {onlyMine ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
        >
          Milik Saya
        </button>
      </div>
    </div>

    {#if loading && filteredCourses.length === 0}
      <div class="py-16 text-center text-slate-400">
        <LoaderCircle size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
        <p class="font-medium text-slate-600">Memuat daftar kursus...</p>
      </div>
    {:else if filteredCourses.length === 0}
      <div class="py-16 text-center text-slate-400">
        <GraduationCap size={40} class="mx-auto text-slate-300 mb-2" />
        <p class="font-medium">Belum ada kursus yang cocok.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {#each filteredCourses as course (course.id)}
          {@const owner = isCourseOwner(course, profile)}
          {@const student = isCourseStudent(course, profile)}
          <article
            data-testid={`course-card-${course.id}`}
            class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
          >
            {#if course.cover}
              <img src={course.cover} alt={course.title} class="w-full h-40 object-cover" />
            {:else}
              <div class="w-full h-40 bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white/90">
                <GraduationCap size={48} />
              </div>
            {/if}
            <div class="p-5 flex-1 flex flex-col gap-3">
              <div class="flex flex-wrap items-center gap-2">
                {#if owner}
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">Milik Saya</span>
                {:else if student}
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Terdaftar</span>
                {/if}
              </div>
              <h3 class="font-bold text-slate-800 leading-snug line-clamp-2">{course.title}</h3>
              <div class="mt-auto space-y-2 text-xs text-slate-500">
                <p class="flex items-center gap-1.5">
                  <User size={14} />
                  <span data-testid={`course-author-${course.id}`}>{course.author?.name ?? "-"}</span>
                </p>
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1"><Video size={14} /> {`${course.total_contents ?? 0} materi`}</span>
                  <span class="flex items-center gap-1"><Users size={14} /> {`${(course.students ?? []).length}`}</span>
                  <span class="flex items-center gap-1"><Star size={14} /> {`${course.avg_ratings ?? 0}`}</span>
                </div>
              </div>
              <div class="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  data-testid={`view-course-${course.id}`}
                  onclick={() => goto(`/courses/${course.id}`)}
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Eye size={16} /> Lihat
                </button>
                {#if owner}
                  <button
                    type="button"
                    data-testid={`delete-course-${course.id}`}
                    onclick={() => handleDelete(course)}
                    class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Kursus"
                  >
                    <Trash2 size={18} />
                  </button>
                {/if}
              </div>
            </div>
          </article>
        {/each}
      </div>
    {/if}

    <AddModal show={showAddModal} onClose={() => (showAddModal = false)} />
  </div>
{/if}
