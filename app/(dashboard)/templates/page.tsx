'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Search,
  Star,
  Users,
  TrendingUp,
  Home,
  Heart,
  ShoppingCart,
  Briefcase,
  GraduationCap,
  Car,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Template data - in production this would come from database
const templates = [
  {
    id: '1',
    name: 'Real Estate Lead Qualifier',
    description: 'Automatically qualify leads, schedule property viewings, and follow up with potential buyers.',
    category: 'Real Estate',
    icon: Home,
    isFeatured: true,
    conversionRate: 94,
    activeUsers: 1200,
  },
  {
    id: '2',
    name: 'Medical Practice',
    description: 'Book appointments and handle patient inquiries with empathy and professionalism.',
    category: 'Healthcare',
    icon: Heart,
    isFeatured: false,
    conversionRate: 89,
    activeUsers: 856,
  },
  {
    id: '3',
    name: 'E-commerce Store',
    description: 'Product recommendations, order support, and customer service automation.',
    category: 'E-commerce',
    icon: ShoppingCart,
    isFeatured: false,
    conversionRate: 76,
    activeUsers: 2340,
  },
  {
    id: '4',
    name: 'Business Consulting',
    description: 'Qualify leads, book discovery calls, and provide initial consultation.',
    category: 'B2B',
    icon: Briefcase,
    isFeatured: false,
    conversionRate: 82,
    activeUsers: 534,
  },
  {
    id: '5',
    name: 'Online Course',
    description: 'Answer student questions, promote courses, and handle enrollments.',
    category: 'Education',
    icon: GraduationCap,
    isFeatured: false,
    conversionRate: 71,
    activeUsers: 423,
  },
  {
    id: '6',
    name: 'Car Dealership',
    description: 'Schedule test drives, answer vehicle questions, and follow up on leads.',
    category: 'Automotive',
    icon: Car,
    isFeatured: false,
    conversionRate: 85,
    activeUsers: 678,
  },
]

const categories = ['All', 'Real Estate', 'Healthcare', 'E-commerce', 'B2B', 'Education', 'Automotive']

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredTemplate = templates.find(t => t.isFeatured)
  const regularTemplates = filteredTemplates.filter(t => !t.isFeatured)

  const handleUseTemplate = (templateId: string, templateName: string) => {
    toast.success(`Creating agent from "${templateName}" template...`)
    // In production, this would create a new agent with the template's script
    window.location.href = `/agents/new?template=${templateId}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Templates</h1>
          <p className="text-gray-400">
            Start with proven conversation scripts for your industry
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                selectedCategory === category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#252525]'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Template */}
      {featuredTemplate && selectedCategory === 'All' && !searchQuery && (
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-[#1a1a1a] to-emerald-500/5 p-6">
          <div className="flex items-start gap-2 mb-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">Featured Template</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                <featuredTemplate.icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{featuredTemplate.name}</h3>
                <p className="text-gray-400 max-w-xl">{featuredTemplate.description}</p>
                <div className="flex items-center gap-6 mt-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-white font-medium">{featuredTemplate.conversionRate}%</span>
                    <span className="text-gray-500">conversion</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-white font-medium">{featuredTemplate.activeUsers.toLocaleString()}</span>
                    <span className="text-gray-500">active users</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleUseTemplate(featuredTemplate.id, featuredTemplate.name)}
              className="px-6 py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors whitespace-nowrap"
            >
              Use This Template
            </button>
          </div>
        </div>
      )}

      {/* Template Grid */}
      {regularTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-gray-600 mb-4" />
          <p className="text-gray-400">No templates found</p>
          {searchQuery && (
            <p className="text-gray-600 text-sm mt-1">Try a different search term</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {regularTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                  <template.icon className="h-6 w-6 text-emerald-500" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#252525] text-gray-400">
                  {template.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{template.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-gray-300">{template.conversionRate}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-gray-300">{template.activeUsers.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleUseTemplate(template.id, template.name)}
                className="w-full py-2.5 rounded-lg bg-[#252525] text-white font-medium hover:bg-[#303030] transition-colors"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
