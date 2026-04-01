from fastapi import APIRouter
from models.schemas import ClienteModel
from repositories.crud import *


router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.post("/", status_code=201)
def createCliente(cliente: ClienteModel):
    return create_cliente(cliente.nome, cliente.cpf, cliente.localizacao)

@router.get("/")
def listar(skip: int = 0, limit: int = 10, nome: str = None,  cpf: str = None, localizacao: str = None):
    return read_clientes(skip, limit, nome, cpf, localizacao)

@router.get("/{id}")
def readIdCliente(id: str):
    return read_cliente(id)

@router.put("/{id}")
def putCliente(id : str, cliente: ClienteModel):
    return update_cliente(id, cliente.nome, cliente.cpf, cliente.localizacao)

@router.delete("/{id}")
def deleteCliente(id: str):
    return drop_cliente(id)