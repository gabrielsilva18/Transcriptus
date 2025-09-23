class PhraseRecognition {
  constructor() {
    this.recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    this.setupRecognition();
    this.setupButtons();
    this.currentIndex = null;
    this.isRecording = false;
    this.currentButton = null;

    // Modal elements
    this.modalElement = document.getElementById("pronunciationModal");
    this.modal = new bootstrap.Modal(this.modalElement);
    this.modalPhrase = document.getElementById("modalPhrase");
    this.modalStartBtn = document.getElementById("modalStartRecording");
    this.modalStopBtn = document.getElementById("modalStopRecording");
    this.modalStatus = document.getElementById("modalRecordingStatus");
    this.modalResult = document.getElementById("modalResult");
    this.targetPhrase = "";

    this.setupModal();
  }

  setupModal() {
    document.querySelectorAll(".open-pronunciation-modal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Se já estiver gravando, para a gravação atual
        if (this.isRecording) {
          this.recognition.stop();
        }

        this.targetPhrase = btn.dataset.phrase;
        this.modalPhrase.textContent = this.targetPhrase;
        this.modalResult.innerHTML = "";
        this.modalStatus.textContent = "";
        this.modalStartBtn.classList.remove("d-none");
        this.modalStopBtn.classList.add("d-none");
        this.currentButton = btn;
        this.modal.show();
      });
    });

    this.modalStartBtn.addEventListener("click", () => {
      if (!this.isRecording) {
        console.log("Iniciando gravação...");
        this.recognition.start();
      } else {
        console.warn("Já está gravando!");
      }
    });

    this.modalStopBtn.addEventListener("click", () => {
      this.stopRecording();
    });

    // Garante que ao fechar o modal manualmente, tudo seja resetado
    this.modalElement.addEventListener("hidden.bs.modal", () => {
      console.log("Fechando o modal...");
      this.stopRecording();
    });
  }

  stopRecording() {
    console.log("🛑 Parando gravação...");
    if (this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
    
    // Remove animações
    this.modalStopBtn.style.animation = '';
    
    this.modalStartBtn.classList.remove("d-none");
    this.modalStopBtn.classList.remove("btn-warning");
    this.modalStopBtn.classList.add("btn-danger");
    this.modalStopBtn.classList.add("d-none");
    this.modalStopBtn.innerHTML = `<i class="bi bi-stop-fill"></i> Parar`;
    this.modalStatus.textContent = "";
  }

  setupRecognition() {
    this.recognition.lang = "en-US";
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      console.log("🎤 Gravação iniciada!");
      this.isRecording = true;
      
      // Atualiza visual do modal
      this.modalStartBtn.classList.add("d-none");
      this.modalStopBtn.classList.remove("d-none");
      this.modalStopBtn.classList.remove("btn-danger");
      this.modalStopBtn.classList.add("btn-warning");
      this.modalStopBtn.innerHTML = `<i class="bi bi-record-fill text-danger"></i> Gravando... Clique para parar`;
      this.modalStatus.textContent = "🎤 Ouvindo...";
      
      // Força a aplicação das animações CSS
      setTimeout(() => {
        this.modalStopBtn.style.animation = 'recordingPulse 1.5s infinite';
      }, 100);
    };

    this.recognition.onend = () => {
      console.log("🛑 Gravação finalizada!");
      this.isRecording = false;
      
      // Remove animações
      this.modalStopBtn.style.animation = '';
      
      // Restaura visual do modal
      this.modalStartBtn.classList.remove("d-none");
      this.modalStopBtn.classList.remove("btn-warning");
      this.modalStopBtn.classList.add("btn-danger");
      this.modalStopBtn.classList.add("d-none");
      this.modalStopBtn.innerHTML = `<i class="bi bi-stop-fill"></i> Parar`;
      this.modalStatus.textContent = "";
    };

    this.recognition.onresult = (event) => {
      const spokenPhrase = event.results[0][0].transcript.toLowerCase();
      const confidence = event.results[0][0].confidence;
      this.checkPronunciation(spokenPhrase, confidence);
    };

    this.recognition.onerror = (event) => {
      console.error("Erro no reconhecimento:", event.error);
      this.stopRecording();
      this.modalStatus.textContent = "Erro no reconhecimento. Tente novamente.";
    };
  }

  setupButtons() {
    document.querySelectorAll(".practice-mic-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (this.isRecording) {
          this.stopRecording();
        } else {
          if (this.currentIndex !== null) {
            this.clearResults(this.currentIndex);
          }
          this.currentIndex = button.dataset.index;
          this.targetPhrase = button.dataset.phrase;
          this.clearResults(this.currentIndex);
          this.recognition.start();
        }
      });
    });
  }

  clearResults(index) {
    const button = document.querySelector(
      `.practice-mic-button[data-index="${index}"]`
    );
    if (!button) {
      console.error(`Botão com data-index="${index}" não encontrado.`);
      return;
    }

    const feedback = button
      .closest(".phrase-box")
      ?.querySelector(".practice-feedback");
    const result = document.getElementById(`result-${index}`);
    const progress = document.getElementById(`progress-${index}`);

    if (feedback) feedback.classList.remove("active");
    if (result) {
      result.textContent = "";
      result.className = "practice-result";
    }
    if (progress) {
      progress.classList.add("d-none");
      progress.querySelector(".progress-bar").style.width = "0%";
    }
  }

  checkPronunciation(spokenPhrase, confidence) {
    const similarityScore = this.calculateSimilarity(
      spokenPhrase,
      this.targetPhrase
    );
    
    // normaliza de novo para igualdade exata
    const normalize = (str) =>
      str.toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
    
    if (normalize(spokenPhrase) === normalize(this.targetPhrase)) {
      this.modalResult.innerHTML = `
        <div>
          <p><strong>Sua frase:</strong> ${spokenPhrase}</p>
          <p><strong>Precisão:</strong> 100%</p>
          <p class="text-success"><strong>🎉 Excelente pronúncia!</strong></p>
        </div>
      `;
      return;
    }
    
    // novo peso: 90% texto, 10% confiança
    const totalScore = similarityScore * 0.9 + confidence * 10;
    
    let message = "";
    let resultClass = "";
    
    if (totalScore > 90) {
      message = "🎉 Excelente pronúncia!";
      resultClass = "text-success";
    } else if (totalScore > 75) {
      message = "👍 Boa tentativa! Continue praticando.";
      resultClass = "text-warning";
    } else {
      message = "😕 Tente novamente. Ouça a frase para referência.";
      resultClass = "text-danger";
    }
    
    this.modalResult.innerHTML = `
      <div>
        <p><strong>Sua frase:</strong> ${spokenPhrase}</p>
        <p><strong>Precisão:</strong> ${totalScore.toFixed(1)}%</p>
        <p class="${resultClass}"><strong>${message}</strong></p>
      </div>
    `;
  }    
  
  calculateSimilarity(str1, str2) {
    // Normalizar strings para comparação mais tolerante (ignora pontuação e case)
    const normalize = (str) => str.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const norm1 = normalize(str1);
    const norm2 = normalize(str2);
    
    // Se as strings normalizadas são idênticas, retorna 100%
    if (norm1 === norm2) return 100;
    
    const len1 = norm1.length;
    const len2 = norm2.length;
    
    // Se uma das strings estiver vazia, retornar 0
    if (len1 === 0 || len2 === 0) return 0;
    
    // Algoritmo de Levenshtein usando strings normalizadas
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,      // inserção
          matrix[j - 1][i] + 1,      // deleção
          matrix[j - 1][i - 1] + cost // substituição
        );
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    
    // Cálculo de similaridade mais generoso
    let similarity = Math.max(0, ((maxLength - distance) / maxLength) * 100);
    
    // Bonus para strings que são muito similares (diferença de 1-2 caracteres)
    if (distance <= 2 && maxLength > 10) {
      similarity = Math.min(100, similarity + 15); // Bonus de 15%
    } else if (distance <= 1 && maxLength > 5) {
      similarity = Math.min(100, similarity + 25); // Bonus de 25%
    }
    
    console.log(`Similaridade normalizada entre "${str1}" e "${str2}": ${similarity.toFixed(1)}% (distância: ${distance})`);
    console.log(`Normalizadas: "${norm1}" vs "${norm2}"`);
    return similarity;
  }
}

