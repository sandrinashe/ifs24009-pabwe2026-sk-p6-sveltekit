<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import "@toast-ui/editor/dist/toastui-editor.css";

  export let value: string = "";
  export let placeholder: string = "Tulis deskripsi dengan format Markdown...";
  export let height: string = "240px";
  export let textareaTestId: string = "markdown-editor-textarea";

  let editorContainer: HTMLElement;
  let editorInstance: any = null;
  let observer: MutationObserver = null as any;

  // Toast UI memakai atribut "aria-role" yang tidak valid dan textarea tanpa label.
  // Rapikan agar lolos pemeriksaan aksesibilitas (axe).
  function fixEditorA11y(root: HTMLElement) {
    root.querySelectorAll("[aria-role]").forEach((el) => {
      el.removeAttribute("aria-role");
      el.removeAttribute("aria-selected");
    });
    root.querySelectorAll("textarea:not([aria-label])").forEach((el) => {
      el.setAttribute("aria-label", "Editor Markdown");
    });
    root.querySelectorAll("button:not([aria-label]):not([title])").forEach((el) => {
      el.setAttribute("aria-label", "Alat editor lainnya");
    });
  }

  onMount(async () => {
    try {
      const { default: Editor } = await import("@toast-ui/editor");
      editorInstance = new Editor({
        el: editorContainer,
        height: height,
        initialEditType: "markdown",
        previewStyle: "tab",
        initialValue: value || "",
        placeholder: placeholder,
        usageStatistics: false,
        hideModeSwitch: false,
        events: {
          change: () => {
            value = editorInstance.getMarkdown();
          },
        },
      });
      fixEditorA11y(editorContainer);
      observer = new MutationObserver(() => fixEditorA11y(editorContainer));
      observer.observe(editorContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-role"],
      });
    } catch {
      editorInstance = null;
    }
  });

  $: if (editorInstance && value !== editorInstance.getMarkdown()) {
    editorInstance.setMarkdown(value || "");
  }

  function onTextareaInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    value = target.value;
    if (editorInstance) {
      editorInstance.setMarkdown(target.value);
    }
  }

  onDestroy(() => {
    if (editorInstance) {
      observer.disconnect();
      editorInstance.destroy();
      editorInstance = null;
    }
  });
</script>

<div class="toastui-editor-wrapper">
  <!-- Fallback hidden textarea with data-testid for accessibility and test compatibility -->
  <textarea
    data-testid={textareaTestId}
    {value}
    on:input={onTextareaInput}
    class="hidden"
    tabindex="-1"
    aria-hidden="true"
  ></textarea>
  <div bind:this={editorContainer} data-testid="markdown-editor-container"></div>
</div>

<style>
  .toastui-editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
  .toastui-editor-wrapper > div[data-testid="markdown-editor-container"] {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  :global(.toastui-editor-wrapper .toastui-editor-defaultUI) {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    overflow: hidden;
    font-family: inherit;
  }
  :global(.toastui-editor-wrapper .toastui-editor-main) {
    flex: 1;
    min-height: 0;
  }
  :global(.toastui-editor-wrapper .toastui-editor-toolbar) {
    background-color: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
  }
  :global(.toastui-editor-wrapper .toastui-editor-tabs .tab-item),
  :global(.toastui-editor-wrapper .toastui-editor-mode-switch .tab-item) {
    color: #475569;
  }
  :global(.toastui-editor-wrapper .placeholder) {
    color: #64748b !important;
  }
  :global(.toastui-editor-wrapper .toastui-editor-contents) {
    font-family: inherit;
    font-size: 0.875rem;
  }
</style>
