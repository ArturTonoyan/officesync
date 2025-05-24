import torch.nn as nn

class EquipmentWearModel(nn.Module):
    def __init__(self):
        super(EquipmentWearModel, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(9, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()  # Для предсказания в диапазоне [0, 1]
        )

    def forward(self, x):
        return self.net(x)
