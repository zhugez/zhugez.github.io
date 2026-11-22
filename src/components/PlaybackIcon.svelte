<script lang="ts">
  let { playing }: { playing: boolean } = $props();
</script>

<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
  {#if playing}<path d="M7 5h3v14H7zm7 0h3v14h-3z" />{:else}<path d="M8 5v14l11-7z" />{/if}
</svg>
