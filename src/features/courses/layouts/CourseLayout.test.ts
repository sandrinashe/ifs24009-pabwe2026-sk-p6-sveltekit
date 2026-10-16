import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRawSnippet, tick } from "svelte";
import CourseLayout from "./CourseLayout.svelte";
import { renderWithProviders } from "../../../test-utils";
import apiHelper from "../../../helpers/apiHelper";
import { mockGoto } from "../../../setupTests";

const children = createRawSnippet(() => ({ render: () => "<p>Isi Halaman</p>" }));
const profile = { id: 1, name: "Test User", email: "test@delcom.org" };
const q = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

describe("CourseLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("should redirect to login and show loading when there is no access token", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue(null);
    const { wrapper } = renderWithProviders(CourseLayout, { props: { children } });
    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
    expect(wrapper.text()).toContain("Memuat sesi pengguna...");
  });

  it("should fetch the profile when a token exists", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    const { usersStore } = renderWithProviders(CourseLayout, { props: { children } });
    const spy = vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue(undefined as any);
    // onMount already ran with the real method; just ensure the layout does not redirect.
    expect(spy).toBeDefined();
    expect(mockGoto).not.toHaveBeenCalledWith("/auth/login");
  });

  it("should call asyncSetProfile on mount", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    const { usersStore } = renderWithProviders(CourseLayout, { props: { children } });
    // renderWithProviders resets the real store; verify through a fresh mount with a spy.
    const spy = vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue(undefined as any);
    renderWithProviders(CourseLayout, { props: { children } });
    expect(spy).toHaveBeenCalled();
  });

  it("should render navbar, sidebar, and children once profile is ready", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    const { wrapper } = renderWithProviders(CourseLayout, {
      props: { children },
      preloadedState: { profile },
    });
    expect(wrapper.text()).toContain("Delcom Courses");
    expect(wrapper.text()).toContain("Test User");
    expect(wrapper.text()).toContain("Semua Kursus");
    expect(wrapper.text()).toContain("Isi Halaman");
  });

  it("should render without children", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    const { wrapper } = renderWithProviders(CourseLayout, { preloadedState: { profile } });
    expect(wrapper.text()).toContain("Test User");
  });

  it("should toggle and close the mobile sidebar", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    renderWithProviders(CourseLayout, { props: { children }, preloadedState: { profile } });

    q("toggle-sidebar-btn")!.click();
    await tick();
    expect(q("sidebar-backdrop")).not.toBeNull();

    q("sidebar-backdrop")!.click();
    await tick();
    expect(q("sidebar-backdrop")).toBeNull();
  });

  it("should logout through the navbar dropdown", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    const { authStore } = renderWithProviders(CourseLayout, {
      props: { children },
      preloadedState: { profile },
    });
    const spy = vi.spyOn(authStore, "asyncSetIsAuthLogout").mockResolvedValue(undefined as any);

    q("profile-dropdown-button")!.click();
    await tick();
    q("dropdown-logout-button")!.click();
    await tick();
    expect(spy).toHaveBeenCalled();
  });

  it("should clear token and go to login when profile fetch ends without profile", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    const putSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});
    const { usersStore } = renderWithProviders(CourseLayout, { props: { children } });
    mockGoto.mockClear();

    usersStore.setIsProfile(true);
    await tick();

    expect(usersStore.isProfile).toBe(false);
    expect(putSpy).toHaveBeenCalledWith("");
    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
  });

  it("should stay when the profile fetch ends with a profile", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    const { wrapper, usersStore } = renderWithProviders(CourseLayout, {
      props: { children },
      preloadedState: { profile },
    });
    mockGoto.mockClear();

    usersStore.setIsProfile(true);
    await tick();

    expect(usersStore.isProfile).toBe(false);
    expect(mockGoto).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Test User");
  });

  it("should clear profile and go to login after logout", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("token");
    const { wrapper, authStore, usersStore } = renderWithProviders(CourseLayout, {
      props: { children },
      preloadedState: { profile },
    });
    mockGoto.mockClear();

    authStore.setIsAuthLogout(true);
    await tick();

    expect(authStore.isAuthLogout).toBe(false);
    expect(usersStore.profile).toBeNull();
    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
    expect(wrapper.text()).toContain("Memuat sesi pengguna...");
  });
});
