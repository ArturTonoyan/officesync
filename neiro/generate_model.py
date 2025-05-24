import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os
import pandas as pd  # Добавь этот импорт в начало файла


# Определение модели
class EquipmentFailureModel(nn.Module):
    def __init__(self, input_size):
        super(EquipmentFailureModel, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.fc2 = nn.Linear(64, 32)
        self.out_year = nn.Linear(32, 1)
        self.out_date = nn.Linear(32, 1)
        self.out_wear = nn.Linear(32, 1)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return (
            torch.sigmoid(self.out_year(x)),  # Прогноз на год
            torch.sigmoid(self.out_date(x)),  # Прогноз на дату
            torch.sigmoid(self.out_wear(x)),  # Прогноз на износ
        )

# Сгенерируем более реалистичные данные для обучения
def generate_realistic_data(num_samples=1000):
    np.random.seed(32)

    # ===== Основные случайные данные =====
    current_operation_time = np.random.uniform(0, 5000, num_samples).astype(np.float32)
    max_operation_time = np.random.uniform(1000, 50000, num_samples).astype(np.float32)
    equipment_cost = np.random.uniform(1000, 100000, num_samples).astype(np.float32)
    cost = np.random.uniform(500, 5000, num_samples).astype(np.float32)
    operating_violations = np.random.randint(0, 10, num_samples).astype(np.float32)
    maintenance_frequency = np.random.uniform(10, 500, num_samples).astype(np.float32)
    last_maintenance = np.random.uniform(0, 365, num_samples).astype(np.float32)

    # ===== Эталонные критические случаи =====
    manual_data = []
    for _ in range(50):  # 50 ручных критических случаев
        max_op = np.random.uniform(5000, 10000)
        cur_op = max_op - np.random.uniform(0, 100)  # близко к пределу
        manual_data.append([
            cur_op,
            max_op,
            np.random.uniform(1000, 20000),  # высокая стоимость
            np.random.uniform(2000, 5000),     # дорогой ремонт
            np.random.randint(0, 10),          # много нарушений
            np.random.uniform(0, 50),         # частое обслуживание
            np.random.uniform(0, 30)           # недавнее обслуживание
        ])

    manual_data = np.array(manual_data, dtype=np.float32)

    # Объединяем с обычными данными
    features = np.stack([current_operation_time, max_operation_time, equipment_cost,
                         cost, operating_violations, maintenance_frequency, last_maintenance], axis=1)
    features = np.vstack([features, manual_data])

    # Переменные
    current_operation_time = features[:, 0]
    max_operation_time = features[:, 1]
    operating_violations = features[:, 4]
    last_maintenance = features[:, 6]

    # ===== Целевые переменные =====
    probability_year_failure = 1 / (1 + np.exp(-0.0001 * current_operation_time + 0.1 * operating_violations))
    probability_on_date = 1 / (1 + np.exp(-0.0002 * current_operation_time - 0.05 * last_maintenance))
    wear = np.clip(current_operation_time / max_operation_time, 0, 1)

    # Если текущая наработка почти достигла максимума — 90%+ вероятности выхода
    near_end_life = (max_operation_time - current_operation_time) < 100
    probability_year_failure[near_end_life] = 0.9
    probability_on_date[near_end_life] = 0.95
    wear[near_end_life] = 0.98

    # Добавляем шум и клипуем
    target_year = np.clip(probability_year_failure + np.random.normal(0, 0.05, features.shape[0]), 0, 1)
    target_date = np.clip(probability_on_date + np.random.normal(0, 0.05, features.shape[0]), 0, 1)
    target_wear = np.clip(wear + np.random.normal(0, 0.05, features.shape[0]), 0, 1)

    # Сохраняем в Excel
    df = pd.DataFrame({
        "Текущая наработка": features[:, 0],
        "Максимальная наработка": features[:, 1],
        "Стоимость оборудования": features[:, 2],
        "Стоимость": features[:, 3],
        "Операционные нарушения": features[:, 4],
        "Частота обслуживания": features[:, 5],
        "Последнее обслуживание": features[:, 6],
        "Вероятность выхода из строя в течении года": target_year,
        "Вероятность выхода из строя на дату": target_date,
        "Износ": target_wear
    })

    # Excel
    output_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "realistic_data.xlsx")
    with pd.ExcelWriter(output_path, engine="xlsxwriter") as writer:
        df.to_excel(writer, index=False, sheet_name="Data")
        worksheet = writer.sheets["Data"]
        for i, column in enumerate(df.columns):
            worksheet.set_column(i, i, 25)

    return (
        torch.tensor(features, dtype=torch.float32),
        torch.tensor(target_year, dtype=torch.float32).unsqueeze(1),  # [N] -> [N,1]
        torch.tensor(target_date, dtype=torch.float32).unsqueeze(1),
        torch.tensor(target_wear, dtype=torch.float32).unsqueeze(1)
    )

def load_model(progress_status):
    # Инициализация модели
    input_size = 7  # Увеличиваем количество признаков
    model = EquipmentFailureModel(input_size)

    # Сгенерируем более реалистичные данные
    X_train, y_year, y_date, y_wear = generate_realistic_data( )

    # Настроим оптимизатор и функцию потерь
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()

    # Обучение модели (увеличиваем количество эпох до 100)
    num_epochs = 100
    for epoch in range(num_epochs):
        model.train()
        
        # Прямой проход
        optimizer.zero_grad()
        year_pred, date_pred, wear_pred = model(X_train)
        
        # Потери
        loss_year = criterion(year_pred, y_year)
        loss_date = criterion(date_pred, y_date)
        loss_wear = criterion(wear_pred, y_wear)
        loss = loss_year + loss_date + loss_wear
        
        # Обратный проход
        loss.backward()
        optimizer.step()
        
        if (epoch + 1) % 10 == 0:  # Печатаем каждую 10-ю эпоху
            print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}")
            if progress_status and epoch % 10 == 0:
                progress_status["value"] = {epoch+1}/{num_epochs}/10

    # Сохраним модель
    model_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "model.pth")
    torch.save(model.state_dict(), model_path)


if __name__ == "__main__":
    progress_status = {}
    load_model(progress_status)
    print("Обучение завершено.")