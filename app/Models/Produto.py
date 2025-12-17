import uuid

class Produto:
    def __init__(self,codigo: str, nome: str, quantidade: int, valor: float):
        self.__id = str(uuid.uuid4())
        self._codigo = codigo
        self._nome = nome
        self._quantidade = quantidade
        self._valor = valor

    @property
    def id(self) -> str:
        return self.__id
    
    @property
    def nome(self) -> str:
        return self._nome
    
    @nome.setter
    def nome(self, novo_nome: str):
        if not novo_nome:
            raise ValueError("nome vazio não existe!")
        self._nome = novo_nome
    
    @property
    def codigo(self) -> str:
        return self._codigo
    
    @codigo.setter
    def codigo(self, novo_codigo: str):
        if not novo_codigo:
            raise ValueError("Codigo não pode ser vazio!")
        self._codigo = novo_codigo
    
    @property
    def quantidade(self) -> int:
        return self._quantidade
    
    @quantidade.setter
    def quantidade(self, nova_quantidade: int):
        if nova_quantidade < 0 :
            raise ValueError("Não é válido! Precisa adicionar uma quantidade.")
        self._quantidade = nova_quantidade
    
    @property
    def valor(self) -> float:
        return self._valor

    @valor.setter
    def valor(self, novo_valor: float):
        if novo_valor < 0 :
            raise ValueError("Não é válido! Precisa adicionar um valor.")
        self._valor = novo_valor

    def __str__(self) -> str:
        return f"{self.nome} (codigo={self.codigo}) -  R$ {self.valor:.2f}"


    def __repr__(self) -> str:
        return(
            f"Produto\n"
            f"("
            f"\nid={self.id!r},"
            f"\ncodigo={self.codigo!r},"
            f"\nnome={self.nome!r},"
            f"\nquantidade={self.quantidade},"
            f"\nvalor={self.valor:.2f}"
            f"\n)\n"
        )   