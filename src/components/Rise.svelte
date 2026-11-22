<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  let { as = 'p', text, chars = false, class: className = '', ...attributes }: HTMLAttributes<HTMLElement> & { as?: string; text: string; chars?: boolean } = $props();
  const words = $derived(text.split(' ').map((word, i, list) => ({ word, offset: list.slice(0, i).join('').length })));
  function reveal(element: HTMLElement) {
    if (!('IntersectionObserver' in window)) return;
    element.classList.add('rv-armed');
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { element.classList.add('in'); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(element);
    return () => observer.disconnect();
  }
</script>

<svelte:element this={as} {...attributes} class={'rv ' + className} {@attach reveal}>
  <span class="sr-only">{text}</span>
  <span aria-hidden="true">{#each words as { word, offset }, i}<span class="rv-w">{#if chars}{#each [...word] as character, j}<span class="rv-m"><span class="rv-g" style={'--i:' + (offset + j)}>{character}</span></span>{/each}{:else}<span class="rv-s" style={'--i:' + i * 2}>{word}</span>{/if}</span>{i < words.length - 1 ? ' ' : ''}{/each}</span>
</svelte:element>
