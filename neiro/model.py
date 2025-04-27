import torch
import torch.nn as nn
import torch.optim as optim
import random
import numpy as np

# Определение модели
class EquipmentFailureModel(nn.Module):
    def __init__(self, input_size=7):
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
            torch.sigmoid(self.out_year(x)),
            torch.sigmoid(self.out_date(x)),
            torch.sigmoid(self.out_wear(x)),
        )

# Функция приспособленности (ошибка на валидационной выборке)
def fitness_function(model, data_loader, criterion):
    model.eval()
    total_loss = 0
    with torch.no_grad():
        for inputs, targets in data_loader:
            year_pred, date_pred, wear_pred = model(inputs)
            loss_year = criterion(year_pred, targets[0])
            loss_date = criterion(date_pred, targets[1])
            loss_wear = criterion(wear_pred, targets[2])
            total_loss += (loss_year + loss_date + loss_wear).item()
    return total_loss / len(data_loader)

# Генетический алгоритм для оптимизации нейронной сети
def run_genetic_algorithm(model, data_loader, population_size=50, generations=100, mutation_rate=0.1, lr=0.001):
    input_size = model.fc1.in_features
    # Инициализация популяции: случайные веса модели
    population = [np.random.uniform(-1, 1, model.parameters().__len__()) for _ in range(population_size)]
    
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()
    
    for generation in range(generations):
        fitness_scores = []
        
        # Оценка приспособленности для каждого индивида (модели с разными весами)
        for ind in population:
            set_weights_to_model(model, ind)  # Устанавливаем веса модели
            fitness = fitness_function(model, data_loader, criterion)
            fitness_scores.append(fitness)
        
        # Селекция — выбираем лучшие особи (top 20%)
        sorted_population = [x for _, x in sorted(zip(fitness_scores, population), key=lambda x: x[0])]
        survivors = sorted_population[:population_size // 5]

        # Скрещивание и мутация
        new_population = survivors.copy()
        while len(new_population) < population_size:
            parent1, parent2 = random.sample(survivors, 2)
            crossover_point = random.randint(1, len(parent1) - 1)
            child = np.concatenate((parent1[:crossover_point], parent2[crossover_point:]))

            # Мутация
            if random.random() < mutation_rate:
                mutation_index = random.randint(0, len(child) - 1)
                child[mutation_index] += np.random.normal()

            new_population.append(child)

        population = new_population

    # Выбираем лучшего кандидата
    best_individual = min(population, key=lambda ind: fitness_function(model, data_loader, criterion))
    set_weights_to_model(model, best_individual)  # Устанавливаем лучшие веса модели

# Функция для установки весов модели
def set_weights_to_model(model, weights):
    idx = 0
    for param in model.parameters():
        num_params = param.numel()
        param.data = torch.tensor(weights[idx:idx+num_params].reshape(param.shape))
        idx += num_params
