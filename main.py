from database import clientes, entregadores, pedidos, encomendas

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


##print(create_cliente("João Silva", "123.456.789-00", "Rua A, 123"))
##print(create_entregador("Maria Souza", "987.654.321-00", "11987654321"))
##print(create_encomenda("Pizza", 2))
##print(create_pedido("64b8c9f1e1d2c3a4b5c6d7e", "64b8ca02e1d2c3a4b5c6d7f", "64b8ca0be1d2c3a4b5c6d800", "Pendente"))