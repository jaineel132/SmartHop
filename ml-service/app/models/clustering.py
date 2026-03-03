import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib
import os

def train_clustering():
    print("⏳ Loading data for clustering...")
    df = pd.read_csv('ml-service/data/synthetic_rides.csv')
    
    # We cluster based on pickup location and hour of day
    features = ['pickup_lat', 'pickup_lng', 'hour_of_day']
    X = df[features]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # 1. KMeans
    print("🤖 Training KMeans...")
    kmeans = KMeans(n_clusters=10, random_state=42, n_init=10)
    kmeans_labels = kmeans.fit_predict(X_scaled)
    kmeans_score = silhouette_score(X_scaled, kmeans_labels)
    print(f"✅ KMeans Silhouette Score: {kmeans_score:.4f}")
    
    # 2. DBSCAN
    print("🤖 Training DBSCAN...")
    dbscan = DBSCAN(eps=0.3, min_samples=5)
    dbscan_labels = dbscan.fit_predict(X_scaled)
    # Filter for noise (-1) to calculate score
    if len(set(dbscan_labels)) > 1:
        dbscan_score = silhouette_score(X_scaled, dbscan_labels)
        print(f"✅ DBSCAN Silhouette Score: {dbscan_score:.4f}")
    
    # Save models and scaler
    joblib.dump(kmeans, 'ml-service/trained_models/kmeans_model.joblib')
    joblib.dump(scaler, 'ml-service/trained_models/clustering_scaler.joblib')
    print("💾 Clustering models saved.")

if __name__ == "__main__":
    train_clustering()
