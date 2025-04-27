from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import torch
 
def evaluate_model(model, X, y_true):
    model.eval()
    with torch.no_grad():
        y_pred_year, y_pred_date, y_pred_wear = model(X)

        mse_year = mean_squared_error(y_true[0], y_pred_year.numpy())
        mse_date = mean_squared_error(y_true[1], y_pred_date.numpy())
        mse_wear = mean_squared_error(y_true[2], y_pred_wear.numpy())

        mae_year = mean_absolute_error(y_true[0], y_pred_year.numpy())
        mae_date = mean_absolute_error(y_true[1], y_pred_date.numpy())
        mae_wear = mean_absolute_error(y_true[2], y_pred_wear.numpy())

        r2_year = r2_score(y_true[0], y_pred_year.numpy())
        r2_date = r2_score(y_true[1], y_pred_date.numpy())
        r2_wear = r2_score(y_true[2], y_pred_wear.numpy())

    return {
        "mse": {"year": mse_year, "date": mse_date, "wear": mse_wear},
        "mae": {"year": mae_year, "date": mae_date, "wear": mae_wear},
        "r2":  {"year": r2_year,  "date": r2_date,  "wear": r2_wear}
    }
