'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from "next/navigation";

type Student = {
    firstName: string;
    lastName: string;
};

const AddStudentsPage = () => {
    const [classData, setClassData] = useState({
        class_name: ''
    });
    const params = useParams();
    const router = useRouter();
    const classId = params.classId;

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

    const [students, setStudents] = useState<Student[]>([
        { firstName: '', lastName: '' },
    ]);

    const handleChange = (index: number, field: keyof Student, value: string) => {
        const updated = [...students];
        updated[index][field] = value;
        setStudents(updated);
    };

    const addStudent = () => {
        setStudents([...students, { firstName: '', lastName: '' }]);
    };

    const removeStudent = (index: number) => {
        const updated = students.filter((_, i) => i !== index);
        setStudents(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validStudents = students.filter(s => s.firstName.trim() && s.lastName.trim());

        if (validStudents.length === 0) {
            alert('Please add at least one student');
            return;
        }

        try {
            const createdStudentIds: number[] = []; // CHANGED: string[] to number[]

            for (const student of validStudents) {
                const email = `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@student.risalko.si`;
                const password = 'student123'; // Default password for students

                // CHANGED: Endpoint from /api/users to /api/register
                const res = await fetch('http://127.0.0.1:8000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: student.firstName,
                        surname: student.lastName,
                        email: email,
                        password: password,
                        type: 'student'
                    }),
                });

                const result = await res.json();

                if (!res.ok) {
                    // CHANGED: error to detail
                    console.error('Failed to create student:', result.detail);
                    throw new Error(result.detail || 'Failed to create student');
                }

                // CHANGED: Simplified ID extraction (no more MongoDB $oid)
                // Register returns the user object directly, not wrapped in 'data'
                const studentId = result.id;
                if (studentId) {
                    createdStudentIds.push(studentId);
                }
            }

            // Fetch current class data
            const classRes = await fetch(`http://127.0.0.1:8000/api/classes/${classId}`);
            const classDataResult = await classRes.json();

            if (!classRes.ok) {
                throw new Error('Failed to fetch class data');
            }

            // CHANGED: Simplified student ID extraction
            const existingStudentIds = classDataResult.data?.students?.map((s: any) => s.id) || [];

            const allStudentIds = [...existingStudentIds, ...createdStudentIds];

            // Update class with all student IDs
            const updateRes = await fetch(`http://127.0.0.1:8000/api/classes/${classId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    students: allStudentIds
                }),
            });

            const updateResult = await updateRes.json();

            if (!updateRes.ok) {
                // CHANGED: error to detail
                throw new Error(updateResult.detail || 'Failed to update class');
            }

            alert(`✅ Successfully added ${createdStudentIds.length} students to class ${classData.class_name || ''}`);


            setStudents([{ firstName: '', lastName: '' }]);

        } catch (error) {
            console.error('Error adding students:', error);
            alert(`Error adding students: ${error instanceof Error ? error.message : 'Unknown error'}`);

        }
    };

    if (loading) {
        return (
            <div className="risalko-app">
                <div className="risalko-loading">
                    <div className="risalko-spinner"></div>
                    <p>Loading class data...</p>
                </div>
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
                    <h1 className="risalko-header-title">Add Students</h1>
                </div>
            </header>

            <main className="risalko-content-narrow">
                <div className="risalko-card">
                    <div className="risalko-card-header">
                        <h2 className="risalko-card-title">Add Students to {classData.class_name}</h2>
                        <p className="risalko-card-subtitle">Enter student names to create their accounts</p>
                    </div>

                    <form onSubmit={handleSubmit} className="risalko-form-section">
                        {students.map((student, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={student.firstName}
                                    onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                                    className="risalko-input flex-1"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={student.lastName}
                                    onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                                    className="risalko-input flex-1"
                                    required
                                />
                                {students.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeStudent(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={addStudent}
                                className="risalko-btn risalko-btn-secondary flex-1"
                            >
                                + Add Another
                            </button>

                            <button type="submit" className="risalko-btn risalko-btn-primary flex-1">
                                Save Students
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddStudentsPage;