from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import os

SECRET_KEY = os.getenv("SECREY_KEY", "chave_secreta")
ALGORITHM = os.getenv("ALGORITHM","HS256")
EXPIRE_MINUTES = int(os.getenv("ACESS_TOKEN_EXPIRE_MINUTES", 10))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

USUARIO_FAKE = {

    "username":"admin",
    "hashed_password": pwd_context.hash("admin123")
}

def verificar_senha(senha_pura, senha_hash):
    return pwd_context.verify(senha_pura, senha_hash)



def criar_token(data: dict):
    payload = data.copy()
    expira = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    payload.update({"exp": expira})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token(token: str =  Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, datetime="Token Inválido")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Token Inválido")