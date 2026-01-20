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
        throw new Error('TXT file does not contain text');
      }
      return text;
    } catch (e) {
      console.error('TXT read error:', e);
      throw new Error('Error reading TXT file');
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
        const errorMessage = err instanceof Error ? err.message : 'Error reading TXT file';
        setError(errorMessage);
        setTxtContent('');

        alert('Error reading .txt file. You can enter text manually in the text field.');
        setUploadMethod('text');
      } finally {
        setIsReadingTxt(false);
      }
    } else {
      setError('Please upload a .txt file');
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
      setError(err instanceof Error ? err.message : 'Error creating story');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="risalko-app">
      <header className="risalko-header">
        <div className="risalko-header-content">
          <button onClick={() => router.back()} className="risalko-back-btn">
            ← Back
          </button>
          <h1 className="risalko-header-title">Add New Story</h1>
        </div>
      </header>

      <main className="risalko-content-narrow">
        <div className="risalko-card">
          {error && <div className="risalko-alert-error mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="risalko-form-section">
            <div>
              <label className="risalko-label">Story Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter story title"
                required
                className="risalko-input"
              />
            </div>

            <div>
              <label className="risalko-label">Author *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                required
                className="risalko-input"
              />
            </div>

            <div>
              <label className="risalko-label">Short Description</label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Enter a brief story description (optional)..."
                rows={3}
                className="risalko-textarea"
              />
              <p className="text-xs text-neutral-400 mt-2">
                {shortDescription.length} characters
              </p>
            </div>

            <div>
              <label className="risalko-label">Content Input Method *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUploadMethod('text')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2 ${uploadMethod === 'text'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                >
                  📝 Text
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('txt')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2 ${uploadMethod === 'txt'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                >
                  📄 .txt File
                </button>
              </div>
            </div>

            {uploadMethod === 'text' ? (
              <div>
                <label className="risalko-label">Story Content *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter or paste the story content..."
                  required
                  rows={15}
                  className="risalko-textarea font-mono text-sm"
                />
                <p className="text-xs text-neutral-400 mt-2">
                  {content.length} characters
                </p>
              </div>
            ) : (
              <div>
                <label className="risalko-label">Upload .txt File *</label>
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center bg-neutral-50">
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
                    className={`cursor-pointer inline-block risalko-btn risalko-btn-secondary ${isReadingTxt ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isReadingTxt ? '⏳ Reading...' : '📄 Select .txt file'}
                  </label>

                  {txtFile && (
                    <div className="mt-4 text-neutral-600">
                      <p className="font-medium">{txtFile.name}</p>
                      <p className="text-sm text-neutral-400">
                        {(txtFile.size / 1024).toFixed(2)} KB
                      </p>
                      {txtContent && !isReadingTxt && (
                        <p className="text-sm text-emerald-600 mt-2">
                          ✅ Loaded ({txtContent.length} characters)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {txtContent && (
                  <div className="mt-4">
                    <label className="risalko-label">Loaded Content (editable)</label>
                    <textarea
                      value={txtContent}
                      onChange={(e) => {
                        setTxtContent(e.target.value);
                        setContent(e.target.value);
                      }}
                      rows={10}
                      className="risalko-textarea font-mono text-sm"
                    />
                    <p className="text-xs text-neutral-400 mt-2">
                      {txtContent.length} characters — You can edit as needed
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="risalko-btn risalko-btn-ghost flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isReadingTxt || (uploadMethod === 'txt' && !txtContent)}
                className="risalko-btn risalko-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Creating...' :
                  isReadingTxt ? '⏳ Reading...' :
                    uploadMethod === 'txt' && !txtContent ? '📄 Upload file first' :
                      '✨ Create Story'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddStoryPage;