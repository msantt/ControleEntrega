import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv


logger = logging.getLogger(__name__)

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")


try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    logger.info("Conexão com o MongoDB estabelecida com sucesso!")
except Exception as e:
    logger.critical(
        f"Erro crítico: Não foi possível conectar ao MongoDB em {MONGO_URI}. "
        f"Certifique-se de que o banco está rodando!"
    )
    raise e


db = client["ControleEntrega"]


# ==========================================
# 🗂️ COLEÇÕES (EXPORTADAS PARA O CRUD)
# ==========================================
clientes = db["Cliente"]
entregadores = db["Entregador"]
pedidos = db["Pedido"]
encomendas = db["Encomenda"]