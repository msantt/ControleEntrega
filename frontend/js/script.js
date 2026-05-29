const API = 'http://127.0.0.1:8000';

/* ==========================================================================
   1. CONTROLE DE ATIVAÇÃO DO MENU SUPERIOR (HEADER)
   ========================================================================== */
const links = document.querySelectorAll('.header div nav ul li a');
links.forEach(link => {
    link.addEventListener('click', () => {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
}); 

/* ==========================================================================
   2. AUTENTICAÇÃO
   ========================================================================== */
function getToken() {
    return localStorage.getItem('token');
}

/* ==========================================================================
   3. DASHBOARD (OTIMIZADO)
   ========================================================================== */
async function carregarDashboard() {
    try {
        // Buscando apenas os pedidos, já que os outros dados não populam os cards atuais
        const res = await fetch(`${API}/pedidos/?limit=1000`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const pedidos = await res.json();

        if (!Array.isArray(pedidos)) return;

        const total = pedidos.length;
        const emTransito = pedidos.filter(p => p.status === 'Em trânsito').length;
        const entregues = pedidos.filter(p => p.status === 'Entregue').length;
        // Ajuste o 'Atrasado' aqui para bater com o padrão String do seu backend
        const atrasados = pedidos.filter(p => p.status === 'Atrasado').length; 

        const cardValues = document.querySelectorAll('.card-value');
        if (cardValues.length >= 4) {
            cardValues[0].textContent = total;
            cardValues[1].textContent = emTransito;
            cardValues[2].textContent = entregues;
            cardValues[3].textContent = atrasados;
        }

    } catch (e) {
        console.error('Erro ao carregar dashboard:', e);
    }
}

/* ==========================================================================
   4. SISTEMA DE ABAS VIA DELEGAÇÃO DE EVENTOS
   ========================================================================== */
document.addEventListener('click', e => {
    if (e.target.classList.contains('tab')) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
        
        e.target.classList.add('active');
        const targetContent = document.getElementById(`tab-${e.target.dataset.tab}`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }
    }
});

/* ==========================================================================
   5. REQUISIÇÕES DE CADASTRO (CRUD)
   ========================================================================== */

// CLIESTE
async function cadastrarCliente() {
    const inputNome = document.getElementById('c-nome');
    const inputCpf = document.getElementById('c-cpf');
    const inputLocalizacao = document.getElementById('c-localizacao');

    const body = {
        nome: inputNome.value,
        cpf: inputCpf.value,
        localizacao: inputLocalizacao.value,
    };

    const res = await fetch(`${API}/clientes/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify(body)
    });

    const msg = document.getElementById('c-msg');
    if (res.ok) {
        msg.textContent = '✅ Cliente cadastrado!';
        msg.style.color = 'green';
        // Limpa os campos após o sucesso
        inputNome.value = '';
        inputCpf.value = '';
        inputLocalizacao.value = '';
    } else {
        msg.textContent = '❌ Erro ao cadastrar';
        msg.style.color = 'red';
    }
}

// ENTREGADOR
async function cadastrarEntregador() {
    const inputNome = document.getElementById('e-nome');
    const inputCpf = document.getElementById('e-cpf');
    const inputTelefone = document.getElementById('e-telefone');

    const body = {
        nome: inputNome.value,
        cpf: inputCpf.value,
        telefone: inputTelefone.value
    };

    const res = await fetch(`${API}/entregadores/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',  
            'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify(body)
    });

    const msg = document.getElementById('e-msg');
    if (res.ok) {
        msg.textContent = '✅ Entregador cadastrado!';
        msg.style.color = 'green';
        inputNome.value = '';
        inputCpf.value = '';
        inputTelefone.value = '';
    } else {
        msg.textContent = '❌ Erro ao cadastrar';
        msg.style.color = 'red';
    }
}

// ENCOMENDA
async function cadastrarEncomenda() {
    const inputNome = document.getElementById('en-nome');
    const inputQuantidade = document.getElementById('en-quantidade');

    const body = {
        nome: inputNome.value,
        quantidade: parseInt(inputQuantidade.value) || 0
    };

    const res = await fetch(`${API}/encomendas/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',   
            'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify(body)
    });

    const msg = document.getElementById('en-msg');
    if (res.ok) {
        msg.textContent = '✅ Encomenda cadastrada!';
        msg.style.color = 'green';
        inputNome.value = '';
        inputQuantidade.value = '';
    } else {
        msg.textContent = '❌ Erro ao cadastrar';
        msg.style.color = 'red';
    }
}

// PEDIDO
async function cadastrarPedido() {
    const inputCliente = document.getElementById('p-cliente');
    const inputEntregador = document.getElementById('p-entregador');
    const inputEncomenda = document.getElementById('p-encomenda');
    const selectStatus = document.getElementById('p-status');

    // DICA: valide se o seu modelo Pydantic espera "id_cliente" ou "cliente_id"
    const body = {
        id_cliente: inputCliente.value,
        id_entregador: inputEntregador.value,
        id_encomenda: inputEncomenda.value,
        status: selectStatus.value
    };

    const res = await fetch(`${API}/pedidos/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify(body)
    });

    const msg = document.getElementById('p-msg');
    if (res.ok) {
        msg.textContent = '✅ Pedido cadastrado!';
        msg.style.color = 'green';
        inputCliente.value = '';
        inputEntregador.value = '';
        inputEncomenda.value = '';
        selectStatus.value = 'Pendente';
        carregarDashboard(); // Atualiza os números no topo na hora!
    } else {
        msg.textContent = '❌ Erro ao cadastrar';
        msg.style.color = 'red';
    }
}

/* ==========================================================================
   6. INICIALIZAÇÃO DA PÁGINA
   ========================================================================== */
async function carregarSecao(id, arquivo) {
    try {
        const res = await fetch(arquivo);
        const html = await res.text();
        document.getElementById(id).innerHTML = html;
    } catch (error) {
        console.error(`Erro ao carregar a seção ${id}:`, error);
    }
}

function alternarSecaoComTransicao(idSecaoAtual, idSecaoDestino) {
    const secaoAtual = document.getElementById(idSecaoAtual);
    const secaoDestino = document.getElementById(idSecaoDestino);

    if (!secaoAtual || !secaoDestino) return;

    // 1. Aplica a animação de saída na seção atual
    secaoAtual.classList.add('secao-saindo');

    // 2. Aguarda a animação de saída terminar (300ms do CSS)
    setTimeout(() => {
        // Esconde de fato a seção antiga e limpa a classe de animação dela
        secaoAtual.classList.add('hidden-secao');
        secaoAtual.classList.remove('secao-saindo');

        // Mostra a nova seção e aplica a animação vindo do inferior
        secaoDestino.classList.remove('hidden-secao');
        secaoDestino.classList.add('secao-entrando');

        // Remove a classe de entrada depois que ela finalizar para não quebrar futuros cliques
        setTimeout(() => {
            secaoDestino.classList.remove('secao-entrando');
        }, 400);

    }, 300); 
}



// Inicializa o app
carregarDashboard();
carregarSecao('cadastros', 'pages/cadastros.html');
carregarSecao('consulta', 'pages/consulta.html');
carregarSecao('atualizar', 'pages/atualizar.html');

