export interface Tier {
    id: 'GOLD' | 'DIAMOND';
    name: string;
    price: number;
    durationDays: number;
    entitlements: {
        matchesPerDay: number;
        genderFilter: boolean;
        locationFilter: boolean;
        videoQuality: 'HD' | '4K';
    };
}

export const TIERS: Record<string, Tier> = {
    GOLD: {
        id: 'GOLD',
        name: 'Gold Tier',
        price: 199,
        durationDays: 30,
        entitlements: {
            matchesPerDay: 200,
            genderFilter: true,
            locationFilter: false,
            videoQuality: 'HD'
        }
    },
    DIAMOND: {
        id: 'DIAMOND',
        name: 'Diamond Tier',
        price: 499,
        durationDays: 30,
        entitlements: {
            matchesPerDay: -1, // Unlimited
            genderFilter: true,
            locationFilter: true,
            videoQuality: '4K'
        }
    }
};

export const getTier = (tierId: string): Tier | undefined => {
    return TIERS[tierId];
};
