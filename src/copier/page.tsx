'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

type FileItem = {
  file: File;
  path: string;
};

// Add custom attributes for directory input that are not in the standard HTML spec
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
    mozdirectory?: string;
  }
}

export default function CopierPage() {
  const [rootDirectory, setRootDirectory] = useState<{ name: string; handle?: FileSystemDirectoryHandle } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);

  const selectRootDirectory = useCallback(async () => {
    try {
      // Check if the File System Access API is supported
      if ('showDirectoryPicker' in window) {
        const directoryHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });
        setRootDirectory({
          name: directoryHandle.name,
          handle: directoryHandle,
        });
      } else {
        alert('Your browser does not support the File System Access API. Please use Chrome, Edge, or another supported browser.');
      }
    } catch (error) {
      // User cancelled or permission denied
      console.log('Directory selection was cancelled or denied', error);
    }
  }, []);

  const resetRootDirectory = useCallback(() => {
    setRootDirectory(null);
    setFiles([]);
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
      // The webkitRelativePath property contains the path relative to the directory
      // that was selected. If it's empty, the file was selected directly, not as part of a directory
      const path = (file as any).webkitRelativePath || file.name;
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
  }, []);

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-2">File Copier</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Select a root folder and drop files to copy</p>
      
      {/* Root Directory Selection */}
      <div className="w-full max-w-2xl mb-8">
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">1. Select Root Folder</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            First, select a root folder where files will be processed. This folder will be used as the reference point.
          </p>
          
          {!rootDirectory ? (
            <button
              onClick={selectRootDirectory}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Select Root Folder
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Root folder selected</p>
                </div>
                <button 
                  onClick={resetRootDirectory}
                  className="text-red-500 hover:text-red-600 transition-colors p-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Now you can proceed to step 2 and select files to copy.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* File Selection - Step 2 */}
      <div className="w-full max-w-2xl mb-8">
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">2. Select Files to Copy</h2>
          
          {/* Drop Zone */}
          <div 
            className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all duration-200 ${
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
            <div className="text-center">
              <Image 
                src="/upload.svg" 
                alt="Upload" 
                width={48} 
                height={48}
                className={`mx-auto mb-4 ${rootDirectory ? 'opacity-70' : 'opacity-40'}`}
                priority
              />
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
              
              {rootDirectory && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors inline-flex items-center justify-center">
                    <span>Select Files</span>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={onFileSelect} 
                    />
                  </label>
                  <label className="cursor-pointer bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md transition-colors inline-flex items-center justify-center">
                    <span>Select Folder</span>
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
      </div>

      {/* File List */}
      {rootDirectory && files.length > 0 && (
        <div className="w-full max-w-2xl">
          <div className="border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Selected Files ({files.length})</h2>
              <button 
                onClick={clearFiles}
                className="text-sm text-red-500 hover:text-red-600 transition-colors"
              >
                Clear All
              </button>
            </div>
            <ul className="border rounded-lg divide-y dark:border-gray-700 dark:divide-gray-700 overflow-hidden">
              {files.map((item, index) => (
                <li key={index} className="p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 mr-3 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <Image 
                      src="/file-icon.svg" 
                      alt="File" 
                      width={20} 
                      height={20}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.path}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(item.file.size)}</p>
                  </div>
                </li>
              ))}
            </ul>
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
