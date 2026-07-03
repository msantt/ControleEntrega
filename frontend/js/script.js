const API = 'http://127.0.0.1:8000';

if (typeof chartProdutividade === 'undefined') {
    var chartProdutividade = null;
}
let periodoAtual = 'semana';

function getToken() {
    return localStorage.getItem('token');
}

function authHeaders(extra = {}) {
    const headers = { ...extra };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

function logout(logout) {
  localStorage.removeItem('token');
  location.reload();
}

function setActiveNav(idDestino) {
    document.querySelectorAll('.header nav a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.header nav a[href="#${idDestino}"]`);
    if (link) link.classList.add('active');
}

function ocultarSecoesExtras() {
    ['cadastros', 'atualizar', 'consulta', 'graficos'].forEach(id => {
        const secao = document.getElementById(id);
        if (secao) secao.classList.add('hidden-secao');
    });
}

function mostrarSecaoUnica(idDestino) {
    ocultarSecoesExtras();
    const secao = document.getElementById(idDestino);
    if (secao) secao.classList.remove('hidden-secao');
}

function mostrarDashboard() {
    const dashboard = document.getElementById('dashboard');
    const grafico = document.getElementById('dashboard-grafico');
    if (dashboard) dashboard.classList.remove('hidden-secao');
    if (grafico) grafico.classList.remove('hidden-secao');

    setTimeout(() => {
        if (chartProdutividade) {
            chartProdutividade.resize();
            chartProdutividade.update();
        }
    }, 80);
}

function ocultarDashboard() {
    const dashboard = document.getElementById('dashboard');
    const grafico = document.getElementById('dashboard-grafico');
    if (dashboard) dashboard.classList.add('hidden-secao');
    if (grafico) grafico.classList.add('hidden-secao');
}

async function carregarSecao(id, arquivo) {
    try {
        const secao = document.getElementById(id);
        if (!secao) return;

        const res = await fetch(arquivo);
        const html = await res.text();
        secao.innerHTML = html;

        if (id !== 'cadastros' && id !== 'dashboard') {
            secao.classList.add('hidden-secao');
        }

        if (id === 'consulta') {
            await listarClientes();
            await listarEntregadores();
            await listarEncomendas();
            await listarPedidos();
        }
    } catch (error) {
        console.error(`Erro ao carregar a seção ${id}:`, error);
    }
}

function montarQuery(campo, valor) {
    const params = new URLSearchParams();
    params.set(campo, valor);
    return params.toString();
}

async function fazerLogin() {
    const username = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value.trim();
    const msg = document.getElementById('login-msg');

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            document.getElementById('modal-login').classList.add('hidden');

            await carregarSecao('cadastros', 'pages/cadastros.html');
            await carregarSecao('consulta', 'pages/consulta.html');
            await carregarSecao('atualizar', 'pages/atualizar.html');
            await carregarSecao('graficos', 'pages/graficos.html');

            ocultarSecoesExtras();
            mostrarDashboard();
            await carregarDashboard();
            initChartButtons();
            setActiveNav('dashboard');
        } else {
            msg.textContent = '❌ Usuário ou senha incorretos';
            msg.style.color = 'red';
        }
    } catch (error) {
        msg.textContent = '❌ Erro ao conectar com a API';
        msg.style.color = 'red';
        console.error(error);
    }
}

function getDataPedido(p) {
    const valor = p.data_entrega || p.created_at || p.data_criacao || p.createdAt || p.data || p.date;
    return new Date(valor);
}

