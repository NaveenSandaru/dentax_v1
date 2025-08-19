"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Dentist {
  profile_picture: string
  dentist_id: string
  name: string
  email: string
  phone_number?: string
}

interface DentistListDialogProps {
  open: boolean
  onClose: () => void
  serviceID: number | null
  apiClient: any
}

export default function DentistListDialog({
  open,
  onClose,
  serviceID,
  apiClient
}: DentistListDialogProps) {
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [loading, setLoading] = useState(false)
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL

  useEffect(() => {
    if (serviceID && open) {
      fetchDentists()
    }
  }, [serviceID, open])

  const fetchDentists = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/dentists/for-service/${serviceID}`)
      setDentists(response.data || [])
    } catch (err: any) {
      toast.error("Failed to fetch dentists")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[98vw] max-w-[900px] max-h-[92vh] overflow-y-auto rounded-2xl shadow-xl">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-emerald-600">
            Dentists for Service #{serviceID}
          </DialogTitle>
          <p className="text-gray-500 text-xs sm:text-sm">
            List of dentists assigned to this service
          </p>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-base sm:text-lg">
            Loading dentists...
          </div>
        ) : dentists.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-base sm:text-lg">
            No dentists assigned to this service.
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex flex-col gap-4 max-h-[calc(5*7rem)] overflow-y-auto">
              {dentists.map((dentist) => (
                <div
                  key={dentist.dentist_id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <img
                      src={`${backendURL}${dentist.profile_picture}`}
                      alt={dentist.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0 mx-auto sm:mx-0"
                    />
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                        {dentist.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{dentist.email}</p>
                      <p className="text-xs sm:text-sm text-gray-700 mt-1">
                        <span className="font-medium text-gray-900">Phone: </span>
                        {dentist.phone_number || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 sm:px-6 py-2 text-xs sm:text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
