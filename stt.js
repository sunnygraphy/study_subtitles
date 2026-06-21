// stt.js (수정 최종본 - 발음 연습 및 3초 대기 제어 기능 통합)

// 1. 음성 인식 API 초기화
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
// [수정] 엣지 브라우저 안정화를 위한 상태 변수 정리
let isListening = false;
let userManuallyStopped = true; // 처음에는 무조건 꺼진 상태로 시작
let isTemporarilyIgnoring = false;
let isPracticeMode = false;

if (!SpeechRecognition) {
    console.error("이 브라우저는 음성 인식을 지원하지 않습니다. 크롬 브라우저 사용을 권장합니다.");
    const voiceBtn = document.getElementById('voiceCommandBtn');
    if (voiceBtn) {
        voiceBtn.disabled = true;
        voiceBtn.textContent = "⛔ 음성인식 미지원";
    }
} else {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;  // 계속 켜져 있도록 설정
    recognition.interimResults = false;

    // 2. 음성 인식 결과 처리
    recognition.onresult = (event) => {
        if (isTemporarilyIgnoring) {
            console.log("🔇 TTS 재생 중... STT 결과 무시");
            return; // 무시 모드일 경우 아무 처리도 하지 않음
        }

        const lastResultIndex = event.results.length - 1;
        let spokenText = event.results[lastResultIndex][0].transcript.trim();

        // ✨ [발음 연습 모드]인 경우: 명령어로 처리하지 않고 발음 유사도 분석으로 분기
        if (isPracticeMode) {
            console.log("💬 사용자 따라하기 발음 감지:", spokenText);
            // isPracticeMode = false; // ✨ 이제 displayPronunciationScore -> resumeVoiceRecognition에서 처리하므로 주석 처리
            stopVoiceRecognitionTemporarily(); // 결과 표시 및 음성 피드백 중에는 잠시 STT 대기

            // index.html의 발음 점수 표시 함수 호출
            if (typeof displayPronunciationScore === 'function' && typeof practiceSentence === 'string') {
                // 발음 분석 전, 사용자가 말한 문장에서 구두점을 제거하여 정확도를 높입니다.
                const cleanedSpokenText = spokenText.replace(/[.,!?]/g, "");
                displayPronunciationScore(practiceSentence, cleanedSpokenText);
            }
            return; // 일반 명령어 처리 로직을 실행하지 않고 건너뜁니다.
        }

        // --- 일반 명령어 처리 ---
        let command = spokenText.toLowerCase().replace(/[.,!?]/g, ""); 
        console.log("🎤 인식된 명령어:", command);

        // --- 명령어 분기 ---
        if (command === "next") {
            console.log("👉 실행: 영어 다음 문장");
            playCurrentOrNext('en');
        } 
        else if (command === "next korean") {
            console.log("👉 실행: 한국어 다음 문장");
            playCurrentOrNext('ko');
        } 
        else if (command === "previous") {
            console.log("👉 실행: 영어 이전 문장");
            playPrevious('en');
        } 
        else if (command === "previous korean") {
            console.log("👉 실행: 한국어 이전 문장");
            playPrevious('ko');
        }
        else if (command === "stop stt") {
            console.log("👉 실행: STT 종료");
            toggleVoiceCommand(); // 마이크 끄기
        }
        else if (command === "start stt") {
            console.log("👉 STT는 이미 켜져 있습니다.");
        }
        else if (command === "repeat") {
            console.log("👉 실행: 영어 무한 반복");
            startInfiniteRepeat('en');
        }
        else if (command === "repeat the korean" || command === "repeat korean") {
            console.log("👉 실행: 한국어 무한 반복");
            startInfiniteRepeat('ko');
        }
        else if (command === "stop reading" || command === "stop") {
            console.log("👉 실행: 읽기(반복) 종료");
            stopInfiniteRepeat();
        }
        else if (command === "read" || command === "read it" || command === "r e a d") {
            console.log("👉 실행: 현재 영어 문장 읽기");
            readCurrent('en');
        }
        else if (command === "read the korean" || command === "read korean") {
            console.log("👉 실행: 현재 한국어 문장 읽기");
            readCurrent('ko');
        }
    };

    // 3. 음성 인식 상태 관리
    recognition.onstart = () => {
        isListening = true;
        console.log("음성 인식이 시작되었습니다. 명령을 기다립니다...");
        updateVoiceButtonUI();
    };
    
    recognition.onend = () => {
        isListening = false;
        console.log("음성 인식이 중단되었습니다.");
        
        // 사용자가 명시적으로 끄지 않았다면(세션 자동 만료 등) 다시 켭니다.
        if (!userManuallyStopped) {
            console.log("자동 재시작 시도...");
            try {
                recognition.start();
            } catch(e) {
                console.error("자동 재시작 중 오류 무시:", e);
            }
        }
        updateVoiceButtonUI();
    };

    recognition.onerror = (event) => {
        isListening = false;
        console.error("음성 인식 에러:", event.error);
        if (event.error === 'not-allowed') {
            userManuallyStopped = true;
            alert("음성 명령을 사용하려면 마이크 권한을 허용해야 합니다.");
        }
        updateVoiceButtonUI();
    };
}

// 4. UI 및 외부 제어 함수
function toggleVoiceCommand() {
    if (!recognition) return;
    
    if (userManuallyStopped) {
        // 꺼져있는 상태 -> 켭니다.
        userManuallyStopped = false;
        try {
            recognition.start();
        } catch(e) {
            // 엣지에서 가끔 발생하는 찌꺼기 상태 강제 정리
            console.log("강제 초기화 후 다시 시작");
            recognition.abort(); // stop보다 강력한 강제 종료
            setTimeout(() => { 
                if(!userManuallyStopped) recognition.start(); 
            }, 100);
        }
    } else {
        // 켜져있는 상태 -> 끕니다.
        userManuallyStopped = true;
        recognition.stop();
    }
    updateVoiceButtonUI();
}

// TTS 재생 시 음성 인식 결과 처리를 잠시 무시하는 모드
function stopVoiceRecognitionTemporarily() {
    console.log("🤫 STT 무시 모드 시작");
    isTemporarilyIgnoring = true;
}

// TTS 재생 종료 후 음성 인식 결과 처리 재개 (연습 모드도 함께 완전히 초기화)
function resumeVoiceRecognition() {
    console.log("🙂 STT 무시 모드 해제 (명령어 대기 시작)");
    isTemporarilyIgnoring = false;
    isPracticeMode = false; 
}

// ✨ [추가] 영어 TTS 출력 후 발음 연습을 들을 수 있도록 모드를 전환하는 함수
function startPracticeMode() {
    console.log("👂 발음 연습 인식 시작...");
    isTemporarilyIgnoring = false; // STT가 들어야 하므로 무시 모드 해제
    isPracticeMode = true; // 다음 음성 결과는 연습 분석으로 이동하도록 설정
}

function updateVoiceButtonUI() {
    const btn = document.getElementById('voiceCommandBtn');
    if (btn) {
        const isActuallyListening = isListening && !userManuallyStopped;
        btn.textContent = isActuallyListening ? "🛑 음성 명령 끄기" : "🎙️ 음성 명령 켜기";
        if(isActuallyListening) {
            btn.classList.add('listening');
        } else {
            btn.classList.remove('listening');
        }
    }
}
