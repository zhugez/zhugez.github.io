import type { FeatureFactory } from './room-feature';
import { hangWallArt } from './room-wallart';

export const wallartFeature: FeatureFactory = (ctx) => {
  const art = hangWallArt(ctx.model, ctx.base, ctx.renderer.capabilities.getMaxAnisotropy());
  for (const { mesh, label, detail } of art.pieces) ctx.addTarget({ object: mesh, label, detail, use: () => detail });
  art.tint(ctx.accent);
  return {
    theme: () => art.tint(ctx.accent),
    dispose: () => art.dispose(),
  };
};
