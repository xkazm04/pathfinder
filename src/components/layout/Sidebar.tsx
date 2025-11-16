'use client';

import { Wand2, Play, FileText, ChevronLeft, Workflow, FolderGit2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigation, PageView, useProjects } from '@/lib/stores/appStore';
import { getProjects } from '@/lib/supabase/projects';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navigationItems = [
  { name: 'Suite Designer', page: 'designer' as PageView, icon: Wand2 },
  { name: 'Test Builder', page: 'builder' as PageView, icon: Workflow },
  { name: 'Runner', page: 'runner' as PageView, icon: Play },
  { name: 'Reports', page: 'reports' as PageView, icon: FileText, href: '/reports' },  
];

export function Sidebar() {
  const { currentPage, setCurrentPage } = useNavigation();
  const { currentProjectId, projects, setCurrentProjectId, setProjects } = useProjects();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handler for SPA module navigation
  const handleSPANavigation = (page: PageView) => {
    setCurrentPage(page);
    // Only navigate to "/" if we're not already there
    if (pathname !== '/') {
      router.push('/');
    }
  };

  const loadProjects = useCallback(async () => {
    const projectsData = await getProjects();
    setProjects(projectsData);

    // Set first project as default if no project is selected
    if (!currentProjectId && projectsData.length > 0) {
      setCurrentProjectId(projectsData[0].id);
    }
  }, [currentProjectId, setProjects, setCurrentProjectId]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] border-r transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        backgroundColor: 'var(--theme-surface)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <nav className="flex h-full flex-col p-4">
        {/* Main Navigation - Top Half */}
        <div className="space-y-2 shrink-0">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            // Determine if item is active based on route type
            // - Next.js routes (with href): active if pathname matches
            // - SPA routes (without href): active if on "/" route AND currentPage matches
            const isActive = item.href
              ? pathname?.startsWith(item.href)
              : pathname === '/' && currentPage === item.page;

            const className = `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }`;

            const content = (
              <>
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </>
            );

            // Render as Link if href exists, otherwise as button
            if (item.href) {
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className={className}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {content}
                  </Link>
                </motion.div>
              );
            }

            return (
              <motion.button
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSPANavigation(item.page)}
                className={className}
                title={isCollapsed ? item.name : undefined}
              >
                {content}
              </motion.button>
            );
          })}
        </div>

        {/* Spacer - fills middle space */}
        <div className="flex-1 min-h-[2rem]" />

        {/* Projects Section - Bottom Half */}
        <div className="shrink-0">
          {/* Divider */}
          <div
            className="mb-4 h-px"
            style={{ backgroundColor: 'var(--theme-border)' }}
          />

          {/* Projects Label */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--theme-text-tertiary)' }}
            >
              Projects
            </motion.div>
          )}

          {/* Projects List */}
          <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
            {projects.map((project, index) => {
              const isActive = currentProjectId === project.id;

              return (
                <motion.button
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentProjectId(project.id)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive ? 'sidebar-link-active' : 'sidebar-link'
                  }`}
                  title={isCollapsed ? project.name : project.description || project.name}
                >
                  <FolderGit2 className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate">{project.name}</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Collapse Button - at bottom */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center rounded-lg p-2 transition-colors sidebar-link"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </motion.button>
        </div>
      </nav>
    </aside>
  );
}
