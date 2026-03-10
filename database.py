from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017/")
db = client["ControleEntrega"]

clientes = db["Cliente"]
entregadores = db["Entregador"]
pedidos = db["Pedido"]
encomendas = db["Encomenda"]

