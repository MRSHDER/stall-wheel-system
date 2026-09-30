import { describe, expect, it } from 'vitest';
import {
  buildWheelSegments,
  buildWheelSlices,
  createInitialState,
  directSell,
  getDrawableItems,
  undoLastOperation,
  weightedDraw
} from '../inventory';

describe('inventory flow', () => {
  it('loads the L.D.C menu names and includes the rectangle badge', () => {
    const state = createInitialState();

    expect(state.items['rectangle-badge']).toMatchObject({
      name: '犬类识别铭牌',
      englishName: 'CANINE IDENTIFICATION PLATE',
      salePrice: 5.9
    });
    expect(Object.values(state.items).every((item) => item.englishName.length > 0)).toBe(true);
  });

  it('direct sales reduce actual inventory and can be undone', () => {
    const state = createInitialState();
    const sold = directSell(state, 'sticker-pack', 2);

    expect(sold.items['sticker-pack'].actualStock).toBe(46);
    expect(sold.sales).toHaveLength(1);

    const undone = undoLastOperation(sold);
    expect(undone.items['sticker-pack'].actualStock).toBe(48);
    expect(undone.sales).toHaveLength(0);
  });

  it('draw wins reduce actual and drawable inventory and can be undone', () => {
    const state = createInitialState();
    const drawn = weightedDraw(state, () => 0);

    expect(drawn.winner.id).toBe('sticker-pack');
    expect(drawn.state.items['sticker-pack'].actualStock).toBe(47);
    expect(drawn.state.items['sticker-pack'].drawStock).toBe(23);
    expect(drawn.state.draws).toHaveLength(1);

    const undone = undoLastOperation(drawn.state);
    expect(undone.items['sticker-pack'].actualStock).toBe(48);
    expect(undone.items['sticker-pack'].drawStock).toBe(24);
    expect(undone.draws).toHaveLength(0);
  });

  it('excludes paused items and items at minimum reserve from draws', () => {
    const state = createInitialState();
    state.items['sticker-pack'].paused = true;
    state.items['mini-bookmark'].actualStock = state.items['mini-bookmark'].minReserve;

    const drawable = getDrawableItems(state);

    expect(drawable.map((item) => item.id)).not.toContain('sticker-pack');
    expect(drawable.map((item) => item.id)).not.toContain('mini-bookmark');
  });

  it('uses drawable stock as random weight', () => {
    const state = createInitialState();
    Object.values(state.items).forEach((item) => {
      item.drawStock = 0;
    });
    state.items['sticker-pack'].drawStock = 1;
    state.items['rectangle-badge'].drawStock = 3;

    expect(weightedDraw(state, () => 0.24).winner.id).toBe('sticker-pack');
    expect(weightedDraw(state, () => 0.25).winner.id).toBe('rectangle-badge');
  });

  it('builds wheel segment angles from drawable stock', () => {
    const state = createInitialState();
    Object.values(state.items).forEach((item) => {
      item.drawStock = 0;
    });
    state.items['sticker-pack'].drawStock = 1;
    state.items['rectangle-badge'].drawStock = 3;

    const segments = buildWheelSegments(state);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ itemId: 'sticker-pack', start: 0, end: 90 });
    expect(segments[1]).toMatchObject({ itemId: 'rectangle-badge', start: 90, end: 360 });
  });

  it('spreads repeated item slices around the wheel', () => {
    const state = createInitialState();
    Object.values(state.items).forEach((item) => {
      item.drawStock = 0;
    });
    state.items['sticker-pack'].drawStock = 2;
    state.items['rectangle-badge'].drawStock = 2;

    const slices = buildWheelSlices(state);

    expect(slices.map((slice) => slice.itemId)).toEqual([
      'sticker-pack',
      'rectangle-badge',
      'sticker-pack',
      'rectangle-badge'
    ]);
    expect(slices.map((slice) => slice.start)).toEqual([0, 90, 180, 270]);
  });

  it('keeps dominant item slices away from one large block', () => {
    const state = createInitialState();
    Object.values(state.items).forEach((item) => {
      item.drawStock = 0;
    });
    state.items['sticker-pack'].drawStock = 5;
    state.items['rectangle-badge'].drawStock = 3;
    state.items['mini-bookmark'].drawStock = 2;

    const slices = buildWheelSlices(state);
    const longestStickerRun = slices.reduce(
      (result, slice) => {
        const current = slice.itemId === 'sticker-pack' ? result.current + 1 : 0;
        return { current, longest: Math.max(result.longest, current) };
      },
      { current: 0, longest: 0 }
    ).longest;

    expect(longestStickerRun).toBeLessThanOrEqual(1);
  });
});
