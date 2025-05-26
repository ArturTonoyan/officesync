# {
#     "maximumOperatingTime": 50000, # максимальная наработка
#     "currentOperatingTime": 10000, # текущая наработка
#     "age": 2, # возраст
#     "numberTo": 2, # колличество технического обслуживания
#     "wear": 10000 / (50000 / 100) + 2 - 2 * 0.5 # износ
# }

import pandas as pd
import random


# Формула для вычисления износа
def calculate_wear(max_oper_time, curr_oper_time, age, number_to):
    return curr_oper_time / (max_oper_time / 100) + age - number_to * 0.5
def calculate_age(curr_oper_time):
    return round(curr_oper_time / random.randint(2000, 3000)) # округляем до целого, в среднем оборудование работает 2500 часов в год

def calculate_number_to(age):
    return round(age * random.uniform(0.5, 3))

# Функция генерации одного примера данных
def generate_sample():
    max_oper_time = random.randint(1000, 100000)
    curr_oper_time = random.randint(0, max_oper_time)
    age = calculate_age(curr_oper_time)
    number_to = calculate_number_to(age)
    wear = calculate_wear(max_oper_time, curr_oper_time, age, number_to)
    return {
        "maximumOperatingTime": max_oper_time,
        "currentOperatingTime": curr_oper_time,
        "age": age,
        "numberTo": number_to,
        "wear": wear
    }

# Генерация датасета
def generate_dataset(num_samples=1000, output_file="generated_dataset.csv"):
    data = [generate_sample() for _ in range(num_samples)]
    df = pd.DataFrame(data)
    df.to_csv(output_file, index=False)
    print(f"Датасет сохранён в {output_file}")

if __name__ == "__main__":
    generate_dataset()
