'use client'

import { useState } from 'react'
import { CheckCircle, Circle, BookOpen } from 'lucide-react'
import type { OrgConfig } from '@/types'

const PATHS: Record<OrgConfig['orgType'], { title: string; description: string }[]> = {
  marketing: [
    {
      title: 'Prompt engineering fundamentals',
      description: 'Learn to write effective prompts for consistent, high-quality AI outputs.',
    },
    {
      title: 'Building AI agents with Claude',
      description: 'Design and deploy autonomous AI agents using Claude\'s tool-use capabilities.',
    },
    {
      title: 'Claude Code basics',
      description: 'Use Claude Code CLI to accelerate development of AI-powered workflows.',
    },
    {
      title: 'Automated content workflows',
      description: 'Build end-to-end pipelines for content creation, review, and publishing.',
    },
    {
      title: 'Custom internal AI tools',
      description: 'Develop bespoke AI tools tailored to your team\'s unique processes.',
    },
  ],
  volunteer: [
    {
      title: 'Email triage automation',
      description: 'Automatically categorise and prioritise incoming emails using AI.',
    },
    {
      title: 'Inbox zero workflows',
      description: 'Implement AI-assisted processes to maintain a clean, managed inbox.',
    },
    {
      title: 'Meeting summarisation',
      description: 'Automatically generate concise summaries from meeting transcripts.',
    },
    {
      title: 'Donor communication templates',
      description: 'Create personalised, AI-generated templates for donor outreach.',
    },
    {
      title: 'Reporting automation',
      description: 'Automate the generation of regular impact and activity reports.',
    },
  ],
  enterprise: [
    {
      title: 'AI governance frameworks',
      description: 'Establish policies, oversight processes, and risk management for enterprise AI.',
    },
    {
      title: 'Large-scale data pipelines',
      description: 'Build robust data infrastructure to support enterprise AI initiatives.',
    },
    {
      title: 'Integration architecture',
      description: 'Connect AI capabilities with existing enterprise systems and APIs.',
    },
    {
      title: 'Change management for AI',
      description: 'Lead organisational change to embed AI into business culture and processes.',
    },
    {
      title: 'AI ROI measurement',
      description: 'Define KPIs and measurement frameworks for AI transformation value.',
    },
  ],
}

interface Props {
  orgType: OrgConfig['orgType']
  userId: string
}

const STORAGE_KEY = (userId: string) => `skills_completed_${userId}`

function getCompleted(userId: string): Set<number> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(STORAGE_KEY(userId))
    return stored ? new Set(JSON.parse(stored) as number[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveCompleted(userId: string, completed: Set<number>) {
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify([...completed]))
}

export default function SkillsPath({ orgType, userId }: Props) {
  const skills = PATHS[orgType] ?? PATHS.enterprise
  const [completed, setCompleted] = useState<Set<number>>(() => getCompleted(userId))

  function toggleComplete(i: number) {
    setCompleted((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      saveCompleted(userId, next)
      return next
    })
  }

  const progress = Math.round((completed.size / skills.length) * 100)

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Learning Path</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6 capitalize">
        {orgType.replace('_', ' ')} organisation track
      </p>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1.5">
          <span>{completed.size} of {skills.length} completed</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {skills.map((skill, i) => {
          const done = completed.has(i)
          return (
            <div
              key={i}
              className={`rounded-xl border p-4 transition-colors ${
                done
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleComplete(i)}
                  className="mt-0.5 shrink-0"
                  aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {done ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className={`text-sm font-semibold ${done ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                      {skill.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{skill.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
