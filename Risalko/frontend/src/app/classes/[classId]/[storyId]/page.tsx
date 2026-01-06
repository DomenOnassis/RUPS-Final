"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Paragraph {
  _id: string | { $oid: string };
  story_id: string | { $oid: string };
  content: string;
  drawing: string | null;
  order: number;
}

interface Student {
  _id: string | { $oid: string };
  name: string;
  surname: string;
  email: string;
  code?: string;
  paragraphs: Array<string | { $oid: string }>;
}

interface Story {
  _id: string | { $oid: string };
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
  paragraphAssignments: Map<string, string>;
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
  const [saving, setSaving] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userParagraphs, setUserParagraphs] = useState<string[]>([]);
  const [isFinalizingStory, setIsFinalizingStory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user info first
        let userType: string | null = null;
        let userParagraphIds: string[] = [];
        
        const userStored = localStorage.getItem('user');
        if (userStored) {
          try {
            const user = JSON.parse(userStored);
            userType = user.type || null;
            setUserType(userType);
            setUserId(user._id?.$oid || user._id || user.id);
            
            // Normalize paragraph IDs from user object
            userParagraphIds = (user.paragraphs || []).map((p: any) => {
              if (typeof p === 'string') {
                return p;
              } else if (p.$oid) {
                return p.$oid;
              } else if (p._id) {
                return typeof p._id === 'string' ? p._id : p._id.$oid;
              }
              return p;
            });
            setUserParagraphs(userParagraphIds);
          } catch (e) {
            console.error('Failed to parse user from localStorage', e);
          }
        }

        const storyRes = await fetch(`http://127.0.0.1:5000/api/stories`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const storyData = await storyRes.json();
        const story = storyData.data?.find((s: any) => {
          const sid = typeof s._id === 'string' ? s._id : s._id.$oid;
          return sid === storyId;
        });

        if (!story) {
          setError("Zgodba ni najdena");
          setLoading(false);
          return;
        }

        const normalizedStoryId = typeof story._id === 'string' ? story._id : story._id.$oid;
        const paragraphsRes = await fetch(`http://127.0.0.1:5000/api/stories/${normalizedStoryId}/paragraphs`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const paragraphsData = await paragraphsRes.json();
        let paragraphs = paragraphsData.data || [];

        if (userType === "student") {
          paragraphs = paragraphs.filter((p: Paragraph) => {
            const pId = typeof p._id === 'string' ? p._id : p._id.$oid;
            const isAssigned = userParagraphIds.includes(pId);
            console.log(`Paragraph ${pId} assigned to student:`, isAssigned, 'User paragraphs:', userParagraphIds);
            return isAssigned;
          });
        }

        const classRes = await fetch(`http://127.0.0.1:5000/api/classes/${classId}?populate=true`, {
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
        
        const assignments = new Map<string, string>();
        
        for (const student of students) {
          const studentId = typeof student._id === 'string' ? student._id : student._id.$oid;
          const paragraphIds = student.paragraphs || [];
          
          for (const pId of paragraphIds) {
            const paragraphId = typeof pId === 'string' ? pId : pId.$oid;
            assignments.set(paragraphId, studentId);
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

  const handleStudentChange = async (paragraphId: string, newStudentId: string) => {
    setSaving(paragraphId);
    try {
      const oldStudentId = data.paragraphAssignments.get(paragraphId);
      
      if (oldStudentId) {
        const oldStudent = data.students.find(s => {
          const sid = typeof s._id === 'string' ? s._id : s._id.$oid;
          return sid === oldStudentId;
        });
        
        if (oldStudent) {
          const updatedParagraphs = oldStudent.paragraphs
            .filter(pId => {
              const pid = typeof pId === 'string' ? pId : pId.$oid;
              return pid !== paragraphId;
            })
            .map(pId => typeof pId === 'string' ? pId : pId.$oid);
          
          await fetch(`http://127.0.0.1:5000/api/users/${oldStudentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paragraphs: updatedParagraphs }),
          });
        }
      }
      
      if (newStudentId) {
        const newStudent = data.students.find(s => {
          const sid = typeof s._id === 'string' ? s._id : s._id.$oid;
          return sid === newStudentId;
        });
        
        if (newStudent) {
          const currentParagraphs = newStudent.paragraphs.map(pId => 
            typeof pId === 'string' ? pId : pId.$oid
          );
          const updatedParagraphs = [...currentParagraphs, paragraphId];
          
          await fetch(`http://127.0.0.1:5000/api/users/${newStudentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paragraphs: updatedParagraphs }),
          });
        }
      }
      
      setData(prev => {
        const newAssignments = new Map(prev.paragraphAssignments);
        if (newStudentId) {
          newAssignments.set(paragraphId, newStudentId);
        } else {
          newAssignments.delete(paragraphId);
        }
        
        const updatedStudents = prev.students.map(student => {
          const studentId = typeof student._id === 'string' ? student._id : student._id.$oid;
          
          if (studentId === oldStudentId) {
            return {
              ...student,
              paragraphs: student.paragraphs.filter(pId => {
                const pid = typeof pId === 'string' ? pId : pId.$oid;
                return pid !== paragraphId;
              }),
            };
          } else if (studentId === newStudentId) {
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
        `http://127.0.0.1:5000/api/classes/${classId}/finalize-story/${storyId}`,
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
                    const paragraphId = typeof paragraph._id === 'string' ? paragraph._id : paragraph._id.$oid;
                    const assignedStudentId = data.paragraphAssignments.get(paragraphId);
                    const assignedStudent = data.students.find(s => {
                      const sid = typeof s._id === 'string' ? s._id : s._id.$oid;
                      return sid === assignedStudentId;
                    });

                    return (
                      <div
                        key={paragraphId}
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
                            onChange={(e) => handleStudentChange(paragraphId, e.target.value)}
                            disabled={saving === paragraphId}
                            className="ml-4 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50"
                          >
                            <option value="">-- Izberi učenca --</option>
                            {data.students.map((student) => {
                              const studentId = typeof student._id === 'string' ? student._id : student._id.$oid;
                              return (
                                <option key={studentId} value={studentId}>
                                  {student.name} {student.surname}
                                </option>
                              );
                            })}
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
                  {data.paragraphs.map((paragraph) => {
                    const paragraphId = typeof paragraph._id === 'string' ? paragraph._id : paragraph._id.$oid;

                    return (
                      <Link
                        key={paragraphId}
                        href={`/classes/${classId}/${storyId}/${paragraphId}`}
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
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
