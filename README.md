# Corrida Primavera Kids - Ficha de Inscrição & Painel Administrativo

Este é um projeto completo desenvolvido em **HTML5**, **CSS3 (Vanilla CSS)** e **JavaScript (Vanilla JS)** para o **Clube de Aventureiros Missão Alagoas**. O site é destinado às inscrições da **Corrida Primavera Kids**, contendo uma página pública de inscrições e um Painel Administrativo de gestão.

---

## 🎨 Temática e Design

O design foi inspirado nos temas solicitados: **Primavera, Natureza, Crianças, Aventura, Caminhada e Fé (Ambiente Cristão)**.
* **Cores Utilizadas:** HSL e Hexadecimais harmonizados com base nas cores Verde, Azul, Amarelo, Vermelho e Branco.
* **Tipografia:** Fontes do Google Fonts — `Fredoka` (para títulos amigáveis e infantis) e `Inter` (para textos limpos e legíveis).
* **Elementos Visuais:** Efeitos flutuantes de folhas, nuvens e flores criados dinamicamente no CSS. Banner e logo gerados com Inteligência Artificial integrados ao cabeçalho e rodapé.
* **Responsividade:** O site foi projetado para funcionar perfeitamente em celulares, tablets e computadores de qualquer resolução.

---

## 🚀 Funcionalidades

### Página Inicial & Formulário (`index.html`, `style.css`, `script.js`)
1. **Banner e Informações:** Cabeçalho com o banner do evento, detalhes rápidos de data (09 de Julho) e horário (16:00), com botão de rolagem suave.
2. **Contador em Tempo Real:** Mostra dinamicamente quantas crianças já foram inscritas no evento, integrando diretamente com as estatísticas do servidor de banco de dados.
3. **Barra de Progresso:** Um indicador visual no topo do formulário que avança de 0% a 100% à medida que os campos obrigatórios são preenchidos corretamente.
4. **Máscaras de Entrada:** Máscara de CPF (`000.000.000-00`) e Telefones WhatsApp (`(00) 90000-0000`).
5. **Cálculo de Idade Automático:** A idade do participante é calculada instantaneamente no momento em que a data de nascimento é preenchida.
6. **Validação Visual e Amigável:** Inputs mudam de cor (borda verde/vermelha) com ícones de validação integrados e mensagens de erro específicas abaixo de cada campo.
7. **Ingresso Digital de Sucesso:** Após concluir a inscrição, uma tela animada exibe um ingresso digital no estilo de "ticket" destacável com o nome do participante, responsável e número da inscrição (ID).
8. **Voltar ao Topo:** Botão flutuante para subir a página de forma rápida e confortável.

### Painel Administrativo (`admin.html`, `admin.css`, `admin.js`)
1. **Acesso Discreto (Entradas Escondidas):** Para manter o painel administrativo acessível a partir da página inicial de forma discreta (sem chamar a atenção de usuários comuns), implementamos três atalhos secretos:
   * **Cadeado no Rodapé:** No final dos direitos autorais (rodapé da página principal), há um ícone de cadeado (`🔒`) muito sutil com 85% de transparência que redireciona para o painel administrativo.
   * **Clique Duplo no Logo:** Dar um clique duplo no logotipo do cabeçalho da página principal abre a tela de login administrativo.
   * **Atalho de Teclado:** Pressionar `Ctrl + Shift + A` em qualquer parte da página principal redireciona instantaneamente para o painel administrativo.
