'use client'

import React, { memo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SignConsentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSign: (doctorName: string) => void
  submitting: boolean
}

const SignConsentDialog = memo(({
  isOpen,
  onClose,
  onSign,
  submitting
}: SignConsentDialogProps) => {
  const [doctorName, setDoctorName] = useState('')

  const handleClose = () => {
    setDoctorName('')
    onClose()
  }

  const handleSubmit = () => {
    if (doctorName.trim()) {
      onSign(doctorName.trim())
      setDoctorName('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Sign Consent Form</DialogTitle>
          <DialogDescription>
            Please enter your name to sign this consent form.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Patient&apos;s Name</Label>
            <Input
              placeholder="Enter your full name"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!doctorName || submitting}
          >
            {submitting ? 'Signing...' : 'Sign Form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

SignConsentDialog.displayName = 'SignConsentDialog'

export default SignConsentDialog
