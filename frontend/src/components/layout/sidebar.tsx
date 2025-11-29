'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  Users, 
  PlusCircle, 
  User,
  ChevronDown,
  Search,
  Mail,
  BarChart3
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'All Agents', href: '/agents', icon: Users },
  { name: 'Create Agent', href: '/agents/create', icon: PlusCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-gray-900">Voice Agent</span>
          <p className="text-xs text-gray-500">AI Sales Automation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Menu
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              <div className="flex items-center gap-3">
                <Bot className="h-4 w-4" />
                Agents
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/agents">All Agents</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/agents/create">Create Agent</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {navigation.slice(1).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        <div className="my-4 border-t border-gray-200" />
        
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Campaigns
        </div>

        <Link
          href="/campaigns"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/campaigns'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Mail className="h-4 w-4" />
          All Campaigns
        </Link>

        <Link
          href="/campaigns/create"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/campaigns/create'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <PlusCircle className="h-4 w-4" />
          Create Campaign
        </Link>
      </nav>

      {/* User */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-purple-100 text-purple-600">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">User</p>
            <p className="text-xs text-gray-500 truncate">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Dashboard</Link>
          <span>/</span>
          <Link href="/agents" className="hover:text-gray-900">Agents</Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input 
            type="search" 
            placeholder="Search..." 
            className="w-64 pl-9 bg-gray-50 border-gray-200"
          />
        </div>
      </div>
    </header>
  );
}
