from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from database import clientes, entregadores, pedidos, encomendas

#UTEIS

def convertId(bd):
    bd["_id"] = str(bd["_id"])
    return bd

def validar_id(id:str):
    try:
        return ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID Inválido")


#CREATE
def create_cliente(nome, cpf, localizacao):
    cliente = {
        "nome": nome,
        "cpf": cpf,
        "localizacao": localizacao
    }
    resultado = clientes.insert_one(cliente)
    return str(resultado.inserted_id)


def create_entregador(nome, cpf, telefone):
    entregador = {
        "nome": nome,
        "cpf": cpf,
        "telefone": telefone
    }
    resultado = entregadores.insert_one(entregador)
    return str(resultado.inserted_id)


def create_encomenda(nome, quantidade):
    encomenda = {
        "nome": nome,
        "quantidade": quantidade
    }
    resultado = encomendas.insert_one(encomenda)
    return str(resultado.inserted_id)


def create_pedido(id_cliente, id_entregador, id_encomenda, status):
    pedido = {
        "id_cliente": id_cliente,
        "id_entregador": id_entregador,
        "id_encomenda": id_encomenda,
        "status": status
    }
    resultado = pedidos.insert_one(pedido)
    return str(resultado.inserted_id)


##CRUD - Read - Ler os documentos existentes (todos)

def read_clientes(skip:int = 0, limit: int = 10):
    resultado = list(clientes.find().skip(skip).limit(limit))
    for i in resultado:
        convertId(i)
    return resultado


def read_entregadores(skip:int = 0, limit: int = 10):
    resultado = list(entregadores.find().skip(skip).limit(limit))
    for i in resultado:
        convertId(i)
    return resultado


def read_encomendas(skip:int = 0, limit: int = 10):
    resultado = list(encomendas.find().skip(skip).limit(limit))
    for i in resultado:
        convertId(i)
    return resultado


def read_pedidos(skip:int = 0, limit: int = 10):
    resultado = list(pedidos.find().skip(skip).limit(limit))
    for i in resultado:
        convertId(i)
    return resultado


##CRUD - Read - Ler um documento específico (por ID)

def read_cliente(id_cliente):
    result = clientes.find_one({"_id": validar_id(id_cliente)})
    if not result:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return convertId(result)

def read_entregador(id_entregador):
    result = entregadores.find_one({"_id": validar_id(id_entregador)})
    if not result:
        raise HTTPException(status_code=404, detail="Entregador não encontrado")
    return convertId(result)

def read_encomenda(id_encomenda):
    result = encomendas.find_one({"_id": validar_id(id_encomenda)})
    if not result:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return convertId(result)

def read_pedido(id_pedido):
    result = pedidos.find_one({"_id": validar_id(id_pedido)})
    if not result:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return convertId(result)



##CRUD - Update - Atualizar um documento existente (por ID)

def update_cliente(id_cliente, nome=None, cpf=None, localizacao=None):
    update_fields = {}
    if nome:
        update_fields["nome"] = nome
    if cpf:
        update_fields["cpf"] = cpf
    if localizacao:
        update_fields["localizacao"] = localizacao
    result = clientes.update_one({"_id": validar_id(id_cliente)},{"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message":"Cliente atualizado com sucesso!"}


def update_entregador(id_entregador,nome=None, cpf=None, telefone=None):
    update_fields = {}
    if nome:
        update_fields["nome"] = nome
    if cpf:
        update_fields["cpf"] = cpf 
    if telefone:
        update_fields["telefone"] = telefone 
    result = entregadores.update_one({"_id": validar_id(id_entregador)},{"$set":update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entregador não encontrado")
    return {"message":"Entregador atualizado com sucesso!"}


def update_encomenda(id_encomenda, nome=None, quantidade=None):
    update_fields = {}
    if nome:
        update_fields["nome"] = nome
    if quantidade:
        update_fields["quantidade"] = quantidade
    result = encomendas.update_one({"_id":validar_id(id_encomenda)},{"$set":update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return {"message":"Encomenda atualizada com sucesso!"}

def update_pedido(id_pedido, id_cliente=None, id_entregador=None, id_encomenda=None, status=None):
    update_fields = {}
    if id_cliente:
        update_fields["id_cliente"] = id_cliente
    if id_entregador:
        update_fields["id_entregador"] = id_entregador
    if id_encomenda:
        update_fields["id_encomenda"] = id_encomenda
    if status:
        update_fields["status"] = status
    result = pedidos.update_one({"_id":validar_id(id_pedido)},{"$set":(update_fields)})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"message":"Pedido atualizado com sucesso!"}


##CRUD - Delete - Atualizar um documento existente (por ID) 

def drop_cliente(id_cliente):
    result = clientes.delete_one({"_id": validar_id(id_cliente)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message":"Cliente deletado com sucesso!"}

def drop_entregador(id_entregador):
    result = entregadores.delete_one({"_id": validar_id(id_entregador)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entregador não encontrado")
    return {"message":"Entregador deletado com sucesso!"}

def drop_encomenda(id_encomenda):
    result = encomendas.delete_one({"_id": validar_id(id_encomenda)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return {"message":"Encomenda deletada com sucesso!"}

def drop_pedido(id_pedido):
    result = pedidos.delete_one({"_id": validar_id(id_pedido)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"message":"Pedido deletado com sucesso!"}