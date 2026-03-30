from bson import ObjectId
from database import clientes, entregadores, pedidos, encomendas

#UTEIS


def convertId(bd):
    bd["_id"] = str(bd["_id"])
    return bd




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



def toString(bd):
    lista = bd
    for i in lista.find():
        for chave, valor in i.items():
            print(f"{chave}:{valor}")


##CRUD - Read - Ler os documentos existentes (todos)

def read_clientes():
    resultado = list(clientes.find())
    for i in resultado:
        convertId(i)
    return resultado


def read_entregadores():
    resultado = list(entregadores.find())
    for i in resultado:
        convertId(i)
    return resultado


def read_encomendas():
    resultado = list(encomendas.find())
    for i in resultado:
        convertId(i)
    return resultado


def read_pedidos():
    resultado = list(pedidos.find())
    for i in resultado:
        convertId(i)
    return resultado


##CRUD - Read - Ler um documento específico (por ID)

def read_cliente(id_cliente):
    result = clientes.find_one({"_id": ObjectId(id_cliente)})
    convertId(result)
    return result

def read_entregador(id_entregador):
    result = entregadores.find_one({"_id": ObjectId(id_entregador)})
    convertId(result)
    return result

def read_encomenda(id_encomenda):
    result = encomendas.find_one({"_id": ObjectId(id_encomenda)})
    convertId(result)
    return result

def read_pedido(id_pedido):
    result = pedidos.find_one({"_id": ObjectId(id_pedido)})
    convertId(result)
    return result



##CRUD - Update - Atualizar um documento existente (por ID)

def update_cliente(id_cliente, nome=None, cpf=None, localizacao=None):
    update_fields = {}
    if nome:
        update_fields["nome"] = nome
    if cpf:
        update_fields["cpf"] = cpf
    if localizacao:
        update_fields["localizacao"] = localizacao
    clientes.update_one({"_id": ObjectId(id_cliente)},{"$set": update_fields})

def update_entregador(id_entregador,nome=None, cpf=None, telefone=None):
    update_fields = {}
    if nome:
        update_fields["nome"] = nome
    if cpf:
        update_fields["cpf"] = cpf 
    if telefone:
        update_fields["telefone"] = telefone 
    entregadores.update_one({"_id": ObjectId(id_entregador)},{"$set":update_fields})

def update_encomenda(id_encomenda, nome=None, quantidade=None):
    update_fields = {}
    if nome:
        update_fields["nome"] = nome
    if quantidade:
        update_fields["quantidade"] = quantidade
    encomendas.update_one({"_id":ObjectId(id_encomenda)},{"$set":update_fields})

def update_pedido(id_pedido, id_cliente=None, id_entregador=None, id_encomenda=None):
    update_fields = {}
    if id_cliente:
        update_fields["id_cliente"] = id_cliente
    if id_entregador:
        update_fields["id_entregador"] = id_entregador
    if id_encomenda:
        update_fields["id_encomenda"] = id_encomenda
    pedidos.update_one({"_id":ObjectId(id_pedido)},{"$set":(update_fields)})


##CRUD - Delete - Atualizar um documento existente (por ID) 

def drop_cliente(id_cliente):
    clientes.delete_one({"_id": ObjectId(id_cliente)})

def drop_entregador(id_entregador):
    entregadores.delete_one({"_id": ObjectId(id_entregador)})

def drop_encomenda(id_encomenda):
    encomendas.delete_one({"_id": ObjectId(id_encomenda)})

def drop_pedido(id_pedido):
    pedidos.delete_one({"_id": ObjectId(id_pedido)})
