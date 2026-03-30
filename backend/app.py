from main import *
from fastapi import FastAPI
from models.schemas import ClienteModel, EntregadorModel, EncomendaModel, PedidoModel

app = FastAPI()


#___________________________________________________________________#




#___________________________________________________________________#

#GETs GERAL
@app.get("/read_clientes")
def readClientes():
    return read_clientes()

@app.get("/read_entregadores")
def readentregadores():
    return read_entregadores()

@app.get("/read_encomendas")
def readEncomendas():
    return read_encomendas()

@app.get("/read_pedidos")
def readPedidos():
    return read_pedidos()


#___________________________________________________________________#

#POSTs
@app.post("/create_cliente")
def createCliente(cliente: ClienteModel):
    return create_cliente(cliente.nome, cliente.cpf, cliente.localizacao)

@app.post("/create_entregador")
def createEntregador(entregador: EntregadorModel):
    return create_entregador(entregador.nome, entregador.cpf, entregador.telefone)

@app.post("/create_Encomenda")
def createEncomenda(encomenda: EncomendaModel):
    return create_encomenda(encomenda.nome, encomenda.quantidade)

@app.post("/create_Pedido")
def createPedido(pedido: PedidoModel):
    return create_pedido(pedido.id_cliente,pedido.id_entregador, pedido.id_encomenda, pedido.status)


#___________________________________________________________________#

#GETs ID
@app.get("/read_Idcliente/{id}")
def readIdCliente(id: str):
    return read_cliente(id)

@app.get("/read_Identregador/{id}")
def readIdentregador(id: str):
    return read_entregador(id)

@app.get("/read_Idencomenda/{id}")
def readIdEncomenda(id: str):
    return read_encomenda(id)

@app.get("/read_Idpedido/{id}")
def readIdPedido(id: str):
    return read_pedido(id)



#___________________________________________________________________#

#PUTs
@app.put("/put_cliente/{id}")
def putCliente(id : str, cliente: ClienteModel):
    return update_cliente(id, cliente.nome, cliente.cpf, cliente.localizacao)

@app.put("/put_entregador/{id}")
def putEntregador(id : str, entregador: EntregadorModel):
    return update_entregador(id, entregador.nome, entregador.cpf, entregador.telefone)

@app.put("/put_Encomenda/{id}")
def putEncomenda(id : str, encomenda: EncomendaModel):
    return update_encomenda(id, encomenda.nome, encomenda.quantidade)

@app.put("/put_Pedido/{id}")
def putPedido(id : str, pedido: PedidoModel):
    return update_pedido(id, pedido.id_cliente,pedido.id_entregador, pedido.id_encomenda, pedido.status)


#___________________________________________________________________#

#DELETE
@app.delete("/delete_cliente/{id}")
def deleteCliente(id: str):
    return drop_cliente(id)

@app.delete("/delete_entregador/{id}")
def deleteEntregador(id: str):
    return drop_entregador(id)

@app.delete("/delete_encomenda/{id}")
def deleteEncomenda(id: str):
    return drop_encomenda(id)

@app.delete("/delete_pedido/{id}")
def deletePedido(id: str):
    return drop_pedido(id)