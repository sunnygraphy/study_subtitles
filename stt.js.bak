// stt.js (수정 최종본)

// 1. 음성 인식 API 초기화
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;
let userManuallyStopped = false; // 사용자가 직접 껐는지 확인하는 플래그

if (!SpeechRecognition) {
    console.error("이 브라우저는 음성 인식을 지원하지 않습니다. 크롬 브라우저 사용을 권장합니다.");
    const voiceBtn = document.getElementById('voiceCommandBtn');
    if (voiceBtn) {
        voiceBtn.disabled = true;
        voiceBtn.textContent = "⛔ 음성인식 미지원";
    }
} else {
    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false; // [수정] 한 번의 명령어를 인식하면 자동으로 종료되도록 변경
    recognition.interimResults = false;

    // 2. 음성 인식 결과 처리
    recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        let command = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        
        command = command.replace(/[.,!?]/g, ""); 
        console.log("🎤 인식된 명령어:", command);

        // --- 명령어 분기 ---
        if (command === "next" || command === "넥스트") {
            console.log("👉 실행: 영어 다음 문장");
            playCurrentOrNext('en');
        } 
        else if (command === "다음") {
            console.log("👉 실행: 한국어 다음 문장");
            playCurrentOrNext('ko');
        }
        // --- 새로 추가된 명령어 ---
        else if (command === "stop stt") {
            console.log("👉 실행: STT 종료");
            toggleVoiceCommand(); // 마이크 끄기
        }
        else if (command === "start stt") {
            // 이미 켜져있어야 이 명령을 들을 수 있으므로 실질적으로는 상태 확인용
            console.log("👉 STT는 이미 켜져 있습니다.");
        }
        else if (command === "repeat" || command === "리피트") {
            console.log("👉 실행: 영어 무한 반복");
            startInfiniteRepeat('en');
        }
        else if (command === "반복") {
            console.log("👉 실행: 한국어 무한 반복");
            startInfiniteRepeat('ko');
        }
        else if (command === "stop reading" || command === "stop" || command === "스탑 리딩") {
            console.log("👉 실행: 읽기(반복) 종료");
            stopInfiniteRepeat();
        }
    };

    // 3. 음성 인식 상태 관리
    recognition.onstart = () => {
        isListening = true;
        console.log("음성 인식이 시작되었습니다. 명령을 기다립니다...");
        updateVoiceButtonUI();
    };
    
    // [수정] onend 로직 단순화
    recognition.onend = () => {
        console.log("음성 인식이 중단되었습니다.");
        isListening = false;
        
        if (userManuallyStopped) {
            console.log("사용자에 의해 STT가 꺼진 상태를 유지합니다.");
            updateVoiceButtonUI();
        } else {
            // TTS 재생이나 다른 이유로 잠시 멈춘 경우, 다시 시작
            try {
                recognition.start();
            } catch(e) {
                // 이미 시작된 경우의 에러는 무시
            }
        }
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

    if (isListening) {
        userManuallyStopped = true;
        recognition.stop();
    } else {
        userManuallyStopped = false;
        try {
            recognition.start();
        } catch(e) {
            console.error("음성 인식을 시작할 수 없습니다:", e);
        }
    }
    updateVoiceButtonUI();
}

// TTS 재생 시 음성 인식 잠시 중단
function stopVoiceRecognitionTemporarily() {
    if (isListening) {
        userManuallyStopped = true; // 재시작을 막기 위해 일시적으로 플래그 설정
        recognition.stop();
    }
}

// TTS 재생 종료 후 음성 인식 재개
function resumeVoiceRecognition() {
    if (!isListening) {
        userManuallyStopped = false; // 다시 자동 재시작이 가능하도록 플래그 복원
        recognition.start();
    }
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
