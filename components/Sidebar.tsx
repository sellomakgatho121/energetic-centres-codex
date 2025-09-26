
import React from 'react';
import { Topic } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface SidebarProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ topics, selectedTopic, onSelectTopic }) => {
  return (
    <aside className="w-64 bg-slate-800/50 flex-shrink-0 border-r border-slate-700/50 flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-amber-300" />
          Energy Centers
        </h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul>
          {topics.map((topic) => (
            <li key={topic.name}>
              <button
                onClick={() => onSelectTopic(topic)}
                className={`w-full text-left px-3 py-2.5 my-1 rounded-md text-sm transition-all duration-200 ease-in-out flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  selectedTopic?.name === topic.name
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-inner'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${selectedTopic?.name === topic.name ? 'bg-cyan-400' : 'bg-slate-500'}`}></span>
                {topic.cleanedName}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-700/50 text-xs text-slate-500">
        <p>&copy; 2024 Energetic Codex. All rights reserved. Content is for informational purposes.</p>
      </div>
    </aside>
  );
};
