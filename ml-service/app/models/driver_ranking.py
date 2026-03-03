import numpy as np
import pandas as pd

def rank_drivers(drivers, ride_location):
    """
    Ranks drivers based on a weighted score of distance, rating, and acceptance probability.
    
    drivers: list of dicts {driver_id, lat, lng, rating, acceptance_rate}
    ride_location: {lat, lng}
    """
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        dLat = np.radians(lat2 - lat1)
        dLon = np.radians(lon2 - lon1)
        a = np.sin(dLat/2) * np.sin(dLat/2) + \
            np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * \
            np.sin(dLon/2) * np.sin(dLon/2)
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        return R * c

    ranked_list = []
    
    for d in drivers:
        dist = haversine(ride_location['lat'], ride_location['lng'], d['lat'], d['lng'])
        
        # Weighted Score Logic
        # 1. Proximity (Inverse distance) - closer is better
        dist_score = 1.0 / (1.0 + dist)
        
        # 2. Rating (Normalized 0-1)
        rating_score = d['rating'] / 5.0
        
        # 3. Reliability (Acceptance rate normalized)
        acceptance_score = d['acceptance_rate'] / 100.0
        
        # Final Score: 50% proximity, 30% rating, 20% reliability
        final_score = (dist_score * 0.5) + (rating_score * 0.3) + (acceptance_score * 0.2)
        
        ranked_list.append({
            'driver_id': d['driver_id'],
            'score': round(final_score, 4),
            'distance_km': round(dist, 2),
            'rating': d['rating'],
            'acceptance_probability': round(acceptance_score * 0.9, 2) # Simulated prob
        })
    
    # Sort by score descending
    ranked_list.sort(key=lambda x: x['score'], reverse=True)
    return ranked_list
