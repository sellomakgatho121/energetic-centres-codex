import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TopicList } from './Sidebar';
import { ContentView } from './ContentView';
import { EnergyCenterContent, Topic } from '../types';
import { generateContentForTopic, generateImageForTopic } from '../services/geminiService';
import { ENERGY_CENTERS } from '../constants';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface CodexExplorerProps {
    initialTopicIdentifier: string | null;
    onInitialTopicConsumed: () => void;
    onSelectView: (view: string) => void;
}

export const CodexExplorer: React.FC<CodexExplorerProps> = ({ initialTopicIdentifier, onInitialTopicConsumed, onSelectView }) => {
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [content, setContent] = useState<EnergyCenterContent | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'content'>('list');

    const contentCache = useMemo(() => new Map<string, { content: EnergyCenterContent; imageUrl: string | null }>(), []);
    
    const fetchContent = useCallback(async (topic: Topic) => {
        if (contentCache.has(topic.name)) {
            const cached = contentCache.get(topic.name)!;
            setContent(cached.content);
            setImageUrl(cached.imageUrl);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setContent(null);
        setImageUrl(null);

        try {
            const fetchedContent = await generateContentForTopic(topic.name);
            setContent(fetchedContent);

            const fetchedImageUrl = await generateImageForTopic(fetchedContent);
            setImageUrl(fetchedImageUrl);
            
            contentCache.set(topic.name, { content: fetchedContent, imageUrl: fetchedImageUrl });
        } catch (err) {
            console.error(err);
            setError(`Failed to load content for ${topic.cleanedName}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    }, [contentCache]);

    useEffect(() => {
        if (initialTopicIdentifier) {
            const topicToLoad = ENERGY_CENTERS.find(t => t.cleanedName === initialTopicIdentifier || t.name === initialTopicIdentifier);
            if (topicToLoad) {
                handleSelectTopic(topicToLoad);
            }
            onInitialTopicConsumed();
        }
    }, [initialTopicIdentifier, onInitialTopicConsumed]);


    const handleSelectTopic = (topic: Topic) => {
        setSelectedTopic(topic);
        setMobileView('content');
        if (topic.name !== selectedTopic?.name) {
            fetchContent(topic);
        }
    };
    
    const handleMobileBack = () => {
        setMobileView('list');
    };

    return (
        <div className="flex h-full w-full flex-col md:flex-row">
            <div className={`${mobileView === 'content' ? 'hidden' : 'flex'} w-full flex-col md:flex md:w-auto`}>
                <TopicList
                    topics={ENERGY_CENTERS}
                    selectedTopic={selectedTopic}
                    onSelectTopic={handleSelectTopic}
                />
            </div>
            
            <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} flex-1 md:flex flex-col`}>
                 {selectedTopic ? (
                    <ContentView
                        key={selectedTopic.name}
                        content={content}
                        imageUrl={imageUrl}
                        isLoading={isLoading}
                        error={error}
                        onSelectRelated={handleSelectTopic}
                        onSelectView={onSelectView}
                        onMobileBack={handleMobileBack}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <BookOpenIcon className="w-16 h-16 text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300">Select a Topic</h3>
                        <p className="text-slate-500 max-w-sm mt-2">Choose an energetic concept from the codex list to begin your exploration.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
