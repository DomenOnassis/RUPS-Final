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
        alert('Login error. Please try again.');
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
        alert('Error loading classes.');
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
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/classes/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        throw new Error('Failed to delete class');
      }

      console.log(`Class ${id} deleted`);
      setClasses(prev => prev.filter(cls => cls.id !== id));
      alert('Class deleted successfully!');
    } catch (err) {
      console.error('Error deleting class:', err);
      alert('Error deleting class.');
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
    <div className="risalko-app">
      {/* Header */}
      <header className="risalko-header">
        <div className="risalko-header-content">
          <div>
            <h1 className="risalko-header-title">
              {isTeacher ? 'Your Classes' : 'My Classes'}
            </h1>
            <p className="risalko-header-subtitle">
              Welcome back, <span className="text-indigo-600 font-medium">{userName}</span>
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {isTeacher && (
              <Link
                href="/classes/createClass"
                className="risalko-btn-primary"
              >
                + New Class
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="risalko-btn-ghost flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="risalko-content">
        {loading ? (
          <div className="risalko-loading">
            <div className="risalko-spinner"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="risalko-empty">
            <div className="risalko-empty-icon">📚</div>
            <p className="risalko-empty-title">
              {isTeacher ? 'No classes yet' : 'No classes found'}
            </p>
            <p className="risalko-empty-text">
              {isTeacher ? 'Create your first class to get started' : 'You haven\'t been added to any classes yet'}
            </p>
          </div>
        ) : (
          <div className="risalko-grid">
            {classes.map((cls, index) => (
              <div
                key={cls.id || index}
                className="risalko-card-interactive relative group"
                style={{ borderLeft: `3px solid ${cls.color || '#6366F1'}` }}
                onClick={() => router.push(`/classes/${cls.id}`)}
              >
                {isTeacher && (
                  <div
                    className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleEdit(cls.id as number)}
                      className="risalko-icon-btn"
                      title="Edit Class"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id as number)}
                      className="risalko-icon-btn-danger"
                      title="Delete Class"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <h2 className="text-base font-semibold text-neutral-900 mb-1">
                  {cls.class_name || 'Untitled Class'}
                </h2>
                <p className="text-neutral-500 text-sm">
                  {cls.students?.length || 0} {cls.students?.length === 1 ? 'student' : 'students'}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Classes;