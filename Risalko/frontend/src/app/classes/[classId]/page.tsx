"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const ClassPage = () => {
  type Story = {
    _id: string | { $oid: string };
    title: string;
    short_description: string;
    author?: string;
    is_finished?: boolean;
  };

  type FinalizedStory = {
    story_id: string | { $oid: string };
    paragraphs: Array<{
      paragraph_id: string | { $oid: string };
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
  const [userId, setUserId] = useState<string | null>(null);
  const [className, setClassName] = useState('');
  const [userParagraphs, setUserParagraphs] = useState<string[]>([]);
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
        setUserId(user._id?.$oid || user._id || user.id);
        const paragraphIds = (user.paragraphs || []).map((p: any) =>
          typeof p === 'string' ? p : p.$oid
        );
        setUserParagraphs(paragraphIds);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/classes/${classId}?populate=true`, {
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
              title: 'Neznana zgodba',
              short_description: '',
              author: ''
            }
          }));
          setFinalizedStories(finalized);
        }
      } catch (error) {
        console.error("Napaka pri pridobivanju podatkov razreda:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  if (loading) {
    return (
      <div className="background">
        <p className="text-text text-center pt-8">Nalaganje razreda...</p>
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
    <div className="background">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-8 bg-gray-700/90 p-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/classes')}
                className="text-gray-300 hover:text-gray-100 transition-colors text-lg font-semibold"
              >
                ←
              </button>
              <h1 className="text-3xl font-bold text-gray-200">{className || 'Razred'}</h1>
            </div>
            <p className="text-gray-300 font-semibold text-lg">
              {isStudent ? 'Moje naloge' : 'Zgodbe in učenci'}
            </p>
          </div>

          {isTeacher && (
            <Link
              href={`/classes/${classId}/addStory`}
              className="btn bg-yellow-100 text-text"
            >
              + Dodaj zgodbo
            </Link>
          )}
        </div>

        <div className="p-8">
          {isTeacher && (
            <div className="mb-6 flex flex-wrap gap-4">
              <Link
                href={`/classes/${classId}/addStudents`}
                className="btn inline-block bg-sky-400 text-text"
              >
                + Dodaj učenca
              </Link>

              <Link
                href={`/classes/${classId}/viewStudents`}
                className="btn inline-block bg-purple-400 text-text"
              >
                👥 Ogled učencev
              </Link>
            </div>
          )}
          {/* Tabs */}
          <div className="border-b border-gray-300 mb-6 flex gap-6">
            <button
              onClick={() => setActiveTab("workshop")}
              className={`cursor-pointer pb-2 font-semibold text-lg ${activeTab === "workshop"
                  ? "text-sky-500 border-b-4 border-sky-500"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Delavnica
            </button>

            <button
              onClick={() => setActiveTab("finished")}
              className={`cursor-pointer pb-2 font-semibold text-lg ${activeTab === "finished"
                  ? "text-sky-500 border-b-4 border-sky-500"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Dokončane
            </button>
          </div>

          {activeTab === "workshop" && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {isStudent ? 'Moje naloge' : 'Aktivne zgodbe'}
              </h2>

              {stories.length === 0 ? (
                <p className="text-text-muted text-center py-8">
                  {isStudent ? 'Nimate dodeljenih nalogic.' : 'Ni aktivnih zgodb. Ustvarite novo!'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.filter(s => !s.is_finished).map((story) => (
                    <Link
                      key={typeof story._id === "string" ? story._id : story._id.$oid}
                      href={`/classes/${classId}/${typeof story._id === "string" ? story._id : story._id.$oid
                        }`}
                      className="card bg-sky-400 cursor-pointer max-w-lg"
                    >
                      <h3 className="text-lg font-semibold text-text mb-2">
                        {story.title}
                      </h3>
                      <p className="text-text-muted line-clamp-3">
                        {story.short_description || "Brez opisa"}
                      </p>
                      {story.author && (
                        <p className="text-sm text-text-muted mt-3 font-medium">
                          Avtor: {story.author}
                        </p>
                      )}
                      {isStudent && (
                        <p className="text-xs text-text-muted mt-3 pt-3 border-t border-text-muted/30">
                          📝 Tvoja naloga
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
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Dokončane slikanice
              </h2>

              {finalizedStories.length === 0 ? (
                <p className="text-text-muted text-center py-8">Ni dokončanih slikanica.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finalizedStories.map((story, idx) => {
                    const storyId = story.story_id
                      ? (typeof story.story_id === "string" ? story.story_id : story.story_id.$oid)
                      : `story-${idx}`;
                    const hasParagraphs = story.paragraphs && story.paragraphs.length > 0;

                    return (
                      <button
                        key={storyId}
                        onClick={() => hasParagraphs && openSlideshow(story)}
                        disabled={!hasParagraphs}
                        className={`card cursor-pointer max-w-lg text-left ${hasParagraphs
                            ? 'bg-green-400'
                            : 'bg-gray-400 opacity-60 cursor-not-allowed'
                          }`}
                      >
                        <h3 className="text-lg font-semibold text-text mb-2">
                          {story.story?.title || 'Neznana zgodba'}
                        </h3>
                        <p className="text-text-muted line-clamp-3">
                          {story.story?.short_description || "Brez opisa"}
                        </p>
                        {story.story?.author && (
                          <p className="text-sm text-text-muted mt-3 font-medium">
                            Avtor: {story.story.author}
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-3 pt-3 border-t border-text-muted/30">
                          📚 {story.paragraphs?.length || 0} odlomkov
                        </p>
                        {!hasParagraphs && (
                          <p className="text-xs text-red-600 font-semibold mt-2">
                            Ni odlomkov za prikaz
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {slideshowStory && slideshowStory.paragraphs.length > 0 && (
        <div className="fixed inset-0 bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200 z-50 flex items-center justify-between px-2 sm:px-4">
          <button
            onClick={closeSlideshow}
            className="absolute top-4 right-4 bg-yellow-100 hover:bg-yellow-200 text-text rounded-full p-3 transition-colors z-10 shadow-lg border-2 border-gray-400"
          >
            <X size={28} />
          </button>

          <button
            onClick={handlePrevImage}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white rounded-full p-4 sm:p-5 transition-colors shadow-lg border-3 border-white"
            aria-label="Prejšnji odlomek"
          >
            <ChevronLeft size={48} />
          </button>

          <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto pt-20 pb-20">
            <div className="w-full max-w-5xl lg:max-w-4xl xl:max-w-4xl 2xl:max-w-5xl mx-auto px-4 py-8">
              <div className="text-center mb-8 lg:mb-12">
                <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-5xl font-black text-gray-900 mb-3 drop-shadow-lg">
                  {slideshowStory.story?.title}
                </h1>
                <p className="text-gray-800 text-lg sm:text-xl lg:text-xl font-semibold">
                  Odlomek {currentImageIndex + 1} od {slideshowStory.paragraphs.length}
                </p>
              </div>

              {/* Paragraph Content and Image */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl lg:rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 border-4 border-gray-200">
                <div className="mb-8 lg:mb-10 bg-sky-50 p-6 sm:p-8 lg:p-8 rounded-xl border-l-8 border-sky-500">
                  <p className="text-gray-800 text-lg sm:text-xl lg:text-2xl leading-relaxed font-semibold">
                    "{slideshowStory.paragraphs[currentImageIndex].content}"
                  </p>
                </div>

                {slideshowStory.paragraphs[currentImageIndex].drawing && (
                  <div className="flex flex-col items-center">
                    <p className="text-gray-700 text-base sm:text-lg lg:text-lg font-semibold mb-6">
                      🎨 Ilustracija:
                    </p>
                    <img
                      src={slideshowStory.paragraphs[currentImageIndex].drawing}
                      alt={`Ilustracija odlomka ${currentImageIndex + 1}`}
                      className="w-full max-h-80 sm:max-h-96 lg:max-h-[500px] xl:max-h-[550px] object-contain rounded-xl border-4 border-gray-300 shadow-lg"
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 lg:mt-10 flex items-center justify-center gap-4 sm:gap-6">
                <div className="w-48 sm:w-56 lg:w-64 h-4 bg-gray-300 rounded-full overflow-hidden border-2 border-gray-400">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all"
                    style={{
                      width: `${((currentImageIndex + 1) / slideshowStory.paragraphs.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-gray-800 font-bold text-lg sm:text-xl">
                  {currentImageIndex + 1}/{slideshowStory.paragraphs.length}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNextImage}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white rounded-full p-4 sm:p-5 transition-colors shadow-lg border-3 border-white"
            aria-label="Naslednji odlomek"
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassPage;