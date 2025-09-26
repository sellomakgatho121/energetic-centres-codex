
import React from 'react';
import { Topic, EnergyCenterContent } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ChipIcon } from './icons/ChipIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ContentViewProps {
  topic: Topic | null;
  content: EnergyCenterContent | null;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse p-8 space-y-8 max-w-4xl mx-auto">
        <div className="h-10 bg-slate-700 rounded w-3/4 mx-auto"></div>
        <div className="h-6 bg-slate-700 rounded w-1/2 mx-auto mt-4"></div>
        
        <div className="aspect-square bg-slate-700 rounded-lg w-full max-w-md mx-auto my-8"></div>

        <div className="space-y-4">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-slate-700 rounded-lg"></div>
            <div className="h-20 bg-slate-700 rounded-lg"></div>
            <div className="h-20 bg-slate-700 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-slate-700 rounded-lg"></div>
            <div className="h-32 bg-slate-700 rounded-lg"></div>
        </div>
    </div>
);

const InfoCard: React.FC<{ title: string; children: React.ReactNode; colorClass: string }> = ({ title, children, colorClass }) => (
    <div className={`bg-slate-800/50 border ${colorClass} rounded-lg p-4 flex flex-col`}>
        <h3 className="font-semibold text-white mb-2">{title}</h3>
        <div className="text-slate-300 text-sm flex-grow">{children}</div>
    </div>
);

export const ContentView: React.FC<ContentViewProps> = ({ topic, content, imageUrl, isLoading, error }) => {
  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-red-300 mb-2">An Error Occurred</h2>
        <p className="text-slate-400 max-w-md">{error}</p>
      </div>
    );
  }
  
  if (!topic || !content) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <BookOpenIcon className="w-24 h-24 text-slate-600 mb-4" />
        <h2 className="text-3xl font-bold text-slate-400">Select a Topic</h2>
        <p className="text-slate-500 mt-2">Choose an energy center from the sidebar to begin your exploration.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 text-slate-200 max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">{content.title}</h2>
        <p className="text-xl text-cyan-300 mt-2">{content.sanskritName}</p>
        <div 
          className="mt-4 mx-auto h-1 w-24 rounded-full transition-all duration-500"
          style={{ 
              backgroundColor: content.color,
              boxShadow: `0 0 15px ${content.color}` 
          }}
        ></div>
      </header>

      {imageUrl ? (
        <div className="my-8 flex justify-center">
            <img 
                src={imageUrl} 
                alt={`Artistic representation of ${content.title}`} 
                className="rounded-lg shadow-2xl shadow-cyan-500/10 w-full max-w-lg object-cover border-2 border-slate-700"
            />
        </div>
      ) : (
        <div className="my-8 flex justify-center">
            <div className="animate-pulse bg-slate-700 rounded-lg w-full max-w-lg aspect-square"></div>
        </div>
      )}
      
      <section className="mb-8 prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-headings:text-white">
        <h3>Purpose</h3>
        <p>{content.purpose}</p>
      </section>

      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <InfoCard title="Location" colorClass="border-cyan-500/30"><p>{content.location}</p></InfoCard>
        <InfoCard title="Color" colorClass="border-purple-500/30">
            <div className="flex items-center gap-3">
                <div 
                  className="w-5 h-5 rounded-full border-2 border-slate-600"
                  style={{ backgroundColor: content.color }}
                ></div>
                <span className="font-medium text-white">{content.color}</span>
            </div>
        </InfoCard>
        <InfoCard title="Element" colorClass="border-emerald-500/30"><p>{content.element}</p></InfoCard>
      </section>

      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700/50">
            <h3 className="text-2xl font-serif font-bold text-white mb-3">Balanced State</h3>
            <p className="text-slate-300 leading-relaxed">{content.balancedState}</p>
          </div>
           <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700/50">
            <h3 className="text-2xl font-serif font-bold text-white mb-3">Unbalanced State</h3>
            <p className="text-slate-300 leading-relaxed">{content.unbalancedState}</p>
          </div>
      </section>

      <section>
        <h3 className="text-2xl font-serif font-bold text-white mb-4">Related Concepts</h3>
        <div className="flex flex-wrap gap-3">
          {content.relatedConcepts.map((concept, index) => (
            <div key={index} className="flex items-center gap-2 bg-slate-700/50 text-slate-300 text-sm font-medium px-4 py-2 rounded-full">
              <ChipIcon className="w-4 h-4 text-cyan-400" />
              <span>{concept}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
