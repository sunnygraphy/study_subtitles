// stt.js (수정 최종본)

// 1. 음성 인식 API 초기화
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;
let userManuallyStopped = false; // 사용자가 직접 껐는지 확인하는 플래그
let isTemporarilyIgnoring = false; // TTS 재생 중에 STT 결과를 무시하기 위한 플래그

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
        recognition.continuous = true;  // [수정] 계속 켜져 있도록 변경
    recognition.interimResults = false;

    // 2. 음성 인식 결과 처리
        recognition.onresult = (event) => {
        if (isTemporarilyIgnoring) {
            console.log("🔇 TTS 재생 중... STT 결과 무시");
            return; // 무시 모드일 경우, 아무 처리도 하지 않음
        }
        const lastResultIndex = event.results.length - 1;
        let command = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        
        command = command.replace(/[.,!?]/g, ""); 
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
        // --- 새로 추가된 명령어 ---
        else if (command === "stop stt") {
            console.log("👉 실행: STT 종료");
            toggleVoiceCommand(); // 마이크 끄기
        }
        else if (command === "start stt") {
            // 이미 켜져있어야 이 명령을 들을 수 있으므로 실질적으로는 상태 확인용
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
        else if (command === "read") {
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
    
    // [수정] onend 로직 단순화
    recognition.onend = () => {
        console.log("음성 인식이 중단되었습니다.");
        isListening = false;

        // 사용자가 직접 껐거나, 권한 문제, 네트워크 오류 등이 아니면 다시 시작
        if (!userManuallyStopped) {
            console.log("STT 세션이 만료되어 재시작합니다.");
            try {
                // 잠시 후 재시작하여 너무 잦은 재시작 및 '띵' 소리 방지
                setTimeout(() => recognition.start(), 250);
            } catch (e) {
                console.error("STT 재시작 실패:", e);
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

// TTS 재생 시 음성 인식 결과 처리를 잠시 무시
function stopVoiceRecognitionTemporarily() {
    console.log("🤫 STT 무시 모드 시작");
    isTemporarilyIgnoring = true;
}

// TTS 재생 종료 후 음성 인식 결과 처리 재개
function resumeVoiceRecognition() {
    console.log("🙂 STT 무시 모드 해제");
    isTemporarilyIgnoring = false;
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
