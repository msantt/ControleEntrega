const API = 'http://127.0.0.1:8000';

/* ==========================================================================
   1. CONTROLE DE ATIVAÇÃO DO MENU SUPERIOR (HEADER & SEÇÕES PRINCIPAIS)
   ========================================================================== */
const links = document.querySelectorAll('.header div nav ul li a');

links.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Se for um link de ancoragem interna (ID)
        if (href.startsWith('#')) {
            e.preventDefault(); // Evita o pulo brusco padrão do HTML
            
            // Encontra a seção atual que está visível na tela (ignora o dashboard fixo)
            const secaoAtual = document.querySelector('section:not(.hidden-secao):not(.dashboard)');
            const idDestino = href.replace('#', '');

            // Se clicou no Dashboard, apenas lida com o scroll ou exibição dele
            if (idDestino === 'dashboard') {
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
                return;
            }
            
            // Se houver uma seção ativa e ela for diferente do destino, alterna com transição
            if (secaoAtual && secaoAtual.id !== idDestino) {
                // Atualiza o active no menu superior
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                alternarSecaoComTransicao(secaoAtual.id, idDestino);
            }
        }
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
        const res = await fetch(`${API}/pedidos/?limit=1000`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const pedidos = await res.json();

        if (!Array.isArray(pedidos)) return;

        const total = pedidos.length;
        const emTransito = pedidos.filter(p => p.status === 'Em trânsito').length;
        const entregues = pedidos.filter(p => p.status === 'Entregue').length;
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
   4. SISTEMA DE ABAS INTERNAS (ISOLADO POR SEÇÃO)
   ========================================================================== */
document.addEventListener('click', e => {
    // Verifica se o elemento clicado é uma aba (.tab) e possui o atributo data-tab
    if (e.target.classList.contains('tab') && e.target.dataset.tab) {
        
        // Encontra a seção pai ou container onde essa aba específica está inserida
        const secaoPai = e.target.closest('section') || e.target.closest('.container');
        if (!secaoPai) return;

        // 1. Remove 'active' APENAS das abas que pertencem a este bloco/container
        secaoPai.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        
        // 2. Esconde (.hidden) APENAS os conteúdos que pertencem a este bloco/container
        secaoPai.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
        
        // 3. Ativa a aba atual
        e.target.classList.add('active');
        
        // 4. Mostra o conteúdo correspondente dentro deste escopo (ex: tab-cliente)
        const targetContent = secaoPai.querySelector(`#tab-${e.target.dataset.tab}`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }
    }
});

/* ==========================================================================
   5. REQUISIÇÕES DE CADASTRO (CRUD)
   ========================================================================== */

// CLIENTE
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
        carregarDashboard(); 
    } else {
        msg.textContent = '❌ Erro ao cadastrar';
        msg.style.color = 'red';
    }
}

/* ==========================================================================
   6. INICIALIZAÇÃO E TRANSIÇÃO DE PÁGINAS
   ========================================================================== */
async function carregarSecao(id, arquivo) {
    try {
        const res = await fetch(arquivo);
        const html = await res.text();
        document.getElementById(id).innerHTML = html;
        
        // Começa as seções secundárias escondidas por padrão
        if (id !== 'cadastros') {
            document.getElementById(id).classList.add('hidden-secao');
        }
    } catch (error) {
        console.error(`Erro ao carregar a seção ${id}:`, error);
    }
}

function alternarSecaoComTransicao(idSecaoAtual, idSecaoDestino) {
    const secaoAtual = document.getElementById(idSecaoAtual);
    const secaoDestino = document.getElementById(idSecaoDestino);

    if (!secaoAtual || !secaoDestino) return;

    // Sincroniza o link do menu superior caso a mudança venha de um botão interno
    links.forEach(l => {
        if (l.getAttribute('href') === `#${idSecaoDestino}`) {
            links.forEach(link => link.classList.remove('active'));
            l.classList.add('active');
        }
    });

    // 1. Aplica a animação de saída na seção atual
    secaoAtual.classList.add('secao-saindo');

    // 2. Aguarda os 300ms da animação de saída terminar
    setTimeout(() => {
        secaoAtual.classList.add('hidden-secao');
        secaoAtual.classList.remove('secao-saindo');

        // Mostra a nova seção e dispara a animação vinda de baixo
        secaoDestino.classList.remove('hidden-secao');
        secaoDestino.classList.add('secao-entrando');

        // Limpa a classe de animação após finalizar os 400ms
        setTimeout(() => {
            secaoDestino.classList.remove('secao-entrando');
        }, 400);

    }, 300); 
}

