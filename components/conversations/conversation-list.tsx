'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { MoreVertical, Trash2, Eye, CheckCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

type Conversation = Tables<'conversations'> & {
  whatsapp_accounts?: { instance_name: string | null; phone_number: string | null } | null
  agents?: { name: string; agent_name?: string | null } | null
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onDelete?: (id: string) => void
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktiv', color: 'text-[#00a884]' },
  paused: { label: 'Pausiert', color: 'text-[#f7c948]' },
  escalated: { label: 'Eskaliert', color: 'text-[#ea4335]' },
  completed: { label: 'Abgeschlossen', color: 'text-[#53bdeb]' },
  disqualified: { label: 'Disqualifiziert', color: 'text-[#8696a0]' },
}

// Known country codes with their length (most common ones)
const COUNTRY_CODES: Record<string, number> = {
  '1': 1,     // USA, Canada
  '7': 1,     // Russia, Kazakhstan
  '20': 2,    // Egypt
  '27': 2,    // South Africa
  '30': 2,    // Greece
  '31': 2,    // Netherlands
  '32': 2,    // Belgium
  '33': 2,    // France
  '34': 2,    // Spain
  '36': 2,    // Hungary
  '39': 2,    // Italy
  '40': 2,    // Romania
  '41': 2,    // Switzerland
  '43': 2,    // Austria
  '44': 2,    // UK
  '45': 2,    // Denmark
  '46': 2,    // Sweden
  '47': 2,    // Norway
  '48': 2,    // Poland
  '49': 2,    // Germany
  '51': 2,    // Peru
  '52': 2,    // Mexico
  '53': 2,    // Cuba
  '54': 2,    // Argentina
  '55': 2,    // Brazil
  '56': 2,    // Chile
  '57': 2,    // Colombia
  '58': 2,    // Venezuela
  '60': 2,    // Malaysia
  '61': 2,    // Australia
  '62': 2,    // Indonesia
  '63': 2,    // Philippines
  '64': 2,    // New Zealand
  '65': 2,    // Singapore
  '66': 2,    // Thailand
  '81': 2,    // Japan
  '82': 2,    // South Korea
  '84': 2,    // Vietnam
  '86': 2,    // China
  '90': 2,    // Turkey
  '91': 2,    // India
  '92': 2,    // Pakistan
  '93': 2,    // Afghanistan
  '94': 2,    // Sri Lanka
  '95': 2,    // Myanmar
  '98': 2,    // Iran
  '212': 3,   // Morocco
  '213': 3,   // Algeria
  '216': 3,   // Tunisia
  '218': 3,   // Libya
  '220': 3,   // Gambia
  '221': 3,   // Senegal
  '222': 3,   // Mauritania
  '223': 3,   // Mali
  '224': 3,   // Guinea
  '225': 3,   // Ivory Coast
  '226': 3,   // Burkina Faso
  '227': 3,   // Niger
  '228': 3,   // Togo
  '229': 3,   // Benin
  '230': 3,   // Mauritius
  '231': 3,   // Liberia
  '232': 3,   // Sierra Leone
  '233': 3,   // Ghana
  '234': 3,   // Nigeria
  '235': 3,   // Chad
  '236': 3,   // Central African Republic
  '237': 3,   // Cameroon
  '238': 3,   // Cape Verde
  '239': 3,   // São Tomé and Príncipe
  '240': 3,   // Equatorial Guinea
  '241': 3,   // Gabon
  '242': 3,   // Republic of the Congo
  '243': 3,   // Democratic Republic of the Congo
  '244': 3,   // Angola
  '245': 3,   // Guinea-Bissau
  '246': 3,   // British Indian Ocean Territory
  '247': 3,   // Ascension Island
  '248': 3,   // Seychelles
  '249': 3,   // Sudan
  '250': 3,   // Rwanda
  '251': 3,   // Ethiopia
  '252': 3,   // Somalia
  '253': 3,   // Djibouti
  '254': 3,   // Kenya
  '255': 3,   // Tanzania
  '256': 3,   // Uganda
  '257': 3,   // Burundi
  '258': 3,   // Mozambique
  '260': 3,   // Zambia
  '261': 3,   // Madagascar
  '262': 3,   // Réunion
  '263': 3,   // Zimbabwe
  '264': 3,   // Namibia
  '265': 3,   // Malawi
  '266': 3,   // Lesotho
  '267': 3,   // Botswana
  '268': 3,   // Eswatini
  '269': 3,   // Comoros
  '351': 3,   // Portugal
  '352': 3,   // Luxembourg
  '353': 3,   // Ireland
  '354': 3,   // Iceland
  '355': 3,   // Albania
  '356': 3,   // Malta
  '357': 3,   // Cyprus
  '358': 3,   // Finland
  '359': 3,   // Bulgaria
  '370': 3,   // Lithuania
  '371': 3,   // Latvia
  '372': 3,   // Estonia
  '373': 3,   // Moldova
  '374': 3,   // Armenia
  '375': 3,   // Belarus
  '376': 3,   // Andorra
  '377': 3,   // Monaco
  '378': 3,   // San Marino
  '380': 3,   // Ukraine
  '381': 3,   // Serbia
  '382': 3,   // Montenegro
  '383': 3,   // Kosovo
  '385': 3,   // Croatia
  '386': 3,   // Slovenia
  '387': 3,   // Bosnia and Herzegovina
  '389': 3,   // North Macedonia
  '420': 3,   // Czech Republic
  '421': 3,   // Slovakia
  '423': 3,   // Liechtenstein
  '852': 3,   // Hong Kong
  '853': 3,   // Macau
  '855': 3,   // Cambodia
  '856': 3,   // Laos
  '880': 3,   // Bangladesh
  '886': 3,   // Taiwan
  '960': 3,   // Maldives
  '961': 3,   // Lebanon
  '962': 3,   // Jordan
  '963': 3,   // Syria
  '964': 3,   // Iraq
  '965': 3,   // Kuwait
  '966': 3,   // Saudi Arabia
  '967': 3,   // Yemen
  '968': 3,   // Oman
  '970': 3,   // Palestine
  '971': 3,   // United Arab Emirates
  '972': 3,   // Israel
  '973': 3,   // Bahrain
  '974': 3,   // Qatar
  '975': 3,   // Bhutan
  '976': 3,   // Mongolia
  '977': 3,   // Nepal
  '992': 3,   // Tajikistan
  '993': 3,   // Turkmenistan
  '994': 3,   // Azerbaijan
  '995': 3,   // Georgia
  '996': 3,   // Kyrgyzstan
  '998': 3,   // Uzbekistan
}

function getCountryCodeLength(digits: string): number {
  // Check for 3-digit codes first (most specific)
  if (COUNTRY_CODES[digits.slice(0, 3)] === 3) return 3
  // Then 2-digit codes
  if (COUNTRY_CODES[digits.slice(0, 2)] === 2) return 2
  // Then 1-digit codes
  if (COUNTRY_CODES[digits.slice(0, 1)] === 1) return 1
  // Default: assume 2 for unknown codes
  return 2
}

function formatPhoneNumber(phone: string): string {
  // Get only digits
  const digits = phone.replace(/\D/g, '')

  if (digits.length < 8) {
    return phone.startsWith('+') ? phone : `+${digits}`
  }

  // Determine country code length
  const ccLength = getCountryCodeLength(digits)
  const countryCode = digits.slice(0, ccLength)
  const nationalNumber = digits.slice(ccLength)

  // Format the national number in groups of 3-4 digits
  if (nationalNumber.length <= 6) {
    return `+${countryCode} ${nationalNumber}`
  } else if (nationalNumber.length <= 9) {
    return `+${countryCode} ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3)}`
  } else {
    // For longer numbers, split into 3-3-rest
    return `+${countryCode} ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`
  }
}

function getInitials(name: string | null, pushName: string | null, phone: string): string {
  const displayName = name || pushName
  if (displayName) {
    const parts = displayName.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }
  // Use last 2 digits of phone for initials
  const digits = phone.replace(/\D/g, '')
  return digits.slice(-2)
}

export function ConversationList({ conversations, selectedId, onDelete }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#8696a0] p-8 text-center">
        Keine Konversationen gefunden
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div>
        {conversations.map((conversation) => {
          const status = statusConfig[conversation.status] || statusConfig.active
          const isSelected = conversation.id === selectedId
          // Priority: contact_name (from CRM) > contact_push_name (from WhatsApp) > formatted phone
          const displayName = conversation.contact_name || conversation.contact_push_name || formatPhoneNumber(conversation.contact_phone)

          return (
            <div
              key={conversation.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors group cursor-pointer border-b border-[#222d34]',
                isSelected
                  ? 'bg-[#2a3942]'
                  : 'hover:bg-[#202c33]'
              )}
            >
              <Link href={`/conversations/${conversation.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage
                    src={conversation.profile_picture_url || undefined}
                    alt={conversation.contact_name || conversation.contact_phone}
                  />
                  <AvatarFallback className="bg-[#6b7c85] text-[#e9edef] font-medium text-base">
                    {getInitials(conversation.contact_name, conversation.contact_push_name, conversation.contact_phone)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[#e9edef] truncate text-[15px]">
                      {displayName}
                    </p>
                    <span className="text-xs text-[#8696a0] shrink-0">
                      {conversation.last_message_at
                        ? formatDistanceToNow(new Date(conversation.last_message_at), {
                            addSuffix: false,
                            locale: de,
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCheck className="h-4 w-4 text-[#53bdeb] shrink-0" />
                    <span className={cn('text-sm truncate', status.color)}>
                      {status.label}
                    </span>
                    {conversation.agents?.name && (
                      <span className="text-sm text-[#8696a0] truncate">
                        · {conversation.agents.name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#233138] border-[#233138] shadow-xl">
                  <DropdownMenuItem asChild className="text-[#e9edef] focus:text-[#e9edef] focus:bg-[#2a3942]">
                    <Link href={`/conversations/${conversation.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Anzeigen
                    </Link>
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        onDelete(conversation.id)
                      }}
                      className="text-[#ea4335] focus:text-[#ea4335] focus:bg-[#2a3942]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
