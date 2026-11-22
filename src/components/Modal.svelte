<script lang="ts">
  import type { Snippet } from 'svelte';
  let { label, style = '', close, children }: { label: string; style?: string; close: () => void; children: Snippet } = $props();
  function open(dialog: HTMLDialogElement) {
    dialog.showModal();
    return () => dialog.close();
  }
</script>

<dialog aria-label={label} style={'margin:0;border:0;width:100vw;height:100dvh;max-width:none;max-height:none;color:inherit;' + style} {@attach open}
  oncancel={event => { event.preventDefault(); close(); }}
  onpointerdown={event => { if (event.target === event.currentTarget) close(); }}>
  {@render children()}
</dialog>
