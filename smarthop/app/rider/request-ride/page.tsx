'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { MUMBAI_METRO_STATIONS } from '@/lib/stations'
import { ML_API } from '@/lib/ml-api'
import { haversineDistance, formatCurrency, getCurrentHour, getCurrentDayOfWeek, getDemandLevel } from '@/lib/utils'
import { MetroStation, ClusterGroup, FarePrediction } from '@/types'

import GroupPreviewCard from '@/components/rider/GroupPreviewCard'
import FareBreakdownAccordion from '@/components/rider/FareBreakdownAccordion'

const RideRequestMap = dynamic(() => import('@/components/maps/RideRequestMap'), { ssr: false })



const LOADING_MESSAGES = [
  "Looking for nearby riders...",
  "Analyzing metro routes...",
  "Calculating shared fare logic...",
  "Running ML routing algorithms...",
  "Securing your savings...",
]

function RequestRideContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [supabase] = useState(() => createSupabaseBrowserClient())

  const [step, setStep] = useState(1)
  const [pickupStationId, setPickupStationId] = useState('')
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)
  const [destAddress, setDestAddress] = useState('')

  const [clusterResult, setClusterResult] = useState<ClusterGroup | null>(null)
  const [fareResult, setFareResult] = useState<FarePrediction | null>(null)
  const [rideRequestId, setRideRequestId] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [isMLDown, setIsMLDown] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [memberNames, setMemberNames] = useState<string[]>([])
  const [dbStationId, setDbStationId] = useState<string | null>(null)

  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)

  const pickupStation = MUMBAI_METRO_STATIONS.find(s => s.id === pickupStationId) || null

  useEffect(() => {
    const stationParam = searchParams.get('station')
    if (stationParam) {
      const found = MUMBAI_METRO_STATIONS.find(s => s.id === stationParam)
      if (found) setPickupStationId(stationParam)
    }
  }, [searchParams])

  const handleDestinationSet = (lat: number, lng: number, address: string) => {
    setDestLat(lat)
    setDestLng(lng)
    setDestAddress(address)
  }

  // Step 3: ML Clustering Initiation
  const runClustering = async () => {
    if (!pickupStation || destLat === null || destLng === null || !user) return

    setStep(3)
    setLoadingMsgIndex(0)
    setIsMLDown(false)

    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 1500)

    try {
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
      // Artificial delay to show the loading screen
      await new Promise(resolve => setTimeout(resolve, 2500))

    } catch (err) {
      console.warn('Clustering flow error:', err)
    } finally {
      clearInterval(interval)
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

        if (!allRiders.find((r: any) => r.user_id === user.id)) {
          allRiders.push({
            user_id: user.id,
            pickup_lat: pickupStation.lat,
            pickup_lng: pickupStation.lng,
            drop_lat: destLat,
            drop_lng: destLng,
          })
        }

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

        if (myCluster?.rider_ids) {
          const { data: _users, error: uErr } = await supabase
            .from('users')
            .select('id, name')
            .in('id', myCluster.rider_ids)
          
          if (uErr) console.warn('User names fetch error:', uErr)
          
          if (_users) {
            // Keep all names except the current user's
            const names = _users
              .filter((u: any) => u.id !== user.id)
              .map((u: any) => u.name || 'Anonymous Rider')
            setMemberNames(names)
            console.log('AUTO-MATCH: Found names for cluster:', names)
          }
        }

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

        // Proportional fare calculation: each rider pays based on their distance
        const calcProportionalFare = (clusterSz: number) => {
          // This rider's solo fare (what they'd pay alone)
          const soloFare = Math.round(Math.max(25, distanceKm * 12))
          
          if (clusterSz <= 1) {
            return {
              shared_fare: soloFare,
              solo_fare: soloFare,
              savings_pct: 0,
              explanation: {
                distance_impact_pct: 60,
                sharing_discount_pct: 0,
                time_surge_pct: 5,
                human_readable: `Solo ride fare for ${distanceKm.toFixed(1)}km.`,
              },
            }
          }
          
          // Shared ride discount: 30% off solo fare (proportional to distance)
          const sharedFare = Math.round(soloFare * 0.7)
          const discount = Math.round((1 - sharedFare / soloFare) * 100)
          
          return {
            shared_fare: sharedFare,
            solo_fare: soloFare,
            savings_pct: discount,
            explanation: {
              distance_impact_pct: 60,
              sharing_discount_pct: discount,
              time_surge_pct: 5,
              human_readable: `Your fare of ₹${sharedFare} is based on your ${distanceKm.toFixed(1)}km trip, shared among ${clusterSz} riders. You save ${discount}% vs solo (₹${soloFare})!`,
            },
          }
        }

        const fareRaw: any = await ML_API.predictFare(distanceKm, myCluster.cluster_size || 1, hour, day, demand).catch(() => null)
        if (fareRaw?.shared_fare && fareRaw?.solo_fare && fareRaw.shared_fare <= fareRaw.solo_fare) {
          // ML prediction valid — use it but ensure shared < solo for groups
          const mlShared = myCluster.cluster_size > 1 
            ? Math.round(fareRaw.solo_fare * 0.7) 
            : fareRaw.solo_fare
          const mlSavings = myCluster.cluster_size > 1 
            ? Math.round((1 - mlShared / fareRaw.solo_fare) * 100) 
            : 0
          setFareResult({
            shared_fare: mlShared,
            solo_fare: fareRaw.solo_fare,
            savings_pct: mlSavings,
            explanation: {
              distance_impact_pct: fareRaw.distance_impact_pct ?? 60,
              sharing_discount_pct: mlSavings,
              time_surge_pct: fareRaw.time_surge_pct ?? 10,
              human_readable: `Your fare of ₹${mlShared} is based on your ${distanceKm.toFixed(1)}km trip, shared among ${myCluster.cluster_size} riders. You save ${mlSavings}% vs solo (₹${Math.round(fareRaw.solo_fare)})!`,
            },
          })
        } else {
          setFareResult(calcProportionalFare(myCluster.cluster_size || allRiders.length))
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
          refreshCluster()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [step, user, dbStationId, pickupStation, destLat, destLng])

  const confirmInitiated = React.useRef(false)
  // Step 5: Confirm
  // Generate a deterministic cluster ID from sorted member IDs
  const generateStableClusterId = (memberIds: string[]) => {
    return [...memberIds].sort().join(':')
  }

  const handleConfirm = async () => {
    if (!clusterResult || !fareResult || !user || !pickupStation || !dbStationId || confirmInitiated.current) return

    confirmInitiated.current = true
    setIsConfirming(true)
    try {
      // Stable Cluster Logic:
      // If we have an ML-confirmed cluster ID that isn't a "solo" ID, use it.
      // Otherwise, fallback to a station-based key to combine solo riders at the same station.
      let stableClusterKey = clusterResult.cluster_id;
      
      if (stableClusterKey.startsWith('solo_') || stableClusterKey.startsWith('local_')) {
        // Fallback: everyone at this station going to similar destinations (within ~1km) 
        // can join the same group if the ML service is struggling or they are solo.
        const destHash = `${Math.round(destLat! * 100)}_${Math.round(destLng! * 100)}`;
        stableClusterKey = `stn_${dbStationId}_${destHash}`;
      }

      // Calculate this rider's individual trip distance
      const riderDistanceKm = haversineDistance(pickupStation.lat, pickupStation.lng, destLat!, destLng!) / 1000;

      const { data: finalGroupId, error: rpcErr } = await supabase.rpc('confirm_ride', {
        p_user_id: user.id,
        p_pickup_station_id: dbStationId,
        p_cluster_id: stableClusterKey,
        p_ride_request_id: rideRequestId,
        p_fare_total: fareResult.solo_fare,        // Group total: RPC will recalculate as sum of shares
        p_distance_km: riderDistanceKm,             // This rider's individual distance
        p_duration_min: 15,
        p_fare_share: fareResult.shared_fare,        // Initial share (RPC recalculates proportionally)
        p_savings_pct: fareResult.savings_pct,
        p_solo_fare: fareResult.solo_fare,           // What this rider would pay solo
      })

      if (rpcErr) throw rpcErr

      toast.success('🎉 Ride confirmed!')
      router.push(`/rider/tracking/${finalGroupId}?requestId=${rideRequestId}`)
    } catch (err: any) {
      console.warn('Confirmation error:', err)
      toast.error('Failed to confirm ride. Please try again.')
    } finally {
      setIsConfirming(false)
    }
  }

  // Auto-confirm if cluster reaches exactly 3 riders
  useEffect(() => {
    if (step === 4 && clusterResult?.cluster_size === 3 && fareResult && !isConfirming && !confirmInitiated.current) {
      console.log('AUTO-CONFIRM: Cluster reached size 3. Finalizing...')
      handleConfirm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, clusterResult?.cluster_size, fareResult])

  const progressPct = (step / 5) * 100

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => (step > 1 && step < 5 ? setStep(step - 1) : router.back())}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 mr-2"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Request Ride
        </h1>
        <span className="ml-auto text-sm text-slate-400 font-medium">Step {step}/5</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-200">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* ML Down Banner */}
      {isMLDown && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center">
          <p className="text-sm text-amber-700 font-medium">
            ⚡ ML service down — using offline estimates
          </p>
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* STEP 1: Pick Pickup Station */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="shadow-md border-slate-200/60 mb-6">
                <div className="bg-slate-50 border-b p-4 pb-3">
                  <div className="flex items-center text-slate-500 mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium uppercase tracking-wider">Pickup Station</span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <select
                    className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    value={pickupStationId}
                    onChange={(e) => setPickupStationId(e.target.value)}
                  >
                    <option value="">Select pickup station...</option>
                    {MUMBAI_METRO_STATIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.line})
                      </option>
                    ))}
                  </select>

                  {pickupStation && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                      <div className="bg-blue-50 rounded-xl p-3 flex items-center space-x-3 border border-blue-100">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900">{pickupStation.name}</p>
                          <p className="text-xs text-blue-600">{pickupStation.line}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <Button
                className="w-full text-lg h-14 rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700"
                disabled={!pickupStationId}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Pick Destination */}
          {step === 2 && pickupStation && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="shadow-md border-slate-200/60 mb-4">
                <div className="bg-slate-50 border-b p-4 pb-3">
                  <div className="flex items-center text-slate-500 mb-1">
                    <Navigation className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium uppercase tracking-wider">Where are you going?</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <RideRequestMap
                    pickupStation={pickupStation}
                    destLat={destLat}
                    destLng={destLng}
                    onDestinationSet={handleDestinationSet}
                  />

                  {destAddress && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                      <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                        <p className="text-xs text-red-500 uppercase font-semibold mb-1">Destination</p>
                        <p className="text-sm font-medium text-red-900 line-clamp-2">{destAddress}</p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <Button
                className="w-full text-lg h-14 rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700"
                disabled={!destLat || !destLng}
                onClick={runClustering}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* STEP 3: Loading */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-blue-100 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <div className="absolute -inset-3 rounded-full border-2 border-blue-200 animate-ping opacity-20" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsgIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-8 text-lg font-semibold text-slate-700"
                >
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </motion.p>
              </AnimatePresence>
              <p className="text-sm text-slate-400 mt-2">This usually takes a few seconds</p>
            </motion.div>
          )}

          {/* STEP 4: Group Preview */}
          {step === 4 && clusterResult && fareResult && pickupStation && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <GroupPreviewCard
                clusterResult={clusterResult}
                fareResult={fareResult}
                station={pickupStation}
                memberNames={memberNames}
              />

              <FareBreakdownAccordion fareResult={fareResult} />

              <Button
                className="w-full text-lg h-14 rounded-xl shadow-lg bg-green-600 hover:bg-green-700"
                onClick={() => setStep(5)}
              >
                Join this Group
              </Button>

              <button
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                onClick={runClustering}
              >
                Find a different group
              </button>
            </motion.div>
          )}

          {/* STEP 5: Confirm */}
          {step === 5 && clusterResult && fareResult && pickupStation && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <Card className="shadow-lg border-green-200/60 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-90" />
                  <h2 className="text-2xl font-bold">Confirm Your Ride</h2>
                  <p className="text-green-100 mt-1 text-sm">Review and lock in your shared ride</p>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Pickup</span>
                    <span className="font-semibold text-slate-800">{pickupStation.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Destination</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{destAddress}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Group size</span>
                    <span className="font-semibold text-slate-800">{clusterResult.cluster_size} riders</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Your fare</span>
                    <span className="text-xl font-bold text-green-700">{formatCurrency(fareResult.shared_fare)}</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full text-lg h-14 rounded-xl shadow-lg bg-green-600 hover:bg-green-700"
                disabled={isConfirming}
                onClick={handleConfirm}
              >
                {isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Confirming...
                  </span>
                ) : (
                  'Confirm & Join Ride'
                )}
              </Button>

              <button
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 font-medium py-2"
                onClick={() => setStep(4)}
              >
                ← Back to group preview
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function RequestRidePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <RequestRideContent />
    </Suspense>
  )
}
