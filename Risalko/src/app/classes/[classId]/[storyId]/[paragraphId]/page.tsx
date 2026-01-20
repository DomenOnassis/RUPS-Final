"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DrawingCanvas from "../../../../../components/DrawingCanvas";
import { Save, ArrowLeft, Zap } from "lucide-react";

interface Paragraph {
  _id: string | { $oid: string };
  story_id: string | { $oid: string };
  content: string;
  drawing: string | null;
  order: number;
  paragraph_type?: string;
  circuit_instruction?: string;
}

export default function ParagraphDrawPage() {
  const params = useParams();
  const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId;
  const storyId = Array.isArray(params.storyId) ? params.storyId[0] : params.storyId;
  const paragraphId = Array.isArray(params.paragraphId) ? params.paragraphId[0] : params.paragraphId;
  const router = useRouter();
  const [paragraph, setParagraph] = useState<Paragraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [showVezalkoButton, setShowVezalkoButton] = useState(false);

  // Check if the paragraph content mentions circuits/electric
  const isCircuitRelated = (content: string) => {
    const circuitKeywords = [
      'circuit', 'vezje', 'electric', 'elektrik', 'battery', 'baterij',
      'bulb', 'žarnic', 'switch', 'stikalo', 'wire', 'žic', 'resistor',
      'upor', 'LED', 'lamp', 'current', 'tok', 'voltage', 'napetost'
    ];
    const lowerContent = content.toLowerCase();
    return circuitKeywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  };

  useEffect(() => {
    const fetchParagraph = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/paragraphs/${paragraphId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await res.json();

        if (data.data) {
          setParagraph(data.data);
          // Show Vezalko button if paragraph is circuit-type or content mentions circuits
          if (data.data.paragraph_type === 'circuit' || isCircuitRelated(data.data.content)) {
            setShowVezalkoButton(true);
          }
        } else {
          setError("Paragraph not found");
        }
      } catch (err) {
        console.error("Error loading paragraph:", err);
        setError("Error loading paragraph");
      } finally {
        setLoading(false);
      }
    };

    if (paragraphId) {
      fetchParagraph();
    }
  }, [paragraphId]);

  const handleSave = async () => {
    if (!canvasRef) {
      alert("Canvas not available");
      return;
    }

    setSaving(true);
    try {
      // Get canvas as image data
      const imageData = canvasRef.toDataURL("image/png");

      // Save to backend
      const res = await fetch(
        `http://127.0.0.1:8000/api/paragraphs/${paragraphId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drawing: imageData }),
        }
      );

      if (!res.ok) {
        throw new Error("Error saving image");
      }

      // Update local state
      setParagraph((prev) => {
        if (prev) {
          return { ...prev, drawing: imageData };
        }
        return prev;
      });

      alert("Image saved successfully!");
      // Don't redirect - stay on page so user can try in Vezalko if applicable
    } catch (err) {
      console.error("Error saving:", err);
      alert("Error saving image");
    } finally {
      setSaving(false);
    }
  };

  const handleTryInVezalko = () => {
    // Navigate to the split-screen Vezalko workspace page
    router.push(`/classes/${classId}/${storyId}/${paragraphId}/vezalko`);
  };

  if (loading) {
    return (
      <div className="risalko-app">
        <div className="risalko-loading">
          <div className="risalko-spinner"></div>
          <p>Loading paragraph...</p>
        </div>
      </div>
    );
  }

  if (error || !paragraph) {
    return (
      <div className="risalko-app">
        <div className="flex items-center justify-center min-h-screen">
          <div className="risalko-card text-center">
            <p className="text-lg font-semibold text-red-600 mb-4">
              {error || "Paragraph not found"}
            </p>
            <button onClick={() => router.back()} className="risalko-btn risalko-btn-secondary">
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 flex-shrink-0 bg-white border-b border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/classes/${classId}/${storyId}`)}
            className="risalko-back-btn"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold text-neutral-800">Illustrate Paragraph #{paragraph.order}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="risalko-btn risalko-btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </header>

      {/* Paragraph Text */}
      <div className="px-4 py-4 bg-indigo-50 border-b border-indigo-100">
        <p className="text-neutral-700 font-medium text-center leading-relaxed max-w-3xl mx-auto">
          "{paragraph.content}"
        </p>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 px-4 pb-4 min-h-0 flex flex-col">
        <DrawingCanvas onCanvasMount={setCanvasRef} initialImage={paragraph.drawing} />
      </div>

      {/* Footer with Vezalko integration */}
      <footer className="px-4 py-3 flex-shrink-0 bg-white border-t border-neutral-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Draw your illustration! Click Save when you're done.
          </p>
          
          {showVezalkoButton && paragraph.drawing && (
            <button
              onClick={handleTryInVezalko}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
            >
              <Zap size={18} />
              Try it in Vezalko
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
