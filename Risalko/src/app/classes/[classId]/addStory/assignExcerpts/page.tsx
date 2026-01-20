'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Excerpt {
  id: string;
  text: string;
  order: number;
  assignedTo?: string;
}

interface Student {
  id: number;
  name: string;
  surname: string;
  email?: string;
  code?: string;
}

const AssignExcerptsPage = () => {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId;

  const [storyData, setStoryData] = useState<any>(null);
  const [excerpts, setExcerpts] = useState<Excerpt[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<'manual' | 'random'>('manual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storyStored = sessionStorage.getItem('newStory');
    const excerptsStored = sessionStorage.getItem('storyExcerpts');
    
    if (storyStored && excerptsStored) {
      setStoryData(JSON.parse(storyStored));
      setExcerpts(JSON.parse(excerptsStored));
    } else {
      router.push(`/classes/${classId}/addStory`);
      return;
    }

    const fetchStudents = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/classes/${classId}?populate=true`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        if (data.data && data.data.students) {
          setStudents(data.data.students);
        }
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classId, router]);

  const handleManualAssign = (excerptId: string, studentId: string) => {
    setExcerpts(excerpts.map(excerpt => 
      excerpt.id === excerptId 
        ? { ...excerpt, assignedTo: studentId }
        : excerpt
    ));
  };

  const handleRandomAssign = () => {
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    const assigned: Excerpt[] = excerpts.map((excerpt, index) => {
      const studentId = shuffledStudents[index % students.length].id;
      
      return {
        ...excerpt,
        assignedTo: studentId.toString(),
      };
    });
    setExcerpts(assigned);
  };

  const clearAssignments = () => {
    setExcerpts(excerpts.map(excerpt => ({ ...excerpt, assignedTo: undefined })));
  };

  const getStudentName = (studentId?: string) => {
    if (!studentId) return null;
    const student = students.find(s => s.id.toString() === studentId);
    return student ? `${student.name} ${student.surname}` : null;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const storyRes = await fetch('http://127.0.0.1:8000/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: storyData.title,
          author: storyData.author || '',
          short_description: storyData.shortDescription || '',
          content: storyData.fullText || '',
          is_finished: false,
        }),
      });

      const storyResult = await storyRes.json();
      let storyId: number | null = null;
      
      if (storyResult.data && storyResult.data.id) {
        storyId = storyResult.data.id;
      } else {
        try {
          const listRes = await fetch('http://127.0.0.1:8000/api/stories', { 
            method: 'GET', 
            headers: { 'Content-Type': 'application/json' } 
          });
          const listJson = await listRes.json();
          if (listJson.data && Array.isArray(listJson.data)) {
            const match = listJson.data.find((s: any) => 
              s.title === storyData.title && s.author === (storyData.author || '')
            );
            if (match && match.id) {
              storyId = match.id;
            }
          }
        } catch (e) {
          console.warn('Could not fallback-find created story:', e);
        }
      }

      if (!storyId) {
        throw new Error('Error creating story (no ID)');
      }

      const paragraphPromises = excerpts.map(async (excerpt) => {
        if (!excerpt.assignedTo) return null;

        const res = await fetch(`http://127.0.0.1:8000/api/users/${excerpt.assignedTo}/paragraphs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            story_id: storyId,
            content: excerpt.text,
            order: excerpt.order,
            drawing: '',
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error('Paragraph creation error:', err.detail);
          return null;
        }
        return await res.json();
      });

      const results = await Promise.all(paragraphPromises);
      const successCount = results.filter(r => r !== null).length;
      const assignedCount = excerpts.filter(e => e.assignedTo).length;
      
      if (successCount !== assignedCount) {
        console.warn(`Only ${successCount} of ${assignedCount} paragraphs created`);
      }

      const classRes = await fetch(`http://127.0.0.1:8000/api/classes/${classId}?populate=true`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const classData = await classRes.json();

      if (classData.data) {
        const currentStories = classData.data.stories || [];
        const storyIds = currentStories.map((s: any) => s.id);
        
        await fetch(`http://127.0.0.1:8000/api/classes/${classId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stories: [...storyIds, storyId],
          }),
        });
      }

      alert(`✅ Story "${storyData.title}" with ${assignedCount} paragraphs created successfully!`);
      
      sessionStorage.removeItem('newStory');
      sessionStorage.removeItem('storyExcerpts');
      
      router.push(`/classes/${classId}`);
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Error saving story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !storyData || excerpts.length === 0) {
    return (
      <div className="risalko-app">
        <div className="risalko-loading">
          <div className="risalko-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="risalko-app">
        <main className="risalko-content-narrow">
          <div className="risalko-card text-center">
            <p className="text-lg font-semibold text-neutral-800 mb-2">No students in this class</p>
            <p className="text-neutral-500 mb-4">Please add students before assigning paragraphs.</p>
            <button
              onClick={() => router.push(`/classes/${classId}/addStudents`)}
              className="risalko-btn risalko-btn-primary"
            >
              Add Students
            </button>
          </div>
        </main>
      </div>
    );
  }

  const allAssigned = excerpts.every(e => e.assignedTo);

  return (
    <div className="risalko-app">
      <header className="risalko-header">
        <div className="risalko-header-content">
          <button onClick={() => router.back()} className="risalko-back-btn">
            ← Back
          </button>
          <div>
            <h1 className="risalko-header-title">Assign Paragraphs</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {storyData.title} — {excerpts.length} paragraphs
            </p>
          </div>
        </div>
      </header>

      <main className="risalko-content">
        {/* Mode Toggle */}
        <div className="risalko-card mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-3">
              <button
                onClick={() => setAssignmentMode('manual')}
                className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                  assignmentMode === 'manual'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                ✋ Manual
              </button>
              <button
                onClick={() => setAssignmentMode('random')}
                className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                  assignmentMode === 'random'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                🎲 Random
              </button>
            </div>

            {assignmentMode === 'random' && (
              <div className="flex gap-3">
                <button onClick={handleRandomAssign} className="risalko-btn risalko-btn-primary">
                  🎲 Assign Randomly
                </button>
                <button onClick={clearAssignments} className="risalko-btn risalko-btn-ghost">
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Paragraphs List */}
        <div className="risalko-card">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {excerpts.map((excerpt) => (
              <div
                key={excerpt.id}
                className="p-4 bg-neutral-50 rounded-xl border border-neutral-200"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-block bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-lg flex-shrink-0">
                    #{excerpt.order}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-600 mb-3 line-clamp-3">
                      {excerpt.text}
                    </p>
                    
                    {assignmentMode === 'manual' ? (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-neutral-600">
                          Assign to:
                        </label>
                        <select
                          value={excerpt.assignedTo || ''}
                          onChange={(e) => handleManualAssign(excerpt.id, e.target.value)}
                          className="risalko-input w-auto"
                        >
                          <option value="">-- Select student --</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id.toString()}>
                              {student.name} {student.surname}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {excerpt.assignedTo ? (
                          <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                            👤 {getStudentName(excerpt.assignedTo)}
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400 italic">
                            Not assigned
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">
                Assigned: {excerpts.filter(e => e.assignedTo).length} / {excerpts.length}
              </div>
              <button
                onClick={handleFinish}
                disabled={!allAssigned || saving}
                className="risalko-btn risalko-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '⏳ Saving...' : allAssigned ? '✓ Finish & Save' : 'Assign all to continue'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignExcerptsPage;