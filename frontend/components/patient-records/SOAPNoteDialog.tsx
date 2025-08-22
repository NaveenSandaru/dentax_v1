'use client'

import React, { memo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface SOAPNote {
  note_id: number
  patient_id: string
  note: string
  date?: string
}

interface SOAPNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (note: string) => Promise<void>
  editingNote: SOAPNote | null
  submitting: boolean
}

const SOAPNoteDialog = memo(({
  isOpen,
  onClose,
  onSubmit,
  editingNote,
  submitting
}: SOAPNoteDialogProps) => {
  const [noteText, setNoteText] = useState(editingNote?.note || '')

  React.useEffect(() => {
    if (editingNote) {
      setNoteText(editingNote.note)
    } else {
      setNoteText('')
    }
  }, [editingNote, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return

    await onSubmit(noteText.trim())
    setNoteText('')
  }

  const handleClose = () => {
    setNoteText('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Edit SOAP Note' : 'Add SOAP Note'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter SOAP note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!noteText.trim() || submitting}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {submitting ? 'Saving...' : editingNote ? 'Update Note' : 'Add Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

SOAPNoteDialog.displayName = 'SOAPNoteDialog'

export default SOAPNoteDialog
