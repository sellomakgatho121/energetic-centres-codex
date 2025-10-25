import React, { useState, useCallback } from 'react';
import { CodexExplorer } from './components/CodexExplorer';
import { DeepInquiryView } from './components/DeepInquiryView';
import { LiveConversationView } from './components/LiveConversationView';
import { VideoWeaverView } from './components/VideoWeaverView';
import { OrbitalNav } from './components/OrbitalNav';
import { MobileNav } from './components/MobileNav';

type View = 'codex' | 'inquiry' | 'live' | 'weaver';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('codex');
    const [initialTopic, setInitialTopic] = useState<string | null>(null);

    const handleNavigateToCodex = useCallback((topicIdentifier: string) => {
        setInitialTopic(topicIdentifier);
        setCurrentView('codex');
    }, []);
    
    const handleInitialTopicConsumed = useCallback(() => {
        setInitialTopic(null);
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'codex':
                return <CodexExplorer initialTopicIdentifier={initialTopic} onInitialTopicConsumed={handleInitialTopicConsumed} onSelectView={setCurrentView} />;
            case 'inquiry':
                return <DeepInquiryView onNavigateToCodex={handleNavigateToCodex} />;
            case 'live':
                return <LiveConversationView />;
            case 'weaver':
                return <VideoWeaverView />;
            default:
                return <CodexExplorer initialTopicIdentifier={initialTopic} onInitialTopicConsumed={handleInitialTopicConsumed} onSelectView={setCurrentView} />;
        }
    };

    return (
        <main className="h-screen w-screen bg-slate-900 text-white flex flex-col md:flex-row overflow-hidden font-sans">
             <div className="hidden md:flex">
                 <OrbitalNav currentView={currentView} onViewChange={setCurrentView} />
             </div>
            <div className="flex-1 flex flex-col min-w-0 h-full">
                <div className="flex-1 min-h-0">
                    {renderView()}
                </div>
                <div className="md:hidden">
                    <MobileNav currentView={currentView} onViewChange={setCurrentView} />
                </div>
            </div>
        </main>
    );
};

export default App;
