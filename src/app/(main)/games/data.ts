export interface Game {
    id: string;
    title: string;
    category: string;
    image: string;
    route: string;
    isAvailable: boolean;
}

export const games: Game[] = [
    {
        id: 'knife-throw',
        title: 'Knife Throw',
        category: 'Action',
        image: '/knife-throw.png',
        route: '/video/game',
        isAvailable: true,
    },
    {
        id: 'galactic-conquest',
        title: 'Galactic Conquest',
        category: 'Strategy',
        image: '/strategy.png',
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'sudoku-zen',
        title: 'Sudoku Zen',
        category: 'Puzzle',
        image: '/strategy.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'pixel-puzzlers',
        title: 'Pixel Puzzlers',
        category: 'Puzzle',
        image: '/strategy.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'chess-masters',
        title: 'Chess Masters',
        category: 'Strategy',
        image: '/strategy.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'rogue-runner',
        title: 'Rogue Runner',
        category: 'Action',
        image: '/strategy.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'card-clash',
        title: 'Card Clash',
        category: 'Card Games',
        image: '/strategy.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'trivia-time',
        title: 'Trivia Time',
        category: 'Puzzle',
        image: '/strategy.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
];

export const categories = [
    'All',
    'Strategy',
    'Puzzle',
    'Action',
    '2-Player',
    'Card Games',
];
