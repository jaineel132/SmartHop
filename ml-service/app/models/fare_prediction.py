import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def train_fare_prediction():
    print("⏳ Loading data for fare prediction...")
    df = pd.read_csv('ml-service/data/synthetic_rides.csv')
    
    # Features: distance, peak hour, day of week, cluster size
    features = ['distance_km', 'is_peak_hour', 'day_of_week', 'cluster_size']
    target = 'solo_fare'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 1. Random Forest Regressor
    print("🤖 Training Random Forest Regressor...")
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    
    y_pred = rf_model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"✅ RF MAE: {mae:.4f}")
    print(f"✅ RF R2 Score: {r2:.4f}")
    
    # 2. Linear Regression (Baseline)
    print("🤖 Training Linear Regression...")
    lr_model = LinearRegression()
    lr_model.fit(X_train, y_train)
    
    # Save best model (RF usually wins)
    joblib.dump(rf_model, 'ml-service/trained_models/fare_rf_model.joblib')
    print("💾 Fare prediction model saved.")

if __name__ == "__main__":
    train_fare_prediction()
