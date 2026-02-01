<div align="center" id="short-description-and-logo">
  
  <img src=".github/render.png" alt="render-icon" border="0" width="200px">

  <h1>Render Deploy</h1>

  <p>A GitHub Action to deploy your application to <a href="https://render.com" target="_blank" rel="noreferrer noopener">Render</a>.</p>

</div>

<div align="center" id="badges">

[![CI](https://img.shields.io/github/actions/workflow/status/JorgeLNJunior/render-deploy/ci.yml?branch=main&style=flat-square)](https://github.com/JorgeLNJunior/render-deploy/actions/workflows/ci.yml)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/JorgeLNJunior/render-deploy?branch=main&style=flat-square)](https://coveralls.io/github/JorgeLNJunior/render-deploy?branch=main)
[![License](https://img.shields.io/github/license/JorgeLNJunior/render-deploy?style=flat-square)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/JorgeLNJunior/render-deploy?style=flat-square)](https://github.com/JorgeLNJunior/render-deploy/releases/latest)

</div>

## Table of Contents

- [Introduction](#introduction)
- [Usage](#usage)
  - [Prerequisites](#prerequisites)
  - [Minimal Example](#minimal-example)
  - [Waiting for Deployment Status](#waiting-for-deployment-status)
  - [Creating a GitHub Deployment](#creating-a-github-deployment)
  - [Deploying a Specific Reference](#deploying-a-specific-reference)
  - [Full Example](#full-example)
- [Inputs](#inputs)
- [License](#license)

## Introduction

This GitHub Action simplifies the deployment process to Render. It allows you to trigger deployments automatically on pushes, pull requests, or scheduled workflows.

## Usage

### Prerequisites

1. **Disable Auto-Deploy:** In your Render app settings, go to `Settings > Build and Deploy > Auto-Deploy` and disable it. This action will handle deployments.
2. **Set Secrets:** In your repository's `Settings > Secrets and Variables > Actions`, create the following secrets:
   - `RENDER_SERVICE_ID`: Your Render service ID (found in the service page).
   - `RENDER_API_KEY`: Your Render API key (generated in your Render `Account Settings > API Keys`).
3. **(Optional) GitHub Token:** If using `github_deployment: true`, you'll need the `GITHUB_TOKEN` secret (automatically provided by GitHub Actions). Ensure your workflow has the `deployments: write` permission.

### Minimal Example

This is the simplest way to use the action. It triggers a deployment using the secrets you configured.

```yaml
deploy:
  runs-on: ubuntu-latest
  steps:
    - uses: JorgeLNJunior/render-deploy@v1.4.7
      with:
        service_id: ${{ secrets.RENDER_SERVICE_ID }}
        api_key: ${{ secrets.RENDER_API_KEY }}
```

### Waiting for Deployment Status

If you want the GitHub Action to wait until the Render deployment is complete (success or failure) before finishing, set `wait_deploy` to `true`.

```yaml
deploy:
  runs-on: ubuntu-latest
  steps:
    - uses: JorgeLNJunior/render-deploy@v1.4.7
      with:
        service_id: ${{ secrets.RENDER_SERVICE_ID }}
        api_key: ${{ secrets.RENDER_API_KEY }}
        wait_deploy: true
```

### Creating a GitHub Deployment

This option creates a [GitHub Deployment](https://docs.github.com/en/rest/deployments/deployments) in your repository, which shows up in the "Environments" section of your repo. It tracks the deployment status and links to the deployed environment.

```yaml
deploy:
  runs-on: ubuntu-latest
  permissions:
    deployments: write
  steps:
    - uses: JorgeLNJunior/render-deploy@v1.4.7
      with:
        service_id: ${{ secrets.RENDER_SERVICE_ID }}
        api_key: ${{ secrets.RENDER_API_KEY }}
        github_deployment: true
        deployment_environment: 'production' # e.g., production, staging
        github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Deploying a Specific Reference

You can deploy a specific branch, tag, or commit SHA using the `ref` input.

```yaml
deploy:
  runs-on: ubuntu-latest

  steps:
    - uses: JorgeLNJunior/render-deploy@v1.4.7
      with:
        service_id: ${{ secrets.RENDER_SERVICE_ID }}
        api_key: ${{ secrets.RENDER_API_KEY }}
        ref: 'feat/my-feature-branch' # or a tag like 'v1.0.0', or a full commit SHA
```

**Note:** If you are deploying a ref in a **private repository**, you must also provide the `github_token` and the proper permissions so the action can resolve the reference to a specific commit SHA using the GitHub API.

```yaml
deploy:
  runs-on: ubuntu-latest
  permissions:
    contents: read # Required for private repos
  steps:
    - uses: JorgeLNJunior/render-deploy@v1.4.7
      with:
        service_id: ${{ secrets.RENDER_SERVICE_ID }}
        api_key: ${{ secrets.RENDER_API_KEY }}
        ref: 'feat/my-feature-branch'
        github_token: ${{ secrets.GITHUB_TOKEN }} # Required for private repos
```

### Full Example

You can also combine all the options: clear build cache, wait for deployment, deploy a specific ref and create a GitHub deployment status.

```yaml
deploy:
  runs-on: ubuntu-latest
  permissions:
    deployments: write
    contents: read
  steps:
    - uses: JorgeLNJunior/render-deploy@v1.4.7
      with:
        service_id: ${{ secrets.RENDER_SERVICE_ID }}
        api_key: ${{ secrets.RENDER_API_KEY }}
        github_token: ${{ secrets.GITHUB_TOKEN }}
        ref: 'feat/new-feature' # Optional: Deploy specific ref
        clear_cache: true # Optional: Clear Render's build cache
        wait_deploy: true
        github_deployment: true
        deployment_environment: 'production'
```

## Inputs

| Input                    | Description                                                                                                                                                                                                                                     | Required | Default      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------ |
| `service_id`             | The ID of your Render service.                                                                                                                                                                                                                  | Yes      |              |
| `api_key`                | Your Render API key.                                                                                                                                                                                                                            | Yes      |              |
| `clear_cache`            | Whether to clear Render's build cache before deploying.                                                                                                                                                                                         | No       | `false`      |
| `wait_deploy`            | Whether to wait for the deployment to finish before the action completes.                                                                                                                                                                       | No       | `false`      |
| `github_deployment`      | Whether to create a GitHub deployment status.                                                                                                                                                                                                   | No       | `false`      |
| `deployment_environment` | The name of the deployment environment (e.g., 'production', 'staging'). Required if `github_deployment` is true.                                                                                                                                | No       | `production` |
| `github_token`           | The GitHub token. Required if `github_deployment` is true or if you're deploying a specific ref in a private repo. Use `${{ secrets.GITHUB_TOKEN }}`.                                                                                           | No       |              |
| `ref`                    | Specify what git ref to deploy. If a branch, deploys the latest commit in this branch. If a tag, deploys the commit related to that tag. **Note:** Requires `github_token` to be specified in private repositories to resolve the ref to a SHA. | No       |              |

## License

Project under [MIT License](/LICENSE).
