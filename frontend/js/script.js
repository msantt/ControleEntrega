const API = 'http://127.0.0.1:8000'

const links = document.querySelectorAll('.header div nav ul li a');
links.forEach(link => {
        link.addEventListener('click', () => {links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
}); 

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

async function carregarSecao(id, arquivo) {
    const res = await fetch(arquivo)
    const html = await res.text()
    document.getElementById(id).innerHTML = html
}

carregarDashboard()
carregarSecao('cadastros', 'pages/cadastros.html')
carregarSecao('consulta', 'pages/consulta.html')
carregarSecao('atualizar', 'pages/atualizar.html')