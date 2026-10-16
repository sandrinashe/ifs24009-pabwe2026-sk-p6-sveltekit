<script lang="ts">
  import { Video, X, LoaderCircle, Save } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import type { CourseContent, Id } from "../api/courseApi";
  import { showErrorDialog } from "../../../helpers/toolsHelper";
  import { getYoutubeEmbedUrl } from "../../../helpers/youtubeHelper";

  let {
    show = false,
    courseId = null,
    content = null,
    onClose,
  }: {
    show?: boolean;
    courseId?: Id | null;
    content?: CourseContent | null;
    onClose?: () => void;
  } = $props();

  let loading = $state(false);
  let title = $state("");
  let youtube = $state("");

  $effect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
  });

  // Mode ubah mengisi formulir dari konten; mode tambah mengosongkannya.
  $effect(() => {
    if (show) {
      title = content ? content.title : "";
      youtube = content ? content.youtube : "";
    }
  });

  async function handleSave(event: SubmitEvent) {
    event.preventDefault();
    if (!title.trim()) {
      showErrorDialog("Judul konten tidak boleh kosong");
      return;
    }
    if (!getYoutubeEmbedUrl(youtube)) {
      showErrorDialog("Tautan YouTube tidak valid");
      return;
    }

    loading = true;
    const ok = content
      ? await coursesStore.asyncChangeContent(content.id, title.trim(), youtube.trim())
      : await coursesStore.asyncAddContent(courseId!, title.trim(), youtube.trim());
    loading = false;
    if (ok) onClose?.();
  }
</script>

{#if show}
  <div
    data-testid="content-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <Video size={18} strokeWidth={2.5} />
          </div>
          <h3 class="text-base font-bold text-slate-800">
            {content ? "Ubah Konten" : "Tambah Konten"}
          </h3>
        </div>
        <button
          type="button"
          data-testid="close-content-modal-btn"
          onclick={() => onClose?.()}
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form onsubmit={handleSave} class="p-6 space-y-4">
        <div>
          <label for="content-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Konten <span class="text-red-500">*</span>
          </label>
          <input
            id="content-title-input"
            type="text"
            data-testid="content-title-input"
            bind:value={title}
            placeholder="Contoh: Pengenalan Komponen"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
          />
        </div>
        <div>
          <label for="content-youtube-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Tautan YouTube <span class="text-red-500">*</span>
          </label>
          <input
            id="content-youtube-input"
            type="url"
            data-testid="content-youtube-input"
            bind:value={youtube}
            placeholder="https://www.youtube.com/watch?v=..."
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-content-modal-btn"
            onclick={() => onClose?.()}
            disabled={loading}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-content-modal-btn"
            disabled={loading}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            {#if loading}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <Save size={18} />
              <span>Simpan</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
