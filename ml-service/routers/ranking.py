from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np

router = APIRouter()

class Driver(BaseModel):
    driver_id: str
    lat: float
    lng: float
    rating: float
    acceptance_rate: float
    total_rides: int
    is_rush_hour: bool = False
    demand_level: float = 0.5

class RankingRequest(BaseModel):
    drivers: List[Driver]
    station_lat: float
    station_lng: float

@router.post("/rank-drivers")
async def rank_drivers(request: Request, data: RankingRequest):
    if not data.drivers:
        return []
    
    model = request.app.state.models.get("driver_ranking")
    scaler = request.app.state.models.get("ranking_scaler")
    
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Driver ranking models not loaded")
    
    features = []
    for d in data.drivers:
        # Distance from station
        dist = np.sqrt((d.lat - data.station_lat)**2 + (d.lng - data.station_lng)**2)
        
        # Order must match ranking_metrics.json:
        # 1. driver_rating
        # 2. driver_acceptance_rate
        # 3. driver_total_rides
        # 4. driver_distance_km
        # 5. is_rush_hour
        # 6. demand_level
        features.append([
            d.rating,
            d.acceptance_rate,
            d.total_rides,
            dist,
            float(d.is_rush_hour),
            d.demand_level
        ])
    
    X = np.array(features)
    X_scaled = scaler.transform(X)
    
    # Predict scores
    scores = model.predict(X_scaled)
    
    # Format and sort
    results = []
    for i, d in enumerate(data.drivers):
        results.append({
            "driver_id": d.driver_id,
            "score": float(scores[i])
        })
        
    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return results
