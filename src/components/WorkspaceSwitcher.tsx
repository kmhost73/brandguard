import React, { useState, useRef, useEffect } from 'react';
import type { Workspace } from '../types';
import { ChevronUpDownIcon, CheckIcon, PlusCircleIcon } from './icons/Icons';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onCreateWorkspace: (name: string) => void;
  onChangeWorkspace: (id: string) => void;
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces,
  activeWorkspaceId,
  onCreateWorkspace,
  onChangeWorkspace,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewWorkspaceName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = () => {
    if (newWorkspaceName.trim()) {
      onCreateWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setIsCreating(false);
      setIsOpen(false);
    }
  };
  
  const handleSelect = (id: string) => {
    onChangeWorkspace(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-200 hover:bg-gray-700"
      >
        <span>{activeWorkspace?.name || 'Select Workspace'}</span>
        <ChevronUpDownIcon />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-secondary-dark border border-gray-700 rounded-md shadow-lg z-20 animate-fade-in">
          <div className="p-2">
            {workspaces.map(workspace => (
              <button
                key={workspace.id}
                onClick={() => handleSelect(workspace.id)}
                className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md"
              >
                <span className="truncate">{workspace.name}</span>
                {workspace.id === activeWorkspaceId && <CheckIcon className="text-primary w-5 h-5" />}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-700 p-2">
            {isCreating ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="New workspace name..."
                  className="flex-grow p-2 text-sm border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-1 focus:ring-primary"
                />
                <button onClick={handleCreate} className="p-2 text-primary-light hover:text-white">
                    <CheckIcon />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md"
              >
                <PlusCircleIcon />
                Create New Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
