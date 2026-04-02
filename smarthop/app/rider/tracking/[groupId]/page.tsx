export default function TrackingPage({ params }: { params: Promise<{ groupId: string }> }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Live Tracking</h1>
        <p className="text-slate-500">Ride tracking coming in the next step.</p>
      </div>
    </div>
  )
}
