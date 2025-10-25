export interface ThemeOption {
    id: 'amethyst' | 'solar' | 'nebula' | 'quasar';
    name: string;
    color: string;
}

export const THEMES: ThemeOption[] = [
    { id: 'amethyst', name: 'Amethyst', color: '#8b5cf6' },
    { id: 'solar', name: 'Solar', color: '#fb923c' },
    { id: 'nebula', name: 'Nebula', color: '#22d3ee' },
    { id: 'quasar', name: 'Quasar', color: '#f0f9ff' },
];
