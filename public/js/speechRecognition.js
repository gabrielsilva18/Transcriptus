class PronunciationChecker {
  constructor() {
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.setupRecognition();
    this.setupButtons();
    this.targetWord = document.getElementById('word-text').textContent.trim().toLowerCase();
  }

  setupRecognition() {
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const spokenWord = event.results[0][0].transcript.toLowerCase();
      const confidence = event.results[0][0].confidence;
      this.checkPronunciation(spokenWord, confidence);
    };

    this.recognition.onerror = (event) => {
      console.error('Erro no reconhecimento:', event.error);
      this.updateStatus('Erro no reconhecimento. Tente novamente.');
    };
  }

  setupButtons() {
    this.startButton = document.getElementById('startRecording');
    this.stopButton = document.getElementById('stopRecording');
    this.statusDiv = document.getElementById('recordingStatus');
    this.resultDiv = document.getElementById('pronunciationResult');
    this.progressBar = document.querySelector('.progress-bar');
    this.progressDiv = document.querySelector('.progress');

    this.startButton.addEventListener('click', () => this.startRecording());
    this.stopButton.addEventListener('click', () => this.stopRecording());
  }

  startRecording() {
    this.startButton.classList.add('d-none');
    this.stopButton.classList.remove('d-none');
    this.progressDiv.classList.remove('d-none');
    this.updateStatus('Ouvindo...');
    this.resultDiv.textContent = '';
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
    }
  }

  stopRecording() {
    this.startButton.classList.remove('d-none');
    this.stopButton.classList.add('d-none');
    this.updateStatus('');
    this.recognition.stop();
  }

  checkPronunciation(spokenWord, confidence) {
    const similarityScore = this.calculateSimilarity(spokenWord, this.targetWord);
    const lengthPenalty = this.calculateLengthPenalty(spokenWord, this.targetWord);
    const confidenceScore = confidence * 100;
    
    const totalScore = (
      similarityScore * 0.5 +
      confidenceScore * 0.3 +
      lengthPenalty * 0.2
    );

    this.progressBar.style.width = `${totalScore}%`;
    this.progressBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');

    let resultMessage = '';
    let scoreClass = '';
    
    if (spokenWord === this.targetWord) {
      scoreClass = 'bg-success';
      resultMessage = '🎉 Perfeito! Pronúncia exata!';
    } else if (totalScore > 85) {
      scoreClass = 'bg-success';
      resultMessage = '🎉 Excelente pronúncia!';
    } else if (totalScore > 70) {
      scoreClass = 'bg-warning';
      resultMessage = '👍 Boa tentativa! Tente melhorar um pouco mais.';
    } else {
      scoreClass = 'bg-danger';
      resultMessage = '😕 Tente novamente. Ouça o áudio para referência.';
    }

    this.progressBar.classList.add(scoreClass);

    this.resultDiv.innerHTML = `
      <div class="mt-3">
        <p><strong>Palavra falada:</strong> ${spokenWord}</p>
        <p><strong>Palavra correta:</strong> ${this.targetWord}</p>
        <p><strong>Precisão total:</strong> ${totalScore.toFixed(1)}%</p>
        <div class="mt-2">
          <p class="mb-1"><strong>Detalhes da análise:</strong></p>
          <ul>
            <li>Similaridade: ${similarityScore.toFixed(1)}%</li>
            <li>Confiança do reconhecimento: ${confidenceScore.toFixed(1)}%</li>
            <li>Precisão do comprimento: ${lengthPenalty.toFixed(1)}%</li>
          </ul>
        </div>
        <p class="mt-2 ${scoreClass === 'bg-success' ? 'text-success' : 
                        scoreClass === 'bg-warning' ? 'text-warning' : 
                        'text-danger'}">
          <strong>${resultMessage}</strong>
        </p>
      </div>
    `;

    this.stopRecording();
  }

  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 100;
    
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 2;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1.5,
          matrix[j - 1][i] + 1.5,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    return Math.max(0, ((maxLength - distance) / maxLength) * 100);
  }

  calculateLengthPenalty(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const lengthDiff = Math.abs(len1 - len2);
    
    if (lengthDiff === 0) return 100;
    
    return Math.max(0, 100 - (lengthDiff * 15));
  }

  updateStatus(message) {
    this.statusDiv.textContent = message;
  }
}

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new PronunciationChecker();
}); 