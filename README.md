# Statsig Pulumi Demo

A demo project showcasing Pulumi deployments with Statsig feature flags integration, specifically for Release Pipelines.

## Project Structure

- **app/**: A simple Node.js/TypeScript application that displays colors and region information. This is the application that gets deployed to Google Cloud Run.

- **pulumi/**: Infrastructure as Code (IaC) using Pulumi to deploy the application to Google Cloud Run. Contains configuration for multi-region deployments managed through different Pulumi stacks.

