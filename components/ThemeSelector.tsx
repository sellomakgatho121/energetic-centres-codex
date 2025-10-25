import React from 'react';
import { THEMES } from '../themes';
import type { Theme } from './VersVisualizer';

interface ThemeSelectorProps {
    currentTheme: Theme;
    onSelectTheme: (theme: Theme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onSelectTheme }) => {
    return (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/50 p-1.5 rounded-full flex gap-1.5 backdrop-blur-sm shadow-lg">
            {THEMES.map(theme => (
                <button
                    key={theme.id}
                    title={theme.name}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`w-6 h-6 rounded-full transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white ${
                        currentTheme === theme.id 
                        ? 'border-white scale-110 shadow-md' 
                        : 'border-transparent hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: theme.color }}
                    aria-label={`Select ${theme.name} theme`}
                />
            ))}
        </div>
    );
};