// Função para verificar se o usuário está logado
function checkLoginStatus() {
  // Verifica se existe um elemento que indica que o usuário está logado
  const userLoggedIn = document.querySelector('[data-user-logged-in]');
  const isLoggedIn = userLoggedIn !== null;
  
  console.log('🔍 Verificando status de login...');
  console.log('👤 Elemento de usuário encontrado:', userLoggedIn);
  console.log('✅ Usuário logado:', isLoggedIn);
  
  return isLoggedIn;
}

// Função para mostrar modal de login
function showLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'loginRequiredModal';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-person-check me-2"></i>
            Login Necessário
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="text-center">
            <i class="bi bi-lock-fill text-warning" style="font-size: 3rem;"></i>
            <h4 class="mt-3">Faça login para gerar mais conteúdo</h4>
            <p class="text-muted">
              Usuários não logados podem gerar apenas uma vez. 
              Faça login para gerar frases e traduções ilimitadas!
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancelar
          </button>
          <a href="/login?returnTo=${encodeURIComponent(window.location.pathname)}" class="btn btn-primary">
            <i class="bi bi-box-arrow-in-right me-1"></i>
            Fazer Login
          </a>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  
  // Remove o modal do DOM quando fechado
  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
}

// Inicializar quando o documento estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  new PhraseRecognition();

  const loadMoreBtn = document.getElementById('loadMorePhrases');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      try {
        // Verifica se o usuário está logado para múltiplas gerações
        const isLoggedIn = await checkLoginStatus();
        if (!isLoggedIn) {
          showLoginModal();
          return;
        }
        
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Carregando...';
        
        // Coleta frases existentes para evitar duplicatas
        const existingPhrases = Array.from(document.querySelectorAll('.phrase-box')).map(box => {
          const english = box.querySelector('.english-phrase')?.textContent?.trim();
          const portuguese = box.querySelector('.portuguese-phrase')?.textContent?.trim();
          return { english, portuguese };
        }).filter(p => p.english && p.portuguese);
        
        const existingParam = encodeURIComponent(JSON.stringify(existingPhrases));
        const res = await fetch(`/word/${word}/more-phrases?existing=${existingParam}`);
        const data = await res.json();
        
        const container = document.querySelector('.context-container');
        const currentCount = document.querySelectorAll('.phrase-box').length;
        const phrases = data.phrases || [];
        
        console.log('📝 Frases recebidas:', phrases);
        console.log('📊 Total de frases:', phrases.length);
        
        if (phrases.length === 0) {
          // Mostra mensagem quando não há mais frases
          const messageDiv = document.createElement('div');
          messageDiv.className = 'alert alert-info text-center mt-3';
          messageDiv.innerHTML = `
            <i class="bi bi-info-circle me-2"></i>
            ${data.message || 'Não há mais frases únicas disponíveis para esta palavra.'}
          `;
          container.appendChild(messageDiv);
          
          // Desabilita o botão permanentemente
          loadMoreBtn.disabled = true;
          loadMoreBtn.innerHTML = '<i class="bi bi-check-circle"></i> Limite atingido';
          loadMoreBtn.classList.remove('btn-outline-primary');
          loadMoreBtn.classList.add('btn-secondary');
          return;
        }
        
        phrases.forEach((phrase, idx) => {
          const i = currentCount + idx;
          
          // Verifica se as propriedades existem
          if (!phrase.english || !phrase.portuguese) {
            console.warn('Frase inválida encontrada:', phrase);
            return; // Pula esta frase
          }
          
          // Aplica o highlight na palavra pesquisada (considerando variações)
          const highlightedEnglish = phrase.english.replace(
            new RegExp(`\\b${word.replace(/s$/, '')}s?\\b`, 'gi'), 
            (match) => `<mark class="highlight">${match}</mark>`
          );
          
          const html = `
            <div class="row mb-3 phrase-box">
              <div class="col-sm-6">
                <p class="english-phrase">${highlightedEnglish}</p>
              </div>
              <div class="col-sm-6 d-flex align-items-center">
                <span class="arrow-label me-2">→</span>
                <p class="portuguese-phrase mb-0">${phrase.portuguese}</p>
              </div>
              <div class="col-sm-12 mt-2">
                <button class="btn btn-primary practice-mic-button open-pronunciation-modal" data-index="${i}" data-phrase="${phrase.english}">
                  <i class="bi bi-mic-fill"></i> Praticar
                </button>
                <span id="status-${i}" class="ms-3"></span>
              </div>
              <div class="col-sm-12 mt-2">
                <div id="progress-${i}" class="progress d-none">
                  <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                </div>
                <div id="result-${i}" class="practice-result mt-2"></div>
                <div class="practice-feedback d-none"></div>
              </div>
              <hr class="hr-dashed" />
            </div>`;
          container.insertAdjacentHTML('beforeend', html);
        });

        // Re-inicializa handlers dos novos botões
        new PhraseRecognition();
        
        // Se não há mais frases disponíveis, desabilita o botão
        if (!data.hasMore) {
          loadMoreBtn.disabled = true;
          loadMoreBtn.innerHTML = '<i class="bi bi-check-circle"></i> Todas carregadas';
          loadMoreBtn.classList.remove('btn-outline-primary');
          loadMoreBtn.classList.add('btn-success');
        } else {
          // Se ainda há mais frases, reabilita o botão
          loadMoreBtn.disabled = false;
          loadMoreBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Carregar mais frases';
        }
        
      } catch (e) {
        console.error('Erro ao carregar mais frases', e);
        loadMoreBtn.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Erro ao carregar';
        loadMoreBtn.disabled = false;
      }
    });
  }

});
