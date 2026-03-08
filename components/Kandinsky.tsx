import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface KandinskyProps {
    onBack: () => void;
}

export const Kandinsky: React.FC<KandinskyProps> = ({ onBack }) => {
    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden relative">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 p-3 bg-white/80 backdrop-blur rounded-full hover:bg-white active:scale-95 transition-all shadow-md z-50 group flex items-center justify-center"
                aria-label="뒤로가기"
            >
                <ArrowLeft size={28} strokeWidth={2.5} className="text-[#5F6368] group-hover:text-[#202124]" />
            </button>
            <iframe
                src="/kandinsky/index.html"
                className="w-full h-full border-none"
                title="Kandinsky"
                allow="autoplay; fullscreen"
            />
        </div>
    );
};