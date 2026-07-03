from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from database import clientes, entregadores, pedidos, encomendas


def convertId(documento: Dict[str, Any]) -> Dict[str, Any]:
    if documento and "_id" in documento:
        documento["_id"] = str(documento["_id"])
    return documento


# ⚠️ AVISO (Klyor): depois da correção do bug de ID, essa função ficou sem
# nenhuma chamada no resto do arquivo (era usada só pelos read_*/update_*/drop_*
# antigos, que buscavam por "_id" do Mongo). Mantive ela aqui só porque
# "convertId" ainda expõe o _id pro frontend em cada documento — então se um dia
# você quiser um endpoint interno/admin que busca por ObjectId puro, ela já existe.
# Se não for usar, dá pra apagar junto com os imports de ObjectId/InvalidId no topo.
def validar_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail=f"O ID '{id_str}' fornecido não é um identificador válido do banco de dados."
        )


def _proximo_codigo(collection, prefixo: str) -> str:
    ultimo = collection.find_one(
        {"codigo_identificacao": {"$regex": f"^{prefixo}\\d+$"}},
        sort=[("codigo_identificacao", -1)]
    )

    if not ultimo:
        return f"{prefixo}001"

    codigo = ultimo.get("codigo_identificacao", "")
    try:
        numero = int(codigo.replace(prefixo, "")) + 1
    except ValueError:
        numero = 1

    return f"{prefixo}{numero:03d}"


def _buscar_por_codigo(collection, codigo: str) -> Optional[Dict[str, Any]]:
    if not codigo:
        return None
    return collection.find_one({"codigo_identificacao": codigo.strip().upper()})


def hidratar_pedido(pedido: Dict[str, Any]) -> Dict[str, Any]:
    if "id_cliente" in pedido:
        cliente = _buscar_por_codigo(clientes, pedido["id_cliente"])
        if cliente:
            pedido["cliente_nome"] = cliente["nome"]
            pedido["cliente_codigo"] = cliente.get("codigo_identificacao", "Sem código")
        else:
            pedido["cliente_nome"] = "Cliente não encontrado"
            pedido["cliente_codigo"] = "N/A"

    if "id_entregador" in pedido:
        entregador = _buscar_por_codigo(entregadores, pedido["id_entregador"])
        if entregador:
            pedido["entregador_nome"] = entregador["nome"]
            pedido["entregador_codigo"] = entregador.get("codigo_identificacao", "Sem código")
        else:
            pedido["entregador_nome"] = "Entregador não encontrado"
            pedido["entregador_codigo"] = "N/A"

    if "id_encomenda" in pedido:
        encomenda = _buscar_por_codigo(encomendas, pedido["id_encomenda"])
        if encomenda:
            pedido["encomenda_nome"] = encomenda["nome"]
            pedido["encomenda_codigo"] = encomenda.get("codigo_identificacao", "Sem código")
        else:
            pedido["encomenda_nome"] = "Encomenda não encontrada"
            pedido["encomenda_codigo"] = "N/A"

    return pedido


def create_cliente(nome: str, cpf: str, email: str, localizacao: str) -> Dict[str, Any]:
    cliente = {
        "nome": nome.strip(),
        "cpf": cpf.strip(),
        "email": email.strip().lower(),
        "localizacao": localizacao.strip(),
        "codigo_identificacao": _proximo_codigo(clientes, "CLI")
    }
    resultado = clientes.insert_one(cliente)
    cliente["_id"] = str(resultado.inserted_id)
    return cliente


def create_entregador(nome: str, cpf: str, numero: str) -> Dict[str, Any]:
    entregador = {
        "nome": nome.strip(),
        "cpf": cpf.strip(),
        "numero": numero.strip(),
        "codigo_identificacao": _proximo_codigo(entregadores, "ENT")
    }
    resultado = entregadores.insert_one(entregador)
    entregador["_id"] = str(resultado.inserted_id)
    return entregador


def create_encomenda(nome: str, quantidade: int) -> Dict[str, Any]:
    encomenda = {
        "nome": nome.strip(),
        "quantidade": quantidade,
        "codigo_identificacao": _proximo_codigo(encomendas, "ENC")
    }
    resultado = encomendas.insert_one(encomenda)
    encomenda["_id"] = str(resultado.inserted_id)
    return encomenda


def create_pedido(id_cliente: str, id_entregador: str, id_encomenda: str, status: str) -> Dict[str, Any]:
    cliente = _buscar_por_codigo(clientes, id_cliente)
    entregador = _buscar_por_codigo(entregadores, id_entregador)
    encomenda = _buscar_por_codigo(encomendas, id_encomenda)

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    if not entregador:
        raise HTTPException(status_code=404, detail="Entregador não encontrado")
    if not encomenda:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")

    pedido = {
        # 🛠️ CORREÇÃO (Klyor): Pedido não tinha seu próprio codigo_identificacao,
        # diferente de Cliente/Entregador/Encomenda. Isso quebrava o botão de
        # deletar/editar no frontend, que tentava usar p.codigo_identificacao
        # (undefined, pois o campo nunca existia no documento salvo).
        "codigo_identificacao": _proximo_codigo(pedidos, "PED"),
        "id_cliente": cliente["codigo_identificacao"],
        "id_entregador": entregador["codigo_identificacao"],
        "id_encomenda": encomenda["codigo_identificacao"],
        "status": status.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data_entrega": None
    }
    resultado = pedidos.insert_one(pedido)
    pedido["_id"] = str(resultado.inserted_id)
    return pedido


