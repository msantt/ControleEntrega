from fastapi import APIRouter
from models.schemas import PedidoModel
from repositories.crud import *
from auth.auth import verificar_token


router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.post("/",status_code=201)
def createPedido(pedido: PedidoModel):
    return create_pedido(pedido.id_cliente,pedido.id_entregador, pedido.id_encomenda, pedido.status)

@router.get("/")
def listar(skip: int = 0, limit: int = 10, status: str = None,  id_cliente: str = None, id_entregador: str = None, id_encomenda: str = None):
    return read_pedidos(skip, limit, status, id_cliente, id_entregador, id_encomenda)

@router.get("/{id}")
def readIdPedido(id: str):
    return read_pedido(id)

@router.put("/{id}")
def putPedido(id : str, pedido: PedidoModel):
    return update_pedido(id, pedido.id_cliente,pedido.id_entregador, pedido.id_encomenda, pedido.status)

@router.delete("/{id}")
def deletePedido(id: str):
    return drop_pedido(id)