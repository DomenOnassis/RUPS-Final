"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Paragraph {
  id: number;
  story_id: number;
  content: string;
  drawing: string | null;
  order: number;
}

interface Student {
  id: number;
  name: string;
  surname: string;
  email: string;
  code?: string;
  paragraphs: number[];
}

interface Story {
  id: number;
  title: string;
  author: string;
  short_description: string;
  content: string;
  is_finished: boolean;
}

interface StoryData {
  story: Story | null;
  paragraphs: Paragraph[];
  students: Student[];
  paragraphAssignments: Map<number, number>;
}

export default function StoryPage() {
  const params = useParams();
  const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId;
  const storyId = Array.isArray(params.storyId) ? params.storyId[0] : params.storyId;
  const router = useRouter();
  const [data, setData] = useState<StoryData>({
    story: null,
    paragraphs: [],
    students: [],
    paragraphAssignments: new Map(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userParagraphs, setUserParagraphs] = useState<number[]>([]);
  const [isFinalizingStory, setIsFinalizingStory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user info first
        let userType: string | null = null;
        let userParagraphIds: number[] = [];
        
        const userStored = localStorage.getItem('user');
        if (userStored) {
          try {
            const user = JSON.parse(userStored);
            userType = user.type || null;
            setUserType(userType);
            setUserId(user.id);
            
            // Normalize paragraph IDs from user object
            userParagraphIds = user.paragraphs || [];
            setUserParagraphs(userParagraphIds);
          } catch (e) {
            console.error('Failed to parse user from localStorage', e);
          }
        }

        const storyRes = await fetch(`http://127.0.0.1:8000/api/stories`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const storyData = await storyRes.json();
        const story = storyData.data?.find((s: any) => s.id === parseInt(storyId as string));

        if (!story) {
          setError("Zgodba ni najdena");
          setLoading(false);
          return;
        }

        const paragraphsRes = await fetch(`http://127.0.0.1:8000/api/stories/${story.id}/paragraphs`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const paragraphsData = await paragraphsRes.json();
        let paragraphs = paragraphsData.data || [];

        if (userType === "student") {
          paragraphs = paragraphs.filter((p: Paragraph) => {
            const isAssigned = userParagraphIds.includes(p.id);
            console.log(`Paragraph ${p.id} assigned to student:`, isAssigned, 'User paragraphs:', userParagraphIds);
            return isAssigned;
          });
        }

        const classRes = await fetch(`http://127.0.0.1:8000/api/classes/${classId}?populate=true`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const classData = await classRes.json();

        if (!classData.data) {
          setError("Razred ni najden");
          setLoading(false);
          return;
        }

        const students = classData.data.students || [];
        
        const assignments = new Map<number, number>();
        
        for (const student of students) {
          const paragraphIds = student.paragraphs || [];
          
          for (const pId of paragraphIds) {
            assignments.set(pId, student.id);
          }
        }

        setData({
          story,
          paragraphs,
          students,
          paragraphAssignments: assignments,
        });
      } catch (err) {
        console.error("Napaka pri nalaganju podatkov:", err);
        setError("Napaka pri nalaganju podatkov");
      } finally {
        setLoading(false);
      }
    };

    if (classId && storyId) {
      fetchData();
    }
  }, [classId, storyId]);

  const handleStudentChange = async (paragraphId: number, newStudentId: string) => {
    setSaving(paragraphId);
    try {
      const oldStudentId = data.paragraphAssignments.get(paragraphId);
      
      if (oldStudentId) {
        const oldStudent = data.students.find(s => s.id === oldStudentId);
        
        if (oldStudent) {
          const updatedParagraphs = oldStudent.paragraphs.filter(pId => pId !== paragraphId);
          
          await fetch(`http://127.0.0.1:8000/api/users/${oldStudentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paragraphs: updatedParagraphs }),
          });
        }
      }
      
      const newStudentIdNum = newStudentId ? parseInt(newStudentId) : null;
      
      if (newStudentIdNum) {
        const newStudent = data.students.find(s => s.id === newStudentIdNum);
        
        if (newStudent) {
          const updatedParagraphs = [...newStudent.paragraphs, paragraphId];
          
          await fetch(`http://127.0.0.1:8000/api/users/${newStudentIdNum}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paragraphs: updatedParagraphs }),
          });
        }
      }
      
      setData(prev => {
        const newAssignments = new Map(prev.paragraphAssignments);
        if (newStudentIdNum) {
          newAssignments.set(paragraphId, newStudentIdNum);
        } else {
          newAssignments.delete(paragraphId);
        }
        
        const updatedStudents = prev.students.map(student => {
          if (student.id === oldStudentId) {
            return {
              ...student,
              paragraphs: student.paragraphs.filter(pId => pId !== paragraphId),
            };
          } else if (student.id === newStudentIdNum) {
            return {
              ...student,
              paragraphs: [...student.paragraphs, paragraphId],
            };
          }
          return student;
        });
        
        return {
          ...prev,
          paragraphAssignments: newAssignments,
          students: updatedStudents,
        };
      });

      console.log('✅ Odlomek uspešno prerazporejen');
      
    } catch (err) {
      console.error("Napaka pri spreminjanju učenca:", err);
      alert("Napaka pri spreminjanju učenca");
    } finally {
      setSaving(null);
    }
  };

  const handleFinalizeStory = async () => {
    if (!confirm('Ali ste prepričani, da želite zaključiti to slikanico? Zgodbe se ne bodo mogle spreminjati.')) {
      return;
    }

    setIsFinalizingStory(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/classes/${classId}/finalize-story/${storyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        throw new Error("Napaka pri zaključevanju zgodbe");
      }

      const responseData = await res.json();
      alert(`✅ Slikanica uspešno zaključena! Skupaj ${responseData.data.images_count} slik.`);
      
      // Redirect back to classes
      router.push(`/classes/${classId}`);
    } catch (err) {
      console.error("Napaka pri zaključevanju zgodbe:", err);
      alert("Napaka pri zaključevanju zgodbe");
    } finally {
      setIsFinalizingStory(false);
    }
  };

  if (loading) {
    return (
      <div className="background min-h-screen">
        <p className="text-text text-center pt-8">Nalaganje zgodbe...</p>
      </div>
    );
  }

  if (error || !data.story) {
    return (
      <div className="background min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-300 mb-4">{error || "Zgodba ni najdena"}</p>
            <button
              onClick={() => router.back()}
              className="text-gray-300 hover:text-gray-100 transition-colors text-2xl"
            >
              ←
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTeacher = userType === "teacher";
  const isStudent = userType === "student";

  return (
    <div className="background min-h-screen pb-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-gray-700/90 p-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.back()}
                className="text-yellow-100 hover:text-yellow-200 transition-colors text-lg font-semibold"
              >
                ←
              </button>
              <h1 className="text-3xl font-bold text-gray-200">{data.story.title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-gray-300 font-semibold text-lg">
                ✍️ {data.story.author}
              </p>
              {data.story.short_description && (
                <p className="text-gray-400 italic text-sm">
                  "{data.story.short_description}"
                </p>
              )}
            </div>
          </div>
          
          {/* Finalize Story Button for Teachers */}
          {isTeacher && (
            <button
              onClick={handleFinalizeStory}
              disabled={isFinalizingStory}
              className="btn bg-green-400 text-text disabled:bg-gray-500 disabled:text-gray-700"
            >
              {isFinalizingStory ? 'Zaključujem...' : '✓ Končaj slikanico'}
            </button>
          )}
        </div>

        <div className="flex justify-center items-center">
          {/* For Teachers - Show All Paragraphs with Assignment UI */}
          {isTeacher && (
            <div className="w-6xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Odlomki in učenci</h2>
              
              {data.paragraphs.length === 0 ? (
                <p className="text-text-muted text-center py-8">Ni odlomkov za to zgodbo.</p>
              ) : (
                <div className="space-y-6">
                  {data.paragraphs.map((paragraph) => {
                    const assignedStudentId = data.paragraphAssignments.get(paragraph.id);
                    const assignedStudent = data.students.find(s => s.id === assignedStudentId);

                    return (
                      <div
                        key={paragraph.id}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow p-5"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <span className="inline-block bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded flex-shrink-0">
                            #{paragraph.order}
                          </span>
                        </div>
                        
                        <p className="text-gray-800 dark:text-gray-100 text-lg leading-relaxed mb-4">
                          {paragraph.content}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            📘 Učenec:{" "}
                            <strong>
                              {assignedStudent 
                                ? `${assignedStudent.name} ${assignedStudent.surname}`
                                : "Ni dodeljen"}
                            </strong>
                          </span>

                          <select
                            value={assignedStudentId || ''}
                            onChange={(e) => handleStudentChange(paragraph.id, e.target.value)}
                            disabled={saving === paragraph.id}
                            className="ml-4 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50"
                          >
                            <option value="">-- Izberi učenca --</option>
                            {data.students.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.name} {student.surname}
                              </option>
                            ))}
                          </select>
                        </div>

                        {paragraph.drawing && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              🎨 Risba učenca:
                            </p>
                            <img 
                              src={paragraph.drawing} 
                              alt="Student drawing" 
                              className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* For Students - Show Only Their Paragraphs in Card Layout */}
          {isStudent && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tvoj odlomek</h2>
              
              {data.paragraphs.length === 0 ? (
                <p className="text-text-muted text-center py-8">Nemaš dodeljenega odlomka za to zgodbo.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.paragraphs.map((paragraph) => (
                    <Link
                      key={paragraph.id}
                      href={`/classes/${classId}/${storyId}/${paragraph.id}`}
                      className="card bg-sky-400 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-block bg-sky-600 text-white text-xs font-bold px-2 py-1 rounded">
                          Odlomek #{paragraph.order}
                        </span>
                      </div>
                      
                      <p className="text-text line-clamp-4 leading-relaxed mb-4">
                        {paragraph.content}
                      </p>

                      <div className="pt-4 border-t border-text/20">
                        {paragraph.drawing ? (
                          <p className="text-xs text-text-muted">🎨 Tvoja risba je že narejena</p>
                        ) : (
                          <p className="text-xs text-text-muted">✏️ Pripravljeni na risanje?</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}