
# next-config-env-variables-patch

## Overview
`next-config-env-variables-patch` is an npm package designed to address a common challenge faced when building NextJS projects in production mode with the `output="standalone"` configuration. Typically, NextJS inlines environment variables (like `process.env.SOME_ENV`) during the build time, making it impossible to modify these values post-build. This limitation is particularly problematic when deploying the same Docker image across different stages (QA, staging, production, etc.) and can lead to increased build times and image sizes.

## The Problem
In NextJS, `publicRuntimeConfig` and `serverRuntimeConfig` can be defined in `next.config.js` for dynamic runtime configuration. However, this only works with `output="export"`. In `output="standalone"` mode, `next.config.js` is embedded in the `server.js` file, and all environment variables are fixed at build time. This rigid behavior breaks the "Build once, deploy many" rule, especially in Dockerized environments.

## Installation
Install the package using Yarn:
```shell
yarn add next-config-env-variables-patch -D
```

## Usage
1. Modify your `next.config.js` as follows:
    ```javascript
    module.exports = {
      output: "export",
      publicRuntimeConfig: {
        ENV_PUBLIC_API_BASE_URL: process.env.ENV_PUBLIC_API_BASE_URL,
      },
      serverRuntimeConfig: {
        ENV_SOME_ENV_VARIABLE: process.env.ENV_SOME_ENV_VARIABLE,
      },
    }
    ```
   Ensure to prefix the properties with `ENV_`.

2. Update the build script in `package.json`:
    ```json
    "build": "next build && next-config-env-variables-patch"
    ```

3. Build your application with `yarn build` using the `standalone` output.

4. Run your Dockerized NextJS application, setting the environment variables as needed:
    ```shell
    docker run -p 3000:3000 -e ENV_PUBLIC_API_BASE_URL=http://host.docker.internal:8080/api my-nextjs-application:latest
    ```

## How It Works
`next-config-env-variables-patch` modifies the `server.js`. It adds an additional code to the server.js before starting the server
```javascript
// DYNAMIC_CONFIG_ENV_VARIABLES_PATCH_START
if (nextConfig.publicRuntimeConfig) {
  for (const key in nextConfig.publicRuntimeConfig) {
    if (nextConfig.publicRuntimeConfig.hasOwnProperty(key) && key.startsWith('ENV_')) {
      nextConfig.publicRuntimeConfig[key] = process.env[key] || nextConfig.publicRuntimeConfig[key];   
    }
  }
}
if (nextConfig.serverRuntimeConfig) {
  for (const key in nextConfig.serverRuntimeConfig) {
    if (nextConfig.serverRuntimeConfig.hasOwnProperty(key) && key.startsWith('ENV_')) {
      nextConfig.serverRuntimeConfig[key] = process.env[key] || nextConfig.serverRuntimeConfig[key];   
    }
  }
}
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);
// DYNAMIC_CONFIG_ENV_VARIABLES_PATCH_END
```

This code gets `publicRuntimeConfig` and `serverRuntimeConfig` that was generated at the build time and replaces all the properties in configs that start with `ENV_` prefix with the environment variable with the same name. If there is no environment variable with same name, the default generated value is used.

