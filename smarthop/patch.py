import os

file_path = 'app/rider/request-ride/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the dbStationId state variable if it doesn't exist
if 'const [dbStationId, setDbStationId]' not in content:
    state_target = 'const [memberNames, setMemberNames] = useState<string[]>([])'
    state_replacement = state_target + '\n  const [dbStationId, setDbStationId] = useState<string | null>(null)'
    content = content.replace(state_target, state_replacement)

# Replace runClustering and insert the useEffect
start_marker = '  // Step 3: ML Clustering\n  const runClustering = async () => {'
end_marker = '  // Step 5: Confirm'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

replacement = """  // Step 3: ML Clustering Initiation
  const runClustering = async () => {
    if (!pickupStation || destLat === null || destLng === null || !user) return

    setStep(3)
    setLoadingMsgIndex(0)
    setIsMLDown(false)

    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 1500)

    try {
      // 1. Create ride_request in Supabase immediately
      const { data: dbStation } = await supabase
        .from('metro_stations')
        .select('id')
        .eq('name', pickupStation.name)
        .single()

      if (dbStation) {
        setDbStationId(dbStation.id)
        
        const hour = getCurrentHour()
        const day = getCurrentDayOfWeek()
        const demand = getDemandLevel(hour, day)

        const { data: rideReq, error: rideErr } = await supabase
          .from('ride_requests')
          .insert({
            user_id: user.id,
            pickup_station_id: dbStation.id,
            dest_lat: destLat,
            dest_lng: destLng,
            dest_address: destAddress,
            hour,
            day_of_week: day,
            demand_level: demand,
            status: 'pending',
          })
          .select()
          .single()

        if (!rideErr && rideReq) {
          setRideRequestId(rideReq.id)
        } else {
          console.warn('Supabase ride_request insert failed:', rideErr)
        }
      }
    } catch (err) {
      console.warn('Clustering flow error:', err)
    } finally {
      clearInterval(interval)
      // Transition immediately without waiting
      setStep(4)
    }
  }

  // Live Waiting Room via Supabase Realtime
  useEffect(() => {
    if (step !== 4 || !user || !dbStationId || !pickupStation || !destLat || !destLng) return

    const refreshCluster = async () => {
      try {
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const { data: pendingRequests } = await supabase
          .from('ride_requests')
          .select('user_id, dest_lat, dest_lng')
          .eq('pickup_station_id', dbStationId)
          .in('status', ['pending', 'confirmed'])
          .gte('created_at', tenMinAgo)

        let allRiders: any[] = []
        if (pendingRequests && pendingRequests.length > 0) {
          allRiders = pendingRequests.map((r: any) => ({
            user_id: r.user_id,
            pickup_lat: pickupStation.lat,
            pickup_lng: pickupStation.lng,
            drop_lat: r.dest_lat,
            drop_lng: r.dest_lng,
          }))
        }

        // Ensure current user is included
        if (!allRiders.find((r: any) => r.user_id === user.id)) {
          allRiders.push({
            user_id: user.id,
            pickup_lat: pickupStation.lat,
            pickup_lng: pickupStation.lng,
            drop_lat: destLat,
            drop_lng: destLng,
          })
        }

        // Check ML cluster
        const clusters: any = await ML_API.clusterRiders(allRiders).catch(() => null)
        let myCluster: any = null
        if (clusters && Array.isArray(clusters)) {
          myCluster = clusters.find((c: any) => c.rider_ids?.includes(user.id)) || null
          if (!myCluster && clusters.length > 0) myCluster = clusters[0]
        }

        const clusterSize = Math.max(allRiders.length, 1)
        if (!myCluster) {
          setIsMLDown(true)
          myCluster = {
            cluster_id: `local_${dbStationId}`,
            rider_ids: allRiders.map((r: any) => r.user_id),
            cluster_size: clusterSize,
            center_lat: pickupStation.lat,
            center_lng: pickupStation.lng,
          }
        } else {
          setIsMLDown(false)
        }

        setClusterResult(myCluster)

        // User Names
        if (myCluster?.rider_ids) {
          const { data: _users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', myCluster.rider_ids)
          if (_users && _users.length > 0) {
            setMemberNames(_users.filter((u: any) => u.id !== user.id).map((u: any) => u.name))
          }
        }

        // Calculate Fare
        const hour = getCurrentHour()
        const day = getCurrentDayOfWeek()
        const demand = getDemandLevel(hour, day)
        const distanceMeters = haversineDistance(pickupStation.lat, pickupStation.lng, destLat, destLng)
        const distanceKm = distanceMeters / 1000
        
        const clusterRiderIds = myCluster.rider_ids || []
        const clusterRiders = allRiders.filter((r: any) => clusterRiderIds.includes(r.user_id))
        const allSameDestination = clusterRiders.length > 1 && clusterRiders.every((r: any) => {
          return haversineDistance(r.drop_lat, r.drop_lng, destLat, destLng) < 1000
        })

        const calcLocalFare = (clusterSz: number) => {
          const soloFare = Math.round(Math.max(25, distanceKm * 12))
          let sharedFare, discount
          if (allSameDestination && clusterSz > 1) {
            sharedFare = Math.round(soloFare / clusterSz)
            discount = Math.round((1 - sharedFare / soloFare) * 100)
          } else if (clusterSz > 1) {
            sharedFare = Math.round(soloFare * 0.9)
            discount = 10
          } else {
            sharedFare = soloFare
            discount = 0
          }
          return {
            shared_fare: sharedFare,
            solo_fare: soloFare,
            savings_pct: discount,
            explanation: {
              distance_impact_pct: 60,
              sharing_discount_pct: discount,
              time_surge_pct: 5,
              human_readable: allSameDestination && clusterSz > 1 ? `Same destination! ₹${soloFare} split among ${clusterSz} riders = ₹${sharedFare} each. Save ${discount}%!` : clusterSz > 1 ? `Different destinations — each rider pays for their km with a 10% sharing discount.` : `Solo ride fare for ${distanceKm.toFixed(1)}km.`,
            },
          }
        }

        const fareRaw: any = await ML_API.predictFare(distanceKm, myCluster.cluster_size, hour, day, demand).catch(() => null)
        if (fareRaw?.shared_fare && fareRaw?.solo_fare && fareRaw.shared_fare <= fareRaw.solo_fare) {
          setFareResult({
            shared_fare: fareRaw.shared_fare,
            solo_fare: fareRaw.solo_fare,
            savings_pct: fareRaw.savings_pct || Math.round((1 - fareRaw.shared_fare / fareRaw.solo_fare) * 100),
            explanation: {
              distance_impact_pct: fareRaw.distance_impact_pct ?? 60,
              sharing_discount_pct: fareRaw.sharing_discount_pct ?? 30,
              time_surge_pct: fareRaw.time_surge_pct ?? 10,
              human_readable: fareRaw.human_readable ?? '',
            },
          })
        } else {
          setFareResult(calcLocalFare(myCluster.cluster_size || allRiders.length))
        }
      } catch (err) {
        console.error('Error in live waiting room lookup:', err)
      }
    }

    // Initial load
    refreshCluster()

    // Real-time subscription
    const channel = supabase
      .channel(`waiting_room_${dbStationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ride_requests', filter: `pickup_station_id=eq.${dbStationId}` },
        () => {
          console.log('New rider joined waiting room! Refreshing cluster...')
          refreshCluster()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [step, user, dbStationId, pickupStation, destLat, destLng])

"""

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print("FAILED TO FIND MARKERS")
