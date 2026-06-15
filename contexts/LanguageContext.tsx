import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { en } from './en';

export type Language = 'ko' | 'en';

interface LanguageContextValue {
    language: Language;
    setLanguage: (language: Language) => void;
    toggleLanguage: () => void;
    t: (text: string) => string;
}

const STORAGE_KEY = 'zam-language';
const SKIP_SELECTOR = 'script, style, textarea, code, pre, [data-no-translate], [data-no-translate] *';
const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'alt', 'placeholder', 'title'];

const LanguageContext = createContext<LanguageContextValue | null>(null);

const ENGLISH_OVERRIDES: Record<string, string> = {
    '놀이터': 'Playground',
    '학교': 'Learning',
    '스튜디오': 'Studio',
    '실험실': 'Play Lab',
    '가볍게 즐기며 음악을 탐구하고 만들어 보세요.': 'Explore and create music in a playful way.',
    '배우기': 'Learn',
    '차근차근 음악의 기초를 배워봐요.': 'Learn the basics of music step by step.',
    '멜로디 메이커': 'Melody Maker',
    '멜로디 메이커:': 'Melody Maker:',
    '멜로디와 화음 작곡': 'Compose melodies and chords',
    '리듬 메이커': 'Rhythm Maker',
    '리듬 메이커:': 'Rhythm Maker:',
    '드럼 비트 제작': 'Build drum beats',
    '코드 메이커': 'Chord Maker',
    '화음 조합 학습': 'Learn chord combinations',
    '칸딘스키': 'Kandinsky',
    '칸딘스키:': 'Kandinsky:',
    '그림으로 연주하기': 'Play with drawings',
    '화음 연주': 'Play Chords',
    '즐거운 화음 실험': 'Fun chord experiments',
    '악기 탐험': 'Instrument Explorer',
    '다양한 악기 소리': 'Explore instrument sounds',
    '하프 스트링': 'Harp Strings',
    '하프 소리 연주': 'Play harp sounds',
    '아르페지오': 'Arpeggio',
    '리드미컬한 화음': 'Rhythmic chords',
    '보이스 스피너': 'Voice Spinner',
    '목소리 변형하기': 'Transform your voice',
    '하모닉스': 'Harmonics',
    '배음 원리 탐구': 'Explore overtones',
    '사운드 웨이브': 'Sound Waves',
    '소리 파동 체험': 'Explore sound waves',
    '피아노': 'Piano',
    '바이올린': 'Violin',
    '트럼펫': 'Trumpet',
    '종소리': 'Bells',
    '도': 'Do',
    '레': 'Re',
    '미': 'Mi',
    '파': 'Fa',
    '솔': 'Sol',
    '라': 'La',
    '시': 'Ti',
    '도 (C)': 'Do (C)',
    '레 (Dm)': 'Re (Dm)',
    '미 (Em)': 'Mi (Em)',
    '파 (F)': 'Fa (F)',
    '솔 (G)': 'Sol (G)',
    '라 (Am)': 'La (Am)',
    '시 (Bdim)': 'Ti (Bdim)',
    '도 + 미': 'Do + Mi',
    '도 + 레': 'Do + Re',
    '행복해요': 'Happy',
    '차분해요': 'Calm',
    '깊어요': 'Deep',
    '씩씩해요': 'Bold',
    '신나요': 'Excited',
    '슬퍼요': 'Sad',
    '긴장돼요': 'Tense',
    '화음': 'Chord',
    '화음 만들기': 'Make Chords',
    '화음 블록': 'Chord Blocks',
    '화음을 골라주세요': 'Choose a Chord',
    '화음이 뭘까?': 'What is a chord?',
    '화음이 움직여요': 'Chords Move',
    '화음은 흘러가요': 'Chords flow',
    '화음이 가진 감정 느끼기': 'Feel the emotions of chords',
    '리듬': 'Rhythm',
    '멜로디': 'Melody',
    '리듬의 기초': 'Rhythm Basics',
    '기본 비트': 'Basic Beat',
    '리듬 패턴': 'Rhythm Patterns',
    '리듬 마스터': 'Rhythm Master',
    '음높이': 'Pitch',
    '음높이의 기초': 'Pitch Basics',
    '음 기억하기': 'Remember the Note',
    '음 높이 퀴즈': 'Pitch Quiz',
    '목소리로 맞춰보기': 'Match with Your Voice',
    '음 패턴 따라하기': 'Follow the Note Pattern',
    '낮은 음 따라 부르기': 'Sing Low Notes',
    '베이스의 낮은 소리를 따라 해보세요. (아— 하고 소리내면 분석이 쉬워져요)': 'Try singing the low bass note. Saying “ah” makes it easier to analyze.',
    '소리의 겹침': 'Layered Sounds',
    '어울림과 긴장': 'Harmony and Tension',
    '소리를 블록으로 보기': 'See Sounds as Blocks',
    '소리 쌓기': 'Stack Sounds',
    '세 음 화음': 'Three-Note Chords',
    '밝은 화음, 어두운 화음': 'Bright and Dark Chords',
    '화음의 움직임': 'Chord Motion',
    '소리의 방향': 'Sound Direction',
    '세 음 패턴': 'Three-Note Patterns',
    '리듬 위의 멜로디': 'Melody over Rhythm',
    '코드 위의 멜로디': 'Melody over Chords',
    '낮': 'Low',
    '중': 'Mid',
    '높': 'High',
    '낮은 소리': 'Low Sound',
    '높은 소리': 'High Sound',
    '낮음 → 높음': 'Low → High',
    '높음 → 낮음': 'High → Low',
    '낮 → 중 → 높': 'Low → Mid → High',
    '높 → 중 → 낮': 'High → Mid → Low',
    '중 → 높 → 중': 'Mid → High → Mid',
    '하늘': 'Sky',
    '땅': 'Earth',
    '위로': 'Up',
    '아래로': 'Down',
    '올라가기': 'Going Up',
    '내려가기': 'Going Down',
    '왔다갔다': 'Up and Down',
    '무작위': 'Random',
    '거꾸로': 'Reverse',
    '멈춤': 'Stop',
    '빠르게': 'Fast',
    '천천히': 'Slow',
    '정박': 'On Beat',
    '하이햇': 'Hi-Hat',
    '스네어': 'Snare',
    '킥': 'Kick',
    '다음': 'Next',
    '닫기': 'Close',
    '이전': 'Back',
    '처음으로': 'Start Over',
    '레슨': 'Lesson',
    '레슨 시작하기': 'Start Lesson',
    '레슨 완료': 'Lesson Complete',
    '다음 레슨': 'Next Lesson',
    '다음으로': 'Continue',
    '시작하기': 'Start',
    '시작하기!': 'Start!',
    '들어보기': 'Listen',
    '듣는 중...': 'Listening...',
    '다시 듣기': 'Listen Again',
    '악기 로딩 중...': 'Loading instrument...',
    '화면을 탭하여 오디오를 활성화하세요': 'Tap the screen to enable audio',
    '소리를 켜고 화면을 탭하세요': 'Turn on sound and tap the screen',
    '마이크 사용 권한이 필요합니다.': 'Microphone permission is required.',
    '마이크 접근 권한이 필요해요.': 'Microphone access is required.',
    '마이크를 눌러 녹음하세요': 'Tap the microphone to record',
    '마이크를 켜고 노래를 불러보세요!': 'Turn on the microphone and sing!',
    '마이크 켜기': 'Turn on microphone',
    '조금 더 낮게 불러보세요!': 'Sing a little lower!',
    '조금 더 높게 불러보세요!': 'Sing a little higher!',
    '그대로 유지하세요!': 'Keep it there!',
    '완벽해요! 그대로 유지하세요.': 'Perfect! Keep it there.',
    '거의 다 왔어요!': 'Almost there!',
    '나의 목소리': 'My Voice',
    '목표 음높이': 'Target Pitch',
    '목표 패턴': 'Target Pattern',
    '패턴을 들어보세요': 'Listen to the pattern',
    '기억한 음을 불러보세요!': 'Sing the note you remember!',
    '잘 들어보세요!': 'Listen carefully!',
    '잠시만 기다려요...': 'Wait just a moment...',
    '틀렸어요! 다시 들어볼까요?': 'Not quite! Let’s listen again.',
    '오디오가 백그라운드에서 녹음되고 있습니다... (약 8초 소요)': 'Audio is recording in the background... (about 8 seconds)',
    '트랙 완성!': 'Track Complete!',
    '지금까지 만든 모든 트랙 요소들이 합쳐졌어요.': 'All the track parts you made have been combined.',
    '트랙 다운로드': 'Download Track',
    '레코딩 중...': 'Recording...',
    '피아노 롤에 노트를 그려 나만의 선율을 완성하세요.': 'Draw notes on the piano roll to complete your melody.',
    '비트와 어울리는 4개의 화음을 골라주세요.': 'Choose four chords that fit your beat.',
    '음을 더 놓아주세요': 'Add more notes',
    '음을 줄여주세요': 'Use fewer notes',
    '음:': 'Notes:',
    '칸을 눌러 멜로디를 만들어보세요!': 'Tap cells to create a melody!',
    '칸을 눌러 음을 놓고 재생해보세요!': 'Tap cells to place notes, then play them!',
    '빈칸을 클릭해서 소리를 넣거나 빼보세요!': 'Click empty squares to add or remove sounds!',
    '반복 있음': 'Repeat found',
    '반복 필요': 'Repeat needed',
    '편안한 소리와 긴장되는 소리': 'Comfortable and tense sounds',
    '편안해요': 'Comfortable',
    '안정적': 'Stable',
    '밝음': 'Bright',
    '어두움': 'Dark',
    '밝아요': 'Bright',
    '어두워요': 'Dark',
    '슬픈 느낌': 'Sad feeling',
    '밝은 느낌': 'Bright feeling',
    '좋아요!': 'Great!',
    '좋아요! 👂': 'Great! 👂',
    '대단해요!': 'Amazing!',
    '좋은 귀를 가졌어요!': 'Great ears!',
    '좋은 선택!': 'Good choice!',
    '멋진 귀를 가졌어요!': 'Wonderful ears!',
    '참 잘했어요!': 'Well done!',
    '한 음': 'One note',
    '두 음': 'Two notes',
    '세 음': 'Three notes',
    '한 음, 두 음, 세 음': 'One note, two notes, three notes',
    '현재 속도:': 'Current speed:',
    '기준 가이드': 'Reference Guide',
    '위아래로 드래그 해보세요': 'Drag up and down',
    '위아래로 움직여보세요': 'Move up and down',
    '달이가 소리를 들려주는 중...': 'Mr. Otter is playing the sound...',
    '두 소리가 똑같아지면 화면이 반짝거려요!': 'The screen sparkles when the two sounds match!',
    '두 가지 화음을 들어볰요': 'Listen to two chords',
    '플레이그라운드 (실험실)': 'Playground (Play Lab)',
    '배우기 모드': 'Learning Mode',
    '시각과 청각의 연결': 'Connecting Sight and Sound',
    '추천 액티비티': 'Recommended Activities',
    '신경다양성 보호자를 위한 안내': 'Guide for neurodiversity caregivers',
    'ZAM은 발달장애, 자폐 스펙트럼 등 신경다양성 아동과 청소년들이 음악을 통해 감각을 긍정적으로 경험하고 자신을 표현할 수 있도록 설계된 직관적인 음악 놀이터입니다. 복잡한 규칙이나 언어적 지시 없이, 시각적 반응과 소리의 연결을 통해 자연스럽게 음악을 탐구할 수 있습니다.': 'ZAM is an intuitive music playground designed for neurodiverse children and teens, including learners with developmental disabilities or autism spectrum profiles, to experience sensation positively and express themselves through music. Without complex rules or verbal instructions, children can naturally explore music through the connection between visual responses and sound.',
    '어떻게 사용하나요?': 'How do I use it?',
    '확인': 'OK',
    '유닛': 'Unit',
    '유닛 1': 'Unit 1',
    '유닛 2': 'Unit 2',
    '유닛 3': 'Unit 3',
    '유닛 4': 'Unit 4',
    '알 수 없는 유닛': 'Unknown Unit',
    'ZAM 이용 가이드': 'ZAM User Guide',
    '음악으로 노는 재미있는 세상, Zam': 'A playful world of music, Zam',
    'Zam (잼)': 'Zam',
    'zam-(잼)': 'zam',
};

