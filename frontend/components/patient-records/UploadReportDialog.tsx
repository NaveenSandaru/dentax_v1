'use client'

import React, { memo, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'

interface UploadReportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (file: File, reportName: string) => Promise<void>
  submitting: boolean
}

const UploadReportDialog = memo(({
  isOpen,
  onClose,
  onSubmit,
  submitting
}: UploadReportDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [reportName, setReportName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "")
      setReportName(nameWithoutExtension)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !reportName.trim()) return

    await onSubmit(selectedFile, reportName.trim())
    handleClose()
  }

  const handleClose = () => {
    setSelectedFile(null)
    setReportName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Medical Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
              />
              {selectedFile && (
                <p className="text-sm text-gray-500">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                placeholder="Enter report name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
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
              disabled={!selectedFile || !reportName.trim() || submitting}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {submitting ? 'Uploading...' : 'Upload Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

UploadReportDialog.displayName = 'UploadReportDialog'

export default UploadReportDialog
