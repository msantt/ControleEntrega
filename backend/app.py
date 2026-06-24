import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers import clientes, encomendas, entregadores, pedidos
from auth import router as auth_router


app = FastAPI(
    title="ControleEntrega",
    description="API para gerenciamento otimizado de clientes, entregadores e fluxo de encomendas.",
    version="1.0.0"
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = round((time.time() - start_time) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} | Status: {response.status_code} | Tempo: {duration}ms")
    return response


@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "message": "API de Controle de Entregas rodando com sucesso!"
    }


app.include_router(auth_router.router)
app.include_router(clientes.router)
app.include_router(encomendas.router)
app.include_router(entregadores.router)
app.include_router(pedidos.router)