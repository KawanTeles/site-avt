/**
 * Corrida Primavera Kids - Script do Front-End
 * Organização: Clube de Aventureiros Missão Alagoas
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Elementos do DOM
const form = document.getElementById('registration-form');
const btnFinalizar = document.getElementById('btn-finalizar');
const btnText = btnFinalizar.querySelector('.btn-text');
const btnLoader = btnFinalizar.querySelector('.btn-loader');
const generalError = document.getElementById('general-error');
const generalErrorMsg = document.getElementById('general-error-message');
const registeredCounter = document.getElementById('registered-counter');
const backToTopBtn = document.getElementById('back-to-top');

// Campos do Formulário
const responsavelNome = document.getElementById('responsavel_nome');
const responsavelCpf = document.getElementById('responsavel_cpf');
const responsavelTelefone = document.getElementById('responsavel_telefone');
const responsavelEmail = document.getElementById('responsavel_email');
const participanteNome = document.getElementById('participante_nome');
const participanteNascimento = document.getElementById('participante_nascimento');
const participanteIdade = document.getElementById('participante_idade');
const participanteSexoRadios = document.getElementsByName('participante_sexo');
const infoCidade = document.getElementById('info_cidade');
const infoEmergencia = document.getElementById('info_emergencia');
const declaracaoVerdade = document.getElementById('declaracao_verdade');

// Elementos da Tela de Sucesso
const successScreen = document.getElementById('success-screen');
const successTicketId = document.getElementById('success-ticket-id');
const successKidName = document.getElementById('success-kid-name');
const successParentName = document.getElementById('success-parent-name');
const btnSuccessClose = document.getElementById('btn-success-close');

// Estado da Conexão com a API Backend
let isBackendOnline = false;

/* -------------------------------------------------------------
   1. Inicialização e Monitoramento
------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  checkBackendStatus();
  setupMasks();
  setupEventListeners();
  updateProgressBar();
});

// Verifica se o backend Express está online
async function checkBackendStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/inscricoes/stats`, { method: 'GET' });
    if (response.ok) {
      isBackendOnline = true;
      const stats = await response.json();
      animateCounter(stats.total);
      console.log('Conexão estabelecida com o servidor backend SQLite.');
    } else {
      throw new Error();
    }
  } catch (error) {
    isBackendOnline = false;
    console.warn('Backend offline. Utilizando LocalStorage como fallback temporário.');
    // Carrega dados fictícios / salvos no LocalStorage para demonstração
    const localInscricoes = getLocalStorageInscricoes();
    animateCounter(localInscricoes.length);
  }
}

// Animação numérica simples para o contador de inscritos
function animateCounter(targetValue) {
  let startValue = 0;
  const duration = 1000; // ms
  const stepTime = Math.abs(Math.floor(duration / (targetValue || 1)));
  
  if (targetValue === 0) {
    registeredCounter.textContent = '0';
    return;
  }
  
  const timer = setInterval(() => {
    startValue += 1;
    registeredCounter.textContent = startValue;
    if (startValue >= targetValue) {
      clearInterval(timer);
      registeredCounter.textContent = targetValue;
    }
  }, Math.max(stepTime, 20));
}

/* -------------------------------------------------------------
   2. Máscaras de Entrada (CPF e Telefone)
------------------------------------------------------------- */
function setupMasks() {
  // Máscara de CPF: 000.000.000-00
  responsavelCpf.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (val.length > 11) val = val.substring(0, 11);
    
    // Formatação
    if (val.length > 9) {
      val = `${val.substring(0, 3)}.${val.substring(3, 6)}.${val.substring(6, 9)}-${val.substring(9)}`;
    } else if (val.length > 6) {
      val = `${val.substring(0, 3)}.${val.substring(3, 6)}.${val.substring(6)}`;
    } else if (val.length > 3) {
      val = `${val.substring(0, 3)}.${val.substring(3)}`;
    }
    
    e.target.value = val;
    validateField(responsavelCpf, val.length === 14);
    updateProgressBar();
  });

  // Máscara de Telefone: (00) 90000-0000 ou (00) 0000-0000
  const aplicarMascaraTelefone = (inputElement) => {
    inputElement.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 11) val = val.substring(0, 11);
      
      if (val.length > 10) {
        val = `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
      } else if (val.length > 5) {
        val = `(${val.substring(0, 2)}) ${val.substring(2, 6)}-${val.substring(6)}`;
      } else if (val.length > 2) {
        val = `(${val.substring(0, 2)}) ${val.substring(2)}`;
      } else if (val.length > 0) {
        val = `(${val}`;
      }
      
      e.target.value = val;
      // Validação: celular completo tem 15 caracteres: (99) 99999-9999
      validateField(inputElement, val.length === 15 || val.length === 14);
      updateProgressBar();
    });
  };

  aplicarMascaraTelefone(responsavelTelefone);
  aplicarMascaraTelefone(infoEmergencia);
}

/* -------------------------------------------------------------
   3. Cálculo Automático da Idade
------------------------------------------------------------- */
participanteNascimento.addEventListener('input', (e) => {
  const dataNascimento = new Date(e.target.value);
  const dataHoje = new Date();
  
  if (isNaN(dataNascimento.getTime())) {
    participanteIdade.value = '';
    validateField(participanteNascimento, false);
    return;
  }
  
  // Cálculo exato da idade em anos
  let idade = dataHoje.getFullYear() - dataNascimento.getFullYear();
  const mesDiff = dataHoje.getMonth() - dataNascimento.getMonth();
  const diaDiff = dataHoje.getDate() - dataNascimento.getDate();
  
  if (mesDiff < 0 || (mesDiff === 0 && diaDiff < 0)) {
    idade--;
  }

  // Regras de validação de idade da Corrida Kids (geralmente entre 2 e 15 anos)
  if (idade >= 0 && idade <= 16) {
    participanteIdade.value = `${idade} ${idade === 1 ? 'ano' : 'anos'}`;
    validateField(participanteNascimento, true);
  } else {
    participanteIdade.value = 'Idade inválida';
    validateField(participanteNascimento, false); // Força erro se for negativo ou maior que 16
  }
  updateProgressBar();
});

/* -------------------------------------------------------------
   4. Validação de Campos em Tempo Real
------------------------------------------------------------- */
function setupEventListeners() {
  // Nome do Responsável (Exige pelo menos nome e sobrenome)
  responsavelNome.addEventListener('input', () => {
    const val = responsavelNome.value.trim();
    const isValid = val.split(' ').filter(n => n.length > 1).length >= 2;
    validateField(responsavelNome, isValid);
    updateProgressBar();
  });

  // E-mail
  responsavelEmail.addEventListener('input', () => {
    const val = responsavelEmail.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validateField(responsavelEmail, emailRegex.test(val));
    updateProgressBar();
  });

  // Nome da Criança
  participanteNome.addEventListener('input', () => {
    const val = participanteNome.value.trim();
    validateField(participanteNome, val.length >= 3);
    updateProgressBar();
  });

  // Sexo (Radios)
  participanteSexoRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const parent = radio.closest('.form-group');
      if (parent) {
        parent.classList.remove('error');
        parent.classList.add('success');
      }
      updateProgressBar();
    });
  });

  // Cidade
  infoCidade.addEventListener('input', () => {
    validateField(infoCidade, infoCidade.value.trim().length >= 3);
    updateProgressBar();
  });

  // Checkbox de Declaração
  declaracaoVerdade.addEventListener('change', () => {
    const wrapper = declaracaoVerdade.closest('.checkbox-wrapper');
    if (declaracaoVerdade.checked) {
      wrapper.classList.remove('error');
    } else {
      wrapper.classList.add('error');
    }
    updateProgressBar();
  });

  // Fechar tela de sucesso e reiniciar formulário
  btnSuccessClose.addEventListener('click', () => {
    successScreen.classList.add('hidden');
    form.reset();
    
    // Limpa classes de validação
    document.querySelectorAll('.form-group').forEach(grp => {
      grp.classList.remove('success', 'error');
    });
    
    // Rola de volta para o início suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Atualiza progresso e atualiza o contador
    updateProgressBar();
    checkBackendStatus();
  });

  // Efeito do botão Voltar ao Topo
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.remove('hidden');
    } else {
      backToTopBtn.classList.add('hidden');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Atalho secreto teclado (Ctrl + Shift + A) para ir para o painel admin
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      window.location.href = 'admin.html';
    }
  });

  // Cliques duplos no logo do cabeçalho redirecionam para o admin
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.style.cursor = 'pointer'; // Adiciona dica sutil sob hover do mouse
    headerLogo.addEventListener('dblclick', () => {
      window.location.href = 'admin.html';
    });
  }
}

// Utilitário para adicionar/remover classes de erro/sucesso do input
function validateField(inputElement, isValid) {
  const formGroup = inputElement.closest('.form-group');
  if (!formGroup) return;

  if (isValid) {
    formGroup.classList.remove('error');
    formGroup.classList.add('success');
  } else {
    formGroup.classList.remove('success');
    formGroup.classList.add('error');
  }
}

/* -------------------------------------------------------------
   5. Barra de Progresso Interativa
------------------------------------------------------------- */
function updateProgressBar() {
  // Definimos os campos obrigatórios a auditar
  const requiredFields = [
    responsavelNome,
    responsavelCpf,
    responsavelTelefone,
    responsavelEmail,
    participanteNome,
    participanteNascimento,
    infoCidade,
    infoEmergencia
  ];

  let completed = 0;
  
  // Audita campos text/input básicos
  requiredFields.forEach(field => {
    const group = field.closest('.form-group');
    if (group && group.classList.contains('success')) {
      completed++;
    }
  });

  // Audita Radio (Sexo)
  const isSexoSelected = Array.from(participanteSexoRadios).some(r => r.checked);
  if (isSexoSelected) completed++;

  // Audita Checkbox (Declaração)
  if (declaracaoVerdade.checked) completed++;

  // Total de itens monitorados = 10 (8 campos básicos + 1 radio + 1 checkbox)
  const totalItems = requiredFields.length + 2;
  const progressPercent = Math.round((completed / totalItems) * 100);

  const progressBar = document.getElementById('form-progress');
  progressBar.style.width = `${progressPercent}%`;

  // Atualiza as labels ativas com base na porcentagem
  const labels = document.querySelectorAll('.step-label');
  labels.forEach(label => {
    const step = parseInt(label.getAttribute('data-step'));
    if (step === 1 && progressPercent >= 0) label.classList.add('active');
    else if (step === 2 && progressPercent >= 40) label.classList.add('active');
    else if (step === 3 && progressPercent >= 80) label.classList.add('active');
    else label.classList.remove('active');
  });
}

/* -------------------------------------------------------------
   6. Submissão do Formulário
------------------------------------------------------------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  let hasErrors = false;

  // 1. Validar campos de texto básicos obrigatórios
  const fields = [
    { el: responsavelNome, val: responsavelNome.value.trim().split(' ').filter(n => n.length > 1).length >= 2 },
    { el: responsavelCpf, val: responsavelCpf.value.length === 14 },
    { el: responsavelTelefone, val: responsavelTelefone.value.length === 15 || responsavelTelefone.value.length === 14 },
    { el: responsavelEmail, val: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(responsavelEmail.value.trim()) },
    { el: participanteNome, val: participanteNome.value.trim().length >= 3 },
    { el: participanteNascimento, val: participanteNascimento.value !== '' && participanteIdade.value !== 'Idade inválida' },
    { el: infoCidade, val: infoCidade.value.trim().length >= 3 },
    { el: infoEmergencia, val: infoEmergencia.value.length === 15 || infoEmergencia.value.length === 14 }
  ];

  fields.forEach(f => {
    if (!f.val) {
      validateField(f.el, false);
      hasErrors = true;
    } else {
      validateField(f.el, true);
    }
  });

  // 2. Validar sexo da criança (Radios)
  const selectedSexo = Array.from(participanteSexoRadios).find(r => r.checked);
  const radioGroup = participanteSexoRadios[0].closest('.form-group');
  if (!selectedSexo) {
    if (radioGroup) radioGroup.classList.add('error');
    hasErrors = true;
  } else {
    if (radioGroup) {
      radioGroup.classList.remove('error');
      radioGroup.classList.add('success');
    }
  }

  // 3. Validar Checkbox de Declaração
  const checkboxWrapper = declaracaoVerdade.closest('.checkbox-wrapper');
  if (!declaracaoVerdade.checked) {
    if (checkboxWrapper) checkboxWrapper.classList.add('error');
    hasErrors = true;
  } else {
    if (checkboxWrapper) checkboxWrapper.classList.remove('error');
  }

  // Se houver erro, exibe alerta e rola até ele
  if (hasErrors) {
    generalErrorMsg.textContent = 'Por favor, preencha todos os campos obrigatórios marcados em vermelho.';
    generalError.classList.remove('hidden');
    generalError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Sem erros, prosseguir para envio
  generalError.classList.add('hidden');
  setSubmittingState(true);

  // Extrair idade numérica (ex: "8 anos" -> 8)
  const idadeCalculada = parseInt(participanteIdade.value);

  // Payload da inscrição
  const payload = {
    responsavel_nome: responsavelNome.value.trim(),
    responsavel_cpf: responsavelCpf.value.trim(),
    responsavel_telefone: responsavelTelefone.value.trim(),
    responsavel_email: responsavelEmail.value.trim(),
    participante_nome: participanteNome.value.trim(),
    participante_nascimento: participanteNascimento.value,
    participante_idade: idadeCalculada,
    participante_sexo: selectedSexo.value,
    info_clube: document.getElementById('info_clube').value.trim() || '',
    info_igreja: document.getElementById('info_igreja').value.trim() || '',
    info_cidade: infoCidade.value.trim(),
    info_alergias: document.getElementById('info_alergias').value.trim() || '',
    info_restricoes: document.getElementById('info_restricoes').value.trim() || '',
    info_emergencia: infoEmergencia.value.trim()
  };

  try {
    if (isBackendOnline) {
      // Enviar para o Servidor Backend Express + SQLite
      const response = await fetch(`${API_BASE_URL}/inscricoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showSuccess(result.id, payload.participante_nome, payload.responsavel_nome);
      } else {
        throw new Error(result.error || 'Erro no envio da inscrição.');
      }
    } else {
      // Fallback: Salvar no LocalStorage (Modo Protótipo Offline)
      console.log('Salvando dados no LocalStorage fallback...');
      const localInscricoes = getLocalStorageInscricoes();
      const nextId = localInscricoes.length > 0 ? Math.max(...localInscricoes.map(i => i.id)) + 1 : 1;
      
      const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Maceio' });
      const record = {
        id: nextId,
        ...payload,
        data_inscricao: timestamp
      };
      
      localInscricoes.push(record);
      saveLocalStorageInscricoes(localInscricoes);
      
      // Simular delay do servidor para exibição do loader
      await new Promise(resolve => setTimeout(resolve, 800));
      
      showSuccess(nextId, payload.participante_nome, payload.responsavel_nome);
    }
  } catch (error) {
    console.error('Erro de rede ou de validação:', error);
    generalErrorMsg.textContent = error.message || 'Falha ao enviar inscrição. Verifique sua conexão e tente novamente.';
    generalError.classList.remove('hidden');
    generalError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } finally {
    setSubmittingState(false);
  }
});

// Controla visual do botão de submit durante envio
function setSubmittingState(isSubmitting) {
  if (isSubmitting) {
    btnFinalizar.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
  } else {
    btnFinalizar.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

// Exibe a tela final de sucesso (Ingresso Digital)
function showSuccess(ticketId, childName, parentName) {
  // Preenche dados do ticket digital
  successTicketId.textContent = `#${String(ticketId).padStart(4, '0')}`;
  successKidName.textContent = childName;
  successParentName.textContent = parentName;
  
  // Mostra o modal de overlay
  successScreen.classList.remove('hidden');
}

/* -------------------------------------------------------------
   7. Helpers do LocalStorage (Fallback offline)
------------------------------------------------------------- */
function getLocalStorageInscricoes() {
  const data = localStorage.getItem('primavera_kids_inscricoes');
  return data ? JSON.parse(data) : [];
}

function saveLocalStorageInscricoes(array) {
  localStorage.setItem('primavera_kids_inscricoes', JSON.stringify(array));
}