function atualizarGrafico(pedidos, periodo) {
    const canvas = document.getElementById('chartProdutividade');
    if (!canvas) return;

    // --- CORREÇÃO PARA TEMPO REAL ---
    // Se o gráfico já existe na tela, nós DESTRUÍMOS ele por completo.
    // Isso limpa a memória do canvas e garante que o novo dado substitua o antigo sem bugar.
    if (chartProdutividade) {
        chartProdutividade.destroy();
        chartProdutividade = null;
    }

    const agora = new Date();
    const diasMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();

    // Reinicia a base de dados zerada para recalcular do zero com os dados novos em tempo real
    const data = {
        semana: {
            labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            datasets: [
                { label: 'Total', cor: '#ff7a00', valores: Array(7).fill(0) },
                { label: 'Em trânsito', cor: '#f59e0b', valores: Array(7).fill(0) },
                { label: 'Entregues', cor: '#10b981', valores: Array(7).fill(0) },
                { label: 'Cancelados', cor: '#ef4444', valores: Array(7).fill(0) }
            ]
        },
        mes: {
            labels: Array.from({ length: diasMes }, (_, i) => `${i + 1}`),
            datasets: [
                { label: 'Total', cor: '#ff7a00', valores: Array(diasMes).fill(0) },
                { label: 'Em trânsito', cor: '#f59e0b', valores: Array(diasMes).fill(0) },
                { label: 'Entregues', cor: '#10b981', valores: Array(diasMes).fill(0) },
                { label: 'Cancelados', cor: '#ef4444', valores: Array(diasMes).fill(0) }
            ]
        },
        ano: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [
                { label: 'Total', cor: '#ff7a00', valores: Array(12).fill(0) },
                { label: 'Em trânsito', cor: '#f59e0b', valores: Array(12).fill(0) },
                { label: 'Entregues', cor: '#10b981', valores: Array(12).fill(0) },
                { label: 'Cancelados', cor: '#ef4444', valores: Array(12).fill(0) }
            ]
        }
    };

    const basePeriodo = data[periodo];
    if (!basePeriodo) return;

    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    
    const domingoSemana = new Date(hoje);
    domingoSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const sabadoSemana = new Date(domingoSemana);
    sabadoSemana.setDate(domingoSemana.getDate() + 6);

    // Mapeia e distribui os pedidos atuais recebidos por parâmetro
    pedidos.forEach(p => {
        const dt = getDataPedido(p);
        if (isNaN(dt.getTime())) return; 

        const dataPed = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        let idx = -1;

        if (periodo === 'semana') {
            if (dataPed >= domingoSemana && dataPed <= sabadoSemana) {
                idx = dataPed.getDay(); 
            }
        } else if (periodo === 'mes') {
            if (dataPed.getFullYear() === hoje.getFullYear() && dataPed.getMonth() === hoje.getMonth()) {
                idx = dataPed.getDate() - 1; 
            }
        } else if (periodo === 'ano') {
            if (dataPed.getFullYear() === hoje.getFullYear()) {
                idx = dataPed.getMonth(); 
            }
        }

        if (idx < 0) return;

        const status = (p.status || p.status_pedido || '').toString().toLowerCase().trim();
        
        basePeriodo.datasets[0].valores[idx] += 1; // Total geral
        
        if (status.includes('trânsito') || status.includes('transito') || status.includes('rota')) {
            basePeriodo.datasets[1].valores[idx] += 1;
        } else if (status.includes('entregue') || status.includes('concluído') || status.includes('concluido')) {
            basePeriodo.datasets[2].valores[idx] += 1;
        } else if (status.includes('cancelado') || status.includes('devolvido')) {
            basePeriodo.datasets[3].valores[idx] += 1;
        }
    });

    // Como destruímos o gráfico antigo lá em cima, agora criamos uma instância 100% nova e limpa
    const ctx = canvas.getContext('2d');
    chartProdutividade = new Chart(ctx, {
        type: 'line',
        data: {
            labels: basePeriodo.labels,
            datasets: basePeriodo.datasets.map(item => ({
                label: item.label,
                data: item.valores,
                borderColor: item.cor,
                backgroundColor: item.cor,
                borderWidth: 3,
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: item.cor,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'line',
                        boxWidth: 30,
                        color: '#6b7280'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: { color: 'rgba(0,0,0,0.08)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

/* ============================================================
   SUBSTITUA a função carregarDashboard() no seu script.js
   por esta versão. Ela filtra pedidos corrompidos/órfãos
   (sem codigo_identificacao) tanto no card quanto no gráfico,
   pra os dois SEMPRE mostrarem o mesmo número.
   ============================================================ */

async function carregarDashboard() {
    try {
        const res = await fetch(`${API}/pedidos/?limit=1000`, {
            headers: authHeaders()
        });

        const pedidosBrutos = await res.json();
        if (!Array.isArray(pedidosBrutos)) return;

        // Ignora pedidos corrompidos/órfãos (sem codigo_identificacao),
        // pra o card e o gráfico sempre baterem o mesmo número.
        const pedidos = pedidosBrutos.filter(p => p.codigo_identificacao);

        const total = pedidos.length;
        const emTransito = pedidos.filter(p => (p.status || '').toLowerCase() === 'em trânsito').length;
        const entregues = pedidos.filter(p => (p.status || '').toLowerCase() === 'entregue').length;
        const cancelados = pedidos.filter(p => (p.status || '').toLowerCase() === 'cancelado').length;

        const cardValues = document.querySelectorAll('.card-value');
        if (cardValues.length >= 4) {
            cardValues[0].textContent = total;
            cardValues[1].textContent = emTransito;
            cardValues[2].textContent = entregues;
            cardValues[3].textContent = cancelados;
        }

        atualizarGrafico(pedidos, periodoAtual);
    } catch (e) {
        console.error('Erro ao carregar dashboard:', e);
    }
}

function initChartButtons() {
    document.querySelectorAll('[data-periodo]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-periodo]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            periodoAtual = btn.dataset.periodo;
            carregarDashboard();
        });
    });
}

document.querySelectorAll('.header nav ul li a').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        const idDestino = link.getAttribute('href').replace('#', '');
        setActiveNav(idDestino);

        if (idDestino === 'dashboard') {
            ocultarSecoesExtras();
            mostrarDashboard();
            document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
            await carregarDashboard();
            return;
        }

        ocultarDashboard();
        mostrarSecaoUnica(idDestino);
        document.getElementById(idDestino).scrollIntoView({ behavior: 'smooth' });

        if (idDestino === 'consulta') {
            await listarClientes();
            await listarEntregadores();
            await listarEncomendas();
            await listarPedidos();
        }
    });
});

document.addEventListener('click', e => {
    if (e.target.classList.contains('tab') && e.target.dataset.tab) {
        const secaoPai = e.target.closest('#cadastros') || e.target.closest('#atualizar') || e.target.closest('#consulta') || e.target.closest('#graficos');
        if (!secaoPai) return;

        secaoPai.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        secaoPai.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
        e.target.classList.add('active');

        const targetContent = secaoPai.querySelector(`#tab-${e.target.dataset.tab}`);
        if (targetContent) targetContent.classList.remove('hidden');
    }
});

async function cadastrarCliente() {
    const res = await fetch(`${API}/clientes/`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            nome: document.getElementById('c-nome').value.trim(),
            cpf: document.getElementById('c-cpf').value.trim(),
            email: document.getElementById('c-email').value.trim(),
            localizacao: document.getElementById('c-localizacao').value.trim()
        })
    });

    const msg = document.getElementById('c-msg');
    if (res.ok) {
        const data = await res.json();
        const codigo = data.codigo_identificacao || '';
        if (document.getElementById('c-id-gerado')) document.getElementById('c-id-gerado').value = codigo;
        if (msg) {
            msg.textContent = `✅ Cliente cadastrado! Código: ${codigo}`;
            msg.style.color = 'green';
        }
        await carregarDashboard();
    } else {
        if (msg) {
            msg.textContent = '❌ Erro ao cadastrar';
            msg.style.color = 'red';
        }
    }
}

async function cadastrarEntregador() {
    const res = await fetch(`${API}/entregadores/`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            nome: document.getElementById('e-nome').value.trim(),
            cpf: document.getElementById('e-cpf').value.trim(),
            numero: document.getElementById('e-numero').value.trim()
        })
    });

    const msg = document.getElementById('e-msg');
    if (res.ok) {
        const data = await res.json();
        const codigo = data.codigo_identificacao || '';
        if (document.getElementById('e-id-gerado')) document.getElementById('e-id-gerado').value = codigo;
        if (msg) {
            msg.textContent = `✅ Entregador cadastrado! Código: ${codigo}`;
            msg.style.color = 'green';
        }
        await carregarDashboard();
    } else {
        if (msg) {
            msg.textContent = '❌ Erro ao cadastrar';
            msg.style.color = 'red';
        }
    }
}

