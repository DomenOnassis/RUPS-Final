'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const Classes = () => {
  const router = useRouter();

  const [classData, setClassData] = useState({
    className: '',
    color: '#4F46E5',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setClassData({
      ...classData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let teacherId = '68f2abbbf05e7dde3d965491';
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          const raw = u._id || u.id || teacherId;
          if (raw && typeof raw === 'object') {
            teacherId = raw.$oid || raw.toString() || teacherId;
          } else {
            teacherId = String(raw);
          }
        }
      } catch (e) {
        // ignore and use placeholder
      }

      const payload = {
        class_name: classData.className,
        color: classData.color,
        teacher: teacherId,
        students: [],
        stories: [],
      };

      const res = await fetch('http://127.0.0.1:8000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Something went wrong');

      console.log('Class created:', result);
      router.back();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class');
    }
  };

  return (
    <div className="risalko-app">
      <header className="risalko-header">
        <div className="risalko-header-content">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="risalko-back-btn">
              ←
            </button>
            <h1 className="risalko-header-title">New Class</h1>
          </div>
        </div>
      </header>

      <main className="risalko-content-narrow">
        <div className="risalko-card">
          <form onSubmit={handleSubmit} className="risalko-form-section">
            <div className="risalko-form-group">
              <label className="risalko-label">Class Name</label>
              <input
                type="text"
                name="className"
                placeholder="Enter class name"
                value={classData.className}
                onChange={handleChange}
                required
                className="risalko-input"
              />
            </div>

            <div className="risalko-form-group">
              <label className="risalko-label">Class Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="color"
                  value={classData.color}
                  onChange={handleChange}
                  className="w-12 h-12 cursor-pointer rounded-lg border border-neutral-300 bg-white"
                />
                <span className="text-sm text-neutral-500">Choose a color to identify this class</span>
              </div>
            </div>

            <button type="submit" className="risalko-btn-primary w-full">
              Create Class
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Classes;
