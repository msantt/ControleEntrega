from fastapi import APIRouter, Depends
from models.schemas import EntregadorModel
from repositories.crud import *
from auth.auth import verificar_token

router = APIRouter(prefix="/entregadores", tags=["Entregadores"])


@router.post("/", status_code=201)
def createEntregador(entregador: EntregadorModel, usuario: str = Depends(verificar_token)):
    return create_entregador(
        nome=entregador.nome,
        cpf=entregador.cpf,
        numero=entregador.numero
    )


@router.get("/")
def listar(
    skip: int = 0,
    limit: int = 10,
    nome: str = None,
    cpf: str = None,
    numero: str = None,
    codigo_identificacao: str = None
):
    return read_entregadores(
        skip=skip,
        limit=limit,
        nome=nome,
        cpf=cpf,
        numero=numero,
        codigo_identificacao=codigo_identificacao
    )


@router.get("/{codigo_identificacao}")
def readIdentregador(codigo_identificacao: str):
    return read_entregador(codigo_identificacao=codigo_identificacao)


@router.put("/{codigo_identificacao}")
def putEntregador(codigo_identificacao: str, entregador: EntregadorModel, usuario: str = Depends(verificar_token)):
    return update_entregador(
        codigo_identificacao=codigo_identificacao,
        nome=entregador.nome,
        cpf=entregador.cpf,
        numero=entregador.numero
    )


@router.delete("/{codigo_identificacao}")
def deleteEntregador(codigo_identificacao: str, usuario: str = Depends(verificar_token)):
    return drop_entregador(codigo_identificacao=codigo_identificacao)