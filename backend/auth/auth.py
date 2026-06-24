from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import os

# 🛠️ CORREÇÃO: Corrigidos os typos dos nomes das variáveis no .env (SECREY -> SECRET / ACESS -> ACCESS)
SECRET_KEY = os.getenv("SECRET_KEY", "chave_secreta")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Usuário temporário para validação em memória
USUARIO_FAKE = {
    "username": "admin",
    "hashed_password": pwd_context.hash("admin123")
}


def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_pura, senha_hash)


def criar_token(data: dict) -> str:
    payload = data.copy()
    # 🔄 Atualizado para usar timezone-aware datetime (padrão recomendado atual)
    expira = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MINUTES)
    payload.update({"exp": expira})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            # 🐛 FIX: Alterado de datetime="Token Inválido" para detail="Token Inválido"
            raise HTTPException(status_code=401, detail="Token Inválido")
            
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Token Inválido")