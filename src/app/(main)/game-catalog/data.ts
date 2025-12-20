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
        title: 'KNIFE THROW',
        category: 'Action',
        image: '/knife-throw.png',
        route: '/video/game',
        isAvailable: true,
    },
    {
        id: 'ping-pong',
        title: 'PING PONG',
        category: 'Action',
        image: '/ping-pong.png',
        route: '/video/game',
        isAvailable: true,
    },
    {
        id: 'darts',
        title: 'DARTS',
        category: 'Strategy',
        image: '/darts.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'tic-tac-toe',
        title: 'TIC TAC TOE',
        category: 'Strategy',
        image: '/tic-tac-toe.png', // Placeholder
        route: '/video/game',
        isAvailable: true,
    },
    {
        id: 'connect-four',
        title: 'CONNECT FOUR',
        category: 'Strategy',
        image: '/connect-four.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'bowling',
        title: 'BOWLING',
        category: 'Action',
        image: '/bowling.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'dumb-charades',
        title: 'DUMB CHARADES',
        category: 'Icebreaker',
        image: '/dumb-charades.png', // Placeholder
        route: '/video/game',
        isAvailable: false,
    },
    {
        id: 'doodle-guess',
        title: 'DOODLE GUESS',
        category: 'Icebreaker',
        image: '/doodle-guess.png', // Placeholder
        route: '/video/game',
        isAvailable: true,
    },
];

export const categories = [
    'All',
    'Icebreaker',
    'Strategy',
    'Puzzle',
    'Action',
];
