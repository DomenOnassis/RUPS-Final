"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

interface Paragraph {
  _id: string | { $oid: string };
  story_id: string | { $oid: string };
  content: string;
  drawing: string | null;
  order: number;
}

export default function VezalkoWorkspacePage() {
  const params = useParams();
  const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId;
  const storyId = Array.isArray(params.storyId) ? params.storyId[0] : params.storyId;
  const paragraphId = Array.isArray(params.paragraphId) ? params.paragraphId[0] : params.paragraphId;
  const router = useRouter();
  
  const [paragraph, setParagraph] = useState<Paragraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(35); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);

  // Build Vezalko URL with auth
  const getVezalkoUrl = () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      const authData = encodeURIComponent(JSON.stringify({ user, token }));
      return `http://localhost:3001/workspace/electric?auth=${authData}&embedded=true`;
    }
    return 'http://localhost:3001/workspace/electric?embedded=true';
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

  // Handle mouse drag for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      // Clamp between 20% and 60%
      setLeftPanelWidth(Math.min(60, Math.max(20, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (loading) {
    return (
      <div className="risalko-app">
        <div className="risalko-loading">
          <div className="risalko-spinner"></div>
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !paragraph) {
    return (
      <div className="risalko-app">
        <div className="risalko-centered">
          <div className="risalko-card">
            <p className="text-red-600 mb-4">{error || "Paragraph not found"}</p>
            <button
              onClick={() => router.back()}
              className="risalko-btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Left Panel - Reference Drawing */}
      <div style={{ 
        width: isLeftCollapsed ? '48px' : `${leftPanelWidth}%`,
        minWidth: isLeftCollapsed ? '48px' : '250px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRight: '2px solid #e5e7eb',
        transition: isResizing ? 'none' : 'width 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: isLeftCollapsed ? '12px 8px' : '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#6366F1',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: '60px'
        }}>
          {!isLeftCollapsed && (
            <>
              <button
                onClick={() => router.push(`/classes/${classId}/${storyId}/${paragraphId}`)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white'
                }}
                title="Back to Drawing"
              >
                <ArrowLeft size={20} />
              </button>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  Your Drawing
                </h2>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                  Reference for building
                </p>
              </div>
            </>
          )}
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'white'
            }}
            title={isLeftCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isLeftCollapsed ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
        </div>

        {/* Content */}
        {!isLeftCollapsed && (
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {/* Task description */}
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '14px', 
                fontWeight: 600,
                color: '#92400E'
              }}>
                📝 Task
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '14px',
                color: '#78350F',
                lineHeight: 1.5
              }}>
                {paragraph.content}
              </p>
            </div>

            {/* Drawing */}
            {paragraph.drawing ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                    🎨 Your Circuit Drawing
                  </h3>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setImageZoom(z => Math.max(50, z - 25))}
                      style={{
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex'
                      }}
                      title="Zoom out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      minWidth: '50px',
                      textAlign: 'center'
                    }}>
                      {imageZoom}%
                    </span>
                    <button
                      onClick={() => setImageZoom(z => Math.min(200, z + 25))}
                      style={{
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex'
                      }}
                      title="Zoom in"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                </div>
                <div style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'auto',
                  backgroundColor: '#fafafa',
                  maxHeight: 'calc(100vh - 280px)'
                }}>
                  <img
                    src={paragraph.drawing}
                    alt="Your circuit drawing"
                    style={{
                      width: `${imageZoom}%`,
                      height: 'auto',
                      display: 'block',
                      margin: imageZoom <= 100 ? '0 auto' : '0'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280'
              }}>
                <p>No drawing saved yet.</p>
                <button
                  onClick={() => router.push(`/classes/${classId}/${storyId}/${paragraphId}`)}
                  className="risalko-btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  Go Back to Draw
                </button>
              </div>
            )}

            {/* Instructions */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#EEF2FF',
              borderRadius: '8px',
              border: '1px solid #C7D2FE'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#4338CA' }}>
                💡 How to use
              </h4>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                fontSize: '12px', 
                color: '#4F46E5',
                lineHeight: 1.6
              }}>
                <li>Look at your drawing on the left</li>
                <li>Build the circuit in Vezalko on the right</li>
                <li>Drag components from the toolbar</li>
                <li>Connect them with wires</li>
                <li>Test if your circuit works!</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {!isLeftCollapsed && (
        <div
          onMouseDown={() => setIsResizing(true)}
          style={{
            width: '6px',
            cursor: 'col-resize',
            backgroundColor: isResizing ? '#6366F1' : '#e5e7eb',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c7d2fe'}
          onMouseLeave={(e) => {
            if (!isResizing) e.currentTarget.style.backgroundColor = '#e5e7eb';
          }}
        >
          <div style={{
            width: '2px',
            height: '40px',
            backgroundColor: '#9ca3af',
            borderRadius: '2px'
          }} />
        </div>
      )}

      {/* Right Panel - Vezalko Workspace */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a2e',
        minWidth: '400px'
      }}>
        {/* Vezalko Header */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#F59E0B',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              Vezalko - Electric Circuit Workspace
            </h2>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
              Build your circuit here
            </p>
          </div>
        </div>

        {/* Vezalko iframe */}
        <iframe
          src={getVezalkoUrl()}
          style={{
            flex: 1,
            width: '100%',
            border: 'none',
            backgroundColor: '#1a1a2e'
          }}
          title="Vezalko Electric Circuit Workspace"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
