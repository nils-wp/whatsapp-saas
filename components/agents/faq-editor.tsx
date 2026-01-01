'use client'

import { useState } from 'react'
import { Plus, Trash2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FAQEntry } from '@/types'

interface FAQEditorProps {
  entries: FAQEntry[]
  onChange: (entries: FAQEntry[]) => void
}

export function FAQEditor({ entries, onChange }: FAQEditorProps) {
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')

  function addEntry() {
    if (!newQuestion.trim() || !newAnswer.trim()) return

    const newEntry: FAQEntry = {
      id: crypto.randomUUID(),
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    }

    onChange([...entries, newEntry])
    setNewQuestion('')
    setNewAnswer('')
  }

  function updateEntry(id: string, updates: Partial<FAQEntry>) {
    const newEntries = entries.map((entry) =>
      entry.id === id ? { ...entry, ...updates } : entry
    )
    onChange(newEntries)
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id))
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">FAQ-Einträge</h3>
        <p className="text-sm text-muted-foreground">
          Häufige Fragen und vordefinierte Antworten
        </p>
      </div>

      {/* Add new entry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Neuen Eintrag hinzufügen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Frage (z.B. Was kostet das?)"
          />
          <Textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Antwort..."
            rows={2}
          />
          <Button
            onClick={addEntry}
            disabled={!newQuestion.trim() || !newAnswer.trim()}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Hinzufügen
          </Button>
        </CardContent>
      </Card>

      {/* Existing entries */}
      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 mt-2 text-muted-foreground shrink-0" />
                <Input
                  value={entry.question}
                  onChange={(e) =>
                    updateEntry(entry.id, { question: e.target.value })
                  }
                  className="font-medium"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(entry.id)}
                  className="text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={entry.answer}
                onChange={(e) =>
                  updateEntry(entry.id, { answer: e.target.value })
                }
                rows={2}
                className="ml-6"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Noch keine FAQ-Einträge vorhanden</p>
        </div>
      )}
    </div>
  )
}
