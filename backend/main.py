import uvicorn

if __name__ == "__main__":
    # 🔄 Alterado para "app:app" porque a instância do FastAPI está no arquivo app.py
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)