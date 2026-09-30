export type ItemId =
  | 'sticker-pack'
  | 'sticker-sheet'
  | 'glasses-cloth'
  | 'fridge-magnet'
  | 'keychain'
  | 'tape'
  | 'leather-coaster'
  | 'storage-pouch'
  | 'mini-bookmark'
  | 'phone-strap'
  | 'rectangle-badge'
  | 'bird-bag';

export type Item = {
  id: ItemId;
  name: string;
  englishName: string;
  unit: string;
  cost: number;
  salePrice: number;
  actualStock: number;
  drawStock: number;
  minReserve: number;
  paused: boolean;
  color: string;
};

export type DrawRecord = {
  id: string;
  itemId: ItemId;
  itemName: string;
  amount: number;
  createdAt: string;
};

export type SaleRecord = {
  id: string;
  itemId: ItemId;
  itemName: string;
  quantity: number;
  amount: number;
  createdAt: string;
};

export type Operation =
  | {
      id: string;
      type: 'draw';
      itemId: ItemId;
      itemName: string;
      actualDelta: number;
      drawDelta: number;
      recordId: string;
      createdAt: string;
    }
  | {
      id: string;
      type: 'sale';
      itemId: ItemId;
      itemName: string;
      quantity: number;
      actualDelta: number;
      amount: number;
      recordId: string;
      createdAt: string;
    }
  | {
      id: string;
      type: 'edit';
      itemId: ItemId;
      itemName: string;
      before: Item;
      after: Item;
      createdAt: string;
    };

export type AppState = {
  items: Record<ItemId, Item>;
  draws: DrawRecord[];
  sales: SaleRecord[];
  operations: Operation[];
};
