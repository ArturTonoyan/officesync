import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os


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
    np.random.seed(42)
    
    # Признаки
    current_operation_time = np.random.uniform(0, 5000, num_samples).astype(np.float32)
    max_operation_time = np.random.uniform(1000, 10000, num_samples).astype(np.float32)
    equipment_cost = np.random.uniform(1000, 10000, num_samples).astype(np.float32)
    cost = np.random.uniform(500, 5000, num_samples).astype(np.float32)
    operating_violations = np.random.randint(0, 10, num_samples).astype(np.float32)
    maintenance_frequency = np.random.uniform(10, 500, num_samples).astype(np.float32)
    last_maintenance = np.random.uniform(0, 365, num_samples).astype(np.float32)

    features = np.stack([current_operation_time, max_operation_time, equipment_cost,
                         cost, operating_violations, maintenance_frequency, last_maintenance], axis=1)

    # Моделируем более реалистичные цели с добавлением шума
    probability_year_failure = 1 / (1 + np.exp(-0.0001 * current_operation_time + 0.1 * operating_violations))
    probability_on_date = 1 / (1 + np.exp(-0.0002 * current_operation_time - 0.05 * last_maintenance))
    wear = np.clip((current_operation_time / max_operation_time) + 0.1 * operating_violations, 0, 1)

    # Добавляем небольшой шум для большей реалистичности
    target_year = probability_year_failure + np.random.normal(0, 0.05, num_samples).astype(np.float32)
    target_date = probability_on_date + np.random.normal(0, 0.05, num_samples).astype(np.float32)
    target_wear = wear + np.random.normal(0, 0.05, num_samples).astype(np.float32)

    # Применяем нормализацию для целевых переменных
    target_year = np.clip(target_year, 0, 1)
    target_date = np.clip(target_date, 0, 1)
    target_wear = np.clip(target_wear, 0, 1)

    return torch.tensor(features), torch.tensor(target_year), torch.tensor(target_date), torch.tensor(target_wear)


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
    num_epochs = 1000
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

# load_model()