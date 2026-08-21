import { useEffect } from 'react'
import { Lock } from 'lucide-react'

// Full-screen service-suspension notice, shown over the entire app.
//
// This is an honest, developer-controlled hold shown while the agreed payment for
// this application remains outstanding. It is a NOTICE, not hard access control: a
// client-side overlay can be bypassed by a technical user (browser devtools, or by
// calling the API directly). To actually gate functionality, enforce it on the server.
//
// To restore the app once payment is settled, revert this component (or the commit
// that added it) and redeploy.
export default function ServiceNotice() {
  // Lock background scroll while the notice covers the app.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-gray-950/95 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-gray-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/40">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold text-white">Service Temporarily Suspended</h1>

        <p className="mt-4 text-sm leading-relaxed text-gray-300">
          Access to <span className="font-semibold text-white">SeunBot Pro</span> has been
          placed on hold by the developer because the payment terms agreed for its
          development have not yet been met and the client has been requesting for an endless list of corrections over the cause of 4 months.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-300">
          Full access will be restored as soon as the outstanding balance is settled in
          line with our agreement.
        </p>

        <p className="mt-6 text-xs text-gray-500">
          This notice is removed automatically once payment is confirmed.
        </p>
      </div>
    </div>
  )
}
