import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import torch
import joblib
import numpy as np
from models.model import WearPredictor

router = APIRouter()

# Корневая директория проекта (относительно этого файла)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Пути к файлам модели и scaler
MODEL_PATH = os.path.join(BASE_DIR, "..", "wear_model.pth")
SCALER_PATH = os.path.join(BASE_DIR, "..", "scaler", "scaler.pkl")

# Загрузка модели и scaler'а
model = WearPredictor(input_size=4)
model.load_state_dict(torch.load(MODEL_PATH))
model.eval()

scaler = joblib.load(SCALER_PATH)

# Входная модель
class EquipmentItem(BaseModel):
    id: str
    maximumOperatingTime: float
    currentOperatingTime: float
    age: float
    numberTo: float

# Выходная модель
class PredictionResult(BaseModel):
    id: str
    wear: float

@router.post("/predict_wear", response_model=List[PredictionResult])
def predict_wear(data: List[EquipmentItem]):
    ids = [item.id for item in data]

    # Преобразуем признаки в нужном порядке
    input_features = np.array([
        [item.maximumOperatingTime, item.currentOperatingTime, item.age, item.numberTo]
        for item in data
    ])

    # Масштабируем
    input_scaled = scaler.transform(input_features)

    # Предсказание
    inputs_tensor = torch.tensor(input_scaled, dtype=torch.float32)
    with torch.no_grad():
        predictions = model(inputs_tensor).numpy().flatten()

    # Формируем результат с округлением
    results = [{"id": id_, "wear": round(float(w), 2)} for id_, w in zip(ids, predictions)]
    return results
