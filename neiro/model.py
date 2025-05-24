import torch
import torch.nn as nn

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

# Функция для установки весов модели
def set_weights_to_model(model, weights):
    idx = 0
    for param in model.parameters():
        num_params = param.numel()
        param.data = torch.tensor(weights[idx:idx+num_params].reshape(param.shape))
        idx += num_params
