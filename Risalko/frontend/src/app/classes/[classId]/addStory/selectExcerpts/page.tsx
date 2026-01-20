'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Excerpt {
  id: string;
  text: string;
  order: number;
}

const SelectExcerptsPage = () => {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId;

  const [storyData, setStoryData] = useState<any>(null);
  const [excerpts, setExcerpts] = useState<Excerpt[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [remainingContent, setRemainingContent] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('newStory');
    if (stored) {
      const data = JSON.parse(stored);
      setStoryData(data);
      setRemainingContent(data.content);
    } else {
      router.push(`/classes/${classId}/addStory`);
    }
  }, [classId, router]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;

    const text = selection.toString().trim();
    const range = selection.getRangeAt(0);
    
    const container = document.getElementById('story-content');
    if (!container) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + text.length;

    setSelectedText(text);
    setSelectionStart(start);
    setSelectionEnd(end);
  };

  const addExcerpt = () => {
    if (!selectedText.trim()) return;

    const newExcerpt: Excerpt = {
      id: Date.now().toString(),
      text: selectedText,
      order: excerpts.length + 1,
    };

    setExcerpts([...excerpts, newExcerpt]);
    
    // Remove the selected text from remaining content
    const newRemainingContent = remainingContent.replace(selectedText, '');
    setRemainingContent(newRemainingContent);
    
    setSelectedText('');
    setSelectionStart(null);
    setSelectionEnd(null);
    
    window.getSelection()?.removeAllRanges();
  };

  const removeExcerpt = (id: string) => {
    const excerptToRemove = excerpts.find(e => e.id === id);
    if (excerptToRemove) {
      // Add the text back to remaining content
      setRemainingContent(remainingContent + '\n' + excerptToRemove.text);
    }
    
    const filtered = excerpts.filter(e => e.id !== id);
    const reordered = filtered.map((e, index) => ({
      ...e,
      order: index + 1,
    }));
    setExcerpts(reordered);
  };

  const moveExcerptUp = (index: number) => {
    if (index === 0) return;
    const newExcerpts = [...excerpts];
    [newExcerpts[index - 1], newExcerpts[index]] = [newExcerpts[index], newExcerpts[index - 1]];
    const reordered = newExcerpts.map((e, i) => ({ ...e, order: i + 1 }));
    setExcerpts(reordered);
  };

  const moveExcerptDown = (index: number) => {
    if (index === excerpts.length - 1) return;
    const newExcerpts = [...excerpts];
    [newExcerpts[index], newExcerpts[index + 1]] = [newExcerpts[index + 1], newExcerpts[index]];
    const reordered = newExcerpts.map((e, i) => ({ ...e, order: i + 1 }));
    setExcerpts(reordered);
  };

  const handleContinue = () => {
    sessionStorage.setItem('storyExcerpts', JSON.stringify(excerpts));
    router.push(`/classes/${classId}/addStory/assignExcerpts`);
  };

  if (!storyData) {
    return (
      <div className="risalko-app">
        <div className="risalko-loading">
          <div className="risalko-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="risalko-app">
      <header className="risalko-header">
        <div className="risalko-header-content">
          <button onClick={() => router.back()} className="risalko-back-btn">
            ← Back
          </button>
          <h1 className="risalko-header-title">Select Story Paragraphs</h1>
        </div>
      </header>

      <main className="risalko-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Story Content */}
          <div className="risalko-card">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">Story Content</h2>
            <p className="text-sm text-neutral-500 mb-4">
              Select text and click the button to add paragraphs
            </p>
            
            <div
              id="story-content"
              className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-neutral-700 select-text cursor-text leading-relaxed"
              onMouseUp={handleTextSelection}
              onTouchEnd={handleTextSelection}
            >
              {remainingContent}
            </div>

            {selectedText && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-sm font-medium text-indigo-700 mb-2">Selected text:</p>
                <p className="text-sm text-neutral-600 italic mb-3">
                  "{selectedText.substring(0, 150)}{selectedText.length > 150 ? '...' : ''}"
                </p>
                <button onClick={addExcerpt} className="risalko-btn risalko-btn-primary w-full">
                  + Add as Paragraph
                </button>
              </div>
            )}
          </div>

          {/* Selected Excerpts */}
          <div className="risalko-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">
                Selected Paragraphs ({excerpts.length})
              </h2>
              {excerpts.length > 0 && (
                <button
                  onClick={() => {
                    setExcerpts([]);
                    setRemainingContent(storyData.content);
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {excerpts.length === 0 ? (
                <div className="risalko-empty py-12">
                  <p className="text-4xl mb-4">📝</p>
                  <p className="font-medium">No paragraphs selected yet</p>
                  <p className="text-sm mt-2">Select text from the story content</p>
                </div>
              ) : (
                excerpts.map((excerpt, index) => (
                  <div
                    key={excerpt.id}
                    className="p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-indigo-600">
                        #{excerpt.order}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveExcerptUp(index)}
                          disabled={index === 0}
                          className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveExcerptDown(index)}
                          disabled={index === excerpts.length - 1}
                          className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeExcerpt(excerpt.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-3">
                      {excerpt.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {excerpts.length > 0 && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <button onClick={handleContinue} className="risalko-btn risalko-btn-primary w-full">
                  Continue to Assign Students →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SelectExcerptsPage;
                                                         