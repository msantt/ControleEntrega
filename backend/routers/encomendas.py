from fastapi import APIRouter
from models.schemas import EncomendaModel
from repositories.crud import *


router = APIRouter(prefix="/encomendas", tags=["Encomendas"])


@router.post("/",status_code=201)
def createEncomenda(encomenda: EncomendaModel):
    return create_encomenda(encomenda.nome, encomenda.quantidade)

@router.get("/")
def readEncomendas(skip:int = 0, limit: int = 10):
    return read_encomendas(skip, limit)

@router.get("/{id}")
def readIdEncomenda(id: str):
    return read_encomenda(id)

@router.put("/{id}")
def putEncomenda(id : str, encomenda: EncomendaModel):
    return update_encomenda(id, encomenda.nome, encomenda.quantidade)

@router.delete("/{id}")
def deleteEncomenda(id: str):
    return drop_encomenda(id)
