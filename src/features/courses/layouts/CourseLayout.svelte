<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import NavbarComponent from "../components/NavbarComponent.svelte";
  import SidebarComponent from "../components/SidebarComponent.svelte";
  import { usersStore } from "../../users/states/usersStore";
  import { authStore } from "../../auth/states/authStore";
  import apiHelper from "../../../helpers/apiHelper";
  import { goto } from "$app/navigation";

  let { children }: { children?: Snippet } = $props();

  let isSidebarOpen = $state(false);
  let profile = $derived($usersStore.profile);

  // Cek sesi sekali saat layout dimuat.
  onMount(() => {
    if (apiHelper.getAccessToken()) {
      usersStore.asyncSetProfile();
    } else {
      goto("/auth/login");
    }
  });

  // Setelah profil selesai dimuat: tanpa profil berarti sesi tidak valid.
  $effect(() => {
    if ($usersStore.isProfile) {
      usersStore.setIsProfile(false);
      if (!$usersStore.profile) {
        apiHelper.putAccessToken("");
        goto("/auth/login");
      }
    }
  });

  // Setelah logout berhasil.
  $effect(() => {
    if ($authStore.isAuthLogout) {
      authStore.setIsAuthLogout(false);
      usersStore.setProfile(null);
      goto("/auth/login");
    }
  });

  function handleLogout() {
    authStore.asyncSetIsAuthLogout();
  }
</script>

{#if !profile}
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm font-medium text-slate-600">Memuat sesi pengguna...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <NavbarComponent
      {profile}
      {isSidebarOpen}
      onLogout={handleLogout}
      onToggleSidebar={() => (isSidebarOpen = !isSidebarOpen)}
    />

    <SidebarComponent {isSidebarOpen} onCloseMobile={() => (isSidebarOpen = false)} />

    <main class="pt-16 md:pl-64 transition-all">
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {@render children?.()}
      </div>
    </main>
  </div>
{/if}
