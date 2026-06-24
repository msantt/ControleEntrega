from fastapi import APIRouter, Depends
from models.schemas import ClienteModel
from repositories.crud import *
from auth.auth import verificar_token

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.post("/", status_code=201)
def createCliente(cliente: ClienteModel, usuario: str = Depends(verificar_token)):
    return create_cliente(
        nome=cliente.nome,
        cpf=cliente.cpf,
        email=cliente.email,
        localizacao=cliente.localizacao
    )


@router.get("/")
def listar(
    skip: int = 0,
    limit: int = 10,
    nome: str = None,
    cpf: str = None,
    email: str = None,
    localizacao: str = None,
    codigo_identificacao: str = None
):
    return read_clientes(
        skip=skip,
        limit=limit,
        nome=nome,
        cpf=cpf,
        email=email,
        localizacao=localizacao,
        codigo_identificacao=codigo_identificacao
    )


@router.get("/{codigo_identificacao}")
def readIdCliente(codigo_identificacao: str):
    return read_cliente(codigo_identificacao=codigo_identificacao)


@router.put("/{codigo_identificacao}")
def putCliente(codigo_identificacao: str, cliente: ClienteModel, usuario: str = Depends(verificar_token)):
    return update_cliente(
        codigo_identificacao=codigo_identificacao,
        nome=cliente.nome,
        cpf=cliente.cpf,
        email=cliente.email,
        localizacao=cliente.localizacao
    )


@router.delete("/{codigo_identificacao}")
def deleteCliente(codigo_identificacao: str, usuario: str = Depends(verificar_token)):
    return drop_cliente(codigo_identificacao=codigo_identificacao)