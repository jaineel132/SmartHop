from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import joblib
import pandas as pd
import numpy as np
from app.models.driver_ranking import rank_drivers
import os

app = FastAPI(title="MySmartHop ML Service")

# Load Models
try:
    kmeans = joblib.load('trained_models/kmeans_model.joblib')
    clustering_scaler = joblib.load('trained_models/clustering_scaler.joblib')
    fare_model = joblib.load('trained_models/fare_rf_model.joblib')
except Exception as e:
    print(f"⚠️ Warning: Some models could not be loaded: {e}")

class ClusterRequest(BaseModel):
    pickup_lat: float
    pickup_lng: float
    hour_of_day: int

class FareRequest(BaseModel):
    distance_km: float
    is_peak_hour: bool
    day_of_week: int
    cluster_size: int

class DriverInfo(BaseModel):
    driver_id: str
    lat: float
    lng: float
    rating: float
    acceptance_rate: float

class RankRequest(BaseModel):
    ride_lat: float
    ride_lng: float
    drivers: List[DriverInfo]

@app.get("/")
def read_root():
    return {"status": "ML Service is Online"}

@app.post("/cluster")
def predict_cluster(req: ClusterRequest):
    try:
        data = [[req.pickup_lat, req.pickup_lng, req.hour_of_day]]
        scaled_data = clustering_scaler.transform(data)
        cluster_id = int(kmeans.predict(scaled_data)[0])
        return {
            "cluster_id": cluster_id,
            "algorithm": "KMeans",
            "silhouette_score": 0.457 # Hardcoded for demo/baseline
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-fare")
def predict_fare(req: FareRequest):
    try:
        # Create DF to match feature names if needed, or use array if model expects it
        data = [[req.distance_km, int(req.is_peak_hour), req.day_of_week, req.cluster_size]]
        predicted_solo = float(fare_model.predict(data)[0])
        
        # Calculate shared fare (simulation logic based on discount)
        savings_pct = 0.15 * (req.cluster_size - 1) if req.cluster_size > 1 else 0
        predicted_shared = predicted_solo * (1 - savings_pct)
        
        return {
            "predicted_solo_fare": round(predicted_solo, 2),
            "predicted_shared_fare": round(predicted_shared, 2),
            "savings_pct": round(savings_pct * 100, 1),
            "model_used": "RandomForest"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rank-drivers")
def get_driver_rankings(req: RankRequest):
    try:
        driver_dicts = [d.dict() for d in req.drivers]
        ride_loc = {"lat": req.ride_lat, "lng": req.ride_lng}
        ranked = rank_drivers(driver_dicts, ride_loc)
        return {"drivers": ranked}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
