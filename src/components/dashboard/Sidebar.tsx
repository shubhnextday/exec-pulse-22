import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  DollarSign, 
  Package, 
  Users, 
  Code2, 
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Executive Summary', icon: LayoutDashboard },
  { id: 'financial', label: 'Financial Overview', icon: DollarSign },
  { id: 'operations', label: 'Operations (Orders)', icon: Package },
  { id: 'commissions', label: 'Agent Commissions', icon: Users },
  { id: 'web-dev', label: 'Web Development', icon: Code2 },
  { id: 'attention', label: 'Needs Attention', icon: AlertTriangle },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F05323' }}>
                <span className="text-sm font-bold text-white">ND</span>
              </div>
              <div>
                <h1 className="font-semibold text-sm text-foreground">NextDay Nutra</h1>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Executive Dashboard</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors",
              collapsed && "mx-auto"
            )}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              collapsed && "rotate-180"
            )} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full nav-item",
              activeSection === item.id && "active",
              collapsed && "justify-center px-0"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="truncate text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

    </aside>
  );
}
