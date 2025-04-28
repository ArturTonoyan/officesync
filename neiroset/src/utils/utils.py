import torch
import os

def save_checkpoint(model, optimizer, epoch, loss, filename="checkpoint.pth"):
    # Указываем путь к папке src/data
    base_dir = os.path.dirname(os.path.abspath(__file__))  # Папка, где находится текущий файл
    save_path = os.path.join(base_dir, "../data", filename)

    # Проверяем, существует ли папка, если нет, создаём её
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "epoch": epoch,
        "loss": loss
    }

    # Сохраняем файл
    torch.save(checkpoint, save_path)
    print(f"Модель сохранена в {save_path}")


# Функция для загрузки чекпоинта
def load_checkpoint(model, optimizer, filename="data/checkpoint.pth"):
    checkpoint = torch.load(filename)
    model.load_state_dict(checkpoint["model_state_dict"])
    optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    epoch = checkpoint["epoch"]
    loss = checkpoint["loss"]
    print(f"Модель загружена из {filename}, эпоха {epoch}, потери: {loss}")
    return model, optimizer, epoch, loss