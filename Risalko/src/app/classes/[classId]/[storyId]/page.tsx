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
          setError("Story not found");
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
          setError("Class not found");
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
        console.error("Error loading data:", err);
        setError("Error loading data");
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

      console.log('✅ Paragraph reassigned successfully');
      
    } catch (err) {
      console.error("Error updating student:", err);
      alert("Error updating student");
    } finally {
      setSaving(null);
    }
  };

  const handleFinalizeStory = async () => {
    if (!confirm('Are you sure you want to complete this story? Changes will not be allowed after.')) {
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
        throw new Error("Error completing story");
      }

      const responseData = await res.json();
      alert(`✅ Story completed successfully! Total ${responseData.data.images_count} images.`);
      
      // Redirect back to classes
      router.push(`/classes/${classId}`);
    } catch (err) {
      console.error("Error completing story:", err);
      alert("Error completing story");
    } finally {
      setIsFinalizingStory(false);
    }
  };

  if (loading) {
    return (
      <div className="risalko-app">
        <div className="risalko-loading">
          <div className="risalko-spinner"></div>
          <p>Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !data.story) {
    return (
      <div className="risalko-app">
        <div className="flex items-center justify-center min-h-screen">
          <div className="risalko-card text-center">
            <p className="text-lg font-semibold text-red-600 mb-4">{error || "Story not found"}</p>
            <button onClick={() => router.back()} className="risalko-btn risalko-btn-secondary">
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTeacher = userType === "teacher";
  const isStudent = userType === "student";

  return (
    <div className="risalko-app">
      <header className="risalko-header">
        <div className="risalko-header-content">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="risalko-back-btn">
              ← Back
            </button>
            <div>
              <h1 className="risalko-header-title">{data.story.title}</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-neutral-500">✍️ {data.story.author}</p>
                {data.story.short_description && (
                  <p className="text-neutral-400 italic text-sm">"{data.story.short_description}"</p>
                )}
              </div>
            </div>
          </div>
          
          {isTeacher && (
            <button
              onClick={handleFinalizeStory}
              disabled={isFinalizingStory}
              className="risalko-btn risalko-btn-primary"
            >
              {isFinalizingStory ? 'Completing...' : '✓ Complete Story'}
            </button>
          )}
        </div>
      </header>

      <main className="risalko-content">
        {/* For Teachers - Show All Paragraphs with Assignment UI */}
        {isTeacher && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-neutral-800 mb-6">Paragraphs & Assignments</h2>
            
            {data.paragraphs.length === 0 ? (
              <div className="risalko-empty">
                <p>No paragraphs for this story.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.paragraphs.map((paragraph) => {
                  const assignedStudentId = data.paragraphAssignments.get(paragraph.id);
                  const assignedStudent = data.students.find(s => s.id === assignedStudentId);

                  return (
                    <div key={paragraph.id} className="risalko-card">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="inline-block bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-lg">
                          #{paragraph.order}
                        </span>
                      </div>
                      
                      <p className="text-neutral-700 text-base leading-relaxed mb-4">
                        {paragraph.content}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                        <span className="text-sm text-neutral-500">
                          Assigned to:{" "}
                          <strong className="text-neutral-700">
                            {assignedStudent 
                              ? `${assignedStudent.name} ${assignedStudent.surname}`
                              : "Unassigned"}
                          </strong>
                        </span>

                        <select
                          value={assignedStudentId || ''}
                          onChange={(e) => handleStudentChange(paragraph.id, e.target.value)}
                          disabled={saving === paragraph.id}
                          className="risalko-input w-auto"
                        >
                          <option value="">-- Select student --</option>
                          {data.students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name} {student.surname}
                            </option>
                          ))}
                        </select>
                      </div>

                      {paragraph.drawing && (
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                          <p className="text-sm text-neutral-500 mb-2">🎨 Student's illustration:</p>
                          <img 
                            src={paragraph.drawing} 
                            alt="Student drawing" 
                            className="max-w-full h-auto rounded-lg border border-neutral-200"
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

        {/* For Students - Show Only Their Paragraphs */}
        {isStudent && (
          <div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-6">Your Assignments</h2>
            
            {data.paragraphs.length === 0 ? (
              <div className="risalko-empty">
                <p>You have no assignments for this story.</p>
              </div>
            ) : (
              <div className="risalko-grid">
                {data.paragraphs.map((paragraph) => (
                  <Link
                    key={paragraph.id}
                    href={`/classes/${classId}/${storyId}/${paragraph.id}`}
                    className="risalko-card-interactive"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg">
                        Paragraph #{paragraph.order}
                      </span>
                      {paragraph.drawing ? (
                        <span className="text-xs text-emerald-600">✓ Complete</span>
                      ) : (
                        <span className="text-xs text-amber-600">Pending</span>
                      )}
                    </div>
                    
                    <p className="text-neutral-600 line-clamp-4 leading-relaxed mb-4">
                      {paragraph.content}
                    </p>

                    <div className="pt-4 border-t border-neutral-100">
                      {paragraph.drawing ? (
                        <p className="text-xs text-neutral-500">🎨 Your illustration is complete</p>
                      ) : (
                        <p className="text-xs text-indigo-600 font-medium">✏️ Ready to illustrate?</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}