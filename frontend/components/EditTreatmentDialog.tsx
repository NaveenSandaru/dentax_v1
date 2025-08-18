'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type Treatment = {
  no: number
  treatment_group: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
  treatment: Treatment | null
}

export default function EditTreatmentDialog({
  open,
  onClose,
  onSubmit,
  apiClient,
  treatment,
}: Props) {
  const [groupName, setGroupName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setGroupName(treatment?.treatment_group || '')
  }, [treatment])

  const handleUpdate = async () => {
    if (!treatment) return
    if (!groupName.trim()) {
      toast.error("Treatment group name is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.put(`treatments/${treatment.no}`, {
        treatment_group: groupName,
      })
      toast.success("Treatment updated")
      onSubmit()
      onClose()
    } catch {
      toast.error("Failed to update treatment")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Treatment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="editGroupName">Treatment Group</Label>
            <Input
              id="editGroupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Restorative Dentistry"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white " onClick={handleUpdate} disabled={isSaving}>
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
