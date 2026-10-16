import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const q = (id: string) => document.querySelector<HTMLInputElement>(`[data-testid="${id}"]`)!;
function type(id: string, value: string) {
  const el = q(id);
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
const submit = async () => {
  q("submit-add-modal-btn").click();
  await new Promise((r) => setTimeout(r, 0));
};

describe("AddModal", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation((() => {}) as any);
  });

  it("should not render when show is false", () => {
    renderWithProviders(AddModal, { props: { show: false } });
    expect(q("add-course-modal")).toBeNull();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should lock body scroll when shown", () => {
    renderWithProviders(AddModal, { props: { show: true } });
    expect(q("add-course-modal")).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should validate empty title and empty description", async () => {
    const { coursesStore } = renderWithProviders(AddModal, { props: { show: true } });
    const spy = vi.spyOn(coursesStore, "asyncAddCourse");

    await submit();
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    type("add-course-title-input", "Judul");
    await tick();
    await submit();
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should add a course, reset the form and close on success", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(AddModal, { props: { show: true, onClose } });
    const spy = vi.spyOn(coursesStore, "asyncAddCourse").mockResolvedValue(true);

    type("add-course-title-input", "  Judul  ");
    type("add-course-description-input", "  Deskripsi  ");
    await tick();
    await submit();

    expect(spy).toHaveBeenCalledWith("Judul", "Deskripsi");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(q("add-course-title-input").value).toBe("");
  });

  it("should keep the form open when saving fails", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(AddModal, { props: { show: true, onClose } });
    vi.spyOn(coursesStore, "asyncAddCourse").mockResolvedValue(false);

    type("add-course-title-input", "Judul");
    type("add-course-description-input", "Deskripsi");
    await tick();
    await submit();

    expect(onClose).not.toHaveBeenCalled();
    expect(q("add-course-title-input").value).toBe("Judul");
    expect(q("submit-add-modal-btn").disabled).toBe(false);
  });

  it("should show a loading state while saving", async () => {
    const { coursesStore } = renderWithProviders(AddModal, { props: { show: true } });
    vi.spyOn(coursesStore, "asyncAddCourse").mockReturnValue(new Promise(() => {}));

    type("add-course-title-input", "Judul");
    type("add-course-description-input", "Deskripsi");
    await tick();
    await submit();

    expect(q("submit-add-modal-btn").disabled).toBe(true);
    expect(q("submit-add-modal-btn").textContent).toContain("Menyimpan...");
  });

  it("should close from the close and cancel buttons", async () => {
    const onClose = vi.fn();
    renderWithProviders(AddModal, { props: { show: true, onClose } });
    q("close-add-modal-btn").click();
    q("cancel-add-modal-btn").click();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("should not fail without an onClose handler", async () => {
    renderWithProviders(AddModal, { props: { show: true } });
    q("close-add-modal-btn").click();
    q("cancel-add-modal-btn").click();
    expect(q("add-course-modal")).not.toBeNull();
  });

  it("should add a course without an onClose handler", async () => {
    const { coursesStore } = renderWithProviders(AddModal, { props: { show: true } });
    vi.spyOn(coursesStore, "asyncAddCourse").mockResolvedValue(true);
    type("add-course-title-input", "Judul");
    type("add-course-description-input", "Deskripsi");
    await tick();
    await submit();
    expect(q("add-course-title-input").value).toBe("");
  });
});
