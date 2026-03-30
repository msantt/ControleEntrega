from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import clientes, encomendas, entregadores, pedidos

app = FastAPI(title="ControleEntrega")

app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
)

app.include_router(clientes.router)
app.include_router(encomendas.router)
app.include_router(entregadores.router)
app.include_router(pedidos.router)
