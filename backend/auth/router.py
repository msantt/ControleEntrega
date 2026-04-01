from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from auth.auth import verificar_senha, criar_token, USUARIO_FAKE

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.username != USUARIO_FAKE["username"]:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválida")
    if not verificar_senha(form.password, USUARIO_FAKE["hashed_password"]):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválida")
    token = criar_token({"sub": form.username})
    return{"access_token": token, "token_type": "bearer"}