// Inicializa o sistema
carregarDashboard();
carregarSecao('cadastros', 'pages/cadastros.html');
carregarSecao('consulta', 'pages/consulta.html');
carregarSecao('atualizar', 'pages/atualizar.html');

/* ==========================================================================
   5.1. REQUISIÇÕES DE CONSULTA (READ)
   ========================================================================== */

// LISTAR CLIENTES
async function listarClientes() {
    try {
        const res = await fetch(`${API}/clientes/`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const clientes = await res.json();
        const tbody = document.getElementById('tabela-clientes-dados');
        
        if (!tbody) return;
        tbody.innerHTML = ''; // Limpa a linha de exemplo

        if (!Array.isArray(clientes) || clientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Nenhum cliente encontrado.</td></tr>`;
            return;
        }

        clientes.forEach((c, index) => {
    const tr = document.createElement('tr')
    tr.dataset.id = c._id  // guarda o _id escondido na linha
    tr.innerHTML = `
        <td>#${index + 1}</td>
        <td>${c.nome || 'Sem nome'}</td>
        <td>${c.cpf || '-'}</td>
        <td>${c.localizacao || '-'}</td>
        <td>
            <button onclick="editarCliente('${c._id}')">✏️</button>
            <button onclick="deletarCliente('${c._id}')">🗑️</button>
        </td>
    `
    tbody.appendChild(tr)
})
    } catch (e) {
        console.error('Erro ao buscar clientes:', e);
    }
}

// LISTAR ENTREGADORES
async function listarEntregadores() {
    try {
        const res = await fetch(`${API}/entregadores/`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const entregadores = await res.json();
        const tbody = document.getElementById('tabela-entregadores-dados');
        
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(entregadores) || entregadores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Nenhum entregador encontrado.</td></tr>`;
            return;
        }

        entregadores.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${e.nome}</td>
                <td>${e.cpf || '-'}</td>
                <td>${e.telefone || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Erro ao buscar entregadores:', err);
    }
}

// LISTAR ENCOMENDAS
async function listarEncomendas() {
    try {
        const res = await fetch(`${API}/encomendas/`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const encomendas = await res.json();
        const tbody = document.getElementById('tabela-encomendas-dados');
        
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(encomendas) || encomendas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Nenhuma encomenda encontrada.</td></tr>`;
            return;
        }

       encomendas.forEach((en, index) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
        <td>#${index + 1}</td>
        <td>${en.nome}</td>
        <td>${en.quantidade}</td>
    `
    tbody.appendChild(tr)
})
    } catch (err) {
        console.error('Erro ao buscar encomendas:', err);
    }
}

// LISTAR PEDIDOS
async function listarPedidos() {
    try {
        const res = await fetch(`${API}/pedidos/?limit=1000`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const pedidos = await res.json();
        const tbody = document.getElementById('tabela-pedidos-dados');
        
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum pedido encontrado.</td></tr>`;
            return;
        }

        pedidos.forEach((p, index) => {
    let statusColor = 'var(--text-main)';
    if (p.status === 'Em trânsito') statusColor = 'var(--color-transit)';
    if (p.status === 'Entregue') statusColor = 'var(--color-success)';
    if (p.status === 'Cancelado') statusColor = 'var(--color-error)';

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>#${index + 1}</td>
        <td>Cliente #${index + 1}</td>
        <td>Entregador #${index + 1}</td>
        <td>Encomenda #${index + 1}</td>
        <td><span style="color: ${statusColor}; font-weight: bold;">${p.status}</span></td>
    `;
    tbody.appendChild(tr);
});
    } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
    }
}

// Função centralizadora para atualizar todas as tabelas de uma vez
function atualizarTodasAsTabelas() {
    listarClientes();
    listarEntregadores();
    listarEncomendas();
    listarPedidos();
}

