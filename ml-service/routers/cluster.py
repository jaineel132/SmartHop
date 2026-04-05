from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np

router = APIRouter()

class RiderRequest(BaseModel):
    user_id: str
    pickup_lat: float
    pickup_lng: float
    drop_lat: float
    drop_lng: float

@router.post("/cluster-riders")
async def cluster_riders(request: Request, riders: List[RiderRequest]):
    if not riders:
        return []
    
    dbscan = request.app.state.models.get("dbscan")
    cluster_scaler = request.app.state.models.get("cluster_scaler")
    
    if dbscan is None or cluster_scaler is None:
        raise HTTPException(status_code=503, detail="Clustering models not loaded")

    # Prepare features
    features = []
    for r in riders:
        features.append([r.pickup_lat, r.pickup_lng, r.drop_lat, r.drop_lng])
    
    X = np.array(features)
    
    # Use explicit DBSCAN for coordinates (eps=0.01 roughly 1km, min_samples=1)
    from sklearn.cluster import DBSCAN
    dbscan_model = DBSCAN(eps=0.01, min_samples=1)
    
    # Predict clusters
    labels = dbscan_model.fit_predict(X)
    
    # Group by labels
    clusters_data = {}
    for i, label in enumerate(labels):
        label = int(label)
        if label not in clusters_data:
            clusters_data[label] = {
                "cluster_size": 0,
                "rider_ids": [],
                "pickups": []
            }
        
        clusters_data[label]["cluster_size"] += 1
        clusters_data[label]["rider_ids"].append(riders[i].user_id)
        clusters_data[label]["pickups"].append([riders[i].pickup_lat, riders[i].pickup_lng])

    # Format result
    result = []
    
    # Helper to chunk list
    def chunk_list(lst, n):
        for i in range(0, len(lst), n):
            yield lst[i:i + n]

    for label, data in clusters_data.items():
        rider_chunks = list(chunk_list(data["rider_ids"], 3))
        pickup_chunks = list(chunk_list(data["pickups"], 3))
        
        for i, r_chunk in enumerate(rider_chunks):
            p_chunk = np.array(pickup_chunks[i])
            cluster_id = f"solo_{r_chunk[0]}" if label == -1 else f"cluster_{label}_{i}"
            
            center_lat = float(np.mean(p_chunk[:, 0]))
            center_lng = float(np.mean(p_chunk[:, 1]))
            
            result.append({
                "cluster_id": cluster_id,
                "rider_ids": r_chunk,
                "cluster_size": len(r_chunk),
                "center_lat": center_lat,
                "center_lng": center_lng
            })
            
    return result
