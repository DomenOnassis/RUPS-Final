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

      const res = await fetch('http://127.0.0.1:5000/api/classes', {
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
    <div className="background min-h-screen flex items-center justify-center p-4">
      <div className="section-dark max-w-md w-full">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-yellow-100 hover:text-yellow-200 transition-colors font-medium text-2xl"
          >
            ←
          </button>
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 gradient-text">
          Ustvari nov razred
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Ime razreda
            </label>
            <input
              type="text"
              name="className"
              placeholder="Ime razreda"
              value={classData.className}
              onChange={handleChange}
              required
              className="input-text"
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Barva razreda
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={classData.color}
                onChange={handleChange}
                className="w-12 h-12 cursor-pointer rounded-md border border-gray-300"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn bg-yellow-100 text-text w-full"
          >
            Ustvari razred
          </button>
        </form>
      </div>
    </div>
  );
};

export default Classes;
