import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import ContentModal from "./ContentModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const content: any = { id: 9, course_id: 4, title: "Bab Lama", youtube: "https://youtu.be/dQw4w9WgXcQ" };
const q = (id: string) => document.querySelector<HTMLInputElement>(`[data-testid="${id}"]`)!;
function type(id: string, value: string) {
  const el = q(id);
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
const submit = async () => {
  q("submit-content-modal-btn").click();
  await new Promise((r) => setTimeout(r, 0));
};

describe("ContentModal", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation((() => {}) as any);
  });

  it("should not render when hidden", () => {
    renderWithProviders(ContentModal, { props: { show: false, courseId: 4 } });
    expect(q("content-modal")).toBeNull();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should render an empty add form", async () => {
    renderWithProviders(ContentModal, { props: { show: true, courseId: 4 } });
    await tick();
    expect(document.body.textContent).toContain("Tambah Konten");
    expect(q("content-title-input").value).toBe("");
    expect(q("content-youtube-input").value).toBe("");
  });

  it("should prefill the edit form", async () => {
    renderWithProviders(ContentModal, { props: { show: true, courseId: 4, content } });
    await tick();
    expect(document.body.textContent).toContain("Ubah Konten");
    expect(q("content-title-input").value).toBe("Bab Lama");
    expect(q("content-youtube-input").value).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("should validate title and youtube link", async () => {
    const { coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4 } });
    const add = vi.spyOn(coursesStore, "asyncAddContent");
    await tick();

    await submit();
    expect(errorSpy).toHaveBeenCalledWith("Judul konten tidak boleh kosong");

    type("content-title-input", "Bab 1");
    type("content-youtube-input", "https://example.com/video");
    await tick();
    await submit();
    expect(errorSpy).toHaveBeenCalledWith("Tautan YouTube tidak valid");
    expect(add).not.toHaveBeenCalled();
  });

  it("should add a content and close on success", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4, onClose } });
    const add = vi.spyOn(coursesStore, "asyncAddContent").mockResolvedValue(true);
    await tick();

    type("content-title-input", " Bab 1 ");
    type("content-youtube-input", " https://youtu.be/dQw4w9WgXcQ ");
    await tick();
    await submit();

    expect(add).toHaveBeenCalledWith(4, "Bab 1", "https://youtu.be/dQw4w9WgXcQ");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should change a content and stay open on failure", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 4, content, onClose },
    });
    const change = vi.spyOn(coursesStore, "asyncChangeContent").mockResolvedValue(false);
    await tick();
    await submit();

    expect(change).toHaveBeenCalledWith(9, "Bab Lama", "https://youtu.be/dQw4w9WgXcQ");
    expect(onClose).not.toHaveBeenCalled();

    change.mockResolvedValue(true);
    await submit();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should work without an onClose handler", async () => {
    const { coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4, content } });
    vi.spyOn(coursesStore, "asyncChangeContent").mockResolvedValue(true);
    await tick();
    await submit();
    q("close-content-modal-btn").click();
    q("cancel-content-modal-btn").click();
    expect(q("content-modal")).not.toBeNull();
  });

  it("should show loading state and close from buttons", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4, content, onClose } });
    vi.spyOn(coursesStore, "asyncChangeContent").mockReturnValue(new Promise(() => {}));
    await tick();
    await submit();
    expect(q("submit-content-modal-btn").textContent).toContain("Menyimpan...");

    q("close-content-modal-btn").click();
    expect(q("cancel-content-modal-btn").disabled).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
