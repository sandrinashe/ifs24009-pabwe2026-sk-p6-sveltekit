import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const course: any = { id: 4, user_id: 1, title: "Judul Lama", description: "Deskripsi Lama" };
const q = (id: string) => document.querySelector<HTMLInputElement>(`[data-testid="${id}"]`)!;
function type(id: string, value: string) {
  const el = q(id);
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
const submit = async () => {
  q("submit-change-modal-btn").click();
  await new Promise((r) => setTimeout(r, 0));
};

describe("ChangeModal", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation((() => {}) as any);
  });

  it("should not render when hidden or without a course", () => {
    renderWithProviders(ChangeModal, { props: { show: false, course } });
    expect(q("change-course-modal")).toBeNull();
    renderWithProviders(ChangeModal, { props: { show: true, course: null } });
    expect(q("change-course-modal")).toBeNull();
    renderWithProviders(ChangeModal, { props: { show: true } });
    expect(q("change-course-modal")).toBeNull();
  });

  it("should prefill the form from the course", async () => {
    renderWithProviders(ChangeModal, { props: { show: true, course } });
    await tick();
    expect(q("change-course-title-input").value).toBe("Judul Lama");
    expect(q("change-course-description-input").value).toBe("Deskripsi Lama");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should validate empty fields", async () => {
    const { coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course } });
    const spy = vi.spyOn(coursesStore, "asyncChangeCourse");
    await tick();

    type("change-course-title-input", " ");
    await tick();
    await submit();
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    type("change-course-title-input", "Baru");
    type("change-course-description-input", " ");
    await tick();
    await submit();
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should save changes and close on success", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course, onClose } });
    const spy = vi.spyOn(coursesStore, "asyncChangeCourse").mockResolvedValue(true);
    await tick();

    type("change-course-title-input", " Judul Baru ");
    type("change-course-description-input", " Deskripsi Baru ");
    await tick();
    await submit();

    expect(spy).toHaveBeenCalledWith(4, "Judul Baru", "Deskripsi Baru");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should stay open when saving fails and work without onClose", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course, onClose } });
    const spy = vi.spyOn(coursesStore, "asyncChangeCourse").mockResolvedValue(false);
    await tick();
    await submit();
    expect(spy).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should save without an onClose handler", async () => {
    const { coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course } });
    vi.spyOn(coursesStore, "asyncChangeCourse").mockResolvedValue(true);
    await tick();
    await submit();
    q("close-change-modal-btn").click();
    q("cancel-change-modal-btn").click();
    expect(q("change-course-modal")).not.toBeNull();
  });

  it("should show a loading state and close via buttons", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course, onClose } });
    vi.spyOn(coursesStore, "asyncChangeCourse").mockReturnValue(new Promise(() => {}));
    await tick();
    await submit();
    expect(q("submit-change-modal-btn").textContent).toContain("Menyimpan...");

    q("close-change-modal-btn").click();
    expect(q("cancel-change-modal-btn").disabled).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