async function cadastrarEncomenda() {
    const res = await fetch(`${API}/encomendas/`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            nome: document.getElementById('en-nome').value.trim(),
            quantidade: parseInt(document.getElementById('en-quantidade').value) || 0
        })
    });

    const msg = document.getElementById('en-msg');
    if (res.ok) {
        const data = await res.json();
        const codigo = data.codigo_identificacao || '';
        if (document.getElementById('en-id-gerado')) document.getElementById('en-id-gerado').value = codigo;
        if (msg) {
            msg.textContent = `✅ Encomenda cadastrada! Código: ${codigo}`;
            msg.style.color = 'green';
        }
        await carregarDashboard();
    } else {
        if (msg) {
            msg.textContent = '❌ Erro ao cadastrar';
            msg.style.color = 'red';
        }
    }
}

async function cadastrarPedido() {
    const res = await fetch(`${API}/pedidos/`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            id_cliente: document.getElementById('p-id-cliente').value.trim().toUpperCase(),
            id_entregador: document.getElementById('p-id-entregador').value.trim().toUpperCase(),
            id_encomenda: document.getElementById('p-id-encomenda').value.trim().toUpperCase(),
            status: document.getElementById('p-status').value.trim()
        })
    });

    const msg = document.getElementById('p-msg');
    if (msg) {
        msg.textContent = res.ok ? '✅ Pedido cadastrado!' : '❌ Erro ao cadastrar';
        msg.style.color = res.ok ? 'green' : 'red';
    }

    if (res.ok) carregarDashboard();
}

async function listarClientes() {
    const res = await fetch(`${API}/clientes/`, { headers: authHeaders() });
    renderTabelaClientes(await res.json());
}

async function listarEntregadores() {
    const res = await fetch(`${API}/entregadores/`, { headers: authHeaders() });
    renderTabelaEntregadores(await res.json());
}

async function listarEncomendas() {
    const res = await fetch(`${API}/encomendas/`, { headers: authHeaders() });
    renderTabelaEncomendas(await res.json());
}

async function listarPedidos() {
    const res = await fetch(`${API}/pedidos/?limit=1000`, { headers: authHeaders() });
    renderTabelaPedidos(await res.json());
}

/* ============================================================
   SUBSTITUA no seu script.js o bloco inteiro das 4 funções:
   buscarClienteConsulta, buscarEntregadorConsulta,
   buscarEncomendaConsulta, buscarPedidoConsulta
   por TUDO que está neste arquivo.

   O que mudou: só a buscarPedidoConsulta. As outras 3 estão
   idênticas ao que você já tinha (não precisavam de correção).
   ============================================================ */

async function buscarClienteConsulta() {
    const valor = document.getElementById('busca-cliente-consulta').value.trim();
    let url = `${API}/clientes/`;

    if (valor) {
        const busca = detectarTipoBusca(valor);
        url += `?${montarQuery(busca.tipo, busca.valor)}`;
    }

    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return alert('Nenhum cliente encontrado!');

    const resultado = document.getElementById('resultado-cliente-consulta');
    resultado.innerHTML = data.map(c => `
        <div style="margin-bottom:12px; padding:10px; border:1px solid #ccc; border-radius:8px;">
            <p><strong>ID:</strong> ${c.codigo_identificacao || ''}</p>
            <p><strong>Nome:</strong> ${c.nome || ''}</p>
            <p><strong>CPF:</strong> ${c.cpf || ''}</p>
            <p><strong>Email:</strong> ${c.email || ''}</p>
            <p><strong>Localização:</strong> ${c.localizacao || ''}</p>
        </div>
    `).join('');

    resultado.style.display = 'block';
}

async function buscarEntregadorConsulta() {
    const valor = document.getElementById('busca-entregador-consulta').value.trim();
    let url = `${API}/entregadores/`;

    if (valor) {
        const busca = detectarTipoBusca(valor);
        url += `?${montarQuery(busca.tipo, busca.valor)}`;
    }

    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return alert('Nenhum entregador encontrado!');

    const resultado = document.getElementById('resultado-entregador-consulta');
    resultado.innerHTML = data.map(e => `
        <div style="margin-bottom:12px; padding:10px; border:1px solid #ccc; border-radius:8px;">
            <p><strong>ID:</strong> ${e.codigo_identificacao || ''}</p>
            <p><strong>Nome:</strong> ${e.nome || ''}</p>
            <p><strong>CPF:</strong> ${e.cpf || ''}</p>
            <p><strong>Telefone:</strong> ${e.numero || ''}</p>
        </div>
    `).join('');
    resultado.style.display = 'block';
}

async function buscarEncomendaConsulta() {
    const valor = document.getElementById('busca-encomenda-consulta').value.trim();
    let url = `${API}/encomendas/`;

    if (valor) {
        const busca = detectarTipoBusca(valor);
        url += `?${montarQuery(busca.tipo, busca.valor)}`;
    }

    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return alert('Nenhuma encomenda encontrada!');

    const resultado = document.getElementById('resultado-encomenda-consulta');
    resultado.innerHTML = data.map(en => `
        <div style="margin-bottom:12px; padding:10px; border:1px solid #ccc; border-radius:8px;">
            <p><strong>ID:</strong> ${en.codigo_identificacao || ''}</p>
            <p><strong>Nome:</strong> ${en.nome || ''}</p>
            <p><strong>Quantidade:</strong> ${en.quantidade ?? ''}</p>
        </div>
    `).join('');
    resultado.style.display = 'block';
}

