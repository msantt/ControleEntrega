from fastapi import FastAPI
from routers import clientes, encomendas, entregadores, pedidos

app = FastAPI(title="ControleEntrega")

app.include_router(clientes.router)
app.include_router(encomendas.router)
app.include_router(entregadores.router)
app.include_router(pedidos.router)
