import torch
from torch.utils.data import Dataset

class WearDataset(Dataset):
    def __init__(self, data):
        self.X = data.drop(columns=["wear"]).values.astype("float32")
        self.y = data["wear"].values.astype("float32").reshape(-1, 1)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return torch.tensor(self.X[idx]), torch.tensor(self.y[idx])
