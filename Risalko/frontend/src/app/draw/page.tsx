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
      <div className="px-4 py-3 flex-shrink-0 bg-gray-700/90 border-b-4 border-dashed border-yellow-400">
        <Link 
          href="/"
          className="inline-flex items-center text-yellow-100 hover:text-yellow-200 transition-colors font-black text-lg transform hover:scale-110"
        >
          ←
        </Link>
      </div>

      <div className="flex-1 px-4 pb-4 min-h-0">
        <DrawingCanvas />
      </div>
    </div>
  );
}
