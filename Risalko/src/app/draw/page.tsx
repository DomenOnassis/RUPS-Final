"use client";
import DrawingCanvas from '../../components/DrawingCanvas';
import Link from 'next/link';
 import { useUser } from "../../hooks/useUser";

export default function DrawPage() {
  const userType = useUser();

  if (!userType) {
    return <p>Nisi prijavljen.</p>;
  }
  
  return (
    <div className="background h-screen flex flex-col">
      <div className="px-6 py-4 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Canvas</h2>
        <Link 
          href="/"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm"
        >
          ← Back
        </Link>
      </div>

      <div className="flex-1 px-4 pb-4 min-h-0">
        <DrawingCanvas />
      </div>
    </div>
  );
}
