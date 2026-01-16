/**
 * Queue Processor
 * Verarbeitet Nachrichten aus der Message Queue (outside_hours)
 *
 * WICHTIG: Läuft alle 15 Minuten und prüft für jeden Eintrag,
 * ob die individuellen Arbeitszeiten des Agents gerade offen sind.
 */

import { createClient } from '@supabase/supabase-js'
import { processQueuedMessage } from './message-handler'
import { checkWorkingHours } from './working-hours'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface QueueProcessingResult {
  processed: number
  errors: number
  skipped: number
  waitingForWorkingHours: number
  details: Array<{
    queueId: string
    status: 'success' | 'error' | 'skipped' | 'waiting'
    error?: string
  }>
}

/**
 * Verarbeitet alle pending Nachrichten aus der Queue
 * Prüft für jeden Eintrag die individuellen Arbeitszeiten des Agents
 */
export async function processQueuedMessages(): Promise<QueueProcessingResult> {
  const supabase = getSupabase()
  const result: QueueProcessingResult = {
    processed: 0,
    errors: 0,
    skipped: 0,
    waitingForWorkingHours: 0,
    details: [],
  }

  try {
    // Get all pending outside_hours messages with their agent's office hours
    const { data: queueEntries, error: fetchError } = await supabase
      .from('message_queue')
      .select(`
        id,
        conversation_id,
        scheduled_for,
        conversations (
          id,
          status,
          agents (
            id,
            office_hours
          )
        )
      `)
      .eq('queue_type', 'outside_hours')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(100)

    if (fetchError) {
      console.error('Failed to fetch queue entries:', fetchError)
      return result
    }

    if (!queueEntries || queueEntries.length === 0) {
      console.log('No queued messages to process')
      return result
    }

    console.log(`Checking ${queueEntries.length} queued messages...`)

    // Process each entry
    for (const entry of queueEntries) {
      try {
        const conversation = entry.conversations as {
          id: string
          status: string
          agents: { id: string; office_hours: Record<string, unknown> | null } | null
        } | null

        // Skip if conversation not found
        if (!conversation) {
          await supabase
            .from('message_queue')
            .update({ status: 'dismissed' })
            .eq('id', entry.id)

          result.skipped++
          result.details.push({
            queueId: entry.id,
            status: 'skipped',
            error: 'Conversation not found',
          })
          continue
        }

        // Skip if conversation is already escalated or closed
        if (conversation.status === 'escalated' || conversation.status === 'closed') {
          await supabase
            .from('message_queue')
            .update({ status: 'dismissed' })
            .eq('id', entry.id)

          result.skipped++
          result.details.push({
            queueId: entry.id,
            status: 'skipped',
            error: `Conversation status: ${conversation.status}`,
          })
          continue
        }

        // Check if agent's working hours are currently open
        const agent = conversation.agents
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const officeHours = agent?.office_hours as any
        const workingHoursCheck = checkWorkingHours(officeHours)

        if (!workingHoursCheck.isOpen) {
          // Still outside working hours - skip for now
          result.waitingForWorkingHours++
          result.details.push({
            queueId: entry.id,
            status: 'waiting',
            error: `Außerhalb der Arbeitszeiten (${workingHoursCheck.currentTime})`,
          })
          continue
        }

        // Working hours are open - process the message now
        const processResult = await processQueuedMessage(entry.id)

        if (processResult.success) {
          result.processed++
          result.details.push({
            queueId: entry.id,
            status: 'success',
          })
        } else {
          result.errors++
          result.details.push({
            queueId: entry.id,
            status: 'error',
            error: processResult.error,
          })
        }

      } catch (error) {
        console.error(`Error processing queue entry ${entry.id}:`, error)
        result.errors++
        result.details.push({
          queueId: entry.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(
      `Queue processing complete: ${result.processed} processed, ` +
      `${result.waitingForWorkingHours} waiting, ` +
      `${result.errors} errors, ${result.skipped} skipped`
    )

  } catch (error) {
    console.error('Queue processor error:', error)
  }

  return result
}

/**
 * Gibt Statistiken über die aktuelle Queue zurück
 */
export async function getQueueStats(): Promise<{
  pending: number
  outsideHours: number
  escalated: number
  resolved: number
}> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('message_queue')
    .select('queue_type, status')

  if (error || !data) {
    return { pending: 0, outsideHours: 0, escalated: 0, resolved: 0 }
  }

  return {
    pending: data.filter(d => d.status === 'pending').length,
    outsideHours: data.filter(d => d.queue_type === 'outside_hours' && d.status === 'pending').length,
    escalated: data.filter(d => d.queue_type === 'escalated' && d.status === 'pending').length,
    resolved: data.filter(d => d.status === 'resolved').length,
  }
}

/**
 * Markiert einen Queue-Eintrag als gelöst (für manuelle Eskalations-Auflösung)
 */
export async function resolveQueueEntry(
  queueId: string,
  resolvedBy: string,
  resolutionMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('message_queue')
    .update({
      status: 'resolved',
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_message: resolutionMessage,
    })
    .eq('id', queueId)

  if (error) {
    console.error('Failed to resolve queue entry:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Verwirft einen Queue-Eintrag
 */
export async function dismissQueueEntry(queueId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('message_queue')
    .update({ status: 'dismissed' })
    .eq('id', queueId)

  if (error) {
    console.error('Failed to dismiss queue entry:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
