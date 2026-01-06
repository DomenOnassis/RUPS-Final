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
  _id: string | { $oid: string };
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
        const res = await fetch(`http://127.0.0.1:5000/api/classes/${classId}?populate=true`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        if (data.data && data.data.students) {
          setStudents(data.data.students);
        }
      } catch (error) {
        console.error("Napaka pri pridobivanju učencev:", error);
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
      const studentRawId = shuffledStudents[index % students.length]._id;
      const studentId: string = typeof studentRawId === 'string' ? studentRawId : (studentRawId as { $oid: string }).$oid;
      
      return {
        ...excerpt,
        assignedTo: studentId,
      };
    });
    setExcerpts(assigned);
  };

  const clearAssignments = () => {
    setExcerpts(excerpts.map(excerpt => ({ ...excerpt, assignedTo: undefined })));
  };

  const getStudentName = (studentId?: string) => {
    if (!studentId) return null;
    const student = students.find(s => {
      const id = typeof s._id === 'string' ? s._id : s._id.$oid;
      return id === studentId;
    });
    return student ? `${student.name} ${student.surname}` : null;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const storyRes = await fetch('http://127.0.0.1:5000/api/stories', {
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
      let storyId: string | null = null;
      if (storyResult.data && storyResult.data._id) {
        storyId = typeof storyResult.data._id === 'string' ? storyResult.data._id : storyResult.data._id.$oid;
      } else {
        try {
          const listRes = await fetch('http://127.0.0.1:5000/api/stories', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
          const listJson = await listRes.json();
          if (listJson.data && Array.isArray(listJson.data)) {
            const match = listJson.data.find((s: any) => 
              s.title === (storyData.title) && s.author === (storyData.author || '')
            );
            if (match && match._id) {
              storyId = typeof match._id === 'string' ? match._id : match._id.$oid;
            }
          }
        } catch (e) {
          console.warn('Could not fallback-find created story:', e);
        }
      }

      if (!storyId) {
        throw new Error('Napaka pri ustvarjanju zgodbe (ni ID)');
      }

      const paragraphPromises = excerpts.map(async (excerpt) => {
        if (!excerpt.assignedTo) return null;

        const res = await fetch(`http://127.0.0.1:5000/api/users/${excerpt.assignedTo}/paragraphs`, {
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
          console.error('Paragraph creation error:', err);
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

      const classRes = await fetch(`http://127.0.0.1:5000/api/classes/${classId}?populate=true`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const classData = await classRes.json();

      if (classData.data) {
        const currentStories = classData.data.stories || [];
        const storyIds = currentStories.map((s: any) => 
          typeof s._id === 'string' ? s._id : s._id.$oid
        );
        
        await fetch(`http://127.0.0.1:5000/api/classes/${classId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stories: [...storyIds, storyId],
          }),
        });
      }

      alert(`✅ Zgodba "${storyData.title}" z ${assignedCount} odlomki uspešno ustvarjena!`);
      
      sessionStorage.removeItem('newStory');
      sessionStorage.removeItem('storyExcerpts');
      
      router.push(`/classes/${classId}`);
    } catch (error) {
      console.error('Napaka pri shranjevanju zgodbe:', error);
      alert('Napaka pri shranjevanju zgodbe. Poskusite znova.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !storyData || excerpts.length === 0) {
    return (
      <div className="background min-h-screen flex items-center justify-center">
        <p className="text-text">Nalaganje...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="background min-h-screen flex items-center justify-center p-6">
        <div className="section-dark text-center rounded-2xl p-8">
          <p className="text-lg font-semibold text-gray-100 mb-2">Ni učencev v tem razredu</p>
          <p className="text-gray-300 mb-4">Prosimo dodajte učence pred dodeljevanjem odlomkov.</p>
          <button
            onClick={() => router.push(`/classes/${classId}/addStudents`)}
            className="btn bg-yellow-100 text-text"
          >
            Dodaj učence
          </button>
        </div>
      </div>
    );
  }

  const allAssigned = excerpts.every(e => e.assignedTo);

  return (
    <div className="background min-h-screen p-4">
      <div className="max-w-5xl mx-auto flex flex-col">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-text transition-all font-medium hover:scale-110 text-2xl"
          >
            ←
          </button>
        </div>

        <h1 className="text-6xl font-bold text-center mb-2 gradient-text text-outline-dark">
          📚 Dodeli odlomke učencem 👥
        </h1>
        <p className="text-center text-text mb-4 text-xl font-bold">
          {storyData.title} - {excerpts.length} odlomkov
        </p>

        <div className="section-dark rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-4">
              <button
                onClick={() => setAssignmentMode('manual')}
                className={`btn py-2 px-6 rounded-lg font-semibold transition-all ${
                  assignmentMode === 'manual'
                    ? 'bg-yellow-100 text-text shadow-lg'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
              >
                ✋ Ročna dodelitev
              </button>
              <button
                onClick={() => setAssignmentMode('random')}
                className={`btn py-2 px-6 rounded-lg font-semibold transition-all ${
                  assignmentMode === 'random'
                    ? 'bg-yellow-100 text-text shadow-lg'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
              >
                🎲 Naključna dodelitev
              </button>
            </div>

            {assignmentMode === 'random' && (
              <div className="flex gap-3">
                <button
                  onClick={handleRandomAssign}
                  className="btn bg-green-400 text-text"
                >
                  🎲 Dodeli naključno
                </button>
                <button
                  onClick={clearAssignments}
                  className="btn bg-sky-400 text-text"
                >
                  Počisti
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="section-dark rounded-2xl p-6 mt-2">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
            {excerpts.map((excerpt) => (
              <div
                key={excerpt.id}
                className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-block bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded flex-shrink-0">
                    #{excerpt.order}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                      {excerpt.text}
                    </p>
                    
                    {assignmentMode === 'manual' ? (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Dodeli učencu:
                        </label>
                        <select
                          value={excerpt.assignedTo || ''}
                          onChange={(e) => handleManualAssign(excerpt.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          <option value="">-- Izberi učenca --</option>
                          {students.map((student) => {
                            const studentId = typeof student._id === 'string' ? student._id : student._id.$oid;
                            return (
                              <option key={studentId} value={studentId}>
                                {student.name} {student.surname}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {excerpt.assignedTo ? (
                          <>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Dodeljeno:
                            </span>
                            <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                              👤 {getStudentName(excerpt.assignedTo)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Ni dodeljeno
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-400">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-200">
                Dodeljeno: {excerpts.filter(e => e.assignedTo).length} / {excerpts.length}
              </div>
              <button
                onClick={handleFinish}
                disabled={!allAssigned || saving}
                className="btn bg-green-400 text-text disabled:bg-gray-500 disabled:text-gray-700"
              >
                {saving ? '⏳ Shranjevanje...' : allAssigned ? '✅ Zaključi in shrani' : '⚠️ Dodeli vse odlomke za nadaljevanje'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignExcerptsPage;
