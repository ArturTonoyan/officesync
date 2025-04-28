import torch.nn as nn

class EquipmentWearModel(nn.Module):
    def __init__(self):
        super(EquipmentWearModel, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(9, 256),  # Увеличиваем количество нейронов на первом слое
            nn.ReLU(),
            nn.Linear(256, 128),  # Увеличиваем количество нейронов во втором слое
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 16),  # Еще один скрытый слой
            nn.ReLU(),
            nn.Linear(16, 8),   # Еще один скрытый слой
            nn.ReLU(),
            nn.Linear(8, 4),    # Еще один скрытый слой
            nn.ReLU(),
            nn.Linear(4, 2),    # Еще один скрытый слой
            nn.ReLU(),
            nn.Linear(2, 1),    # Выходной слой с 1 нейроном
            nn.Sigmoid()  # Поскольку wear от 0 до 1
        )

    def forward(self, x):
        return self.net(x)
