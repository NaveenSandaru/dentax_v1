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

export default function AddWTDialog({ open, onClose, onSubmit, apiClient }: Props) {
  const [workType, setWorkType] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!workType.trim()) {
      toast.error("Work Type is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.post("work-types", { work_type: workType })
      toast.success("Work type added")
      onSubmit()
      setWorkType('')
      onClose()
    } catch {
      toast.error("Failed to add question")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Work Type</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="groupName">Work Type</Label>
            <Input
              id="question"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
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
