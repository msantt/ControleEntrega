from fastapi import APIRouter, Depends
from models.schemas import ClienteModel
from repositories.crud import *
from auth.auth import verificar_token

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.post("/", status_code=201)
def createCliente(cliente: ClienteModel, usuario: str = Depends(verificar_token)):
    return create_cliente(cliente.nome, cliente.cpf, cliente.localizacao)

@router.get("/")
def listar(skip: int = 0, limit: int = 10, nome: str = None,  cpf: str = None, localizacao: str = None):
    return read_clientes(skip, limit, nome, cpf, localizacao)

@router.get("/{id}")
def readIdCliente(id: str):
    return read_cliente(id)

@router.put("/{id}")
def putCliente(id : str, cliente: ClienteModel, usuario: str = Depends(verificar_token)):
    return update_cliente(id, cliente.nome, cliente.cpf, cliente.localizacao)

@router.delete("/{id}")
def deleteCliente(id: str, usuario: str = Depends(verificar_token)):
    return drop_cliente(id)