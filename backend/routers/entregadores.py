from fastapi import APIRouter, Depends
from models.schemas import EntregadorModel
from repositories.crud import *
from auth.auth import verificar_token


router = APIRouter(prefix="/entregadores", tags=["Entregadores"])


@router.post("/",status_code=201)
def createEntregador(entregador: EntregadorModel, usuario: str = Depends(verificar_token)):
    return create_entregador(entregador.nome, entregador.cpf, entregador.telefone)

@router.get("/")
def listar(skip: int = 0, limit: int = 10, nome: str = None,  cpf: str = None, telefone: str = None):
    return read_entregadores(skip, limit, nome, cpf, telefone)

@router.get("/{id}")
def readIdentregador(id: str):
    return read_entregador(id)

@router.put("/{id}")
def putEntregador(id : str, entregador: EntregadorModel, usuario: str = Depends(verificar_token)):
    return update_entregador(id, entregador.nome, entregador.cpf, entregador.telefone)

@router.delete("/{id}")
def deleteEntregador(id: str, usuario: str = Depends(verificar_token)):
    return drop_entregador(id)
