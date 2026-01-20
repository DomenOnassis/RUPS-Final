"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from 'lucide-react';
const ViewStudents = () => {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    const [students, setStudents] = useState<any[]>([]);
    const [className, setClassName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        const fetchStudents = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/classes/${classId}?populate=true`);
                const data = await res.json();

                if (res.ok && data.data) {
                    setClassName(data.data.class_name || "Class");
                    setStudents(data.data.students || []);
                } else {
                    setError("Error loading students.");
                }
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("Connection error.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [classId]);

    const handleDelete = async (studentId: string) => {
        if (!confirm("Are you sure you want to remove this student from the class?")) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/classes/${classId}/students/${studentId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

            setStudents(prev => prev.filter(s => s._id?.$oid !== studentId && s._id !== studentId));
            alert("Student removed from class.");
        } catch (err) {
            console.error("Error removing student:", err);
            alert("Error removing student.");
        }
    };


    if (loading) {
        return (
            <div className="risalko-app">
                <div className="risalko-loading">
                    <div className="risalko-spinner"></div>
                    <p>Loading students...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="risalko-app">
                <div className="risalko-content-narrow">
                    <div className="risalko-alert-error">{error}</div>
                </div>
            </div>
        );
    }
    
    const isTeacher = userType === "teacher";
    
    return (
        <div className="risalko-app">
            <header className="risalko-header">
                <div className="risalko-header-content">
                    <button onClick={() => router.back()} className="risalko-back-btn">
                        ← Back
                    </button>
                    <h1 className="risalko-header-title">
                        Students — {className}
                    </h1>
                </div>
            </header>

            <main className="risalko-content">
                {students.length === 0 ? (
                    <div className="risalko-empty">
                        <p>No students in this class yet.</p>
                    </div>
                ) : (
                    <div className="risalko-grid">
                        {students.map((student, idx) => (
                            <div
                                key={student._id?.$oid || student._id || idx}
                                className="risalko-card relative group"
                            >
                                {isTeacher && (
                                    <div
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => handleDelete(student._id?.$oid)}
                                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
                                            title="Remove Student"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-indigo-600 font-semibold">
                                            {(student.name || student.username || "?")[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-semibold text-neutral-800">
                                        {student.name || student.username || "Unknown name"}
                                    </h2>
                                </div>
                                {student.email && (
                                    <p className="text-neutral-500 text-sm mb-1">
                                        ✉️ {student.email}
                                    </p>
                                )}
                                {student.code && (
                                    <p className="text-neutral-500 text-sm mb-1">
                                        Code: <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded">{student.code}</span>
                                    </p>
                                )}
                                {student.paragraphs && (
                                    <p className="text-neutral-400 text-sm mt-3 pt-3 border-t border-neutral-100">
                                        📝 {student.paragraphs.length} assignments
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ViewStudents;
