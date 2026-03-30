from pydantic import BaseModel

#CLASSES
class ClienteModel(BaseModel):
    nome : str
    cpf : str
    localizacao : str

class EntregadorModel(BaseModel):
    nome : str
    cpf : str
    telefone : str

class EncomendaModel(BaseModel):
    nome : str
    quantidade : int

class PedidoModel(BaseModel):
    id_cliente : str
    id_entregador : str
    id_encomenda : str
    status : str
