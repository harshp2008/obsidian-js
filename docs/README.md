# Obsidian JS Documentation

## Overview

This directory contains documentation for the Obsidian JS editor, a modern markdown editor with advanced features.

## Table of Contents

- [Theme System](./themes.md) - Documentation for the theme system
- [Components](./components.md) - Component documentation
- [Extensions](./extensions.md) - Extension system documentation

## Project Structure

The Obsidian JS project is organized as follows:

```
obsidian-js/
├── docs/                  # Documentation
├── public/                # Static assets
│   └── themes/            # Theme files
│       ├── vanilla/       # Vanilla theme family
│       └── ...            # Other theme families
├── src/                   # Source code
│   ├── app/               # Main application code
│   │   └── obsidian-editor/  # Editor core
│   │       ├── components/   # Editor components
│   │       ├── extensions/   # Editor extensions
│   │       ├── themes/       # Theme management
│   │       └── utils/        # Utility functions
│   ├── components/        # Shared components
│   ├── contexts/          # React contexts
│   └── types/             # TypeScript type definitions
└── ...                    # Configuration files
```

## Getting Started

For new developers, start by exploring the following areas:

1. **Theme System** - See [themes.md](./themes.md) for documentation on customizing the editor's appearance
2. **Editor Components** - Key components are documented in [components.md](./components.md)
3. **Extension Development** - Learn how to create extensions in [extensions.md](./extensions.md)

## Best Practices

When contributing to Obsidian JS, please follow these best practices:

1. **Code Organization** - Keep related code together in appropriate directories
2. **Documentation** - Add JSDoc comments to all functions, classes, and modules
3. **TypeScript** - Use TypeScript for type safety
4. **Testing** - Write tests for new functionality
5. **Performance** - Consider performance implications of changes

## Contribution Guide

To contribute to Obsidian JS:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Submit a pull request

Please make sure your code follows the project's style and organization conventions.
