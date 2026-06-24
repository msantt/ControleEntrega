from fastapi import APIRouter, Depends
from models.schemas import PedidoModel
from services.pedido_service import service_update_pedido, service_create_pedido
from repositories.crud import *
from auth.auth import verificar_token

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.post("/", status_code=201)
def createPedido(pedido: PedidoModel, usuario: str = Depends(verificar_token)):
    return service_create_pedido(
        id_cliente=pedido.id_cliente,
        id_entregador=pedido.id_entregador,
        id_encomenda=pedido.id_encomenda,
        status=pedido.status
    )


@router.get("/")
def listar(
    skip: int = 0,
    limit: int = 10,
    status: str = None,
    id_cliente: str = None,
    id_entregador: str = None,
    id_encomenda: str = None
):
    return read_pedidos(
        skip=skip,
        limit=limit,
        status=status,
        id_cliente=id_cliente,
        id_entregador=id_entregador,
        id_encomenda=id_encomenda
    )


@router.get("/{codigo_identificacao}")
def readIdPedido(codigo_identificacao: str):
    return read_pedido(codigo_identificacao=codigo_identificacao)


@router.put("/{codigo_identificacao}")
def putPedido(codigo_identificacao: str, pedido: PedidoModel, usuario: str = Depends(verificar_token)):
    return service_update_pedido(
        codigo_identificacao=codigo_identificacao,
        id_cliente=pedido.id_cliente,
        id_entregador=pedido.id_entregador,
        id_encomenda=pedido.id_encomenda,
        status=pedido.status
    )


@router.delete("/{codigo_identificacao}")
def deletePedido(codigo_identificacao: str, usuario: str = Depends(verificar_token)):
    return drop_pedido(codigo_identificacao=codigo_identificacao)