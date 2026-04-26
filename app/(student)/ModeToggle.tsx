'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  currentMode: 'esl' | 'math'
}

export default function ModeToggle({ currentMode }: Props) {
  const pathname = usePathname()

  return (
    <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
      <Link href={pathname} replace>
        <span className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          currentMode === 'esl' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
        }`}>
          ESL
        </span>
      </Link>
      <Link href={`${pathname}?mode=math`} replace>
        <span className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          currentMode === 'math' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
        }`}>
          Math
        </span>
      </Link>
    </div>
  )
}