2. **Login Protetor por Senha:** Senha de acesso inicial: **`1844`**. Contém recurso de visibilidade de senha (ícone de olho) e aviso legal sobre segurança de produção.
2. **Estatísticas Rápidas (Cards):** Total de inscritos, total de meninos, total de meninas, contagem de cidades e quantidade de clubes únicos cadastrados.
3. **Barra de Pesquisa Dinâmica:** Busca instantânea e filtrada por qualquer termo (nome da criança, do responsável, clube de aventureiros, igreja ou cidade) sem necessidade de refresh.
4. **Visualização de Detalhes:** Ficha completa de dados pessoais e de saúde (alergias/restrições) exposta em modal de leitura limpa.
5. **Edição Completa:** Permite atualizar os dados do participante cadastrado com recalculo de idade integrado.
6. **Exclusão com Confirmação:** Modal de dupla confirmação antes de excluir qualquer registro.
7. **Exportar para Excel (CSV):** Exportação inteligente em formato CSV codificado com **UTF-8 BOM** para garantir que caracteres especiais e acentos do português (como "Criança", "Inscrição", etc.) abram perfeitamente no Excel.
8. **Imprimir Lista & PDF:** Folha de estilos CSS específica (`@media print`) que oculta botões, barras de ferramentas, logos e menus de navegação, deixando a folha de impressão (ou PDF) limpa e tabulada no formato de relatório oficial com timestamp de emissão.

### Backend (`/backend/server.js`, `package.json`)
1. **Servidor API:** Desenvolvido em Node.js com Express e CORS.
2. **Banco de Dados SQLite:** Armazenamento persistente no arquivo `/backend/database.db`.
3. **Mecanismo de Fallback Inteligente (JSON):** Se o pacote nativo `sqlite3` falhar em instalar ou inicializar no sistema host do usuário (comum em ambientes Windows sem compiladores C++ nativos), o servidor **automaticamente muda para o modo JSON Fallback**, criando e salvando os registros em `/backend/database_fallback.json` com o mesmo comportamento transacional. Isso garante que o projeto funcione e rode 100% das vezes sem erros de compilação.
4. **Resiliência do Frontend:** O script do site tenta se conectar ao backend. Se o servidor Node.js não estiver rodando localmente no momento da navegação do frontend, o site ativa automaticamente um **modo offline em LocalStorage** para demonstração de uso local (double-click no index.html), sincronizando perfeitamente o contador e persistindo os dados gravados.

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
* Ter o **Node.js** instalado em sua máquina.

### 1. Iniciando o Backend (API + Banco de Dados)
Abra o terminal (Prompt de Comando ou PowerShell) no diretório do projeto e execute:

```bash
# Navegue até a pasta do backend
cd backend

# Inicie o servidor
npm start
```

Você verá a seguinte mensagem no console:
```text
====================================================
Servidor rodando em: http://localhost:3000
Acesse http://localhost:3000/api/inscricoes para ver os dados
Modo de persistência: SQLite Database (ou Fallback JSON)
====================================================
```

### 2. Abrindo o Site e Painel
* **Site de Inscrições:** Abra o arquivo `index.html` em qualquer navegador web (Chrome, Firefox, Edge, etc.).
* **Painel Administrativo:** Abra o arquivo `admin.html` diretamente no navegador. Digite a senha **`1844`** para acessar o painel de gerenciamento.

---

## 📂 Estrutura de Arquivos Criados
* `index.html` — Tela de apresentação, informações da corrida e ficha de inscrição.
* `style.css` — Estilização geral do site, incluindo animações de folhas e flores e o ticket digital.
* `script.js` — Lógica do formulário (máscaras, idade, validação, envio de dados, progresso e offline-fallback).
* `admin.html` — Tela de login do admin, dashboard de estatísticas, filtros de busca e modals.
* `admin.css` — Estilos de dashboard, modals e layouts responsivos de impressão/PDF.
* `admin.js` — Autenticação do painel, filtros de pesquisa dinâmica, edição/exclusão na API, exportação Excel/PDF.
* `assets/imagens/banner.jpg` — Banner da corrida gerado digitalmente.
* `assets/logo/logo.jpg` — Logotipo circular da Corrida Primavera Kids gerado em vetor.
* `backend/package.json` — Dependências do servidor (express, cors, sqlite3).
* `backend/server.js` — Controlador da API Express com lógica de banco de dados dupla (SQLite/JSON).
