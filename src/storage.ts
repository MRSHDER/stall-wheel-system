import { brandColors, createInitialState } from './inventory';
import type { AppState } from './types';

const STORAGE_KEY = 'stall-wheel-state-v1';

type CatalogMigration = {
  name?: { from: string[]; to: string };
  englishName?: { from: string[]; to: string };
  salePrice?: { from: number[]; to: number };
};

const catalogMigrations: Record<string, CatalogMigration> = {
  'sticker-pack': {
    name: { from: ['犬类贴纸集'], to: '犬类失误贴纸集' }
  },
  'glasses-cloth': {
    name: { from: ['犬类擦拭介质'], to: '犬类擦拭布' },
    englishName: { from: ['CANINE WIPING MEDIUM'], to: 'CANINE WIPING CLOTH' }
  },
  tape: {
    salePrice: { from: [17.9], to: 16.9 }
  },
  'storage-pouch': {
    name: { from: ['犬类样本袋'], to: '犬类样品袋' }
  },
  'phone-strap': {
    name: { from: ['犬类全息挂绳'], to: '犬类手机挂绳' },
    englishName: { from: ['CANINE HOLOGRAPHIC STRAP'], to: 'CANINE PHONE STRAP' }
  }
};

export function loadState(): AppState {
  const fallback = createInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...fallback,
      ...parsed,
      items: Object.fromEntries(
        Object.entries({ ...fallback.items, ...parsed.items }).map(([id, item]) => {
          const nextItem = {
            ...item,
            color: brandColors[id as keyof typeof brandColors] ?? item.color
          };
          const migration = catalogMigrations[id];
          if (migration?.name?.from.includes(nextItem.name)) nextItem.name = migration.name.to;
          if (migration?.englishName?.from.includes(nextItem.englishName)) nextItem.englishName = migration.englishName.to;
          if (migration?.salePrice?.from.includes(nextItem.salePrice)) nextItem.salePrice = migration.salePrice.to;
          return [id, nextItem];
        })
      ) as AppState['items'],
      draws: parsed.draws ?? [],
      sales: parsed.sales ?? [],
      operations: parsed.operations ?? []
    };
  } catch {
    return fallback;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
