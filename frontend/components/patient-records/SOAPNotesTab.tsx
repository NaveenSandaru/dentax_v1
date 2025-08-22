'use client'

import React, { memo } from 'react'
import { Plus, Edit, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SOAPNote {
  note_id: number
  patient_id: string
  note: string
  date?: string
}

interface SOAPNotesTabProps {
  soapNotes: SOAPNote[]
  onAddNote: () => void
  onEditNote: (note: SOAPNote) => void
  onDeleteNote: (noteId: number) => void
  deletingNoteId: number | null
}

const SOAPNotesTab = memo(({ 
  soapNotes, 
  onAddNote, 
  onEditNote, 
  onDeleteNote, 
  deletingNoteId 
}: SOAPNotesTabProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-base sm:text-lg font-semibold">SOAP Notes</h3>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600"
          size="sm"
          onClick={onAddNote}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {soapNotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-white">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No SOAP notes available</p>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600"
                variant="outline"
                size="sm"
                onClick={onAddNote}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          soapNotes.map((note) => (
            <Card key={note.note_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-2">
                      {formatDate(note.date)} • Note ID: {note.note_id}
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                      onClick={() => onEditNote(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      onClick={() => onDeleteNote(note.note_id)}
                      disabled={deletingNoteId === note.note_id}
                    >
                      {deletingNoteId === note.note_id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
})

SOAPNotesTab.displayName = 'SOAPNotesTab'

export default SOAPNotesTab
