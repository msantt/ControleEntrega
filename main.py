##Este código implementa as operações CRUD (Create, Read, Update, Delete) para um sistema de gerenciamento de entregas usando MongoDB. Ele define funções para criar novos documentos em coleções de clientes, entregadores, encomendas e pedidos, bem como para ler documentos existentes. As funções de leitura permitem obter todos os documentos ou um documento específico por ID. O código inclui exemplos de uso para testar as funções criadas.
from database import clientes, entregadores, pedidos, encomendas
from bson import ObjectId


##CRUD - Create, Read, Update, Delete
##Create - Criar um novo documento

def create_cliente(nome, cpf, localizacao):
    cliente = {
        "nome": nome,
        "cpf": cpf,
        "localizacao": localizacao
    }
    resultado = clientes.insert_one(cliente)
    return resultado.inserted_id


def create_entregador(nome, cpf, telefone):
    entregador = {
        "nome": nome,
        "cpf": cpf,
        "telefone": telefone
    }
    resultado = entregadores.insert_one(entregador)
    return resultado.inserted_id


def create_encomenda(nome, quantidade):
    encomenda = {
        "nome": nome,
        "quantidade": quantidade
    }
    resultado = encomendas.insert_one(encomenda)
    return resultado.inserted_id


def create_pedido(id_cliente, id_entregador, id_encomenda, status):
    pedido = {
        "id_cliente": id_cliente,
        "id_entregador": id_entregador,
        "id_encomenda": id_encomenda,
        "status": status
    }
    resultado = pedidos.insert_one(pedido)
    return resultado.inserted_id



def toString(bd):
    lista = bd
    for i in lista.find():
        for chave, valor in i.items():
            print(f"{chave}:{valor}")


##CRUD - Read - Ler os documentos existentes (todos)

def read_clientes():
    return list(clientes.find())


def read_entregadores():
    return list(entregadores.find())


def read_encomendas():
    return list(encomendas.find())


def read_pedidos():
    return list(pedidos.find())


##CRUD - Read - Ler um documento específico (por ID)

def read_cliente(id_cliente):
    return clientes.find_one({"_id": ObjectId(id_cliente)})

def read_entregador(id_entregador):
    return entregadores.find_one({"_id": ObjectId(id_entregador)})

def read_encomenda(id_encomenda):
    return encomendas.find_one({"_id": ObjectId(id_encomenda)})

def read_pedido(id_pedido):
    return pedidos.find_one({"_id": ObjectId(id_pedido)})



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


#IMPUT DE TESTE

#IMPUT CREATE
#print(create_cliente("João Silva", "123.456.789-00", "Rua A, 123"))
#print(create_entregador("Maria Souza", "987.654.321-00", "11987654321"))
#print(create_encomenda("Pizza", 2))
#print(create_pedido("64b8c9f1e1d2c3a4b5c6d7e", "64b8ca02e1d2c3a4b5c6d7f", "64b8ca0be1d2c3a4b5c6d800", "Pendente"))

#IMPUT READ ALL
#print(read_clientes())
#print(read_entregadores())
#print(read_encomendas())
#print(read_pedidos())

#IMPUT READ ID
#print(read_cliente("69af9db58dadf2424c4b31b6"))
#print(read_entregador("69afaedac7f68cc6ec575979"))
#print(read_encomenda("69afaedac7f68cc6ec57597a"))
#print(read_pedido("69afaedac7f68cc6ec57597b"))

#IMPUT UPDATE
#print(update_cliente("69af9db58dadf2424c4b31b6","Marlon De Jesus Santos", "093.562.562-00","Con Vila Esperança"))
#fazer

#IMPUT DROP
#print(drop_cliente("69afacff93e972f96d1b0f47"))
#fazer

#toString(clientes)