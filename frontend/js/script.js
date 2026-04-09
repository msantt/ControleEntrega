const API = 'http://127.0.0.1:8000'

const links = document.querySelectorAll('.header div nav ul li a');
links.forEach(link => {
        link.addEventListener('click', () => {links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
}); 

function getToken(){
    return localStorage.getItem('token')
}

async function carregarDashboard() {
    try{
        const[pedidos, clientes, entregadores, encomendas] = await Promise.all([
            fetch(`${API}/pedidos/?limit=1000`).then(r => r.json()),
            fetch(`${API}/clientes/?limit=1000`).then(r => r.json()),
            fetch(`${API}/entregadores/?limit=1000`).then(r => r.json()),
            fetch(`${API}/encomendas/?limit=1000`).then(r => r.json()),
        ])

        const total = pedidos.length
        const emTransito = pedidos.filter(p => p.status === 'Em trânsito').length
        const entregues = pedidos.filter(p => p.status === 'Entregue').length
        const atrasados = pedidos.filter( p => p.status === 'Cancelado').length


        document.querySelectorAll('.card-value')[0].textContent = total
        document.querySelectorAll('.card-value')[1].textContent = emTransito
        document.querySelectorAll('.card-value')[2].textContent = entregues
        document.querySelectorAll('.card-value')[3].textContent = atrasados

    } catch(e){
        console.error('Erro ao carregar dashboard:', e)
    }
}

document.addEventListener('click', e => {

    if (e.target.classList.contains('tab')){
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'))
        e.target.classList.add('active')
        document.getElementById(`tab-${e.target.dataset.tab}`).classList.remove('hidden')
    }
})

async function cadastrarCliente() {
    const body = {
        nome: document.getElementById('c-nome').value,
        cpf: document.getElementById('c-cpf').value,
        localizacao: document.getElementById('c-localizacao').value,
    }
    const res = await fetch(`${API}/clientes/`,{
        method: 'POST',
        headers: {'Content-type': 'application/json', 'Authorrization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)

    })
    const msg = document.getElementById('c-msg')
    msg.textContent = res.ok ? '✅ Cliente cadastrado!' : '❌ Erro ao cadastrar'
    msg.style.color = res.ok ? 'green' : 'red'    
}

async function cadastrarEntregador() {
    const body = {
        nome: document.getElementById('e-nome').value,
        cpf: document.getElementById('e-cpf').value,
        telefone: document.getElementById('e-telefone').value
    }
    const res = await fetch(`${API}/entregadores/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json',  'Authorrization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)
    })
    const msg = document.getElementById('e-msg')
    msg.textContent = res.ok ? '✅ Entregador cadastrado!' : '❌ Erro ao cadastrar'
    msg.style.color = res.ok ? 'green' : 'red'
}






async function carregarSecao(id, arquivo) {
    const res = await fetch(arquivo)
    const html = await res.text()
    document.getElementById(id).innerHTML = html
}

carregarDashboard()
carregarSecao('cadastros', 'pages/cadastros.html')
carregarSecao('consulta', 'pages/consulta.html')
carregarSecao('atualizar', 'pages/atualizar.html')