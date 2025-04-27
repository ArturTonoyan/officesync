import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from fastapi import APIRouter
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

# Генерация случайных весов для модели
def random_weights(model):
    weights = []
    for param in model.parameters():
        weights.append(param.data.view(-1))  # Преобразуем тензор в одномерный вектор
    return torch.cat(weights)  # Объединяем все вектора весов в один

# Установка весов модели из одномерного вектора
def set_weights(model, weights):
    idx = 0
    for param in model.parameters():
        num_params = param.numel()
        param.data = weights[idx:idx + num_params].view(param.shape)
        idx += num_params

# Функция фитнеса для генетического алгоритма
def fitness_function(model, X_train, y_year, y_date, y_wear, criterion):
    set_weights(model, model.current_weights)  # Устанавливаем веса из текущего вектора
    model.eval()
    
    # Прямой проход
    year_pred, date_pred, wear_pred = model(X_train)
    
    # Потери
    loss_year = criterion(year_pred, y_year)
    loss_date = criterion(date_pred, y_date)
    loss_wear = criterion(wear_pred, y_wear)
    total_loss = loss_year + loss_date + loss_wear
    
    return total_loss.item()

# Генетический алгоритм
def genetic_algorithm(model, X_train, y_year, y_date, y_wear, population_size=50, generations=100, mutation_rate=0.1, progress_status=None):
    # Инициализация популяции случайных весов
    population = [random_weights(model) for _ in range(population_size)]
    
    # Настройка критерия потерь
    criterion = nn.MSELoss()
    
    for generation in range(generations):
        fitness_scores = []
        
        # Оценка фитнеса каждой особи
        for weights in population:
            model.current_weights = weights  # Устанавливаем текущие веса
            fitness = fitness_function(model, X_train, y_year, y_date, y_wear, criterion)
            fitness_scores.append(fitness)
        
        # Селекция: выбираем лучших особей
        sorted_indices = np.argsort(fitness_scores)
        best_population = [population[i] for i in sorted_indices[:population_size // 2]]  # 50% лучших
        
        # Кроссовер: создание новых особей
        next_generation = []
        for i in range(0, len(best_population), 2):
            parent1 = best_population[i]
            parent2 = best_population[i + 1] if i + 1 < len(best_population) else best_population[0]
            
            # Точечный кроссовер
            crossover_point = np.random.randint(0, len(parent1))
            child1 = torch.cat([parent1[:crossover_point], parent2[crossover_point:]])
            child2 = torch.cat([parent2[:crossover_point], parent1[crossover_point:]])
            
            next_generation.append(child1)
            next_generation.append(child2)
        
        # Мутация
        for i in range(len(next_generation)):
            if np.random.rand() < mutation_rate:
                mutation_idx = np.random.randint(0, len(next_generation[i]))
                mutation_value = np.random.normal(0, 0.1)  # Добавляем шум
                next_generation[i][mutation_idx] += mutation_value
        
        # Обновляем популяцию
        population = next_generation
    
        # Печатаем прогресс
        print(f"Generation [{generation+1}/{generations}], Best Fitness: {min(fitness_scores):.4f}")
        if progress_status:
            progress_status["value"] = 10 + int(generations / 100 * 60)
            progress_status["message"] = f"Training default model... Gen {generations+1}/100"
        
    # Лучшие веса
    best_weights = population[0]
    set_weights(model, best_weights)  # Устанавливаем лучшие веса в модель
    return model

# Генерация данных для обучения
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
    probability_on_date = 1 / (1 + np.exp(-0.0002 * current_operation_time - 0.07 * last_maintenance))
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


def generate_model(progress_status):
    # Инициализация модели и данных
    model = EquipmentFailureModel(input_size=7)
    X_train, y_year, y_date, y_wear = generate_realistic_data()

    # Запуск генетического алгоритма
    model = genetic_algorithm(model, X_train, y_year, y_date, y_wear, population_size=50, generations=100, mutation_rate=0.1, progress_status=progress_status)

    # Сохранение оптимизированной модели
    torch.save(model.state_dict(), 'ga_model.pth')


