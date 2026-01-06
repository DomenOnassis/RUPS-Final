"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DrawingCanvas from "../../../../../components/DrawingCanvas";
import { Save, ArrowLeft } from "lucide-react";

interface Paragraph {
  _id: string | { $oid: string };
  story_id: string | { $oid: string };
  content: string;
  drawing: string | null;
  order: number;
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

  useEffect(() => {
    const fetchParagraph = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/api/paragraphs/${paragraphId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await res.json();

        if (data.data) {
          setParagraph(data.data);
        } else {
          setError("Odlomek ni najden");
        }
      } catch (err) {
        console.error("Napaka pri nalaganju odlomka:", err);
        setError("Napaka pri nalaganju odlomka");
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
      alert("Platno ni dostopno");
      return;
    }

    setSaving(true);
    try {
      // Get canvas as image data
      const imageData = canvasRef.toDataURL("image/png");

      // Save to backend
      const res = await fetch(
        `http://127.0.0.1:5000/api/paragraphs/${paragraphId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drawing: imageData }),
        }
      );

      if (!res.ok) {
        throw new Error("Napaka pri shranjevanju slike");
      }

      // Update local state
      setParagraph((prev) => {
        if (prev) {
          return { ...prev, drawing: imageData };
        }
        return prev;
      });

      alert("Slika uspešno shranjena!");
      // Redirect back to story
      router.push(`/classes/${classId}/${storyId}`);
    } catch (err) {
      console.error("Napaka pri shranjevanju:", err);
      alert("Napaka pri shranjevanju slike");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="background min-h-screen">
        <p className="text-text text-center pt-8">Nalaganje odlomka...</p>
      </div>
    );
  }

  if (error || !paragraph) {
    return (
      <div className="background min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-300 mb-4">
              {error || "Odlomek ni najden"}
            </p>
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

  return (
    <div className="background min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0 bg-gray-700/90 border-b-4 border-dashed border-yellow-400 shadow-md">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-yellow-100 hover:text-yellow-200 transition-colors font-bold text-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-gray-100">Ilustriraj odlomek #{paragraph.order}</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn bg-yellow-100 text-text disabled:bg-gray-500 disabled:text-gray-700 flex items-center gap-2"
          >
            <Save size={20} />
            {saving ? "Shranjevanje..." : "Shrani"}
          </button>
        </div>
      </div>

      {/* Paragraph Text */}
      <div className="px-4 py-3">
        <p className="text-text font-semibold text-center leading-relaxed">
          "{paragraph.content}"
        </p>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 px-4 pb-4 min-h-0 flex flex-col">
        <DrawingCanvas onCanvasMount={setCanvasRef} initialImage={paragraph.drawing} />
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 flex-shrink-0 bg-gray-700/60 text-center text-sm text-gray-200 border-t border-gray-400/30">
        💡 Risaj svoj odlomek! Slika bo avtomatsko shranjena v bazo podatkov.
      </div>
    </div>
  );
}
