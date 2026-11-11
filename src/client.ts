import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-theme/client';
import { resolveConfig, type GalaxyConfig } from './config.ts';
import { mountGalaxy } from './renderer.ts';
import { styles, tokens } from './styles.ts';

/** Required browser service: the supported theme registry. */
export const inject = ['theme'];

/** Layer the skin over either palette without changing the saved appearance preference. */
export function apply(ctx: Context, input: Partial<GalaxyConfig> = {}): void {
  const config = resolveConfig(input);
  const overrides = Object.fromEntries(Object.entries(tokens).map(([key,value]) => [key,{light:value,dark:value}]));
  ctx.effect(() => ctx.theme.overrideTokens('dsh-skin-galaxy',overrides), 'galaxy: palette');
  ctx.effect(() => {
    const style = document.createElement('style');
    style.dataset.plugin = 'dsh-skin-galaxy'; style.textContent = styles;
    document.head.append(style);
    const sky = document.createElement('div'); sky.dataset.galaxySky = '';
    sky.setAttribute('aria-hidden','true');
    const canvas = document.createElement('canvas'); sky.append(canvas);
    document.body.prepend(sky); document.body.dataset.galaxyActive = '';
    // Several Host components paint from static palette entries that only darken
    // under the built-in dark marker (file cards, presented files, tool tiles).
    // The skin is dark whatever the saved preference, so keep that marker on and
    // restore the Host's own value on disable.
    const body = document.body;
    const hadDarkMarker = typeof body.hasAttribute === 'function' && body.hasAttribute('data-ds-dark-theme');
    if (typeof body.setAttribute === 'function') body.setAttribute('data-ds-dark-theme','');
    const observer = typeof MutationObserver === 'function'
      ? new MutationObserver(() => {
        if (!body.hasAttribute('data-ds-dark-theme')) body.setAttribute('data-ds-dark-theme','');
      })
      : undefined;
    observer?.observe(body,{attributes:true,attributeFilter:['data-ds-dark-theme']});
    const stop = mountGalaxy(canvas,config);
    return () => {
      stop(); sky.remove(); style.remove();
      observer?.disconnect();
      if (!hadDarkMarker && typeof body.removeAttribute === 'function') body.removeAttribute('data-ds-dark-theme');
      delete document.body.dataset.galaxyActive;
    };
  }, 'galaxy: presentation');
}
