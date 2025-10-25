import React, { useRef, useEffect, useState } from 'react';
import { Topic } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface TopicListProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic) => void;
}

export const TopicList: React.FC<TopicListProps> = ({ topics, selectedTopic, onSelectTopic }) => {
  const listRef = useRef<HTMLUListElement>(null);
  const [pillStyle, setPillStyle] = useState({});

  useEffect(() => {
    if (selectedTopic && listRef.current) {
        const selectedIndex = topics.findIndex(t => t.name === selectedTopic.name);
        const selectedElement = listRef.current.children[selectedIndex] as HTMLLIElement;
        
        if (selectedElement) {
            setPillStyle({
                transform: `translateY(${selectedElement.offsetTop}px)`,
                height: `${selectedElement.offsetHeight}px`,
                opacity: 1
            });
        }
    }
  }, [selectedTopic, topics]);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-700/50 flex flex-col bg-slate-900/30">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-amber-300" />
          The Codex
        </h2>
      </div>
      <div className="relative flex-1 overflow-y-auto p-2">
        <div
            className="absolute left-2 w-[calc(100%-1rem)] bg-cyan-500/20 rounded-md shadow-inner transition-all duration-500 ease-in-out"
            style={pillStyle}
        ></div>
        <ul ref={listRef}>
          {topics.map((topic) => (
            <li key={topic.name} className="relative">
              <button
                onClick={() => onSelectTopic(topic)}
                className={`w-full text-left px-3 py-2.5 my-1 rounded-md text-sm transition-all duration-200 ease-in-out flex items-center gap-3 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:z-10 ${
                  selectedTopic?.name === topic.name
                    ? 'text-cyan-200 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${selectedTopic?.name === topic.name ? 'bg-cyan-300' : 'bg-slate-500'}`}></span>
                {topic.cleanedName}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
