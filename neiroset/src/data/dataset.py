import pandas as pd
import torch
from torch.utils.data import Dataset

headers = [
    "date_start", "work_hours", "max_work_hours", "average_daily_usage_hours",
    "maintenance_frequency_days", "wear"
]

class EquipmentDataset(Dataset):
    def __init__(self, excel_path):
        data = pd.read_excel(excel_path)

        # Убираем ненужные поля
        data = data.drop(columns=["id", "type_name"])

        # Преобразуем поле "previous_failures"
        data["total_failure_cost"] = data["previous_failures"].apply(self.calculate_total_failure_cost)
        data["failure_count"] = data["previous_failures"].apply(self.calculate_failure_count)
        data["total_failure_duration"] = data["previous_failures"].apply(self.calculate_total_failure_duration)

        # Преобразуем даты в числовой формат (например, количество дней с начала отсчета)
        data["date_start"] = pd.to_datetime(data["date_start"])
        data["date_start"] = (data["date_start"] - pd.Timestamp("1970-01-01")) // pd.Timedelta('1D')

        # Обновляем features с учётом новых признаков
        self.features = data[headers + ["total_failure_cost", "failure_count", "total_failure_duration"]].values
        self.targets = data["wear"].values

        # Преобразуем все данные в числовой формат
        self.features = self.features.astype(float)

    def calculate_total_failure_cost(self, failures):
        total_cost = 0
        if isinstance(failures, str):  # Проверяем, что failures является строкой
            for failure in failures.split(';'):
                parts = failure.split(',')
                cost = int(parts[-1].split(':')[-1].strip())  # Извлекаем стоимость из строки
                total_cost += cost
        return total_cost

    def calculate_failure_count(self, failures):
        if isinstance(failures, str):  # Проверяем, что failures является строкой
            return len(failures.split(';'))  # Количество ТО
        return 0  # Если не строка, возвращаем 0

    def calculate_total_failure_duration(self, failures):
        total_duration = 0
        if isinstance(failures, str):  # Проверяем, что failures является строкой
            for failure in failures.split(';'):
                parts = failure.split(',')
                start_date = parts[2].split(":")[-1].strip()
                end_date = parts[3].split(":")[-1].strip()
                start_date = pd.to_datetime(start_date)
                end_date = pd.to_datetime(end_date)
                total_duration += (end_date - start_date).days  # Продолжительность в днях
        return total_duration

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        # Преобразуем данные в тензоры
        x = torch.tensor(self.features[idx], dtype=torch.float32)
        y = torch.tensor(self.targets[idx], dtype=torch.float32)
        return x, y