async function buscarPedidoConsulta() {
    const buscaValor = document.getElementById('busca-pedido-consulta').value.trim();
    const status = document.getElementById('filtro-status-pedido').value.trim();

    let url = `${API}/pedidos/`;
    const params = new URLSearchParams();

    if (buscaValor) {
        const busca = detectarTipoBusca(buscaValor);
        params.set(busca.tipo, busca.valor);
    }

    if (status) {
        params.set('status', status);
    }

    if ([...params.keys()].length) {
        url += `?${params.toString()}`;
    }

    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return alert('Nenhum pedido encontrado!');

    // Ignora pedidos corrompidos/órfãos (sem codigo_identificacao)
    const pedidosValidos = data.filter(p => p.codigo_identificacao);
    if (!pedidosValidos.length) return alert('Nenhum pedido encontrado!');

    let resultados = pedidosValidos;

    // Se buscou por um valor específico, tenta achar só o registro exato
    if (buscaValor) {
        const valorUpper = buscaValor.toUpperCase();
        const match = pedidosValidos.find(item =>
            (item.codigo_identificacao || '').toUpperCase() === valorUpper ||
            (item.cliente_codigo || item.id_cliente || '').toUpperCase() === valorUpper ||
            (item.entregador_codigo || item.id_entregador || '').toUpperCase() === valorUpper ||
            (item.encomenda_codigo || item.id_encomenda || '').toUpperCase() === valorUpper
        );
        if (match) resultados = [match];
    }

    const resultado = document.getElementById('resultado-pedido-consulta');
    resultado.innerHTML = resultados.map(p => `
        <div style="margin-bottom:12px; padding:10px; border:1px solid #ccc; border-radius:8px;">
            <p><strong>ID:</strong> ${p.codigo_identificacao || ''}</p>
            <p><strong>Cliente:</strong> ${p.cliente_codigo || p.id_cliente || ''}</p>
            <p><strong>Entregador:</strong> ${p.entregador_codigo || p.id_entregador || ''}</p>
            <p><strong>Encomenda:</strong> ${p.encomenda_codigo || p.id_encomenda || ''}</p>
            <p><strong>Status:</strong> ${p.status || ''}</p>
        </div>
    `).join('');
    resultado.style.display = 'block';
}

/* ============================================================
   SUBSTITUA no seu script.js as 4 funções:
   renderTabelaClientes, renderTabelaEntregadores,
   renderTabelaEncomendas, renderTabelaPedidos
   por TUDO que está neste arquivo.
   ============================================================ */

function renderTabelaClientes(clientes) {
    const tbody = document.getElementById('tabela-clientes-dados');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(clientes) || !clientes.length) {
        tbody.innerHTML = `<tr><td colspan="5">Nenhum cliente encontrado.</td></tr>`;
        return;
    }
    clientes.forEach(c => {
        tbody.innerHTML += `<tr>
            <td>${c.codigo_identificacao || '-'}</td>
            <td>${c.nome || '-'}</td>
            <td>${c.cpf ? mascaraCPF(c.cpf) : '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.localizacao || '-'}</td>
        </tr>`;
    });
}

function renderTabelaEntregadores(entregadores) {
    const tbody = document.getElementById('tabela-entregadores-dados');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(entregadores) || !entregadores.length) {
        tbody.innerHTML = `<tr><td colspan="4">Nenhum entregador encontrado.</td></tr>`;
        return;
    }
    entregadores.forEach(e => {
        tbody.innerHTML += `<tr>
            <td>${e.codigo_identificacao || '-'}</td>
            <td>${e.nome || '-'}</td>
            <td>${e.cpf ? mascaraCPF(e.cpf) : '-'}</td>
            <td>${e.numero ? mascaraTelefone(e.numero) : '-'}</td>
        </tr>`;
    });
}

function renderTabelaEncomendas(encomendas) {
    const tbody = document.getElementById('tabela-encomendas-dados');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(encomendas) || !encomendas.length) {
        tbody.innerHTML = `<tr><td colspan="3">Nenhuma encomenda encontrada.</td></tr>`;
        return;
    }
    encomendas.forEach(en => {
        tbody.innerHTML += `<tr>
            <td>${en.codigo_identificacao || '-'}</td>
            <td>${en.nome || '-'}</td>
            <td>${en.quantidade ?? '-'}</td>
        </tr>`;
    });
}

function renderTabelaPedidos(pedidos) {
    const tbody = document.getElementById('tabela-pedidos-dados');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(pedidos) || !pedidos.length) {
        tbody.innerHTML = `<tr><td colspan="6">Nenhum pedido encontrado.</td></tr>`;
        return;
    }
    pedidos.forEach(p => {
        tbody.innerHTML += `<tr>
            <td>${p.codigo_identificacao || '-'}</td>
            <td>${p.cliente_codigo || p.id_cliente || '-'}</td>
            <td>${p.entregador_codigo || p.id_entregador || '-'}</td>
            <td>${p.encomenda_codigo || p.id_encomenda || '-'}</td>
            <td>${p.status || '-'}</td>
            <td><button onclick="deletarPedido('${p.codigo_identificacao || ''}')">🗑️</button></td>
        </tr>`;
    });
}

function limparSomenteDigitos(valor) {
    return (valor || '').replace(/\D/g, '');
}

function isValidCPF(cpf) {
    cpf = limparSomenteDigitos(cpf);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf[10]);
}

function detectarTipoBusca(valor) {
    const bruto = (valor || '').trim();
    const digitos = limparSomenteDigitos(bruto);

    if (!bruto) return { tipo: 'todos', valor: '' };
    if (digitos.length === 11) return { tipo: 'cpf', valor: digitos };
    if (/^\d+$/.test(bruto)) return { tipo: 'codigo_identificacao', valor: bruto };
    return { tipo: 'nome', valor: bruto };
}

/* ============================================================
   SUBSTITUA no seu script.js:
   - As funções antigas: atualizarCliente, atualizarEntregador,
     atualizarEncomenda, atualizarPedido, deletarCliente,
     deletarEntregador, deletarEncomenda, deletarPedido
   por TUDO que está neste arquivo.
   Elas usam authHeaders(), montarQuery() e detectarTipoBusca()
   que você já tem no script.js — não precisa duplicar.
   ============================================================ */

/* ---------------------- CLIENTE ---------------------- */

