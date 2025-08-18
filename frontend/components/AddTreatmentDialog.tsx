'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
}

export default function AddTreatmentDialog({ open, onClose, onSubmit, apiClient }: Props) {
  const [groupName, setGroupName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = async () => {
    if (!groupName.trim()) {
      toast.error("Treatment group name is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.post("treatments", { treatment_group: groupName })
      toast.success("Treatment added")
      onSubmit()
      setGroupName('')
      onClose()
    } catch {
      toast.error("Failed to add treatment")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Treatment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="groupName">Treatment Group</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Oral Surgery"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleAdd} disabled={isSaving}>
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
