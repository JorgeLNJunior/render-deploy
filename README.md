<div align="center" id="short-description-and-logo">

  <!-- Logo -->
  <!-- <img src="https://ps.w.org/wp-githuber-md/assets/icon-256x256.png?rev=2194656" width="200px">  -->

  <!-- Título -->
  <h1>Render Deploy</h1>

  Deploy your [Render](https://render.com) app through GitHub Actions.

</div>

<!-- Badges -->
<div align="center" id="badges">

[![CI](https://img.shields.io/github/actions/workflow/status/JorgeLNJunior/render-deploy/ci.yml?branch=main)](https://github.com/JorgeLNJunior/render-deploy/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/JorgeLNJunior/render-deploy/badge.svg?branch=main)](https://coveralls.io/github/JorgeLNJunior/render-deploy?branch=main)
[![License](https://img.shields.io/github/license/JorgeLNJunior/render-deploy?color=lgreen)](LICENSE)

</div>

## Usage

- First you need to disable the auto deploy option in your render app settings. Go to `Settings > Build and Deploy > Auto-Deploy` and disable it. 
- At your repository go to `Settings > Secrets and variables > Actions`.
- Create a variable named `RENDER_SERVICE_ID` and insert your service id. You can get it in your render service page copying it from the url.
- Create a variable named `RENDER_API_KEY` and insert your api key. You can get a key in your Render `Account Settings > API Keys`.
- Add this action to your pipeline.

```yml
  jobs: 
    deploy:
      runs-on: ubuntu-latest
      permissions: # Required if github_deployment is set to true.
        deployments: write
      steps:
          - uses: actions/checkout@v3
          - uses: JorgeLNJunior/render-deploy@v1.4.0
            with:
              service_id: ${{ secrets.RENDER_SERVICE_ID }} # required
              api_key: ${{ secrets.RENDER_API_KEY }} # required
              clear_cache: false # Clear build cache. Optional
              wait_deploy: false # Wait until the deploy status is successful. Warning! Free Render services can take +5 minutes to be fully deployed. Optional
              github_deployment: false # Create a GitHub deployment. Optional
              deployment_environment: 'production' # GitHub deployment enviroment name. Optional
              github_token: ${{ secrets.GITHUB_TOKEN }} # Remove if github_deployment is false. Optional
```

## Licence

Project under [MIT »](/LICENSE) license.
