import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import MarkdownEditor from "./MarkdownEditor.svelte";

let mockEvents: Record<string, any> = {};
const mockGetMarkdown = vi.fn(() => "mock editor text");
const mockSetMarkdown = vi.fn();
const mockDestroy = vi.fn();

vi.mock("@toast-ui/editor", () => {
  return {
    default: vi.fn().mockImplementation(function (this: any, options: any) {
      mockEvents = options.events || {};
      this.getMarkdown = mockGetMarkdown;
      this.setMarkdown = mockSetMarkdown;
      this.destroy = mockDestroy;
    }),
  };
});

describe("MarkdownEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEvents = {};
  });

  it("should initialize Editor with props and handle change event", async () => {
    const { container, rerender, unmount } = render(MarkdownEditor, {
      props: {
        value: "initial text",
        placeholder: "Tulis...",
        height: "300px",
        textareaTestId: "custom-editor-textarea",
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    const textarea = container.querySelector('[data-testid="custom-editor-textarea"]');
    expect(textarea).toBeTruthy();

    // Trigger editor event change
    if (mockEvents.change) {
      mockEvents.change();
    }

    // Update prop value to different value
    await rerender({ value: "updated prop" });
    await new Promise((r) => setTimeout(r, 10));
    expect(mockSetMarkdown).toHaveBeenCalledWith("updated prop");

    // Update prop value to empty
    await rerender({ value: "" });
    await new Promise((r) => setTimeout(r, 10));
    expect(mockSetMarkdown).toHaveBeenCalledWith("");

    // Unmount
    unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("should handle onTextareaInput fallback", async () => {
    const { container } = render(MarkdownEditor, {
      props: {
        value: "",
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeTruthy();
    if (textarea) {
      await fireEvent.input(textarea, { target: { value: "manual input" } });
    }

    expect(mockSetMarkdown).toHaveBeenCalledWith("manual input");
  });

  it("should handle input and unmount gracefully when Editor fails to initialize", async () => {
    const EditorMock = ((await import("@toast-ui/editor")) as any).default;
    EditorMock.mockImplementationOnce(function () {
      throw new Error("Initialization failed");
    });

    const { container, unmount } = render(MarkdownEditor, {
      props: {
        value: "fallback text",
      },
    });

    const textarea = container.querySelector("textarea");
    if (textarea) {
      await fireEvent.input(textarea, { target: { value: "manual input fallback" } });
    }
    unmount();
  });

  it("should clean up invalid ARIA attributes and unlabeled textareas created by the editor", async () => {
    const { container } = render(MarkdownEditor, { props: { value: "x" } });
    await new Promise((r) => setTimeout(r, 10));

    const host = container.querySelector('[data-testid="markdown-editor-container"]') as HTMLElement;
    host.innerHTML =
      '<div class="tab-item" aria-role="tab" aria-selected="true">Write</div><button class="more"></button><button title="Ada judul"></button><textarea class="clip"></textarea><textarea aria-label="Sudah"></textarea>';
    await new Promise((r) => setTimeout(r, 10));

    const tab = host.querySelector(".tab-item") as HTMLElement;
    expect(tab.hasAttribute("aria-role")).toBe(false);
    expect(tab.hasAttribute("aria-selected")).toBe(false);
    expect(host.querySelector(".clip")?.getAttribute("aria-label")).toBe("Editor Markdown");
    expect(host.querySelectorAll('textarea[aria-label="Sudah"]').length).toBe(1);
    expect(host.querySelector(".more")?.getAttribute("aria-label")).toBe("Alat editor lainnya");
    expect(host.querySelector("button[title]")?.hasAttribute("aria-label")).toBe(false);
  });
});
