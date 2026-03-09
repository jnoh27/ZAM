import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface KandinskyProps {
    onBack: () => void;
}

export const Kandinsky: React.FC<KandinskyProps> = ({ onBack }) => {
    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden relative">
            <header className="absolute top-0 left-0 w-full p-4 flex justify-between z-50 pointer-events-none">
                <button
                    onClick={onBack}
                    className="p-3 bg-white/80 backdrop-blur rounded-full pointer-events-auto hover:bg-slate-200 transition-colors border shadow-sm flex items-center justify-center"
                    aria-label="뒤로가기"
                >
                    <ArrowLeft size={32} strokeWidth={3} className="text-[#5F6368]" />
                </button>
                <h1 className="text-3xl font-black text-[#202124] drop-shadow-sm">칸딘스키</h1>
            </header>
            <iframe
                src="/kandinsky/index.html"
                className="w-full h-full border-none"
                title="Kandinsky"
                allow="autoplay; fullscreen"
            />
        </div>
    );
};