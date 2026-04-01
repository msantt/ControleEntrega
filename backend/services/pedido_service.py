from fastapi import HTTPException
from repositories.crud import read_cliente, read_encomenda, read_entregador, create_pedido

STATUS_VALIDOS = ["Pendente","Em trânsito","Entregue","Cancelado"]

def validar_status(status: str):
    if status not in STATUS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido. Use: {STATUS_VALIDOS}"
        )
    
def service_create_pedido(id_cliente, id_entregador, id_encomenda, status):
    validar_status(status)
    read_cliente(id_cliente)
    read_entregador(id_entregador)
    read_encomenda(id_encomenda)
    return create_pedido(id_cliente,id_entregador, id_encomenda, status)

def service_update_pedido(id_pedido,id_cliente: str = None, id_entregador: str = None, id_encomenda: str = None, status: str = None):
    if status:
        validar_status(status)
    if id_cliente:
        read_cliente(id_cliente)
    if id_entregador:
        read_entregador(id_entregador)
    if id_encomenda:
        read_encomenda(id_encomenda)
    from repositories.crud import update_pedido
    return update_pedido(id_pedido, id_cliente, id_entregador, id_encomenda, status)

