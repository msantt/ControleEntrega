from fastapi import APIRouter, Depends
from models.schemas import EncomendaModel
from repositories.crud import *
from auth.auth import verificar_token

router = APIRouter(prefix="/encomendas", tags=["Encomendas"])


@router.post("/", status_code=201)
def createEncomenda(encomenda: EncomendaModel, usuario: str = Depends(verificar_token)):
    return create_encomenda(
        nome=encomenda.nome,
        quantidade=encomenda.quantidade
    )


@router.get("/")
def listar(
    skip: int = 0,
    limit: int = 10,
    nome: str = None,
    quantidade: int = None,
    codigo_identificacao: str = None
):
    return read_encomendas(
        skip=skip,
        limit=limit,
        nome=nome,
        quantidade=quantidade,
        codigo_identificacao=codigo_identificacao
    )


@router.get("/{codigo_identificacao}")
def readIdEncomenda(codigo_identificacao: str):
    return read_encomenda(codigo_identificacao=codigo_identificacao)


@router.put("/{codigo_identificacao}")
def putEncomenda(codigo_identificacao: str, encomenda: EncomendaModel, usuario: str = Depends(verificar_token)):
    return update_encomenda(
        codigo_identificacao=codigo_identificacao,
        nome=encomenda.nome,
        quantidade=encomenda.quantidade
    )


@router.delete("/{codigo_identificacao}")
def deleteEncomenda(codigo_identificacao: str, usuario: str = Depends(verificar_token)):
    return drop_encomenda(codigo_identificacao=codigo_identificacao)