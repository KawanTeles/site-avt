/**
 * Corrida Primavera Kids - Script do Painel Administrativo
 * Organização: Clube de Aventureiros Missão Alagoas
 */

const API_BASE_URL = 'http://localhost:3000/api';
const ADMIN_PASSWORD_HASH = '1844'; // Senha estática de protótipo

// Estado Geral do Painel
let isBackendOnline = false;
let allInscricoes = [];
let filteredInscricoes = [];
let currentDeleteId = null;

// Elementos do DOM - Login
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const adminPasswordInput = document.getElementById('admin-password');
const togglePasswordBtn = document.getElementById('toggle-password');
const loginErrorMsg = document.getElementById('login-error-msg');

// Elementos do DOM - Dashboard
const adminDashboard = document.getElementById('admin-dashboard');
const dbStatusBadge = document.getElementById('db-status-badge');
const btnLogout = document.getElementById('btn-logout');
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search-input');
const tableContainer = document.querySelector('.table-section');

// Elementos Estatísticas
const statTotal = document.getElementById('stat-total');
const statMeninos = document.getElementById('stat-meninos');
const statMeninas = document.getElementById('stat-meninas');
const statCidades = document.getElementById('stat-cidades');
const statClubes = document.getElementById('stat-clubes');

// Elementos Exportação
const btnExportExcel = document.getElementById('btn-export-excel');
const btnExportPdf = document.getElementById('btn-export-pdf');
const btnPrint = document.getElementById('btn-print');

// Formulário de Edição
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editRespNome = document.getElementById('edit_resp_nome');
const editRespCpf = document.getElementById('edit_resp_cpf');
const editRespTel = document.getElementById('edit_resp_tel');
const editRespEmail = document.getElementById('edit_resp_email');
const editPartNome = document.getElementById('edit_part_nome');
const editPartNasc = document.getElementById('edit_part_nasc');
const editPartIdade = document.getElementById('edit_part_idade');
const editPartSexoRadios = document.getElementsByName('edit_part_sexo');
const editInfoClube = document.getElementById('edit_info_clube');
const editInfoIgreja = document.getElementById('edit_info_igreja');
const editInfoCidade = document.getElementById('edit_info_cidade');
const editInfoEmergencia = document.getElementById('edit_info_emergencia');
const editInfoAlergias = document.getElementById('edit_info_alergias');
const editInfoRestricoes = document.getElementById('edit_info_restricoes');

/* -------------------------------------------------------------
   1. Ciclo de Vida e Autenticação
------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se já está autenticado nesta sessão
  if (sessionStorage.getItem('admin_logged') === 'true') {
    loginOverlay.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    initializeDashboard();
  } else {
    adminPasswordInput.focus();
  }

  setupAuthEvents();
});

function setupAuthEvents() {
  // Toggle Mostrar/Esconder Senha
  togglePasswordBtn.addEventListener('click', () => {
    if (adminPasswordInput.type === 'password') {
      adminPasswordInput.type = 'text';
      togglePasswordBtn.textContent = '🙈';
    } else {
      adminPasswordInput.type = 'password';
      togglePasswordBtn.textContent = '👁️';
    }
  });

  // Envio do Formulário de Login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPassword = adminPasswordInput.value.trim();

    if (enteredPassword === ADMIN_PASSWORD_HASH) {
      // Login Bem-Sucedido
      sessionStorage.setItem('admin_logged', 'true');
      loginErrorMsg.classList.add('hidden');
      
      // Animação de transição suave
      loginOverlay.style.opacity = '0';
      loginOverlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        loginOverlay.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        initializeDashboard();
      }, 300);
    } else {
      // Login Falhou
      loginErrorMsg.classList.remove('hidden');
      adminPasswordInput.value = '';
      adminPasswordInput.focus();
    }
  });

  // Logout
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('admin_logged');
    window.location.reload();
  });
}

/* -------------------------------------------------------------
   2. Inicialização do Painel de Controle
------------------------------------------------------------- */
async function initializeDashboard() {
  await checkBackendStatus();
  await loadInscricoes();
  setupDashboardEvents();
}

