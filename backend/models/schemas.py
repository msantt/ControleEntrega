from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ClienteModel(BaseModel):
    nome: str
    cpf: str
    email: str
    localizacao: str
    codigo_identificacao: Optional[str] = None

class EntregadorModel(BaseModel):
    nome: str
    cpf: str
    numero: str
    codigo_identificacao: Optional[str] = None

class EncomendaModel(BaseModel):
    nome: str
    quantidade: int
    codigo_identificacao: Optional[str] = None

class PedidoModel(BaseModel):
    id_cliente: str
    id_entregador: str
    id_encomenda: str
    status: str
    created_at: Optional[datetime] = None
    data_entrega: Optional[datetime] = None