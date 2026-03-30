from fastapi import APIRouter
from models.schemas import EntregadorModel
from repositories.crud import *


router = APIRouter(prefix="/entregadores", tags=["Entregadores"])


@router.post("/",status_code=201)
def createEntregador(entregador: EntregadorModel):
    return create_entregador(entregador.nome, entregador.cpf, entregador.telefone)

@router.get("/")
def readentregadores(skip:int = 0, limit: int = 10):
    return read_entregadores(skip, limit)

@router.get("/{id}")
def readIdentregador(id: str):
    return read_entregador(id)

@router.put("/{id}")
def putEntregador(id : str, entregador: EntregadorModel):
    return update_entregador(id, entregador.nome, entregador.cpf, entregador.telefone)

@router.delete("/{id}")
def deleteEntregador(id: str):
    return drop_entregador(id)
