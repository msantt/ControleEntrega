from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

##Configuração da conexão com o MongoDB
client = MongoClient("mongodb://localhost:27017/")

##Criação do banco de dados e das coleções
db = client["ControleEntrega"]

###Definição das coleções
clientes = db["Cliente"]
entregadores = db["Entregador"]
pedidos = db["Pedido"]
encomendas = db["Encomenda"]

 
 