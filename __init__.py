from app.Models.Produto import Produto
from app.Repositories.ProdutosRepository import ProdutosRepository

def main():
    print("Sistema Inicalizado")

    repo = ProdutosRepository()

if __name__ == "__main__":
    main()