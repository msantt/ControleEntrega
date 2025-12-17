from app.Models.Produto import Produto
from typing import Dict, Optional, List

class ProdutosRepository:
    def __init__(self, produtos_iniciais: Optional[List[Produto]]= None):
        self._produtos:Dict[str, Produto] = (
            {p.id: p for p in produtos_iniciais}
            if produtos_iniciais
            else {}
        )
        
    def adicionar(self, produtos: Produto):
        self._produtos[produtos.id] = Produto

    def buscarForId(self, id_produto: str) -> Optional[Produto]:
        return self._produtos.get(id_produto)
    
    def listarProdutos(self) -> List [Produto]:
        return list(self._produtos.values())

    def atualizar(
            self,
            id_produto: str,
            nome: str = None,
            codigo: str = None,
            quantidade: int = None,
            valor: float = None) -> None:

            produto = self.buscarForId(id_produto)
            if produto is None:
                raise ValueError("Produto não encontrado")
            
            if nome is not None:
                produto.nome = nome
            if codigo is not None:
                produto.codigo = codigo
            if quantidade is not None:
                produto.quantidade = quantidade
            if valor is not None:
                produto.valor = valor

    def remover(self, id_produto: str) -> None:
        if id_produto not in self._produtos:
            raise ValueError("Produto não encontrado")
        del self._produtos[id_produto]