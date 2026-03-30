##Este código implementa as operações CRUD (Create, Read, Update, Delete) para um sistema de gerenciamento de entregas usando MongoDB. Ele define funções para criar novos documentos em coleções de clientes, entregadores, encomendas e pedidos, bem como para ler documentos existentes. As funções de leitura permitem obter todos os documentos ou um documento específico por ID. O código inclui exemplos de uso para testar as funções criadas.



##CRUD - Create, Read, Update, Delete
##Create - Criar um novo documento


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



#FUNCIONS -ALLS-
