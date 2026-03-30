from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers import clientes, encomendas, entregadores, pedidos
import logging
import time


app = FastAPI(title="ControleEntrega")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s" 
)

logger = logging.getLogger(__name__)

app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time()- start) * 1000, 2)
    logger.info(f"{request.method}{request.url.path} | {response.status_code} | {duration}ms")
    return response


app.include_router(clientes.router)
app.include_router(encomendas.router)
app.include_router(entregadores.router)
app.include_router(pedidos.router)
