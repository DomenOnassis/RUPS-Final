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
                const res = await fetch(`http://127.0.0.1:5000/api/classes/${classId}?populate=true`);
                const data = await res.json();

                if (res.ok && data.data) {
                    setClassName(data.data.class_name || "Razred");
                    setStudents(data.data.students || []);
                } else {
                    setError("Napaka pri pridobivanju učencev.");
                }
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("Napaka pri povezavi s strežnikom.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [classId]);

    const handleDelete = async (studentId: string) => {
        if (!confirm("Ali ste prepričani, da želite odstraniti učenca iz razreda?")) return;

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/classes/${classId}/students/${studentId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

            // Update state locally
            setStudents(prev => prev.filter(s => s._id?.$oid !== studentId && s._id !== studentId));
            alert("Učenec odstranjen iz razreda.");
        } catch (err) {
            console.error("Error removing student:", err);
            alert("Napaka pri odstranjevanju učenca.");
        }
    };


    if (loading) {
        return (
            <div className="background text-center py-20">
                <p className="text-text text-lg">Nalaganje učencev...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="background text-center py-20">
                <p className="text-red-500 font-semibold">{error}</p>
            </div>
        );
    }
    const isTeacher = userType === "teacher";
    return (
        <div className="background min-h-screen pb-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-gray-700/90 p-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-300 hover:text-gray-100 transition-colors text-2xl font-semibold"
                    >
                        ←
                    </button>
                    <h1 className="text-3xl font-bold text-gray-200">
                        Učenci v razredu: {className}
                    </h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8">
                {students.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">
                        Trenutno ni učencev v tem razredu.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {students.map((student, idx) => (
                            <div
                                key={student._id?.$oid || student._id || idx}
                                className="section-gray relative group"
                            >
                                {isTeacher && (
                                    <div
                                        className="absolute bottom-2 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => handleDelete(student._id?.$oid)}
                                            className="p-2 rounded-md hover:bg-red-400 text-black transition"
                                            title="Delete Class"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                )}
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                    {student.name || student.username || "Neznano ime"}
                                </h2>
                                {student.email && (
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                        ✉️ {student.email}
                                    </p>
                                )}
                                {student.code && (
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                        Koda: {student.code}
                                    </p>
                                )}
                                {student.paragraphs && (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Naloge: {student.paragraphs.length}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewStudents;