async function fazerLogin() {
    const username = document.getElementById('login-user').value
    const password = document.getElementById('login-pass').value

    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${username}&password=${password}`
    })

    const msg = document.getElementById('login-msg')

    if (res.ok) {
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        document.getElementById('modal-login').classList.add('hidden')
        carregarDashboard()
    } else {
        msg.textContent = '❌ Usuário ou senha incorretos'
        msg.style.color = 'red'
    }
}

if (!getToken()) {
    document.getElementById('modal-login').classList.remove('hidden')
}

async function carregarSecao(id, arquivo) {
    try {
        const res = await fetch(arquivo)
        const html = await res.text()
        document.getElementById(id).innerHTML = html

        if (id !== 'cadastros') {
            document.getElementById(id).classList.add('hidden-secao')
        }

        // Carrega os dados quando a seção de consulta for carregada
        if (id === 'consulta') {
            listarClientes()
            listarEntregadores()
            listarEncomendas()
            listarPedidos()
        }

    } catch (error) {
        console.error(`Erro ao carregar a seção ${id}:`, error)
    }
}

// ── ATUALIZAR ────────────────────────────────────────
async function atualizarCliente() {
    const id = document.getElementById('u-c-id').value
    const body = {
        nome: document.getElementById('u-c-nome').value,
        cpf: document.getElementById('u-c-cpf').value,
        localizacao: document.getElementById('u-c-localizacao').value
    }
    const res = await fetch(`${API}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)
    })
    const msg = document.getElementById('u-c-msg')
    msg.textContent = res.ok ? '✅ Cliente atualizado!' : '❌ Erro ao atualizar'
    msg.style.color = res.ok ? 'green' : 'red'
}

async function deletarCliente(id) {
    const idFinal = id || document.getElementById('u-c-id').value
    if (!confirm('Tem certeza que deseja deletar?')) return
    const res = await fetch(`${API}/clientes/${idFinal}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const msg = document.getElementById('u-c-msg')
    msg.textContent = res.ok ? '✅ Cliente deletado!' : '❌ Erro ao deletar'
    msg.style.color = res.ok ? 'green' : 'red'
    if (res.ok) listarClientes()
}

async function atualizarEntregador() {
    const id = document.getElementById('u-e-id').value
    const body = {
        nome: document.getElementById('u-e-nome').value,
        cpf: document.getElementById('u-e-cpf').value,
        telefone: document.getElementById('u-e-telefone').value
    }
    const res = await fetch(`${API}/entregadores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)
    })
    const msg = document.getElementById('u-e-msg')
    msg.textContent = res.ok ? '✅ Entregador atualizado!' : '❌ Erro ao atualizar'
    msg.style.color = res.ok ? 'green' : 'red'
}

async function deletarEntregador(id) {
    const idFinal = id || document.getElementById('u-e-id').value
    if (!confirm('Tem certeza que deseja deletar?')) return
    const res = await fetch(`${API}/entregadores/${idFinal}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const msg = document.getElementById('u-e-msg')
    msg.textContent = res.ok ? '✅ Entregador deletado!' : '❌ Erro ao deletar'
    msg.style.color = res.ok ? 'green' : 'red'
    if (res.ok) listarEntregadores()
}

async function atualizarEncomenda() {
    const id = document.getElementById('u-en-id').value
    const body = {
        nome: document.getElementById('u-en-nome').value,
        quantidade: parseInt(document.getElementById('u-en-quantidade').value)
    }
    const res = await fetch(`${API}/encomendas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)
    })
    const msg = document.getElementById('u-en-msg')
    msg.textContent = res.ok ? '✅ Encomenda atualizada!' : '❌ Erro ao atualizar'
    msg.style.color = res.ok ? 'green' : 'red'
}

