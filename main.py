from app.Models.Produto import Produto
from app.Repositories.ProdutosRepository import ProdutosRepository

def main():

    repo = ProdutosRepository()

    prod1 = Produto('0655-12', 'haste-VT-40', 360, 1.00)
    prod2 = Produto('0661-14', 'haste-v41', 600, 1.50)

    repo.adicionar(prod1)
    print("\nProduto1 adicionado com sucesso!")
    print("Informações:")
    print(prod1.__repr__())
    
    repo.adicionar(prod2)
    print("\nProduto2 adicionado com sucesso!")
    print("Informações:")
    print(prod2.__repr__())

    for produto in repo.listarProdutos():
        print(produto)

    repo.atualizar(prod1.id, nome="Haste V40/30", valor=2.0)
    print("\nApós atualização:")
    print(repo.buscarForId(prod1.id))

    repo.remover(prod1.id)
    print("\nApos remoção:")
    for produto in repo.listarProdutos():
        print(produto)
    

if __name__ == "__main__":
    main()