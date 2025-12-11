import uuid

class Produto:
    def __init__(self,codigo: str, nome: str, quantidade: int, valor: float):
        self.__id = str(uuid.uuid4())
        self.__codigo = codigo
        self.__nome = nome
        self.__quantidade = quantidade
        self.__valor = valor

    @property
    def id(self) -> str:
        return self.__id
    
    @property
    def nome(self) -> str:
        return self.__nome

    @property
    def codigo(self) -> str:
        return self.__codigo
    
    @property
    def quantidade(self) -> int:
        return self.__quantidade
    
    @property
    def valor(self) -> float:
        return self.__valor
    
    @nome.setter
    def nome(self, novo_nome: str):
        if not novo_nome:
            raise ValueError("nome vazio não existe!")
        self.__nome = novo_nome

    def codigo(self, novo_codigo: str):
        if not novo_codigo:
            raise ValueError("Codigo não pode ser vazio!")
        self.__codigo = novo_codigo

    def quantidade(self, nova_quantidade: int):
        if nova_quantidade < 0 :
            raise ValueError("Não é válido! Precisa adicionar uma quantidade.")
        self.__quantidade = nova_quantidade

    def valor(self, novo_valor: float):
        if novo_valor < 0 :
            raise ValueError("Não é válido! Precisa adicionar um valor.")
        self.__valor = novo_valor

    def __str__(self) -> str:
        return(
        f"Produto(id='{self.id}',"
        f"codigo='{self.codigo}',"
        f"nome='{self.nome}',"
        f"quantidade='{self.quantidade},"
        f"valor='{self.valor}')"
        )   