async function buscarClienteAtualizar() {
    const valor = document.getElementById('busca-cliente-atualizar').value.trim();
    const msg = document.getElementById('c-atualizar-msg');
    const resultado = document.getElementById('resultado-cliente-atualizar');

    if (!valor) {
        resultado.style.display = 'none';
        msg.textContent = '⚠️ Digite CPF, email, nome ou código para buscar';
        msg.style.color = 'orange';
        return;
    }

    try {
        const busca = detectarTipoBusca(valor);
        const res = await fetch(`${API}/clientes/?${montarQuery(busca.tipo, busca.valor)}`, {
            headers: authHeaders()
        });
        const data = await res.json();

        if (!Array.isArray(data) || !data.length) {
            resultado.style.display = 'none';
            msg.textContent = '❌ Nenhum cliente encontrado';
            msg.style.color = 'red';
            return;
        }

        const c = data[0];
        document.getElementById('c-atualizar-id').value = c.codigo_identificacao || '';
        document.getElementById('c-atualizar-nome').value = c.nome || '';
        document.getElementById('c-atualizar-cpf').value = c.cpf || '';
        document.getElementById('c-atualizar-email').value = c.email || '';
        document.getElementById('c-atualizar-localizacao').value = c.localizacao || '';

        resultado.style.display = 'block';
        msg.textContent = '';
    } catch (erro) {
        console.error('Erro ao buscar cliente:', erro);
        msg.textContent = '❌ Erro ao conectar com a API';
        msg.style.color = 'red';
    }
}

async function atualizarCliente() {
    const id = document.getElementById('c-atualizar-id').value;
    if (!id) return alert('Busque um cliente antes de atualizar!');

    try {
        const res = await fetch(`${API}/clientes/${id}`, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                nome: document.getElementById('c-atualizar-nome').value.trim(),
                cpf: document.getElementById('c-atualizar-cpf').value.trim(),
                email: document.getElementById('c-atualizar-email').value.trim(),
                localizacao: document.getElementById('c-atualizar-localizacao').value.trim()
            })
        });

        const msg = document.getElementById('c-atualizar-msg');
        msg.textContent = res.ok ? '✅ Cliente atualizado!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';

        if (res.ok) await carregarDashboard();
    } catch (erro) {
        console.error('Erro ao atualizar cliente:', erro);
        alert('Falha de conexão ao atualizar cliente.');
    }
}

async function deletarCliente() {
    const id = document.getElementById('c-atualizar-id').value;
    if (!id) return alert('Busque um cliente antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return;

    const res = await fetch(`${API}/clientes/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });

    const msg = document.getElementById('c-atualizar-msg');
    if (res.ok) {
        msg.textContent = '✅ Cliente deletado!';
        msg.style.color = 'green';
        document.getElementById('resultado-cliente-atualizar').style.display = 'none';
        document.getElementById('busca-cliente-atualizar').value = '';
        await carregarDashboard();
    } else {
        msg.textContent = '❌ Erro ao deletar';
        msg.style.color = 'red';
    }
}

/* ---------------------- ENTREGADOR ---------------------- */

async function buscarEntregadorAtualizar() {
    const valor = document.getElementById('busca-entregador-atualizar').value.trim();
    const msg = document.getElementById('e-atualizar-msg');
    const resultado = document.getElementById('resultado-entregador-atualizar');

    if (!valor) {
        resultado.style.display = 'none';
        msg.textContent = '⚠️ Digite CPF, telefone, nome ou código para buscar';
        msg.style.color = 'orange';
        return;
    }

    try {
        const busca = detectarTipoBusca(valor);
        const res = await fetch(`${API}/entregadores/?${montarQuery(busca.tipo, busca.valor)}`, {
            headers: authHeaders()
        });
        const data = await res.json();

        if (!Array.isArray(data) || !data.length) {
            resultado.style.display = 'none';
            msg.textContent = '❌ Nenhum entregador encontrado';
            msg.style.color = 'red';
            return;
        }

        const e = data[0];
        document.getElementById('e-atualizar-id').value = e.codigo_identificacao || '';
        document.getElementById('e-atualizar-nome').value = e.nome || '';
        document.getElementById('e-atualizar-cpf').value = e.cpf || '';
        document.getElementById('e-atualizar-email').value = e.email || '';
        document.getElementById('e-atualizar-numero').value = e.numero || '';

        resultado.style.display = 'block';
        msg.textContent = '';
    } catch (erro) {
        console.error('Erro ao buscar entregador:', erro);
        msg.textContent = '❌ Erro ao conectar com a API';
        msg.style.color = 'red';
    }
}

async function atualizarEntregador() {
    const id = document.getElementById('e-atualizar-id').value;
    if (!id) return alert('Busque um entregador antes de atualizar!');

    try {
        const res = await fetch(`${API}/entregadores/${id}`, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                nome: document.getElementById('e-atualizar-nome').value.trim(),
                cpf: document.getElementById('e-atualizar-cpf').value.trim(),
                numero: document.getElementById('e-atualizar-numero').value.trim()
            })
        });

        const msg = document.getElementById('e-atualizar-msg');
        msg.textContent = res.ok ? '✅ Entregador atualizado!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';

        if (res.ok) await carregarDashboard();
    } catch (erro) {
        console.error('Erro ao atualizar entregador:', erro);
        alert('Falha de conexão ao atualizar entregador.');
    }
}

async function deletarEntregador() {
    const id = document.getElementById('e-atualizar-id').value;
    if (!id) return alert('Busque um entregador antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar este entregador?')) return;

    const res = await fetch(`${API}/entregadores/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });

    const msg = document.getElementById('e-atualizar-msg');
    if (res.ok) {
        msg.textContent = '✅ Entregador deletado!';
        msg.style.color = 'green';
        document.getElementById('resultado-entregador-atualizar').style.display = 'none';
        document.getElementById('busca-entregador-atualizar').value = '';
        await carregarDashboard();
    } else {
        msg.textContent = '❌ Erro ao deletar';
        msg.style.color = 'red';
    }
}

/* ---------------------- ENCOMENDA ---------------------- */

async function buscarEncomendaAtualizar() {
    const valor = document.getElementById('busca-encomenda-atualizar').value.trim();
    const msg = document.getElementById('en-atualizar-msg');
    const resultado = document.getElementById('resultado-encomenda-atualizar');

    if (!valor) {
        resultado.style.display = 'none';
        msg.textContent = '⚠️ Digite nome ou código para buscar';
        msg.style.color = 'orange';
        return;
    }

    try {
        const busca = detectarTipoBusca(valor);
        const res = await fetch(`${API}/encomendas/?${montarQuery(busca.tipo, busca.valor)}`, {
            headers: authHeaders()
        });
        const data = await res.json();

        if (!Array.isArray(data) || !data.length) {
            resultado.style.display = 'none';
            msg.textContent = '❌ Nenhuma encomenda encontrada';
            msg.style.color = 'red';
            return;
        }

        const en = data[0];
        document.getElementById('en-atualizar-id').value = en.codigo_identificacao || '';
        document.getElementById('en-atualizar-codigo').value = en.codigo_identificacao || '';
        document.getElementById('en-atualizar-nome').value = en.nome || '';
        document.getElementById('en-atualizar-quantidade').value = en.quantidade ?? '';

        resultado.style.display = 'block';
        msg.textContent = '';
    } catch (erro) {
        console.error('Erro ao buscar encomenda:', erro);
        msg.textContent = '❌ Erro ao conectar com a API';
        msg.style.color = 'red';
    }
}

async function atualizarEncomenda() {
    const id = document.getElementById('en-atualizar-id').value;
    if (!id) return alert('Busque uma encomenda antes de atualizar!');

    try {
        const res = await fetch(`${API}/encomendas/${id}`, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                nome: document.getElementById('en-atualizar-nome').value.trim(),
                quantidade: parseInt(document.getElementById('en-atualizar-quantidade').value) || 0
            })
        });

        const msg = document.getElementById('en-atualizar-msg');
        msg.textContent = res.ok ? '✅ Encomenda atualizada!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';

        if (res.ok) await carregarDashboard();
    } catch (erro) {
        console.error('Erro ao atualizar encomenda:', erro);
        alert('Falha de conexão ao atualizar encomenda.');
    }
}

async function deletarEncomenda() {
    const id = document.getElementById('en-atualizar-id').value;
    if (!id) return alert('Busque uma encomenda antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar esta encomenda?')) return;

    const res = await fetch(`${API}/encomendas/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });

    const msg = document.getElementById('en-atualizar-msg');
    if (res.ok) {
        msg.textContent = '✅ Encomenda deletada!';
        msg.style.color = 'green';
        document.getElementById('resultado-encomenda-atualizar').style.display = 'none';
        document.getElementById('busca-encomenda-atualizar').value = '';
        await carregarDashboard();
    } else {
        msg.textContent = '❌ Erro ao deletar';
        msg.style.color = 'red';
    }
}

/* ============================================================
   SUBSTITUA no seu script.js:
   - As funções antigas: atualizarCliente, atualizarEntregador,
     atualizarEncomenda, atualizarPedido, deletarCliente,
     deletarEntregador, deletarEncomenda, deletarPedido
   por TUDO que está neste arquivo.
   Elas usam authHeaders(), montarQuery() e detectarTipoBusca()
   que você já tem no script.js — não precisa duplicar.
   ============================================================ */

/* ---------------------- CLIENTE ---------------------- */

async function buscarClienteAtualizar() {
    const valor = document.getElementById('busca-cliente-atualizar').value.trim();
    const msg = document.getElementById('c-atualizar-msg');
    const resultado = document.getElementById('resultado-cliente-atualizar');

    if (!valor) {
        resultado.style.display = 'none';
        msg.textContent = '⚠️ Digite CPF, email, nome ou código para buscar';
        msg.style.color = 'orange';
        return;
    }

    try {
        const busca = detectarTipoBusca(valor);
        const res = await fetch(`${API}/clientes/?${montarQuery(busca.tipo, busca.valor)}`, {
            headers: authHeaders()
        });
        const data = await res.json();

        if (!Array.isArray(data) || !data.length) {
            resultado.style.display = 'none';
            msg.textContent = '❌ Nenhum cliente encontrado';
            msg.style.color = 'red';
            return;
        }

        const c = data[0];
        document.getElementById('c-atualizar-id').value = c.codigo_identificacao || '';
        document.getElementById('c-atualizar-nome').value = c.nome || '';
        document.getElementById('c-atualizar-cpf').value = c.cpf || '';
        document.getElementById('c-atualizar-email').value = c.email || '';
        document.getElementById('c-atualizar-localizacao').value = c.localizacao || '';

        resultado.style.display = 'block';
        msg.textContent = '';
    } catch (erro) {
        console.error('Erro ao buscar cliente:', erro);
        msg.textContent = '❌ Erro ao conectar com a API';
        msg.style.color = 'red';
    }
}

async function atualizarCliente() {
    const id = document.getElementById('c-atualizar-id').value;
    if (!id) return alert('Busque um cliente antes de atualizar!');

    try {
        const res = await fetch(`${API}/clientes/${id}`, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                nome: document.getElementById('c-atualizar-nome').value.trim(),
                cpf: document.getElementById('c-atualizar-cpf').value.trim(),
                email: document.getElementById('c-atualizar-email').value.trim(),
                localizacao: document.getElementById('c-atualizar-localizacao').value.trim()
            })
        });

        const msg = document.getElementById('c-atualizar-msg');
        msg.textContent = res.ok ? '✅ Cliente atualizado!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';

        if (res.ok) await carregarDashboard();
    } catch (erro) {
        console.error('Erro ao atualizar cliente:', erro);
        alert('Falha de conexão ao atualizar cliente.');
    }
}

async function deletarCliente() {
    const id = document.getElementById('c-atualizar-id').value;
    if (!id) return alert('Busque um cliente antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return;

    const res = await fetch(`${API}/clientes/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });

    const msg = document.getElementById('c-atualizar-msg');
    if (res.ok) {
        msg.textContent = '✅ Cliente deletado!';
        msg.style.color = 'green';
        document.getElementById('resultado-cliente-atualizar').style.display = 'none';
        document.getElementById('busca-cliente-atualizar').value = '';
        await carregarDashboard();
    } else {
        msg.textContent = '❌ Erro ao deletar';
        msg.style.color = 'red';
    }
}

/* ---------------------- ENTREGADOR ---------------------- */

async function buscarEntregadorAtualizar() {
    const valor = document.getElementById('busca-entregador-atualizar').value.trim();
    const msg = document.getElementById('e-atualizar-msg');
    const resultado = document.getElementById('resultado-entregador-atualizar');

    if (!valor) {
        resultado.style.display = 'none';
        msg.textContent = '⚠️ Digite CPF, telefone, nome ou código para buscar';
        msg.style.color = 'orange';
        return;
    }

    try {
        const busca = detectarTipoBusca(valor);
        const res = await fetch(`${API}/entregadores/?${montarQuery(busca.tipo, busca.valor)}`, {
            headers: authHeaders()
        });
        const data = await res.json();

        if (!Array.isArray(data) || !data.length) {
            resultado.style.display = 'none';
            msg.textContent = '❌ Nenhum entregador encontrado';
            msg.style.color = 'red';
            return;
        }

        const e = data[0];
        document.getElementById('e-atualizar-id').value = e.codigo_identificacao || '';
        document.getElementById('e-atualizar-nome').value = e.nome || '';
        document.getElementById('e-atualizar-cpf').value = e.cpf || '';
        document.getElementById('e-atualizar-email').value = e.email || '';
        document.getElementById('e-atualizar-numero').value = e.numero || '';

        resultado.style.display = 'block';
        msg.textContent = '';
    } catch (erro) {
        console.error('Erro ao buscar entregador:', erro);
        msg.textContent = '❌ Erro ao conectar com a API';
        msg.style.color = 'red';
    }
}

async function atualizarEntregador() {
    const id = document.getElementById('e-atualizar-id').value;
    if (!id) return alert('Busque um entregador antes de atualizar!');

    try {
        const res = await fetch(`${API}/entregadores/${id}`, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                nome: document.getElementById('e-atualizar-nome').value.trim(),
                cpf: document.getElementById('e-atualizar-cpf').value.trim(),
                numero: document.getElementById('e-atualizar-numero').value.trim()
            })
        });

        const msg = document.getElementById('e-atualizar-msg');
        msg.textContent = res.ok ? '✅ Entregador atualizado!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';

        if (res.ok) await carregarDashboard();
    } catch (erro) {
        console.error('Erro ao atualizar entregador:', erro);
        alert('Falha de conexão ao atualizar entregador.');
    }
}

async function deletarEntregador() {
    const id = document.getElementById('e-atualizar-id').value;
    if (!id) return alert('Busque um entregador antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar este entregador?')) return;

    const res = await fetch(`${API}/entregadores/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });

    const msg = document.getElementById('e-atualizar-msg');
    if (res.ok) {
        msg.textContent = '✅ Entregador deletado!';
        msg.style.color = 'green';
        document.getElementById('resultado-entregador-atualizar').style.display = 'none';
        document.getElementById('busca-entregador-atualizar').value = '';
        await carregarDashboard();
    } else {
        msg.textContent = '❌ Erro ao deletar';
        msg.style.color = 'red';
    }
}

/* ---------------------- ENCOMENDA ---------------------- */

async function buscarEncomendaAtualizar() {
    const valor = document.getElementById('busca-encomenda-atualizar').value.trim();
    const msg = document.getElementById('en-atualizar-msg');
    const resultado = document.getElementById('resultado-encomenda-atualizar');

    if (!valor) {
        resultado.style.display = 'none';
        msg.textContent = '⚠️ Digite nome ou código para buscar';
        msg.style.color = 'orange';
        return;
    }

    try {
        const busca = detectarTipoBusca(valor);
        const res = await fetch(`${API}/encomendas/?${montarQuery(busca.tipo, busca.valor)}`, {
            headers: authHeaders()
        });
        const data = await res.json();

        if (!Array.isArray(data) || !data.length) {
            resultado.style.display = 'none';
            msg.textContent = '❌ Nenhuma encomenda encontrada';
            msg.style.color = 'red';
            return;
        }

        const en = data[0];
        document.getElementById('en-atualizar-id').value = en.codigo_identificacao || '';
        document.getElementById('en-atualizar-codigo').value = en.codigo_identificacao || '';
        document.getElementById('en-atualizar-nome').value = en.nome || '';
        document.getElementById('en-atualizar-quantidade').value = en.quantidade ?? '';

        resultado.style.display = 'block';
        msg.textContent = '';
    } catch (erro) {
        console.error('Erro ao buscar encomenda:', erro);
        msg.textContent = '❌ Erro ao conectar com a API';
        msg.style.color = 'red';
    }
}

async function atualizarEncomenda() {
    const id = document.getElementById('en-atualizar-id').value;
    if (!id) return alert('Busque uma encomenda antes de atualizar!');

    try {
        const res = await fetch(`${API}/encomendas/${id}`, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                nome: document.getElementById('en-atualizar-nome').value.trim(),
                quantidade: parseInt(document.getElementById('en-atualizar-quantidade').value) || 0
            })
        });

        const msg = document.getElementById('en-atualizar-msg');
        msg.textContent = res.ok ? '✅ Encomenda atualizada!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';

        if (res.ok) await carregarDashboard();
    } catch (erro) {
        console.error('Erro ao atualizar encomenda:', erro);
        alert('Falha de conexão ao atualizar encomenda.');
    }
}

async function deletarEncomenda() {
    const id = document.getElementById('en-atualizar-id').value;
    if (!id) return alert('Busque uma encomenda antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar esta encomenda?')) return;

    const res = await fetch(`${API}/encomendas/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });

    const msg = document.getElementById('en-atualizar-msg');
    if (res.ok) {
        msg.textContent = '✅ Encomenda deletada!';
        msg.style.color = 'green';
        document.getElementById('resultado-encomenda-atualizar').style.display = 'none';
        document.getElementById('busca-encomenda-atualizar').value = '';
        await carregarDashboard();
    } else {
        msg.textContent = '❌ Erro ao deletar';
        msg.style.color = 'red';
    }
}

/* ---------------------- PEDIDO ---------------------- */