const hasKorean = (text: string) => /[\uac00-\ud7af]/.test(text);

const preserveOuterWhitespace = (original: string, translated: string) => {
    const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return translated;
    return `${match[1]}${translated}${match[3]}`;
};

const translateDynamicText = (text: string) => {
    const followSoundMatch = text.match(/^(\d+)번째 소리를 따라해보세요!$/);
    if (followSoundMatch) return `Follow sound ${followSoundMatch[1]}!`;

    const unitMatch = text.match(/^유닛\s+(\d+)$/);
    if (unitMatch) return `Unit ${unitMatch[1]}`;

    const chordMatch = text.match(/^화음\s+(.+)$/);
    if (chordMatch) return `Chord ${chordMatch[1]}`;

    const targetPatternMatch = text.match(/^목표 패턴\s+\((.+)\)$/);
    if (targetPatternMatch) return `Target pattern (${targetPatternMatch[1]})`;

    const notesCountMatch = text.match(/^음:\s*(.+)$/);
    if (notesCountMatch) return `Notes: ${notesCountMatch[1]}`;

    return null;
};

export const translateToEnglish = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return text;

    const dynamicTranslation = translateDynamicText(trimmed);
    const translated = ENGLISH_OVERRIDES[trimmed] ?? dynamicTranslation ?? en[trimmed] ?? trimmed;

    return preserveOuterWhitespace(text, translated);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof window === 'undefined') return 'ko';
        return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ko';
    });
    const textNodeOriginals = useRef(new WeakMap<Text, string>());
    const attributeOriginals = useRef(new WeakMap<Element, Map<string, string>>());
    const isApplying = useRef(false);

    const t = useCallback((text: string) => (language === 'en' ? translateToEnglish(text) : text), [language]);

    const setLanguage = useCallback((nextLanguage: Language) => {
        setLanguageState(nextLanguage);
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguageState(current => (current === 'ko' ? 'en' : 'ko'));
    }, []);

    const translateTextNode = useCallback((node: Text) => {
        const currentText = node.nodeValue ?? '';
        const previousOriginal = textNodeOriginals.current.get(node);

        if (language === 'ko') {
            if (previousOriginal !== undefined && currentText !== previousOriginal) {
                node.nodeValue = previousOriginal;
            }
            return;
        }

        if (!hasKorean(currentText) && previousOriginal === undefined) return;

        const originalText = hasKorean(currentText) ? currentText : previousOriginal ?? currentText;
        if (!hasKorean(originalText)) return;

        textNodeOriginals.current.set(node, originalText);
        const translatedText = translateToEnglish(originalText);
        if (currentText !== translatedText) {
            node.nodeValue = translatedText;
        }
    }, [language]);

    const translateElementAttributes = useCallback((element: Element) => {
        if (element.matches(SKIP_SELECTOR)) return;

        let originals = attributeOriginals.current.get(element);

        for (const attribute of TRANSLATABLE_ATTRIBUTES) {
            const currentValue = element.getAttribute(attribute);
            if (currentValue === null) continue;

            const previousOriginal = originals?.get(attribute);

            if (language === 'ko') {
                if (previousOriginal !== undefined && currentValue !== previousOriginal) {
                    element.setAttribute(attribute, previousOriginal);
                }
                continue;
            }

            if (!hasKorean(currentValue) && previousOriginal === undefined) continue;

            const originalValue = hasKorean(currentValue) ? currentValue : previousOriginal ?? currentValue;
            if (!hasKorean(originalValue)) continue;

            if (!originals) {
                originals = new Map<string, string>();
                attributeOriginals.current.set(element, originals);
            }

            originals.set(attribute, originalValue);
            const translatedValue = translateToEnglish(originalValue);
            if (currentValue !== translatedValue) {
                element.setAttribute(attribute, translatedValue);
            }
        }
    }, [language]);

    const applyTranslations = useCallback(() => {
        if (typeof document === 'undefined' || isApplying.current) return;

        const root = document.getElementById('root');
        if (!root) return;

        isApplying.current = true;

        try {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode: node => {
                    const parent = node.parentElement;
                    if (!parent || parent.matches(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                },
            });

            const textNodes: Text[] = [];
            while (walker.nextNode()) {
                textNodes.push(walker.currentNode as Text);
            }

            textNodes.forEach(translateTextNode);
            root.querySelectorAll('*').forEach(translateElementAttributes);
        } finally {
            isApplying.current = false;
        }
    }, [translateElementAttributes, translateTextNode]);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        document.documentElement.lang = language === 'en' ? 'en' : 'ko';
        window.localStorage.setItem(STORAGE_KEY, language);
        applyTranslations();

        const root = document.getElementById('root');
        if (!root) return;

        const observer = new MutationObserver(() => {
            if (!isApplying.current) {
                applyTranslations();
            }
        });

        observer.observe(root, {
            attributes: true,
            attributeFilter: TRANSLATABLE_ATTRIBUTES,
            characterData: true,
            childList: true,
            subtree: true,
        });

        return () => observer.disconnect();
    }, [applyTranslations, language]);

    const value = useMemo<LanguageContextValue>(() => ({
        language,
        setLanguage,
        toggleLanguage,
        t,
    }), [language, setLanguage, t, toggleLanguage]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within LanguageProvider');
    }
    return context;
};
