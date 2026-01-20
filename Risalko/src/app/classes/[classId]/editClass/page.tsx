'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const EditClass = () => {
  const router = useRouter();
  const params = useParams();
  const classId = params?.classId as string;

  const [classData, setClassData] = useState({
    class_name: '',
    color: '#4F46E5',
  });

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    
    if (!classId) return;

    const fetchClass = async () => {
      try {

        const res = await fetch(`http://127.0.0.1:8000/api/classes/${classId}`);
        if (!res.ok) throw new Error('Failed to fetch class data');

        const result = await res.json();
        const cls = result.data;

        setClassData({
          class_name: cls.class_name || '',
          color: cls.color || '#4F46E5',
        });
      } catch (error) {
        console.error('Error fetching class:', error);
        alert('Could not load class data');
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [classId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClassData({
      ...classData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update class');

      console.log('Class updated:', result);
      router.back();
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Failed to update class');
    }
  };

  if (loading) {
    return (
      <div className="background min-h-screen flex items-center justify-center">
        <p className="text-slate-900 font-medium">Loading class data...</p>
      </div>
    );
  }

  return (
    <div className="risalko-app">
      <header className="risalko-header">
        <div className="risalko-header-content">
          <button onClick={() => router.back()} className="risalko-back-btn">
            ← Back
          </button>
          <h1 className="risalko-header-title">Edit Class</h1>
        </div>
      </header>

      <main className="risalko-content-narrow">
        <div className="risalko-card">
          <form onSubmit={handleSubmit} className="risalko-form-section">
            <div>
              <label className="risalko-label">Class Name</label>
              <input
                type="text"
                name="class_name"
                placeholder="Enter class name"
                value={classData.class_name}
                onChange={handleChange}
                required
                className="risalko-input"
              />
            </div>

            <div>
              <label className="risalko-label">Class Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  name="color"
                  value={classData.color}
                  onChange={handleChange}
                  className="w-14 h-14 cursor-pointer rounded-lg border-2 border-neutral-200 shadow-sm"
                />
                <span className="text-sm text-neutral-500">Choose a color to identify this class</span>
              </div>
            </div>

            <button type="submit" className="risalko-btn risalko-btn-primary w-full">
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditClass;
