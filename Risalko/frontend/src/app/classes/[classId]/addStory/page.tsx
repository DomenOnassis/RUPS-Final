'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const AddStoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'text' | 'txt'>('text');
  const [txtFile, setTxtFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txtContent, setTxtContent] = useState<string>('');
  const [isReadingTxt, setIsReadingTxt] = useState(false);

  const handleTxtFileRead = async (file: File): Promise<string> => {
    try {
      const text = await file.text();
      if (!text || text.trim().length === 0) {
        throw new Error('TXT datoteka ne vsebuje besedila');
      }
      return text;
    } catch (e) {
      console.error('TXT read error:', e);
      throw new Error('Napaka pri branju TXT datoteke');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setTxtFile(file);
      setError(null);
      setIsReadingTxt(true);

      try {
        const text = await handleTxtFileRead(file);
        setTxtContent(text);
        setContent(text);
      } catch (err) {
        console.error('TXT read failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Napaka pri branju TXT datoteke';
        setError(errorMessage);
        setTxtContent('');

        alert('Napaka pri branju .txt datoteke. Lahko vnesete besedilo ročno v polje za besedilo.');
        setUploadMethod('text');
      } finally {
        setIsReadingTxt(false);
      }
    } else {
      setError('Prosim naložite .txt datoteko');
      setTxtFile(null);
      setTxtContent('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let storyContent = content;

      if (uploadMethod === 'txt' && txtFile && txtContent) {
        storyContent = txtContent;
      }

      const storyData = {
        title,
        author,
        shortDescription,
        content: storyContent,
        fullText: storyContent,
      };

      sessionStorage.setItem('newStory', JSON.stringify(storyData));

      router.push(`/classes/${classId}/addStory/selectExcerpts`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Napaka pri ustvarjanju zgodbe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="background min-h-screen flex items-center justify-center p-4">
      <div className="section-dark max-w-xl w-full">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-yellow-100 hover:text-yellow-200 transition-colors font-medium text-2xl"
          >
            ←
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8 gradient-text">
          Dodaj novo zgodbo
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Naslov zgodbe *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vnesi naslov zgodbe"
              required
              className="input-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Avtor *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Vnesi ime avtorja"
              required
              className="input-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Kratek opis
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Vnesi kratek opis zgodbe (opciono)..."
              rows={3}
              className="input-text font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-2">
              Dolžina: {shortDescription.length} znakov
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-3">
              Način vnosa vsebine *
            </label>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('text')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${uploadMethod === 'text'
                    ? 'bg-yellow-100 text-text shadow-lg'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                  }`}
              >
                📝 Besedilo
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('txt')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${uploadMethod === 'txt'
                    ? 'bg-yellow-100 text-text shadow-lg'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                  }`}
              >
                📄 .txt
              </button>
            </div>
          </div>

          {uploadMethod === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Vsebina zgodbe *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Vnesi ali prilepi vsebino zgodbe..."
                required
                rows={15}
                className="input-text font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-2">
                Dolžina: {content.length} znakov
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Naloži .txt datoteko *
              </label>
              <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="txt-upload"
                  required={uploadMethod === 'txt'}
                  disabled={isReadingTxt}
                />
                <label
                  htmlFor="txt-upload"
                  className={`cursor-pointer inline-block bg-yellow-100 text-text font-semibold py-3 px-6 rounded-lg hover:bg-yellow-200 transition-all shadow-md hover:shadow-lg ${isReadingTxt ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {isReadingTxt ? '⏳ Branje .txt...' : '📤 Izberi .txt datoteko'}
                </label>

                {txtFile && (
                  <div className="mt-4 text-gray-200">
                    <p className="font-medium">Izbrana datoteka:</p>
                    <p className="text-sm">{txtFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(txtFile.size / 1024).toFixed(2)} KB
                    </p>
                    {isReadingTxt && (
                      <p className="text-sm text-yellow-100 mt-2">
                        ⏳ Branje .txt datoteke...
                      </p>
                    )}
                    {txtContent && !isReadingTxt && (
                      <p className="text-sm text-green-300 mt-2">
                        ✅ Besedilo uspešno naloženo ({txtContent.length} znakov)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {txtContent && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Vsebina iz .txt datoteke:
                  </label>
                  <textarea
                    value={txtContent}
                    onChange={(e) => {
                      setTxtContent(e.target.value);
                      setContent(e.target.value);
                    }}
                    placeholder="Vsebina iz .txt datoteke se bo pojavila tukaj..."
                    rows={10}
                    className="input-text font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Dolžina: {txtContent.length} znakov - Lahko uredite besedilo po potrebi
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                💡 Besedilo iz .txt datoteke bo prikazano za urejanje
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn bg-gray-600 hover:bg-gray-500 text-gray-200 flex-1"
              disabled={isLoading}
            >
              Prekliči
            </button>
            <button
              type="submit"
              disabled={isLoading || isReadingTxt || (uploadMethod === 'txt' && !txtContent)}
              className="btn bg-yellow-100 text-text flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Ustvarjam...' :
                isReadingTxt ? '⏳ Branje .txt...' :
                  uploadMethod === 'txt' && !txtContent ? '📄 Najprej naložite .txt' :
                    '✨ Ustvari zgodbo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStoryPage;