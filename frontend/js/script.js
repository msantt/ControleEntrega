const API = 'http://127.0.0.1:8000';

let chartProdutividade = null;
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

function montarBasePeriodo(periodo) {
    const agora = new Date();

    if (periodo === 'semana') {
        return {
            labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            entregas: [0, 0, 0, 0, 0, 0, 0],
            pendencias: [0, 0, 0, 0, 0, 0, 0]
        };
    }

    if (periodo === 'mes') {
        const dias = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
        return {
            labels: Array.from({ length: dias }, (_, i) => `${i + 1}`),
            entregas: Array(dias).fill(0),
            pendencias: Array(dias).fill(0)
        };
    }

    return {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        entregas: Array(12).fill(0),
        pendencias: Array(12).fill(0)
    };
}

function atualizarGrafico(pedidos, periodo) {
    const canvas = document.getElementById('chartProdutividade');
    if (!canvas) return;

    const base = montarBasePeriodo(periodo);
    const agora = new Date();

    pedidos.forEach(p => {
        const data = getDataPedido(p);
        if (isNaN(data)) return;

        let idx = -1;

        if (periodo === 'semana') {
            const diffDias = Math.floor((agora - data) / (1000 * 60 * 60 * 24));
            if (diffDias >= 0 && diffDias <= 6) idx = data.getDay();
        } else if (periodo === 'mes') {
            if (data.getFullYear() === agora.getFullYear() && data.getMonth() === agora.getMonth()) {
                idx = data.getDate() - 1;
            }
        } else {
            if (data.getFullYear() === agora.getFullYear()) {
                idx = data.getMonth();
            }
        }

        if (idx < 0) return;

        if ((p.status || '').toLowerCase() === 'entregue') {
            base.entregas[idx] += 1;
        } else {
            base.pendencias[idx] += 1;
        }
    });

    const ctx = canvas.getContext('2d');

    if (chartProdutividade) {
        chartProdutividade.data.labels = base.labels;
        chartProdutividade.data.datasets[0].data = base.entregas;
        chartProdutividade.data.datasets[1].data = base.pendencias;
        chartProdutividade.update();
        return;
    }

    chartProdutividade = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: base.labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Entregas concluídas',
                    data: base.entregas,
                    backgroundColor: '#10b981',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.6
                },
                {
                    type: 'line',
                    label: 'Pendências',
                    data: base.pendencias,
                    borderColor: '#ef4444',
                    backgroundColor: '#ef4444',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.08)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

async function carregarDashboard() {
    try {
        const res = await fetch(`${API}/pedidos/?limit=1000`, {
            headers: authHeaders()
        });

        const pedidos = await res.json();
        if (!Array.isArray(pedidos)) return;

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
            id_cliente: document.getElementById('p-id-cliente').value.trim(),
            id_entregador: document.getElementById('p-id-entregador').value.trim(),
            id_encomenda: document.getElementById('p-id-encomenda').value.trim(),
            status: document.getElementById('p-status').value
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

    const resultado = document.getElementById('resultado-pedido-consulta');
    resultado.innerHTML = data.map(p => `
        <div style="margin-bottom:12px; padding:10px; border:1px solid #ccc; border-radius:8px;">
            <p><strong>ID:</strong> ${p.codigo_identificacao || ''}</p>
            <p><strong>Cliente:</strong> ${p.id_cliente || ''}</p>
            <p><strong>Entregador:</strong> ${p.id_entregador || ''}</p>
            <p><strong>Encomenda:</strong> ${p.id_encomenda || ''}</p>
            <p><strong>Status:</strong> ${p.status || ''}</p>
        </div>
    `).join('');
    resultado.style.display = 'block';
}

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
            <td>${c.nome || '-'}</td>
            <td>${c.cpf || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.localizacao || '-'}</td>
            <td>${c.codigo_identificacao || '-'}</td>
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
            <td>${e.nome || '-'}</td>
            <td>${e.cpf || '-'}</td>
            <td>${e.numero || '-'}</td>
            <td>${e.codigo_identificacao || '-'}</td>
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
            <td>${en.nome || '-'}</td>
            <td>${en.quantidade ?? '-'}</td>
            <td>${en.codigo_identificacao || '-'}</td>
        </tr>`;
    });
}

function renderTabelaPedidos(pedidos) {
    const tbody = document.getElementById('tabela-pedidos-dados');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(pedidos) || !pedidos.length) {
        tbody.innerHTML = `<tr><td colspan="5">Nenhum pedido encontrado.</td></tr>`;
        return;
    }
    pedidos.forEach(p => {
        tbody.innerHTML += `<tr>
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

async function atualizarCliente() {
    const id = document.getElementById('u-c-id').value;
    const res = await fetch(`${API}/clientes/${id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            nome: document.getElementById('u-c-nome').value,
            cpf: document.getElementById('u-c-cpf').value,
            email: document.getElementById('u-c-email').value,
            localizacao: document.getElementById('u-c-localizacao').value
        })
    });
    const msg = document.getElementById('u-c-msg');
    if (msg) {
        msg.textContent = res.ok ? '✅ Cliente atualizado!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';
    }
}

async function atualizarEntregador() {
    const id = document.getElementById('u-e-id').value;
    const res = await fetch(`${API}/entregadores/${id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            nome: document.getElementById('u-e-nome').value,
            cpf: document.getElementById('u-e-cpf').value,
            numero: document.getElementById('u-e-telefone').value
        })
    });
    const msg = document.getElementById('u-e-msg');
    if (msg) {
        msg.textContent = res.ok ? '✅ Entregador atualizado!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';
    }
}

async function atualizarEncomenda() {
    const id = document.getElementById('u-en-id').value;
    const res = await fetch(`${API}/encomendas/${id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            nome: document.getElementById('u-en-nome').value,
            quantidade: parseInt(document.getElementById('u-en-quantidade').value) || 0
        })
    });
    const msg = document.getElementById('u-en-msg');
    if (msg) {
        msg.textContent = res.ok ? '✅ Encomenda atualizada!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';
    }
}

async function atualizarPedido() {
    const id = document.getElementById('u-p-id').value;
    const res = await fetch(`${API}/pedidos/${id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            id_cliente: document.getElementById('u-p-cliente').value,
            id_entregador: document.getElementById('u-p-entregador').value,
            id_encomenda: document.getElementById('u-p-encomenda').value,
            status: document.getElementById('u-p-status').value
        })
    });
    const msg = document.getElementById('u-p-msg');
    if (msg) {
        msg.textContent = res.ok ? '✅ Pedido atualizado!' : '❌ Erro ao atualizar';
        msg.style.color = res.ok ? 'green' : 'red';
    }
    if (res.ok) carregarDashboard();
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

async function deletarPedido(id) {
    const idFinal = id || document.getElementById('u-p-id').value;
    if (!idFinal) return alert('Busque um pedido antes de deletar.');
    if (!confirm('Tem certeza que deseja deletar?')) return;
    const res = await fetch(`${API}/pedidos/${idFinal}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    if (res.ok) carregarDashboard();
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