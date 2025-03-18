# Vibe Coding Buddy

## Overview

Vibe Coding Buddy is a modern web application that converts your project files into a single, well-formatted markdown document. This makes it easy to:

- Share your code structure with others
- Prepare your codebase for analysis by LLMs (Large Language Models)
- Create documentation that shows both file organization and content
- Review code in a consolidated format

## Features

- **Root Directory Selection**: Securely select a local project folder
- **Automatic File Scanning**: Recursively scans the entire directory structure
- **Customizable Ignore Patterns**: Filter out files and folders using gitignore-like syntax
- **Project Metadata**: Add optional name and description for your project
- **Directory Tree Visualization**: See your project structure in a clear tree format
- **Syntax Highlighting**: Code is formatted with proper language-specific highlighting
- **Markdown Export**: Copy or download the generated markdown

## How It Works

1. **Select Root Directory**: Start by specifying the root folder of your project.

2. **Review Files**: The tool automatically scans and displays all files in the directory.

3. **Set Ignore Patterns**: Specify which files and folders to exclude from the output.
   - Default exclusions: `node_modules/`, `.git/`, `.next/`, `dist/`, `build/`, `*.log`, `package-lock.json`

4. **Generate Markdown**: Create a comprehensive document containing:
   - Project name and description (if provided)
   - The root path
   - A visual directory tree showing your project structure
   - The content of each file with proper syntax highlighting

## Technical Details

Built with:
- Next.js 15.2.3 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- File System Access API for secure local file access

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Start the production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to use the application.

## Use Cases

- **AI-Assisted Development**: Get help from AI assistants with your codebase
- **Code Reviews**: Share code examples with teammates in a readable format
- **Onboarding**: Document project structure for new team members
- **Knowledge Sharing**: Create portable snapshots of your code for presentations or articles