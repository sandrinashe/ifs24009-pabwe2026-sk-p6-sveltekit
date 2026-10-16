<script lang="ts">
  import { Plus, X, LoaderCircle } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";
  import MarkdownEditor from "../components/MarkdownEditor.svelte";

  let { show = false, onClose }: { show?: boolean; onClose?: () => void } = $props();

  let loading = $state(false);
  let title = $state("");
  let description = $state("");

  $effect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
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
    const ok = await coursesStore.asyncAddCourse(title.trim(), description.trim());
    loading = false;
    if (ok) {
      title = "";
      description = "";
      onClose?.();
    }
  }
</script>

{#if show}
  <div
    data-testid="add-course-modal"
    class="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-200 overflow-hidden"
  >
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
          <Plus size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">Tambah Kursus Baru</h2>
          <p class="text-xs text-slate-500">Tuliskan deskripsi kursus dengan format Markdown</p>
        </div>
      </div>
      <button
        type="button"
        data-testid="close-add-modal-btn"
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
          <label for="add-course-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Kursus <span class="text-red-700">*</span>
          </label>
          <input
            id="add-course-title-input"
            type="text"
            data-testid="add-course-title-input"
            bind:value={title}
            placeholder="Contoh: Pemrograman Web dengan SvelteKit"
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
              placeholder="Tuliskan gambaran materi dan tujuan kursus..."
              height="100%"
              textareaTestId="add-course-description-input"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0">
        <button
          type="button"
          data-testid="cancel-add-modal-btn"
          onclick={() => onClose?.()}
          disabled={loading}
          class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          data-testid="submit-add-modal-btn"
          disabled={loading}
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
        >
          {#if loading}
            <LoaderCircle size={18} class="animate-spin" />
            <span>Menyimpan...</span>
          {:else}
            <Plus size={18} strokeWidth={2.5} />
            <span>Tambah Kursus</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
{/if}