def read_clientes(skip: int = 0, limit: int = 10, nome: Optional[str] = None, cpf: Optional[str] = None, email: Optional[str] = None, localizacao: Optional[str] = None, codigo_identificacao: Optional[str] = None) -> List[Dict[str, Any]]:
    filtro = {}
    if nome:
        filtro["nome"] = {"$regex": nome, "$options": "i"}
    if cpf:
        filtro["cpf"] = {"$regex": cpf, "$options": "i"}
    if email:
        filtro["email"] = {"$regex": email, "$options": "i"}
    if localizacao:
        filtro["localizacao"] = {"$regex": localizacao, "$options": "i"}
    if codigo_identificacao:
        filtro["codigo_identificacao"] = {"$regex": codigo_identificacao, "$options": "i"}

    resultado = list(clientes.find(filtro).skip(skip).limit(limit))
    return [convertId(doc) for doc in resultado]


def read_entregadores(skip: int = 0, limit: int = 10, nome: Optional[str] = None, cpf: Optional[str] = None, numero: Optional[str] = None, codigo_identificacao: Optional[str] = None) -> List[Dict[str, Any]]:
    filtro = {}
    if nome:
        filtro["nome"] = {"$regex": nome, "$options": "i"}
    if cpf:
        filtro["cpf"] = {"$regex": cpf, "$options": "i"}
    if numero:
        filtro["numero"] = {"$regex": numero, "$options": "i"}
    if codigo_identificacao:
        filtro["codigo_identificacao"] = {"$regex": codigo_identificacao, "$options": "i"}

    resultado = list(entregadores.find(filtro).skip(skip).limit(limit))
    return [convertId(doc) for doc in resultado]


def read_encomendas(skip: int = 0, limit: int = 10, nome: Optional[str] = None, quantidade: Optional[int] = None, codigo_identificacao: Optional[str] = None) -> List[Dict[str, Any]]:
    filtro = {}
    if nome:
        filtro["nome"] = {"$regex": nome, "$options": "i"}
    if quantidade is not None:
        filtro["quantidade"] = quantidade
    if codigo_identificacao:
        filtro["codigo_identificacao"] = {"$regex": codigo_identificacao, "$options": "i"}

    resultado = list(encomendas.find(filtro).skip(skip).limit(limit))
    return [convertId(doc) for doc in resultado]


def read_pedidos(skip: int = 0, limit: int = 10, status: Optional[str] = None, id_cliente: Optional[str] = None, id_entregador: Optional[str] = None, id_encomenda: Optional[str] = None) -> List[Dict[str, Any]]:
    filtro = {}
    if status:
        filtro["status"] = {"$regex": status, "$options": "i"}
    if id_cliente:
        filtro["id_cliente"] = id_cliente
    if id_entregador:
        filtro["id_entregador"] = id_entregador
    if id_encomenda:
        filtro["id_encomenda"] = id_encomenda

    resultado = list(pedidos.find(filtro).skip(skip).limit(limit))
    lista_pedidos = []
    for doc in resultado:
        doc = convertId(doc)
        doc = hidratar_pedido(doc)
        lista_pedidos.append(doc)
    return lista_pedidos


# 🛠️ CORREÇÃO (Klyor): read_cliente/read_entregador/read_encomenda/read_pedido
# antes usavam validar_id() + busca por "_id" (ObjectId do Mongo). Só que os
# routers (routers/*.py) e o frontend (frontend/js) SEMPRE mandam
# codigo_identificacao (ex: "CLI001"), nunca o ObjectId. Isso causava dois erros:
#   1) TypeError: os routers chamam read_cliente(codigo_identificacao=...),
#      mas a função só aceitava o parâmetro id_cliente -> nome não batia.
#   2) mesmo corrigindo o nome, "CLI001" não é um ObjectId válido -> 400.
# Solução: usar o mesmo padrão que create_pedido já usa (_buscar_por_codigo),
# assim o sistema inteiro passa a se identificar de UM jeito só.
def read_cliente(codigo_identificacao: str) -> Dict[str, Any]:
    result = _buscar_por_codigo(clientes, codigo_identificacao)
    if not result:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return convertId(result)


def read_entregador(codigo_identificacao: str) -> Dict[str, Any]:
    result = _buscar_por_codigo(entregadores, codigo_identificacao)
    if not result:
        raise HTTPException(status_code=404, detail="Entregador não encontrado")
    return convertId(result)


