'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ML_API } from '@/lib/ml-api'
import { MUMBAI_METRO_STATIONS } from '@/lib/stations'
import { RideGroup, DriverLocation, MetroStation, Waypoint } from '@/types'
import { toast } from 'sonner'
import { 
  Bell, 
  MapPin, 
  Power, 
  Route, 
  DollarSign, 
  Star, 
  User as UserIcon,
  LayoutDashboard
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import RideRequestCard from '@/components/driver/RideRequestCard'
import { AnimatePresence } from 'framer-motion'

const DashboardMap = dynamic(() => import('@/components/maps/DashboardMap'), { ssr: false })

export default function DriverDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(false)
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [dbStations, setDbStations] = useState<{id: string, name: string}[]>([])
  const [activeRequest, setActiveRequest] = useState<RideGroup | null>(null)
  const [stats, setStats] = useState({ rides: 0, earned: 0, rating: 4.8 })
  const [loading, setLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)

  const [supabase] = useState(() => createSupabaseBrowserClient())

  const selectedStation = useMemo(() => {
    const dbStn = dbStations.find(db => db.id === selectedStationId)
    if (!dbStn) return null
    return MUMBAI_METRO_STATIONS.find(s => s.name === dbStn.name) || null
  }, [selectedStationId, dbStations])

  const fetchDriverData = useCallback(async () => {
    if (!user) return

    try {
      // 1. Fetch online status and station
      const { data: locData } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', user.id)
        .single()

      if (locData) {
        setIsOnline(locData.is_online)
        setSelectedStationId(locData.current_station_id)
      }

      // Fetch DB stations mapping
      const { data: dbStns } = await supabase.from('metro_stations').select('id, name')
      if (dbStns) setDbStations(dbStns)

      // 2. Fetch today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: ridesCount } = await supabase
        .from('ride_groups')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', today.toISOString())

      const { data: transactions } = await supabase
        .from('fare_transactions')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', today.toISOString())
      
      const earnedToday = transactions?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0

      const { data: userProfile } = await supabase
        .from('users')
        .select('driver_rating')
        .eq('id', user.id)
        .single()

      setStats({
        rides: ridesCount || 0,
        earned: earnedToday * 0.8, // Driver gets 80%
        rating: userProfile?.driver_rating || 4.8
      })
    } catch (error) {
      console.error('Error fetching driver data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login')
        return
      }
      fetchDriverData()
    }
  }, [user, authLoading, fetchDriverData, router])

  // Fetch existing forming groups when driver goes online or changes station
  const fetchFormingGroups = useCallback(async () => {
    if (!selectedStationId || !isOnline) return

    const { data: formingGroups } = await supabase
      .from('ride_groups')
      .select('*')
      .eq('station_id', selectedStationId)
      .eq('status', 'forming')
      .is('driver_id', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (formingGroups && formingGroups.length > 0) {
      setActiveRequest(formingGroups[0] as RideGroup)
    }
  }, [selectedStationId, isOnline, supabase])

  useEffect(() => {
    if (isOnline && selectedStationId) {
      fetchFormingGroups()
    }
  }, [isOnline, selectedStationId, fetchFormingGroups])

  // Realtime subscription for NEW ride requests
  useEffect(() => {
    if (!user || !isOnline || !selectedStationId) return

    const channel = supabase
      .channel('new_ride_requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_groups',
          filter: `status=eq.forming`
        },
        async (payload: any) => {
          const newGroup = payload.new as RideGroup
          if (newGroup.station_id === selectedStationId && !newGroup.driver_id) {
            setActiveRequest(newGroup)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, isOnline, selectedStationId, supabase])

  const toggleOnline = async (online: boolean) => {
    if (!user) return
    setIsOnline(online)

    const { error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: user.id,
        is_online: online,
        updated_at: new Date().toISOString()
      }, { onConflict: 'driver_id' })

    if (error) {
      toast.error('Failed to update status')
      setIsOnline(!online)
    } else {
      toast.success(online ? "You are now online" : "You are now offline")
    }
  }

  const handleStationChange = async (stationId: string) => {
    if (!user) return
    setSelectedStationId(stationId)

    const { error } = await supabase
      .from('driver_locations')
      .update({ current_station_id: stationId })
      .eq('driver_id', user.id)

    if (error) {
      toast.error('Failed to update station')
    } else {
      const dbStn = dbStations.find(db => db.id === stationId)
      const staticStation = MUMBAI_METRO_STATIONS.find(s => s.name === dbStn?.name)
      toast.success(`Active at ${staticStation?.name || 'Selected Station'}`)
    }
  }

  const handleAccept = async () => {
    if (!activeRequest || !user || isAccepting) return
    setIsAccepting(true)

    try {
      toast.info('Accepting ride and optimizing route...')

      // 1. Claim the ride group (set driver_id but keep status as forming until route is ready)
      const { error: claimError } = await supabase
        .from('ride_groups')
        .update({ driver_id: user.id })
        .eq('id', activeRequest.id)
        .is('driver_id', null) // Only claim if no other driver has

      if (claimError) {
        console.error('Claim Error:', claimError)
        toast.error(`Step 1 Failed: ${claimError.message || 'Already claimed or server error'}`)
        setIsAccepting(false)
        return
      }
      toast.success('Step 1: Ride Group Claimed! ✅')

      // 1b. Fetch driver's vehicle type for capacity check
      const { data: driverProfile } = await supabase
        .from('users')
        .select('vehicle_type')
        .eq('id', user.id)
        .single()

      const vehicleType = driverProfile?.vehicle_type || 'car'
      const maxRiders = vehicleType === 'auto' ? 3 : 4
      toast.info(`Step 2: Profile Fetched (${vehicleType}) ✅`)

      // 2. Fetch ride members and their destinations for route building
      const { data: members } = await supabase
        .from('ride_members')
        .select('id, user_id, request_id, created_at')
        .eq('group_id', activeRequest.id)
        .order('created_at', { ascending: true })

      // 2b. Enforce rider cap — keep only the first `maxRiders` members
      if (members && members.length > maxRiders) {
        const excessMembers = members.slice(maxRiders)
        const excessIds = excessMembers.map((m: any) => m.id)
        await supabase.from('ride_members').delete().in('id', excessIds)
        // Remove corresponding fare transactions
        const excessUserIds = excessMembers.map((m: any) => m.user_id)
        await supabase.from('fare_transactions').delete()
          .eq('group_id', activeRequest.id)
          .in('user_id', excessUserIds)

        toast.info(`Vehicle capacity: ${maxRiders} riders (${vehicleType}). Extra riders were removed.`)
        // Keep only valid members
        members.splice(maxRiders)
      }
      toast.info(`Step 3: Members Fetched (${members?.length || 0}) ✅`)

      // 3. Build waypoints from ride_requests destinations
      let waypoints: Waypoint[] = []
      if (members && members.length > 0) {
        const requestIds = members.map((m: any) => m.request_id).filter(Boolean)
        if (requestIds.length > 0) {
          const { data: requests } = await supabase
            .from('ride_requests')
            .select('user_id, dest_lat, dest_lng, dest_address')
            .in('id', requestIds)

          if (requests) {
            waypoints = requests.map((r: any) => ({
              lat: r.dest_lat,
              lng: r.dest_lng,
              label: r.dest_address || 'Drop Point',
              user_id: r.user_id,
              address: r.dest_address || 'Drop Point',
              completed: false
            }))
          }
        }
      }
      toast.info(`Step 4: Waypoints Built (${waypoints.length}) ✅`)

      // Fallback waypoint if none found
      if (waypoints.length === 0) {
        waypoints = [{
          lat: 19.12, lng: 72.85,
          label: 'Destination', user_id: '', address: 'Destination', completed: false
        }]
      }

      // 4. Call ML route optimization
      const stationDb = dbStations.find(s => s.id === activeRequest.station_id)
      const station = MUMBAI_METRO_STATIONS.find(s => s.name === stationDb?.name)
      const startLat = station?.lat || 19.076
      const startLng = station?.lng || 72.8777

      let optimizedWaypoints = waypoints
      let totalDistance = activeRequest.distance_km || 5
      let totalDuration = activeRequest.duration_min || 15
      let optimizedOrder = waypoints.map((_, i) => i)

      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('ML Optimization Timeout')), 5000)
        )
        const routeResult = await Promise.race([
          ML_API.optimizeRoute(waypoints, startLat, startLng),
          timeoutPromise
        ]) as any
        
        optimizedWaypoints = routeResult.waypoints || waypoints
        totalDistance = routeResult.total_distance_km || totalDistance
        totalDuration = routeResult.total_duration_min || totalDuration
        optimizedOrder = routeResult.optimized_order || optimizedOrder
      } catch (mlErr) {
        console.warn('ML route optimization failed or timed out, using default order:', mlErr)
      }
      toast.info('Step 5: ML Optimized ✅')

      // 5. Insert route into DB
      const { error: routeErr } = await supabase
        .from('routes')
        .insert({
          group_id: activeRequest.id,
          waypoints: optimizedWaypoints,
          total_distance_km: parseFloat(String(totalDistance)) || 5,
          total_duration_min: Math.round(parseFloat(String(totalDuration)) || 15),
          optimized_order: optimizedOrder
        })

      if (routeErr) {
        console.error('Route insert error object:', routeErr)
        const errMsg = routeErr.message || JSON.stringify(routeErr)
        toast.error(`Route insert failed: ${errMsg}`)
        throw new Error(`Route insert failed: ${errMsg}`)
      }
      toast.info('Step 6: Route Inserted ✅')

      // 6. Now update ride_group status to 'accepted'
      const { error: updateError } = await supabase
        .from('ride_groups')
        .update({ status: 'accepted' })
        .eq('id', activeRequest.id)

      if (updateError) throw updateError

      // 6b. Recalculate fares for all members now that we know final rider count
      try {
        await supabase.rpc('recalculate_group_fares', { p_group_id: activeRequest.id })
        toast.info('Step 7: Fares Recalculated ✅')
      } catch (fareErr) {
        console.warn('Fare recalculation warning (non-blocking):', fareErr)
      }

      // 7. Log ML ranking (non-blocking)
      try {
        const rankTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('ML Ranking Timeout')), 5000));
        await Promise.race([
          ML_API.rankDrivers([{ user_id: user.id, rating: stats.rating }], activeRequest),
          rankTimeout
        ]);
      } catch (mlError) {
        console.warn('ML Ranking log failed or timed out, proceeding:', mlError);
      }

      toast.success('Ride Accepted! Initializing Tracking...')
      
      // Artificial delay to ensure DB propagation before redirect
      setTimeout(() => {
        router.push(`/driver/route/${activeRequest.id}`)
      }, 1000)
    } catch (error: any) {
      console.error('CRITICAL Acceptance error:', error)
      toast.error(`Acceptance failed: ${error.message || 'Unknown error'}`)
      setActiveRequest(null)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = () => {
    setActiveRequest(null)
    toast.info('Request declined')
  }

  if (loading || authLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-outfit">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-100">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-blue-50 text-blue-600">
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">SmartHop Driver</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                {user?.user_metadata?.full_name || 'Driver'}
              </p>
            </div>
          </div>
          <Bell className="h-5 w-5 text-slate-400" />
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Online Toggle */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className={`h-1.5 w-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="online-toggle" className="text-lg font-bold text-slate-900">
                  {isOnline ? 'Online' : 'Offline'}
                </Label>
                <p className="text-sm text-slate-500">
                  {isOnline ? 'You are visible to riders' : 'Go online to start receiving rides'}
                </p>
              </div>
              <Switch
                id="online-toggle"
                checked={isOnline}
                onCheckedChange={toggleOnline}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Station Selector */}
        {isOnline && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <MapPin className="h-4 w-4 text-blue-500" />
                Which metro station are you at?
              </div>
              <Select value={selectedStationId || ''} onValueChange={handleStationChange}>
                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {MUMBAI_METRO_STATIONS.map((station) => {
                    const dbStation = dbStations.find(s => s.name === station.name)
                    return (
                      <SelectItem key={station.id} value={dbStation?.id || station.id}>
                        {station.name} ({station.line})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Map Preview */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
          <DashboardMap centerStation={selectedStation} />
        </div>

        {/* Today Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Route className="h-5 w-5 text-blue-500 mb-2" />
              <p className="text-xl font-bold text-slate-900">{stats.rides}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Rides</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <DollarSign className="h-5 w-5 text-green-500 mb-2" />
              <p className="text-xl font-bold text-slate-900">₹{stats.earned.toFixed(0)}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Earned</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Star className="h-5 w-5 text-orange-400 mb-2" />
              <p className="text-xl font-bold text-slate-900">{stats.rating}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Rating</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Ride Request Card Overlay */}
      <AnimatePresence>
        {activeRequest && (
          <RideRequestCard
            group={activeRequest}
            onAccept={handleAccept}
            onDecline={() => setActiveRequest(null)}
            isAccepting={isAccepting}
          />
        )}
      </AnimatePresence>

      {/* Driver Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-8 flex justify-around items-center z-40 max-w-2xl mx-auto rounded-t-3xl shadow-[0_-5px_15px_-3px_rgba(0,0,0,0.05)]">
        <button className="text-blue-600 flex flex-col items-center gap-1">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          className="text-slate-400 flex flex-col items-center gap-1"
          onClick={() => toast.info('View all routes feature coming soon!')}
        >
          <Route className="h-6 w-6" />
          <span className="text-[10px] font-bold">Map</span>
        </button>
        <button 
          className="text-slate-400 flex flex-col items-center gap-1"
          onClick={() => router.push('/driver/earnings')}
        >
          <DollarSign className="h-6 w-6" />
          <span className="text-[10px] font-bold">Earnings</span>
        </button>
      </nav>
    </div>
  )
}
