# Code Structure Renderer

## Overview

Code Structure Renderer is a tool that converts your project files into a single, well-formatted markdown document. This makes it easy to:

- Share your code structure with others
- Prepare your codebase for analysis by LLMs (Large Language Models)
- Create documentation that shows both file organization and content
- Review code in a consolidated format

## How It Works

1. **Select Root Directory**: Start by specifying the root folder of your project.

2. **Add Files**: Drag and drop files or folders into the interface.

3. **Set Ignore Patterns**: Specify which files and folders to exclude from the output.
   - Common exclusions: `node_modules/`, `.git/`, `dist/`, `build/`, `*.log`, `package-lock.json`
   - Uses similar syntax to `.gitignore` files

4. **Generate Markdown**: The system processes your files and creates a single markdown document containing:
   - The root path
   - A visual directory tree showing your project structure
   - The content of each file with proper syntax highlighting

## Example Output

The generated markdown will look like this:

```markdown
# Code Structure

## Root path: 
~/my-project

## Directory structure:
~/my-project/
├── src/
│   ├── components/
│   │   └── Button.js
│   └── utils/
│       └── helpers.js
├── public/
│   └── index.html
└── package.json

## File contents:

**File: ~/my-project/src/components/Button.js**
```javascript
import React from 'react';

const Button = ({ text, onClick }) => {
  return (
    <button className="btn" onClick={onClick}>
      {text}
    </button>
  );
};

export default Button;
```

**File: ~/my-project/src/utils/helpers.js**
...
```

## Benefits

- **Comprehensive View**: See both the structure and content of your project at a glance
- **LLM-Friendly**: Provides all necessary context for AI tools to understand your codebase
- **Language Support**: Automatic syntax highlighting based on file extensions
- **Selective Inclusion**: Skip large or irrelevant files to keep the output focused
- **Portable Format**: Easily share your code structure in markdown format

## Use Cases

- Get help from AI assistants with your codebase
- Share code examples with teammates
- Document project structure for new team members
- Archive code snapshots in a readable format