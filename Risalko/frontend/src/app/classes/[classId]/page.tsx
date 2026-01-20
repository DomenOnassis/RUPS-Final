"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const ClassPage = () => {
  type Story = {
    id: number;
    title: string;
    short_description: string;
    author?: string;
    is_finished?: boolean;
  };

  type FinalizedStory = {
    story_id: number;
    paragraphs: Array<{
      paragraph_id: number;
      content: string;
      drawing: string | null;
      order: number;
    }>;
    story?: {
      title: string;
      short_description: string;
      author?: string;
    };
  };

  const [stories, setStories] = useState<Story[]>([]);
  const [finalizedStories, setFinalizedStories] = useState<FinalizedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [className, setClassName] = useState('');
  const [userParagraphs, setUserParagraphs] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"workshop" | "finished">(
    "workshop"
  );
  const [slideshowStory, setSlideshowStory] = useState<FinalizedStory | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const params = useParams();
  const router = useRouter();
  const classId = params.classId;

  useEffect(() => {
    const userStored = localStorage.getItem('user');
    if (userStored) {
      try {
        const user = JSON.parse(userStored);
        setUserType(user.type || null);
        setUserId(user.id);
        const paragraphIds = user.paragraphs || [];
        setUserParagraphs(paragraphIds);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/classes/${classId}?populate=true`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (data.data) {
          const cls = data.data;
          setClassName(cls.class_name || '');

          const classStories = cls.stories || [];
          setStories(classStories);
          console.log(cls);

          const finalized = (cls.finalized_stories || []).map((fs: any) => ({
            story_id: fs.story_id,
            paragraphs: fs.paragraphs || [],
            story: fs.story || {
              title: 'Unknown Story',
              short_description: '',
              author: ''
            }
          }));
          setFinalizedStories(finalized);
        }
      } catch (error) {
        console.error("Error loading class data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  if (loading) {
    return (
      <div className="background">
        <p className="text-text text-center pt-8">Loading class...</p>
      </div>
    );
  }

  const isTeacher = userType === "teacher";
  const isStudent = userType === "student";

  const handleNextImage = () => {
    if (slideshowStory) {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowStory.paragraphs.length);
    }
  };

  const handlePrevImage = () => {
    if (slideshowStory) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? slideshowStory.paragraphs.length - 1 : prev - 1
      );
    }
  };

  const openSlideshow = (story: FinalizedStory) => {
    setSlideshowStory(story);
    setCurrentImageIndex(0);
  };

  const closeSlideshow = () => {
    setSlideshowStory(null);
    setCurrentImageIndex(0);
  };

  return (
    <div className="risalko-app">
      <header className="risalko-header">
        <div className="risalko-header-content">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/classes')} className="risalko-back-btn">
              ← Back
            </button>
            <div>
              <h1 className="risalko-header-title">{className || 'Class'}</h1>
              <p className="text-sm text-neutral-500 mt-1">
                {isStudent ? 'My Assignments' : 'Stories and Students'}
              </p>
            </div>
          </div>
          {isTeacher && (
            <Link href={`/classes/${classId}/addStory`} className="risalko-btn risalko-btn-primary">
              + Add Story
            </Link>
          )}
        </div>
      </header>

      <main className="risalko-content">
        {isTeacher && (
          <div className="flex gap-3 mb-6">
            <Link href={`/classes/${classId}/addStudents`} className="risalko-btn risalko-btn-secondary text-sm">
              + Add Student
            </Link>
            <Link href={`/classes/${classId}/viewStudents`} className="risalko-btn risalko-btn-ghost text-sm">
              👥 View Students
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-8 flex gap-8">
          <button
            onClick={() => setActiveTab("workshop")}
            className={`pb-3 font-medium text-base transition-colors ${activeTab === "workshop"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-neutral-500 hover:text-neutral-700"
              }`}
          >
            Workshop
          </button>
          <button
            onClick={() => setActiveTab("finished")}
            className={`pb-3 font-medium text-base transition-colors ${activeTab === "finished"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-neutral-500 hover:text-neutral-700"
              }`}
          >
            Completed
          </button>
        </div>

        {activeTab === "workshop" && (
          <div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-6">
              {isStudent ? 'My Assignments' : 'Active Stories'}
            </h2>

            {stories.length === 0 ? (
              <div className="risalko-empty">
                <p>{isStudent ? 'No assignments yet.' : 'No active stories. Create one!'}</p>
              </div>
            ) : (
              <div className="risalko-grid">
                {stories.filter(s => !s.is_finished).map((story) => (
                  <Link
                    key={story.id}
                    href={`/classes/${classId}/${story.id}`}
                    className="risalko-card-interactive"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-neutral-800">
                        {story.title}
                      </h3>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                        In Progress
                      </span>
                    </div>
                    <p className="text-neutral-600 text-sm line-clamp-3 mb-4">
                      {story.short_description || "No description"}
                    </p>
                    {story.author && (
                      <p className="text-xs text-neutral-500 font-medium">
                        Author: {story.author}
                      </p>
                    )}
                    {isStudent && (
                      <p className="text-xs text-indigo-600 mt-3 pt-3 border-t border-neutral-100 font-medium">
                        📝 Your assignment
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "finished" && (
          <div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-6">
              Completed Illustrations
            </h2>

            {finalizedStories.length === 0 ? (
              <div className="risalko-empty">
                <p>No completed illustrations yet.</p>
              </div>
            ) : (
              <div className="risalko-grid">
                {finalizedStories.map((story, idx) => {
                  const storyId = story.story_id || idx;
                  const hasParagraphs = story.paragraphs && story.paragraphs.length > 0;

                  return (
                    <button
                      key={storyId}
                      onClick={() => hasParagraphs && openSlideshow(story)}
                      disabled={!hasParagraphs}
                      className={`risalko-card-interactive text-left ${!hasParagraphs ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-neutral-800">
                          {story.story?.title || 'Unknown Story'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${hasParagraphs ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                          {hasParagraphs ? 'Complete' : 'Empty'}
                        </span>
                      </div>
                      <p className="text-neutral-600 text-sm line-clamp-3 mb-4">
                        {story.story?.short_description || "No description"}
                      </p>
                      {story.story?.author && (
                        <p className="text-xs text-neutral-500 font-medium">
                          Author: {story.story.author}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-100">
                        📚 {story.paragraphs?.length || 0} paragraphs
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Slideshow Modal */}
      {slideshowStory && slideshowStory.paragraphs.length > 0 && (
        <div className="fixed inset-0 bg-neutral-900/95 z-50 flex items-center justify-center">
          <button
            onClick={closeSlideshow}
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors z-10"
          >
            <X size={24} />
          </button>

          <button
            onClick={handlePrevImage}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 transition-colors shadow-lg"
            aria-label="Previous paragraph"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="w-full max-w-4xl mx-auto px-4 py-8 overflow-y-auto max-h-screen">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {slideshowStory.story?.title}
              </h1>
              <p className="text-neutral-400 text-lg">
                Paragraph {currentImageIndex + 1} of {slideshowStory.paragraphs.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              <div className="mb-6 bg-indigo-50 p-6 rounded-xl border-l-4 border-indigo-500">
                <p className="text-neutral-800 text-lg leading-relaxed">
                  "{slideshowStory.paragraphs[currentImageIndex].content}"
                </p>
              </div>

              {slideshowStory.paragraphs[currentImageIndex].drawing && (
                <div className="flex flex-col items-center">
                  <p className="text-neutral-600 text-sm font-medium mb-4">
                    🎨 Illustration
                  </p>
                  <img
                    src={slideshowStory.paragraphs[currentImageIndex].drawing}
                    alt={`Illustration paragraph ${currentImageIndex + 1}`}
                    className="w-full max-h-[500px] object-contain rounded-xl border border-neutral-200"
                  />
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="w-48 h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{
                    width: `${((currentImageIndex + 1) / slideshowStory.paragraphs.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-neutral-400 font-medium">
                {currentImageIndex + 1}/{slideshowStory.paragraphs.length}
              </span>
            </div>
          </div>

          <button
            onClick={handleNextImage}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 transition-colors shadow-lg"
            aria-label="Next paragraph"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassPage;