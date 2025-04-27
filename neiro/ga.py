import random
import numpy as np

def fitness_function(individual, features):
    # Простая линейная комбинация признаков и "генов"
    prediction = np.dot(features, individual)
    # Возвращаем нормализованное значение как "оценку"
    return np.clip(prediction, 0, 1)

def run_genetic_algorithm(features, population_size=50, generations=100, mutation_rate=0.1):
    num_features = len(features)
    # Инициализируем случайную популяцию (веса)
    population = [np.random.uniform(-1, 1, num_features) for _ in range(population_size)]

    for generation in range(generations):
        # Оценка приспособленности
        fitness_scores = [fitness_function(ind, features) for ind in population]

        # Селекция — выбираем лучших (top 20%)
        sorted_population = [x for _, x in sorted(zip(fitness_scores, population), key=lambda x: x[0], reverse=True)]
        survivors = sorted_population[:population_size // 5]

        # Скрещивание и мутация
        new_population = survivors.copy()
        while len(new_population) < population_size:
            parent1, parent2 = random.sample(survivors, 2)
            crossover_point = random.randint(1, num_features - 1)
            child = np.concatenate((parent1[:crossover_point], parent2[crossover_point:]))

            # Мутация
            if random.random() < mutation_rate:
                mutation_index = random.randint(0, num_features - 1)
                child[mutation_index] += np.random.normal()

            new_population.append(child)

        population = new_population

    # Лучший кандидат
    best_individual = max(population, key=lambda ind: fitness_function(ind, features))
    return fitness_function(best_individual, features)
