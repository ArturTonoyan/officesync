# оценка и тестирование модели

import os
import pandas as pd
import torch
import joblib
import matplotlib.pyplot as plt
from sklearn.metrics import mean_squared_error, mean_absolute_error

from datasets.wear_dataset import WearDataset
from models.model import WearPredictor


def evaluate_model(model, scaler, dataset, show_predictions=False, max_items=10):
    model.eval()
    true_wear = []
    predicted_wear = []

    with torch.no_grad():
        for features, target in dataset:
            features_np = features.numpy().reshape(1, -1)
            features_scaled = scaler.transform(features_np)
            input_tensor = torch.tensor(features_scaled, dtype=torch.float32)
            prediction = model(input_tensor).item()

            true_wear.append(target.item())
            predicted_wear.append(prediction)

    # Метрики
    mse = mean_squared_error(true_wear, predicted_wear)
    mae = mean_absolute_error(true_wear, predicted_wear)
    abs_errors = [abs(t - p) for t, p in zip(true_wear, predicted_wear)]

    # Условная точность: доля предсказаний с ошибкой <= 10%
    accurate_preds = sum(
        abs(t - p) / t <= 0.10 if t != 0 else abs(p) <= 0.1
        for t, p in zip(true_wear, predicted_wear)
    )
    accuracy = accurate_preds / len(true_wear) * 100

    # Вывод
    print("📊 Evaluation results:")
    print(f" - MSE:       {mse:.4f}")
    print(f" - MAE:       {mae:.4f}")
    print(f" - Accuracy:  {accuracy:.2f}% (предсказания с ошибкой ≤10%)")

    if show_predictions:
        print("\n🔍 Примеры предсказаний:")
        for i in range(min(max_items, len(true_wear))):
            print(f"  Истинный: {true_wear[i]:.2f} | Предсказанный: {predicted_wear[i]:.2f}")

    # Графики
    plt.figure(figsize=(16, 4))

    plt.subplot(1, 3, 1)
    plt.plot(true_wear, label='Истинный износ', color='blue')
    plt.plot(predicted_wear, label='Предсказанный износ', color='orange')
    plt.title("📈 Истинный vs Предсказанный износ")
    plt.xlabel("Пример")
    plt.ylabel("Износ")
    plt.legend()

    plt.subplot(1, 3, 2)
    plt.scatter(true_wear, abs_errors, alpha=0.6, color='red')
    plt.title("📉 Остатки (ошибки предсказаний)")
    plt.xlabel("Истинный износ")
    plt.ylabel("Абсолютная ошибка")

    plt.subplot(1, 3, 3)
    plt.hist(abs_errors, bins=20, color='purple', alpha=0.7)
    plt.title("📊 Распределение абсолютных ошибок")
    plt.xlabel("Абсолютная ошибка")
    plt.ylabel("Количество")

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(BASE_DIR, "wear_model.pth")
    scaler_path = os.path.join(BASE_DIR, "scaler", "scaler.pkl")
    data_path = os.path.join(BASE_DIR, "data", "generated_dataset2.csv")

    # Загрузка scaler и данных
    scaler = joblib.load(scaler_path)
    df = pd.read_csv(data_path)
    dataset = WearDataset(df)

    # Загрузка модели
    model = WearPredictor(input_size=4)
    model.load_state_dict(torch.load(model_path))
    model.eval()

    # Оценка
    evaluate_model(model, scaler, dataset, show_predictions=True, max_items=10)
