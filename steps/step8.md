You are building SmartHop — a Mumbai Metro last-mile shared ride platform.
Read PROJECT_CONTEXT.md at the project root before writing any code.
Follow the navigation architecture defined in PROJECT_CONTEXT.md exactly.
Also implement the navigation changes specified for this step in Section D.
After generating files: run npx tsc --noEmit — zero TypeScript errors required.
Never show raw Error.message to users — always use Sonner toasts.
All Leaflet map components must use: dynamic(import, { ssr: false }).

⚠  NOTE:  ⚠  This is a Client Component ('use client'). The DashboardMap must use dynamic import with ssr:false. Check for an active ride in ride_members — if found, show the 'Track My Ride' banner. Also build MobileNav here — it will be reused across all rider pages.

Build the Rider Dashboard for SmartHop.
 
FILE 1: components/shared/MobileNav.tsx
'use client'
Fixed bottom navigation bar, only visible on mobile (md:hidden)
z-50, bg-white, border-top, shadow
For riders: 4 tabs with icons and labels:
  Home (LayoutDashboard) → /rider/dashboard
  Ticket (Ticket) → /rider/metro-ticket
  Ride (Car) → /rider/request-ride
  History (Clock) → /rider/history
Active tab: blue icon + blue label. Inactive: gray.
Use usePathname() from next/navigation to detect active route.
 
FILE 2: components/maps/DashboardMap.tsx
Props: centerStation: MetroStation | null
React-Leaflet map. Center: centerStation coords or Mumbai fallback [19.0760, 72.8777]
Zoom: 13
All metro stations plotted as CircleMarkers (same colors as landing page)
centerStation: larger pulsing marker with popup 'Your home station'
Height: 260px mobile, 340px desktop
scrollWheelZoom={false} — prevents scroll hijacking on mobile
 
FILE 3: app/rider/dashboard/page.tsx
'use client'
import dynamic from 'next/dynamic'
const DashboardMap = dynamic(() => import('@/components/maps/DashboardMap'), {ssr:false})
 
On mount:
1. Get current user via useAuth hook
2. Fetch home station: SELECT home_station_id FROM users WHERE id=[userId]
   Then getStationById(home_station_id) from lib/stations.ts
3. Check active ride: SELECT rm.group_id FROM ride_members rm
   JOIN ride_groups rg ON rm.group_id=rg.id
   WHERE rm.user_id=[userId] AND rg.status IN ('accepted','in_progress') LIMIT 1
4. Fetch recent rides: last 3 from ride_members+ride_groups+routes JOIN
5. Call checkMLHealth() — if false, show warning toast
 
LAYOUT (mobile-first):
 
Top navbar (sticky, white bg, shadow-sm):
  Left: 'SmartHop' text logo (blue)
  Center: greeting — 'Good morning [name]' or Good afternoon/evening based on hour
  Right: Bell icon (Lucide Bell) + Avatar (shadcn Avatar with initials fallback)
 
Metro status strip (horizontal scroll, py-2):
  3 badges: Line 1 Running (green), Line 2A Running (green), Line 7 Running (green)
  Simulated — hardcoded as operational
 
DashboardMap (full width, dynamic import)
 
Active ride banner (show only if active ride found):
  Blue banner: 'You have an active ride in progress'
  'Track Now' button → /rider/tracking/[groupId]
 
Quick Action Cards (components/rider/QuickActionCards.tsx):
  Grid: grid-cols-2 mobile, grid-cols-3 desktop, gap-3, px-4
  Card 1: Ticket icon, 'Book Metro Ticket', 'Get QR ticket' → /rider/metro-ticket
  Card 2: Car icon, 'Request Ride', 'Share last-mile auto' → /rider/request-ride
  Card 3: Clock icon, 'My Rides', 'History & savings' → /rider/history
  Each card: shadcn Card, hover:shadow-md, hover:border-blue-300, cursor-pointer
  Icon in blue circle bg, title bold, subtitle text-sm text-muted
 
Recent Rides section:
  Heading: 'Recent Rides'
  Map over last 3 rides — each: date, pickup station, destination, fare, savings badge
  If no rides: 'No rides yet — book your first shared ride!' with Car icon
 
Show Skeleton loaders (shadcn Skeleton) while data is fetching.
Add MobileNav at bottom (only on mobile).

✓  VERIFICATION CHECKLIST — Complete ALL items before moving to Step 09
☐	Log in as a rider and navigate to /rider/dashboard — page loads without error
☐	Greeting shows correct time-of-day ('Good morning/afternoon/evening')
☐	Map renders with Mumbai metro stations — no white screen
☐	Quick action cards appear and clicking each navigates to correct route
☐	Skeleton loaders appear for 1-2 seconds before data loads
☐	Mobile nav visible at bottom when browser is < 768px wide
☐	If you have no rides yet: empty state message shows (not a blank section)
☐	No console errors in DevTools
☐	Sonner warning shows if FastAPI (localhost:8000) is not running
