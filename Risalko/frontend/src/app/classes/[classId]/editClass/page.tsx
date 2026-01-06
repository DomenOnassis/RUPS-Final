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

        const res = await fetch(`http://127.0.0.1:5000/api/classes/${classId}`);
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
      const res = await fetch(`http://127.0.0.1:5000/api/classes/${classId}`, {
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
        <p className="text-text">Nalagam podatke o razredu...</p>
      </div>
    );
  }

  return (
    <div className="background min-h-screen flex items-center justify-center p-4">
      <div className="section-dark max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 gradient-text">
          Uredi razred
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Ime razreda
            </label>
            <input
              type="text"
              name="class_name"
              placeholder="Ime razreda"
              value={classData.class_name}
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
            Shrani spremembe
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditClass;