async function buscarPedidoAtualizar() {
    const valor = document.getElementById('busca-pedido-atualizar').value.trim();
    const msg = document.getElementById('p-atualizar-msg');
    const resultado = document.getElementById('resultado-pedido-atualizar');

    if (!valor) {
        resultado.style.display = 'none';
        msg.textContent = '⚠️ Digite código, cliente, entregador ou encomenda para buscar';
        msg.style.color = 'orange';
        return;
    }

    try {
        const busca = detectarTipoBusca(valor);
        const res = await fetch(`${API}/pedidos/?${montarQuery(busca.tipo, busca.valor)}`, {
            headers: authHeaders()
        });
        const data = await res.json();

        if (!Array.isArray(data) || !data.length) {
            resultado.style.display = 'none';
            msg.textContent = '❌ Nenhum pedido encontrado';
            msg.style.color = 'red';
            return;
        }

        const valorUpper = valor.toUpperCase();
        const p = data.find(item =>
            (item.codigo_identificacao || '').toUpperCase() === valorUpper ||
            (item.id_cliente || '').toUpperCase() === valorUpper ||
            (item.id_entregador || '').toUpperCase() === valorUpper ||
            (item.id_encomenda || '').toUpperCase() === valorUpper ||
            (item.cliente_codigo || '').toUpperCase() === valorUpper ||
            (item.entregador_codigo || '').toUpperCase() === valorUpper ||
            (item.encomenda_codigo || '').toUpperCase() === valorUpper
        ) || data[0];
        document.getElementById('p-atualizar-id').value = p.codigo_identificacao || '';
        document.getElementById('p-atualizar-cliente').value = p.cliente_codigo || p.id_cliente || '';
        document.getElementById('p-atualizar-entregador').value = p.entregador_codigo || p.id_entregador || '';
        document.getElementById('p-atualizar-encomenda').value = p.encomenda_codigo || p.id_encomenda || '';
        document.getElementById('p-atualizar-status').value = p.status || 'Pendente';

        resultado.style.display = 'block';
        msg.textContent = '';
    } catch (erro) {
        console.error('Erro ao buscar pedido:', erro);
        msg.textContent = '❌ Erro ao conectar com a API';
        msg.style.color = 'red';
    }
}

async function atualizarPedido() {
    const id = document.getElementById('p-atualizar-id').value;
    if (!id) return alert('Busque um pedido antes de atualizar!');

    try {
        const res = await fetch(`${API}/pedidos/${id}`, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                id_cliente: document.getElementById('p-atualizar-cliente').value.trim().toUpperCase(),
                id_entregador: document.getElementById('p-atualizar-entregador').value.trim().toUpperCase(),
                id_encomenda: document.getElementById('p-atualizar-encomenda').value.trim().toUpperCase(),
                status: document.getElementById('p-atualizar-status').value.trim()
            })
        });

        const msg = document.getElementById('p-atualizar-msg');
        msg.textContent = res.ok ? '✅ Pedido atualizado!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';

        if (res.ok) await carregarDashboard();
    } catch (erro) {
        console.error('Erro ao atualizar pedido:', erro);
        alert('Falha de conexão ao atualizar pedido.');
    }
}

async function deletarPedido() {
    const id = document.getElementById('p-atualizar-id').value;
    if (!id) return alert('Busque um pedido antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar este pedido?')) return;

    const res = await fetch(`${API}/pedidos/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });

    const msg = document.getElementById('p-atualizar-msg');
    if (res.ok) {
        msg.textContent = '✅ Pedido deletado!';
        msg.style.color = 'green';
        document.getElementById('resultado-pedido-atualizar').style.display = 'none';
        document.getElementById('busca-pedido-atualizar').value = '';
        await carregarDashboard();
    } else {
        msg.textContent = '❌ Erro ao deletar';
        msg.style.color = 'red';
    }
}

async function deletarCliente(id) {
    const idFinal = id || document.getElementById('u-c-id').value;
    if (!idFinal) return alert('Busque um cliente antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar?')) return;
    const res = await fetch(`${API}/clientes/${idFinal}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    if (res.ok) listarClientes();
}

async function deletarEntregador(id) {
    const idFinal = id || document.getElementById('u-e-id').value;
    if (!idFinal) return alert('Busque um entregador antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar?')) return;
    const res = await fetch(`${API}/entregadores/${idFinal}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    if (res.ok) listarEntregadores();
}

async function deletarEncomenda(id) {
    const idFinal = id || document.getElementById('u-en-id').value;
    if (!idFinal) return alert('Busque uma encomenda antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar?')) return;
    const res = await fetch(`${API}/encomendas/${idFinal}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    if (res.ok) listarEncomendas();
}

window.addEventListener('load', async () => {
    if (!getToken()) {
        document.getElementById('modal-login').classList.remove('hidden');
        ocultarSecoesExtras();
        ocultarDashboard();
        return;
    }

    await carregarSecao('cadastros', 'pages/cadastros.html');
    await carregarSecao('consulta', 'pages/consulta.html');
    await carregarSecao('atualizar', 'pages/atualizar.html');
    await carregarSecao('graficos', 'pages/graficos.html');

    ocultarSecoesExtras();
    mostrarDashboard();
    await carregarDashboard();
    initChartButtons();
    setActiveNav('dashboard');
    aplicarMascaras();
});

function mascaraCPF(valor) {
    valor = valor.replace(/\D/g, '').slice(0, 11);
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return valor;
}

function mascaraTelefone(valor) {
    valor = valor.replace(/\D/g, '').slice(0, 11);

    if (valor.length <= 10) {
        valor = valor.replace(/^(\d{2})(\d)/, '($1) $2');
        valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        valor = valor.replace(/^(\d{2})(\d)/, '($1) $2');
        valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    }

    return valor;
}

function aplicarMascaras() {
    const cpfCliente = document.getElementById('c-cpf');
    const cpfEntregador = document.getElementById('e-cpf');
    const telefoneEntregador = document.getElementById('e-numero');

    if (cpfCliente) {
        cpfCliente.addEventListener('input', e => {
            e.target.value = mascaraCPF(e.target.value);
        });
    }

    if (cpfEntregador) {
        cpfEntregador.addEventListener('input', e => {
            e.target.value = mascaraCPF(e.target.value);
        });
    }

    if (telefoneEntregador) {
        telefoneEntregador.addEventListener('input', e => {
            e.target.value = mascaraTelefone(e.target.value);
        });
    }
}