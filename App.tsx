
import React, { useState, useCallback, useEffect } from 'react';
import { Topic, EnergyCenterContent } from './types';
import { Sidebar } from './components/Sidebar';
import { ContentView } from './components/ContentView';
import { generateContentForTopic, generateImageForTopic } from './services/geminiService';
import { ENERGY_CENTERS } from './constants';
import { CodexIcon } from './components/icons/CodexIcon';

const App: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [content, setContent] = useState<EnergyCenterContent | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTopic = useCallback(async (topic: Topic) => {
    if (selectedTopic?.name === topic.name) return;

    setSelectedTopic(topic);
    setIsLoading(true);
    setError(null);
    setContent(null);
    setImageUrl(null);

    try {
      const topicContent = await generateContentForTopic(topic.cleanedName);
      setContent(topicContent);
      
      const generatedImageUrl = await generateImageForTopic(topicContent);
      setImageUrl(generatedImageUrl);
    } catch (e) {
      console.error(e);
      setError('Failed to generate content. The spiritual energies might be misaligned. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTopic]);

  useEffect(() => {
    // Pre-select the first topic on initial load
    handleSelectTopic(ENERGY_CENTERS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-300 antialiased">
      <Sidebar 
        topics={ENERGY_CENTERS}
        selectedTopic={selectedTopic}
        onSelectTopic={handleSelectTopic}
      />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
           <div className="flex items-center gap-3">
            <CodexIcon className="h-8 w-8 text-cyan-400"/>
            <h1 className="text-2xl font-serif font-bold text-white tracking-wider">
              Energetic Codex
            </h1>
          </div>
          <div className="text-sm text-slate-400">
            AI-Powered Spiritual Knowledge
          </div>
        </header>
        <ContentView 
          topic={selectedTopic}
          content={content}
          imageUrl={imageUrl}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
};

export default App;
