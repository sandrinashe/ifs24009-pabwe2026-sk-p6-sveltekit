import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import ChangeCoverModal from "./ChangeCoverModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const course: any = { id: 4, user_id: 1, title: "Kursus", description: "D" };
const q = (id: string) => document.querySelector<HTMLInputElement>(`[data-testid="${id}"]`)!;

function pickFile(file: File | null) {
  const input = q("cover-file-input");
  Object.defineProperty(input, "files", {
    value: file ? [file] : [],
    configurable: true,
  });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
const submit = async () => {
  q("submit-cover-modal-btn").click();
  await new Promise((r) => setTimeout(r, 0));
};

describe("ChangeCoverModal", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation((() => {}) as any);
    (URL as any).createObjectURL = vi.fn(() => "blob:preview");
  });

  it("should not render when hidden or without a course", () => {
    renderWithProviders(ChangeCoverModal, { props: { show: false, course } });
    expect(q("change-cover-modal")).toBeNull();
    renderWithProviders(ChangeCoverModal, { props: { show: true } });
    expect(q("change-cover-modal")).toBeNull();
  });

  it("should ask for a file before saving", async () => {
    renderWithProviders(ChangeCoverModal, { props: { show: true, course } });
    expect(document.body.style.overflow).toBe("hidden");
    await submit();
    expect(errorSpy).toHaveBeenCalledWith("Silakan pilih sampul baru!");
  });

  it("should ignore an empty file selection", async () => {
    renderWithProviders(ChangeCoverModal, { props: { show: true, course } });
    pickFile(null);
    await tick();
    expect(document.querySelector("img")).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("should reject non-image and oversized files", async () => {
    renderWithProviders(ChangeCoverModal, { props: { show: true, course } });
    pickFile(new File(["x"], "a.pdf", { type: "application/pdf" }));
    expect(errorSpy).toHaveBeenCalledWith("Pilih file gambar (JPG/PNG)!");

    const big = new File([new Uint8Array(1024 * 1024 + 1)], "big.png", { type: "image/png" });
    pickFile(big);
    expect(errorSpy).toHaveBeenCalledWith("Ukuran gambar maksimal 1MB!");
    expect(document.querySelector("img")).toBeNull();
  });

  it("should preview a valid image and upload it", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ChangeCoverModal, { props: { show: true, course, onClose } });
    const spy = vi.spyOn(coursesStore, "asyncChangeCover").mockResolvedValue(true);

    const file = new File(["x"], "a.png", { type: "image/png" });
    pickFile(file);
    await tick();
    expect(document.querySelector("img")!.getAttribute("src")).toBe("blob:preview");

    await submit();
    expect(spy).toHaveBeenCalledWith(4, file);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.querySelector("img")).toBeNull();
  });

  it("should stay open when upload fails and show loading state", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ChangeCoverModal, { props: { show: true, course, onClose } });
    const spy = vi.spyOn(coursesStore, "asyncChangeCover").mockResolvedValue(false);
    pickFile(new File(["x"], "a.png", { type: "image/png" }));
    await tick();
    await submit();
    expect(onClose).not.toHaveBeenCalled();

    spy.mockReturnValue(new Promise(() => {}));
    await submit();
    expect(q("submit-cover-modal-btn").textContent).toContain("Mengunggah...");
  });

  it("should close from the buttons, with or without a handler", async () => {
    const onClose = vi.fn();
    const first = renderWithProviders(ChangeCoverModal, { props: { show: true, course, onClose } });
    q("close-cover-modal-btn").click();
    q("cancel-cover-modal-btn").click();
    expect(onClose).toHaveBeenCalledTimes(2);
    first.unmount();

    renderWithProviders(ChangeCoverModal, { props: { show: true, course } });
    q("close-cover-modal-btn").click();
    expect(q("change-cover-modal")).not.toBeNull();
  });

  it("should upload without an onClose handler", async () => {
    const { coursesStore } = renderWithProviders(ChangeCoverModal, { props: { show: true, course } });
    vi.spyOn(coursesStore, "asyncChangeCover").mockResolvedValue(true);
    pickFile(new File(["x"], "a.png", { type: "image/png" }));
    await tick();
    await submit();
    expect(document.querySelector("img")).toBeNull();
  });
});
