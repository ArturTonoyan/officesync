import torch
from torch.utils.data import DataLoader
from models.model import EquipmentWearModel
from data.dataset import EquipmentDataset
from utils.utils import load_checkpoint
import os
import numpy as np
from sklearn.metrics import mean_squared_error
import pandas as pd

def main():
    # Устройство для вычислений
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Абсолютный путь к данным и модели
    base_dir = os.path.dirname(os.path.abspath(__file__))  # Папка, где находится скрипт
    real_data_path = os.path.join(base_dir, "data", "real_data.xlsx")
    checkpoint_path = os.path.join(base_dir, "data", "checkpoint.pth")

    # Проверка существования файлов
    if not os.path.exists(real_data_path):
        raise FileNotFoundError(f"Файл данных не найден по пути: {real_data_path}")
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Модель не найдена по пути: {checkpoint_path}")

    # Загрузка данных
    real_dataset = EquipmentDataset(real_data_path)
    real_loader = DataLoader(real_dataset, batch_size=8)

    # Инициализация модели и загрузка чекпоинта
    model = EquipmentWearModel().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # Загрузка модели
    model, optimizer, epoch, loss = load_checkpoint(model, optimizer, checkpoint_path)

    # Оценка модели на реальных данных
    model.eval()

    real_values = []
    predictions = []

    with torch.no_grad():  # Отключаем вычисление градиентов
        for inputs, targets in real_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs).squeeze()

            real_values.extend(targets.cpu().numpy())
            predictions.extend(outputs.cpu().numpy())

    # Преобразование в numpy для оценки
    real_values = np.array(real_values)
    predictions = np.array(predictions)

    # Вычисляем метрики
    mse = mean_squared_error(real_values, predictions)
    print(f"Среднеквадратичная ошибка: {mse:.4f}")

    # Создаем DataFrame для вывода результатов
    results_df = pd.DataFrame({
        'Реальные значения': real_values,
        'Прогнозируемые значения': predictions,
        'Ошибка': real_values - predictions
    })

    # Печатаем несколько строк с результатами
    print("\nПервые 10 результатов:")
    print(results_df.head(10))

if __name__ == "__main__":
    main()
