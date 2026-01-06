'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, LogOut } from 'lucide-react';

type ClassType = {
  _id?: { $oid?: string } | string;
  class_name?: string;
  students?: any[];
  color: string;
};

const Classes = () => {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const userStored = localStorage.getItem('user');
    if (!userStored) {
      router.push('/');
      return;
    }

    try {
      const user = JSON.parse(userStored);
      const uid = user._id?.$oid || user._id || user.id;
      setUserId(uid);
      setUserName(`${user.name || ''} ${user.surname || ''}`);
      setUserType(user.type || null);
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const fetchClasses = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/api/classes?populate=true`
        );
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

        const result = await res.json();

        if (userType === "student") {
          const studentClasses = (result.data || []).filter((cls: any) => {
            const studentIds = cls.students?.map((s: any) =>
              typeof s._id === 'string' ? s._id : s._id?.$oid
            ) || [];
            return studentIds.includes(userId);
          });

          const normalized = studentClasses.map((cls: any) => ({
            ...cls,
            _id: cls._id?.$oid || cls._id,
          }));

          setClasses(normalized);
        } else {
          const teacherClasses = (result.data || []).filter((cls: any) => {
            const clsTeacherId = cls.teacher?.[0]?._id?.$oid || cls.teacher?.[0]?._id || cls.teacher?.$oid || cls.teacher;
            return clsTeacherId === userId;
          });

          const normalized = teacherClasses.map((cls: any) => ({
            ...cls,
            _id: cls._id?.$oid || cls._id,
          }));

          setClasses(normalized);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [userId, userType]);

  const handleEdit = (id: string) => {
    router.push(`/classes/${id}/editClass`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ste prepričani, da želite izbrisati ta razred?')) return;

    try {
      await fetch(`http://127.0.0.1:5000/api/classes/${id}`, { method: 'DELETE' });

      console.log(`Class ${id} deleted`);
      setClasses(prev => prev.filter(cls => cls._id !== id));
    } catch (err) {
      console.error('Error deleting class:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const isTeacher = userType === "teacher";

  return (
    <div className="background">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-gray-700/90 p-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-200">
              {isTeacher ? 'Vaše učilnice' : 'Moje učilnice'}
            </h1>
            <p className="text-gray-200 font-semibold text-lg">
              Dobrodošli nazaj, <span className="text-yellow-100">{userName}</span> 👋
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {isTeacher && (
              <Link
                href="/classes/createClass"
                className="btn bg-yellow-100 text-text"
              >
                + Ustvari nov razred
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 btn bg-red-500 hover:bg-red-600 text-white"
            >
              <LogOut size={20} />
              Odjava
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-text text-center">Nalaganje vaših učilnic...</p>
        ) : classes.length === 0 ? (
          <p className="text-text text-center">
            {isTeacher ? 'Ni najdenih učilnic. Ustvarite jo!' : 'Ni najdenih učilnic.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-8 flex justify-between items-center">
            {classes.map((cls, index) => (
              <div
                key={typeof cls._id === 'string' ? cls._id : cls._id?.$oid || index}
                className="card relative group max-w-md"
                style={{ backgroundColor: cls.color || '#60A5FA' }}
                onClick={() => router.push(`/classes/${cls._id}`)}
              >
                {isTeacher && (
                  <div
                    className="absolute bottom-2 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleEdit(cls._id as string)}
                      className="p-2 rounded-md hover:bg-gray-200 transition text-black"
                      title="Edit Class"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(cls._id as string)}
                      className="p-2 rounded-md hover:bg-red-400 text-black transition"
                      title="Delete Class"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}

                <h2 className="text-xl font-semibold text-text mb-2">
                  {cls.class_name || 'Neimenovana učilnica'}
                </h2>
                <p className="text-text-muted mt-3 font-medium">
                  👥 {cls.students?.length || 0}{' '}
                  {cls.students?.length === 1 ? 'Učenec' : 'Učenci'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;