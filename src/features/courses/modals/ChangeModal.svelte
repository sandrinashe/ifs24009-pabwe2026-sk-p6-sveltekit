<script lang="ts">
  import { PenLine, X, LoaderCircle } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import type { Course } from "../api/courseApi";
  import { showErrorDialog } from "../../../helpers/toolsHelper";
  import MarkdownEditor from "../components/MarkdownEditor.svelte";

  let {
    show = false,
    course = null,
    onClose,
  }: { show?: boolean; course?: Course | null; onClose?: () => void } = $props();

  let loading = $state(false);
  let title = $state("");
  let description = $state("");

  $effect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
  });

  // Isi formulir dengan data kursus saat modal dibuka.
  $effect(() => {
    if (show && course) {
      title = course.title;
      description = course.description;
    }
  });

  async function handleSave(event: SubmitEvent) {
    event.preventDefault();
    if (!title.trim()) {
      showErrorDialog("Judul tidak boleh kosong");
      return;
    }
    if (!description.trim()) {
      showErrorDialog("Deskripsi tidak boleh kosong");
      return;
    }

    loading = true;
    const ok = await coursesStore.asyncChangeCourse(course!.id, title.trim(), description.trim());
    loading = false;
    if (ok) onClose?.();
  }
</script>

{#if show && course}
  <div
    data-testid="change-course-modal"
    class="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-200 overflow-hidden"
  >
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
          <PenLine size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">Ubah Data Kursus</h2>
          <p class="text-xs text-slate-500">Perbarui judul dan deskripsi kursus</p>
        </div>
      </div>
      <button
        type="button"
        data-testid="close-change-modal-btn"
          aria-label="Tutup"
        onclick={() => onClose?.()}
        class="p-2 rounded-xl text-slate-500 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
      >
        <X size={20} />
      </button>
    </div>

    <form onsubmit={handleSave} class="flex-1 flex flex-col min-h-0 bg-white">
      <div class="flex-1 flex flex-col min-h-0 p-6 md:p-8 space-y-4 w-full">
        <div class="shrink-0">
          <label for="change-course-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Kursus <span class="text-red-700">*</span>
          </label>
          <input
            id="change-course-title-input"
            type="text"
            data-testid="change-course-title-input"
            bind:value={title}
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
          />
        </div>

        <div class="flex-1 flex flex-col min-h-0">
          <span class="block text-sm font-semibold text-slate-700 mb-1.5 shrink-0">
            Deskripsi (Markdown) <span class="text-red-700">*</span>
          </span>
          <div class="flex-1 min-h-[300px]">
            <MarkdownEditor
              bind:value={description}
              height="100%"
              textareaTestId="change-course-description-input"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0">
        <button
          type="button"
          data-testid="cancel-change-modal-btn"
          onclick={() => onClose?.()}
          disabled={loading}
          class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          data-testid="submit-change-modal-btn"
          disabled={loading}
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 active:bg-amber-900 rounded-xl shadow-md shadow-amber-600/25 transition-all disabled:opacity-60"
        >
          {#if loading}
            <LoaderCircle size={18} class="animate-spin" />
            <span>Menyimpan...</span>
          {:else}
            <PenLine size={18} strokeWidth={2.5} />
            <span>Simpan Perubahan</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
{/if}
