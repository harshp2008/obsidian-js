# Contributing to Obsidian JS

Thank you for your interest in contributing to Obsidian JS! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

- Before submitting a bug report, check if the issue has already been reported
- Use the bug report template when creating an issue
- Include detailed steps to reproduce the problem
- Describe the expected behavior and what actually happened
- Include screenshots or code snippets if applicable

### Suggesting Enhancements

- Use the feature request template when suggesting enhancements
- Explain why the enhancement would be useful
- Consider including mockups or examples

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Workflow

### Setting Up the Development Environment

```bash
# Clone your fork
git clone https://github.com/yourusername/obsidian-js.git
cd obsidian-js

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Project Structure

The project is organized as follows:

```
obsidian-js/
├── docs/                  # Documentation
├── public/                # Static assets
│   └── themes/            # Theme files
├── src/                   # Source code
│   ├── app/               # Main application code
│   │   └── obsidian-editor/  # Editor core
│   ├── components/        # Shared components
│   ├── contexts/          # React contexts
│   └── types/             # TypeScript type definitions
└── ...                    # Configuration files
```

### Coding Standards

- Use TypeScript for type safety
- Follow the existing code style and conventions
- Add JSDoc comments to functions, classes, and modules
- Write meaningful commit messages

### Testing

- Write tests for new functionality
- Ensure all tests pass before submitting a PR
- Run tests with `npm test`

### Documentation

- Update documentation for any changes to functionality
- Add JSDoc comments to all public functions, classes, and modules
- Keep README and documentation files up to date

## Pull Request Process

1. Update the README.md or documentation with details of changes if needed
2. Update the tests as appropriate
3. The PR should work in all supported environments
4. PRs require review by at least one maintainer

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

### JavaScript Styleguide

- Follow the existing code style in the project
- Use ES6+ features where appropriate
- Use meaningful variable and function names
- Keep functions small and focused on a single task

### Documentation Styleguide

- Use Markdown for documentation
- Reference code with backticks (`)
- Use headings to organize content
- Include examples where helpful

## Additional Notes

### Issue and Pull Request Labels

- `bug`: Something isn't working as expected
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed

## Thank You!

Your contributions to Obsidian JS are greatly appreciated. Together, we can build an amazing editor for everyone!
