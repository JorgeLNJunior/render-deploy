<div align="center" id="short-description-and-logo">

  <!-- Logo -->
  <img src="https://i.ibb.co/BS1ZjJb/render-community-large-icon-removebg-preview.png" alt="render-community-large-icon-removebg-preview" border="0" width="200px">

  <!-- Título -->
  <h1>Render Deploy</h1>

  Deploy your [Render](https://render.com) application through GitHub Actions.

</div>

<!-- Badges -->
<div align="center" id="badges">

[![CI](https://img.shields.io/github/actions/workflow/status/JorgeLNJunior/render-deploy/ci.yml?branch=main)](https://github.com/JorgeLNJunior/render-deploy/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/JorgeLNJunior/render-deploy/badge.svg?branch=main)](https://coveralls.io/github/JorgeLNJunior/render-deploy?branch=main)
[![License](https://img.shields.io/github/license/JorgeLNJunior/render-deploy?color=lgreen)](LICENSE)

</div>

## Usage

- First, you need to disable the auto-deploy option in your render app settings. Go to `Settings > Build and Deploy > Auto-Deploy` and disable it.
- In your repository, go to `Settings > Secrets and Variables > Actions`.
- Create a variable named `RENDER_SERVICE_ID` and insert your service ID into it. You can get it on your render service page by copying it from the URL.
- Create a variable named `RENDER_API_KEY` and insert your API key into it. You can get a key in your Render `Account Settings > API Keys`.
- Choose a template and add it to your pipeline.

### Minimal
```yml
deploy:
  runs-on: ubuntu-latest
  steps:
      - uses: actions/checkout@v3
      - uses: JorgeLNJunior/render-deploy@v1.4.4
        with:
          service_id: ${{ secrets.RENDER_SERVICE_ID }}
          api_key: ${{ secrets.RENDER_API_KEY }}
```

### Wait for deploy status
```yml
deploy:
  runs-on: ubuntu-latest
  steps:
      - uses: actions/checkout@v3
      - uses: JorgeLNJunior/render-deploy@v1.4.4
        with:
          service_id: ${{ secrets.RENDER_SERVICE_ID }}
          api_key: ${{ secrets.RENDER_API_KEY }}
          wait_deploy: true 
```

### Create a github deployment
```yml
deploy:
  runs-on: ubuntu-latest
  permissions:
    deployments: write
  steps:
      - uses: actions/checkout@v3
      - uses: JorgeLNJunior/render-deploy@v1.4.4
        with:
          service_id: ${{ secrets.RENDER_SERVICE_ID }}
          api_key: ${{ secrets.RENDER_API_KEY }}
          github_deployment: true 
          deployment_environment: 'production'
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Full
```yml
deploy:
  runs-on: ubuntu-latest
  permissions:
    deployments: write
  steps:
      - uses: actions/checkout@v3
      - uses: JorgeLNJunior/render-deploy@v1.4.4
        with:
          service_id: ${{ secrets.RENDER_SERVICE_ID }}
          api_key: ${{ secrets.RENDER_API_KEY }}
          clear_cache: true
          wait_deploy: true
          github_deployment: true
          deployment_environment: 'production'
          github_token: ${{ secrets.GITHUB_TOKEN }}
```
## Licence

Project under [MIT »](/LICENSE) license.
