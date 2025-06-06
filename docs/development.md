# Development Guide

This guide covers the development workflow for contributing to or extending the obsidian-js library.

## Project Structure

The project is organized as follows:

```
obsidian-js/
├── src/
│   ├── app/
│   │   └── obsidian-editor/
│   │       ├── extensions/       # CodeMirror extensions
│   │       ├── themes/           # Editor themes
│   │       └── utils/            # Utility functions
│   ├── components/               # Reusable React components
│   ├── contexts/                 # React contexts
│   └── types/                    # TypeScript type definitions
├── dist/                         # Built files (generated)
├── docs/                         # Documentation
└── tsconfig.json                 # TypeScript configuration
```

## Development Environment Setup

### Prerequisites

- Node.js (v18 or later)
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. Clone the repository:

```bash
git clone https://github.com/your-org/obsidian-js.git
cd obsidian-js
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

This will start a Next.js development server with a demo application that uses the library.

## Building the Library

To build the library for distribution:

```bash
npm run build:package
```

This uses `tsup` to bundle the TypeScript files into CommonJS and ES modules formats, and generates type definitions.

## Local Testing with an Application

To test the library with a local application:

### Method 1: Using npm link

1. In the obsidian-js directory:

```bash
npm run build:package
npm link
```

2. In your application directory:

```bash
npm link obsidian-js
```

3. Make changes to obsidian-js, rebuild, and they'll be reflected in your app.

### Method 2: Using the Link Script

We provide a helper script to simplify this process. See the [Linking Guide](../../notescapes-app/LINKING.md) for details.

## Code Organization

### Adding New Extensions

To add a new CodeMirror extension:

1. Create a new directory in `src/app/obsidian-editor/extensions/`
2. Implement your extension
3. Export it from the extension's `index.ts`
4. Import and use in `src/app/obsidian-editor/utils/editorExtensions.ts`

### Adding UI Components

To add a new UI component:

1. Create a new component in `src/components/`
2. Export it from `src/index.ts` if it should be public

## Testing

Run the test suite:

```bash
npm test
```

We use Jest for unit testing and React Testing Library for component tests.

## Coding Standards

- Use TypeScript for type safety
- Add JSDoc comments to all public APIs
- Follow the existing code style and formatting
- Use functional components with hooks for React code
- Keep components focused and modular

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Architecture Decisions

### Component Model

We follow a component-based architecture where:

- Core editor logic is kept in the CodeMirrorEditor component
- Theming is provided through a context API
- Extensions are modular and can be composed

### Editor Extensions

Extensions follow the CodeMirror 6 extension model:

- Each extension is isolated in its own directory
- Extensions can be enabled/disabled or configured
- Custom extensions should follow the same pattern

### Theming System

The theming system:

- Uses React context for theme state
- Syncs with system preferences
- Persists user preference in localStorage
- Applies theme tokens to both React components and CodeMirror

## Common Tasks

### Adding a New Theme

1. Create a new theme file in `src/app/obsidian-editor/themes/`
2. Define the CodeMirror theme extension
3. Add it to the theme options in `src/contexts/ThemeContext.tsx`

### Adding a New Keyboard Shortcut

1. Locate `src/app/obsidian-editor/extensions/keymaps/`
2. Add your keybinding to the appropriate keymap file
3. Define the command logic if needed

## Troubleshooting Development Issues

### Build Errors

If you encounter build errors:

1. Check your TypeScript version matches the project's
2. Ensure all dependencies are installed
3. Look for type errors in your editor

### Testing Changes

To verify your changes:

1. Run the demo app (`npm run dev`)
2. Test in an integrated app using npm link
3. Run the test suite (`npm test`)
