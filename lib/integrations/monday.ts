/**
 * Monday.com CRM Integration
 * Production-ready client für Monday.com GraphQL API
 */

const MONDAY_API_URL = 'https://api.monday.com/v2'

export interface MondayConfig {
  apiToken: string
  boardId?: string
  phoneColumnId?: string
  nameColumnId?: string
  emailColumnId?: string
  statusColumnId?: string
  groupNew?: string
  groupContacted?: string
  groupQualified?: string
  groupBooked?: string
  groupLost?: string
}

export interface MondayItem {
  id: string
  name: string
  column_values: Array<{
    id: string
    text: string
    value: string | null
  }>
  group?: {
    id: string
    title: string
  }
}

interface MondayResponse<T> {
  success: boolean
  data: T | null
  error?: string
}

/**
 * Macht einen GraphQL Request zu Monday.com
 */
async function mondayQuery<T>(
  config: MondayConfig,
  query: string,
  variables?: Record<string, unknown>
): Promise<MondayResponse<T>> {
  try {
    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.apiToken,
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query, variables }),
    })

    const result = await response.json()

    if (result.errors?.length) {
      console.error('Monday.com API error:', result.errors)
      return {
        success: false,
        data: null,
        error: result.errors[0]?.message || 'GraphQL Error'
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Monday.com request error:', error)
    return { success: false, data: null, error: String(error) }
  }
}

/**
 * Sucht ein Item nach Telefonnummer
 */
export async function findItemByPhone(
  config: MondayConfig,
  phone: string
): Promise<MondayItem | null> {
  if (!config.boardId || !config.phoneColumnId) {
    console.error('Monday.com: boardId oder phoneColumnId nicht konfiguriert')
    return null
  }

  const normalizedPhone = phone.replace(/\D/g, '')

  const query = `
    query ($boardId: ID!, $columnId: String!, $value: String!) {
      items_page_by_column_values(
        board_id: $boardId
        columns: [{ column_id: $columnId, column_values: [$value] }]
        limit: 1
      ) {
        items {
          id
          name
          group {
            id
            title
          }
          column_values {
            id
            text
            value
          }
        }
      }
    }
  `

  const result = await mondayQuery<{
    items_page_by_column_values: { items: MondayItem[] }
  }>(config, query, {
    boardId: config.boardId,
    columnId: config.phoneColumnId,
    value: normalizedPhone,
  })

  return result.data?.items_page_by_column_values?.items?.[0] || null
}

/**
 * Erstellt ein neues Item
 */
export async function createItem(
  config: MondayConfig,
  data: {
    name: string
    phone?: string
    email?: string
    groupId?: string
  }
): Promise<MondayItem | null> {
  if (!config.boardId) {
    console.error('Monday.com: boardId nicht konfiguriert')
    return null
  }

  const columnValues: Record<string, unknown> = {}

  if (data.phone && config.phoneColumnId) {
    columnValues[config.phoneColumnId] = {
      phone: data.phone,
      countryShortName: 'DE',
    }
  }

  if (data.email && config.emailColumnId) {
    columnValues[config.emailColumnId] = {
      email: data.email,
      text: data.email,
    }
  }

  const query = `
    mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId
        group_id: $groupId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id
        name
        column_values {
          id
          text
          value
        }
      }
    }
  `

  const result = await mondayQuery<{ create_item: MondayItem }>(config, query, {
    boardId: config.boardId,
    groupId: data.groupId || config.groupNew || 'new_leads',
    itemName: data.name,
    columnValues: JSON.stringify(columnValues),
  })

  return result.data?.create_item || null
}

/**
 * Aktualisiert Item Column Values
 */
export async function updateItem(
  config: MondayConfig,
  itemId: string,
  columnValues: Record<string, unknown>
): Promise<boolean> {
  if (!config.boardId) {
    return false
  }

  const query = `
    mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId
        item_id: $itemId
        column_values: $columnValues
      ) {
        id
      }
    }
  `

  const result = await mondayQuery(config, query, {
    boardId: config.boardId,
    itemId,
    columnValues: JSON.stringify(columnValues),
  })

  return result.success
}

/**
 * Verschiebt Item in eine andere Gruppe (Stage-Wechsel)
 */