async function deletarEncomenda(id) {
    const idFinal = id || document.getElementById('u-en-id').value
    if (!confirm('Tem certeza que deseja deletar?')) return
    const res = await fetch(`${API}/encomendas/${idFinal}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const msg = document.getElementById('u-en-msg')
    msg.textContent = res.ok ? '✅ Encomenda deletada!' : '❌ Erro ao deletar'
    msg.style.color = res.ok ? 'green' : 'red'
    if (res.ok) listarEncomendas()
}

async function atualizarPedido() {
    const id = document.getElementById('u-p-id').value
    const body = {
        id_cliente: document.getElementById('u-p-cliente').value,
        id_entregador: document.getElementById('u-p-entregador').value,
        id_encomenda: document.getElementById('u-p-encomenda').value,
        status: document.getElementById('u-p-status').value
    }
    const res = await fetch(`${API}/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)
    })
    const msg = document.getElementById('u-p-msg')
    msg.textContent = res.ok ? '✅ Pedido atualizado!' : '❌ Erro ao atualizar'
    msg.style.color = res.ok ? 'green' : 'red'
    if (res.ok) carregarDashboard()
}

async function deletarPedido(id) {
    const idFinal = id || document.getElementById('u-p-id').value
    if (!confirm('Tem certeza que deseja deletar?')) return
    const res = await fetch(`${API}/pedidos/${idFinal}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const msg = document.getElementById('u-p-msg')
    msg.textContent = res.ok ? '✅ Pedido deletado!' : '❌ Erro ao deletar'
    msg.style.color = res.ok ? 'green' : 'red'
    if (res.ok) carregarDashboard()
}

// ── BUSCA PARA ATUALIZAR ─────────────────────────────
async function buscarCliente() {
    const nome = document.getElementById('busca-c-nome').value
    const res = await fetch(`${API}/clientes/?nome=${nome}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (!data.length) return alert('Nenhum cliente encontrado!')
    const c = data[0]
    document.getElementById('u-c-id').value = c._id
    document.getElementById('u-c-nome').value = c.nome
    document.getElementById('u-c-cpf').value = c.cpf
    document.getElementById('u-c-localizacao').value = c.localizacao
    document.getElementById('resultado-cliente').style.display = 'flex'
    document.getElementById('resultado-cliente').style.flexDirection = 'column'
    document.getElementById('resultado-cliente').style.gap = '1em'
}

async function buscarEntregador() {
    const nome = document.getElementById('busca-e-nome').value
    const res = await fetch(`${API}/entregadores/?nome=${nome}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (!data.length) return alert('Nenhum entregador encontrado!')
    const e = data[0]
    document.getElementById('u-e-id').value = e._id
    document.getElementById('u-e-nome').value = e.nome
    document.getElementById('u-e-cpf').value = e.cpf
    document.getElementById('u-e-telefone').value = e.telefone
    document.getElementById('resultado-entregador').style.display = 'flex'
    document.getElementById('resultado-entregador').style.flexDirection = 'column'
    document.getElementById('resultado-entregador').style.gap = '1em'
}

async function buscarEncomenda() {
    const nome = document.getElementById('busca-en-nome').value
    const res = await fetch(`${API}/encomendas/?nome=${nome}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (!data.length) return alert('Nenhuma encomenda encontrada!')
    const en = data[0]
    document.getElementById('u-en-id').value = en._id
    document.getElementById('u-en-nome').value = en.nome
    document.getElementById('u-en-quantidade').value = en.quantidade
    document.getElementById('resultado-encomenda').style.display = 'flex'
    document.getElementById('resultado-encomenda').style.flexDirection = 'column'
    document.getElementById('resultado-encomenda').style.gap = '1em'
}

async function buscarPedido() {
    const status = document.getElementById('busca-p-status').value
    const res = await fetch(`${API}/pedidos/?status=${status}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const data = await res.json()
    if (!data.length) return alert('Nenhum pedido encontrado!')
    const p = data[0]
    document.getElementById('u-p-id').value = p._id
    document.getElementById('u-p-cliente').value = p.id_cliente
    document.getElementById('u-p-entregador').value = p.id_entregador
    document.getElementById('u-p-encomenda').value = p.id_encomenda
    document.getElementById('u-p-status').value = p.status
    document.getElementById('resultado-pedido').style.display = 'flex'
    document.getElementById('resultado-pedido').style.flexDirection = 'column'
    document.getElementById('resultado-pedido').style.gap = '1em'
}