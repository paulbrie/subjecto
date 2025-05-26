# Contributing to Subjecto

First off, thank you for considering contributing to Subjecto! We appreciate any help, from reporting bugs and suggesting features to improving documentation and writing code.

## How to Contribute

We encourage a standard GitHub flow for contributions:

1.  **Fork the Repository:** Start by forking the [main Subjecto repository](https://github.com/paulbrie/subjecto) to your own GitHub account.
2.  **Clone Your Fork:** Clone your forked repository to your local machine.
    ```bash
    git clone https://github.com/YOUR_USERNAME/subjecto.git
    cd subjecto
    ```
3.  **Set Up Development Environment:**
    *   Install dependencies:
        ```bash
        npm install
        ```
4.  **Create a Branch:** Create a new branch for your changes. Choose a descriptive branch name (e.g., `fix/readme-typo`, `feat/new-operator`).
    ```bash
    git checkout -b your-branch-name
    ```
5.  **Make Your Changes:** Implement your fix or feature.
    *   Ensure your code adheres to the existing style (ESLint and Prettier are used).
    *   If you're adding a new feature or fixing a bug, please add or update tests in the `src/__tests__` directory.
6.  **Run Tests:** Make sure all tests pass before submitting your changes.
    ```bash
    npm test
    ```
7.  **Lint Your Code:** Check for linting issues.
    ```bash
    npm run lint
    ```
8.  **Commit Your Changes:** Write clear and concise commit messages.
    ```bash
    git commit -m "feat: Add X feature" -m "Detailed description of changes."
    ```
9.  **Push to Your Fork:** Push your changes to your forked repository.
    ```bash
    git push origin your-branch-name
    ```
10. **Submit a Pull Request (PR):** Open a pull request from your branch to the `main` branch of the `paulbrie/subjecto` repository.
    *   Provide a clear title and description for your PR.
    *   Reference any related issues.

## Reporting Bugs

If you find a bug, please open an issue on the [GitHub issue tracker](https://github.com/paulbrie/subjecto/issues). Include as much detail as possible:
*   A clear description of the bug.
*   Steps to reproduce the bug.
*   Expected behavior.
*   Actual behavior.
*   Your environment (Node.js version, OS, etc.).

## Suggesting Enhancements

If you have an idea for an enhancement, please open an issue on the GitHub issue tracker. Describe your idea and why you think it would be beneficial to the project.

Thank you for contributing!
