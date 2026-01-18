'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, LogOut } from 'lucide-react';

type ClassType = {
  id?: number;
  class_name?: string;
  students?: any[];
  color: string;
};

const Classes = () => {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const userStored = localStorage.getItem('user');
    
    console.log('=== USER AUTH CHECK ===');
    console.log('Raw localStorage user:', userStored);
    
    if (!userStored) {
      console.log('No user in localStorage, redirecting to login');
      router.push('/');
      return;
    }

    try {
      const user = JSON.parse(userStored);
      console.log('Parsed user object:', user);
      
      const uid = user.id;
      
      if (!uid) {
        console.error('User object has no id field:', user);
        alert('Napaka pri prijavi. Prosimo, prijavite se ponovno.');
        router.push('/');
        return;
      }
      
      setUserId(uid);
      setUserName(`${user.name || ''} ${user.surname || ''}`);
      setUserType(user.type || null);
      
      console.log('User authenticated:', { uid, type: user.type });
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!userId) {
      console.log('Waiting for userId...');
      return;
    }

    const fetchClasses = async () => {
      console.log('=== FETCHING CLASSES ===');
      console.log('User ID:', userId);
      console.log('User Type:', userType);
      
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/classes?populate=true`
        );
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

        const result = await res.json();
        console.log('Raw API response:', result);
        console.log('All classes:', result.data);

        if (userType === "student") {
          const studentClasses = (result.data || []).filter((cls: any) => {
            const studentIds = cls.students?.map((s: any) => s.id) || [];
            const isInClass = studentIds.includes(userId);
            console.log(`Class ${cls.id} (${cls.class_name}): student IDs:`, studentIds, 'contains userId?', isInClass);
            return isInClass;
          });

          console.log('Filtered student classes:', studentClasses);
          setClasses(studentClasses);
        } else {
          console.log('=== TEACHER CLASS FILTERING ===');
          const teacherClasses = (result.data || []).filter((cls: any) => {
            console.log(`Checking class ${cls.id} (${cls.class_name}):`);
            console.log('  - Full class object:', cls);
            console.log('  - cls.teacher:', cls.teacher);
            console.log('  - cls.teacher_id:', cls.teacher_id);
            
            // Try multiple possible teacher ID locations
            const clsTeacherId = cls.teacher?.id || cls.teacher_id || cls.teacher;
            console.log('  - Extracted teacher ID:', clsTeacherId);
            console.log('  - Current user ID:', userId);
            
            const isTeacherClass = clsTeacherId === userId;
            console.log('  - Match?', isTeacherClass);
            
            return isTeacherClass;
          });

          console.log('Filtered teacher classes:', teacherClasses);
          setClasses(teacherClasses);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        alert('Napaka pri nalaganju razredov.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [userId, userType]);

  const handleEdit = (id: number) => {
    router.push(`/classes/${id}/editClass`);
  };

  const handleDelete = async (id: number) => { 
    if (!confirm('Ste prepričani, da želite izbrisati ta razred?')) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/classes/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        throw new Error('Failed to delete class');
      }

      console.log(`Class ${id} deleted`);
      setClasses(prev => prev.filter(cls => cls.id !== id));
      alert('Razred uspešno izbrisan!');
    } catch (err) {
      console.error('Error deleting class:', err);
      alert('Napaka pri brisanju razreda.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Redirect to AppLauncher login
    window.location.href = 'http://localhost:3002/login';
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
                key={cls.id || index}
                className="card relative group max-w-md cursor-pointer"
                style={{ backgroundColor: cls.color || '#60A5FA' }}
                onClick={() => router.push(`/classes/${cls.id}`)}
              >
                {isTeacher && (
                  <div
                    className="absolute bottom-2 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleEdit(cls.id as number)}
                      className="p-2 rounded-md hover:bg-gray-200 transition text-black"
                      title="Edit Class"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id as number)}
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