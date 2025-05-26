# запуск обучения модели

import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader
import torch
import joblib

from datasets.wear_dataset import WearDataset
from models.model import WearPredictor
from training.train import train_model

if __name__ == "__main__":
    # Получаем абсолютный путь к текущей директории проекта
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    # Пути к файлам
    data_path = os.path.join(BASE_DIR, "data", "generated_dataset.csv")
    model_path = os.path.join(BASE_DIR, "wear_model.pth")
    scaler_path = os.path.join(BASE_DIR, "scaler", "scaler.pkl")

    # Загрузка и масштабирование данных
    df = pd.read_csv(data_path)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df.drop(columns=["wear"]))
    df_scaled = pd.DataFrame(X_scaled, columns=df.columns[:-1])
    df_scaled["wear"] = df["wear"]

    # Деление на тренировочную и валидационную выборки
    train_df, val_df = train_test_split(df_scaled, test_size=0.2, random_state=42)

    train_dataset = WearDataset(train_df)
    val_dataset = WearDataset(val_df)

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32)

    # Обучение модели
    model = WearPredictor(input_size=4)
    train_model(model, train_loader, val_loader)

    # Сохранение модели и scaler'а
    torch.save(model.state_dict(), model_path)
    os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
    joblib.dump(scaler, scaler_path)
