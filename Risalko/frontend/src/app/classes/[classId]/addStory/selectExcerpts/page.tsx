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
      <div className="min-h-screen flex items-center justify-center">
        <p>Nalaganje...</p>
      </div>
    );
  }

  return (
    <div className="background min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-text font-black text-xl transform hover:scale-110"
          >
            ←
          </button>
        </div>

        <h1 className="text-7xl font-black text-center mb-8 gradient-text animate-bounce-slow text-outline-dark">
          📚 Izberi odlomke zgodbe! ✨
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="section-dark rounded-3xl p-8 border-4 border-dashed border-pink-300">
            <h2 className="text-3xl font-black mb-4 text-gray-100 animate-wiggle">
              📖 Vsebina zgodbe
            </h2>
            <p className="text-lg text-gray-200 mb-4 font-bold">
              ✏️ Izberi besedilo in pritisni gumb za dodajanje odlomka!
            </p>
            
            <div
              id="story-content"
              className="bg-gray-900/50 p-6 rounded-2xl border-4 border-gray-500 max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-gray-100 select-text cursor-text font-semibold text-lg shadow-inner no-scrollbar"
              onMouseUp={handleTextSelection}
              onTouchEnd={handleTextSelection}
            >
              {remainingContent}
            </div>

            {selectedText && (
              <div className="mt-6 p-6 bg-sky-500/20 border-4 border-sky-400 rounded-3xl shadow-xl">
                <p className="text-lg font-black text-sky-100 mb-3">
                  ⭐ Izbrano besedilo:
                </p>
                <p className="text-base text-gray-100 italic mb-4 font-semibold">
                  "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
                </p>
                <button
                  onClick={addExcerpt}
                  className="btn bg-yellow-100 text-text w-full"
                >
                  ➕ Dodaj odlomek! 🎉
                </button>
              </div>
            )}
          </div>

          <div className="section-dark rounded-3xl p-8 border-4 border-dashed border-yellow-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-gray-100 animate-wiggle">
                🎯 Izbrani odlomki ({excerpts.length})
              </h2>
              {excerpts.length > 0 && (
                <button
                  onClick={() => {
                    setExcerpts([]);
                    setRemainingContent(storyData.content);
                  }}
                  className="text-base text-red-300 hover:text-red-100 font-black transform hover:scale-110 bg-red-600/30 px-4 py-2 rounded-full"
                >
                  🗑️ Počisti vse
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
              {excerpts.length === 0 ? (
                <div className="text-center py-16 text-gray-300">
                  <p className="text-7xl mb-4 animate-bounce-slow">📝</p>
                  <p className="text-2xl font-black mb-2">Še nisi izbral nobenega odlomka!</p>
                  <p className="text-lg mt-4 font-bold">👈 Izberi besedilo na levi strani</p>
                </div>
              ) : (
                excerpts.map((excerpt, index) => (
                  <div
                    key={excerpt.id}
                    className="bg-sky-500/20 p-6 rounded-3xl border-4 border-sky-400 shadow-xl transform hover:scale-105 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-text-light text-lg font-black">
                        #{excerpt.order}
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => moveExcerptUp(index)}
                          disabled={index === 0}
                          className="text-3xl hover:scale-125 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Premakni gor"
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => moveExcerptDown(index)}
                          disabled={index === excerpts.length - 1}
                          className="text-3xl hover:scale-125 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Premakni dol"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => removeExcerpt(excerpt.id)}
                          className="text-3xl hover:scale-125 transition-transform"
                          title="Odstrani"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                    <p className="text-base text-gray-100 line-clamp-4 font-semibold">
                      {excerpt.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {excerpts.length > 0 && (
              <div className="mt-8 pt-8 border-t-4 border-dashed border-yellow-200">
                <button
                  onClick={handleContinue}
                  className="btn bg-yellow-100 text-text w-full text-lg"
                >
                  ➡️ Nadaljuj na dodelitev učencem! 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectExcerptsPage;
                                                         