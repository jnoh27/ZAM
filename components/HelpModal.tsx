import React from 'react';
import { X, Heart } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-8 overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#9D71E8]">
                                <Heart size={20} fill="currentColor" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-[#111111]">ZAM 이용 가이드</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-[#333333]">
                                신경다양성 보호자를 위한 안내
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-lg break-keep break-words">
                                ZAM은 발달장애, 자폐 스펙트럼 등 신경다양성 아동과 청소년들이 음악을 통해 감각을 긍정적으로 경험하고 자신을 표현할 수 있도록 설계된 직관적인 음악 놀이터입니다. 복잡한 규칙이나 언어적 지시 없이, 시각적 반응과 소리의 연결을 통해 자연스럽게 음악을 탐구할 수 있습니다.
                            </p>
                        </section>

                        <section className="bg-gray-50 p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-[#111111] mb-4">어떻게 사용하나요?</h3>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-[#AECBFA] text-[#1967D2] flex items-center justify-center font-bold">1</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">플레이그라운드 (실험실)</h4>
                                        <p className="text-gray-600 break-keep break-words">다양한 악기와 소리를 자유롭게 만지며 실험하는 공간입니다. 정답이 없으므로 아이가 좋아하는 소리나 시각적 반응을 보이는 도구를 자유롭게 탐색하도록 격려해 주세요.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-[#F4B4C8] text-[#D81B60] flex items-center justify-center font-bold">2</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">배우기 모드</h4>
                                        <p className="text-gray-600 break-keep break-words">단계별로 음악의 기초를 익힐 수 있습니다. 아이의 속도에 맞춰 천천히 진행하며, 한 단계를 완료할 때마다 긍정적인 피드백을 주시는 것이 좋습니다.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-[#A8E6CF] text-[#0F9D58] flex items-center justify-center font-bold">3</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">시각과 청각의 연결</h4>
                                        <p className="text-gray-600 break-keep break-words">모든 활동은 소리와 함께 직관적인 시각적 피드백을 제공합니다. 이는 감각 통합을 돕고 직관적인 이해를 높여줍니다.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-[#333333]">
                                추천 액티비티
                            </h3>
                            <ul className="list-disc pl-5 space-y-3 text-gray-600 text-lg">
                                <li className="break-keep break-words"><strong className="text-gray-800">칸딘스키:</strong> 그림 그리기와 소리가 결합되어 있어, 자신만의 그림이 어떤 소리가 나는지 호기심을 자극하기 좋습니다.</li>
                                <li className="break-keep break-words"><strong className="text-gray-800">멜로디 메이커:</strong> 블록을 쌓듯 색깔 네모를 클릭하여 멜로디를 만드는 직관적인 활동입니다.</li>
                                <li className="break-keep break-words"><strong className="text-gray-800">리듬 메이커:</strong> 규칙적인 패턴이나 반복적인 행동을 좋아하는 아이들에게 안정감을 줍니다.</li>
                            </ul>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <button
                            onClick={onClose}
                            className="bg-[#9D71E8] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-[#8659D3] transition-colors shadow-sm"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
