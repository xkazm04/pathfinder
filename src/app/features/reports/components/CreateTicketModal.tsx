'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { issueTrackerService } from '@/lib/issueTrackers/issueTrackerService';
import { IssueTrackerType } from '@/lib/issueTrackers/types';
import { TestResultWithDetails } from '../lib/mockData';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  testResult: TestResultWithDetails;
  testSuiteName: string;
  targetUrl: string;
  onTicketCreated?: (ticketUrl: string, ticketKey: string, trackerType: IssueTrackerType) => void;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  testResult,
  testSuiteName,
  targetUrl,
  onTicketCreated,
}: CreateTicketModalProps) {
  const { currentTheme } = useTheme();
  const [selectedTracker, setSelectedTracker] = useState<IssueTrackerType>('github');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Configuration states for each tracker
  const [jiraConfig, setJiraConfig] = useState({
    apiKey: '',
    baseUrl: '',
    projectKey: '',
  });

  const [githubConfig, setGithubConfig] = useState({
    apiKey: '',
    repositoryOwner: '',
    repositoryName: '',
  });

  const [trelloConfig, setTrelloConfig] = useState({
    apiKey: '',
    token: '',
    listId: '',
  });

  // Load saved configurations from localStorage
  useEffect(() => {
    const savedJira = localStorage.getItem('issueTracker_jira');
    const savedGithub = localStorage.getItem('issueTracker_github');
    const savedTrello = localStorage.getItem('issueTracker_trello');

    if (savedJira) setJiraConfig(JSON.parse(savedJira));
    if (savedGithub) setGithubConfig(JSON.parse(savedGithub));
    if (savedTrello) setTrelloConfig(JSON.parse(savedTrello));
  }, []);

  const handleCreateTicket = async () => {
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Configure the service based on selected tracker
      let config;
      switch (selectedTracker) {
        case 'jira':
          config = {
            type: 'jira' as IssueTrackerType,
            apiKey: jiraConfig.apiKey,
            baseUrl: jiraConfig.baseUrl,
            projectKey: jiraConfig.projectKey,
          };
          localStorage.setItem('issueTracker_jira', JSON.stringify(jiraConfig));
          break;
        case 'github':
          config = {
            type: 'github' as IssueTrackerType,
            apiKey: githubConfig.apiKey,
            baseUrl: '',
            repositoryOwner: githubConfig.repositoryOwner,
            repositoryName: githubConfig.repositoryName,
          };
          localStorage.setItem('issueTracker_github', JSON.stringify(githubConfig));
          break;
        case 'trello':
          config = {
            type: 'trello' as IssueTrackerType,
            apiKey: trelloConfig.apiKey,
            baseUrl: trelloConfig.token,
            listId: trelloConfig.listId,
          };
          localStorage.setItem('issueTracker_trello', JSON.stringify(trelloConfig));
          break;
      }

      issueTrackerService.setConfig(config);

      // Create the ticket
      const response = await issueTrackerService.createTicket({
        testName: testResult.test_name,
        viewport: testResult.viewport,
        viewportSize: testResult.viewport_size,
        status: testResult.status,
        duration: testResult.duration_ms,
        errors: testResult.errors,
        consoleLogs: testResult.console_logs,
        screenshots: testResult.screenshots,
        testRunId: testResult.run_id,
        testSuiteName,
        targetUrl,
      });

      if (response.success && response.ticket) {
        setSuccess(`Ticket created successfully: ${response.ticket.url}`);

        // Call the callback with ticket info
        if (onTicketCreated) {
          const ticketKey = response.ticket.url.split('/').pop() || response.ticket.id;
          onTicketCreated(response.ticket.url, ticketKey, selectedTracker);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.error || 'Failed to create ticket');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const isConfigValid = () => {
    switch (selectedTracker) {
      case 'jira':
        return jiraConfig.apiKey && jiraConfig.baseUrl && jiraConfig.projectKey;
      case 'github':
        return githubConfig.apiKey && githubConfig.repositoryOwner && githubConfig.repositoryName;
      case 'trello':
        return trelloConfig.apiKey && trelloConfig.token && trelloConfig.listId;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          data-testid="create-ticket-modal-backdrop"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl"
          style={{
            backgroundColor: currentTheme.colors.background,
            border: `1px solid ${currentTheme.colors.border}`,
          }}
          data-testid="create-ticket-modal"
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h2
              className="text-2xl font-bold"
              style={{ color: currentTheme.colors.text.primary }}
            >
              Create Issue Ticket
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
              style={{ backgroundColor: `${currentTheme.colors.surface}40` }}
              data-testid="close-modal-btn"
            >
              <X className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Test Details Summary */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${currentTheme.colors.surface}40` }}
            >
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: currentTheme.colors.text.secondary }}
              >
                Test Details
              </h3>
              <div className="space-y-1">
                <p style={{ color: currentTheme.colors.text.primary }}>
                  <span className="font-medium">Test:</span> {testResult.test_name}
                </p>
                <p style={{ color: currentTheme.colors.text.primary }}>
                  <span className="font-medium">Viewport:</span> {testResult.viewport} ({testResult.viewport_size})
                </p>
                <p style={{ color: currentTheme.colors.text.primary }}>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={testResult.status === 'fail' ? 'text-red-500' : 'text-yellow-500'}>
                    {testResult.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {/* Tracker Selection */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: currentTheme.colors.text.secondary }}
              >
                Issue Tracker
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['jira', 'github', 'trello'] as IssueTrackerType[]).map((tracker) => (
                  <button
                    key={tracker}
                    onClick={() => setSelectedTracker(tracker)}
                    className="p-3 rounded-lg border-2 transition-all capitalize font-medium"
                    style={{
                      borderColor:
                        selectedTracker === tracker
                          ? currentTheme.colors.primary
                          : currentTheme.colors.border,
                      backgroundColor:
                        selectedTracker === tracker
                          ? `${currentTheme.colors.primary}20`
                          : 'transparent',
                      color:
                        selectedTracker === tracker
                          ? currentTheme.colors.primary
                          : currentTheme.colors.text.secondary,
                    }}
                    data-testid={`tracker-option-${tracker}`}
                  >
                    {tracker}
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration Fields */}
            <div className="space-y-4">
              {selectedTracker === 'jira' && (
                <>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      Jira Base URL
                    </label>
                    <input
                      type="text"
                      value={jiraConfig.baseUrl}
                      onChange={(e) => setJiraConfig({ ...jiraConfig, baseUrl: e.target.value })}
                      placeholder="https://your-domain.atlassian.net"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="jira-base-url-input"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      API Token
                    </label>
                    <input
                      type="password"
                      value={jiraConfig.apiKey}
                      onChange={(e) => setJiraConfig({ ...jiraConfig, apiKey: e.target.value })}
                      placeholder="Your Jira API token"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="jira-api-token-input"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      Project Key
                    </label>
                    <input
                      type="text"
                      value={jiraConfig.projectKey}
                      onChange={(e) => setJiraConfig({ ...jiraConfig, projectKey: e.target.value })}
                      placeholder="PROJECT"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="jira-project-key-input"
                    />
                  </div>
                </>
              )}

              {selectedTracker === 'github' && (
                <>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      GitHub Token
                    </label>
                    <input
                      type="password"
                      value={githubConfig.apiKey}
                      onChange={(e) => setGithubConfig({ ...githubConfig, apiKey: e.target.value })}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="github-token-input"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      Repository Owner
                    </label>
                    <input
                      type="text"
                      value={githubConfig.repositoryOwner}
                      onChange={(e) =>
                        setGithubConfig({ ...githubConfig, repositoryOwner: e.target.value })
                      }
                      placeholder="username or organization"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="github-owner-input"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={githubConfig.repositoryName}
                      onChange={(e) =>
                        setGithubConfig({ ...githubConfig, repositoryName: e.target.value })
                      }
                      placeholder="repository-name"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="github-repo-input"
                    />
                  </div>
                </>
              )}

              {selectedTracker === 'trello' && (
                <>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      API Key
                    </label>
                    <input
                      type="password"
                      value={trelloConfig.apiKey}
                      onChange={(e) => setTrelloConfig({ ...trelloConfig, apiKey: e.target.value })}
                      placeholder="Your Trello API key"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="trello-api-key-input"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      Token
                    </label>
                    <input
                      type="password"
                      value={trelloConfig.token}
                      onChange={(e) => setTrelloConfig({ ...trelloConfig, token: e.target.value })}
                      placeholder="Your Trello token"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="trello-token-input"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      List ID
                    </label>
                    <input
                      type="text"
                      value={trelloConfig.listId}
                      onChange={(e) => setTrelloConfig({ ...trelloConfig, listId: e.target.value })}
                      placeholder="Trello list ID"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text.primary,
                      }}
                      data-testid="trello-list-id-input"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div
                className="flex items-center gap-2 p-4 rounded-lg"
                style={{ backgroundColor: '#ef444420', border: '1px solid #ef4444' }}
                data-testid="error-message"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {success && (
              <div
                className="flex items-center gap-2 p-4 rounded-lg"
                style={{ backgroundColor: '#22c55e20', border: '1px solid #22c55e' }}
                data-testid="success-message"
              >
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-500">{success}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            }}
          >
            <ThemedButton variant="ghost" onClick={onClose} disabled={isCreating} data-testid="cancel-btn">
              Cancel
            </ThemedButton>
            <ThemedButton
              variant="primary"
              onClick={handleCreateTicket}
              disabled={!isConfigValid() || isCreating}
              data-testid="create-ticket-btn"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </ThemedButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
