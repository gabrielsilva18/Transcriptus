document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('translationForm');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('output');
    const switchButton = document.getElementById('switchLanguages');
    const sourceLangInput = document.getElementById('sourceLang');
    const targetLangInput = document.getElementById('targetLang');
    const sourceFlag = document.getElementById('sourceFlag');
    const targetFlag = document.getElementById('targetFlag');
    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const sourceCode = document.getElementById('sourceCode');
    const targetCode = document.getElementById('targetCode');
    const micButton = document.getElementById('micButton');
    const micStatus = document.getElementById('micStatus');
    const speakOutputBtn = document.getElementById('speakOutputBtn');

    // Configuração do reconhecimento de voz
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    let isRecording = false;

    recognition.continuous = true;
    recognition.interimResults = true;

    function updateRecognitionLanguage() {
        recognition.lang = sourceLangInput.value === 'en' ? 'en-US' : 'pt-BR';
    }
    updateRecognitionLanguage();

    // Função para inverter os idiomas
    function switchLanguages() {
        const tempLang = sourceLangInput.value;
        sourceLangInput.value = targetLangInput.value;
        targetLangInput.value = tempLang;

        const tempFlagSrc = sourceFlag.src;
        sourceFlag.src = targetFlag.src;
        targetFlag.src = tempFlagSrc;

        const tempText = sourceText.textContent;
        sourceText.textContent = targetText.textContent;
        targetText.textContent = tempText;

        // Inverte também os códigos de idioma
        const tempCode = sourceCode.textContent;
        sourceCode.textContent = targetCode.textContent;
        targetCode.textContent = tempCode;

        inputText.value = '';
        outputText.value = '';
        updateRecognitionLanguage();

        inputText.placeholder = sourceLangInput.value === 'en' ? 
            "Escreva ou cole seu texto em inglês aqui" : 
            "Escreva ou cole seu texto em português aqui";
    }

    // Eventos do reconhecimento de voz
    recognition.onstart = () => {
        isRecording = true;
        micButton.classList.add('recording');
        micStatus.textContent = 'Ouvindo...';
        inputText.placeholder = 'Fale agora...';
    };

    recognition.onend = () => {
        isRecording = false;
        micButton.classList.remove('recording');
        micStatus.textContent = '';
        inputText.placeholder = sourceLangInput.value === 'en' ? 
            "Escreva ou cole seu texto em inglês aqui" : 
            "Escreva ou cole seu texto em português aqui";
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            }
        }
        
        if (finalTranscript) {
            inputText.value = finalTranscript.trim();
            // Traduz automaticamente após reconhecer a fala
            form.dispatchEvent(new Event('submit'));
        }
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        micStatus.textContent = 'Erro no reconhecimento de voz. Tente novamente.';
        micButton.classList.remove('recording');
        isRecording = false;
    };

    // Evento do botão de microfone
    micButton.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
        } else {
            inputText.value = '';
            recognition.start();
        }
    });

    // Adiciona evento ao botão de inverter
    switchButton.addEventListener('click', switchLanguages);

    // Função para escutar a tradução (text-to-speech)
    function speakTranslation() {
        if (!outputText.value.trim()) {
            return;
        }

        // Para qualquer síntese de voz em andamento
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(outputText.value);
        
        // Define o idioma baseado no idioma de destino
        utterance.lang = targetLangInput.value === 'en' ? 'en-US' : 'pt-BR';
        
        // Define a velocidade e tom
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Eventos para feedback visual
        utterance.onstart = () => {
            speakOutputBtn.classList.add('speaking');
            speakOutputBtn.innerHTML = '<i class="bi bi-stop-fill"></i>';
        };

        utterance.onend = () => {
            speakOutputBtn.classList.remove('speaking');
            speakOutputBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
        };

        utterance.onerror = (event) => {
            console.error('Erro na síntese de voz:', event.error);
            speakOutputBtn.classList.remove('speaking');
            speakOutputBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
        };

        // Inicia a síntese de voz
        window.speechSynthesis.speak(utterance);
    }

    // Adiciona evento ao botão de escutar tradução
    speakOutputBtn.addEventListener('click', speakTranslation);

    // Função para copiar texto para a área de transferência
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (fallbackErr) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    // Função para mostrar feedback visual de cópia
    function showCopyFeedback(button) {
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check"></i>';
        button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.style.background = '';
        }, 1500);
    }

    // Função para limpar apenas o texto de entrada
    function clearInputText() {
        inputText.value = '';
        inputText.focus();
    }

    // Função para limpar apenas o texto de saída
    function clearOutputText() {
        outputText.value = '';
    }

    // Eventos dos botões de ação
    document.getElementById('copyInputBtn').addEventListener('click', async () => {
        if (inputText.value.trim()) {
            const success = await copyToClipboard(inputText.value);
            if (success) {
                showCopyFeedback(document.getElementById('copyInputBtn'));
            }
        }
    });

    document.getElementById('copyOutputBtn').addEventListener('click', async () => {
        if (outputText.value.trim()) {
            const success = await copyToClipboard(outputText.value);
            if (success) {
                showCopyFeedback(document.getElementById('copyOutputBtn'));
            }
        }
    });

    document.getElementById('clearInputBtn').addEventListener('click', clearInputText);

    // Função para limpar os campos (mantida para compatibilidade)
    window.clearTextArea = function() {
        inputText.value = '';
        outputText.value = '';
    }

    // Manipula o envio do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!inputText.value.trim()) {
            return;
        }

        try {
            const response = await fetch('/significado', {
                method: 'POST',
        headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    texts: inputText.value,
                    sourceLang: sourceLangInput.value,
                    targetLang: targetLangInput.value
                })
            });

            const data = await response.json();
            outputText.value = data.translatedText;
    } catch (error) {
            console.error('Erro na tradução:', error);
            outputText.value = 'Erro ao traduzir o texto. Por favor, tente novamente.';
    }
  });
  });