// Verifica conexão com backend API
async function checkBackendStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/inscricoes/stats`, { method: 'GET' });
    if (response.ok) {
      isBackendOnline = true;
      dbStatusBadge.textContent = 'Online (SQLite)';
      dbStatusBadge.className = 'db-status-badge online';
    } else {
      throw new Error();
    }
  } catch (error) {
    isBackendOnline = false;
    dbStatusBadge.textContent = 'Offline (Local)';
    dbStatusBadge.className = 'db-status-badge offline';
    console.warn('Backend indisponível. Utilizando base LocalStorage.');
  }
}

// Configura eventos da página do Painel
function setupDashboardEvents() {
  // Campo de pesquisa dinâmica (Debounce simples)
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filterData(searchInput.value);
    }, 200);
  });

  // Ações de Exportação
  btnExportExcel.addEventListener('click', exportToExcel);
  btnExportPdf.addEventListener('click', exportToPdf);
  btnPrint.addEventListener('click', () => window.print());

  // Configurar máscara de idade no formulário de edição
  editPartNasc.addEventListener('input', recalculateEditAge);

  // Submissão do Formulário de Edição
  editForm.addEventListener('submit', handleEditSubmit);

  // Confirmação de Exclusão
  document.getElementById('btn-confirm-delete').addEventListener('click', executeDelete);
  
  // Set da data de impressão no cabeçalho do documento para impressão
  window.addEventListener('beforeprint', () => {
    const dataFormatted = new Date().toLocaleString('pt-BR');
    tableContainer.setAttribute('data-printed', dataFormatted);
  });
}

/* -------------------------------------------------------------
   3. Carregamento e Renderização de Dados
------------------------------------------------------------- */
async function loadInscricoes() {
  try {
    if (isBackendOnline) {
      // Carrega dados da API Backend SQLite
      const response = await fetch(`${API_BASE_URL}/inscricoes`);
      if (response.ok) {
        allInscricoes = await response.json();
      } else {
        throw new Error('Erro ao buscar dados da API.');
      }
    } else {
      // Carrega dados do LocalStorage Fallback
      allInscricoes = getLocalStorageInscricoes();
    }
    
    filteredInscricoes = [...allInscricoes];
    renderStats();
    renderTable();
  } catch (err) {
    console.error('Falha ao carregar inscrições:', err);
    tableBody.innerHTML = `<tr><td colspan="9" class="td-empty text-danger">Falha ao carregar inscrições: ${err.message}</td></tr>`;
  }
}

// Renderiza os Cards de Estatísticas superiores
function renderStats() {
  const total = allInscricoes.length;
  const meninos = allInscricoes.filter(i => i.participante_sexo === 'M').length;
  const meninas = allInscricoes.filter(i => i.participante_sexo === 'F').length;
  
  const cidadesUnicas = [...new Set(allInscricoes.map(i => i.info_cidade.trim().toLowerCase()))].length;
  const clubesUnicos = [...new Set(allInscricoes.map(i => i.info_clube).filter(c => c && c.trim() !== '').map(c => c.trim().toLowerCase()))].length;

  statTotal.textContent = total;
  statMeninos.textContent = meninos;
  statMeninas.textContent = meninas;
  statCidades.textContent = cidadesUnicas;
  statClubes.textContent = clubesUnicos;
}

// Renderiza a lista de inscritos na Tabela
function renderTable() {
  if (filteredInscricoes.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" class="td-empty">Nenhuma inscrição encontrada.</td></tr>`;
    return;
  }

  tableBody.innerHTML = '';
  
  filteredInscricoes.forEach(ins => {
    const tr = document.createElement('tr');
    
    // Configura pilhas de saúde
    let healthHtml = '';
    if (ins.info_alergias || ins.info_restricoes) {
      if (ins.info_alergias) {
        healthHtml += `<span class="health-pill health-alergia" title="Alergia: ${ins.info_alergias}">⚠️ Alergia</span> `;
      }
      if (ins.info_restricoes) {
        healthHtml += `<span class="health-pill health-restricao" title="Restrição: ${ins.info_restricoes}">🥗 Restrição</span>`;
      }
    } else {
      healthHtml = '<span class="health-pill health-none">Nenhuma</span>';
    }

    // Clube & Cidade formato
    const clubeCidade = ins.info_clube 
      ? `<strong>${ins.info_clube}</strong><br><small>${ins.info_cidade}</small>`
      : `<small>${ins.info_cidade}</small>`;

    tr.innerHTML = `
      <td class="td-kid-name">${escapeHtml(ins.participante_nome)}</td>
      <td>${ins.participante_idade} ${ins.participante_idade === 1 ? 'ano' : 'anos'}</td>
      <td><span class="sex-badge sex-${ins.participante_sexo.toLowerCase()}">${ins.participante_sexo}</span></td>
      <td>${escapeHtml(ins.responsavel_nome)}</td>
      <td class="td-contact">
        <span class="c-phone">${ins.responsavel_telefone}</span>
        <span class="c-email">${escapeHtml(ins.responsavel_email)}</span>
      </td>
      <td>${clubeCidade}</td>
      <td class="health-pill-container">${healthHtml}</td>
      <td><small>${ins.data_inscricao.split(' ')[0]}</small></td>
      <td class="td-actions no-print">
        <button class="btn-table-action btn-view" title="Visualizar Ficha Completa" onclick="openViewModal(${ins.id})">👁️</button>
        <button class="btn-table-action btn-edit" title="Editar Ficha" onclick="openEditModal(${ins.id})">✏️</button>
        <button class="btn-table-action btn-delete" title="Excluir Inscrição" onclick="openDeleteModal(${ins.id}, '${escapeQuote(ins.participante_nome)}')">🗑️</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/* -------------------------------------------------------------
   4. Pesquisa e Filtros
------------------------------------------------------------- */
function filterData(query) {
  const q = query.toLowerCase().trim();
  
  if (q === '') {
    filteredInscricoes = [...allInscricoes];
  } else {
    filteredInscricoes = allInscricoes.filter(ins => {
      return (
        ins.participante_nome.toLowerCase().includes(q) ||
        ins.responsavel_nome.toLowerCase().includes(q) ||
        ins.responsavel_cpf.includes(q) ||
        ins.responsavel_email.toLowerCase().includes(q) ||
        (ins.info_clube && ins.info_clube.toLowerCase().includes(q)) ||
        (ins.info_igreja && ins.info_igreja.toLowerCase().includes(q)) ||
        ins.info_cidade.toLowerCase().includes(q)
      );
    });
  }
  
  renderTable();
}

/* -------------------------------------------------------------
   5. Modais: Visualizar, Editar e Deletar
------------------------------------------------------------- */

// Abre visualização detalhada
window.openViewModal = function(id) {
  const ins = allInscricoes.find(i => i.id === id);
  if (!ins) return;

  // Responsável
  document.getElementById('v-resp-nome').textContent = ins.responsavel_nome;
  document.getElementById('v-resp-cpf').textContent = ins.responsavel_cpf;
  document.getElementById('v-resp-tel').textContent = ins.responsavel_telefone;
  document.getElementById('v-resp-email').textContent = ins.responsavel_email;

  // Criança
  document.getElementById('v-part-nome').textContent = ins.participante_nome;
  document.getElementById('v-part-nasc').textContent = formatDateBR(ins.participante_nascimento);
  document.getElementById('v-part-idade').textContent = `${ins.participante_idade} ${ins.participante_idade === 1 ? 'ano' : 'anos'}`;
  document.getElementById('v-part-sexo').textContent = ins.participante_sexo === 'M' ? 'Masculino' : 'Feminino';

  // Aventura
  document.getElementById('v-info-clube').textContent = ins.info_clube || 'Nenhum';
  document.getElementById('v-info-igreja').textContent = ins.info_igreja || 'Nenhuma';
  document.getElementById('v-info-cidade').textContent = ins.info_cidade;
  document.getElementById('v-info-emergencia').textContent = ins.info_emergencia;

  // Saúde
  document.getElementById('v-info-alergias').textContent = ins.info_alergias || 'Nenhuma informada';
  document.getElementById('v-info-restricoes').textContent = ins.info_restricoes || 'Nenhuma informada';

  // Meta
  document.getElementById('v-meta-data').textContent = ins.data_inscricao;
  document.getElementById('v-meta-id').textContent = String(ins.id).padStart(4, '0');

  openModal('modal-view');
};

// Abre formulário de edição
window.openEditModal = function(id) {
  const ins = allInscricoes.find(i => i.id === id);
  if (!ins) return;

  editIdInput.value = ins.id;
  editRespNome.value = ins.responsavel_nome;
  editRespCpf.value = ins.responsavel_cpf;
  editRespTel.value = ins.responsavel_telefone;
  editRespEmail.value = ins.responsavel_email;
  
  editPartNome.value = ins.participante_nome;
  editPartNasc.value = ins.participante_nascimento;
  editPartIdade.value = `${ins.participante_idade} ${ins.participante_idade === 1 ? 'ano' : 'anos'}`;
  
  // Set Sexo radio
  if (ins.participante_sexo === 'M') {
    editPartSexoRadios[0].checked = true;
  } else {
    editPartSexoRadios[1].checked = true;
  }

  editInfoClube.value = ins.info_clube;
  editInfoIgreja.value = ins.info_igreja;
  editInfoCidade.value = ins.info_cidade;
  editInfoEmergencia.value = ins.info_emergencia;
  editInfoAlergias.value = ins.info_alergias;
  editInfoRestricoes.value = ins.info_restricoes;

  openModal('modal-edit');
};

// Recalcula idade na edição
function recalculateEditAge() {
  const dataNascimento = new Date(editPartNasc.value);
  const dataHoje = new Date();
  
  if (isNaN(dataNascimento.getTime())) {
    editPartIdade.value = 'Idade inválida';
    return;
  }
  
  let idade = dataHoje.getFullYear() - dataNascimento.getFullYear();
  const mesDiff = dataHoje.getMonth() - dataNascimento.getMonth();
  const diaDiff = dataHoje.getDate() - dataNascimento.getDate();
  if (mesDiff < 0 || (mesDiff === 0 && diaDiff < 0)) {
    idade--;
  }

  if (idade >= 0 && idade <= 16) {
    editPartIdade.value = `${idade} ${idade === 1 ? 'ano' : 'anos'}`;
  } else {
    editPartIdade.value = 'Idade inválida';
  }
}

// Salva alterações da edição
async function handleEditSubmit(e) {
  e.preventDefault();

  const id = editIdInput.value;
  const selectedSexo = Array.from(editPartSexoRadios).find(r => r.checked);
  const idadeCalculada = parseInt(editPartIdade.value);

  if (isNaN(idadeCalculada)) {
    alert('Por favor, informe uma data de nascimento válida.');
    return;
  }

  const payload = {
    responsavel_nome: editRespNome.value.trim(),
    responsavel_cpf: editRespCpf.value.trim(),
    responsavel_telefone: editRespTel.value.trim(),
    responsavel_email: editRespEmail.value.trim(),
    participante_nome: editPartNome.value.trim(),
    participante_nascimento: editPartNasc.value,
    participante_idade: idadeCalculada,
    participante_sexo: selectedSexo ? selectedSexo.value : 'M',
    info_clube: editInfoClube.value.trim(),
    info_igreja: editInfoIgreja.value.trim(),
    info_cidade: editInfoCidade.value.trim(),
    info_emergencia: editInfoEmergencia.value.trim(),
    info_alergias: editInfoAlergias.value.trim(),
    info_restricoes: editInfoRestricoes.value.trim()
  };

  try {
    if (isBackendOnline) {
      const response = await fetch(`${API_BASE_URL}/inscricoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar alterações.');
      }
    } else {
      // Salva localmente no LocalStorage
      const localInscricoes = getLocalStorageInscricoes();
      const index = localInscricoes.findIndex(i => i.id === parseInt(id));
      if (index !== -1) {
        // Preserva data de inscrição original
        payload.data_inscricao = localInscricoes[index].data_inscricao;
        payload.id = parseInt(id);
        
        localInscricoes[index] = payload;
        saveLocalStorageInscricoes(localInscricoes);
      }
    }

    closeModal('modal-edit');
    await loadInscricoes(); // Recarrega dados
    alert('Inscrição atualizada com sucesso!');
  } catch (err) {
    alert(`Erro ao salvar: ${err.message}`);
  }
}

