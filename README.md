<div align="center" id="short-description-and-logo">
  
  <img src=".github/render.png" alt="render-icon" border="0" width="200px">

  <h1>Render Deploy</h1>

  <p>A GitHub Action to deploy your application to <a href="https://render.com" target="_blank" rel="noreferrer noopener">Render</a>.</p>

</div>

<div align="center" id="badges">

[![CI](https://img.shields.io/github/actions/workflow/status/JorgeLNJunior/render-deploy/ci.yml?branch=main&style=flat-square)](https://github.com/JorgeLNJunior/render-deploy/actions/workflows/ci.yml)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/JorgeLNJunior/render-deploy?branch=main&style=flat-square
)](https://coveralls.io/github/JorgeLNJunior/render-deploy?branch=main)
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
  - [Full Example](#full-example)
- [Inputs](#inputs)
- [License](#license)

## Introduction

This GitHub Action simplifies the deployment process to Render.  It allows you to trigger deployments automatically on pushes, pull requests, or scheduled workflows.

## Usage

### Prerequisites

1. **Disable Auto-Deploy:** In your Render app settings, go to `Settings > Build and Deploy > Auto-Deploy` and disable it. This action will handle deployments.
2. **Set Secrets:** In your repository's `Settings > Secrets and Variables > Actions`, create the following secrets:
    - `RENDER_SERVICE_ID`: Your Render service ID (found in the service URL).
    - `RENDER_API_KEY`: Your Render API key (generated in your Render `Account Settings > API Keys`).
3. **(Optional) GitHub Token:** If using `github_deployment: true`, you'll need the `GITHUB_TOKEN` secret (automatically provided by GitHub Actions).  Ensure your workflow has the `deployments: write` permission.

### Minimal Example

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

### Full Example

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
        clear_cache: true # Optional: Clear Render's build cache
        wait_deploy: true
        github_deployment: true
        deployment_environment: 'production'
        github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input                | Description                                                                                             | Required | Default |
|----------------------|---------------------------------------------------------------------------------------------------------|----------|---------|
| `service_id`         | The ID of your Render service.                                                                         | Yes      |         |
| `api_key`            | Your Render API key.                                                                                      | Yes      |         |
| `clear_cache`        | Whether to clear Render's build cache before deploying.                                                | No       | `false` |
| `wait_deploy`        | Whether to wait for the deployment to finish before the action completes.                                | No       | `false` |
| `github_deployment` | Whether to create a GitHub deployment status.                                                            | No       | `false` |
| `deployment_environment` | The name of the deployment environment (e.g., 'production', 'staging'). Required if `github_deployment` is true. | No       |  `production`  |
| `github_token`       | The GitHub token. Required if `github_deployment` is true. Use `${{ secrets.GITHUB_TOKEN }}`.            | No       |         |


## License

Project under [MIT License](/LICENSE).
