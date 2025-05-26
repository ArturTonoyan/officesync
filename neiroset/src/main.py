# запус модели api 
# uvicorn main:app --reload
# python -m uvicorn main:app --reload  --port 3014


from fastapi import FastAPI
from api.predict import router as predict_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS настройка
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(predict_router)
