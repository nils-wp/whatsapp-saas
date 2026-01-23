import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as Close from '@/lib/integrations/close'
import * as Pipedrive from '@/lib/integrations/pipedrive'
import * as HubSpot from '@/lib/integrations/hubspot'
import * as ActiveCampaign from '@/lib/integrations/activecampaign'

/**
 * POST /api/integrations/test-trigger
 * Testet die CRM-Verbindung und holt Beispieldaten um verfügbare Variablen zu zeigen
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user's tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
    }

    // Get request body
    const body = await request.json()
    const { crmType, phone, email } = body

    if (!crmType) {
      return NextResponse.json({ error: 'crmType is required' }, { status: 400 })
    }

    // Get integrations for this tenant
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', member.tenant_id)
      .single()

    // Also check if tenant has integration credentials stored elsewhere
    // For now we'll use the tenant_settings table
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', member.tenant_id)
      .single()

    // Get integration credentials from tenant
    const integrations = (tenant?.plan_limits as Record<string, unknown>)?.integrations as Record<string, unknown> || {}

    let result: {
      success: boolean
      crmType: string
      rawData: Record<string, unknown> | null
      extractedVariables: Record<string, string | null>
      availableVariables: Array<{ key: string; description: string; example: string | null }>
      error?: string
    } = {
      success: false,
      crmType,
      rawData: null,
      extractedVariables: {},
      availableVariables: [],
    }

    // Test each CRM type
    switch (crmType) {
      case 'close': {
        const apiKey = integrations.close_api_key as string
        if (!apiKey) {
          return NextResponse.json({ error: 'Close CRM not configured' }, { status: 400 })
        }

        const config = { apiKey }

        // Try to find a lead by phone or email
        let lead = null
        if (phone) {
          lead = await Close.findLeadByPhone(config, phone)
        }
        if (!lead && email) {
          lead = await Close.findLeadByEmail(config, email)
        }

        if (lead) {
          const contact = lead.contacts[0]
          result = {
            success: true,
            crmType: 'close',
            rawData: lead as unknown as Record<string, unknown>,
            extractedVariables: {
              name: contact?.name || null,
              first_name: contact?.name?.split(' ')[0] || null,
              last_name: contact?.name?.split(' ').slice(1).join(' ') || null,
              email: contact?.emails[0]?.email || null,
              phone: contact?.phones[0]?.phone || null,
              lead_id: lead.id,
              company: lead.displayName,
              status: lead.status,
            },
            availableVariables: [
              { key: '{{name}}', description: 'Vollständiger Kontaktname', example: contact?.name || null },
              { key: '{{first_name}}', description: 'Vorname', example: contact?.name?.split(' ')[0] || null },
              { key: '{{last_name}}', description: 'Nachname', example: contact?.name?.split(' ').slice(1).join(' ') || null },
              { key: '{{email}}', description: 'E-Mail Adresse', example: contact?.emails[0]?.email || null },
              { key: '{{phone}}', description: 'Telefonnummer', example: contact?.phones[0]?.phone || null },
              { key: '{{lead_id}}', description: 'Close Lead ID', example: lead.id },
              { key: '{{company}}', description: 'Firmenname/Lead Name', example: lead.displayName },
              { key: '{{status}}', description: 'Lead Status', example: lead.status },
            ],
          }
        } else {
          result = {
            success: false,
            crmType: 'close',
            rawData: null,
            extractedVariables: {},
            availableVariables: [
              { key: '{{name}}', description: 'Vollständiger Kontaktname', example: null },
              { key: '{{first_name}}', description: 'Vorname', example: null },
              { key: '{{last_name}}', description: 'Nachname', example: null },
              { key: '{{email}}', description: 'E-Mail Adresse', example: null },
              { key: '{{phone}}', description: 'Telefonnummer', example: null },
              { key: '{{lead_id}}', description: 'Close Lead ID', example: null },
              { key: '{{company}}', description: 'Firmenname/Lead Name', example: null },
              { key: '{{status}}', description: 'Lead Status', example: null },
            ],
            error: 'Kein Lead gefunden. Gib eine Telefonnummer oder E-Mail an, die in Close existiert.',
          }
        }
        break
      }

      case 'pipedrive': {
        const apiToken = integrations.pipedrive_api_token as string
        if (!apiToken) {
          return NextResponse.json({ error: 'Pipedrive not configured' }, { status: 400 })
        }

        const config: Pipedrive.PipedriveConfig = { apiToken }

        // Try to find a person by phone or email
        let person = null
        if (phone) {
          person = await Pipedrive.findPersonByPhone(config, phone)
        }
        if (!person && email) {
          person = await Pipedrive.findPersonByEmail(config, email)
        }

        if (person) {
          const primaryEmail = person.email?.find(e => e.primary)?.value || person.email?.[0]?.value
          const primaryPhone = person.phone?.find(p => p.primary)?.value || person.phone?.[0]?.value

          result = {
            success: true,
            crmType: 'pipedrive',
            rawData: person as unknown as Record<string, unknown>,
            extractedVariables: {
              name: person.name,
              first_name: person.name?.split(' ')[0] || null,
              last_name: person.name?.split(' ').slice(1).join(' ') || null,
              email: primaryEmail || null,
              phone: primaryPhone || null,
              person_id: String(person.id),
              org_id: person.org_id ? String(person.org_id) : null,
            },
            availableVariables: [
              { key: '{{name}}', description: 'Vollständiger Name', example: person.name },
              { key: '{{first_name}}', description: 'Vorname', example: person.name?.split(' ')[0] || null },
              { key: '{{last_name}}', description: 'Nachname', example: person.name?.split(' ').slice(1).join(' ') || null },
              { key: '{{email}}', description: 'E-Mail Adresse', example: primaryEmail || null },
              { key: '{{phone}}', description: 'Telefonnummer', example: primaryPhone || null },
              { key: '{{person_id}}', description: 'Pipedrive Person ID', example: String(person.id) },
              { key: '{{org_id}}', description: 'Organisation ID', example: person.org_id ? String(person.org_id) : null },
            ],
          }
        } else {
          result = {
            success: false,
            crmType: 'pipedrive',
            rawData: null,
            extractedVariables: {},
            availableVariables: [
              { key: '{{name}}', description: 'Vollständiger Name', example: null },
              { key: '{{first_name}}', description: 'Vorname', example: null },
              { key: '{{last_name}}', description: 'Nachname', example: null },
              { key: '{{email}}', description: 'E-Mail Adresse', example: null },
              { key: '{{phone}}', description: 'Telefonnummer', example: null },
              { key: '{{person_id}}', description: 'Pipedrive Person ID', example: null },
              { key: '{{org_id}}', description: 'Organisation ID', example: null },
            ],
            error: 'Keine Person gefunden. Gib eine Telefonnummer oder E-Mail an, die in Pipedrive existiert.',
          }
        }
        break
      }

      case 'hubspot': {
        const accessToken = integrations.hubspot_access_token as string
        if (!accessToken) {
          return NextResponse.json({ error: 'HubSpot not configured' }, { status: 400 })
        }

        const config: HubSpot.HubSpotConfig = { accessToken }

        // Try to find a contact by phone or email
        let contact = null
        if (phone) {
          contact = await HubSpot.findContactByPhone(config, phone)
        }
        if (!contact && email) {
          contact = await HubSpot.findContactByEmail(config, email)
        }

        if (contact) {
          const fullName = [contact.properties.firstname, contact.properties.lastname].filter(Boolean).join(' ')

          result = {
            success: true,
            crmType: 'hubspot',
            rawData: contact as unknown as Record<string, unknown>,
            extractedVariables: {
              name: fullName || null,
              first_name: contact.properties.firstname || null,
              last_name: contact.properties.lastname || null,
              email: contact.properties.email || null,
              phone: contact.properties.phone || null,
              contact_id: contact.id,
            },
            availableVariables: [
              { key: '{{name}}', description: 'Vollständiger Name', example: fullName || null },
              { key: '{{first_name}}', description: 'Vorname', example: contact.properties.firstname || null },
              { key: '{{last_name}}', description: 'Nachname', example: contact.properties.lastname || null },
              { key: '{{email}}', description: 'E-Mail Adresse', example: contact.properties.email || null },
              { key: '{{phone}}', description: 'Telefonnummer', example: contact.properties.phone || null },
              { key: '{{contact_id}}', description: 'HubSpot Contact ID', example: contact.id },
            ],
          }
        } else {
          result = {
            success: false,
            crmType: 'hubspot',
            rawData: null,
            extractedVariables: {},
            availableVariables: [
              { key: '{{name}}', description: 'Vollständiger Name', example: null },
              { key: '{{first_name}}', description: 'Vorname', example: null },
              { key: '{{last_name}}', description: 'Nachname', example: null },
              { key: '{{email}}', description: 'E-Mail Adresse', example: null },
              { key: '{{phone}}', description: 'Telefonnummer', example: null },
              { key: '{{contact_id}}', description: 'HubSpot Contact ID', example: null },
            ],
            error: 'Kein Kontakt gefunden. Gib eine Telefonnummer oder E-Mail an, die in HubSpot existiert.',
          }
        }
        break
      }

      case 'activecampaign': {
        const apiUrl = integrations.activecampaign_api_url as string
        const apiKey = integrations.activecampaign_api_key as string
        if (!apiUrl || !apiKey) {
          return NextResponse.json({ error: 'ActiveCampaign not configured' }, { status: 400 })
        }

        const config = { apiUrl, apiKey }

        // Try to find a contact by phone or email
        let contact = null
        if (email) {
          contact = await ActiveCampaign.findContactByEmail(config, email)
        }
        if (!contact && phone) {
          contact = await ActiveCampaign.findContactByPhone(config, phone)
        }

        if (contact) {
          const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ')

          result = {
            success: true,
            crmType: 'activecampaign',
            rawData: contact as unknown as Record<string, unknown>,
            extractedVariables: {
              name: fullName || null,
              first_name: contact.firstName || null,
              last_name: contact.lastName || null,
              email: contact.email || null,
              phone: contact.phone || null,
              contact_id: contact.id,
            },
            availableVariables: [
              { key: '{{name}}', description: 'Vollständiger Name', example: fullName || null },
              { key: '{{first_name}}', description: 'Vorname', example: contact.firstName || null },
              { key: '{{last_name}}', description: 'Nachname', example: contact.lastName || null },
              { key: '{{email}}', description: 'E-Mail Adresse', example: contact.email || null },
              { key: '{{phone}}', description: 'Telefonnummer', example: contact.phone || null },
              { key: '{{contact_id}}', description: 'ActiveCampaign Contact ID', example: contact.id },
            ],
          }
        } else {
          result = {
            success: false,
            crmType: 'activecampaign',
            rawData: null,
            extractedVariables: {},
            availableVariables: [
              { key: '{{name}}', description: 'Vollständiger Name', example: null },
              { key: '{{first_name}}', description: 'Vorname', example: null },
              { key: '{{last_name}}', description: 'Nachname', example: null },
              { key: '{{email}}', description: 'E-Mail Adresse', example: null },
              { key: '{{phone}}', description: 'Telefonnummer', example: null },
              { key: '{{contact_id}}', description: 'ActiveCampaign Contact ID', example: null },
            ],
            error: 'Kein Kontakt gefunden. Gib eine E-Mail oder Telefonnummer an, die in ActiveCampaign existiert.',
          }
        }
        break
      }

      case 'monday': {
        // Monday.com hat keine einfache Suche nach Telefon/E-Mail
        // Hier zeigen wir nur die verfügbaren Variablen
        result = {
          success: true,
          crmType: 'monday',
          rawData: null,
          extractedVariables: {},
          availableVariables: [
            { key: '{{name}}', description: 'Item Name', example: 'Max Mustermann' },
            { key: '{{phone}}', description: 'Telefon-Spalte', example: '+49123456789' },
            { key: '{{email}}', description: 'E-Mail-Spalte', example: 'max@example.com' },
            { key: '{{item_id}}', description: 'Monday Item ID', example: '123456789' },
            { key: '{{board_id}}', description: 'Monday Board ID', example: '987654321' },
          ],
          error: 'Monday.com Test: Variablen werden aus den Board-Spalten extrahiert. Konfiguriere die Spalten-IDs im Trigger.',
        }
        break
      }

      case 'webhook': {
        // Generic webhook - show common variables
        result = {
          success: true,
          crmType: 'webhook',
          rawData: null,
          extractedVariables: {},
          availableVariables: [
            { key: '{{name}}', description: 'Name aus Payload', example: 'Max Mustermann' },
            { key: '{{first_name}}', description: 'Vorname aus Payload', example: 'Max' },
            { key: '{{last_name}}', description: 'Nachname aus Payload', example: 'Mustermann' },
            { key: '{{email}}', description: 'E-Mail aus Payload', example: 'max@example.com' },
            { key: '{{phone}}', description: 'Telefon aus Payload (erforderlich)', example: '+49123456789' },
          ],
        }
        break
      }

      default:
        return NextResponse.json({ error: `Unsupported CRM type: ${crmType}` }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Test trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to test trigger' },
      { status: 500 }
    )
  }
}
