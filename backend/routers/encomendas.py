from fastapi import APIRouter, Depends
from models.schemas import EncomendaModel
from repositories.crud import *
from auth.auth import verificar_token


router = APIRouter(prefix="/encomendas", tags=["Encomendas"])


@router.post("/",status_code=201)
def createEncomenda(encomenda: EncomendaModel, usuario: str = Depends(verificar_token)):
    return create_encomenda(encomenda.nome, encomenda.quantidade)

@router.get("/")
def listar(skip: int = 0, limit: int = 10, nome: str = None,  quantidade: int = None):
    return read_encomendas(skip, limit, nome, quantidade)

@router.get("/{id}")
def readIdEncomenda(id: str):
    return read_encomenda(id)

@router.put("/{id}")
def putEncomenda(id : str, encomenda: EncomendaModel, usuario: str = Depends(verificar_token)):
    return update_encomenda(id, encomenda.nome, encomenda.quantidade)

@router.delete("/{id}")
def deleteEncomenda(id: str, usuario: str = Depends(verificar_token)):
    return drop_encomenda(id)