def read_encomenda(codigo_identificacao: str) -> Dict[str, Any]:
    result = _buscar_por_codigo(encomendas, codigo_identificacao)
    if not result:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return convertId(result)


def read_pedido(codigo_identificacao: str) -> Dict[str, Any]:
    result = _buscar_por_codigo(pedidos, codigo_identificacao)
    if not result:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    pedido = convertId(result)
    return hidratar_pedido(pedido)


# 🛠️ CORREÇÃO (Klyor): mesma lógica do read_* — update_* e drop_* também
# filtravam por "_id" (ObjectId), mas os routers e o frontend sempre mandam
# codigo_identificacao. Agora o filtro do Mongo usa o campo "codigo_identificacao"
# diretamente, sem precisar converter pra ObjectId em nenhum momento. Isso também
# esconde o _id interno do banco do "mundo de fora" — só o código de negócio
# circula pela API (mesma ideia da Stripe: cus_..., não o ID cru do banco deles).
def update_cliente(codigo_identificacao: str, nome: Optional[str] = None, cpf: Optional[str] = None, email: Optional[str] = None, localizacao: Optional[str] = None) -> Dict[str, str]:
    update_fields = {}
    if nome:
        update_fields["nome"] = nome.strip()
    if cpf:
        update_fields["cpf"] = cpf.strip()
    if email:
        update_fields["email"] = email.strip().lower()
    if localizacao:
        update_fields["localizacao"] = localizacao.strip()

    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo modificado para atualização.")

    result = clientes.update_one({"codigo_identificacao": codigo_identificacao}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente atualizado com sucesso!"}


def update_entregador(codigo_identificacao: str, nome: Optional[str] = None, cpf: Optional[str] = None, numero: Optional[str] = None) -> Dict[str, str]:
    update_fields = {}
    if nome:
        update_fields["nome"] = nome.strip()
    if cpf:
        update_fields["cpf"] = cpf.strip()
    if numero:
        update_fields["numero"] = numero.strip()

    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo modificado para atualização.")

    result = entregadores.update_one({"codigo_identificacao": codigo_identificacao}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entregador não encontrado")
    return {"message": "Entregador atualizado com sucesso!"}


def update_encomenda(codigo_identificacao: str, nome: Optional[str] = None, quantidade: Optional[int] = None) -> Dict[str, str]:
    update_fields = {}
    if nome:
        update_fields["nome"] = nome.strip()
    if quantidade is not None:
        update_fields["quantidade"] = quantidade

    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo modificado para atualização.")

    result = encomendas.update_one({"codigo_identificacao": codigo_identificacao}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return {"message": "Encomenda atualizada com sucesso!"}


def update_pedido(codigo_identificacao: str, id_cliente: Optional[str] = None, id_entregador: Optional[str] = None, id_encomenda: Optional[str] = None, status: Optional[str] = None) -> Dict[str, str]:
    update_fields = {}
    if id_cliente:
        cliente = _buscar_por_codigo(clientes, id_cliente)
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        update_fields["id_cliente"] = cliente["codigo_identificacao"]
    if id_entregador:
        entregador = _buscar_por_codigo(entregadores, id_entregador)
        if not entregador:
            raise HTTPException(status_code=404, detail="Entregador não encontrado")
        update_fields["id_entregador"] = entregador["codigo_identificacao"]
    if id_encomenda:
        encomenda = _buscar_por_codigo(encomendas, id_encomenda)
        if not encomenda:
            raise HTTPException(status_code=404, detail="Encomenda não encontrada")
        update_fields["id_encomenda"] = encomenda["codigo_identificacao"]
    if status:
        status_limpo = status.strip()
        update_fields["status"] = status_limpo
        if status_limpo.lower() == "entregue":
            update_fields["data_entrega"] = datetime.now(timezone.utc).isoformat()

    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo modificado para atualização.")

    result = pedidos.update_one({"codigo_identificacao": codigo_identificacao}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"message": "Pedido atualizado com sucesso!"}


def drop_cliente(codigo_identificacao: str) -> Dict[str, str]:
    result = clientes.delete_one({"codigo_identificacao": codigo_identificacao})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente deletado com sucesso!"}


def drop_entregador(codigo_identificacao: str) -> Dict[str, str]:
    result = entregadores.delete_one({"codigo_identificacao": codigo_identificacao})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entregador não encontrado")
    return {"message": "Entregador deletado com sucesso!"}


def drop_encomenda(codigo_identificacao: str) -> Dict[str, str]:
    result = encomendas.delete_one({"codigo_identificacao": codigo_identificacao})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return {"message": "Encomenda deletada com sucesso!"}


def drop_pedido(codigo_identificacao: str) -> Dict[str, str]:
    result = pedidos.delete_one({"codigo_identificacao": codigo_identificacao})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"message": "Pedido deletado com sucesso!"}