'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { CIProvider } from '../lib/ciHelpers';
import {
  Check,
  AlertCircle,
  Download,
  Upload,
  Loader2,
  ArrowLeft,
  Package,
  Github,
  Key,
} from 'lucide-react';

interface DeploymentOptionsProps {
  provider: CIProvider;
  isDeploying: boolean;
  deployError: string | null;
  deploySuccess: boolean;
  githubToken: string;
  setGithubToken: (token: string) => void;
  githubRepo: string;
  setGithubRepo: (repo: string) => void;
  onDeployToGitHub: () => void;
  onDownloadZip: () => void;
  onBack: () => void;
}

export function DeploymentOptions({
  provider,
  isDeploying,
  deployError,
  deploySuccess,
  githubToken,
  setGithubToken,
  githubRepo,
  setGithubRepo,
  onDeployToGitHub,
  onDownloadZip,
  onBack,
}: DeploymentOptionsProps) {
  const { currentTheme } = useTheme();
  const [showGitHubForm, setShowGitHubForm] = useState(false);

  if (deploySuccess) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Check className="w-20 h-20 mx-auto mb-6" style={{ color: '#22c55e' }} />
        </motion.div>
        <h3 className="text-2xl font-bold mb-3" style={{ color: currentTheme.colors.text.primary }}>
          {provider === 'github' && githubToken ? 'Deployed Successfully!' : 'Downloaded Successfully!'}
        </h3>
        <p className="text-lg" style={{ color: currentTheme.colors.text.secondary }}>
          {provider === 'github' && githubToken
            ? 'Your CI/CD pipeline has been deployed to GitHub'
            : 'Your CI/CD pipeline files have been downloaded as a ZIP'}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6" style={{ color: currentTheme.colors.accent }} />
        <h3 className="text-xl font-bold" style={{ color: currentTheme.colors.text.primary }}>
          Deployment Options
        </h3>
      </div>

      {/* Download ZIP - Primary Option */}
      <motion.div
        className="p-6 rounded-xl border-2"
        style={{
          borderColor: currentTheme.colors.accent,
          backgroundColor: `${currentTheme.colors.accent}10`,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-start gap-4 mb-4">
          <Download className="w-6 h-6 shrink-0 mt-1" style={{ color: currentTheme.colors.accent }} />
          <div className="flex-1">
            <h4 className="text-lg font-semibold mb-2" style={{ color: currentTheme.colors.text.primary }}>
              Download as ZIP
            </h4>
            <p className="text-sm mb-4" style={{ color: currentTheme.colors.text.secondary }}>
              Get all configuration files in a single archive, ready to import into your repository
            </p>
            <ThemedButton
              variant="glow"
              size="lg"
              onClick={onDownloadZip}
              leftIcon={<Download />}
              fullWidth
              data-testid="download-zip-btn"
            >
              Download CI/CD Package
            </ThemedButton>
          </div>
        </div>
      </motion.div>

      {/* GitHub Direct Deploy - Optional */}
      {provider === 'github' && (
        <motion.div
          className="p-6 rounded-xl border-2"
          style={{
            borderColor: currentTheme.colors.border,
            backgroundColor: currentTheme.colors.surface,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => setShowGitHubForm(!showGitHubForm)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-4">
              <Github className="w-6 h-6" style={{ color: currentTheme.colors.text.secondary }} />
              <div className="text-left">
                <h4 className="text-lg font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                  Deploy Directly to GitHub
                </h4>
                <p className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                  Optional: Automatically commit files to your repository
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showGitHubForm ? 180 : 0 }}
              style={{ color: currentTheme.colors.text.secondary }}
            >
              ▼
            </motion.div>
          </button>

          {showGitHubForm && (
            <motion.div
              className="space-y-4 pt-4 border-t"
              style={{ borderColor: currentTheme.colors.border }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-semibold mb-2"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  <Key className="w-4 h-4" />
                  <span>GitHub Personal Access Token</span>
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full p-3 rounded-lg border-2 font-mono text-sm transition-colors focus:outline-none"
                  style={{
                    backgroundColor: currentTheme.colors.background,
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = currentTheme.colors.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${currentTheme.colors.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = currentTheme.colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  data-testid="github-token-input"
                />
                <p className="text-xs mt-2" style={{ color: currentTheme.colors.text.tertiary }}>
                  Requires &apos;repo&apos; and &apos;workflow&apos; scopes
                </p>
              </div>

              <div>
                <label
                  className="flex items-center gap-2 text-sm font-semibold mb-2"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  <Github className="w-4 h-4" />
                  <span>Repository (owner/repo)</span>
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="username/repository"
                  className="w-full p-3 rounded-lg border-2 font-mono text-sm transition-colors focus:outline-none"
                  style={{
                    backgroundColor: currentTheme.colors.background,
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = currentTheme.colors.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${currentTheme.colors.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = currentTheme.colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  data-testid="github-repo-input"
                />
              </div>

              <ThemedButton
                variant="primary"
                onClick={onDeployToGitHub}
                disabled={isDeploying || !githubToken || !githubRepo}
                leftIcon={isDeploying ? <Loader2 className="animate-spin" /> : <Upload />}
                fullWidth
                data-testid="deploy-github-btn"
              >
                {isDeploying ? 'Deploying...' : 'Deploy to GitHub'}
              </ThemedButton>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Error Display */}
      {deployError && (
        <motion.div
          className="p-4 rounded-lg flex items-start gap-3"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: `4px solid #ef4444` }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div>
            <h4 className="font-semibold mb-1" style={{ color: '#ef4444' }}>
              Deployment Error
            </h4>
            <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
              {deployError}
            </p>
          </div>
        </motion.div>
      )}

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <ThemedButton
          variant="secondary"
          onClick={onBack}
          leftIcon={<ArrowLeft />}
          data-testid="back-from-deploy-btn"
        >
          Back to Configuration
        </ThemedButton>
      </motion.div>
    </motion.div>
  );
}
