
import { ThemeId, AppTheme, Task, Reward, TaskStatus } from './types';

export const THEMES: Record<ThemeId, AppTheme> = {
  [ThemeId.GAMER_BLUE]: {
    id: ThemeId.GAMER_BLUE,
    name: 'Геймер',
    bg: '#0F1020',
    surface: '#1C1E33',
    accent: '#00E5FF',
    secondary: '#3366FF',
    text: '#FFFFFF',
    shadow: 'rgba(0, 229, 255, 0.4)'
  },
  [ThemeId.NEON_POP]: {
    id: ThemeId.NEON_POP,
    name: 'Неон',
    bg: '#140A1A',
    surface: '#241230',
    accent: '#FF33CC',
    secondary: '#A020F0',
    text: '#FFFFFF',
    shadow: 'rgba(255, 51, 204, 0.4)'
  },
  [ThemeId.GOLDEN_TROPHY]: {
    id: ThemeId.GOLDEN_TROPHY,
    name: 'Золото',
    bg: '#1A1A1A',
    surface: '#2B2B2B',
    accent: '#FFD700',
    secondary: '#FFA500',
    text: '#FFFFFF',
    shadow: 'rgba(255, 215, 0, 0.4)'
  }
};

export const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Убраться в комнате', description: 'Пропылесосить и вытереть пыль', reward: 50, icon: '🧹', status: TaskStatus.IDLE },
  { id: '2', title: 'Домашка по математике', description: 'Завершить страницы 45-47', reward: 100, icon: '📚', status: TaskStatus.IDLE },
  { id: '3', title: 'Помыть посуду', description: 'После семейного ужина', reward: 30, icon: '🍽️', status: TaskStatus.IDLE },
  { id: '4', title: 'Выгулять собаку', description: '15 минут вокруг квартала', reward: 40, icon: '🐕', status: TaskStatus.IDLE },
  { id: '5', title: 'Почитать книгу', description: 'Минимум 20 минут чтения', reward: 25, icon: '📖', status: TaskStatus.IDLE },
];

export const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: 'Билет в кино', price: 200, icon: '🍿', image: 'https://picsum.photos/seed/cinema/400/300', recurring: false },
  { id: 'r2', title: 'Мороженое', price: 50, icon: '🍦', image: 'https://picsum.photos/seed/icecream/400/300', recurring: true },
  { id: 'r3', title: 'Набор LEGO', price: 500, icon: '🎮', image: 'https://picsum.photos/seed/toy/400/300', recurring: false },
  { id: 'r4', title: 'Час игр на ПК', price: 100, icon: '⏰', image: 'https://picsum.photos/seed/pc/400/300', recurring: true },
  { id: 'r5', title: 'Пицца на ужин', price: 300, icon: '🍕', image: 'https://picsum.photos/seed/pizza/400/300', recurring: false },
  { id: 'r6', title: 'Поход в аквапарк', price: 2000, icon: '🎢', image: 'https://picsum.photos/seed/coaster/400/300', recurring: false },
];

export const BADGES = [
  { id: 'b1', name: 'Новичок', icon: '🐣', description: 'Выполнена первая миссия' },
  { id: 'b2', name: 'Копилка', icon: '💰', description: 'Накоплено 500 монет' },
  { id: 'b3', name: 'Трудяга', icon: '🛠️', description: 'Выполнено 10 миссий' },
  { id: 'b4', name: 'Богач', icon: '💎', description: 'Заработано 1000 монет всего' },
];
