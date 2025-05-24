from datetime import datetime

def preprocess(data, target_date: str):
    # Преобразуем targetDate в объект datetime
    target_date = datetime.strptime(target_date, "%Y-%m-%d")
    
    # Преобразуем lastTO в datetime, если оно в строковом формате
    last_to_date = datetime.strptime(data.lastTO, "%Y-%m-%d") if isinstance(data.lastTO, str) else data.lastTO
    
    # Рассчитываем количество дней с последнего ТО до targetDate
    days_since_last_to = (target_date - last_to_date).days
    
    # Добавляем новый признак для дней до targetDate
    data.days_since_last_to = days_since_last_to
    
    # Преобразуем все необходимые данные в числовой формат (например, cost, maxOperationTime)
    features = [
        data.currentOperationTime/ 500,
        data.maxOperationTime/ 100,
        data.equipmentCost/ 10000,
        data.cost/ 50000,
        data.operatingViolations/ 10,
        data.maintenanceFrequency / 500,
        data.days_since_last_to/ 2000  # Новый признак
    ]
    
    return features

def preprocessWear(data, target_date: str):
    target_date = datetime.strptime(target_date, "%Y-%m-%d")
    last_to_date = datetime.strptime(data.lastTO, "%Y-%m-%d") if isinstance(data.lastTO, str) else data.lastTO
    days_since_last_to = (target_date - last_to_date).days
    data.days_since_last_to = days_since_last_to
    features = [
        data.currentOperationTime/ 5000,
        data.maxOperationTime/ 10000,
        data.equipmentCost/ 10000,
        data.cost/ 5000,
        data.operatingViolations/ 10,
        data.maintenanceFrequency / 500,
        data.days_since_last_to/ 365  # Новый признак
    ]
    return features

def preprocessFailure(data, target_date: str):
    target_date = datetime.strptime(target_date, "%Y-%m-%d")
    last_to_date = datetime.strptime(data.lastTO, "%Y-%m-%d") if isinstance(data.lastTO, str) else data.lastTO
    days_since_last_to = (target_date - last_to_date).days
    data.days_since_last_to = days_since_last_to
    features = [
        data.currentOperationTime/ 5000,
        data.maxOperationTime/ 10000,
        data.equipmentCost/ 10000,
        data.cost/ 5000,
        data.operatingViolations/ 10,
        data.maintenanceFrequency / 500,
        data.days_since_last_to/ 365  # Новый признак
    ]
    return features

