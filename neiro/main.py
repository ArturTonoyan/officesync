# запуск
# python -m uvicorn main:app --reload  --port 3014

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import torch
from model import EquipmentFailureModel
from utils import preprocess, preprocessWear, preprocessFailure
import os
from generate_model_by_bg import  generate_model as generate_model_ga, generate_realistic_data as generate_realistic_data_ga
from generate_model import load_model as genetic_algorithm_default, generate_realistic_data as generate_realistic_data_default
from fastapi import APIRouter
from progress import progress_status
import os
import time
from evaluate_model import evaluate_model
import numpy as np


app = FastAPI()

# CORS настройка
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002"],
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

@app.post("/predict-genetic")
def predict_failure_batch_genetic(request: BatchRequest):
    # Загружаем модель, оптимизированную с помощью генетического алгоритма
    ga_model = load_model("ga_model.pth")
    
    feature_list = [preprocess(item, request.targetDate) for item in request.items]
    feature_list_wear = [preprocessWear(item, request.targetDate) for item in request.items]
    feature_list_failure = [preprocessFailure(item, request.targetDate) for item in request.items]
    inputs = torch.tensor(feature_list)
    inputs_wear = torch.tensor(feature_list_wear)
    inputs_failure = torch.tensor(feature_list_failure)

    # Используем модель с генетическим алгоритмом
    with torch.no_grad():
        y, date_p, www = ga_model(inputs)
        yy, dd, wear = ga_model(inputs_wear)
        year_p, dd, w = ga_model(inputs_failure)
    
    print(year_p)
    print(date_p)
    print(wear)
    print(ga_model.training)

    results = []
    for i, item in enumerate(request.items):
        results.append({
            "id": item.id,
            "probability_year_failure": float(year_p[i]),
            "probability_on_date": float(date_p[i]),
            "wear": float(wear[i])
        })

    return results

@app.get("/weights")
def get_model_weights():
    model = load_model("model.pth")
    ga_model = load_model("ga_model.pth")
    # Получаем веса обеих моделей
    model_weights = {k: v.cpu().numpy().tolist() for k, v in model.state_dict().items()}
    ga_model_weights = {k: v.cpu().numpy().tolist() for k, v in ga_model.state_dict().items()}
    
    return {
        "model_weights": model_weights,
        "ga_model_weights": ga_model_weights
    }


# @app.post("/regenerate-models")
# def regenerate_models():
#     # Путь к файлам моделей
#     model_paths = ["model.pth", "ga_model.pth"]
    
#     # Удаляем файлы, если они существуют
#     for path in model_paths:
#         if os.path.exists(path):
#             os.remove(path)
#             print(f"File {path} has been deleted.")
#         else:
#             print(f"File {path} does not exist.")
    
  

#     genetic_algorithm_default()
#     generate_model_ga()
#     return {"message": "Models regenerated successfully!"}

@app.get("/progress")
def get_progress():
    return progress_status


@app.post("/regenerate-models")
def regenerate_models():
    model_paths = ["model.pth", "ga_model.pth"]

    progress_status["value"] = 0

    for i, path in enumerate(model_paths):
        if os.path.exists(path):
            os.remove(path)
        time.sleep(0.5)
        progress_status["value"] += 10

    genetic_algorithm_default(progress_status)  # <-- сюда передаём для обновления
    progress_status["value"] = 70

    generate_model_ga(progress_status)
    progress_status["value"] = 100

    return {"message": "Models regenerated successfully"}


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

@app.get("/model/metrics")
def get_model_metrics():
    input_size = 7
    model = EquipmentFailureModel(input_size)
    model_path = os.path.join(os.path.dirname(__file__), "model.pth")
    
    if not os.path.exists(model_path):
        return {"error": "Model not found"}
    
    try:
        model.load_state_dict(torch.load(model_path, map_location=torch.device("cpu")))
        model.eval()

        X, y_year, y_date, y_wear = generate_realistic_data_default(300)
        y_true = (y_year.numpy(), y_date.numpy(), y_wear.numpy())

        with torch.no_grad():
            metrics = evaluate_model(model, X, y_true)

        # Логируем метрики перед возвратом
        print("Metrics from evaluate_model:", metrics)

        # Преобразуем метрики в сериализуемую структуру
        serialized_metrics = to_serializable(metrics)
        print("Serialized metrics:", serialized_metrics)

        return serialized_metrics
 
    except Exception as e:
        return {"error": f"An error occurred while evaluating the model: {str(e)}"}
    
@app.get("/model/metricsGa")
def get_model_metrics():
    input_size = 7
    model = EquipmentFailureModel(input_size)
    model_path = os.path.join(os.path.dirname(__file__), "ga_model.pth")
    
    if not os.path.exists(model_path):
        return {"error": "Model not found"}
    
    try:
        model.load_state_dict(torch.load(model_path, map_location=torch.device("cpu")))
        model.eval()

        X, y_year, y_date, y_wear = generate_realistic_data_default(300)
        y_true = (y_year.numpy(), y_date.numpy(), y_wear.numpy())

        with torch.no_grad():
            metrics = evaluate_model(model, X, y_true)

        # Логируем метрики перед возвратом

        # Преобразуем метрики в сериализуемую структуру
        serialized_metrics = to_serializable(metrics)

        return serialized_metrics
 
    except Exception as e:
        return {"error": f"An error occurred while evaluating the model: {str(e)}"}