// Abre confirmação de exclusão
window.openDeleteModal = function(id, name) {
  currentDeleteId = id;
  document.getElementById('delete-name').textContent = name;
  openModal('modal-delete');
};

// Executa exclusão após confirmação
async function executeDelete() {
  if (!currentDeleteId) return;
  
  try {
    if (isBackendOnline) {
      const response = await fetch(`${API_BASE_URL}/inscricoes/${currentDeleteId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao excluir da base.');
      }
    } else {
      // Exclui localmente
      let localInscricoes = getLocalStorageInscricoes();
      localInscricoes = localInscricoes.filter(i => i.id !== currentDeleteId);
      saveLocalStorageInscricoes(localInscricoes);
    }

    closeModal('modal-delete');
    currentDeleteId = null;
    await loadInscricoes();
    alert('Inscrição excluída com sucesso!');
  } catch (err) {
    alert(`Erro ao excluir: ${err.message}`);
  }
}

// Controladores gerais de Modal
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.add('hidden');
};

/* -------------------------------------------------------------
   6. Exportação (Excel e PDF)
------------------------------------------------------------- */

// Exporta dados no formato CSV compatível com Excel (com BOM para aceitação de acentos)
function exportToExcel() {
  if (filteredInscricoes.length === 0) {
    alert('Não há dados filtrados para exportar.');
    return;
  }

  // Cabeçalhos das Colunas
  const headers = [
    'ID', 'Participante Nome', 'Nascimento', 'Idade', 'Sexo', 
    'Responsavel Nome', 'CPF', 'Telefone', 'Email', 
    'Clube', 'Igreja', 'Cidade', 'Emergencia Contato', 
    'Alergias', 'Restricoes', 'Data Inscricao'
  ];

  // Converte linhas para string CSV
  const csvRows = [
    headers.join(';') // Usa ponto-e-vírgula como separador padrão no Excel em português
  ];

  filteredInscricoes.forEach(ins => {
    const row = [
      ins.id,
      cleanCsvField(ins.participante_nome),
      ins.participante_nascimento,
      ins.participante_idade,
      ins.participante_sexo,
      cleanCsvField(ins.responsavel_nome),
      ins.responsavel_cpf,
      ins.responsavel_telefone,
      ins.responsavel_email,
      cleanCsvField(ins.info_clube),
      cleanCsvField(ins.info_igreja),
      cleanCsvField(ins.info_cidade),
      ins.info_emergencia,
      cleanCsvField(ins.info_alergias),
      cleanCsvField(ins.info_restricoes),
      ins.data_inscricao
    ];
    csvRows.push(row.join(';'));
  });

  // Adiciona BOM (Byte Order Mark) para UTF-8 de forma que o Excel abra os acentos em português corretamente
  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `inscricoes_primavera_kids_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper para limpar campos do CSV
function cleanCsvField(str) {
  if (!str) return '';
  // Substitui pontos-e-vírgulas ou quebras de linha para não quebrar o layout do CSV
  return str.replace(/;/g, ',').replace(/\r?\n|\r/g, ' ');
}

// Exporta PDF tirando proveito das folhas de estilo @media print do navegador
function exportToPdf() {
  // Configura a data de impressão no contêiner
  const dataFormatted = new Date().toLocaleString('pt-BR');
  tableContainer.setAttribute('data-printed', dataFormatted);
  
  // Aciona impressão (que permite salvar em PDF de forma nativa e fiel aos estilos print)
  window.print();
}

/* -------------------------------------------------------------
   7. Helpers Diversos
------------------------------------------------------------- */
function getLocalStorageInscricoes() {
  const data = localStorage.getItem('primavera_kids_inscricoes');
  return data ? JSON.parse(data) : [];
}

function saveLocalStorageInscricoes(array) {
  localStorage.setItem('primavera_kids_inscricoes', JSON.stringify(array));
}

function formatDateBR(dateString) {
  if (!dateString) return '--';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function escapeHtml(string) {
  if (!string) return '';
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeQuote(string) {
  if (!string) return '';
  return string.replace(/'/g, "\\'");
}