export async function moveItemToGroup(
  config: MondayConfig,
  itemId: string,
  groupId: string
): Promise<boolean> {
  const query = `
    mutation ($itemId: ID!, $groupId: String!) {
      move_item_to_group(
        item_id: $itemId
        group_id: $groupId
      ) {
        id
      }
    }
  `

  const result = await mondayQuery(config, query, {
    itemId,
    groupId,
  })

  return result.success
}

/**
 * Aktualisiert Status Column
 */
export async function updateItemStatus(
  config: MondayConfig,
  itemId: string,
  status: string
): Promise<boolean> {
  if (!config.statusColumnId) {
    return false
  }

  return updateItem(config, itemId, {
    [config.statusColumnId]: { label: status },
  })
}

/**
 * Fügt ein Update (Notiz) zu einem Item hinzu
 */
export async function addUpdate(
  config: MondayConfig,
  itemId: string,
  body: string
): Promise<boolean> {
  const query = `
    mutation ($itemId: ID!, $body: String!) {
      create_update(
        item_id: $itemId
        body: $body
      ) {
        id
      }
    }
  `

  const result = await mondayQuery(config, query, {
    itemId,
    body,
  })

  return result.success
}

/**
 * Holt Gruppen eines Boards
 */
export async function getBoardGroups(
  config: MondayConfig
): Promise<Array<{ id: string; title: string }>> {
  if (!config.boardId) {
    return []
  }

  const query = `
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        groups {
          id
          title
        }
      }
    }
  `

  const result = await mondayQuery<{
    boards: Array<{ groups: Array<{ id: string; title: string }> }>
  }>(config, query, { boardId: config.boardId })

  return result.data?.boards?.[0]?.groups || []
}

/**
 * Holt Spalten eines Boards
 */
export async function getBoardColumns(
  config: MondayConfig
): Promise<Array<{ id: string; title: string; type: string }>> {
  if (!config.boardId) {
    return []
  }

  const query = `
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        columns {
          id
          title
          type
        }
      }
    }
  `

  const result = await mondayQuery<{
    boards: Array<{ columns: Array<{ id: string; title: string; type: string }> }>
  }>(config, query, { boardId: config.boardId })

  return result.data?.boards?.[0]?.columns || []
}

/**
 * Holt alle Boards des Users
 */
export async function getBoards(
  config: MondayConfig
): Promise<Array<{ id: string; name: string }>> {
  const query = `
    query {
      boards(limit: 50) {
        id
        name
      }
    }
  `

  const result = await mondayQuery<{
    boards: Array<{ id: string; name: string }>
  }>(config, query)

  return result.data?.boards || []
}

/**
 * Testet die Verbindung
 */
export async function testConnection(config: MondayConfig): Promise<{
  success: boolean
  error?: string
  user?: { name: string; email: string }
}> {
  const query = `
    query {
      me {
        name
        email
      }
    }
  `

  const result = await mondayQuery<{ me: { name: string; email: string } }>(config, query)

  if (result.success && result.data?.me) {
    return { success: true, user: result.data.me }
  }

  return { success: false, error: result.error || 'Verbindung fehlgeschlagen' }
}

/**
 * Loggt eine WhatsApp Nachricht als Update
 */
export async function logWhatsAppMessage(
  config: MondayConfig,
  options: {
    itemId: string
    message: string
    direction: 'inbound' | 'outbound'
  }
): Promise<boolean> {
  const directionLabel = options.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'
  const timestamp = new Date().toLocaleString('de-DE')
  const body = `**WhatsApp ${directionLabel}**\n\n${options.message}\n\n_${timestamp}_`

  return addUpdate(config, options.itemId, body)
}

/**
 * Aktualisiert WhatsApp Status (verschiebt in Gruppe basierend auf Outcome)
 */
export async function updateWhatsAppStatus(
  config: MondayConfig,
  itemId: string,
  outcome: 'contacted' | 'qualified' | 'booked' | 'not_interested'
): Promise<boolean> {
  const groupMap: Record<string, string | undefined> = {
    contacted: config.groupContacted,
    qualified: config.groupQualified,
    booked: config.groupBooked,
    not_interested: config.groupLost,
  }

  const groupId = groupMap[outcome]
  if (!groupId) {
    return false
  }

  return moveItemToGroup(config, itemId, groupId)
}
