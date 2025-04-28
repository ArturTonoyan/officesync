import torch
from torch.utils.data import DataLoader, random_split
import torch.optim as optim
import torch.nn as nn

from data.dataset import EquipmentDataset
from models.model import EquipmentWearModel
from utils.utils import save_checkpoint

import os

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    base_dir = os.path.dirname(os.path.abspath(__file__))  # Папка, где находится train.py
    data_path = os.path.join(base_dir, "data", "test_cases.xlsx")  # Склей путь корректно через os

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Файл данных не найден по пути: {data_path}")

    dataset = EquipmentDataset(data_path)

    print("Датасет загружен ✅", dataset)

    # Разделяем на обучение и валидацию
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=8)

    model = EquipmentWearModel().to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    num_epochs = 30
    best_val_loss = float('inf')  # Инициализируем лучшее значение валидационных потерь

    for epoch in range(num_epochs):
        model.train()  # Включаем режим обучения
        running_loss = 0.0
        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)

            optimizer.zero_grad()
            outputs = model(inputs).squeeze()
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        avg_train_loss = running_loss / len(train_loader)
        print(f"Эпоха [{epoch+1}/{num_epochs}], Обучающие Потери: {avg_train_loss:.4f}")

        # Оценка на валидационных данных
        model.eval()  # Включаем режим оценки
        val_loss = 0.0
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)

                outputs = model(inputs).squeeze()
                loss = criterion(outputs, targets)
                val_loss += loss.item()

        avg_val_loss = val_loss / len(val_loader)
        print(f"Эпоха [{epoch+1}/{num_epochs}], Валидационные Потери: {avg_val_loss:.4f}")

        # Если валидационные потери улучшились, сохраняем модель
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            save_checkpoint(model, optimizer, epoch, avg_val_loss)
            print(f"Модель сохранена с улучшением на валидации (потери: {avg_val_loss:.4f})")

    print("Обучение завершено ✅")

if __name__ == "__main__":
    main()
