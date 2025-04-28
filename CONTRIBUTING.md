# Contributing to urql-absinthe-upload-exchange

Thank you for considering contributing to urql-absinthe-upload-exchange! This document outlines the process and guidelines for contributing.

## Development Process

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/urql-absinthe-upload-exchange.git`
3. Create a branch for your feature: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests (if applicable)
6. Commit your changes using [conventional commits](https://www.conventionalcommits.org/) format
7. Push to your branch: `git push origin feature/your-feature-name`
8. Submit a pull request

## Commit Message Guidelines

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) which requires commit messages to be formatted using the [Conventional Commits](https://www.conventionalcommits.org/) spec.

Examples:

- `feat: add support for additional file types` (triggers a minor version bump)
- `fix: handle null responses correctly` (triggers a patch version bump)
- `docs: improve installation instructions` (no version bump)
- `chore: update dependencies` (no version bump)
- `BREAKING CHANGE: remove deprecated API` (triggers a major version bump)

## Pull Request Process

1. Ensure your code adheres to the existing style and structure
2. Update the README.md with details of changes if applicable
3. The PR should work for Node.js 18 and above
4. Once your PR is approved, it will be merged by a maintainer

## Setting Up Development Environment

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests (if applicable)
pnpm test
```

## Code of Conduct

Please note that this project adheres to a Code of Conduct. By participating in this project, you agree to abide by its terms.

## Questions?

If you have any questions, feel free to open an issue or reach out to the maintainers directly.

Thank you for your contributions!