'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
// Remove the Image import completely, not just comment it out

type FileItem = {
  file: File;
  path: string;
};

// Add proper type for FileSystemDirectoryHandle
interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

// Add proper type for showDirectoryPicker
interface FileSystemDirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

interface Window {
  showDirectoryPicker(options?: FileSystemDirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
}

// Add custom attributes for directory input that are not in the standard HTML spec
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
    mozdirectory?: string;
  }
}

// Add proper typing for FileSystemDirectoryHandle if missing
interface FileSystemDirectoryHandleWithValues extends FileSystemDirectoryHandle {
  values(): AsyncIterable<FileSystemHandle>;
}

// Add proper typing for webkitRelativePath
interface FileWithPath extends File {
  webkitRelativePath: string;
  path?: string;
}

export default function CopierPage() {
  const [rootDirectory, setRootDirectory] = useState<{ name: string; handle?: FileSystemDirectoryHandle } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>(['node_modules/', '.git/', '.next/', 'dist/', 'build/', '*.log', 'package-lock.json']);
  const [ignoreInput, setIgnoreInput] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    rootDirectory: true,
    fileSelection: false,
    ignorePatterns: false,
    generate: false
  });
  const markdownRef = useRef<HTMLTextAreaElement>(null);

  const resetRootDirectory = useCallback(() => {
    setRootDirectory(null);
    setFiles([]);
    setMarkdown('');
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const fileItems: FileItem[] = [];
    Array.from(files).forEach(file => {
      // Try to get the relative path from webkitRelativePath
      // This is set when a folder is selected and contains the path relative to the selected folder
      let path = '';
      
      // Use proper typing for file with webkitRelativePath
      const fileWithPath = file as FileWithPath;
      if (fileWithPath.webkitRelativePath) {
        // For directory selection, we get proper paths
        path = fileWithPath.webkitRelativePath;
      } else if (file.name) {
        // For single file selection, we just get the filename
        path = file.name;
      }
      
      // Special handling for files dropped from file explorer
      // Some browsers might include path information in the DataTransfer
      if (fileWithPath.path) {
        const filePath = fileWithPath.path;
        if (filePath.includes('/') || filePath.includes('\\')) {
          // Try to extract relative path
          const parts = filePath.split(/[\/\\]/);
          path = parts[parts.length - 1];
        }
      }
      
      fileItems.push({ file, path });
    });
    
    setFiles(prev => [...prev, ...fileItems]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const onDirectorySelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setMarkdown('');
  }, []);

  const addIgnorePattern = useCallback(() => {
    if (ignoreInput.trim()) {
      setIgnorePatterns(prev => [...prev, ignoreInput.trim()]);
      setIgnoreInput('');
    }
  }, [ignoreInput]);

  const removeIgnorePattern = useCallback((pattern: string) => {
    setIgnorePatterns(prev => prev.filter(p => p !== pattern));
  }, []);

  const shouldIgnoreFile = useCallback((path: string) => {
    return ignorePatterns.some(pattern => {
      // Simple glob pattern matching
      if (pattern.startsWith('*') && pattern.endsWith('*')) {
        // *term* matches if term appears anywhere
        const term = pattern.slice(1, -1);
        return path.includes(term);
      } else if (pattern.startsWith('*')) {
        // *.ext matches if path ends with .ext
        const ext = pattern.slice(1);
        return path.endsWith(ext);
      } else if (pattern.endsWith('*')) {
        // dir/* matches if path starts with dir/
        const prefix = pattern.slice(0, -1);
        return path.startsWith(prefix);
      } else if (pattern.endsWith('/')) {
        // dir/ matches if dir/ is anywhere in the path
        return path.includes(pattern);
      }
      // Exact match
      return path === pattern;
    });
  }, [ignorePatterns]);

  // Add this function to scan a directory recursively
  const scanDirectory = useCallback(async (
    directoryHandle: FileSystemDirectoryHandle,
    path = '',
    maxDepth = 10,
    currentDepth = 0
  ): Promise<FileItem[]> => {
    if (currentDepth > maxDepth) return []; // Prevent infinite recursion
    
    const fileItems: FileItem[] = [];
    
    try {
      // Get all entries in the directory
      // Cast to the extended interface with values() method
      const dirHandleWithValues = directoryHandle as FileSystemDirectoryHandleWithValues;
      for await (const entry of dirHandleWithValues.values()) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name;
        
        // Skip if the path matches ignore patterns
        if (shouldIgnoreFile(entryPath)) continue;
        
        if (entry.kind === 'file') {
          try {
            // Get the file
            const file = await (entry as FileSystemFileHandle).getFile();
            fileItems.push({ file, path: entryPath });
          } catch (fileError) {
            console.error(`Error getting file ${entryPath}:`, fileError);
          }
        } else if (entry.kind === 'directory') {
          // Recursively scan subdirectories
          const subItems = await scanDirectory(
            entry as FileSystemDirectoryHandle,
            entryPath,
            maxDepth,
            currentDepth + 1
          );
          fileItems.push(...subItems);
        }
      }
    } catch (scanError) {
      console.error(`Error scanning directory ${path}:`, scanError);
    }
    
    return fileItems;
  }, [shouldIgnoreFile]);

  const scanRootDirectory = useCallback(async () => {
    if (!rootDirectory?.handle) return;
    
    try {
      setIsGenerating(true);
      
      // Scan the root directory recursively
      const items = await scanDirectory(rootDirectory.handle);
      
      // Set the files
      setFiles(items);
      
      setIsGenerating(false);
    } catch (scanError) {
      console.error('Error scanning root directory:', scanError);
      setIsGenerating(false);
      alert('Error scanning directory. Make sure you have permission to access all files and folders.');
    }
  }, [rootDirectory, scanDirectory]);

  // Use this interface for showDirectoryPicker in window
  interface WindowWithFS extends Window {
    showDirectoryPicker(options: FileSystemDirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
  }

  // Update the select root directory to scan automatically
  const selectRootDirectory = useCallback(async () => {
    try {
      // Check if the File System Access API is supported
      if ('showDirectoryPicker' in window) {
        // Properly typed window object with showDirectoryPicker
        const win = window as unknown as WindowWithFS;
        const directoryHandle = await win.showDirectoryPicker({
          mode: 'readwrite',
        });
        
        // Set the root directory
        setRootDirectory({
          name: directoryHandle.name,
          handle: directoryHandle,
        });
        
        // Clear previously selected files
        setFiles([]);
        
        // Automatically start scanning
        setIsGenerating(true);
        
        // Use setTimeout to allow UI to update before starting the scan
        setTimeout(async () => {
          try {
            // Scan the root directory recursively
            const items = await scanDirectory(directoryHandle);
            
            // Set the files
            setFiles(items);
          } catch (initScanError) {
            console.error('Error during initial scan:', initScanError);
            alert('Error scanning directory. Make sure you have permission to access all files and folders.');
          } finally {
            setIsGenerating(false);
          }
        }, 100);
      } else {
        alert('Your browser does not support the File System Access API. Please use Chrome, Edge, or another supported browser.');
      }
    } catch (selectionError) {
      // User cancelled or permission denied - this is expected behavior
      console.log('Directory selection was cancelled or denied');
    }
  }, [scanDirectory]);

  const generateMarkdown = useCallback(async () => {
    if (!rootDirectory || files.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      // Start building the markdown
      let md = `# Code Structure\n\n`;
      
      // Add project name if provided
      if (projectName.trim()) {
        md += `> Project Name: "${projectName.trim()}"\n\n`;
      }
      
      // Add project description if provided
      if (projectDescription.trim()) {
        md += `> ${projectDescription.trim()}\n\n`;
      }
      
      // Root path
      md += `## Root path: \n${rootDirectory.name}\n\n`;
      
      // Directory structure as a tree
      md += `## Directory structure:\n\n`;
      md += `\`\`\`tree\n.\n`;
      
      // Organize files by their paths
      const filesByDirectory: Record<string, FileItem[]> = {};
      const allDirectories = new Set<string>();
      
      // Add root directory
      allDirectories.add('');
      
      // Process each file
      files.forEach(file => {
        if (shouldIgnoreFile(file.path)) return;
        
        const pathParts = file.path.split('/');
        // Remove filename from path parts - we don't need to store it
        pathParts.pop();
        
        // Build the full path and all parent directories
        let currentPath = '';
        for (let i = 0; i < pathParts.length; i++) {
          if (i > 0) currentPath += '/';
          currentPath += pathParts[i];
          allDirectories.add(currentPath);
        }
        
        // Store the file in its directory
        if (!filesByDirectory[currentPath]) {
          filesByDirectory[currentPath] = [];
        }
        filesByDirectory[currentPath]?.push(file);
      });
      
      // Convert to arrays and sort
      const sortedDirectories = Array.from(allDirectories).sort();
      
      // Create tree structure - using a more direct approach
      type TreeNode = {
        name: string;
        isDirectory: boolean;
        path: string;
        children: TreeNode[];
      };
      
      // Create the root node
      const rootNode: TreeNode = {
        name: '',
        isDirectory: true,
        path: '',
        children: []
      };
      
      // Helper to find a directory node
      const findNode = (path: string): TreeNode | null => {
        if (path === '') return rootNode;
        
        const parts = path.split('/');
        let currentNode = rootNode;
        
        for (const part of parts) {
          const child = currentNode.children.find(node => 
            node.isDirectory && node.name === part
          );
          
          if (!child) return null;
          currentNode = child;
        }
        
        return currentNode;
      };
      
      // Add directories to the tree
      sortedDirectories.forEach(dir => {
        if (dir === '') return; // Skip root directory
        
        const parts = dir.split('/');
        const dirName = parts.pop() || '';
        const parentPath = parts.join('/');
        
        const parentNode = findNode(parentPath);
        if (parentNode) {
          parentNode.children.push({
            name: dirName,
            isDirectory: true,
            path: dir,
            children: []
          });
        }
      });
      
      // Add files to the tree
      Object.entries(filesByDirectory).forEach(([dirPath, dirFiles]) => {
        const parentNode = findNode(dirPath);
        if (!parentNode) return;
        
        // Add each file as a leaf node
        dirFiles.forEach(file => {
          // Get the file name from the path
          const fileName = file.path.split('/').pop() || file.path;
          parentNode.children.push({
            name: fileName,
            isDirectory: false,
            path: file.path,
            children: []
          });
        });
      });
      
      // Helper to sort children (directories first, then alphabetically)
      const sortChildren = (node: TreeNode) => {
        node.children.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        
        // Sort recursively
        node.children.forEach(child => {
          if (child.isDirectory) {
            sortChildren(child);
          }
        });
      };
      
      // Sort the tree
      sortChildren(rootNode);
      
      // Function to print the tree
      const printTree = (node: TreeNode, isLast = true, indent = '') => {
        if (node !== rootNode) {
          // Print the current node
          const marker = isLast ? '└── ' : '├── ';
          md += `${indent}${marker}${node.name}${node.isDirectory ? '/' : ''}\n`;
        }
        
        // Print children
        const childIndent = indent + (node !== rootNode ? (isLast ? '    ' : '│   ') : '');
        
        const children = node.children;
        children.forEach((child, index) => {
          const isLastChild = index === children.length - 1;
          printTree(child, isLastChild, childIndent);
        });
      };
      
      // Print the tree
      printTree(rootNode);
      
      // Close the tree code block
      md += `\`\`\`\n`;
      
      // File contents
      md += `\n## File contents:\n\n`;
      
      // Process each file
      for (const item of files) {
        if (shouldIgnoreFile(item.path)) continue;
        
        md += `**File: \`.\/${item.path}\`**\n\n`;
        
        // Get file extension for syntax highlighting
        const ext = item.path.split('.').pop() || '';
        let lang = '';
        
        // Map common extensions to languages for syntax highlighting
        switch (ext.toLowerCase()) {
          case 'js':
            lang = 'javascript';
            break;
          case 'ts':
            lang = 'typescript';
            break;
          case 'jsx':
            lang = 'jsx';
            break;
          case 'tsx':
            lang = 'tsx';
            break;
          case 'py':
            lang = 'python';
            break;
          case 'rb':
            lang = 'ruby';
            break;
          case 'java':
            lang = 'java';
            break;
          case 'go':
            lang = 'go';
            break;
          case 'rs':
            lang = 'rust';
            break;
          case 'c':
            lang = 'c';
            break;
          case 'cpp':
          case 'cc':
          case 'cxx':
            lang = 'cpp';
            break;
          case 'cs':
            lang = 'csharp';
            break;
          case 'php':
            lang = 'php';
            break;
          case 'html':
            lang = 'html';
            break;
          case 'css':
            lang = 'css';
            break;
          case 'scss':
          case 'sass':
            lang = 'scss';
            break;
          case 'json':
            lang = 'json';
            break;
          case 'md':
          case 'markdown':
            lang = 'markdown';
            break;
          case 'yml':
          case 'yaml':
            lang = 'yaml';
            break;
          case 'sh':
          case 'bash':
            lang = 'bash';
            break;
          case 'sql':
            lang = 'sql';
            break;
          case 'xml':
            lang = 'xml';
            break;
          default:
            lang = ext.toLowerCase(); // Fallback to the extension itself
        }
        
        try {
          // Skip files that are too large (> 1MB)
          if (item.file.size > 1024 * 1024) {
            md += `\`\`\`\nFile too large to display (${formatFileSize(item.file.size)})\n\`\`\`\n\n`;
            continue;
          }
          
          // Check if the file is binary (includes null bytes or non-text characters)
          const isBinary = item.file.type && !item.file.type.startsWith('text/') && 
                           !['application/json', 'application/javascript', 'application/xml'].includes(item.file.type);
          
          if (isBinary) {
            md += `\`\`\`\nBinary file (${item.file.type || 'unknown type'})\n\`\`\`\n\n`;
            continue;
          }
          
          // Read file content with timeout protection
          const content = await Promise.race([
            item.file.text(),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('Reading file content timed out')), 5000)
            )
          ]);
          
          // Add to markdown with syntax highlighting
          md += `\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
        } catch (contentError) {
          console.error(`Error reading file ${item.path}:`, contentError);
          md += `\`\`\`\nError reading file content: ${contentError instanceof Error ? contentError.message : 'Unknown error'}\n\`\`\`\n\n`;
        }
      }
      
      setMarkdown(md);
      
      // Make sure the generate section is expanded
      setExpandedSections(prev => ({
        ...prev,
        generate: true
      }));
      
      // Scroll to the markdown content after a short delay to let the DOM update
      setTimeout(() => {
        if (markdownRef.current) {
          markdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (genError) {
      console.error('Error generating markdown:', genError);
      alert('An error occurred while generating the markdown. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [rootDirectory, files, shouldIgnoreFile, projectName, projectDescription]);

  const copyToClipboard = useCallback(() => {
    if (markdownRef.current) {
      markdownRef.current.select();
      document.execCommand('copy');
      // Deselect
      window.getSelection()?.removeAllRanges();
      alert('Markdown copied to clipboard!');
    }
  }, []);

  const downloadMarkdown = useCallback(() => {
    if (!markdown) return;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rootDirectory?.name || 'code'}-structure.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [markdown, rootDirectory]);

  // Scroll to markdown section when it's generated
  useEffect(() => {
    if (markdown && markdownRef.current) {
      markdownRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [markdown]);

  // Function to toggle individual accordion sections
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Update expanded sections when steps are completed
  useEffect(() => {
    if (rootDirectory) {
      setExpandedSections(prev => ({
        ...prev,
        rootDirectory: false,
        fileSelection: true
      }));
    }
  }, [rootDirectory]);

  useEffect(() => {
    if (files.length > 0) {
      setExpandedSections(prev => ({
        ...prev,
        fileSelection: false,
        ignorePatterns: true
      }));
    }
  }, [files.length]);

  // If no root directory is selected, ensure the first step is expanded
  useEffect(() => {
    if (!rootDirectory) {
      setExpandedSections(prev => ({
        ...prev,
        rootDirectory: true
      }));
    }
  }, [rootDirectory]);

  return (
    <div className="min-h-screen p-4 sm:p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-1">Vibe Coding Buddy</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-5 text-center max-w-3xl">
        Convert your project files into a single, well-formatted markdown document for sharing or LLM analysis
      </p>
      
      {/* Root Directory Selection */}
      <div className="w-full max-w-3xl mb-3">
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <button 
            className={`w-full p-4 text-left font-semibold flex justify-between items-center ${rootDirectory ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-gray-900'}`} 
            onClick={() => toggleSection('rootDirectory')}
          >
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-3 text-sm">
                1
              </span>
              <span className="text-xl">Select Root Folder</span>
            </div>
            <div className="flex items-center">
              {rootDirectory && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-1 px-2 rounded-full mr-2">
                  Completed
                </span>
              )}
              <svg 
                className={`w-5 h-5 transition-transform ${expandedSections.rootDirectory ? 'transform rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {expandedSections.rootDirectory && (
            <div className="p-6 border-t">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                First, select a root folder where files will be processed. This folder will be used as the reference point.
              </p>
              
              {!rootDirectory ? (
                <button
                  onClick={selectRootDirectory}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors inline-flex items-center justify-center"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Selecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Select Root Folder
                    </>
                  )}
                </button>
              ) : (
                <div>
                  <div className="flex items-center p-3 mb-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="w-10 h-10 flex items-center justify-center text-blue-500 mr-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{rootDirectory.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isGenerating ? 'Scanning directory...' : 'Root folder selected'}
                        {files.length > 0 && ` (${files.length} files found)`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={scanRootDirectory}
                        disabled={isGenerating}
                        className="text-blue-500 hover:text-blue-600 transition-colors p-2 disabled:opacity-50"
                        title="Rescan Directory"
                      >
                        {isGenerating ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                      <button 
                        onClick={resetRootDirectory}
                        disabled={isGenerating}
                        className="text-red-500 hover:text-red-600 transition-colors p-2 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Project Name Input */}
                  <div className="mt-4 mb-2">
                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter a name for your project"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This will be displayed in the generated markdown document
                    </p>
                  </div>
                  
                  {/* Project Description Input */}
                  <div className="mt-4 mb-2">
                    <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Description (Optional)
                    </label>
                    <textarea
                      id="project-description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Enter a brief description of your project"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      A short description that will appear in the markdown output
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {isGenerating 
                      ? 'Scanning directory... This may take a while for large directories.' 
                      : 'Directory has been scanned. You can adjust ignore patterns in step 3 to filter files.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* File Selection - Step 2 */}
      <div className="w-full max-w-3xl mb-3">
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <button 
            className={`w-full p-4 text-left font-semibold flex justify-between items-center ${files.length > 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-gray-900'}`} 
            onClick={() => toggleSection('fileSelection')}
            disabled={!rootDirectory}
          >
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-3 text-sm">
                2
              </span>
              <span className="text-xl">Select Files to Process</span>
            </div>
            <div className="flex items-center">
              {files.length > 0 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-1 px-2 rounded-full mr-2">
                  {files.length} files
                </span>
              )}
              {!rootDirectory && (
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 py-1 px-2 rounded-full mr-2">
                  Locked
                </span>
              )}
              <svg 
                className={`w-5 h-5 transition-transform ${expandedSections.fileSelection ? 'transform rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {expandedSections.fileSelection && rootDirectory && (
            <div className="p-6 border-t">
              {/* Drop Zone */}
              <div 
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all duration-200 ${
                  !rootDirectory 
                    ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/30' 
                    : isDragging 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102 shadow-lg' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
                onDragOver={rootDirectory ? onDragOver : undefined}
                onDragLeave={rootDirectory ? onDragLeave : undefined}
                onDrop={rootDirectory ? onDrop : undefined}
              >
                <div className="text-center w-full">
                  {files.length === 0 ? (
                    <>
                      {/* Inline SVG instead of Image component to avoid potential missing asset */}
                      <svg 
                        className={`w-12 h-12 mx-auto mb-4 ${rootDirectory ? 'text-gray-400' : 'text-gray-300'}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                        />
                      </svg>
                      <p className="text-lg font-medium mb-2">
                        {!rootDirectory 
                          ? 'Select a root folder first' 
                          : isDragging 
                            ? 'Drop files here' 
                            : 'Drag & drop files or folders here'
                        }
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                        {rootDirectory ? 'Or select from your computer' : 'Complete step 1 to enable this section'}
                      </p>
                    </>
                  ) : (
                    <div className="flex justify-between items-center mb-3 w-full">
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Selected Files ({files.length})</h3>
                      <button 
                        onClick={clearFiles}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                  
                  {files.length > 0 && (
                    <div className="border rounded-lg divide-y dark:border-gray-700 dark:divide-gray-700 overflow-hidden max-h-64 overflow-y-auto mb-4 w-full">
                      {files.map((item, index) => (
                        <div 
                          key={index} 
                          className={`p-3 flex items-center ${
                            shouldIgnoreFile(item.path) 
                              ? 'bg-gray-100 dark:bg-gray-800/50 opacity-50' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          } transition-colors`}
                        >
                          <div className="w-8 h-8 mr-3 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{item.path}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatFileSize(item.file.size)}
                              {shouldIgnoreFile(item.path) && <span className="ml-2 text-yellow-500">(Ignored)</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {rootDirectory && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors inline-flex items-center justify-center">
                        <span>{files.length > 0 ? 'Add More Files' : 'Select Files'}</span>
                        <input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={onFileSelect} 
                        />
                      </label>
                      <label className="cursor-pointer bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md transition-colors inline-flex items-center justify-center">
                        <span>{files.length > 0 ? 'Add Folder' : 'Select Folder'}</span>
                        <input 
                          type="file" 
                          directory=""
                          webkitdirectory=""
                          mozdirectory=""
                          className="hidden" 
                          onChange={onDirectorySelect} 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ignore Patterns - Step 3 */}
      <div className="w-full max-w-3xl mb-3">
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <button 
            className={`w-full p-4 text-left font-semibold flex justify-between items-center ${ignorePatterns.length > 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-gray-900'}`} 
            onClick={() => toggleSection('ignorePatterns')}
            disabled={!rootDirectory}
          >
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-3 text-sm">
                3
              </span>
              <span className="text-xl">Set Ignore Patterns</span>
            </div>
            <div className="flex items-center">
              {ignorePatterns.length > 0 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-1 px-2 rounded-full mr-2">
                  {ignorePatterns.length} patterns
                </span>
              )}
              {!rootDirectory && (
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 py-1 px-2 rounded-full mr-2">
                  Locked
                </span>
              )}
              <svg 
                className={`w-5 h-5 transition-transform ${expandedSections.ignorePatterns ? 'transform rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {expandedSections.ignorePatterns && rootDirectory && (
            <div className="p-6 border-t">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Specify patterns for files and folders to exclude from the output. Uses similar syntax to .gitignore files.
              </p>
              
              <div className="flex mb-4">
                <input
                  type="text"
                  value={ignoreInput}
                  onChange={(e) => setIgnoreInput(e.target.value)}
                  placeholder="E.g., node_modules/, *.log"
                  className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  onKeyPress={(e) => e.key === 'Enter' && addIgnorePattern()}
                />
                <button
                  onClick={addIgnorePattern}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
              
              {ignorePatterns.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium mb-2">Current ignore patterns:</p>
                  <div className="flex flex-wrap gap-2">
                    {ignorePatterns.map((pattern, index) => (
                      <div 
                        key={index} 
                        className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full"
                      >
                        <span className="text-sm">{pattern}</span>
                        <button
                          onClick={() => removeIgnorePattern(pattern)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generate Markdown - Step 4 */}
      {rootDirectory && files.length > 0 && (
        <div className="w-full max-w-3xl mb-3">
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <button 
              className={`w-full p-4 text-left font-semibold flex justify-between items-center ${markdown ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-white dark:bg-gray-900'}`} 
              onClick={() => toggleSection('generate')}
            >
              <div className="flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 mr-3 text-sm">
                  4
                </span>
                <span className="text-xl">Generate Markdown</span>
              </div>
              <div className="flex items-center">
                {markdown && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 py-1 px-2 rounded-full mr-2">
                    Generated
                  </span>
                )}
                <svg 
                  className={`w-5 h-5 transition-transform ${expandedSections.generate ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.generate && (
              <div className="p-6 border-t">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create a well-formatted markdown document containing your selected files with proper structure and syntax highlighting.
                </p>
                
                <div className="flex justify-center">
                  <button
                    onClick={generateMarkdown}
                    disabled={isGenerating}
                    className={`px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center ${
                      isGenerating ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Generate Markdown
                      </>
                    )}
                  </button>
                </div>
                
                {markdown && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Generated Markdown</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy
                        </button>
                        <button
                          onClick={downloadMarkdown}
                          className="flex items-center text-green-500 hover:text-green-600 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <textarea
                        ref={markdownRef}
                        value={markdown}
                        readOnly
                        className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 