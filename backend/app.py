from fastapi import FastAPI
from routers import clientes, encomendas, entregadores, pedidos

app = FastAPI(title="ControleEntrega")

app.include_router()
