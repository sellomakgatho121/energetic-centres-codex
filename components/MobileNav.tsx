import React from 'react';
import { CodexIcon } from './icons/CodexIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { VersIcon } from './icons/VersIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

type View = 'codex' | 'inquiry' | 'live' | 'weaver';

interface MobileNavProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const navItems = [
    { id: 'codex', name: 'Codex', icon: CodexIcon, color: 'text-cyan-400' },
    { id: 'inquiry', name: 'Inquiry', icon: BrainCircuitIcon, color: 'text-indigo-400' },
    { id: 'live', name: 'Live', icon: VersIcon, color: 'text-purple-400' },
    { id: 'weaver', name: 'Animator', icon: VideoCameraIcon, color: 'text-rose-400' },
];

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onViewChange }) => {
    return (
        <nav className="w-full bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 flex justify-around items-center">
            {navItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id as View)}
                        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 focus:outline-none ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        aria-label={item.name}
                    >
                        <Icon className={`w-6 h-6 mb-0.5 ${isActive ? item.color : ''}`} />
                        <span className={`text-xs font-medium ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                            {item.name}
                        </span>
                        {isActive && <div className={`w-8 h-0.5 rounded-full mt-1 ${item.color.replace('text-','bg-')}`}></div>}
                    </button>
                );
            })}
        </nav>
    );
};
