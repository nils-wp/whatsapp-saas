/**
 * ActiveCampaign Integration
 * Ermöglicht das Abrufen und Aktualisieren von Leads aus ActiveCampaign
 */

interface ActiveCampaignConfig {
  apiUrl: string   // z.B. "https://youraccountname.api-us1.com"
  apiKey: string
}

interface Contact {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  fields: Record<string, string>
}

interface Deal {
  id: string
  title: string
  value: string
  currency: string
  status: string
  contactId: string
}

/**
 * Sucht einen Kontakt nach Telefonnummer
 */
export async function findContactByPhone(
  config: ActiveCampaignConfig,
  phone: string
): Promise<Contact | null> {
  try {
    // Normalisiere Telefonnummer
    const normalizedPhone = phone.replace(/\D/g, '')

    const response = await fetch(
      `${config.apiUrl}/api/3/contacts?search=${encodeURIComponent(normalizedPhone)}`,
      {
        headers: {
          'Api-Token': config.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('ActiveCampaign API error:', response.status)
      return null
    }

    const data = await response.json()
    const contact = data.contacts?.[0]

    if (!contact) return null

    return {
      id: contact.id,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      fields: {},
    }
  } catch (error) {
    console.error('ActiveCampaign findContactByPhone error:', error)
    return null
  }
}

/**
 * Sucht einen Kontakt nach E-Mail
 */
export async function findContactByEmail(
  config: ActiveCampaignConfig,
  email: string
): Promise<Contact | null> {
  try {
    const response = await fetch(
      `${config.apiUrl}/api/3/contacts?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Api-Token': config.apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const contact = data.contacts?.[0]

    if (!contact) return null

    return {
      id: contact.id,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      fields: {},
    }
  } catch (error) {
    console.error('ActiveCampaign findContactByEmail error:', error)
    return null
  }
}

/**
 * Erstellt oder aktualisiert einen Kontakt
 */
export async function upsertContact(
  config: ActiveCampaignConfig,
  contactData: {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    fields?: Record<string, string>
  }
): Promise<Contact | null> {
  try {
    const response = await fetch(`${config.apiUrl}/api/3/contact/sync`, {
      method: 'POST',
      headers: {
        'Api-Token': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact: {
          email: contactData.email,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: contactData.phone,
        },
      }),
    })

    if (!response.ok) {
      console.error('ActiveCampaign upsertContact error:', response.status)
      return null
    }

    const data = await response.json()
    const contact = data.contact

    return {
      id: contact.id,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      fields: {},
    }
  } catch (error) {
    console.error('ActiveCampaign upsertContact error:', error)
    return null
  }
}

/**
 * Fügt einen Tag zu einem Kontakt hinzu
 */
export async function addTagToContact(
  config: ActiveCampaignConfig,
  contactId: string,
  tagId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/api/3/contactTags`, {
      method: 'POST',
      headers: {
        'Api-Token': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactTag: {
          contact: contactId,
          tag: tagId,
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('ActiveCampaign addTagToContact error:', error)
    return false
  }
}

/**
 * Aktualisiert ein Custom Field
 */
export async function updateCustomField(
  config: ActiveCampaignConfig,
  contactId: string,
  fieldId: string,
  value: string
): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/api/3/fieldValues`, {
      method: 'POST',
      headers: {
        'Api-Token': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fieldValue: {
          contact: contactId,
          field: fieldId,
          value: value,
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('ActiveCampaign updateCustomField error:', error)
    return false
  }
}

/**
 * Erstellt einen Deal für einen Kontakt
 */
export async function createDeal(
  config: ActiveCampaignConfig,
  dealData: {
    contactId: string
    title: string
    value: number
    currency?: string
    pipelineId: string
    stageId: string
  }
): Promise<Deal | null> {
  try {
    const response = await fetch(`${config.apiUrl}/api/3/deals`, {
      method: 'POST',
      headers: {
        'Api-Token': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deal: {
          contact: dealData.contactId,
          title: dealData.title,
          value: dealData.value * 100, // In Cents
          currency: dealData.currency || 'EUR',
          group: dealData.pipelineId,
          stage: dealData.stageId,
        },
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return {
      id: data.deal.id,
      title: data.deal.title,
      value: data.deal.value,
      currency: data.deal.currency,
      status: data.deal.status,
      contactId: dealData.contactId,
    }
  } catch (error) {
    console.error('ActiveCampaign createDeal error:', error)
    return null
  }
}

/**
 * Aktualisiert Deal Stage
 */
export async function updateDealStage(
  config: ActiveCampaignConfig,
  dealId: string,
  stageId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/api/3/deals/${dealId}`, {
      method: 'PUT',
      headers: {
        'Api-Token': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deal: {
          stage: stageId,
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('ActiveCampaign updateDealStage error:', error)
    return false
  }
}

/**
 * Testet die Verbindung
 */
export async function testConnection(config: ActiveCampaignConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/api/3/users/me`, {
      headers: {
        'Api-Token': config.apiKey,
      },
    })

    return response.ok
  } catch (error) {
    return false
  }
}
