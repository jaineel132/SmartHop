import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

def generate_synthetic_rides(n_samples=2000):
    """
    Generates synthetic ride data for MySmartHop centering around a metropolitan area (e.g., Mumbai/New York vibe).
    """
    # Center coordinates (e.g., Mumbaiish)
    base_lat, base_lng = 19.0760, 72.8777
    
    data = []
    
    # Peak hours: 8-10 AM, 5-8 PM
    peak_hours = [8, 9, 10, 17, 18, 19, 20]
    
    for i in range(n_samples):
        # 1. Temporal Data
        days_offset = random.randint(0, 30)
        hour = random.randint(0, 23)
        minute = random.randint(0, 59)
        timestamp = datetime.now() - timedelta(days=days_offset, hours=hour, minutes=minute)
        
        # 2. Geo Data (Rides typically within 20km)
        p_lat = base_lat + (random.uniform(-0.15, 0.15))
        p_lng = base_lng + (random.uniform(-0.15, 0.15))
        
        # Drop location distance: 2km to 15km
        dist_offset_lat = random.uniform(0.02, 0.12) * random.choice([-1, 1])
        dist_offset_lng = random.uniform(0.02, 0.12) * random.choice([-1, 1])
        
        d_lat = p_lat + dist_offset_lat
        d_lng = p_lng + dist_offset_lng
        
        # 3. Calculate Haversine Distance (approximate)
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371 # Earth radius in km
            dLat = np.radians(lat2 - lat1)
            dLon = np.radians(lon2 - lon1)
            a = np.sin(dLat/2) * np.sin(dLat/2) + \
                np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * \
                np.sin(dLon/2) * np.sin(dLon/2)
            c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
            return R * c

        distance_km = haversine(p_lat, p_lng, d_lat, d_lng)
        
        # 4. Logic for Fare Prediction Training
        # Base fare $2 + $1.5 per km + peak multiplier
        base_fare = 2.0
        dist_rate = 1.5
        is_peak = 1 if hour in peak_hours else 0
        multiplier = 1.5 if is_peak else 1.0
        
        # Random noise for 'realism'
        noise = random.uniform(0.9, 1.1)
        
        solo_fare = (base_fare + (distance_km * dist_rate)) * multiplier * noise
        
        # Shared fare logic: 30-40% discount if clustered
        # Clustered if distance is similar and time is similar
        # For training, we randomly assign a 'cluster_size' from 1 to 4
        cluster_size = random.choices([1, 2, 3, 4], weights=[0.4, 0.3, 0.2, 0.1])[0]
        
        if cluster_size > 1:
            shared_fare = solo_fare * (1 - (0.15 * (cluster_size - 1))) # 15% discount per extra person
        else:
            shared_fare = solo_fare
            
        data.append({
            'ride_id': f'ride_{i}',
            'pickup_lat': p_lat,
            'pickup_lng': p_lng,
            'drop_lat': d_lat,
            'drop_lng': d_lng,
            'distance_km': round(distance_km, 2),
            'hour_of_day': hour,
            'is_peak_hour': is_peak,
            'day_of_week': timestamp.weekday(),
            'solo_fare': round(solo_fare, 2),
            'cluster_size': cluster_size,
            'shared_fare': round(shared_fare, 2),
            'rider_rating': round(random.uniform(3.5, 5.0), 1),
            'driver_rating': round(random.uniform(4.0, 5.0), 1)
        })

    df = pd.DataFrame(data)
    
    output_path = 'ml-service/data/synthetic_rides.csv'
    df.to_csv(output_path, index=False)
    print(f"✅ Generated {n_samples} rides in {output_path}")
    return df

if __name__ == "__main__":
    generate_synthetic_rides()
