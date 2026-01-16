
export enum ThemeId {
  GAMER_BLUE = 'GAMER_BLUE',
  NEON_POP = 'NEON_POP',
  GOLDEN_TROPHY = 'GOLDEN_TROPHY'
}

export interface AppTheme {
  id: ThemeId;
  name: string;
  bg: string;
  surface: string;
  accent: string;
  secondary: string;
  text: string;
  shadow: string;
}

export enum TaskStatus {
  IDLE = 'IDLE',
  WAITING = 'WAITING',
  CONFIRMED = 'CONFIRMED'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  status: TaskStatus;
}

export interface Reward {
  id: string;
  title: string;
  price: number;
  image: string;
  icon: string;
  recurring: boolean;
}

export interface PurchasedItem extends Reward {
  purchaseId: string;
}

export interface Dream {
  title: string;
  goal: number;
  icon: string;
  status: 'NONE' | 'PENDING_PRICE' | 'ACTIVE' | 'REACHED' | 'CLAIMED';
}

export interface Transaction {
  id: string;
  type: 'plus' | 'minus';
  title: string;
  amount: number;
  timestamp: number;
  icon: string;
}

export type TabId = 'wallet' | 'missions' | 'shop' | 'profile' | 'editor' | 'parent';

export interface UserNotifications {
  wallet: number;
  missions: number;
  shop: number;
}

export interface UserState {
  balance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  name: string;
  currencyName: string;
  currencyIcon: string;
  tasks: Task[];
  purchasedRewards: string[];
  inventory: PurchasedItem[];
  badges: string[];
  dream: Dream;
  history: Transaction[];
  isParentMode: boolean;
  notifications: UserNotifications;
}
