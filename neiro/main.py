# запуск
# python -m uvicorn main:app --reload  --port 3014

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import torch
from model import EquipmentFailureModel
from utils import preprocess, preprocessWear, preprocessFailure
from generate_model import load_model
from fastapi import APIRouter
import numpy as np


app = FastAPI()

# CORS настройка
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Загрузка модели
def load_model(path: str):
    model = EquipmentFailureModel(input_size=7)
    model.load_state_dict(torch.load(path), strict=True)  # strict=True обязательно
    model.eval()
    return model



# Описание входных данных
class EquipmentItem(BaseModel):
    id: str
    currentOperationTime: float
    maxOperationTime: float
    equipmentCost: float
    cost: float
    operatingViolations: int
    completedMaintenance: int
    maintenanceFrequency: float
    lastTO: str
    days_since_last_to: int = None 

class BatchRequest(BaseModel):
    items: List[EquipmentItem]
    targetDate: str  # строка, например "2025-08-01"

@app.post("/predict")
def predict_failure_batch(request: BatchRequest):
    # Загружаем модель по умолчанию (первая модель)
    model = load_model("model.pth")
    feature_list = [preprocess(item, request.targetDate) for item in request.items]
    feature_list_wear = [preprocessWear(item, request.targetDate) for item in request.items]
    feature_list_failure = [preprocessFailure(item, request.targetDate) for item in request.items]
    inputs = torch.tensor(feature_list)
    inputs_wear = torch.tensor(feature_list_wear)
    inputs_failure = torch.tensor(feature_list_failure)

    # Используем обычную модель
    with torch.no_grad():
        y, date_p, www = model(inputs)
        yy, dd, wear = model(inputs_wear)
        year_p, dd, w = model(inputs_failure)
        

    results = []
    for i, item in enumerate(request.items):
        results.append({
            "id": item.id,
            "probability_year_failure": float(year_p[i]),
            "probability_on_date": float(date_p[i]),
            "wear": float(wear[i])
        })

    return results


def to_serializable(metrics: dict) -> dict:
    """Преобразовать все значения в сериализуемые типы."""
    serializable = {}
    for k, v in metrics.items():
        if isinstance(v, (np.float32, np.float64)):
            serializable[k] = float(v)
        elif isinstance(v, torch.Tensor):
            serializable[k] = v.item()  # Преобразуем тензор в скаляр
        elif isinstance(v, (np.int32, np.int64)):
            serializable[k] = int(v)
        elif isinstance(v, dict):  # Если в словаре есть другие словари, их тоже преобразуем
            serializable[k] = to_serializable(v)
        else:
            serializable[k] = v
    return serializable

