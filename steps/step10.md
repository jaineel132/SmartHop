You are building SmartHop — a Mumbai Metro last-mile shared ride platform.
Read PROJECT_CONTEXT.md at the project root before writing any code.
Follow the navigation architecture defined in PROJECT_CONTEXT.md exactly.
Also implement the navigation changes specified for this step in Section D.
After generating files: run npx tsc --noEmit — zero TypeScript errors required.
Never show raw Error.message to users — always use Sonner toasts.
All Leaflet map components must use: dynamic(import, { ssr: false }).

⚠  NOTE:  ⚠  This is the most complex page. Test with FastAPI running (npm run dev AND uvicorn both active). If FastAPI is down, the fallback mock response must keep the UI working — never show a raw error to the user. Build and test step 1+2 before adding steps 3-5.

⚠  NOTE:  ⚠  This is the most complex page. Test with FastAPI running (npm run dev AND uvicorn both active). If FastAPI is down, the fallback mock response must keep the UI working — never show a raw error to the user. Build and test step 1+2 before adding steps 3-5.

Build the Request Last-Mile Ride page for SmartHop — the core ML feature.
File: app/rider/request-ride/page.tsx
'use client'
 
IMPORTANT: import all map components with dynamic() and ssr:false.
IMPORTANT: if FastAPI /api/cluster-riders fails, use a fallback:
  Return a mock group: {cluster_id:'mock', rider_ids:[userId], cluster_size:2,
  center_lat:station.lat, center_lng:station.lng}
  Show amber banner: 'ML service starting up — showing estimated grouping'
 
State: step(1-5), pickupStation, destLat, destLng, destAddress,
  clusterResult, fareResult, groupId, isMLDown
 
Progress bar at top: step/5 percentage, blue fill, animated
 
STEP 1 — Pick Pickup Station
Pre-fill from URL param: ?station=[stationId] (from geofence notification or ticket page)
If no param: show searchable combobox of all stations
Show selected station on small preview map
'Continue' button when station selected
 
STEP 2 — Pick Destination
File: components/maps/RideRequestMap.tsx
Props: pickupStation, destLat, destLng, onDestinationSet:(lat,lng,address)=>void
Leaflet map (ssr:false). On map click:
  Set marker at clicked position
  Call Nominatim reverse geocode (FREE):
  fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lng+'&format=json')
  Use result.display_name as address
  Call onDestinationSet with lat, lng, address
Show blue pin at pickup station, red pin at destination
Dashed polyline between the two pins
Also show a search input above map for forward geocoding:
  On type (debounce 500ms): fetch Nominatim /search?q=[text]&format=json&limit=5
  Show dropdown of results — click to set destination
Confirmed address shown in text below map
'Continue' button when destination set
 
STEP 3 — ML Clustering Loading State
Create ride_request record in Supabase (status='pending')
Call clusterRiders([{user_id, pickup_lat:station.lat, pickup_lng:station.lng,
  drop_lat:destLat, drop_lng:destLng}]) from lib/ml-api.ts
Loading animation: 3 rotating messages with Framer Motion
  'Finding riders near you...' (1.5s)
  'Grouping by direction...' (1.5s)
  'Calculating best route...' (1.5s)
Then: call predictFare({distance_km:haversine/1000, cluster_size, hour, day, demand})
On error: set isMLDown=true, use fallback mock data, show amber banner
On success: move to step 4
 
STEP 4 — Group Preview
File: components/rider/GroupPreviewCard.tsx
Props: clusterResult, fareResult, station
Map shows: station pin, destination pins for each group member, connecting polyline
Group card:
  Avatar row: shadcn Avatar circles showing initials, +N if more than 3
  'You + [N] others heading your way'
  Fare: '₹[shared_fare]' large bold — '₹[solo_fare]' strikethrough gray
  Savings badge: '[savings_pct]% saved' in green
  2 info chips: '~3 min wait' + '[duration] min ride'
 
File: components/rider/FareBreakdownAccordion.tsx
shadcn Accordion: trigger = 'Why is my fare ₹[shared_fare]?'
Inside: 3 labeled progress bar rows (shadcn Progress):
  Row 1: 'Distance ([distance_km]km)' — distance_impact_pct width
  Row 2: 'Sharing discount ([cluster_size] riders)' — sharing_discount_pct
  Row 3: 'Time surge ([hour]:00)' — time_surge_pct
Bottom: italic human_readable text from API explanation
 
STEP 5 — Confirm
'Join this Group' button (green, full width)
On click:
  UPDATE ride_request SET status='confirmed'
  INSERT into ride_groups (if not exists) with cluster data
  INSERT into ride_members (group_id, user_id, fare_share, savings_pct, solo_fare)
  INSERT into fare_transactions (group_id, user_id, amount=fare_share, status='pending')
  toast.success('Ride confirmed!')
  router.push('/rider/tracking/' + groupId)
'Find different group' link: re-runs step 3

✓  VERIFICATION CHECKLIST — Complete ALL items before moving to Step 11
☐	Step 1: station combobox pre-fills from URL param ?station=[id]
☐	Step 2: clicking on map places a red pin and shows an address below
☐	Step 2: typing in search box shows Nominatim autocomplete results
☐	Step 3: loading animation cycles through 3 messages
☐	Step 3: if FastAPI is running — real cluster result returned
◦	Open browser DevTools Network tab — look for POST to localhost:8000/api/cluster-riders
◦	Response should have cluster_id and rider_ids
☐	Step 3: if FastAPI is DOWN — amber fallback banner shows, flow still continues
☐	Step 4: GroupPreviewCard shows fare, savings badge, and avatar row
☐	Step 4: FareBreakdownAccordion expands to show 3 progress bar rows
☐	Step 5: clicking 'Join this Group' creates records in Supabase
◦	Check ride_members table — new row with your user_id
◦	Check ride_groups table — new group row
◦	Check fare_transactions — new pending transaction
☐	After confirm: redirected to /rider/tracking/[groupId]
